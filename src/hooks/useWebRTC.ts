import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { callApi, CALL_API_BASE } from '../services/callApi';

interface UseWebRTCParams {
  callId: string;
  userId: string;
  userName?: string;
  isGroup?: boolean;
}

export function useWebRTC({ callId, userId, userName, isGroup }: UseWebRTCParams) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  
  const pcRef = useRef<{ [targetId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return;
    const newSocket = io(CALL_API_BASE || undefined, {
      transports: ['websocket'],
      path: '/socket.io'
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', {
        roomId: callId,
        userId: userId,
        displayName: userName || "User",
        media: { audio: true, video: true, screen: false }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
  }, [callId, userId, userName]);

  const getOrCreatePeerConnection = useCallback((targetId: string, currentSocket: Socket) => {
    if (pcRef.current[targetId]) {
      return pcRef.current[targetId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    // Add local stream tracks to PC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        currentSocket.emit('webrtc:ice-candidate', {
          callId,
          targetId,
          sourceId: userId,
          candidate: event.candidate,
        });
        
        currentSocket.emit('webrtc-ice-candidate', {
          roomId: callId,
          targetUserId: targetId,
          fromUserId: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({ ...prev, [targetId]: stream }));
    };

    pcRef.current[targetId] = pc;
    return pc;
  }, [callId, userId]);

  // Handle incoming signaling
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data: any) => {
      if ((data.targetId && data.targetId !== userId) || (data.targetUserId && data.targetUserId !== userId)) {
        return;
      }
      const remoteSourceId = data.sourceId || data.fromUserId; 
      if (!remoteSourceId) return;
      const pc = getOrCreatePeerConnection(remoteSourceId, socket);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('webrtc:answer', {
          callId,
          targetId: remoteSourceId,
          sourceId: userId,
          answer,
        });
        socket.emit('webrtc-answer', {
          roomId: callId,
          targetUserId: remoteSourceId,
          fromUserId: userId,
          answer,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async (data: any) => {
      if ((data.targetId && data.targetId !== userId) || (data.targetUserId && data.targetUserId !== userId)) {
        return;
      }
      const remoteSourceId = data.sourceId || data.fromUserId;
      if (!remoteSourceId) return;
      const pc = pcRef.current[remoteSourceId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    const handleIceCandidate = async (data: any) => {
      if ((data.targetId && data.targetId !== userId) || (data.targetUserId && data.targetUserId !== userId)) {
        return;
      }
      const remoteSourceId = data.sourceId || data.fromUserId;
      const candidate = data.candidate;
      if (!remoteSourceId || !candidate) return;
      const pc = pcRef.current[remoteSourceId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ice candidate:', err);
        }
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc-offer', handleOffer); // Server format
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc-answer', handleAnswer); // Server format
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('webrtc-ice-candidate', handleIceCandidate); // Server format

    const handleJoined = async (data: any) => {
      // Create offer for new participant
      const targetUserId = data.participant?.userId || data.userId;
      if (targetUserId && targetUserId !== userId) {
        const pc = getOrCreatePeerConnection(targetUserId, socket);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', {
            callId, targetId: targetUserId, sourceId: userId, offer
          });
          socket.emit('webrtc-offer', {
            roomId: callId, targetUserId: targetUserId, offer, fromUserId: userId
          });
        } catch (e) {}
      }
    };
    
    const handleLeft = (data: any) => {
      const targetId = data.userId || data.participant?.userId;
      if (targetId && pcRef.current[targetId]) {
        pcRef.current[targetId].close();
        delete pcRef.current[targetId];
      }
      setRemoteStreams(prev => {
        if (!targetId) return prev;
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    };
    
    socket.on('participant-joined', handleJoined);
    socket.on('participant-left', handleLeft);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('participant-joined', handleJoined);
      socket.off('participant-left', handleLeft);
    };
  }, [socket, getOrCreatePeerConnection, callId, userId]);

  const startLocalStream = useCallback(async (video: any = true, audio: any = true) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Update existing peer connections with new tracks
      Object.values(pcRef.current).forEach((pc: unknown) => {
        const typedPc = pc as RTCPeerConnection;
        const senders = typedPc.getSenders();
        stream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            typedPc.addTrack(track, stream);
          }
        });
      });
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      throw err;
    }
  }, []);

  const replaceVideoTrack = useCallback(async (newVideoTrack: MediaStreamTrack | null) => {
    if (!localStreamRef.current) return;
    
    // Stop old video tracks
    localStreamRef.current.getVideoTracks().forEach(t => {
      localStreamRef.current?.removeTrack(t);
      t.stop();
    });

    if (newVideoTrack) {
      localStreamRef.current.addTrack(newVideoTrack);
    }

    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

    // Replace in PeerConnections
    Object.values(pcRef.current).forEach((pc: unknown) => {
      const typedPc = pc as RTCPeerConnection;
      const videoSender = typedPc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack);
      } else if (newVideoTrack) {
        typedPc.addTrack(newVideoTrack, localStreamRef.current!);
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    Object.values(pcRef.current).forEach((pc: RTCPeerConnection) => pc.close());
    pcRef.current = {};
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  return {
    socket,
    isConnected,
    localStream,
    remoteStreams,
    startLocalStream,
    replaceVideoTrack,
    connectSocket,
    cleanup,
    pcMap: pcRef.current
  };
}

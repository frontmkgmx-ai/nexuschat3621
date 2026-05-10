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
  const [activeScreenShares, setActiveScreenShares] = useState<Set<string>>(new Set());
  
  const pcRef = useRef<{ [targetId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const connectSocket = useCallback(() => {
    if (socketRef.current) return;
    const wsUrl = import.meta.env.VITE_CALL_WS_URL || CALL_API_BASE || undefined;
    const socketPath = import.meta.env.VITE_CALL_SOCKET_PATH || '/socket.io';
    
    if (import.meta.env.DEV) {
      if (!import.meta.env.VITE_CALL_WS_URL) {
        console.error("VITE_CALL_WS_URL is missing in environment variables!");
      }
    }

    const newSocket = io(wsUrl, {
      path: socketPath,
      transports: ['websocket', 'polling'],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
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
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
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

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        currentSocket.emit('webrtc:offer', {
          callId, targetId, sourceId: userId, offer
        });
        currentSocket.emit('webrtc-offer', {
          roomId: callId, targetUserId: targetId, fromUserId: userId, offer
        });
      } catch (err) {
        console.error('Error during renegotiation:', err);
      }
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
        const offerCollision = pc.signalingState !== "stable" || pc.localDescription?.type === "offer";
        const polite = userId < remoteSourceId;

        if (offerCollision) {
           if (!polite) {
              return;
           }
           await Promise.all([
             pc.setLocalDescription({ type: "rollback" }),
             pc.setRemoteDescription(new RTCSessionDescription(data.offer))
           ]);
        } else {
           await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        }

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
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
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

    const handleScreenShareStart = (data: any) => {
       const id = data.userId || data.fromUserId;
       if (id) {
         setActiveScreenShares(prev => new Set(prev).add(id));
       }
    };
    
    const handleScreenShareStop = (data: any) => {
       const id = data.userId || data.fromUserId;
       if (id) {
         setActiveScreenShares(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
         });
       }
    };

    socket.on('screen-share-start', handleScreenShareStart);
    socket.on('screen-share-stop', handleScreenShareStop);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('participant-joined', handleJoined);
      socket.off('participant-left', handleLeft);
      socket.off('screen-share-start', handleScreenShareStart);
      socket.off('screen-share-stop', handleScreenShareStop);
    };
  }, [socket, getOrCreatePeerConnection, callId, userId]);

  const startLocalStream = useCallback(async (video: any = true, audioConstraints: any = true, quality: string = 'normal') => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: audioConstraints });
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Update existing peer connections with new tracks and adjust bitrates
      Object.values(pcRef.current).forEach((pc: unknown) => {
        const typedPc = pc as RTCPeerConnection;
        const senders = typedPc.getSenders();
        stream.getTracks().forEach(async (track) => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            await sender.replaceTrack(track);
            
            // Adjust maxBitrate for Audio based on quality
            if (track.kind === 'audio') {
               const params = sender.getParameters();
               if (!params.encodings) params.encodings = [{}];
               
               let maxBitrate;
               if (quality === 'low') maxBitrate = 16000;
               else if (quality === 'normal') maxBitrate = 32000;
               else if (quality === 'ultra') maxBitrate = 64000;
               else if (quality === 'lossless') maxBitrate = 128000;
               
               if (maxBitrate) {
                 params.encodings[0].maxBitrate = maxBitrate;
                 try {
                   await sender.setParameters(params);
                 } catch (e) {}
               }
            }
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

  const replaceVideoTrack = useCallback(async (newVideoTrack: MediaStreamTrack | null, maxBitrate?: number, contentHint?: string) => {
    if (!localStreamRef.current) return;
    
    // Stop old video tracks
    localStreamRef.current.getVideoTracks().forEach(t => {
      localStreamRef.current?.removeTrack(t);
      t.stop();
    });

    if (newVideoTrack) {
      if (contentHint && 'contentHint' in newVideoTrack) {
        // @ts-ignore
        newVideoTrack.contentHint = contentHint;
      }
      localStreamRef.current.addTrack(newVideoTrack);
    }

    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

    // Replace in PeerConnections
    Object.values(pcRef.current).forEach((pc: unknown) => {
      const typedPc = pc as RTCPeerConnection;
      const videoSender = typedPc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack).then(() => {
          if (maxBitrate && newVideoTrack) {
             const params = videoSender.getParameters();
             if (!params.encodings) params.encodings = [{}];
             params.encodings[0].maxBitrate = maxBitrate;
             videoSender.setParameters(params).catch(e => console.error("Could not set maxBitrate", e));
          }
        });
      } else if (newVideoTrack) {
        const sender = typedPc.addTrack(newVideoTrack, localStreamRef.current!);
        if (maxBitrate) {
           const params = sender.getParameters();
           if (!params.encodings) params.encodings = [{}];
           params.encodings[0].maxBitrate = maxBitrate;
           sender.setParameters(params).catch(e => console.error("Could not set maxBitrate", e));
        }
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
    activeScreenShares,
    startLocalStream,
    replaceVideoTrack,
    connectSocket,
    cleanup,
    pcMap: pcRef.current
  };
}

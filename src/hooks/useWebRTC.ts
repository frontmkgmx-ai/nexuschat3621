import { useEffect, useRef, useState, useCallback } from 'react';
import { rtdb } from '../lib/firebase';
import { ref as dbRef, onValue, set, push, onChildAdded, remove, onDisconnect, off } from 'firebase/database';

interface UseWebRTCParams {
  callId: string;
  userId: string;
  userName?: string;
  isGroup?: boolean;
}

export function useWebRTC({ callId, userId, userName, isGroup }: UseWebRTCParams) {
  const [isConnected, setIsConnected] = useState(false);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [activeScreenShares, setActiveScreenShares] = useState<Set<string>>(new Set());
  
  const pcRef = useRef<{ [targetId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUp = useRef(false);

  const getOrCreatePeerConnection = useCallback((targetId: string) => {
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

    const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });

    // Add local stream tracks to PC if they exist, to the transceivers we just created
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.kind === 'audio') audioTransceiver.sender.replaceTrack(track);
        if (track.kind === 'video') videoTransceiver.sender.replaceTrack(track);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && !isCleaningUp.current) {
        const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
        push(signalRef, {
          sender: userId,
          type: 'ice-candidate',
          payload: JSON.stringify(event.candidate)
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({ ...prev, [targetId]: stream }));
    };

    pc.onnegotiationneeded = async () => {
      if (isCleaningUp.current) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
        push(signalRef, {
          sender: userId,
          type: 'offer',
          payload: JSON.stringify(offer)
        });
      } catch (err) {
        console.error('Error during renegotiation:', err);
      }
    };

    pcRef.current[targetId] = pc;
    return pc;
  }, [callId, userId]);

  const connectSocket = useCallback(() => {
    isCleaningUp.current = false;
    const participantRef = dbRef(rtdb, `webrtc/${callId}/participants/${userId}`);
    set(participantRef, Date.now());
    onDisconnect(participantRef).remove();
    setIsConnected(true);

    const participantsRef = dbRef(rtdb, `webrtc/${callId}/participants`);
    onChildAdded(participantsRef, (snapshot) => {
      const targetId = snapshot.key;
      if (targetId && targetId !== userId) {
        // A new participant joined, we will initiate connection if we are "older" or just let negotiation needed handle it.
        // The offer creation is handled by onnegotiationneeded when we add tracks, 
        // but we need to create a PC to add tracks if not exists
        getOrCreatePeerConnection(targetId);
      }
    });

    onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val() || {};
      // Handle disconnected participants
      Object.keys(pcRef.current).forEach(targetId => {
        if (!participants[targetId]) {
           pcRef.current[targetId].close();
           delete pcRef.current[targetId];
           setRemoteStreams(prev => {
             const next = { ...prev };
             delete next[targetId];
             return next;
           });
        }
      });
    });

    const mySignalsRef = dbRef(rtdb, `webrtc/${callId}/signals/${userId}`);
    onChildAdded(mySignalsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      const { sender, type, payload } = data;
      const pc = getOrCreatePeerConnection(sender);

      try {
        if (type === 'offer') {
          const offer = JSON.parse(payload);
          const offerCollision = pc.signalingState !== "stable" || pc.localDescription?.type === "offer";
          const polite = userId < sender;

          if (offerCollision) {
             if (!polite) {
                return;
             }
             await Promise.all([
               pc.setLocalDescription({ type: "rollback" }),
               pc.setRemoteDescription(new RTCSessionDescription(offer))
             ]);
          } else {
             await pc.setRemoteDescription(new RTCSessionDescription(offer));
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${sender}`);
          push(signalRef, {
            sender: userId,
            type: 'answer',
            payload: JSON.stringify(answer)
          });
        } else if (type === 'answer') {
          const answer = JSON.parse(payload);
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } else if (type === 'ice-candidate') {
          const candidate = JSON.parse(payload);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
      
      // Remove signal after processing
      remove(snapshot.ref);
    });

    const screenSharesRef = dbRef(rtdb, `webrtc/${callId}/screenShares`);
    onValue(screenSharesRef, (snapshot) => {
       const shares = snapshot.val() || {};
       setActiveScreenShares(new Set(Object.keys(shares)));
    });

  }, [callId, userId, getOrCreatePeerConnection]);

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
        stream.getTracks().forEach(async (track) => {
          const transceiver = typedPc.getTransceivers().find(t => t.receiver.track.kind === track.kind || (t.sender.track && t.sender.track.kind === track.kind));
          if (transceiver) {
            await transceiver.sender.replaceTrack(track);
            
            // Adjust maxBitrate for Audio based on quality
            if (track.kind === 'audio') {
               const params = transceiver.sender.getParameters();
               if (!params.encodings) params.encodings = [{}];
               
               let maxBitrate;
               if (quality === 'low') maxBitrate = 16000;
               else if (quality === 'normal') maxBitrate = 32000;
               else if (quality === 'ultra') maxBitrate = 64000;
               else if (quality === 'lossless') maxBitrate = 128000;
               
               if (maxBitrate) {
                 params.encodings[0].maxBitrate = maxBitrate;
                 try {
                   await transceiver.sender.setParameters(params);
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
    
    if (newVideoTrack && contentHint === 'detail') {
       // Is screen sharing
       set(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`), true);
    } else {
       remove(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`));
    }

    // Replace in PeerConnections
    Object.values(pcRef.current).forEach((pc: unknown) => {
      const typedPc = pc as RTCPeerConnection;
      const videoTransceiver = typedPc.getTransceivers().find(t => t.receiver.track.kind === 'video' || (t.sender.track && t.sender.track.kind === 'video'));
      
      if (videoTransceiver) {
        videoTransceiver.sender.replaceTrack(newVideoTrack).then(() => {
          if (maxBitrate && newVideoTrack) {
             const params = videoTransceiver.sender.getParameters();
             if (!params.encodings) params.encodings = [{}];
             params.encodings[0].maxBitrate = maxBitrate;
             videoTransceiver.sender.setParameters(params).catch(e => console.error("Could not set maxBitrate", e));
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
  }, [callId, userId]);

  const cleanup = useCallback(() => {
    isCleaningUp.current = true;
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      Object.values(pcRef.current).forEach((pc: RTCPeerConnection) => pc.close());
      pcRef.current = {};
      setIsConnected(false);
      
      off(dbRef(rtdb, `webrtc/${callId}/participants`));
      off(dbRef(rtdb, `webrtc/${callId}/signals/${userId}`));
      off(dbRef(rtdb, `webrtc/${callId}/screenShares`));
      
      remove(dbRef(rtdb, `webrtc/${callId}/participants/${userId}`)).catch(() => {});
      remove(dbRef(rtdb, `webrtc/${callId}/signals/${userId}`)).catch(() => {});
      remove(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`)).catch(() => {});
    } catch (err) {
      console.error("Error during WebRTC cleanup", err);
    }
  }, [callId, userId]);

  return {
    socket: null, // Removed socket
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


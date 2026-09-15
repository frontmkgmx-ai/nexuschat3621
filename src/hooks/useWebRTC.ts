import { useEffect, useRef, useState, useCallback } from 'react';
import { rtdb } from '../lib/firebase';
import { ref as dbRef, onValue, set, push, onChildAdded, remove, onDisconnect, off } from 'firebase/database';
import { toast } from 'sonner';

export type WebRTCCallState =
  | 'idle'
  | 'requesting-permission'
  | 'capturing'
  | 'signaling'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed'
  | 'ended';

interface UseWebRTCParams {
  callId: string;
  userId: string;
  userName?: string;
  isGroup?: boolean;
}

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

export function useWebRTC({ callId, userId, userName, isGroup }: UseWebRTCParams) {
  const [isConnected, setIsConnected] = useState(false);
  const [callState, setCallState] = useState<WebRTCCallState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [activeScreenShares, setActiveScreenShares] = useState<Set<string>>(new Set());

  // References for peer connections, ICE queue, and cleanup
  const pcRef = useRef<{ [targetId: string]: RTCPeerConnection }>({});
  const pendingCandidatesRef = useRef<{ [targetId: string]: RTCIceCandidateInit[] }>({});
  const seenCandidatesRef = useRef<{ [targetId: string]: Set<string> }>({});
  const reconnectAttemptsRef = useRef<{ [targetId: string]: number }>({});
  const makingOfferRef = useRef<{ [targetId: string]: boolean }>({});
  const iceServersRef = useRef<RTCIceServer[]>(DEFAULT_STUN_SERVERS);

  const localStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUp = useRef(false);
  const listenersAttachedRef = useRef(false);

  // Fetch dynamic ICE / TURN servers from backend without exposing credentials in client bundle
  useEffect(() => {
    let isMounted = true;
    async function loadIceConfig() {
      try {
        const res = await fetch('/api/webrtc/config');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.iceServers && Array.isArray(data.iceServers)) {
            iceServersRef.current = data.iceServers;
          }
        }
      } catch (err) {
        console.warn('[useWebRTC] Using fallback STUN servers:', err);
      }
    }
    loadIceConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute unique hash for ICE candidate to prevent duplicates
  const getCandidateKey = (cand: RTCIceCandidateInit | RTCIceCandidate): string => {
    return `${cand.candidate || ''}|${cand.sdpMid || ''}|${cand.sdpMLineIndex ?? ''}`;
  };

  // Process queued ICE candidates after setRemoteDescription
  const processPendingCandidates = useCallback(async (targetId: string, pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;

    const queue = pendingCandidatesRef.current[targetId] || [];
    pendingCandidatesRef.current[targetId] = [];

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err: any) {
        // If operation failed temporarily, retain for one more retry
        console.warn(`[useWebRTC] Non-fatal ICE candidate processing note for ${targetId}:`, err?.message || err);
      }
    }
  }, []);

  // Update overall connection state based on all active peer connections
  const evaluateOverallConnectionState = useCallback(() => {
    const pcs = Object.values(pcRef.current);
    if (pcs.length === 0) {
      // If we haven't connected to any peer yet, keep current state unless in connected
      if (callState === 'connected') {
        setIsConnected(false);
        setCallState('signaling');
      }
      return;
    }

    const anyConnected = pcs.some(
      pc =>
        (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')
    );

    const anyConnecting = pcs.some(
      pc =>
        pc.connectionState === 'connecting' || pc.iceConnectionState === 'checking'
    );

    const allFailed = pcs.every(
      pc =>
        pc.connectionState === 'failed' || pc.iceConnectionState === 'failed' || pc.connectionState === 'closed'
    );

    const anyReconnecting = pcs.some(
      pc => pc.iceConnectionState === 'disconnected' || pc.connectionState === 'disconnected'
    );

    if (anyConnected) {
      setIsConnected(true);
      setCallState('connected');
      setErrorMessage(null);
    } else if (anyConnecting) {
      setIsConnected(false);
      setCallState('connecting');
    } else if (anyReconnecting) {
      setIsConnected(false);
      setCallState('reconnecting');
    } else if (allFailed) {
      setIsConnected(false);
      setCallState('failed');
      setErrorMessage('A conexão com os participantes foi perdida.');
    }
  }, [callState]);

  // Create or retrieve PeerConnection for a specific target user
  const getOrCreatePeerConnection = useCallback((targetId: string) => {
    if (pcRef.current[targetId]) {
      return pcRef.current[targetId];
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    pendingCandidatesRef.current[targetId] = [];
    seenCandidatesRef.current[targetId] = new Set();
    reconnectAttemptsRef.current[targetId] = 0;
    makingOfferRef.current[targetId] = false;

    // Add audio and video transceivers with sendrecv direction
    const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });

    // Attach existing local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (track.kind === 'audio') audioTransceiver.sender.replaceTrack(track).catch(() => {});
        if (track.kind === 'video') videoTransceiver.sender.replaceTrack(track).catch(() => {});
      });
    }

    // ICE Candidate generation -> RTDB signal queue
    pc.onicecandidate = (event) => {
      if (event.candidate && !isCleaningUp.current) {
        const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
        push(signalRef, {
          sender: userId,
          type: 'ice-candidate',
          payload: JSON.stringify(event.candidate),
          timestamp: Date.now()
        });
      }
    };

    // Connection state listeners
    pc.onconnectionstatechange = () => {
      console.log(`[useWebRTC] Peer ${targetId} connectionState:`, pc.connectionState);
      evaluateOverallConnectionState();

      if (pc.connectionState === 'failed' && reconnectAttemptsRef.current[targetId] < 3) {
        reconnectAttemptsRef.current[targetId]++;
        console.log(`[useWebRTC] Attempting ICE restart for ${targetId} (Attempt ${reconnectAttemptsRef.current[targetId]}/3)...`);
        try {
          if (typeof (pc as any).restartIce === 'function') {
            (pc as any).restartIce();
          } else {
            pc.createOffer({ iceRestart: true }).then((offer) => {
              pc.setLocalDescription(offer);
              const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
              push(signalRef, {
                sender: userId,
                type: 'offer',
                payload: JSON.stringify(offer),
                timestamp: Date.now()
              });
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('[useWebRTC] Error during ICE restart:', e);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[useWebRTC] Peer ${targetId} iceConnectionState:`, pc.iceConnectionState);
      evaluateOverallConnectionState();
    };

    pc.onsignalingstatechange = () => {
      console.log(`[useWebRTC] Peer ${targetId} signalingState:`, pc.signalingState);
    };

    // Remote Track receiving
    pc.ontrack = (event) => {
      console.log(`[useWebRTC] Received remote track (${event.track.kind}) from ${targetId}`);
      setRemoteStreams((prev) => {
        const existingStream = prev[targetId];
        if (existingStream) {
          // Add or replace track in existing MediaStream
          const tracks = existingStream.getTracks().filter(t => t.kind !== event.track.kind);
          tracks.push(event.track);
          return { ...prev, [targetId]: new MediaStream(tracks) };
        } else {
          const stream = event.streams[0] ? new MediaStream(event.streams[0].getTracks()) : new MediaStream([event.track]);
          return { ...prev, [targetId]: stream };
        }
      });

      // Track removal / ending detection
      event.track.onended = () => {
        setRemoteStreams((prev) => {
          const current = prev[targetId];
          if (!current) return prev;
          const remaining = current.getTracks().filter(t => t.id !== event.track.id);
          if (remaining.length === 0) {
            const next = { ...prev };
            delete next[targetId];
            return next;
          }
          return { ...prev, [targetId]: new MediaStream(remaining) };
        });
      };

      evaluateOverallConnectionState();
    };

    // Perfect negotiation: onnegotiationneeded
    pc.onnegotiationneeded = async () => {
      if (isCleaningUp.current) return;
      try {
        makingOfferRef.current[targetId] = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
        push(signalRef, {
          sender: userId,
          type: 'offer',
          payload: JSON.stringify(offer),
          timestamp: Date.now()
        });
      } catch (err) {
        console.error(`[useWebRTC] Error during negotiation with ${targetId}:`, err);
      } finally {
        makingOfferRef.current[targetId] = false;
      }
    };

    pcRef.current[targetId] = pc;
    return pc;
  }, [callId, userId, evaluateOverallConnectionState]);

  // Connect to RTDB signaling and start listening
  const connectSocket = useCallback(() => {
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;
    isCleaningUp.current = false;
    setCallState('signaling');

    // Register active participant presence in RTDB with automatic onDisconnect cleanup
    const participantRef = dbRef(rtdb, `webrtc/${callId}/participants/${userId}`);
    set(participantRef, Date.now());
    onDisconnect(participantRef).remove();

    // Listen for participant arrivals
    const participantsRef = dbRef(rtdb, `webrtc/${callId}/participants`);
    onChildAdded(participantsRef, (snapshot) => {
      const targetId = snapshot.key;
      if (targetId && targetId !== userId) {
        getOrCreatePeerConnection(targetId);
      }
    });

    // Listen for participant leaves
    onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val() || {};
      Object.keys(pcRef.current).forEach((targetId) => {
        if (!participants[targetId]) {
          const pc = pcRef.current[targetId];
          if (pc) {
            pc.close();
            delete pcRef.current[targetId];
            delete pendingCandidatesRef.current[targetId];
            delete seenCandidatesRef.current[targetId];
            delete reconnectAttemptsRef.current[targetId];
            setRemoteStreams((prev) => {
              const next = { ...prev };
              delete next[targetId];
              return next;
            });
            evaluateOverallConnectionState();
          }
        }
      });
    });

    // Listen for directed incoming WebRTC signals
    const mySignalsRef = dbRef(rtdb, `webrtc/${callId}/signals/${userId}`);
    onChildAdded(mySignalsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const { sender, type, payload } = data;
      const pc = getOrCreatePeerConnection(sender);

      try {
        if (type === 'offer') {
          const offer = JSON.parse(payload);
          const offerCollision = makingOfferRef.current[sender] || pc.signalingState !== 'stable';
          const polite = userId < sender; // Deterministic polite peer resolution

          if (offerCollision) {
            if (!polite) {
              // Impolite peer rejects incoming offer during collision
              remove(snapshot.ref).catch(() => {});
              return;
            }
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }),
              pc.setRemoteDescription(new RTCSessionDescription(offer))
            ]);
          } else {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
          }

          // Dequeue ICE candidates that arrived before remoteDescription
          await processPendingCandidates(sender, pc);

          // Generate answer and dispatch back to sender
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${sender}`);
          push(signalRef, {
            sender: userId,
            type: 'answer',
            payload: JSON.stringify(answer),
            timestamp: Date.now()
          });
        } else if (type === 'answer') {
          const answer = JSON.parse(payload);
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await processPendingCandidates(sender, pc);
          }
        } else if (type === 'ice-candidate') {
          const candidate: RTCIceCandidateInit = JSON.parse(payload);
          const candKey = getCandidateKey(candidate);

          // Avoid duplicate candidates
          if (!seenCandidatesRef.current[sender]) {
            seenCandidatesRef.current[sender] = new Set();
          }

          if (!seenCandidatesRef.current[sender].has(candKey)) {
            seenCandidatesRef.current[sender].add(candKey);

            if (pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e: any) {
                console.warn(`[useWebRTC] Non-fatal ICE candidate error from ${sender}:`, e?.message || e);
              }
            } else {
              if (!pendingCandidatesRef.current[sender]) {
                pendingCandidatesRef.current[sender] = [];
              }
              pendingCandidatesRef.current[sender].push(candidate);
            }
          }
        }
      } catch (err) {
        console.error('[useWebRTC] Error handling incoming signal:', err);
      } finally {
        remove(snapshot.ref).catch(() => {});
      }
    });

    // Listen for screen share announcements
    const screenSharesRef = dbRef(rtdb, `webrtc/${callId}/screenShares`);
    onValue(screenSharesRef, (snapshot) => {
      const shares = snapshot.val() || {};
      setActiveScreenShares(new Set(Object.keys(shares)));
    });
  }, [callId, userId, getOrCreatePeerConnection, processPendingCandidates, evaluateOverallConnectionState]);

  // Start local media stream with full error handling and rollback
  const startLocalStream = useCallback(
    async (video: boolean | MediaTrackConstraints = true, audioConstraints: boolean | MediaTrackConstraints = true, quality: string = 'normal') => {
      setCallState('requesting-permission');
      setErrorMessage(null);

      try {
        // Stop any currently running local tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video,
          audio: audioConstraints
        });

        setCallState('capturing');
        setLocalStream(stream);
        localStreamRef.current = stream;

        // Propagate tracks into active PeerConnections
        Object.values(pcRef.current).forEach((pc: RTCPeerConnection) => {
          stream.getTracks().forEach(async (track) => {
            const transceiver = pc.getTransceivers().find(
              (t) => t.receiver.track.kind === track.kind || (t.sender.track && t.sender.track.kind === track.kind)
            );
            if (transceiver) {
              await transceiver.sender.replaceTrack(track);

              if (track.kind === 'audio') {
                const params = transceiver.sender.getParameters();
                if (!params.encodings) params.encodings = [{}];

                let maxBitrate: number | undefined;
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
              pc.addTrack(track, stream);
            }
          });
        });

        return stream;
      } catch (err: any) {
        setCallState('failed');
        console.error('[useWebRTC] Failed to acquire user media:', err);

        // Explicit rollback on permission/hardware errors
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
          setLocalStream(null);
        }

        let userMsg = 'Erro ao acessar dispositivos de mídia.';
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          userMsg = 'Permissão negada para acessar microfone ou câmera. Por favor, libere o acesso nas configurações do navegador ou aplicativo.';
        } else if (err.name === 'NotFoundError') {
          userMsg = 'Nenhum dispositivo de microfone ou câmera foi encontrado no aparelho.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          userMsg = 'A câmera ou microfone está em uso por outro aplicativo no momento.';
        } else if (err.name === 'OverconstrainedError') {
          userMsg = 'Configuração de áudio/vídeo incompatível com o dispositivo.';
        }

        setErrorMessage(userMsg);
        toast.error(userMsg);
        throw err;
      }
    },
    []
  );

  // Replace video track (and optionally system audio track) cleanly for Screen Sharing or Camera Toggle
  const replaceVideoTrack = useCallback(
    async (
      newVideoTrack: MediaStreamTrack | null,
      newAudioTrack?: MediaStreamTrack | null,
      maxBitrate?: number,
      contentHint?: string
    ) => {
      if (!localStreamRef.current) return;

      // Stop previous video track
      localStreamRef.current.getVideoTracks().forEach((t) => {
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

      // If system audio is provided (e.g. tab audio / system sound during screen share)
      if (newAudioTrack) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          localStreamRef.current?.removeTrack(t);
          t.stop();
        });
        localStreamRef.current.addTrack(newAudioTrack);
      }

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

      // Update screen sharing state in RTDB
      if (newVideoTrack && contentHint === 'detail') {
        set(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`), true);
      } else {
        remove(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`)).catch(() => {});
      }

      // Replace in peer connections
      const promises: Promise<any>[] = [];
      Object.values(pcRef.current).forEach((pc: RTCPeerConnection) => {
        const replaceInTransceiver = async (kind: string, track: MediaStreamTrack | null) => {
          const transceiver = pc.getTransceivers().find(
            (t) => t.receiver.track.kind === kind || (t.sender.track && t.sender.track.kind === kind)
          );
          if (transceiver) {
            await transceiver.sender.replaceTrack(track);
            if (maxBitrate && track && kind === 'video') {
              const params = transceiver.sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = maxBitrate;
              try {
                await transceiver.sender.setParameters(params);
              } catch (e) {}
            }
          } else if (track) {
            const sender = pc.addTrack(track, localStreamRef.current!);
            if (maxBitrate && kind === 'video') {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = maxBitrate;
              try {
                await sender.setParameters(params);
              } catch (e) {}
            }
          }
        };

        promises.push(replaceInTransceiver('video', newVideoTrack || null));
        if (newAudioTrack) {
          promises.push(replaceInTransceiver('audio', newAudioTrack));
        }
      });

      await Promise.all(promises);
    },
    [callId, userId]
  );

  // Manual retry connection for UI
  const retryConnection = useCallback(() => {
    setCallState('reconnecting');
    setErrorMessage(null);
    Object.entries(pcRef.current).forEach(([targetId, pc]) => {
      try {
        if (typeof (pc as any).restartIce === 'function') {
          (pc as any).restartIce();
        } else {
          pc.createOffer({ iceRestart: true }).then((offer) => {
            pc.setLocalDescription(offer);
            const signalRef = dbRef(rtdb, `webrtc/${callId}/signals/${targetId}`);
            push(signalRef, {
              sender: userId,
              type: 'offer',
              payload: JSON.stringify(offer),
              timestamp: Date.now()
            });
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('[useWebRTC] Retry connection error:', e);
      }
    });
  }, [callId, userId]);

  // Complete, idempotent teardown
  const cleanup = useCallback(() => {
    isCleaningUp.current = true;
    listenersAttachedRef.current = false;

    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      Object.values(pcRef.current).forEach((pc: RTCPeerConnection) => {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onnegotiationneeded = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.close();
      });

      pcRef.current = {};
      pendingCandidatesRef.current = {};
      seenCandidatesRef.current = {};
      reconnectAttemptsRef.current = {};
      makingOfferRef.current = {};

      setIsConnected(false);
      setCallState('ended');
      setLocalStream(null);
      setRemoteStreams({});
      setActiveScreenShares(new Set());
      setErrorMessage(null);

      // Unsubscribe all RTDB listeners
      off(dbRef(rtdb, `webrtc/${callId}/participants`));
      off(dbRef(rtdb, `webrtc/${callId}/signals/${userId}`));
      off(dbRef(rtdb, `webrtc/${callId}/screenShares`));

      // Remove presence and signals
      remove(dbRef(rtdb, `webrtc/${callId}/participants/${userId}`)).catch(() => {});
      remove(dbRef(rtdb, `webrtc/${callId}/signals/${userId}`)).catch(() => {});
      remove(dbRef(rtdb, `webrtc/${callId}/screenShares/${userId}`)).catch(() => {});
    } catch (err) {
      console.error('[useWebRTC] Error during WebRTC cleanup:', err);
    }
  }, [callId, userId]);

  return {
    isConnected,
    callState,
    errorMessage,
    localStream,
    remoteStreams,
    activeScreenShares,
    startLocalStream,
    replaceVideoTrack,
    connectSocket,
    retryConnection,
    cleanup,
    pcMap: pcRef.current
  };
}

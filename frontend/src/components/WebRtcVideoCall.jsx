import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
  Shield,
  Radio,
  Sparkles,
  Wifi,
  WifiOff,
  Maximize2
} from 'lucide-react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function WebRtcVideoCall({
  roomId = 'boardroom-global',
  role = 'candidate', // 'candidate' | 'interviewer'
  userName = '',
  onPeerConnect,
  onPeerDisconnect
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const isInterviewer = role === 'interviewer';
  const roleTitle = isInterviewer ? 'Selector Board Member' : 'Candidate';
  const remoteRoleTitle = isInterviewer ? 'Candidate Feed' : 'Selector Board Feed';

  useEffect(() => {
    let isMounted = true;

    // 1. Connect to backend WebRTC signaling socket
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[WebRTC] Connected to signaling gateway with ID: ${socket.id}`);
      setConnectionStatus('connecting');
      socket.emit('join-room', {
        roomId,
        role,
        userName: userName || (isInterviewer ? 'Selector Board' : 'Candidate')
      });
    });

    // When another peer joins the room
    socket.on('user-joined', async ({ socketId, role: remoteRole, userName: remoteName }) => {
      console.log(`[WebRTC] Peer joined room: ${remoteName} (${remoteRole})`);
      setPeerInfo({ socketId, role: remoteRole, userName: remoteName });
      if (onPeerConnect) onPeerConnect({ role: remoteRole, userName: remoteName });

      // If we are the interviewer or initiator, create offer
      if (peerConnectionRef.current) {
        initiateOffer();
      }
    });

    // When receiving WebRTC Offer
    socket.on('webrtc-offer', async ({ from, role: remoteRole, sdp }) => {
      console.log(`[WebRTC] Received offer from ${from}`);
      setPeerInfo(prev => prev || { socketId: from, role: remoteRole, userName: remoteRole === 'interviewer' ? 'Selector Board' : 'Candidate' });
      await handleOffer(sdp);
    });

    // When receiving WebRTC Answer
    socket.on('webrtc-answer', async ({ from, sdp }) => {
      console.log(`[WebRTC] Received answer from ${from}`);
      await handleAnswer(sdp);
    });

    // When receiving ICE candidate
    socket.on('ice-candidate', async ({ from, candidate }) => {
      if (candidate) {
        await handleRemoteCandidate(candidate);
      }
    });

    // When peer disconnects
    socket.on('user-left', ({ socketId, role: leftRole }) => {
      console.log(`[WebRTC] Peer left: ${leftRole}`);
      setRemoteStream(null);
      setConnectionStatus('connecting');
      setPeerInfo(null);
      if (onPeerDisconnect) onPeerDisconnect({ role: leftRole });
    });

    // 2. Initialize Camera & Mic Media
    initLocalMedia();

    return () => {
      isMounted = false;
      cleanupCall();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, role]);

  // Clean up media and peer connection
  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  // Helper to generate a friendly canvas fallback video stream if no physical camera exists
  const createSyntheticMediaStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      // Clean background
      ctx.fillStyle = isInterviewer ? '#1E3A2F' : '#111111';
      ctx.fillRect(0, 0, 640, 480);

      // Radial pattern
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(userName || (isInterviewer ? 'Selector Board Camera' : 'Candidate Camera'), 320, 220);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#A8A29E';
      ctx.fillText(`Live Stream Active • Frame ${frame}`, 320, 260);

      // Pulsing circle
      ctx.beginPath();
      ctx.arc(320, 310, 15 + Math.sin(frame * 0.1) * 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
    }, 100);

    const canvasStream = canvas.captureStream(30);

    // Audio context beep / silent track
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) canvasStream.addTrack(audioTrack);
    } catch (e) {}

    return canvasStream;
  };

  // Initialize Media Stream
  const initLocalMedia = async () => {
    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: true
        });
      } else {
        throw new Error('getUserMedia not supported in this browser');
      }
    } catch (err) {
      console.warn('Camera/Mic permission failed or device unavailable. Falling back to synthetic media stream:', err.message);
      setDeviceError(`Notice: Using virtual media feed (${err.message}). Grant camera permissions if available.`);
      stream = createSyntheticMediaStream();
    }

    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Initialize RTCPeerConnection
    setupPeerConnection(stream);
  };

  // Setup Peer Connection
  const setupPeerConnection = (stream) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setConnectionStatus('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionStatus('disconnected');
      }
    };

    // Flush any pending ICE candidates
    while (pendingCandidatesRef.current.length > 0) {
      const cand = pendingCandidatesRef.current.shift();
      pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn(e));
    }
  };

  // Initiate WebRTC Offer
  const initiateOffer = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit('webrtc-offer', {
          roomId,
          sdp: offer
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error initiating offer:', err);
    }
  };

  // Handle incoming Offer
  const handleOffer = async (sdp) => {
    let pc = peerConnectionRef.current;
    if (!pc) {
      setupPeerConnection(localStream);
      pc = peerConnectionRef.current;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('webrtc-answer', {
          roomId,
          sdp: answer
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err);
    }
  };

  // Handle incoming Answer
  const handleAnswer = async (sdp) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    } catch (err) {
      console.error('[WebRTC] Error handling answer:', err);
    }
  };

  // Handle remote ICE candidate
  const handleRemoteCandidate = async (candidate) => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] Error adding ICE candidate:', err);
    }
  };

  // Controls: Toggle Audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      const nextState = !isAudioMuted;
      audioTracks.forEach(track => {
        track.enabled = !nextState;
      });
      setIsAudioMuted(nextState);
    }
  };

  // Controls: Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      const nextState = !isVideoDisabled;
      videoTracks.forEach(track => {
        track.enabled = !nextState;
      });
      setIsVideoDisabled(nextState);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Device warning if any */}
      {deviceError && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            color: '#92400E',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={14} color="#D97706" />
          <span>{deviceError}</span>
        </div>
      )}

      {/* Main Dual-Video Grid (Editorial Journal Frame) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* Remote Video (Primary Focus: The Other Party) */}
        <div
          style={{
            position: 'relative',
            background: '#111111',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            aspectRatio: '16/10',
            border: '1.5px solid #292524',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: remoteStream ? 'block' : 'none'
            }}
          />

          {/* Fallback if remote peer is not yet connected */}
          {!remoteStream && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#D6CEC0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isInterviewer ? 'rgba(30, 58, 47, 0.6)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                {isInterviewer ? <User size={28} color="#D6CEC0" /> : <Shield size={28} color="#D6CEC0" />}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#FFFFFF', marginBottom: '4px' }}>
                {remoteRoleTitle}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#A8A29E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span className="pulse-dot-green" />
                <span>
                  {connectionStatus === 'connected'
                    ? 'Receiving peer video stream...'
                    : `Waiting for ${isInterviewer ? 'Candidate' : 'Interviewer'} on the dual port...`}
                </span>
              </div>
            </div>
          )}

          {/* Top Label Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(17, 17, 17, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Radio size={12} color="#10B981" />
            <span>{remoteRoleTitle}</span>
            {peerInfo?.userName && <span style={{ opacity: 0.7 }}>• {peerInfo.userName}</span>}
          </div>

          {/* Status Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: connectionStatus === 'connected' ? 'rgba(30, 58, 47, 0.85)' : 'rgba(217, 119, 6, 0.85)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{connectionStatus === 'connected' ? 'LIVE WebRTC' : 'Connecting'}</span>
          </div>
        </div>

        {/* Local Video (Self Preview Frame) */}
        <div
          style={{
            position: 'relative',
            background: '#18181B',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            aspectRatio: '16/10',
            border: '1.5px solid #27272A',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror local preview
              display: isVideoDisabled ? 'none' : 'block'
            }}
          />

          {/* Fallback when video disabled */}
          {isVideoDisabled && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#D6CEC0' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto'
                }}
              >
                <VideoOff size={22} color="#EF4444" />
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF' }}>
                Camera Paused
              </div>
            </div>
          )}

          {/* Top Label Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(17, 17, 17, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>You ({roleTitle})</span>
            {isAudioMuted && <MicOff size={11} color="#EF4444" />}
          </div>

          {/* Bottom Floating Control Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(17, 17, 17, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <button
              type="button"
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isAudioMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isAudioMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              type="button"
              onClick={toggleVideo}
              title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isVideoDisabled ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isVideoDisabled ? <VideoOff size={16} /> : <Video size={16} />}
            </button>

            <button
              type="button"
              onClick={initiateOffer}
              title="Reconnect / Sync WebRTC Stream"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Radio size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

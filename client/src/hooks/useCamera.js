import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * useCamera — manages webcam access and WebRTC peer connection
 * @param {boolean} enabled - Whether camera should be active
 * @param {string} examId - Used for WebRTC signaling
 * @param {string} studentId - Used for identification
 * @param {function} onCameraOff - Callback when camera turns off
 */
const useCamera = ({ enabled, examId, studentId, onCameraOff }) => {
  const { socket } = useSocket();
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const peerConnections = useRef({});
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Detect if camera track ends (user physically turns off camera)
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          setCameraActive(false);
          if (onCameraOff) onCameraOff();
        });
      });

      return stream;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Could not access camera. Please check your device.';
      setCameraError(msg);
      setCameraActive(false);
      throw err;
    }
  }, [onCameraOff]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Handle WebRTC connection when admin requests camera
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleCameraRequested = async ({ adminSocketId }) => {
      try {
        const stream = streamRef.current || (await startCamera());
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit('webrtc-ice-candidate', {
              targetSocketId: adminSocketId,
              candidate,
            });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          targetSocketId: adminSocketId,
          offer,
          studentId,
        });

        peerConnections.current[adminSocketId] = pc;
      } catch (err) {
        console.error('WebRTC offer failed:', err);
      }
    };

    const handleWebRTCAnswer = async ({ answer, fromSocketId }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleICECandidate = async ({ candidate, fromSocketId }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('camera-requested', handleCameraRequested);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleICECandidate);

    return () => {
      socket.off('camera-requested', handleCameraRequested);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleICECandidate);

      // Close all peer connections
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, [socket, enabled, studentId, startCamera]);

  useEffect(() => {
    if (enabled) {
      startCamera().catch(() => {});
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [enabled]);

  return {
    videoRef,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    stream: streamRef.current,
  };
};

export default useCamera;

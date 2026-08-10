import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

/**
 * useAntiCheat — detects and reports 6 types of cheating events
 * @param {string} examId - Current exam ID
 * @param {string} studentId - Current student ID
 * @param {boolean} active - Whether anti-cheat monitoring is active
 * @param {function} onWarning - Callback when warning is received
 * @param {function} onVoided - Callback when exam is voided
 */
const useAntiCheat = ({ examId, studentId, active, onWarning, onVoided }) => {
  const { socket } = useSocket();
  const isActive = useRef(active);
  const heartbeatInterval = useRef(null);

  useEffect(() => {
    isActive.current = active;
  }, [active]);

  const reportEvent = useCallback(
    async (type, details = '') => {
      if (!isActive.current || !examId || !studentId) return;

      // Emit via socket for real-time admin monitoring
      if (socket) {
        socket.emit('cheat-event', { type, examId, studentId, details });
      }

      // Also persist via HTTP in case socket drops
      try {
        await api.post('/cheat/log', { examId, type, details });
      } catch (_) {}
    },
    [examId, studentId, socket]
  );

  useEffect(() => {
    if (!active || !examId) return;

    // ── Tab switch detection ──────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportEvent('tab-switch', 'Student navigated away from exam tab');
      }
    };

    // ── Fullscreen exit detection ─────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportEvent('fullscreen-exit', 'Student exited fullscreen mode');
      }
    };

    // ── Page refresh / browser close detection ────────────────────────────
    const handleBeforeUnload = (e) => {
      reportEvent('refresh', 'Page refresh or browser close detected');
      e.preventDefault();
      e.returnValue = 'Leaving the exam page will be recorded as a violation!';
    };

    // ── Internet connection loss ──────────────────────────────────────────
    const handleOffline = () => {
      reportEvent('internet-lost', 'Internet connection lost');
    };

    // ── Right-click prevention ────────────────────────────────────────────
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportEvent('right-click', 'Right-click attempt');
    };

    // ── Copy/paste prevention ─────────────────────────────────────────────
    const handleCopy = () => reportEvent('copy-paste', 'Copy attempt detected');
    const handlePaste = () => reportEvent('copy-paste', 'Paste attempt detected');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // ── Heartbeat every 30 seconds ────────────────────────────────────────
    heartbeatInterval.current = setInterval(() => {
      if (socket && examId) {
        socket.emit('heartbeat', { examId, studentId });
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      clearInterval(heartbeatInterval.current);
    };
  }, [active, examId, studentId, reportEvent, socket]);

  // Listen for server responses
  useEffect(() => {
    if (!socket) return;

    const handleWarning = (data) => {
      if (onWarning) onWarning(data);
    };

    const handleVoided = (data) => {
      if (onVoided) onVoided(data);
    };

    socket.on('warning-issued', handleWarning);
    socket.on('exam-voided', handleVoided);

    return () => {
      socket.off('warning-issued', handleWarning);
      socket.off('exam-voided', handleVoided);
    };
  }, [socket, onWarning, onVoided]);

  return { reportEvent };
};

export default useAntiCheat;

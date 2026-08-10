import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useTimer — countdown timer with auto-submit on expiry
 * @param {number} initialSeconds - Starting seconds
 * @param {boolean} active - Whether timer should be running
 * @param {function} onExpire - Callback when timer hits 0
 */
const useTimer = ({ initialSeconds, active, onExpire }) => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setTimeRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isUrgent = timeRemaining <= 300; // Last 5 minutes
  const isCritical = timeRemaining <= 60; // Last 1 minute
  const percentage = initialSeconds > 0 ? (timeRemaining / initialSeconds) * 100 : 0;

  return {
    timeRemaining,
    formatted: formatTime(timeRemaining),
    isUrgent,
    isCritical,
    percentage,
    stop,
    setTimeRemaining,
  };
};

export default useTimer;

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

interface IdleTimeoutOptions {
  timeout?: number; // in minutes
  warningTime?: number; // seconds before logout to show warning
  onIdle?: () => void;
  onWarning?: (secondsLeft: number) => void;
  onActive?: () => void;
}

export const useIdleTimeout = (options: IdleTimeoutOptions = {}) => {
  const { timeout: customTimeout, warningTime = 60, onIdle, onWarning, onActive } = options;
  const { logout, sessionTimeout } = useAuthStore();
  const timeout = (customTimeout || sessionTimeout) * 60 * 1000; // convert to ms
  const warningMs = warningTime * 1000;

  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningTime);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    clearTimers();
    setIsIdle(true);
    setShowWarning(false);
    onIdle?.();
    logout();
  }, [clearTimers, logout, onIdle]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(warningTime);
    onWarning?.(warningTime);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        onWarning?.(prev - 1);
        return prev - 1;
      });
    }, 1000);
  }, [warningTime, onWarning, handleLogout]);

  const resetTimer = useCallback(() => {
    clearTimers();
    setIsIdle(false);
    setShowWarning(false);
    setSecondsLeft(warningTime);
    onActive?.();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      startWarningCountdown();
    }, timeout - warningMs);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  }, [clearTimers, timeout, warningMs, warningTime, handleLogout, startWarningCountdown, onActive]);

  const stayActive = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimers();
    };
  }, [resetTimer, clearTimers, showWarning]);

  return { isIdle, showWarning, secondsLeft, stayActive, resetTimer };
};

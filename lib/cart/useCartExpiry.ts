import { useEffect, useMemo, useState } from 'react';

const SECOND = 1000;

const formatRemaining = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / SECOND));
  if (totalSeconds < 60) {
    return `${totalSeconds} giây`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours < 24) {
    return `${totalHours} giờ ${minutes} phút`;
  }

  const days = Math.floor(totalHours / 24);
  return `${days} ngày`;
};

export const useCartExpiry = (expiresAt: number | null) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) {
      return { expiryText: null, isExpired: false };
    }

    const remainingMs = expiresAt - now;
    if (remainingMs <= 0) {
      return { expiryText: null, isExpired: true };
    }

    return { expiryText: formatRemaining(remainingMs), isExpired: false };
  }, [expiresAt, now]);
};

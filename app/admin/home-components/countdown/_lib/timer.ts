import React from 'react';

export interface CountdownTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const EMPTY_TIME_LEFT: CountdownTimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isExpired: false,
};

export const calculateCountdownTimeLeft = (endDate: string): CountdownTimeLeft => {
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) {
    return EMPTY_TIME_LEFT;
  }

  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isExpired: false,
  };
};

export const useCountdownTimer = (endDate: string) => {
  const [timeLeft, setTimeLeft] = React.useState<CountdownTimeLeft>(() => calculateCountdownTimeLeft(endDate));

  React.useEffect(() => {
    const tick = () => {
      setTimeLeft(calculateCountdownTimeLeft(endDate));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [endDate]);

  return timeLeft;
};

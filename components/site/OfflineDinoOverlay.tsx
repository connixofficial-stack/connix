'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PublicImage } from '@/components/shared/PublicImage';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import type { HeaderInitialData } from '@/components/site/Header';

type OfflineDinoOverlayProps = {
  initialSite?: NonNullable<HeaderInitialData['site']>;
};

type Obstacle = {
  x: number;
  width: number;
  height: number;
};

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 220;
const GROUND_Y = 172;
const DINO_X = 54;
const DINO_SIZE = 34;

export function OfflineDinoOverlay({ initialSite }: OfflineDinoOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const { primary, secondary } = useBrandColors();
  const siteSettings = useSiteSettings();

  const siteName = siteSettings.siteName || initialSite?.site_name || 'Website';
  const logo = siteSettings.logo || initialSite?.site_logo || '';
  const accent = primary || '#2563eb';
  const accentSoft = secondary || accent;

  useEffect(() => {
    const syncOnlineState = () => setIsOffline(!navigator.onLine);

    syncOnlineState();
    window.addEventListener('online', syncOnlineState);
    window.addEventListener('offline', syncOnlineState);

    return () => {
      window.removeEventListener('online', syncOnlineState);
      window.removeEventListener('offline', syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!isOffline) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let dinoY = GROUND_Y - DINO_SIZE;
    let velocity = 0;
    let jumping = false;
    let score = 0;
    let frame = 0;
    let speed = 4;
    let animationFrame = 0;
    let obstacles: Obstacle[] = [];
    let ended = false;

    const jump = () => {
      if (ended) {
        setGameOver(false);
        setRestartKey((value) => value + 1);
        return;
      }
      if (!jumping) {
        velocity = -14;
        jumping = true;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = accent;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, GROUND_Y + 3, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      dinoY += velocity;
      velocity += 0.65;

      if (dinoY >= GROUND_Y - DINO_SIZE) {
        dinoY = GROUND_Y - DINO_SIZE;
        velocity = 0;
        jumping = false;
      }

      if (frame % 72 === 0) {
        const height = 24 + Math.round(Math.random() * 18);
        obstacles.push({ x: CANVAS_WIDTH, width: 16 + Math.round(Math.random() * 16), height });
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(DINO_X, dinoY, DINO_SIZE, DINO_SIZE);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(DINO_X + 22, dinoY + 8, 5, 5);
      ctx.fillStyle = accentSoft;
      ctx.fillRect(DINO_X + 6, dinoY + DINO_SIZE - 4, 8, 4);
      ctx.fillRect(DINO_X + 22, dinoY + DINO_SIZE - 4, 8, 4);

      obstacles = obstacles
        .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed }))
        .filter((obstacle) => obstacle.x > -60);

      for (const obstacle of obstacles) {
        const obstacleY = GROUND_Y - obstacle.height;
        ctx.fillStyle = accent;
        ctx.fillRect(obstacle.x, obstacleY, obstacle.width, obstacle.height);
        ctx.fillRect(obstacle.x - 6, obstacleY + 10, 6, 8);
        ctx.fillRect(obstacle.x + obstacle.width, obstacleY + 14, 6, 8);

        const hitX = obstacle.x < DINO_X + DINO_SIZE && obstacle.x + obstacle.width > DINO_X;
        const hitY = dinoY + DINO_SIZE > obstacleY;
        if (hitX && hitY) {
          ended = true;
          setGameOver(true);
          cancelAnimationFrame(animationFrame);
          return;
        }
      }

      score += 1;
      if (score % 520 === 0) {
        speed += 0.35;
      }

      ctx.fillStyle = '#475569';
      ctx.font = '600 18px Arial';
      ctx.fillText(`Điểm: ${Math.floor(score / 10)}`, 22, 34);

      frame += 1;
      animationFrame = requestAnimationFrame(draw);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('pointerdown', jump);
    setGameOver(false);
    draw();

    return () => {
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('pointerdown', jump);
      cancelAnimationFrame(animationFrame);
    };
  }, [accent, accentSoft, isOffline, restartKey]);

  const overlayStyle = useMemo<React.CSSProperties>(() => ({
    '--offline-accent': accent,
    '--offline-accent-soft': accentSoft,
  }) as React.CSSProperties, [accent, accentSoft]);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/92 px-4 py-8 text-white backdrop-blur-md"
      style={overlayStyle}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 md:p-8">
        <div className="mb-5 flex items-center gap-3">
          {logo ? (
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2">
              <PublicImage src={logo} alt={siteName} fill sizes="48px" className="object-contain" mode="logo" />
            </span>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--offline-accent)] text-lg font-bold text-white">
              {siteName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-sm text-slate-300">Bạn đang offline</p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{siteName}</h2>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-3 shadow-inner">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full cursor-pointer rounded-2xl"
            aria-label="Game Dino offline"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>
            Website vẫn giữ màu, logo và tên đã tải. Nhấn <strong className="text-white">SPACE</strong>, <strong className="text-white">↑</strong> hoặc chạm màn hình để nhảy.
          </p>
          {gameOver && (
            <button
              type="button"
              className="rounded-full bg-[var(--offline-accent)] px-4 py-2 font-semibold text-white transition hover:brightness-110"
              onClick={() => setRestartKey((value) => value + 1)}
            >
              Chơi lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

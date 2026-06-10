'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, CaseSensitive, Pause, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Label, cn } from '../../../components/ui';
import { SCALE_OPTIONS, SPEED_OPTIONS } from '../_lib/constants';
import type { MarqueeDirection, MarqueeScale, MarqueeSpeed } from '../_types';

export function MarqueeDisplayConfig({
  direction,
  setDirection,
  speed,
  setSpeed,
  pauseOnHover,
  setPauseOnHover,
  scale,
  setScale,
  uppercase,
  setUppercase,
}: {
  direction: MarqueeDirection;
  setDirection: (value: MarqueeDirection) => void;
  speed: MarqueeSpeed;
  setSpeed: (value: MarqueeSpeed) => void;
  pauseOnHover: boolean;
  setPauseOnHover: (value: boolean) => void;
  scale: MarqueeScale;
  setScale: (value: MarqueeScale) => void;
  uppercase: boolean;
  setUppercase: (value: boolean) => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Cấu hình chuyển động</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Hướng chạy</Label>
            <div className="flex gap-1">
              {(['left', 'right'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDirection(value)}
                  className={cn(
                    'flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-xs transition-colors',
                    direction === value
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {value === 'left' ? <><ArrowLeft size={12} /> Trái</> : <>Phải <ArrowRight size={12} /></>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tốc độ</Label>
            <select
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              value={speed}
              onChange={(event) => setSpeed(event.target.value as MarqueeSpeed)}
            >
              {SPEED_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Dừng khi hover</Label>
            <button
              type="button"
              onClick={() => setPauseOnHover(!pauseOnHover)}
              className={cn(
                'flex h-8 w-full items-center gap-1.5 rounded-md border px-3 text-xs transition-colors',
                pauseOnHover
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
            >
              {pauseOnHover ? <Pause size={12} /> : <Play size={12} />}
              {pauseOnHover ? 'Bật' : 'Tắt'}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Kích thước</Label>
            <select
              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              value={scale}
              onChange={(event) => setScale(Number(event.target.value) as MarqueeScale)}
            >
              {SCALE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Chữ in hoa</Label>
            <button
              type="button"
              onClick={() => setUppercase(!uppercase)}
              className={cn(
                'flex h-8 w-full items-center gap-1.5 rounded-md border px-3 text-xs transition-colors',
                uppercase
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              )}
            >
              <CaseSensitive size={14} />
              {uppercase ? 'Bật' : 'Tắt'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

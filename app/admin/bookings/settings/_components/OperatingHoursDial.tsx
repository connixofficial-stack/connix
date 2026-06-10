'use client';

import React from 'react';

type OperatingHoursDialProps = {
  startHour: number;
  endHour: number;
  onChange: (next: { startHour: number; endHour: number }) => void;
};

type HandleType = 'start' | 'end' | null;

const SIZE = 320;
const CENTER = SIZE / 2;
const ARC_RADIUS = 106;
const TICK_INNER_RADIUS = 118;
const TICK_OUTER_RADIUS = 130;
const TICK_MAJOR_OUTER_RADIUS = 134;
const LABEL_RADIUS = 146;

function normalizeHour(value: number) {
  return ((Math.round(value) % 24) + 24) % 24;
}

function hourToAngle(hour: number) {
  return (normalizeHour(hour) / 24) * Math.PI * 2 - Math.PI / 2;
}

function pointFromHour(hour: number, radius: number) {
  const angle = hourToAngle(hour);
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function resolveHourFromPointer(clientX: number, clientY: number, element: HTMLDivElement) {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
  return normalizeHour(Math.round((normalized / (Math.PI * 2)) * 24));
}

function describeWindow(startHour: number, endHour: number) {
  const isOvernight = startHour > endHour;
  const duration = startHour === endHour ? 0 : ((endHour - startHour + 24) % 24);
  return { isOvernight, duration };
}

export function OperatingHoursDial({ startHour, endHour, onChange }: OperatingHoursDialProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = React.useState<HandleType>(null);

  React.useEffect(() => {
    if (!dragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }
      const nextHour = resolveHourFromPointer(event.clientX, event.clientY, rootRef.current);
      if (dragging === 'start') {
        onChange({ startHour: nextHour, endHour });
      } else {
        onChange({ startHour, endHour: nextHour });
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !rootRef.current) {
        return;
      }
      const nextHour = resolveHourFromPointer(touch.clientX, touch.clientY, rootRef.current);
      if (dragging === 'start') {
        onChange({ startHour: nextHour, endHour });
      } else {
        onChange({ startHour, endHour: nextHour });
      }
    };

    const stopDragging = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', stopDragging);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, [dragging, endHour, onChange, startHour]);

  const startPoint = pointFromHour(startHour, ARC_RADIUS);
  const endPoint = pointFromHour(endHour, ARC_RADIUS);
  const { isOvernight, duration } = describeWindow(startHour, endHour);
  const segmentHours = (endHour - startHour + 24) % 24;
  const largeArc = segmentHours > 12 ? 1 : 0;

  return (
    <div className="space-y-4">
      <div ref={rootRef} className="relative mx-auto h-[320px] w-[320px] touch-none select-none">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
          <circle cx={CENTER} cy={CENTER} r={ARC_RADIUS} className="fill-none stroke-slate-200 dark:stroke-slate-700" strokeWidth={18} />
          {startHour !== endHour && (
            <path
              d={`M ${startPoint.x} ${startPoint.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`}
              className="fill-none stroke-indigo-500"
              strokeWidth={18}
              strokeLinecap="round"
            />
          )}

          {Array.from({ length: 24 }).map((_, hour) => {
            const isMajor = hour % 6 === 0;
            const from = pointFromHour(hour, TICK_INNER_RADIUS);
            const to = pointFromHour(hour, isMajor ? TICK_MAJOR_OUTER_RADIUS : TICK_OUTER_RADIUS);
            return (
              <line
                key={`tick-${hour}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={isMajor ? 'stroke-slate-600 dark:stroke-slate-200' : 'stroke-slate-400 dark:stroke-slate-500'}
                strokeWidth={isMajor ? 2.6 : 1.4}
              />
            );
          })}

          {Array.from({ length: 24 }).map((_, hour) => {
            const labelPoint = pointFromHour(hour, LABEL_RADIUS);
            return (
              <text
                key={`label-${hour}`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[10px] font-medium"
              >
                {hour}
              </text>
            );
          })}

          <circle
            cx={startPoint.x}
            cy={startPoint.y}
            r={14}
            className={`cursor-grab fill-emerald-500 transition ${dragging === 'start' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]' : ''}`}
            onMouseDown={() => setDragging('start')}
            onTouchStart={() => setDragging('start')}
          />
          <circle
            cx={startPoint.x}
            cy={startPoint.y}
            r={22}
            className="cursor-grab fill-transparent"
            onMouseDown={() => setDragging('start')}
            onTouchStart={() => setDragging('start')}
          />

          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            r={14}
            className={`cursor-grab fill-rose-500 transition ${dragging === 'end' ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]' : ''}`}
            onMouseDown={() => setDragging('end')}
            onTouchStart={() => setDragging('end')}
          />
          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            r={22}
            className="cursor-grab fill-transparent"
            onMouseDown={() => setDragging('end')}
            onTouchStart={() => setDragging('end')}
          />

          <circle cx={CENTER} cy={CENTER} r={54} className="fill-white dark:fill-slate-900" />
          <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="fill-slate-600 text-[11px] font-medium dark:fill-slate-300">
            Giờ hoạt động
          </text>
          <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="fill-slate-900 text-lg font-semibold dark:fill-slate-100">
            {duration}h{isOvernight ? ' • Qua ngày' : ''}
          </text>
        </svg>
      </div>
      <p className="text-center text-xs text-slate-500">Vòng đồng hồ 24h: kéo chấm xanh (mở cửa) và đỏ (đóng cửa)</p>
    </div>
  );
}

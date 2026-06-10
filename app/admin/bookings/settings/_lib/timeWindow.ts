export function clampHour(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(23, Math.max(0, Math.round(value)));
}

export function formatHour(hour: number) {
  return `${String(clampHour(hour)).padStart(2, '0')}:00`;
}

export function isOvernightWindow(startHour: number, endHour: number) {
  return clampHour(startHour) > clampHour(endHour);
}

export function resolveWindowDurationHours(startHour: number, endHour: number) {
  const start = clampHour(startHour);
  const end = clampHour(endHour);
  if (start === end) {
    return 0;
  }
  return (end - start + 24) % 24;
}

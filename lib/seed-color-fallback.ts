import type { IndustryCategory, IndustryTemplate } from './seed-templates/types';

export type IndustryPalette = {
  primary: string;
  secondary: string;
};

const DEFAULT_PRIMARY = '#3b82f6';

const CATEGORY_DEFAULTS: Record<IndustryCategory, IndustryPalette> = {
  'fashion-beauty': { primary: '#ec4899', secondary: '#f97316' },
  'technology': { primary: '#2563eb', secondary: '#22d3ee' },
  'food-beverage': { primary: '#f97316', secondary: '#22c55e' },
  'health-wellness': { primary: '#10b981', secondary: '#0ea5e9' },
  'retail': { primary: '#f59e0b', secondary: '#6366f1' },
  'services': { primary: '#0ea5e9', secondary: '#22c55e' },
  'business': { primary: '#1e40af', secondary: '#0f172a' },
  'environment': { primary: '#16a34a', secondary: '#84cc16' },
};

export function getIndustryBestPracticePalette(template: IndustryTemplate | null): IndustryPalette {
  const category = template?.category;
  const categoryDefaults = category ? CATEGORY_DEFAULTS[category] : undefined;
  const primary = normalizeHex(template?.brandColor)
    ?? categoryDefaults?.primary
    ?? DEFAULT_PRIMARY;

  const secondaryCandidate = normalizeHex(categoryDefaults?.secondary)
    ?? shiftHue(primary, 150, { lightnessDelta: 4, saturationDelta: -2 });

  const secondary = ensureDistinct(primary, secondaryCandidate);

  return { primary, secondary };
}

function normalizeHex(input?: string | null): string | null {
  if (!input) {
    return null;
  }
  const raw = input.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) {
    return null;
  }
  const normalized = raw.length === 3
    ? raw.split('').map((char) => char + char).join('')
    : raw;
  return `#${normalized.toLowerCase()}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = normalizeHex(hex) ?? DEFAULT_PRIMARY;
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  return { h, l, s: s * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const normalizedS = clamp(s / 100, 0, 1);
  const normalizedL = clamp(l / 100, 0, 1);
  const c = (1 - Math.abs(2 * normalizedL - 1)) * normalizedS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normalizedL - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return `#${toHex((r + m) * 255)}${toHex((g + m) * 255)}${toHex((b + m) * 255)}`;
}

function shiftHue(
  hex: string,
  delta: number,
  adjust?: { saturationDelta?: number; lightnessDelta?: number }
): string {
  const { h, s, l } = hexToHsl(hex);
  const nextHue = (h + delta + 360) % 360;
  const nextS = clamp(s + (adjust?.saturationDelta ?? 0), 12, 92);
  const nextL = clamp(l + (adjust?.lightnessDelta ?? 0), 24, 82);
  return hslToHex(nextHue, nextS, nextL);
}

function ensureDistinct(primary: string, secondary: string): string {
  const primaryHsl = hexToHsl(primary);
  const secondaryHsl = hexToHsl(secondary);
  const diff = hueDistance(primaryHsl.h, secondaryHsl.h);

  if (diff < 25) {
    return shiftHue(primary, 150, { lightnessDelta: 6, saturationDelta: 8 });
  }

  return secondary;
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toHex(value: number): string {
  const hex = Math.round(value).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

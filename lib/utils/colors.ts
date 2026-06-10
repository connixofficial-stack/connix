'use client';

export function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    return hex;
  }

  const normalized = cleaned.length === 3
    ? cleaned.split('').map((char) => char + char).join('')
    : cleaned;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return hex;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getTint(hex: string, opacity: number): string {
  return hexToRgba(hex, opacity);
}

export function getShade(hex: string, percentage: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: { h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break; }
      case g: { h = ((b - r) / d + 2) / 6; break; }
      case b: { h = ((r - g) / d + 4) / 6; break; }
    }
  }

  l = Math.max(0, l - percentage / 100);

  const hue2rgb = (p: number, q: number, t: number) => {
    let temp = t;
    if (temp < 0) { temp += 1; }
    if (temp > 1) { temp -= 1; }
    if (temp < 1 / 6) { return p + (q - p) * 6 * temp; }
    if (temp < 1 / 2) { return q; }
    if (temp < 2 / 3) { return p + (q - p) * (2 / 3 - temp) * 6; }
    return p;
  };

  let rOut: number;
  let gOut: number;
  let bOut: number;
  if (s === 0) {
    rOut = l;
    gOut = l;
    bOut = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rOut = hue2rgb(p, q, h + 1 / 3);
    gOut = hue2rgb(p, q, h);
    bOut = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (value: number) => {
    const hexValue = Math.round(value * 255).toString(16);
    return hexValue.length === 1 ? `0${hexValue}` : hexValue;
  };

  return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
}

export interface BrandColorsConfig {
  primary: string;
  secondary: string;
  mode: 'single' | 'dual';
}

export interface BrandColorsResult {
  primary: string;
  secondary: string;
  useDualBrand: boolean;
  getTint: (opacity: number, useSecondary?: boolean) => string;
  getShade: (percent: number, useSecondary?: boolean) => string;
  getPlaceholder: () => PlaceholderColors;
}

export interface PlaceholderColors {
  background: string;
  icon: string;
  text: string;
}

export function getBrandColors(config: BrandColorsConfig): BrandColorsResult {
  const { primary, secondary, mode } = config;
  const useDualBrand = mode === 'dual' && !!secondary;

  return {
    primary,
    secondary: useDualBrand ? secondary : primary,
    useDualBrand,
    getTint: (opacity: number, useSecondary = false) => {
      const color = useSecondary && useDualBrand ? secondary : primary;
      return getTint(color, opacity);
    },
    getShade: (percent: number, useSecondary = false) => {
      const color = useSecondary && useDualBrand ? secondary : primary;
      return getShade(color, percent);
    },
    getPlaceholder: () => ({
      background: '#f1f5f9',
      icon: primary,
      text: getShade(primary, 35),
    }),
  };
}

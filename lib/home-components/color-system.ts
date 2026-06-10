import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';

interface ThresholdInput {
  fontSize: number;
  fontWeight: number;
}

interface AccessibilityInput {
  key: string;
  text: string;
  bg: string;
  size: number;
  weight: number;
}

const DEFAULT_COLOR = '#3b82f6';

const toFiniteNumber = (value: number, fallback: number) => (
  Number.isFinite(value) ? value : fallback
);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_COLOR)
);

const toRgbTuple = (value: string, fallback: string): [number, number, number] | null => {
  const parsed = safeParseOklch(value, fallback);
  const normalized = formatHex(parsed).replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return [r, g, b];
};

const computeLc = (text: string, bg: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const bgRgb = toRgbTuple(bg, '#0f172a');

  if (!textRgb || !bgRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(bgRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

export const getAccessibilityThreshold = ({ fontSize, fontWeight }: ThresholdInput): number => {
  const size = toFiniteNumber(fontSize, 16);
  const weight = toFiniteNumber(fontWeight, 400);

  if (size >= 24 || (size >= 18 && weight >= 700)) {
    return 45;
  }

  if (size >= 16 && weight >= 600) {
    return 52;
  }

  return 60;
};

export const getAccessibilityScore = (pairs: AccessibilityInput[]) => {
  const items = pairs.map((pair) => {
    const threshold = getAccessibilityThreshold({ fontSize: pair.size, fontWeight: pair.weight });
    const lc = computeLc(pair.text, pair.bg);

    return {
      key: pair.key,
      lc,
      pass: lc >= threshold,
      threshold,
    };
  });

  const minLc = items.length > 0
    ? items.reduce((acc, item) => Math.min(acc, item.lc), Number.POSITIVE_INFINITY)
    : 0;

  return {
    items,
    minLc: Number.isFinite(minLc) ? minLc : 0,
  };
};

export const getHarmonyStatus = (primary: string, secondary: string) => {
  const deltaRaw = differenceEuclidean('oklch')(primary, secondary);
  const deltaE = Number.isFinite(deltaRaw) ? Number((deltaRaw * 100).toFixed(2)) : 0;

  return {
    deltaE,
    isTooSimilar: deltaE < 10,
  };
};

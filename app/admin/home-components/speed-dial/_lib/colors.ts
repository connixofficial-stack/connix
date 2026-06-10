'use client';

import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { differenceEuclidean, formatHex, oklch } from 'culori';
import type {
  SpeedDialAction,
  SpeedDialBrandMode,
  SpeedDialStyle,
} from '../_types';

const DEFAULT_BRAND_COLOR = '#3b82f6';

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);
const clampChroma = (value: number) => Math.min(Math.max(value, 0.02), 0.35);

const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch(DEFAULT_BRAND_COLOR)
);

const normalizeHex = (value: string, fallback: string) => {
  const candidate = value.trim().length > 0 ? value.trim() : fallback;
  return formatHex(safeParseOklch(candidate, fallback));
};

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const getAPCAThreshold = (fontSize = 16, fontWeight = 500) => (
  (fontSize >= 18 || fontWeight >= 700) ? 45 : 60
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

const getAPCALc = (text: string, background: string) => {
  const textRgb = toRgbTuple(text, '#ffffff');
  const backgroundRgb = toRgbTuple(background, '#0f172a');

  if (!textRgb || !backgroundRgb) {
    return 0;
  }

  const lc = Math.abs(APCAcontrast(sRGBtoY(textRgb), sRGBtoY(backgroundRgb)));
  return Number.isFinite(lc) ? lc : 0;
};

export const getAPCATextColor = (bg: string, fontSize = 16, fontWeight = 500) => {
  const whiteLc = getAPCALc('#ffffff', bg);
  const blackLc = getAPCALc('#000000', bg);
  const threshold = getAPCAThreshold(fontSize, fontWeight);

  if (whiteLc >= threshold) {return '#ffffff';}
  if (blackLc >= threshold) {return '#0f172a';}
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
};

const ensureAPCATextColor = (
  preferred: string,
  background: string,
  fontSize = 16,
  fontWeight = 500,
) => {
  const threshold = getAPCAThreshold(fontSize, fontWeight);
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = safeParseOklch(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness((color.l ?? 0.6) + lightnessIncrease) }));
};

const getDarkModeAccent = (hex: string, fallback = DEFAULT_BRAND_COLOR) => {
  const color = safeParseOklch(hex, fallback);
  const lightness = color.l ?? 0.62;
  const chroma = color.c ?? 0.14;

  return formatHex(oklch({
    ...color,
    l: lightness < 0.62 ? 0.68 : Math.min(lightness, 0.82),
    c: color.h == null ? Math.min(chroma, 0.02) : clampChroma(Math.max(chroma * 0.9, Math.min(chroma + 0.02, 0.14))),
  }));
};

export const getHarmonyColor = (primary: string) => {
  const color = safeParseOklch(primary, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, h: ((color.h ?? 0) + 30) % 360 }));
};

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: SpeedDialBrandMode,
) => {
  const normalizedPrimary = normalizeHex(primary, DEFAULT_BRAND_COLOR);

  if (mode === 'single') {
    return normalizedPrimary;
  }

  if (isValidHexColor(secondary)) {
    return normalizeHex(secondary, normalizedPrimary);
  }

  return getHarmonyColor(normalizedPrimary);
};

export interface SpeedDialHarmonyStatus {
  deltaE: number;
  similarity: number;
  isTooSimilar: boolean;
}

export interface SpeedDialAccessibilityPair {
  background: string;
  text: string;
  fontSize?: number;
  fontWeight?: number;
  label?: string;
}

export interface SpeedDialAccessibilityScore {
  minLc: number;
  failing: Array<SpeedDialAccessibilityPair & { lc: number; threshold: number }>;
}

export interface SpeedDialColorTokens {
  primary: string;
  secondary: string;
  neutralBackground: string;
  neutralSurface: string;
  neutralBorder: string;
  bodyText: string;
  mutedText: string;
  tooltipBg: string;
  tooltipText: string;
  separatorColor: string;
  overlayScrim: string;
  dockBackdrop: string;
  mainButtonBg: string;
  mainButtonText: string;
  mainButtonRing: string;
  actionBgDefault: string;
  actionText: string;
  actionHoverBg: string;
  actionStyleBg: Record<SpeedDialStyle, string>;
  actionStyleText: Record<SpeedDialStyle, string>;
  actionStyleBorder: Record<SpeedDialStyle, string>;
  labelPillBg: string;
  labelPillText: string;
  minimalBarBg: string;
  minimalIconColor: string;
  minimalHoverBg: string;
  glassSurface: string;
  glassBorder: string;
  pageMockTitle: string;
  pageMockLine: string;
  pageMockCard: string;
  plusTileBg: string;
  plusTileIcon: string;
}

export interface SpeedDialRenderableAction {
  key: string;
  icon: string;
  label: string;
  url: string;
  bgColor: string;
}

const normalizeActionText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const buildActionKey = (
  source: Record<string, unknown>,
  index: number,
  icon: string,
  label: string,
  url: string,
) => {
  const keyCandidate = source.uiKey ?? source.key ?? source.id;

  if (typeof keyCandidate === 'string' && keyCandidate.trim().length > 0) {
    return `key:${keyCandidate.trim()}`;
  }

  if (typeof keyCandidate === 'number') {
    return `key:${keyCandidate}`;
  }

  const contentKey = `${icon.trim()}|${label.trim()}|${url.trim()}`;
  if (contentKey.replaceAll('|', '').trim().length > 0) {
    return `content:${contentKey}`;
  }

  return `idx:${index}`;
};

const toActionRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

export const normalizeSpeedDialActions = (input: unknown): SpeedDialRenderableAction[] => {
  if (!Array.isArray(input)) {return [];}

  const duplicates = new Map<string, number>();

  return input.map((raw, index) => {
    const action = toActionRecord(raw);
    const icon = normalizeActionText(action.icon) || 'phone';
    const label = normalizeActionText(action.label);
    const url = normalizeActionText(action.url);
    const baseKey = buildActionKey(action, index, icon, label, url);
    const count = duplicates.get(baseKey) ?? 0;
    duplicates.set(baseKey, count + 1);

    const rawBgColor = normalizeActionText(action.bgColor);

    return {
      key: count === 0 ? baseKey : `${baseKey}::${count}`,
      icon,
      label,
      url,
      bgColor: rawBgColor,
    };
  });
};

export const getHarmonyStatus = (primary: string, secondary: string): SpeedDialHarmonyStatus => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryNormalized = normalizeHex(secondary, primaryNormalized);
  const delta = differenceEuclidean('oklch')(primaryNormalized, secondaryNormalized);
  const safeDelta = Number.isFinite(delta) ? delta : 1;
  const similarity = 1 - Math.min(safeDelta, 1);
  const deltaE = Math.round(safeDelta * 100);
  return {
    deltaE,
    similarity,
    isTooSimilar: deltaE < 20,
  };
};

export const getSpeedDialAccessibilityScore = (pairs: SpeedDialAccessibilityPair[]): SpeedDialAccessibilityScore => {
  const failing: SpeedDialAccessibilityScore['failing'] = [];
  let minLc = Number.POSITIVE_INFINITY;

  pairs.forEach((pair) => {
    const fontSize = pair.fontSize ?? 16;
    const fontWeight = pair.fontWeight ?? 500;
    const threshold = getAPCAThreshold(fontSize, fontWeight);
    const lc = getAPCALc(pair.text, pair.background);
    minLc = Math.min(minLc, lc);

    if (lc < threshold) {
      failing.push({ ...pair, lc, threshold });
    }
  });

  return {
    minLc: Number.isFinite(minLc) ? minLc : 0,
    failing,
  };
};

export const getSpeedDialColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: SpeedDialBrandMode;
}): SpeedDialColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);

  const neutralBackground = '#f8fafc';
  const neutralSurface = '#ffffff';
  const neutralBorder = '#e2e8f0';
  const bodyText = '#0f172a';
  const mutedText = '#64748b';
  const tooltipBg = '#0f172a';
  const tooltipText = getAPCATextColor(tooltipBg, 12, 500);
  const separatorColor = neutralBorder;
  const overlayScrim = 'rgba(2,6,23,0.62)';
  const actionBgDefault = secondaryResolved;
  const actionText = getAPCATextColor(actionBgDefault, 14, 600);
  const actionHoverBg = getSolidTint(secondaryResolved, 0.2);
  const mainButtonBg = primaryResolved;
  const mainButtonText = getAPCATextColor(mainButtonBg, 16, 700);
  const mainButtonRing = getSolidTint(primaryResolved, 0.42);
  const glassSurface = 'rgba(255,255,255,0.65)';
  const glassBorder = 'rgba(148,163,184,0.45)';
  const dockActionBg = secondaryResolved;
  const dockActionText = getAPCATextColor(dockActionBg, 14, 600);
  const builderBarBg = mainButtonBg;
  const builderBarText = mainButtonText;

  return {
    primary: primaryResolved,
    secondary: secondaryResolved,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    bodyText,
    mutedText,
    tooltipBg,
    tooltipText,
    separatorColor,
    overlayScrim,
    dockBackdrop: getSolidTint(primaryResolved, 0.46),
    mainButtonBg,
    mainButtonText,
    mainButtonRing,
    actionBgDefault,
    actionText,
    actionHoverBg,
    actionStyleBg: {
      fab: secondaryResolved,
      sidebar: secondaryResolved,
      pills: secondaryResolved,
      stack: secondaryResolved,
      dock: dockActionBg,
      minimal: neutralSurface,
      'builder-bar': builderBarBg,
    },
    actionStyleText: {
      fab: getAPCATextColor(secondaryResolved, 14, 600),
      sidebar: getAPCATextColor(secondaryResolved, 14, 600),
      pills: getAPCATextColor(secondaryResolved, 14, 600),
      stack: getAPCATextColor(secondaryResolved, 14, 600),
      dock: dockActionText,
      minimal: getAPCATextColor(neutralSurface, 14, 600),
      'builder-bar': builderBarText,
    },
    actionStyleBorder: {
      fab: neutralBorder,
      sidebar: neutralBorder,
      pills: neutralBorder,
      stack: neutralBorder,
      dock: neutralBorder,
      minimal: neutralBorder,
      'builder-bar': neutralBorder,
    },
    labelPillBg: tooltipBg,
    labelPillText: tooltipText,
    minimalBarBg: neutralSurface,
    minimalIconColor: ensureAPCATextColor(secondaryResolved, neutralSurface, 14, 600),
    minimalHoverBg: getSolidTint(secondaryResolved, 0.5),
    glassSurface,
    glassBorder,
    pageMockTitle: bodyText,
    pageMockLine: neutralBorder,
    pageMockCard: neutralSurface,
    plusTileBg: neutralBackground,
    plusTileIcon: mutedText,
  };
};

export const getSpeedDialDarkColorTokens = ({
  primary,
  secondary,
  mode,
}: {
  primary: string;
  secondary: string;
  mode: SpeedDialBrandMode;
}): SpeedDialColorTokens => {
  const primaryResolved = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const secondaryResolved = resolveSecondaryForMode(primaryResolved, secondary, mode);
  const primaryAccent = getDarkModeAccent(primaryResolved, DEFAULT_BRAND_COLOR);
  const secondaryAccent = mode === 'single'
    ? primaryAccent
    : getDarkModeAccent(secondaryResolved, primaryResolved);

  const neutralBackground = '#020617';
  const neutralSurface = '#0f172a';
  const elevatedSurface = '#111827';
  const neutralBorder = '#334155';
  const bodyText = '#f8fafc';
  const mutedText = '#cbd5e1';
  const tooltipBg = elevatedSurface;
  const tooltipText = bodyText;
  const actionBgDefault = secondaryAccent;
  const actionText = getAPCATextColor(actionBgDefault, 14, 600);
  const mainButtonBg = primaryAccent;
  const mainButtonText = getAPCATextColor(mainButtonBg, 16, 700);
  const minimalActionText = ensureAPCATextColor(secondaryAccent, elevatedSurface, 14, 600);

  return {
    primary: primaryAccent,
    secondary: secondaryAccent,
    neutralBackground,
    neutralSurface,
    neutralBorder,
    bodyText,
    mutedText,
    tooltipBg,
    tooltipText,
    separatorColor: neutralBorder,
    overlayScrim: 'rgba(2,6,23,0.72)',
    dockBackdrop: neutralSurface,
    mainButtonBg,
    mainButtonText,
    mainButtonRing: elevatedSurface,
    actionBgDefault,
    actionText,
    actionHoverBg: elevatedSurface,
    actionStyleBg: {
      fab: secondaryAccent,
      sidebar: secondaryAccent,
      pills: secondaryAccent,
      stack: secondaryAccent,
      dock: secondaryAccent,
      minimal: elevatedSurface,
      'builder-bar': mainButtonBg,
    },
    actionStyleText: {
      fab: getAPCATextColor(secondaryAccent, 14, 600),
      sidebar: getAPCATextColor(secondaryAccent, 14, 600),
      pills: getAPCATextColor(secondaryAccent, 14, 600),
      stack: getAPCATextColor(secondaryAccent, 14, 600),
      dock: getAPCATextColor(secondaryAccent, 14, 600),
      minimal: minimalActionText,
      'builder-bar': mainButtonText,
    },
    actionStyleBorder: {
      fab: neutralBorder,
      sidebar: neutralBorder,
      pills: neutralBorder,
      stack: neutralBorder,
      dock: neutralBorder,
      minimal: neutralBorder,
      'builder-bar': neutralBorder,
    },
    labelPillBg: tooltipBg,
    labelPillText: tooltipText,
    minimalBarBg: neutralSurface,
    minimalIconColor: minimalActionText,
    minimalHoverBg: elevatedSurface,
    glassSurface: neutralSurface,
    glassBorder: neutralBorder,
    pageMockTitle: bodyText,
    pageMockLine: neutralBorder,
    pageMockCard: neutralSurface,
    plusTileBg: elevatedSurface,
    plusTileIcon: mutedText,
  };
};

export const getSpeedDialThemeTokens = ({
  primary,
  secondary,
  mode,
  isDark = false,
}: {
  primary: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  isDark?: boolean;
}) => (
  isDark
    ? getSpeedDialDarkColorTokens({ primary, secondary, mode })
    : getSpeedDialColorTokens({ primary, secondary, mode })
);

export const resolveActionBgColor = (
  actionColor: string,
  tokens: SpeedDialColorTokens,
  style: SpeedDialStyle,
): string => {
  if (isValidHexColor(actionColor)) {
    return normalizeHex(actionColor, tokens.actionStyleBg[style]);
  }
  return tokens.actionStyleBg[style];
};

export const getSpeedDialValidationResult = ({
  primary,
  secondary,
  mode,
  actions = [],
}: {
  primary: string;
  secondary: string;
  mode: SpeedDialBrandMode;
  actions?: SpeedDialAction[];
}) => {
  const tokens = getSpeedDialColorTokens({ primary, secondary, mode });
  const harmonyStatus = mode === 'single'
    ? { deltaE: 100, similarity: 0, isTooSimilar: false }
    : getHarmonyStatus(tokens.primary, tokens.secondary);

  const normalizedActions = normalizeSpeedDialActions(actions);

  const accessibilityPairs: SpeedDialAccessibilityPair[] = [
    { background: tokens.mainButtonBg, text: tokens.mainButtonText, fontSize: 16, fontWeight: 700, label: 'main-button' },
    { background: tokens.tooltipBg, text: tokens.tooltipText, fontSize: 12, fontWeight: 500, label: 'tooltip' },
    ...normalizedActions.map((action, idx) => {
      const bg = resolveActionBgColor(action.bgColor, tokens, 'fab');
      const text = getAPCATextColor(bg, 14, 600);
      return {
        background: bg,
        text,
        fontSize: 14,
        fontWeight: 600,
        label: `action-${idx}`,
      };
    }),
  ];

  const accessibility = getSpeedDialAccessibilityScore(accessibilityPairs);

  return {
    tokens,
    resolvedSecondary: tokens.secondary,
    harmonyStatus,
    accessibility,
  };
};

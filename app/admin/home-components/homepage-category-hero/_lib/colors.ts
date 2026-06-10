import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { formatHex, oklch } from 'culori';

export type HomepageCategoryHeroBrandMode = 'single' | 'dual';

type BrandPalette = {
  solid: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  textOnSolid: string;
  textInteractive: string;
};

export type HomepageCategoryHeroTokens = {
  mode: HomepageCategoryHeroBrandMode;
  primary: BrandPalette;
  secondary: BrandPalette;
  neutral: {
    surface: string;
    surfaceMuted: string;
    surfaceAlt: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textSubtle: string;
    textInverse: string;
  };
  sidebar: {
    activeBg: string;
    activeText: string;
    activeBorder: string;
    inactiveText: string;
    inactiveHoverBg: string;
    inactiveHoverText: string;
    groupTitle: string;
  };
  topNav: {
    activeBg: string;
    activeText: string;
    inactiveText: string;
    inactiveHoverBg: string;
    inactiveHoverText: string;
    bullet: string;
  };
  menuLink: {
    text: string;
    hover: string;
    active: string;
  };
  softPill: {
    bg: string;
    text: string;
    hoverBg: string;
    hoverText: string;
    border: string;
  };
  panel: {
    background: string;
    border: string;
    mutedBackground: string;
  };
  control: {
    buttonBg: string;
    buttonBorder: string;
    buttonIcon: string;
    buttonHoverBg: string;
  };
  placeholder: {
    background: string;
    text: string;
    icon: string;
  };
};

const clampLightness = (value: number) => Math.min(Math.max(value, 0.08), 0.98);

const safeParseOklch = (input: string, fallback: string) => (
  oklch(input) ?? oklch(fallback) ?? oklch('#3b82f6')
);

const isValidHexColor = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

export const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: HomepageCategoryHeroBrandMode,
) => {
  if (mode === 'single') {
    return primary;
  }
  return isValidHexColor(secondary) ? secondary : primary;
};

const getTint = (hex: string, lightness: number, fallback: string) => {
  const color = safeParseOklch(hex, fallback);
  return formatHex(oklch({ ...color, l: clampLightness(color.l + lightness) }));
};

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
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;

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
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  const preferredLc = getAPCALc(preferred, background);

  if (preferredLc >= threshold) {
    return preferred;
  }

  return getAPCATextColor(background, fontSize, fontWeight);
};

const generatePalette = (hex: string, fallback: string): BrandPalette => {
  const solid = formatHex(safeParseOklch(hex, fallback));
  const surface = getTint(solid, 0.4, fallback);
  const surfaceStrong = getTint(solid, 0.32, fallback);
  const border = getTint(solid, 0.28, fallback);

  return {
    solid,
    surface,
    surfaceStrong,
    border,
    textOnSolid: getAPCATextColor(solid, 14, 600),
    textInteractive: ensureAPCATextColor(solid, '#ffffff', 14, 600),
  };
};

export const getHomepageCategoryHeroColors = (
  primary: string,
  secondary: string,
  mode: HomepageCategoryHeroBrandMode,
): HomepageCategoryHeroTokens => {
  const neutral = {
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    textInverse: '#ffffff',
  };

  const secondaryResolved = resolveSecondaryForMode(primary, secondary, mode);
  const primaryPalette = generatePalette(primary, '#3b82f6');
  const secondaryPalette = generatePalette(secondaryResolved, primaryPalette.solid);
  const sidebarActiveText = ensureAPCATextColor(primaryPalette.solid, neutral.surface, 14, 600);
  const softPillHoverText = ensureAPCATextColor(secondaryPalette.surface, neutral.surface, 14, 600);
  const softPillText = ensureAPCATextColor(secondaryPalette.textInteractive, secondaryPalette.surface, 14, 600);

  return {
    mode,
    primary: primaryPalette,
    secondary: secondaryPalette,
    neutral,
    sidebar: {
      activeBg: primaryPalette.surface,
      activeText: sidebarActiveText,
      activeBorder: primaryPalette.solid,
      inactiveText: neutral.textMuted,
      inactiveHoverBg: neutral.surfaceMuted,
      inactiveHoverText: neutral.text,
      groupTitle: secondaryPalette.textInteractive,
    },
    topNav: {
      activeBg: primaryPalette.solid,
      activeText: primaryPalette.textOnSolid,
      inactiveText: neutral.textMuted,
      inactiveHoverBg: neutral.surfaceMuted,
      inactiveHoverText: neutral.text,
      bullet: secondaryPalette.solid,
    },
    menuLink: {
      text: neutral.textMuted,
      hover: secondaryPalette.textInteractive,
      active: neutral.text,
    },
    softPill: {
      bg: secondaryPalette.surface,
      text: softPillText,
      hoverBg: secondaryPalette.surface,
      hoverText: softPillHoverText,
      border: secondaryPalette.border,
    },
    panel: {
      background: neutral.surface,
      border: secondaryPalette.border,
      mutedBackground: neutral.surfaceMuted,
    },
    control: {
      buttonBg: secondaryPalette.surface,
      buttonBorder: secondaryPalette.border,
      buttonIcon: neutral.textMuted,
      buttonHoverBg: neutral.surfaceMuted,
    },
    placeholder: {
      background: neutral.surfaceMuted,
      text: neutral.textSubtle,
      icon: neutral.textSubtle,
    },
  };
};

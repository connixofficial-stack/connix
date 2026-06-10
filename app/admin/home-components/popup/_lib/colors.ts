export interface PopupColorTokens {
  overlay: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  mutedText: string;
  subtleText: string;
  primary: string;
  primarySoft: string;
  primaryWash: string;
  primaryBorder: string;
  ring: string;
  shadow: string;
  premiumShadow: string;
  buttonText: string;
}

const opacityHex = (intensity: number, min: number, max: number) => {
  const safe = Math.min(100, Math.max(0, intensity));
  const value = Math.round(min + ((max - min) * safe) / 100);
  return value.toString(16).padStart(2, '0');
};

const mixPercent = (intensity: number, min: number, max: number) => {
  const safe = Math.min(100, Math.max(0, intensity));
  return Math.round(min + ((max - min) * safe) / 100);
};

const opacityValue = (intensity: number, min: number, max: number) => {
  const safe = Math.min(100, Math.max(0, intensity));
  return (min + ((max - min) * safe) / 100).toFixed(2);
};

export const getPopupColorTokens = (brandColor: string, intensity = 50): PopupColorTokens => ({
  overlay: `rgba(2, 6, 23, ${opacityValue(intensity, 0.35, 0.82)})`,
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  mutedText: '#64748b',
  subtleText: '#94a3b8',
  primary: brandColor,
  primarySoft: `color-mix(in srgb, ${brandColor} ${mixPercent(intensity, 35, 100)}%, #ffffff)`,
  primaryWash: '#f8fafc',
  primaryBorder: `color-mix(in srgb, ${brandColor} ${mixPercent(intensity, 50, 100)}%, #ffffff)`,
  ring: `${brandColor}${opacityHex(intensity, 36, 80)}`,
  shadow: '0 18px 44px rgba(15, 23, 42, 0.18)',
  premiumShadow: '0 24px 64px rgba(15, 23, 42, 0.22)',
  buttonText: '#ffffff',
});

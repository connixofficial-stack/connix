export type FontRegistryItem = {
  key: string;
  label: string;
  variable: string;
};

export const DEFAULT_FONT_KEY = 'be-vietnam-pro';

export const FONT_REGISTRY: FontRegistryItem[] = [
  { key: 'be-vietnam-pro', label: 'Be Vietnam Pro', variable: '--font-be-vietnam-pro' },
  { key: 'roboto', label: 'Roboto', variable: '--font-roboto' },
  { key: 'noto-sans', label: 'Noto Sans', variable: '--font-noto-sans' },
  { key: 'nunito', label: 'Nunito', variable: '--font-nunito' },
  { key: 'source-sans-three', label: 'Source Sans 3', variable: '--font-source-sans-3' },
  { key: 'merriweather', label: 'Merriweather', variable: '--font-merriweather' },
  { key: 'lora', label: 'Lora', variable: '--font-lora' },
  { key: 'montserrat', label: 'Montserrat', variable: '--font-montserrat' },
  { key: 'roboto-slab', label: 'Roboto Slab', variable: '--font-roboto-slab' },
  { key: 'noto-serif', label: 'Noto Serif', variable: '--font-noto-serif' },
];

export const FONT_REGISTRY_BY_KEY = Object.fromEntries(
  FONT_REGISTRY.map((font) => [font.key, font])
);

export const resolveFontVariable = (fontKey: string): string => {
  return FONT_REGISTRY_BY_KEY[fontKey]?.variable ?? FONT_REGISTRY_BY_KEY[DEFAULT_FONT_KEY]?.variable ?? '--font-be-vietnam-pro';
};

import type { ProductImageAspectRatio } from './image-aspect-ratio';

export type ProductImageFrameSourceType =
  | 'system_preset'
  | 'uploaded_overlay'
  | 'line_generator'
  | 'logo_generator';

export type ProductImageFrameStatus = 'active' | 'inactive';

export type ProductImageFrameCornerStyle = 'sharp' | 'rounded' | 'ornamental-light';

export type ProductImageFrameLineConfig = {
  strokeWidth: number;
  inset: number;
  radius: number;
  color: string;
  shadow?: string;
  cornerStyle: ProductImageFrameCornerStyle;
};

export type ProductImageFrameLogoConfig = {
  logoUrl: string;
  scale: number;
  opacity: number;
  x: number;
  y: number;
};

export type LegacyProductImageFrameLogoConfig = {
  logoUrl: string;
  placement: 'center' | 'corners';
  scale: number;
  opacity: number;
  inset: number;
};

export type ProductImageFrame = {
  _id: string;
  name: string;
  status: ProductImageFrameStatus;
  aspectRatio: ProductImageAspectRatio;
  sourceType: ProductImageFrameSourceType;
  overlayImageUrl?: string;
  overlayStorageId?: string | null;
  lineConfig?: ProductImageFrameLineConfig;
  logoConfig?: ProductImageFrameLogoConfig | LegacyProductImageFrameLogoConfig;
  seasonKey?: string;
  isSystemPreset: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ProductFramePresetTemplate = {
  key: string;
  name: string;
  seasonKey: string;
  sourceType: ProductImageFrameSourceType;
  lineConfig?: ProductImageFrameLineConfig;
};

export const PRODUCT_FRAME_SEASON_LABELS: Record<string, string> = {
  tet_duong_lich: 'Tết Dương lịch',
  tet_am_lich: 'Tết Âm lịch',
  noel: 'Noel',
  halloween: 'Halloween',
  sale_11_11: 'Sale 11/11',
  sale_12_12: 'Sale 12/12',
};

const DEFAULT_PRESET_TEMPLATES: ProductFramePresetTemplate[] = [
  {
    key: 'tet_duong_lich',
    seasonKey: 'tet_duong_lich',
    name: 'Tết Dương lịch (line đỏ/vàng)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 3,
      inset: 2,
      radius: 6,
      color: '#D62828',
      shadow: '0 0 6px rgba(214, 40, 40, 0.35)',
      cornerStyle: 'rounded',
    },
  },
  {
    key: 'tet_am_lich',
    seasonKey: 'tet_am_lich',
    name: 'Tết Âm lịch (line vàng)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 3,
      inset: 2,
      radius: 8,
      color: '#F4C430',
      shadow: '0 0 6px rgba(244, 196, 48, 0.35)',
      cornerStyle: 'rounded',
    },
  },
  {
    key: 'noel',
    seasonKey: 'noel',
    name: 'Noel (xanh lá/đỏ)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 2.5,
      inset: 2,
      radius: 6,
      color: '#1E8E3E',
      shadow: '0 0 6px rgba(30, 142, 62, 0.35)',
      cornerStyle: 'ornamental-light',
    },
  },
  {
    key: 'halloween',
    seasonKey: 'halloween',
    name: 'Halloween (cam tối)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 2.5,
      inset: 2,
      radius: 4,
      color: '#FF8C42',
      shadow: '0 0 6px rgba(255, 140, 66, 0.35)',
      cornerStyle: 'sharp',
    },
  },
  {
    key: 'sale_11_11',
    seasonKey: 'sale_11_11',
    name: 'Sale 11/11 (tím neon)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 2.5,
      inset: 2,
      radius: 6,
      color: '#7C3AED',
      shadow: '0 0 8px rgba(124, 58, 237, 0.4)',
      cornerStyle: 'rounded',
    },
  },
  {
    key: 'sale_12_12',
    seasonKey: 'sale_12_12',
    name: 'Sale 12/12 (xanh dương)',
    sourceType: 'line_generator',
    lineConfig: {
      strokeWidth: 2.5,
      inset: 2,
      radius: 6,
      color: '#2563EB',
      shadow: '0 0 8px rgba(37, 99, 235, 0.35)',
      cornerStyle: 'rounded',
    },
  },
];

export function getDefaultProductFramePresets(
  aspectRatio: ProductImageAspectRatio
): Array<ProductFramePresetTemplate & { aspectRatio: ProductImageAspectRatio }> {
  return DEFAULT_PRESET_TEMPLATES.map((preset) => ({
    ...preset,
    aspectRatio,
  }));
}

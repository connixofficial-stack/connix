import {
  DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO,
  PRODUCT_IMAGE_ASPECT_RATIO_CSS,
  PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS,
  isProductImageAspectRatio,
  type ProductImageAspectRatio,
} from '@/lib/products/image-aspect-ratio';

export type { ProductImageAspectRatio };
export { DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO, PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS, isProductImageAspectRatio };

export type ProductDetailLayoutStyle = 'classic' | 'modern' | 'minimal' | 'premium';

const ASPECT_RATIO_MAP: Record<ProductImageAspectRatio, string> = PRODUCT_IMAGE_ASPECT_RATIO_CSS;

const THUMBNAIL_ASPECT_RATIO_MAP: Partial<Record<ProductDetailLayoutStyle, Partial<Record<ProductImageAspectRatio, string>>>> = {
  classic: {
    wide169: '1 / 1',
  },
  modern: {
    wide169: '1 / 1',
  },
  minimal: {
    landscape43: '1 / 1',
    wide169: '1 / 1',
  },
  premium: {
    wide169: '1 / 1',
  },
};

const FRAME_MAX_WIDTH_MAP: Partial<Record<ProductDetailLayoutStyle, Partial<Record<ProductImageAspectRatio, string>>>> = {
  classic: {
    portrait916: 'w-full mx-auto max-w-[24rem] lg:max-w-[26rem]',
    portrait34: 'w-full mx-auto max-w-[31rem] lg:max-w-[34rem]',
  },
  modern: {
    portrait916: 'w-full mx-auto max-w-[23rem] lg:max-w-[25rem]',
    portrait34: 'w-full mx-auto max-w-[29rem] lg:max-w-[31rem]',
  },
  minimal: {
    portrait916: 'w-full mx-auto max-w-[23rem] lg:max-w-[25rem]',
    portrait34: 'w-full mx-auto max-w-[29rem] lg:max-w-[31rem]',
    wide169: 'w-full mx-auto max-w-[42rem]',
  },
  premium: {
    portrait916: 'w-full mx-auto max-w-[24rem] lg:max-w-[26rem]',
    portrait34: 'w-full mx-auto max-w-[31rem] lg:max-w-[34rem]',
  },
};

type VerticalThumbnailSlotsOptions = {
  frameHeight: number | null | undefined;
  thumbnailWidth: number;
  thumbnailAspectRatio: string;
  gap: number;
  arrowHeight?: number;
  imageCount: number;
  minSlots?: number;
};

const parseAspectRatioValue = (ratio: string): number | null => {
  const parts = ratio.split('/');
  if (parts.length !== 2) {
    return null;
  }
  const width = Number(parts[0].trim());
  const height = Number(parts[1].trim());
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) {
    return null;
  }
  return width / height;
};

export function getVerticalThumbnailSlots({
  frameHeight,
  thumbnailWidth,
  thumbnailAspectRatio,
  gap,
  arrowHeight = 0,
  imageCount,
  minSlots = 1,
}: VerticalThumbnailSlotsOptions): number {
  if (!frameHeight || frameHeight <= 0) {
    return Math.max(minSlots, 1);
  }
  const ratio = parseAspectRatioValue(thumbnailAspectRatio);
  if (!ratio || ratio <= 0) {
    return Math.max(minSlots, 1);
  }
  const thumbnailHeight = thumbnailWidth / ratio;
  if (thumbnailHeight <= 0) {
    return Math.max(minSlots, 1);
  }
  const slotsWithoutArrows = Math.floor((frameHeight + gap) / (thumbnailHeight + gap));
  const baseSlots = Math.max(minSlots, slotsWithoutArrows);
  if (imageCount > baseSlots && arrowHeight > 0) {
    const availableHeight = frameHeight - (arrowHeight * 2 + gap * 2);
    if (availableHeight <= 0) {
      return Math.max(minSlots, 1);
    }
    const slotsWithArrows = Math.floor((availableHeight + gap) / (thumbnailHeight + gap));
    return Math.max(minSlots, slotsWithArrows);
  }
  return baseSlots;
}

export function getProductImageFrameConfig(
  aspectRatio: ProductImageAspectRatio,
  layoutStyle: ProductDetailLayoutStyle
) {
  return {
    frameAspectRatio: ASPECT_RATIO_MAP[aspectRatio],
    frameWidthClassName: FRAME_MAX_WIDTH_MAP[layoutStyle]?.[aspectRatio] ?? 'w-full',
    thumbnailAspectRatio: THUMBNAIL_ASPECT_RATIO_MAP[layoutStyle]?.[aspectRatio] ?? ASPECT_RATIO_MAP[aspectRatio],
  };
}

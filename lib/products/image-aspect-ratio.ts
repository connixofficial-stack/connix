export type ProductImageAspectRatio =
  | 'square'
  | 'portrait34'
  | 'portrait916'
  | 'landscape43'
  | 'wide169';

export type CustomImageAspectRatio = {
  cssValue?: string;
  label: string;
  value: number;
};

export type ImageAspectRatioInput = ProductImageAspectRatio | CustomImageAspectRatio;

export const DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO: ProductImageAspectRatio = 'square';

export const PRODUCT_IMAGE_ASPECT_RATIO_OPTIONS: Array<{ label: string; value: ProductImageAspectRatio }> = [
  { label: 'Vuông (1:1)', value: 'square' },
  { label: 'Dọc 9:16', value: 'portrait916' },
  { label: 'Dọc 3:4', value: 'portrait34' },
  { label: 'Ngang 4:3', value: 'landscape43' },
  { label: 'Rộng 16:9', value: 'wide169' },
];

export const PRODUCT_IMAGE_ASPECT_RATIO_LABELS: Record<ProductImageAspectRatio, string> = {
  square: 'Vuông (1:1)',
  portrait916: 'Dọc 9:16',
  portrait34: 'Dọc 3:4',
  landscape43: 'Ngang 4:3',
  wide169: 'Rộng 16:9',
};

export const PRODUCT_IMAGE_ASPECT_RATIO_CSS: Record<ProductImageAspectRatio, string> = {
  square: '1 / 1',
  portrait916: '9 / 16',
  portrait34: '3 / 4',
  landscape43: '4 / 3',
  wide169: '16 / 9',
};

export const PRODUCT_IMAGE_ASPECT_RATIO_VALUES: Record<ProductImageAspectRatio, number> = {
  square: 1,
  portrait916: 9 / 16,
  portrait34: 3 / 4,
  landscape43: 4 / 3,
  wide169: 16 / 9,
};

export function getProductImageAspectRatioCssValue(aspectRatio: ImageAspectRatioInput): string {
  if (typeof aspectRatio !== 'string') {
    return aspectRatio.cssValue ?? `${aspectRatio.value} / 1`;
  }
  return PRODUCT_IMAGE_ASPECT_RATIO_CSS[aspectRatio];
}

export function getProductImageAspectRatioValue(aspectRatio: ImageAspectRatioInput): number {
  if (typeof aspectRatio !== 'string') {
    return aspectRatio.value;
  }
  return PRODUCT_IMAGE_ASPECT_RATIO_VALUES[aspectRatio];
}

export function getProductImageAspectRatioLabel(aspectRatio: ImageAspectRatioInput): string {
  if (typeof aspectRatio !== 'string') {
    return aspectRatio.label;
  }
  return PRODUCT_IMAGE_ASPECT_RATIO_LABELS[aspectRatio];
}

export function isProductImageAspectRatio(value: unknown): value is ProductImageAspectRatio {
  return typeof value === 'string' && value in PRODUCT_IMAGE_ASPECT_RATIO_CSS;
}

export function resolveProductImageAspectRatio(value: unknown): ProductImageAspectRatio {
  if (value === 'portrait45' || value === 'portrait23') {
    return 'portrait34';
  }
  if (value === 'landscape32') {
    return 'landscape43';
  }
  return isProductImageAspectRatio(value) ? value : DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO;
}

export function isAspectRatioMatch(
  size: { width: number; height: number },
  aspectRatio: ImageAspectRatioInput,
  tolerance: number = 0.02
): boolean {
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
    return false;
  }
  const ratio = size.width / size.height;
  return Math.abs(ratio - getProductImageAspectRatioValue(aspectRatio)) <= tolerance;
}

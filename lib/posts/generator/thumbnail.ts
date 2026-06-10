import type { GeneratorProduct } from './types';

export const resolveThumbnail = (products: GeneratorProduct[]): string | undefined => {
  const candidate = products.find((product) => product.image || product.images?.[0] || product.categoryImage);
  return candidate?.image ?? candidate?.images?.[0] ?? candidate?.categoryImage;
};

export type PreviewQuickAddAction = 'addToCart' | 'buyNow';

export type PreviewQuickAddProduct = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  hasVariants?: boolean;
};

type PreviewQuickAddProductLike = {
  _id?: string;
  id?: string | number;
  name: string;
  slug?: string | null;
  image?: string | null;
  price?: string | number | null;
  originalPrice?: string | number | null;
  salePrice?: number | null;
  priceValue?: number | null;
  salePriceValue?: number | null;
  stock?: number | null;
  hasVariants?: boolean;
};

const parsePrice = (value: string | number | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value.replaceAll(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildPreviewQuickAddProduct = (product: PreviewQuickAddProductLike): PreviewQuickAddProduct => {
  const id = String(product._id ?? product.id ?? '');
  return {
    _id: id,
    name: product.name,
    slug: product.slug ?? id,
    price: product.priceValue ?? parsePrice(product.price) ?? 0,
    salePrice: product.salePriceValue ?? product.salePrice ?? undefined,
    stock: product.stock ?? 999,
    image: product.image ?? undefined,
    hasVariants: product.hasVariants === true,
  };
};

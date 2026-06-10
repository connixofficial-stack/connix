import { getPublicPriceLabel } from '@/lib/products/public-price';

export type HomeComponentSaleMode = 'cart' | 'contact' | 'affiliate';

export const resolveSaleMode = (value?: string | null): HomeComponentSaleMode => {
  if (value === 'contact' || value === 'affiliate') {
    return value;
  }
  return 'cart';
};

export const getHomeComponentPriceLabel = ({
  saleMode,
  price,
  salePrice,
  isRangeFromVariant,
}: {
  saleMode: HomeComponentSaleMode;
  price?: number;
  salePrice?: number;
  isRangeFromVariant?: boolean;
}) => getPublicPriceLabel({ saleMode, price, salePrice, isRangeFromVariant });

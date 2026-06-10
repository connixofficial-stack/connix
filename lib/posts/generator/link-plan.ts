import type { GeneratorProduct, GeneratorRelatedProduct, InternalLinkItem, SaleMode } from './types';

const densityMap: Record<string, number> = {
  low: 2,
  medium: 4,
  high: 6,
};

export const buildInternalLinks = ({
  products,
  density,
  saleMode,
}: {
  products: GeneratorProduct[];
  density: 'low' | 'medium' | 'high';
  saleMode: SaleMode;
}): InternalLinkItem[] => {
  const limit = densityMap[density] ?? 4;
  type LinkableProduct =
    | Pick<GeneratorProduct, 'name' | 'slug' | 'affiliateLink' | 'categorySlug'>
    | Pick<GeneratorRelatedProduct, 'name' | 'slug' | 'affiliateLink' | 'categorySlug'>;
  const related = products.flatMap((product) => product.relatedProducts ?? []);
  const merged: LinkableProduct[] = [...products, ...related];
  const unique = new Map<string, LinkableProduct>();
  merged.forEach((product) => {
    if (!unique.has(product.slug)) {
      unique.set(product.slug, product);
    }
  });
  return Array.from(unique.values())
    .slice(0, limit)
    .map((product) => {
      if (saleMode === 'affiliate') {
        const link = product.affiliateLink?.trim();
        return link ? { label: product.name, href: link } : null;
      }
      return { label: product.name, href: product.categorySlug ? `/${product.categorySlug}/${product.slug}` : `/products/${product.slug}` };
    })
    .filter(Boolean) as InternalLinkItem[];
};

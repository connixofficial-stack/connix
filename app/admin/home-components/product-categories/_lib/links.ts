'use client';


export const getDefaultCategoryLink = (slug?: string) => slug ? `/products?category=${slug}` : '/products';

export const resolveProductCategoryHref = (
  item: { linkMode?: string; customLinkValue?: string },
  categorySlug?: string
) => {
  if (item.linkMode === 'custom' && item.customLinkValue?.trim()) {
    return item.customLinkValue.trim();
  }

  return getDefaultCategoryLink(categorySlug);
};

export const isCustomProductCategoryLink = (
  item: { linkMode?: string; customLinkValue?: string },
  categorySlug?: string
) => {
  const defaultHref = getDefaultCategoryLink(categorySlug);
  return item.linkMode === 'custom' && !!item.customLinkValue?.trim() && item.customLinkValue.trim() !== defaultHref;
};

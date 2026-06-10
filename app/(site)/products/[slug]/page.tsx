import React from 'react';
import ProductDetailPageShared from '../../_components/details/ProductDetailPage';
import ProductsPage from '../../_components/products/ProductsPage';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const client = getConvexClient();

  const resolvedContext = await client.query(api.ia.resolveProductLandingContext, {
    slugs: ['products', decodeURIComponent(slug)],
  });

  if (resolvedContext && resolvedContext.type === 'productTypeAttribute') {
    return (
      <ProductsPage 
        productTypeId={resolvedContext.productTypeId} 
        attributeFilter={{ 
          groupId: resolvedContext.groupId, 
          termId: resolvedContext.termId, 
          termSlug: resolvedContext.termSlug 
        }} 
      />
    );
  }

  return <ProductDetailPageShared params={params} />;
}

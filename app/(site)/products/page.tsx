'use client';

import dynamic from 'next/dynamic';

const ProductsPage = dynamic(() => import('../_components/products/ProductsPage'), { ssr: false });

export default ProductsPage;

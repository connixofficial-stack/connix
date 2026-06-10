'use client';

import dynamic from 'next/dynamic';

const ResourcesPage = dynamic(() => import('../_components/resources/ResourcesPage'), { ssr: false });

export default ResourcesPage;

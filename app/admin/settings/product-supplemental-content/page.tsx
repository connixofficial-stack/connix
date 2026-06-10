'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsProductSupplementalContentPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/settings/advanced?tab=product-supplemental');
  }, [router]);

  return null;
}

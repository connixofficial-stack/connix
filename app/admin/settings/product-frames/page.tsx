'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Route cũ /admin/settings/product-frames không còn dùng nữa.
// Redirect về /admin/settings/advanced để tránh 404.
export default function SettingsProductFramesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings/advanced');
  }, [router]);

  return null;
}

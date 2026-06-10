'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SnapshotEditPageWrapper({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin/home-components/snapshots/${snapshotId}/home-components`);
  }, [router, snapshotId]);

  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Đang chuyển sang trang quản lý component snapshot...
    </div>
  );
}

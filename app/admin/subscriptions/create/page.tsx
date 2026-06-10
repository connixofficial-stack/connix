'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleGuard } from '../../components/ModuleGuard';

const MODULE_KEY = 'subscriptions';

export default function SubscriptionsCreatePage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <SubscriptionsRedirect />
    </ModuleGuard>
  );
}

function SubscriptionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/subscriptions');
  }, [router]);

  return <div className="text-sm text-slate-400">Đang chuyển về danh sách gia hạn...</div>;
}

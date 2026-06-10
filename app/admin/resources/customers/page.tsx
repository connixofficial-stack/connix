'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { ResourceCustomersPanel } from '../components/ResourceCustomersPanel';
import { ModuleGuard } from '@/app/admin/components/ModuleGuard';

export default function ResourceCustomersPage() {
  return (
    <ModuleGuard moduleKey="resources">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Users className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Người mua và tải tài nguyên</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi khách hàng đã mua, tải và lịch sử sử dụng tài nguyên.</p>
            </div>
          </div>
        </div>

        <ResourceCustomersPanel showResourceColumn={true} />
      </div>
    </ModuleGuard>
  );
}

'use client';

import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@/app/admin/components/ui';
import type { SeoChecklistResult } from '@/lib/seo/checklist';

type SeoOverviewSummaryProps = {
  checklist: SeoChecklistResult | null;
  isLoading: boolean;
};

export const SeoOverviewSummary = ({ checklist, isLoading }: SeoOverviewSummaryProps) => {
  if (isLoading || !checklist) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-sm text-slate-500">
        Đang tải tổng quan SEO...
      </div>
    );
  }

  const criticalRemaining = checklist.items.filter((item) => item.severity === 'critical' && item.status !== 'pass').length;
  const totalIssues = checklist.items.filter((item) => item.status !== 'pass').length;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tổng quan SEO</p>
            <p className="text-xs text-slate-500">Còn {totalIssues} mục cần xử lý</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{checklist.summary.progressPercent}%</p>
            <p className="text-xs text-slate-500">Hoàn thành</p>
          </div>
        </div>
        <Progress value={checklist.summary.progressPercent} />
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-500" />
            {checklist.summary.completedWeight}/{checklist.summary.totalWeight} điểm
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            Critical còn {criticalRemaining}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-cyan-600" />
            Ưu tiên theo trọng số
          </div>
        </div>
      </div>
    </div>
  );
};

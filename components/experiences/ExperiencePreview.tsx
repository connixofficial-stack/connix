import React from 'react';
import { Card } from '@/app/admin/components/ui';

type ExperiencePreviewProps = {
  title: string;
  children: React.ReactNode;
};

export function ExperiencePreview({ title, children }: ExperiencePreviewProps) {
  return (
    <Card className="p-4">
      <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
          Preview: {title}
        </h3>
      </div>
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        {children}
      </div>
    </Card>
  );
}

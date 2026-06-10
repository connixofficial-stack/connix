import React from 'react';
import { Card } from '@/app/admin/components/ui';

interface ExperienceHintCardProps {
  hints: string[];
}

export function ExperienceHintCard({ hints }: ExperienceHintCardProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Gợi ý quan sát</h3>
      <ul className="text-xs text-slate-500 space-y-1">
        {hints.map((hint, index) => (
          <li key={index}>• {hint}</li>
        ))}
      </ul>
    </Card>
  );
}

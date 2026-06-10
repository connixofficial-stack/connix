'use client';

import React from 'react';
import { Badge, Card, cn } from '@/app/admin/components/ui';
import { listIndustries } from '@/lib/seed-templates';

type IndustrySelectionStepProps = {
  value: string | null;
  onChange: (value: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  'fashion-beauty': 'Thời trang & Làm đẹp',
  'technology': 'Công nghệ',
  'food-beverage': 'Ẩm thực & Đồ uống',
  'health-wellness': 'Sức khỏe & Wellness',
  'retail': 'Bán lẻ',
  'services': 'Dịch vụ',
  'business': 'Doanh nghiệp',
  'environment': 'Môi trường',
};

const INDUSTRIES = listIndustries();

export function IndustrySelectionStep({ value, onChange }: IndustrySelectionStepProps) {
  const grouped = INDUSTRIES.reduce<Record<string, typeof INDUSTRIES>>((acc, industry) => {
    const key = industry.category;
    acc[key] = acc[key] ? [...acc[key], industry] : [industry];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Chọn ngành hàng</h3>
        <p className="text-xs text-slate-500">
          Wizard sẽ tự điền dữ liệu, màu thương hiệu và cấu hình homepage phù hợp.
        </p>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {CATEGORY_LABELS[category] ?? category}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((industry) => (
                <Card
                  key={industry.key}
                  className={cn(
                    'cursor-pointer border p-4 transition-all',
                    value === industry.key
                      ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300'
                  )}
                  onClick={() => onChange(industry.key)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{industry.icon}</span>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {industry.name}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">{industry.description}</div>
                      <div className="flex flex-wrap gap-2">
                        {industry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: industry.brandColor }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

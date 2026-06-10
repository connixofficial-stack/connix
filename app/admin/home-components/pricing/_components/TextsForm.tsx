'use client';

import React from 'react';
import { Input, Label } from '../../../components/ui';
import { DEFAULT_PRICING_TEXTS } from '../_lib/constants';

interface TextsFormProps {
  texts: Record<string, string>;
  onUpdate: (texts: Record<string, string>) => void;
}

const TEXT_FIELDS = [
  { key: 'popularBadge', label: 'Badge "Phổ biến"', placeholder: DEFAULT_PRICING_TEXTS.popularBadge },
  { key: 'hotBadge', label: 'Badge "Hot"', placeholder: DEFAULT_PRICING_TEXTS.hotBadge },
  { key: 'recommendedBadge', label: 'Badge "Khuyên dùng"', placeholder: DEFAULT_PRICING_TEXTS.recommendedBadge },
  { key: 'featuredBadge', label: 'Badge "Nổi bật nhất"', placeholder: DEFAULT_PRICING_TEXTS.featuredBadge },
  { key: 'emptyStateTitle', label: 'Tiêu đề trống', placeholder: DEFAULT_PRICING_TEXTS.emptyStateTitle },
  { key: 'emptyStateDescription', label: 'Mô tả trống', placeholder: DEFAULT_PRICING_TEXTS.emptyStateDescription },
  { key: 'defaultPlanName', label: 'Tên gói mặc định', placeholder: DEFAULT_PRICING_TEXTS.defaultPlanName },
  { key: 'defaultButtonText', label: 'Text nút mặc định', placeholder: DEFAULT_PRICING_TEXTS.defaultButtonText },
  { key: 'defaultFeature', label: 'Tính năng mặc định', placeholder: DEFAULT_PRICING_TEXTS.defaultFeature },
  { key: 'startNowButton', label: 'Nút "Bắt đầu ngay"', placeholder: DEFAULT_PRICING_TEXTS.startNowButton },
  { key: 'selectButton', label: 'Nút "Chọn"', placeholder: DEFAULT_PRICING_TEXTS.selectButton },
];

export function TextsForm({ texts, onUpdate }: TextsFormProps) {
  const handleChange = (key: string, value: string) => {
    onUpdate({ ...texts, [key]: value });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Tùy chỉnh các text hiển thị trong component. Để trống để dùng giá trị mặc định.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TEXT_FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-xs">{field.label}</Label>
            <Input
              placeholder={field.placeholder}
              value={texts[field.key] || ''}
              onChange={(event) => { handleChange(field.key, event.target.value); }}
              className="text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

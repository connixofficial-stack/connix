'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import type { ClientsStyle } from '../_types';

interface ClientsTextsFormProps {
  style: ClientsStyle;
  texts: Record<string, string>;
  onUpdateText: (key: string, value: string) => void;
}

const TEXT_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  simpleGrid: [
    { key: 'subtitle', label: 'Subtitle', placeholder: 'Được tin tưởng bởi' },
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
  ],
  compactInline: [
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
  ],
  subtleMarquee: [
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
    { key: 'subtitle', label: 'Subtitle', placeholder: 'Đối tác' },
  ],
  grid: [
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
    { key: 'countLabel', label: 'Count Label', placeholder: 'đối tác' },
  ],
  carousel: [
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
    { key: 'scrollHint', label: 'Scroll Hint', placeholder: 'Vuốt để xem thêm' },
  ],
  featured: [
    { key: 'heading', label: 'Heading', placeholder: 'Khách hàng tin tưởng' },
    { key: 'subtitle', label: 'Subtitle', placeholder: 'Được tin tưởng bởi các thương hiệu hàng đầu' },
    { key: 'othersLabel', label: 'Others Label', placeholder: 'Và nhiều đối tác khác' },
  ],
};

export const ClientsTextsForm = ({ style, texts, onUpdateText }: ClientsTextsFormProps) => {
  const fields = TEXT_FIELDS[style] || [];

  if (fields.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cấu hình text cho layout {style}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">{field.label}</Label>
            <Input
              value={texts[field.key] || ''}
              onChange={(e) => onUpdateText(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

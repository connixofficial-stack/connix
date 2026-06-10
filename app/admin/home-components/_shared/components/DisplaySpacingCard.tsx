'use client';

import { Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import { SectionSpacingControl } from './SectionSpacingControl';
import type { SectionSpacing } from '../types/sectionSpacing';

export function DisplaySpacingCard({
  value,
  onChange,
}: {
  value: SectionSpacing;
  onChange: (value: SectionSpacing) => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 size={20} />
          Cấu hình hiển thị
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SectionSpacingControl value={value} onChange={onChange} />
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Label, cn } from '../../../components/ui';

export const ConfigJsonForm = ({
  value,
  onChange,
  title = 'Cấu hình JSON',
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  title?: string;
}) => {
  const [json, setJson] = useState(JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJson(JSON.stringify(value ?? {}, null, 2));
  }, [value]);

  const handleChange = (nextValue: string) => {
    setJson(nextValue);
    try {
      const parsed = JSON.parse(nextValue || '{}');
      setError(null);
      onChange(parsed);
    } catch {
      setError('JSON không hợp lệ. Vui lòng kiểm tra cú pháp.');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label>Config JSON</Label>
        <textarea
          value={json}
          onChange={(e) =>{  handleChange(e.target.value); }}
          className={cn(
            "w-full min-h-[200px] rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono",
            error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
          )}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-slate-500">Chỉnh sửa JSON để cập nhật cấu hình. Lưu ý: cần đúng định dạng JSON.</p>
      </CardContent>
    </Card>
  );
};

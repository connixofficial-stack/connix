'use client';

import React, { useMemo, useState } from 'react';
import { Check, Shuffle } from 'lucide-react';
import { Button, Card, cn } from '@/app/admin/components/ui';
import { getIndustryTemplate } from '@/lib/seed-templates';

type LogoSelectionStepProps = {
  industryKey: string | null;
  useSeedMauImages: boolean;
  selectedLogo: string | null;
  logoCustomized: boolean;
  onChange: (logo: string | null, customized: boolean) => void;
};

export function LogoSelectionStep({
  industryKey,
  useSeedMauImages,
  selectedLogo,
  logoCustomized,
  onChange,
}: LogoSelectionStepProps) {
  const [showPicker, setShowPicker] = useState(false);

  const template = useMemo(() => {
    if (!industryKey || !useSeedMauImages) {
      return null;
    }
    return getIndustryTemplate(industryKey);
  }, [industryKey, useSeedMauImages]);

  const logos = useMemo(() => template?.assets.logos ?? [], [template]);
  const displayLogo = selectedLogo;

  const handleRandomize = () => {
    if (logos.length === 0) {
      return;
    }
    const index = Math.floor(Math.random() * logos.length);
    onChange(logos[index], false);
  };

  const handleSelect = (logo: string) => {
    onChange(logo, true);
    setShowPicker(false);
  };

  if (!useSeedMauImages) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/40">
        <p className="text-sm text-slate-500">Đã tắt ảnh mẫu. Logo sẽ để trống và có thể upload sau.</p>
      </div>
    );
  }

  if (!template || logos.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg bg-amber-50 dark:bg-amber-950/20">
        <p className="text-sm text-amber-700 dark:text-amber-200 font-medium">Ngành hàng này chưa có logo mẫu.</p>
        <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">Logo sẽ để trống, bạn có thể upload sau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Chọn logo website</h3>
        <p className="text-xs text-slate-500">
          Logo này sẽ hiển thị ở header, footer và làm logo chính của website. Các logo còn lại sẽ tự động thành logo đối tác.
        </p>
      </div>

      {!showPicker ? (
        <div className="space-y-4">
          <Card className="p-8 flex flex-col items-center gap-4">
            {displayLogo && (
              <div className="h-20 flex items-center justify-center">
                <img
                  src={displayLogo}
                  alt="Logo preview"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomize}
                className="gap-2"
              >
                <Shuffle size={16} />
                Ngẫu nhiên khác
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowPicker(true)}>
                Tùy chỉnh
              </Button>
            </div>
          </Card>
          <p className="text-xs text-center text-slate-400">
            {logoCustomized
              ? '✓ Đã chọn logo cụ thể'
              : `Đang dùng logo ngẫu nhiên (${logos.length} lựa chọn)`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
            {logos.map((logo, index) => (
              <button
                key={logo}
                onClick={() => handleSelect(logo)}
                className={cn(
                  'relative aspect-square border-2 rounded-lg p-2 bg-white dark:bg-slate-900',
                  'hover:border-cyan-400 transition-all hover:shadow-md',
                  selectedLogo === logo
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <img
                  src={logo}
                  alt={`Logo ${index + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {selectedLogo === logo && (
                  <div className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPicker(false)} className="w-full">
            Đóng
          </Button>
        </div>
      )}
    </div>
  );
}

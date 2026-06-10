'use client';
 
import React from 'react';
import { AlertTriangle, Eye, Settings2 } from 'lucide-react';
import { Input, Label } from '../../../components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import { getCountdownValidationResult } from '../_lib/colors';
import type {
  CountdownBrandMode,
  CountdownConfigState,
} from '../_types';
import { AiCountdownImport } from './AiCountdownImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
 
interface CountdownFormProps {
  value: CountdownConfigState;
  onChange: (next: CountdownConfigState) => void;
  brandColor: string;
  secondary: string;
  mode: CountdownBrandMode;
  defaultExpanded?: boolean;
}
 
const toggleBoolean = (value: boolean) => !value;
 
export const CountdownForm = ({
  value,
  onChange,
  brandColor,
  secondary,
  mode,
  defaultExpanded = true,
}: CountdownFormProps) => {
  const validation = React.useMemo(
    () => getCountdownValidationResult({
      primary: brandColor,
      secondary,
      mode,
    }),
    [brandColor, secondary, mode],
  );
 
  const warnings = React.useMemo(() => {
    const messages: string[] = [];
 
    if (mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}).`);
    }
 
    return messages;
  }, [mode, validation]);
 
  const update = <K extends keyof CountdownConfigState>(key: K, nextValue: CountdownConfigState[K]) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };
 
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['content'],
    defaultExpanded
  );
 
  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
 
      <SubSection
        icon={Settings2}
        title="Nội dung Countdown"
        open={openSections.content}
        onOpenChange={(open) => toggleSection('content', open)}
        actions={<AiCountdownImport onApply={(patch) => onChange({ ...value, ...patch })} />}
        className="mb-6"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề chính</Label>
              <Input
                value={value.heading}
                onChange={(event) => { update('heading', event.target.value); }}
                placeholder="Flash Sale - Giảm giá sốc!"
              />
            </div>
            <div className="space-y-2">
              <Label>Tiêu đề phụ</Label>
              <Input
                value={value.subHeading}
                onChange={(event) => { update('subHeading', event.target.value); }}
                placeholder="Ưu đãi có hạn"
              />
            </div>
          </div>
 
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea
              value={value.description}
              onChange={(event) => { update('description', event.target.value); }}
              placeholder="Nhanh tay đặt hàng trước khi hết thời gian khuyến mãi"
              className="w-full min-h-[72px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thời gian kết thúc <span className="text-red-500">*</span></Label>
              <Input
                type="datetime-local"
                value={value.endDate}
                onChange={(event) => { update('endDate', event.target.value); }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Text giảm giá</Label>
              <Input
                value={value.discountText}
                onChange={(event) => { update('discountText', event.target.value); }}
                placeholder="-50%"
              />
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Text nút bấm</Label>
              <Input
                value={value.buttonText}
                onChange={(event) => { update('buttonText', event.target.value); }}
                placeholder="Mua ngay"
              />
            </div>
            <div className="space-y-2">
              <Label>Liên kết</Label>
              <Input
                value={value.buttonLink}
                onChange={(event) => { update('buttonLink', event.target.value); }}
                placeholder="/products"
              />
            </div>
          </div>
 
          <ImageFieldWithUpload
            label="Ảnh nền (tùy chọn)"
            value={value.backgroundImage}
            onChange={(url) => { update('backgroundImage', url); }}
            folder="countdown"
            aspectRatio="banner"
            quality={0.85}
            placeholder="https://example.com/banner.jpg"
          />
 
          <div className="space-y-2">
            <Label>Hiển thị đơn vị thời gian</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.showDays}
                  onChange={() => { update('showDays', toggleBoolean(value.showDays)); }}
                  className="w-4 h-4 rounded"
                />
                Ngày
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.showHours}
                  onChange={() => { update('showHours', toggleBoolean(value.showHours)); }}
                  className="w-4 h-4 rounded"
                />
                Giờ
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.showMinutes}
                  onChange={() => { update('showMinutes', toggleBoolean(value.showMinutes)); }}
                  className="w-4 h-4 rounded"
                />
                Phút
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.showSeconds}
                  onChange={() => { update('showSeconds', toggleBoolean(value.showSeconds)); }}
                  className="w-4 h-4 rounded"
                />
                Giây
              </label>
            </div>
          </div>
        </div>
      </SubSection>
      {warnings.length > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="space-y-2">
            {warnings.map((message, index) => (
              <div key={`${index}-${message}`} className="flex items-start gap-2">
                {message.includes('deltaE') ? <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> : <Eye size={14} className="mt-0.5 flex-shrink-0" />}
                <p>{message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

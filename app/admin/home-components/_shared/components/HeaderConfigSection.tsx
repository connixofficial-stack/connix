'use client';

import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Label, cn } from '@/app/admin/components/ui';
import { CopyTextButton } from '@/app/admin/components/CopyTextButton';
import { ToggleSwitch } from '@/components/modules/shared';
import { InputWithClear } from '../../stats/_components/InputWithClear';

interface HeaderConfigSectionProps {
  // State
  hideHeader: boolean;
  title: string;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  headerAlign: 'left' | 'center' | 'right';
  titleColorPrimary: boolean;
  subtitleAboveTitle: boolean;
  uppercaseText: boolean;
  showBadge: boolean;
  badgeText: string;
  
  // Setters
  onHideHeaderChange: (value: boolean) => void;
  onTitleChange: (value: string) => void;
  onShowTitleChange: (value: boolean) => void;
  onSubtitleChange: (value: string) => void;
  onShowSubtitleChange: (value: boolean) => void;
  onHeaderAlignChange: (value: 'left' | 'center' | 'right') => void;
  onTitleColorPrimaryChange: (value: boolean) => void;
  onSubtitleAboveTitleChange: (value: boolean) => void;
  onUppercaseTextChange: (value: boolean) => void;
  onShowBadgeChange: (value: boolean) => void;
  onBadgeTextChange: (value: string) => void;
  
  // UI State
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
  
  // Optional
  className?: string;
  sectionTitle?: string;
  titleRequired?: boolean;
  titleLabel?: string;
  titlePlaceholder?: string;
}

export function HeaderConfigSection({
  hideHeader,
  title,
  showTitle,
  subtitle,
  showSubtitle,
  headerAlign,
  titleColorPrimary,
  subtitleAboveTitle,
  uppercaseText,
  showBadge,
  badgeText,
  onHideHeaderChange,
  onTitleChange,
  onShowTitleChange,
  onSubtitleChange,
  onShowSubtitleChange,
  onHeaderAlignChange,
  onTitleColorPrimaryChange,
  onSubtitleAboveTitleChange,
  onUppercaseTextChange,
  onShowBadgeChange,
  onBadgeTextChange,
  expanded,
  onExpandedChange,
  className,
  sectionTitle = 'Tiêu đề và mô tả',
  titleRequired = true,
  titleLabel = 'Tiêu đề hiển thị',
  titlePlaceholder = 'Nhập tiêu đề component...',
}: HeaderConfigSectionProps) {
  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader>
        <div className="space-y-3">
          <div 
            className="cursor-pointer flex items-center justify-between"
            onClick={() => onExpandedChange(!expanded)}
          >
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle size={20} />
              {sectionTitle}
            </CardTitle>
            <ChevronDown 
              size={16} 
              className={cn(
                "transition-transform duration-200",
                expanded ? "rotate-180" : ""
              )}
            />
          </div>

          <div 
            className="flex items-center justify-between gap-3 rounded-lg border-2 border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-800 dark:bg-orange-950/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-orange-900 dark:text-orange-100">Ẩn toàn bộ header</Label>
              <p className="text-xs text-orange-700 dark:text-orange-300">Bật để ẩn title, subtitle và badge</p>
            </div>
            <ToggleSwitch 
              enabled={hideHeader} 
              onChange={() => {
                const newValue = !hideHeader;
                onHideHeaderChange(newValue);
                if (newValue) {
                  onExpandedChange(false);
                }
              }} 
            />
          </div>
        </div>
      </CardHeader>
      {expanded && !hideHeader && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              {titleLabel} {titleRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <InputWithClear
                  value={title}
                  onChange={onTitleChange}
                  required={titleRequired}
                  placeholder={titlePlaceholder}
                />
              </div>
              <CopyTextButton value={title} label="tiêu đề hiển thị" className="shrink-0" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm">Hiển thị title</Label>
                <p className="text-xs text-slate-500">Tắt để ẩn tiêu đề ngoài preview/site</p>
              </div>
              <ToggleSwitch enabled={showTitle} onChange={() => onShowTitleChange(!showTitle)} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm">Hiển thị subtitle</Label>
                <p className="text-xs text-slate-500">Tắt để ẩn dòng mô tả phụ</p>
              </div>
              <ToggleSwitch enabled={showSubtitle} onChange={() => onShowSubtitleChange(!showSubtitle)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subtitle</Label>
            <InputWithClear
              value={subtitle}
              onChange={onSubtitleChange}
              placeholder="Nhập subtitle hiển thị..."
            />
          </div>

          <div className="space-y-2">
            <Label>Badge text</Label>
            <InputWithClear
              value={badgeText}
              onChange={onBadgeTextChange}
              placeholder="Nhập text cho badge (ví dụ: DỊCH VỤ CỦA CHÚNG TÔI)"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm">Hiển thị badge</Label>
              <p className="text-xs text-slate-500">Bật để hiển thị badge ở trên title/subtitle</p>
            </div>
            <ToggleSwitch enabled={showBadge} onChange={() => onShowBadgeChange(!showBadge)} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm">Title màu chính</Label>
              <p className="text-xs text-slate-500">Bật để title hiển thị màu brand</p>
            </div>
            <ToggleSwitch enabled={titleColorPrimary} onChange={() => onTitleColorPrimaryChange(!titleColorPrimary)} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm">Subtitle ở trên title</Label>
              <p className="text-xs text-slate-500">Bật để hiển thị subtitle trước title</p>
            </div>
            <ToggleSwitch enabled={subtitleAboveTitle} onChange={() => onSubtitleAboveTitleChange(!subtitleAboveTitle)} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-sm">Viết in hoa</Label>
              <p className="text-xs text-slate-500">Bật để title và subtitle viết in hoa</p>
            </div>
            <ToggleSwitch enabled={uppercaseText} onChange={() => onUppercaseTextChange(!uppercaseText)} />
          </div>

          <div className="space-y-2">
            <Label>Căn tiêu đề / subtitle</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'left', label: 'Trái' },
                { value: 'center', label: 'Giữa' },
                { value: 'right', label: 'Phải' },
              ].map((option) => {
                const selected = headerAlign === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onHeaderAlignChange(option.value as 'left' | 'center' | 'right')}
                    className={cn(
                      'h-9 rounded-md border text-xs transition-colors',
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

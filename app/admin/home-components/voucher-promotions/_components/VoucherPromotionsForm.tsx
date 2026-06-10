'use client';

import React from 'react';
import { Database, Gift, icons, Search, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { InputWithClear } from '../../stats/_components/InputWithClear';
import { AVAILABLE_VOUCHER_PROMOTION_ICONS, DEFAULT_DEMO_VOUCHERS } from '../_lib/constants';
import type { DemoVoucherPromotionItem, VoucherPromotionsCornerRadius, VoucherPromotionsCtaVariant, VoucherPromotionsDesktopColumns, VoucherPromotionsSelectionMode } from '../_types';
import { AiDemoVouchersImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { ToggleSwitch } from '@/components/modules/shared';

const BadgePercentIcon = icons.BadgePercent;
const getIconComponent = (iconName: string) => icons[iconName as keyof typeof icons] || BadgePercentIcon;
const ICON_OPTIONS = AVAILABLE_VOUCHER_PROMOTION_ICONS
  .filter((icon) => icons[icon as keyof typeof icons])
  .map((icon) => ({ label: icon, value: icon }));

function IconCombobox({
  value,
  onChange,
  brandColor,
}: {
  value: string;
  onChange: (value: string) => void;
  brandColor: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) {return;}
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {return ICON_OPTIONS;}
    return ICON_OPTIONS.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [query]);

  const selectedValue = ICON_OPTIONS.find((option) => option.value === value)?.value ?? 'BadgePercent';
  const SelectedIcon = getIconComponent(selectedValue);

  return (
    <div ref={containerRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon size={16} style={{ color: brandColor }} />
          <span className="truncate">{selectedValue}</span>
        </span>
        <Search size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-2 w-[min(420px,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2 dark:border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm icon khuyến mãi..."
                className="h-9 pl-9"
              />
            </div>
          </div>
          <div className="grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto p-2 sm:grid-cols-5">
            {filtered.map((option) => {
              const IconComponent = getIconComponent(option.value);
              const selected = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-center text-xs transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                    <IconComponent size={15} style={{ color: brandColor }} />
                  </span>
                  <span className="w-full truncate leading-tight">{option.label}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-4 rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 sm:col-span-5">
                Không tìm thấy icon
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function VoucherPromotionsForm({
  selectionMode,
  onSelectionModeChange,
  limit,
  onLimitChange,
  ctaLabel,
  onCtaLabelChange,
  ctaUrl,
  onCtaUrlChange,
  showCta,
  onShowCtaChange,
  ctaVariant,
  onCtaVariantChange,
  spacing,
  onSpacingChange,
  demoVouchers,
  setDemoVouchers,
  canUseRealData,
  moduleLoaded,
  desktopColumns,
  onDesktopColumnsChange,
  cornerRadius,
  onCornerRadiusChange,
  iconName,
  onIconNameChange,
  brandColor,
  defaultExpanded = true,
}: {
  selectionMode: VoucherPromotionsSelectionMode;
  onSelectionModeChange: (mode: VoucherPromotionsSelectionMode) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  ctaLabel: string;
  onCtaLabelChange: (value: string) => void;
  ctaUrl: string;
  onCtaUrlChange: (value: string) => void;
  showCta: boolean;
  onShowCtaChange: (value: boolean) => void;
  ctaVariant: VoucherPromotionsCtaVariant;
  onCtaVariantChange: (value: VoucherPromotionsCtaVariant) => void;
  spacing: SectionSpacing;
  onSpacingChange: (value: SectionSpacing) => void;
  demoVouchers: DemoVoucherPromotionItem[];
  setDemoVouchers: React.Dispatch<React.SetStateAction<DemoVoucherPromotionItem[]>>;
  canUseRealData: boolean;
  moduleLoaded: boolean;
  desktopColumns: VoucherPromotionsDesktopColumns;
  onDesktopColumnsChange: (value: VoucherPromotionsDesktopColumns) => void;
  cornerRadius: VoucherPromotionsCornerRadius;
  onCornerRadiusChange: (value: VoucherPromotionsCornerRadius) => void;
  iconName: string;
  onIconNameChange: (value: string) => void;
  brandColor: string;
  defaultExpanded?: boolean;
}) {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['settings', 'source', 'demo'],
    defaultExpanded
  );

  const { add: addDemoItem, update: updateDemoItem, remove: removeDemoItem, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoVouchers,
    setDemoVouchers,
    {
      createEmpty: () => ({
        code: '',
        name: '',
        description: '',
        discountType: 'percent' as const,
        discountValue: 10,
      }),
      defaults: DEFAULT_DEMO_VOUCHERS,
      minItems: 1,
    },
  );

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 p-4">
        <AiDemoVouchersImport onApply={setDemoVouchers} />
        <FormSectionsToggleAllButton
          hasClosedSection={hasClosedSection}
          onToggleAll={handleToggleAll}
        />
        <HomeComponentDisplaySettingsSection
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={onCornerRadiusChange}
          spacing={spacing}
          onSpacingChange={onSpacingChange}
          className="relative z-20 overflow-visible"
          contentClassName="overflow-visible"
        >
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 md:col-span-2">
            <div className="space-y-0.5">
              <Label className="text-sm">Hiển thị nút xem tất cả ưu đãi</Label>
              <p className="text-xs text-slate-500">Tắt nếu chỉ muốn hiển thị đúng số voucher đã chọn.</p>
            </div>
            <ToggleSwitch enabled={showCta} onChange={() => onShowCtaChange(!showCta)} />
          </div>

          {showCta && (
            <>
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CTA label</Label>
                  <InputWithClear value={ctaLabel} onChange={onCtaLabelChange} placeholder="Xem tất cả ưu đãi" />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input value={ctaUrl} onChange={(e) => onCtaUrlChange(e.target.value)} placeholder="/promotions" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Kiểu hiển thị nút</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['button', 'Nút giữa'],
                    ['textRight', 'Chữ nhỏ góc phải'],
                  ] as const).map(([value, label]) => {
                    const selected = ctaVariant === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onCtaVariantChange(value)}
                        className={cn(
                          'h-9 rounded-md border text-xs transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Số cột desktop</Label>
            <div className="grid grid-cols-2 gap-2">
              {([3, 4] as const).map((option) => {
                const selected = desktopColumns === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onDesktopColumnsChange(option)}
                    className={cn(
                      'h-9 rounded-md border text-xs transition-colors',
                      selected
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                    )}
                  >
                    {option} cột
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon voucher</Label>
            <IconCombobox value={iconName} onChange={onIconNameChange} brandColor={brandColor} />
          </div>
        </HomeComponentDisplaySettingsSection>

        <SubSection
          icon={Database}
          title="Nguồn dữ liệu"
          open={openSections.source}
          onOpenChange={(open) => toggleSection('source', open)}
        >
          <div className="space-y-2">
            <Label>Chế độ dữ liệu</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelectionModeChange('auto')}
                disabled={!canUseRealData}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                  selectionMode === 'auto'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                Dữ liệu thực
              </button>
              <button
                type="button"
                onClick={() => onSelectionModeChange('demo')}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  selectionMode === 'demo'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                )}
              >
                Dữ liệu demo
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {canUseRealData
                ? 'Dữ liệu thực lấy từ module Quảng cáo/Promotions đang bật trong System.'
                : moduleLoaded
                  ? 'Module Quảng cáo/Promotions đang tắt, chỉ dùng được dữ liệu demo.'
                  : 'Đang kiểm tra trạng thái module Quảng cáo/Promotions...'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Số lượng voucher hiển thị</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={limit}
              onChange={(e) => onLimitChange(Number.parseInt(e.target.value, 10) || 4)}
            />
          </div>
        </SubSection>

        {selectionMode === 'demo' && (
          <SubSection
            icon={Gift}
            title="Dữ liệu demo"
            open={openSections.demo}
            onOpenChange={(open) => toggleSection('demo', open)}
          >
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={loadDefaultDemo}>
                Nạp mẫu mặc định
              </Button>
              <AiDemoVouchersImport buttonClassName="h-9" onApply={setDemoVouchers} />
            </div>

            <div className="space-y-3">
              {demoVouchers.map((voucher, index) => (
                <div key={voucher.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Voucher #{index + 1}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDemoItem(voucher.id)}
                      disabled={demoVouchers.length <= 1}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mã voucher</Label>
                      <InputWithClear value={voucher.code} onChange={(value) => updateDemoItem(voucher.id, { code: value })} placeholder="EGA50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tên ưu đãi</Label>
                      <InputWithClear value={voucher.name} onChange={(value) => updateDemoItem(voucher.id, { name: value })} placeholder="Giảm 15% đơn từ 500K" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Mô tả</Label>
                      <InputWithClear value={voucher.description ?? ''} onChange={(value) => updateDemoItem(voucher.id, { description: value })} placeholder="Áp dụng cho tất cả sản phẩm" />
                    </div>
                    <div className="space-y-2">
                      <Label>Loại giảm</Label>
                      <select
                        value={voucher.discountType}
                        onChange={(e) => updateDemoItem(voucher.id, { discountType: e.target.value as DemoVoucherPromotionItem['discountType'] })}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="percent">Phần trăm</option>
                        <option value="fixed">Số tiền</option>
                        <option value="free_shipping">Miễn phí vận chuyển</option>
                        <option value="gift">Quà tặng</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Giá trị giảm</Label>
                      <Input
                        type="number"
                        value={voucher.discountValue ?? 0}
                        onChange={(e) => updateDemoItem(voucher.id, { discountValue: Number.parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Giảm tối đa</Label>
                      <Input
                        type="number"
                        value={voucher.maxDiscountAmount ?? 0}
                        onChange={(e) => updateDemoItem(voucher.id, { maxDiscountAmount: Number.parseInt(e.target.value, 10) || undefined })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addDemoItem}>
              Thêm voucher demo
            </Button>
          </SubSection>
        )}
      </CardContent>
    </Card>
  );
}

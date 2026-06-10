'use client';

import React, { useState } from 'react';
import { AlertTriangle, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import { PricingPreview } from '../../pricing/_components/PricingPreview';
import { DEFAULT_PRICING_CONFIG } from '../../pricing/_lib/constants';
import type {
  PricingConfig,
  PricingEditorPlan,
  PricingHeaderAlign,
  PricingStyle,
} from '../../pricing/_types';
import { AiDemoPricingImport } from '../../product-list/_components/AiDemoProductsImport';

const DEFAULT_PLANS: PricingEditorPlan[] = [
  {
    id: 1,
    name: 'Cơ bản',
    price: '0',
    yearlyPrice: '0',
    period: '/tháng',
    features: ['Tính năng A', 'Tính năng B'],
    isPopular: false,
    buttonText: 'Bắt đầu',
    buttonLink: '/register',
  },
  {
    id: 2,
    name: 'Chuyên nghiệp',
    price: '299.000',
    yearlyPrice: '2.990.000',
    period: '/tháng',
    features: ['Tất cả Cơ bản', 'Tính năng C', 'Hỗ trợ email'],
    isPopular: true,
    buttonText: 'Mua ngay',
    buttonLink: '/checkout',
  },
  {
    id: 3,
    name: 'Doanh nghiệp',
    price: 'Liên hệ',
    yearlyPrice: 'Liên hệ',
    period: '',
    features: ['Tất cả Pro', 'Hỗ trợ 24/7', 'API Access'],
    isPopular: false,
    buttonText: 'Liên hệ',
    buttonLink: '/contact',
  },
];

type PricingMetaConfig = Pick<
  PricingConfig,
  'showBillingToggle' | 'monthlyLabel' | 'yearlyLabel' | 'yearlySavingText' | 'gridCols' | 'cornerRadius'
>;

const DEFAULT_META_CONFIG: PricingMetaConfig = {
  monthlyLabel: 'Hàng tháng',
  showBillingToggle: true,
  yearlyLabel: 'Hàng năm',
  yearlySavingText: 'Tiết kiệm 17%',
  gridCols: 3,
  cornerRadius: DEFAULT_PRICING_CONFIG.cornerRadius,
};

const sanitizeFeatures = (value: string) => (
  value
    .split(',')
    .map((feature) => feature.trim())
    .filter((feature) => feature.length > 0)
);

export default function PricingCreatePage() {
  const COMPONENT_TYPE = 'Pricing';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Bảng giá', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [pricingStyle, setPricingStyle] = useState<PricingStyle>('cards');
  const [pricingPlans, setPricingPlans] = useState<PricingEditorPlan[]>(DEFAULT_PLANS);
  const [pricingConfig, setPricingConfig] = useState<PricingMetaConfig>(DEFAULT_META_CONFIG);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  
  // Header config state
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'pricing', 'plans'], true);
  const [hideHeader, setHideHeader] = useState(DEFAULT_PRICING_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_PRICING_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_PRICING_CONFIG.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_PRICING_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<PricingHeaderAlign>(DEFAULT_PRICING_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_PRICING_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_PRICING_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_PRICING_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_PRICING_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_PRICING_CONFIG.badgeText ?? '');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      style: pricingStyle,
      subtitle,
      showBillingToggle: pricingConfig.showBillingToggle,
      monthlyLabel: pricingConfig.monthlyLabel,
      yearlyLabel: pricingConfig.yearlyLabel,
      yearlySavingText: pricingConfig.yearlySavingText,
      gridCols: pricingConfig.gridCols,
      cornerRadius: pricingConfig.cornerRadius,
      noBorderRadius: pricingConfig.cornerRadius === 'none',
      plans: pricingPlans.map((plan) => ({
        name: plan.name,
        price: plan.price,
        yearlyPrice: plan.yearlyPrice,
        period: plan.period,
        features: sanitizeFeatures((plan.features || []).join(', ')),
        isPopular: plan.isPopular,
        buttonText: plan.buttonText,
        buttonLink: plan.buttonLink,
      })),
      // Shared header config
      hideHeader,
      showTitle,
      showSubtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
      spacing,
      noVerticalMargin: spacing === 'none',
    });
  };

  const handleDragStart = (planId: number) => {
    setDraggedId(planId);
  };

  const handleDragOver = (event: React.DragEvent, planId: number) => {
    event.preventDefault();
    if (draggedId !== planId) {
      setDragOverId(planId);
    }
  };

  const handleDrop = (event: React.DragEvent, planId: number) => {
    event.preventDefault();
    if (!draggedId || draggedId === planId) {return;}

    const nextPlans = [...pricingPlans];
    const draggedIndex = nextPlans.findIndex((plan) => plan.id === draggedId);
    const dropIndex = nextPlans.findIndex((plan) => plan.id === planId);

    if (draggedIndex < 0 || dropIndex < 0) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const [moved] = nextPlans.splice(draggedIndex, 1);
    nextPlans.splice(dropIndex, 0, moved);
    setPricingPlans(nextPlans);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
      skipTitleInput={true}
    >
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

      <HeaderConfigSection
        hideHeader={hideHeader}
        title={title}
        showTitle={showTitle}
        subtitle={subtitle}
        showSubtitle={showSubtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        onHideHeaderChange={setHideHeader}
        onTitleChange={setTitle}
        onShowTitleChange={setShowTitle}
        onSubtitleChange={setSubtitle}
        onShowSubtitleChange={setShowSubtitle}
        onHeaderAlignChange={setHeaderAlign}
        onTitleColorPrimaryChange={setTitleColorPrimary}
        onSubtitleAboveTitleChange={setSubtitleAboveTitle}
        onUppercaseTextChange={setUppercaseText}
        onShowBadgeChange={setShowBadge}
        onBadgeTextChange={setBadgeText}
        expanded={openSections.header}
        onExpandedChange={(value) => toggleSection('header', value)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.pricing}
          onOpenChange={(value) => toggleSection('pricing', value)}
          cornerRadius={pricingConfig.cornerRadius ?? 'lg'}
          onCornerRadiusChange={(cornerRadius) => setPricingConfig((prev) => ({ ...prev, cornerRadius }))}
          spacing={spacing}
          onSpacingChange={setSpacing}
        >
          <div className="flex items-center gap-3">
            <Label>Hiển thị toggle Hàng tháng / Hàng năm:</Label>
            <div
              className={cn(
                'cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors',
                pricingConfig.showBillingToggle ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600',
              )}
              onClick={() => setPricingConfig({ ...pricingConfig, showBillingToggle: !pricingConfig.showBillingToggle })}
            >
              <div className={cn(
                'w-5 h-5 bg-white rounded-full transition-transform shadow',
                pricingConfig.showBillingToggle ? 'translate-x-2.5' : '-translate-x-2.5',
              )}></div>
            </div>
          </div>

            <div className="space-y-2">
              <Label>Số cột desktop</Label>
              <div className="grid grid-cols-2 gap-2">
                {[3, 4].map((option) => {
                  const selected = pricingConfig.gridCols === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPricingConfig((prev) => ({ ...prev, gridCols: option as 3 | 4 }))}
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

          {pricingConfig.showBillingToggle && (
            <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Label Hàng tháng</Label>
                <Input
                  value={pricingConfig.monthlyLabel}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, monthlyLabel: e.target.value })}
                  placeholder="Hàng tháng"
                />
              </div>
              <div className="space-y-2">
                <Label>Label Hàng năm</Label>
                <Input
                  value={pricingConfig.yearlyLabel}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, yearlyLabel: e.target.value })}
                  placeholder="Hàng năm"
                />
              </div>
              <div className="space-y-2">
                <Label>Text tiết kiệm</Label>
                <Input
                  value={pricingConfig.yearlySavingText}
                  onChange={(e) => setPricingConfig({ ...pricingConfig, yearlySavingText: e.target.value })}
                  placeholder="Tiết kiệm 17%"
                />
              </div>
            </div>
          )}
        </HomeComponentDisplaySettingsSection>
      </div>

      <div className="mb-6">
        <SubSection
          icon={AlertTriangle}
          title="Các gói giá"
          open={openSections.plans}
          onOpenChange={(value) => toggleSection('plans', value)}
          actions={(
            <>
            <AiDemoPricingImport onApply={(items) => setPricingPlans(items as PricingEditorPlan[])} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pricingPlans.length >= 4}
              onClick={(e) => {
                e.stopPropagation();
                if (pricingPlans.length >= 4) {return;}
                setPricingPlans((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    name: 'Gói mới',
                    price: '0',
                    yearlyPrice: '0',
                    period: '/tháng',
                    features: [],
                    isPopular: false,
                    buttonText: 'Chọn gói',
                    buttonLink: '/register',
                  },
                ]);
              }}
              className="gap-2"
            >
              <Plus size={14} /> Thêm gói
            </Button>
            </>
          )}
        >
        <div className="space-y-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              draggable
              onDragStart={() => handleDragStart(plan.id)}
              onDragOver={(e) => handleDragOver(e, plan.id)}
              onDrop={(e) => handleDrop(e, plan.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-move',
                dragOverId === plan.id && 'ring-2 ring-slate-950 dark:ring-white',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label>Gói: {plan.name}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isPopular: !p.isPopular } : p)));
                    }}
                    className={cn('text-xs', plan.isPopular && 'text-slate-950 dark:text-white')}
                  >
                    {plan.isPopular ? 'Phổ biến ✓' : 'Đánh dấu phổ biến'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 h-8 w-8"
                    onClick={() => {
                      setPricingPlans((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== plan.id) : prev));
                    }}
                    disabled={pricingPlans.length <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Tên gói"
                  value={plan.name}
                  onChange={(e) => {
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, name: e.target.value } : p)));
                  }}
                />
                <Input
                  placeholder="Giá hàng tháng"
                  value={plan.price}
                  onChange={(e) => {
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, price: e.target.value } : p)));
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {pricingConfig.showBillingToggle && (
                  <Input
                    placeholder="Giá hàng năm"
                    value={plan.yearlyPrice}
                    onChange={(e) => {
                      setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, yearlyPrice: e.target.value } : p)));
                    }}
                  />
                )}
                <Input
                  placeholder="Đơn vị (/tháng, /năm...)"
                  value={plan.period}
                  onChange={(e) => {
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, period: e.target.value } : p)));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Tính năng (mỗi dòng 1 tính năng)</Label>
                <textarea
                  value={(plan.features || []).join('\n')}
                  onChange={(e) => {
                    const features = e.target.value.split('\n').filter((f) => f.trim());
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, features } : p)));
                  }}
                  placeholder="Tính năng A&#10;Tính năng B&#10;Tính năng C"
                  className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Text nút"
                  value={plan.buttonText}
                  onChange={(e) => {
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, buttonText: e.target.value } : p)));
                  }}
                />
                <Input
                  placeholder="Link nút"
                  value={plan.buttonLink}
                  onChange={(e) => {
                    setPricingPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, buttonLink: e.target.value } : p)));
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        </SubSection>
      </div>

      <PricingPreview
        plans={pricingPlans}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={pricingStyle}
        onStyleChange={setPricingStyle}
        title={title}
        config={{
          showBillingToggle: pricingConfig.showBillingToggle,
          monthlyLabel: pricingConfig.monthlyLabel,
          yearlyLabel: pricingConfig.yearlyLabel,
          yearlySavingText: pricingConfig.yearlySavingText,
          cornerRadius: pricingConfig.cornerRadius,
          plans: pricingPlans.map((plan) => ({
            name: plan.name,
            price: plan.price,
            yearlyPrice: plan.yearlyPrice,
            period: plan.period,
            features: plan.features,
            isPopular: plan.isPopular,
            buttonText: plan.buttonText,
            buttonLink: plan.buttonLink,
          })),
        }}
        fontStyle={fontStyle}
        fontClassName="font-active"
        headerConfig={{
          subtitle,
          hideHeader,
          showTitle,
          showSubtitle,
          headerAlign,
          titleColorPrimary,
          subtitleAboveTitle,
          uppercaseText,
          showBadge,
          badgeText,
          spacing,
        }}
        gridCols={pricingConfig.gridCols}
      />
    </ComponentFormWrapper>
  );
}

'use client';

import React, { useState } from 'react';
import { GripVertical, Plus, Trash2, ListChecks } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { ImageFieldWithUpload } from '../../../components/ImageFieldWithUpload';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { FeaturesPreview } from '../../features/_components/FeaturesPreview';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';
import {
  createFeatureItem,
  FEATURE_ICON_PICKER_OPTIONS,
} from '../../features/_lib/constants';
import {
  DEFAULT_FEATURES_CORNER_RADIUS,
  DEFAULT_FEATURES_DESKTOP_COLUMNS,
  type FeatureItem,
  type FeaturesCornerRadius,
  type FeaturesDesktopColumns,
  type FeaturesStyle,
} from '../../features/_types';
import { AiDemoFeaturesImport } from '../../product-list/_components/AiDemoProductsImport';

const defaultItems: FeatureItem[] = [
  createFeatureItem({ description: 'Hiệu suất tối ưu với thời gian phản hồi dưới 100ms.', icon: 'Zap', id: 1, title: 'Tốc độ nhanh' }),
  createFeatureItem({ description: 'Mã hóa end-to-end, bảo vệ dữ liệu người dùng.', icon: 'Shield', id: 2, title: 'Bảo mật cao' }),
  createFeatureItem({ description: 'Tích hợp trí tuệ nhân tạo, tự động hóa quy trình.', icon: 'Cpu', id: 3, title: 'AI thông minh' }),
  createFeatureItem({ description: 'Hoạt động trên mọi thiết bị: Web, iOS, Android.', icon: 'Globe', id: 4, title: 'Đa nền tảng' }),
  createFeatureItem({ description: 'Cài đặt nhanh chóng, hướng dẫn chi tiết.', icon: 'Rocket', id: 5, title: 'Dễ triển khai' }),
  createFeatureItem({ description: 'Dashboard trực quan, theo dõi KPIs real-time.', icon: 'Target', id: 6, title: 'Phân tích sâu' }),
];

const DEMO_FEATURE_IMAGES = [
  '/demo/brand-banners/banner-1.webp',
  '/demo/brand-banners/banner-2.webp',
  '/demo/brand-banners/banner-3.webp',
  '/demo/brand-banners/banner-4.webp',
];

export default function FeaturesCreatePage() {
  const COMPONENT_TYPE = 'Features';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Tính năng nổi bật', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const headerState = useSectionHeaderState({
    hideHeader: false,
    showTitle: true,
    showSubtitle: true,
    subtitle: '',
    headerAlign: 'left',
    titleColorPrimary: false,
    subtitleAboveTitle: false,
    uppercaseText: false,
    showBadge: true,
    badgeText: '',
  });

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display', 'features'], true);

  const [featuresItems, setFeaturesItems] = useState<FeatureItem[]>(defaultItems);
  const [style, setStyle] = useState<FeaturesStyle>('carousel6');
  const [showIcons, setShowIcons] = useState(true);
  const [desktopColumns, setDesktopColumns] = useState<FeaturesDesktopColumns>(DEFAULT_FEATURES_DESKTOP_COLUMNS);
  const [cornerRadius, setCornerRadius] = useState<FeaturesCornerRadius>(DEFAULT_FEATURES_CORNER_RADIUS);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleUseDemoImages = () => {
    setStyle('carousel6');
    setFeaturesItems((currentItems) => {
      const sourceItems = currentItems.length > 0 ? currentItems : defaultItems;

      return sourceItems.map((item, index) => ({
        ...item,
        image: DEMO_FEATURE_IMAGES[index % DEMO_FEATURE_IMAGES.length],
      }));
    });
  };

  const dragProps = (id: number) => ({
    draggable: true,
    onDragStart: () => { setDraggedId(id); },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedId !== id) {
        setDragOverId(id);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {return;}

      setFeaturesItems((prev) => {
        const next = [...prev];
        const fromIndex = next.findIndex((item) => item.id === draggedId);
        const toIndex = next.findIndex((item) => item.id === id);
        if (fromIndex < 0 || toIndex < 0) {return prev;}
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });

      setDraggedId(null);
      setDragOverId(null);
    },
    onDragEnd: () => {
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: featuresItems,
      style,
      showIcons,
      hideHeader: headerState.hideHeader,
      showTitle: headerState.showTitle,
      subtitle: headerState.subtitle,
      showSubtitle: headerState.showSubtitle,
      headerAlign: headerState.headerAlign,
      titleColorPrimary: headerState.titleColorPrimary,
      subtitleAboveTitle: headerState.subtitleAboveTitle,
      uppercaseText: headerState.uppercaseText,
      showBadge: headerState.showBadge,
      badgeText: headerState.badgeText,
      spacing: headerState.spacing,
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
      noVerticalMargin: headerState.spacing === 'none',
    });
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
        hideHeader={headerState.hideHeader}
        title={title}
        showTitle={headerState.showTitle}
        subtitle={headerState.subtitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        onHideHeaderChange={headerState.setHideHeader}
        onTitleChange={setTitle}
        onShowTitleChange={headerState.setShowTitle}
        onSubtitleChange={headerState.setSubtitle}
        onShowSubtitleChange={headerState.setShowSubtitle}
        onHeaderAlignChange={headerState.setHeaderAlign}
        onTitleColorPrimaryChange={headerState.setTitleColorPrimary}
        onSubtitleAboveTitleChange={headerState.setSubtitleAboveTitle}
        onUppercaseTextChange={headerState.setUppercaseText}
        onShowBadgeChange={headerState.setShowBadge}
        onBadgeTextChange={headerState.setBadgeText}
        expanded={openSections.header}
        onExpandedChange={(open) => toggleSection('header', open)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(open) => toggleSection('display', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
          spacing={headerState.spacing}
          onSpacingChange={headerState.setSpacing}
        >
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="space-y-0.5">
                <Label htmlFor="features-show-icons" className="cursor-pointer text-sm">Hiển thị icon trong layout</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bật để hiện icon trong card và carousel.</p>
              </div>
              <input
                type="checkbox"
                id="features-show-icons"
                checked={showIcons}
                onChange={(event) => { setShowIcons(event.target.checked); }}
                className="h-4 w-4 rounded border-slate-300"
              />
            </div>

              <div className="space-y-2">
                <Label>Số cột desktop</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[3, 4].map((option) => {
                    const selected = desktopColumns === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDesktopColumns(option as FeaturesDesktopColumns)}
                        className={cn(
                          'h-9 rounded-md border text-xs transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        {option} cột
                      </button>
                    );
                  })}
                </div>
              </div>
        </HomeComponentDisplaySettingsSection>
      </div>

      <div className="mb-6">
        <SubSection
          icon={ListChecks}
          title="Danh sách tính năng"
          open={openSections.features}
          onOpenChange={(open) => toggleSection('features', open)}
          actions={(
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setFeaturesItems((prev) => [...prev, createFeatureItem({ icon: 'Zap' })])}
              >
                <Plus size={14} />
                Thêm
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
                Dùng ảnh demo
              </Button>
              <AiDemoFeaturesImport onApply={(items) => setFeaturesItems(items as FeatureItem[])} />
            </>
          )}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {featuresItems.map((item, idx) => (
            <div
              key={item.id}
              {...dragProps(item.id)}
              className={cn(
                'p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 cursor-grab active:cursor-grabbing transition-all min-w-0',
                draggedId === item.id && 'opacity-50',
                dragOverId === item.id && 'ring-2 ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-slate-400" />
                  <Label>Tính năng {idx + 1}</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 h-8 w-8"
                  onClick={() => {
                    if (featuresItems.length <= 1) {return;}
                    setFeaturesItems((prev) => prev.filter((feature) => feature.id !== item.id));
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {showIcons ? (
                  <IconPopoverPicker
                    value={item.icon}
                    onChange={(nextIcon) => {
                      setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, icon: nextIcon } : feature));
                    }}
                    options={FEATURE_ICON_PICKER_OPTIONS}
                    brandColor={primary}
                  />
                ) : null}

                <Input
                  placeholder="Tiêu đề"
                  value={item.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, title: nextTitle } : feature));
                  }}
                />
              </div>

              <Input
                placeholder="Mô tả ngắn"
                value={item.description}
                onChange={(e) => {
                  const nextDescription = e.target.value;
                  setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, description: nextDescription } : feature));
                }}
              />

              {(style === 'carousel6' || style === 'timeline') && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <ImageFieldWithUpload
                    label="Ảnh đại diện (Upload / URL / Dán / Cắt 1:1)"
                    value={item.image ?? ''}
                    onChange={(url) => {
                      setFeaturesItems((prev) => prev.map((feature) => feature.id === item.id ? { ...feature, image: url } : feature));
                    }}
                    folder="home-components"
                    aspectRatio="square"
                  />
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        </SubSection>
      </div>

      <FeaturesPreview
        items={featuresItems}
        sectionTitle={title}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={style}
        onStyleChange={setStyle}
        showIcons={showIcons}
        fontStyle={fontStyle}
        fontClassName="font-active"
        hideHeader={headerState.hideHeader}
        showTitle={headerState.showTitle}
        subtitle={headerState.subtitle}
        showSubtitle={headerState.showSubtitle}
        headerAlign={headerState.headerAlign}
        titleColorPrimary={headerState.titleColorPrimary}
        subtitleAboveTitle={headerState.subtitleAboveTitle}
        uppercaseText={headerState.uppercaseText}
        showBadge={headerState.showBadge}
        badgeText={headerState.badgeText}
        spacing={headerState.spacing}
        desktopColumns={desktopColumns}
        cornerRadius={cornerRadius}
      />
    </ComponentFormWrapper>
  );
}

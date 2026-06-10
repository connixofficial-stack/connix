'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { StatsPreview } from '../../stats/_components/StatsPreview';
import { StatsForm, type StatsFormItem } from '../../stats/_components/StatsForm';
import { DEFAULT_STATS_CONFIG } from '../../stats/_lib/constants';
import type { StatsBrandMode, StatsStyle, StatsHeaderAlign, StatsMediaPlacement, StatsMediaAlign, StatsSpacing, StatsCornerRadius } from '../../stats/_types';
import { cn } from '../../../components/ui';
import { ToggleSwitch } from '@/components/modules/shared';
import { Label } from '@/app/admin/components/ui';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

export default function StatsCreatePage() {
  const COMPONENT_TYPE = 'Stats';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Thống kê', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const brandMode: StatsBrandMode = mode === 'single' ? 'single' : 'dual';
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [statsItems, setStatsItems] = useState<StatsFormItem[]>([
    { description: 'Được tin chọn bởi hơn 1.000 khách hàng trên toàn quốc.', id: 1, iconType: 'none', label: 'Khách hàng', value: '1000+' },
    { description: 'Đồng hành cùng hơn 50 đối tác chiến lược.', id: 2, iconType: 'none', label: 'Đối tác', value: '50+' },
    { description: 'Tối ưu trải nghiệm để duy trì mức độ hài lòng cao.', id: 3, iconType: 'none', label: 'Hài lòng', value: '99%' },
    { description: 'Luôn sẵn sàng hỗ trợ khách hàng khi cần.', id: 4, iconType: 'none', label: 'Hỗ trợ', value: '24/7' }
  ]);
  const [style, setStyle] = useState<StatsStyle>('horizontal');
  
  // Header config state
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display', 'stats'], true);
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(DEFAULT_STATS_CONFIG.showTitle !== false);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_STATS_CONFIG.showSubtitle !== false);
  const [headerAlign, setHeaderAlign] = useState<StatsHeaderAlign>(DEFAULT_STATS_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [enableAnimation, setEnableAnimation] = useState(false);
  
  // Layout config state
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(DEFAULT_STATS_CONFIG.desktopColumns ?? 4);
  const [mediaPlacement, setMediaPlacement] = useState<StatsMediaPlacement>(DEFAULT_STATS_CONFIG.mediaPlacement ?? 'top');
  const [mediaAlign, setMediaAlign] = useState<StatsMediaAlign>(DEFAULT_STATS_CONFIG.mediaAlign ?? 'center');
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_STATS_CONFIG.backgroundImage ?? '');
  const [backgroundImageStorageId, setBackgroundImageStorageId] = useState<string | null>(null);
  const [fullWidth, setFullWidth] = useState(DEFAULT_STATS_CONFIG.fullWidth ?? false);
  const [spacing, setSpacing] = useState<StatsSpacing>(DEFAULT_STATS_CONFIG.spacing ?? 'normal');
  const [cornerRadius, setCornerRadius] = useState<StatsCornerRadius>(DEFAULT_STATS_CONFIG.cornerRadius ?? 'lg');

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: statsItems.map(s => ({
        label: s.label,
        value: s.value,
        description: s.description,
        iconType: s.iconType,
        iconName: s.iconName,
        iconUrl: s.iconUrl,
        iconStorageId: s.iconStorageId,
      })),
      style,
      hideHeader,
      showTitle,
      subtitle,
      showSubtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
      enableAnimation,
      desktopColumns,
      mediaPlacement,
      mediaAlign,
      backgroundImage,
      backgroundImageStorageId,
      fullWidth,
      spacing,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
      noVerticalMargin: spacing === 'none',
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
        className="mb-3"
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={openSections.display}
          onOpenChange={(value) => toggleSection('display', value)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={setCornerRadius}
          spacing={spacing}
          onSpacingChange={setSpacing}
        >
            <div className="space-y-2">
              <Label>Số cột desktop</Label>
              <div className="grid grid-cols-2 gap-2">
                {[3, 4].map((option) => {
                  const selected = desktopColumns === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDesktopColumns(option as 3 | 4)}
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

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm">Full width desktop</Label>
                <p className="text-xs text-slate-500">Bật để mở rộng toàn màn hình</p>
              </div>
              <ToggleSwitch enabled={fullWidth} onChange={() => setFullWidth((current) => !current)} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label className="text-sm">Animation số liệu</Label>
                <p className="text-xs text-slate-500">Bật để số liệu tăng từ 0 khi scroll vào</p>
              </div>
              <ToggleSwitch enabled={enableAnimation} onChange={() => setEnableAnimation((current) => !current)} />
            </div>
        </HomeComponentDisplaySettingsSection>
      </div>

      <StatsForm 
        items={statsItems} 
        onChange={setStatsItems}
        mediaPlacement={mediaPlacement}
        mediaAlign={mediaAlign}
        backgroundImage={backgroundImage}
        backgroundImageStorageId={backgroundImageStorageId}
        onMediaPlacementChange={setMediaPlacement}
        onMediaAlignChange={setMediaAlign}
        onBackgroundImageChange={(url, storageId) => {
          setBackgroundImage(url);
          setBackgroundImageStorageId(storageId ?? null);
        }}
        className="mb-4"
        openSections={openSections}
        onToggleSection={toggleSection}
        showToggleAll={false}
      />

      <StatsPreview
        items={statsItems}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={style}
        onStyleChange={setStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
        title={title}
        showTitle={showTitle}
        showSubtitle={showSubtitle}
        subtitle={subtitle}
        headerAlign={headerAlign}
        desktopColumns={desktopColumns}
        mediaPlacement={mediaPlacement}
        mediaAlign={mediaAlign}
        backgroundImage={backgroundImage}
        fullWidth={fullWidth}
        spacing={spacing}
        cornerRadius={cornerRadius}
        hideHeader={hideHeader}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        enableAnimation={enableAnimation}
      />
    </ComponentFormWrapper>
  );
}

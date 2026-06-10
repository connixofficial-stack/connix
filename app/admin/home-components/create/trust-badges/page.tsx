'use client';

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { useSectionHeaderState } from '../../_shared/hooks/useSectionHeaderState';
import { TrustBadgesPreview } from '../../gallery/_components/TrustBadgesPreview';
import { DEFAULT_STACK_DESCRIPTION, DEFAULT_STACK_HEADING, DEFAULT_TRUST_CUE_TEXT } from '../../gallery/_components/TrustBadgesSectionShared';
import { TrustBadgesForm } from '../../trust-badges/_components/TrustBadgesForm';
import {
  DEFAULT_TRUST_BADGES_CORNER_RADIUS,
  type GalleryItem,
  type TrustBadgesCornerRadius,
  type TrustBadgesStyle,
} from '../../gallery/_types';

interface TrustBadgeItem extends GalleryItem {
  id: string | number;
  url: string;
  link: string;
  name?: string;
}

const DEMO_TRUST_BADGE_ITEMS: TrustBadgeItem[] = [
  { id: 'demo-1', link: '', name: 'ISO 9001', url: '/demo/trust-badges/certificate-1.png' },
  { id: 'demo-2', link: '', name: 'Chứng nhận chất lượng', url: '/demo/trust-badges/certificate-2.png' },
  { id: 'demo-3', link: '', name: 'Đối tác xác thực', url: '/demo/trust-badges/certificate-3.png' },
  { id: 'demo-4', link: '', name: 'Giải thưởng thương hiệu', url: '/demo/trust-badges/certificate-4.png' },
  { id: 'demo-5', link: '', name: 'Cam kết xanh', url: '/demo/trust-badges/certificate-5.png' },
  { id: 'demo-6', link: '', name: 'Bảo mật giao dịch', url: '/demo/trust-badges/certificate-6.png' },
];

export default function TrustBadgesCreatePage() {
  const COMPONENT_TYPE = 'TrustBadges';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Chứng nhận', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [trustBadgeItems, setTrustBadgeItems] = useState<TrustBadgeItem[]>([
    { id: 'item-1', link: '', name: '', url: '' },
    { id: 'item-2', link: '', name: '', url: '' }
  ]);
  const [trustBadgesStyle, setTrustBadgesStyle] = useState<TrustBadgesStyle>('cards');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(4);
  const [cornerRadius, setCornerRadius] = useState<TrustBadgesCornerRadius>(DEFAULT_TRUST_BADGES_CORNER_RADIUS);
  const [showBorder] = useState(true);
  const [trustCueText, setTrustCueText] = useState(DEFAULT_TRUST_CUE_TEXT);
  const [stackHeading, setStackHeading] = useState(DEFAULT_STACK_HEADING);
  const [stackDescription, setStackDescription] = useState(DEFAULT_STACK_DESCRIPTION);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header'], true);
  const headerState = useSectionHeaderState({
    badgeText: 'Được tin chọn',
    headerAlign: 'center',
    showBadge: true,
    subtitle: 'Những cam kết và chứng nhận giúp khách hàng yên tâm mua sắm.',
    titleColorPrimary: true,
  });

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      items: trustBadgeItems.map((item) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
      style: trustBadgesStyle,
      desktopColumns,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
      showBorder,
      trustCueText,
      stackHeading,
      stackDescription,
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
      noVerticalMargin: headerState.spacing === 'none',
    });
  };

  const handleUseDemoImages = () => {
    setTrustBadgeItems(DEMO_TRUST_BADGE_ITEMS);
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
        onExpandedChange={(value) => toggleSection('header', value)}
        titleRequired={true}
        titleLabel="Tiêu đề hiển thị"
        titlePlaceholder="Nhập tiêu đề component..."
      />

      <TrustBadgesForm
        items={trustBadgeItems}
        setItems={setTrustBadgeItems}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        desktopColumns={desktopColumns}
        setDesktopColumns={setDesktopColumns}
        selectedStyle={trustBadgesStyle}
        trustCueText={trustCueText}
        setTrustCueText={setTrustCueText}
        stackHeading={stackHeading}
        setStackHeading={setStackHeading}
        stackDescription={stackDescription}
        setStackDescription={setStackDescription}
        spacing={headerState.spacing}
        setSpacing={headerState.setSpacing}
        onAiImport={(items) => setTrustBadgeItems(items as TrustBadgeItem[])}
        actions={(
          <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
            Dùng ảnh demo
          </Button>
        )}
      />

      <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Kích thước ảnh chứng nhận tối ưu</p>
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              {trustBadgesStyle === 'grid' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Grid</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Grid chứng nhận dạng giấy đứng</p>
                </div>
              )}
              {trustBadgesStyle === 'cards' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Cards</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Feature cards lớn cho chứng nhận dọc</p>
                </div>
              )}
              {trustBadgesStyle === 'stack' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Stack</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Trust proof strips với thumbnail giấy đứng</p>
                </div>
              )}
              {trustBadgesStyle === 'wall' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Wall</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Khung ảnh dọc kiểu treo tường</p>
                </div>
              )}
              {trustBadgesStyle === 'carousel' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Carousel</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Horizontal carousel với chứng nhận dọc</p>
                </div>
              )}
              {trustBadgesStyle === 'seal' && (
                <div className="space-y-1">
                  <p><strong className="text-emerald-900 dark:text-emerald-100">Seal</strong></p>
                  <p>• Ảnh: <strong>A4 dọc</strong> (tỷ lệ 210:297)</p>
                  <p className="text-emerald-500 dark:text-emerald-400 italic">Layout: Hub xác thực + thumbnail chứng nhận dọc</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TrustBadgesPreview
        items={trustBadgeItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={trustBadgesStyle}
        onStyleChange={setTrustBadgesStyle}
        desktopColumns={desktopColumns}
        config={{
          badgeText: headerState.badgeText,
          cornerRadius,
          noBorderRadius: cornerRadius === 'none',
          showBorder,
          trustCueText,
          stackHeading,
          stackDescription,
          spacing: headerState.spacing,
          noVerticalMargin: headerState.spacing === 'none',
          headerAlign: headerState.headerAlign,
          heading: title,
          hideHeader: headerState.hideHeader,
          showBadge: headerState.showBadge,
          showSubtitle: headerState.showSubtitle,
          showTitle: headerState.showTitle,
          subHeading: headerState.subtitle,
          subtitleAboveTitle: headerState.subtitleAboveTitle,
          titleColorPrimary: headerState.titleColorPrimary,
          uppercaseText: headerState.uppercaseText,
        }}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}

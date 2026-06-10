'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { VoucherPromotionsPreview } from '../../voucher-promotions/_components/VoucherPromotionsPreview';
import { VoucherPromotionsForm } from '../../voucher-promotions/_components/VoucherPromotionsForm';
import { normalizeVoucherLimit } from '@/lib/home-components/voucher-promotions';
import {
  DEFAULT_VOUCHER_PROMOTIONS_CONFIG,
  normalizeDemoVouchers,
  normalizeVoucherPromotionsCornerRadius,
  normalizeVoucherPromotionsTexts,
} from '../../voucher-promotions/_lib/constants';
import type { DemoVoucherPromotionItem, VoucherPromotionItem, VoucherPromotionsConfigState } from '../../voucher-promotions/_types';

export default function VoucherPromotionsCreatePage() {
  const COMPONENT_TYPE = 'VoucherPromotions';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Voucher khuyến mãi', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;
  const [voucherConfig, setVoucherConfig] = useState<VoucherPromotionsConfigState>(DEFAULT_VOUCHER_PROMOTIONS_CONFIG);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], true);
  const [demoVouchers, setDemoVouchers] = useState<DemoVoucherPromotionItem[]>(DEFAULT_VOUCHER_PROMOTIONS_CONFIG.demoVouchers);
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  const canUseRealData = promotionsModule?.enabled === true;
  const realVouchers = useQuery(
    api.promotions.listPublicVouchers,
    voucherConfig.selectionMode === 'auto' && canUseRealData ? { limit: normalizeVoucherLimit(voucherConfig.limit) } : 'skip',
  ) as VoucherPromotionItem[] | undefined;

  const onSubmit = (event: React.FormEvent) => {
    void handleSubmit(event, {
      ...voucherConfig,
      demoVouchers: voucherConfig.selectionMode === 'demo' ? normalizeDemoVouchers(demoVouchers) : [],
      limit: normalizeVoucherLimit(voucherConfig.limit),
      cornerRadius: normalizeVoucherPromotionsCornerRadius(voucherConfig.cornerRadius),
      texts: normalizeVoucherPromotionsTexts({ ...voucherConfig.texts, heading: title }),
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
      skipTitleInput
    >
      <HeaderConfigSection
        hideHeader={voucherConfig.hideHeader ?? false}
        title={title}
        showTitle={voucherConfig.showTitle ?? true}
        subtitle={voucherConfig.subtitle ?? voucherConfig.texts.description}
        showSubtitle={voucherConfig.showSubtitle ?? true}
        headerAlign={voucherConfig.headerAlign ?? 'left'}
        titleColorPrimary={voucherConfig.titleColorPrimary ?? false}
        subtitleAboveTitle={voucherConfig.subtitleAboveTitle ?? false}
        uppercaseText={voucherConfig.uppercaseText ?? false}
        showBadge={voucherConfig.showBadge ?? true}
        badgeText={voucherConfig.badgeText ?? ''}
        onHideHeaderChange={(value) => setVoucherConfig((prev) => ({ ...prev, hideHeader: value }))}
        onTitleChange={(value) => {
          setTitle(value);
          setVoucherConfig((prev) => ({ ...prev, texts: { ...prev.texts, heading: value } }));
        }}
        onShowTitleChange={(value) => setVoucherConfig((prev) => ({ ...prev, showTitle: value }))}
        onSubtitleChange={(value) => setVoucherConfig((prev) => ({ ...prev, subtitle: value, texts: { ...prev.texts, description: value } }))}
        onShowSubtitleChange={(value) => setVoucherConfig((prev) => ({ ...prev, showSubtitle: value }))}
        onHeaderAlignChange={(value) => setVoucherConfig((prev) => ({ ...prev, headerAlign: value }))}
        onTitleColorPrimaryChange={(value) => setVoucherConfig((prev) => ({ ...prev, titleColorPrimary: value }))}
        onSubtitleAboveTitleChange={(value) => setVoucherConfig((prev) => ({ ...prev, subtitleAboveTitle: value }))}
        onUppercaseTextChange={(value) => setVoucherConfig((prev) => ({ ...prev, uppercaseText: value }))}
        onShowBadgeChange={(value) => setVoucherConfig((prev) => ({ ...prev, showBadge: value }))}
        onBadgeTextChange={(value) => setVoucherConfig((prev) => ({ ...prev, badgeText: value }))}
        expanded={headerOpenSections.header}
        onExpandedChange={(open) => toggleHeaderSection('header', open)}
        titleLabel="Tiêu đề section"
        titlePlaceholder="VD: Voucher khuyến mãi, Ưu đãi hôm nay..."
      />

      <VoucherPromotionsForm
        selectionMode={voucherConfig.selectionMode}
        onSelectionModeChange={(value) => setVoucherConfig((prev) => ({ ...prev, selectionMode: value }))}
        limit={voucherConfig.limit}
        onLimitChange={(value) => setVoucherConfig((prev) => ({ ...prev, limit: value }))}
        ctaLabel={voucherConfig.texts.ctaLabel}
        onCtaLabelChange={(value) => setVoucherConfig((prev) => ({ ...prev, texts: { ...prev.texts, ctaLabel: value } }))}
        ctaUrl={voucherConfig.ctaUrl ?? '/promotions'}
        onCtaUrlChange={(value) => setVoucherConfig((prev) => ({ ...prev, ctaUrl: value }))}
        showCta={voucherConfig.showCta ?? true}
        onShowCtaChange={(value) => setVoucherConfig((prev) => ({ ...prev, showCta: value }))}
        ctaVariant={voucherConfig.ctaVariant ?? 'button'}
        onCtaVariantChange={(value) => setVoucherConfig((prev) => ({ ...prev, ctaVariant: value }))}
        spacing={voucherConfig.spacing ?? 'normal'}
        onSpacingChange={(value) => setVoucherConfig((prev) => ({ ...prev, spacing: value }))}
        demoVouchers={demoVouchers}
        setDemoVouchers={setDemoVouchers}
        canUseRealData={canUseRealData}
        moduleLoaded={promotionsModule !== undefined}
        desktopColumns={voucherConfig.desktopColumns ?? 4}
        onDesktopColumnsChange={(value) => setVoucherConfig((prev) => ({ ...prev, desktopColumns: value }))}
        cornerRadius={voucherConfig.cornerRadius ?? 'lg'}
        onCornerRadiusChange={(value) => setVoucherConfig((prev) => ({ ...prev, cornerRadius: value }))}
        iconName={voucherConfig.iconName ?? 'BadgePercent'}
        onIconNameChange={(value) => setVoucherConfig((prev) => ({ ...prev, iconName: value }))}
        brandColor={primary}
        defaultExpanded={true}
      />

      <VoucherPromotionsPreview
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={voucherConfig.style}
        onStyleChange={(style) => setVoucherConfig({ ...voucherConfig, style })}
        config={{ ...voucherConfig, demoVouchers }}
        previewVouchers={realVouchers}
        canUseRealData={canUseRealData}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}

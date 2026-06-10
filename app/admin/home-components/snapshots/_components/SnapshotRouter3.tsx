'use client';

import React, { useState, useMemo } from 'react';
import { extractSectionHeaderConfig } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { toast } from 'sonner';
import { saveSnapshotComponent } from '../_lib/snapshotComponentSave';

// Imports
import { ServicesForm } from '../../services/_components/ServicesForm';
import { ServicesPreview } from '../../services/_components/ServicesPreview';
import { normalizeServicesItemsForEditor, toServicesPersistItems } from '../../services/_lib/items';

import { CountdownForm } from '../../countdown/_components/CountdownForm';
import { CountdownPreview } from '../../countdown/_components/CountdownPreview';
import { DEFAULT_COUNTDOWN_CONFIG } from '../../countdown/_lib/constants';

import { VoucherPromotionsForm } from '../../voucher-promotions/_components/VoucherPromotionsForm';
import { VoucherPromotionsPreview } from '../../voucher-promotions/_components/VoucherPromotionsPreview';
import { DEFAULT_VOUCHER_PROMOTIONS_CONFIG } from '../../voucher-promotions/_lib/constants';

import { ProcessForm } from '../../process/_components/ProcessForm';
import { ProcessPreview } from '../../process/_components/ProcessPreview';
import { DEFAULT_PROCESS_CONFIG } from '../../process/_lib/constants';

export function SnapshotRouter3({
  component,
  snapshotId,
  payload,
  snapshotLabel,
  decodedKey,
  updateSnapshot,
  effectiveColors,
  fontStyle,
  onCancel,
}: any) {
  const [title, setTitle] = useState(component.title || '');
  const [active, setActive] = useState(component.active ?? true);
  const [isSaving, setIsSaving] = useState(false);
  
  const rawConfig = component.config || {};
  const [headerConfig, setHeaderConfig] = useState(() => {
    const extracted = extractSectionHeaderConfig(rawConfig);
    return {
      hideHeader: extracted.hideHeader ?? false,
      showTitle: extracted.showTitle ?? true,
      subtitle: extracted.subtitle ?? '',
      showSubtitle: extracted.showSubtitle ?? true,
      headerAlign: (extracted.headerAlign === 'center' || extracted.headerAlign === 'right') ? extracted.headerAlign as 'center' | 'left' | 'right' : 'left',
      titleColorPrimary: extracted.titleColorPrimary ?? false,
      subtitleAboveTitle: extracted.subtitleAboveTitle ?? false,
      uppercaseText: extracted.uppercaseText ?? false,
      showBadge: extracted.showBadge ?? true,
      badgeText: extracted.badgeText ?? '',
    };
  });
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);

  // States for Services
  const [servicesItems, setServicesItems] = useState(() => normalizeServicesItemsForEditor(rawConfig.items));
  const [servicesConfig, setServicesConfig] = useState(() => rawConfig);
  const [servicesStyle, setServicesStyle] = useState(() => rawConfig.style ?? 'elegantGrid');

  // States for Countdown
  const [countdownConfig, setCountdownConfig] = useState(() => ({ ...DEFAULT_COUNTDOWN_CONFIG, ...rawConfig }));

  // States for VoucherPromotions
  const [voucherConfig, setVoucherConfig] = useState(() => ({ ...DEFAULT_VOUCHER_PROMOTIONS_CONFIG, ...rawConfig }));

  // States for Process
  const [processSteps, setProcessSteps] = useState(() => rawConfig.steps ?? DEFAULT_PROCESS_CONFIG.steps);
  const [processConfig, setProcessConfig] = useState(() => ({ ...DEFAULT_PROCESS_CONFIG, ...rawConfig }));

  const getConfig = () => {
    switch (component.type) {
      case 'Services': return { ...servicesConfig, items: toServicesPersistItems(servicesItems), style: servicesStyle, ...headerConfig };
      case 'Countdown': return { ...countdownConfig, ...headerConfig };
      case 'VoucherPromotions': return { ...voucherConfig, ...headerConfig };
      case 'Process': return { ...processConfig, steps: processSteps, ...headerConfig };
      default: return rawConfig;
    }
  };

  const currentSnapshot = JSON.stringify(getConfig());
  const initialSnapshot = useMemo(() => JSON.stringify(rawConfig), [rawConfig]);
  const hasChanges = title !== component.title || active !== component.active || currentSnapshot !== initialSnapshot;

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (isSaving || !hasChanges) return;

    setIsSaving(true);
    try {
      await saveSnapshotComponent({
        active,
        component,
        config: getConfig(),
        decodedKey,
        label: snapshotLabel,
        payload,
        snapshotId,
        title,
        updateSnapshot,
      });
      toast.success('Đã lưu component');
      onCancel();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi lưu component');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <form onSubmit={handleSave}>
        <HeaderConfigSection
          {...headerConfig}
          title={title}
          onHideHeaderChange={(val) => setHeaderConfig(p => ({ ...p, hideHeader: val }))}
          onTitleChange={setTitle}
          onShowTitleChange={(val) => setHeaderConfig(p => ({ ...p, showTitle: val }))}
          onSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitle: val }))}
          onShowSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, showSubtitle: val }))}
          onHeaderAlignChange={(val) => setHeaderConfig(p => ({ ...p, headerAlign: val }))}
          onTitleColorPrimaryChange={(val) => setHeaderConfig(p => ({ ...p, titleColorPrimary: val }))}
          onSubtitleAboveTitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitleAboveTitle: val }))}
          onUppercaseTextChange={(val) => setHeaderConfig(p => ({ ...p, uppercaseText: val }))}
          onShowBadgeChange={(val) => setHeaderConfig(p => ({ ...p, showBadge: val }))}
          onBadgeTextChange={(val) => setHeaderConfig(p => ({ ...p, badgeText: val }))}
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 mt-6">
          <div>
            {component.type === 'Services' && <ServicesForm items={servicesItems} onChange={setServicesItems} mediaPlacement={servicesConfig.mediaPlacement} mediaAlign={servicesConfig.mediaAlign} onMediaPlacementChange={(v) => setServicesConfig((p:any) => ({...p, mediaPlacement: v}))} onMediaAlignChange={(v) => setServicesConfig((p:any) => ({...p, mediaAlign: v}))} maxItems={12} brandColor={effectiveColors.primary} defaultExpanded={true} />}
            {component.type === 'Countdown' && <CountdownForm value={countdownConfig} onChange={setCountdownConfig} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} />}
            {component.type === 'VoucherPromotions' && <VoucherPromotionsForm {...voucherConfig} onSelectionModeChange={(v) => setVoucherConfig((p:any) => ({...p, selectionMode: v}))} onLimitChange={(v) => setVoucherConfig((p:any) => ({...p, limit: v}))} onCtaLabelChange={(v) => setVoucherConfig((p:any) => ({...p, ctaLabel: v}))} onCtaUrlChange={(v) => setVoucherConfig((p:any) => ({...p, ctaUrl: v}))} onShowCtaChange={(v) => setVoucherConfig((p:any) => ({...p, showCta: v}))} onCtaVariantChange={(v) => setVoucherConfig((p:any) => ({...p, ctaVariant: v}))} spacing={voucherConfig.spacing ?? 'normal'} onSpacingChange={(v) => setVoucherConfig((p:any) => ({...p, spacing: v}))} demoVouchers={voucherConfig.demoVouchers ?? []} setDemoVouchers={(v) => setVoucherConfig((p:any) => ({...p, demoVouchers: typeof v === 'function' ? v(p.demoVouchers) : v}))} canUseRealData={false} moduleLoaded={true} desktopColumns={voucherConfig.desktopColumns ?? 3} onDesktopColumnsChange={(v) => setVoucherConfig((p:any) => ({...p, desktopColumns: v}))} cornerRadius={voucherConfig.cornerRadius ?? 'lg'} onCornerRadiusChange={(v) => setVoucherConfig((p:any) => ({...p, cornerRadius: v}))} iconName={voucherConfig.iconName ?? 'BadgePercent'} onIconNameChange={(v) => setVoucherConfig((p:any) => ({...p, iconName: v}))} brandColor={effectiveColors.primary} defaultExpanded={true} />}
            {component.type === 'Process' && <ProcessForm steps={processSteps} onChange={setProcessSteps} secondary={effectiveColors.secondary} defaultExpanded={true} />}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {component.type === 'Services' && <ServicesPreview items={servicesItems as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={servicesStyle} onStyleChange={setServicesStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...servicesConfig} {...headerConfig} />}
            {component.type === 'Countdown' && <CountdownPreview config={countdownConfig as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={countdownConfig.style} onStyleChange={(s) => setCountdownConfig((p:any) => ({...p, style: s}))} fontStyle={fontStyle} fontClassName="font-active" {...(headerConfig as any)} />}
            {component.type === 'VoucherPromotions' && <VoucherPromotionsPreview brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={voucherConfig.style} onStyleChange={(s) => setVoucherConfig((p:any) => ({...p, style: s}))} fontStyle={fontStyle} fontClassName="font-active" title={title} {...(voucherConfig as any)} {...headerConfig} />}
            {component.type === 'Process' && <ProcessPreview steps={processSteps as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={processConfig.style} onStyleChange={(s) => setProcessConfig((p:any) => ({...p, style: s}))} fontStyle={fontStyle} fontClassName="font-active" title={title} {...(processConfig as any)} {...headerConfig} />}
          </div>
        </div>

        <HomeComponentStickyFooter isSubmitting={isSaving} hasChanges={hasChanges} onCancel={onCancel} submitLabel="Lưu thay đổi" active={active} onActiveChange={setActive} />
      </form>
    </div>
  );
}

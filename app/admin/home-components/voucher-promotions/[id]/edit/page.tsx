'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { VoucherPromotionsPreview } from '../../_components/VoucherPromotionsPreview';
import { VoucherPromotionsForm } from '../../_components/VoucherPromotionsForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_VOUCHER_PROMOTIONS_CONFIG,
  normalizeDemoVouchers,
  normalizeVoucherPromotionsCornerRadius,
  normalizeVoucherPromotionsTexts,
} from '../../_lib/constants';
import type { DemoVoucherPromotionItem, VoucherPromotionItem, VoucherPromotionsConfigState } from '../../_types';
import { normalizeVoucherLimit, normalizeVoucherStyle } from '@/lib/home-components/voucher-promotions';

const COMPONENT_TYPE = 'VoucherPromotions';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type VoucherPromotionsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function VoucherPromotionsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: VoucherPromotionsEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [config, setConfig] = useState<VoucherPromotionsConfigState>(DEFAULT_VOUCHER_PROMOTIONS_CONFIG);
  const [demoVouchers, setDemoVouchers] = useState<DemoVoucherPromotionItem[]>(DEFAULT_VOUCHER_PROMOTIONS_CONFIG.demoVouchers);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
  const canUseRealData = promotionsModule?.enabled === true;
  const realVouchers = useQuery(
    api.promotions.listPublicVouchers,
    config.selectionMode === 'auto' && canUseRealData ? { limit: normalizeVoucherLimit(config.limit) } : 'skip',
  ) as VoucherPromotionItem[] | undefined;

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'VoucherPromotions') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      const rawConfig = component.config ?? {};
      const headerConfig = extractSectionHeaderConfig(rawConfig);
      const nextTexts = normalizeVoucherPromotionsTexts({
        heading: (rawConfig.heading as string | undefined) ?? (rawConfig.texts as { heading?: string } | undefined)?.heading,
        description: (rawConfig.subtitle as string | undefined)
          ?? (rawConfig.description as string | undefined)
          ?? (rawConfig.texts as { description?: string } | undefined)?.description,
        ctaLabel: (rawConfig.ctaLabel as string | undefined) ?? (rawConfig.texts as { ctaLabel?: string } | undefined)?.ctaLabel,
      });
      const nextDemoVouchers = normalizeDemoVouchers(rawConfig.demoVouchers as Partial<DemoVoucherPromotionItem>[] | undefined);
      const normalizedConfig: VoucherPromotionsConfigState = {
        ...DEFAULT_VOUCHER_PROMOTIONS_CONFIG,
        ctaUrl: (rawConfig.ctaUrl as string | undefined) ?? '/promotions',
        showCta: typeof rawConfig.showCta === 'boolean' ? rawConfig.showCta : DEFAULT_VOUCHER_PROMOTIONS_CONFIG.showCta,
        ctaVariant: rawConfig.ctaVariant === 'textRight' ? 'textRight' : 'button',
        demoVouchers: nextDemoVouchers,
        limit: normalizeVoucherLimit(rawConfig.limit as number | undefined),
        selectionMode: rawConfig.selectionMode === 'demo' ? 'demo' : 'auto',
        style: normalizeVoucherStyle(rawConfig.style as string | undefined),
        texts: nextTexts,
        hideHeader: headerConfig.hideHeader,
        showTitle: headerConfig.showTitle,
        showSubtitle: headerConfig.showSubtitle,
        subtitle: headerConfig.subtitle || nextTexts.description,
        headerAlign: headerConfig.headerAlign,
        titleColorPrimary: headerConfig.titleColorPrimary,
        subtitleAboveTitle: headerConfig.subtitleAboveTitle,
        uppercaseText: headerConfig.uppercaseText,
        showBadge: headerConfig.showBadge,
        badgeText: headerConfig.badgeText,
        spacing: rawConfig.noVerticalMargin === true && rawConfig.spacing === undefined ? 'none' : headerConfig.spacing,
        desktopColumns: rawConfig.desktopColumns === 3 ? 3 : 4,
        cornerRadius: normalizeVoucherPromotionsCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius),
        iconName: typeof rawConfig.iconName === 'string' ? rawConfig.iconName : DEFAULT_VOUCHER_PROMOTIONS_CONFIG.iconName,
      };

      setTitle(component.title);
      setActive(component.active);
      setConfig(normalizedConfig);
      setDemoVouchers(nextDemoVouchers);
      setInitialSnapshot(JSON.stringify({
        title: component.title,
        active: component.active,
        config: normalizedConfig,
        demoVouchers: normalizedConfig.selectionMode === 'demo' ? nextDemoVouchers : [],
      }));
    }
  }, [component, id, router]);

  const currentSnapshot = useMemo(() => JSON.stringify({
    title,
    active,
    config,
    demoVouchers: config.selectionMode === 'demo' ? demoVouchers : [],
  }), [active, config, demoVouchers, title]);
  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const customChanged = enableTypeOverrides && showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const customFontChanged = enableTypeOverrides && showFontCustomBlock
    ? customFontState.enabled !== initialFontCustom.enabled
      || customFontState.fontKey !== initialFontCustom.fontKey
    : false;
  const hasChanges = initialSnapshot !== '' && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const payloadConfig: VoucherPromotionsConfigState = {
        ...config,
        demoVouchers: config.selectionMode === 'demo' ? normalizeDemoVouchers(demoVouchers) : [],
        limit: normalizeVoucherLimit(config.limit),
        cornerRadius: normalizeVoucherPromotionsCornerRadius(config.cornerRadius),
        texts: normalizeVoucherPromotionsTexts({ ...config.texts, heading: title }),
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: payloadConfig, title });
      } else {
        await updateMutation({
          active,
          config: payloadConfig,
          id: id as Id<'homeComponents'>,
          title,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
        await setTypeColorOverride({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
          type: COMPONENT_TYPE,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
          type: COMPONENT_TYPE,
        });
      }
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        config: payloadConfig,
        demoVouchers: payloadConfig.selectionMode === 'demo' ? payloadConfig.demoVouchers : [],
      }));
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Voucher Promotions');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Voucher Promotions</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={config.hideHeader ?? false}
          title={title}
          showTitle={config.showTitle ?? true}
          subtitle={config.subtitle ?? config.texts.description}
          showSubtitle={config.showSubtitle ?? true}
          headerAlign={config.headerAlign ?? 'left'}
          titleColorPrimary={config.titleColorPrimary ?? false}
          subtitleAboveTitle={config.subtitleAboveTitle ?? false}
          uppercaseText={config.uppercaseText ?? false}
          showBadge={config.showBadge ?? true}
          badgeText={config.badgeText ?? ''}
          onHideHeaderChange={(value) => setConfig((prev) => ({ ...prev, hideHeader: value }))}
          onTitleChange={(value) => {
            setTitle(value);
            setConfig((prev) => ({ ...prev, texts: { ...prev.texts, heading: value } }));
          }}
          onShowTitleChange={(value) => setConfig((prev) => ({ ...prev, showTitle: value }))}
          onSubtitleChange={(value) => setConfig((prev) => ({ ...prev, subtitle: value, texts: { ...prev.texts, description: value } }))}
          onShowSubtitleChange={(value) => setConfig((prev) => ({ ...prev, showSubtitle: value }))}
          onHeaderAlignChange={(value) => setConfig((prev) => ({ ...prev, headerAlign: value }))}
          onTitleColorPrimaryChange={(value) => setConfig((prev) => ({ ...prev, titleColorPrimary: value }))}
          onSubtitleAboveTitleChange={(value) => setConfig((prev) => ({ ...prev, subtitleAboveTitle: value }))}
          onUppercaseTextChange={(value) => setConfig((prev) => ({ ...prev, uppercaseText: value }))}
          onShowBadgeChange={(value) => setConfig((prev) => ({ ...prev, showBadge: value }))}
          onBadgeTextChange={(value) => setConfig((prev) => ({ ...prev, badgeText: value }))}
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleLabel="Tiêu đề section"
          titlePlaceholder="VD: Voucher khuyến mãi, Ưu đãi hôm nay..."
        />

        <VoucherPromotionsForm
          selectionMode={config.selectionMode}
          onSelectionModeChange={(value) => setConfig((prev) => ({ ...prev, selectionMode: value }))}
          limit={config.limit}
          onLimitChange={(value) => setConfig((prev) => ({ ...prev, limit: value }))}
          ctaLabel={config.texts.ctaLabel}
          onCtaLabelChange={(value) => setConfig((prev) => ({ ...prev, texts: { ...prev.texts, ctaLabel: value } }))}
          ctaUrl={config.ctaUrl ?? '/promotions'}
          onCtaUrlChange={(value) => setConfig((prev) => ({ ...prev, ctaUrl: value }))}
        showCta={config.showCta ?? true}
        onShowCtaChange={(value) => setConfig((prev) => ({ ...prev, showCta: value }))}
        ctaVariant={config.ctaVariant ?? 'button'}
        onCtaVariantChange={(value) => setConfig((prev) => ({ ...prev, ctaVariant: value }))}
          spacing={config.spacing ?? 'normal'}
          onSpacingChange={(value) => setConfig((prev) => ({ ...prev, spacing: value }))}
          demoVouchers={demoVouchers}
          setDemoVouchers={setDemoVouchers}
          canUseRealData={canUseRealData}
          moduleLoaded={promotionsModule !== undefined}
          desktopColumns={config.desktopColumns ?? 4}
          onDesktopColumnsChange={(value) => setConfig((prev) => ({ ...prev, desktopColumns: value }))}
          cornerRadius={config.cornerRadius ?? 'lg'}
          onCornerRadiusChange={(value) => setConfig((prev) => ({ ...prev, cornerRadius: value }))}
          iconName={config.iconName ?? 'BadgePercent'}
          onIconNameChange={(value) => setConfig((prev) => ({ ...prev, iconName: value }))}
          brandColor={effectiveColors.primary}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Voucher Promotions"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
              onModeChange={(next) => setCustomState((prev) => {
                if (next === 'single') {
                  return { ...prev, mode: next, secondary: prev.primary };
                }
                if (prev.mode === 'single') {
                  return { ...prev, mode: next, secondary: getSuggestedSecondary(prev.primary) };
                }
                return { ...prev, mode: next };
              })}
              onPrimaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                primary: value,
                secondary: prev.mode === 'single' ? value : prev.secondary,
              }))}
              onSecondaryChange={(value) => setCustomState((prev) => ({
                ...prev,
                secondary: prev.mode === 'single' ? prev.primary : value,
              }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Voucher Promotions"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <VoucherPromotionsPreview
              config={{ ...config, demoVouchers }}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={config.style}
              limit={config.limit}
              onStyleChange={(style) => {
                setConfig({ ...config, style });
              }}
              previewVouchers={realVouchers}
              canUseRealData={canUseRealData}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() =>{  router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        />
      </form>
    </div>
  );
}

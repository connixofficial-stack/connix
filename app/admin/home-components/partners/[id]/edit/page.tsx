"use client";

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';
import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/admin/components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { PartnersForm } from '../../_components/PartnersForm';
import { PartnersPreview } from '../../_components/PartnersPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_PARTNERS_CORNER_RADIUS, DEFAULT_PARTNERS_DISPLAY_MODE, DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY, DEFAULT_PARTNERS_LOGO_SIZE, DEFAULT_PARTNERS_SHOW_BORDER, DEFAULT_PARTNERS_SPACING, getPartnersLogoColorModeFromIntensity, normalizePartnersCornerRadius, normalizePartnersDisplayMode, normalizePartnersLogoColorIntensity, normalizePartnersLogoColorMode, normalizePartnersLogoSize, normalizePartnersShowBorder, normalizePartnersSpacing, normalizePartnersStyle, type PartnerItem, type PartnersCornerRadius, type PartnersDisplayMode, type PartnersLogoColorIntensity, type PartnersLogoSize, type PartnersSpacing, type PartnersStyle, type PartnersLogoColorMode } from '../../_types';
import { AiDemoPartnersImport } from '../../../product-list/_components/AiDemoProductsImport';

const COMPONENT_TYPE = 'Partners';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type PartnersEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function PartnersEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: PartnersEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<"homeComponents"> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: partnersItems,
    set: setPartnersItems,
    undo: undopartnersItems,
    redo: redopartnersItems,
    canUndo: canUndopartnersItems,
    canRedo: canRedopartnersItems,
    reset: resetpartnersItems,
  } = useUndoRedo<PartnerItem[]>([], { maxHistory: 15 });
  const [partnersStyle, setPartnersStyle] = useState<PartnersStyle>('grid');
  const [displayMode, setDisplayMode] = useState<PartnersDisplayMode>(DEFAULT_PARTNERS_DISPLAY_MODE);
  const [cornerRadius, setCornerRadius] = useState<PartnersCornerRadius>(DEFAULT_PARTNERS_CORNER_RADIUS);
  const [logoSize, setLogoSize] = useState<PartnersLogoSize>(DEFAULT_PARTNERS_LOGO_SIZE);
  const [showBorder, setShowBorder] = useState(DEFAULT_PARTNERS_SHOW_BORDER);
  const [spacing, setSpacing] = useState<PartnersSpacing>(DEFAULT_PARTNERS_SPACING);
  const [logoColorMode, setLogoColorMode] = useState<PartnersLogoColorMode>('grayscale');
  const [logoColorIntensity, setLogoColorIntensity] = useState<PartnersLogoColorIntensity>(DEFAULT_PARTNERS_LOGO_COLOR_INTENSITY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const DEMO_PARTNERS_ITEMS: PartnerItem[] = [
    { id: 'demo-1', link: '', name: 'Apex Digital', url: '/demo/partners/partner-1.png' },
    { id: 'demo-2', link: '', name: 'NexaCore', url: '/demo/partners/partner-2.png' },
    { id: 'demo-3', link: '', name: 'InfiniLoop', url: '/demo/partners/partner-3.png' },
    { id: 'demo-4', link: '', name: 'Summit Labs', url: '/demo/partners/partner-4.png' },
    { id: 'demo-5', link: '', name: 'GreenLeaf', url: '/demo/partners/partner-5.png' },
    { id: 'demo-6', link: '', name: 'Globex Corp', url: '/demo/partners/partner-6.png' },
  ];

  const handleUseDemoImages = () => {
    resetpartnersItems(DEMO_PARTNERS_ITEMS);
  };

  // Header state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('Đối tác');
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);

  const normalizeItemsForCompare = (items: PartnerItem[]) => items.map(item => ({
    link: item.link?.trim() ?? '',
    name: item.name?.trim() ?? '',
    url: item.url?.trim() ?? '',
    storageId: item.storageId,
  }));

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'Partners') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const nextItems = config.items?.map((item: { url: string; link: string; name?: string; storageId?: string }, i: number) => ({
        id: `item-${i}`,
        link: item.link || '',
        name: item.name ?? '',
        url: item.url,
        storageId: item.storageId as Id<'_storage'> | undefined,
      })) ?? [{ id: 'item-1', link: '', name: '', url: '' }];
      const nextStyle = normalizePartnersStyle(config.style);
      const nextDisplayMode = normalizePartnersDisplayMode(config.displayMode);
      const nextCornerRadius = normalizePartnersCornerRadius(config.cornerRadius);
      const nextLogoSize = normalizePartnersLogoSize(config.logoSize);
      const nextShowBorder = normalizePartnersShowBorder(config.showBorder);
      const nextSpacing = normalizePartnersSpacing(config.spacing);
      const nextLogoColorMode = normalizePartnersLogoColorMode(config.logoColorMode);
      const nextLogoColorIntensity = normalizePartnersLogoColorIntensity(config.logoColorIntensity, nextLogoColorMode);
      const nextResolvedLogoColorMode = getPartnersLogoColorModeFromIntensity(nextLogoColorIntensity);

      // Load header config
      const headerConfig = extractSectionHeaderConfig(config);
      setHideHeader(headerConfig.hideHeader ?? false);
      setShowTitle(headerConfig.showTitle ?? true);
      setShowSubtitle(headerConfig.showSubtitle ?? true);
      setSubtitle(headerConfig.subtitle ?? '');
      setHeaderAlign(headerConfig.headerAlign ?? 'center');
      setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
      setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
      setUppercaseText(headerConfig.uppercaseText ?? false);
      setShowBadge(headerConfig.showBadge ?? true);
      setBadgeText(headerConfig.badgeText ?? 'Đối tác');

      resetpartnersItems(nextItems);
      setPartnersStyle(nextStyle);
      setDisplayMode(nextDisplayMode);
      setCornerRadius(nextCornerRadius);
      setLogoSize(nextLogoSize);
      setShowBorder(nextShowBorder);
      setSpacing(nextSpacing);
      setLogoColorMode(nextResolvedLogoColorMode);
      setLogoColorIntensity(nextLogoColorIntensity);
      setInitialSnapshot(JSON.stringify({
        displayMode: nextDisplayMode,
        cornerRadius: nextCornerRadius,
        logoSize: nextLogoSize,
        showBorder: nextShowBorder,
        spacing: nextSpacing,
        logoColorMode: nextResolvedLogoColorMode,
        logoColorIntensity: nextLogoColorIntensity,
        title: component.title.trim(),
        active: component.active,
        style: nextStyle,
        items: normalizeItemsForCompare(nextItems),
        // Header fields
        hideHeader: headerConfig.hideHeader,
        showTitle: headerConfig.showTitle,
        showSubtitle: headerConfig.showSubtitle,
        subtitle: headerConfig.subtitle,
        headerAlign: headerConfig.headerAlign,
        titleColorPrimary: headerConfig.titleColorPrimary,
        subtitleAboveTitle: headerConfig.subtitleAboveTitle,
        uppercaseText: headerConfig.uppercaseText,
        showBadge: headerConfig.showBadge,
        badgeText: headerConfig.badgeText,
      }));
    }
  }, [component, id, router, snapshotComponent]);

  const currentSnapshot = JSON.stringify({
    displayMode,
    cornerRadius,
    logoSize,
    showBorder,
    spacing,
    logoColorMode,
    logoColorIntensity,
    title: title.trim(),
    active,
    style: partnersStyle,
    items: normalizeItemsForCompare(partnersItems),
    // Header fields
    hideHeader,
    showTitle,
    showSubtitle,
    subtitle,
    headerAlign,
    titleColorPrimary,
    subtitleAboveTitle,
    uppercaseText,
    showBadge,
    badgeText,
  });
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
  const hasChanges = initialSnapshot !== null && (initialSnapshot !== currentSnapshot || customChanged || customFontChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
          displayMode,
          cornerRadius,
          logoSize,
          showBorder,
          spacing,
          logoColorMode,
          logoColorIntensity,
          items: partnersItems.map((item: PartnerItem) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
          style: partnersStyle,
          // Header fields
          hideHeader,
          showTitle,
          showSubtitle,
          subtitle,
          headerAlign,
          titleColorPrimary,
          subtitleAboveTitle,
          uppercaseText,
          showBadge,
          badgeText,
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
          id: id as Id<"homeComponents">,
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
      setInitialSnapshot(currentSnapshot);
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
      toast.success('Đã cập nhật Partners');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Partners</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        {snapshotLabel ? <p className="text-sm text-slate-500">Snapshot: {snapshotLabel}</p> : null}
      </div>

      <form onSubmit={handleSubmit}>
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
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          className="mb-3"
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <PartnersForm
          items={partnersItems}
          setItems={setPartnersItems}
          cornerRadius={cornerRadius}
          setCornerRadius={setCornerRadius}
          logoSize={logoSize}
          setLogoSize={setLogoSize}
          showBorder={showBorder}
          setShowBorder={setShowBorder}
          spacing={spacing}
          setSpacing={setSpacing}
          selectedStyle={partnersStyle}
          logoColorMode={logoColorMode}
          setLogoColorMode={setLogoColorMode}
          logoColorIntensity={logoColorIntensity}
          setLogoColorIntensity={setLogoColorIntensity}
          defaultExpanded={false}
          className="mb-4"
          actions={(
            <>
              <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
                Dùng ảnh demo
              </Button>
              <AiDemoPartnersImport buttonClassName="h-8" onApply={setPartnersItems} />
            </>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Partners"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => setCustomState((prev) => {
                  if (next === prev.mode) {
                    return prev;
                  }
                  if (next === 'single') {
                    return { ...prev, mode: 'single', secondary: prev.primary };
                  }
                  const nextSecondary = prev.mode === 'single'
                    ? getSuggestedSecondary(prev.primary)
                    : prev.secondary;
                  return { ...prev, mode: 'dual', secondary: nextSecondary };
                })}
                onPrimaryChange={(value) => setCustomState((prev) => ({
                  ...prev,
                  primary: value,
                  secondary: prev.mode === 'single' ? value : prev.secondary,
                }))}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Partners"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <PartnersPreview
              items={partnersItems.map((item: PartnerItem, idx: number) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={partnersStyle}
              onStyleChange={setPartnersStyle}
              title={title}
              subheading={subtitle}
              align={headerAlign}
              displayMode={displayMode}
              cornerRadius={cornerRadius}
              logoSize={logoSize}
              showBorder={showBorder}
              spacing={spacing}
              logoColorMode={logoColorMode}
              logoColorIntensity={logoColorIntensity}
              onDisplayModeChange={setDisplayMode}
              fontStyle={fontStyle}
              fontClassName="font-active"
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
          active={active}
          onActiveChange={setActive}
          undoRedo={{
            canUndo: canUndopartnersItems,
            canRedo: canRedopartnersItems,
            onUndo: undopartnersItems,
            onRedo: redopartnersItems,
          }}
        />
      </form>
    </div>
  );
}

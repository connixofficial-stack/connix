'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ServicesForm } from '../../_components/ServicesForm';
import { ServicesPreview } from '../../_components/ServicesPreview';
import { DEFAULT_SERVICES_CONFIG } from '../../_lib/constants';
import { getServicesValidationResult } from '../../_lib/colors';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { getServicesDesktopColumns, getServicesMediaAlign, getServicesMediaPlacement, normalizeServicesItemsForEditor, toServicesPersistItems } from '../../_lib/items';
import { DEFAULT_SERVICES_CORNER_RADIUS, DEFAULT_SERVICES_SPACING, normalizeServicesCornerRadius, normalizeServicesSpacing, type ServiceEditorItem, type ServiceItemMediaAlign, type ServiceItemMediaPlacement, type ServicesCornerRadius, type ServicesSpacing, type ServicesStyle } from '../../_types';

const getDefaultEditorItems = (): ServiceEditorItem[] => {
  return DEFAULT_SERVICES_CONFIG.items.map((item, index) => ({
    id: 1_000_000 + index,
    mediaType: item.mediaType ?? 'icon',
    icon: item.icon,
    image: item.image ?? '',
    title: item.title,
    description: item.description,
  }));
};

const COMPONENT_TYPE = 'Services';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ServicesEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ServicesEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ServicesEditPageProps) {
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

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: servicesItems,
    set: setServicesItems,
    undo: undoservicesItems,
    redo: redoservicesItems,
    canUndo: canUndoservicesItems,
    canRedo: canRedoservicesItems,
  } = useUndoRedo<ServiceEditorItem[]>(getDefaultEditorItems, { maxHistory: 15 });
  const [style, setStyle] = useState<ServicesStyle>('elegantGrid');
  const [mediaPlacement, setMediaPlacement] = useState<ServiceItemMediaPlacement>(DEFAULT_SERVICES_CONFIG.mediaPlacement ?? 'top');
  const [mediaAlign, setMediaAlign] = useState<ServiceItemMediaAlign>(DEFAULT_SERVICES_CONFIG.mediaAlign ?? 'center');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(DEFAULT_SERVICES_CONFIG.desktopColumns ?? 3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');

  // Header config state
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);
  const [hideHeader, setHideHeader] = useState(DEFAULT_SERVICES_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_SERVICES_CONFIG.showTitle !== false);
  const [subtitle, setSubtitle] = useState(DEFAULT_SERVICES_CONFIG.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_SERVICES_CONFIG.showSubtitle !== false);
  const [headerAlign, setHeaderAlign] = useState<ServiceItemMediaAlign>(DEFAULT_SERVICES_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_SERVICES_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_SERVICES_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_SERVICES_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_SERVICES_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_SERVICES_CONFIG.badgeText ?? '');
  const [spacing, setSpacing] = useState<ServicesSpacing>(DEFAULT_SERVICES_CONFIG.spacing ?? DEFAULT_SERVICES_SPACING);
  const [cornerRadius, setCornerRadius] = useState<ServicesCornerRadius>(DEFAULT_SERVICES_CONFIG.cornerRadius ?? DEFAULT_SERVICES_CORNER_RADIUS);

  useEffect(() => {
    if (!component) {return;}
    if (!snapshotComponent && component.type !== 'Services') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = (component.config ?? {}) as { items?: unknown; style?: ServicesStyle; showTitle?: unknown; subtitle?: unknown; showSubtitle?: unknown; headerAlign?: unknown; mediaPlacement?: unknown; mediaAlign?: unknown; desktopColumns?: unknown; cornerRadius?: unknown; noBorderRadius?: unknown; noVerticalMargin?: unknown };
    const normalizedItems = normalizeServicesItemsForEditor(rawConfig.items);
    setTitle(component.title);
    setActive(component.active);
    setServicesItems(normalizedItems.length > 0 ? normalizedItems : getDefaultEditorItems());
    setStyle(rawConfig.style || DEFAULT_SERVICES_CONFIG.style);
    setMediaPlacement(getServicesMediaPlacement(rawConfig.mediaPlacement));
    setMediaAlign(getServicesMediaAlign(rawConfig.mediaAlign));
    setDesktopColumns(getServicesDesktopColumns(rawConfig.desktopColumns));

    // Load header config
    const headerConfig = extractSectionHeaderConfig(component.config ?? {});
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign((headerConfig.headerAlign ?? 'left') as ServiceItemMediaAlign);
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    const resolvedSpacing = normalizeServicesSpacing(headerConfig.spacing, rawConfig.noVerticalMargin);
    const resolvedCornerRadius = normalizeServicesCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius);
    setSpacing(resolvedSpacing);
    setCornerRadius(resolvedCornerRadius);

    const snapshot = JSON.stringify({
      title: component.title,
      active: component.active,
      items: toServicesPersistItems(normalizedItems.length > 0 ? normalizedItems : getDefaultEditorItems()),
      style: rawConfig.style || DEFAULT_SERVICES_CONFIG.style,
      mediaPlacement: getServicesMediaPlacement(rawConfig.mediaPlacement),
      mediaAlign: getServicesMediaAlign(rawConfig.mediaAlign),
      desktopColumns: getServicesDesktopColumns(rawConfig.desktopColumns),
      hideHeader: headerConfig.hideHeader ?? false,
      showTitle: headerConfig.showTitle ?? true,
      subtitle: headerConfig.subtitle ?? '',
      showSubtitle: headerConfig.showSubtitle ?? true,
      headerAlign: (headerConfig.headerAlign ?? 'left') as ServiceItemMediaAlign,
      titleColorPrimary: headerConfig.titleColorPrimary ?? false,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
      uppercaseText: headerConfig.uppercaseText ?? false,
      showBadge: headerConfig.showBadge ?? true,
      badgeText: headerConfig.badgeText ?? '',
      spacing: resolvedSpacing,
      cornerRadius: resolvedCornerRadius,
      type: component.type,
    });

    setInitialSnapshot(snapshot);
    setHasChanges(false);
  }, [component, id, router]);

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

  useEffect(() => {
    if (!component || component.type !== 'Services' || !initialSnapshot) {return;}

    const snapshot = JSON.stringify({
      title,
      active,
      items: toServicesPersistItems(servicesItems),
      style,
      mediaPlacement,
      mediaAlign,
      desktopColumns,
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
      spacing,
      cornerRadius,
      type: component.type,
    });

    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, servicesItems, style, mediaPlacement, mediaAlign, desktopColumns, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius, component, initialSnapshot, customChanged, customFontChanged]);

  const validation = useMemo(() => getServicesValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors]);

  const _warningMessages = useMemo(() => {
    const messages: string[] = [];

    if (effectiveColors.mode === 'dual' && validation.harmonyStatus.isTooSimilar) {
      messages.push(`Màu phụ đang khá gần màu chính (deltaE = ${validation.harmonyStatus.deltaE}). Nên tăng độ tách biệt.`);
    }

    if (validation.accessibility.failing.length > 0) {
      messages.push(`Một số cặp màu chữ/nền chưa đủ tương phản (minLc = ${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return messages;
  }, [effectiveColors.mode, validation]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const persistItems = toServicesPersistItems(servicesItems);
      const persistConfig = {
        items: persistItems,
        showTitle,
        subtitle,
        showSubtitle,
        headerAlign,
        desktopColumns,
        mediaPlacement,
        mediaAlign,
        style,
        hideHeader,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        spacing,
        cornerRadius,
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: persistConfig, title });
      } else {
        await updateMutation({
          active,
          config: persistConfig,
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

      toast.success('Đã cập nhật Services');

      const snapshot = JSON.stringify({
        title,
        active,
        items: persistItems,
        style,
        mediaPlacement,
        mediaAlign,
        desktopColumns,
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
        spacing,
        cornerRadius,
        type: component?.type,
      });
      setInitialSnapshot(snapshot);
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
      setHasChanges(false);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Services</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
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
          expanded={openSections.header}
          onExpandedChange={(value) => toggleSection('header', value)}
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
                            'h-10 rounded-md border text-xs transition-colors',
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

        <ServicesForm
          items={servicesItems}
          onChange={setServicesItems}
          mediaPlacement={mediaPlacement}
          mediaAlign={mediaAlign}
          onMediaPlacementChange={setMediaPlacement}
          onMediaAlignChange={setMediaAlign}
          brandColor={validation.colors.primary}
          defaultExpanded={false}
          onAiImport={setServicesItems}
        />



        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Services"
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
                title="Font custom cho Services"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ServicesPreview
              items={toServicesPersistItems(servicesItems)}
              mediaPlacement={mediaPlacement}
              mediaAlign={mediaAlign}
              headerAlign={headerAlign}
              desktopColumns={desktopColumns}
              subtitle={subtitle}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              showBadge={showBadge}
              badgeText={badgeText}
              hideHeader={hideHeader}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              brandColor={validation.colors.primary}
              secondary={validation.colors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={setStyle}
              title={title}
              spacing={spacing}
              cornerRadius={cornerRadius}
              fontStyle={fontStyle}
              fontClassName="font-active"
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
          canUndo: canUndoservicesItems,
          canRedo: canRedoservicesItems,
          onUndo: undoservicesItems,
          onRedo: redoservicesItems,
        }}
        />
      </form>
    </div>
  );
}

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
import { Button } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ClientsForm } from '../../_components/ClientsForm';
import { ClientsPreview } from '../../_components/ClientsPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  CLIENTS_DEMO_ITEMS_BY_STYLE,
  DEFAULT_CLIENTS_CONFIG,
} from '../../_lib/constants';
import { normalizeClientsStyleSafe } from '../../_components/ClientsSectionShared';
import { normalizeClientsHeaderAlign, toClientEditorItems, toPersistClientItems } from '../../_lib/items';
import type {
  ClientEditorItem,
  ClientsConfig,
  ClientsCornerRadius,
  ClientsHeaderAlign,
  ClientsStyle,
} from '../../_types';
import {
  normalizeClientsCornerRadius,
} from '../../_types';
import { AiDemoClientsImport } from '../../../product-list/_components/AiDemoProductsImport';

const toEditorItems = (items: ClientsConfig['items']): ClientEditorItem[] => {
  return toClientEditorItems(items);
};

const toPersistItems = (items: ClientEditorItem[]): ClientsConfig['items'] => {
  return toPersistClientItems(items);
};

const toSnapshot = (payload: {
  title: string;
  active: boolean;
  style: ClientsStyle;
  items: ClientsConfig['items'];
  hideHeader?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  showSubtitle?: boolean;
  headerAlign?: ClientsHeaderAlign;
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
  cornerRadius?: ClientsCornerRadius;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
}) => JSON.stringify({
  ...payload,
  items: toPersistItems(toEditorItems(payload.items)),
});

const COMPONENT_TYPE = 'Clients';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ClientsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ClientsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ClientsEditPageProps) {
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
    state: items,
    set: setItems,
    undo: undoitems,
    redo: redoitems,
    canUndo: canUndoitems,
    canRedo: canRedoitems,
  } = useUndoRedo<ClientEditorItem[]>(toEditorItems(DEFAULT_CLIENTS_CONFIG.items), { maxHistory: 15 });
  const [style, setStyle] = useState<ClientsStyle>(DEFAULT_CLIENTS_CONFIG.style);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  // Header config state
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const [hideHeader, setHideHeader] = useState(DEFAULT_CLIENTS_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_CLIENTS_CONFIG.showTitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_CLIENTS_CONFIG.subtitle ?? '');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_CLIENTS_CONFIG.showSubtitle ?? true);
  const [headerAlign, setHeaderAlign] = useState<ClientsHeaderAlign>(DEFAULT_CLIENTS_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_CLIENTS_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_CLIENTS_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_CLIENTS_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_CLIENTS_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_CLIENTS_CONFIG.badgeText ?? '');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cornerRadius, setCornerRadius] = useState<ClientsCornerRadius>(normalizeClientsCornerRadius(DEFAULT_CLIENTS_CONFIG.cornerRadius, DEFAULT_CLIENTS_CONFIG.noBorderRadius));

  useEffect(() => {
    if (!component || isInitialized) {return;}

    if (!snapshotComponent && component.type !== 'Clients') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = component.config ?? {};
    const rawItems = Array.isArray(rawConfig.items) ? rawConfig.items : DEFAULT_CLIENTS_CONFIG.items;
    const nextStyle = normalizeClientsStyleSafe(rawConfig.style);

    setTitle(component.title);
    setActive(component.active);
    setItems(toEditorItems(rawItems));
    setStyle(nextStyle);

    // Load header config
    const headerConfig = extractSectionHeaderConfig(rawConfig);
    const nextHeaderAlign = normalizeClientsHeaderAlign(headerConfig.headerAlign);
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign(nextHeaderAlign);
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    const nextSpacing = rawConfig.noVerticalMargin === true ? 'none' : (headerConfig.spacing ?? DEFAULT_SECTION_SPACING);
    setSpacing(nextSpacing);
    const nextCornerRadius = normalizeClientsCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius);
    setCornerRadius(nextCornerRadius);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      style: nextStyle,
      items: rawItems,
      hideHeader: headerConfig.hideHeader ?? false,
      showTitle: headerConfig.showTitle ?? true,
      subtitle: headerConfig.subtitle ?? '',
      showSubtitle: headerConfig.showSubtitle ?? true,
      headerAlign: nextHeaderAlign,
      titleColorPrimary: headerConfig.titleColorPrimary ?? false,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
      uppercaseText: headerConfig.uppercaseText ?? false,
      showBadge: headerConfig.showBadge ?? true,
      badgeText: headerConfig.badgeText ?? '',
      spacing: nextSpacing,
      cornerRadius: nextCornerRadius,
      noBorderRadius: nextCornerRadius === 'none',
      noVerticalMargin: nextSpacing === 'none',
    }));
    setIsInitialized(true);
  }, [component, id, isInitialized, router, snapshotComponent]);

  const currentItems = useMemo(() => toPersistItems(items), [items]);

  const currentSnapshot = useMemo(() => toSnapshot({
    title,
    active,
    style,
    items: currentItems,
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
    noBorderRadius: cornerRadius === 'none',
    noVerticalMargin: spacing === 'none',
  }), [title, active, style, currentItems, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius]);

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
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const handleUseDemoImages = () => {
    setItems(CLIENTS_DEMO_ITEMS_BY_STYLE[style].map((item) => ({ ...item })));
  };
  const handleImportAiClients = (nextItems: ClientEditorItem[]) => {
    setItems(nextItems.map((item, index) => ({
      ...item,
      id: `client-ai-${Date.now()}-${index}`,
      inputMode: 'url',
    })));
  };

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig: ClientsConfig = {
        items: currentItems,
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
        spacing,
        noVerticalMargin: spacing === 'none',
        cornerRadius,
        noBorderRadius: cornerRadius === 'none',
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig as Record<string, any>, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        style,
        items: nextConfig.items,
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
        noBorderRadius: cornerRadius === 'none',
        noVerticalMargin: spacing === 'none',
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
      toast.success('Đã cập nhật Banner ảnh thương hiệu');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Banner ảnh thương hiệu</h1>
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
          expanded={expandedSections.header}
          onExpandedChange={(value) => setExpandedSections({ header: value })}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div>
            <ClientsForm
              items={items}
              setItems={setItems}
              selectedStyle={style}
              spacing={spacing}
              setSpacing={setSpacing}
              cornerRadius={cornerRadius}
              setCornerRadius={setCornerRadius}
              maxItems={style === 'layout08' ? 8 : 4}
              action={(
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleUseDemoImages}>
                    Dùng ảnh demo
                  </Button>
                  <AiDemoClientsImport buttonClassName="h-10" onApply={handleImportAiClients} />
                </div>
              )}
            />
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Clients"
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
                title="Font custom cho Clients"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ClientsPreview
              items={currentItems}
              title={title}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={setStyle}
              fontStyle={fontStyle}
              fontClassName="font-active"
              hideHeader={hideHeader}
              showTitle={showTitle}
              subtitle={subtitle}
              showSubtitle={showSubtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
              spacing={spacing}
              cornerRadius={cornerRadius}
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
        
        undoRedo={{
          canUndo: canUndoitems,
          canRedo: canRedoitems,
          onUndo: undoitems,
          onRedo: redoitems,
        }}
        />
      </form>
    </div>
  );
}

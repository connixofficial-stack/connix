'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { GripVertical, ListChecks, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Label, cn } from '../../../../components/ui';
import { ImageFieldWithUpload } from '../../../../components/ImageFieldWithUpload';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { CollapsibleSubSection as SubSection } from '../../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { FormSectionsToggleAllButton } from '../../../_shared/components/FormSectionsToggleAllButton';
import { DEFAULT_SECTION_SPACING, normalizeSectionSpacing, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { FeaturesPreview } from '../../_components/FeaturesPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { IconPopoverPicker } from '../../../_shared/components/IconPopoverPicker';
import {
  createFeatureItem,
  FEATURE_ICON_PICKER_OPTIONS,
  normalizeFeatureItems,
} from '../../_lib/constants';
import {
  DEFAULT_FEATURES_CORNER_RADIUS,
  DEFAULT_FEATURES_DESKTOP_COLUMNS,
  normalizeFeaturesCornerRadius,
  normalizeFeaturesDesktopColumns,
  type FeatureItem,
  type FeaturesConfig,
  type FeaturesCornerRadius,
  type FeaturesDesktopColumns,
  type FeaturesStyle,
} from '../../_types';
import { AiDemoFeaturesImport } from '../../../product-list/_components/AiDemoProductsImport';

const serializeState = (payload: {
  title: string;
  active: boolean;
  items: FeatureItem[];
  style: FeaturesStyle;
  showIcons: boolean;
  hideHeader: boolean;
  showTitle: boolean;
  subtitle: string;
  showSubtitle: boolean;
  headerAlign: 'left' | 'center' | 'right';
  titleColorPrimary: boolean;
  subtitleAboveTitle: boolean;
  uppercaseText: boolean;
  showBadge: boolean;
  badgeText: string;
  spacing: SectionSpacing;
  desktopColumns: FeaturesDesktopColumns;
  cornerRadius: FeaturesCornerRadius;
}) => JSON.stringify(payload);

const COMPONENT_TYPE = 'Features';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type FeaturesEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function FeaturesEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: FeaturesEditPageProps) {
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
    state: featuresItems,
    set: setFeaturesItems,
    undo: undofeaturesItems,
    redo: redofeaturesItems,
    canUndo: canUndofeaturesItems,
    canRedo: canRedofeaturesItems,
    reset: resetfeaturesItems,
  } = useUndoRedo<FeatureItem[]>([createFeatureItem()], { maxHistory: 15 });
  const [style, setStyle] = useState<FeaturesStyle>('carousel6');
  const [showIcons, setShowIcons] = useState(true);
  const [desktopColumns, setDesktopColumns] = useState<FeaturesDesktopColumns>(DEFAULT_FEATURES_DESKTOP_COLUMNS);
  const [cornerRadius, setCornerRadius] = useState<FeaturesCornerRadius>(DEFAULT_FEATURES_CORNER_RADIUS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialState, setInitialState] = useState('');

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display', 'features'], false);
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'Features') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = (component.config ?? {}) as Partial<FeaturesConfig>;
    const nextItems = normalizeFeatureItems(rawConfig.items);
    const nextStyle = rawConfig.style ?? 'carousel6';
    const nextShowIcons = rawConfig.showIcons !== false;
    const nextDesktopColumns = normalizeFeaturesDesktopColumns(rawConfig.desktopColumns);
    const nextCornerRadius = normalizeFeaturesCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius);
    const headerConfig = extractSectionHeaderConfig(component.config);
    const nextSpacing = rawConfig.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(headerConfig.spacing ?? DEFAULT_SECTION_SPACING);

    setTitle(component.title);
    setActive(component.active);
    resetfeaturesItems(nextItems);
    setStyle(nextStyle);
    setShowIcons(nextShowIcons);
    setDesktopColumns(nextDesktopColumns);
    setCornerRadius(nextCornerRadius);

    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setHeaderAlign(headerConfig.headerAlign ?? 'left');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    setSpacing(nextSpacing);

    setInitialState(serializeState({
      title: component.title,
      active: component.active,
      items: nextItems,
      style: nextStyle,
      showIcons: nextShowIcons,
      hideHeader: headerConfig.hideHeader ?? false,
      showTitle: headerConfig.showTitle ?? true,
      subtitle: headerConfig.subtitle ?? '',
      showSubtitle: headerConfig.showSubtitle ?? true,
      headerAlign: headerConfig.headerAlign ?? 'left',
      titleColorPrimary: headerConfig.titleColorPrimary ?? false,
      subtitleAboveTitle: headerConfig.subtitleAboveTitle ?? false,
      uppercaseText: headerConfig.uppercaseText ?? false,
      showBadge: headerConfig.showBadge ?? true,
      badgeText: headerConfig.badgeText ?? '',
      spacing: nextSpacing,
      desktopColumns: nextDesktopColumns,
      cornerRadius: nextCornerRadius,
    }));
  }, [component, id, router, snapshotComponent]);

  const currentState = useMemo(() => serializeState({
    title,
    active,
    items: featuresItems,
    style,
    showIcons,
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
    desktopColumns,
    cornerRadius,
  }), [title, active, featuresItems, style, showIcons, hideHeader, showTitle, subtitle, showSubtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, desktopColumns, cornerRadius]);

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
  const hasChanges = initialState.length > 0 && (currentState !== initialState || customChanged || customFontChanged);

  const dragProps = (itemId: number) => ({
    draggable: true,
    onDragStart: () => {
      setDraggedId(itemId);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedId !== itemId) {
        setDragOverId(itemId);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === itemId) {return;}

      setFeaturesItems((prev) => {
        const next = [...prev];
        const fromIndex = next.findIndex((item) => item.id === draggedId);
        const toIndex = next.findIndex((item) => item.id === itemId);
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

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
          items: featuresItems,
          style,
          showIcons,
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
          desktopColumns,
          cornerRadius,
          noBorderRadius: cornerRadius === 'none',
          noVerticalMargin: spacing === 'none',
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig as Record<string, any>, title });
      } else {
        await updateMutation({
          id: id as Id<'homeComponents'>,
          title,
          active,
          config: nextConfig,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
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

      const nextInitialState = serializeState({
        title,
        active,
        items: featuresItems,
        style,
        showIcons,
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
        desktopColumns,
        cornerRadius,
      });
      setInitialState(nextInitialState);
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolvedCustomSecondary,
        });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        setInitialFontCustom({
          enabled: customFontState.enabled,
          fontKey: customFontState.fontKey,
        });
      }
      toast.success('Đã cập nhật Features');
    } catch (error) {
      toast.error('Lỗi khi cập nhật Features');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Features</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
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
          onExpandedChange={(open) => toggleSection('header', open)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-6">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(open) => toggleSection('display', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="space-y-0.5">
                  <Label htmlFor="features-edit-show-icons" className="cursor-pointer text-sm">Hiển thị icon trong layout</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Bật để hiện icon trong card và carousel.</p>
                </div>
                <input
                  type="checkbox"
                  id="features-edit-show-icons"
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
                      brandColor={effectiveColors.primary}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div />
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Features"
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
                title="Font custom cho Features"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <FeaturesPreview
              items={featuresItems}
              sectionTitle={title}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={setStyle}
              showIcons={showIcons}
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
              desktopColumns={desktopColumns}
              cornerRadius={cornerRadius}
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
          canUndo: canUndofeaturesItems,
          canRedo: canRedofeaturesItems,
          onUndo: undofeaturesItems,
          onRedo: redofeaturesItems,
        }}
        />
      </form>
    </div>
  );
}

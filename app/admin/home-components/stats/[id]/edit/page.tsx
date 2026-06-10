'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { ToggleSwitch } from '@/components/modules/shared';
import { toast } from 'sonner';
import { Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { StatsForm, type StatsFormItem } from '../../_components/StatsForm';
import { StatsPreview } from '../../_components/StatsPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { DEFAULT_STATS_ITEMS, DEFAULT_STATS_CONFIG } from '../../_lib/constants';
import { normalizeStatsCornerRadius, normalizeStatsSpacing, type StatsBrandMode, type StatsItem, type StatsStyle, type StatsHeaderAlign, type StatsMediaPlacement, type StatsMediaAlign, type StatsSpacing, type StatsCornerRadius } from '../../_types';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../../_shared/components/FormSectionsToggleAllButton';

const COMPONENT_TYPE = 'Stats';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type StatsEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function StatsEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: StatsEditPageProps) {
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

  const [hideHeader, setHideHeader] = useState(false);
  const [title, setTitle] = useState('');
  const [showTitle, setShowTitle] = useState(DEFAULT_STATS_CONFIG.showTitle !== false);
  const [subtitle, setSubtitle] = useState('');
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_STATS_CONFIG.showSubtitle !== false);
  const [headerAlign, setHeaderAlign] = useState<StatsHeaderAlign>(DEFAULT_STATS_CONFIG.headerAlign ?? 'left');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(DEFAULT_STATS_CONFIG.desktopColumns ?? 4);
  const [mediaPlacement, setMediaPlacement] = useState<StatsMediaPlacement>(DEFAULT_STATS_CONFIG.mediaPlacement ?? 'top');
  const [mediaAlign, setMediaAlign] = useState<StatsMediaAlign>(DEFAULT_STATS_CONFIG.mediaAlign ?? 'center');
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_STATS_CONFIG.backgroundImage ?? '');
  const [backgroundImageStorageId, setBackgroundImageStorageId] = useState<string | null>(null);
  const [fullWidth, setFullWidth] = useState(DEFAULT_STATS_CONFIG.fullWidth ?? false);
  const [spacing, setSpacing] = useState<StatsSpacing>(DEFAULT_STATS_CONFIG.spacing ?? 'normal');
  const [cornerRadius, setCornerRadius] = useState<StatsCornerRadius>(DEFAULT_STATS_CONFIG.cornerRadius ?? 'lg');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [enableAnimation, setEnableAnimation] = useState(false);
  const [active, setActive] = useState(true);
  const {
    state: statsItems,
    set: setStatsItems,
    undo: undostatsItems,
    redo: redostatsItems,
    canUndo: canUndostatsItems,
    canRedo: canRedostatsItems,
    reset: resetstatsItems,
  } = useUndoRedo<StatsFormItem[]>([], { maxHistory: 15 });
  const [statsStyle, setStatsStyle] = useState<StatsStyle>('horizontal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['header', 'display', 'stats'], false);
  const [initialData, setInitialData] = useState<{
    hideHeader: boolean;
    title: string;
    showTitle: boolean;
    subtitle: string;
    showSubtitle: boolean;
    headerAlign: StatsHeaderAlign;
    desktopColumns: 3 | 4;
    mediaPlacement: StatsMediaPlacement;
    mediaAlign: StatsMediaAlign;
    backgroundImage: string;
    backgroundImageStorageId: string | null;
    fullWidth: boolean;
    spacing: StatsSpacing;
    cornerRadius: StatsCornerRadius;
    titleColorPrimary: boolean;
    subtitleAboveTitle: boolean;
    uppercaseText: boolean;
    showBadge: boolean;
    badgeText: string;
    enableAnimation: boolean;
    active: boolean;
    items: StatsFormItem[];
    style: StatsStyle;
  } | null>(null);
  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const resolvedInitialSecondary = resolveSecondaryByMode(initialCustom.mode, initialCustom.primary, initialCustom.secondary);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'Stats') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const items = (config.items as StatsItem[] | undefined) ?? DEFAULT_STATS_ITEMS;
      const mappedItems = items.map((item, idx) => ({ 
        id: `stat-${idx}`, 
        label: item.label, 
        value: item.value,
        description: item.description,
        iconType: item.iconType,
        iconName: item.iconName,
        iconUrl: item.iconUrl,
        iconStorageId: item.iconStorageId,
      }));
      const style = (config.style as StatsStyle) || 'horizontal';
      const resolvedShowTitle = typeof config.showTitle === 'boolean' ? config.showTitle : DEFAULT_STATS_CONFIG.showTitle !== false;
      const resolvedShowSubtitle = typeof config.showSubtitle === 'boolean' ? config.showSubtitle : DEFAULT_STATS_CONFIG.showSubtitle !== false;
      const resolvedSubtitle = typeof config.subtitle === 'string' ? config.subtitle : DEFAULT_STATS_CONFIG.subtitle ?? '';
      const resolvedHeaderAlign = (config.headerAlign as StatsHeaderAlign) || DEFAULT_STATS_CONFIG.headerAlign || 'left';
      const resolvedDesktopColumns = (config.desktopColumns as 3 | 4) || DEFAULT_STATS_CONFIG.desktopColumns || 4;
      const resolvedMediaPlacement = (config.mediaPlacement as StatsMediaPlacement) || DEFAULT_STATS_CONFIG.mediaPlacement || 'top';
      const resolvedMediaAlign = (config.mediaAlign as StatsMediaAlign) || DEFAULT_STATS_CONFIG.mediaAlign || 'center';
      const resolvedBackgroundImage = typeof config.backgroundImage === 'string' ? config.backgroundImage : DEFAULT_STATS_CONFIG.backgroundImage ?? '';
      const resolvedBackgroundImageStorageId = typeof config.backgroundImageStorageId === 'string' ? config.backgroundImageStorageId : null;
      const resolvedFullWidth = typeof config.fullWidth === 'boolean' ? config.fullWidth : DEFAULT_STATS_CONFIG.fullWidth ?? false;
      const resolvedSpacing = config.noVerticalMargin === true ? 'none' : normalizeStatsSpacing(config.spacing);
      const resolvedCornerRadius = normalizeStatsCornerRadius(config.cornerRadius, config.noBorderRadius);
      const resolvedTitleColorPrimary = typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : false;
      const resolvedSubtitleAboveTitle = typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : false;
      const resolvedUppercaseText = typeof config.uppercaseText === 'boolean' ? config.uppercaseText : false;
      const resolvedShowBadge = typeof config.showBadge === 'boolean' ? config.showBadge : true;
      const resolvedBadgeText = typeof config.badgeText === 'string' ? config.badgeText : '';
      const resolvedEnableAnimation = typeof config.enableAnimation === 'boolean' ? config.enableAnimation : false;
      const resolvedHideHeader = typeof config.hideHeader === 'boolean' ? config.hideHeader : false;

      resetstatsItems(mappedItems);
      setStatsStyle(style);
      setShowTitle(resolvedShowTitle);
      setSubtitle(resolvedSubtitle);
      setShowSubtitle(resolvedShowSubtitle);
      setHeaderAlign(resolvedHeaderAlign);
      setDesktopColumns(resolvedDesktopColumns);
      setMediaPlacement(resolvedMediaPlacement);
      setMediaAlign(resolvedMediaAlign);
      setBackgroundImage(resolvedBackgroundImage);
      setBackgroundImageStorageId(resolvedBackgroundImageStorageId);
      setFullWidth(resolvedFullWidth);
      setSpacing(resolvedSpacing);
      setCornerRadius(resolvedCornerRadius);
      setTitleColorPrimary(resolvedTitleColorPrimary);
      setSubtitleAboveTitle(resolvedSubtitleAboveTitle);
      setUppercaseText(resolvedUppercaseText);
      setShowBadge(resolvedShowBadge);
      setBadgeText(resolvedBadgeText);
      setEnableAnimation(resolvedEnableAnimation);
      setHideHeader(resolvedHideHeader);
      setInitialData({
        hideHeader: resolvedHideHeader,
        title: component.title,
        showTitle: resolvedShowTitle,
        subtitle: resolvedSubtitle,
        showSubtitle: resolvedShowSubtitle,
        headerAlign: resolvedHeaderAlign,
        desktopColumns: resolvedDesktopColumns,
        mediaPlacement: resolvedMediaPlacement,
        mediaAlign: resolvedMediaAlign,
        backgroundImage: resolvedBackgroundImage,
        backgroundImageStorageId: resolvedBackgroundImageStorageId,
        fullWidth: resolvedFullWidth,
        spacing: resolvedSpacing,
        cornerRadius: resolvedCornerRadius,
        titleColorPrimary: resolvedTitleColorPrimary,
        subtitleAboveTitle: resolvedSubtitleAboveTitle,
        uppercaseText: resolvedUppercaseText,
        showBadge: resolvedShowBadge,
        badgeText: resolvedBadgeText,
        enableAnimation: resolvedEnableAnimation,
        active: component.active,
        items: mappedItems,
        style,
      });
      setHasChanges(false);
    }
  }, [component, id, router, snapshotComponent]);

  useEffect(() => {
    if (!initialData) {return;}

    const currentItems = JSON.stringify(statsItems);
    const initialItems = JSON.stringify(initialData.items);
    const customChanged = enableTypeOverrides && showCustomBlock
      ? customState.enabled !== initialCustom.enabled
        || customState.mode !== initialCustom.mode
        || customState.primary !== initialCustom.primary
        || resolvedCustomSecondary !== resolvedInitialSecondary
      : false;
    const customFontChanged = enableTypeOverrides && showFontCustomBlock
      ? customFontState.enabled !== initialFontCustom.enabled
        || customFontState.fontKey !== initialFontCustom.fontKey
      : false;

    const changed = hideHeader !== initialData.hideHeader
      || title !== initialData.title
      || showTitle !== initialData.showTitle
      || subtitle !== initialData.subtitle
      || showSubtitle !== initialData.showSubtitle
      || headerAlign !== initialData.headerAlign
      || desktopColumns !== initialData.desktopColumns
      || mediaPlacement !== initialData.mediaPlacement
      || mediaAlign !== initialData.mediaAlign
      || backgroundImage !== initialData.backgroundImage
      || backgroundImageStorageId !== initialData.backgroundImageStorageId
      || fullWidth !== initialData.fullWidth
      || spacing !== initialData.spacing
      || cornerRadius !== initialData.cornerRadius
      || titleColorPrimary !== initialData.titleColorPrimary
      || subtitleAboveTitle !== initialData.subtitleAboveTitle
      || uppercaseText !== initialData.uppercaseText
      || showBadge !== initialData.showBadge
      || badgeText !== initialData.badgeText
      || enableAnimation !== initialData.enableAnimation
      || active !== initialData.active
      || statsStyle !== initialData.style
      || currentItems !== initialItems
      || customChanged
      || customFontChanged;

    setHasChanges(changed);
  }, [hideHeader, title, showTitle, subtitle, showSubtitle, headerAlign, desktopColumns, mediaPlacement, mediaAlign, backgroundImage, backgroundImageStorageId, fullWidth, spacing, cornerRadius, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, enableAnimation, active, statsItems, statsStyle, initialData, customState, initialCustom, showCustomBlock, customFontState, initialFontCustom, showFontCustomBlock, resolvedCustomSecondary, resolvedInitialSecondary, enableTypeOverrides]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
          items: statsItems.map((item) => ({ 
            label: item.label, 
            value: item.value,
            description: item.description,
            iconType: item.iconType,
            iconName: item.iconName,
            iconUrl: item.iconUrl,
            iconStorageId: item.iconStorageId,
          })),
          style: statsStyle,
          hideHeader,
          showTitle,
          subtitle,
          showSubtitle,
          headerAlign,
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
          titleColorPrimary,
          subtitleAboveTitle,
          uppercaseText,
          showBadge,
          badgeText,
          enableAnimation,
        };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active,
          config: nextConfig,
          id: id as Id<'homeComponents'>,
          title,
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
      toast.success('Đã cập nhật Thống kê');
      setInitialData({
        hideHeader,
        title,
        showTitle,
        subtitle,
        showSubtitle,
        headerAlign,
        desktopColumns,
        mediaPlacement,
        mediaAlign,
        backgroundImage,
        backgroundImageStorageId,
        fullWidth,
        spacing,
        cornerRadius,
        titleColorPrimary,
        subtitleAboveTitle,
        uppercaseText,
        showBadge,
        badgeText,
        enableAnimation,
        active,
        items: statsItems,
        style: statsStyle,
      });
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Thống kê</h1>
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        {snapshotLabel ? <p className="text-sm text-slate-500">Snapshot: {snapshotLabel}</p> : null}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Thống kê"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={customState.secondary}
                onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
                onModeChange={(next) => {
                  if (next === 'single') {
                    setCustomState((prev) => ({ ...prev, mode: 'single', secondary: prev.primary }));
                    return;
                  }
                  setCustomState((prev) => ({
                    ...prev,
                    mode: 'dual',
                    secondary: prev.mode === 'single' ? getSuggestedSecondary(prev.primary) : prev.secondary,
                  }));
                }}
                onPrimaryChange={(value) => {
                  setCustomState((prev) => ({
                    ...prev,
                    primary: value,
                    secondary: prev.mode === 'single' ? value : prev.secondary,
                  }));
                }}
                onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: value }))}
              />
            )}
            {enableTypeOverrides && showFontCustomBlock && (
              <TypeFontOverrideCard
                title="Font custom cho Thống kê"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <StatsPreview
              items={statsItems}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode as StatsBrandMode}
              selectedStyle={statsStyle}
              onStyleChange={setStatsStyle}
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
          canUndo: canUndostatsItems,
          canRedo: canRedostatsItems,
          onUndo: undostatsItems,
          onRedo: redostatsItems,
        }}
        />
      </form>
    </div>
  );
}

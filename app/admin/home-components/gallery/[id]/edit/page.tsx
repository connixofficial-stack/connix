'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { CollapsibleSubSection as SubSection } from '../../../_shared/components/CollapsibleSubSection';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { GalleryForm } from '../../_components/GalleryForm';
import { GalleryPreview } from '../../_components/GalleryPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_GALLERY_ITEMS } from '../../_lib/constants';
import { getGalleryPersistSafeColors, normalizeGalleryHarmony } from '../../_lib/colors';
import type { GalleryItem, GalleryStyle, GalleryCornerRadius, GalleryDesktopColumns } from '../../_types';
import { DEFAULT_GALLERY_CONFIG, normalizeGalleryCornerRadius, normalizeGalleryDesktopColumns } from '../../_types';
import { ToggleSwitch } from '@/components/modules/shared';
import { AiDemoGalleryImport } from '../../../product-list/_components/AiDemoProductsImport';

const DEMO_GALLERY_ITEMS: GalleryItem[] = [
  { id: 'demo-1', link: '', url: '/demo/gallery/gallery-1.png' },
  { id: 'demo-2', link: '', url: '/demo/gallery/gallery-2.png' },
  { id: 'demo-3', link: '', url: '/demo/gallery/gallery-3.png' },
  { id: 'demo-4', link: '', url: '/demo/gallery/gallery-4.png' },
  { id: 'demo-5', link: '', url: '/demo/gallery/gallery-5.png' },
  { id: 'demo-6', link: '', url: '/demo/gallery/gallery-6.png' },
];

const COMPONENT_TYPE = 'Gallery';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type GalleryEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function GalleryEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: GalleryEditPageProps) {
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
    state: galleryItems,
    set: setGalleryItems,
    undo: undogalleryItems,
    redo: redogalleryItems,
    canUndo: canUndogalleryItems,
    canRedo: canRedogalleryItems,
    reset: resetgalleryItems,
  } = useUndoRedo<GalleryItem[]>(DEFAULT_GALLERY_ITEMS, { maxHistory: 15 });
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>('grid');
  const [fullWidthDesktop, setFullWidthDesktop] = useState(false);
  const [desktopColumns, setDesktopColumns] = useState<GalleryDesktopColumns>(DEFAULT_GALLERY_CONFIG.desktopColumns ?? 4);
  const [cornerRadius, setCornerRadius] = useState<GalleryCornerRadius>(DEFAULT_GALLERY_CONFIG.cornerRadius ?? 'lg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Header state
  const [hideHeader, setHideHeader] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header', 'display'], false);

  const harmony = normalizeGalleryHarmony((component?.config as { harmony?: string } | undefined)?.harmony);


  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type === 'Partners') {
      router.replace(`/admin/home-components/partners/${id}/edit`);
      return;
    }

    if (!snapshotComponent && component.type === 'TrustBadges') {
      router.replace(`/admin/home-components/trust-badges/${id}/edit`);
      return;
    }

    if (!snapshotComponent && component.type !== 'Gallery') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const items = (config.items as { url: string; link: string; name?: string; storageId?: string }[] | undefined) ?? DEFAULT_GALLERY_ITEMS;
    const normalizedItems = items.map((item, idx) => ({ id: `item-${idx + 1}`, link: item.link || '', name: item.name ?? '', url: item.url, storageId: item.storageId as Id<'_storage'> | undefined }));
    resetgalleryItems(normalizedItems);

    const nextGalleryStyle = (config.style as GalleryStyle) || 'grid';
    setGalleryStyle(nextGalleryStyle);

    // Load header config
    const headerConfig = extractSectionHeaderConfig(config);
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setHeaderAlign(headerConfig.headerAlign ?? 'left');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
    const nextSpacing = config.noVerticalMargin === true ? 'none' : (headerConfig.spacing ?? DEFAULT_SECTION_SPACING);
    setSpacing(nextSpacing);
    const nextFullWidthDesktop = ((config.fullWidthDesktop ?? config.fullWidth) as boolean) ?? false;
    setFullWidthDesktop(nextFullWidthDesktop);
    const nextDesktopColumns = normalizeGalleryDesktopColumns(config.desktopColumns);
    setDesktopColumns(nextDesktopColumns);
    const nextCornerRadius = normalizeGalleryCornerRadius(config.cornerRadius, config.noBorderRadius);
    setCornerRadius(nextCornerRadius);

    setInitialSnapshot(JSON.stringify({
      title: component.title,
      active: component.active,
      items: normalizedItems,
      style: nextGalleryStyle,
      harmony,
      type: component.type,
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
      spacing: nextSpacing,
      fullWidthDesktop: nextFullWidthDesktop,
      desktopColumns: nextDesktopColumns,
      cornerRadius: nextCornerRadius,
    }));
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
    if (!component || !initialSnapshot) {return;}
    const snapshot = JSON.stringify({
      title,
      active,
      items: galleryItems,
      style: galleryStyle,
      harmony,
      type: component.type,
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
      spacing,
      fullWidthDesktop,
      desktopColumns,
      cornerRadius,
    });
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, galleryItems, galleryStyle, harmony, component, initialSnapshot, customChanged, customFontChanged, hideHeader, showTitle, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, fullWidthDesktop, desktopColumns, cornerRadius]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    const { autoHeal } = getGalleryPersistSafeColors({
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: effectiveColors.mode,
      harmony,
    });

    if (autoHeal.didAutoHealHarmony || autoHeal.didAutoHealText) {
      const messages: string[] = [];
      if (autoHeal.didAutoHealHarmony) {
        messages.push('Hệ thống đã tự tối ưu màu phụ để đảm bảo hài hòa.');
      }
      if (autoHeal.didAutoHealText) {
        messages.push('Hệ thống đã tự điều chỉnh màu chữ để tăng độ đọc.');
      }
      if (autoHeal.isStillSimilar) {
        messages.push('Màu phụ vẫn khá gần màu chính, đã chọn phương án gần nhất.');
      }
      toast.info(messages.join(' '));
    }

    setIsSubmitting(true);
    try {
      const nextConfig = {
          harmony,
          items: galleryItems.map((item) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
          style: galleryStyle,
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
          fullWidthDesktop,
          desktopColumns,
          cornerRadius,
          noBorderRadius: cornerRadius === 'none',
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
      toast.success('Đã cập nhật component');
      setInitialSnapshot(JSON.stringify({
        title,
        active,
        items: galleryItems,
        style: galleryStyle,
        harmony,
        type: component?.type,
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
        spacing,
        fullWidthDesktop,
        desktopColumns,
        cornerRadius,
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Thư viện ảnh</h1>
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
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={headerOpenSections.display}
            onOpenChange={(open) => toggleHeaderSection('display', open)}
            spacing={spacing}
            onSpacingChange={setSpacing}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
          >
            <div className="space-y-2">
              <Label>Số cột desktop</Label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 6].map((option) => {
                  const selected = desktopColumns === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setDesktopColumns(option as GalleryDesktopColumns); }}
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
              <ToggleSwitch enabled={fullWidthDesktop} onChange={() => setFullWidthDesktop((current) => !current)} />
            </div>
          </HomeComponentDisplaySettingsSection>
        </div>

        <div className="mb-6">
          <SubSection icon={ImageIcon} title="Thư viện ảnh" defaultOpen={true}>
            <div className="space-y-4">
<GalleryForm
                galleryItems={galleryItems}
                setGalleryItems={setGalleryItems}
                componentType="Gallery"
                style={galleryStyle}
                headerPrimary={effectiveColors.primary}
                headerSecondary={effectiveColors.secondary}
              />

              <div className="flex justify-start gap-2">
                <Button type="button" variant="outline" onClick={() => setGalleryItems(DEMO_GALLERY_ITEMS)}>
                  Dùng ảnh demo
                </Button>
                <AiDemoGalleryImport buttonClassName="h-10" onApply={setGalleryItems} />
              </div>
            </div>
          </SubSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Thư viện ảnh"
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
                title="Font custom cho Thư viện ảnh"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <GalleryPreview
              items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              harmony={harmony}
              selectedStyle={galleryStyle}
              onStyleChange={setGalleryStyle}
              title={title}
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
              fullWidthDesktop={fullWidthDesktop}
              desktopColumns={desktopColumns}
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
          canUndo: canUndogalleryItems,
          canRedo: canRedogalleryItems,
          onUndo: undogalleryItems,
          onRedo: redogalleryItems,
        }}
        />
      </form>
    </div>
  );
}

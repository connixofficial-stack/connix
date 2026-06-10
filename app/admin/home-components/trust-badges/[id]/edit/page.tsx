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
import { toast } from 'sonner';
import { Button } from '@/app/admin/components/ui';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { DEFAULT_STACK_DESCRIPTION, DEFAULT_STACK_HEADING, DEFAULT_TRUST_CUE_TEXT } from '../../../gallery/_components/TrustBadgesSectionShared';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig, useSectionHeaderState } from '../../../_shared/hooks/useSectionHeaderState';
import type { SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { TrustBadgesPreview } from '../../../gallery/_components/TrustBadgesPreview';
import { TrustBadgesForm } from '../../_components/TrustBadgesForm';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_GALLERY_ITEMS } from '../../../gallery/_lib/constants';
import { getGalleryPersistSafeColors, normalizeGalleryHarmony } from '../../../gallery/_lib/colors';
import {
  DEFAULT_TRUST_BADGES_CORNER_RADIUS,
  normalizeTrustBadgesCornerRadius,
  normalizeTrustBadgesStyle,
  type GalleryItem,
  type TrustBadgesCornerRadius,
  type TrustBadgesStyle,
} from '../../../gallery/_types';

const COMPONENT_TYPE = 'TrustBadges';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type TrustBadgesEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};
const DEMO_TRUST_BADGE_ITEMS: GalleryItem[] = [
  { id: 'demo-1', link: '', name: 'ISO 9001', url: '/demo/trust-badges/certificate-1.png' },
  { id: 'demo-2', link: '', name: 'Chứng nhận chất lượng', url: '/demo/trust-badges/certificate-2.png' },
  { id: 'demo-3', link: '', name: 'Đối tác xác thực', url: '/demo/trust-badges/certificate-3.png' },
  { id: 'demo-4', link: '', name: 'Giải thưởng thương hiệu', url: '/demo/trust-badges/certificate-4.png' },
  { id: 'demo-5', link: '', name: 'Cam kết xanh', url: '/demo/trust-badges/certificate-5.png' },
  { id: 'demo-6', link: '', name: 'Bảo mật giao dịch', url: '/demo/trust-badges/certificate-6.png' },
];

const buildHeaderSnapshot = ({
  badgeText,
  headerAlign,
  hideHeader,
  showBadge,
  showSubtitle,
  showTitle,
  subtitle,
  subtitleAboveTitle,
  titleColorPrimary,
  uppercaseText,
  spacing,
}: {
  badgeText?: string;
  spacing?: SectionSpacing;
  headerAlign?: 'left' | 'center' | 'right';
  hideHeader?: boolean;
  showBadge?: boolean;
  showSubtitle?: boolean;
  showTitle?: boolean;
  subtitle?: string;
  subtitleAboveTitle?: boolean;
  titleColorPrimary?: boolean;
  uppercaseText?: boolean;
}) => ({
  hideHeader: hideHeader ?? false,
  showTitle: showTitle ?? true,
  subtitle: subtitle ?? '',
  showSubtitle: showSubtitle ?? true,
  headerAlign: headerAlign ?? 'left',
  titleColorPrimary: titleColorPrimary ?? false,
  subtitleAboveTitle: subtitleAboveTitle ?? false,
  uppercaseText: uppercaseText ?? false,
  showBadge: showBadge ?? true,
  badgeText: badgeText ?? '',
  spacing: spacing ?? 'normal',
});

export default function TrustBadgesEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: TrustBadgesEditPageProps) {
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
  const [trustBadgesStyle, setTrustBadgesStyle] = useState<TrustBadgesStyle>('cards');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(4);
  const [cornerRadius, setCornerRadius] = useState<TrustBadgesCornerRadius>(DEFAULT_TRUST_BADGES_CORNER_RADIUS);
  const [showBorder, setShowBorder] = useState(true);
  const [trustCueText, setTrustCueText] = useState(DEFAULT_TRUST_CUE_TEXT);
  const [stackHeading, setStackHeading] = useState(DEFAULT_STACK_HEADING);
  const [stackDescription, setStackDescription] = useState(DEFAULT_STACK_DESCRIPTION);
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const headerState = useSectionHeaderState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!component) {return;}
    if (!snapshotComponent && component.type !== 'TrustBadges') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const items = (config.items as { url: string; link: string; name?: string; storageId?: string }[] | undefined) ?? DEFAULT_GALLERY_ITEMS;
    const normalizedItems = items.map((item, idx) => ({ id: `item-${idx + 1}`, link: item.link || '', name: item.name ?? '', url: item.url, storageId: item.storageId as Id<'_storage'> | undefined }));
    resetgalleryItems(normalizedItems);

    const nextStyle = normalizeTrustBadgesStyle(config.style);
    const nextCornerRadius = normalizeTrustBadgesCornerRadius(config.cornerRadius, config.noBorderRadius);
    setTrustBadgesStyle(nextStyle);
    setDesktopColumns(config.desktopColumns === 3 ? 3 : 4);
    setCornerRadius(nextCornerRadius);
    setShowBorder(config.showBorder === false ? false : true);
    setTrustCueText(typeof config.trustCueText === 'string' ? config.trustCueText : DEFAULT_TRUST_CUE_TEXT);
    setStackHeading(typeof config.stackHeading === 'string' ? config.stackHeading : DEFAULT_STACK_HEADING);
    setStackDescription(typeof config.stackDescription === 'string' ? config.stackDescription : DEFAULT_STACK_DESCRIPTION);

    const headerConfig = extractSectionHeaderConfig(config);
    headerState.setHideHeader(headerConfig.hideHeader ?? false);
    headerState.setShowTitle(headerConfig.showTitle ?? true);
    headerState.setSubtitle(headerConfig.subtitle ?? '');
    headerState.setShowSubtitle(headerConfig.showSubtitle ?? true);
    headerState.setHeaderAlign(headerConfig.headerAlign ?? 'center');
    headerState.setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    headerState.setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    headerState.setUppercaseText(headerConfig.uppercaseText ?? false);
    headerState.setShowBadge(headerConfig.showBadge ?? true);
    headerState.setBadgeText(headerConfig.badgeText ?? '');
    const nextSpacing = config.noVerticalMargin === true ? 'none' : (headerConfig.spacing ?? 'normal');
    headerState.setSpacing(nextSpacing);

    setInitialSnapshot(JSON.stringify({
      title: component.title,
      active: component.active,
      items: normalizedItems,
      style: nextStyle,
      desktopColumns: config.desktopColumns === 3 ? 3 : 4,
      cornerRadius: nextCornerRadius,
      showBorder: config.showBorder === false ? false : true,
      trustCueText: typeof config.trustCueText === 'string' ? config.trustCueText : DEFAULT_TRUST_CUE_TEXT,
      stackHeading: typeof config.stackHeading === 'string' ? config.stackHeading : DEFAULT_STACK_HEADING,
      stackDescription: typeof config.stackDescription === 'string' ? config.stackDescription : DEFAULT_STACK_DESCRIPTION,
      header: buildHeaderSnapshot({ ...headerConfig, spacing: nextSpacing }),
      type: component.type,
    }));
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) {return;}
    const snapshot = JSON.stringify({
      title,
      active,
      items: galleryItems,
      style: trustBadgesStyle,
      desktopColumns,
      cornerRadius,
      showBorder,
      trustCueText,
      stackHeading,
      stackDescription,
      header: buildHeaderSnapshot({
        badgeText: headerState.badgeText,
        spacing: headerState.spacing,
        headerAlign: headerState.headerAlign,
        hideHeader: headerState.hideHeader,
        showBadge: headerState.showBadge,
        showSubtitle: headerState.showSubtitle,
        showTitle: headerState.showTitle,
        subtitle: headerState.subtitle,
        subtitleAboveTitle: headerState.subtitleAboveTitle,
        titleColorPrimary: headerState.titleColorPrimary,
        uppercaseText: headerState.uppercaseText,
      }),
      type: component.type,
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
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, galleryItems, trustBadgesStyle, desktopColumns, cornerRadius, showBorder, trustCueText, stackHeading, stackDescription, headerState.hideHeader, headerState.showTitle, headerState.subtitle, headerState.showSubtitle, headerState.headerAlign, headerState.titleColorPrimary, headerState.subtitleAboveTitle, headerState.uppercaseText, headerState.showBadge, headerState.badgeText, headerState.spacing, component, initialSnapshot, customState, initialCustom, showCustomBlock, customFontState, initialFontCustom, showFontCustomBlock]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    const harmony = normalizeGalleryHarmony((component?.config as { harmony?: string } | undefined)?.harmony);
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
        items: galleryItems.map((item) => ({ link: item.link, name: item.name, url: item.url, storageId: item.storageId })),
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
        style: trustBadgesStyle,
        desktopColumns,
        cornerRadius,
        showBorder,
        trustCueText,
        stackHeading,
        stackDescription,
        header: buildHeaderSnapshot({
          badgeText: headerState.badgeText,
          spacing: headerState.spacing,
          headerAlign: headerState.headerAlign,
          hideHeader: headerState.hideHeader,
          showBadge: headerState.showBadge,
          showSubtitle: headerState.showSubtitle,
          showTitle: headerState.showTitle,
          subtitle: headerState.subtitle,
          subtitleAboveTitle: headerState.subtitleAboveTitle,
          titleColorPrimary: headerState.titleColorPrimary,
          uppercaseText: headerState.uppercaseText,
        }),
        type: component?.type,
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

  const handleUseDemoImages = () => {
    setGalleryItems(DEMO_TRUST_BADGE_ITEMS);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Chứng nhận</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
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
          expanded={expandedSections.header}
          onExpandedChange={(value) => setExpandedSections({ header: value })}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
          titlePlaceholder="Nhập tiêu đề component..."
        />

        <TrustBadgesForm
          items={galleryItems}
          setItems={setGalleryItems}
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
          onAiImport={setGalleryItems}
          actions={(
            <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
              Dùng ảnh demo
            </Button>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Chứng nhận"
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
                title="Font custom cho Chứng nhận"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <TrustBadgesPreview
              items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
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

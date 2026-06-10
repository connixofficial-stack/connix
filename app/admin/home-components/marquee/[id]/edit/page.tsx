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
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { MarqueePreview } from '../../_components/MarqueePreview';
import { MarqueeForm } from '../../_components/MarqueeForm';
import { MarqueeDisplayConfig } from '../../_components/MarqueeDisplayConfig';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_MARQUEE_CONFIG } from '../../_lib/constants';
import type { MarqueeConfig, MarqueeItem, MarqueeStyle, MarqueeBrandMode, MarqueeCornerRadius, MarqueeDirection, MarqueeScale, MarqueeSpeed } from '../../_types';
import { normalizeMarqueeCornerRadius, normalizeMarqueeItem, normalizeMarqueeSpacing, normalizeMarqueeStyle, normalizeMarqueeDirection, normalizeMarqueeSpeed, normalizeMarqueeScale, toMarqueePersistItem } from '../../_types';

const COMPONENT_TYPE = 'Marquee';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type MarqueeEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function MarqueeEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: MarqueeEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode: MarqueeBrandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);

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
    reset: resetitems,
  } = useUndoRedo<MarqueeItem[]>([], { maxHistory: 15 });
  const [style, setStyle] = useState<MarqueeStyle>('ribbon');
  const [direction, setDirection] = useState<MarqueeDirection>('left');
  const [speed, setSpeed] = useState<MarqueeSpeed>('normal');
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [scale, setScale] = useState<MarqueeScale>(1);
  const [uppercase, setUppercase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Header state
  const [hideHeader, setHideHeader] = useState(true);
  const [showTitleHeader, setShowTitleHeader] = useState(true);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('center');
  const [titleColorPrimary, setTitleColorPrimary] = useState(false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
  const [uppercaseText, setUppercaseText] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [badgeText, setBadgeText] = useState('');
  const [spacing, setSpacing] = useState<SectionSpacing>(DEFAULT_SECTION_SPACING);
  const [cornerRadius, setCornerRadius] = useState<MarqueeCornerRadius>(DEFAULT_MARQUEE_CONFIG.cornerRadius ?? 'none');
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);

  useEffect(() => {
    if (!component) { return; }
    if (!snapshotComponent && component.type !== 'Marquee') { router.replace(`/admin/home-components/${id}/edit`); return; }

    setTitle(component.title);
    setActive(component.active);

    const rawConfig = (component.config ?? {}) as Partial<MarqueeConfig>;
    const loadedItems = Array.isArray(rawConfig.items)
      ? rawConfig.items.map((item, idx) => normalizeMarqueeItem(item, idx))
      : DEFAULT_MARQUEE_CONFIG.items.map((item, idx) => normalizeMarqueeItem(item, idx));

    resetitems(loadedItems);
    setStyle(normalizeMarqueeStyle(rawConfig.style));
    setDirection(normalizeMarqueeDirection(rawConfig.direction));
    setSpeed(normalizeMarqueeSpeed(rawConfig.speed));
    setPauseOnHover(rawConfig.pauseOnHover !== false);
    setScale(normalizeMarqueeScale(rawConfig.scale));
    setUppercase(rawConfig.uppercase === true);

    const headerConfig = extractSectionHeaderConfig(rawConfig);
    setHideHeader(headerConfig.hideHeader ?? true);
    setShowTitleHeader(headerConfig.showTitle ?? true);
    setShowSubtitle(headerConfig.showSubtitle ?? false);
    setSubtitle(headerConfig.subtitle ?? '');
    setHeaderAlign(headerConfig.headerAlign ?? 'center');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    const resolvedBadgeText = headerConfig.badgeText ?? '';
    setShowBadge((headerConfig.showBadge ?? false) || resolvedBadgeText.trim().length > 0);
    setBadgeText(resolvedBadgeText);
    setSpacing(normalizeMarqueeSpacing(headerConfig.spacing, rawConfig.noVerticalMargin));
    setCornerRadius(normalizeMarqueeCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius));

    const snapshot = JSON.stringify({ active: component.active, items: loadedItems, style: rawConfig.style, direction: rawConfig.direction, speed: rawConfig.speed, pauseOnHover: rawConfig.pauseOnHover, scale: rawConfig.scale, uppercase: rawConfig.uppercase, title: component.title, hideHeader: headerConfig.hideHeader, showTitle: headerConfig.showTitle, showSubtitle: headerConfig.showSubtitle, subtitle: headerConfig.subtitle, headerAlign: headerConfig.headerAlign, titleColorPrimary: headerConfig.titleColorPrimary, subtitleAboveTitle: headerConfig.subtitleAboveTitle, uppercaseText: headerConfig.uppercaseText, showBadge: headerConfig.showBadge, badgeText: headerConfig.badgeText, spacing: normalizeMarqueeSpacing(headerConfig.spacing, rawConfig.noVerticalMargin), cornerRadius: normalizeMarqueeCornerRadius(rawConfig.cornerRadius, rawConfig.noBorderRadius) });
    setInitialSnapshot(snapshot);
    setHasChanges(false);
  }, [component, id, router]);

  useEffect(() => {
    if (!component || !initialSnapshot) { return; }
    const snapshot = JSON.stringify({ active, items, style, direction, speed, pauseOnHover, scale, uppercase, title, hideHeader, showTitle: showTitleHeader, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius });
    const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
    const customChanged = enableTypeOverrides && showCustomBlock ? customState.enabled !== initialCustom.enabled || customState.mode !== initialCustom.mode || customState.primary !== initialCustom.primary || resolvedCustomSecondary !== initialCustom.secondary : false;
    const customFontChanged = enableTypeOverrides && showFontCustomBlock ? customFontState.enabled !== initialFontCustom.enabled || customFontState.fontKey !== initialFontCustom.fontKey : false;
    setHasChanges(snapshot !== initialSnapshot || customChanged || customFontChanged);
  }, [title, active, items, style, direction, speed, pauseOnHover, scale, uppercase, component, initialSnapshot, customState, initialCustom, showCustomBlock, customFontState, initialFontCustom, showFontCustomBlock, hideHeader, showTitleHeader, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) { return; }
    setIsSubmitting(true);
    try {
      const nextConfig = { items: items.map(toMarqueePersistItem), style, direction, speed, pauseOnHover, scale, uppercase, hideHeader, showTitle: showTitleHeader, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius };
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: nextConfig, title });
      } else {
        await updateMutation({
          active, id: id as Id<'homeComponents'>, title,
          config: nextConfig,
        });
      }
      if (enableTypeOverrides && showCustomBlock) {
        await setTypeColorOverride({ enabled: customState.enabled, mode: customState.mode, primary: customState.primary, secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary), type: COMPONENT_TYPE });
      }
      if (enableTypeOverrides && showFontCustomBlock) {
        await setTypeFontOverride({ enabled: customFontState.enabled, fontKey: customFontState.fontKey, type: COMPONENT_TYPE });
      }
      toast.success('Đã cập nhật Marquee');
      const snapshot = JSON.stringify({ active, items, style, direction, speed, pauseOnHover, scale, uppercase, title, hideHeader, showTitle: showTitleHeader, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, cornerRadius });
      setInitialSnapshot(snapshot);
      if (enableTypeOverrides && showCustomBlock) { setInitialCustom({ enabled: customState.enabled, mode: customState.mode, primary: customState.primary, secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary) }); }
      if (enableTypeOverrides && showFontCustomBlock) { setInitialFontCustom({ enabled: customFontState.enabled, fontKey: customFontState.fontKey }); }
      setHasChanges(false);
    } catch (error) { toast.error('Lỗi khi cập nhật'); console.error(error); } finally { setIsSubmitting(false); }
  };

  if (component === undefined) { return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>; }
  if (component === null) { return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>; }

  const fontStyleVar = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Chạy chữ</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <HeaderConfigSection
          hideHeader={hideHeader} title={title} showTitle={showTitleHeader} subtitle={subtitle}
          showSubtitle={showSubtitle} headerAlign={headerAlign} titleColorPrimary={titleColorPrimary}
          subtitleAboveTitle={subtitleAboveTitle} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText}
          onHideHeaderChange={setHideHeader} onTitleChange={setTitle} onShowTitleChange={setShowTitleHeader}
          onSubtitleChange={setSubtitle} onShowSubtitleChange={setShowSubtitle} onHeaderAlignChange={setHeaderAlign}
          onTitleColorPrimaryChange={setTitleColorPrimary} onSubtitleAboveTitleChange={setSubtitleAboveTitle}
          onUppercaseTextChange={setUppercaseText} onShowBadgeChange={setShowBadge}
          onBadgeTextChange={(value) => { setBadgeText(value); if (value.trim()) { setShowBadge(true); } }}
          expanded={openSections.header} onExpandedChange={(open) => toggleSection('header', open)}
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(open) => toggleSection('display', open)}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={(value) => setCornerRadius(value as MarqueeCornerRadius)}
            spacing={spacing}
            onSpacingChange={setSpacing}
          />
        </div>

        <MarqueeForm items={items} setItems={setItems} defaultExpanded={false} />

        <MarqueeDisplayConfig
          direction={direction} setDirection={setDirection}
          speed={speed} setSpeed={setSpeed}
          pauseOnHover={pauseOnHover} setPauseOnHover={setPauseOnHover}
          scale={scale} setScale={setScale}
          uppercase={uppercase} setUppercase={setUppercase}
        />

        <div className="space-y-4">
          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho Marquee" enabled={customState.enabled} mode={customState.mode}
              primary={customState.primary} secondary={customState.secondary}
              onEnabledChange={(next) => setCustomState((prev) => ({ ...prev, enabled: next }))}
              onModeChange={(next) => setCustomState((prev) => { if (next === 'single') { return { ...prev, mode: next, secondary: prev.primary }; } if (prev.mode === 'single') { return { ...prev, mode: next, secondary: getSuggestedSecondary(prev.primary) }; } return { ...prev, mode: next }; })}
              onPrimaryChange={(value) => setCustomState((prev) => ({ ...prev, primary: value, secondary: prev.mode === 'single' ? value : prev.secondary }))}
              onSecondaryChange={(value) => setCustomState((prev) => ({ ...prev, secondary: prev.mode === 'single' ? prev.primary : value }))}
            />
          )}
          {enableTypeOverrides && showFontCustomBlock && (
            <TypeFontOverrideCard title="Font custom cho Marquee" enabled={customFontState.enabled} fontKey={customFontState.fontKey}
              compact toggleLabel="Custom" fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <MarqueePreview
              items={items} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary}
              mode={brandMode} selectedStyle={style} onStyleChange={setStyle}
              direction={direction} speed={speed} pauseOnHover={pauseOnHover} scale={scale} uppercase={uppercase}
              fontStyle={fontStyleVar} fontClassName="font-active"
              title={title} subtitle={subtitle} hideHeader={hideHeader} showTitle={showTitleHeader}
              showSubtitle={showSubtitle} headerAlign={headerAlign} titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle} uppercaseText={uppercaseText} showBadge={showBadge} badgeText={badgeText}
              spacing={spacing}
              cornerRadius={cornerRadius}
            />
          </div>
        </div>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting} hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi" active={active} onActiveChange={setActive}
        
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

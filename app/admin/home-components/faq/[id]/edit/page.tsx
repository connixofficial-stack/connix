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
import { Label, cn } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { FaqForm } from '../../_components/FaqForm';
import { FaqPreview } from '../../_components/FaqPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_FAQ_CONFIG, DEFAULT_FAQ_ITEMS, FAQ_STYLES } from '../../_lib/constants';
import {
  normalizeFaqDesktopColumns,
  normalizeFaqRounded,
  normalizeFaqSpacing,
  type FaqConfig,
  type FaqItem,
  type FaqRounded,
  type FaqSpacing,
  type FaqStyle,
} from '../../_types';

const COMPONENT_TYPE = 'FAQ';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type FaqEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const FALLBACK_FAQ_ITEMS: FaqItem[] = DEFAULT_FAQ_ITEMS.map((item, idx) => ({
  ...item,
  id: `faq-${idx}`,
}));

const toFaqStyle = (value: unknown): FaqStyle => {
  if (typeof value !== 'string') {return 'wine-list';}
  const matchedStyle = FAQ_STYLES.find((style) => style.id === value);
  return matchedStyle?.id ?? 'wine-list';
};

const toFaqItems = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) {return FALLBACK_FAQ_ITEMS;}

  const mapped = value.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      return {
        id: `faq-${idx}`,
        question: '',
        answer: '',
      };
    }

    const data = item as { question?: unknown; answer?: unknown };

    return {
      id: `faq-${idx}`,
      question: typeof data.question === 'string' ? data.question : '',
      answer: typeof data.answer === 'string' ? data.answer : '',
    };
  });

  return mapped.length > 0 ? mapped : FALLBACK_FAQ_ITEMS;
};

const toFaqConfig = (value: Record<string, unknown> | null | undefined): FaqConfig => {
  const config = value ?? {};
  return {
    description: typeof config.description === 'string' ? config.description : DEFAULT_FAQ_CONFIG.description,
    buttonText: typeof config.buttonText === 'string' ? config.buttonText : DEFAULT_FAQ_CONFIG.buttonText,
    buttonLink: typeof config.buttonLink === 'string' ? config.buttonLink : DEFAULT_FAQ_CONFIG.buttonLink,
    // Header fields
    hideHeader: typeof config.hideHeader === 'boolean' ? config.hideHeader : DEFAULT_FAQ_CONFIG.hideHeader,
    showTitle: typeof config.showTitle === 'boolean' ? config.showTitle : DEFAULT_FAQ_CONFIG.showTitle,
    showSubtitle: typeof config.showSubtitle === 'boolean' ? config.showSubtitle : DEFAULT_FAQ_CONFIG.showSubtitle,
    subtitle: typeof config.subtitle === 'string' ? config.subtitle : DEFAULT_FAQ_CONFIG.subtitle,
    headerAlign: (config.headerAlign === 'left' || config.headerAlign === 'center' || config.headerAlign === 'right')
      ? config.headerAlign
      : DEFAULT_FAQ_CONFIG.headerAlign,
    titleColorPrimary: typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : DEFAULT_FAQ_CONFIG.titleColorPrimary,
    subtitleAboveTitle: typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : DEFAULT_FAQ_CONFIG.subtitleAboveTitle,
    uppercaseText: typeof config.uppercaseText === 'boolean' ? config.uppercaseText : DEFAULT_FAQ_CONFIG.uppercaseText,
    showBadge: typeof config.showBadge === 'boolean' ? config.showBadge : DEFAULT_FAQ_CONFIG.showBadge,
    badgeText: typeof config.badgeText === 'string' ? config.badgeText : DEFAULT_FAQ_CONFIG.badgeText,
    spacing: normalizeFaqSpacing(config.spacing, config.noVerticalMargin),
    cornerRadius: normalizeFaqRounded(config.cornerRadius ?? config.rounded, config.noBorderRadius),
    rounded: normalizeFaqRounded(config.cornerRadius ?? config.rounded, config.noBorderRadius),
    desktopColumns: normalizeFaqDesktopColumns(config.desktopColumns),
  };
};

export default function FaqEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: FaqEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);
  const brandMode = effectiveColors.mode === 'single' ? 'single' : 'dual';
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: faqItems,
    set: setFaqItems,
    undo: undofaqItems,
    redo: redofaqItems,
    canUndo: canUndofaqItems,
    canRedo: canRedofaqItems,
    reset: resetfaqItems,
  } = useUndoRedo<FaqItem[]>(FALLBACK_FAQ_ITEMS, { maxHistory: 15 });
  const [faqStyle, setFaqStyle] = useState<FaqStyle>('wine-list');
  const [faqConfig, setFaqConfig] = useState<FaqConfig>(DEFAULT_FAQ_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { openSections, toggleSection } = useFormSectionsState(['header', 'display'], false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  
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
  const [spacing, setSpacing] = useState<FaqSpacing>(DEFAULT_FAQ_CONFIG.spacing ?? 'normal');
  const [rounded, setRounded] = useState<FaqRounded>(DEFAULT_FAQ_CONFIG.rounded ?? 'none');
  const [desktopColumns, setDesktopColumns] = useState<3 | 4>(DEFAULT_FAQ_CONFIG.desktopColumns ?? 4);
  
  const [initialData, setInitialData] = useState<{
    title: string;
    active: boolean;
    faqItems: FaqItem[];
    faqStyle: FaqStyle;
    faqConfig: FaqConfig;
  } | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'FAQ') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    setTitle(component.title);
    setActive(component.active);

    const config = component.config ?? {};
    const nextFaqItems = toFaqItems(config.items);
    const nextFaqStyle = toFaqStyle(config.style);
    const nextFaqConfig = toFaqConfig(config);

    resetfaqItems(nextFaqItems);
    setFaqStyle(nextFaqStyle);
    setFaqConfig(nextFaqConfig);
    
    // Load header config
    setHideHeader(nextFaqConfig.hideHeader ?? false);
    setShowTitle(nextFaqConfig.showTitle ?? true);
    setShowSubtitle(nextFaqConfig.showSubtitle ?? true);
    setSubtitle(nextFaqConfig.subtitle ?? '');
    setHeaderAlign(nextFaqConfig.headerAlign ?? 'left');
    setTitleColorPrimary(nextFaqConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(nextFaqConfig.subtitleAboveTitle ?? false);
    setUppercaseText(nextFaqConfig.uppercaseText ?? false);
    setShowBadge(nextFaqConfig.showBadge ?? true);
    setBadgeText(nextFaqConfig.badgeText ?? '');
    setSpacing(nextFaqConfig.spacing ?? 'normal');
    setRounded(nextFaqConfig.rounded ?? 'none');
    setDesktopColumns(nextFaqConfig.desktopColumns ?? 4);
    
    setInitialData({
      title: component.title,
      active: component.active,
      faqItems: nextFaqItems,
      faqStyle: nextFaqStyle,
      faqConfig: nextFaqConfig,
    });
    setHasChanges(false);
  }, [component, id, router]);

  useEffect(() => {
    if (!initialData) {return;}

    const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
    const resolvedInitialSecondary = resolveSecondaryByMode(initialCustom.mode, initialCustom.primary, initialCustom.secondary);
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
    const headerChanged = hideHeader !== initialData.faqConfig.hideHeader
      || showTitle !== initialData.faqConfig.showTitle
      || showSubtitle !== initialData.faqConfig.showSubtitle
      || subtitle !== initialData.faqConfig.subtitle
      || headerAlign !== initialData.faqConfig.headerAlign
      || titleColorPrimary !== initialData.faqConfig.titleColorPrimary
      || subtitleAboveTitle !== initialData.faqConfig.subtitleAboveTitle
      || uppercaseText !== initialData.faqConfig.uppercaseText
      || showBadge !== initialData.faqConfig.showBadge
      || badgeText !== initialData.faqConfig.badgeText
      || spacing !== initialData.faqConfig.spacing
      || rounded !== initialData.faqConfig.rounded
      || desktopColumns !== initialData.faqConfig.desktopColumns;
    const changed = title !== initialData.title
      || active !== initialData.active
      || faqStyle !== initialData.faqStyle
      || JSON.stringify(faqItems) !== JSON.stringify(initialData.faqItems)
      || JSON.stringify(faqConfig) !== JSON.stringify(initialData.faqConfig)
      || customChanged
      || customFontChanged
      || headerChanged;

    setHasChanges(changed);
  }, [title, active, faqItems, faqStyle, faqConfig, initialData, customState, initialCustom, enableTypeOverrides, showCustomBlock, hideHeader, showTitle, showSubtitle, subtitle, headerAlign, titleColorPrimary, subtitleAboveTitle, uppercaseText, showBadge, badgeText, spacing, rounded, desktopColumns]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig: FaqConfig = {
        buttonLink: faqConfig.buttonLink,
        buttonText: faqConfig.buttonText,
        description: faqConfig.description,
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
        spacing,
        cornerRadius: rounded,
        rounded,
        desktopColumns,
      };

      const persistConfig = {
        buttonLink: nextConfig.buttonLink,
        buttonText: nextConfig.buttonText,
        description: nextConfig.description,
        items: faqItems.map((item) => ({ answer: item.answer, question: item.question })),
        style: faqStyle,
        hideHeader: nextConfig.hideHeader,
        showTitle: nextConfig.showTitle,
        showSubtitle: nextConfig.showSubtitle,
        subtitle: nextConfig.subtitle,
        headerAlign: nextConfig.headerAlign,
        titleColorPrimary: nextConfig.titleColorPrimary,
        subtitleAboveTitle: nextConfig.subtitleAboveTitle,
        uppercaseText: nextConfig.uppercaseText,
        showBadge: nextConfig.showBadge,
        badgeText: nextConfig.badgeText,
        spacing: nextConfig.spacing,
        cornerRadius: nextConfig.cornerRadius,
        rounded: nextConfig.rounded,
        desktopColumns: nextConfig.desktopColumns,
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
      toast.success('Đã cập nhật FAQ');
      setFaqConfig(nextConfig);
      setInitialData({
        title,
        active,
        faqItems,
        faqStyle,
        faqConfig: nextConfig,
      });
      if (enableTypeOverrides && showCustomBlock) {
        const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa FAQ</h1>
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
          onExpandedChange={(open) => toggleSection('header', open)}
        />

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={openSections.display}
            onOpenChange={(open) => toggleSection('display', open)}
            cornerRadius={rounded}
            onCornerRadiusChange={(cornerRadius) => setRounded(cornerRadius as FaqRounded)}
            spacing={spacing}
            onSpacingChange={setSpacing}
          >
              {faqStyle === 'cards' ? (
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
                  <p className="text-xs text-slate-500">4 cột: tablet/mobile 2. 3 cột: tablet 3, mobile 1.</p>
                </div>
              ) : null}
          </HomeComponentDisplaySettingsSection>
        </div>

        <FaqForm
          faqItems={faqItems}
          setFaqItems={setFaqItems}
          faqStyle={faqStyle}
          brandColor={effectiveColors.primary}
          faqConfig={faqConfig}
          setFaqConfig={setFaqConfig}
          expanded={faqExpanded}
          onExpandedChange={setFaqExpanded}
        />

        <div className="space-y-4">
          {enableTypeOverrides && showCustomBlock && (
            <TypeColorOverrideCard
              title="Màu custom cho FAQ"
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
              title="Font custom cho FAQ"
              enabled={customFontState.enabled}
              fontKey={customFontState.fontKey}
              compact
              toggleLabel="Custom"
              fontLabel="Font"
              onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
              onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <FaqPreview
              items={faqItems}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={brandMode}
              selectedStyle={faqStyle}
              onStyleChange={setFaqStyle}
              config={{ ...faqConfig, spacing, cornerRadius: rounded, rounded, desktopColumns }}
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
          canUndo: canUndofaqItems,
          canRedo: canRedofaqItems,
          onUndo: undofaqItems,
          onRedo: redofaqItems,
        }}
        />
      </form>
    </div>
  );
}

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
import { Card, CardContent } from '../../../../components/ui';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ConfigEditor } from '../../_components/ConfigEditor';
import { ContactPreview } from '../../_components/ContactPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_CONTACT_CONFIG } from '../../_lib/constants';
import { getContactValidationResult } from '../../_lib/colors';
import {
  normalizeContactConfig,
  toContactConfigPayload,
  toContactSnapshot,
} from '../../_lib/normalize';
import { validateContactConfig } from '../../_lib/validation';
import type { ContactConfigState, ContactStyle } from '../../_types';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';

const COMPONENT_TYPE = 'Contact';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ContactEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ContactEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ContactEditPageProps) {
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
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [config, setConfig] = useState<ContactConfigState>(DEFAULT_CONTACT_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
  const [displayExpanded, setDisplayExpanded] = useState(false);
  const [contactDataExpanded, setContactDataExpanded] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);
  const [socialExpanded, setSocialExpanded] = useState(false);
  const [labelsExpanded, setLabelsExpanded] = useState(false);
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

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'Contact') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalizedConfig = normalizeContactConfig(component.config ?? {});
    const headerConfig = extractSectionHeaderConfig(component.config);

    setTitle(component.title);
    setActive(component.active);
    setConfig(normalizedConfig);

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
    setInitialSnapshot(toContactSnapshot({
      title: component.title,
      active: component.active,
      config: normalizedConfig,
    }));
  }, [component, id, router]);

  const normalizedConfig = useMemo(() => normalizeContactConfig(config), [config]);
  const configWithHeader = useMemo(() => normalizeContactConfig({
    ...config,
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
  }), [badgeText, config, headerAlign, hideHeader, showBadge, showSubtitle, showTitle, subtitle, subtitleAboveTitle, titleColorPrimary, uppercaseText]);

  const currentSnapshot = useMemo(() => toContactSnapshot({
    title,
    active,
    config: configWithHeader,
  }), [title, active, configWithHeader]);

  const style = configWithHeader.style;

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

  const validationResult = useMemo(() => validateContactConfig(configWithHeader), [configWithHeader]);
  const hasValidationErrors = !validationResult.isValid;
  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    if (validationResult.errors.mapEmbed) {
      messages.push('URL bản đồ không hợp lệ.');
    }
    if (validationResult.errors.contactItems && Object.keys(validationResult.errors.contactItems).length > 0) {
      messages.push('Có link trong dữ liệu liên hệ chưa hợp lệ.');
    }
    if (validationResult.errors.socialLinks && Object.keys(validationResult.errors.socialLinks).length > 0) {
      messages.push('Có URL mạng xã hội chưa hợp lệ.');
    }
    return messages;
  }, [validationResult]);

  const validation = useMemo(() => getContactValidationResult({
    primary: effectiveColors.primary,
    secondary: effectiveColors.secondary,
    mode: effectiveColors.mode,
  }), [effectiveColors.primary, effectiveColors.secondary, effectiveColors.mode]);

  const warningMessages = useMemo(() => {
    if (effectiveColors.mode === 'single') {return [];}

    const warnings: string[] = [];

    if (validation.harmonyStatus.isTooSimilar) {
      warnings.push(`Màu chính và màu phụ đang khá gần nhau (deltaE=${validation.harmonyStatus.deltaE}).`);
    }

    if (validation.accessibility.failing.length > 0) {
      warnings.push(`Có ${validation.accessibility.failing.length} cặp màu chưa đạt APCA (minLc=${validation.accessibility.minLc.toFixed(1)}).`);
    }

    return warnings;
  }, [effectiveColors.mode, validation]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !hasChanges) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = configWithHeader;
      const payload = {
        ...toContactConfigPayload(nextConfig),
        style: nextConfig.style,
      };

      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: payload, title });
      } else {
        await updateMutation({
          active,
          config: payload,
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

      setConfig(nextConfig);
      setInitialSnapshot(toContactSnapshot({
        title,
        active,
        config: nextConfig,
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

      toast.success('Đã cập nhật Contact');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Contact</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:hidden">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Tiêu đề</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {title || 'Chưa đặt'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Trạng thái</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {active ? 'Bật' : 'Tắt'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
          <p className="text-[11px] uppercase text-slate-400">Style</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {style}
          </p>
        </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div className="space-y-6">

            <ConfigEditor
              value={normalizedConfig}
              onChange={(next) => { setConfig(normalizeContactConfig(next)); }}
              title="Cấu hình Contact"
              displayExpanded={displayExpanded}
              contactDataExpanded={contactDataExpanded}
              formExpanded={formExpanded}
              socialExpanded={socialExpanded}
              labelsExpanded={labelsExpanded}
              onDisplayExpandedChange={setDisplayExpanded}
              onContactDataExpandedChange={setContactDataExpanded}
              onFormExpandedChange={setFormExpanded}
              onSocialExpandedChange={setSocialExpanded}
              onLabelsExpandedChange={setLabelsExpanded}
            />
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {effectiveColors.mode === 'dual' && warningMessages.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/70">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-xs text-amber-800">
                    {warningMessages.map((warning) => (
                      <p key={warning}>• {warning}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Liên hệ"
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
                title="Font custom cho Liên hệ"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}

            <ContactPreview
              config={configWithHeader}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={style}
              onStyleChange={(nextStyle) => { setConfig({ ...normalizedConfig, style: nextStyle as ContactStyle }); }}
              title={title}
              mapData={mapData}
              fontStyle={fontStyle}
              fontClassName="font-active"
            />

          </div>
        </div>

        {hasValidationErrors && (
          <Card className="mb-4 border-amber-200 bg-amber-50/70">
            <CardContent className="pt-4">
              <div className="space-y-1 text-xs text-amber-800">
                <p className="font-medium">Có dữ liệu cần kiểm tra thêm:</p>
                {validationMessages.map((message) => (
                  <p key={message}>• {message}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          onCancel={() => { router.push(backHref); }}
          submitLabel="Lưu thay đổi"
        active={active}
        onActiveChange={setActive}
        />
      </form>
    </div>
  );
}

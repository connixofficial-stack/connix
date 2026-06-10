'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { MousePointerClick, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Label, cn } from '../../../../components/ui';
import { CopyableInput } from '../../../../components/CopyTextButton';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { normalizeSectionSpacing } from '../../../_shared/types/sectionSpacing';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CTAForm } from '../../_components/CTAForm';
import { CTAPreview } from '../../_components/CTAPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { getCTAValidationResult } from '../../_lib/colors';
import {
  DEFAULT_CTA_CONFIG,
  normalizeCTAContainerWidth,
  normalizeCTACornerRadius,
  normalizeCTAStyle,
} from '../../_lib/constants';
import type { CTAConfig, CTAContainerWidth, CTAStyle } from '../../_types';

const COMPONENT_TYPE = 'CTA';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type CtaEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const CONTAINER_WIDTH_OPTIONS: Array<{ value: CTAContainerWidth; label: string; description: string }> = [
  { value: 'max-7xl', label: 'Max-w-7xl', description: 'Giới hạn chiều rộng gọn gàng' },
  { value: 'full', label: 'Full width', description: 'Mở rộng toàn chiều ngang' },
];

export default function CtaEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: CtaEditPageProps) {
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
  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(DEFAULT_CTA_CONFIG);
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('banner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    title: string;
    active: boolean;
    config: CTAConfig;
    style: CTAStyle;
  } | null>(null);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'CTA') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const nextConfig: CTAConfig = {
        badge: (config.badge as string | undefined) ?? '',
        buttonLink: (config.buttonLink as string | undefined) ?? '',
        buttonText: (config.buttonText as string | undefined) ?? '',
        description: (config.description as string | undefined) ?? '',
        secondaryButtonLink: (config.secondaryButtonLink as string | undefined) ?? '',
        secondaryButtonText: (config.secondaryButtonText as string | undefined) ?? '',
        title: (config.title as string | undefined) ?? '',
        spacing: config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(config.spacing),
        cornerRadius: normalizeCTACornerRadius(config.cornerRadius, config.noBorderRadius),
        containerWidth: normalizeCTAContainerWidth(config.containerWidth),
      };
      const nextStyle = normalizeCTAStyle(config.style);

      setCtaConfig(nextConfig);
      setCtaStyle(nextStyle);
      setInitialData({
        title: component.title,
        active: component.active,
        config: nextConfig,
        style: nextStyle,
      });
      setHasChanges(false);
    }
  }, [component, id, router, snapshotComponent]);

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
    if (!initialData) {return;}

    const changed = title !== initialData.title
      || active !== initialData.active
      || JSON.stringify(ctaConfig) !== JSON.stringify(initialData.config)
      || ctaStyle !== initialData.style;

    setHasChanges(changed || customChanged || customFontChanged);
  }, [title, active, ctaConfig, ctaStyle, initialData, customChanged, customFontChanged]);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    const { harmonyStatus } = getCTAValidationResult({
      config: ctaConfig,
      primary: effectiveColors.primary,
      secondary: effectiveColors.secondary,
      mode: effectiveColors.mode,
      style: ctaStyle,
    });

    if (effectiveColors.mode === 'dual' && harmonyStatus.isTooSimilar) {
      toast.error(`Không thể lưu CTA: deltaE=${harmonyStatus.deltaE} < 20 (Primary/Secondary quá giống nhau).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const nextConfig = {
          ...ctaConfig,
          noBorderRadius: ctaConfig.cornerRadius === 'none',
          noVerticalMargin: ctaConfig.spacing === 'none',
          style: ctaStyle,
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
      toast.success('Đã cập nhật CTA');
      setInitialData({
        title,
        active,
        config: ctaConfig,
        style: ctaStyle,
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa CTA</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointerClick size={20} />
              CTA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title}
                onChange={(e) =>{  setTitle(e.target.value); }}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
</CardContent>
        </Card>

        <div className="mb-3">
          <HomeComponentDisplaySettingsSection
            open={displayOpen}
            onOpenChange={setDisplayOpen}
            cornerRadius={ctaConfig.cornerRadius ?? 'lg'}
            onCornerRadiusChange={(cornerRadius) => setCtaConfig((prev) => ({ ...prev, cornerRadius }))}
            spacing={ctaConfig.spacing ?? 'normal'}
            onSpacingChange={(spacing) => setCtaConfig((prev) => ({ ...prev, spacing }))}
          >
              <div className="space-y-2">
                <Label>Chiều rộng</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTAINER_WIDTH_OPTIONS.map((option) => {
                    const selected = (ctaConfig.containerWidth ?? 'max-7xl') === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCtaConfig((prev) => ({ ...prev, containerWidth: option.value }))}
                        className={cn(
                          'rounded-md border px-3 py-2 text-left transition-colors',
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                        )}
                      >
                        <span className="block text-xs font-semibold">{option.label}</span>
                        <span className="mt-0.5 block text-[11px] opacity-75">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
          </HomeComponentDisplaySettingsSection>
        </div>

        <CTAForm
          config={ctaConfig}
          onChange={setCtaConfig}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho CTA"
                enabled={customState.enabled}
                mode={customState.mode}
                primary={customState.primary}
                secondary={resolvedCustomSecondary}
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
                title="Font custom cho CTA"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CTAPreview
              config={ctaConfig}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={ctaStyle}
              onStyleChange={setCtaStyle}
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
        />
      </form>
    </div>
  );
}

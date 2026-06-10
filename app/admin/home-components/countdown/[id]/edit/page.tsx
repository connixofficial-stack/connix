'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle, Label } from '../../../../components/ui';
import { CopyableInput } from '../../../../components/CopyTextButton';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HomeComponentDisplaySettingsSection } from '../../../_shared/components/HomeComponentDisplaySettingsSection';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { CountdownForm } from '../../_components/CountdownForm';
import { CountdownPreview } from '../../_components/CountdownPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { DEFAULT_COUNTDOWN_CONFIG } from '../../_lib/constants';
import { normalizeCountdownConfig, toCountdownPersistConfig } from '../../_lib/normalize';
import type { CountdownConfigState } from '../../_types';

const COMPONENT_TYPE = 'Countdown';

const createSnapshot = (title: string, active: boolean, config: CountdownConfigState) => JSON.stringify({
  title: title.trim(),
  active,
  config,
});

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type CountdownEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function EditCountdownPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  snapshotComponent,
  snapshotLabel,
}: CountdownEditPageProps) {
  const params = useParams<{ id: string }>();
  const id = snapshotComponent?._id ?? params.id ?? '';
  const router = useRouter();
  const updateMutation = useMutation(api.homeComponents.update);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const setTypeFontOverride = useMutation(api.homeComponentSystemConfig.setTypeFontOverride);

  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent || !id ? 'skip' : { id: id as any });
  const component = snapshotComponent ?? liveComponent;
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const { customState: customFontState, effectiveFont, initialCustom: initialFontCustom, setCustomState: setCustomFontState, setInitialCustom: setInitialFontCustom, showCustomBlock: showFontCustomBlock } = useTypeFontOverrideState(COMPONENT_TYPE);

  const [title, setTitle] = React.useState('Khuyến mãi đặc biệt');
  const [active, setActive] = React.useState(true);
  const [config, setConfig] = React.useState<CountdownConfigState>(() => normalizeCountdownConfig(DEFAULT_COUNTDOWN_CONFIG));
  const [displayOpen, setDisplayOpen] = React.useState(false);
  const [initialSnapshot, setInitialSnapshot] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!component) {
      return;
    }

    if (!snapshotComponent && component.type !== 'Countdown') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const normalized = normalizeCountdownConfig(component.config ?? DEFAULT_COUNTDOWN_CONFIG);
    setTitle(component.title || 'Khuyến mãi đặc biệt');
    setActive(component.active !== false);
    setConfig(normalized);
    setInitialSnapshot(createSnapshot(component.title || 'Khuyến mãi đặc biệt', component.active !== false, normalized));
  }, [component]);

  const currentSnapshot = React.useMemo(
    () => createSnapshot(title, active, config),
    [title, active, config],
  );

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!component || isSubmitting || !hasChanges) {
      return;
    }

    setIsSubmitting(true);
    try {
      const persistConfig = toCountdownPersistConfig(config);
      if (onSnapshotSave) {
        await onSnapshotSave({ active, config: persistConfig, title });
      } else {
        await updateMutation({
          id: component._id as Id<'homeComponents'>,
          title,
          active,
          config: persistConfig,
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

      setInitialSnapshot(currentSnapshot);
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
      toast.success('Đã lưu Countdown');
    } catch (error) {
      toast.error('Lỗi khi lưu Countdown');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return <div className="p-6 text-sm text-slate-500">Đang tải...</div>;
  }

  if (!component) {
    return <div className="p-6 text-sm text-slate-500">Không tìm thấy component.</div>;
  }

  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Countdown</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title}
                onChange={(event) => { setTitle(event.target.value); }}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <HomeComponentDisplaySettingsSection
            open={displayOpen}
            onOpenChange={setDisplayOpen}
            cornerRadius={config.cornerRadius}
            onCornerRadiusChange={(cornerRadius) => setConfig((prev) => ({ ...prev, cornerRadius }))}
            spacing={config.spacing ?? 'normal'}
            onSpacingChange={(spacing) => setConfig((prev) => ({ ...prev, spacing }))}
          />
        </div>

        <CountdownForm
          value={config}
          onChange={setConfig}
          brandColor={effectiveColors.primary}
          secondary={effectiveColors.secondary}
          mode={effectiveColors.mode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Countdown"
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
                title="Font custom cho Countdown"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <CountdownPreview
              config={config}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              selectedStyle={config.style}
              onStyleChange={(style) => {
                setConfig((prev) => ({
                  ...prev,
                  style,
                }));
              }}
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
        />
      </form>
    </div>
  );
}

'use client';

import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, Label } from '../../../../components/ui';
import { CopyableInput } from '../../../../components/CopyTextButton';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { SpeedDialForm } from '../../_components/SpeedDialForm';
import { SpeedDialPreview } from '../../_components/SpeedDialPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_SPEED_DIAL_CONFIG,
  normalizeSpeedDialStyle,
} from '../../_lib/constants';
import type {
  SpeedDialAction,
  SpeedDialConfig,
  SpeedDialPosition,
  SpeedDialStyle,
} from '../../_types';

const COMPONENT_TYPE = 'SpeedDial';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type SpeedDialEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

const normalizePosition = (value: unknown): SpeedDialPosition => (
  value === 'bottom-left' ? 'bottom-left' : 'bottom-right'
);

const normalizeString = (value: unknown, fallback = '') => (
  typeof value === 'string' ? value : fallback
);

const normalizeBoolean = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

const normalizeActions = (value: unknown): SpeedDialAction[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_SPEED_DIAL_CONFIG.actions.map((action, idx) => ({ ...action, id: `default-${idx}` }));
  }

  return value.map((raw, idx) => {
    const action = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
    const actionId = action.id;

    return {
      id: typeof actionId === 'string' || typeof actionId === 'number' ? actionId : `legacy-${idx}`,
      icon: normalizeString(action.icon, 'phone'),
      label: normalizeString(action.label),
      url: normalizeString(action.url),
      bgColor: normalizeString(action.bgColor, '#3b82f6'),
    };
  });
};

const toSnapshot = (payload: {
  title: string;
  active: boolean;
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  defaultOpen: boolean;
  showOnAllPages: boolean;
  enableShadow: boolean;
  actions: SpeedDialAction[];
}) => JSON.stringify({
  ...payload,
  actions: payload.actions.map((action, idx) => ({
    id: action.id ?? `action-${idx}`,
    icon: action.icon,
    label: action.label,
    url: action.url,
    bgColor: action.bgColor,
  })),
});

export default function SpeedDialEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: SpeedDialEditPageProps) {
  const routeParams = snapshotComponent ? null : use(params!);
  const id = snapshotComponent?._id ?? routeParams?.id ?? '';
  const router = useRouter();
  const { customState, effectiveColors, initialCustom, setCustomState, setInitialCustom, showCustomBlock } = useTypeColorOverrideState(COMPONENT_TYPE);
  const setTypeColorOverride = useMutation(api.homeComponentSystemConfig.setTypeColorOverride);
  const liveComponent = useQuery(api.homeComponents.getById, snapshotComponent ? 'skip' : { id: id as Id<'homeComponents'> });
  const component = snapshotComponent ?? liveComponent;
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const {
    state: actions,
    set: setActions,
    undo: undoactions,
    redo: redoactions,
    canUndo: canUndoactions,
    canRedo: canRedoactions,
    reset: resetactions,
  } = useUndoRedo<SpeedDialAction[]>([], { maxHistory: 15 });
  const [style, setStyle] = useState<SpeedDialStyle>(normalizeSpeedDialStyle(DEFAULT_SPEED_DIAL_CONFIG.style));
  const [position, setPosition] = useState<SpeedDialPosition>(DEFAULT_SPEED_DIAL_CONFIG.position);
  const [defaultOpen, setDefaultOpen] = useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.defaultOpen);
  const [showOnAllPages, setShowOnAllPages] = useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.showOnAllPages);
  const [enableShadow, setEnableShadow] = useState<boolean>(DEFAULT_SPEED_DIAL_CONFIG.enableShadow);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  useEffect(() => {
    if (!component) {return;}

    if (!snapshotComponent && component.type !== 'SpeedDial') {
      router.replace(`/admin/home-components/${id}/edit`);
      return;
    }

    const rawConfig = component.config ?? {};
    const normalizedActions = normalizeActions((rawConfig as Record<string, unknown>).actions);
    const normalizedStyle = normalizeSpeedDialStyle((rawConfig as Record<string, unknown>).style as string | undefined);
    const normalizedPosition = normalizePosition((rawConfig as Record<string, unknown>).position);
    const normalizedDefaultOpen = normalizeBoolean((rawConfig as Record<string, unknown>).defaultOpen, DEFAULT_SPEED_DIAL_CONFIG.defaultOpen);
    const normalizedShowOnAllPages = normalizeBoolean((rawConfig as Record<string, unknown>).showOnAllPages, DEFAULT_SPEED_DIAL_CONFIG.showOnAllPages);
    const normalizedEnableShadow = normalizeBoolean((rawConfig as Record<string, unknown>).enableShadow, DEFAULT_SPEED_DIAL_CONFIG.enableShadow);

    setTitle(component.title);
    setActive(component.active);
    resetactions(normalizedActions);
    setStyle(normalizedStyle);
    setPosition(normalizedPosition);
    setDefaultOpen(normalizedDefaultOpen);
    setShowOnAllPages(normalizedShowOnAllPages);
    setEnableShadow(normalizedEnableShadow);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      style: normalizedStyle,
      position: normalizedPosition,
      defaultOpen: normalizedDefaultOpen,
      showOnAllPages: normalizedShowOnAllPages,
      enableShadow: normalizedEnableShadow,
      actions: normalizedActions,
    }));
  }, [component, id, router]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    style,
    position,
    defaultOpen,
    showOnAllPages,
    enableShadow,
    actions,
  });
  const resolvedCustomSecondary = resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary);
  const customChanged = enableTypeOverrides && showCustomBlock
    ? customState.enabled !== initialCustom.enabled
      || customState.mode !== initialCustom.mode
      || customState.primary !== initialCustom.primary
      || resolvedCustomSecondary !== initialCustom.secondary
    : false;
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged);

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig: SpeedDialConfig = {
        actions: actions.map((action) => ({
          id: action.id,
          icon: action.icon,
          label: action.label,
          url: action.url,
          bgColor: action.bgColor,
        })),
        style,
        position,
        defaultOpen,
        showOnAllPages,
        enableShadow,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        style,
        position,
        defaultOpen,
        showOnAllPages,
        enableShadow,
        actions,
      }));
      if (enableTypeOverrides && showCustomBlock) {
        setInitialCustom({
          enabled: customState.enabled,
          mode: customState.mode,
          primary: customState.primary,
          secondary: resolveSecondaryByMode(customState.mode, customState.primary, customState.secondary),
        });
      }

      toast.success('Đã cập nhật Speed Dial');
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Speed Dial</h1>
        {snapshotLabel ? <p className="text-sm text-slate-500 dark:text-slate-400">Snapshot: {snapshotLabel}</p> : null}
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneCall size={20} />
              Speed Dial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={title}
                onChange={(e) => { setTitle(e.target.value); }}
                copyLabel="tiêu đề hiển thị"
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>
</CardContent>
        </Card>

        <SpeedDialForm
          actions={actions}
          onActionsChange={setActions}
          position={position}
          onPositionChange={setPosition}
          defaultOpen={defaultOpen}
          onDefaultOpenChange={setDefaultOpen}
          showOnAllPages={showOnAllPages}
          onShowOnAllPagesChange={setShowOnAllPages}
          enableShadow={enableShadow}
          onEnableShadowChange={setEnableShadow}
          defaultActionColor={effectiveColors.secondary}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div />
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Speed Dial"
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
            <SpeedDialPreview
              actions={actions}
              position={position}
              style={style}
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              title={title}
              selectedStyle={style}
              onStyleChange={setStyle}
              defaultOpen={defaultOpen}
              enableShadow={enableShadow}
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
          canUndo: canUndoactions,
          canRedo: canRedoactions,
          onUndo: undoactions,
          onRedo: redoactions,
        }}
        />
      </form>
    </div>
  );
}

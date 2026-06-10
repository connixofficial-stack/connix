'use client';

import { useUnsavedGuard } from '../../../_shared/hooks/useUnsavedGuard';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { TypeColorOverrideCard } from '../../../_shared/components/TypeColorOverrideCard';
import { TypeFontOverrideCard } from '../../../_shared/components/TypeFontOverrideCard';
import { HeaderConfigSection } from '../../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../../_shared/hooks/useFormSectionsState';
import { DEFAULT_SECTION_SPACING, type SectionSpacing } from '../../../_shared/types/sectionSpacing';
import { SectionSpacingControl } from '../../../_shared/components/SectionSpacingControl';
import { CollapsibleSubSection as SubSection } from '../../../_shared/components/CollapsibleSubSection';
import { extractSectionHeaderConfig } from '../../../_shared/hooks/useSectionHeaderState';
import { useTypeColorOverrideState } from '../../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../../_shared/hooks/useTypeFontOverride';
import { getSuggestedSecondary, resolveSecondaryByMode } from '../../../_shared/lib/typeColorOverride';
import { ServiceListForm } from '../../_components/ServiceListForm';
import { ServiceListPreview } from '../../_components/ServiceListPreview';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  DEFAULT_SERVICE_LIST_CONFIG,
} from '../../_lib/constants';
import type {
  ServiceListCardRadius,
  DemoServiceItem,
  ServiceListDesktopColumns,
  ServiceListConfig,
  ServiceListStyle,
  ServiceSelectionMode,
} from '../../_types';
import {
  DEFAULT_SERVICE_LIST_CARD_RADIUS,
  DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS,
  normalizeServiceListCardRadius,
  normalizeServiceListDesktopColumns,
} from '../../_types';
import { Label, cn } from '../../../../components/ui';

const COMPONENT_TYPE = 'ServiceList';

type SnapshotEditableComponent = {
  _id: string;
  active: boolean;
  config?: Record<string, any>;
  title: string;
  type: string;
};

type ServiceListEditPageProps = {
  backHref?: string;
  enableTypeOverrides?: boolean;
  onSnapshotSave?: (next: { active: boolean; config: Record<string, any>; title: string }) => Promise<void>;
  params?: Promise<{ id: string }>;
  snapshotComponent?: SnapshotEditableComponent;
  snapshotLabel?: string;
};

export default function ServiceListEditPage({
  backHref = '/admin/home-components',
  enableTypeOverrides = true,
  onSnapshotSave,
  params,
  snapshotComponent,
  snapshotLabel,
}: ServiceListEditPageProps) {
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
  const servicesData = useQuery(api.services.listAll, { limit: 100 });

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [serviceListConfig, setServiceListConfig] = useState<ServiceListConfig>(DEFAULT_SERVICE_LIST_CONFIG);
  const [serviceListStyle, setServiceListStyle] = useState<ServiceListStyle>('grid');
  const [serviceSelectionMode, setServiceSelectionMode] = useState<ServiceSelectionMode>('auto');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [demoServices, setDemoServices] = useState<DemoServiceItem[]>([]);

  // Header config state (shared HeaderConfigSection)
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);
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
  const [cardRadius, setCardRadius] = useState<ServiceListCardRadius>(DEFAULT_SERVICE_LIST_CARD_RADIUS);
  const [desktopColumns, setDesktopColumns] = useState<ServiceListDesktopColumns>(DEFAULT_SERVICE_LIST_DESKTOP_COLUMNS);

  useEffect(() => {
    if (component) {
      if (!snapshotComponent && component.type !== 'ServiceList') {
        router.replace(`/admin/home-components/${id}/edit`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      const nextConfig: ServiceListConfig = {
        cardRadius: normalizeServiceListCardRadius(config.cardRadius),
        desktopColumns: normalizeServiceListDesktopColumns(config.desktopColumns),
        itemCount: (config.itemCount as number) ?? DEFAULT_SERVICE_LIST_CONFIG.itemCount,
        spacing: (config.spacing as SectionSpacing) ?? DEFAULT_SERVICE_LIST_CONFIG.spacing,
        sortBy: (config.sortBy as ServiceListConfig['sortBy']) ?? DEFAULT_SERVICE_LIST_CONFIG.sortBy,
        selectionMode: (config.selectionMode as ServiceSelectionMode) ?? DEFAULT_SERVICE_LIST_CONFIG.selectionMode,
        selectedServiceIds: ((config.selectedServiceIds as string[]) ?? []),
        style: ((config.style as ServiceListStyle) ?? 'grid'),
      };

      setServiceListConfig(nextConfig);
      setServiceListStyle(nextConfig.style ?? 'grid');
      setServiceSelectionMode(nextConfig.selectionMode);
      setSelectedServiceIds(nextConfig.selectedServiceIds ?? []);
      setDemoServices(Array.isArray(config.demoServices) ? (config.demoServices as DemoServiceItem[]) : []);

      // Load header config via shared extractor
      const headerConfig = extractSectionHeaderConfig(config);
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
      setSpacing(headerConfig.spacing ?? DEFAULT_SECTION_SPACING);
      setCardRadius(normalizeServiceListCardRadius(config.cardRadius));
      setDesktopColumns(normalizeServiceListDesktopColumns(config.desktopColumns));
    }
  }, [component, id, router]);

  const toSnapshot = (payload: {
    title: string;
    active: boolean;
    itemCount: number;
    sortBy: string;
    style: ServiceListStyle;
    selectionMode: ServiceSelectionMode;
    selectedServiceIds: string[];
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
    cardRadius: ServiceListCardRadius;
    desktopColumns: ServiceListDesktopColumns;
    demoServices: DemoServiceItem[];
  }) => JSON.stringify(payload);

  useEffect(() => {
    if (!component) {return;}
    const config = component.config ?? {};
    const hc = extractSectionHeaderConfig(config);

    setInitialSnapshot(toSnapshot({
      title: component.title,
      active: component.active,
      itemCount: (config.itemCount as number) ?? DEFAULT_SERVICE_LIST_CONFIG.itemCount,
      sortBy: ((config.sortBy as string) ?? DEFAULT_SERVICE_LIST_CONFIG.sortBy),
      style: ((config.style as ServiceListStyle) ?? 'grid'),
      selectionMode: ((config.selectionMode as ServiceSelectionMode) ?? DEFAULT_SERVICE_LIST_CONFIG.selectionMode),
      selectedServiceIds: ((config.selectedServiceIds as string[]) ?? []),
      hideHeader: hc.hideHeader ?? false,
      showTitle: hc.showTitle ?? true,
      subtitle: hc.subtitle ?? '',
      showSubtitle: hc.showSubtitle ?? true,
      headerAlign: hc.headerAlign ?? 'left',
      titleColorPrimary: hc.titleColorPrimary ?? false,
      subtitleAboveTitle: hc.subtitleAboveTitle ?? false,
      uppercaseText: hc.uppercaseText ?? false,
      showBadge: hc.showBadge ?? true,
      badgeText: hc.badgeText ?? '',
      spacing: hc.spacing ?? DEFAULT_SECTION_SPACING,
      cardRadius: normalizeServiceListCardRadius(config.cardRadius),
      desktopColumns: normalizeServiceListDesktopColumns(config.desktopColumns),
      demoServices: Array.isArray(config.demoServices) ? (config.demoServices as DemoServiceItem[]) : [],
    }));
  }, [component]);

  const currentSnapshot = toSnapshot({
    title,
    active,
    itemCount: serviceListConfig.itemCount,
    sortBy: serviceListConfig.sortBy,
    style: serviceListStyle,
    selectionMode: serviceSelectionMode,
    selectedServiceIds: serviceSelectionMode === 'manual' ? selectedServiceIds : [],
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
  cardRadius,
  desktopColumns,
    demoServices: serviceSelectionMode === 'demo' ? demoServices : [],
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
  const hasChanges = initialSnapshot !== null && (currentSnapshot !== initialSnapshot || customChanged || customFontChanged);

  const filteredServices = useMemo(() => {
    if (!servicesData) {return [];}
    return servicesData
      .filter(service => service.status === 'Published')
      .filter(service => 
        !serviceSearchTerm || 
        service.title.toLowerCase().includes(serviceSearchTerm.toLowerCase())
      );
  }, [servicesData, serviceSearchTerm]);

  const selectedServices = useMemo(() => {
    if (!servicesData || selectedServiceIds.length === 0) {return [];}
    const serviceMap = new Map(servicesData.map(s => [s._id, s]));
    return selectedServiceIds
      .map(id => serviceMap.get(id as Id<'services'>))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [servicesData, selectedServiceIds]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds(ids => ids.includes(serviceId)
      ? ids.filter(idValue => idValue !== serviceId)
      : [...ids, serviceId]
    );
  };

  useUnsavedGuard(hasChanges);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {return;}

    setIsSubmitting(true);
    try {
      const nextConfig = {
        itemCount: serviceListConfig.itemCount,
        selectionMode: serviceSelectionMode,
        selectedServiceIds: serviceSelectionMode === 'manual' ? selectedServiceIds : [],
        demoServices: serviceSelectionMode === 'demo' ? demoServices : undefined,
        sortBy: serviceListConfig.sortBy,
        style: serviceListStyle,
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
        cardRadius,
        desktopColumns,
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

      setInitialSnapshot(toSnapshot({
        title,
        active,
        itemCount: nextConfig.itemCount,
        sortBy: nextConfig.sortBy,
        style: nextConfig.style ?? 'grid',
        selectionMode: nextConfig.selectionMode,
        selectedServiceIds: nextConfig.selectedServiceIds ?? [],
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
        cardRadius,
        desktopColumns,
        demoServices: nextConfig.selectionMode === 'demo' ? demoServices : [],
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
      toast.success('Đã cập nhật Danh sách Dịch vụ');
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa Danh sách Dịch vụ</h1>
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
          <SubSection icon={Settings2} title="Cấu hình hiển thị" defaultOpen={true}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Bo góc card</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  value={cardRadius}
                  onChange={(event) => setCardRadius(event.target.value as ServiceListCardRadius)}
                >
                  <option value="none">Không bo góc</option>
                  <option value="sm">Bo góc ít</option>
                  <option value="lg">Bo góc nhiều</option>
                </select>
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
                        onClick={() => setDesktopColumns(option as ServiceListDesktopColumns)}
                        className={cn(
                          'h-10 rounded-md border text-xs transition-colors',
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
            </div>
            <SectionSpacingControl value={spacing} onChange={setSpacing} />
          </SubSection>
        </div>

        <ServiceListForm
          selectionMode={serviceSelectionMode}
          onSelectionModeChange={setServiceSelectionMode}
          itemCount={serviceListConfig.itemCount}
          sortBy={serviceListConfig.sortBy}
          onItemCountChange={(count) =>{  setServiceListConfig(config => ({ ...config, itemCount: count })); }}
          onSortByChange={(value) =>{  setServiceListConfig(config => ({ ...config, sortBy: value as ServiceListConfig['sortBy'] })); }}
          filteredServices={filteredServices}
          selectedServices={selectedServices}
          selectedServiceIds={selectedServiceIds}
          onToggleService={handleToggleService}
          serviceSearchTerm={serviceSearchTerm}
          onServiceSearchTermChange={setServiceSearchTerm}
          demoServices={demoServices}
          setDemoServices={setDemoServices}
          defaultExpanded={false}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {enableTypeOverrides && showCustomBlock && (
              <TypeColorOverrideCard
                title="Màu custom cho Danh sách dịch vụ"
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
                title="Font custom cho Danh sách dịch vụ"
                enabled={customFontState.enabled}
                fontKey={customFontState.fontKey}
                compact
                toggleLabel="Custom"
                fontLabel="Font"
                onEnabledChange={(next) => setCustomFontState((prev) => ({ ...prev, enabled: next }))}
                onFontChange={(next) => setCustomFontState((prev) => ({ ...prev, fontKey: next }))}
              />
            )}
            <ServiceListPreview
              brandColor={effectiveColors.primary}
              secondary={effectiveColors.secondary}
              mode={effectiveColors.mode}
              itemCount={serviceSelectionMode === 'demo' ? demoServices.length : (serviceSelectionMode === 'manual' ? selectedServiceIds.length : serviceListConfig.itemCount)}
              selectedStyle={serviceListStyle}
              onStyleChange={setServiceListStyle}
              items={
                serviceSelectionMode === 'demo' && demoServices.length > 0
                ? demoServices.map(d => ({ id: d.id, name: d.name, image: d.image, price: d.price, description: d.description, tag: (d.tag || undefined) as 'new' | 'hot' | undefined }))
                : serviceSelectionMode === 'manual' && selectedServices.length > 0
                  ? selectedServices.map(s => ({ description: s.excerpt, id: s._id, image: s.thumbnail, name: s.title, price: s.price ? s.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ' }))
                  : filteredServices.slice(0, serviceListConfig.itemCount).map(s => ({ description: s.excerpt, id: s._id, image: s.thumbnail, name: s.title, price: s.price ? s.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ' }))
              }
              title={title}
              hideHeader={hideHeader}
              showTitle={showTitle}
              showSubtitle={showSubtitle}
              subtitle={subtitle}
              headerAlign={headerAlign}
              titleColorPrimary={titleColorPrimary}
              subtitleAboveTitle={subtitleAboveTitle}
              uppercaseText={uppercaseText}
              showBadge={showBadge}
              badgeText={badgeText}
              spacing={spacing}
              cardRadius={cardRadius}
              desktopColumns={desktopColumns}
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

'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Edit, Eye, Grid, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { HomepageSnapshotPayload, SnapshotComponentPayload } from '@/lib/homepage-snapshot/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../../components/ui';
import { BulkActionBar, SelectCheckbox } from '../../../../components/TableUtilities';
import { ModuleGuard } from '../../../../components/ModuleGuard';
import { SettingsImageUploader } from '../../../../components/SettingsImageUploader';
import { COMPONENT_TYPES } from '../../../create/shared';
import type { SnapshotContactSettings, SnapshotDemoBundle, SnapshotMenuItem, SnapshotMenuPayload, SnapshotSEOSettings, SnapshotSiteSettings, SnapshotSocialSettings } from '@/components/modules/homepage/snapshot-demo-types';

type HeaderLayerColorChoice = 'white' | 'primary' | 'secondary';
type SnapshotHeaderSettings = NonNullable<SnapshotDemoBundle['settings']['header']>;

type SnapshotComponentRow = SnapshotComponentPayload & {
  _id: string;
  config?: { preview?: string; description?: string };
};

type SnapshotMetaDraft = {
  contact: SnapshotContactSettings;
  footerItems: SnapshotMenuItem[];
  header: SnapshotHeaderSettings;
  headerItems: SnapshotMenuItem[];
  label: string;
  seo: SnapshotSEOSettings;
  site: SnapshotSiteSettings;
  social: SnapshotSocialSettings;
};

const DEFAULT_SITE_SETTINGS: SnapshotSiteSettings = {
  site_brand_mode: 'dual',
  site_brand_primary: '#3b82f6',
  site_brand_secondary: '#06b6d4',
  site_favicon: '',
  site_language: 'vi',
  site_logo: '',
  site_name: '',
  site_tagline: '',
  site_timezone: 'Asia/Ho_Chi_Minh',
  site_url: '',
};

const DEFAULT_CONTACT_SETTINGS: SnapshotContactSettings = {
  contact_address: '',
  contact_email: '',
  contact_google_map_embed_iframe: '',
  contact_map_provider: 'google',
  contact_phone: '',
  contact_zalo: '',
};

const DEFAULT_SOCIAL_SETTINGS: SnapshotSocialSettings = {
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  social_pinterest: '',
  social_tiktok: '',
  social_twitter: '',
  social_youtube: '',
};

const DEFAULT_SEO_SETTINGS: SnapshotSEOSettings = {
  seo_bing_verification: '',
  seo_description: '',
  seo_google_verification: '',
  seo_keywords: '',
  seo_og_image: '',
  seo_title: '',
};

const DEFAULT_HEADER_SETTINGS: SnapshotHeaderSettings = {
  header_style: 'classic',
  header_config: {
    logoSizeLevel: 2,
    layerColors: {
      topnav: 'primary',
      navbar: 'white',
      menu: 'secondary',
    },
  },
};

const HEADER_LAYER_COLOR_OPTIONS: Array<{ label: string; value: HeaderLayerColorChoice }> = [
  { label: 'Trắng', value: 'white' },
  { label: 'Màu chính', value: 'primary' },
  { label: 'Màu phụ', value: 'secondary' },
];

const LOGO_SIZE_OPTIONS = Array.from({ length: 30 }, (_, index) => ({
  label: `Nấc ${index + 1}`,
  value: index + 1,
}));

const normalizeHeaderLayerChoice = (value: unknown, fallback: HeaderLayerColorChoice): HeaderLayerColorChoice => (
  value === 'white' || value === 'primary' || value === 'secondary' ? value : fallback
);

const normalizeLogoSizeLevel = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {return 2;}
  return Math.min(30, Math.max(1, Math.round(numeric)));
};

const normalizeSnapshotHeaderSettings = (header?: SnapshotHeaderSettings | null): SnapshotHeaderSettings => {
  const rawConfig = (header?.header_config ?? {}) as Record<string, unknown>;
  const rawLayerColors = (rawConfig.layerColors ?? {}) as Record<string, unknown>;
  return {
    header_style: typeof header?.header_style === 'string' ? header.header_style : DEFAULT_HEADER_SETTINGS.header_style,
    header_config: {
      ...DEFAULT_HEADER_SETTINGS.header_config,
      ...rawConfig,
      logoSizeLevel: normalizeLogoSizeLevel(rawConfig.logoSizeLevel),
      layerColors: {
        topnav: normalizeHeaderLayerChoice(rawLayerColors.topnav, 'primary'),
        navbar: normalizeHeaderLayerChoice(rawLayerColors.navbar, 'white'),
        menu: normalizeHeaderLayerChoice(rawLayerColors.menu, 'secondary'),
      },
    },
  };
};

const normalizeMenuPayload = (payload: SnapshotMenuPayload | null | undefined, location: 'header' | 'footer'): SnapshotMenuPayload => ({
  items: [...(payload?.items ?? [])].sort((a, b) => a.order - b.order),
  menu: payload?.menu ?? {
    _id: `snapshot-menu:${location}`,
    location,
    name: location === 'header' ? 'Header' : 'Footer',
  },
});

const createMenuItem = (location: 'header' | 'footer', order: number, depth = 0, parentId?: string): SnapshotMenuItem => ({
  _id: `snapshot-menu-item:${location}:${Date.now()}:${order}`,
  active: true,
  depth,
  label: depth === 0 ? 'Mục mới' : 'Liên kết mới',
  menuId: `snapshot-menu:${location}`,
  openInNewTab: false,
  order,
  parentId,
  url: '/',
});

const syncSnapshotConfigCopies = (
  components: SnapshotComponentPayload[],
  site: SnapshotSiteSettings,
  contact: SnapshotContactSettings,
  social: SnapshotSocialSettings,
  footerMenu: SnapshotMenuPayload,
) => components.map((component) => {
  const config = (component.config ?? {}) as Record<string, unknown>;
  if (component.type === 'Contact') {
    return { ...component, config: { ...config, _snapshotContact: contact, _snapshotSocial: social } };
  }
  if (component.type === 'Footer') {
    return { ...component, config: { ...config, _snapshotContact: contact, _snapshotFooterMenu: footerMenu, _snapshotSite: site, _snapshotSocial: social } };
  }
  return component;
});

const toRows = (payload: HomepageSnapshotPayload): SnapshotComponentRow[] => (
  [...(payload.homepage.components ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((component) => ({
      ...component,
      _id: component.componentKey,
      config: component.config as { preview?: string; description?: string } | undefined,
    }))
);

const buildPayload = (payload: HomepageSnapshotPayload, components: SnapshotComponentPayload[], label: string): HomepageSnapshotPayload => {
  const sorted = [...components].sort((a, b) => a.order - b.order);
  return {
    ...payload,
    manifest: {
      ...payload.manifest,
      componentCount: sorted.length,
      snapshotLabel: label,
    },
    homepage: {
      ...payload.homepage,
      componentOrder: sorted.map((component) => component.componentKey),
      components: sorted,
    },
  };
};

function SortableRow({
  comp,
  index,
  isSelected,
  onToggleSelect,
  onToggleActive,
  onDelete,
  snapshotId,
}: {
  comp: SnapshotComponentRow;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  snapshotId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: comp._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const TypeIcon = COMPONENT_TYPES.find(t => t.value === comp.type)?.icon ?? Grid;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isSelected && 'bg-blue-500/5', isDragging && 'bg-slate-100 dark:bg-slate-800 opacity-80')}
    >
      <TableCell>
        <SelectCheckbox checked={isSelected} onChange={onToggleSelect} />
      </TableCell>
      <TableCell className="w-[50px]">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <GripVertical size={16} className="text-slate-400" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
      <TableCell>
        <div className="font-medium">{comp.title}</div>
        <div className="text-xs text-slate-400 truncate max-w-[300px]">{(comp.config?.preview ?? comp.config?.description) ?? ''}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
            <TypeIcon size={14} className="text-slate-600 dark:text-slate-400" />
          </div>
          <span className="text-sm">{comp.type}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div
          className={cn(
            'cursor-pointer inline-flex items-center justify-center rounded-full w-8 h-4 transition-colors',
            comp.active ? 'bg-green-500' : 'bg-slate-300'
          )}
          onClick={onToggleActive}
        >
          <div className={cn('w-3 h-3 bg-white rounded-full transition-transform', comp.active ? 'translate-x-2' : '-translate-x-2')}></div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components/${encodeURIComponent(comp.componentKey)}/edit`}>
            <Button variant="ghost" size="icon"><Edit size={16} /></Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SnapshotHomeComponentsPage({ snapshotId }: { snapshotId: string }) {
  const snapshot = useQuery(api.homepageSnapshots.getHomepageSnapshotById, { snapshotId: snapshotId as Id<'homeComponentSnapshots'> });
  const updateSnapshot = useMutation(api.homepageSnapshots.updateHomepageSnapshot);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState<'show' | 'hide' | null>(null);
  const [metaDraft, setMetaDraft] = useState<SnapshotMetaDraft | null>(null);
  const [loadedMetaSnapshotId, setLoadedMetaSnapshotId] = useState<string | null>(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const payload = snapshot?.payload as HomepageSnapshotPayload | undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!snapshot || loadedMetaSnapshotId === snapshot._id) {return;}
    const nextPayload = snapshot.payload as HomepageSnapshotPayload;
    const bundle = (nextPayload.homepage.demoBundle ?? {}) as Partial<SnapshotDemoBundle>;
    const settings = (bundle.settings ?? {}) as Partial<SnapshotDemoBundle['settings']>;
    setMetaDraft({
      contact: { ...DEFAULT_CONTACT_SETTINGS, ...settings.contact },
      footerItems: normalizeMenuPayload(bundle.menus?.footer, 'footer').items,
      header: normalizeSnapshotHeaderSettings(settings.header),
      headerItems: normalizeMenuPayload(bundle.menus?.header, 'header').items,
      label: snapshot.label,
      seo: { ...DEFAULT_SEO_SETTINGS, ...settings.seo },
      site: { ...DEFAULT_SITE_SETTINGS, ...settings.site },
      social: { ...DEFAULT_SOCIAL_SETTINGS, ...settings.social },
    });
    setLoadedMetaSnapshotId(snapshot._id);
  }, [loadedMetaSnapshotId, snapshot]);

  if (snapshot === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (snapshot === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy snapshot</div>;
  }

  if (!payload) {
    return <div className="text-center py-8 text-slate-500">Snapshot không có payload hợp lệ</div>;
  }

  const sortedComponents = toRows(payload);
  const bundle = (payload.homepage.demoBundle ?? {}) as Partial<SnapshotDemoBundle>;
  const demoUrl = snapshot.publicEnabled && snapshot.slug
    ? `/demo/${snapshot.slug}`
    : `/admin/home-components/snapshots/${snapshotId}/demo`;

  const saveComponents = async (components: SnapshotComponentPayload[], successMessage: string) => {
    await updateSnapshot({
      label: snapshot.label,
      payload: buildPayload(payload, components, snapshot.label),
      snapshotId: snapshotId as Id<'homeComponentSnapshots'>,
    });
    toast.success(successMessage);
  };

  const saveMeta = async () => {
    if (!metaDraft) {
      toast.error('Thông tin snapshot chưa sẵn sàng');
      return;
    }

    const headerMenu = normalizeMenuPayload(bundle.menus?.header, 'header');
    const footerMenu = normalizeMenuPayload(bundle.menus?.footer, 'footer');
    const nextHeaderMenu: SnapshotMenuPayload = {
      ...headerMenu,
      items: metaDraft.headerItems.map((item, order) => ({ ...item, menuId: headerMenu.menu._id, order })),
    };
    const nextFooterMenu: SnapshotMenuPayload = {
      ...footerMenu,
      items: metaDraft.footerItems.map((item, order) => ({ ...item, menuId: footerMenu.menu._id, order })),
    };
    const nextSite = metaDraft.site;
    const currentHeader = normalizeSnapshotHeaderSettings(bundle.settings?.header);
    const draftHeader = normalizeSnapshotHeaderSettings(metaDraft.header);
    const nextHeader: SnapshotHeaderSettings = {
      ...currentHeader,
      ...draftHeader,
      header_config: {
        ...currentHeader.header_config,
        ...draftHeader.header_config,
        layerColors: {
          ...((currentHeader.header_config?.layerColors ?? {}) as Record<string, unknown>),
          ...((draftHeader.header_config?.layerColors ?? {}) as Record<string, unknown>),
        },
      },
    };
    const nextBundle: SnapshotDemoBundle = {
      componentData: bundle.componentData ?? {},
      integrity: bundle.integrity ?? { level: 'partial', requiredMissing: [], warnings: [] },
      menus: {
        ...bundle.menus,
        footer: nextFooterMenu,
        header: nextHeaderMenu,
      },
      settings: {
        contact: metaDraft.contact,
        header: nextHeader,
        routing: bundle.settings?.routing ?? { ia_route_mode: 'unified' },
        seo: metaDraft.seo,
        site: nextSite,
        social: metaDraft.social,
      },
      systemStyle: bundle.systemStyle ?? payload.homepage.systemStyle ?? null,
    };

    setIsSavingMeta(true);
    try {
      await updateSnapshot({
        label: metaDraft.label.trim() || snapshot.label,
        payload: {
          ...payload,
          manifest: {
            ...payload.manifest,
            snapshotLabel: metaDraft.label.trim() || snapshot.label,
          },
          homepage: {
            ...payload.homepage,
            components: syncSnapshotConfigCopies(payload.homepage.components, nextSite, metaDraft.contact, metaDraft.social, nextFooterMenu),
            demoBundle: nextBundle,
          },
        },
        snapshotId: snapshotId as Id<'homeComponentSnapshots'>,
      });
      toast.success('Đã cập nhật thông tin snapshot');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu thông tin snapshot');
    } finally {
      setIsSavingMeta(false);
    }
  };

  const patchMenuItem = (location: 'header' | 'footer', itemId: string, patch: Partial<SnapshotMenuItem>) => {
    setMetaDraft((current) => {
      if (!current) {return current;}
      const key = location === 'header' ? 'headerItems' : 'footerItems';
      return {
        ...current,
        [key]: current[key].map((item) => item._id === itemId ? { ...item, ...patch } : item),
      };
    });
  };

  const patchHeaderConfig = (patch: Record<string, unknown>) => {
    setMetaDraft((current) => {
      if (!current) {return current;}
      const header = normalizeSnapshotHeaderSettings(current.header);
      return {
        ...current,
        header: {
          ...header,
          header_config: {
            ...header.header_config,
            ...patch,
          },
        },
      };
    });
  };

  const patchHeaderLayerColor = (layer: 'topnav' | 'navbar' | 'menu', value: HeaderLayerColorChoice) => {
    setMetaDraft((current) => {
      if (!current) {return current;}
      const header = normalizeSnapshotHeaderSettings(current.header);
      const headerConfig = header.header_config ?? {};
      const layerColors = (headerConfig.layerColors ?? {}) as Record<string, unknown>;
      return {
        ...current,
        header: {
          ...header,
          header_config: {
            ...headerConfig,
            layerColors: {
              ...layerColors,
              [layer]: value,
            },
          },
        },
      };
    });
  };

  const addMenuItem = (location: 'header' | 'footer', depth = 0) => {
    setMetaDraft((current) => {
      if (!current) {return current;}
      const key = location === 'header' ? 'headerItems' : 'footerItems';
      return {
        ...current,
        [key]: [...current[key], createMenuItem(location, current[key].length, depth)],
      };
    });
  };

  const removeMenuItem = (location: 'header' | 'footer', itemId: string) => {
    setMetaDraft((current) => {
      if (!current) {return current;}
      const key = location === 'header' ? 'headerItems' : 'footerItems';
      return {
        ...current,
        [key]: current[key].filter((item) => item._id !== itemId && item.parentId !== itemId),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = sortedComponents.findIndex(c => c._id === active.id);
    const newIndex = sortedComponents.findIndex(c => c._id === over.id);
    const reordered = arrayMove(sortedComponents, oldIndex, newIndex).map((component, index) => ({ ...component, order: index }));

    try {
      await saveComponents(reordered, 'Đã cập nhật thứ tự');
    } catch {
      toast.error('Lỗi khi cập nhật thứ tự');
    }
  };

  const toggleSelectAll = () => { setSelectedIds(selectedIds.length === sortedComponents.length ? [] : sortedComponents.map(c => c._id)); };
  const toggleSelectItem = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleDelete = async (componentKey: string) => {
    if (!confirm('Xóa component này khỏi snapshot?')) {return;}
    try {
      await saveComponents(sortedComponents.filter((component) => component.componentKey !== componentKey), 'Đã xóa component');
      setSelectedIds((current) => current.filter((id) => id !== componentKey));
    } catch {
      toast.error('Lỗi khi xóa component');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.length} component đã chọn?`)) {return;}
    try {
      await saveComponents(sortedComponents.filter((component) => !selectedIds.includes(component.componentKey)), `Đã xóa ${selectedIds.length} component`);
      setSelectedIds([]);
    } catch {
      toast.error('Lỗi khi xóa components');
    }
  };

  const toggleActive = async (componentKey: string) => {
    try {
      await saveComponents(
        sortedComponents.map((component) => component.componentKey === componentKey ? { ...component, active: !component.active } : component),
        'Đã cập nhật trạng thái'
      );
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleBulkStatus = async (active: boolean) => {
    setStatusLoading(active ? 'show' : 'hide');
    try {
      await saveComponents(
        sortedComponents.map((component) => selectedIds.includes(component.componentKey) ? { ...component, active } : component),
        active ? `Đã hiển thị ${selectedIds.length} component` : `Đã ẩn ${selectedIds.length} component`
      );
      setSelectedIds([]);
    } catch {
      toast.error(active ? 'Lỗi khi hiển thị components' : 'Lỗi khi ẩn components');
    } finally {
      setStatusLoading(null);
    }
  };

  const headerSettings = metaDraft ? normalizeSnapshotHeaderSettings(metaDraft.header) : null;
  const headerConfig = (headerSettings?.header_config ?? {}) as Record<string, unknown>;
  const headerLayerColors = (headerConfig.layerColors ?? {}) as Record<string, unknown>;
  const logoSizeLevel = normalizeLogoSizeLevel(headerConfig.logoSizeLevel);
  const topnavColor = normalizeHeaderLayerChoice(headerLayerColors.topnav, 'primary');
  const navbarColor = normalizeHeaderLayerChoice(headerLayerColors.navbar, 'white');
  const menuColor = normalizeHeaderLayerChoice(headerLayerColors.menu, 'secondary');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/home-components" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-1">
            <ArrowLeft size={14} /> Quay lại snapshot
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Giao diện Trang chủ</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý các khối nội dung trong snapshot: {snapshot.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={demoUrl} target="_blank">
            <Button className="gap-2" variant="outline">
              <Eye size={16} /> Xem thử
            </Button>
          </Link>
          <Link href={`/admin/home-components/snapshots/${snapshotId}/home-components/create`}>
            <Button className="gap-2" variant="accent">
              <Plus size={16} /> Thêm Component
            </Button>
          </Link>
        </div>
      </div>

      {metaDraft && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Thông tin định hình snapshot</CardTitle>
                <p className="mt-1 text-xs text-slate-500">Màu thương hiệu, slogan, liên hệ, mạng xã hội và menu dùng riêng cho bản demo snapshot.</p>
              </div>
              <Button variant="accent" size="sm" onClick={() => { void saveMeta(); }} disabled={isSavingMeta}>
                {isSavingMeta ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Lưu thông tin snapshot
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tên snapshot</Label>
                <Input value={metaDraft.label} onChange={(event) => setMetaDraft({ ...metaDraft, label: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tên thương hiệu</Label>
                <Input value={metaDraft.site.site_name} onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_name: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Slogan / tagline</Label>
                <Input value={metaDraft.site.site_tagline} onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_tagline: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <SettingsImageUploader
                  label="Logo"
                  value={metaDraft.site.site_logo}
                  onChange={(url) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_logo: url ?? '' } })}
                  folder="snapshot-settings"
                  naming={{ entityName: 'snapshot', field: 'logo', index: 1 }}
                  previewSize="md"
                />
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Header menu</div>
                  <p className="text-xs text-slate-500">Được trích xuất từ cấu hình menu chính cho riêng demo snapshot.</p>
                </div>
                <div className="space-y-2">
                  <Label>Kích thước logo</Label>
                  <select
                    value={logoSizeLevel}
                    onChange={(event) => patchHeaderConfig({ logoSizeLevel: normalizeLogoSizeLevel(event.target.value) })}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {LOGO_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Phối màu header</div>
                  {([
                    ['topnav', 'Topbar', topnavColor],
                    ['navbar', 'Navbar', navbarColor],
                    ['menu', 'Menu bar', menuColor],
                  ] as const).map(([layer, label, value]) => (
                    <div key={layer} className="grid grid-cols-[92px_1fr] items-center gap-2">
                      <Label className="text-xs">{label}</Label>
                      <select
                        value={value}
                        onChange={(event) => patchHeaderLayerColor(layer, event.target.value as HeaderLayerColorChoice)}
                        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {HEADER_LAYER_COLOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <p className="text-[11px] leading-4 text-slate-400">Màu chữ tự tính theo APCA để đảm bảo dễ đọc.</p>
                </div>
              </div>
              <div className="space-y-2">
                <SettingsImageUploader
                  label="OG Image"
                  value={metaDraft.seo.seo_og_image}
                  onChange={(url) => setMetaDraft({ ...metaDraft, seo: { ...metaDraft.seo, seo_og_image: url ?? '' } })}
                  folder="snapshot-settings"
                  naming={{ entityName: 'snapshot', field: 'og-image', index: 1 }}
                  previewSize="md"
                />
                <p className="text-xs text-slate-500">Ảnh chia sẻ mạng xã hội cho demo snapshot, nên dùng tỉ lệ 1200×630.</p>
              </div>
              <div className="space-y-2">
                <Label>Màu chính</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={metaDraft.site.site_brand_primary || '#3b82f6'}
                    onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_brand_primary: event.target.value } })}
                    className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <Input value={metaDraft.site.site_brand_primary} onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_brand_primary: event.target.value } })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Màu phụ</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={metaDraft.site.site_brand_secondary || '#06b6d4'}
                    onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_brand_secondary: event.target.value } })}
                    className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <Input value={metaDraft.site.site_brand_secondary} onChange={(event) => setMetaDraft({ ...metaDraft, site: { ...metaDraft.site, site_brand_secondary: event.target.value } })} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={metaDraft.contact.contact_email} onChange={(event) => setMetaDraft({ ...metaDraft, contact: { ...metaDraft.contact, contact_email: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={metaDraft.contact.contact_phone} onChange={(event) => setMetaDraft({ ...metaDraft, contact: { ...metaDraft.contact, contact_phone: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Zalo</Label>
                <Input value={metaDraft.contact.contact_zalo} onChange={(event) => setMetaDraft({ ...metaDraft, contact: { ...metaDraft.contact, contact_zalo: event.target.value } })} />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label>Địa chỉ</Label>
                <Input value={metaDraft.contact.contact_address} onChange={(event) => setMetaDraft({ ...metaDraft, contact: { ...metaDraft.contact, contact_address: event.target.value } })} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={metaDraft.social.social_facebook} onChange={(event) => setMetaDraft({ ...metaDraft, social: { ...metaDraft.social, social_facebook: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={metaDraft.social.social_instagram} onChange={(event) => setMetaDraft({ ...metaDraft, social: { ...metaDraft.social, social_instagram: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input value={metaDraft.social.social_youtube} onChange={(event) => setMetaDraft({ ...metaDraft, social: { ...metaDraft.social, social_youtube: event.target.value } })} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {([
                ['header', 'Menu header', metaDraft.headerItems],
                ['footer', 'Menu footer', metaDraft.footerItems],
              ] as const).map(([location, title, items]) => (
                <div key={location} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                    <div className="flex gap-1.5">
                      {location === 'footer' ? (
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => addMenuItem(location, 1)}>Thêm link</Button>
                      ) : null}
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => addMenuItem(location, 0)}>Thêm mục</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item._id} className={cn('grid gap-2 rounded-md bg-slate-50 p-2 dark:bg-slate-900', location === 'footer' ? 'grid-cols-[80px_1fr_1fr_auto]' : 'grid-cols-[1fr_1fr_auto]')}>
                        {location === 'footer' ? (
                          <select
                            value={item.depth}
                            onChange={(event) => patchMenuItem(location, item._id, { depth: Number(event.target.value) })}
                            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          >
                            <option value={0}>Cột</option>
                            <option value={1}>Link</option>
                          </select>
                        ) : null}
                        <Input value={item.label} onChange={(event) => patchMenuItem(location, item._id, { label: event.target.value })} placeholder="Nhãn menu" className="h-9" />
                        <Input value={item.url} onChange={(event) => patchMenuItem(location, item._id, { url: event.target.value })} placeholder="/duong-dan" className="h-9" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => removeMenuItem(location, item._id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {items.length === 0 ? <div className="text-xs text-slate-500">Chưa có item menu.</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="component"
        onShow={() => { void handleBulkStatus(true); }}
        onHide={() => { void handleBulkStatus(false); }}
        isStatusLoading={statusLoading}
        onDelete={handleBulkDelete}
        onClearSelection={() => { setSelectedIds([]); }}
      />

      <Card>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <SelectCheckbox
                    checked={selectedIds.length === sortedComponents.length && sortedComponents.length > 0}
                    onChange={toggleSelectAll}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < sortedComponents.length}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[50px]">TT</TableHead>
                <TableHead>Tên Component</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={sortedComponents.map(c => c._id)} strategy={verticalListSortingStrategy}>
                {sortedComponents.map((comp, index) => (
                  <SortableRow
                    key={comp._id}
                    comp={comp}
                    index={index}
                    isSelected={selectedIds.includes(comp._id)}
                    onToggleSelect={() => { toggleSelectItem(comp._id); }}
                    onToggleActive={() => { void toggleActive(comp._id); }}
                    onDelete={() => { void handleDelete(comp._id); }}
                    snapshotId={snapshotId}
                  />
                ))}
              </SortableContext>
              {sortedComponents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">Chưa có component nào</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
        {sortedComponents.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            Hiển thị {sortedComponents.length} component - Kéo thả, xếp thứ tự
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SnapshotHomeComponentsPageWrapper({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = use(params);

  return (
    <ModuleGuard moduleKey="homepage">
      <SnapshotHomeComponentsPage snapshotId={snapshotId} />
    </ModuleGuard>
  );
}

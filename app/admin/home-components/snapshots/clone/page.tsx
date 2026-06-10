'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Bot, Check, ChevronLeft, ChevronRight, Copy, Eye, Image as ImageIcon, Loader2, Menu, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import type { HomepageSnapshotPayload, SnapshotComponentPayload } from '@/lib/homepage-snapshot/types';
import type {
  SnapshotContactSettings,
  SnapshotDemoBundle,
  SnapshotMenuItem,
  SnapshotMenuPayload,
  SnapshotSEOSettings,
  SnapshotSiteSettings,
  SnapshotSocialSettings,
} from '@/components/modules/homepage/snapshot-demo-types';
import { SnapshotDemoProvider } from '@/components/modules/homepage/SnapshotDemoProvider';
import { InitialBrandColorsProvider } from '@/components/providers/InitialBrandColorsProvider';
import { ComponentRenderer } from '@/components/site/ComponentRenderer';
import { parseAiMenuInput, type AiMenuLine } from '@/app/admin/menus/_ai-menu-parser';
import { ModuleGuard } from '../../../components/ModuleGuard';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';

type WizardStep = 'source' | 'meta' | 'menu' | 'components' | 'confirm';

type SnapshotMetaDraft = {
  contact: SnapshotContactSettings;
  label: string;
  seo: SnapshotSEOSettings;
  site: SnapshotSiteSettings;
  social: SnapshotSocialSettings;
};

type ImagePath = {
  label: string;
  path: Array<string | number>;
};

const STEPS: Array<{ key: WizardStep; label: string }> = [
  { key: 'source', label: 'Chọn snapshot' },
  { key: 'meta', label: 'Thông tin' },
  { key: 'menu', label: 'Menu AI' },
  { key: 'components', label: 'Component AI' },
  { key: 'confirm', label: 'Xác nhận' },
];

const DEFAULT_SITE_SETTINGS: SnapshotSiteSettings = {
  site_brand_mode: 'dual',
  site_brand_primary: '#9b2c3b',
  site_brand_secondary: '#ecaa4d',
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

const MENU_PROMPT = `Bạn là chuyên gia thiết kế navigation menu cho website.

Tạo menu header dạng JSON cho demo snapshot.
- Chỉ trả JSON thuần, không markdown.
- Mỗi item chỉ cần "label"; có thể có "children".
- Nội dung tiếng Việt, thực tế, ngắn gọn.
- 5-12 mục cấp 1, tối đa 3 tầng.

Output:
{
  "items": [
    { "label": "Trang chủ" },
    { "label": "Sản phẩm", "children": [{ "label": "Vang đỏ" }] },
    { "label": "Liên hệ" }
  ]
}

Website: [MÔ TẢ WEBSITE]`;

const COMPONENT_PROMPT = `Bạn là chuyên gia viết nội dung website.

Hãy tạo JSON để cập nhật nội dung cho component snapshot hiện tại.
- Giữ nguyên layout/style hiện có; chỉ đổi nội dung, danh sách item, hình ảnh, CTA.
- Trả JSON object thuần, không markdown.
- Dùng tiếng Việt tự nhiên, không placeholder.
- URL ảnh có thể dùng link https hoặc để trống để admin upload sau.

Component: [TYPE]
Config hiện tại:
[DÁN CONFIG HIỆN TẠI]`;

const normalizeMenuPayload = (payload: SnapshotMenuPayload | null | undefined, location: 'header' | 'footer'): SnapshotMenuPayload => ({
  items: [...(payload?.items ?? [])].sort((a, b) => a.order - b.order),
  menu: payload?.menu ?? {
    _id: `snapshot-menu:${location}`,
    location,
    name: location === 'header' ? 'Header' : 'Footer',
  },
});

const toMetaDraft = (label: string, payload: HomepageSnapshotPayload): SnapshotMetaDraft => {
  const bundle = (payload.homepage.demoBundle ?? {}) as Partial<SnapshotDemoBundle>;
  const settings = (bundle.settings ?? {}) as Partial<SnapshotDemoBundle['settings']>;
  return {
    contact: { ...DEFAULT_CONTACT_SETTINGS, ...settings.contact },
    label: `${label} - bản mới`,
    seo: { ...DEFAULT_SEO_SETTINGS, ...settings.seo },
    site: { ...DEFAULT_SITE_SETTINGS, ...settings.site },
    social: { ...DEFAULT_SOCIAL_SETTINGS, ...settings.social },
  };
};

const buildMenuItems = (lines: AiMenuLine[], location: 'header' | 'footer'): SnapshotMenuItem[] => {
  const stack: SnapshotMenuItem[] = [];
  return lines.map((line, order) => {
    const depth = Math.min(Math.max(line.depth, 0), 2);
    const parent = depth > 0 ? stack[depth - 1] : undefined;
    const item: SnapshotMenuItem = {
      _id: `snapshot-menu-item:${location}:${Date.now()}:${order}`,
      active: true,
      depth,
      label: line.label,
      menuId: `snapshot-menu:${location}`,
      openInNewTab: false,
      order,
      parentId: parent?._id,
      url: '/',
    };
    stack[depth] = item;
    stack.length = depth + 1;
    return item;
  });
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const cleanJsonInput = (raw: string) => raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

const parseObjectInput = (raw: string) => {
  const parsed = JSON.parse(cleanJsonInput(raw)) as unknown;
  if (!isPlainObject(parsed)) {
    throw new Error('JSON phải là object.');
  }
  return parsed;
};

const LAYOUT_KEYS = ['style', 'selectedStyle', 'layout', 'variant', 'displayMode', 'desktopLayout'];

const mergeConfigKeepingLayout = (current: unknown, patch: Record<string, unknown>) => {
  const base = isPlainObject(current) ? current : {};
  const next: Record<string, unknown> = { ...base, ...patch };
  for (const key of LAYOUT_KEYS) {
    if (key in base) {
      next[key] = base[key];
    }
  }
  return next;
};

const getAtPath = (value: unknown, path: Array<string | number>): unknown => (
  path.reduce<unknown>((current, key) => {
    if (Array.isArray(current) && typeof key === 'number') return current[key];
    if (isPlainObject(current) && typeof key === 'string') return current[key];
    return undefined;
  }, value)
);

const getStringAtPath = (value: unknown, path: Array<string | number>): string => {
  const val = getAtPath(value, path);
  return typeof val === 'string' ? val : '';
};

const setAtPath = (value: unknown, path: Array<string | number>, nextValue: string): unknown => {
  if (path.length === 0) return nextValue;
  const [head, ...tail] = path;
  if (Array.isArray(value)) {
    return value.map((item, index) => index === head ? setAtPath(item, tail, nextValue) : item);
  }
  if (isPlainObject(value)) {
    return {
      ...value,
      [head]: setAtPath(value[head as string], tail, nextValue),
    };
  }
  return value;
};

const looksLikeImagePath = (key: string, value: string) => {
  const lower = key.toLowerCase();
  return Boolean(value) && (
    lower.includes('image')
    || lower.includes('logo')
    || lower.includes('avatar')
    || lower.includes('thumbnail')
    || lower.includes('background')
    || /\.(png|jpe?g|webp|gif|svg)([?#].*)?$/i.test(value)
  );
};

const collectImagePaths = (value: unknown, path: Array<string | number> = [], keyName = ''): ImagePath[] => {
  if (typeof value === 'string') {
    return looksLikeImagePath(keyName, value) ? [{ label: path.join('.'), path }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectImagePaths(item, [...path, index], String(index)));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, child]) => collectImagePaths(child, [...path, key], key));
  }
  return [];
};

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

const buildPayload = (
  source: HomepageSnapshotPayload,
  meta: SnapshotMetaDraft,
  headerItems: SnapshotMenuItem[],
  components: SnapshotComponentPayload[],
): HomepageSnapshotPayload => {
  const bundle = (source.homepage.demoBundle ?? {}) as Partial<SnapshotDemoBundle>;
  const headerMenu = normalizeMenuPayload(bundle.menus?.header, 'header');
  const footerMenu = normalizeMenuPayload(bundle.menus?.footer, 'footer');
  const nextHeaderMenu: SnapshotMenuPayload = {
    ...headerMenu,
    items: headerItems.map((item, order) => ({ ...item, menuId: headerMenu.menu._id, order })),
  };
  const nextSite: SnapshotSiteSettings = {
    ...meta.site,
    site_brand_mode: 'dual',
  };
  const nextFooterMenu = normalizeMenuPayload(footerMenu, 'footer');
  const nextComponents = syncSnapshotConfigCopies(components, nextSite, meta.contact, meta.social, nextFooterMenu);
  const nextBundle: SnapshotDemoBundle = {
    componentData: bundle.componentData ?? {},
    integrity: bundle.integrity ?? { level: 'partial', requiredMissing: [], warnings: [] },
    menus: {
      ...bundle.menus,
      footer: nextFooterMenu,
      header: nextHeaderMenu,
    },
    modules: bundle.modules,
    settings: {
      contact: meta.contact,
      header: bundle.settings?.header ?? {},
      routing: bundle.settings?.routing ?? { ia_route_mode: 'unified' },
      seo: meta.seo,
      site: nextSite,
      social: meta.social,
    },
    systemStyle: bundle.systemStyle ?? source.homepage.systemStyle ?? null,
  };
  const sorted = [...nextComponents].sort((a, b) => a.order - b.order);
  return {
    ...source,
    manifest: {
      ...source.manifest,
      componentCount: sorted.length,
      exportedAt: new Date().toISOString(),
      snapshotLabel: meta.label.trim(),
    },
    homepage: {
      ...source.homepage,
      componentOrder: sorted.map((component) => component.componentKey),
      components: sorted,
      demoBundle: nextBundle,
    },
  };
};

function SnapshotCloneWizard() {
  const router = useRouter();
  const snapshots = useQuery(api.homepageSnapshots.listHomepageSnapshotsWithPayload);
  const saveSnapshot = useMutation(api.homepageSnapshots.saveHomepageSnapshot);
  const [step, setStep] = useState<WizardStep>('source');
  const [sourceId, setSourceId] = useState<string>('');
  const [meta, setMeta] = useState<SnapshotMetaDraft | null>(null);
  const [headerItems, setHeaderItems] = useState<SnapshotMenuItem[]>([]);
  const [components, setComponents] = useState<SnapshotComponentPayload[]>([]);
  const [menuInput, setMenuInput] = useState('');
  const [componentInput, setComponentInput] = useState('');
  const [componentIndex, setComponentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const sourceSnapshot = snapshots?.find((item) => item._id === sourceId);
  const sourcePayload = sourceSnapshot?.payload as HomepageSnapshotPayload | undefined;
  const currentComponent = components[componentIndex];
  const menuResult = useMemo(() => parseAiMenuInput(menuInput), [menuInput]);
  const imagePaths = useMemo(() => collectImagePaths(currentComponent?.config ?? {}), [currentComponent]);
  const previewPayload = sourcePayload && meta ? buildPayload(sourcePayload, meta, headerItems, components) : null;
  const previewBundle = (previewPayload?.homepage.demoBundle ?? null) as SnapshotDemoBundle | null;

  const selectSource = (id: string) => {
    const snapshot = snapshots?.find((item) => item._id === id);
    const payload = snapshot?.payload as HomepageSnapshotPayload | undefined;
    if (!snapshot || !payload) return;
    const bundle = (payload.homepage.demoBundle ?? {}) as Partial<SnapshotDemoBundle>;
    setSourceId(id);
    setMeta(toMetaDraft(snapshot.label, payload));
    setHeaderItems(normalizeMenuPayload(bundle.menus?.header, 'header').items);
    setComponents([...(payload.homepage.components ?? [])].sort((a, b) => a.order - b.order));
    setComponentIndex(0);
    setStep('meta');
  };

  const applyMenuImport = () => {
    if (menuResult.error || menuResult.lines.length === 0) {
      toast.error(menuResult.error || 'Chưa có menu hợp lệ');
      return;
    }
    setHeaderItems(buildMenuItems(menuResult.lines, 'header'));
    toast.success(`Đã áp dụng ${menuResult.lines.length} mục menu`);
  };

  const applyComponentImport = () => {
    if (!currentComponent || !componentInput.trim()) return;
    try {
      const patch = parseObjectInput(componentInput);
      setComponents((current) => current.map((component, index) => (
        index === componentIndex
          ? { ...component, config: mergeConfigKeepingLayout(component.config, patch) }
          : component
      )));
      setComponentInput('');
      toast.success('Đã áp dụng JSON cho component hiện tại');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'JSON không hợp lệ');
    }
  };

  const patchCurrentImage = (path: Array<string | number>, value: string) => {
    setComponents((current) => current.map((component, index) => (
      index === componentIndex
        ? { ...component, config: setAtPath(component.config, path, value) }
        : component
    )));
  };

  const copyComponentPrompt = async () => {
    if (!currentComponent) return;
    await navigator.clipboard.writeText(
      COMPONENT_PROMPT
        .replace('[TYPE]', currentComponent.type)
        .replace('[DÁN CONFIG HIỆN TẠI]', JSON.stringify(currentComponent.config ?? {}, null, 2))
    );
    toast.success('Đã copy prompt component');
  };

  const handleCreate = async () => {
    if (!sourcePayload || !meta || !meta.label.trim()) {
      toast.error('Thiếu thông tin snapshot');
      return;
    }
    setIsSaving(true);
    try {
      const nextId = await saveSnapshot({
        label: meta.label.trim(),
        payload: buildPayload(sourcePayload, meta, headerItems, components),
      });
      toast.success('Đã tạo snapshot mới');
      router.push(`/admin/home-components/snapshots/${nextId}/home-components`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo snapshot');
    } finally {
      setIsSaving(false);
    }
  };

  if (snapshots === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-16">
      <div>
        <Link href="/admin/home-components" className="mb-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft size={14} /> Quay lại Home Components
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo snapshot nhanh từ snapshot cũ</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Chọn snapshot mẫu, nhập brand/menu, import AI từng component rồi tạo bản demo mới.</p>
          </div>
          <Button variant="accent" disabled={!sourcePayload || !meta || isSaving} onClick={() => void handleCreate()} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
            Xác nhận và tạo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-3">
          {STEPS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              disabled={!sourcePayload && item.key !== 'source'}
              onClick={() => setStep(item.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                step === item.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] dark:bg-slate-900">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {step === 'source' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshots.map((snapshot) => {
            const payload = snapshot.payload as HomepageSnapshotPayload | undefined;
            const count = payload?.homepage?.components?.length ?? 0;
            return (
              <Card key={snapshot._id} className={cn(sourceId === snapshot._id && 'ring-2 ring-blue-500')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{snapshot.label}</CardTitle>
                  <p className="text-xs text-slate-500">{count} component • slug: {snapshot.slug || 'chưa có'}</p>
                </CardHeader>
                <CardContent>
                  <Button type="button" className="w-full" variant={sourceId === snapshot._id ? 'accent' : 'outline'} onClick={() => selectSource(snapshot._id)}>
                    {sourceId === snapshot._id ? <Check size={14} /> : <Sparkles size={14} />} Chọn snapshot này
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {step === 'meta' && meta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin định hình snapshot</CardTitle>
            <p className="text-xs text-slate-500">Màu thương hiệu, slogan, liên hệ, mạng xã hội và menu dùng riêng cho bản demo snapshot.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tên snapshot</Label>
                <Input value={meta.label} onChange={(event) => setMeta({ ...meta, label: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tên thương hiệu</Label>
                <Input value={meta.site.site_name} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_name: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Slogan / tagline</Label>
                <Input value={meta.site.site_tagline} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_tagline: event.target.value } })} />
              </div>
              <SettingsImageUploader
                label="Logo"
                value={meta.site.site_logo}
                onChange={(url) => setMeta({ ...meta, site: { ...meta.site, site_logo: url ?? '' } })}
                folder="snapshot-settings"
                naming={{ entityName: 'snapshot-clone', field: 'logo', index: 1 }}
                previewSize="md"
              />
              <div className="space-y-2">
                <SettingsImageUploader
                  label="OG Image"
                  value={meta.seo.seo_og_image}
                  onChange={(url) => setMeta({ ...meta, seo: { ...meta.seo, seo_og_image: url ?? '' } })}
                  folder="snapshot-settings"
                  naming={{ entityName: 'snapshot-clone', field: 'og-image', index: 1 }}
                  previewSize="md"
                />
                <p className="text-xs text-slate-500">Ảnh chia sẻ mạng xã hội cho demo snapshot, nên dùng tỉ lệ 1200×630.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Màu chính</Label>
                  <div className="flex gap-2">
                    <input type="color" value={meta.site.site_brand_primary || '#9b2c3b'} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_brand_primary: event.target.value } })} className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" />
                    <Input value={meta.site.site_brand_primary} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_brand_primary: event.target.value } })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Màu phụ</Label>
                  <div className="flex gap-2">
                    <input type="color" value={meta.site.site_brand_secondary || '#ecaa4d'} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_brand_secondary: event.target.value } })} className="h-10 w-12 rounded-md border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" />
                    <Input value={meta.site.site_brand_secondary} onChange={(event) => setMeta({ ...meta, site: { ...meta.site, site_brand_secondary: event.target.value } })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={meta.contact.contact_email} onChange={(event) => setMeta({ ...meta, contact: { ...meta.contact, contact_email: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={meta.contact.contact_phone} onChange={(event) => setMeta({ ...meta, contact: { ...meta.contact, contact_phone: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Zalo</Label>
                <Input value={meta.contact.contact_zalo} onChange={(event) => setMeta({ ...meta, contact: { ...meta.contact, contact_zalo: event.target.value } })} />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label>Địa chỉ</Label>
                <Input value={meta.contact.contact_address} onChange={(event) => setMeta({ ...meta, contact: { ...meta.contact, contact_address: event.target.value } })} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input value={meta.social.social_facebook} onChange={(event) => setMeta({ ...meta, social: { ...meta.social, social_facebook: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={meta.social.social_instagram} onChange={(event) => setMeta({ ...meta, social: { ...meta.social, social_instagram: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input value={meta.social.social_youtube} onChange={(event) => setMeta({ ...meta, social: { ...meta.social, social_youtube: event.target.value } })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'menu' && (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-5 w-5 text-blue-500" /> Import AI — Tạo menu header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { void navigator.clipboard.writeText(MENU_PROMPT); toast.success('Đã copy prompt menu'); }}>
                <Copy size={14} /> Copy prompt
              </Button>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{MENU_PROMPT}</pre>
              <textarea
                className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder='{"items":[{"label":"Trang chủ"},{"label":"Sản phẩm"}]}'
                value={menuInput}
                onChange={(event) => setMenuInput(event.target.value)}
              />
              {menuInput.trim() && (
                <div className={cn('rounded-lg border p-3 text-sm', menuResult.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700')}>
                  {menuResult.error || `Sẵn sàng áp dụng ${menuResult.lines.length} menu item.`}
                </div>
              )}
              <Button type="button" variant="accent" disabled={menuResult.lines.length === 0 || Boolean(menuResult.error)} onClick={applyMenuImport}>Áp dụng menu</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Menu className="h-5 w-5" /> Preview menu header</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="font-semibold">{meta?.site.site_name || 'Thương hiệu'}</div>
                  <Badge variant="secondary">{headerItems.length} item</Badge>
                </div>
                <div className="space-y-2">
                  {headerItems.map((item) => (
                    <div key={item._id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900" style={{ marginLeft: item.depth * 20 }}>
                      {item.depth > 0 ? <span className="text-xs text-slate-400">↳</span> : null}
                      <Input value={item.label} onChange={(event) => setHeaderItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, label: event.target.value } : entry))} className="h-8" />
                    </div>
                  ))}
                  {headerItems.length === 0 ? <div className="text-sm text-slate-500">Chưa có item menu.</div> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'components' && currentComponent && meta && previewBundle && (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
          <Card className="xl:sticky xl:top-4 xl:self-start">
            <CardHeader>
              <CardTitle className="text-base">Danh sách component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {components.map((component, index) => (
                <button
                  key={component.componentKey}
                  type="button"
                  onClick={() => { setComponentIndex(index); setComponentInput(''); }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm',
                    index === componentIndex ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                  )}
                >
                  <span className="min-w-0 truncate">{index + 1}. {component.title}</span>
                  <Badge variant="secondary">{component.type}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base">{currentComponent.title}</CardTitle>
                    <p className="text-xs text-slate-500">Giữ layout: {LAYOUT_KEYS.map((key) => getStringAtPath(currentComponent.config, [key])).filter(Boolean).join(' / ') || 'theo config gốc'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={componentIndex === 0} onClick={() => setComponentIndex((value) => Math.max(0, value - 1))}>
                      <ChevronLeft size={14} /> Trước
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={componentIndex >= components.length - 1} onClick={() => setComponentIndex((value) => Math.min(components.length - 1, value + 1))}>
                      Sau <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => { void copyComponentPrompt(); }}>
                    <Copy size={14} /> Copy prompt component
                  </Button>
                  <textarea
                    className="min-h-72 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    placeholder='{"title":"Tiêu đề mới","items":[...]}'
                    value={componentInput}
                    onChange={(event) => setComponentInput(event.target.value)}
                  />
                  <Button type="button" variant="accent" disabled={!componentInput.trim()} onClick={applyComponentImport}>
                    <Sparkles size={14} /> Áp dụng JSON
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ImageIcon size={15} /> Ảnh trong component</div>
                    <div className="max-h-72 space-y-3 overflow-auto pr-1">
                      {imagePaths.map((item, index) => (
                        <SettingsImageUploader
                          key={item.path.join('.')}
                          label={item.label || `Ảnh ${index + 1}`}
                          value={getStringAtPath(currentComponent.config, item.path)}
                          onChange={(url) => patchCurrentImage(item.path, url ?? '')}
                          folder="snapshot-components"
                          naming={{ entityName: currentComponent.type.toLowerCase(), field: item.label || 'image', index: index + 1 }}
                          previewSize="sm"
                        />
                      ))}
                      {imagePaths.length === 0 ? <p className="text-xs text-slate-500">Chưa phát hiện field ảnh. Có thể dán URL ảnh trực tiếp trong JSON import.</p> : null}
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">{JSON.stringify(currentComponent.config ?? {}, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-5 w-5" /> Preview giống site thật</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[720px] overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                  <InitialBrandColorsProvider value={{ mode: 'dual', primary: meta.site.site_brand_primary || '#9b2c3b', secondary: meta.site.site_brand_secondary || '#ecaa4d' }}>
                    <SnapshotDemoProvider bundle={previewBundle}>
                      <ComponentRenderer
                        component={{
                          _id: currentComponent.componentKey,
                          active: true,
                          config: (currentComponent.config ?? {}) as Record<string, unknown>,
                          order: currentComponent.order,
                          title: currentComponent.title,
                          type: currentComponent.type,
                        }}
                      />
                    </SnapshotDemoProvider>
                  </InitialBrandColorsProvider>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 'confirm' && meta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xác nhận tạo snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500">Snapshot nguồn</div>
                <div className="font-semibold">{sourceSnapshot?.label}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500">Snapshot mới</div>
                <div className="font-semibold">{meta.label}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500">Menu header</div>
                <div className="font-semibold">{headerItems.length} item</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs text-slate-500">Home component</div>
                <div className="font-semibold">{components.length} block</div>
              </div>
            </div>
            <Button type="button" variant="accent" size="lg" disabled={isSaving} onClick={() => void handleCreate()} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              Xác nhận và tạo snapshot
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SnapshotClonePage() {
  return (
    <ModuleGuard moduleKey="homepage">
      <SnapshotCloneWizard />
    </ModuleGuard>
  );
}

'use client';

import React from 'react';
import { Bot, Check, ChevronDown, Copy, Database, FileText, GripVertical, Image, ImagePlus, Layers2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, cn } from '../../../components/ui';
import { MultiImageUploader } from '../../../components/MultiImageUploader';
import { DEMO_CATEGORIES_DATA, getHomepageCategoryHeroCropAspectRatio } from '../_lib/constants';
import { HOMEPAGE_CATEGORY_HERO_ICON_OPTIONS, getHomepageCategoryHeroIcon } from '../_lib/icon-options';
import type {
  HomepageCategoryHeroAutoGenerateConfig,
  HomepageCategoryHeroAutoGenerateMeta,
  HomepageCategoryHeroCategoryItem,
  HomepageCategoryHeroCategoryImageSize,
  HomepageCategoryHeroCategoryImageShape,
  HomepageCategoryHeroCornerRadius,
  HomepageCategoryHeroCategoryVisualMode,
  HomepageCategoryHeroMenuGroup,
  HomepageCategoryHeroMenuLink,
  HomepageCategoryHeroSelectionMode,
  HomepageCategoryHeroSlide,
  HomepageCategoryHeroStyle,
} from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';

/* ------------------------------------------------------------------ */
/*  Clearable text input                                               */
/* ------------------------------------------------------------------ */

export function ClearableInput({
  value,
  onChange,
  ...rest
}: Omit<React.ComponentProps<typeof Input>, 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={cn('pr-8', rest.className)}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          tabIndex={-1}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export type DemoCategoryDataItem = { _id: string; name: string; image?: string };

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const trimText = (value: unknown, maxLength = 200) => {
  if (typeof value !== 'string' && typeof value !== 'number') { return ''; }
  return String(value).trim().slice(0, maxLength);
};

const AI_FULL_PROMPT = `Hãy tạo cấu hình đầy đủ cho home-component "Hero khám phá danh mục" của website ecommerce tiếng Việt.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema:
{
  "heroSlides": [
    { "url": "URL ảnh banner http/https hoặc /path", "link": "/products" }
  ],
  "categories": [
    {
      "name": "Tên danh mục chính",
      "image": "URL ảnh đại diện danh mục",
      "iconName": "ShoppingBag | Laptop | Home | Heart | Utensils",
      "groups": [
        {
          "title": "Tên nhóm menu",
          "items": [
            { "label": "Tên mục con/sản phẩm gợi ý", "image": "URL ảnh optional" }
          ]
        }
      ]
    }
  ]
}

Yêu cầu:
- Tạo 2-4 heroSlides đúng tỉ lệ banner 16:9, riêng nếu người dùng chọn top-nav thì ưu tiên 21:9.
- Tạo 5-8 categories chính, mỗi category có 1-3 groups, mỗi group có 3-6 items.
- Tên tự nhiên, dễ hiểu với người mua Việt Nam.
- Link ảnh dùng URL hợp lệ, không dùng base64.
- Không tạo field ngoài schema.`;

const AI_FULL_SAMPLE = `{
  "heroSlides": [
    {
      "url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
      "link": "/products"
    }
  ],
  "categories": [
    {
      "name": "Chăm sóc tóc",
      "image": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da",
      "iconName": "Heart",
      "groups": [
        {
          "title": "Sản phẩm nổi bật",
          "items": [
            {
              "label": "Dầu gội phục hồi tóc",
              "image": "https://images.unsplash.com/photo-1526947425960-945c6e72858f"
            }
          ]
        }
      ]
    }
  ]
}`;

type FullAiImportResult = {
  categories: HomepageCategoryHeroCategoryItem[];
  demoCategoriesData: DemoCategoryDataItem[];
  errors: string[];
  heroSlides: HomepageCategoryHeroSlide[];
};

const parseFullAiImport = (raw: string): FullAiImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { categories: [], demoCategoriesData: [], errors: ['JSON chưa hợp lệ.'], heroSlides: [] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { categories: [], demoCategoriesData: [], errors: ['Root JSON phải là object.'], heroSlides: [] };
  }

  const record = parsed as Record<string, unknown>;
  const rawSlides = Array.isArray(record.heroSlides) ? record.heroSlides : Array.isArray(record.slides) ? record.slides : [];
  const rawCategories = Array.isArray(record.categories) ? record.categories : [];
  const demoCategoriesData: DemoCategoryDataItem[] = [];
  const heroSlides = rawSlides.slice(0, 6).reduce<HomepageCategoryHeroSlide[]>((acc, item, index) => {
    if (typeof item !== 'object' || item === null) { return acc; }
    const slide = item as Record<string, unknown>;
    const url = trimText(slide.url ?? slide.image, 500);
    if (!url) { return acc; }
    acc.push({ id: `ai-slide-${Date.now()}-${index}`, link: trimText(slide.link, 500), url });
    return acc;
  }, []);

  const categories = rawCategories.slice(0, 10).reduce<HomepageCategoryHeroCategoryItem[]>((acc, item, categoryIndex) => {
    if (typeof item !== 'object' || item === null) { return acc; }
    const category = item as Record<string, unknown>;
    const name = trimText(category.name ?? category.label, 100);
    if (!name) { return acc; }
    const categoryId = trimText(category.categoryId ?? category._id, 80) || `ai-cat-${categoryIndex + 1}`;
    demoCategoriesData.push({ _id: categoryId, image: trimText(category.image, 500) || undefined, name });
    const groupsSource = Array.isArray(category.groups) ? category.groups : [];
    const groups = groupsSource.slice(0, 4).reduce<HomepageCategoryHeroMenuGroup[]>((groupAcc, group, groupIndex) => {
      if (typeof group !== 'object' || group === null) { return groupAcc; }
      const groupRecord = group as Record<string, unknown>;
      const itemsSource = Array.isArray(groupRecord.items) ? groupRecord.items : [];
      const items = itemsSource.slice(0, 8).reduce<HomepageCategoryHeroMenuLink[]>((itemAcc, link, linkIndex) => {
        if (typeof link !== 'object' || link === null) { return itemAcc; }
        const linkRecord = link as Record<string, unknown>;
        const label = trimText(linkRecord.label ?? linkRecord.name, 100);
        if (!label) { return itemAcc; }
        const childCategoryId = `ai-cat-${categoryIndex + 1}-${groupIndex + 1}-${linkIndex + 1}`;
        const image = trimText(linkRecord.image, 500) || undefined;
        demoCategoriesData.push({ _id: childCategoryId, image, name: label });
        itemAcc.push({
          categoryId: childCategoryId,
          id: ((categoryIndex + 1) * 10000) + ((groupIndex + 1) * 100) + (linkIndex + 1),
          image,
          label,
          targetType: 'category',
        });
        return itemAcc;
      }, []);
      if (items.length > 0) {
        groupAcc.push({ id: ((categoryIndex + 1) * 100) + (groupIndex + 1), items, title: trimText(groupRecord.title, 100) || 'Gợi ý' });
      }
      return groupAcc;
    }, []);
    acc.push({ categoryId, groups, iconName: trimText(category.iconName, 80) || undefined, id: categoryIndex + 1, imageOverride: trimText(category.imageOverride, 500) || undefined });
    return acc;
  }, []);

  const errors: string[] = [];
  if (heroSlides.length === 0) { errors.push('Thiếu heroSlides hợp lệ.'); }
  if (categories.length === 0) { errors.push('Thiếu categories hợp lệ.'); }

  return { categories, demoCategoriesData, errors, heroSlides };
};

function FullAiImportButton({
  onApply,
}: {
  onApply: (result: Omit<FullAiImportResult, 'errors'>) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = React.useState(false);
  const [rawInput, setRawInput] = React.useState('');
  const [lastCopied, setLastCopied] = React.useState<'prompt' | 'sample' | null>(null);
  const result = React.useMemo(() => parseFullAiImport(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.errors.length === 0;

  if (!isAiImportEnabled) { return null; }

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const apply = () => {
    if (!canApply) { return; }
    onApply({ categories: result.categories, demoCategoriesData: result.demoCategoriesData, heroSlides: result.heroSlides });
    toast.success('Đã import đầy đủ banner, danh mục và menu');
    setRawInput('');
    setOpen(false);
  };

  return (
    <>
      <HomeComponentFooterActionPortal>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <Bot size={16} /> Import AI
        </Button>
      </HomeComponentFooterActionPortal>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import AI Hero danh mục</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON đầy đủ rồi dán vào đây để áp dụng banner, danh mục demo và menu cùng lúc.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_FULL_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600">{AI_FULL_PROMPT}</pre>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => void copyText(AI_FULL_SAMPLE, 'sample')}>
                {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy JSON mẫu
              </Button>
            </div>
            <div className="space-y-3">
              <Label>Dán JSON AI trả về</Label>
              <textarea
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                className="min-h-[320px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5"
                placeholder={AI_FULL_SAMPLE}
              />
              {rawInput.trim() && (
                <div className={cn('rounded-lg border px-3 py-2 text-xs', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
                  {result.errors.length > 0
                    ? result.errors.join(' ')
                    : `Sẵn sàng import ${result.heroSlides.length} banner, ${result.categories.length} danh mục, ${result.demoCategoriesData.length} mục demo.`}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="button" disabled={!canApply} onClick={apply}>Áp dụng toàn bộ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const activeSections = ['settings', 'source', 'banner', 'categories'];

export function HomepageCategoryHeroForm({
  heroSlides,
  setHeroSlides,
  style,
  categoryItems,
  setCategoryItems,
  categoriesData,
  categoryVisualMode,
  setCategoryVisualMode,
  categoryImageSize,
  setCategoryImageSize,
  categoryImageShape,
  setCategoryImageShape,
  autoGenerateConfig: _autoGenerateConfig,
  autoGenerateMeta: _autoGenerateMeta,
  autoGenerateReady,
  autoGenerateLoading,
  hideEmptyCategories,
  setHideEmptyCategories,
  onAutoGenerate,
  onLoadDemo,
  selectionMode = 'manual',
  onSelectionModeChange,
  defaultExpanded = true,
  demoCategoriesData,
  setDemoCategoriesData,
  cornerRadius,
  setCornerRadius,
  setNoBorderRadius,
  setNoVerticalMargin,
  spacing,
  setSpacing,
  bannerImageFit,
  setBannerImageFit,
}: {
  heroSlides: HomepageCategoryHeroSlide[];
  setHeroSlides: (value: HomepageCategoryHeroSlide[]) => void;
  style: HomepageCategoryHeroStyle;
  categoryItems: HomepageCategoryHeroCategoryItem[];
  setCategoryItems: (value: HomepageCategoryHeroCategoryItem[]) => void;
  categoriesData: { _id: string; name: string; image?: string }[];
  categoryVisualMode: HomepageCategoryHeroCategoryVisualMode;
  setCategoryVisualMode: (value: HomepageCategoryHeroCategoryVisualMode) => void;
  categoryImageSize: HomepageCategoryHeroCategoryImageSize;
  setCategoryImageSize: (value: HomepageCategoryHeroCategoryImageSize) => void;
  categoryImageShape: HomepageCategoryHeroCategoryImageShape;
  setCategoryImageShape: (value: HomepageCategoryHeroCategoryImageShape) => void;
  autoGenerateConfig: HomepageCategoryHeroAutoGenerateConfig;
  autoGenerateMeta?: HomepageCategoryHeroAutoGenerateMeta;
  autoGenerateReady: boolean;
  autoGenerateLoading: boolean;
  hideEmptyCategories: boolean;
  setHideEmptyCategories: (value: boolean) => void;
  onAutoGenerate: () => void;
  onLoadDemo?: () => void;
  selectionMode?: HomepageCategoryHeroSelectionMode;
  onSelectionModeChange?: (mode: HomepageCategoryHeroSelectionMode) => void;
  defaultExpanded?: boolean;
  demoCategoriesData?: DemoCategoryDataItem[];
  setDemoCategoriesData?: React.Dispatch<React.SetStateAction<DemoCategoryDataItem[]>>;
  cornerRadius: HomepageCategoryHeroCornerRadius;
  setCornerRadius: (value: HomepageCategoryHeroCornerRadius) => void;
  noBorderRadius?: boolean;
  setNoBorderRadius?: (value: boolean) => void;
  noVerticalMargin?: boolean;
  setNoVerticalMargin?: (value: boolean) => void;
  spacing?: SectionSpacing;
  setSpacing?: (value: SectionSpacing) => void;
  bannerImageFit?: 'cover' | 'contain';
  setBannerImageFit?: (value: 'cover' | 'contain') => void;
}) {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);
  const isDemo = selectionMode === 'demo';
  const resolvedCategoriesData = isDemo ? (demoCategoriesData ?? DEMO_CATEGORIES_DATA) : categoriesData;
  const [expandedCategoryIds, setExpandedCategoryIds] = React.useState<number[]>([]);
  const [iconSearch, setIconSearch] = React.useState<Record<number, string>>({});
  const [editingImageKeys, setEditingImageKeys] = React.useState<Set<string>>(new Set());
  const toggleImageEdit = (key: string) => setEditingImageKeys(prev => {
    const next = new Set(prev);
    if (next.has(key)) { next.delete(key); } else { next.add(key); }
    return next;
  });

  React.useEffect(() => {
    setExpandedCategoryIds((prev) => prev.filter((id) => categoryItems.some((item) => item.id === id)));
  }, [categoryItems]);

  const addCategory = () => {
    const newId = Math.max(0, ...categoryItems.map((item) => item.id)) + 1;
    setCategoryItems([...categoryItems, { id: newId, categoryId: '', groups: [] }]);
    setExpandedCategoryIds((prev) => [...prev, newId]);
  };

  const removeCategory = (id: number) => {
    setCategoryItems(categoryItems.filter((item) => item.id !== id));
  };

  const updateCategory = (id: number, updates: Partial<HomepageCategoryHeroCategoryItem>) => {
    setCategoryItems(categoryItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const getCategoryItem = (id: number) => categoryItems.find((item) => item.id === id);

  const addGroup = (id: number) => {
    const target = getCategoryItem(id);
    const list = target?.groups ?? [];
    const nextId = Math.max(0, ...list.map((item) => item.id)) + 1;
    updateCategory(id, { groups: [...list, { id: nextId, title: '', items: [] }] });
  };

  const updateGroup = (id: number, groupId: number, updates: Partial<HomepageCategoryHeroMenuGroup>) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const list = (target.groups ?? []).map((group) => (group.id === groupId ? { ...group, ...updates } : group));
    updateCategory(id, { groups: list });
  };

  const removeGroup = (id: number, groupId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const list = (target.groups ?? []).filter((group) => group.id !== groupId);
    updateCategory(id, { groups: list });
  };

  const addGroupItem = (id: number, groupId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = group.items ?? [];
      const nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
      return { ...group, items: [...items, { id: nextId, targetType: 'category' as const, categoryId: '' }] };
    });
    updateCategory(id, { groups: list });
  };

  const updateGroupItem = (id: number, groupId: number, itemId: number, updates: Partial<HomepageCategoryHeroMenuLink>) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = (group.items ?? []).map((item) => (item.id === itemId ? { ...item, ...updates } : item));
      return { ...group, items };
    });
    updateCategory(id, { groups: list });
  };

  const removeGroupItem = (id: number, groupId: number, itemId: number) => {
    const target = getCategoryItem(id);
    if (!target) {return;}
    const groups = target.groups ?? [];
    const list = groups.map((group) => {
      if (group.id !== groupId) {return group;}
      const items = (group.items ?? []).filter((item) => item.id !== itemId);
      return { ...group, items };
    });
    updateCategory(id, { groups: list });
  };

  const duplicateCategoryIds = new Set(
    categoryItems
      .filter((item) => item.categoryId)
      .map((item) => item.categoryId)
      .filter((id, index, list) => list.indexOf(id) !== index)
  );

  const totalGroups = categoryItems.reduce((sum, item) => sum + (item.groups?.length ?? 0), 0);
  const totalLinks = categoryItems.reduce(
    (sum, item) => sum + (item.groups ?? []).reduce((groupSum, group) => groupSum + (group.items?.length ?? 0), 0),
    0
  );

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped = categoryItems.filter((item) => {
      if (!item.categoryId) {return true;}
      if (seen.has(item.categoryId)) {return false;}
      seen.add(item.categoryId);
      return true;
    });
    setCategoryItems(deduped);
    setExpandedCategoryIds((prev) => prev.filter((id) => deduped.some((item) => item.id === id)));
  };

  const toggleCategory = (id: number) => {
    setExpandedCategoryIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  };

  const toggleAllCategories = () => {
    if (categoryItems.length === 0) {return;}
    setExpandedCategoryIds((prev) => (prev.length === categoryItems.length ? [] : categoryItems.map((item) => item.id)));
  };

  const allExpanded = categoryItems.length > 0 && expandedCategoryIds.length === categoryItems.length;
  const avatarSizeOptions: Array<{ id: HomepageCategoryHeroCategoryImageSize; label: string }> = [
    { id: '2xs', label: 'Rất nhỏ' },
    { id: 'xs', label: 'Nhỏ' },
    { id: 'sm', label: 'Vừa' },
    { id: 'md', label: 'Lớn' },
    { id: 'lg', label: 'Rất lớn' },
    { id: 'xl', label: 'Cực đại' },
  ];
  const avatarShapeOptions: Array<{ id: HomepageCategoryHeroCategoryImageShape; label: string }> = [
    { id: 'circle', label: 'Tròn' },
    { id: 'rounded', label: 'Vuông bo góc' },
    { id: 'square', label: 'Vuông sắc' },
  ];

  return (
    <>
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
      <FullAiImportButton
        onApply={(result) => {
          setHeroSlides(result.heroSlides);
          setCategoryItems(result.categories);
          setExpandedCategoryIds(result.categories.map((item) => item.id));
          setDemoCategoriesData?.(result.demoCategoriesData);
          onSelectionModeChange?.('demo');
        }}
      />
      <Card>
        <CardContent className="p-4 space-y-3">
        {/* ── Cấu hình hiển thị ───────────────────── */}
        <HomeComponentDisplaySettingsSection
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={(value) => {
            setCornerRadius(value);
            setNoBorderRadius?.(value === 'none');
          }}
          spacing={spacing ?? 'normal'}
          onSpacingChange={(value) => {
            setSpacing?.(value);
            setNoVerticalMargin?.(value === 'none');
          }}
        >
          <div className="space-y-2">
            <Label className="text-sm">Dấu hiệu cạnh danh mục</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={categoryVisualMode === 'image' ? 'default' : 'outline'} onClick={() => setCategoryVisualMode('image')}>Ảnh</Button>
              <Button type="button" size="sm" variant={categoryVisualMode === 'icon' ? 'default' : 'outline'} onClick={() => setCategoryVisualMode('icon')}>Icon</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Kích thước</Label>
            <select value={categoryImageSize} onChange={(e) => setCategoryImageSize(e.target.value as HomepageCategoryHeroCategoryImageSize)} className="h-10 w-full rounded-md border border-slate-200 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 px-3 text-sm">
              {avatarSizeOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Hình dạng</Label>
            <select value={categoryImageShape} onChange={(e) => setCategoryImageShape(e.target.value as HomepageCategoryHeroCategoryImageShape)} className="h-10 w-full rounded-md border border-slate-200 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 px-3 text-sm">
              {avatarShapeOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          {setBannerImageFit && (
            <div className="space-y-2">
              <Label className="text-sm">Cách đặt ảnh banner</Label>
              <div className="flex gap-1.5">
                <Button type="button" size="sm" variant={bannerImageFit === 'cover' ? 'default' : 'outline'} onClick={() => setBannerImageFit('cover')} className="h-10 flex-1 px-3 text-xs">Lấp đầy khung</Button>
                <Button type="button" size="sm" variant={bannerImageFit === 'contain' ? 'default' : 'outline'} onClick={() => setBannerImageFit('contain')} className="h-10 flex-1 px-3 text-xs">Hiện đủ ảnh</Button>
              </div>
            </div>
          )}
        </HomeComponentDisplaySettingsSection>

          {/* ── Nguồn dữ liệu ───────────────────────── */}
          <SubSection
            icon={Database}
            title="Nguồn dữ liệu"
            open={openSections.source}
            onOpenChange={(open) => toggleSection('source', open)}
          >
          {/* Mode toggle */}
          {onSelectionModeChange && (
            <div className="flex gap-2">
              {(['manual', 'demo'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectionModeChange(m)}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                    selectionMode === m
                      ? m === 'demo'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                        : 'border-blue-500 bg-blue-500/10 text-blue-600'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  {m === 'manual' ? 'Dữ liệu thật' : 'Dữ liệu demo'}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs leading-relaxed text-slate-500">
            {isDemo
              ? 'Tạo nhanh giao diện bằng dữ liệu mẫu. Phù hợp khi chưa có sản phẩm thật hoặc cần demo cho khách.'
              : 'Dùng danh mục và sản phẩm thật để AI dựng menu ban đầu, sau đó bạn chỉnh lại nếu cần.'}
          </p>
          {/* Real data controls */}
          {!isDemo && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={onAutoGenerate} className="gap-2" size="sm" disabled={!autoGenerateReady || autoGenerateLoading}>
                <Bot size={14} /> {autoGenerateLoading ? 'Đang tải...' : 'AI tạo menu từ dữ liệu thật'}
              </Button>
              <label className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={Boolean(hideEmptyCategories)}
                  onChange={(e) => setHideEmptyCategories(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Ẩn mục trống
              </label>
            </div>
          )}

          {/* Demo data controls */}
          {isDemo && onLoadDemo && (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onLoadDemo}>
              <Bot size={14} /> Dùng mẫu demo
            </Button>
          )}

          {/* Demo categories CRUD */}
          {isDemo && setDemoCategoriesData && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-amber-700">Danh mục demo ({resolvedCategoriesData.length})</Label>
                <div className="flex gap-1.5">
                  <Button
                    type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => {
                      setDemoCategoriesData(DEMO_CATEGORIES_DATA);
                    }}
                  >
                    <Bot size={11} /> Mẫu mặc định
                  </Button>
                  <Button
                    type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={() => {
                      const newId = `demo-custom-${Date.now()}`;
                      setDemoCategoriesData(prev => [...prev, { _id: newId, name: '' }]);
                    }}
                  >
                    <Plus size={12} /> Thêm
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {resolvedCategoriesData.map((cat, index) => (
                  <div key={cat._id} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white p-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white text-[10px] rounded-full font-medium shrink-0">
                      {index + 1}
                    </span>
                    {cat.image ? (
                      <img src={cat.image} alt="" className="w-8 h-8 rounded object-cover shrink-0 border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-dashed border-slate-200">
                        <ImagePlus size={12} className="text-slate-400" />
                      </div>
                    )}
                    <ClearableInput
                      value={cat.name}
                      onChange={(v) => setDemoCategoriesData(prev => prev.map(c => c._id === cat._id ? { ...c, name: v } : c))}
                      placeholder="Tên danh mục *"
                      className="h-8 flex-1 text-xs min-w-0"
                    />
                    <ClearableInput
                      value={cat.image ?? ''}
                      onChange={(v) => setDemoCategoriesData(prev => prev.map(c => c._id === cat._id ? { ...c, image: v || undefined } : c))}
                      placeholder="URL ảnh"
                      className="h-8 w-40 text-xs shrink-0"
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                      onClick={() => setDemoCategoriesData(prev => prev.filter(c => c._id !== cat._id))}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
              {resolvedCategoriesData.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-500">Chưa có danh mục demo. Nhấn "Thêm" hoặc "Mẫu mặc định".</p>
              )}
            </div>
          )}

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Đang có {categoryItems.length} danh mục, {totalGroups} nhóm, {totalLinks} link.
          </p>
        </SubSection>

        {/* ── Banner hero ─────────────────────────── */}
        <SubSection
          icon={Image}
          title="Banner hero"
          open={openSections.banner}
          onOpenChange={(open) => toggleSection('banner', open)}
        >
          <p className="text-xs leading-relaxed text-slate-500">Banner là một phần của “Import AI” ở mục Nguồn dữ liệu. Bạn vẫn có thể chỉnh hoặc thêm thủ công tại đây.</p>
          <MultiImageUploader<HomepageCategoryHeroSlide>
            items={heroSlides}
            onChange={setHeroSlides}
            folder="homepage-category-hero"
            imageKey="url"
            extraFields={[{ key: 'link', placeholder: 'URL liên kết (tuỳ chọn)', type: 'url' }]}
            minItems={1}
            maxItems={6}
            aspectRatio="banner"
            columns={1}
            showReorder={true}
            enableCrop
            cropOnUpload={false}
            cropAspectRatio={() => getHomepageCategoryHeroCropAspectRatio(style)}
            imageAspectRatio={getHomepageCategoryHeroCropAspectRatio(style)}
            deleteMode="defer"
            addButtonText="Thêm banner"
            emptyText="Chưa có banner hero"
          />
          <p className="text-xs text-slate-500">Ưu tiên 1-3 banner rõ chủ thể, ít chữ trên ảnh.</p>

        </SubSection>

        {/* ── Menu danh mục ────────────────────────── */}
        <SubSection
          icon={Layers2}
          title={`Menu danh mục (${categoryItems.length})`}
          open={openSections.categories}
          onOpenChange={(open) => toggleSection('categories', open)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 lg:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAllCategories}
              disabled={categoryItems.length === 0}
            >
              {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCategory}
              disabled={resolvedCategoriesData.length === 0}
              className="gap-2"
            >
              <Plus size={14} /> Thêm danh mục
            </Button>
          </div>
          </div>
          {duplicateCategoryIds.size > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>Có {duplicateCategoryIds.size} danh mục bị trùng. Mỗi danh mục chỉ nên xuất hiện một lần.</div>
                <button type="button" className="font-medium underline underline-offset-4" onClick={handleRemoveDuplicates}>
                  Xóa trùng
                </button>
              </div>
            </div>
          )}

          {resolvedCategoriesData.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Chưa có danh mục sản phẩm.</p>
          ) : categoryItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Chưa có menu. Nhấn “Sinh ngay” để lấy từ dữ liệu thực hoặc thêm thủ công.</p>
          ) : (
            <div className="space-y-4">
              {categoryItems.map((item, idx) => {
                const groups = item.groups ?? [];
                const isDuplicate = duplicateCategoryIds.has(item.categoryId);
                const isExpanded = expandedCategoryIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-2xl border p-4 shadow-sm',
                      isDuplicate ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        onClick={() => toggleCategory(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <GripVertical size={16} className="shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <Label className="text-sm font-medium text-slate-900">Danh mục {idx + 1}</Label>
                          <p className="text-xs text-slate-500">{groups.length} nhóm • {groups.reduce((sum, group) => sum + (group.items?.length ?? 0), 0)} link</p>
                        </div>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
                      </button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeCategory(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-500">Danh mục gốc</Label>
                          <select
                            value={item.categoryId}
                            onChange={(e) => updateCategory(item.id, { categoryId: e.target.value })}
                            className={cn(
                              'h-10 w-full rounded-md border bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 px-3 text-sm',
                              isDuplicate ? 'border-amber-400' : 'border-slate-200'
                            )}
                          >
                            <option value="" className="text-slate-500 dark:text-slate-400">-- Chọn danh mục --</option>
                            {resolvedCategoriesData.map((cat) => (
                              <option key={cat._id} value={cat._id} className="text-slate-900 dark:text-slate-100">{cat.name}</option>
                            ))}
                          </select>
                          {isDuplicate && <p className="text-xs text-amber-700">Danh mục này đang bị trùng.</p>}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              className={cn(
                                'relative w-10 h-10 rounded-lg border overflow-hidden shrink-0 group/catimg transition-colors',
                                item.imageOverride ? 'border-blue-300 bg-blue-50' : 'border-dashed border-slate-200 bg-slate-50',
                              )}
                              title="Sửa ảnh đại diện"
                              onClick={() => toggleImageEdit(`cat-${item.id}`)}
                            >
                              {item.imageOverride ? (
                                <img src={item.imageOverride} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImagePlus size={14} className="absolute inset-0 m-auto text-slate-300" />
                              )}
                            </button>
                            <ClearableInput
                              value={item.imageOverride ?? ''}
                              onChange={(v) => updateCategory(item.id, { imageOverride: v || undefined })}
                              placeholder="URL ảnh đại diện"
                              className="h-9 text-xs flex-1"
                            />
                          </div>
                          {categoryVisualMode === 'icon' && (
                            <div className="mt-4 space-y-2">
                              <Label className="text-xs text-slate-500">Chọn icon</Label>
                              <ClearableInput
                                value={iconSearch[item.id] ?? ''}
                                onChange={(v) => setIconSearch((prev) => ({ ...prev, [item.id]: v }))}
                                placeholder="Tìm icon..."
                                className="h-9"
                              />
                              <div className="grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-8">
                                {HOMEPAGE_CATEGORY_HERO_ICON_OPTIONS.filter((option) => {
                                  const search = (iconSearch[item.id] ?? '').trim().toLowerCase();
                                  if (!search) {return true;}
                                  return option.label.toLowerCase().includes(search) || option.name.toLowerCase().includes(search);
                                }).map((option) => {
                                  const isSelected = option.name === item.iconName;
                                  const Icon = option.Icon;
                                  return (
                                    <button
                                      key={option.name}
                                      type="button"
                                      title={option.label}
                                      onClick={() => updateCategory(item.id, { iconName: option.name })}
                                      className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg border text-slate-600 transition-colors',
                                        isSelected
                                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                      )}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {item.iconName ? (
                                  <>
                                    {(() => {
                                      const Icon = getHomepageCategoryHeroIcon(item.iconName);
                                      return Icon ? <Icon className="h-4 w-4 text-slate-600" /> : null;
                                    })()}
                                    <span>Đang chọn: {item.iconName}</span>
                                  </>
                                ) : (
                                  <span>Chưa chọn icon.</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Label className="text-xs text-slate-500">Nhóm menu con</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => addGroup(item.id)} className="gap-2">
                              <Plus size={14} /> Thêm nhóm
                            </Button>
                          </div>

                          {groups.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                              Chưa có nhóm con.
                            </p>
                          ) : (
                            <div className="grid gap-3 xl:grid-cols-2">
                              {groups.map((group) => (
                                <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs text-slate-500">Nhóm #{group.id}</Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500"
                                      onClick={() => removeGroup(item.id, group.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                  <ClearableInput
                                    value={group.title}
                                    onChange={(v) => updateGroup(item.id, group.id, { title: v })}
                                    placeholder="Tiêu đề nhóm"
                                    className="mt-2 h-9"
                                  />
                                  <div className="mt-3 space-y-2">
                                    {(group.items ?? []).map((link) => (
                                      <div key={link.id} className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          {/* Thumbnail — click toggle edit URL */}
                                          <button
                                            type="button"
                                            className={cn(
                                              'relative w-7 h-7 rounded border overflow-hidden shrink-0 transition-colors',
                                              link.image ? 'border-blue-300 bg-blue-50' : 'border-dashed border-slate-200 bg-slate-50',
                                              editingImageKeys.has(`link-${item.id}-${group.id}-${link.id}`) && 'ring-2 ring-blue-400',
                                            )}
                                            title="Sửa ảnh"
                                            onClick={() => toggleImageEdit(`link-${item.id}-${group.id}-${link.id}`)}
                                          >
                                            {link.image ? (
                                              <img src={link.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <ImagePlus size={12} className="absolute inset-0 m-auto text-slate-300" />
                                            )}
                                          </button>
                                          {/* Select danh mục hoặc badge product */}
                                          {link.targetType === 'product' || link.productId ? (
                                            <span className="h-7 flex items-center gap-1 rounded border border-dashed border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-500 truncate min-w-0 flex-1">
                                              {link.label || link.slug || 'Sản phẩm'}
                                              <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-px text-[9px]">SP</span>
                                            </span>
                                          ) : (
                                            <select
                                              value={link.categoryId}
                                              onChange={(e) => updateGroupItem(item.id, group.id, link.id, { targetType: 'category', categoryId: e.target.value })}
                                              className="h-7 flex-1 min-w-0 rounded border border-slate-200 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 px-2 text-[11px]"
                                            >
                                              <option value="" className="text-slate-500 dark:text-slate-400">-- Danh mục --</option>
                                              {resolvedCategoriesData.map((cat) => (
                                                <option key={cat._id} value={cat._id} className="text-slate-900 dark:text-slate-100">{cat.name}</option>
                                              ))}
                                            </select>
                                          )}
                                          {/* Label override */}
                                          <ClearableInput
                                            value={link.label ?? ''}
                                            onChange={(v) => updateGroupItem(item.id, group.id, link.id, { label: v || undefined })}
                                            placeholder="Label"
                                            className="h-7 w-24 text-[11px] shrink-0"
                                          />
                                          <Button
                                            type="button" variant="ghost" size="icon"
                                            className="h-6 w-6 shrink-0 text-slate-400 hover:text-red-500"
                                            onClick={() => removeGroupItem(item.id, group.id, link.id)}
                                          >
                                            <Trash2 size={12} />
                                          </Button>
                                        </div>
                                        {/* Inline URL ảnh editor */}
                                        {editingImageKeys.has(`link-${item.id}-${group.id}-${link.id}`) && (
                                          <div className="flex items-center gap-1.5 pl-[34px]">
                                            <ImagePlus size={11} className="text-slate-400 shrink-0" />
                                            <ClearableInput
                                              value={link.image ?? ''}
                                              onChange={(v) => updateGroupItem(item.id, group.id, link.id, { image: v || undefined })}
                                              placeholder="Dán URL ảnh sản phẩm"
                                              className="h-6 text-[11px] flex-1"
                                              autoFocus
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => addGroupItem(item.id, group.id)} className="gap-2">
                                      <Plus size={14} /> Thêm link
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-500">Giữ mỗi danh mục 2-4 nhóm để menu ngắn gọn.</p>
        </SubSection>
      </CardContent>
    </Card>
    </>
  );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { AiMenuImportDialog } from './AiMenuImportDialog';
import type { AiMenuLine } from './_ai-menu-parser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { 
  Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, cn
} from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { BulkActionBar, SelectCheckbox } from '../components/TableUtilities';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { QuickRoutePickerModal } from '@/app/admin/components/QuickRoutePickerModal';
import { buildCategoryPath, buildModuleListPath, normalizeRouteMode } from '@/lib/ia/route-mode';
import { 
  ArrowDown, ArrowUp, Bot, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, EyeOff, 
  GripVertical, Link2, Loader2, Menu, Plus, Sparkles, Trash2
} from 'lucide-react';
import { SimpleMenuPreview } from './SimpleMenuPreview';
import { MENU_MAX_LEVEL, resolveMenuMaxDepthLevel } from '@/lib/utils/menu-tree';

const MODULE_KEY = 'menus';
const MENU_ITEMS_LIMIT = 500;


interface MenuItem {
  _id: Id<"menuItems">;
  _creationTime: number;
  menuId: Id<"menus">;
  label: string;
  url: string;
  order: number;
  depth: number;
  parentId?: Id<"menuItems">;
  icon?: string;
  openInNewTab?: boolean;
  active: boolean;
}

interface DraftMenuItem {
  id?: Id<"menuItems">;
  localId: string;
  label: string;
  url: string;
  order: number;
  depth: number;
  parentId?: Id<"menuItems">;
  icon?: string;
  openInNewTab?: boolean;
  active: boolean;
}

type SmartMenuMode = 'replace' | 'append';

type SmartMenuPlanItem = {
  depth: number;
  label: string;
  reasons: string[];
  score: number;
  url: string;
};

export default function MenuBuilderPageWrapper() {
  return (
    <ModuleGuard moduleKey="menus">
      <MenuBuilderPage />
    </ModuleGuard>
  );
}

function MenuBuilderPage() {
  const menusData = useQuery(api.menus.listMenus);
  const createMenu = useMutation(api.menus.createMenu);

  const isLoading = menusData === undefined;

  // Only get header menu
  const headerMenu = menusData?.find(m => m.location === 'header');

  const handleCreateHeaderMenu = async () => {
    try {
      await createMenu({ location: 'header', name: 'Header Menu' });
      toast.success('Đã tạo lại Header Menu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo Header Menu');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Header Menu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý menu điều hướng chính trên thanh header</p>
        </div>
        <div />
      </div>

      {headerMenu ? (
        <MenuItemsEditor menuId={headerMenu._id} />
      ) : (
        <Card className="p-8 text-center">
          <Menu className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Chưa có Header Menu</h3>
          <p className="text-slate-500 mb-4">Chưa có dữ liệu menu.</p>
          <Button type="button" onClick={handleCreateHeaderMenu}>
            Tạo Header Menu
          </Button>
        </Card>
      )}
    </div>
  );
}

function MenuItemsEditor({ menuId }: { menuId: Id<"menus"> }) {
  const menuItemsData = useQuery(api.menus.listMenuItems, { menuId });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const enabledModules = useQuery(api.admin.modules.listEnabledModules);
  const productCategories = useQuery(api.productCategories.listActive);
  const postCategories = useQuery(api.postCategories.listActive, { limit: 100 });
  const serviceCategories = useQuery(api.serviceCategories.listActive, { limit: 100 });
  const projectCategories = useQuery(api.projectCategories.listActive, { limit: 100 });
  const courseCategories = useQuery(api.courseCategories.listActive, { limit: 100 });
  const resourceCategories = useQuery(api.resourceCategories.listActive, { limit: 100 });
  const trustPageRoutes = useQuery(api.menus.listTrustPageRoutesForPicker, {});
  const coursesEnabled = enabledModules?.some(moduleItem => moduleItem.key === 'courses') ?? false;
  const publishedCourseCount = useQuery(api.courses.countPublished, coursesEnabled ? {} : 'skip');
  const routeModeSetting = useQuery(api.settings.getValue, { key: 'ia_route_mode', defaultValue: 'unified' });
  const routeMode = useMemo(() => normalizeRouteMode(routeModeSetting), [routeModeSetting]);
  const saveMenuItemsBulk = useMutation(api.menus.saveMenuItemsBulk);

  const [draftItems, setDraftItems] = useState<DraftMenuItem[]>([]);
  const [originalItems, setOriginalItems] = useState<DraftMenuItem[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isQuickPickerOpen, setIsQuickPickerOpen] = useState(false);
  const [quickPickerTargetId, setQuickPickerTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // AI Import state
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const [isSmartBuilderOpen, setIsSmartBuilderOpen] = useState(false);
  const [smartBuilderMode, setSmartBuilderMode] = useState<SmartMenuMode>('replace');
  const [isUseProductTypeLogic, setIsUseProductTypeLogic] = useState(false);

  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const enableProductTypes = enableProductTypesSetting?.value === true;
  const smartMenuBuilderData = useQuery(api.menus.getSmartMenuBuilderData, isUseProductTypeLogic ? {} : 'skip');


  const maxDepthLevel = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'maxDepth');
    return resolveMenuMaxDepthLevel(setting?.value);
  }, [settingsData]);

  const maxDepth = maxDepthLevel;

  // Feature toggles from System Config
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showNested = enabledFeatures.enableNested ?? true;
  const showNewTab = enabledFeatures.enableNewTab ?? true;


  const buildDraftItems = (items: MenuItem[]) => items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      id: item._id,
      localId: item._id,
      label: item.label,
      url: item.url,
      order: index,
      depth: item.depth,
      parentId: item.parentId,
      icon: item.icon,
      openInNewTab: item.openInNewTab,
      active: item.active,
    }));

  const normalizeOrders = (items: DraftMenuItem[]) => items.map((item, index) => ({ ...item, order: index }));

  const isValidMenuStructure = (items: DraftMenuItem[]) => items.every((item, index) => {
    if (index === 0) {
      return item.depth === 0;
    }
    return item.depth <= items[index - 1].depth + 1;
  });

  const canApplyDraftItems = (items: DraftMenuItem[]) => isValidMenuStructure(normalizeOrders(items));

  const createLocalItem = (partial: Partial<DraftMenuItem>): DraftMenuItem => ({
    localId: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: 'Liên kết mới',
    url: '/',
    depth: 0,
    order: 0,
    active: true,
    ...partial,
  });

  const smartMenuPlan = useMemo<SmartMenuPlanItem[]>(() => {
    const enabledKeys = new Set((enabledModules ?? []).map(moduleItem => moduleItem.key));
    const maxChildDepth = Math.max(0, maxDepth - 1);
    const seen = new Set<string>();
    const items: SmartMenuPlanItem[] = [];
    const add = (item: SmartMenuPlanItem) => {
      const uniqueKey = `${item.url}::${item.label}`;
      if (seen.has(uniqueKey)) {return;}
      if (item.depth > maxChildDepth) {return;}
      seen.add(uniqueKey);
      items.push(item);
    };
    const hasPublishedCourses = enabledKeys.has('courses') && (publishedCourseCount ?? 0) > 0;
    const appendTrustPages = (scoreBase: number) => {
      const routes = (trustPageRoutes ?? []).slice(0, maxChildDepth >= 1 ? 6 : 3);
      if (routes.length === 0) {return;}
      if (maxChildDepth >= 1) {
        add({
          depth: 0,
          label: 'Chính sách',
          reasons: ['Có trang tin cậy đã xuất bản từ Trust Pages'],
          score: scoreBase,
          url: '#',
        });
        routes.forEach((route, index) => {
          add({
            depth: 1,
            label: route.label,
            reasons: ['Trang chính sách đã map dữ liệu'],
            score: scoreBase - 1 - index,
            url: route.url,
          });
        });
        return;
      }
      routes.forEach((route, index) => {
        add({
          depth: 0,
          label: route.label,
          reasons: ['Trang chính sách đã map dữ liệu'],
          score: scoreBase - index,
          url: route.url,
        });
      });
    };

    if (isUseProductTypeLogic && smartMenuBuilderData && enableProductTypes) {
      const { productTypes, productCategoryTypes, attributeGroups, productTypeAttributeGroups, attributeTerms } = smartMenuBuilderData;

      add({ depth: 0, label: 'Trang chủ', reasons: ['Luôn nên có trong menu chính'], score: 100, url: '/' });
      add({ depth: 0, label: 'Sản phẩm', reasons: ['Khu vực chính'], score: 90, url: buildModuleListPath('products') });

      if (maxChildDepth >= 1) {
        productTypes.forEach((pt, ptIndex) => {
          add({
            depth: 1,
            label: pt.name,
            reasons: ['Loại sản phẩm'],
            score: 89 - ptIndex,
            url: `/${pt.slug}`
          });

          if (maxChildDepth >= 2) {
            const ptCatIds = new Set(productCategoryTypes.filter(m => m.typeId === pt._id).map(m => m.categoryId));
            const ptCats = (productCategories ?? []).filter(c => ptCatIds.has(c._id));
            ptCats.forEach((cat, catIndex) => {
              add({
                depth: 2,
                label: cat.name,
                reasons: [`Danh mục thuộc ${pt.name}`],
                score: 80 - catIndex,
                url: `/${pt.slug}/${cat.slug}`
              });
            });

            const ptGroupIds = productTypeAttributeGroups.filter(m => m.typeId === pt._id).sort((a, b) => a.order - b.order).map(m => m.groupId);
            const ptSpecialGroups = attributeGroups.filter(g => g.isSpecialFilter && ptGroupIds.includes(g._id));
            
            ptSpecialGroups.forEach((group, groupIndex) => {
              add({
                depth: 2,
                label: group.name,
                reasons: [`Bộ lọc đặc biệt của ${pt.name}`],
                score: 70 - groupIndex,
                url: `/${pt.slug}`
              });

              if (maxChildDepth >= 3) {
                const groupTerms = attributeTerms.filter(t => t.groupId === group._id);
                groupTerms.forEach((term, termIndex) => {
                  add({
                    depth: 3,
                    label: term.name,
                    reasons: [`Giá trị của ${group.name}`],
                    score: 60 - termIndex,
                    url: `/${pt.slug}/${group.slug}/${term.slug}`
                  });
                });
              }
            });

            if (pt.priceRanges && pt.priceRanges.length > 0) {
              add({
                depth: 2,
                label: 'Mức giá',
                reasons: [`Khoảng giá của ${pt.name}`],
                score: 50,
                url: `/${pt.slug}`
              });
              if (maxChildDepth >= 3) {
                pt.priceRanges.forEach((range, rangeIndex) => {
                  add({
                    depth: 3,
                    label: range.label,
                    reasons: [`Mức giá`],
                    score: 40 - rangeIndex,
                    url: `/${pt.slug}/${range.slug}`
                  });
                });
              }
            }
          }
        });
      }

      if (enabledKeys.has('services')) {
        add({ depth: 0, label: 'Dịch vụ', reasons: ['Khu vực dịch vụ'], score: 75, url: buildModuleListPath('services') });
      }
      if (enabledKeys.has('projects')) {
        add({ depth: 0, label: 'Dự án', reasons: ['Khu vực dự án'], score: 74, url: buildModuleListPath('projects') });
      }
      if (hasPublishedCourses) {
        add({
          depth: 0,
          label: 'Khóa học',
          reasons: [`Có ${publishedCourseCount ?? 0} khóa học đã xuất bản`],
          score: 73,
          url: buildModuleListPath('courses'),
        });
      }
      if (enabledKeys.has('posts')) {
        add({ depth: 0, label: 'Bài viết', reasons: ['Khu vực bài viết'], score: 70, url: buildModuleListPath('posts') });
      }
      appendTrustPages(66);
      add({ depth: 0, label: 'Liên hệ', reasons: ['Nên đặt cuối menu'], score: 65, url: '/contact' });

      // Build tree ordering manually or rely on scores.
      // Since it's a tree, we need to sort roots, then children of roots, etc.
      // We will sort exactly like the standard logic below.
    } else {
      // STANDARD LOGIC BEGIN
      const categoryLimit = maxDepth >= 3 ? 6 : 4;
      const appendCategories = (
        categories: Array<{ name: string; slug: string }> | undefined,
        moduleKey: 'posts' | 'products' | 'services' | 'courses' | 'projects' | 'resources',
        scoreBase: number,
      ) => {
        if (maxChildDepth < 1) {return;}
        (categories ?? []).slice(0, categoryLimit).forEach((category, index) => {
          add({
            depth: 1,
            label: category.name,
            reasons: [
              'Danh mục đang bật',
              `Đang đứng #${index + 1} trong dữ liệu`,
            ],
            score: scoreBase - index,
            url: buildCategoryPath({ categorySlug: category.slug, mode: routeMode, moduleKey }),
          });
        });
      };

      add({
        depth: 0,
        label: 'Trang chủ',
        reasons: ['Luôn nên có trong menu chính'],
        score: 100,
        url: '/',
      });

    if (enabledKeys.has('products')) {
      add({
        depth: 0,
        label: 'Sản phẩm',
        reasons: [
          'Khu vực sản phẩm đang bật',
          `${productCategories?.length ?? 0} danh mục sản phẩm có thể làm menu con`,
        ],
        score: 96 + Math.min(12, productCategories?.length ?? 0),
        url: buildModuleListPath('products'),
      });
      appendCategories(productCategories, 'products', 88);
    }

    if (enabledKeys.has('services')) {
      add({
        depth: 0,
        label: 'Dịch vụ',
        reasons: [
          'Khu vực dịch vụ đang bật',
          `${serviceCategories?.length ?? 0} danh mục dịch vụ có thể làm menu con`,
        ],
        score: 90 + Math.min(8, serviceCategories?.length ?? 0),
        url: buildModuleListPath('services'),
      });
      appendCategories(serviceCategories, 'services', 78);
    }

    if (enabledKeys.has('projects')) {
      add({
        depth: 0,
        label: 'Dự án',
        reasons: [
          'Khu vực dự án đang bật',
          `${projectCategories?.length ?? 0} danh mục dự án có thể làm menu con`,
        ],
        score: 88 + Math.min(8, projectCategories?.length ?? 0),
        url: buildModuleListPath('projects'),
      });
      appendCategories(projectCategories, 'projects', 76);
    }

    if (hasPublishedCourses) {
      add({
        depth: 0,
        label: 'Khóa học',
        reasons: [
          'Khu vực khóa học đang bật',
          `${courseCategories?.length ?? 0} danh mục khóa học và ${publishedCourseCount ?? 0} khóa học đã xuất bản`,
        ],
        score: 86 + Math.min(8, courseCategories?.length ?? 0),
        url: buildModuleListPath('courses'),
      });
      appendCategories(courseCategories, 'courses', 74);
    }

    if (enabledKeys.has('resources')) {
      add({
        depth: 0,
        label: 'Tài nguyên',
        reasons: [
          'Khu vực tài nguyên đang bật',
          `${resourceCategories?.length ?? 0} danh mục tài nguyên có thể làm menu con`,
        ],
        score: 84 + Math.min(8, resourceCategories?.length ?? 0),
        url: buildModuleListPath('resources'),
      });
      appendCategories(resourceCategories, 'resources', 72);
    }

    if (enabledKeys.has('posts')) {
      add({
        depth: 0,
        label: 'Bài viết',
        reasons: [
          'Khu vực bài viết đang bật',
          `${postCategories?.length ?? 0} danh mục bài viết có thể làm menu con`,
        ],
        score: 82 + Math.min(6, postCategories?.length ?? 0),
        url: buildModuleListPath('posts'),
      });
      appendCategories(postCategories, 'posts', 68);
    }

    if (enabledKeys.has('promotions')) {
      add({
        depth: 0,
        label: 'Khuyến mãi',
        reasons: ['Khu vực khuyến mãi đang bật', 'Phù hợp nếu website có chiến dịch bán hàng'],
        score: 72,
        url: '/promotions',
      });
    }

    if (enabledKeys.has('wishlist')) {
      add({
        depth: 0,
        label: 'Yêu thích',
        reasons: ['Khu vực yêu thích đang bật', 'Hữu ích cho website bán hàng'],
        score: 58,
        url: '/wishlist',
      });
    }

    if (enabledKeys.has('cart')) {
      add({
        depth: 0,
        label: 'Giỏ hàng',
        reasons: ['Khu vực giỏ hàng đang bật', 'Đưa vào khi menu còn chỗ'],
        score: 55,
        url: '/cart',
      });
    }

    appendTrustPages(77);

    add({
      depth: 0,
      label: 'Liên hệ',
      reasons: ['Nên đặt cuối menu để khách dễ liên hệ'],
      score: 76,
      url: '/contact',
    });

    }
    // END OF IF ELSE (STANDARD LOGIC / PRODUCT TYPE LOGIC)
    
    // COMMONS LOGIC for Sorting tree
    const roots = items.filter(item => item.depth === 0);
    const rootUrls = roots
      .filter(item => item.url !== '/' && item.url !== '/contact')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.url);
    const allowedRootUrls = new Set(['/', ...rootUrls, '/contact']);

    const middleRootOrder = new Map(rootUrls.map((url, index) => [url, index]));
    const rootOrder = (url: string) => {
      if (url === '/') {return -1;}
      if (url === '/contact') {return 99;}
      return middleRootOrder.get(url) ?? 50;
    };
    const selectedRoots = items
      .filter(item => item.depth === 0 && allowedRootUrls.has(item.url))
      .sort((a, b) => rootOrder(a.url) - rootOrder(b.url));
    const selectedRootSet = new Set(selectedRoots.map(item => item.url));
    const childrenByRoot = new Map<string, SmartMenuPlanItem[]>();
    
    // For depth > 0, we need to map them properly to roots. The algorithm below is simplified and assumes depth 1 items follow their depth 0 parents, and depth 2 items follow depth 1, etc.
    // We rewrite the grouping to be strictly hierarchical based on prefix matching URL or custom logic if needed.
    
    // For now we use the existing grouping algorithm (it groups by the last seen root, so items array order is important)
    let currentRootUrl = '';
    items.forEach(item => {
      if (item.depth === 0) {
        currentRootUrl = item.url;
        return;
      }
      if (!selectedRootSet.has(currentRootUrl)) {return;}
      const children = childrenByRoot.get(currentRootUrl) ?? [];
      children.push(item);
      childrenByRoot.set(currentRootUrl, children);
    });

    return selectedRoots.flatMap(root => [
      root,
      ...(childrenByRoot.get(root.url) ?? [])
    ]).slice(0, MENU_ITEMS_LIMIT);
  }, [courseCategories, enabledModules, maxDepth, postCategories, productCategories, projectCategories, resourceCategories, publishedCourseCount, routeMode, serviceCategories, isUseProductTypeLogic, smartMenuBuilderData, enableProductTypes, trustPageRoutes]);

  const hasChanges = useMemo(() => {
    const normalize = (items: DraftMenuItem[]) => items.map(item => ({
      id: item.id,
      label: item.label,
      url: item.url,
      depth: item.depth,
      active: item.active,
      icon: item.icon,
      openInNewTab: item.openInNewTab,
      parentId: item.parentId,
      order: item.order,
    }));
    return JSON.stringify(normalize(draftItems)) !== JSON.stringify(normalize(originalItems));
  }, [draftItems, originalItems]);

  useEffect(() => {
    if (!menuItemsData) {return;}
    const nextItems = buildDraftItems(menuItemsData);
    const isInitialSync = originalItems.length === 0 && draftItems.length === 0;

    if (pendingSync || isInitialSync || !hasChanges) {
      setDraftItems(nextItems);
      setOriginalItems(nextItems);
      setPendingSync(false);
    }
  }, [menuItemsData, pendingSync, originalItems.length, draftItems.length, hasChanges]);


  // Pagination
  const totalPages = Math.max(1, Math.ceil(draftItems.length / MENU_ITEMS_LIMIT));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * MENU_ITEMS_LIMIT;
    return draftItems.slice(start, start + MENU_ITEMS_LIMIT);
  }, [draftItems, currentPage]);

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every(item => selectedIds.includes(item.localId));
  const somePageSelected = paginatedItems.some(item => selectedIds.includes(item.localId));

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => draftItems.some(item => item.localId === id)));
  }, [draftItems]);

  const isLoading = menuItemsData === undefined;
  const isAtMenuLimit = draftItems.length >= MENU_ITEMS_LIMIT;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    setDraftItems(prev => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) {return prev;}
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      const next = [...draftItems];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(index, 0, removed);
      setDragOverIndex(canApplyDraftItems(next) ? index : null);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setDraftItems(prev => {
      const next = [...prev];
      const [removed] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, removed);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleIndent = (item: DraftMenuItem, direction: 'in' | 'out') => {
    const newDepth = direction === 'in' 
      ? Math.min(item.depth + 1, maxDepth - 1) 
      : Math.max(item.depth - 1, 0);
    
    if (newDepth === item.depth) {return;}

    setDraftItems(prev => {
      const next = prev.map(current => current.localId === item.localId ? { ...current, depth: newDepth } : current);
      if (!canApplyDraftItems(next)) {return prev;}
      return next;
    });
  };

  const handleToggleActive = (item: DraftMenuItem) => {
    setDraftItems(prev => prev.map(current => current.localId === item.localId ? { ...current, active: !current.active } : current));
  };

  const handleDelete = (item: DraftMenuItem) => {
    if (confirm('Xóa liên kết này?')) {
      setDraftItems(prev => normalizeOrders(prev.filter(current => current.localId !== item.localId)));
      setSelectedIds(prev => prev.filter(id => id !== item.localId));
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedItems.map(item => item.localId);
    if (allPageSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
      return;
    }
    setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {return;}
    if (confirm(`Xóa ${selectedIds.length} liên kết đã chọn?`)) {
      setDraftItems(prev => normalizeOrders(prev.filter(item => !selectedIds.includes(item.localId))));
      setSelectedIds([]);
      toast.success(`Đã xóa ${selectedIds.length} liên kết`);
    }
  };

  const handleAdd = () => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const next = [...prev, createLocalItem({ order: prev.length })];
      return normalizeOrders(next);
    });
  };

  const handleAddBelow = (item: DraftMenuItem) => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const index = prev.findIndex(current => current.localId === item.localId);
      const next = [...prev];
      const newItem = createLocalItem({
        depth: item.depth,
        parentId: item.parentId,
      });
      next.splice(index + 1, 0, newItem);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  const handleCopy = (item: DraftMenuItem) => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    setDraftItems(prev => {
      const index = prev.findIndex(current => current.localId === item.localId);
      const next = [...prev];
      const newItem = createLocalItem({
        label: `${item.label} (copy)`,
        url: item.url,
        depth: item.depth,
        active: item.active,
        parentId: item.parentId,
        icon: item.icon,
        openInNewTab: item.openInNewTab,
      });
      next.splice(index + 1, 0, newItem);
      if (!canApplyDraftItems(next)) {return prev;}
      return normalizeOrders(next);
    });
  };

  const handleUpdateField = (itemId: string, field: 'label' | 'url', value: string) => {
    setDraftItems(prev => prev.map(item => item.localId === itemId ? { ...item, [field]: value } : item));
  };



  // AI Import handler
  const handleAiImportApply = (lines: AiMenuLine[]) => {
    const remaining = MENU_ITEMS_LIMIT - draftItems.length;
    if (remaining <= 0) {
      toast.error(`Đã đạt tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }

    const toAdd = lines.slice(0, remaining);
    const newItems: DraftMenuItem[] = toAdd.map((line, i) => createLocalItem({
      label: line.label,
      url: '/',
      depth: Math.min(line.depth, maxDepth - 1),
      order: draftItems.length + i,
    }));

    setDraftItems(prev => normalizeOrders([...prev, ...newItems]));
    toast.success(`Đã thêm ${newItems.length} menu item`);
  };

  const handleApplySmartBuilder = () => {
    if (smartMenuPlan.length === 0) {
      toast.error('Chưa có đủ dữ liệu để tạo menu thông minh');
      return;
    }

    const existingUrls = new Set(draftItems.map(item => item.url));
    const sourcePlan = smartBuilderMode === 'append'
      ? smartMenuPlan.filter(item => !existingUrls.has(item.url))
      : smartMenuPlan;
    const remaining = smartBuilderMode === 'append'
      ? MENU_ITEMS_LIMIT - draftItems.length
      : MENU_ITEMS_LIMIT;
    const toApply = sourcePlan.slice(0, remaining);

    if (toApply.length === 0) {
      toast.info('Menu hiện tại đã có đủ các mục được gợi ý');
      return;
    }

    const newItems = toApply.map((item, index) => createLocalItem({
      active: true,
      depth: Math.min(item.depth, maxDepth - 1),
      label: item.label,
      order: smartBuilderMode === 'append' ? draftItems.length + index : index,
      url: item.url,
    }));
    const nextItems = smartBuilderMode === 'replace'
      ? normalizeOrders(newItems)
      : normalizeOrders([...draftItems, ...newItems]);

    if (!canApplyDraftItems(nextItems)) {
      toast.error('Menu gợi ý chưa hợp lệ. Vui lòng giảm số tầng menu.');
      return;
    }

    setDraftItems(nextItems);
    setCurrentPage(1);
    setSelectedIds([]);
    setIsSmartBuilderOpen(false);
    toast.success(`${smartBuilderMode === 'replace' ? 'Đã dựng lại' : 'Đã thêm'} ${newItems.length} mục menu`);
  };

  const handleSaveAll = async () => {
    if (!hasChanges) {return;}
    if (!isValidMenuStructure(draftItems)) {
      toast.error('Cấu trúc menu không hợp lệ: không được nhảy tầng và item đầu phải ở tầng 1');
      return;
    }
    setIsSavingAll(true);
    try {
      await saveMenuItemsBulk({
        menuId,
        items: draftItems.map(item => ({
          id: item.id,
          label: item.label,
          url: item.url,
          depth: item.depth,
          active: item.active,
          icon: item.icon,
          openInNewTab: item.openInNewTab,
          parentId: item.parentId,
        })),
      });
      toast.success('Đã lưu tất cả thay đổi');
      setPendingSync(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi lưu');
    } finally {
      setIsSavingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  // Get actual index in full items array for move operations
  const getActualIndex = (item: DraftMenuItem) => draftItems.findIndex(i => i.localId === item.localId);



  const stats = [
    { label: 'Tổng', value: draftItems.length },
    { label: 'Hiện', value: draftItems.filter(item => item.active).length },
    { label: 'Ẩn', value: draftItems.filter(item => !item.active).length },
    { label: 'Tầng', value: maxDepth },
  ];
  const hasInvalidStructure = !isValidMenuStructure(draftItems);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(180px,1fr)] gap-4 xl:gap-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Chỉnh sửa menu và bấm lưu để áp dụng. Tối đa {MENU_ITEMS_LIMIT} menu items.</p>
        </div>

        <BulkActionBar
          selectedCount={selectedIds.length}
          entityLabel="liên kết"
          onDelete={handleBulkDelete}
          onClearSelection={() => { setSelectedIds([]); }}
        />

        {paginatedItems.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <SelectCheckbox
              checked={allPageSelected}
              indeterminate={!allPageSelected && somePageSelected}
              onChange={toggleSelectAllPage}
              title="Chọn tất cả trên trang"
            />
            <span className="text-slate-600 dark:text-slate-300">Chọn tất cả menu ở trang hiện tại</span>
          </div>
        )}

        {paginatedItems.map((item) => {
          const actualIndex = getActualIndex(item);
          const canMoveUp = actualIndex > 0 && canApplyDraftItems((() => {
            const next = [...draftItems];
            [next[actualIndex], next[actualIndex - 1]] = [next[actualIndex - 1], next[actualIndex]];
            return next;
          })());
          const canMoveDown = actualIndex < draftItems.length - 1 && canApplyDraftItems((() => {
            const next = [...draftItems];
            [next[actualIndex], next[actualIndex + 1]] = [next[actualIndex + 1], next[actualIndex]];
            return next;
          })());
          const canIndentOut = item.depth > 0 && canApplyDraftItems(
            draftItems.map(current => current.localId === item.localId ? { ...current, depth: Math.max(item.depth - 1, 0) } : current)
          );
          const canIndentIn = item.depth < maxDepth - 1 && canApplyDraftItems(
            draftItems.map(current => current.localId === item.localId ? { ...current, depth: Math.min(item.depth + 1, maxDepth - 1) } : current)
          );

          return (
            <div key={item.localId} className="relative" style={showNested ? { paddingLeft: Math.min(item.depth, MENU_MAX_LEVEL - 1) * 24 } : undefined}>
              {/* Tree guide lines */}
              {showNested && item.depth > 0 && (
                <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{ width: Math.min(item.depth, MENU_MAX_LEVEL - 1) * 24 }}>
                  {Array.from({ length: Math.min(item.depth, MENU_MAX_LEVEL - 1) }).map((_, i) => {
                    const isLast = i === Math.min(item.depth, MENU_MAX_LEVEL - 1) - 1;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0"
                        style={{ left: i * 24, width: 24 }}
                      >
                        {/* Vertical line */}
                        <div 
                          className={cn(
                            "absolute left-3 top-0 border-l-2 border-slate-200 dark:border-slate-800",
                            isLast ? "h-1/2" : "h-full"
                          )}
                        />
                        {/* Horizontal branch line */}
                        {isLast && (
                          <div className="absolute left-3 top-1/2 w-3 border-t-2 border-slate-200 dark:border-slate-800" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Menu Item */}
              <div 
                draggable
                onDragStart={(e) =>{  handleDragStart(e, actualIndex); }}
                onDragOver={(e) =>{  handleDragOver(e, actualIndex); }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, actualIndex)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-lg shadow-sm transition-all min-w-0 border-slate-200 dark:border-slate-700",
                  item.depth === 0 && "bg-white dark:bg-slate-900",
                  item.depth === 1 && "bg-slate-50/70 dark:bg-slate-900/60",
                  item.depth >= 2 && "bg-slate-100/40 dark:bg-slate-950/40",
                  selectedIds.includes(item.localId) && "ring-2 ring-blue-500/40 border-blue-300 dark:border-blue-700",
                  !item.active && "opacity-50",
                  draggedIndex === actualIndex && "opacity-50 scale-[0.98]",
                  dragOverIndex === actualIndex && "border-orange-500 border-2 bg-orange-50 dark:bg-orange-900/20"
                )}
              >
                <div className="flex items-center self-start pt-1">
                  <SelectCheckbox
                    checked={selectedIds.includes(item.localId)}
                    onChange={() => toggleSelectItem(item.localId)}
                    title="Chọn menu item"
                  />
                </div>

                <div className="flex flex-col gap-1 text-slate-300 cursor-grab active:cursor-grabbing">
                  <button type="button" onClick={ async () => handleMove(actualIndex, 'up')} className="hover:text-orange-600 disabled:opacity-30" disabled={!canMoveUp}><ArrowUp size={14}/></button>
                  <GripVertical size={14} className="text-slate-400" />
                  <button type="button" onClick={ async () => handleMove(actualIndex, 'down')} className="hover:text-orange-600 disabled:opacity-30" disabled={!canMoveDown}><ArrowDown size={14}/></button>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500 flex items-center gap-1.5">
                      Nhãn hiển thị
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold select-none",
                        item.depth === 0 && "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
                        item.depth === 1 && "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50",
                        item.depth >= 2 && "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                      )}>
                        {`Cấp ${item.depth + 1}`}
                      </span>
                    </Label>
                    <Input 
                      value={item.label} 
                      onChange={(e) =>{  handleUpdateField(item.localId, 'label', e.target.value); }} 
                      className="h-8 text-sm min-w-0" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">URL</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={item.url} 
                        onChange={(e) =>{  handleUpdateField(item.localId, 'url', e.target.value); }} 
                        className="h-8 text-sm font-mono text-xs min-w-0" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
                        onClick={() => {
                          setQuickPickerTargetId(item.localId);
                          setIsQuickPickerOpen(true);
                        }}
                        title="Chọn link gợi ý"
                      >
                        <Link2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 border-l border-slate-100 dark:border-slate-700 pl-2">
                  {showNested && (
                    <>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIndent(item, 'out')} disabled={!canIndentOut} title="Thụt lề trái">
                        <ChevronRight size={14} className="rotate-180"/>
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleIndent(item, 'in')} disabled={!canIndentIn} title={`Thụt lề phải (tối đa ${MENU_MAX_LEVEL} tầng)`}>
                        <ChevronRight size={14}/>
                      </Button>
                    </>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddBelow(item)} title="Thêm ngay bên dưới" disabled={isAtMenuLimit}>
                    <Plus size={14}/>
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(item)} title="Copy menu item" disabled={isAtMenuLimit}>
                    <Copy size={14}/>
                  </Button>
                  {showNewTab && item.openInNewTab && (
                    <span title="Mở tab mới"><ExternalLink size={14} className="text-slate-400" /></span>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item)} title={item.active ? 'Ẩn' : 'Hiện'}>
                    {item.active ? <Eye size={14}/> : <EyeOff size={14} className="text-slate-400"/>}
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(item)}>
                    <Trash2 size={14}/>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-dashed" onClick={handleAdd} disabled={isAtMenuLimit}>
            <Plus size={16} className="mr-2"/> {isAtMenuLimit ? `Đã đạt tối đa ${MENU_ITEMS_LIMIT} mục menu` : 'Thêm liên kết mới'}
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setIsSmartBuilderOpen(true)} title="Tự gợi ý menu từ dữ liệu đang có">
            <Sparkles size={16} /> Gợi ý menu
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setIsAiImportOpen(true)} disabled={isAtMenuLimit} title="Import menu từ AI">
            <Bot size={16} /> Nhập AI
          </Button>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * MENU_ITEMS_LIMIT + 1}-{Math.min(currentPage * MENU_ITEMS_LIMIT, draftItems.length)} / {draftItems.length}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() =>{  setCurrentPage(p => Math.max(1, p - 1)); }}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Trang {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() =>{  setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Thống kê</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{stat.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{stat.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Menu Preview Section */}
      <div className="lg:col-span-3">
        <SimpleMenuPreview
          items={draftItems.map(item => ({
            _id: (item.id ?? item.localId) as Id<"menuItems">,
            label: item.label,
            url: item.url,
            order: item.order,
            depth: item.depth,
            active: item.active,
          }))}
        />
      </div>

      <QuickRoutePickerModal
        open={isQuickPickerOpen}
        onOpenChange={(open) => {
          setIsQuickPickerOpen(open);
          if (!open) setQuickPickerTargetId(null);
        }}
        onSelect={(option) => {
          if (quickPickerTargetId) {
            handleUpdateField(quickPickerTargetId, 'url', option.url);
            handleUpdateField(quickPickerTargetId, 'label', option.label);
          }
          setIsQuickPickerOpen(false);
          setQuickPickerTargetId(null);
        }}
      />

      {/* AI Import Dialog */}
      <AiMenuImportDialog
        open={isAiImportOpen}
        onOpenChange={setIsAiImportOpen}
        onApply={handleAiImportApply}
      />

      <Dialog open={isSmartBuilderOpen} onOpenChange={setIsSmartBuilderOpen}>
        <DialogContent className="max-w-3xl w-[88vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Tự gợi ý menu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
              Hệ thống sẽ đọc các khu vực đang bật, danh mục đang có và tự xếp menu ngắn gọn. Đây chỉ là bản nháp, bạn vẫn xem lại rồi mới lưu.
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSmartBuilderMode('replace')}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  smartBuilderMode === 'replace'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                )}
              >
                <div className="font-semibold">Thay menu hiện tại</div>
                <div className="mt-1 text-xs text-slate-500">Xóa bản nháp đang sửa và dùng menu được gợi ý.</div>
              </button>

              <button
                type="button"
                onClick={() => setSmartBuilderMode('append')}
                className={cn(
                  'rounded-lg border p-3 text-left text-sm transition-colors',
                  smartBuilderMode === 'append'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                )}
              >
                <div className="font-semibold">Chỉ thêm mục thiếu</div>
                <div className="mt-1 text-xs text-slate-500">Giữ menu hiện tại, chỉ thêm mục chưa có.</div>
              </button>
            </div>

            {enableProductTypes && (
              <div className="flex items-center space-x-3 mt-4 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  id="useProductTypeLogic"
                  checked={isUseProductTypeLogic}
                  onChange={(e) => setIsUseProductTypeLogic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="useProductTypeLogic" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Sinh menu theo cấu trúc Loại sản phẩm và Bộ lọc đặc biệt
                </label>
              </div>
            )}

            <div className="max-h-[45vh] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
              {smartMenuPlan.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có gợi ý phù hợp.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {smartMenuPlan.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="px-4 py-3" style={{ paddingLeft: 16 + item.depth * 24 }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">#{index + 1}</span>
                            {item.depth > 0 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                Tầng {item.depth + 1}
                              </span>
                            )}
                            <span className="font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
                          </div>
                          <div className="mt-1 truncate font-mono text-xs text-slate-500">{item.url}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.reasons.join(' • ')}</div>
                        </div>
                        <div className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" title={`Điểm ưu tiên: ${Math.round(item.score)}`}>
                          Ưu tiên
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsSmartBuilderOpen(false)}>
                Hủy
              </Button>
              <Button type="button" onClick={handleApplySmartBuilder} disabled={smartMenuPlan.length === 0}>
                Dùng gợi ý này
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <HomeComponentStickyFooter
        isSubmitting={isSavingAll}
        hasChanges={hasChanges}
        onClickSave={handleSaveAll}
        submitType="button"
        submitLabel="Lưu tất cả"
        savedLabel="Đã lưu"
        disableSave={!hasChanges || isSavingAll || hasInvalidStructure}
        align="between"
      >
        <div className="hidden text-xs text-slate-500 md:block">
          {hasInvalidStructure ? 'Cấu trúc menu chưa hợp lệ' : `${draftItems.length}/${MENU_ITEMS_LIMIT} mục menu`}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleAdd} disabled={isAtMenuLimit || isSavingAll}>
            <Plus size={16} className="mr-1" />
            Thêm liên kết
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsAiImportOpen(true)} disabled={isAtMenuLimit || isSavingAll}>
            <Bot size={16} className="mr-1" />
            Nhập từ AI
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsSmartBuilderOpen(true)} disabled={isSavingAll}>
            <Sparkles size={16} className="mr-1" />
            Gợi ý menu
          </Button>
          <Button
            type="button"
            variant="accent"
            onClick={handleSaveAll}
            disabled={!hasChanges || isSavingAll || hasInvalidStructure}
          >
            {isSavingAll ? 'Đang lưu...' : hasChanges ? 'Lưu tất cả' : 'Đã lưu'}
          </Button>
        </div>
      </HomeComponentStickyFooter>
    </div>
  );
}

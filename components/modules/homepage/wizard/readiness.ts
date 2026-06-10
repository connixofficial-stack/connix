import type { ReadinessReport, RealitySnapshot } from './types';
import { HOME_COMPONENT_BASE_TYPES } from '@/lib/home-components/componentTypes';

const COMPONENT_REQUIREMENTS: Record<string, { modules?: string[]; tables?: string[]; experience?: string }> = {
  ProductCategories: { modules: ['products'], tables: ['productCategories'], experience: 'products_list_ui' },
  ProductList: { modules: ['products'], tables: ['products'], experience: 'products_list_ui' },
  ProductGrid: { modules: ['products'], tables: ['products'], experience: 'products_list_ui' },
  CategoryProducts: { modules: ['products'], tables: ['productCategories'], experience: 'products_list_ui' },
  Services: { modules: ['services'], tables: ['services'], experience: 'services_list_ui' },
  ServiceList: { modules: ['services'], tables: ['services'], experience: 'services_list_ui' },
  Process: { modules: ['services'], tables: ['services'], experience: 'services_list_ui' },
  Blog: { modules: ['posts'], tables: ['posts'], experience: 'posts_list_ui' },
  HomepageCategoryHero: { modules: ['products'], tables: ['productCategories'], experience: 'products_list_ui' },
  Countdown: { modules: ['promotions'], tables: ['promotions'], experience: 'promotions_list_ui' },
  VoucherPromotions: { modules: ['promotions'], tables: ['promotions'], experience: 'promotions_list_ui' },
  Contact: { modules: ['settings'], experience: 'contact_ui' },
};

const buildQuickActions = (moduleKeys: string[] = [], adminPaths: string[] = []) => {
  const moduleActions = moduleKeys.map((key) => ({
    href: `/system/modules/${key}`,
    label: `Mở module ${key}`,
  }));
  const adminActions = adminPaths.map((path) => ({
    href: path,
    label: `Mở ${path}`,
  }));
  return [...moduleActions, ...adminActions];
};

const toNonEmptyString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const buildReadinessReport = (snapshot: RealitySnapshot): ReadinessReport => {
  const moduleEnabledMap = new Map(snapshot.modules.map((moduleItem) => [moduleItem.key, moduleItem.enabled]));
  const dataCounts: Record<string, number> = {};
  snapshot.tableStats.forEach((stat) => {
    dataCounts[stat.table] = stat.count;
  });

  const blockers: ReadinessReport['blockers'] = [];
  const warnings: ReadinessReport['warnings'] = [];
  const unavailableComponents: ReadinessReport['unavailableComponents'] = [];
  const experienceWarnings: ReadinessReport['experienceWarnings'] = [];

  const productsCount = dataCounts.products ?? 0;
  const servicesCount = dataCounts.services ?? 0;
  const postsCount = dataCounts.posts ?? 0;
  const categoriesCount = dataCounts.productCategories ?? 0;

  const siteName = toNonEmptyString(snapshot.coreSettings.site_name);
  const contactPhone = toNonEmptyString(snapshot.coreSettings.contact_phone);
  const contactEmail = toNonEmptyString(snapshot.coreSettings.contact_email);

  if (!siteName) {
    blockers.push({
      key: 'missing_site_name',
      level: 'blocker',
      message: 'Thiếu tên website (site_name).',
      reason: 'Hero/SEO/CTA cần site name để render chuẩn.',
      quickActions: buildQuickActions(['settings'], ['/admin/settings']),
    });
  }

  if (!contactPhone && !contactEmail) {
    blockers.push({
      key: 'missing_contact',
      level: 'blocker',
      message: 'Thiếu thông tin liên hệ tối thiểu (phone/email).',
      reason: 'Contact + SpeedDial cần dữ liệu thật để render.',
      quickActions: buildQuickActions(['settings'], ['/admin/settings']),
    });
  }

  if (productsCount === 0 && servicesCount === 0) {
    blockers.push({
      key: 'missing_core_catalog',
      level: 'blocker',
      message: 'Chưa có sản phẩm hoặc dịch vụ.',
      reason: 'Không đủ dữ liệu để sinh homepage chuyển đổi.',
      quickActions: buildQuickActions(['products', 'services'], ['/admin/products', '/admin/services']),
    });
  }

  if (postsCount > 0 && postsCount < 3) {
    warnings.push({
      key: 'low_posts',
      level: 'warning',
      message: 'Số bài viết quá ít (<3).',
      reason: 'Blog block có thể mỏng nội dung.',
      quickActions: buildQuickActions(['posts'], ['/admin/posts']),
    });
  }

  if (categoriesCount > 0 && categoriesCount < 3) {
    warnings.push({
      key: 'low_categories',
      level: 'warning',
      message: 'Danh mục sản phẩm ít (<3).',
      reason: 'ProductCategories/CategoryProducts có thể kém đa dạng.',
      quickActions: buildQuickActions(['products'], ['/admin/product-categories']),
    });
  }

  const availableComponents: string[] = [];
  const componentTypes = snapshot.homeComponents.map((component) => component.type);
  const componentsToCheck = new Set([
    ...HOME_COMPONENT_BASE_TYPES.map((item) => item.value),
    ...Object.keys(COMPONENT_REQUIREMENTS),
    ...componentTypes,
  ]);

  componentsToCheck.forEach((type) => {
    const requirement = COMPONENT_REQUIREMENTS[type];
    if (!requirement) {
      availableComponents.push(type);
      return;
    }
    const missingModules = (requirement.modules ?? []).filter((moduleKey) => !moduleEnabledMap.get(moduleKey));
    if (missingModules.length > 0) {
      unavailableComponents.push({
        type,
        reason: `Module tắt: ${missingModules.join(', ')}`,
        quickActions: buildQuickActions(missingModules),
      });
      return;
    }
    const missingTables = (requirement.tables ?? []).filter((table) => (dataCounts[table] ?? 0) === 0);
    if (missingTables.length > 0) {
      warnings.push({
        key: `${type}-missing-data`,
        level: 'warning',
        message: `Thiếu dữ liệu cho ${type}.`,
        reason: `Bảng rỗng: ${missingTables.join(', ')}`,
        quickActions: buildQuickActions(requirement.modules, requirement.modules?.map((moduleKey) => `/admin/${moduleKey}`)),
      });
    }

    if (requirement.experience && snapshot.experienceSettings[requirement.experience] == null) {
      const slug = requirement.experience.replace('_ui', '').replace(/_/g, '-');
      experienceWarnings.push({
        type,
        href: `/system/experiences/${slug}`,
        message: `Experience ${requirement.experience} chưa cấu hình.`,
      });
    }

    availableComponents.push(type);
  });

  return {
    blockers,
    warnings,
    availableComponents,
    unavailableComponents,
    experienceWarnings,
    dataCounts,
  };
};

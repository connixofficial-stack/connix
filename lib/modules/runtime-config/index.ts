import { analyticsModule } from '../configs/analytics.config';
import { bookingsModule } from '../configs/bookings.config';
import { cartModule } from '../configs/cart.config';
import { commentsModule } from '../configs/comments.config';
import { contactInboxModule } from '../configs/contact-inbox.config';
import { coursesModule } from '../configs/courses.config';
import { customersModule } from '../configs/customers.config';
import { homepageModule } from '../configs/homepage.config';
import { kanbanModule } from '../configs/kanban.config';
import { mediaModule } from '../configs/media.config';
import { menusModule } from '../configs/menus.config';
import { notificationsModule } from '../configs/notifications.config';
import { ordersModule } from '../configs/orders.config';
import { postsModule } from '../configs/posts.config';
import { productsModule } from '../configs/products.config';
import { projectsModule } from '../configs/projects.config';
import { promotionsModule } from '../configs/promotions.config';
import { resourcesModule } from '../configs/resources.config';
import { rolesModule } from '../configs/roles.config';
import { servicesModule } from '../configs/services.config';
import { settingsModule } from '../configs/settings.config';
import { subscriptionsModule } from '../configs/subscriptions.config';
import { usersModule } from '../configs/users.config';
import { wishlistModule } from '../configs/wishlist.config';
import { normalizeRuntimeDefinition } from './normalize';
import type { RuntimeModuleDefinition } from './types';

const CATEGORY_RUNTIME_DEFINITIONS: RuntimeModuleDefinition[] = [
  {
    moduleKey: 'postCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 1, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 2, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 3, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 4, required: false, type: 'image' },
    ],
  },
  {
    moduleKey: 'productCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên danh mục', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: false, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 4, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'image', isSystem: false, name: 'Hình ảnh', order: 5, required: false, type: 'image' },
      { enabled: false, fieldKey: 'filterFooterContent', isSystem: false, linkedFeature: 'enableCategoryFilterFooterContent', name: 'Nội dung cuối danh mục', order: 6, required: false, type: 'richtext' },
      { enabled: false, fieldKey: 'productDetailSuffixContent', isSystem: false, linkedFeature: 'enableCategoryProductDetailSuffix', name: 'Nội dung nối đuôi sản phẩm', order: 7, required: false, type: 'richtext' },
      { enabled: false, fieldKey: 'productDetailFaqItems', isSystem: false, linkedFeature: 'enableCategoryProductDetailFaq', name: 'FAQ chi tiết sản phẩm', order: 8, required: false, type: 'json' },
    ],
  },
  {
    moduleKey: 'serviceCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 4, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
    ],
  },
  {
    moduleKey: 'courseCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 4, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
    ],
  },
  {
    moduleKey: 'projectCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 4, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
    ],
  },
  {
    moduleKey: 'resourceCategories',
    fields: [
      { enabled: true, fieldKey: 'name', isSystem: true, name: 'Tên', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'active', isSystem: true, name: 'Trạng thái', order: 3, required: true, type: 'boolean' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 4, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 5, required: false, type: 'image' },
    ],
  },
];

const moduleDefinitions = [
  analyticsModule,
  bookingsModule,
  cartModule,
  commentsModule,
  contactInboxModule,
  coursesModule,
  customersModule,
  homepageModule,
  kanbanModule,
  mediaModule,
  menusModule,
  notificationsModule,
  ordersModule,
  postsModule,
  productsModule,
  projectsModule,
  promotionsModule,
  resourcesModule,
  rolesModule,
  servicesModule,
  settingsModule,
  subscriptionsModule,
  usersModule,
  wishlistModule,
];

const MODULE_RUNTIME_DEFINITIONS: Record<string, RuntimeModuleDefinition> = {
  ...Object.fromEntries(moduleDefinitions.map((module) => [module.key, normalizeRuntimeDefinition(module)])),
  ...Object.fromEntries(CATEGORY_RUNTIME_DEFINITIONS.map((definition) => [definition.moduleKey, definition])),
};

export const getModuleRuntimeDefinition = (moduleKey: string): RuntimeModuleDefinition | null =>
  MODULE_RUNTIME_DEFINITIONS[moduleKey] ?? null;

export const hasModuleRuntimeDefinition = (moduleKey: string): boolean => Boolean(MODULE_RUNTIME_DEFINITIONS[moduleKey]);

/**
 * Seeder Registry - Export all seeders
 */

export { ProductSeeder } from './products.seeder';
export { seedProductVariants } from './variants.seeder';
export { seedVariantPresetOptions } from './variantPresets.seeder';
export { seedPresetProductOptions, PRESET_PRODUCT_OPTIONS } from './productOptions.seeder';
export { ProductCategorySeeder } from './productCategories.seeder';
export { PostCategorySeeder } from './postCategories.seeder';
export { PostSeeder } from './posts.seeder';
export { OrderSeeder } from './orders.seeder';
export { CustomerSeeder } from './customers.seeder';
export { PromotionsSeeder } from './promotions.seeder';
export { ServiceSeeder } from './services.seeder';
export { ServiceCategorySeeder } from './serviceCategories.seeder';
export { CourseSeeder } from './courses.seeder';
export { CourseCategorySeeder } from './courseCategories.seeder';
export { ProjectSeeder } from './projects.seeder';
export { ProjectCategorySeeder } from './projectCategories.seeder';
export { ResourceSeeder } from './resources.seeder';
export { ResourceCategorySeeder } from './resourceCategories.seeder';
export { AnalyticsSeeder } from './analytics.seeder';
export { CommentsSeeder } from './comments.seeder';
export { ContactInboxSeeder } from './contactInbox.seeder';
export { CartSeeder } from './cart.seeder';
export { SubscriptionsSeeder } from './subscriptions.seeder';
export { WishlistSeeder } from './wishlist.seeder';
export { RolesSeeder } from './roles.seeder';
export { UsersSeeder } from './users.seeder';
export { SettingsSeeder } from './settings.seeder';
export { MediaSeeder } from './media.seeder';
export { MenusSeeder } from './menus.seeder';
export { HomepageSeeder } from './homepage.seeder';
export { KanbanSeeder } from './kanban.seeder';
export { NotificationsSeeder } from './notifications.seeder';
export { AdminModulesSeeder } from './adminModules.seeder';
export { SystemPresetsSeeder } from './systemPresets.seeder';

// Export types
export type { SeedConfig, SeedResult, SeedDependency } from './base';
export { BaseSeeder, createSeeder, processBatch } from './base';
export { createVietnameseFaker } from './fakerVi';
export { SEEDER_REGISTRY, getSeeder, listSeedableModuleKeys } from './registry';
export { 
  resolveDependencies, 
  checkDependencies,
  SEED_DEPENDENCIES,
  MODULE_METADATA,
  SEED_PRESETS,
  getDefaultQuantity,
  getTableName,
  getModuleInfo,
  type PresetType,
} from './dependencies';

import type { GenericMutationCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';
import type { BaseSeeder } from './base';
import { AdminModulesSeeder } from './adminModules.seeder';
import { AnalyticsSeeder } from './analytics.seeder';
import { CartSeeder } from './cart.seeder';
import { SubscriptionsSeeder } from './subscriptions.seeder';
import { CommentsSeeder } from './comments.seeder';
import { ContactInboxSeeder } from './contactInbox.seeder';
import { CourseCategorySeeder } from './courseCategories.seeder';
import { CourseSeeder } from './courses.seeder';
import { CustomerSeeder } from './customers.seeder';
import { HomepageSeeder } from './homepage.seeder';
import { KanbanSeeder } from './kanban.seeder';
import { MediaSeeder } from './media.seeder';
import { MenusSeeder } from './menus.seeder';
import { NotificationsSeeder } from './notifications.seeder';
import { OrderSeeder } from './orders.seeder';
import { PostCategorySeeder } from './postCategories.seeder';
import { PostSeeder } from './posts.seeder';
import { ProductCategorySeeder } from './productCategories.seeder';
import { ProductSeeder } from './products.seeder';
import { ProjectCategorySeeder } from './projectCategories.seeder';
import { ProjectSeeder } from './projects.seeder';
import { PromotionsSeeder } from './promotions.seeder';
import { ResourceCategorySeeder } from './resourceCategories.seeder';
import { ResourceSeeder } from './resources.seeder';
import { RolesSeeder } from './roles.seeder';
import { ServiceCategorySeeder } from './serviceCategories.seeder';
import { ServiceSeeder } from './services.seeder';
import { SettingsSeeder } from './settings.seeder';
import { SystemPresetsSeeder } from './systemPresets.seeder';
import { UsersSeeder } from './users.seeder';
import { WishlistSeeder } from './wishlist.seeder';
import { LandingPagesSeeder } from './landingPages.seeder';

export type SeederConstructor = new (ctx: GenericMutationCtx<DataModel>) => BaseSeeder;

export const SEEDER_REGISTRY: Record<string, SeederConstructor> = {
  adminModules: AdminModulesSeeder,
  analytics: AnalyticsSeeder,
  subscriptions: SubscriptionsSeeder,
  cart: CartSeeder,
  comments: CommentsSeeder,
  contactInbox: ContactInboxSeeder,
  courseCategories: CourseCategorySeeder,
  courses: CourseSeeder,
  customers: CustomerSeeder,
  homepage: HomepageSeeder,
  kanban: KanbanSeeder,
  landingPages: LandingPagesSeeder,
  media: MediaSeeder,
  menus: MenusSeeder,
  notifications: NotificationsSeeder,
  orders: OrderSeeder,
  postCategories: PostCategorySeeder,
  posts: PostSeeder,
  productCategories: ProductCategorySeeder,
  products: ProductSeeder,
  projectCategories: ProjectCategorySeeder,
  projects: ProjectSeeder,
  promotions: PromotionsSeeder,
  resourceCategories: ResourceCategorySeeder,
  resources: ResourceSeeder,
  roles: RolesSeeder,
  serviceCategories: ServiceCategorySeeder,
  services: ServiceSeeder,
  settings: SettingsSeeder,
  systemPresets: SystemPresetsSeeder,
  users: UsersSeeder,
  wishlist: WishlistSeeder,
};

export function getSeeder(moduleKey: string): SeederConstructor | undefined {
  return SEEDER_REGISTRY[moduleKey];
}

export function listSeedableModuleKeys(): string[] {
  return Object.keys(SEEDER_REGISTRY);
}

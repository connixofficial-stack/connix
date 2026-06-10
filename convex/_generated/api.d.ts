/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLogs from "../activityLogs.js";
import type * as admin_modules from "../admin/modules.js";
import type * as admin_presets from "../admin/presets.js";
import type * as aiChat from "../aiChat.js";
import type * as analytics from "../analytics.js";
import type * as attributeGroups from "../attributeGroups.js";
import type * as attributeTerms from "../attributeTerms.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as cart from "../cart.js";
import type * as comments from "../comments.js";
import type * as contactInbox from "../contactInbox.js";
import type * as convexDashboard from "../convexDashboard.js";
import type * as courseCategories from "../courseCategories.js";
import type * as courseFilters from "../courseFilters.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as dataManager from "../dataManager.js";
import type * as email from "../email.js";
import type * as emailDb from "../emailDb.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as experiences from "../experiences.js";
import type * as fileLifecycle from "../fileLifecycle.js";
import type * as homeComponentSystemConfig from "../homeComponentSystemConfig.js";
import type * as homeComponents from "../homeComponents.js";
import type * as homepageSnapshots from "../homepageSnapshots.js";
import type * as homepageWizard from "../homepageWizard.js";
import type * as ia from "../ia.js";
import type * as kanban from "../kanban.js";
import type * as landingPages from "../landingPages.js";
import type * as lib_aggregates_pageViews from "../lib/aggregates/pageViews.js";
import type * as lib_aggregates_publicContent from "../lib/aggregates/publicContent.js";
import type * as lib_commerce from "../lib/commerce.js";
import type * as lib_componentLayouts from "../lib/componentLayouts.js";
import type * as lib_courseEnrollment from "../lib/courseEnrollment.js";
import type * as lib_fileService from "../lib/fileService.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as lib_iaSlugs from "../lib/iaSlugs.js";
import type * as lib_moduleConfigSync from "../lib/moduleConfigSync.js";
import type * as lib_multiCategory from "../lib/multiCategory.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_resourceAccess from "../lib/resourceAccess.js";
import type * as lib_search from "../lib/search.js";
import type * as lib_validators from "../lib/validators.js";
import type * as media from "../media.js";
import type * as menus from "../menus.js";
import type * as migrationBundles from "../migrationBundles.js";
import type * as model_comments from "../model/comments.js";
import type * as model_courseCategories from "../model/courseCategories.js";
import type * as model_courses from "../model/courses.js";
import type * as model_orders from "../model/orders.js";
import type * as model_postCategories from "../model/postCategories.js";
import type * as model_posts from "../model/posts.js";
import type * as model_projectCategories from "../model/projectCategories.js";
import type * as model_projects from "../model/projects.js";
import type * as model_resourceCategories from "../model/resourceCategories.js";
import type * as model_serviceCategories from "../model/serviceCategories.js";
import type * as model_services from "../model/services.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as pageViews from "../pageViews.js";
import type * as postCategories from "../postCategories.js";
import type * as posts from "../posts.js";
import type * as productCategories from "../productCategories.js";
import type * as productOptionValues from "../productOptionValues.js";
import type * as productOptions from "../productOptions.js";
import type * as productSupplementalContents from "../productSupplementalContents.js";
import type * as productTypes from "../productTypes.js";
import type * as productVariants from "../productVariants.js";
import type * as products from "../products.js";
import type * as productsImport from "../productsImport.js";
import type * as productsSmart from "../productsSmart.js";
import type * as projectCategories from "../projectCategories.js";
import type * as projects from "../projects.js";
import type * as promotions from "../promotions.js";
import type * as resourceCategories from "../resourceCategories.js";
import type * as resourceFilters from "../resourceFilters.js";
import type * as resources from "../resources.js";
import type * as roles from "../roles.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as seedManager from "../seedManager.js";
import type * as seeders_base from "../seeders/base.js";
import type * as seeders_dependencies from "../seeders/dependencies.js";
import type * as seeders_fakerVi from "../seeders/fakerVi.js";
import type * as seeders_index from "../seeders/index.js";
import type * as seeders_registry from "../seeders/registry.js";
import type * as serviceCategories from "../serviceCategories.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as snapshotCategories from "../snapshotCategories.js";
import type * as storage from "../storage.js";
import type * as subscriptions from "../subscriptions.js";
import type * as systemIntegrations from "../systemIntegrations.js";
import type * as trustPages from "../trustPages.js";
import type * as usageStats from "../usageStats.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  "admin/modules": typeof admin_modules;
  "admin/presets": typeof admin_presets;
  aiChat: typeof aiChat;
  analytics: typeof analytics;
  attributeGroups: typeof attributeGroups;
  attributeTerms: typeof attributeTerms;
  auth: typeof auth;
  bookings: typeof bookings;
  cart: typeof cart;
  comments: typeof comments;
  contactInbox: typeof contactInbox;
  convexDashboard: typeof convexDashboard;
  courseCategories: typeof courseCategories;
  courseFilters: typeof courseFilters;
  courses: typeof courses;
  crons: typeof crons;
  customers: typeof customers;
  dataManager: typeof dataManager;
  email: typeof email;
  emailDb: typeof emailDb;
  emailTemplates: typeof emailTemplates;
  experiences: typeof experiences;
  fileLifecycle: typeof fileLifecycle;
  homeComponentSystemConfig: typeof homeComponentSystemConfig;
  homeComponents: typeof homeComponents;
  homepageSnapshots: typeof homepageSnapshots;
  homepageWizard: typeof homepageWizard;
  ia: typeof ia;
  kanban: typeof kanban;
  landingPages: typeof landingPages;
  "lib/aggregates/pageViews": typeof lib_aggregates_pageViews;
  "lib/aggregates/publicContent": typeof lib_aggregates_publicContent;
  "lib/commerce": typeof lib_commerce;
  "lib/componentLayouts": typeof lib_componentLayouts;
  "lib/courseEnrollment": typeof lib_courseEnrollment;
  "lib/fileService": typeof lib_fileService;
  "lib/helpers": typeof lib_helpers;
  "lib/iaSlugs": typeof lib_iaSlugs;
  "lib/moduleConfigSync": typeof lib_moduleConfigSync;
  "lib/multiCategory": typeof lib_multiCategory;
  "lib/password": typeof lib_password;
  "lib/permissions": typeof lib_permissions;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/resourceAccess": typeof lib_resourceAccess;
  "lib/search": typeof lib_search;
  "lib/validators": typeof lib_validators;
  media: typeof media;
  menus: typeof menus;
  migrationBundles: typeof migrationBundles;
  "model/comments": typeof model_comments;
  "model/courseCategories": typeof model_courseCategories;
  "model/courses": typeof model_courses;
  "model/orders": typeof model_orders;
  "model/postCategories": typeof model_postCategories;
  "model/posts": typeof model_posts;
  "model/projectCategories": typeof model_projectCategories;
  "model/projects": typeof model_projects;
  "model/resourceCategories": typeof model_resourceCategories;
  "model/serviceCategories": typeof model_serviceCategories;
  "model/services": typeof model_services;
  notifications: typeof notifications;
  orders: typeof orders;
  pageViews: typeof pageViews;
  postCategories: typeof postCategories;
  posts: typeof posts;
  productCategories: typeof productCategories;
  productOptionValues: typeof productOptionValues;
  productOptions: typeof productOptions;
  productSupplementalContents: typeof productSupplementalContents;
  productTypes: typeof productTypes;
  productVariants: typeof productVariants;
  products: typeof products;
  productsImport: typeof productsImport;
  productsSmart: typeof productsSmart;
  projectCategories: typeof projectCategories;
  projects: typeof projects;
  promotions: typeof promotions;
  resourceCategories: typeof resourceCategories;
  resourceFilters: typeof resourceFilters;
  resources: typeof resources;
  roles: typeof roles;
  search: typeof search;
  seed: typeof seed;
  seedManager: typeof seedManager;
  "seeders/base": typeof seeders_base;
  "seeders/dependencies": typeof seeders_dependencies;
  "seeders/fakerVi": typeof seeders_fakerVi;
  "seeders/index": typeof seeders_index;
  "seeders/registry": typeof seeders_registry;
  serviceCategories: typeof serviceCategories;
  services: typeof services;
  settings: typeof settings;
  snapshotCategories: typeof snapshotCategories;
  storage: typeof storage;
  subscriptions: typeof subscriptions;
  systemIntegrations: typeof systemIntegrations;
  trustPages: typeof trustPages;
  usageStats: typeof usageStats;
  users: typeof users;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  convexFilesControl: import("@gilhrpenner/convex-files-control/_generated/component.js").ComponentApi<"convexFilesControl">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  pageViewsByTime: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByTime">;
  pageViewsByPath: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByPath">;
  pageViewsBySource: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsBySource">;
  pageViewsByDevice: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByDevice">;
  pageViewsByBrowser: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByBrowser">;
  pageViewsByOs: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByOs">;
  postsPublishedByTime: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"postsPublishedByTime">;
  postsPublishedByCategory: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"postsPublishedByCategory">;
  servicesPublishedByTime: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"servicesPublishedByTime">;
  servicesPublishedByCategory: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"servicesPublishedByCategory">;
};

## Implementation Plan: Complete Unified Seed Registry + Cleanup DRY

### 📊 HIỆN TRẠNG

**Seeders có sẵn (10 files):**
- customers, orders, posts, productCategories, productOptions, products, promotions, services, variants, variantPresets

**Legacy mutations trong seed.ts (18 seedXModule):**
- seedAnalyticsModule, seedCartModule, seedCommentsModule, seedCustomersModule
- seedHomepageModule, seedMediaModule, seedMenusModule, seedNotificationsModule
- seedOrdersModule, seedPostsModule, seedProductsModule, seedPromotionsModule
- seedRolesModule, seedServicesModule, seedSettingsModule, seedUsersModule
- seedWishlistModule

---

### 🎯 IMPLEMENTATION STEPS

#### **Phase 1: Tạo missing seeder classes (12 files)**

```
convex/seeders/
├── analytics.seeder.ts    (stub - analytics không cần seed data)
├── cart.seeder.ts         (migrate từ seed.ts)
├── comments.seeder.ts     (migrate từ seed.ts)
├── homepage.seeder.ts     (migrate từ seed.ts)
├── media.seeder.ts        (stub - upload manual)
├── menus.seeder.ts        (migrate từ seed.ts)
├── notifications.seeder.ts(migrate từ seed.ts)
├── roles.seeder.ts        (migrate từ seed.ts)
├── settings.seeder.ts     (migrate từ seed.ts)
├── users.seeder.ts        (migrate từ seed.ts)
├── wishlist.seeder.ts     (migrate từ seed.ts)
└── postCategories.seeder.ts (alias ProductCategorySeeder)
```

#### **Phase 2: Cập nhật registry.ts**

```ts
// convex/seeders/registry.ts - FULL LIST
export const SEEDER_REGISTRY = {
  // Content
  posts, postCategories, services, serviceCategories, comments,
  // Commerce  
  products, productCategories, orders, cart, wishlist,
  // User
  customers, users, roles,
  // System
  settings, menus, homepage,
  // Marketing
  promotions, notifications,
  // (analytics, media - stub/manual)
};
```

#### **Phase 3: Migrate 8 DataTabs còn lại**

| DataTab | From | To |
|---------|------|-----|
| PromotionsDataTab | ❌ (không có) | ✅ Thêm seed controls |
| WishlistDataTab | api.seed.* | seedManager.seedModule |
| UsersDataTab | api.seed.* | seedManager.seedModule |
| RolesDataTab | api.seed.* | seedManager.seedModule |
| MenusDataTab | api.seed.* | seedManager.seedModule |
| HomepageDataTab | api.seed.* | seedManager.seedModule |
| CommentsDataTab | api.seed.* | seedManager.seedModule |
| CartDataTab | (nếu có) | seedManager.seedModule |

#### **Phase 4: Thêm clearModule vào seedManager**

```ts
// seedManager.ts
export const clearModule = mutation({
  args: { module: v.string() },
  handler: async (ctx, args) => {
    // Delegate to seeder's clear logic
  }
});
```

#### **Phase 5: Cleanup DRY - Xóa code trùng lặp**

**Files cần refactor/xóa:**

1. **convex/seed.ts** - Giữ lại:
   - `seedModules`, `seedPresets` (system bootstrap)
   - `seedComments` (cross-module helper)
   - Xóa: 18 `seedXModule` mutations (đã có trong seeders)

2. **convex/dataManager.ts** - Giữ lại:
   - `getTableStats`, `clearTable`, `clearAllData` (data management)
   - Xóa: `SEED_MODULES`, `SEED_PRESETS` constants (đã có trong registry)
   - Xóa: `seedSystemData`, `seedRolesAndUsers`, `seedSampleContent`, `seedAll` (trùng với seedManager)

3. **Xóa các clear mutations riêng lẻ:**
   - `clearPostsData`, `clearProductsData`, etc. → Migrate vào seeder class hoặc seedManager.clearModule

---

### 📁 FILES SẼ THAY ĐỔI

**Tạo mới (12 files):**
- `convex/seeders/*.seeder.ts` (11 modules mới)

**Update (15 files):**
- `convex/seeders/registry.ts` - Thêm tất cả seeders
- `convex/seedManager.ts` - Thêm clearModule
- `components/modules/*/DataTab.tsx` (8 files) - Migrate sang seedManager

**Cleanup (2 files):**
- `convex/seed.ts` - Xóa legacy seedXModule
- `convex/dataManager.ts` - Xóa duplicate constants

---

### ⏱️ ESTIMATE

- Phase 1: Tạo seeders ~ 11 files
- Phase 2: Update registry
- Phase 3: Migrate DataTabs ~ 8 files
- Phase 4: Add clearModule
- Phase 5: Cleanup DRY ~ 2 files

Total: ~22 file changes
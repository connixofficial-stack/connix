
## Problem Graph

```
1. [/admin/roles/create] Phân quyền chưa đúng & đủ
   1.1 [Permission matrix hardcode 4 actions] <- không linh hoạt
   1.2 [Module list filter thiếu logic] <- ROOT CAUSE #1
   1.3 [Seed roles hardcode permissions cho modules tắt] <- ROOT CAUSE #2

2. [/system/data] Tồn tại hợp lý & CoC wizard
   2.1 [Trang tồn tại OK] ✓ Đã có route + sidebar
   2.2 [Wizard seed chưa cấu hình CoC cho data] <- ROOT CAUSE #3
```

---

## Vấn đề 1: `/admin/roles/create` - Phân quyền

### 1.1 Permission Actions hardcode nhưng OK
- `permissionActions = ['view', 'create', 'edit', 'delete']` - 4 actions cơ bản, phù hợp CRUD.
- `requireAdminPermission()` trong backend cũng check theo pattern `permissions[moduleKey].includes(action)` → **Nhất quán, OK.**

### 1.2 ROOT CAUSE #1: Module list filter logic **đúng nhưng thiếu**
**Hiện tại:**
```ts
permissionModules = modulesData
  .filter(m => m.enabled && !['settings', 'homepage'].includes(m.key))
  .map(m => ({ key: m.key, label: m.name }));
```

**Vấn đề phát hiện:**
- **Đúng:** Chỉ hiện modules đã `enabled` → phù hợp với modules đã bật
- **Đúng:** Exclude `settings`, `homepage` (system-only, không cần phân quyền CRUD)
- **THIẾU:** Không exclude các module hỗ trợ/phụ thuộc mà admin **không trực tiếp quản lý**: `productCategories`, `postCategories`, `serviceCategories`, `cart`, `media` (phần này tùy business logic - **có thể không phải bug** mà là design choice)
- **THIẾU:** Module `analytics` - đang hiện trong permission matrix nhưng analytics chỉ cần `view` (không cần create/edit/delete). Nên giới hạn actions cho analytics chỉ `['view']`
- **THIẾU:** Module `menus` - đang enabled mặc định, nên cần permission nhưng OK đã có

**=> Kết luận: Logic chính OK, chỉ thiếu xử lý edge case:**
1. Analytics chỉ cần action `view` (không có create/edit/delete)
2. Có thể cần exclude `cart` (không có admin CRUD page riêng cho cart)

### 1.3 ROOT CAUSE #2: Roles Seeder hardcode permissions cho modules có thể tắt

Trong `roles.seeder.ts`, seed data roles (Admin, Editor, Sales, Viewer) **hardcode permissions cho modules cụ thể** (products, orders, customers, posts, comments...) mà **không kiểm tra module nào đang enabled**.

Ví dụ: Nếu user chọn website type = "landing" (chỉ CORE_MODULES), thì role "Admin" vẫn được seed với permissions cho `products`, `orders`, `customers`, `posts`... dù các module đó đã bị tắt.

**Impact:** Không gây lỗi runtime (permission check chỉ block nếu không có permission, không crash nếu dư permission). Nhưng tạo confusion khi admin nhìn vào permissions thấy có quyền cho modules không tồn tại.

---

## Vấn đề 2: `/system/data` - Tồn tại & CoC Wizard

### 2.1 Trang tồn tại hợp lý ✓
- Route: `app/system/data/page.tsx` → render `<DataCommandCenter />`
- Sidebar: `layout.tsx` dòng 201 → có `<SidebarItem href="/system/data" ...>`
- Component đầy đủ: DataCommandCenter có QuickActions, DependencyTree, TableDetails, SeedWizard, FactoryReset
- **=> Trang tồn tại hoàn toàn hợp lý.**

### 2.2 ROOT CAUSE #3: Wizard seed đã có CoC nhưng **chưa seed roles theo modules đã chọn**

**Wizard seed đã có CoC tốt:**
- ✅ `buildModuleSelection(state)` → tính modules cần bật dựa trên websiteType + extraFeatures
- ✅ `syncModules(desiredModules)` → tự bật/tắt modules theo CoC
- ✅ `buildSeedConfigs()` → seed đúng modules đã chọn
- ✅ Settings auto-config cho products, orders, posts, comments, experience
- ✅ Experience presets theo website type

**Chưa có:**
- ❌ **Wizard KHÔNG seed roles tùy biến theo modules đã chọn.** Roles seed luôn dùng `DEFAULT_ROLES` hardcode (Super Admin, Admin, Editor, Sales, Viewer) với permissions cho products/orders/posts/comments bất kể modules nào đang enabled.
- ❌ **Wizard KHÔNG có bước chọn/cấu hình roles** - luôn seed 4 roles mặc định.

---

## Đề xuất Fix (3 tasks)

### Task 1: Roles Create/Edit - Thêm per-module action filtering
Thay vì hardcode `permissionActions = ['view', 'create', 'edit', 'delete']` cho mọi module, tạo map:
```ts
const MODULE_ACTIONS: Record<string, string[]> = {
  analytics: ['view'],
  // Các module khác vẫn full CRUD
};
```
Và exclude `cart` khỏi permission matrix (không có admin CRUD page riêng).

### Task 2: Roles Seeder - Dynamic permissions theo enabled modules
Sửa `roles.seeder.ts` để khi seed, filter permissions chỉ giữ lại modules đang enabled:
```ts
// Trong seed(), query adminModules để biết modules nào enabled
// Rồi filter DEFAULT_ROLES permissions cho chỉ enabled modules
```

### Task 3: Wizard Seed - Roles permissions align với modules đã chọn
Trong `SeedWizardDialog.handleSeed()`, sau khi `syncModules()`, truyền thêm info selected modules cho roles seeder để seed roles với permissions phù hợp.

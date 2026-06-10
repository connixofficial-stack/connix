## Problem Graph (DARE Framework)

### 1. [Main] Hệ thống Seed không đồng nhất
- **1.1 [ROOT CAUSE]** Nhiều nguồn định nghĩa modules (3+ nơi khác nhau)
- **1.2 [ROOT CAUSE]** DataTab gọi mutation riêng, không qua SeedManager
- **1.3** Thiếu single source of truth cho module registry

---

## Phân tích chi tiết

### 📊 Hiện trạng 3 UI seed:

| Component | Location | Backend |
|-----------|----------|---------|
| **CustomSeedDialog** | `/system/modules` | `seedManager.seedBulk()` ✅ |
| **BulkSeedCard** | `/system/modules` | `seedManager.seedPreset()` ✅ |
| **DataManagerPage** | `/system/data` | `dataManager.seedAll()` ❌ **RIÊNG** |
| **Module DataTab** | `/system/modules/*` | `seed.*Module()` ❌ **RIÊNG** |

### 🔴 QA Issues Found:

#### **CRITICAL: Duplicate Source of Truth**
1. **`MODULE_GROUPS` (CustomSeedDialog)** - Định nghĩa 8 modules
2. **`SEED_PRESETS` (dependencies.ts)** - Định nghĩa 17+ modules  
3. **`SEED_MODULES` (dataManager.ts)** - Định nghĩa 16 modules
4. **`SEEDERS` (seedManager.ts)** - Chỉ 9 seeders được đăng ký

#### **HIGH: Module Coverage Gaps**

| Module | CustomSeedDialog | SeedManager | DataManager | DataTab |
|--------|------------------|-------------|-------------|---------|
| posts | ✅ | ✅ | ❌ | ✅ `seed.seedPostsModule` |
| products | ✅ | ✅ | ❌ | ✅ `seed.seedProductsModule` |
| orders | ✅ | ✅ | ❌ | ✅ `seed.seedOrdersModule` |
| customers | ✅ | ✅ | ✅ | ❌ (không có DataTab riêng) |
| services | ✅ | ✅ | ❌ | ✅ `seed.seedServicesModule` |
| promotions | ✅ | ✅ | ❌ | ❌ **THIẾU seed trong DataTab** |
| menus | ❌ | ❌ | ❌ | ❌ |
| homepage | ❌ | ❌ | ❌ | ❌ |

#### **MEDIUM: Inconsistent API Calls**
- **DataTab** gọi trực tiếp `api.seed.seedXModule()` (legacy mutations trong `seed.ts`)
- **CustomSeedDialog** gọi `api.seedManager.seedBulk()` (modern seeder classes)
- **DataManagerPage** gọi `api.dataManager.seedAll()` (3rd implementation!)

#### **LOW: UI/UX Inconsistencies**
- PromotionsDataTab **THIẾU** nút Seed/Clear/Reset (chỉ hiển thị data)
- Một số DataTab có pagination, một số không

---

## Đề xuất giải pháp

### Option A: Unified Seeder Registry (Recommended)

```
convex/seeders/registry.ts  ← SINGLE SOURCE OF TRUTH
├── MODULE_REGISTRY: { key, name, category, seederClass, defaultQty, deps }
├── getSeederByKey(key) → SeederClass
├── getAllModules() → For UI
└── getSeedableModules() → Filtered by seederClass existence

components/modules/SeedDataTab.tsx  ← GENERIC COMPONENT
├── Props: { moduleKey, colorClasses }
├── Uses: seedManager.seedModule({ module: moduleKey })
└── Replaces: PostsDataTab, ProductsDataTab, etc. seed logic
```

**Benefits:**
- 1 nơi định nghĩa, N nơi sử dụng
- DataTab chỉ cần pass `moduleKey`, không cần import mutation riêng
- Tự động sync giữa CustomSeedDialog, BulkSeed, DataTab

### Option B: Deprecate Legacy + Keep DataTab Mutations

Giữ nguyên `seed.*Module()` mutations nhưng:
- Thêm export từ seeder registry để CustomSeedDialog/BulkSeed biết modules nào có seeder
- Cập nhật PromotionsDataTab thêm seed buttons

---

## QA Checklist (để verify sau khi fix)

- [ ] CustomSeedDialog modules === SeedManager.SEEDERS keys
- [ ] BulkSeedCard presets modules ⊆ SeedManager có seeder
- [ ] Mỗi DataTab có seed → đều gọi qua SeedManager hoặc consistent API
- [ ] PromotionsDataTab có Seed/Clear/Reset buttons
- [ ] dataManager.seedAll() sync với seedManager hoặc deprecated
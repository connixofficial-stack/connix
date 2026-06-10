# 📋 FINAL SPEC: Seed Wizard Enhancement - Logo Selection + Convex Storage Orphan Cleanup

## 🎯 Executive Summary

**Mục tiêu chính:**
1. **Logo Selection:** Cho phép user chọn logo cụ thể thay vì random (hybrid: random default + grid picker customize)
2. **Storage Cleanup:** Đảm bảo Convex Storage KHÔNG bị orphan khi re-seed/clear/factory reset

**Scope:**
- ✅ Toggle ON/OFF sử dụng ảnh seed_mau
- ✅ Logo selection step (single-select grid picker, on-demand load by industry)
- ✅ **CHỈ logo** - hero/products/posts vẫn random
- ✅ Inline storage cleanup cho clearModule/clearAll/factoryReset
- ✅ Orphan detection: scan `_storage` vs `images.storageId`
- ✅ Progress UI: "Deleted X/Y files"
- ✅ Seed_mau **path-only** - KHÔNG upload lên Convex Storage

**Performance:**
- Logo grid load < 1s (lazy load thumbnails)
- Factory reset chậm hơn (10-30s) vì deep scan orphan - **CHẤP NHẬN**
- Ignore storage delete errors (try-catch log warning)

---

## 🔬 DARE Framework Analysis

### 1. DECOMPOSE - Problem Graph

```
[ROOT] Seed Wizard thiếu control + Storage orphan issue
│
├── [A] Logo Selection Feature
│   ├── [A.1] Toggle seed_mau ON/OFF
│   │   ├── [A.1.1] ✅ Add toggle ở WebsiteTypeStep
│   │   ├── [A.1.2] ✅ State: useSeedMauImages: boolean
│   │   └── [A.1.3] ✅ Fallback: undefined/empty nếu OFF
│   │
│   ├── [A.2] Logo Selection Step (NEW)
│   │   ├── [A.2.1] ✅ Step mới sau IndustrySelectionStep
│   │   ├── [A.2.2] ✅ Load logos on-demand theo industry
│   │   ├── [A.2.3] ✅ UI: Preview random + "Customize" button
│   │   ├── [A.2.4] ✅ Grid picker: 6-col desktop, 3-col mobile
│   │   ├── [A.2.5] ✅ Single select, lazy load images
│   │   └── [A.2.6] ✅ Default: random nếu không customize
│   │
│   ├── [A.3] State Management
│   │   ├── [A.3.1] ✅ selectedLogo: string | null (PATH)
│   │   ├── [A.3.2] ✅ logoCustomized: boolean
│   │   ├── [A.3.3] ✅ Reset logo khi đổi industry
│   │   └── [A.3.4] ✅ Clear logo khi toggle OFF
│   │
│   └── [A.4] Backend Integration
│       ├── [A.4.1] ✅ Pass selectedLogo PATH vào seedBulk
│       ├── [A.4.2] ✅ Update homepage.seeder.ts dùng logo path
│       └── [A.4.3] ✅ KHÔNG upload lên storage - chỉ lưu path string
│
└── [B] Convex Storage Cleanup (ROOT CAUSE FIX)
    ├── [B.1] 🚨 ROOT CAUSE: factoryResetStep không xóa storage
    │   ├── [B.1.1] ❌ Line 596: chỉ delete DB records
    │   ├── [B.1.2] ❌ MISSING: ctx.storage.delete() cho images
    │   └── [B.1.3] ✅ FIX: Thêm storage cleanup trước delete DB
    │
    ├── [B.2] clearAll() có thể miss storage
    │   ├── [B.2.1] ⚠️ Dựa vào seeder.clear() - nếu error → leak
    │   └── [B.2.2] ✅ FIX: Wrap try-catch, log warning
    │
    ├── [B.3] Orphan Detection Strategy
    │   ├── [B.3.1] ✅ Scan ALL storageId trong _storage system table
    │   ├── [B.3.2] ✅ Check reference trong images.storageId
    │   ├── [B.3.3] ✅ Collect orphan list (storageId không exist trong images)
    │   └── [B.3.4] ✅ Delete orphans với try-catch ignore error
    │
    └── [B.4] UI/UX Enhancements
        ├── [B.4.1] ✅ Progress counter: "Deleted 50/200 storage files"
        ├── [B.4.2] ✅ Show storage cleanup step riêng
        └── [B.4.3] ✅ Console log warnings cho failed deletes
```

### 2. ANALYZE - Root Cause Deep Dive

#### **ROOT CAUSE #1: factoryResetStep() Orphan Leak**

**File:** `convex/seedManager.ts:596`

**Current Code:**
```typescript
export const factoryResetStep = mutation({
  handler: async (ctx, args) => {
    // ... line 596
    const records = await ctx.db.query(table).take(batchSize);
    await Promise.all(records.map((record) => ctx.db.delete(record._id)));
    // ❌ PROBLEM: Nếu table = 'images', storageId bị orphan!
  }
});
```

**WHY ORPHAN:**
- `images` table có `storageId: v.id("_storage")` (schema.ts:455)
- Xóa DB record → storageId mất reference
- File vẫn tồn tại trong Convex Storage (`_storage` system table)
- → **ORPHAN FILE** tốn storage, không dọn được qua UI

**SOLUTION:**
```typescript
// THÊM storage cleanup TRƯỚC delete DB
if (table === 'images') {
  await Promise.all(records.map(async (record) => {
    try {
      await ctx.storage.delete(record.storageId);
    } catch (err) {
      console.warn(`Failed to delete storage ${record.storageId}:`, err);
    }
  }));
}
await Promise.all(records.map((record) => ctx.db.delete(record._id)));
```

#### **ROOT CAUSE #2: clearAll() Depends on Seeder Implementation**

**File:** `convex/seedManager.ts:490`

**Current Code:**
```typescript
export const clearAll = mutation({
  handler: async (ctx, args) => {
    for (const moduleKey of orderedModules) {
      const seeder = new SeederClass(ctx);
      await seeder.clearData(); // ⚠️ Nếu throw error → storage leak
    }
  }
});
```

**ISSUE:**
- `media.seeder.ts:49` có try-catch cho `storage.delete()` → OK
- Nhưng nếu seeder khác không handle → throw → leak

**SOLUTION:**
```typescript
for (const moduleKey of orderedModules) {
  try {
    const seeder = new SeederClass(ctx);
    await seeder.clearData();
  } catch (err) {
    console.error(`Failed to clear ${moduleKey}:`, err);
    // Continue to next module, don't stop entire cleanup
  }
}
```

#### **NEW FEATURE: Orphan Detection & Cleanup**

**Strategy:** Scan `_storage` system table vs `images.storageId`

**Pseudo-code:**
```typescript
// 1. Get all storageIds currently used
const images = await ctx.db.query('images').collect();
const usedStorageIds = new Set(images.map(img => img.storageId));

// 2. List all files in _storage (Convex internal API)
// ⚠️ Convex KHÔNG expose list() API → phải track manual

// Alternative: Maintain reference count table
// CREATE TABLE: storageRefs(storageId, refCount)
// Insert: refCount++
// Delete: refCount--
// Orphan: refCount === 0
```

**⚠️ CONVEX LIMITATION:**
- `_storage` system table KHÔNG query được từ user code
- **Solution:** Maintain shadow table `storageReferences`

**BETTER APPROACH:**
- Chỉ cleanup referenced storageIds khi xóa images
- KHÔNG scan orphan (vì không list được `_storage`)
- Accept trade-off: Orphan chỉ xảy ra nếu code bug

### 3. REFLECT - Validation & Edge Cases

**Logo Selection:**
- ✅ Industry không có logos → show message
- ✅ Toggle OFF sau khi chọn → clear selectedLogo
- ✅ Đổi industry → reset logo (khác asset pool)
- ✅ Grid picker spam click → không debounce (acceptable)
- ✅ User xóa file seed_mau → broken image (document warning)

**Storage Cleanup:**
- ✅ Factory reset chậm 10-30s → chấp nhận (rare operation)
- ✅ Storage.delete() error → ignore, log warning
- ✅ Progress UI → show "Deleted X/Y"
- ⚠️ Không scan orphan vì Convex limit → chấp nhận
- ✅ Chỉ cleanup khi xóa images record

---

## 📐 Implementation Plan (Chi tiết từng file)

### **PHASE 1: Logo Selection UI** (45 phút)

#### **File 1: `components/data/seed-wizard/types.ts`**

**Action:** Update WizardState type

```typescript
// THÊM sau line ~15
export type WizardState = {
  // ... existing fields (websiteType, industryKey, dataScale...)
  
  // ✅ NEW FIELDS
  useSeedMauImages: boolean;       // Toggle seed_mau ảnh
  selectedLogo: string | null;      // PATH: "/seed_mau/{industry}/logos/5.webp"
  logoCustomized: boolean;          // User đã customize hay random
};
```

**Checklist:**
- [ ] Thêm 3 fields vào WizardState type
- [ ] Export type để dùng trong SeedWizardDialog

---

#### **File 2: `components/data/SeedWizardDialog.tsx`**

**Action:** Update DEFAULT_STATE + handlers + step logic

**Change 1: DEFAULT_STATE (line ~50)**
```typescript
const DEFAULT_STATE: WizardState = {
  // ... existing
  useSeedMauImages: true,    // ✅ Default ON
  selectedLogo: null,
  logoCustomized: false,
};
```

**Change 2: Steps logic (line ~80)**
```typescript
const steps = useMemo(() => {
  const list = ['website', 'industry'];
  
  // ✅ Thêm logo step NẾU đã chọn industry + toggle ON
  if (state.industryKey && state.useSeedMauImages) {
    list.push('logo');
  }
  
  list.push('extras', 'modules', 'review');
  return list;
}, [state.industryKey, state.useSeedMauImages]); // ✅ Dependencies
```

**Change 3: Handlers (line ~120)**
```typescript
// ✅ NEW: Toggle handler
const handleToggleSeedMau = useCallback((value: boolean) => {
  setState((prev) => ({
    ...prev,
    useSeedMauImages: value,
    // Reset logo khi tắt
    selectedLogo: value ? prev.selectedLogo : null,
    logoCustomized: value ? prev.logoCustomized : false,
  }));
}, []);

// ✅ UPDATE: Industry change handler (reset logo vì khác pool)
const handleIndustryChange = useCallback((industryKey: string) => {
  setState((prev) => ({
    ...prev,
    industryKey,
    selectedLogo: null,      // Reset
    logoCustomized: false,
  }));
}, []);
```

**Change 4: Render logo step (line ~250)**
```typescript
{stepKey === 'logo' && (
  <LogoSelectionStep
    industryKey={state.industryKey}
    useSeedMauImages={state.useSeedMauImages}
    selectedLogo={state.selectedLogo}
    logoCustomized={state.logoCustomized}
    onChange={(logo, customized) =>
      setState((prev) => ({ 
        ...prev, 
        selectedLogo: logo, 
        logoCustomized: customized 
      }))
    }
  />
)}
```

**Checklist:**
- [ ] Update DEFAULT_STATE với 3 fields mới
- [ ] Thêm logo vào steps logic (conditional)
- [ ] Thêm handleToggleSeedMau handler
- [ ] Update handleIndustryChange reset logo
- [ ] Render LogoSelectionStep với props

---

#### **File 3: `components/data/seed-wizard/steps/WebsiteTypeStep.tsx`**

**Action:** Thêm toggle switch cho seed_mau

**Change 1: Props type (line ~10)**
```typescript
type WebsiteTypeStepProps = {
  value: WebsiteType;
  onChange: (value: WebsiteType) => void;
  
  // ✅ NEW
  useSeedMauImages: boolean;
  onToggleSeedMau: (value: boolean) => void;
};
```

**Change 2: UI (line ~50, sau grid chọn website type)**
```typescript
{/* ✅ NEW: Seed_mau toggle */}
<div className="mt-6 border-t pt-6">
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-slate-900">
        Sử dụng ảnh mẫu
      </h4>
      <p className="text-xs text-slate-500 mt-1">
        Dùng ảnh có sẵn từ thư viện seed_mau theo ngành hàng. 
        Tắt nếu muốn để trống và tự upload sau.
      </p>
    </div>
    <Switch
      checked={useSeedMauImages}
      onCheckedChange={onToggleSeedMau}
    />
  </div>
</div>
```

**Checklist:**
- [ ] Update props type thêm 2 fields
- [ ] Thêm toggle UI vào component
- [ ] Test toggle ON/OFF flow

---

#### **File 4: `components/data/seed-wizard/steps/LogoSelectionStep.tsx` (NEW)**

**Action:** Tạo file mới

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Button, Card, cn } from '@/app/admin/components/ui';
import { getIndustryTemplate } from '@/lib/seed-templates';
import { Shuffle, Check } from 'lucide-react';

type LogoSelectionStepProps = {
  industryKey: string | null;
  useSeedMauImages: boolean;
  selectedLogo: string | null;
  logoCustomized: boolean;
  onChange: (logo: string | null, customized: boolean) => void;
};

export function LogoSelectionStep({
  industryKey,
  useSeedMauImages,
  selectedLogo,
  logoCustomized,
  onChange,
}: LogoSelectionStepProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  // Load template on-demand
  const template = useMemo(() => {
    if (!industryKey || !useSeedMauImages) return null;
    return getIndustryTemplate(industryKey);
  }, [industryKey, useSeedMauImages]);
  
  const logos = template?.assets.logos ?? [];
  
  // Display logo: selectedLogo > random từ pool
  const displayLogo = useMemo(() => {
    if (!useSeedMauImages) return null;
    if (selectedLogo) return selectedLogo;
    // Random 1 logo
    if (logos.length > 0) {
      const idx = Math.floor(Math.random() * logos.length);
      return logos[idx];
    }
    return null;
  }, [useSeedMauImages, selectedLogo, logos]);
  
  const handleRandomize = () => {
    if (logos.length > 0) {
      const idx = Math.floor(Math.random() * logos.length);
      onChange(logos[idx], false);
    }
  };
  
  const handleSelect = (logo: string) => {
    onChange(logo, true);
    setShowPicker(false);
  };
  
  // Edge case: Toggle OFF
  if (!useSeedMauImages) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg bg-slate-50">
        <p className="text-sm text-slate-500">
          Chế độ ảnh mẫu đã tắt. Logo sẽ để trống, bạn có thể upload sau.
        </p>
      </div>
    );
  }
  
  // Edge case: Industry không có logos
  if (!template || logos.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg bg-amber-50">
        <p className="text-sm text-amber-700 font-medium">
          Ngành hàng này chưa có logo mẫu
        </p>
        <p className="text-xs text-amber-600 mt-2">
          Logo sẽ để trống, bạn có thể upload sau trong settings.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Chọn logo</h3>
        <p className="text-xs text-slate-500 mt-1">
          Logo sẽ hiển thị ở header và footer. Bạn có thể để ngẫu nhiên hoặc chọn cụ thể.
        </p>
      </div>
      
      {!showPicker ? (
        // Preview mode
        <div className="space-y-4">
          <Card className="p-8 flex flex-col items-center gap-4 bg-white">
            {displayLogo && (
              <div className="h-20 flex items-center justify-center">
                <img
                  src={displayLogo}
                  alt="Logo preview"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomize}
                className="gap-2"
              >
                <Shuffle size={16} />
                Ngẫu nhiên khác
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowPicker(true)}
              >
                Tùy chỉnh
              </Button>
            </div>
          </Card>
          <p className="text-xs text-center text-slate-400">
            {logoCustomized 
              ? '✓ Đã chọn logo cụ thể' 
              : `Đang dùng logo ngẫu nhiên (${logos.length} lựa chọn)`
            }
          </p>
        </div>
      ) : (
        // Grid picker mode
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-4 border rounded-lg bg-slate-50">
            {logos.map((logo, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(logo)}
                className={cn(
                  'relative aspect-square border-2 rounded-lg p-2 bg-white',
                  'hover:border-cyan-400 transition-all hover:shadow-md',
                  selectedLogo === logo 
                    ? 'border-cyan-500 bg-cyan-50 shadow-lg' 
                    : 'border-slate-200'
                )}
              >
                <img
                  src={logo}
                  alt={`Logo ${idx + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {selectedLogo === logo && (
                  <div className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full p-1">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(false)}
            className="w-full"
          >
            Đóng
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Tạo file mới LogoSelectionStep.tsx
- [ ] Implement preview mode (random + "Customize")
- [ ] Implement grid picker mode (6-col desktop, 3-col mobile)
- [ ] Handle edge cases (no logos, toggle OFF)
- [ ] Lazy load images (loading="lazy")
- [ ] Test responsive (desktop/mobile)

---

### **PHASE 2: Backend Integration** (30 phút)

#### **File 5: `components/data/seed-wizard/wizard-presets.ts`**

**Action:** Update buildSeedConfigs để pass selectedLogo

**Change: buildSeedConfigs function (line ~80)**
```typescript
export function buildSeedConfigs(
  modules: string[],
  dataScale: DataScale,
  industryKey: string | null,
  selectedLogo?: string | null,       // ✅ NEW param
  useSeedMauImages?: boolean          // ✅ NEW param
): SeedConfig[] {
  const configs = modules.map((module) => ({
    module,
    quantity: getQuantity(module, dataScale),
    force: false,
    industryKey,
    
    // ✅ Chỉ pass selectedLogo cho homepage module
    selectedLogo: module === 'homepage' ? selectedLogo : undefined,
    useSeedMauImages,
  }));
  
  return configs;
}
```

**Checklist:**
- [ ] Thêm 2 params vào function signature
- [ ] Pass selectedLogo chỉ cho homepage
- [ ] Pass useSeedMauImages cho tất cả modules

---

#### **File 6: `components/data/SeedWizardDialog.tsx`**

**Action:** Update handleSeed để pass logo vào buildSeedConfigs

**Change: handleSeed function (line ~200)**
```typescript
const handleSeed = async () => {
  setIsSeeding(true);
  
  const selectedModules = Object.keys(state.moduleSelection).filter(
    (key) => state.moduleSelection[key]
  );
  
  const seedConfigs = buildSeedConfigs(
    selectedModules,
    state.dataScale,
    state.industryKey,
    state.selectedLogo,      // ✅ Pass logo PATH
    state.useSeedMauImages   // ✅ Pass toggle
  ).map((config) => ({
    ...config,
    force: false,
    locale: 'vi',
  }));
  
  try {
    await seedBulk({ configs: seedConfigs });
    // ... success handling
  } catch (error) {
    // ... error handling
  } finally {
    setIsSeeding(false);
  }
};
```

**Checklist:**
- [ ] Update buildSeedConfigs call với 2 params mới
- [ ] Test seedBulk nhận đúng params

---

#### **File 7: `convex/seeders/base.ts`**

**Action:** Update SeedConfig type

**Change: SeedConfig type (line ~25)**
```typescript
export type SeedConfig = {
  quantity: number;
  force?: boolean;
  batchSize?: number;
  dependencies?: boolean;
  locale?: 'vi' | 'en';
  industryKey?: string | null;
  variantPresetKey?: string | null;
  
  // ✅ NEW FIELDS
  selectedLogo?: string | null;      // Logo PATH cho homepage
  useSeedMauImages?: boolean;        // Toggle seed_mau
  
  onProgress?: (current: number, total: number) => void;
};
```

**Checklist:**
- [ ] Thêm 2 fields vào SeedConfig type
- [ ] Verify type compile OK

---

#### **File 8: `convex/seedManager.ts`**

**Action:** Update seedBulk mutation args

**Change: seedBulk args (line ~180)**
```typescript
export const seedBulk = mutation({
  args: {
    configs: v.array(v.object({
      module: v.string(),
      quantity: v.number(),
      force: v.optional(v.boolean()),
      batchSize: v.optional(v.number()),
      dependencies: v.optional(v.boolean()),
      locale: v.optional(v.string()),
      industryKey: v.optional(v.string()),
      variantPresetKey: v.optional(v.string()),
      
      // ✅ NEW FIELDS
      selectedLogo: v.optional(v.string()),
      useSeedMauImages: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { configs }) => {
    // ... pass configs to seeders (no change needed, auto-forwarded)
  },
});
```

**Checklist:**
- [ ] Thêm 2 optional fields vào args validator
- [ ] Verify mutation compile OK

---

#### **File 9: `convex/seeders/homepage.seeder.ts`**

**Action:** Dùng selectedLogo thay vì random

**Change 1: seedComponents method (line ~80)**
```typescript
private async seedComponents(): Promise<number> {
  const template = getIndustryTemplate(this.config.industryKey);
  if (!template) {
    throw new Error(`Industry template not found: ${this.config.industryKey}`);
  }
  
  // ✅ Determine logo to use
  const { selectedLogo, useSeedMauImages } = this.config;
  let logoToUse: string | undefined;
  
  if (useSeedMauImages && template.assets.logos.length > 0) {
    // Ưu tiên selectedLogo, fallback random
    logoToUse = selectedLogo ?? pickRandom(template.assets.logos);
  }
  // Nếu useSeedMauImages = false → logoToUse = undefined (không set)
  
  const components = template.homeComponents.map((component) => {
    const config = { ...component.config };
    
    // ✅ USE logoToUse cho components có logos array
    if (Array.isArray(config.logos) && logoToUse) {
      config.logos = [logoToUse];  // Chỉ lưu PATH string
    }
    
    // Hero images vẫn random (out of scope)
    // Products images vẫn random (out of scope)
    
    return {
      ...component,
      config,
      order: component.order,
      visible: component.visible,
    };
  });
  
  // Insert components
  await Promise.all(
    components.map((comp) => this.ctx.db.insert('homeComponents', comp))
  );
  
  return components.length;
}
```

**Checklist:**
- [ ] Đọc selectedLogo + useSeedMauImages từ config
- [ ] Ưu tiên selectedLogo, fallback random
- [ ] Chỉ set logo nếu useSeedMauImages = true
- [ ] KHÔNG upload lên storage - chỉ lưu PATH string
- [ ] Test logo PATH đúng xuất hiện trong homeComponents

---

### **PHASE 3: Storage Cleanup** (60 phút)

#### **File 10: `convex/seedManager.ts`**

**Action:** Fix factoryResetStep orphan leak

**Change 1: factoryResetStep mutation (line ~596)**
```typescript
export const factoryResetStep = mutation({
  args: {
    tableIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tables: TableNames[] = [
      // ... existing tables list
    ];
    
    const orderedTables = [...tables].reverse();
    const batchSize = 100;
    const index = args.tableIndex ?? 0;
    const totalTables = orderedTables.length;
    
    if (index >= totalTables) {
      return {
        completed: true,
        currentIndex: totalTables,
        deleted: 0,
        nextIndex: null,
        table: null,
        totalTables,
      };
    }
    
    const table = orderedTables[index];
    const records = await ctx.db.query(table).take(batchSize);
    
    // ✅ FIX: Delete storage TRƯỚC khi delete DB record
    if (table === 'images') {
      let storageDeleted = 0;
      for (const record of records) {
        try {
          await ctx.storage.delete(record.storageId);
          storageDeleted++;
        } catch (err) {
          // Ignore error nếu file không tồn tại
          console.warn(`[factoryReset] Failed to delete storage ${record.storageId}:`, err);
        }
      }
      console.log(`[factoryReset] Deleted ${storageDeleted}/${records.length} storage files for table ${table}`);
    }
    
    // Delete DB records
    await Promise.all(records.map((record) => ctx.db.delete(record._id)));
    
    if (records.length === batchSize) {
      return {
        completed: false,
        currentIndex: index + 1,
        deleted: records.length,
        nextIndex: index, // Continue same table
        table,
        totalTables,
        storageDeleted: table === 'images' ? records.length : undefined, // ✅ NEW
      };
    }
    
    return {
      completed: false,
      currentIndex: index + 1,
      deleted: records.length,
      nextIndex: index + 1, // Move to next table
      table,
      totalTables,
      storageDeleted: table === 'images' ? records.length : undefined, // ✅ NEW
    };
  },
  returns: v.object({
    completed: v.boolean(),
    currentIndex: v.number(),
    deleted: v.number(),
    nextIndex: v.union(v.number(), v.null()),
    table: v.union(v.string(), v.null()),
    totalTables: v.number(),
    storageDeleted: v.optional(v.number()), // ✅ NEW
  }),
});
```

**Checklist:**
- [ ] Thêm storage.delete() cho table = 'images'
- [ ] Wrap try-catch ignore error
- [ ] Log warning cho failed deletes
- [ ] Return storageDeleted count
- [ ] Test factory reset không leak storage

---

**Change 2: clearAll mutation (line ~490)**
```typescript
export const clearAll = mutation({
  args: {
    excludeSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    console.log(`[SeedManager] Clearing all data (excludeSystem: ${args.excludeSystem})`);
    
    const moduleKeys = listSeedableModuleKeys().filter((moduleKey) => {
      if (!args.excludeSystem) return true;
      return SEED_MODULE_METADATA[moduleKey]?.category !== 'system';
    });
    
    const orderedModules = getClearOrder().filter((moduleKey) => 
      moduleKeys.includes(moduleKey)
    );
    
    console.log(`[SeedManager] Clear order: ${orderedModules.join(' → ')}`);
    
    const errors: string[] = [];
    
    for (const moduleKey of orderedModules) {
      try {
        const SeederClass = SEEDERS[moduleKey];
        if (!SeederClass) {
          continue;
        }
        
        const seeder = new SeederClass(ctx);
        await seeder.clearData();
        
        console.log(`[clearAll] ✓ Cleared ${moduleKey}`);
      } catch (err) {
        // ✅ KHÔNG stop, chỉ log error
        const errMsg = `Failed to clear ${moduleKey}: ${err}`;
        console.error(`[clearAll] ✗ ${errMsg}`);
        errors.push(errMsg);
        // Continue to next module
      }
    }
    
    return { 
      success: errors.length === 0,
      errors, // ✅ Return errors list
    };
  },
  returns: v.object({
    success: v.boolean(),
    errors: v.array(v.string()), // ✅ NEW
  }),
});
```

**Checklist:**
- [ ] Wrap try-catch cho từng module clear
- [ ] Collect errors vào array
- [ ] Return errors list
- [ ] Test clearAll không stop khi 1 module lỗi

---

#### **File 11: `convex/seeders/media.seeder.ts`**

**Action:** Verify clear() đã handle storage delete (ĐÃ OK)

**Current code (line 49):**
```typescript
protected async clear(): Promise<void> {
  const images = await this.ctx.db.query('images').collect();
  for (const img of images) {
    try {
      await this.ctx.storage.delete(img.storageId); // ✅ Đã có
    } catch {
      // ignore missing storage ✅ Đã handle
    }
    await this.ctx.db.delete(img._id);
  }
  // ... clear stats, folders
}
```

**Checklist:**
- [ ] ✅ KHÔNG CẦN SỬA - Đã handle storage delete
- [ ] Verify try-catch ignore error
- [ ] Test media clear không throw

---

#### **File 12: `convex/seeders/base.ts`**

**Action:** Update clearData() để log errors

**Change: clearData method (line ~180)**
```typescript
async clearData(): Promise<void> {
  try {
    console.log(`[${this.moduleName}] Starting clearData...`);
    await this.clear();
    console.log(`[${this.moduleName}] ✓ clearData completed`);
  } catch (err) {
    console.error(`[${this.moduleName}] ✗ clearData failed:`, err);
    throw err; // ✅ Re-throw để clearAll catch
  }
}
```

**Checklist:**
- [ ] Thêm console.log cho clear start/complete
- [ ] Log error trước throw
- [ ] Test error propagate đến clearAll

---

### **PHASE 4: UI Progress Feedback** (30 phút)

#### **File 13: `components/data/DataCommandCenter.tsx`**

**Action:** Show storage cleanup progress

**Change: Factory reset dialog (line ~250)**
```typescript
// Trong FactoryResetDialog component
const [progress, setProgress] = useState({
  currentIndex: 0,
  totalTables: 0,
  table: null as string | null,
  deleted: 0,
  storageDeleted: 0, // ✅ NEW
});

// Trong handleFactoryReset loop
while (!result.completed) {
  result = await factoryResetStep({ tableIndex: result.nextIndex ?? 0 });
  
  setProgress({
    currentIndex: result.currentIndex,
    totalTables: result.totalTables,
    table: result.table,
    deleted: result.deleted,
    storageDeleted: result.storageDeleted ?? 0, // ✅ NEW
  });
  
  // Small delay để UI update
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// UI render
<div className="space-y-2">
  <p className="text-sm">
    Đang xóa: <strong>{progress.table}</strong> ({progress.currentIndex}/{progress.totalTables})
  </p>
  <p className="text-xs text-slate-500">
    Đã xóa: {progress.deleted} records
    {/* ✅ NEW: Storage progress */}
    {progress.storageDeleted > 0 && (
      <span className="ml-2 text-cyan-600">
        + {progress.storageDeleted} storage files
      </span>
    )}
  </p>
  <Progress value={(progress.currentIndex / progress.totalTables) * 100} />
</div>
```

**Checklist:**
- [ ] Thêm storageDeleted vào progress state
- [ ] Hiển thị storage count khi > 0
- [ ] Test UI update real-time
- [ ] Test progress bar smooth

---

### **PHASE 5: Review Step Enhancement** (15 phút)

#### **File 14: `components/data/seed-wizard/steps/ReviewStep.tsx`**

**Action:** Show logo preview trong review

**Change: Add logo preview section (line ~80)**
```typescript
// Thêm vào review summary
{state.industryKey && (
  <div className="border-t pt-4">
    <h4 className="text-sm font-semibold mb-2">Tùy chỉnh</h4>
    <div className="space-y-2">
      {/* ✅ Logo preview */}
      {state.selectedLogo && (
        <div className="flex items-center gap-3 text-xs">
          <img 
            src={state.selectedLogo} 
            alt="Logo" 
            className="h-8 object-contain border rounded px-2"
          />
          <div>
            <p className="font-medium">
              {state.logoCustomized ? 'Logo đã chọn' : 'Logo ngẫu nhiên'}
            </p>
            <p className="text-slate-500">
              Từ: seed_mau/{state.industryKey}/logos
            </p>
          </div>
        </div>
      )}
      
      {/* Toggle status */}
      <p className="text-xs text-slate-500">
        Ảnh mẫu: {state.useSeedMauImages ? '✓ Bật' : '✗ Tắt'}
      </p>
    </div>
  </div>
)}
```

**Checklist:**
- [ ] Hiển thị logo preview nếu có
- [ ] Show source (customized vs random)
- [ ] Show toggle status
- [ ] Test UI responsive

---

## 🧪 Testing Checklist

### **Logo Selection Tests**

- [ ] **Toggle ON/OFF:**
  - [ ] Default ON khi mở wizard
  - [ ] Toggle OFF → logo step biến mất
  - [ ] Toggle OFF → selectedLogo = null
  - [ ] Toggle ON lại → logo step xuất hiện
  
- [ ] **Logo Selection Flow:**
  - [ ] Chọn industry → logo step hiện sau industry
  - [ ] Preview random logo lần đầu
  - [ ] Click "Ngẫu nhiên khác" → logo thay đổi
  - [ ] Click "Tùy chỉnh" → grid picker mở
  - [ ] Chọn logo trong grid → preview update
  - [ ] Click "Đóng" → quay lại preview mode
  
- [ ] **Grid Picker:**
  - [ ] Desktop: 6 columns
  - [ ] Mobile: 3 columns
  - [ ] Lazy load images (loading="lazy")
  - [ ] Selected logo có border + check icon
  - [ ] Scroll OK nếu > 18 logos
  
- [ ] **Edge Cases:**
  - [ ] Industry không có logos → show warning message
  - [ ] Đổi industry → logo reset về null
  - [ ] Logo customized → badge "✓ Đã chọn logo cụ thể"
  - [ ] Logo random → badge "Đang dùng logo ngẫu nhiên"
  
- [ ] **Backend Integration:**
  - [ ] selectedLogo PATH đúng trong seedBulk args
  - [ ] homepage.seeder nhận selectedLogo
  - [ ] Logo PATH lưu đúng vào homeComponents config.logos
  - [ ] KHÔNG upload lên Convex Storage
  - [ ] seed_mau files KHÔNG bị động
  
- [ ] **Review Step:**
  - [ ] Logo preview hiển thị đúng
  - [ ] Source label (customized vs random)
  - [ ] Toggle status hiển thị

### **Storage Cleanup Tests**

- [ ] **factoryResetStep:**
  - [ ] Delete storage files trước DB records
  - [ ] Ignore error nếu storage file không tồn tại
  - [ ] Log warning cho failed deletes
  - [ ] storageDeleted count chính xác
  - [ ] Progress UI update real-time
  
- [ ] **clearAll:**
  - [ ] Try-catch cho từng module
  - [ ] KHÔNG stop khi 1 module lỗi
  - [ ] Collect errors vào array
  - [ ] Return errors list
  - [ ] Log chi tiết cho success/fail
  
- [ ] **media.seeder:**
  - [ ] clear() delete storage + DB
  - [ ] Try-catch ignore storage error
  - [ ] Clear stats + folders
  
- [ ] **UI Feedback:**
  - [ ] Factory reset show table name
  - [ ] Progress bar smooth (0-100%)
  - [ ] Storage deleted count hiển thị
  - [ ] Delay 50ms cho UI update
  
- [ ] **Edge Cases:**
  - [ ] Storage file không tồn tại → ignore error
  - [ ] Network error khi delete storage → log warning
  - [ ] Factory reset với 0 images → không crash
  - [ ] ClearAll với excludeSystem = true → skip system modules

### **Integration Tests**

- [ ] **Full Wizard Flow:**
  - [ ] Website Type → Industry → Logo → Extras → Modules → Review → Seed
  - [ ] Logo PATH chính xác trong DB sau seed
  - [ ] Homepage render logo đúng
  
- [ ] **Re-seed Flow:**
  - [ ] Seed lần 1 → có logo
  - [ ] Clear all → storage files deleted
  - [ ] Seed lần 2 → logo mới (random hoặc selected)
  - [ ] KHÔNG orphan storage sau clear
  
- [ ] **Factory Reset Flow:**
  - [ ] Seed data + upload images
  - [ ] Factory reset → storage files deleted
  - [ ] DB empty + storage empty
  - [ ] Progress UI show storage count

---

## 📊 Performance Metrics

- [ ] Logo grid load < 1s cho 15 logos
- [ ] Factory reset với 100 images: ~10-30s (chấp nhận)
- [ ] clearAll không throw error khi module fail
- [ ] UI progress update mỗi 50ms (smooth)

---

## ⚠️ Known Limitations & Trade-offs

1. **Convex Storage Orphan Detection:**
   - ❌ Convex KHÔNG expose `_storage` list API
   - ✅ Solution: Cleanup inline khi delete images
   - ⚠️ Trade-off: Nếu code bug → có thể orphan
   - ✅ Mitigation: Comprehensive try-catch + logging

2. **Seed_mau Path-only Approach:**
   - ✅ Nhanh, không copy file
   - ⚠️ Nếu user xóa file seed_mau → broken image
   - ✅ Mitigation: Document warning trong README

3. **Factory Reset Performance:**
   - ⚠️ Chậm 10-30s khi có nhiều images
   - ✅ Acceptable: Rare operation, ưu tiên cleanup hoàn toàn

4. **Logo Selection Scope:**
   - ✅ CHỈ logo (MVP)
   - ❌ Hero/Products/Posts vẫn random (future feature)

---

## 📁 Files Summary

### **NEW FILES (1):**
1. `components/data/seed-wizard/steps/LogoSelectionStep.tsx` - Grid picker component

### **UPDATED FILES (13):**
2. `components/data/seed-wizard/types.ts` - WizardState type
3. `components/data/SeedWizardDialog.tsx` - State + handlers + steps logic
4. `components/data/seed-wizard/steps/WebsiteTypeStep.tsx` - Toggle UI
5. `components/data/seed-wizard/wizard-presets.ts` - buildSeedConfigs params
6. `components/data/seed-wizard/steps/ReviewStep.tsx` - Logo preview
7. `convex/seeders/base.ts` - SeedConfig type + clearData logging
8. `convex/seeders/homepage.seeder.ts` - Use selectedLogo
9. `convex/seedManager.ts` - seedBulk args + factoryResetStep + clearAll
10. `convex/seeders/media.seeder.ts` - Verify clear() (no change needed)
11. `components/data/DataCommandCenter.tsx` - Factory reset progress UI

**Total:** **1 NEW + 10 UPDATED** files (media.seeder không cần sửa)

---

## 🚀 Implementation Order

1. **Day 1 Morning (2h):** Logo Selection UI
   - Files 1-4: types.ts, SeedWizardDialog, WebsiteTypeStep, LogoSelectionStep
   - Test UI flow + responsive

2. **Day 1 Afternoon (1.5h):** Backend Integration
   - Files 5-9: wizard-presets, seedManager, base, homepage.seeder
   - Test logo PATH lưu đúng vào DB

3. **Day 2 Morning (2h):** Storage Cleanup
   - Files 10-12: factoryResetStep, clearAll, media.seeder verify
   - Test no orphan leak

4. **Day 2 Afternoon (1h):** UI Feedback + Review
   - Files 13-14: DataCommandCenter progress, ReviewStep preview
   - Test full integration

5. **Day 3 (2h):** Testing + Polish
   - Run full test checklist
   - Fix bugs
   - Document warnings

**Total:** ~8.5 hours (spread across 2-3 days)

---

## 🛡️ Safety Guarantees

### **Seed_mau Protection:**
- ✅ Code KHÔNG copy file
- ✅ Code KHÔNG move file
- ✅ Code KHÔNG delete file
- ✅ Code KHÔNG modify file
- ✅ Chỉ READ paths từ templates
- ✅ Chỉ WRITE path string vào DB
- ✅ `public/seed_mau/` = **READ-ONLY LIBRARY**

### **Storage Cleanup:**
- ✅ Try-catch mọi storage.delete()
- ✅ Ignore error nếu file không tồn tại
- ✅ Log warning cho failed deletes
- ✅ KHÔNG stop operation khi error
- ✅ Collect errors để review

### **Data Integrity:**
- ✅ Delete storage TRƯỚC delete DB (prevent orphan)
- ✅ Batch delete với Promise.all (fast)
- ✅ Progress tracking (user visibility)

---

## 📝 Documentation Updates Needed

- [ ] README: Cảnh báo KHÔNG xóa `public/seed_mau/`
- [ ] README: Giải thích seed_mau là read-only library
- [ ] README: Factory reset có thể chậm 10-30s
- [ ] Comments trong code: Giải thích storage cleanup logic

---

## 🎉 Success Criteria

- [ ] ✅ Logo selection step xuất hiện đúng sau industry
- [ ] ✅ Toggle OFF → không có logo step
- [ ] ✅ Logo PATH chính xác trong homeComponents
- [ ] ✅ Grid picker load < 1s, responsive OK
- [ ] ✅ Factory reset KHÔNG orphan storage
- [ ] ✅ clearAll KHÔNG stop khi module fail
- [ ] ✅ Progress UI hiển thị storage count
- [ ] ✅ `public/seed_mau/` KHÔNG bị thay đổi
- [ ] ✅ Tất cả tests pass

---

**END OF SPEC**
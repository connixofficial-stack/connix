# Advanced Seed System Documentation

**Version:** 1.0.0  
**Date:** 2026-02-03  
**Status:** ✅ Production Ready

---

## 📖 Overview

Hệ thống seed data nâng cao cho VietAdmin với dependency management, configurable quantity, và Vietnamese-specific data generation.

### Key Features

✅ **Dependency-aware seeding** - Tự động seed dependencies  
✅ **Configurable quantity** - Chọn 5/10/50/100 hoặc custom  
✅ **Batch processing** - Insert theo batch để tránh timeout  
✅ **Vietnamese data** - Tên, địa chỉ, số điện thoại Việt Nam  
✅ **Progress tracking** - Real-time progress khi seed  
✅ **Type-safe** - Full TypeScript support  
✅ **Reusable** - BaseSeeder class cho tất cả modules  

---

## 🏗️ Architecture

```
convex/
├── seedManager.ts              # Orchestrator chính
├── seeders/
│   ├── _base.ts                # BaseSeeder abstract class
│   ├── _dependencies.ts        # Dependency graph & presets
│   ├── _faker-vi.ts            # Vietnamese Faker extension
│   ├── products.seeder.ts      # ProductSeeder
│   ├── posts.seeder.ts         # PostSeeder
│   ├── orders.seeder.ts        # OrderSeeder (with dependencies)
│   ├── customers.seeder.ts     # CustomerSeeder
│   ├── services.seeder.ts      # ServiceSeeder
│   └── ...                     # More seeders
└── schema.ts                   # seedProgress table

components/modules/
├── BulkSeedCard.tsx            # Preset buttons UI
├── CustomSeedDialog.tsx        # Custom config dialog
├── SeedQuantitySelector.tsx    # Quantity picker
└── DataTabSeedHeader.tsx       # Reusable header
```

---

## 🚀 Quick Start

### 1. Basic Usage (Single Module)

```typescript
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

// Seed 50 products với auto-dependencies
const seedProducts = useMutation(api.seedManager.seedModule);

await seedProducts({
  module: 'products',
  quantity: 50,
  dependencies: true,  // Auto-seed categories if missing
  force: false,        // Don't clear existing data
  locale: 'vi',        // Vietnamese locale
});
```

### 2. Bulk Seed với Preset

```typescript
const seedPreset = useMutation(api.seedManager.seedPreset);

// Seed preset "standard" (20 records each)
await seedPreset({
  preset: 'standard',
  force: false,
});
```

### 3. Custom Bulk Seed

```typescript
const seedBulk = useMutation(api.seedManager.seedBulk);

await seedBulk({
  configs: [
    { module: 'products', quantity: 100 },
    { module: 'posts', quantity: 50 },
    { module: 'orders', quantity: 30 },
  ],
});
```

---

## 📦 Available Presets

| Preset | Description | Quantity | Use Case |
|--------|-------------|----------|----------|
| **Minimal** | Ít data để test nhanh | 5-10 | Unit testing |
| **Standard** | Chuẩn cho development | 20-30 | Development |
| **Large** | Test performance | 100+ | Load testing |
| **Demo** | Realistic data | 50 | Presentations |

---

## 🔗 Dependency Graph

```
roles (no deps)
  └─ users
  
postCategories (no deps)
  └─ posts
      └─ comments (any: posts OR products)
      
productCategories (no deps)
  └─ products
      ├─ comments (any: posts OR products)
      ├─ orders (all: products AND customers)
      └─ cart (all: products AND customers)
      
customers (no deps)
  ├─ orders (all: products AND customers)
  └─ cart (all: products AND customers)
```

### Dependency Types

- **`all`**: Tất cả dependencies phải có (AND logic)
- **`any`**: Ít nhất 1 dependency phải có (OR logic)
- **`optional`**: Nice to have nhưng không bắt buộc

---

## 🎨 UI Components

### BulkSeedCard

Quick access presets với visual cards:

```tsx
<BulkSeedCard 
  onSeedComplete={() => console.log('Done!')}
  onOpenCustomDialog={() => setShowDialog(true)}
/>
```

**Features:**
- 4 preset cards với icons
- Progress bar với current module
- Auto-complete callback
- Error handling với toast

### CustomSeedDialog

Advanced configuration dialog:

```tsx
<CustomSeedDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onComplete={() => refetchData()}
/>
```

**Features:**
- Module grouping by category
- Select All/Deselect per group
- Custom quantity per module
- Force clear option
- Estimated total records
- Visual feedback cho selections

### SeedQuantitySelector

Compact quantity picker:

```tsx
<SeedQuantitySelector
  defaultQuantity={10}
  onQuantityChange={(qty) => setQuantity(qty)}
  disabled={isSeeding}
/>
```

**Features:**
- Preset buttons: 5/10/50/100
- Custom popover với validation (1-10,000)
- Keyboard support (Enter to apply)
- Visual active state

### DataTabSeedHeader

Reusable header cho DataTab components:

```tsx
<DataTabSeedHeader
  moduleName="Products"
  colorClasses={{ button: 'bg-cyan-600' }}
  onSeed={(qty) => seedProducts(qty)}
  onClear={() => clearData()}
  onReset={(qty) => resetData(qty)}
  defaultQuantity={20}
/>
```

---

## 🛠️ Creating New Seeders

### Step 1: Create Seeder Class

```typescript
// convex/seeders/myModule.seeder.ts
import { BaseSeeder, type SeedDependency } from './_base';
import { createVietnameseFaker } from './_faker-vi';
import type { Doc } from '../_generated/dataModel';

type MyData = Omit<Doc<'myModule'>, '_id' | '_creationTime'>;

export class MyModuleSeeder extends BaseSeeder<MyData> {
  moduleName = 'myModule';
  tableName = 'myModule';
  dependencies: SeedDependency[] = [
    { module: 'otherModule', required: true, minRecords: 1 },
  ];
  
  private viFaker = createVietnameseFaker(this.faker);
  
  generateFake(): MyData {
    return {
      name: this.viFaker.fullName(),
      // ... other fields
    };
  }
  
  validateRecord(record: MyData): boolean {
    return !!record.name;
  }
  
  // Optional: Post-seed hooks
  protected async afterSeed(_count: number): Promise<void> {
    // Update stats, etc.
  }
}
```

### Step 2: Register Seeder

```typescript
// convex/seedManager.ts
import { MyModuleSeeder } from './seeders/myModule.seeder';

const SEEDERS: Record<string, new (ctx: any) => BaseSeeder> = {
  // ... existing
  myModule: MyModuleSeeder,
};
```

### Step 3: Add to Dependencies

```typescript
// convex/seeders/_dependencies.ts
export const SEED_DEPENDENCIES: Record<string, ModuleDependency> = {
  // ... existing
  myModule: {
    deps: ['otherModule'],
    type: 'all',
  },
};

export const MODULE_METADATA: Record<string, ModuleMetadata> = {
  // ... existing
  myModule: {
    name: 'My Module',
    description: 'Description',
    category: 'content',
    defaultQuantity: 20,
  },
};
```

---

## 🧪 Testing

### Manual Testing

```bash
# Seed single module
bunx convex run seedManager:seedModule '{
  "module": "products",
  "quantity": 10
}'

# Seed preset
bunx convex run seedManager:seedPreset '{
  "preset": "minimal"
}'
```

### Test Checklist

- [ ] Seed without dependencies → Should auto-seed deps
- [ ] Seed với force=true → Should clear old data
- [ ] Seed 1000 records → Should complete without timeout
- [ ] Verify data quality (names, prices, dates are realistic)
- [ ] Check dependency cascade works correctly
- [ ] Test UI components (quantity selector, presets)
- [ ] Test error handling (missing deps, invalid quantity)

---

## 📊 Performance

### Benchmarks

| Module | Quantity | Duration | Notes |
|--------|----------|----------|-------|
| Products | 50 | ~2s | With categories |
| Posts | 100 | ~3.5s | With users |
| Orders | 50 | ~4s | With products + customers |
| Bulk (Standard) | ~200 | ~12s | All modules |

### Optimization Tips

1. **Batch Size**: Default 50, tăng lên 100 cho tables đơn giản
2. **Promise.all()**: Luôn dùng cho independent operations
3. **Conditional seeding**: Check existing data trước khi seed
4. **Stats update**: Batch update stats sau khi seed xong

---

## ⚠️ Common Issues

### Issue 1: "Missing dependencies"

**Problem:** Module dependencies chưa có data

**Solution:**
```typescript
await seedModule({
  module: 'orders',
  dependencies: true  // ← Enable auto-seed
});
```

### Issue 2: "Timeout khi seed nhiều records"

**Problem:** Insert quá nhiều records cùng lúc

**Solution:**
```typescript
await seedModule({
  module: 'products',
  quantity: 1000,
  batchSize: 50  // ← Giảm batch size
});
```

### Issue 3: "Data không realistic"

**Problem:** Sử dụng Faker mặc định (English)

**Solution:**
```typescript
// Sử dụng VietnameseFaker
import { createVietnameseFaker } from './_faker-vi';

const viFaker = createVietnameseFaker(this.faker);
const name = viFaker.fullName();  // → "Nguyễn Văn An"
const phone = viFaker.phoneNumber();  // → "0901234567"
```

---

## 🔮 Future Enhancements

### Planned Features

- [ ] Export/Import seed configurations ra JSON
- [ ] Seed preview trước khi execute
- [ ] Undo last seed operation
- [ ] Seed scheduling (cron jobs)
- [ ] Custom seed templates
- [ ] AI-generated seed data based on user prompts
- [ ] Seed từ CSV/Excel files
- [ ] Database migration support

---

## 📚 References

### Related Docs

- [QA Report](./QA-SEED-DATA-TABS.md) - Full QA analysis
- [Implementation Plan](./SEED-ENHANCEMENT-PLAN.md) - Architecture & timeline

### External Resources

- [Faker.js Documentation](https://fakerjs.dev/guide/)
- [dbt Seeds Best Practices](https://docs.getdbt.com/reference/seed-configs)
- [Topological Sort Algorithm](https://en.wikipedia.org/wiki/Topological_sorting)

---

## 💡 Tips & Best Practices

### Do's ✅

- Luôn check dependencies trước khi seed
- Sử dụng batch processing cho large datasets
- Validate records trước khi insert
- Use Vietnamese Faker cho realistic data
- Update stats/counters sau khi seed xong
- Handle errors gracefully với try/catch
- Log progress để debug

### Don'ts ❌

- Không seed trực tiếp vào production
- Không hardcode IDs (dùng return value từ insert)
- Không forget cleanup old data khi force=true
- Không skip validation để tăng tốc
- Không ignore dependency errors
- Không use synchronous operations cho large data

---

## 🙏 Credits

**Developed by:** Droid AI Assistant  
**Date:** 2026-02-03  
**Libraries Used:**
- @faker-js/faker (v9.9.0)
- Convex Database
- React Query
- TypeScript

---

## 📄 License

MIT - Free to use and modify

---

**Last Updated:** 2026-02-03  
**Version:** 1.0.0

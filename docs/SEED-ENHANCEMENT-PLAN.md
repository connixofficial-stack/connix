# Seed Enhancement Implementation Plan

**Date:** 2026-02-03  
**Objective:** Nâng cao hệ thống seed data với dependency management và configurable quantity

---

## 🎯 Goals

1. ✅ **Dependency Management**: Tự động seed dependencies (Products → Orders → Customers)
2. ✅ **Configurable Quantity**: Cho phép seed 5/10/50/100 hoặc custom số lượng
3. ✅ **Bulk Seeding**: Seed tất cả modules cùng lúc từ /system/modules
4. ✅ **Progress Tracking**: Hiển thị progress khi seed nhiều records
5. ✅ **Faker Integration**: Dùng @faker-js/faker để generate realistic data

---

## 📦 Architecture Overview

### New Structure

```
convex/
├── seed.ts (legacy - giữ lại để backward compatible)
├── seeders/
│   ├── _base.ts                    # Base seeder với SeedConfig
│   ├── _dependencies.ts            # Dependency graph
│   ├── posts.seeder.ts             # PostSeeder class
│   ├── products.seeder.ts          # ProductSeeder class
│   ├── orders.seeder.ts            # OrderSeeder (depends on products, customers)
│   └── ...
├── seedManager.ts                  # Orchestrator mới
└── dataManager.ts (existing)       # Giữ lại, dùng seedManager internally

app/system/modules/
└── page.tsx                        # Thêm Bulk Seed UI

components/modules/{module}/
└── {Module}DataTab.tsx             # Update UI với quantity options
```

---

## 🔧 Implementation Details

### Phase 1: Core Infrastructure (2-3 giờ)

#### 1.1. Base Seeder Interface (`convex/seeders/_base.ts`)

```typescript
import { faker } from '@faker-js/faker';
import type { GenericMutationCtx } from 'convex/server';

export interface SeedConfig {
  quantity: number;          // Số lượng cần seed
  force?: boolean;           // Xóa data cũ trước khi seed
  batchSize?: number;        // Insert theo batch (default: 50)
  locale?: string;           // Faker locale (vi, en)
  dependencies?: string[];   // Danh sách modules phụ thuộc
}

export interface SeedResult {
  module: string;
  created: number;           // Số records đã tạo
  duration: number;          // Thời gian (ms)
  dependencies: string[];    // Dependencies đã seed
  errors?: string[];
}

export abstract class BaseSeeder<T = any> {
  protected ctx: GenericMutationCtx<any>;
  protected faker: typeof faker;
  
  constructor(ctx: GenericMutationCtx<any>) {
    this.ctx = ctx;
    this.faker = faker;
  }
  
  abstract moduleName: string;
  abstract dependencies: string[];
  
  // Generate 1 fake record
  abstract generateFake(): T;
  
  // Insert records với batch
  async insertBatch(records: T[], tableName: string): Promise<void> {
    const promises = records.map(record => 
      this.ctx.db.insert(tableName, record)
    );
    await Promise.all(promises);
  }
  
  // Main seed function
  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    const result: SeedResult = {
      created: 0,
      dependencies: [],
      duration: 0,
      module: this.moduleName,
    };
    
    try {
      // 1. Check existing data
      const existing = await this.checkExisting();
      if (existing && !config.force) {
        return { ...result, created: 0, duration: Date.now() - startTime };
      }
      
      // 2. Clear if force
      if (config.force) {
        await this.clear();
      }
      
      // 3. Set faker locale
      this.faker.setDefaultRefDate(new Date());
      this.faker.seed(Date.now());
      
      // 4. Generate data
      const batchSize = config.batchSize || 50;
      let created = 0;
      
      while (created < config.quantity) {
        const remaining = config.quantity - created;
        const currentBatch = Math.min(batchSize, remaining);
        
        const records: T[] = [];
        for (let i = 0; i < currentBatch; i++) {
          records.push(this.generateFake());
        }
        
        await this.insertRecords(records);
        created += currentBatch;
      }
      
      result.created = created;
      result.duration = Date.now() - startTime;
      return result;
      
    } catch (error) {
      result.errors = [error instanceof Error ? error.message : String(error)];
      return result;
    }
  }
  
  // Override methods
  protected abstract checkExisting(): Promise<boolean>;
  protected abstract clear(): Promise<void>;
  protected abstract insertRecords(records: T[]): Promise<void>;
}
```

#### 1.2. Dependency Graph (`convex/seeders/_dependencies.ts`)

```typescript
export const SEED_DEPENDENCIES: Record<string, string[]> = {
  // No dependencies
  roles: [],
  postCategories: [],
  productCategories: [],
  serviceCategories: [],
  
  // Level 1 deps
  users: ['roles'],
  customers: [],
  
  // Level 2 deps
  posts: ['postCategories', 'users'],
  products: ['productCategories'],
  services: ['serviceCategories'],
  
  // Level 3 deps
  comments: ['posts', 'products'],  // ANY dependency (1 trong 2)
  orders: ['products', 'customers'], // ALL dependencies
  cart: ['products', 'customers'],
  wishlist: ['products', 'customers'],
  
  // Level 4 deps
  menus: [],
  homepage: ['posts', 'products'], // Optional deps for dynamic content
};

export type DependencyType = 'all' | 'any';

export interface ModuleDependency {
  module: string;
  type: DependencyType;
  deps: string[];
}

// Resolve dependencies in order
export function resolveDependencies(modules: string[]): string[] {
  const resolved: string[] = [];
  const visiting = new Set<string>();
  
  function visit(module: string) {
    if (resolved.includes(module)) return;
    if (visiting.has(module)) {
      throw new Error(`Circular dependency detected: ${module}`);
    }
    
    visiting.add(module);
    const deps = SEED_DEPENDENCIES[module] || [];
    
    for (const dep of deps) {
      visit(dep);
    }
    
    visiting.delete(module);
    resolved.push(module);
  }
  
  modules.forEach(visit);
  return resolved;
}

// Check if dependencies are satisfied
export async function checkDependencies(
  ctx: any,
  module: string,
  type: DependencyType = 'all'
): Promise<{ satisfied: boolean; missing: string[] }> {
  const deps = SEED_DEPENDENCIES[module] || [];
  const missing: string[] = [];
  
  for (const dep of deps) {
    const tableName = getTableName(dep);
    const exists = await ctx.db.query(tableName).first();
    if (!exists) {
      missing.push(dep);
    }
  }
  
  const satisfied = type === 'all' 
    ? missing.length === 0 
    : missing.length < deps.length;
  
  return { missing, satisfied };
}

function getTableName(module: string): string {
  const mapping: Record<string, string> = {
    postCategories: 'postCategories',
    productCategories: 'productCategories',
    roles: 'roles',
    users: 'users',
    // ... add all mappings
  };
  return mapping[module] || module;
}
```

#### 1.3. Seed Manager (`convex/seedManager.ts`)

```typescript
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { resolveDependencies, checkDependencies } from './seeders/_dependencies';
import type { SeedConfig, SeedResult } from './seeders/_base';

// Import all seeders
import { PostSeeder } from './seeders/posts.seeder';
import { ProductSeeder } from './seeders/products.seeder';
import { OrderSeeder } from './seeders/orders.seeder';
// ... import others

const SEEDERS = {
  orders: OrderSeeder,
  posts: PostSeeder,
  products: ProductSeeder,
  // ... add all
};

// ============================================================
// SINGLE MODULE SEED
// ============================================================

export const seedModule = mutation({
  args: {
    dependencies: v.optional(v.boolean()),
    force: v.optional(v.boolean()),
    locale: v.optional(v.string()),
    module: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args): Promise<SeedResult> => {
    const SeederClass = SEEDERS[args.module as keyof typeof SEEDERS];
    if (!SeederClass) {
      throw new Error(`Seeder not found for module: ${args.module}`);
    }
    
    const seeder = new SeederClass(ctx);
    const config: SeedConfig = {
      force: args.force ?? false,
      locale: args.locale ?? 'vi',
      quantity: args.quantity,
    };
    
    // Check dependencies
    if (args.dependencies !== false) {
      const { satisfied, missing } = await checkDependencies(
        ctx, 
        args.module, 
        'all'
      );
      
      if (!satisfied) {
        // Auto-seed dependencies
        const results: SeedResult[] = [];
        for (const dep of missing) {
          const depResult = await ctx.runMutation(
            seedModule,
            { module: dep, quantity: 10 } // Default 10 for deps
          );
          results.push(depResult);
        }
      }
    }
    
    return seeder.seed(config);
  },
  returns: v.object({
    created: v.number(),
    dependencies: v.array(v.string()),
    duration: v.number(),
    errors: v.optional(v.array(v.string())),
    module: v.string(),
  }),
});

// ============================================================
// BULK SEED (Multiple modules)
// ============================================================

export const seedBulk = mutation({
  args: {
    configs: v.array(v.object({
      force: v.optional(v.boolean()),
      module: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<SeedResult[]> => {
    const modules = args.configs.map(c => c.module);
    const orderedModules = resolveDependencies(modules);
    
    const results: SeedResult[] = [];
    
    for (const module of orderedModules) {
      const config = args.configs.find(c => c.module === module);
      if (!config) continue;
      
      const result = await ctx.runMutation(seedModule, {
        dependencies: true,
        force: config.force ?? false,
        module,
        quantity: config.quantity,
      });
      
      results.push(result);
    }
    
    return results;
  },
  returns: v.array(v.object({
    created: v.number(),
    dependencies: v.array(v.string()),
    duration: v.number(),
    errors: v.optional(v.array(v.string())),
    module: v.string(),
  })),
});

// ============================================================
// PRESET SEEDS
// ============================================================

export const seedPreset = mutation({
  args: {
    force: v.optional(v.boolean()),
    preset: v.union(
      v.literal('minimal'),    // 5 records each
      v.literal('standard'),   // 20 records
      v.literal('large'),      // 100 records
      v.literal('demo')        // Realistic demo data
    ),
  },
  handler: async (ctx, args) => {
    const quantities: Record<string, number> = {
      demo: 50,
      large: 100,
      minimal: 5,
      standard: 20,
    };
    
    const qty = quantities[args.preset];
    
    const configs = [
      { module: 'roles', quantity: 4 },
      { module: 'users', quantity: Math.min(qty, 10) },
      { module: 'customers', quantity: qty },
      { module: 'postCategories', quantity: 5 },
      { module: 'posts', quantity: qty },
      { module: 'productCategories', quantity: 5 },
      { module: 'products', quantity: qty },
      { module: 'comments', quantity: qty * 2 },
      { module: 'orders', quantity: Math.floor(qty / 2) },
    ];
    
    return ctx.runMutation(seedBulk, { configs });
  },
  returns: v.array(v.any()),
});

// ============================================================
// PROGRESS TRACKING
// ============================================================

export const getSeedProgress = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // Store progress in a temporary table
    const progress = await ctx.db
      .query('seedProgress')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first();
    
    return progress || null;
  },
  returns: v.union(
    v.null(),
    v.object({
      completed: v.number(),
      current: v.string(),
      sessionId: v.string(),
      total: v.number(),
    })
  ),
});
```

---

### Phase 2: Seeder Implementation (3-4 giờ)

#### 2.1. Product Seeder Example (`convex/seeders/products.seeder.ts`)

```typescript
import { BaseSeeder, type SeedConfig } from './_base';
import type { Doc } from '../_generated/dataModel';

type ProductData = Omit<Doc<'products'>, '_id' | '_creationTime'>;

export class ProductSeeder extends BaseSeeder<ProductData> {
  moduleName = 'products';
  dependencies = ['productCategories'];
  
  private categories: Doc<'productCategories'>[] = [];
  
  async seed(config: SeedConfig) {
    // Load categories trước
    this.categories = await this.ctx.db.query('productCategories').collect();
    if (this.categories.length === 0) {
      throw new Error('No product categories found. Seed categories first.');
    }
    
    return super.seed(config);
  }
  
  generateFake(): ProductData {
    const category = this.faker.helpers.arrayElement(this.categories);
    const name = this.faker.commerce.productName();
    const slug = this.faker.helpers.slugify(name).toLowerCase();
    const price = this.faker.number.int({ max: 50_000_000, min: 100_000 });
    const hasSale = this.faker.datatype.boolean({ probability: 0.3 });
    
    return {
      categoryId: category._id,
      description: this.faker.commerce.productDescription(),
      image: `https://picsum.photos/seed/${slug}/400/400`,
      name,
      order: 0, // Will update after insert
      price,
      salePrice: hasSale ? price * 0.8 : undefined,
      sales: this.faker.number.int({ max: 500, min: 0 }),
      sku: this.faker.string.alphanumeric({ casing: 'upper', length: 10 }),
      slug,
      status: this.faker.helpers.arrayElement(['Active', 'Draft', 'Archived'] as const),
      stock: this.faker.number.int({ max: 200, min: 0 }),
    };
  }
  
  protected async checkExisting(): Promise<boolean> {
    const existing = await this.ctx.db.query('products').first();
    return existing !== null;
  }
  
  protected async clear(): Promise<void> {
    const products = await this.ctx.db.query('products').collect();
    await Promise.all(products.map(p => this.ctx.db.delete(p._id)));
    
    // Reset stats
    const stats = await this.ctx.db.query('productStats').collect();
    await Promise.all(stats.map(s => this.ctx.db.delete(s._id)));
  }
  
  protected async insertRecords(records: ProductData[]): Promise<void> {
    await this.insertBatch(records, 'products');
  }
}
```

#### 2.2. Order Seeder với Dependencies (`convex/seeders/orders.seeder.ts`)

```typescript
export class OrderSeeder extends BaseSeeder<OrderData> {
  moduleName = 'orders';
  dependencies = ['products', 'customers'];
  
  private products: Doc<'products'>[] = [];
  private customers: Doc<'customers'>[] = [];
  
  async seed(config: SeedConfig) {
    // Load dependencies
    [this.products, this.customers] = await Promise.all([
      this.ctx.db.query('products').collect(),
      this.ctx.db.query('customers').collect(),
    ]);
    
    if (this.products.length === 0) {
      throw new Error('No products found');
    }
    if (this.customers.length === 0) {
      throw new Error('No customers found');
    }
    
    return super.seed(config);
  }
  
  generateFake(): OrderData {
    const customer = this.faker.helpers.arrayElement(this.customers);
    const itemsCount = this.faker.number.int({ max: 5, min: 1 });
    const items: OrderItem[] = [];
    
    let subtotal = 0;
    for (let i = 0; i < itemsCount; i++) {
      const product = this.faker.helpers.arrayElement(this.products);
      const quantity = this.faker.number.int({ max: 3, min: 1 });
      const price = product.salePrice || product.price;
      
      items.push({
        price,
        productId: product._id,
        productName: product.name,
        quantity,
      });
      
      subtotal += price * quantity;
    }
    
    const shippingFee = this.faker.number.int({ max: 50_000, min: 0 });
    
    return {
      customerId: customer._id,
      items,
      orderNumber: `ORD-${this.faker.string.numeric(10)}`,
      paymentMethod: this.faker.helpers.arrayElement([
        'COD', 'BankTransfer', 'CreditCard', 'EWallet'
      ] as const),
      paymentStatus: this.faker.helpers.arrayElement([
        'Pending', 'Paid', 'Failed', 'Refunded'
      ] as const),
      shippingAddress: `${customer.address}, ${customer.city}`,
      shippingFee,
      status: this.faker.helpers.arrayElement([
        'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
      ] as const),
      subtotal,
      totalAmount: subtotal + shippingFee,
    };
  }
  
  // ... checkExisting, clear, insertRecords
}
```

---

### Phase 3: UI Enhancement (2-3 giờ)

#### 3.1. Bulk Seed Card (`app/system/modules/page.tsx`)

```tsx
// Add new card after preset dropdown section
<Card className="p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Database className="w-5 h-5 text-cyan-500" />
        Seed Data Management
      </h3>
      <p className="text-sm text-slate-500 mt-1">
        Seed tất cả modules với dữ liệu mẫu hoặc tùy chỉnh số lượng
      </p>
    </div>
  </div>
  
  {/* Preset Buttons */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    {presets.map(preset => (
      <Button
        key={preset.key}
        variant="outline"
        onClick={() => handleSeedPreset(preset.key)}
        disabled={isBulkSeeding}
        className="flex flex-col items-center gap-2 h-auto py-3"
      >
        <preset.icon className="w-6 h-6" />
        <div>
          <div className="font-semibold">{preset.name}</div>
          <div className="text-xs text-slate-500">{preset.qty} records</div>
        </div>
      </Button>
    ))}
  </div>
  
  {/* Custom Seed Button */}
  <Button
    onClick={() => setShowCustomSeedDialog(true)}
    variant="default"
    className="w-full"
  >
    <Settings className="w-4 h-4 mr-2" />
    Custom Seed Configuration
  </Button>
  
  {/* Progress Bar */}
  {isBulkSeeding && (
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span>Seeding {currentModule}...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  )}
</Card>
```

#### 3.2. Custom Seed Dialog

```tsx
<Dialog open={showCustomSeedDialog} onOpenChange={setShowCustomSeedDialog}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Custom Seed Configuration</DialogTitle>
      <DialogDescription>
        Chọn modules và số lượng records muốn seed
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {moduleGroups.map(group => (
        <div key={group.category}>
          <h4 className="font-semibold mb-2">{group.label}</h4>
          <div className="space-y-3">
            {group.modules.map(module => (
              <div key={module.key} className="flex items-center gap-3">
                <Checkbox
                  checked={selectedModules.includes(module.key)}
                  onCheckedChange={(checked) => 
                    handleToggleModule(module.key, checked)
                  }
                />
                <Label className="flex-1">{module.name}</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={quantities[module.key] || 10}
                  onChange={(e) => 
                    setQuantities(prev => ({
                      ...prev,
                      [module.key]: parseInt(e.target.value)
                    }))
                  }
                  className="w-24"
                  disabled={!selectedModules.includes(module.key)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
        <Info className="w-4 h-4 text-amber-600" />
        <p className="text-sm text-amber-800">
          Dependencies sẽ được seed tự động nếu chưa có data
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowCustomSeedDialog(false)}>
        Cancel
      </Button>
      <Button onClick={handleCustomSeed} disabled={selectedModules.length === 0}>
        <Database className="w-4 h-4 mr-2" />
        Seed {selectedModules.length} modules
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3.3. Updated DataTab with Quantity Options

```tsx
// components/modules/products/ProductsDataTab.tsx
<Card className="p-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold">Seed Options</h3>
      <p className="text-sm text-slate-500 mt-1">Choose quantity</p>
    </div>
    
    <div className="flex gap-2">
      {[5, 10, 50, 100].map(qty => (
        <Button
          key={qty}
          variant={selectedQty === qty ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedQty(qty)}
        >
          {qty}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Input
            type="number"
            placeholder="Enter quantity"
            value={customQty}
            onChange={(e) => setCustomQty(parseInt(e.target.value))}
          />
          <Button className="w-full mt-2" onClick={() => setSelectedQty(customQty)}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  </div>
  
  {/* Action Buttons */}
  <div className="flex gap-2 mt-4">
    <Button onClick={() => handleSeed(selectedQty)}>
      Seed {selectedQty} records
    </Button>
    {/* ... Clear, Reset buttons */}
  </div>
</Card>
```

---

### Phase 4: Faker Integration (1-2 giờ)

#### 4.1. Install Dependencies

```bash
npm install --save-dev @faker-js/faker
```

#### 4.2. Vietnamese Locale Configuration

```typescript
// convex/seeders/_faker-vi.ts
import { faker } from '@faker-js/faker';

export function configureVietnameseFaker() {
  // Vietnamese names
  faker.seed(Date.now());
  
  const vietnameseFirstNames = [
    'An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hạnh',
    'Hoa', 'Lan', 'Mai', 'Nam', 'Phương', 'Quân', 'Tuấn'
  ];
  
  const vietnameseLastNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh',
    'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô'
  ];
  
  faker.helpers.arrayElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  };
  
  // Custom Vietnamese product names
  const productPrefixes = [
    'Điện thoại', 'Laptop', 'Máy tính bảng', 'Tai nghe',
    'Loa', 'Chuột', 'Bàn phím', 'Màn hình'
  ];
  
  return {
    person: {
      fullName: () => {
        const last = faker.helpers.arrayElement(vietnameseLastNames);
        const first = faker.helpers.arrayElement(vietnameseFirstNames);
        const middle = faker.helpers.arrayElement(vietnameseFirstNames);
        return `${last} ${middle} ${first}`;
      }
    },
    product: {
      name: () => {
        const prefix = faker.helpers.arrayElement(productPrefixes);
        const brand = faker.company.name();
        return `${prefix} ${brand}`;
      }
    }
  };
}
```

---

## 📅 Timeline & Milestones

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| **Phase 1** | Base infrastructure | 2-3h | 🔴 TODO |
| - | Base seeder class | 1h | 🔴 |
| - | Dependency graph | 1h | 🔴 |
| - | Seed manager | 1h | 🔴 |
| **Phase 2** | Seeder implementation | 3-4h | 🔴 TODO |
| - | Products seeder | 1h | 🔴 |
| - | Orders seeder | 1h | 🔴 |
| - | Posts/Services seeders | 2h | 🔴 |
| **Phase 3** | UI enhancement | 2-3h | 🔴 TODO |
| - | Bulk seed card | 1h | 🔴 |
| - | Custom dialog | 1h | 🔴 |
| - | DataTab updates | 1h | 🔴 |
| **Phase 4** | Faker integration | 1-2h | 🔴 TODO |
| - | Install + config | 0.5h | 🔴 |
| - | Vietnamese locale | 0.5h | 🔴 |
| - | Test data quality | 1h | 🔴 |
| **Testing** | QA & fixes | 2-3h | 🔴 TODO |

**Total Estimate:** 10-15 hours

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Seed với quantity tùy chọn (5/10/50/100/custom)
- [ ] Auto-seed dependencies khi thiếu
- [ ] Bulk seed từ /system/modules với preset options
- [ ] Progress tracking khi seed nhiều records
- [ ] Faker integration với Vietnamese locale

### Should Have
- [ ] Force option để re-seed data
- [ ] Batch insert để tránh timeout
- [ ] Error handling với retry logic
- [ ] Toast notifications với progress

### Nice to Have
- [ ] Export seed config ra JSON
- [ ] Import custom seed data từ CSV
- [ ] Seed preview trước khi execute
- [ ] Undo last seed operation

---

## 🧪 Testing Plan

### Unit Tests
```typescript
describe('ProductSeeder', () => {
  it('should generate fake product', () => {
    const seeder = new ProductSeeder(mockCtx);
    const product = seeder.generateFake();
    expect(product.name).toBeDefined();
    expect(product.price).toBeGreaterThan(0);
  });
  
  it('should seed 10 products', async () => {
    const result = await seeder.seed({ quantity: 10 });
    expect(result.created).toBe(10);
  });
  
  it('should handle dependencies', async () => {
    // Test auto-seed categories
  });
});
```

### Integration Tests
1. Seed orders without products → should auto-seed products + customers
2. Seed 1000 products → should complete without timeout
3. Force re-seed → should clear old data first
4. Bulk seed with custom config → should respect dependencies order

### Manual QA Checklist
- [ ] Seed 5 products từ DataTab
- [ ] Seed 100 posts với custom dialog
- [ ] Bulk seed preset "Standard" (20 each)
- [ ] Verify data quality (realistic names, prices, dates)
- [ ] Check dependency cascade (orders → products → categories)
- [ ] Test progress indicator
- [ ] Test error handling (network issues, timeout)

---

## 📚 References

### Best Practices Learned
1. **Batch insertion**: Insert theo batch 50 để tránh timeout
2. **Dependency resolution**: Dùng topological sort để order modules
3. **Faker seeding**: Set seed để reproducible data
4. **Progress tracking**: Store progress trong temp table với sessionId

### Libraries Used
- `@faker-js/faker` - Generate realistic fake data
- Convex mutations - Batch operations với Promise.all()
- React Query - Real-time progress updates

### Documentation
- [Faker.js Guide](https://fakerjs.dev/guide/)
- [dbt Seeds Best Practices](https://docs.getdbt.com/reference/seed-configs)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)

---

## 🚀 Next Steps

1. **Review & Approve Plan** ✋
2. Implement Phase 1 (Infrastructure)
3. Implement Phase 2 (Seeders)
4. Implement Phase 3 (UI)
5. Implement Phase 4 (Faker)
6. Testing & QA
7. Documentation update
8. Deploy to production

---

**Plan Created By:** Droid AI Assistant  
**Date:** 2026-02-03  
**Status:** 🔴 Awaiting Approval

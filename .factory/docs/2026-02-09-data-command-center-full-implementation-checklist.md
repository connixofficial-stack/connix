## DATA COMMAND CENTER - Implementation Checklist

---

## 1. BACKEND: Fix Cascade Delete Order

### 1.1 Update `convex/seedManager.ts`

#### 1.1.1 Thêm DEPENDENCY_LEVELS constant
```typescript
export const DEPENDENCY_LEVELS: Record<number, string[]> = {
  0: ['roles', 'postCategories', 'productCategories', 'serviceCategories', 'settings', 'media', 'adminModules', 'systemPresets'],
  1: ['users', 'customers'],
  2: ['posts', 'products', 'services', 'menus', 'homepage'],
  3: ['comments', 'orders', 'cart', 'wishlist', 'promotions'],
  4: ['analytics', 'notifications'],
};
```

#### 1.1.2 Thêm helper functions
```typescript
// Lấy thứ tự seed (level 0 → 4)
export function getSeedOrder(): string[] {
  return Object.keys(DEPENDENCY_LEVELS)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap(level => DEPENDENCY_LEVELS[Number(level)]);
}

// Lấy thứ tự clear (level 4 → 0) 
export function getClearOrder(): string[] {
  return Object.keys(DEPENDENCY_LEVELS)
    .sort((a, b) => Number(b) - Number(a))
    .flatMap(level => DEPENDENCY_LEVELS[Number(level)]);
}

// Lấy level của module
export function getModuleLevel(moduleKey: string): number {
  for (const [level, modules] of Object.entries(DEPENDENCY_LEVELS)) {
    if (modules.includes(moduleKey)) return Number(level);
  }
  return -1;
}
```

#### 1.1.3 Update `clearAll` mutation
- [ ] Import getClearOrder
- [ ] Thay đổi logic để xóa theo thứ tự getClearOrder()
- [ ] Log thứ tự xóa để debug

#### 1.1.4 Update `seedPreset` mutation  
- [ ] Import getSeedOrder
- [ ] Đảm bảo seed theo đúng thứ tự dependency

#### 1.1.5 Thêm query mới `getDependencyTree`
```typescript
export const getDependencyTree = query({
  args: {},
  handler: async (ctx) => {
    // Return DEPENDENCY_LEVELS với count của mỗi module
    const result: Record<number, Array<{key: string; count: number}>> = {};
    
    for (const [level, modules] of Object.entries(DEPENDENCY_LEVELS)) {
      result[Number(level)] = await Promise.all(
        modules.map(async (moduleKey) => {
          const tableName = getTableName(moduleKey);
          const records = await ctx.db.query(tableName).take(1001);
          return {
            key: moduleKey,
            count: records.length > 1000 ? 1000 : records.length,
            isApproximate: records.length > 1000,
          };
        })
      );
    }
    return result;
  },
});
```

### 1.2 Update `convex/dataManager.ts`

#### 1.2.1 Đồng bộ ALL_TABLES với SEEDER_REGISTRY
- [ ] Import listSeedableModuleKeys từ seeders
- [ ] Thay ALL_TABLES bằng dynamic list hoặc đảm bảo sync

#### 1.2.2 Update TABLE_CATEGORIES
- [ ] Đảm bảo mọi module trong DEPENDENCY_LEVELS có category

---

## 2. FRONTEND: Tạo Components mới

### 2.1 Tạo folder structure
```
components/data/
├── index.ts
├── DataCommandCenter.tsx
├── QuickActionsCard.tsx
├── DependencyTree.tsx
├── DependencyNode.tsx
├── TableDetailsCard.tsx
└── TableRow.tsx
```

### 2.2 Tạo `components/data/index.ts`
```typescript
export { DataCommandCenter } from './DataCommandCenter';
export { QuickActionsCard } from './QuickActionsCard';
export { DependencyTree } from './DependencyTree';
export { DependencyNode } from './DependencyNode';
export { TableDetailsCard } from './TableDetailsCard';
```

### 2.3 Tạo `components/data/DependencyNode.tsx`

#### 2.3.1 Props interface
```typescript
interface DependencyNodeProps {
  moduleKey: string;
  moduleName: string;
  count: number;
  isApproximate?: boolean;
  level: number;
  isSeeding?: boolean;
  isClearing?: boolean;
  onSeed: (moduleKey: string) => void;
  onClear: (moduleKey: string) => void;
}
```

#### 2.3.2 UI elements
- [ ] Box với border, hover effect
- [ ] Icon module (từ SEED_MODULE_METADATA)
- [ ] Module name
- [ ] Count badge (● có data, ○ empty)
- [ ] Hover menu: [Seed] [Clear]
- [ ] Loading state khi seeding/clearing

### 2.4 Tạo `components/data/DependencyTree.tsx`

#### 2.4.1 Props interface
```typescript
interface DependencyTreeProps {
  data: Record<number, Array<{key: string; count: number; isApproximate?: boolean}>>;
  seedingModule: string | null;
  clearingModule: string | null;
  onSeedModule: (moduleKey: string) => void;
  onClearModule: (moduleKey: string) => void;
}
```

#### 2.4.2 Layout structure
- [ ] Header: "🌳 DEPENDENCY TREE" + "Seed ↓ Clear ↑"
- [ ] Level 0 row với label "Level 0 (Seed đầu tiên)"
- [ ] Connector lines (CSS borders hoặc SVG)
- [ ] Level 1 row
- [ ] Level 2 row
- [ ] Level 3 row
- [ ] Level 4 row với label "Level 4 (Clear đầu tiên)"
- [ ] Legend: [●] Has data [○] Empty

#### 2.4.3 Responsive
- [ ] Desktop: horizontal tree
- [ ] Mobile: vertical tree hoặc simplified list

### 2.5 Tạo `components/data/QuickActionsCard.tsx`

#### 2.5.1 Props interface
```typescript
interface QuickActionsCardProps {
  onSeedPreset: (preset: 'minimal' | 'standard' | 'large' | 'demo') => void;
  onClearAll: () => void;
  onResetAll: () => void;
  onOpenCustomDialog: () => void;
  isSeeding: boolean;
  isClearing: boolean;
  currentPreset: string | null;
}
```

#### 2.5.2 Preset buttons
- [ ] Minimal card: icon ⚡, "5-10 records", description
- [ ] Standard card: icon 📦, "20-30 records", description  
- [ ] Large card: icon 🚀, "100+ records", description
- [ ] Demo card: icon ✨, "50 records", description
- [ ] Hover effect, selected state
- [ ] Disabled khi đang seed/clear

#### 2.5.3 Action buttons row
- [ ] [🧹 Clear All] - outline, red text
- [ ] [🔄 Reset All] - outline
- [ ] [⚙️ Custom Seed...] - outline, opens dialog

#### 2.5.4 Confirm dialogs
- [ ] Clear All confirm: "Xóa toàn bộ data? Không thể hoàn tác."
- [ ] Reset All confirm: "Reset = Clear + Seed lại. Tiếp tục?"

### 2.6 Tạo `components/data/TableRow.tsx`

#### 2.6.1 Props interface
```typescript
interface TableRowProps {
  tableName: string;
  count: number;
  isApproximate?: boolean;
  isSeeding?: boolean;
  isClearing?: boolean;
  onSeed: () => void;
  onClear: () => void;
}
```

#### 2.6.2 UI elements
- [ ] Table name (monospace)
- [ ] Dots line (........)
- [ ] Count với ~ nếu approximate
- [ ] [Seed] button - small, outline
- [ ] [Clear] button - small, outline, red
- [ ] Loading spinner khi action

### 2.7 Tạo `components/data/TableDetailsCard.tsx`

#### 2.7.1 Props interface
```typescript
interface TableDetailsCardProps {
  tableStats: Array<{table: string; count: number; category: string; isApproximate: boolean}>;
  seedingTable: string | null;
  clearingTable: string | null;
  onSeedTable: (table: string) => void;
  onClearTable: (table: string) => void;
}
```

#### 2.7.2 Group by category
- [ ] System group (collapsible)
- [ ] Content group (collapsible)
- [ ] Commerce group (collapsible)
- [ ] User group (collapsible)
- [ ] Marketing group (collapsible)

#### 2.7.3 Group header
- [ ] Category icon + name
- [ ] Count: "X tables, Y records"
- [ ] Expand/collapse chevron

#### 2.7.4 [Expand All] button ở header

### 2.8 Tạo `components/data/DataCommandCenter.tsx`

#### 2.8.1 State management
```typescript
const [seedingModule, setSeedingModule] = useState<string | null>(null);
const [clearingModule, setClearingModule] = useState<string | null>(null);
const [isGlobalSeeding, setIsGlobalSeeding] = useState(false);
const [isGlobalClearing, setIsGlobalClearing] = useState(false);
const [showCustomDialog, setShowCustomDialog] = useState(false);
```

#### 2.8.2 Queries
- [ ] `useQuery(api.seedManager.getDependencyTree)`
- [ ] `useQuery(api.dataManager.getTableStats)`
- [ ] `useQuery(api.seedManager.listSeedPresets)`

#### 2.8.3 Mutations
- [ ] `useMutation(api.seedManager.seedModule)`
- [ ] `useMutation(api.seedManager.seedPreset)`
- [ ] `useMutation(api.seedManager.clearModule)`
- [ ] `useMutation(api.seedManager.clearAll)`

#### 2.8.4 Handlers
```typescript
const handleSeedModule = async (moduleKey: string) => { ... }
const handleClearModule = async (moduleKey: string) => { ... }
const handleSeedPreset = async (preset: PresetType) => { ... }
const handleClearAll = async () => { ... }
const handleResetAll = async () => { ... }
```

#### 2.8.5 Layout structure
```tsx
<div className="space-y-6 max-w-6xl mx-auto">
  {/* Header với stats */}
  <Header stats={...} />
  
  {/* Quick Actions */}
  <QuickActionsCard {...} />
  
  {/* Dependency Tree */}
  <DependencyTree {...} />
  
  {/* Table Details */}
  <TableDetailsCard {...} />
  
  {/* Info/Warning box */}
  <InfoBox />
  
  {/* Custom Seed Dialog */}
  <CustomSeedDialog open={showCustomDialog} ... />
</div>
```

#### 2.8.6 Header component (inline)
- [ ] Title: "📊 Data Command Center"
- [ ] Subtitle: "Quản lý toàn bộ dữ liệu hệ thống từ một nơi"
- [ ] Stats badges: "20 tables", "1,234 records", "5 empty"

#### 2.8.7 InfoBox component (inline)
- [ ] Warning icon
- [ ] Bullet points giải thích:
  - Seed tự động theo thứ tự dependency (Level 0 → 4)
  - Clear tự động theo thứ tự ngược (Level 4 → 0)
  - Chỉ dùng cho môi trường Development

---

## 3. FRONTEND: Rewrite /system/data page

### 3.1 Update `app/system/data/page.tsx`

#### 3.1.1 Xóa toàn bộ code cũ

#### 3.1.2 Import mới
```typescript
import { DataCommandCenter } from '@/components/data';
```

#### 3.1.3 New page component
```typescript
export default function DataManagerPage() {
  return <DataCommandCenter />;
}
```

---

## 4. CLEANUP: Bỏ BulkSeedCard từ /system/modules

### 4.1 Update `app/system/modules/page.tsx`

#### 4.1.1 Xóa imports
- [ ] Xóa `import { BulkSeedCard } from '@/components/modules/BulkSeedCard';`
- [ ] Xóa `import { CustomSeedDialog } from '@/components/modules/CustomSeedDialog';`

#### 4.1.2 Xóa state
- [ ] Xóa `const [showCustomSeedDialog, setShowCustomSeedDialog] = useState(false);`

#### 4.1.3 Xóa JSX
- [ ] Xóa `<BulkSeedCard ... />`
- [ ] Xóa `<CustomSeedDialog ... />`

#### 4.1.4 Thêm link đến /system/data (optional)
- [ ] Thêm banner nhỏ: "Quản lý data? Đến Data Command Center →"

---

## 5. CLEANUP: Xóa Tab Data từ các Module configs

### 5.1 List các module config files cần update

```
lib/modules/configs/
├── analytics.config.ts     tabs: ['config', 'data'] → ['config']
├── cart.config.ts          tabs: ['config', 'data'] → ['config']
├── comments.config.ts      tabs: ['config', 'data'] → ['config']
├── customers.config.ts     tabs: ['config', 'data'] → ['config']
├── homepage.config.ts      tabs: ['config', 'data'] → ['config']
├── media.config.ts         tabs: ['config', 'data'] → ['config']
├── menus.config.ts         tabs: ['config', 'data'] → ['config']
├── notifications.config.ts tabs: ['config', 'data'] → ['config']
├── orders.config.ts        tabs: ['config', 'data'] → ['config']
├── posts.config.ts         tabs: ['config', 'data', 'appearance'] → ['config', 'appearance']
├── products.config.ts      tabs: ['config', 'data'] → ['config']
├── promotions.config.ts    tabs: ['config', 'data'] → ['config']
├── roles.config.ts         tabs: ['config', 'data'] → ['config']
├── services.config.ts      tabs: ['config', 'data'] → ['config']
├── settings.config.ts      tabs: ['config', 'data'] → ['config']
├── users.config.ts         tabs: ['config', 'data'] → ['config']
└── wishlist.config.ts      tabs: ['config', 'data'] → ['config']
```

### 5.2 Với mỗi file config

#### 5.2.1 Mở file
#### 5.2.2 Tìm `tabs:` property
#### 5.2.3 Xóa `'data'` khỏi array
#### 5.2.4 Nếu chỉ còn `['config']`, có thể xóa luôn property tabs (default là ['config'])

---

## 6. CLEANUP: Xóa các DataTab components

### 6.1 Xóa 18 files

```bash
# List files to delete:
components/modules/analytics/AnalyticsDataTab.tsx
components/modules/cart/CartDataTab.tsx
components/modules/comments/CommentsDataTab.tsx
components/modules/customers/CustomersDataTab.tsx
components/modules/homepage/HomepageDataTab.tsx
components/modules/media/MediaDataTab.tsx
components/modules/menus/MenusDataTab.tsx
components/modules/notifications/NotificationsDataTab.tsx
components/modules/orders/OrdersDataTab.tsx
components/modules/posts/PostsDataTab.tsx
components/modules/products/ProductsDataTab.tsx
components/modules/promotions/PromotionsDataTab.tsx
components/modules/roles/RolesDataTab.tsx
components/modules/services/ServicesDataTab.tsx
components/modules/settings/SettingsDataTab.tsx
components/modules/users/UsersDataTab.tsx
components/modules/wishlist/WishlistDataTab.tsx
components/modules/DataTabSeedHeader.tsx
```

### 6.2 Update index.ts exports (nếu có)

#### 6.2.1 Kiểm tra `components/modules/index.ts`
#### 6.2.2 Xóa các export của DataTab components

### 6.3 Update module page files

Kiểm tra và update các file sau nếu có import DataTab:

```
app/system/modules/posts/page.tsx
app/system/modules/products/page.tsx
... (các module khác)
```

#### 6.3.1 Xóa import DataTab
#### 6.3.2 Xóa renderDataTab prop từ ModuleConfigPage

---

## 7. CLEANUP: Update ModuleConfigPage

### 7.1 Update `components/modules/ModuleConfigPage.tsx`

#### 7.1.1 Xóa default DataTab component
- [ ] Xóa function `DataTab`

#### 7.1.2 Update tabs logic
- [ ] Nếu không có renderDataTab, không hiển thị tab Data

#### 7.1.3 Simplify props interface
- [ ] Có thể bỏ `renderDataTab` prop nếu không còn dùng

---

## 8. TESTING

### 8.1 Test Backend

#### 8.1.1 Test getSeedOrder()
- [ ] Verify trả về đúng thứ tự level 0 → 4

#### 8.1.2 Test getClearOrder()
- [ ] Verify trả về đúng thứ tự level 4 → 0

#### 8.1.3 Test clearAll với dependency order
- [ ] Clear khi có data ở nhiều levels
- [ ] Verify không có FK error

#### 8.1.4 Test seedPreset
- [ ] Seed minimal preset
- [ ] Verify data được tạo đúng thứ tự

### 8.2 Test Frontend

#### 8.2.1 Test /system/data page
- [ ] Page load không lỗi
- [ ] Stats hiển thị đúng
- [ ] Dependency tree render đúng

#### 8.2.2 Test Quick Actions
- [ ] Click preset → seed đúng
- [ ] Click Clear All → xóa theo thứ tự
- [ ] Click Reset All → clear + seed

#### 8.2.3 Test Dependency Tree
- [ ] Click node → menu hiện
- [ ] Seed single module works
- [ ] Clear single module works
- [ ] Count update sau action

#### 8.2.4 Test Table Details
- [ ] Groups expand/collapse
- [ ] Per-table seed works
- [ ] Per-table clear works

#### 8.2.5 Test Module pages
- [ ] /system/modules/posts - không có tab Data
- [ ] /system/modules/products - không có tab Data
- [ ] Các module khác tương tự

### 8.3 Test Edge Cases

#### 8.3.1 Empty database
- [ ] UI hiển thị đúng khi không có data

#### 8.3.2 Large data (1000+ records)
- [ ] Approximate count hiển thị ~

#### 8.3.3 Concurrent actions
- [ ] Disable buttons khi đang seed/clear

#### 8.3.4 Error handling
- [ ] Toast error khi mutation fail

---

## 9. FINAL CHECKLIST

### 9.1 Code Quality
- [ ] Run `bunx oxlint --fix`
- [ ] No TypeScript errors
- [ ] No unused imports

### 9.2 Verify Routes
- [ ] /system/data - works
- [ ] /system/modules - works (no BulkSeedCard)
- [ ] /system/modules/[module] - works (no Data tab)

### 9.3 Verify Functionality
- [ ] Seed All với preset works
- [ ] Clear All works (đúng thứ tự)
- [ ] Reset All works
- [ ] Single module seed/clear works
- [ ] No FK broken errors

### 9.4 Git Commit
- [ ] git add -A
- [ ] git commit -m "feat: Data Command Center - centralize all data management with dependency tree visualization"

---

## FILES SUMMARY

| # | Action | File Path |
|---|--------|-----------|
| 1 | MODIFY | `convex/seedManager.ts` |
| 2 | MODIFY | `convex/dataManager.ts` |
| 3 | CREATE | `components/data/index.ts` |
| 4 | CREATE | `components/data/DataCommandCenter.tsx` |
| 5 | CREATE | `components/data/QuickActionsCard.tsx` |
| 6 | CREATE | `components/data/DependencyTree.tsx` |
| 7 | CREATE | `components/data/DependencyNode.tsx` |
| 8 | CREATE | `components/data/TableDetailsCard.tsx` |
| 9 | CREATE | `components/data/TableRow.tsx` |
| 10 | REWRITE | `app/system/data/page.tsx` |
| 11 | MODIFY | `app/system/modules/page.tsx` |
| 12-28 | MODIFY | 17 module config files (remove 'data' from tabs) |
| 29-46 | DELETE | 18 DataTab component files |
| 47+ | MODIFY | Module page files (remove renderDataTab) |

**Estimated Total: ~50 file changes**
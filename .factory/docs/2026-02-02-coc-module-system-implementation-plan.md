## Mục tiêu

**Config là Single Source of Truth** - Nhìn vào config → biết ngay impact đến:
- `/system/modules/*` (config page)
- `/admin/*` (admin pages)  
- `/(site)/*` (frontend)

---

## Phase 1: Core Infrastructure (Tạo mới)

### 1.1 `lib/modules/define-module.ts`
- Factory function `defineModule()`
- Types: `ModuleDefinition`, `ModuleFeature`, `ModuleSetting`
- Convention auto-link: `enableXxx` → field `xxx`

### 1.2 `lib/modules/hooks/useModuleConfig.ts`
- Fetch: features, fields, categoryFields, settings từ DB
- State management với change detection
- Batch save với Promise.all()

### 1.3 `components/modules/ModuleConfigPage.tsx`
- Generic component thay thế 400-900 dòng code
- Tabs: Config | Data | Appearance
- Tái sử dụng shared components đã có

---

## Phase 2: Module Configs (1 file/module)

### Files cần tạo:
```
lib/modules/configs/
├── posts.config.ts      # cyan, postCategories
├── products.config.ts   # orange, productCategories
├── comments.config.ts   # violet
├── services.config.ts   # emerald
└── ... (các module khác)
```

### Mỗi config ~20-40 dòng:
```typescript
export const postsModule = defineModule({
  key: 'posts',
  name: 'Bài viết',
  icon: FileText,
  color: 'cyan',
  categoryModuleKey: 'postCategories',
  features: [
    { key: 'enableTags', label: 'Tags', icon: Tag },
    { key: 'enableFeatured', label: 'Nổi bật', icon: Star },
  ],
  settings: [
    { key: 'postsPerPage', type: 'number', default: 10 },
    { key: 'defaultStatus', type: 'select', default: 'draft' },
  ],
});
```

---

## Phase 3: Refactor System Pages

### Thay thế từ 600+ dòng → 5 dòng:
```typescript
// app/system/modules/posts/page.tsx
import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { postsModule } from '@/lib/modules/configs/posts.config';

export default function PostsModulePage() {
  return <ModuleConfigPage config={postsModule} />;
}
```

### Modules ưu tiên refactor:
1. `comments` (đơn giản nhất, ~400 dòng)
2. `posts` (~600 dòng, có Appearance tab)
3. `products` (~900 dòng, phức tạp nhất)

---

## Phase 4: Đảm bảo Impact Chain

### Config → System
- ✅ Đã xử lý bởi `ModuleConfigPage`

### Config → Admin
- Admin pages đã đọc `listEnabledModuleFields`, `listModuleSettings`
- Không cần thay đổi, tự động hoạt động

### Config → Frontend
- Frontend đã đọc `listEnabledModuleFields`, `settings`
- Không cần thay đổi, tự động hoạt động

---

## Deliverables

| File | Dòng code | Mô tả |
|------|-----------|-------|
| `lib/modules/define-module.ts` | ~60 | Factory + types |
| `lib/modules/hooks/useModuleConfig.ts` | ~200 | State + save logic |
| `components/modules/ModuleConfigPage.tsx` | ~250 | Generic component |
| `lib/modules/configs/*.config.ts` | ~30/module | Module configs |
| Refactored pages | ~5/module | System pages |

**Tổng: ~500 dòng shared + ~30 dòng/module**

---

## Timeline ước tính

- Phase 1: ~1-2 giờ
- Phase 2: ~30 phút (tạo configs)
- Phase 3: ~1 giờ (refactor 3 modules chính)
- Phase 4: Test & verify

**Tổng: ~3-4 giờ**

## Implementation Plan - QA Experiences Search

### Tổng quan
Fix 13 QA tickets cho `/system/experiences/search` để đạt parity với các experience khác (posts-list, products-list).

---

### Nhóm 1: Loading & State (Ticket #9)
**File:** `app/system/experiences/search/page.tsx`

- Sửa `isLoading` để chờ đầy đủ module queries:
```typescript
const isLoading = experienceSetting === undefined 
  || postsModule === undefined 
  || productsModule === undefined 
  || servicesModule === undefined;
```

---

### Nhóm 2: Dark Mode & UI (Tickets #13)
**File:** `app/system/experiences/search/page.tsx`

- Thêm dark mode class cho tiêu đề h1:
```tsx
<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
```

---

### Nhóm 3: Preview brandColor (Ticket #5)
**File:** `app/system/experiences/search/page.tsx`

- Query `site_brand_color` setting và dùng cho preview:
```typescript
const brandColorSetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
const brandColor = (brandColorSetting?.value as string) || '#14b8a6';
// ... trong SearchFilterPreview:
brandColor={brandColor}
```

---

### Nhóm 4: Hook useSearchFilterConfig (Tickets #11, #12)
**File:** `lib/experiences/useSiteConfig.ts`

- Thêm hook mới:
```typescript
type SearchFilterConfig = {
  layoutStyle: 'search-only' | 'with-filters' | 'advanced';
  resultsDisplayStyle: 'grid' | 'list';
  showFilters: boolean;
  showSorting: boolean;
  showResultCount: boolean;
};

export function useSearchFilterConfig(): SearchFilterConfig { ... }
```

**File:** `lib/experiences/index.ts`
- Export hook mới: `useSearchFilterConfig`

---

### Nhóm 5: Example Links & Site Route (Tickets #1, #6, #7)
**Lựa chọn cần user quyết định:**

**Option A: Không tạo trang search site**
- Thêm note giải thích trong UI: "Tính năng search sẽ áp dụng vào các trang list (posts, products, services)"
- Không thêm ExampleLinks

**Option B: Tạo trang search site mới**
- Tạo `app/(site)/search/page.tsx` với unified search
- Thêm ExampleLinks đến `/search`
- Link vào homepage nếu cần

---

### Nhóm 6: Module Status & Disable Toggle (Tickets #2, #3, #8)
**File:** `app/system/experiences/search/page.tsx`

- Import và sử dụng `ModuleFeatureStatus` component
- Thêm `disabled` prop cho các toggle theo module enabled status:
```tsx
<ToggleRow 
  label="Filters" 
  checked={currentLayoutConfig.showFilters} 
  onChange={(v) => updateLayoutConfig('showFilters', v)} 
  disabled={!postsModule?.enabled && !productsModule?.enabled && !servicesModule?.enabled}
/>
```
- Thêm ModuleFeatureStatus cho từng module liên quan

---

### Nhóm 7: Pagination Config (Ticket #4)
**Cần user quyết định:**

**Option A: Không cần pagination cho search**
- Search results dùng infinite scroll mặc định, không cần config

**Option B: Thêm pagination config**
- Thêm `paginationType` và `postsPerPage` vào config giống products-list

---

### Nhóm 8: Legacy Keys Sync (Ticket #10)
**Phân tích:** Search experience mới, chưa có legacy keys -> **Không cần migrate**

---

### Summary Tasks
| # | Ticket | Priority | Effort |
|---|--------|----------|--------|
| 1 | Loading state (#9) | High | Low |
| 2 | Dark mode (#13) | Low | Low |
| 3 | brandColor preview (#5) | Medium | Low |
| 4 | useSearchFilterConfig (#11, #12) | Medium | Medium |
| 5 | Example Links/Site route (#1, #6, #7) | **Cần confirm** | Medium-High |
| 6 | Module status/disable (#2, #3, #8) | High | Medium |
| 7 | Pagination config (#4) | **Cần confirm** | Medium |
| 8 | Legacy keys (#10) | Low | None |

---

### Câu hỏi cần confirm trước khi implement:
1. **Có tạo trang `/search` site không?** (Tickets #1, #6, #7)
2. **Search có cần pagination config không?** (Ticket #4)
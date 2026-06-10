## Tổng quan

Cải tiến trang `/system/experiences/menu` để:
1. Search phụ thuộc vào module (posts, products, services) có bật hay không
2. Thêm **Search dịch vụ** (thiếu hiện tại)
3. Search ngoài site có **autocomplete** với gợi ý, ảnh và tên

---

## Thay đổi cần làm

### 1. Convex API - Tạo query search gợi ý (unified)

**File**: `convex/search.ts` (mới)

```ts
// Unified autocomplete search cho frontend
export const autocomplete = query({
  args: {
    query: v.string(),
    searchPosts: v.boolean(),
    searchProducts: v.boolean(),
    searchServices: v.boolean(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Search %LIKE%, không phân biệt hoa/thường, có dấu/không dấu
    // Trả về max 5 items mỗi loại với: id, title, thumbnail, type, url
  }
});
```

### 2. Experience Editor (page.tsx)

**Thêm query services module:**
```ts
const servicesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'services' });
```

**Mở rộng config type:**
```ts
search: {
  show: boolean;
  placeholder: string;
  searchProducts: boolean;  // phụ thuộc productsModule
  searchPosts: boolean;     // phụ thuộc postsModule
  searchServices: boolean;  // MỚI - phụ thuộc servicesModule
}
```

**Thêm toggle trong ControlCard "Topbar & Search":**
```tsx
<ToggleRow
  label="Search dịch vụ"
  checked={config.search.searchServices}
  onChange={(v) => updateSearch('searchServices', v)}
  disabled={!servicesModule?.enabled || !config.search.show}
/>
```

**Thêm Module link:**
```tsx
<ExperienceModuleLink
  enabled={servicesModule?.enabled ?? false}
  href="/system/modules/services"
  icon={Briefcase}
  title="Dịch vụ"
  colorScheme="teal"
/>
```

### 3. HeaderMenuPreview - Thêm searchServices prop

Cập nhật type và truyền props tương ứng.

### 4. Frontend Header Component

**File**: `components/site/Header.tsx`

Thay input search tĩnh bằng component `HeaderSearchAutocomplete`:

```tsx
<HeaderSearchAutocomplete
  placeholder={config.search.placeholder}
  searchProducts={productsEnabled && config.search.searchProducts}
  searchPosts={postsEnabled && config.search.searchPosts}
  searchServices={servicesEnabled && config.search.searchServices}
  brandColor={brandColor}
/>
```

### 5. Component HeaderSearchAutocomplete (mới)

**File**: `components/site/HeaderSearchAutocomplete.tsx`

Features:
- Debounce input 300ms
- Gọi `api.search.autocomplete`
- Dropdown hiển thị gợi ý với ảnh + tên, nhóm theo loại (Sản phẩm, Bài viết, Dịch vụ)
- Click vào item → navigate đến trang chi tiết
- Enter → navigate đến `/search?q=...`
- Normalize text: bỏ dấu, lowercase để so sánh %LIKE%

---

## Search Logic (Backend)

```ts
// Normalize để search không dấu
function normalize(str: string): string {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Filter LIKE%
const normalizedQuery = normalize(args.query);
items.filter(item => 
  normalize(item.title).includes(normalizedQuery)
)
```

---

## Checklist CoC

- [x] Search phụ thuộc module (1-way)
- [x] Toggle disabled khi module tắt
- [x] Có link đến module tương ứng
- [x] Services module được thêm đầy đủ
- [x] Autocomplete với ảnh + tên
- [x] Search không phân biệt hoa/thường, có dấu/không dấu

---

## Files thay đổi

| File | Action |
|------|--------|
| `convex/search.ts` | Tạo mới |
| `app/system/experiences/menu/page.tsx` | Update |
| `components/experiences/previews/HeaderMenuPreview.tsx` | Update |
| `components/site/Header.tsx` | Update |
| `components/site/HeaderSearchAutocomplete.tsx` | Tạo mới |

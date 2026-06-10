# Spec: Cascading Dropdown Pattern cho Menu URL Picker

## Audit Summary

**Hiện tại:** Dialog gợi ý đơn giản với search + grouped list (Trang cơ bản / Module / Danh mục), chỉ hỗ trợ list pages.

**Vấn đề:**
1. Không tìm được bài viết/sản phẩm/dịch vụ chi tiết (detail pages)
2. Search 1 bước → khó tìm khi có nhiều items
3. Không có visual hierarchy rõ ràng

**Evidence:**
- File `app/admin/menus/page.tsx` line 60-80: `MODULE_SITE_ROUTE_CATALOG` chỉ có list URLs
- Line 120-150: `quickRouteOptions` build từ categories nhưng không có detail items
- Convex queries: `products.ts`, `posts.ts`, `services.ts` đều có `getBySlug` và `listPublishedWithOffset` → có thể query detail items

## Root Cause Confidence: High (95%)

**Root Cause:** Thiết kế ban đầu chỉ target static routes + category filters, không có mechanism để search/select individual items.

**Counter-Hypothesis đã loại trừ:**
- ❌ Performance issue: Convex queries có limit 20-100 items → OK cho dropdown
- ❌ UX complexity: Cascading pattern là standard (country→state→city)
- ❌ Data availability: Convex đã có queries sẵn (`listPublishedWithOffset`, `getBySlug`)

## Implementation Plan

### Step 1: Tạo Convex queries mới cho menu picker

**File:** `convex/menus.ts` (thêm vào cuối file)

```typescript
// Menu picker queries - lightweight for dropdown
export const listPostsForPicker = query({
  args: { 
    search: v.optional(v.string()),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
    
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return posts
        .filter(p => p.title.toLowerCase().includes(searchLower))
        .map(p => ({ _id: p._id, title: p.title, slug: p.slug }));
    }
    
    return posts.map(p => ({ _id: p._id, title: p.title, slug: p.slug }));
  },
  returns: v.array(v.object({
    _id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
  })),
});

export const listProductsForPicker = query({
  args: { 
    search: v.optional(v.string()),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const products = await ctx.db
      .query("products")
      .withIndex("by_status_order", (q) => q.eq("status", "Active"))
      .order("desc")
      .take(limit);
    
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return products
        .filter(p => p.name.toLowerCase().includes(searchLower))
        .map(p => ({ _id: p._id, name: p.name, slug: p.slug }));
    }
    
    return products.map(p => ({ _id: p._id, name: p.name, slug: p.slug }));
  },
  returns: v.array(v.object({
    _id: v.id("products"),
    name: v.string(),
    slug: v.string(),
  })),
});

export const listServicesForPicker = query({
  args: { 
    search: v.optional(v.string()),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const services = await ctx.db
      .query("services")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
    
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase();
      return services
        .filter(s => s.title.toLowerCase().includes(searchLower))
        .map(s => ({ _id: s._id, title: s.title, slug: s.slug }));
    }
    
    return services.map(s => ({ _id: s._id, title: s.title, slug: s.slug }));
  },
  returns: v.array(v.object({
    _id: v.id("services"),
    title: v.string(),
    slug: v.string(),
  })),
});
```

**Lý do:** Queries riêng cho picker → lightweight (chỉ lấy id, title, slug), không load full content.

---

### Step 2: Refactor Quick Picker Dialog thành Cascading Dropdown

**File:** `app/admin/menus/page.tsx`

**Thay đổi state management (line ~140):**

```typescript
// Thêm state cho cascading steps
const [pickerStep, setPickerStep] = useState<1 | 2 | 3>(1);
const [selectedType, setSelectedType] = useState<'core' | 'module' | 'category' | 'detail' | null>(null);
const [selectedModule, setSelectedModule] = useState<'posts' | 'products' | 'services' | null>(null);

// Queries cho detail items
const detailPosts = useQuery(
  api.menus.listPostsForPicker, 
  selectedModule === 'posts' && pickerStep === 3 
    ? { search: quickRouteSearch, limit: 20 } 
    : 'skip'
);
const detailProducts = useQuery(
  api.menus.listProductsForPicker,
  selectedModule === 'products' && pickerStep === 3
    ? { search: quickRouteSearch, limit: 20 }
    : 'skip'
);
const detailServices = useQuery(
  api.menus.listServicesForPicker,
  selectedModule === 'services' && pickerStep === 3
    ? { search: quickRouteSearch, limit: 20 }
    : 'skip'
);
```

**Refactor Dialog content (thay thế phần Dialog hiện tại ~line 600-700):**

```typescript
<Dialog open={isQuickPickerOpen} onOpenChange={(open) => {
  if (!open) {
    handleCloseQuickPicker();
    setPickerStep(1);
    setSelectedType(null);
    setSelectedModule(null);
  } else {
    setIsQuickPickerOpen(true);
  }
}}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>
        Chọn URL - Bước {pickerStep}/3
      </DialogTitle>
    </DialogHeader>
    
    {/* Search box - filter tất cả steps */}
    <Input
      value={quickRouteSearch}
      onChange={(e) => setQuickRouteSearch(e.target.value)}
      placeholder={
        pickerStep === 1 ? "Tìm theo loại..." :
        pickerStep === 2 ? "Tìm module..." :
        "Tìm theo tên..."
      }
      className="h-9"
    />

    <div className="space-y-2">
      {/* Step 1: Chọn loại */}
      {pickerStep === 1 && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              setSelectedType('core');
              setPickerStep(2);
            }}
          >
            <span className="font-semibold">Trang cơ bản</span>
            <span className="text-xs text-slate-500">Trang chủ, Liên hệ...</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              setSelectedType('module');
              setPickerStep(2);
            }}
          >
            <span className="font-semibold">Module</span>
            <span className="text-xs text-slate-500">Posts, Products, Services...</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              setSelectedType('category');
              setPickerStep(2);
            }}
          >
            <span className="font-semibold">Danh mục</span>
            <span className="text-xs text-slate-500">Category filters</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              setSelectedType('detail');
              setPickerStep(2);
            }}
          >
            <span className="font-semibold">Chi tiết</span>
            <span className="text-xs text-slate-500">Bài viết, Sản phẩm, Dịch vụ</span>
          </Button>
        </div>
      )}

      {/* Step 2: Chọn module (nếu type = detail) hoặc chọn item */}
      {pickerStep === 2 && selectedType === 'detail' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPickerStep(1);
              setSelectedType(null);
            }}
          >
            ← Quay lại
          </Button>
          
          <div className="grid grid-cols-1 gap-2">
            {enabledModules?.some(m => m.key === 'posts') && (
              <Button
                variant="outline"
                className="justify-start h-16"
                onClick={() => {
                  setSelectedModule('posts');
                  setPickerStep(3);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Bài viết chi tiết</div>
                  <div className="text-xs text-slate-500">Chọn 1 bài viết cụ thể</div>
                </div>
              </Button>
            )}
            
            {enabledModules?.some(m => m.key === 'products') && (
              <Button
                variant="outline"
                className="justify-start h-16"
                onClick={() => {
                  setSelectedModule('products');
                  setPickerStep(3);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Sản phẩm chi tiết</div>
                  <div className="text-xs text-slate-500">Chọn 1 sản phẩm cụ thể</div>
                </div>
              </Button>
            )}
            
            {enabledModules?.some(m => m.key === 'services') && (
              <Button
                variant="outline"
                className="justify-start h-16"
                onClick={() => {
                  setSelectedModule('services');
                  setPickerStep(3);
                }}
              >
                <div className="text-left">
                  <div className="font-semibold">Dịch vụ chi tiết</div>
                  <div className="text-xs text-slate-500">Chọn 1 dịch vụ cụ thể</div>
                </div>
              </Button>
            )}
          </div>
        </>
      )}

      {/* Step 2: Hiển thị options cho core/module/category */}
      {pickerStep === 2 && selectedType !== 'detail' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPickerStep(1);
              setSelectedType(null);
            }}
          >
            ← Quay lại
          </Button>
          
          <div className="max-h-[50vh] overflow-auto space-y-1">
            {filteredQuickRoutes
              .filter(opt => {
                if (selectedType === 'core') return opt.group === 'Trang cơ bản';
                if (selectedType === 'module') return opt.group === 'Module';
                if (selectedType === 'category') return opt.group === 'Danh mục';
                return false;
              })
              .map(option => (
                <button
                  key={`${option.url}-${option.source}`}
                  type="button"
                  onClick={() => handleSelectQuickRoute(option)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {option.label}
                    </div>
                    <div className="text-xs text-slate-500 font-mono truncate">
                      {option.url}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}

      {/* Step 3: Chọn detail item */}
      {pickerStep === 3 && selectedModule && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPickerStep(2);
              setSelectedModule(null);
            }}
          >
            ← Quay lại
          </Button>
          
          <div className="max-h-[50vh] overflow-auto space-y-1">
            {selectedModule === 'posts' && detailPosts?.map(post => (
              <button
                key={post._id}
                type="button"
                onClick={() => {
                  handleSelectQuickRoute({
                    label: post.title,
                    url: `/posts/${post.slug}`,
                    source: 'posts',
                    group: 'Danh mục',
                  });
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-700 truncate">
                    {post.title}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    /posts/{post.slug}
                  </div>
                </div>
              </button>
            ))}
            
            {selectedModule === 'products' && detailProducts?.map(product => (
              <button
                key={product._id}
                type="button"
                onClick={() => {
                  handleSelectQuickRoute({
                    label: product.name,
                    url: `/products/${product.slug}`,
                    source: 'products',
                    group: 'Danh mục',
                  });
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-700 truncate">
                    {product.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    /products/{product.slug}
                  </div>
                </div>
              </button>
            ))}
            
            {selectedModule === 'services' && detailServices?.map(service => (
              <button
                key={service._id}
                type="button"
                onClick={() => {
                  handleSelectQuickRoute({
                    label: service.title,
                    url: `/services/${service.slug}`,
                    source: 'services',
                    group: 'Danh mục',
                  });
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-700 truncate">
                    {service.title}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    /services/{service.slug}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  </DialogContent>
</Dialog>
```

**Lý do refactor:**
- Step 1: Chọn loại (4 options rõ ràng)
- Step 2: Chọn module (nếu detail) hoặc chọn item (nếu core/module/category)
- Step 3: Chọn detail item với search real-time
- Search box filter tất cả steps (theo user request)
- Back button ở mỗi step → dễ navigate

---

### Step 3: Update helper functions

**File:** `app/admin/menus/page.tsx` (line ~200)

```typescript
const handleCloseQuickPicker = () => {
  setIsQuickPickerOpen(false);
  setQuickPickerTargetId(null);
  setQuickRouteSearch('');
  setPickerStep(1);
  setSelectedType(null);
  setSelectedModule(null);
};
```

---

## Verification Plan

### Typecheck
```bash
bunx tsc --noEmit
```

### Manual Testing Checklist
1. ✅ Mở menu editor → click "Gợi ý" button
2. ✅ Step 1: Thấy 4 options (Trang cơ bản, Module, Danh mục, Chi tiết)
3. ✅ Chọn "Chi tiết" → Step 2: Thấy Posts/Products/Services
4. ✅ Chọn "Bài viết chi tiết" → Step 3: Thấy list 20 posts
5. ✅ Search box filter posts real-time
6. ✅ Click 1 post → URL field điền `/posts/slug-bai-viet`
7. ✅ Label field điền title bài viết
8. ✅ Back button hoạt động đúng
9. ✅ Chọn "Trang cơ bản" → thấy Trang chủ, Liên hệ (như cũ)
10. ✅ Lưu menu → preview hiển thị đúng

### Edge Cases
- Empty state: Nếu không có posts → hiển thị "Chưa có bài viết"
- Loading state: Hiển thị Loader2 khi query đang load
- Search không match → hiển thị "Không tìm thấy"

---

## Tradeoffs & Decisions

**Decision 1: Limit 20 items ở step 3**
- ✅ Pro: Fast query, đủ cho most cases
- ⚠️ Con: Nếu có >20 items, user phải search
- Mitigation: Search box filter real-time

**Decision 2: Search ở step 1 (filter cả 3 steps)**
- ✅ Pro: Flexible, user có thể search ngay
- ⚠️ Con: Phức tạp hơn implementation
- Mitigation: Search chỉ filter options hiện tại, không cross-step

**Decision 3: Full path URL format**
- ✅ Pro: Rõ ràng, user thấy ngay full URL
- ✅ Pro: Consistent với existing routes
- ⚠️ Con: Nếu đổi route structure phải update manual
- Mitigation: Document rõ URL format

---

## Files Changed

1. `convex/menus.ts` - Thêm 3 queries mới (~60 lines)
2. `app/admin/menus/page.tsx` - Refactor Dialog (~200 lines changed)

**Total LOC:** ~260 lines (mostly UI refactor)

**Estimated time:** 1-2 hours implementation + 30 mins testing
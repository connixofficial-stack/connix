# Spec: Fix UX nút Lưu và Link Edit cho Home Components

## Vấn đề

### 1. Vị trí nút Lưu không nhất quán
- **Create pages**: Nút "Tạo Component" nằm `flex justify-end gap-3` (phải màn hình) ✅
- **Edit pages**: Nút "Lưu thay đổi" nằm lẻ trong grid layout, cách xa form ❌

### 2. Link edit ở list page gây redirect không cần thiết
- List page dùng `?type=stats` cho non-Hero components → khi click vào edit, URL bị redirect từ `/admin/home-components/{id}/edit?type=stats` → `/admin/home-components/stats/{id}/edit`
- Gây flicker + URL thay đổi phiền toái

### 3. Sau khi lưu bị redirect về list page
- User mất context đang edit, phải tìm lại component để edit tiếp

## Giải pháp

### Fix 1: Đồng bộ layout nút Lưu giống Create pages

**Pattern chuẩn (học từ ComponentFormWrapper):**
```tsx
<div className="flex justify-end gap-3 mt-6">
  <Button 
    type="button" 
    variant="ghost" 
    onClick={() => router.push('/admin/home-components')}
    disabled={isSubmitting}
  >
    Hủy bỏ
  </Button>
  <Button type="submit" variant="accent" disabled={isSubmitting}>
    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
  </Button>
</div>
```

**Áp dụng cho 30 edit pages:**

Tìm pattern hiện tại:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
  <div>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
    </Button>
  </div>
  <div className="lg:sticky lg:top-6 lg:self-start">
    <Preview ... />
  </div>
</div>
```

Thay thành:
```tsx
{/* Nút Lưu - giống Create pages */}
<div className="flex justify-end gap-3 mt-6">
  <Button 
    type="button" 
    variant="ghost" 
    onClick={() => router.push('/admin/home-components')}
    disabled={isSubmitting}
  >
    Hủy bỏ
  </Button>
  <Button type="submit" variant="accent" disabled={isSubmitting}>
    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
  </Button>
</div>

{/* Preview nếu có */}
{/* Một số components có Preview sticky, giữ nguyên */}
<div className="lg:sticky lg:top-6 lg:self-start mt-6">
  <Preview ... />
</div>
```

**Lưu ý đặc biệt:**
- Một số components (Hero, Stats, ProductList...) có Preview sticky → giữ lại Preview, chỉ move nút Lưu ra ngoài grid
- Một số components không có Preview → chỉ cần thêm nút Lưu pattern mới

### Fix 2: Sửa link edit ở list page để trỏ đúng route ngay

**File: `app/admin/home-components/page.tsx`**

**Line 106 - TỪ:**
```tsx
<Link href={comp.type === 'Hero' 
  ? `/admin/home-components/hero/${comp._id}/edit` 
  : `/admin/home-components/${comp._id}/edit?type=${comp.type.toLowerCase()}`}>
```

**THÀNH:**
```tsx
<Link href={getEditRoute(comp.type, comp._id)}>
```

**Thêm helper function (trước component HomeComponentsPage):**
```tsx
// Map component type to correct edit route
function getEditRoute(type: string, id: string): string {
  const typeRoutes: Record<string, string> = {
    'Hero': 'hero',
    'Stats': 'stats',
    'ProductList': 'product-list',
    'ProductGrid': 'product-grid',
    'ServiceList': 'service-list',
    'Blog': 'blog',
    'Partners': 'partners',
    'CTA': 'cta',
    'FAQ': 'faq',
    'About': 'about',
    'Footer': 'footer',
    'Services': 'services',
    'Benefits': 'benefits',
    'Testimonials': 'testimonials',
    'TrustBadges': 'gallery',
    'Pricing': 'pricing',
    'Gallery': 'gallery',
    'CaseStudy': 'case-study',
    'Career': 'career',
    'Contact': 'contact',
    'ProductCategories': 'product-categories',
    'SpeedDial': 'speed-dial',
    'Team': 'team',
    'Video': 'video',
    'Process': 'process',
    'Countdown': 'countdown',
    'CategoryProducts': 'category-products',
    'Clients': 'clients',
    'VoucherPromotions': 'voucher-promotions',
  };

  const route = typeRoutes[type] || type.toLowerCase();
  return `/admin/home-components/${route}/${id}/edit`;
}
```

### Fix 3: Không redirect sau khi lưu (ở lại trang edit)

**Áp dụng cho tất cả 30 edit pages:**

**TỪ:**
```tsx
toast.success('Đã cập nhật Hero Banner');
router.push('/admin/home-components');
```

**THÀNH:**
```tsx
toast.success('Đã cập nhật Hero Banner');
// Không có router.push() - ở lại trang edit
```

## Files cần sửa (31 files)

### 1. List page (1 file)
- `app/admin/home-components/page.tsx`
  - Thêm helper `getEditRoute()`
  - Sửa Link edit ở line 106

### 2. Edit pages (30 files)
Tất cả files dưới đây cần 2 thay đổi:
- **Layout nút Lưu**: Đổi thành `flex justify-end gap-3` + thêm nút Hủy bỏ
- **Xóa redirect**: Bỏ dòng `router.push('/admin/home-components')` trong handleSubmit

**Danh sách files:**
1. `app/admin/home-components/hero/[id]/edit/page.tsx`
2. `app/admin/home-components/stats/[id]/edit/page.tsx`
3. `app/admin/home-components/product-list/[id]/edit/page.tsx`
4. `app/admin/home-components/product-grid/[id]/edit/page.tsx`
5. `app/admin/home-components/service-list/[id]/edit/page.tsx`
6. `app/admin/home-components/blog/[id]/edit/page.tsx`
7. `app/admin/home-components/partners/[id]/edit/page.tsx`
8. `app/admin/home-components/cta/[id]/edit/page.tsx`
9. `app/admin/home-components/faq/[id]/edit/page.tsx`
10. `app/admin/home-components/about/[id]/edit/page.tsx`
11. `app/admin/home-components/footer/[id]/edit/page.tsx`
12. `app/admin/home-components/services/[id]/edit/page.tsx`
13. `app/admin/home-components/benefits/[id]/edit/page.tsx`
14. `app/admin/home-components/testimonials/[id]/edit/page.tsx`
15. `app/admin/home-components/pricing/[id]/edit/page.tsx`
16. `app/admin/home-components/gallery/[id]/edit/page.tsx`
17. `app/admin/home-components/case-study/[id]/edit/page.tsx`
18. `app/admin/home-components/career/[id]/edit/page.tsx`
19. `app/admin/home-components/contact/[id]/edit/page.tsx`
20. `app/admin/home-components/product-categories/[id]/edit/page.tsx`
21. `app/admin/home-components/speed-dial/[id]/edit/page.tsx`
22. `app/admin/home-components/team/[id]/edit/page.tsx`
23. `app/admin/home-components/video/[id]/edit/page.tsx`
24. `app/admin/home-components/process/[id]/edit/page.tsx`
25. `app/admin/home-components/countdown/[id]/edit/page.tsx`
26. `app/admin/home-components/category-products/[id]/edit/page.tsx`
27. `app/admin/home-components/clients/[id]/edit/page.tsx`
28. `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx`
29. `app/admin/home-components/features/[id]/edit/page.tsx`
30. `app/admin/home-components/[id]/edit/page.tsx` (legacy fallback - giữ nguyên redirect logic, chỉ fix nút Lưu)

## Chi tiết thay đổi cho từng edit page

### Pattern A: Components có Preview sticky (Hero, Stats, ProductList, ProductGrid, ServiceList, Blog, Partners, CTA, Features, Pricing, Testimonials, Team, FAQ, Process, Countdown, Footer, CaseStudy, CategoryProducts, Contact, Clients, Career, Benefits, About, VoucherPromotions, ProductCategories, Gallery, Video, SpeedDial)

**TỪ:**
```tsx
<FooForm ... />

<div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
  <div>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
    </Button>
  </div>
  <div className="lg:sticky lg:top-6 lg:self-start">
    <FooPreview ... />
  </div>
</div>
```

**THÀNH:**
```tsx
<FooForm ... />

{/* Nút Lưu */}
<div className="flex justify-end gap-3 mt-6">
  <Button 
    type="button" 
    variant="ghost" 
    onClick={() => router.push('/admin/home-components')}
    disabled={isSubmitting}
  >
    Hủy bỏ
  </Button>
  <Button type="submit" variant="accent" disabled={isSubmitting}>
    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
  </Button>
</div>

{/* Preview */}
<div className="lg:sticky lg:top-6 lg:self-start mt-6">
  <FooPreview ... />
</div>
```

**Và trong handleSubmit, XÓA:**
```tsx
router.push('/admin/home-components');
```

## Kết quả mong đợi

✅ Nút Lưu ở edit giống y hệt create (vị trí, style, có nút Hủy bỏ)  
✅ Click edit từ list page → URL đúng ngay, không redirect  
✅ Lưu thành công → ở lại trang edit, không bị đá về list  
✅ UX mượt mà, nhất quán giữa Create và Edit
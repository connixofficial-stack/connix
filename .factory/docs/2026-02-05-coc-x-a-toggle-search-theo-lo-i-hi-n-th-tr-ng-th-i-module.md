## Vấn đề

Hiện tại có 3 toggle trong "Topbar & Search":
- Search sản phẩm
- Search bài viết
- Search dịch vụ

User muốn áp dụng **Convention over Configuration (CoC)**: Search tự động dựa trên module bật/tắt, không cần toggle riêng.

## Giải pháp

**File:** `app/system/experiences/menu/page.tsx`

### 1. Xóa 3 toggle Search
```tsx
// XÓA các dòng này (lines 353-373):
<ToggleRow label="Search sản phẩm" ... />
<ToggleRow label="Search bài viết" ... />
<ToggleRow label="Search dịch vụ" ... />
```

### 2. Thay bằng UI hiển thị trạng thái module (giống Login)
Thêm vào ControlCard "Topbar & Search" hoặc tạo section riêng:

```tsx
{config.search.show && (
  <div className="mt-2 space-y-1">
    <p className="text-xs font-medium text-slate-500">Search theo module:</p>
    <ModuleFeatureStatus
      label="Sản phẩm"
      enabled={productsModule?.enabled ?? false}
      href="/system/modules/products"
      moduleName="Module Sản phẩm"
    />
    <ModuleFeatureStatus
      label="Bài viết"
      enabled={postsModule?.enabled ?? false}
      href="/system/modules/posts"
      moduleName="Module Bài viết"
    />
    <ModuleFeatureStatus
      label="Dịch vụ"
      enabled={servicesModule?.enabled ?? false}
      href="/system/modules/services"
      moduleName="Module Dịch vụ"
    />
  </div>
)}
```

### 3. Xóa fields khỏi DEFAULT_CONFIG
```tsx
// Trước
search: { placeholder: '...', searchPosts: true, searchProducts: true, searchServices: true, show: true }

// Sau
search: { placeholder: '...', show: true }
```

**Lưu ý:** Header.tsx site thực đã có logic check module enabled nên không cần sửa gì.
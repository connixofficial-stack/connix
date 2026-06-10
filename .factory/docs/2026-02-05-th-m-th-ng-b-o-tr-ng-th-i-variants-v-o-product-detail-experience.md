## Tổng quan

Thêm UI hiển thị trạng thái tính năng "Phiên bản sản phẩm" trong Experience Editor `/system/experiences/product-detail`, với UX rõ ràng hướng dẫn người dùng đến Module Products nếu muốn tắt.

---

## Thiết kế UX

### Khi Variants **đang bật** (ở Module Products):

```
┌─────────────────────────────────────────┐
│ ✓ Phiên bản sản phẩm                    │
│   Đang bật · Quản lý tại Module Products│
│                              [Đi đến →] │
└─────────────────────────────────────────┘
```

- Badge màu xanh "Đang bật"
- Text mô tả ngắn
- Link "Đi đến" → `/system/modules/products`

### Khi Variants **đang tắt** (ở Module Products):

```
┌─────────────────────────────────────────┐
│ ○ Phiên bản sản phẩm                    │
│   Chưa bật · Bật tại Module Products    │
│                              [Đi đến →] │
└─────────────────────────────────────────┘
```

- Badge màu slate "Chưa bật"
- Link hướng dẫn bật tính năng

---

## Vị trí đặt UI

Đặt trong **ControlCard "Khối hiển thị"** hoặc tạo riêng một row info:

```tsx
// Trong ControlCard "Khối hiển thị", thêm sau các ToggleRow
<VariantFeatureStatus 
  enabled={variantsFeatureEnabled} 
  moduleHref="/system/modules/products"
/>
```

---

## Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `app/system/experiences/product-detail/page.tsx` | Query feature variants từ Module, thêm UI status |
| `components/experiences/previews/ProductDetailPreview.tsx` | Ẩn `VariantPreview` khi feature tắt |

---

## Chi tiết implementation

### 1. Query feature status

```tsx
// Trong ProductDetailExperiencePage
const variantsFeature = useQuery(
  api.admin.modules.getModuleFeature, 
  { moduleKey: 'products', featureKey: 'enableVariants' }
);
const variantsEnabled = variantsFeature?.enabled ?? false;
```

### 2. Component hiển thị status

```tsx
function VariantFeatureRow({ enabled, href }: { enabled: boolean; href: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Phiên bản sản phẩm
          </p>
          <p className="text-xs text-slate-500">
            {enabled ? 'Đang bật' : 'Chưa bật'} · Quản lý tại Module Products
          </p>
        </div>
      </div>
      <Link href={href} className="text-xs text-cyan-600 hover:underline">
        Đi đến →
      </Link>
    </div>
  );
}
```

### 3. Cập nhật Preview

```tsx
// ProductDetailPreview.tsx
<VariantPreview brandColor={brandColor} />
// Thay thành:
{showVariants && <VariantPreview brandColor={brandColor} />}
```

---

## Ước tính

- **~40-60 dòng code**
- **2 files thay đổi**
- Không ảnh hưởng logic hiện có
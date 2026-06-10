## Spec: Thêm nút "Xem trên web" vào trang Edit Product

### Vị trí
Trong header của trang edit (`app/admin/products/[id]/edit/page.tsx`), cạnh nút "Quản lý phiên bản" (nếu có).

### Thay đổi

**File:** `app/admin/products/[id]/edit/page.tsx`

1. Import thêm `ExternalLink` từ `lucide-react`

2. Thêm nút bên cạnh "Quản lý phiên bản" trong header:
```tsx
<div className="flex justify-between items-center">
  <div>
    <h1>Chỉnh sửa sản phẩm</h1>
    <Link href="/admin/products">Quay lại danh sách</Link>
  </div>
  <div className="flex gap-2">
    {/* Nút mới */}
    <Button 
      variant="outline" 
      onClick={() => window.open(`/products/${slug}`, '_blank')}
    >
      <ExternalLink size={16} className="mr-2" />
      Xem trên web
    </Button>
    {variantEnabled && hasVariants && (...)}
  </div>
</div>
```

### Logic
- Dùng `window.open()` mở tab mới với URL `/products/{slug}`
- Theo đúng pattern đã có ở `admin/products/page.tsx`
- Nút luôn hiển thị (không cần điều kiện) vì product đã tồn tại khi đang edit
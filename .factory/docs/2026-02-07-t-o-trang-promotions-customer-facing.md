## Spec: Tạo trang `/promotions` cho khách hàng

### Vấn đề
Hiện chỉ có:
- `/admin/promotions` - Admin CRUD
- `/system/experiences/promotions-list` - Experience editor
- Chưa có `app/(site)/promotions/page.tsx` - Trang customer-facing

### Giải pháp
Tạo `app/(site)/promotions/page.tsx` sử dụng:
- Query `listPublicPromotions` (đã có trong backend)
- Experience config `promotions_list_ui` (đã có)
- UI tương tự preview đã tạo

### Files cần tạo/sửa
1. **Tạo mới**: `app/(site)/promotions/page.tsx`
   - Fetch promotions từ `api.promotions.listPublicPromotions`
   - Đọc experience config từ `api.settings.getByKey({ key: 'promotions_list_ui' })`
   - Hiển thị: grid/list/banner layout, countdown, progress bar, copy mã
   - Group theo promotionType nếu bật
   - Responsive mobile/desktop

### Tham khảo
- Pattern từ `app/(site)/posts/page.tsx` cho pagination/layout
- UI từ `PromotionsListPreview.tsx` cho card design

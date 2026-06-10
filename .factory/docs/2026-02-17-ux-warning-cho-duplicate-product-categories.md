# Spec: Cảnh báo UX khi chọn duplicate Product Categories

## Root Cause đã xác nhận
User chọn duplicate categories trong edit form:
- "Hot Deal" x2 lần
- "Top Rating" x2 lần

→ **Render** có logic deduplicate: `.filter((item, index, arr) => arr.findIndex(i => i.categoryId === item.categoryId) === index)`  
→ 4 items → 2 unique items  
→ **Preview** không có dedupe → hiển thị đủ 4

## Solution: Thêm UX Warnings

### File cần sửa
`app/admin/home-components/product-categories/_components/ProductCategoriesForm.tsx`

### Thay đổi:

1. **Detect duplicates realtime trong form**
   - Khi user select category, kiểm tra `productCategoriesItems` có categoryId trùng không
   - Highlight duplicate items bằng border warning (amber/orange)
   - Hiển thị inline warning text dưới dropdown

2. **Warning banner ở đầu form**
   - Nếu có duplicates, hiển thị banner:
     ```
     ⚠️ Có {count} danh mục bị trùng lặp. Trang chủ chỉ hiển thị mỗi danh mục 1 lần.
     ```
   - Link "Xóa trùng lặp" để auto-remove duplicates

3. **Visual feedback trong Preview**
   - Preview cũng cần hiển thị warning tương ứng để sync với render behavior
   - Có thể thêm badge "Duplicate (sẽ bị loại)" trên các items trùng trong preview

4. **Optional: Prevent duplicate khi select**
   - Disable option trong dropdown nếu đã được chọn
   - Hoặc auto-remove old instance khi chọn lại

## Acceptance Criteria
- ✅ User nhìn thấy ngay khi chọn duplicate category
- ✅ Warning message rõ ràng giải thích behavior
- ✅ Preview phản ánh đúng số lượng sẽ render (deduplicated)
- ✅ Có cách quick-fix (button xóa duplicate)
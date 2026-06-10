## Problem Graph
1. [Main] Quick link ở /admin/menus chưa có link danh mục nên chưa đủ nhanh khi tạo menu theo taxonomy <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Thiếu nguồn dữ liệu danh mục active theo từng module
      1.1.1 [ROOT CAUSE] Chưa query `productCategories.listActive`, `postCategories.listActive`, `serviceCategories.listActive`
   1.2 [Sub] Picker hiện chỉ list phẳng, chưa nhóm rõ nên dễ rối khi thêm nhiều route
      1.2.1 [ROOT CAUSE] Chưa có cấu trúc group: Trang cơ bản / Module / Danh mục
   1.3 [Sub] Cần giữ đúng convention URL để click chạy ngay
      1.3.1 [ROOT CAUSE] Chưa build category URL theo rule hiện tại của từng trang site

## Execution (with reflection)
1. Solving 1.1.1 – Bổ sung dữ liệu danh mục active (chỉ khi module tương ứng bật)
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Thêm 3 query:
    - `useQuery(api.productCategories.listActive)`
    - `useQuery(api.postCategories.listActive, { limit: 100 })`
    - `useQuery(api.serviceCategories.listActive, { limit: 100 })`
  - Dùng `enabledModules` để chỉ đưa danh mục vào option khi module `products/posts/services` đang bật.
- Reflection: ✓ Không đổi schema backend, tận dụng API có sẵn.

2. Solving 1.3.1 – Build URL danh mục đúng convention hiện tại
- File: `app/admin/menus/page.tsx`
- Thay đổi logic mapping route danh mục:
  - Product category: `/products?category={slug}`
  - Post category: `/posts?catpost={slug}`
  - Service category: `/services?category={slug}`
- Mỗi option danh mục gồm: `label`, `url`, `source`, `group`, `keywords`.
- Reflection: ✓ Đúng yêu cầu “click là chạy ngay”, không phá route đang dùng trong site.

3. Solving 1.2.1 – Tổ chức UX picker gọn, không rối
- File: `app/admin/menus/page.tsx`
- Thay đổi UI combobox hiện có:
  - Giữ search chung như hiện tại.
  - Hiển thị theo 3 nhóm rõ ràng:
    - `Trang cơ bản`
    - `Module`
    - `Danh mục`
  - Trong group `Danh mục`, tách nhãn nguồn nhỏ: `products/posts/services`.
  - Giới hạn chiều cao panel + scroll (đang có) giữ UX nhẹ.
  - Empty state rõ ràng khi search không khớp.
- Reflection: ✓ Tăng sức mạnh dữ liệu nhưng vẫn dễ scan và không rối mắt.

4. Guardrails UX
- File: `app/admin/menus/page.tsx`
- Giữ nguyên khả năng nhập URL thủ công; quick picker chỉ hỗ trợ chọn nhanh.
- Deduplicate theo URL để tránh lặp item giữa nguồn module và danh mục.
- Sort trong từng group theo `label` để người dùng đoán vị trí nhanh.

5. Verify + commit theo rule repo
- Chạy `bunx tsc --noEmit`.
- Commit local (không push), add cả `.factory/docs` nếu có.
- Commit message đề xuất:
  - `feat(menus): add category quick links by enabled modules`

## Checklist
- [ ] Query danh mục active cho products/posts/services
- [ ] Chỉ inject danh mục khi module tương ứng bật
- [ ] Tạo URL danh mục đúng convention hiện tại
- [ ] Group picker: Trang cơ bản / Module / Danh mục
- [ ] Giữ editable URL input thủ công
- [ ] `bunx tsc --noEmit`
- [ ] Commit local (kèm .factory/docs)
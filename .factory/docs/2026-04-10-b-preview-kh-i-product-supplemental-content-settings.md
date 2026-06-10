# I. Primer
## 1. TL;DR kiểu Feynman
- Trang cài đặt này đang có một khối **Preview** để mô phỏng nội dung trên sản phẩm thật.
- Yêu cầu của bạn là bỏ hẳn phần này, không chỉ ẩn giao diện mà còn xoá logic/query liên quan.
- Mình sẽ chỉnh **1 file chính**: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`.
- Kết quả mong muốn: trang vẫn tạo/sửa/lưu template bình thường, chỉ mất phần preview.

## 2. Elaboration & Self-Explanation
Hiện tại manager component vừa làm phần form cấu hình template, vừa render thêm preview sản phẩm thật. Để có preview, code đang lấy `products` rồi chọn `products?.[0]` làm mẫu (`previewProduct`) và truyền vào component `ProductSupplementalPreview`.

Khi bỏ preview đúng nghĩa, ta cần:
1) xoá component `ProductSupplementalPreview`,
2) xoá biến `previewProduct`,
3) xoá JSX render preview ở cuối form.

Vì danh sách `products` vẫn cần cho `MultiSelectCombobox` khi assignment mode = `products`, nên query `products` **vẫn phải giữ**. Nghĩa là chỉ xoá logic/query phục vụ preview, không đụng logic query phục vụ cấu hình.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể trong file hiện tại:
  - `const previewProduct = useMemo(() => products?.[0] ?? null, [products]);` → sẽ xoá.
  - Khối `<ProductSupplementalPreview ... />` ở gần cuối render → sẽ xoá.
  - Hàm `function ProductSupplementalPreview(...) { ... }` → sẽ xoá toàn bộ.

- Analogy đời thường: giống như bỏ màn hình “xem thử” trong form thiết kế banner; người dùng vẫn nhập nội dung và bấm lưu như cũ, chỉ không còn khung mô phỏng nữa.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Route `app/admin/settings/product-supplemental-content/page.tsx` chỉ bọc `ProductSupplementalContentManager`.
  - Preview được định nghĩa và render trong `app/admin/settings/_components/ProductSupplementalContentManager.tsx`.
- Evidence:
  - Có `function ProductSupplementalPreview(...)` trong file manager.
  - Có `previewProduct` từ `products?.[0]` và truyền vào `<ProductSupplementalPreview .../>`.
- Decision:
  - Sửa tại manager component, không cần đổi route page.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root cause (High): Preview là feature được implement trực tiếp trong manager nên muốn bỏ phải gỡ cả định nghĩa component + wiring render.
- Counter-hypothesis 1: Preview nằm ở route-level page.
  - Loại trừ: page chỉ gọi `<ProductSupplementalContentManager />`.
- Counter-hypothesis 2: Preview phụ thuộc backend riêng.
  - Loại trừ: preview chỉ dùng dữ liệu đã có (`products`) và render UI, không mutation riêng.

# IV. Proposal (Đề xuất)
- Option A (Recommend) — Confidence 95%
  - Bỏ hẳn preview UI + xoá logic preview trong manager.
  - Tradeoff: Mất khả năng xem trực quan ngay tại trang settings (đúng yêu cầu), đổi lại code gọn hơn, ít rủi ro side-effects.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`
  - Vai trò hiện tại: quản lý CRUD template + render preview sản phẩm thật.
  - Thay đổi: xoá `ProductSupplementalPreview`, xoá `previewProduct`, xoá JSX gọi preview.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại `ProductSupplementalContentManager.tsx` để xác định vùng preview.
2. Xoá function component `ProductSupplementalPreview`.
3. Xoá `useMemo` tạo `previewProduct`.
4. Xoá block JSX `<ProductSupplementalPreview ... />`.
5. Static review nhanh imports/usages để đảm bảo không còn reference thừa.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Vì repo rule cấm chạy lint/test/build thủ công, mình sẽ làm verification tĩnh:
  - Check không còn symbol `ProductSupplementalPreview` và `previewProduct`.
  - Check TypeScript-level consistency bằng đối chiếu usage/import trong file.
  - Repro thủ công kỳ vọng (để tester chạy): vào `/admin/settings/product-supplemental-content`, xác nhận form còn đầy đủ nhưng không còn card preview.

# VIII. Todo
- [ ] Xoá `ProductSupplementalPreview` trong manager.
- [ ] Xoá logic `previewProduct`.
- [ ] Xoá JSX render preview.
- [ ] Rà static các reference/import liên quan.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/admin/settings/product-supplemental-content` không còn hiển thị khối preview.
- Các phần còn lại (templates list, cấu hình template, FAQ, pre/post content, nút lưu/xoá) hoạt động đúng flow hiện tại.
- Không còn reference code chết liên quan preview trong file manager.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: chỉ thay đổi UI wiring trong 1 file.
- Nếu cần hoàn tác: revert commit là về trạng thái cũ ngay.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi backend Convex.
- Không đổi logic apply template cho product/category.
- Không refactor layout/UX khác ngoài việc bỏ preview.
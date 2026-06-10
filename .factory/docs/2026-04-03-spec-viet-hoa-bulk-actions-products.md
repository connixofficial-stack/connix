## Audit Summary
- Observation:
  - Ở bulk actions của `/admin/products`, label hiện đang là `Publish` và `Unpublish`.
  - Đây là microcopy tiếng Anh lẫn trong UI tiếng Việt, chưa đồng bộ với các label khác như `Xóa`, `Bỏ chọn tất cả`, `Trạng thái`.
- Inference:
  - Vấn đề là copy/UI text, không phải logic nghiệp vụ.
- Decision:
  - Chỉ Việt hóa label và loading text của 2 action này, không đổi behavior hay API.

## Root Cause Confidence
- High — vì symptom nằm ngay ở text hiển thị; không có dấu hiệu cần đổi logic backend hoặc flow selection.

## TL;DR kiểu Feynman
- Chỗ nút bulk action đang dùng tiếng Anh.
- Mình sẽ đổi sang tiếng Việt cho đồng bộ UI.
- Chỉ đổi chữ hiển thị.
- Không đổi nghiệp vụ publish/unpublish.

## Files Impacted
- Sửa: `app/admin/components/TableUtilities.tsx`
  - Vai trò hiện tại: render `BulkActionBar` dùng chung cho admin tables.
  - Thay đổi: đổi text `Publish (...)` → `Đăng bán (...)` hoặc `Hiển thị (...)`, và `Unpublish (...)` → `Ẩn khỏi bán (...)` hoặc `Chuyển nháp (...)` theo ngữ nghĩa hiện có; đồng thời đổi loading text tương ứng.

## Recommend
- Option A (Recommend) — Confidence 92%: dùng ngôn ngữ bám đúng status hiện tại của products
  - `Publish` → `Đăng bán`
  - `Unpublish` → `Chuyển nháp`
  - Lý do: backend hiện map `publish -> Active`, `unpublish -> Draft`, nên `Chuyển nháp` chính xác hơn `Ẩn`.
- Option B — Confidence 72%: ưu tiên ngôn ngữ dễ hiểu với người vận hành bán hàng
  - `Publish` → `Hiển thị bán`
  - `Unpublish` → `Ngừng hiển thị`
  - Phù hợp khi muốn microcopy thiên business hơn technical, nhưng kém khớp với status `Draft` ở backend.

## Execution Preview
1. Mở `BulkActionBar` shared component.
2. Đổi label 2 nút và loading text sang tiếng Việt.
3. Rà nhanh để bảo đảm không còn text tiếng Anh cùng ngữ cảnh.
4. Static review và chốt.

## Acceptance Criteria
- Bulk action không còn hiển thị `Publish` hoặc `Unpublish`.
- Text mới đồng bộ với UI tiếng Việt.
- Không thay đổi logic xử lý trạng thái.

## Verification Plan
- Typecheck: không cần nếu chỉ đổi text thuần.
- Manual check cho tester:
  1. Chọn ít nhất 1 sản phẩm ở `/admin/products`.
  2. Bulk bar hiển thị label tiếng Việt.
  3. Khi bấm action, loading text cũng là tiếng Việt.

## Risk / Rollback
- Rủi ro rất thấp, chỉ là microcopy.
- Rollback đơn giản trong 1 file shared component.

Nếu anh duyệt, em recommend Option A để text vừa Việt hóa vừa khớp đúng status `Active/Draft` hiện tại.
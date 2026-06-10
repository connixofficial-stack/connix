## Audit Summary
- Trang `app/admin/landing-pages/page.tsx` đã có bulk delete qua checkbox + `BulkDeleteConfirmDialog`.
- Chưa có bulk action đổi status hàng loạt (Publish/Draft).
- Nút mở trang SEO `_blank` hiện chỉ hiển thị khi `status === 'published'` trong từng row (đúng với yêu cầu bạn vừa chốt).

## Root Cause Confidence
- **High**: thiếu chức năng bulk update status ở UI và backend API tương ứng; không phải lỗi dữ liệu.

## Implementation Proposal
1. **Backend (Convex)**
   - Thêm mutation mới trong `convex/landingPages.ts`: `bulkUpdateStatus`.
   - Input: `ids: Id<'landingPages'>[]`, `status: 'draft' | 'published'`.
   - Logic: patch từng item, cập nhật `updatedAt`; nếu chuyển sang published và trước đó draft thì set `publishedAt`.
2. **Frontend `/admin/landing-pages/page.tsx`**
   - Thêm 2 nút bulk action khi có item được chọn:
     - `Publish N`
     - `Draft N`
   - Reuse `selectedIds` hiện có, gọi `bulkUpdateStatus`, toast kết quả và clear selection.
   - Giữ nguyên bulk delete hiện tại.
3. **Mở trang SEO `_blank`**
   - Giữ behavior hiện tại: chỉ hiển thị nút mở khi Published.
   - Bổ sung thêm nút “Mở tất cả Published đã chọn” trong khu vực bulk actions để mở nhanh nhiều trang cùng lúc (vẫn chỉ mở những item published).

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Manual check:
  1) Chọn nhiều rows -> Publish hàng loạt thành công, badge status đổi đúng.
  2) Chọn nhiều rows -> Draft hàng loạt thành công.
  3) Bulk delete vẫn hoạt động như cũ.
  4) Nút mở trang chỉ xuất hiện với Published; bulk open chỉ mở các item Published đã chọn.
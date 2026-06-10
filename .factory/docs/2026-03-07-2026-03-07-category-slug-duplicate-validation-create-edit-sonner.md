## Problem Graph
1. [Hiển thị lỗi trùng slug thân thiện khi lưu category] <- depends on 1.1, 1.2
   1.1 [Backend đã chặn trùng slug nhưng message đang tiếng Anh `Slug already exists`] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `convex/productCategories.ts` throw message chưa đúng text mong muốn
   1.2 [UI create/edit chỉ show `error.message`, chưa chuẩn hóa thông điệp tiếng Việt thống nhất]

## Execution (with reflection)
1. Solving 1.1.1 (chuẩn hóa message ở backend)...
   - Thought: Đổi message ngay tại nguồn để create/edit đều nhận cùng 1 thông điệp.
   - Action: Sửa `convex/productCategories.ts` tại 2 chỗ check trùng slug (`create` và `update`):
     - từ `throw new Error("Slug already exists")`
     - thành `throw new Error("Slug này đã được sử dụng, vui lòng chọn slug khác")`
   - Reflection: ✓ Đúng scope, DRY, không cần thêm branch logic ở frontend.

2. Đồng bộ UX sonner cho cả create/edit...
   - Thought: Vì cả 2 trang đã `toast.error(error.message)`, chỉ cần fallback tiếng Việt rõ ràng nếu lỗi không phải Error.
   - Action:
     - `app/admin/categories/create/page.tsx`: giữ `toast.error(error instanceof Error ? error.message : 'Không thể tạo danh mục')`
     - `app/admin/categories/[id]/edit/page.tsx`: giữ `toast.error(error instanceof Error ? error.message : 'Không thể cập nhật danh mục')`
     - Không thêm mapping cục bộ vì backend message đã chuẩn.
   - Reflection: ✓ KISS/YAGNI, ít sửa nhưng đạt yêu cầu “trùng thì không cho lưu và bắn sonner”.

3. Verification + commit theo rule repo...
   - Thought: Có thay đổi TS/code nên chạy đúng 1 lệnh typecheck theo guideline dự án.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Manual verify:
       - Create category với slug đã tồn tại -> không lưu, sonner hiện: `Slug này đã được sử dụng, vui lòng chọn slug khác`.
       - Edit category đổi slug thành slug đã tồn tại -> không lưu, sonner hiện đúng message trên.
     - Commit kèm `.factory/docs` theo rule.
   - Reflection: ✓ Đảm bảo đúng yêu cầu functional + quy ước repo.

## Checklist nghiệm thu
- [ ] Create category: slug trùng => blocked save + sonner đúng message.
- [ ] Edit category: slug trùng => blocked save + sonner đúng message.
- [ ] Message thống nhất: `Slug này đã được sử dụng, vui lòng chọn slug khác`.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit, không push.
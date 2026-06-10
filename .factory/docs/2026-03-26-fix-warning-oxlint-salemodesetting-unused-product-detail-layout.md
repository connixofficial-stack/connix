## Audit Summary
- Observation: `oxlint --type-aware --type-check --fix` báo `eslint(no-unused-vars)` tại `app/(site)/products/[slug]/layout.tsx:59` cho biến `saleModeSetting`.
- Observation: Trong `Promise.all`, vẫn còn query `api.admin.modules.getModuleSetting(...saleMode...)` nhưng giá trị này không còn được dùng sau khi port SEO metadata.
- Inference: Đây là dư thừa do refactor title/description đã bỏ logic format giá trong metadata nhưng chưa xóa query/destructure tương ứng.
- Decision: Sửa warning + rà cùng file (theo lựa chọn của bạn), sau đó tạo thêm 1 commit fix nhỏ.

## Root Cause Confidence
- High — Có evidence trực tiếp từ output oxlint + đọc file xác nhận biến/query tồn tại nhưng không có read usage.

## TL;DR kiểu Feynman
- File layout đang gọi thêm một query lấy `saleMode` nhưng không dùng nữa.
- Vì vậy lint cảnh báo biến thừa.
- Cách sửa đúng là bỏ query và bỏ biến khỏi destructuring.
- Mình sẽ rà nhanh cùng file để chắc không còn import/biến/query dư tương tự.
- Xong sẽ tạo 1 commit nhỏ riêng cho fix lint.

## Files Impacted
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\(site)\products\[slug]\layout.tsx`
  - Vai trò hiện tại: generate metadata + JSON-LD cho trang chi tiết sản phẩm.
  - Thay đổi: bỏ `saleModeSetting` khỏi `Promise.all` destructure và bỏ query lấy saleMode không còn dùng; rà nhanh import/biến trong file để tránh warning cùng loại.

## Execution Preview
1. Chỉnh `layout.tsx` để xóa phần destructure `saleModeSetting`.
2. Xóa call `client.query(api.admin.modules.getModuleSetting, ...)` tương ứng trong `Promise.all`.
3. Rà tĩnh cùng file (unused import/unused local liên quan luồng metadata).
4. Chạy `bunx tsc --noEmit` theo rule repo (code TS có thay đổi).
5. Kiểm tra `git status` + `git diff --cached` (soát secrets) rồi commit fix nhỏ.

## Acceptance Criteria
- Không còn biến/query `saleModeSetting` trong `app/(site)/products/[slug]/layout.tsx`.
- File không phát sinh warning unused-vars liên quan phần vừa sửa.
- `bunx tsc --noEmit` pass.
- Có thêm 1 commit nhỏ chỉ chứa fix warning/rà cùng file, không push.

## Out of Scope
- Không thay đổi behavior SEO/UI ngoài việc dọn phần dư thừa.
- Không sửa file ngoài phạm vi `layout.tsx` trừ khi rà tĩnh phát hiện phụ thuộc trực tiếp bắt buộc.

## Risk / Rollback
- Risk thấp: thay đổi chỉ là loại bỏ query/biến không dùng.
- Rollback đơn giản: revert commit fix nhỏ nếu cần.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Repro lint issue: xác nhận dòng cảnh báo trước đó đã được loại bỏ sau sửa.
- Static review: đảm bảo metadata output logic không đổi (chỉ bỏ dead code).
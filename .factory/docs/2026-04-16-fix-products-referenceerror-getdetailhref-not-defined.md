# I. Primer
## 1. TL;DR kiểu Feynman
- Lỗi runtime ở `/products` do truyền nhầm biến `getDetailHref` chưa khai báo trong `ProductsContent`.
- Biến đúng đã có sẵn là `getProductDetailHref`.
- Chỉ cần thay đúng tham chiếu ở điểm gọi `ProductGrid` trong `CatalogLayout` branch.
- Giữ nguyên toàn bộ logic IA routing đã sweep, không mở rộng scope.

## 2. Elaboration & Self-Explanation
Trong `app/(site)/products/page.tsx`, code đã tạo helper chuẩn `getProductDetailHref` để build URL theo `buildDetailPath`. Tuy nhiên ở một nhánh render có dòng `getDetailHref={getDetailHref}`. Ở scope `ProductsContent` không hề có biến `getDetailHref`, nên React render ném `ReferenceError` trước khi vào component con.

Nói ngắn gọn: hệ thống có “hàm đúng”, nhưng tại 1 chỗ truyền props lại gọi sai tên biến.

## 3. Concrete Examples & Analogies
- Hiện trạng lỗi:
  - `ProductGrid ... getDetailHref={getDetailHref}`
  - `getDetailHref` không tồn tại tại scope đó.
- Sau khi sửa:
  - `ProductGrid ... getDetailHref={getProductDetailHref}`
  - Link detail vẫn IA-aware như thiết kế.

- Analogy: giống việc có đúng số điện thoại đã lưu (`getProductDetailHref`) nhưng bấm gọi nhầm tên contact không tồn tại (`getDetailHref`) nên cuộc gọi fail ngay.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `getProductDetailHref` đã được khai báo và dùng ở nhiều chỗ trong cùng file.
  - Có 1 dòng tại `ProductsContent` truyền `getDetailHref={getDetailHref}` gây undefined runtime.
  - `grep` toàn file không có `const getDetailHref = ...` ở scope `ProductsContent`.
- Inference:
  - Đây là typo/sai tên biến khi refactor sweep.
- Decision:
  - Sửa tối thiểu đúng 1 tham chiếu sai, không đụng logic khác.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: **High**
- 1) Triệu chứng: runtime `ReferenceError: getDetailHref is not defined` tại `ProductsContent` line 925.
- 2) Phạm vi: chỉ trang `/products` nhánh render này.
- 3) Tái hiện: ổn định khi vào branch render có `ProductGrid` đó.
- 4) Mốc thay đổi: xuất hiện sau sweep đổi link detail sang IA-aware.
- 5) Dữ liệu thiếu: không thiếu thêm; stack trace + grep đã đủ kết luận.
- 6) Counter-hypothesis: lỗi do `buildDetailPath` hoặc `routeMode` null. Bị loại trừ vì lỗi xảy ra trước khi gọi hàm (undefined identifier).
- 7) Rủi ro fix sai nguyên nhân: vẫn crash runtime ở `/products`.
- 8) Pass/fail: không còn ReferenceError; trang render bình thường; link detail vẫn đúng mode.

# IV. Proposal (Đề xuất)
1. Sửa dòng truyền props sai trong `ProductsContent`:
   - `getDetailHref={getDetailHref}` → `getDetailHref={getProductDetailHref}`.
2. Rà nhanh trong cùng file các chỗ còn nhầm tên tương tự (`getDetailHref={getDetailHref}` ở scope không có biến).
3. Giữ nguyên mọi thay đổi IA routing khác, không refactor thêm.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/(site)/products/page.tsx`
  - Vai trò hiện tại: trang list sản phẩm public và điều hướng detail.
  - Thay đổi: chỉnh đúng tên biến props callback detail href ở `ProductsContent`.

# VI. Execution Preview (Xem trước thực thi)
1. Mở `app/(site)/products/page.tsx` tại đoạn render báo lỗi.
2. Đổi tham chiếu sai sang `getProductDetailHref`.
3. Soát lại file để đảm bảo không còn identifier tương tự sai scope.
4. Self-review tĩnh để chắc không phát sinh lỗi type/scope mới.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Repro sau sửa:
  1. Vào `/products` không còn crash ReferenceError.
  2. Click vào item product điều hướng đúng theo IA mode (`unified`/`namespace`).
- Static check theo quy tắc repo khi commit code TS:
  - Chạy `bunx tsc --noEmit` trước commit.
- Không chạy lint/unit test (theo AGENTS.md).

# VIII. Todo
1. Sửa biến truyền props `getDetailHref` sai tên trong `ProductsContent`.
2. Rà các tham chiếu cùng pattern trong file để tránh sót.
3. Verify manual `/products` + điều hướng detail.
4. Typecheck (`bunx tsc --noEmit`) trước commit.
5. Commit local (không push) kèm `.factory/docs` nếu có cập nhật spec.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- [Pass] `/products` render bình thường, không còn `ReferenceError`.
- [Pass] Các link detail product vẫn đi qua IA route builder đúng mode.
- [Pass] Không thay đổi behavior ngoài phạm vi lỗi này.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: rất thấp, vì sửa 1 tham chiếu tên biến.
- Rollback: revert 1 commit/few-lines nếu phát sinh tác dụng phụ.

# XI. Out of Scope (Ngoài phạm vi)
- Không mở rộng sweep sang sitemap/feed/admin/system preview.
- Không đổi schema/data Convex.
- Không refactor kiến trúc mới.

# XII. Open Questions (Câu hỏi mở)
- Không có ambiguity kỹ thuật đáng kể; có thể triển khai ngay.
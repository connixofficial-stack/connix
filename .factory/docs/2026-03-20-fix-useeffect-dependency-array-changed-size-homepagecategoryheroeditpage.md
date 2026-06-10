## Audit Summary

### TL;DR kiểu Feynman
- Lỗi mới này là hậu quả trực tiếp từ patch dirty-state trước đó.
- Tôi đã thêm `style` vào dependency array của `useEffect`, nhưng lại chỉ thêm ở một bản render mới so với bản dependency array cũ đang sống trong Fast Refresh.
- React báo lỗi vì dependency array của cùng một `useEffect` bị đổi số phần tử giữa hai render của cùng component.
- Fix đúng là làm dependency array ổn định tuyệt đối và đồng bộ với logic dirty-check.
- Cách an toàn nhất: chuẩn hóa lại effect dirty-state để dependency list cố định, không bị lệch thứ tự/kích thước.

### Observation / Inference / Decision
- Observation:
  - Error ghi rất rõ: `The final argument passed to useEffect changed size between renders`.
  - Previous array không có phần tử `soft` ở vị trí sau `ctaUrl`; incoming array có `soft`, tức là dependency mới đã chen thêm `style` vào giữa array.
  - Trong file `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`, effect dirty-state hiện có `style` trong body compare và cũng có `style` trong dependency array.
- Inference:
  - Lỗi này thường xuất hiện khi hook dependency array bị thay đổi shape giữa các bản render sau hot reload / fast refresh hoặc do code hiện tại chưa đồng bộ hoàn toàn với thứ tự dependency ổn định.
  - Root cause sâu hơn không phải `style` value, mà là cách ta vá trực tiếp dependency array theo kiểu “chen thêm 1 phần tử”, khiến mảng phụ thuộc không còn ổn định với bản hook trước đó mà React đang giữ trong runtime.
- Decision:
  - Sửa effect dirty-state theo hướng ổn định hóa dependency array và tránh nguy cơ lệch size/order về sau.

### Audit câu hỏi bắt buộc
1. Triệu chứng: mở edit page thì console ném lỗi hook dependency array đổi kích thước; expected là dirty-state hoạt động bình thường không lỗi runtime.
2. Phạm vi: chỉ ảnh hưởng `HomepageCategoryHeroEditPage`, cụ thể effect tính `hasChanges`.
3. Tái hiện: có thể tái hiện khi load/truy cập route edit sau patch dirty-state vừa rồi, nhất là trong dev với Fast Refresh.
4. Mốc thay đổi gần nhất: commit `fix(homepage-category-hero): track style dirty state`.
5. Dữ liệu còn thiếu: chưa cần thêm evidence để xác định nguyên nhân chính.
6. Giả thuyết thay thế: lỗi do `style` value `'soft'`; đã loại trừ vì message nói về size/order của dependency array, không phải giá trị hợp lệ hay không.
7. Rủi ro nếu fix sai nguyên nhân: có thể hết dirty-state bug nhưng vẫn còn crash console/hook error trong dev.
8. Pass/fail: không còn lỗi console về dependency array; dirty-state vẫn bật khi đổi layout và reset sau save.

## Root Cause Confidence
**High** — message lỗi trùng khớp trực tiếp với thay đổi vừa thêm vào dependency array của `useEffect` dirty-state.

## Files Impacted
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: quản lý state edit, dirty-check, save button.
  - Thay đổi: refactor effect dirty-state để dependency array có shape ổn định, vẫn bao phủ đầy đủ `style` và các field cần so sánh.

## Proposal

### Option A (Recommend) — Confidence 90%
Refactor dirty-state effect theo hướng tạo một giá trị snapshot/serialized comparable trước, rồi để `useEffect` phụ thuộc vào snapshot đó thay vì một danh sách dependency dài dễ lệch.
- Vì sao recommend: giảm nguy cơ lặp lại lỗi size/order, dễ bảo trì hơn.
- Tradeoff: sửa nhiều hơn 1 dòng nhưng vẫn scope nhỏ.

### Option B — Confidence 70%
Giữ effect hiện tại, chỉ chuẩn hóa lại dependency array một lần nữa và đảm bảo thứ tự cố định.
- Phù hợp nếu muốn fix tối thiểu nhất.
- Tradeoff: vẫn mong manh, sau này thêm field mới dễ lặp lỗi tương tự.

## Execution Preview
1. Đọc lại toàn bộ effect dirty-state trong edit page.
2. Tạo cách so sánh ổn định hơn cho dirty-state (ưu tiên snapshot/deps cố định).
3. Đảm bảo `style` vẫn được tính vào dirty state.
4. Review tĩnh để confirm không còn khả năng dependency array đổi size/order.
5. Nếu user duyệt, sau khi sửa sẽ chạy `bunx tsc --noEmit` rồi commit theo rule repo.

## Acceptance Criteria
- Không còn lỗi console `useEffect changed size between renders`.
- Đổi layout bất kỳ thì nút chuyển sang `Lưu`.
- Đổi lại layout ban đầu thì nút quay về `Đã lưu`.
- Save xong dirty state reset đúng.
- Không làm hỏng dirty-state của các field khác.

## Verification Plan
- Typecheck: `bunx tsc --noEmit` sau khi sửa.
- Static review:
  - dependency array/hook shape ổn định,
  - `style` vẫn nằm trong dirty-state compare,
  - không phát sinh conditional hook.
- Repro cho tester:
  1. Mở route edit của `HomepageCategoryHero`.
  2. Xác nhận không còn console error.
  3. Đổi layout sang `soft` hoặc layout khác.
  4. Xác nhận nút thành `Lưu`.
  5. Save và xác nhận nút về `Đã lưu`.

## Risk / Rollback
- Risk thấp; chỉ động vào dirty-state logic của một page.
- Rollback đơn giản trong 1 file nếu cần.

## Out of Scope
- Không sửa các component edit page khác.
- Không đổi UI preview/layout selector.
- Không thay flow save backend.

Nếu bạn duyệt, tôi sẽ fix theo Option A để dứt điểm lỗi dependency array này.
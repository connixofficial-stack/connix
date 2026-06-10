## Audit Summary
- Evidence đã có:
  - `app/admin/contact-inbox/page.tsx` hiện đã dời 2 `useEffect` lên trên, nhưng vẫn còn các nhánh `return` sớm trước `useMemo` tại `totalPages`.
  - Cụ thể, `if (isLoading) return ...` và `if (!stats || !inquiries) return null` nằm trước `const totalPages = useMemo(...)`.
  - Stack trace mới xác nhận hook bị lệch tại `app/admin/contact-inbox/page.tsx:95`, đúng vị trí `useMemo` cho `totalPages`.
  - Bảng hook diff cho thấy render trước dừng trước một hook mới, render sau mới gọi thêm `useMemo`; đây là dấu hiệu điển hình của việc vẫn còn hook nằm sau conditional return.
  - `app/admin/dashboard/page.tsx` cho thấy pattern an toàn hơn: các hook/query được gọi trước, còn nhánh return chỉ xuất hiện sau khi các hook đã ổn định.
- Triệu chứng observed vs expected:
  - Actual: vẫn còn `React has detected a change in the order of Hooks` và `Rendered more hooks than during the previous render`.
  - Expected: mọi hook trong `ContactInboxContent` phải được gọi cùng thứ tự ở mọi render path.
- Phạm vi ảnh hưởng:
  - 1 file chính: `app/admin/contact-inbox/page.tsx`.
  - Ảnh hưởng runtime của trang `/admin/contact-inbox`.
- Tái hiện:
  - Khi feature vừa chuyển từ loading/skip sang enabled + có data, component đi qua nhánh khác và bắt đầu gọi `useMemo` muộn hơn render trước.
- Dữ liệu còn thiếu:
  - Không cần thêm evidence để chốt root cause; stack trace + code path đã đủ.
- Giả thuyết thay thế:
  - Có thể lỗi do hook ẩn trong `useQuery` hoặc component con. Loại trừ vì stack trace trỏ trực tiếp vào `useMemo` trong `ContactInboxContent`, và code hiện tại đúng là còn conditional return trước hook này.
- Rủi ro nếu fix sai nguyên nhân:
  - Tiếp tục còn crash runtime, dễ tạo false sense of done.
- Tiêu chí pass/fail:
  - Không còn lỗi hook order/runtime tại `/admin/contact-inbox`.
  - Hook count ổn định qua các state loading / disabled / enabled / no-data / has-data.

## Root Cause Confidence
- High — evidence trực tiếp từ stack trace mới và code hiện tại khớp 1-1 với Rules of Hooks.

## Proposal
Mục tiêu: fix triệt để toàn bộ hook order trong `ContactInboxContent`, không để bất kỳ hook nào nằm sau nhánh return có điều kiện.

### Thay đổi cụ thể
1. File: `app/admin/contact-inbox/page.tsx`
2. Chuẩn hóa thứ tự logic trong `ContactInboxContent` như sau:
   - Giữ toàn bộ hooks ở đầu component, theo thứ tự cố định:
     - `useState` x4
     - `useMutation`
     - `useQuery` feature gate
     - `useEffect` debounce
     - `useEffect` reset page
     - `useQuery` inbox list với `skip`
     - `useQuery` stats với `skip`
     - `useMemo`/derived values cần thiết
   - Không để `useMemo` nằm dưới `if (isLoading)` hay bất kỳ early return nào nữa.
3. Với `totalItems` và `totalPages`, có 2 cách an toàn; theo scope KISS mình sẽ dùng cách đơn giản hơn:
   - Bỏ hẳn `useMemo` cho `totalPages` vì đây là phép tính rẻ, không cần memo hóa.
   - Tính trước bằng fallback an toàn:
     - `const safeInquiries = inquiries ?? []`
     - `const safeStats = stats ?? { total: 0, new: 0, in_progress: 0, resolved: 0, spam: 0 }`
     - `const totalItems = Math.max(safeStats.total, safeInquiries.length)`
     - `const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))`
4. Sau khi đã có toàn bộ hook + derived values, mới đặt các nhánh render theo thứ tự:
   - feature loading
   - feature disabled
   - inbox loading
   - render normal state (kể cả empty state)
5. Loại bỏ `if (!stats || !inquiries) return null;` vì nhánh này vừa gây rủi ro hook order, vừa làm UI biến mất không cần thiết. Thay bằng fallback data như trên.
6. Giữ nguyên behavior business hiện tại:
   - debounce search
   - filter status
   - pagination
   - update inquiry status
   - loading spinner và card feature disabled

## Counter-Hypothesis Check
- Giả thuyết đối chứng: chỉ cần dời `useMemo` xuống dưới hoặc bọc điều kiện khác là đủ.
- Loại vì gốc vấn đề không phải riêng `useMemo`, mà là nguyên tắc tổng quát: mọi hook phải ở trước mọi conditional return. Spec này xử lý triệt để pattern đó thay vì vá từng dòng.

## Post-Audit
- Blast radius: thấp, chỉ trong 1 component client.
- Regression risk: thấp, vì không đổi API/query contract.
- Complexity: thấp; chủ yếu là reorder logic và thay memo rẻ bằng tính trực tiếp.
- KISS/YAGNI/DRY:
  - KISS: bỏ `useMemo` không cần thiết, dùng fallback values rõ ràng.
  - YAGNI: không mở rộng sang refactor query backend hay admin pages khác.
  - DRY: tái dùng pattern `skip` hiện có trong codebase.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Repro runtime:
  - mở `/admin/contact-inbox`
  - quan sát khi page mount, khi feature resolve, khi list/stats resolve
  - xác nhận không còn 2 lỗi hook order/runtime
- Functional check:
  - feature loading: spinner hiển thị
  - feature disabled: card thông báo hiển thị
  - feature enabled + chưa có data: empty state trong table hiển thị ổn định
  - feature enabled + có data: badge tổng/mới/đang xử lý, pagination, đổi status vẫn hoạt động

## Checklist chốt cho bạn
- [x] Audit lại với evidence mới từ stack trace
- [x] Xác định root cause hiện tại, không lặp lại kết luận cũ
- [x] Fix triệt để theo nguyên tắc: không hook nào sau conditional return
- [x] Giữ scope gọn, không mở rộng ngoài ContactInboxContent
- [x] Verify bằng typecheck + repro runtime

Nếu bạn duyệt spec này, mình sẽ implement đúng theo hướng fix triệt để trên.
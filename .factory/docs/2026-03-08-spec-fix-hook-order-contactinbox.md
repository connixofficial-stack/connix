## Audit Summary
- Evidence đã có:
  - `app/admin/contact-inbox/page.tsx` đang gọi `useEffect` ở dưới 2 nhánh `return` sớm (`inboxAdminFeature === undefined` và `!inboxAdminFeature?.enabled`). Đây là vi phạm Rules of Hooks vì số lượng/thứ tự hook thay đổi giữa các render.
  - Stack trace báo render trước có 14 hooks, render sau có 15 hooks, và điểm phát sinh đúng tại `useEffect` dòng 52.
  - `app/admin/dashboard/page.tsx` đang dùng pattern an toàn hơn với `useQuery(..., condition ? {} : 'skip')`, cho thấy codebase đã có convention để tránh query/hook bị phụ thuộc vào nhánh render.
- Triệu chứng observed vs expected:
  - Actual: console/runtime error `React has detected a change in the order of Hooks` và `Rendered more hooks than during the previous render`.
  - Expected: trang `/admin/contact-inbox` render ổn định qua mọi state loading/enabled/disabled mà không đổi thứ tự hooks.
- Phạm vi ảnh hưởng:
  - Chủ yếu tại `ContactInboxContent` trong `app/admin/contact-inbox/page.tsx`.
  - Ảnh hưởng runtime render của trang admin contact inbox.
- Repro tối thiểu:
  - Render đầu khi `inboxAdminFeature === undefined` sẽ return sớm trước các `useEffect`.
  - Render sau khi query resolve và feature bật sẽ chạy thêm `useEffect` + các hook phía dưới, làm lệch thứ tự hook.
- Mốc thay đổi gần nhất:
  - Chưa có history cụ thể cho file này trong audit hiện tại; nhưng evidence trong code là đủ để xác định lỗi trực tiếp.
- Counter-hypothesis check:
  - Giả thuyết đối chứng: lỗi do `useQuery` với dữ liệu thay đổi hoặc do `ModuleGuard` render condition. Loại trừ vì stack trace trỏ thẳng vào `useEffect` sau early return, và `ModuleGuard` nằm ở component cha, không làm thay đổi thứ tự hooks nội bộ `ContactInboxContent`.
- Root cause:
  - `ContactInboxContent` đặt một phần hooks phía sau các early return, nên cùng một component nhưng số hooks khác nhau giữa các lần render.

## Root Cause Confidence
- High — vì có evidence trực tiếp từ code path và stack trace, khớp hoàn toàn với Rules of Hooks của React.

## Proposal
1. Chỉnh `app/admin/contact-inbox/page.tsx` để tất cả hooks trong `ContactInboxContent` được gọi vô điều kiện ở đầu component, trước mọi `return`.
2. Giữ nguyên scope theo lựa chọn của bạn: chỉ fix Hook order để hết crash, không mở rộng refactor logic pagination/search ngoài mức cần thiết.
3. Cách sửa cụ thể:
   - Giữ các `useState` hiện tại ở đầu component.
   - Dời 2 `useEffect` (debounce search, reset page) lên trước các nhánh `if (inboxAdminFeature === undefined)` và `if (!inboxAdminFeature?.enabled)`.
   - Đổi 2 query dữ liệu inbox sang pattern `skip` để hook vẫn được gọi đúng thứ tự nhưng không fetch khi feature chưa sẵn sàng hoặc đang tắt:
     - `const shouldLoadInbox = inboxAdminFeature?.enabled === true`
     - `useQuery(api.contactInbox.listInbox, shouldLoadInbox ? {...} : 'skip')`
     - `useQuery(api.contactInbox.getInboxStats, shouldLoadInbox ? {} : 'skip')`
   - Tính `isLoading` theo 2 lớp:
     - loading feature gate (`inboxAdminFeature === undefined`)
     - loading data inbox khi `shouldLoadInbox` là true và query còn `undefined`.
   - Giữ nguyên UI loading, UI feature-disabled, table, filter, pagination hiện tại để tránh blast radius.
4. Không đổi API Convex, không đổi schema, không đổi business logic status update.

## Post-Audit
- Blast radius: thấp, chỉ 1 file UI client.
- Regression risk: thấp-trung bình; điểm cần giữ là không để query data chạy khi feature tắt.
- KISS/YAGNI/DRY:
  - KISS: chỉ sắp xếp lại hook order + dùng `skip` đúng pattern sẵn có.
  - YAGNI: không đụng pagination/stats/query optimization lúc này.
  - DRY: tái dùng pattern `skip` đang có ở dashboard.

## Verification Plan
- Typecheck: chạy `bunx tsc --noEmit` sau khi sửa.
- Repro: mở lại `/admin/contact-inbox`, xác nhận không còn 2 lỗi runtime về hook order.
- Functional check:
  - Khi feature đang loading: vẫn thấy spinner.
  - Khi feature bị tắt: vẫn thấy card thông báo tắt feature.
  - Khi feature bật: danh sách inbox, search debounce, filter status, pagination và update status vẫn render bình thường.

## Checklist chốt cho bạn
- [x] Xác định được root cause bằng evidence
- [x] Scope chỉ fix crash Hook order
- [x] Chỉ sửa `app/admin/contact-inbox/page.tsx`
- [x] Verify bằng typecheck + repro runtime

Nếu bạn duyệt spec này, mình sẽ implement đúng scope trên, rồi typecheck và commit theo rule của project.
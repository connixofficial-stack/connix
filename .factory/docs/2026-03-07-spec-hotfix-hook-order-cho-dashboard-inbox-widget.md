## Audit Summary
### Pre-Audit
Evidence đã có từ `app/admin/dashboard/page.tsx`:
- `useQuery(api.contactInbox.getInboxStats, ...)` và `useQuery(api.contactInbox.listRecentInbox, ...)` đang được gọi **sau** nhánh `if (isLoading) return ...`.
- Ở render đầu: `contactInboxModule/contactInboxFeature` còn `undefined` nên component return sớm trước khi gọi 2 hook inbox.
- Ở render sau: `isLoading = false`, component đi tiếp và gọi thêm 2 hook inbox.
- Đây là đúng pattern gây lỗi `Rendered more hooks than during the previous render` / `change in the order of Hooks`.

### Audit Questions
1. Triệu chứng: expected = dashboard render ổn định; actual = runtime crash vì thứ tự hooks thay đổi.
2. Phạm vi ảnh hưởng: `app/admin/dashboard/page.tsx`, riêng `DashboardContent`.
3. Repro: ổn định khi data query ban đầu chưa resolve rồi resolve ở render tiếp theo.
4. Mốc thay đổi gần nhất: lỗi xuất hiện sau khi thêm widget inbox dashboard.
5. Dữ liệu còn thiếu: không thiếu thêm; root cause đã đủ evidence từ code path.
6. Giả thuyết thay thế: do `skip` của Convex sai? Bị loại, vì `skip` bản thân không sai; sai ở chỗ hook bị đặt sau early return.
7. Rủi ro nếu fix sai: dashboard tiếp tục crash hoặc query inbox chạy thừa.
8. Pass/fail: không còn lỗi hook-order; widget inbox vẫn chỉ query khi feature bật.

### Root Cause
Root cause là **vi phạm Rules of Hooks**: 2 hook `useQuery` inbox được đặt sau early return, nên không được gọi nhất quán qua mọi render.

### Counter-hypothesis check
- Giả thuyết đối chứng: lỗi do `showContactInboxWidget ? {} : 'skip'`.
- Loại trừ: pattern `skip` là hợp lệ nếu hook vẫn được gọi ở cùng vị trí trên mọi render. Vấn đề nằm ở vị trí hook, không nằm ở `skip`.

## Root Cause Confidence
**High** — stack trace chỉ đúng dòng `useQuery` inbox, và code hiện tại xác nhận hooks xuất hiện sau nhánh return sớm.

## Problem Graph
1. [Main] Dashboard crash khi render widget inbox
   1.1 [ROOT CAUSE] Hook inbox đặt sau early return
   1.2 Query gating cần giữ tối ưu nhưng phải ổn định thứ tự hook

## Execution (with reflection)
1. **Di chuyển 2 hook inbox lên trước mọi nhánh `return` trong `DashboardContent`**
   - File: `app/admin/dashboard/page.tsx`
   - Giữ nguyên pattern:
     - `const showContactInboxWidget = ...`
     - `const inboxStats = useQuery(..., showContactInboxWidget ? {} : 'skip')`
     - `const recentInbox = useQuery(..., showContactInboxWidget ? { limit: 5 } : 'skip')`
   - Nhưng các dòng này phải nằm **trước** `if (isLoading) return ...`.
   - Reflection: đây là hotfix tối thiểu, không đổi behavior, đúng KISS.

2. **Giữ nguyên điều kiện render UI widget**
   - Không đổi logic `hasInboxData` ngoài việc đảm bảo tính sau khi hooks đã được khai báo ổn định.
   - Reflection: tránh mở rộng scope, đúng theo lựa chọn “chỉ hotfix hook-order”.

3. **Verify không phát sinh blast radius**
   - Check rằng analytics widget cũ không bị ảnh hưởng.
   - Query inbox vẫn `skip` khi feature/module tắt, nên không phát sinh load thừa.

## Post-Audit
- Blast radius: rất thấp, 1 file.
- Regression risk: thấp.
- Complexity: thấp.
- KISS/YAGNI/DRY: đạt, vì chỉ sửa vị trí hooks, không refactor thừa.

## Verification Plan
- **Repro**: mở `/admin/dashboard`, xác nhận không còn lỗi console/runtime hook-order.
- **Behavior**:
  1) Khi `contactInbox` hoặc feature widget tắt: query inbox vẫn skip, UI không hiện.
  2) Khi bật và có data: widget inbox vẫn hiện như cũ.
  3) Khi bật nhưng chưa có data: dashboard không crash, widget vẫn ẩn.
- **Typecheck**: `bunx tsc --noEmit`

Checklist chốt:
- [x] Chỉ hotfix hook-order
- [x] Giữ pattern `skip`
- [x] Không mở rộng refactor ngoài yêu cầu
## Problem Graph
1. [Main] 404 route lạ ngoài `(site)` vẫn rơi vào trang mặc định Next.js <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `not-found.tsx` hiện đặt trong `app/(site)` nên chỉ cover segment đó, không cover unmatched ở root-level
   1.2 Cần giữ `/admin` và `/system` không dùng error experience theo yêu cầu

## Execution (with reflection)
1. Solving 1.1...
- Thought: Next.js App Router ưu tiên `app/not-found.tsx` để xử lý unmatched toàn app.
- Action: thêm `app/not-found.tsx` render `ErrorPageView` + đọc `useErrorPagesConfig` và `useBrandColors`.
- Reflection: ✓ route kiểu `/productsdfgg...` sẽ vào experience thay vì default Next.js.

2. Solving 1.2...
- Thought: root not-found sẽ ảnh hưởng tất cả segment nếu không override.
- Action: thêm override riêng:
  - `app/admin/not-found.tsx`
  - `app/system/not-found.tsx`
  dùng UI tối giản riêng (hoặc giữ style hiện tại), không dùng error experience.
- Reflection: ✓ đảm bảo đúng yêu cầu “trừ /admin và /system”.

3. Clean-up routing consistency...
- Thought: tránh chồng chéo không cần thiết.
- Action: giữ `app/(site)/not-found.tsx` hoặc bỏ để DRY (khuyến nghị bỏ, vì root đã cover public). Nếu giữ thì chỉ làm wrapper mỏng.
- Reflection: ✓ tránh bất ngờ khi maintain.

## Scope & impacted paths
- `app/not-found.tsx` (new)
- `app/admin/not-found.tsx` (new)
- `app/system/not-found.tsx` (new)
- `app/(site)/not-found.tsx` (optional: delete hoặc convert wrapper)

## Ordered actions
1. Tạo `app/not-found.tsx` dùng `ErrorPageView` + config experience.
2. Tạo `app/admin/not-found.tsx` fallback đơn giản cho admin.
3. Tạo `app/system/not-found.tsx` fallback đơn giản cho system.
4. Quyết định cleanup `app/(site)/not-found.tsx` theo hướng DRY (khuyến nghị remove).
5. Chạy `bunx tsc --noEmit`.
6. Commit fix với message kiểu: `fix(routing): apply public not-found experience at root`.

## Gate matrix
### Critical
- C1: URL lạ public (`/productsdfggbkhdbgkuydfgb`) hiển thị đúng Error Experience.
- C2: URL lạ trong `/admin/*` và `/system/*` KHÔNG dùng Error Experience.
- C3: Typecheck pass (`bunx tsc --noEmit`).

### Non-critical
- N1: Có giữ hay bỏ `app/(site)/not-found.tsx` (không ảnh hưởng behavior nếu root đã đúng).

## Warning + remediation
- Nếu chỉ sửa trong `app/(site)/not-found.tsx` thì route lạ root vẫn không match experience.
- Bắt buộc phải có `app/not-found.tsx` để cover unmatched toàn app.

## Next-safe-step
Nếu bạn confirm spec này, mình sẽ implement ngay theo đúng phạm vi đã chốt.
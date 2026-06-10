## Audit Summary

### Observation
1. `bunx convex dev` đang fail ở bước TypeScript typecheck với lỗi:
   - `lib/modules/configs/orders.config.ts:3:67 - error TS2307: Cannot find module '@/lib/orders/statuses'`
2. Evidence:
   - `lib/modules/configs/orders.config.ts` hiện import bằng alias: `@/lib/orders/statuses`.
   - File thật có tồn tại tại `lib/orders/statuses.ts`.
   - `tsconfig.json` có `paths: { "@/*": ["./*"] }`, nên alias hợp lệ cho app/Next.
3. Inference:
   - Lỗi không phải do file thiếu, mà do context typecheck của Convex không resolve alias `@/...` ổn định ở file config đang bị kéo vào graph của Convex.
   - Các file khác cũng đang dùng alias này, nhưng lỗi hiện tại mới lộ ra ở `orders.config.ts` vì file này đang nằm trong luồng import mà Convex phải typecheck khi push.
4. Expected vs actual:
   - Expected: `convex dev` typecheck pass.
   - Actual: fail ngay ở `orders.config.ts`.
5. Scope ảnh hưởng:
   - Trực tiếp: `lib/modules/configs/orders.config.ts`
   - Gián tiếp: các file khác có thể gặp cùng pattern nếu sau này bị Convex import vào graph.

## Root Cause Confidence

### Root Cause — High
`orders.config.ts` đang dùng alias `@/lib/orders/statuses` trong một file được Convex typecheck theo import graph hiện tại. Convex/tsc ở luồng này không resolve alias đó như Next app runtime, nên phát sinh `TS2307` dù file tồn tại.

### Counter-hypothesis
Nếu đổi import sang relative path mà vẫn lỗi, khi đó mới cần nghi ngờ tsconfig/Convex typecheck config rộng hơn. Nhưng với evidence hiện tại, đây nhiều khả năng là lỗi path resolution cục bộ ở file này.

## Proposal

### Fix recommend
1. Đổi import trong `lib/modules/configs/orders.config.ts` từ:
   - `@/lib/orders/statuses`
   thành relative path tương ứng:
   - `../../orders/statuses`
2. Audit nhanh các file config trong `lib/modules/configs/*` xem còn alias `@/...` nào có thể đi vào Convex graph không.
3. Verify lại bằng:
   - `bunx tsc --noEmit`
   - sau đó `bunx convex dev`

### Vì sao đây là hướng tốt nhất
- Thay đổi rất nhỏ, đúng scope lỗi hiện tại.
- Không đụng tsconfig hay cấu hình Convex.
- Dễ rollback và giảm nguy cơ alias-resolution fail lặp lại ở vùng module config dùng chung giữa app và Convex.

## Verification Plan
1. Typecheck pass với `bunx tsc --noEmit`
2. `bunx convex dev` không còn báo `TS2307` ở `orders.config.ts`
3. Rà nhanh các module config khác để chắc không còn import alias tương tự trong cùng nhóm file

Nếu bạn duyệt, tôi sẽ fix đúng file này trước, rồi audit nhanh nhóm `lib/modules/configs` để tránh lỗi cùng lớp tái diễn.
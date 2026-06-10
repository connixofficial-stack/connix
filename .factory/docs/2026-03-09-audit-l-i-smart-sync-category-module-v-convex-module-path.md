## Audit Summary

### Observation
1. Lỗi runtime user gặp là:
   - `Module definition not found: postCategories`
   - sau đó `convex dev` báo `InvalidConfig: lib/module-config-sync.js is not a valid path to a Convex module`
2. Evidence:
   - `components/modules/ModuleConfigPage.tsx`: khi bấm sync sẽ gọi `syncModuleConfig` cho cả `config.key` và `config.categoryModuleKey`.
   - `convex/lib/module-config-sync.ts`: mutation ném lỗi ngay nếu `getModuleRuntimeDefinition(moduleKey)` trả `null`.
   - `lib/modules/runtime-config/index.ts`: hiện có category definitions cho `postCategories` và `productCategories` ở source code đang đọc.
   - `Glob convex/**/*-*.ts` cho thấy đang có file `convex/lib/module-config-sync.ts`.
3. Triệu chứng expected vs actual:
   - Expected: bấm “Đồng bộ từ định nghĩa” không lỗi, kể cả module có category module.
   - Actual: sync nổ với `postCategories`, và `convex dev` còn fail push do tên file Convex chứa dấu `-`.
4. Phạm vi ảnh hưởng:
   - Tất cả module có `categoryModuleKey` như `posts`, `products`, có thể cả `services` nếu sau này sync category.
   - Toàn bộ môi trường Convex dev/prod vì file path rule là ở Convex deploy layer, không riêng local.
5. Mốc thay đổi gần nhất:
   - Vừa mở rộng smart sync để sync thêm category module và thêm helper `convex/lib/module-config-sync.ts`.
6. Giả thuyết thay thế đã kiểm:
   - Không phải lỗi UI button đơn thuần; button chỉ expose lỗi backend.
   - Không phải do `postCategories` chưa được gọi ở UI; ngược lại chính UI đang gọi nó.
   - Khả năng cao runtime đang dùng bundle/registry chưa hợp lệ vì Convex push fail, nên server không phản ánh đúng source hiện tại.
7. Rủi ro nếu fix sai nguyên nhân:
   - Chỉ vá UI sẽ che lỗi nhưng backend sync category vẫn hỏng.
   - Chỉ thêm fallback cho `postCategories` mà không sửa path Convex thì deploy vẫn fail hoàn toàn.
8. Pass/fail criteria:
   - Pass khi `convex dev` chạy lại không còn `InvalidConfig`.
   - Pass khi sync `posts`/`products` không lỗi và category module được sync idempotent.
   - Pass khi module không có runtime definition thì button không xuất hiện hoặc backend trả lỗi đúng chủ đích.

## Root Cause Confidence

### Root Cause 1 — High
`convex/lib/module-config-sync.ts` vi phạm rule đặt tên file Convex module vì có dấu `-`. Convex không push được nên backend đang không dùng version code mong muốn. Đây là root cause rõ ràng cho lỗi deploy hiện tại.

### Root Cause 2 — Medium/High
Lỗi `Module definition not found: postCategories` rất có thể đến từ việc backend Convex đang chạy code trước khi category definitions được load đầy đủ, hoặc registry hiện tại chưa cover nhất quán cho mọi category module cần sync. Vì UI đã gọi cả `categoryModuleKey`, nên chỉ cần thiếu một category entry là sẽ nổ ngay.

### Counter-hypothesis
Nếu sau khi sửa file path Convex mà lỗi `postCategories` vẫn còn, thì registry runtime vẫn chưa đủ coverage thật sự cho category modules hoặc import graph không đưa category definitions vào bundle server như kỳ vọng. Khi đó cần audit coverage registry thay vì chỉ blame deploy cache.

## Proposal

### Phase 1 — Fix chắc root cause deploy
1. Đổi tên `convex/lib/module-config-sync.ts` sang tên hợp lệ với Convex, ví dụ:
   - `convex/lib/moduleConfigSync.ts` (recommend)
2. Cập nhật toàn bộ import liên quan.
3. Verify tĩnh lại để chắc không còn import cũ.

### Phase 2 — Audit toàn bộ scope smart sync category/module
1. Lập danh sách module có `categoryModuleKey` từ `lib/modules/configs/*`.
2. Đối chiếu từng `categoryModuleKey` với `lib/modules/runtime-config/index.ts` để đảm bảo có runtime definition tương ứng.
3. Kiểm tra cả module thường xem module nào đang có button sync nhưng runtime registry không cover đủ.
4. Chốt rule rõ:
   - module chỉ hiện button nếu `config.key` sync được;
   - category chỉ sync kèm khi `categoryModuleKey` cũng có runtime definition hợp lệ.

### Phase 3 — Hardening để không lỗi lại
1. Thay logic `canSyncDefinition` hiện tại bằng contract rõ hơn:
   - `canSyncMainModule`
   - `canSyncCategoryModule`
   - chỉ gọi backend cho keys thật sự có definition.
2. Backend helper vẫn giữ guard `Module definition not found` cho trường hợp gọi sai trực tiếp.
3. Nếu module cha sync được nhưng category chưa có definition:
   - không fail toàn bộ action;
   - hoặc bỏ qua category, hoặc báo toast mềm có ngữ cảnh.
   - Tôi recommend: bỏ qua category nếu chưa có definition, vì hành vi này an toàn hơn cho người dùng bấm sync từ UI.
4. Bổ sung/chuẩn hóa category runtime definitions còn thiếu:
   - `postCategories`
   - `productCategories`
   - audit thêm `serviceCategories` nếu module services có ý định sync category trong tương lai.

### Phase 4 — Mở rộng scope audit các module khác
Tôi sẽ rà các nhóm sau vì có nguy cơ tương tự:
1. Module có `categoryModuleKey`: `posts`, `products`, `services`
2. Module có runtimeConfig rỗng nhưng vẫn cho sync: `cart`, `customers`, `orders`, `services`, `wishlist`, `contactInbox`
3. Module có special-case settings/data bridge: `settings`
4. Module đang được seed qua `convex/seed.ts` và seeders riêng, để chắc helper sync không tạo lệch behavior

## File-level Plan
1. `convex/lib/moduleConfigSync.ts`
   - đổi tên file helper sang path hợp lệ Convex
2. `convex/admin/modules.ts`
   - cập nhật import helper mới
3. Các `convex/seeders/*.ts` và `convex/seed.ts`
   - cập nhật import helper mới
4. `components/modules/ModuleConfigPage.tsx`
   - tách khả năng sync main/category
   - chỉ gọi các moduleKey có runtime definition thật
   - tránh fail toàn action vì category thiếu definition
5. `lib/modules/runtime-config/index.ts`
   - audit/chuẩn hóa coverage category modules
6. Có thể thêm helper nhỏ trong runtime-config để query capability rõ ràng hơn, ví dụ `getSyncableModuleKeys(config)` nếu cần

## Verification Plan
1. `bunx tsc --noEmit`
2. Chạy lại `bunx convex dev` để xác nhận hết `InvalidConfig`
3. Repro manual:
   - bấm sync ở module `posts`
   - bấm sync ở module `products`
   - bấm sync ở module `settings`
4. Kiểm tra expected:
   - không còn lỗi `Module definition not found: postCategories`
   - category fields được sync khi có definition
   - modules không có category hoặc category chưa cover không làm hỏng sync chính

## Decision
Recommend fix theo hướng:
- sửa path Convex trước,
- rồi harden UI/backend để category sync là optional-safe thay vì all-or-nothing,
- đồng thời audit coverage các module khác để tránh lỗi cùng lớp.

Nếu bạn duyệt, tôi sẽ implement đúng plan này và audit luôn toàn bộ module liên quan thay vì chỉ vá `postCategories`.
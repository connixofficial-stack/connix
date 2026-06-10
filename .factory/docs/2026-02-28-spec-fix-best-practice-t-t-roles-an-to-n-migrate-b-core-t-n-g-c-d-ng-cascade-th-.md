## Problem Graph
1. [Main] Tắt module roles vẫn có thể nổ `Cannot disable core module` dù UI đã mở khóa <- depends on 1.1, 1.2, 1.3
   1.1 [Data drift] Bản ghi DB cũ của `adminModules.roles` vẫn đang `isCore = true`
   1.2 [Mutation mismatch] UI đang gọi `toggleModule`, trong khi disable có nhánh cascade riêng
   1.3 [Best-practice gap] Chưa có bước self-heal dữ liệu để đồng bộ UI/API một nguồn sự thật

## Execution (with reflection)
1. Tạo helper normalize + migrate roles trong backend modules
   - File: `convex/admin/modules.ts`
   - Thêm helper nội bộ, ví dụ `normalizeRolesModule(ctx, moduleRecord)`:
     - Nếu `moduleRecord.key !== 'roles'` -> trả nguyên.
     - Nếu `moduleRecord.key === 'roles'` và `isCore === true` -> `ctx.db.patch(moduleRecord._id, { isCore: false })`, rồi trả object đã normalize `isCore: false`.
   - Dùng helper này trong cả query lẫn mutation.
   - Reflection: ✓ Đây là fix tận gốc, DB tự lành, không cần reseed thủ công.

2. Áp dụng helper cho toàn bộ query modules
   - File: `convex/admin/modules.ts`
   - Thay normalize runtime hiện tại bằng helper thật sự có patch DB trong:
     - `listModules`
     - `listEnabledModules`
     - `listModulesByCategory`
     - `getModuleByKey`
   - Có thể batch bằng `Promise.all` khi map danh sách để tránh tuần tự.
   - Reflection: ✓ Query nào cũng đọc ra trạng thái đúng và tự sửa dữ liệu cũ.

3. Áp dụng helper cho mutation toggle trước khi check core
   - File: `convex/admin/modules.ts`
   - Trong `toggleModule` và `toggleModuleWithCascade`:
     - Lấy `moduleRecord`
     - Chạy helper normalize trước khi check `isCore`
     - Sau đó dùng `normalizedModule.isCore`
   - Điều này loại luôn lỗi hiện tại `Cannot disable core module` với roles từ dữ liệu cũ.
   - Reflection: ✓ Chặn lỗi đúng chỗ phát sinh, không chỉ vá UI.

4. Thống nhất dùng `toggleModuleWithCascade` từ UI
   - File: `app/system/modules/page.tsx`
   - Trong `handleToggleModule`, đổi flow để luôn gọi `toggleModuleWithCascade`:
     - Khi enable: gọi `toggleModuleWithCascade({ enabled: true, key })`
     - Khi disable không có dependents: gọi `toggleModuleWithCascade({ enabled: false, key, cascadeKeys: [] })`
     - Khi disable có dependents: giữ dialog confirm như hiện tại, rồi confirm sẽ gọi cascade như đang có.
   - Bỏ lệ thuộc vào `toggleModule` ở UI để hành vi đồng nhất.
   - Reflection: ✓ One path duy nhất, ít drift, ít bug hơn.

5. Giữ UX hiện tại nhưng sạch hơn
   - File: `app/system/modules/_components/ModuleCard.tsx`
   - Giữ logic badge/lock hiện tại (đã đúng), không cần đổi thêm nếu helper backend đã migrate xong.
   - Reflection: ✓ YAGNI, không chạm phần đã ổn.

6. Verify & commit
   - Chạy `bunx tsc --noEmit`.
   - Commit local theo style repo, add kèm `.factory/docs` spec file mới.

## Best Practice chốt lại
- Một nguồn sự thật: DB phải được tự migrate về `roles.isCore=false`, không chỉ fake ở UI/query.
- Một đường toggle duy nhất: UI luôn đi qua `toggleModuleWithCascade`.
- Mutation tự self-heal dữ liệu cũ trước khi validate để tránh runtime error khi dữ liệu lệch.

## Checklist sau fix
- [ ] Tắt roles không còn nổ `Cannot disable core module`.
- [ ] DB record `adminModules.roles` được tự sửa về `isCore=false` khi chạm vào.
- [ ] UI bật/tắt roles luôn đi cùng một mutation path.
- [ ] Core modules khác vẫn được bảo vệ nguyên vẹn.
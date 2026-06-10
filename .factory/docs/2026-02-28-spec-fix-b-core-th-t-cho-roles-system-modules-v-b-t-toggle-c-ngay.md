## Problem Graph
1. [Main] Roles vẫn hiện badge Core và không toggle được ở `/system/modules` <- depends on 1.1, 1.2
   1.1 [UI guard] `canToggleModule` đang chặn mọi `module.isCore === true` nên roles vẫn bị disable dù backend đã cho ngoại lệ.
   1.2 [Data hiển thị] DB hiện tại vẫn có `roles.isCore = true` (từ dữ liệu cũ), nên UI vẫn render chữ Core.

## Execution (with reflection)
1. Fix chặn toggle ở trang modules
   - File: `app/system/modules/page.tsx`
   - Đổi logic `canToggleModule`:
     - từ: `if (module.isCore) return false`
     - thành: `if (module.isCore && module.key !== 'roles') return false`
   - Reflection: ✓ roles sẽ bật/tắt được ngay trên UI.

2. Fix badge Core cho roles ở card
   - File: `app/system/modules/_components/ModuleCard.tsx`
   - Đang có `isCoreLocked` đúng cho icon khóa, nhưng badge text vẫn dùng `module.isCore`.
   - Đổi badge sang dùng `isCoreLocked` để roles không còn hiện chữ Core.
   - Reflection: ✓ đồng bộ UI (không khóa + không badge Core cho roles).

3. Chuẩn hóa dữ liệu trả về từ backend để không phụ thuộc dữ liệu cũ
   - File: `convex/admin/modules.ts`
   - Ở các query trả module (`listModules`, `listEnabledModules`, `listModulesByCategory`, `getModuleByKey`), normalize khi `key === 'roles'` thì trả `isCore: false`.
   - Không cần migration/manual reseed, hiệu lực ngay cả với DB cũ.
   - Reflection: ✓ xử lý gốc vấn đề “dữ liệu cũ còn isCore=true”.

4. Giữ seeder đúng chuẩn cho dữ liệu mới
   - File: `convex/seeders/adminModules.seeder.ts`
   - Đảm bảo record roles vẫn `isCore: false` (đã đổi trước đó, giữ nguyên).
   - Reflection: ✓ dữ liệu tạo mới không tái phát bug.

5. Verify & commit
   - Chạy `bunx tsc --noEmit`.
   - Commit local theo style repo, include `.factory/docs` nếu có.

## Checklist sau fix
- [ ] Roles không còn badge Core ở `/system/modules`.
- [ ] Toggle roles bấm được bình thường.
- [ ] Không ảnh hưởng các core module khác (vẫn khóa như cũ).
- [ ] DB cũ chưa reseed vẫn hiển thị đúng nhờ normalize ở query.
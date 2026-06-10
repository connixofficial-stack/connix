## Problem Graph
1. [Main] Hỗ trợ thêm/xóa bớt Super Admin tại `/system/admin-config` nhưng vẫn khóa thao tác Super Admin ở `/admin/users` <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Dữ liệu/Mutation trong `convex/auth.ts` đang thiết kế cho mô hình **1 Super Admin duy nhất** (`getSuperAdmin`, `createSuperAdmin`, `updateSuperAdminCredentials`)
   1.2 [Sub] UI `app/system/admin-config/page.tsx` chỉ có form đơn, chưa có danh sách + thao tác promote/demote an toàn
   1.3 [Sub] Cần giữ đúng guard hiện có ở `/admin/users` để Super Admin không bị sửa/xóa từ admin side

## Execution (with reflection)
1. Solving 1.1.1 (Backend API cho multi Super Admin trong System)
   - Thought: Giữ API cũ để tương thích phần khác, bổ sung API mới cho System page.
   - Action:
     - Trong `convex/auth.ts`, thêm query `listSuperAdmins` trả danh sách users có role `isSuperAdmin=true` (id, email, name, status, createdAt).
     - Thêm query `listAdminUsersForSystem` dùng nguồn `users` + `roles` để hiển thị user bên `/admin/users` cho mục chọn nhanh (có search, limit 20-50, loại user đã là super admin).
     - Thêm mutation `addSuperAdmin`:
       - Cho phép 2 mode: `existingUserId` (promote user có sẵn) hoặc `newUser` (tạo mới với email/password/name).
       - Validate chống trùng email, chống promote user không tồn tại.
       - Bảo đảm role `Super Admin` tồn tại; nếu thiếu thì tạo như logic hiện có.
       - Cập nhật `userStats` khi tạo user mới.
     - Thêm mutation `demoteSuperAdmin`:
       - Nhận `userId`, chuyển role về `Admin` (fallback role không phải super admin nếu thiếu Admin).
       - Chặn demote nếu tổng số super admin hiện tại <= 1 (theo yêu cầu giữ tối thiểu 1).
     - Tối ưu truy vấn theo nguyên tắc hiện có: limit hợp lý, không fetch dư.
   - Reflection: ✓ Phù hợp yêu cầu “thêm hoặc xóa bớt” + “tối thiểu 1” + tái sử dụng users data từ admin side.

2. Solving 1.2 (UI/UX gọn cho `/system/admin-config`)
   - Thought: Dùng layout 2 khối đơn giản: danh sách hiện tại + form thêm mới/promote, tránh rối.
   - Action (file `app/system/admin-config/page.tsx`):
     - Thay `getSuperAdmin` bằng `listSuperAdmins`.
     - Khu A: danh sách Super Admin hiện tại (table/card gọn): tên, email, trạng thái, ngày tạo, nút “Gỡ quyền” (disable khi còn 1 người).
     - Khu B: tab hoặc segmented control:
       1) “Nâng quyền user có sẵn”: search/select từ `listAdminUsersForSystem`.
       2) “Tạo mới + cấp quyền”: email/name/password/confirmPassword.
     - Validate client:
       - Password >= 6, confirm khớp.
       - Không submit rỗng.
     - Sau mutation thành công: toast + reset form + tự refresh query.
     - Cập nhật khối ghi chú để phản ánh rule mới (nhiều super admin, min = 1, admin/users không đụng được).
   - Reflection: ✓ Gọn, đúng ý “có tạo trong system và cả nâng”, dữ liệu lấy từ users hiện hữu.

3. Solving 1.3 (Giữ an toàn ở `/admin/users`)
   - Thought: Guard đã có trong `convex/users.ts` + UI `app/admin/users/page.tsx`; cần đảm bảo không bị regress khi có nhiều super admin.
   - Action:
     - Không nới lỏng các guard `assertCanModifySuperAdmin`/`assertNotSuperAdmin`.
     - Chỉ verify logic hiển thị `isSuperAdmin` theo role map vẫn hoạt động cho nhiều user super admin.
   - Reflection: ✓ Đúng yêu cầu “super admin không được đụng đến ở /admin/users”.

4. Verify & commit
   - Action:
     - Chạy đúng lệnh theo rule repo: `bunx tsc --noEmit` (chỉ khi có thay đổi TS/code).
     - Kiểm tra `git status`, `git diff --cached` để soát secrets.
     - Commit theo convention hiện tại, ví dụ: `feat(system): manage multiple super admins in admin config`.
     - Khi commit, add kèm `.factory/docs` nếu có thay đổi trong thư mục này.
   - Reflection: ✓ Đúng guideline dự án.

## File dự kiến thay đổi
- `convex/auth.ts` (thêm list/add/demote APIs cho super admin trong system)
- `app/system/admin-config/page.tsx` (đổi từ single-form sang màn hình quản lý nhiều super admin)
- Có thể thêm type cục bộ trong page nếu cần (không tạo layer thừa).

## Acceptance checklist
- Có thể thêm Super Admin theo 2 cách: promote user có sẵn hoặc tạo mới tại system.
- Có thể demote Super Admin tại system.
- Không thể demote người cuối cùng (min 1).
- `/admin/users` vẫn không sửa/xóa được user có role super admin.
- TypeScript pass với `bunx tsc --noEmit`.
- Có commit local, không push.
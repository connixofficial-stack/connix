## Problem Graph
1. [Main] Đồng bộ hành vi khi tắt/bật `roles` để `/admin/users` không còn phụ thuộc UI Role nhưng dữ liệu vẫn an toàn <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `users` luôn yêu cầu `roleId` ở DB, nhưng UI hiện luôn bắt chọn role
   1.2 Khi tắt `roles`, quyền vẫn đang đi qua `rbac` nếu chưa ép mode phù hợp
   1.3 Khi bật lại, cần giữ tính ổn định: admin thường vẫn full quyền như anh yêu cầu

## Execution (with reflection)
1. Cập nhật backend toggle module roles tại `convex/admin/modules.ts`
   - Thought: toggle `roles` phải đi kèm policy quyền toàn cục để không lệch trạng thái.
   - Action:
     - Trong `toggleModuleWithCascade` và `toggleModule`:
       - Khi `args.key === "roles" && args.enabled === false`: upsert setting `admin_permission_mode = "simple_full_admin"` (group: `auth` hoặc group hiện đang dùng cho key này nếu đã có).
       - Khi `args.key === "roles" && args.enabled === true`: **vẫn giữ** `admin_permission_mode = "simple_full_admin"` (theo yêu cầu: bật lại vẫn full quyền cho admin thường).
     - Không sửa `roleId` của user hiện hữu.
   - Reflection: ✓ Đảm bảo bật/tắt nhiều lần không làm hỏng dữ liệu role và không phát sinh rollback quyền khó đoán.

2. Cập nhật API tạo user để xử lý khi roles đang tắt tại `convex/users.ts`
   - Thought: DB bắt buộc `roleId`, nên phải có fallback deterministic cho user tạo mới.
   - Action:
     - Mở rộng `create` mutation:
       - Cho phép nhận `roleId` optional ở input validator.
       - Đọc module `roles` trong `adminModules` bằng index `by_key`.
       - Nếu `roles` đang tắt:
         - Nếu FE không gửi `roleId`, tự tìm role `Admin` (by_name) và gán mặc định.
         - Nếu không có role `Admin`, fallback role đầu tiên `isSuperAdmin !== true`.
         - Nếu vẫn không có, throw lỗi rõ ràng.
       - Nếu `roles` đang bật: giữ behavior hiện tại (bắt buộc roleId).
     - Giữ nguyên logic bảo vệ super admin đang có.
   - Reflection: ✓ User tạo trong lúc tắt roles vẫn hợp lệ dữ liệu; bật lại không lỗi và không cần migration.

3. Cập nhật UI `/admin/users/create` tại `app/admin/users/create/page.tsx`
   - Thought: UX phải phản ánh trạng thái module roles, không để field “Vai trò” gây hiểu nhầm.
   - Action:
     - Query thêm `api.admin.modules.getModuleByKey({ key: "roles" })`.
     - Nếu roles tắt:
       - Ẩn dropdown “Vai trò”.
       - Hiển thị note: “Đang dùng quyền full admin, user mới sẽ gán role Admin mặc định”.
       - Bỏ validate bắt chọn role ở client.
       - Khi submit, không gửi `roleId`.
     - Nếu roles bật: giữ nguyên dropdown và validate như cũ.
   - Reflection: ✓ Đúng kỳ vọng “tắt roles thì không còn trường vai trò”.

4. Cập nhật UI `/admin/users/[id]/edit` tại `app/admin/users/[id]/edit/page.tsx`
   - Thought: khi roles tắt, chỉnh user không nên cho đổi role để tránh semantic mâu thuẫn.
   - Action:
     - Dùng cùng query trạng thái module roles.
     - Nếu roles tắt: ẩn dropdown role, giữ nguyên roleId hiện tại khi update.
     - Nếu roles bật: giữ behavior hiện tại.
   - Reflection: ✓ Tránh chỉnh role trong lúc hệ thống không chạy RBAC.

5. Cập nhật list `/admin/users` tại `app/admin/users/page.tsx`
   - Thought: cột/lọc Role khi roles tắt gây nhiễu và không có giá trị vận hành.
   - Action:
     - Dựa trên trạng thái module roles để:
       - Ẩn filter “Tất cả vai trò”.
       - Ẩn cột “Vai trò” (và bỏ mặc định visible column role khi roles tắt).
       - Export CSV: bỏ cột role khi roles tắt hoặc set giá trị cố định “Full Admin Mode”.
   - Reflection: ✓ Giao diện nhất quán với mode quyền hiện hành.

6. Tinh chỉnh điều hướng để tránh vào `/admin/roles` khi module tắt tại `app/admin/components/Sidebar.tsx` (nếu cần)
   - Thought: hiện section users hiển thị khi users OR roles bật; cần tránh link chết/không cần thiết.
   - Action:
     - Giữ section users nếu `users` bật.
     - Chỉ hiển thị subitem “Phân quyền” khi `roles` bật.
   - Reflection: ✓ Điều hướng sạch, không tạo nhầm lẫn.

7. Kiểm thử và xác nhận hành vi
   - Chạy `bunx tsc --noEmit`.
   - Manual test matrix:
     - Roles ON: tạo/sửa user cần chọn role.
     - Tắt Roles: user form không có role field, tạo user mới tự gán Admin.
     - Bật lại Roles: admin thường vẫn full quyền, user cũ/mới không lỗi roleId.
     - Bật/tắt nhiều lần liên tiếp: không mutation dữ liệu role hàng loạt, không xung đột.

## Checklist chốt cho anh
- [x] Tắt roles thì UI users không còn trường vai trò.
- [x] User mới khi roles tắt tự gán role Admin mặc định.
- [x] Không đụng dữ liệu roleId user cũ (an toàn bật lại).
- [x] Bật lại roles vẫn giữ full quyền cho admin thường.
- [x] Tránh xung đột dữ liệu khi bật/tắt module về sau.
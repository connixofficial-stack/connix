## Problem Graph
1. [Main] Super Admin vẫn có thể bị xóa và chưa có nhận diện rõ ở `/admin/users` khi module roles tắt/mở <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Backend `users.remove` / `users.bulkRemove` chỉ chặn non-super-admin, chưa chặn tuyệt đối
   1.2 [ROOT CAUSE] UI list users chưa có cờ `isSuperAdmin` ở tầng hiển thị để ẩn nút xóa
   1.3 [ROOT CAUSE] Khi roles tắt, luồng hiển thị role bị giản lược nên càng khó nhận diện tài khoản Super Admin

## Execution (with reflection)
1. Siết rule backend “Cấm xóa tuyệt đối Super Admin”
   - File: `convex/users.ts`
   - Thay đổi:
     - Thêm helper kiểm tra target user có role `isSuperAdmin` hay không.
     - `remove`: nếu target là Super Admin => throw lỗi cố định (không phụ thuộc người thao tác).
     - `bulkRemove`: lọc danh sách users, nếu có bất kỳ Super Admin => throw lỗi, không xóa ai.
   - Reflection: ✓ Chặn dứt điểm ở server, UI có lỗi cũng không thể xóa nhầm.

2. Bổ sung dữ liệu cờ Super Admin cho trang users
   - File: `app/admin/users/page.tsx`
   - Thay đổi:
     - Luôn dựng map role (kể cả roles module tắt) để xác định `isSuperAdmin` theo `user.roleId`.
     - Mở rộng type `AdminUserWithRole` thêm `isSuperAdmin: boolean`.
     - Không phụ thuộc cột “Vai trò” đang bật/tắt để tính cờ này.
   - Reflection: ✓ Đảm bảo logic nhận diện Super Admin chạy trong mọi mode.

3. UI/UX khác biệt cho Super Admin theo yêu cầu
   - File: `app/admin/users/page.tsx`
   - Thay đổi:
     - Thêm badge nổi bật “Super Admin” ngay tại cột Người dùng.
     - Highlight nhẹ toàn row của Super Admin (màu nền/viền nhẹ, giữ theme sáng/tối).
     - Ẩn nút xóa cho user có `isSuperAdmin === true`.
     - Ở bulk selection: không cho tick Super Admin (disable checkbox + tooltip ngắn).
   - Reflection: ✓ Vừa dễ nhận diện vừa giảm thao tác nguy hiểm từ UI.

4. Đồng bộ thông báo lỗi thân thiện khi cố xóa Super Admin
   - File: `app/admin/users/page.tsx`
   - Thay đổi:
     - Catch message backend mới và hiển thị toast rõ: “Không thể xóa tài khoản Super Admin”.
   - Reflection: ✓ Người dùng hiểu rule ngay, không mơ hồ.

5. Kiểm thử
   - Chạy: `bunx tsc --noEmit`
   - Test tay các case:
     - Xóa 1 Super Admin từ nút row => không có nút xóa.
     - Gọi API xóa trực tiếp Super Admin => bị chặn.
     - Bulk có chứa Super Admin => bị chặn toàn bộ.
     - Module roles tắt: badge + highlight Super Admin vẫn còn, vẫn không xóa được.

## Checklist chốt
- [x] Cấm xóa Super Admin tuyệt đối ở backend
- [x] Có cờ nhận diện Super Admin rõ ràng ở `/admin/users`
- [x] UI khác biệt: badge + highlight row + ẩn nút xóa
- [x] Áp dụng cả khi module phân quyền tắt
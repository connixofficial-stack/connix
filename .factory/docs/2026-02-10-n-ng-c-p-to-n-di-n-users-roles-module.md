
# Nâng cấp toàn diện Users & Roles Module

## Tổng quan
Thực hiện tuần tự 4 phase: Fix bugs UX → Enforce Permission → Tính năng thiếu → Hợp nhất users/adminUsers + bcrypt.

---

## Phase 1: Fix bugs & UX (nhỏ, nhanh)

**1.1** Thêm status "Banned" vào form tạo user (`/admin/users/create/page.tsx`)

**1.2** Thêm `bulkRemove` mutation cho roles (`convex/roles.ts`) - tương tự pattern `users.bulkRemove`

**1.3** Đổi `confirm()` native thành `DeleteConfirmDialog` trong bulk delete roles (`/admin/roles/page.tsx`)

**1.4** Thống nhất UX: sau khi edit thành công → toast + option redirect về list

---

## Phase 2: Enforce Permission

**2.1** Sử dụng `hasPermission()` từ `useAdminAuth()` trong các admin pages:
- Ẩn nút "Thêm" nếu không có quyền `create`
- Ẩn nút "Sửa/Xóa" nếu không có quyền `edit/delete`
- Redirect nếu không có quyền `view`

**2.2** Thêm permission check vào Convex mutations quan trọng:
- `users.create/update/remove/bulkRemove`
- `roles.create/update/remove`
- Pattern: nhận `token` arg → verify session → check permission → thực thi

---

## Phase 3: Tính năng thiếu phổ biến

**3.1** **Change/Reset Password**: Thêm trường password vào user create/edit form, mutation `users.changePassword`

**3.2** **Clone Role**: Nút "Nhân bản" trên roles list → tạo role mới với permissions copy + tên "{name} (Copy)"

**3.3** **Export Users CSV**: Nút "Xuất CSV" trên users list → export danh sách hiện tại (theo filter) ra file CSV

**3.4** **Batch Status Change**: Chọn nhiều users → dropdown đổi status (Active/Inactive/Banned) thay vì chỉ xóa

**3.5** **User Activity Timeline**: Tab/section trong trang edit user hiển thị 10 activity logs gần nhất (đã có query `activityLogs.getRecentByUser`)

---

## Phase 4: Hợp nhất users/adminUsers + Bảo mật

**4.1** **Hợp nhất `users` và `adminUsers`** thành 1 table `users`:
- Thêm trường `passwordHash` vào `users` table
- Migrate logic auth từ `adminUsers` sang `users`
- Xóa table `adminUsers` + `adminSessions` (dùng lại session logic với `users`)
- Cập nhật `auth.ts`: login/verify/logout đều dùng `users` table
- Cập nhật admin auth context

**4.2** **Đổi `simpleHash` sang bcrypt**:
- Tạo Convex action (không phải mutation) để hash password bằng bcrypt
- Cập nhật login verify dùng bcrypt compare

**4.3** **Chuyển system password sang `.env`**:
- Đọc `SYSTEM_EMAIL` + `SYSTEM_PASSWORD_HASH` từ environment
- Xóa hardcode trong `auth.ts`

**4.4** Cập nhật seed data: seed users có passwordHash

---

## Files chính cần sửa

| File | Thay đổi |
|------|----------|
| `convex/schema.ts` | Thêm `passwordHash` vào users, xóa adminUsers/adminSessions |
| `convex/users.ts` | Thêm `changePassword`, `bulkStatusChange` |
| `convex/roles.ts` | Thêm `bulkRemove`, `clone` |
| `convex/auth.ts` | Hợp nhất auth sang users table, bcrypt action, env password |
| `convex/seed.ts` | Cập nhật seed users có password |
| `app/admin/users/create/page.tsx` | Thêm Banned status, password field |
| `app/admin/users/[id]/edit/page.tsx` | Thêm change password, activity timeline |
| `app/admin/users/page.tsx` | Export CSV, batch status change, permission check |
| `app/admin/roles/page.tsx` | Clone role, bulk delete dialog, permission check |
| `app/admin/roles/create/page.tsx` | Permission check |
| `app/admin/auth/context.tsx` | Đổi từ adminUsers sang users |
| `.env.local` | Thêm SYSTEM_EMAIL, SYSTEM_PASSWORD_HASH |

---

## Thứ tự thực hiện
Phase 1 → 2 → 3 → 4 (tuần tự, mỗi phase commit riêng)

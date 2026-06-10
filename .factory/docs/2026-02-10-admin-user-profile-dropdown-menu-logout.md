
## Problem Graph (DARE)

```
1. [Main] Sidebar user section set cung, khong logout duoc, khong quan ly tai khoan
   1.1 [ROOT CAUSE #1] Sidebar hien hardcoded "Admin User" / "admin@vietadmin.com"
   1.2 [ROOT CAUSE #2] LogOut icon chi la decoration, khong goi logout()
   1.3 [ROOT CAUSE #3] Khong co trang /admin/profile
   1.4 [Sub] verifyAdminSession khong tra ve avatar
   1.5 [Sub] AdminUser interface thieu avatar
```

---

## Chi tiet Implementation (full, khong chia phase)

### Task 1: Backend - Bo sung avatar vao verifyAdminSession
**File:** `convex/auth.ts` - ham `verifyAdminSession`
- Them `avatar` vao object user tra ve (lay tu `adminUser.avatar`)
- Update `returns` validator tuong ung (them `avatar: v.optional(v.string())`)

### Task 2: Backend - Tao mutation `changeMyPassword` trong `convex/auth.ts`
- Args: `{ token, currentPassword, newPassword }`
- Verify session tu token -> lay userId
- Verify `currentPassword` khop voi passwordHash hien tai (dung `verifyPassword`)
- Validate `newPassword.length >= 6`
- Hash va update passwordHash
- Khong can `requireAdminPermission` vi user tu doi cho chinh minh
- Returns: `{ success, message }`

### Task 3: Frontend - Update AdminUser interface & context
**File:** `app/admin/auth/context.tsx`
- Them `avatar?: string` vao `AdminUser` interface
- Map `avatar` tu `sessionResult.user.avatar` vao user object

### Task 4: Frontend - Fix Sidebar user section
**File:** `app/admin/components/Sidebar.tsx`
- Import `useAdminAuth` tu context
- Thay hardcoded "Admin User" / "admin@vietadmin.com" bang `user.name` / `user.email`
- Thay hardcoded avatar picsum bang `user.avatar` (fallback ve initials/default)
- Them state `showUserMenu` de toggle dropdown
- Khi click vao user section -> hien dropdown menu voi 2 item:
  - **Profile** (Link to `/admin/profile`) - icon User
  - **Dang xuat** (goi `logout()` -> redirect `/admin/auth/login`) - icon LogOut
- Click ngoai dropdown -> dong
- Khi sidebar collapsed -> click van mo dropdown (positioned absolute)

### Task 5: Frontend - Tao trang /admin/profile
**File moi:** `app/admin/profile/page.tsx`
- Layout don gian (card-based, giong style cac trang khac trong admin)
- **Section 1: Thong tin tai khoan** (chi doc)
  - Hien thi: Avatar, Ten, Email, Role (lay tu `useAdminAuth()`)
- **Section 2: Doi mat khau**
  - Form 3 fields: Mat khau hien tai, Mat khau moi, Xac nhan mat khau moi
  - Validate: mat khau moi >= 6 ky tu, 2 fields khop nhau
  - Goi mutation `changeMyPassword` 
  - Hien toast success/error (dung `sonner` da co)
- **Nut Dang xuat** o cuoi trang
  - Goi `logout()` -> redirect `/admin/auth/login`

### Task 6: Lint + Test
- Chay `bunx oxlint --type-aware --type-check --fix` 
- Verify UI: dropdown menu hoat dong, profile page render, doi mat khau, logout redirect

### Task 7: Git commit

---

### Tong ket thay doi:
| File | Action |
|------|--------|
| `convex/auth.ts` | Sua verifyAdminSession (them avatar), them changeMyPassword mutation |
| `app/admin/auth/context.tsx` | Them avatar vao interface + map |
| `app/admin/components/Sidebar.tsx` | Fix hardcoded user, them dropdown menu |
| `app/admin/profile/page.tsx` | **Moi** - Trang profile + doi mat khau |

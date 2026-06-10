
## Mục tiêu
Cho phép lưu mật khẩu **plain text** trong `.env.local` thay vì bcrypt hash, hệ thống tự hash khi verify.

## Thay đổi

### 1. `.env.local.example` - Đổi tên biến cho rõ ràng
```env
SYSTEM_EMAIL=admin
SYSTEM_PASSWORD=Admin@123
```
(Bỏ `SYSTEM_PASSWORD_HASH`, thay bằng `SYSTEM_PASSWORD`)

### 2. `convex/auth.ts` - Sửa logic verify system login
```ts
const SYSTEM_EMAIL = process.env.SYSTEM_EMAIL;
const SYSTEM_PASSWORD = process.env.SYSTEM_PASSWORD;

// Trong verifySystemLogin handler:
// So sánh trực tiếp plain text thay vì bcrypt verify
if (args.password !== SYSTEM_PASSWORD) {
  return { message: "Thông tin đăng nhập không đúng", success: false };
}
```
- Bỏ import/dùng `verifyPassword` cho system login
- So sánh `args.password === SYSTEM_PASSWORD` trực tiếp

### 3. `.env.local` - User tự cập nhật
```env
SYSTEM_EMAIL=admin
SYSTEM_PASSWORD=Admin@123
```

## Lưu ý
- Chỉ ảnh hưởng `/system/auth/login` (developer access) - không ảnh hưởng admin/customer auth
- System login vốn là single hardcoded account cho dev, nên plain text trong env là chấp nhận được
- Admin login (`/admin`) vẫn giữ bcrypt hash trong DB như cũ

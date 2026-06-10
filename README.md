# VietAdmin Next.js

Hệ thống quản trị website full-stack dùng Next.js + Convex, tập trung cấu hình module và trải nghiệm trong `/system`.

## 1) Công nghệ chính

- Next.js 16 (App Router), React 19, TypeScript
- Convex (database + API realtime)
- Tailwind CSS 4, Shadcn UI, Lucide React

## 2) Yêu cầu môi trường

- Node.js 20+
- Bun (khuyến nghị)

## 3) Cài đặt và chạy local

```bash
# 1) Cài dependency
bun install

# 2) Tạo file env local (nếu chưa có)
cp .env.local.example .env.local

# 3) Chạy Convex dev (terminal 1)
bunx convex dev

# 4) Chạy Next.js dev (terminal 2)
bun run dev
```

Truy cập nhanh:
- Site: `http://localhost:3000`
- System Admin: `http://localhost:3000/system`

## 4) Scripts chính

```bash
bun run dev      # chạy local
bun run build    # build production
bun run start    # chạy production build
bun run lint     # eslint
```

## 5) Cấu hình môi trường tối thiểu

Tham chiếu trong `.env.local.example`:

- `NEXT_PUBLIC_CONVEX_URL`: URL project Convex
- `SYSTEM_EMAIL`: tài khoản đăng nhập hệ thống
- `SYSTEM_PASSWORD`: mật khẩu đăng nhập hệ thống
- `SEED_USER_PASSWORD`: mật khẩu seed mặc định (tuỳ chọn)

## 6) Cấu trúc thư mục chính

```text
app/
  (site)/        # giao diện public
  system/        # trang quản trị hệ thống
  admin/         # khu vực admin cũ
components/      # UI components
convex/          # schema, queries, mutations
docs/            # tài liệu kỹ thuật nội bộ
lib/             # utilities và helpers
```

## 7) Ghi chú nhanh

- Dữ liệu backend chạy qua Convex trong thư mục `convex/`.
- Khi thêm/sửa cấu hình hệ thống, ưu tiên thao tác ở `/system` trước.
- Project là private nội bộ
# SEO & Performance Audit — Trang chủ (Homepage)

> **Ngày audit:** 2026-05-01 | **Status: ĐÃ IMPLEMENT**

---

## Tóm tắt thay đổi

| # | Vấn đề | Mức độ | Status |
|---|--------|--------|--------|
| 1 | `force-dynamic` ở root layout — vô hiệu hóa caching toàn bộ | Critical | ✅ Fixed |
| 2 | Duplicate generateMetadata — homepage metadata ở cả page.tsx và layout.tsx | High | ✅ Fixed |
| 3 | OG title lặp `"Site Name \| Site Name"` | High | ✅ Fixed |
| 4 | Thiếu `<h1>` khi Hero style ≠ fullscreen | High | ✅ Fixed |
| 5 | ISR chưa bật cho site layout | Medium | ✅ Fixed |

## Chi tiết thay đổi

### 1. Bỏ `force-dynamic` — `app/layout.tsx`
- Xóa `export const dynamic = "force-dynamic"` (line 111)
- Impact: toàn bộ child routes recovery ISR/static — 12+ routes đã có `revalidate` giờ hoạt động lại
- Lý do an toàn: admin/system đã realtime qua Convex WebSocket, public site cũng có realtime client-side

### 2. Bỏ duplicate generateMetadata — `app/(site)/page.tsx`
- Xóa `generateMetadata` export + related imports
- Layout `(site)/layout.tsx` đã handle metadata cho routeType `home` với `useTitleTemplate: true`
- Tránh metadata conflict khi Next.js merge page + layout metadata

### 3. Fix OG title duplication — `lib/seo/metadata.ts`
- Thêm guard: khi `title === siteName`, skip append `| siteName` → tránh `"X | X"`
- Fix ở cả `buildMetadata` (legacy) và `buildSeoMetadata` (new)

### 4. Thêm `<h1>` cho mọi Hero style — `HeroRuntimeSection.tsx`
- `slider`, `fade`, `bento`, `parallax`: thêm `<h1 className="sr-only">`
- `split`: đổi `<h2>` → `<h1>` (đã visible)
- `fullscreen`: giữ nguyên (đã có `<h1>`)

### 5. Thêm ISR cho site layout — `app/(site)/layout.tsx`
- `export const revalidate = 1800` (30 phút)
- On-demand revalidation đã có sẵn qua `seo-revalidate` action

## Verification
- `bunx tsc --noEmit` → ✅ Pass (exit code 0)

## Chưa xử lý (Out of Scope)
- Cải thiện SSR sâu cho homepage (scope lớn, cần plan riêng)
- Tối ưu font loading (12 fonts, đã có `preload: false` cho hầu hết)
- Alt text cho Hero/Stats images (cần thêm field alt vào data model)
- Bundle size / Core Web Vitals (cần production data)

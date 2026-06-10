## Problem Graph
1. [Main] Partners style `badge` render ở site không khớp preview <- depends on 1.1, 1.2
   1.1 [Sub] Logic render `badge` trong `components/site/ComponentRenderer.tsx` khác `PartnersPreview.tsx`
      1.1.1 [ROOT CAUSE] Site render dùng fallback badge cũ, hard-code sai token màu + text + số item
   1.2 [Sub] Thiếu chuẩn dùng shared renderer cho style `badge`

## Root cause cụ thể
Trong `ComponentRenderer.tsx` (nhánh Partners -> badge fallback), có nhiều sai lệch so với preview:
- Dùng `secondary` thay vì `brandColor` cho nền/viền badge.
- `style={{ color: `cc` }}` bị hard-code sai (invalid color), khiến text không theo brand.
- Text badge luôn `Đối tác {idx+1}` thay vì ưu tiên `item.name`.
- Site render cố định `slice(0, 6)` trong khi preview responsive theo device.
=> Kết quả: layout badge ở preview đúng, nhưng site render nhìn khác đáng kể.

## Execution plan (chi tiết, implement 1 lần)
1. **Chuẩn hóa logic badge tại site render**
   - File: `components/site/ComponentRenderer.tsx`
   - Ở phần Partners style badge:
     - Đổi palette từ `secondary` sang `brandColor` để khớp preview.
     - Sửa text color thành `${brandColor}cc` (hoặc token tương đương hợp lệ).
     - Sửa label: `item.name ?? `Đối tác ${idx + 1}``.
     - Thêm “+N” badge khi vượt số item hiển thị (đồng bộ behavior preview desktop).

2. **Đồng bộ markup/style với preview**
   - File: `components/site/ComponentRenderer.tsx`
   - Cập nhật class & spacing badge về cùng pattern:
     - Container: `flex flex-wrap items-center justify-center gap-2`
     - Item: `px-3 py-2 rounded-lg border flex items-center gap-2`
     - Logo size: `h-6 w-auto` (giống preview badge).
   - Điều này giúp nhìn giống preview hơn, không chỉ đúng màu.

3. **Giảm drift bằng cách tái sử dụng shared component (khuyến nghị mạnh)**
   - File mới: `app/admin/home-components/partners/_components/PartnersBadgeShared.tsx`
   - Trích toàn bộ badge block thành shared component nhận props:
     - `items`, `brandColor`, `title`, `maxVisible` (default 6), `renderImage`, `openInNewTab`, `className`.
   - Dùng shared này ở cả:
     - `app/admin/home-components/partners/_components/PartnersPreview.tsx` (badge mode)
     - `components/site/ComponentRenderer.tsx` (badge style)
   - Lợi ích: 1 nguồn sự thật, tránh lệch logic lần sau.

4. **Đảm bảo backward compatibility dữ liệu cũ**
   - File: `components/site/ComponentRenderer.tsx`
   - Khi map `items`, vẫn fallback an toàn nếu thiếu `name/link/url`.
   - Không đổi schema config Convex, chỉ đổi render layer.

5. **Validation (theo rule repo)**
   - Chạy: `bunx tsc --noEmit`
   - Nếu lỗi, fix hết rồi chạy lại tới khi pass.

6. **Commit sau khi pass**
   - Commit message đề xuất: `fix(partners): align badge site render with preview`
   - Chỉ commit file code liên quan, không đụng docs/README.

## Expected outcome
- Style `badge` ở trang home render ra giống preview trong trang edit.
- Màu sắc, text label, spacing, số lượng item hiển thị và badge `+N` nhất quán.
- Giảm rủi ro mismatch cho các lần chỉnh sửa sau nếu dùng shared component.
## Audit Summary
- **Observation (triệu chứng):** Ở create/edit Contact (`/admin/home-components/create/contact`, `/admin/home-components/contact/[id]/edit`), icon social **Zalo/TikTok hiển thị sai** so với Footer.
- **Evidence:**
  - Contact đang map `zalo` sang `MessageCircle`, và **không có** map `tiktok` custom tại `app/admin/home-components/contact/_components/ContactSectionShared.tsx` (dòng grep: `zalo: MessageCircle`).
  - Footer preview có `TikTokIcon` + `ZaloIcon` custom đúng shape tại `app/admin/home-components/footer/_components/FooterPreview.tsx` (các case `tiktok`, `zalo`).
  - Icon chuẩn đã tồn tại dạng shared tại `components/site/SocialIcons.tsx` (`TikTokIcon`, `ZaloIcon`).
- **Expected vs Actual:**
  - Expected: Contact create/edit preview dùng icon TikTok/Zalo giống Footer.
  - Actual: Contact dùng icon Lucide generic cho Zalo, TikTok fallback `Globe`.
- **Phạm vi ảnh hưởng:** UI preview Contact trong admin create/edit (mọi style có social links).
- **Repro tối thiểu:** Mở route user đưa, bật social links có `tiktok`/`zalo`, so với preview Footer.
- **Giả thuyết thay thế đã loại trừ:** Không phải do màu/social token (màu đã map đúng), nguyên nhân nằm ở icon component mapping.
- **Tiêu chí pass/fail:** Pass khi Contact preview hiển thị glyph TikTok/Zalo khớp Footer ở cả create và edit.

## Root Cause Confidence
- **High (92%)**: Contact có icon map riêng bị thiếu/sai cho `tiktok`/`zalo`, trong khi Footer đã có icon custom đúng; bằng chứng trực tiếp từ source mapping.

## Đề xuất triển khai
### Option A (Recommend) — Confidence 90%
- Chỉ sửa tại `ContactSectionShared.tsx`:
  1. Thêm `TikTokIcon` và `ZaloIcon` (giống Footer/hoặc wrap từ shared).
  2. Cập nhật `iconMap`:
     - `tiktok: TikTokIcon`
     - `zalo: ZaloIcon` (thay `MessageCircle`).
  3. Giữ nguyên các platform khác để giảm rủi ro.
- **Vì sao recommend:** scope nhỏ, rollback dễ, đúng yêu cầu “audit kỹ + học từ footer” mà không mở rộng.

### Option B — Confidence 78%
- Chuẩn hoá DRY:
  1. Dùng `components/site/SocialIcons.tsx` làm nguồn icon TikTok/Zalo cho cả ContactSectionShared và FooterPreview.
  2. Bổ sung adapter typing nếu cần (`className` optional).
- **Khi phù hợp:** muốn ngăn lệch icon lâu dài giữa các component.
- **Tradeoff:** thay đổi nhiều file hơn, rủi ro regression cao hơn Option A.

## Verification Plan
1. Static review sau sửa: kiểm tra `iconMap` trong Contact có `tiktok/zalo` trỏ đúng component custom.
2. So khớp UI logic create/edit đều đi qua `ContactPreview -> ContactSectionShared`.
3. Chạy `bunx tsc --noEmit` (theo rule repo khi có đổi code TS).
4. Đối chiếu bằng mắt ở 2 route create/edit: icon TikTok/Zalo phải trùng Footer preview.
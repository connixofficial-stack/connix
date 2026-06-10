## Mục tiêu
Implement full fix màu cho home-component Partners (6 layouts: grid, marquee, mono, badge, carousel, featured) theo skill `dual-brand-color-system` để preview/render đồng nhất, pass checklist dual-brand, APCA cơ bản và anti-opacity rules.

## Phạm vi file sẽ sửa
1. `app/admin/home-components/partners/_lib/colors.ts` (tạo mới)
2. `app/admin/home-components/partners/_components/PartnersPreview.tsx`
3. `app/admin/home-components/partners/_components/PartnersMarqueeShared.tsx`
4. `app/admin/home-components/partners/_components/PartnersBadgeShared.tsx`
5. `app/admin/home-components/partners/_components/PartnersCarouselShared.tsx`
6. `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
7. `components/site/ComponentRenderer.tsx` (nếu cần truyền đủ props/mode để site dùng đúng helper)
8. `app/admin/home-components/partners/[id]/edit/page.tsx` (nếu cần cảnh báo/validation dual mode)

## Kế hoạch implement chi tiết
1. **Tạo color engine dùng chung cho Partners**
   - Thêm `getPartnersColors(primary, secondary, mode?)` trong `_lib/colors.ts`.
   - Dùng OKLCH để sinh palette solid (không dùng `${color}XX`):
     - `headingAccent`, `cardBorder`, `cardBg`, `subtleBg`, `pillBg`, `pillText`, `navBorder`, `navText`, `dotActive`, `dotInactive`, `featuredBadgeBg`, `featuredBadgeText`.
   - Thêm resolve secondary theo mode:
     - `single` => secondaryResolved = primary.
     - `dual` => secondary hợp lệ thì dùng, không thì fallback harmony từ primary.
   - Thêm helper chọn text APCA cho nền solid/tint (`textOnPrimary`, `textOnSecondary`).

2. **Refactor PartnersPreview để không ignore secondary**
   - Bỏ `secondary: _secondary`, nhận `secondary` thật.
   - Khởi tạo palette từ `getPartnersColors(...)` và truyền xuống toàn bộ shared layouts.
   - Chuyển các inline style opacity hiện tại sang token palette.
   - Heading trong tất cả layout preview dùng primary theo rule.

3. **Refactor Grid layout**
   - Border/card/+N dùng solid tint từ palette thay `${brandColor}10/15/20`.
   - `+N` badge chuyển thành secondary accent (text/icon/bg theo palette).
   - Empty state icon giữ primary, nền neutral/subtle đúng rule placeholder.

4. **Refactor Marquee + Mono layouts**
   - Loại bỏ hiệu ứng color opacity cứng; dùng palette solid.
   - Gradient edge chuyển sang neutral token (không hardcode trắng tuyệt đối nếu gây lệch dark/brand).
   - Giữ motion tối giản; không thêm decorative effects.

5. **Refactor Badge layout**
   - Badge item bg/border/text dùng token APCA-safe.
   - Label/meta thiên secondary (đúng vai trò accent phụ), heading vẫn primary.
   - `remaining` chip (`+N`) dùng secondary nổi bật vừa đủ.

6. **Refactor Carousel layout**
   - Nút prev/next: primary cho control chính.
   - Pagination active dot: secondary (theo Element-Level rule).
   - Dot inactive dùng neutral token, không opacity màu brand cứng.
   - Item card bg/border chuyển sang solid tint.

7. **Refactor Featured layout**
   - Badge `NỔI BẬT` dùng primary token chuẩn.
   - Lưới item phụ + `+N` chuyển secondary cho accent phụ.
   - Card bg/border dùng tint/shade solid từ palette.

8. **Đảm bảo parity Preview = Site Render**
   - Kiểm tra `ComponentRenderer.tsx` nhánh Partners để dùng chung shared components và cùng color engine.
   - Nếu site render đang hardcode, chuyển về shared/palette chung để tránh mismatch.

9. **Validation và hoàn tất**
   - Chạy `bunx tsc --noEmit` theo AGENTS.md.
   - Tự rà 6 layout trên edit preview (mobile/tablet/desktop logic hiện có) để xác nhận không lỗi TS/runtime.
   - Commit một commit theo convention hiện tại: `fix(partners): apply dual-brand color system across 6 layouts`.

## Kết quả kỳ vọng
- Partners dùng đủ primary/secondary theo dual-brand ở cả 6 layout.
- Không còn pattern `${color}XX` cho decorative UI chính.
- Heading/CTA/control follow element-level rules.
- Preview và site render đồng nhất màu.
- TypeScript pass, sẵn sàng merge.
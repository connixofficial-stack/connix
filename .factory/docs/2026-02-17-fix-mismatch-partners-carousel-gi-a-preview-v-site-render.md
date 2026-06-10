## Problem Graph
1. [Main] Partners carousel ở edit preview không khớp site render <- depends on 1.1, 1.2
   1.1 [Sub] Preview và site dùng 2 implementation carousel khác nhau <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Preview dùng pagination carousel, site dùng horizontal scroll/drag trong `GallerySection`.
   1.2 [Sub] Trạng thái trang carousel có thể lệch khi đổi device/số item.

## Execution (with reflection)
1. Tạo shared carousel cho Partners.
   - File: `app/admin/home-components/partners/_components/PartnersCarouselShared.tsx`
   - Logic: `itemsPerPage` theo device (mobile 2, tablet 4, desktop 6), `pageIndex`, `totalPages`, prev/next, dots, page indicator, empty state.
   - Reflection: ✓ Gom 1 nguồn render để loại bỏ mismatch.

2. Thay preview carousel cũ bằng shared component.
   - File: `app/admin/home-components/partners/_components/PartnersPreview.tsx`
   - Bỏ `renderCarouselStyle` cũ + state `carouselIndex`, gọi `PartnersCarouselShared` với `variant="preview"`.
   - Reflection: ✓ Preview sẽ dùng đúng logic chung.

3. Thay site carousel cũ bằng shared component.
   - File: `components/site/ComponentRenderer.tsx` (nhánh `GallerySection` style `carousel` cho Partners)
   - Gỡ block horizontal scroll/drag, thay bằng `PartnersCarouselShared` với `variant="site"`.
   - Reflection: ✓ Site render khớp preview cả layout + behavior.

4. Hardening nhỏ để tránh lệch state.
   - Trong shared component: reset `pageIndex=0` khi `items.length` hoặc `itemsPerPage` đổi.
   - Dùng key ổn định cho item list (`item.id ?? item.link ?? idx`).
   - Reflection: ✓ Tránh trang rỗng/lệch khi user đổi dữ liệu hoặc device.

5. Validate theo rule project.
   - Chạy `bunx tsc --noEmit` sau khi sửa.
   - Sửa lỗi nếu có cho đến khi pass.
   - Reflection: ✓ Đáp ứng quy ước AGENTS.md.

6. Commit (không push).
   - Commit message đề xuất: `fix(partners): unify carousel preview and site render`
   - Reflection: ✓ Hoàn tất đúng yêu cầu và quy trình repo.

Kết quả mong đợi: layout/behavior carousel của Partners tại edit preview và site render đồng nhất, không còn mismatch.
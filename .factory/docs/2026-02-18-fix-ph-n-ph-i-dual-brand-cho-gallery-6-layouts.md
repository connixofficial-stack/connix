## Problem Graph
1. [Main] Màu primary/secondary của Gallery đang phân phối chưa tốt trong edit preview và có nguy cơ lệch giữa create/edit/preview/render <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Mapping token → UI element trong `GalleryPreview.tsx` chưa phân vai rõ theo dual-brand cho cả 6 layouts (nhiều chỗ chỉ neutral/hover mới có accent).
   1.2 `colors.ts` chưa có token tách riêng cho accent bar theo từng layout + lightbox controls theo dual-brand.
   1.3 Chưa có cơ chế đồng bộ style-aware color assignment giữa create/edit/preview/render (cùng resolver nhưng chưa dùng đầy đủ theo layout).
   1.4 Cần giữ tuân thủ skill v11.5 (OKLCH/APCA, 60-30-10, color adjacency, single=monochromatic).

## Execution (with reflection)
1. Cập nhật token model trong `app/admin/home-components/gallery/_lib/colors.ts`.
   - Thought: Giữ hướng A-an toàn, không phá UI hiện tại, chỉ bổ sung token/mapping cần thiết.
   - Action:
     - Bổ sung token cho `sectionAccentBarByStyle` (map theo 6 style: spotlight/explore/stories/grid/marquee/masonry), cho phép “Mix-theo-layout”.
     - Bổ sung token lightbox dual-brand: `lightboxControlBg`, `lightboxControlIcon`, `lightboxControlBorder`, `lightboxCounterBg`, `lightboxCounterText` (APCA-safe).
     - Giữ rule single mode: secondary resolved = primary; dual mode mới dùng phân vai.
   - Reflection: ✓ Đáp ứng yêu cầu mix accent bar + bao gồm lightbox, vẫn không thay đổi contract cũ quá mạnh.

2. Tái phân phối màu ở `app/admin/home-components/gallery/_components/GalleryPreview.tsx` cho đủ 6 layouts.
   - Thought: Mục tiêu 60-30-10 ở trạng thái có data, ưu tiên chỉnh chỗ nhấn chính thay vì đổi cấu trúc layout.
   - Action:
     - Áp dụng `sectionAccentBarByStyle[previewStyle]` thay cho 1 màu cố định.
     - 6 layout: giữ nền/surface neutral; dùng primary cho điểm nhấn lớn (section bar, icon chính, border nhấn chính), secondary cho accent phụ (badge +N, viền hover/chi tiết phụ) theo style-specific mapping.
     - Lightbox: close/prev/next/counter chuyển sang dùng token dual-brand mới (nền neutral đậm, icon/border theo primary/secondary tùy mode nhưng luôn pass APCA).
     - Không thêm hiệu ứng mới, không đổi behavior logic điều hướng.
   - Reflection: ✓ Đủ phạm vi user yêu cầu, tác động thấp, bám skill anti AI-styling.

3. Đồng bộ create/edit/preview/render.
   - Thought: Tránh lệch do mỗi nơi chọn màu khác nhau.
   - Action:
     - Đảm bảo `create/gallery/page.tsx` và `gallery/[id]/edit/page.tsx` tiếp tục đi qua cùng resolver `getGalleryColorTokens/getGalleryPersistSafeColors` (không tách nhánh màu riêng theo trang).
     - Nếu thiếu, chuẩn hóa truyền `mode/primary/secondary/style` để preview của create và edit cùng nhận mapping style-aware giống nhau.
   - Reflection: ✓ Đúng yêu cầu “Có-đồng-bộ”, không mở rộng ngoài Gallery scope.

4. Verify kỹ thuật.
   - Action:
     - Chạy `bunx tsc --noEmit` theo AGENTS.md.
     - Tự check nhanh 6 styles trong code path preview (không sửa docs).
   - Reflection: ✓ Đúng rule repo, nhanh và đủ gate cho thay đổi TS.

5. Hoàn tất thay đổi theo quy định repo.
   - Action:
     - Review diff tránh thay đổi ngoài phạm vi Gallery.
     - Commit local (không push) với message ngắn gọn đúng convention hiện tại.
   - Reflection: ✓ Tuân thủ yêu cầu “mọi thay đổi code hoàn thành đều phải commit”.

## File-level change plan
- `app/admin/home-components/gallery/_lib/colors.ts`
  - Thêm token cho accent bar theo từng style + lightbox controls dual-brand (APCA-safe).
  - Giữ chuẩn single/dual resolve và harmony safety hiện có.
- `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
  - Dùng style-aware accent bar cho 6 layouts.
  - Áp dụng token mới cho badge/hover/lightbox controls để phân phối primary-secondary rõ hơn nhưng an toàn.
- `app/admin/home-components/create/gallery/page.tsx` (chỉ khi cần)
  - Đồng bộ truyền state để preview create dùng cùng mapping màu như edit.
- `app/admin/home-components/gallery/[id]/edit/page.tsx` (chỉ khi cần)
  - Đồng bộ luồng style/mode/color resolver nếu phát hiện điểm lệch.

Nếu bạn xác nhận spec này, mình sẽ implement ngay theo đúng phạm vi trên.
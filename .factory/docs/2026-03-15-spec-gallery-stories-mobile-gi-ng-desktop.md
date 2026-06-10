## Audit Summary
- Observation: Style `stories` của Gallery đang ép mobile về `grid-cols-1 auto-rows-[200px]`, nên toàn bộ ảnh xếp dọc 1 cột và mất pattern bất đối xứng của desktop. Evidence: `app/admin/home-components/gallery/_components/GalleryPreview.tsx`, trong `renderStoriesStyle()`.
- Observation: Desktop hiện dùng `md:grid-cols-3` và ảnh index `0`/`3` được coi là ảnh lớn với `md:col-span-2`, nhưng logic `colSpan` chỉ áp dụng khi `device !== 'mobile'`, nên mobile bị loại khỏi layout này. Evidence: cùng file, biến `isLarge` + `colSpan`.
- Observation: Cả trang create và edit đều dùng chung `GalleryPreview`, nên chỉ cần sửa 1 nơi là tác động đồng thời tới:
  - `app/admin/home-components/create/gallery/page.tsx`
  - `app/admin/home-components/gallery/[id]/edit/page.tsx`
- Observation: Form upload (`MultiImageUploader`) không phải root cause của preview mobile đơn điệu; vấn đề nằm ở nhánh render preview style `stories`.
- Decision: Sửa trực tiếp `renderStoriesStyle()` để mobile cũng bám layout desktop: 3 cột và ảnh lớn chiếm 2 cột, đúng yêu cầu của anh.

## Root Cause Confidence
- High — vì đã có evidence trực tiếp trong code: mobile bị branch riêng `grid-cols-1` và `colSpan` bị chặn bởi điều kiện `device !== 'mobile'`. Không thấy route create/edit override layout khác.
- Counter-hypothesis đã loại trừ:
  - Không phải do `ComponentFormWrapper` hoặc page layout create/edit, vì 2 trang chỉ render chung `GalleryPreview`.
  - Không phải do `MultiImageUploader`, vì uploader chỉ quản lý input ảnh, không quyết định layout preview style `stories`.

## Proposal
1. Cập nhật `app/admin/home-components/gallery/_components/GalleryPreview.tsx` tại `renderStoriesStyle()`.
2. Thay mobile layout từ `grid-cols-1 auto-rows-[200px]` sang layout cùng tinh thần desktop:
   - mobile: `grid-cols-3`
   - ảnh lớn vẫn chiếm `col-span-2`
   - giữ pattern `i % 4 === 0 || i % 4 === 3` để nhịp điệu giống desktop
3. Điều chỉnh `auto-rows` cho mobile để không quá chật:
   - mobile dùng row thấp hơn desktop nhưng vẫn đủ nổi khối, ví dụ `auto-rows-[110px]` hoặc mức tương đương
   - item lớn sẽ dùng thêm span theo chiều ngang; nếu cần tăng độ nổi bật, có thể cho item lớn span thêm chiều dọc ở mobile theo cùng pattern hiện có
4. Giữ nguyên tablet/desktop behavior hiện tại để tránh regression phần đang “quá oke”.
5. Rà lại text hint ở create page nếu cần để phản ánh đúng mobile mới:
   - `app/admin/home-components/create/gallery/page.tsx`
   - chỉ sửa microcopy nếu mô tả hiện tại còn nói mobile quá chung chung; không đổi nếu vẫn đúng.

## Pass/Fail Criteria
- Pass:
  - Style `Câu chuyện` trên mobile preview không còn 1 cột dọc.
  - Mobile hiển thị 3 cột.
  - Các ảnh lớn vẫn chiếm 2 cột như desktop.
  - Create và Edit cho Gallery đều phản ánh cùng layout vì dùng chung preview component.
- Fail:
  - Mobile vẫn rơi về 1 cột.
  - Ảnh lớn không còn nổi bật / không span 2 cột.
  - Desktop/tablet bị thay đổi ngoài ý muốn.

## Verification Plan
- Static review sau sửa:
  - Soát `renderStoriesStyle()` để chắc chắn nhánh mobile không còn `grid-cols-1`.
  - Soát lại điều kiện `colSpan` để mobile cũng nhận span 2 cột cho ảnh lớn.
  - Soát create/edit import chain để bảo đảm cả 2 route vẫn dùng chung `GalleryPreview`.
- Typecheck:
  - Nếu anh duyệt spec và em triển khai, em sẽ chạy đúng rule repo: `bunx tsc --noEmit` vì có thay đổi TS/TSX.
- Runtime repro cho tester:
  - Mở create Gallery và edit Gallery.
  - Chuyển preview sang device mobile.
  - Chọn style `Câu chuyện`.
  - Xác nhận layout mobile là 3 cột, ảnh lớn span 2 cột, desktop không đổi.
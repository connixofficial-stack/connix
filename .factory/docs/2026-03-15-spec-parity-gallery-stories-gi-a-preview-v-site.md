## Audit Summary
- Observation: Preview của Gallery style `stories` đã được chỉnh mobile thành `grid-cols-3 auto-rows-[110px]` và ảnh lớn dùng `col-span-2`. Evidence: `app/admin/home-components/gallery/_components/GalleryPreview.tsx`, `renderStoriesStyle()`.
- Observation: Site render thật vẫn đang dùng layout cũ: `grid-cols-1 auto-rows-[200px] sm:auto-rows-[250px] md:grid-cols-3 md:auto-rows-[300px]`, và ảnh lớn chỉ `md:col-span-2`, nên mobile site vẫn rơi về 1 cột. Evidence: `components/site/ComponentRenderer.tsx`, `renderStoriesStyle()` trong `GallerySection`.
- Observation: Lệch behavior hiện tại là do preview và site đang duplicate logic render style `stories` ở 2 nơi khác nhau, không có shared contract/parity guard.
- Scope user chốt: không chỉ sửa tối thiểu, mà parity đầy đủ giữa preview và site cho style `Câu chuyện`.

## Root Cause Confidence
- High — vì evidence trực tiếp cho thấy 2 implementation đang khác class layout và khác logic `colSpan` trên mobile.
- Counter-hypothesis đã loại trừ:
  - Không phải do route localhost hay data config, vì cùng style `stories` nhưng preview và site render khác nhau ngay trong source.
  - Không phải do CSS global override, vì class strings hard-code khác nhau giữa 2 nơi.

## Proposal
1. Cập nhật `components/site/ComponentRenderer.tsx` tại `renderStoriesStyle()` của `GallerySection` để match preview hiện tại.
2. Đồng bộ các điểm chính từ preview sang site:
   - mobile: `grid-cols-3 auto-rows-[110px]`
   - desktop/tablet giữ nguyên behavior hiện có
   - ảnh lớn dùng `col-span-2 md:col-span-2`
   - ảnh thường dùng `col-span-1 md:col-span-1`
3. Rà lại các class phụ trong block item để tránh lệch UX không cần thiết giữa preview và site, nhưng chỉ trong phạm vi style `stories`:
   - giữ border/overflow/object-cover/hover pattern tương thích
   - không mở rộng sang các style khác (`spotlight`, `explore`, `grid`, `marquee`, `masonry`)
4. Nếu thấy phù hợp sau khi đọc kỹ đoạn code lân cận, ưu tiên đồng bộ bằng cách mirror logic hiện tại từ preview sang site thay vì refactor shared helper, vì đây là thay đổi nhỏ và rollback dễ hơn.
5. Không đụng preview nữa trong task này trừ khi cần chỉnh rất nhỏ để giữ 100% parity sau khi so code cuối.

## Pass/Fail Criteria
- Pass:
  - Ở site thật (`/`), Gallery style `Câu chuyện` trên mobile hiển thị 3 cột.
  - Các ảnh lớn trên mobile site chiếm 2 cột giống preview.
  - Preview và site có cùng layout logic cho style `stories`.
  - Không làm đổi behavior các style Gallery khác.
- Fail:
  - Site vẫn 1 cột ở mobile.
  - Preview và site còn lệch `auto-rows` hoặc `colSpan`.
  - Sửa lan sang style khác hoặc làm desktop/tablet regress.

## Verification Plan
- Static review:
  - So sánh trực tiếp `renderStoriesStyle()` giữa:
    - `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
    - `components/site/ComponentRenderer.tsx`
  - Xác nhận class grid/row/col-span của style `stories` đã parity.
- Typecheck:
  - Nếu anh duyệt spec và em triển khai, em sẽ chạy `bunx tsc --noEmit` vì có thay đổi TSX.
- Runtime repro cho tester:
  - Mở `/` ở mobile viewport.
  - Tới Gallery style `Câu chuyện`.
  - Xác nhận layout 3 cột, ảnh lớn span 2 cột.
  - Đối chiếu với preview trong admin để xác nhận parity.
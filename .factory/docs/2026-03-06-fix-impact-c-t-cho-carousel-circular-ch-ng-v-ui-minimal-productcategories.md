Chuẩn, mình đã rà lại code hiện tại và đúng như bạn nói: Desktop=4 chưa tạo tác động thị giác rõ ở Carousel/Circular vì card width đang gần như cố định (`w-28/w-40`, `w-[125px]/w-[140px]`), còn Minimal có nguy cơ vỡ khi label dài.

Dựa trên quyết định bạn đã chốt + WebSearch best-practice 2026 (responsive carousel, CSS scroll-snap, truncation accessibility), đây là spec triển khai:

## Problem Graph
1. [Main] Cấu hình cột chưa “thấy impact” ở Carousel/Circular + Minimal vỡ UI text dài
   1.1 [Sub] Carousel/Circular đang fixed-width item <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Số cột chỉ giới hạn data, chưa điều khiển item-basis/width theo viewport
   1.2 [Sub] Minimal thiếu guard text overflow <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Tên danh mục chưa clamp + thiếu fallback để đọc full text
   1.3 [Sub] Preview/Site có nguy cơ lệch behavior

## Execution (with reflection)
1. Solving 1.1.1: Đồng bộ công thức cột -> chiều rộng item cho Carousel/Circular
   - Thought: Muốn Desktop=4 tác động rõ thì phải tính width theo cột, không dùng width cố định.
   - Action:
     - Tạo helper dùng chung trong cả 2 file:
       - `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
       - `components/site/ComponentRenderer.tsx` (khối `ProductCategoriesSection`)
     - Helper đề xuất:
       - `getColumnsByDevice()` (mobile/tablet/desktop)
       - `getCarouselBasisClass(columns)` trả về basis theo cột (vd: 2=>`basis-1/2`, 3=>`basis-1/3`, 4=>`basis-1/4`, 5=>`basis-1/5`, 6=>`basis-1/6`), kèm `min-w-0` để tránh overflow text.
       - `getCircularBasisStyle(columns)` dùng inline `flexBasis: calc((100% - gap*(columns-1))/columns)` + `maxWidth` tương ứng.
     - Áp dụng trực tiếp lên item wrapper của Carousel/Circular thay cho các class width cố định hiện tại.
     - Giữ scroll-snap + drag behavior hiện có.
   - Reflection: ✓ Đúng root cause, Desktop=4 sẽ hiển thị đúng 4 item/viewport, thấy impact rõ.

2. Solving 1.1 (hiển thị item theo cột):
   - Thought: User chọn “mỗi viewport hiển thị đúng số cột đã chọn”.
   - Action:
     - Bỏ logic cắt data cứng gây hiểu nhầm; dùng full danh sách cho carousel track.
     - Control “items per view” bằng width/basis theo cột.
     - Với Circular, pagination dot tính theo số page thực dựa trên viewport + basis mới.
   - Reflection: ✓ UX đúng kỳ vọng, không còn cảm giác “không impact”.

3. Solving 1.2.1: Chống vỡ UI Minimal khi text dài
   - Thought: Best-practice là truncate 1 dòng + vẫn cho người dùng đọc full text.
   - Action:
     - Ở Minimal item label (preview + site): thêm `truncate`/`line-clamp-1` + container `min-w-0`.
     - Thêm `title={cat.name}` cho label (tooltip native).
     - Nếu có icon + count trong cùng hàng, đảm bảo text block `flex-1 min-w-0`.
   - Reflection: ✓ Không vỡ layout, vẫn đảm bảo truy cập đầy đủ nội dung.

4. Solving 1.3: Parity 100% Preview/Site
   - Thought: User chốt parity tuyệt đối.
   - Action:
     - Copy cùng công thức helper và class mapping giữa preview/site cho 3 layout: carousel, circular, minimal.
     - Soát các điểm dễ lệch: gap, basis, clamp, title tooltip, pagination.
   - Reflection: ✓ Tránh “preview đúng, site sai”.

## Danh sách file sẽ chỉnh
1. `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
   - Refactor `renderCarouselStyle`, `renderCircularStyle`, `renderMinimalStyle`
   - Bỏ width cứng, thêm basis theo cột, thêm truncate + title cho Minimal
2. `components/site/ComponentRenderer.tsx` (section `ProductCategoriesSection`)
   - Chỉnh y hệt logic/class cho 3 style tương ứng

## Quy tắc kỹ thuật áp dụng (từ WebSearch 2026)
- Carousel responsive: ưu tiên scroll-snap + width theo phần trăm/cột (không fixed px).
- Circular responsive: điều khiển số item/viewport bằng flex-basis theo cột.
- Text overflow trong chip/pill: `truncate` 1 dòng + tooltip/title để cân bằng UI và khả dụng.

## Verify sau implement
- Manual matrix:
  - Desktop columns: 3/4/5/6 -> Carousel/Circular thay đổi rõ số item trong viewport
  - Mobile columns: 2/3 -> tác động đúng
  - Minimal với tên rất dài -> không vỡ, có ellipsis, hover thấy full qua title
  - Preview vs Site: cùng behavior/class
- Chạy `bunx tsc --noEmit`.
- Commit theo convention hiện tại, kèm `.factory/docs` nếu có phát sinh.

## Kết quả mong đợi
- Khi set Desktop=4, Carousel/Circular nhìn thấy ngay 4 item/viewport (impact rõ).
- Minimal không còn vỡ UI khi text dài.
- Preview và Site parity 100% cho 3 layout.
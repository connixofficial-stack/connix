## Problem Graph
1. [Main] Grid layout của Partners bị rớt dòng khi số item lớn <- depends on 1.1, 1.2
   1.1 [Sub] Mismatch rule giữa container grid/flex và kích thước card/logo <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Thiếu ràng buộc nhất quán cho chiều rộng tối thiểu + cột responsive + xử lý overflow khi số lượng item tăng
   1.2 [Sub] Khác biệt giữa edit preview và site render khiến lỗi lặp lại khó kiểm soát

## Execution (with reflection)
1. Solving 1.1.1 (đọc-only, chưa sửa code)
   - Action: rà soát các file liên quan Grid của Partners (`PartnersPreview.tsx`, `PartnersFeaturedShared.tsx`, `PartnersBadgeShared.tsx`, `PartnersCarouselShared.tsx`, `PartnersMarqueeShared.tsx`) để xác định class/layout gây wrap.
   - Reflection: xác nhận chính xác điểm gây rớt dòng trước khi chạm logic hiển thị.

2. Chuẩn hóa contract layout cho Grid
   - File dự kiến sửa chính: `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx` (hoặc component Grid tương ứng nếu tách riêng), và nơi gọi trong `PartnersPreview.tsx` nếu cần truyền props.
   - Thay đổi dự kiến:
     - Dùng 1 cơ chế layout nhất quán cho Grid (ưu tiên CSS Grid với số cột responsive rõ ràng, hoặc Flex + `min-w-0` + basis cố định theo breakpoint).
     - Khóa quy tắc card/logo: tránh phần tử con tự nở gây vỡ hàng (`min-w-0`, giới hạn width ảnh/logo, căn giữa).
     - Với nhiều item: cho phép auto-fit/auto-fill hợp lý để giữ đều hàng, không nhảy dòng bất thường do kích thước nội dung.
   - Reflection: giữ KISS/YAGNI, chỉ chạm Grid path, không động vào các layout khác.

3. Đồng bộ edit preview và render path
   - Nếu Grid đang dùng shared component, fix tại shared để ăn cả preview/render.
   - Nếu có divergence, gom class chung vào shared util/component để tránh lệch hành vi lần nữa.
   - Reflection: giảm risk “preview đúng nhưng render sai” hoặc ngược lại.

4. Validate bắt buộc sau khi implement
   - Chạy: `bunx tsc --noEmit` (theo AGENTS.md).
   - Kiểm thử nhanh case nhiều item tại route user báo (`/admin/home-components/partners/.../edit`, layout Grid).
   - Reflection: chỉ hoàn tất khi hết rớt dòng và không phát sinh lỗi TypeScript.

5. Commit (không push)
   - Commit message dự kiến: `fix(partners): stabilize grid layout with many items`
   - Chỉ commit các file liên quan fix này.

## Kết quả kỳ vọng
- Layout Grid không còn rớt dòng bất thường khi số item lớn.
- Khoảng cách/căn chỉnh card giữ ổn định qua breakpoints.
- Hành vi nhất quán giữa edit preview và render.
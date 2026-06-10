## Problem Graph
1. [Main] Marquee đang auto-scroll vô hạn nhưng chưa “sang trọng”
   1.1 [ROOT CAUSE] Visual rhythm còn thô (gap lớn cố định, thiếu chiều sâu, thiếu frame/overlay tinh tế)
   1.2 [Sub] Chuyển động chưa có “premium feel” (linear đều, không có easing cảm giác mượt)
   1.3 [Sub] Thiếu ngữ cảnh thiết kế (không có edge fade/lighting làm nổi vùng nhìn)

## Execution (with reflection)
1. **Tinh chỉnh visual card marquee** trong `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
   - Đổi card marquee từ block phẳng sang “premium card”:
     - bo góc mềm hơn theo device (`rounded-2xl` desktop, `rounded-xl` mobile)
     - thêm viền mảnh bán trong suốt + nền neutral nhẹ
     - thêm shadow nhiều lớp rất nhẹ để tạo chiều sâu
     - hover chỉ nâng nhẹ (`translate-y`) + scale nhỏ, tránh hiệu ứng gắt
   - Reflection: giữ KISS, không thêm lib, chỉ class/style sẵn có.

2. **Nâng cấp cảm giác chuyển động “sang” nhưng vẫn vô hạn**
   - Giữ cơ chế loop hiện tại (2 cụm items + reset theo `scrollWidth / loopCount`) để không phá behavior vô hạn.
   - Tinh chỉnh speed theo device:
     - mobile chậm hơn nhẹ để đọc ảnh tốt hơn
     - desktop mượt hơn nhưng không nhanh
   - Khi pause/focus/touch vẫn giữ logic hiện tại.
   - Reflection: ít rủi ro runtime vì không đổi kiến trúc animation loop.

3. **Thêm edge-fade mask hai bên khung marquee**
   - Trong wrapper marquee, thêm 2 lớp gradient overlay trái/phải (pointer-events none) để tạo cảm giác “cinematic strip” và che điểm vào/ra loop.
   - Màu gradient lấy theo nền hiện tại (light/dark compatible), không hard-code lệch theme.
   - Reflection: cải thiện mạnh perceived quality, chi phí code thấp.

4. **Tinh chỉnh spacing + tỉ lệ để premium hơn**
   - Giảm `gap-16` xuống adaptive (`gap-6/8/10`) để nhịp ảnh dày vừa phải.
   - Điều chỉnh chiều cao ảnh marquee theo device (`h-40 mobile`, `h-56 md`, `h-64 lg`) để cân đối viewport preview.
   - Reflection: trực tiếp xử lý điểm “thiết kế chưa đẹp”.

5. **Giữ đồng bộ preview behavior hiện có**
   - Không đổi contract props, không đổi data shape, không đổi style id `marquee`.
   - Không đụng file khác nếu không cần để tránh side effects.

6. **Validation trước commit (theo AGENTS.md)**
   - Chạy `bunx tsc --noEmit` sau khi sửa.
   - Nếu pass: chuẩn bị commit message theo convention hiện tại (ví dụ `refactor(gallery): elevate marquee visual with premium infinite scroll feel`).

Nếu bạn duyệt spec này, tôi sẽ triển khai ngay đúng các bước trên và commit luôn (không push).
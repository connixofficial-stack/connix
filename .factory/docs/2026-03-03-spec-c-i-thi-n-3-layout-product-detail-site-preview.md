## Problem Graph
1. [Main] Sửa 3 layout Product Detail theo yêu cầu UX <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Ảnh đang dùng `object-cover` ở nhiều điểm nên bị crop/phá tỉ lệ
   1.2 [Sub] Logic ảnh phụ chưa chặn đúng case chỉ có 1 ảnh
   1.3 [Sub] Modern bị lặp nội dung mô tả (dup giữa khối gần price và tab dưới)
   1.4 [Sub] Chưa có nền blur lấy từ ảnh gốc theo pattern Hero

## Execution (with reflection)
1. Sửa trang thật `/app/(site)/products/[slug]/page.tsx` cho cả 3 layout.
   - Thought: Đây là nguồn render thực của người dùng cuối, phải sửa ở đây để hết lỗi thật.
   - Action:
     - Thay các điểm ảnh chính/thumbnail trong 3 layout từ `object-cover` -> `object-contain` (hoặc class helper tương đương) để luôn giữ tỉ lệ gốc.
     - Với layout minimal: giảm cảm giác crop bằng cách bỏ `group-hover:scale-*` ở ảnh chính và giữ khung hiển thị an toàn hơn (ưu tiên contain).
     - Chuẩn hóa điều kiện ảnh phụ: chỉ render thumbnail/gallery khi `images.length >= 2`; nếu chỉ 1 ảnh thì không hiện ảnh phụ.
   - Reflection: đảm bảo không còn crop nặng, không méo ảnh, đúng rule “1 ảnh thì không ảnh phụ”.

2. Thêm nền blur từ ảnh gốc (mức Medium) cho 3 layout theo pattern Hero.
   - Thought: Cần kỹ thuật giống HeroPreview: layer blur dùng chính ảnh đang chọn + overlay nhẹ.
   - Action:
     - Tạo helper render ảnh có blur nền (ví dụ kiểu: wrapper `relative overflow-hidden`, layer nền `absolute inset-0 scale-110 bg-cover bg-center blur-[24px]`, overlay mờ, ảnh chính `object-contain` nằm trên).
     - Áp dụng helper này cho vùng ảnh chính của classic, modern, minimal trong trang thật.
     - Với case không có ảnh: giữ placeholder hiện tại.
   - Reflection: blur bám theo ảnh gốc, ảnh chính vẫn rõ, không rối nền.

3. Sửa layout Modern bị duplicate mô tả trong trang thật.
   - Thought: User chốt giữ tab dưới, bỏ mô tả gần price.
   - Action:
     - Xóa block mô tả gần phần giá (khối `leading-relaxed` phía trên quantity).
     - Giữ section tab dưới (`Mô tả / Thông tin`) làm nơi hiển thị mô tả duy nhất.
   - Reflection: hết duplication, luồng đọc rõ ràng.

4. Đồng bộ preview `/components/experiences/previews/ProductDetailPreview.tsx` để parity với trang thật.
   - Thought: User yêu cầu sửa cả preview + site để không lệch.
   - Action:
     - Thêm mock image source cố định cho preview và áp dụng cùng pattern blur + object-contain cho 3 layout.
     - Chỉ hiện ảnh phụ khi số ảnh mock >= 2 (không hardcode hiển thị phụ khi chỉ 1 ảnh).
     - Layout modern: bỏ 1 trong 2 block mô tả để không dup (theo site: giữ khối tab dưới, bỏ mô tả gần giá).
     - Layout minimal: bỏ style gây crop nặng/zoom, dùng contain + khung hiển thị phù hợp.
   - Reflection: preview phản ánh đúng hành vi trang thật.

5. Verify & commit theo rule repo.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Kiểm tra diff, commit với message dạng `fix(product-detail): preserve image ratio, sync blur background, remove modern duplicated description`.
     - Nếu có thay đổi trong `.factory/docs` thì add kèm vào commit theo rule.
   - Reflection: pass typecheck, commit sạch, không push.

## Checklist chốt (đúng theo yêu cầu bạn đã chọn)
- [x] Áp dụng cho **cả trang thật + preview**
- [x] 3 layout đều giữ tỉ lệ ảnh (không phá tỉ lệ)
- [x] Chỉ hiện ảnh phụ khi có từ 2 ảnh
- [x] Nền blur học theo Hero, mức **Medium (~24px)**
- [x] Modern bỏ mô tả bị dup (giữ tab dưới)
- [x] Minimal giảm crop nặng

Nếu bạn duyệt spec này, tôi sẽ bắt đầu implement ngay.
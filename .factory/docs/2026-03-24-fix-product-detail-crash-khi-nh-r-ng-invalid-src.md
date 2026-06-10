## TL;DR kiểu Feynman
- Trang chi tiết sản phẩm đang render `next/image` với `src` không hợp lệ (`""`, `undefined`, hoặc object), nên console báo lỗi và có thể reload ảnh sai.
- Nguyên nhân là mảng `images` chỉ lọc truthy, chưa validate kiểu string URL hợp lệ.
- Ngoài ra index ảnh đang chọn có thể lệch khi danh sách ảnh thay đổi, dẫn tới `images[selectedIndex]` thành `undefined`.
- Em sẽ chuẩn hoá dữ liệu ảnh đầu vào + clamp index trước khi render `BlurredProductImage` và carousel.

## Audit Summary
### Observation
1. `BlurredProductImage` nhận `src: string` nhưng render trực tiếp `<Image src={src} .../>` không guard (`app/(site)/products/[slug]/page.tsx`, ~line 881-894).
2. Ở nhiều style, `images` được tạo bằng:
   - `...(product.image ? [product.image] : [])`
   - `...((product.images ?? []).filter((img) => img && img !== product.image))`
   Logic này không chặn object/chuỗi rỗng kiểu runtime (`page.tsx`, nhiều block ~1260, ~1589, ~2018).
3. Có nhiều state `selectedImage`/`selectedImageIndex`; điều kiện `images.length > 0` chưa đảm bảo `images[selectedIndex]` luôn tồn tại.

### Root-cause checklist (6/8)
1) **Triệu chứng**: Console error `empty string src` và `Image is missing required "src" property` tại `BlurredProductImage`.
2) **Phạm vi**: trang `/products/[slug]`, các style dùng gallery/carousel ảnh.
3) **Tái hiện**: Có, khi dữ liệu ảnh chứa phần tử rỗng/sai kiểu hoặc index ảnh đang chọn vượt giới hạn sau khi list đổi.
4) **Mốc thay đổi gần**: gần đây có thay đổi pipeline/naming upload; dữ liệu cũ hoặc runtime payload có thể không đồng nhất kiểu.
6) **Giả thuyết thay thế**: lỗi do Next/Image config domain; loại trừ vì lỗi báo trực tiếp về `src` rỗng/thiếu.
8) **Pass/fail**: Không còn console error về `src`, giao diện vẫn hiển thị ảnh hợp lệ hoặc fallback an toàn.

## Root Cause Confidence
**High** — Có evidence trực tiếp từ stack trace + code path render `Image` không guard + bộ lọc ảnh chưa kiểm kiểu runtime.

## Files Impacted
- **Sửa:** `app/(site)/products/[slug]/page.tsx`
  - Thêm helper chuẩn hóa ảnh (type guard + trim + dedupe).
  - Dùng helper này thay các block tạo `images` thủ công.
  - Clamp `selectedImage` / `selectedImageIndex` theo `images.length` trước khi render.
  - Guard trong `BlurredProductImage`: nếu `src` không hợp lệ thì return `null` (hoặc fallback div), không render `<Image>`.

## Execution Preview
1. Thêm `isValidImageSrc` + `buildProductImages(product)` dùng chung.
2. Refactor 3 cụm style để gọi helper thay vì filter truthy.
3. Bổ sung clamp index (effect hoặc derived index) cho từng state chọn ảnh.
4. Bổ sung guard trong `BlurredProductImage` để chặn src rỗng/invalid.
5. Static review toàn file để đảm bảo không còn chỗ render `Image` với src không kiểm tra.

## Acceptance Criteria
1. Không còn lỗi console: `empty string src` hoặc `Image is missing required "src" property` ở trang product detail.
2. Với dữ liệu ảnh bẩn (`""`, `null`, `{}`), UI không crash và vẫn hiển thị ảnh hợp lệ còn lại.
3. Nếu không có ảnh hợp lệ, UI hiển thị fallback an toàn (không render `<Image src={...}>` invalid).
4. Chuyển style/variant không làm index vượt mảng gây `src` undefined.

## Verification Plan
- Repro manual trên `/products/[slug]` với dữ liệu có ảnh rỗng/sai kiểu và với dữ liệu chuẩn.
- Kiểm tra các style có gallery (classic/modern/minimal) đều không còn warning/error.
- Static check: rà toàn bộ `page.tsx` để chắc mọi `Image` dùng src đã qua chuẩn hóa/guard.
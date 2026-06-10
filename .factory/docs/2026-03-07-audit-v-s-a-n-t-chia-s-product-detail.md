## Problem Graph
1. [Main] Nút chia sẻ ở product detail chỉ có UI, chưa click được và chưa đồng bộ với cấu hình Experience <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `app/(site)/products/[slug]/page.tsx` đang render nút share cứng, không có handler copy clipboard
   1.2 [ROOT CAUSE] `app/system/experiences/product-detail/page.tsx` chưa có `showShare` trong config nên không điều khiển được site/preview
   1.3 [Sub] `components/experiences/previews/ProductDetailPreview.tsx` cũng render nút share cứng nên preview không phản ánh setting thật

## Execution (with reflection)
1. Solving 1.2 trước để đồng bộ contract config
   - Thought: Product detail nên follow pattern đang dùng ở `posts-detail` và `services-detail`.
   - Action: Thêm `showShare` vào `ClassicLayoutConfig`, `ModernLayoutConfig`, `MinimalLayoutConfig`, `DEFAULT_CONFIG`, `serverConfig`, `handleSave` normalization, panel toggle và `getPreviewProps()` trong `app/system/experiences/product-detail/page.tsx`.
   - Reflection: ✓ Đây là root của việc “bật ở system” nhưng site không obey.

2. Solving 1.3 để preview đúng behavior
   - Thought: Preview phải chỉ hiện nút chia sẻ khi `showShare = true`.
   - Action: Thêm prop `showShare` vào `components/experiences/previews/ProductDetailPreview.tsx`, rồi conditionally render share button ở layout `classic`; nếu có share UI ở layout khác thì áp cùng rule để giữ parity.
   - Reflection: ✓ Preview sẽ match config thật, tránh lệch editor/site.

3. Solving 1.1 ở site product detail
   - Thought: Nên dùng pattern đơn giản như service detail nhưng tốt hơn bằng Sonner tiếng Việt thay vì chỉ đổi label local state.
   - Action: Trong `app/(site)/products/[slug]/page.tsx`:
     - thêm state/hook hoặc helper `handleShareCurrentUrl`
     - dùng `window.location.href` làm URL nguồn
     - dùng `navigator.clipboard.writeText(url)` khi browser hỗ trợ
     - `toast.success('Đã sao chép liên kết sản phẩm')`
     - fallback lỗi: `toast.error('Không thể sao chép liên kết. Vui lòng thử lại.')`
     - chỉ render nút khi `experienceConfig.layouts[current].showShare` bật
   - Reflection: ✓ Đúng yêu cầu click để copy đường dẫn hiện tại và ra sonner tiếng Việt hợp lý.

4. Chuẩn hoá render cho từng layout
   - Thought: Hiện grep thấy chắc chắn layout classic có nút share; khi implement sẽ rà tiếp modern/minimal trong cùng file để tránh sót layout đang dùng.
   - Action: Thêm `showShare` vào type config đã resolve từ `useProductDetailExperienceConfig()` và truyền xuống `ClassicStyle`/`ModernStyle`/`MinimalStyle`; mỗi layout chỉ render share button khi bật và bind cùng handler copy.
   - Reflection: ✓ Tránh tình trạng chỉ sửa 1 layout trong khi system cho đổi layout.

5. Verify trước khi bàn giao
   - Action: Chạy `bunx tsc --noEmit` theo rule repo.
   - Action: Kiểm tra nhanh diff để chắc không đụng ngoài scope.
   - Action: Vì rule repo yêu cầu, sau khi code xong sẽ commit local, kèm `.factory/docs` nếu có.
   - Reflection: ✓ Đúng convention dự án.

## File sẽ chỉnh
- `E:\NextJS\persional_project\system-nhan\app\system\experiences\product-detail\page.tsx`
  - thêm setting `showShare`, toggle UI, save/load config, preview props.
- `E:\NextJS\persional_project\system-nhan\components\experiences\previews\ProductDetailPreview.tsx`
  - nhận `showShare` và ẩn/hiện nút share theo config.
- `E:\NextJS\persional_project\system-nhan\app\(site)\products\[slug]\page.tsx`
  - thêm logic copy URL hiện tại + Sonner tiếng Việt + chỉ render khi bật.

## Kết quả mong đợi
- Trong `/system/experiences/product-detail` có toggle “Nút chia sẻ”.
- Tắt toggle => preview và trang product detail thật đều không hiện nút chia sẻ.
- Bật toggle => click nút chia sẻ sẽ copy URL hiện tại của trang sản phẩm.
- Hiện toast tiếng Việt rõ ràng khi thành công/thất bại.

## Checklist
- [x] Audit root cause
- [x] Chốt phạm vi: sửa đầy đủ config + preview + site
- [ ] Implement `showShare` contract
- [ ] Implement copy clipboard + Sonner tiếng Việt
- [ ] Typecheck `bunx tsc --noEmit`
- [ ] Commit local theo rule repo
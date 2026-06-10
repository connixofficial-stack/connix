## Problem Graph
1. [Main] Tối ưu lại bố cục Minimal để mô tả không chiếm nửa cột thông tin <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Mô tả đang nằm trong cột phải cùng khối mua hàng nên tạo cảm giác nặng, dài cột
   1.2 [ROOT CAUSE] Preview system và site có nguy cơ lệch nếu chỉ sửa 1 bên
   1.3 [ROOT CAUSE] Cần giữ thẩm mỹ minimal và hierarchy theo best-practice 2026 (gallery + CTA trước, details sau)

## Execution (with reflection)
1. Refactor layout Minimal ở site thật `app/(site)/products/[slug]/page.tsx`.
   - Action:
     - Giữ nguyên cấu trúc desktop tỉ lệ `7/5` cho block trên (gallery trái + info/CTA phải).
     - Trong cột phải (khối 5 cột): bỏ phần render mô tả hiện tại khỏi `space-y-5 pt-0 flex-1`, chỉ giữ thông tin SKU/tình trạng.
     - Thêm section mô tả mới **full-width bên dưới toàn bộ grid** (nằm dưới `{commentsSection}` để không chen vào flow mua hàng), theo style card tối giản:
       - wrapper: border + bo góc + spacing thoáng
       - có heading “Mô tả sản phẩm”
       - nội dung dùng lại `ExpandableDescription` hiện có (clamp 4 mobile/5 desktop + Xem thêm/Thu gọn).
   - Reflection: giữ đúng minimal hierarchy hiện đại: quyết định mua hàng ở block trên, thông tin dài ở block dưới.

2. Đồng bộ preview cho route `/system/experiences/product-detail` qua `components/experiences/previews/ProductDetailPreview.tsx`.
   - Action:
     - Layout `minimal`: bỏ mô tả khỏi cột phải hiện tại.
     - Thêm block mô tả mới full-width bên dưới grid, dùng card tối giản + tiêu đề + `ExpandablePreviewText` (đang có), để preview phản ánh chính xác site.
     - Giữ nguyên các phần ảnh, giá, CTA, SKU/status như hiện tại.
   - Reflection: đảm bảo parity preview/site, tránh user config trong system nhưng site hiển thị khác.

3. Áp dụng guardrails UI theo best-practice 2026 (dựa trên web research).
   - Action:
     - Duy trì thứ tự nội dung: visual & purchase intent trước, long-form description sau.
     - Tăng khả năng scan: heading rõ, card spacing ổn định, không thêm hiệu ứng rối.
     - Không mở rộng thêm feature ngoài scope (KISS/YAGNI).
   - Reflection: bố cục sạch, tập trung chuyển đổi, vẫn đầy đủ thông tin khi user cần.

4. Verify & commit theo rule repo.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Review `git diff --cached` + `git status`.
     - Commit local (không push), add kèm `.factory/docs` nếu có thay đổi.

## Checklist chốt theo lựa chọn của bạn
- [x] Áp dụng cho **cả site thật + preview system**
- [x] Minimal giữ tỉ lệ desktop **7/5**
- [x] Mô tả chuyển thành section **full-width bên dưới**
- [x] Style mô tả: **card tối giản + tiêu đề + clamp/Xem thêm**
- [x] Không thêm feature ngoài yêu cầu
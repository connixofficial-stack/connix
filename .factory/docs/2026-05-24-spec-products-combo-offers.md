# I. Primer

## 1. TL;DR kiểu Feynman

- Combo trong phiên bản MVP này cực kỳ đơn giản: Nó không liên quan gì đến chương trình khuyến mãi, voucher nhập mã, giỏ hàng, hay thanh toán tự động phức tạp.
- Tính năng này chỉ hoạt động khi cấu hình hệ thống đang ở chế độ mua hàng qua liên hệ (`saleMode === 'contact'`) và sản phẩm đang thao tác không có phiên bản/biến thể (`hasVariants !== true`).
- Toàn bộ dữ liệu combo được lưu trực tiếp dưới dạng một mảng các đối tượng (array of objects) ngay trong tài liệu sản phẩm thuộc bảng `products`, giúp tối giản hóa cấu trúc database.
- Giao diện Admin cung cấp form cấu hình inline đơn giản (nâng cấp trực tiếp từ UI sẵn có): bấm "Thêm combo" để chọn tạo Combo Thường hoặc Combo Mix, cấu hình quà tặng hoặc giảm giá qua các dropdown đơn giản, không dùng wizard hay nhập JSON thô.
- Trên trang chi tiết sản phẩm (PDP), combo hiển thị dưới dạng danh sách Merchandising trực quan. Khi click vào một combo, nút CTA sẽ chuyển hướng hoặc mở chat Zalo với nội dung soạn sẵn để đặt mua combo đó.

## 2. Elaboration & Self-Explanation

Mục tiêu chính là xây dựng một phiên bản MVP tối giản nhất (KISS) để trưng bày các gói combo cho khách hàng, thay vì cố gắng xây dựng một hệ thống tính giá và khuyến mãi tự động phức tạp.

Vì hệ thống không sử dụng giỏ hàng/thanh toán trực tuyến ở chế độ này, chúng ta:
- Không cần sửa đổi logic giỏ hàng (`cart.ts`) hay đơn hàng (`orders.ts`).
- Không cần bảng trung gian `promotionTargets` hay các mutation/query phức tạp liên quan đến discount engine.
- Lưu trữ cấu hình combo trực tiếp trong trường `combos` của bảng `products`. Khi hiển thị trang chi tiết sản phẩm, chỉ cần lấy trường này ra và render.

Phân loại Combo trong MVP:
- **Combo thường (Standard):** Áp dụng khi mua nhiều cùng một sản phẩm.
  - Hình thức ưu đãi: Giảm %, Giảm tiền cụ thể, Tặng chính sản phẩm này, hoặc Tặng sản phẩm khác (chọn từ danh sách sản phẩm đang bán).
- **Combo mix:** Áp dụng khi mua sản phẩm này cùng với các sản phẩm khác.
  - Cấu hình: Chọn thêm tối đa 5 sản phẩm khác (từ dropdown sản phẩm hoạt động, không trùng lặp nhau và không trùng sản phẩm hiện tại) cùng với số lượng tương ứng.
  - Hình thức ưu đãi: Giảm %, Giảm tiền cụ thể, hoặc Tặng sản phẩm khác.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể:

- **Combo thường:** Sản phẩm "Rượu vang Pháp A". Admin bấm "+ Thêm combo", chọn "Combo thường":
  - Tên: "Mua 6 chai tặng 1" -> Số lượng: 6, Hình thức: Tặng chính sản phẩm này, số lượng tặng: 1.
  - Tên: "Mua 12 chai giá sỉ" -> Số lượng: 12, Giá combo: 2.000.000đ (giảm tiền cụ thể).
  - Tên: "Mua 3 chai tặng Nút mở rượu" -> Số lượng: 3, Hình thức: Tặng sản phẩm khác (chọn "Nút mở rượu" từ dropdown), số lượng tặng: 1.
- **Combo mix:** Sản phẩm "Rượu vang Pháp A". Admin bấm "+ Thêm combo", chọn "Combo mix":
  - Tên: "Set quà Tết sum vầy" -> Mua kèm thêm: 1 chai "Rượu vang Pháp B" + 1 hộp "Bánh trung thu C" (chọn qua dropdown). Ưu đãi: Giảm 10% trên tổng set hoặc giá cố định cả set là 1.500.000đ.

Analogy đời thường:
- "Combo thường" giống như bảng giá sỉ ghi trên bảng hiệu ở cửa hàng: "Mua 3 tặng 1", "Mua từ 10 món trở lên giảm 10%".
- "Combo mix" giống như các set quà Tết gói sẵn đặt ở kệ trưng bày: Trong giỏ quà có sẵn rượu vang + bánh kẹo + trà, bán nguyên set với giá ưu đãi.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Scope & impacted paths

Phạm vi MVP chỉ tập trung vào hiển thị và cấu hình sản phẩm:

- `convex/schema.ts` — Cấu trúc schema bảng `products`.
- `convex/products.ts` (hoặc logic update product) — Mutation cập nhật trường `combos`.
- `lib/modules/configs/products.config.ts` — Thêm toggles quản lý tính năng combo.
- `app/admin/products/[id]/edit/page.tsx` — Tích hợp form cấu hình combo trực tiếp.
- `app/admin/products/create/page.tsx` — Nút hành động nhanh để tạo combo sau khi lưu sản phẩm.
- `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` — Render danh sách combo và xử lý CTA liên hệ.
- `components/experiences/previews/ProductDetailPreview.tsx` — Mockup giao diện combo để xem trước.

## 2. Observation (Bằng chứng hiện trạng)

- `/system/modules/products` quản lý các cấu hình thông qua `lib/modules/configs/products.config.ts`.
- `app/admin/products/[id]/edit/page.tsx` chứa toàn bộ form chỉnh sửa sản phẩm lớn. Việc tích hợp UI combo cần được thiết kế gọn gàng, tránh làm hỏng các card thông tin cơ bản hoặc ảnh sản phẩm.
- Trang chi tiết sản phẩm `ProductDetailPage.tsx` hiện chỉ hiển thị nút mua hàng/liên hệ dựa trên setting `saleMode`. Chưa có bất kỳ logic nào hiển thị combo ưu đãi.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High — 95%.**
Yêu cầu của người dùng chuyển hướng hoàn toàn sang MVP tối giản: không giỏ hàng, không thanh toán tự động, chỉ hiển thị merchandising phục vụ mua hàng qua liên hệ (`saleMode === 'contact'`) và chỉ áp dụng cho sản phẩm không có phiên bản (`hasVariants !== true`). Điều này loại bỏ hoàn toàn sự cần thiết của discount engine phức tạp, thay vào đó là lưu trữ trực tiếp và hiển thị tĩnh.

## 2. Trả lời audit protocol

1. **Triệu chứng quan sát được:** Chưa có giao diện cấu hình và hiển thị combo trên PDP/Admin.
2. **Phạm vi ảnh hưởng:** Trang chi tiết sản phẩm (PDP) và trang quản lý sản phẩm (Admin).
3. **Tái hiện ổn định:** Luôn xảy ra vì tính năng chưa được code.
4. **Rủi ro nếu fix sai:** Thiết kế form quá phức tạp làm giảm trải nghiệm người dùng, hoặc thay đổi schema làm hỏng các sản phẩm cũ.
5. **Tiêu chí pass/fail:** Bật `saleMode = contact` và sản phẩm không có phiên bản thì hiển thị block combo trên PDP; click combo gửi thông điệp đặt hàng qua Zalo/Liên hệ chuẩn xác; form admin trực quan không bị lỗi crash.

# IV. Proposal (Đề xuất)

## 1. Decision (Khuyến nghị)

**Triển khai bản MVP tối giản:**
- Lưu trữ trường `combos` trực tiếp trên bảng `products`.
- Chỉ cho phép hoạt động khi `saleMode === 'contact'` và `hasVariants !== true`.
- Giao diện Admin sử dụng form inline đơn giản nâng cấp từ mockup có sẵn.
- Giao diện PDP hiển thị danh sách combo đẹp mắt, nút CTA liên kết trực tiếp với Zalo/Contact form.

## 2. Options (Các lựa chọn)

- **Option A (MVP - Chọn):** Lưu trực tiếp ở bảng `products`, hiển thị tĩnh trên PDP, liên hệ mua hàng qua Zalo/Contact. Form cấu hình đơn giản inline.
  - *Confidence: 98%*. Đáp ứng đúng tinh thần KISS, YAGNI, DRY, thời gian hoàn thành cực nhanh và an toàn tuyệt đối cho hệ thống cũ.
- **Option B (Full Feature):** Tích hợp qua bảng `promotions`, evaluator tự động tính toán giỏ hàng.
  - *Confidence: 20% (Bị loại bỏ vì quá phức tạp so với nhu cầu thực tế của người dùng)*.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / System
- Sửa: `lib/modules/configs/products.config.ts` — Thêm setting toggle `enableCombos` (mặc định tắt).

## 2. Admin
- Sửa: `app/admin/products/[id]/edit/page.tsx` — Nhúng panel cấu hình combo ngay dưới card "Phiên bản sản phẩm" (hoặc ẩn đi nếu sản phẩm có phiên bản).
- Sửa: `app/admin/products/create/page.tsx` — Panel hướng dẫn/shortcut.

## 3. Public site / Experience
- Sửa: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` — Thêm block hiển thị danh sách combo sản phẩm khi thỏa mãn điều kiện `saleMode === 'contact'` và `hasVariants !== true`.
- Sửa: `components/experiences/previews/ProductDetailPreview.tsx` — Bổ sung preview layout combo.

## 4. Convex / Backend
- Sửa: `convex/schema.ts` — Thêm trường `combos` vào bảng `products`.
- Sửa: `convex/products.ts` (hoặc file mutation update sản phẩm) — Đảm bảo lưu trường `combos` khi cập nhật thông tin sản phẩm.

# VI. Execution Preview (Xem trước thực thi)

1. Cập nhật `convex/schema.ts` thêm trường `combos` kiểu dữ liệu array of objects tùy chọn.
2. Cập nhật `lib/modules/configs/products.config.ts` thêm toggle cấu hình hệ thống.
3. Tạo form cấu hình combo inline đơn giản tại `app/admin/products/[id]/edit/page.tsx`.
4. Cập nhật PDP `ProductDetailPage.tsx` để render block combo Merchandising.
5. Cập nhật file preview và chạy static verification.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo compile TypeScript thành công.

## 2. Manual Verification
- Kiểm tra tính năng bật/tắt combo: Nếu tắt master switch hoặc sản phẩm có phiên bản, giao diện PDP và Admin phải ẩn tính năng này đi.
- Kiểm tra thêm/sửa/xóa combo thường và combo mix trong admin edit page: lưu trữ dữ liệu chính xác vào Convex.
- Kiểm tra hiển thị PDP: click nút combo chuyển hướng Zalo thành công với đúng mẫu văn bản đặt hàng.

# VIII. Todo

- [ ] Sửa `convex/schema.ts` thêm trường `combos` vào schema sản phẩm.
- [ ] Cập nhật mutation `updateProductWithVariants` (hoặc tương ứng) để nhận và lưu trường `combos`.
- [ ] Cập nhật cấu hình settings trong `products.config.ts`.
- [ ] Thiết kế form cấu hình combo inline trong `app/admin/products/[id]/edit/page.tsx`.
- [ ] Thiết kế giao diện hiển thị danh sách combo trên `ProductDetailPage.tsx` kèm nút CTA mua qua liên hệ.
- [ ] Bổ sung preview cho `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm tra TypeScript và verify tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Trường `combos` được lưu thành công trên Convex.
- Admin Edit Page hiển thị panel "Combo / Giá thùng" đơn giản với nút "Thêm combo" để thêm combo thường hoặc combo mix (tối đa 5 sản phẩm đi kèm, dropdown lọc sản phẩm hoạt động, không cho trùng lặp).
- PDP hiển thị đúng thông tin combo (Tên, giá, ưu đãi chi tiết) khi sản phẩm thỏa điều kiện.
- Nút liên hệ hoạt động chính xác theo đúng combo được chọn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## 1. Risks
- Các sản phẩm cũ không có trường `combos` có thể gây lỗi undefined nếu không sử dụng optional validator trong schema và xử lý fallback ở code.

## 2. Rollback
- Tắt master toggle `enableCombos` để ẩn hoàn toàn tính năng mà không ảnh hưởng tới dữ liệu sản phẩm.

# XI. Out of Scope (Ngoài phạm vi)
- Không làm giỏ hàng, check stock tự động, voucher coupon, hay pricing engine.

# XII. Open Questions (Câu hỏi mở)
- Mẫu text Zalo mặc định sẽ là: `Tôi muốn liên hệ mua Combo [Tên Combo] cho sản phẩm [Tên sản phẩm]`.

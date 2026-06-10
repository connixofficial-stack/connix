# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Giao diện hiển thị các gói combo khuyến mãi hiện tại rất chật chội, chữ bị cắt vụn ("Mua từ 12 sản...", "Tặng thêm 1 sản phẩm này" bị che/đè), và dùng Carousel cuộn dọc rất khó thấy hết các ưu đãi. Một số logic và text vẫn bị hardcode, không đồng bộ giữa trang thật và trang preview.
- **Giải pháp**: Thiết kế lại toàn bộ block Combo thành dạng danh sách dọc (vertical list) thoáng đãng, sang trọng. Tách biệt rõ ràng các thành phần: tiêu đề combo, badge điều kiện mua (ví dụ: "Mua tối thiểu 12 cái"), phần quà/giảm giá (ví dụ: "Tặng 1 cái"), và giá tiền combo ở bên phải. Tự động sinh mô tả tự nhiên từ config, không hardcode. Đồng bộ code giữa trang thực tế và trang preview.
- **Kết quả**: Giao diện đẹp, chuyên nghiệp, thông tin hiển thị đầy đủ không bị mất chữ trên mọi kích thước màn hình.

## 2. Elaboration & Self-Explanation
Giao diện Combo khuyến mãi hiện tại được triển khai bằng `useEmblaCarousel` dạng cuộn dọc (axis Y) với chiều cao giới hạn cứng (`max-h-16`). Khi chạy trên thiết bị di động hoặc các khu vực hiển thị có độ rộng hẹp, các chuỗi chữ như "Combo tặng thêm chai", "Mua từ 12 sản phẩm", "Tặng thêm 1 sản phẩm này" sẽ bị đẩy lên cùng một dòng `flex` ngang và buộc phải cắt ngắn (truncate) hoặc xuống dòng lỗi (`thê\nm chai`). Điều này làm hỏng trải nghiệm người dùng vì họ không thể đọc được nội dung ưu đãi là gì.

Chúng tôi đề xuất loại bỏ Carousel cuộn dọc đối với danh sách combo (vì số lượng combo của một sản phẩm thường rất ít, từ 1 đến tối đa 3). Thay vào đó, toàn bộ các combo sẽ được hiển thị dưới dạng một danh sách dọc tinh tế. Mỗi combo là một Card có bo góc mềm mại, phân chia bố cục: bên trái là Icon minh họa loại khuyến mãi cùng thông tin chi tiết (tên combo, badge điều kiện mua màu trung tính, badge phần thưởng màu nổi bật), bên phải là giá combo được căn chỉnh rõ ràng. Tất cả các chuỗi hiển thị sẽ được tạo ra một cách tự động và linh hoạt từ cấu hình (config) của combo trong Database, không sử dụng bất kỳ chuỗi fix cứng (hardcode) nào.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - *Trước đây*: Một hàng dài chật hẹp: `Combo tặng thê\nm chai Mua từ 12 sản... [Gift icon] Tặng thêm 1 sản phẩm này 134.504 đ` (chữ đè lên nhau, bị cắt).
  - *Sau khi sửa*:
    Một block đẹp mắt gồm:
    - Tiêu đề phụ: ✨ COMBO ƯU ĐÃI ĐẶC BIỆT
    - Thẻ combo:
      - Trái: Vòng tròn icon `Gift` màu xanh ngọc/brand. Kế bên là tiêu đề "**Combo tặng thêm chai**". Dòng dưới hiển thị hai badge rõ ràng: `Mua từ 12 sản phẩm` (badge xám) và `Tặng thêm 1 sản phẩm này` (chữ xanh lục).
      - Phải: Dòng chữ nhỏ "Giá combo" và số tiền lớn "**134.504 đ**" màu brand nổi bật.
- **Analogy**: Thay vì cố nhét toàn bộ thông tin của một món ăn (tên món, nguyên liệu, gia vị, giá cả) vào một chiếc tem nhỏ dán trên hộp, chúng ta bày biện nó trên một thực đơn mini được chia dòng sạch sẽ: Tên món in đậm ở trên, nguyên liệu ghi chú nhỏ ở dưới, và giá tiền ghi to rõ ràng bên phải.

# II. Audit Summary (Tóm tắt kiểm tra)
- UI Combo hiện đang được định nghĩa ở 2 nơi:
  1. `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` (Component `ProductCombosBlock`)
  2. `components/experiences/previews/ProductDetailPreview.tsx` (Component `PreviewCombosBlock`)
- Cả hai component đều sử dụng chung một cấu trúc layout: Embla Carousel Y, giới hạn chiều cao `max-h-16`, render card thông qua flex ngang chật hẹp, dẫn đến lỗi vỡ layout chữ và khó quan sát.
- Logic parse thông tin combo từ database trong Preview đang bị thiếu hụt so với trang thật (chưa hỗ trợ đầy đủ các reward types như `discount_percent` hay `gift_other`).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: Giao diện cũ ép buộc hiển thị tất cả các thành phần thông tin (Tên combo + Điều kiện + Phần thưởng + Giá tiền) trên cùng một dòng ngang (`flex items-center`) và giới hạn chiều cao khắt khe (`max-h-16`). Khi dữ liệu thực tế dài hơn khoảng trống khả dụng, cơ chế Flexbox làm méo mó các phần tử, cắt cụt text (`truncate`) hoặc ngắt dòng lỗi.
- **Giả thuyết đối chứng**: Nếu ta chỉ tăng chiều cao container lên mà vẫn giữ layout flex ngang thì sao? Vẫn sẽ bị vỡ layout khi xem trên các màn hình hẹp (mobile) do tổng chiều rộng của các text (Tên + Điều kiện + Quà tặng + Giá) vượt quá chiều rộng màn hình. Do đó, giải pháp triệt để là chuyển sang layout thẻ (Card) phân tầng dọc (Vertical layout) cho phần text thông tin, và chia cột ngang (Trái - Phải) cho phần thông tin chung và Giá tiền.

# IV. Proposal (Đề xuất)
1. **Thiết kế lại Layout Combo**:
   - Loại bỏ Embla Carousel cuộn Y để các combo hiển thị trực tiếp dưới dạng danh sách dọc.
   - Thêm tiêu đề phụ nhỏ phía trên danh sách combo: `✨ COMBO ƯU ĐÃI ĐẶC BIỆT` hoặc `ƯU ĐÃI KHI MUA NHIỀU`.
   - Mỗi Combo Card sẽ dùng cấu hình Flexbox dạng `flex justify-between items-center gap-3 border rounded-2xl p-3.5 hover:shadow-md transition-all`.
2. **Cấu trúc lại nội dung bên trong Combo Card**:
   - **Bên trái (Flex-1, Items-start, Gap-3)**:
     - Icon đại diện (ví dụ: `Gift` cho quà tặng, `Percent` cho giảm phần trăm, `Tag` cho giảm số tiền cụ thể) được bọc trong một box vuông nhỏ `h-10 w-10 rounded-xl` với nền nhạt của màu Brand (`tokens.surfaceSoft`) và màu icon là màu Brand (`tokens.primary`).
     - Cụm Text thông tin (Flex-col, Gap-1):
       - Dòng 1 (Tên combo): Chữ đậm vừa phải `font-semibold text-sm` (`tokens.headingColor`), tự động rớt dòng tự nhiên nếu quá dài (không dùng `truncate` thô bạo).
       - Dòng 2 (Chi tiết ưu đãi): Gồm các badge nhỏ xếp cạnh nhau:
         - Badge Điều kiện: `Mua từ X sản phẩm` hoặc `Mua kèm sản phẩm Y` (nền xám nhẹ `bg-slate-100`, chữ màu `text-slate-600`, bo góc `rounded-md`, padding `px-1.5 py-0.5`).
         - Badge Phần thưởng: `Tặng thêm Y sản phẩm` hoặc `Giảm Z%` (chữ màu xanh lục `text-emerald-600 font-medium`).
   - **Bên phải (Shrink-0, Text-right)**:
     - Dòng chữ nhỏ trên: `GIÁ COMBO` hoặc `Ưu đãi` (`text-[10px] text-slate-400 font-medium`).
     - Số tiền dưới: Giá trị combo lớn, đậm (`text-base font-bold`, màu brand `tokens.primary`).
3. **Đồng bộ hóa Logic và Helper**:
   - Viết một hàm helper `getComboDetails` chuẩn hóa để trích xuất sạch sẽ các thông tin: `title`, `conditionText`, `rewardText`, `priceText`, `iconType`.
   - Áp dụng helper này cho cả `ProductCombosBlock` và `PreviewCombosBlock`.
   - Bổ sung import các icons cần thiết từ `lucide-react`: `Percent`, `Tag`, `Sparkles`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx): Sửa đổi component `ProductCombosBlock`, thêm helper `getComboDetails`, và sửa các imports ở đầu file.
- **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx): Sửa đổi component `PreviewCombosBlock` và import các icon cần thiết.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm import `Percent`, `Tag`, `Sparkles` vào `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
2. Định nghĩa hàm `getComboDetails` nhận tham số `combo`, `comboProductsMap`, `formatFn` (để định dạng tiền tệ tương ứng `formatPrice` hoặc `formatVND`).
3. Xóa code cũ sử dụng Embla Carousel trong `ProductCombosBlock` và `PreviewCombosBlock`.
4. Thay thế bằng cấu trúc JSX mới hiển thị danh sách Combo Card đẹp mắt.
5. Tiến hành kiểm chứng lỗi biên dịch bằng `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy `bunx tsc --noEmit` để đảm bảo code TypeScript biên dịch thành công không có lỗi cú pháp hoặc import.
- Người dùng thực hiện tải lại trang để trực quan hóa giao diện mới.

# VIII. Todo
- [ ] Import các icons cần thiết (`Percent`, `Tag`, `Sparkles`) trong `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
- [ ] Implement hàm `getComboDetails` và viết lại JSX cho `ProductCombosBlock` trong `ProductDetailPage.tsx`.
- [ ] Implement hàm `getComboDetails` và viết lại JSX cho `PreviewCombosBlock` trong `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm thử static typecheck bằng `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Giao diện Combo hiển thị dạng danh sách dọc tinh tế, không bị giới hạn chiều cao `max-h-16` làm cụt chữ.
- Chữ không bị gãy xuống dòng lỗi (`thê\nm`).
- Các badge điều kiện (ví dụ: `Mua từ 12 sản phẩm`) và badge phần thưởng (ví dụ: `Tặng thêm 1 sản phẩm này`) hiển thị đầy đủ, sắc nét, có khoảng cách hợp lý.
- Giá tiền hiển thị to, rõ ràng bên phải của mỗi card combo.
- Không có lỗi compile TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Có thể thiếu icon hoặc hàm format tiền tệ gây lỗi runtime.
- Biện pháp giảm thiểu: Sử dụng chính xác các hàm format đã có sẵn trong file (`formatPrice` cho `ProductDetailPage.tsx` và `formatVND` cho `ProductDetailPreview.tsx`).
- Hoàn tác: Sử dụng git để rollback các file đã chỉnh sửa.

# XI. Out of Scope (Ngoài phạm vi)
- Việc thay đổi cấu trúc dữ liệu của các schema Combo trong database Convex.
- Việc chỉnh sửa giao diện admin tạo combo.

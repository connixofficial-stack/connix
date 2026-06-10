# I. Primer

## 1. TL;DR kiểu Feynman
Giao diện combo ngoài trang sản phẩm hiện tại bị rườm rà (nhiều ô màu xám, bo góc quá tròn nhìn giống thiết kế AI mẫu, icon ở đầu không cần thiết).
Chúng ta sẽ:
- Bỏ hẳn ô icon ở đầu khối combo.
- Nâng cỡ chữ tiêu đề lên đậm và rõ hơn.
- Giảm bo góc của card combo xuống tối thiểu (flat design thực tế, không lạm dụng góc bo tròn).
- Bỏ nền xám của chữ điều kiện (mua kèm...), chỉ hiển thị chữ phẳng màu xám dịu để tổng thể không bị chia vụn thành nhiều mảng màu.
- Chuyển thẻ bọc chữ nhảy từ dạng flex sang `inline-block` để trình duyệt không tự cắt nhỏ dải màu gradient trên từng chữ cái, đồng thời tinh chỉnh chuyển động nhảy mượt mà và êm ái hơn (giảm độ nẩy dịch chuyển và bỏ phình chữ).

## 2. Elaboration & Self-Explanation
- **Bỏ Icon ở đầu**: Theo yêu cầu thẩm mỹ tối giản, ô chứa icon `%` hoặc `Gift` ở đầu card combo sẽ được loại bỏ hoàn toàn để phần chữ dịch sát lề trái, tạo cảm giác tinh giản.
- **Flat Design & Ít bo góc**: Các thuộc tính `rounded-lg` (8px) sẽ được thay thế bằng `rounded-sm` (2px) hoặc `rounded-md` (6px) tùy chi tiết để tạo các đường nét vuông vức, nam tính và cao cấp.
- **Bỏ các khối màu nền vụn vặt**: Nhãn điều kiện mua hàng hiện tại được bọc trong `bg-slate-100` tạo ra các hộp xám nhỏ vụn làm giao diện rối rắm. Chúng ta sẽ chuyển nó thành văn bản phẳng (flat text) màu `slate-500` thuần khiết.
- **Khắc phục lỗi render chữ nhảy**: CSS `background-clip: text` của thẻ cha sẽ hoạt động hoàn hảo 100% trên Chrome khi thẻ cha không sử dụng `display: inline-flex` (vốn kích hoạt cơ chế vẽ flex item độc lập). Chúng ta đổi thẻ cha thành `inline-block whitespace-nowrap` để trình duyệt vẽ dải màu liên tục trải dài trên cả từ.
- **Tinh chỉnh chuyển động**: Thay thế animation `combo-letter-wave` có độ nẩy lớn (`translateY(-0.22em)`) và co giãn scale (`1.08`) bằng chuyển động nhấc chữ nhẹ nhàng (`translateY(-0.12em)`), không scale phình to, giúp chữ chuyển động tinh tế như một dải lướt sóng của Apple.

## 3. Concrete Examples & Analogies
*   **Thiết kế phẳng và thoáng đãng**:
    - *Cũ*: Card bo tròn góc lớn + Icon đầu card + Ô nền xám điều kiện + Ô nền tím của Badge.
    - *Mới*: Card phẳng viền mỏng ít bo góc + Không icon đầu + Chữ điều kiện phẳng + Badge màu trung tính phẳng.
*   **Hình ảnh ẩn dụ**: Hãy tưởng tượng một bức tranh treo tường phòng khách. Thiết kế kiểu "AI" thường cố nhồi nhét khung viền to, góc bo tròn, dán thêm hoa văn trang trí ở góc. Thiết kế "Premium" (như Apple) là một bức tranh không khung (hoặc khung siêu mỏng vuông vức), treo trên nền tường sạch sẽ, tôn vinh tác phẩm nghệ thuật bên trong mà không có chi tiết thừa thãi nào làm loãng tầm nhìn.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Triệu chứng**: Giao diện combo hiển thị ngoài site thực bị chê xấu, rườm rà, lạm dụng bo góc, chữ nhảy tuần tự bị loang lổ nhiều màu (không trải đều) và chuyển động giật cục.
*   **Phạm vi**: 
    - [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
    - [globals.css](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/globals.css)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc**:
    - Giữ lại phần `Icon Box` ở đầu card combo.
    - Sử dụng `inline-flex flex-wrap` cho thẻ cha của chữ wave khiến Chrome chia nhỏ background-clip.
    - Animation `combo-letter-wave` có lực nảy quá mạnh và scale co giãn lớn.
    - Lạm dụng `bg-slate-100` bọc điều kiện gây phân mảnh giao diện.
*   **Giả thuyết đối chứng**: Việc lược bỏ icon, làm phẳng thẻ điều kiện, chuyển sang `inline-block` và hạ thấp biên độ sóng sẽ mang lại giao diện tinh tế, đẳng cấp.

# IV. Proposal (Đề xuất)
1.  **Chỉnh sửa globals.css**:
    - Cập nhật `@keyframes combo-letter-wave` chỉ dịch chuyển `translateY(-0.12em)` và không scale.
2.  **Sắp xếp cấu trúc trong ProductDetailPage.tsx và ProductDetailPreview.tsx**:
    - Trong `renderEffectText`: Đổi thẻ cha sang `inline-block whitespace-nowrap` (hoặc `inline-block`).
    - Trong `ProductCombosBlock`:
      - Loại bỏ toàn bộ phần `Icon Box` (Percent/Gift/Tag).
      - Đổi cỡ chữ tiêu đề thành `font-bold text-[15px]`.
      - Thay đổi badge loại combo ("Theo bộ"): loại bỏ màu nền tím gắt, chuyển thành nhãn xám trung tính phẳng: `px-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-sm text-[9px] uppercase tracking-wider font-bold`.
      - Thẻ điều kiện `conditionText`: Bỏ `bg-slate-100 px-1.5 py-0.5 text-slate-600 rounded`, thay bằng thẻ `span` phẳng `text-slate-500 dark:text-slate-400`.
      - Giảm góc bo của card combo từ `rounded-lg` xuống `rounded-md`.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa**: [globals.css](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/globals.css)
    - Thay thế keyframes và định nghĩa của `.animate-combo-letter-wave`.
*   **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - Chỉnh sửa hàm `renderEffectText` và cấu trúc DOM hiển thị combo trong `ProductCombosBlock`.
*   **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
    - Đồng bộ thay đổi tương tự cho component preview.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa file `app/globals.css`.
2. Sửa file `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`.
3. Sửa file `components/experiences/previews/ProductDetailPreview.tsx`.
4. Chạy kiểm tra TypeScript biên dịch.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit`.
*   **Kiểm tra thủ công**: Quan sát giao diện combo ngoài site thực đảm bảo thiết kế phẳng, thoáng đạt, không icon rườm rà và chữ chuyển dịch mượt mà.

# VIII. Todo
- [ ] Thay đổi CSS animation trong `globals.css`.
- [ ] Chỉnh sửa hàm render và layout combo trong `ProductDetailPage.tsx`.
- [ ] Chỉnh sửa hàm render và layout combo trong `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm thử TypeScript tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Card combo hiển thị phẳng, tối giản, ít bo góc, không có icon ở đầu.
- Nhãn điều kiện hiển thị dưới dạng chữ phẳng không có nền xám bọc.
- Chữ nhảy tuần tự hiển thị dải màu trải đều và chuyển dịch sóng nhẹ nhàng, tinh tế.
- Biên dịch thành công.

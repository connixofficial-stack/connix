# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: File hiển thị chi tiết sản phẩm trên web thực tế đang bị hỏng cú pháp nghiêm trọng (bị cắt cụt code) ở phần hiển thị các thuộc tính sản phẩm của giao diện cao cấp (Premium layout). Ngoài ra, nút trượt qua lại cần được làm mờ nhẹ, siêu tinh tế để tránh chiếm không gian hiển thị, và các nhãn chữ không được dùng dấu ba chấm `...` làm thiếu thông tin.
- **Giải pháp**: 
  1. Viết lại phần hiển thị thuộc tính Premium bị hỏng trong `ProductDetailPage.tsx` sao cho đồng bộ hoàn hảo với bản xem trước (`ProductDetailPreview.tsx`).
  2. Sử dụng thư viện Embla Carousel để người dùng có thể vuốt trượt các thuộc tính mượt mà trên điện thoại.
  3. Cài đặt các nút bấm `<` và `>` siêu nhẹ: kích thước nhỏ `h-5 w-5`, mờ nhẹ ẩn đi khi không tương tác và chỉ rõ ràng hơn khi rê chuột vào.
  4. Bỏ hoàn toàn dòng tiêu đề "THÔNG TIN CHI TIẾT SẢN PHẨM" dư thừa.
  5. Đảm bảo toàn bộ chữ hiển thị thuộc tính tự động xuống dòng (`break-words`) thay vì bị cắt bớt bằng dấu ba chấm (`truncate`).

## 2. Elaboration & Self-Explanation
Trong giao diện cao cấp (Premium Style), chúng ta hiển thị các thuộc tính lọc của sản phẩm (như Hương vị, Giống nho, Nồng độ đối với rượu, hoặc các thông số kỹ thuật khác tùy thuộc loại sản phẩm) dưới dạng một dải ngang liền mạch.
- Khi số lượng thuộc tính vượt quá giới hạn màn hình (Desktop là 4, Tablet là 3, Mobile là 2), chúng ta kích hoạt cơ chế Embla Carousel để cho phép vuốt trượt ngang.
- Khi số thuộc tính ít hơn hoặc bằng giới hạn, chúng ta chỉ hiển thị một lưới (Grid) chia đều bình thường và ẩn toàn bộ nút trượt cùng Embla đi.
- Trước đó, code trên trang thực tế `ProductDetailPage.tsx` bị lỗi cú pháp do thao tác thay thế file bị đứt gãy giữa chừng (dòng 3184 bị biến thành `const hasOverflow = sortedGr                  {/* Nút Prev/Next */}`).
- Chúng ta sẽ thay thế toàn bộ khối code thuộc tính Premium bị hỏng này, đồng thời tinh chỉnh CSS của các nút bấm điều hướng (`ChevronLeft`, `ChevronRight`) để chúng có kích thước nhỏ gọn `h-5 w-5`, nền mờ nhẹ hòa vào giao diện, và text hiển thị thuộc tính sử dụng `break-words` để đảm bảo thông tin luôn nguyên vẹn.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Sản phẩm rượu vang có 6 thuộc tính: Hương vị, Giống nho, Nồng độ, Dung tích, Quốc gia, Hãng sản xuất.
  - Trên màn hình máy tính (Desktop - giới hạn 4): Embla Carousel sẽ chia 6 thuộc tính này thành các ô trượt ngang. Hai nút `<` và `>` siêu nhỏ tinh tế xuất hiện ở góc trên bên phải của khung thuộc tính. Người dùng có thể click hoặc vuốt để xem tiếp 2 thuộc tính bị ẩn.
  - Trên màn hình điện thoại (Mobile - giới hạn 2): Giao diện sẽ hiển thị 2 thuộc tính cùng lúc, và người dùng có thể dùng ngón tay vuốt trượt cực kỳ mượt mà.
  - Các thông số dài như "Gỗ sồi, Tiêu đen, Vani, Trái chín" sẽ tự động xuống dòng đẹp đẽ chứ không bị hiển thị nửa chừng thành "Gỗ sồi, Tiêu đen...".
- **Hình ảnh ví dụ**: Giống như dải thẻ tin tức hoặc danh mục trên ứng dụng Spotify hay Airbnb, các nút bấm điều hướng chỉ xuất hiện mờ ẩn khi danh sách quá dài, còn bản thân thông tin chữ được hiển thị trọn vẹn và vuốt mượt mà.

# II. Audit Summary (Tóm tắt kiểm tra)
- **File bị lỗi**: `app/(site)/_components/details/ProductDetailPage.tsx`
- **Tình trạng lỗi**: Lỗi cú pháp TypeScript/JSX tại dòng 3183-3292 do quá trình ghi đè nội dung file bị lỗi so khớp, gây đứt gãy mã nguồn.
- **Trạng thái preview**: `components/experiences/previews/ProductDetailPreview.tsx` đã được chỉnh sửa thành công và hoạt động mượt mà với Embla Carousel & nút điều hướng tinh tế.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Do công cụ `replace_file_content` thực hiện thay thế khối code quá lớn và bị so khớp sai vị trí ở lượt chạy trước, dẫn đến việc chèn đè mã nguồn không đồng đều và hỏng cấu trúc JSX.
- **Giả thuyết đối chứng**: Việc khôi phục cấu trúc JSX chuẩn, đồng bộ hóa logic Carousel từ `ProductDetailPreview.tsx` sang `ProductDetailPage.tsx` và tinh chỉnh nút điều hướng sẽ giúp ứng dụng biên dịch thành công 100% và đạt hiệu ứng UI mượt mà như mong muốn.

# IV. Proposal (Đề xuất)
- Thay thế hoàn toàn khối render attributes Premium bị lỗi ở chân trang của `ProductDetailPage.tsx` từ dòng 3155 đến dòng 3297 bằng khối code sạch, đã được định dạng chuẩn, đồng bộ với logic Embla của Preview.
- Cấu hình nút điều hướng có kích thước `h-5 w-5`, icon cỡ `10`, nền trong suốt mờ nhẹ `tokens.surface + "aa"`, độ mờ mặc định `opacity-40` và nâng lên `hover:opacity-100` khi tương tác.
- Loại bỏ hoàn toàn dòng tiêu đề `THÔNG TIN CHI TIẾT SẢN PHẨM` để giao diện liền mạch, gọn gàng.
- Đảm bảo hiển thị đầy đủ tên nhóm thuộc tính và giá trị, sử dụng class `break-words` thay vì `truncate`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)
  - Vai trò: File logic và giao diện trang chi tiết sản phẩm trên site thực tế.
  - Thay đổi: Sửa lại lỗi cú pháp, tích hợp Embla Carousel và nút điều hướng tinh tế cho dải thuộc tính Premium.

# VI. Execution Preview (Xem trước thực thi)
1. Xác định chính xác vùng code bị hỏng từ dòng 3155 đến dòng 3297 trong `ProductDetailPage.tsx`.
2. Chuẩn bị đoạn code thay thế hoàn chỉnh, đảm bảo đóng/mở ngoặc `{}` và JSX tags chính xác.
3. Thực hiện thay thế bằng `replace_file_content`.
4. Chạy kiểm tra TypeScript (`tsc`) để xác nhận dự án sạch lỗi cú pháp.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh (Static Check)**:
  - Chạy `bunx tsc --noEmit` để đảm bảo trình biên dịch TypeScript không phát hiện bất kỳ lỗi cú pháp hay kiểu dữ liệu nào trong dự án.
- **Nhìn/Tương tác (Visual & Interactive)**:
  - Kiểm tra xem dải thuộc tính hiển thị mượt mà trên môi trường thực tế.
  - Test responsive trên Mobile (2 items), Tablet (3 items), Desktop (4 items).
  - Xác nhận các nút `<` và `>` chỉ hiển thị khi tổng số thuộc tính vượt quá giới hạn và hoạt động chính xác khi click.

# VIII. Todo
- [ ] Thay thế khối code attributes Premium bị hỏng trong `ProductDetailPage.tsx`.
- [ ] Chạy kiểm tra TypeScript lỗi type để xác nhận thành công.
- [ ] Thực hiện lệnh âm thanh báo hoàn thành task `powershell -c "(New-Object -ComObject SAPI.SpVoice).Speak('Done, Sir.')"`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Code trang `ProductDetailPage.tsx` được biên dịch thành công không có lỗi cú pháp.
- Khối attributes Premium hiển thị ngang, phân chia bằng vạch kẻ dọc mỏng.
- Embla Carousel hoạt động trơn tru trên cả preview và site thực tế.
- Các nút điều hướng nhỏ gọn `h-5 w-5` tinh tế, mờ nhẹ, không chiếm dụng không gian giao diện.
- Không có hiện tượng dấu ba chấm `...` ở các thông số thuộc tính.
- Tiêu đề "THÔNG TIN CHI TIẾT SẢN PHẨM" được ẩn hoàn toàn ở cả preview và site thực tế đối với Premium layout.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi cú pháp JSX nếu ngoặc nhọn không cân xứng.
- **Hoàn tác**: Sử dụng Git checkout hoặc công cụ chỉnh sửa để khôi phục trạng thái trước đó của `ProductDetailPage.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc dữ liệu trong Convex DB hoặc thay đổi các layout khác (Classic, Modern, Minimal).
- Thay đổi thiết kế các khối khác như Variants Selector, Combo Banner, hay Social Buttons.

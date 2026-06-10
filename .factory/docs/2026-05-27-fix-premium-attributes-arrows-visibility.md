# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Người dùng không nhìn thấy nút điều hướng `<` và `>` (nút trượt) đâu cả. Lý do là vì khung lớn bên ngoài có thuộc tính ẩn các phần tử tràn ra ngoài (`overflow-hidden`), trong khi các nút trượt lại được đặt dịch lên phía trên của khung (`-top-11`), dẫn đến việc chúng bị cắt bỏ hoàn toàn khỏi tầm nhìn.
- **Giải pháp**: 
  1. Loại bỏ thuộc tính `overflow-hidden` ở khung lớn bên ngoài, chỉ giữ `overflow-hidden` cho riêng vùng trượt Embla Carousel.
  2. Di chuyển hai nút trượt `<` và `>` vào bên trong khung, đặt căn giữa dọc ở 2 đầu trái và phải của dải thuộc tính (tương ứng `left-0` và `right-0`).
  3. Co vùng trượt Embla vào giữa một chút (`mx-6` trên Mobile, `mx-8` trên Desktop) để chừa khoảng trống cho hai nút bấm ở 2 đầu, tránh việc nút trượt đè lên chữ của thuộc tính.

## 2. Elaboration & Self-Explanation
Trong cả file preview (`ProductDetailPreview.tsx`) và site thực tế (`ProductDetailPage.tsx`), khung bọc dải thuộc tính Premium được viết như sau:
`<div className="rounded-2xl p-4 md:p-5 relative overflow-hidden border" ...>`
Lớp `overflow-hidden` ở đây có mục đích ẩn các slide thuộc tính nằm ngoài vùng hiển thị của Embla Carousel. Tuy nhiên, nút trượt `<` và `>` lại được định vị bằng lớp absolute `-top-11 right-0` (nằm ở phía trên viền của khung). Do có lớp `overflow-hidden` của khung cha, toàn bộ các nút này bị trình duyệt cắt bỏ và không hiển thị trên màn hình.

Chúng ta sẽ thực hiện tái cấu trúc:
- Loại bỏ lớp `overflow-hidden` khỏi container cha để cho phép hiển thị các phần tử định vị absolute bên trong nó.
- Đặt lớp `overflow-hidden` vào đúng viewport của Embla (thẻ div có `ref={premiumAttrRef}`).
- Để giao diện cân đối và hoạt động như một "hint" trượt thông minh, chúng ta chuyển hai nút trượt về dạng định vị absolute ở hai đầu trái/phải của dải thuộc tính:
  - Nút trượt Prev: `absolute left-0 top-1/2 -translate-y-1/2 z-20`
  - Nút trượt Next: `absolute right-0 top-1/2 -translate-y-1/2 z-20`
- Đồng thời, chúng ta thêm lớp `mx-6 md:mx-8` cho viewport Embla để tạo khoảng cách an toàn, giúp dải thuộc tính trượt không bao giờ bị đè lấp bởi nút bấm.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Giống như việc bạn làm một chiếc khung ảnh bằng gỗ và lồng tấm kính có kích thước nhỏ hơn vào trong. Nếu bạn đặt các nút trang trí ở rìa ngoài của khung gỗ (phía trên viền), nhưng lại dùng một chiếc hộp giấy bọc kín toàn bộ khung gỗ (`overflow-hidden`), người xem sẽ không thể thấy các nút trang trí đó.
  Giải pháp là tháo bỏ chiếc hộp giấy bọc ngoài khung gỗ ra, chỉ bọc kín phần tranh trượt bên trong kính. Các nút bấm điều hướng trượt trái/phải sẽ được gắn trực tiếp lên 2 đầu của khung gỗ để người xem dễ dàng nhìn thấy và bấm vào.

# II. Audit Summary (Tóm tắt kiểm tra)
- **File bị ảnh hưởng**: 
  1. `app/(site)/_components/details/ProductDetailPage.tsx`
  2. `components/experiences/previews/ProductDetailPreview.tsx`
- **Triệu chứng**: Nút điều hướng trượt `<` và `>` bị ẩn hoàn toàn trên mọi thiết bị và kích thước màn hình do bị lớp `overflow-hidden` của container cha cắt bỏ.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Container cha chứa dải thuộc tính Premium có class `overflow-hidden` kết hợp với việc nút trượt được đặt ở vị trí `-top-11` (nằm ngoài ranh giới vùng đệm của container).
- **Giả thuyết đối chứng**: Bỏ `overflow-hidden` ở container cha, chuyển nó xuống viewport Embla, và đặt hai nút trượt absolute ở hai đầu (`left-0` và `right-0`) căn giữa dọc sẽ giúp hiển thị hoàn hảo nút trượt trên cả site thực tế và bản xem trước.

# IV. Proposal (Đề xuất)
1. **Sửa file `ProductDetailPage.tsx`**:
   - Xóa `overflow-hidden` khỏi container cha của dải thuộc tính Premium (dòng 3189).
   - Đổi vị trí nút bấm Prev sang `absolute left-0 top-1/2 -translate-y-1/2 z-20`.
   - Đổi vị trí nút bấm Next sang `absolute right-0 top-1/2 -translate-y-1/2 z-20`.
   - Thêm lớp `mx-6 md:mx-8` cho Embla viewport `ref={premiumAttrRef}`.
2. **Sửa file `ProductDetailPreview.tsx`**:
   - Áp dụng các thay đổi cấu trúc và CSS tương tự như trên để đảm bảo tính đồng nhất 100%.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)
  - Vai trò: Giao diện chi tiết sản phẩm trên site thực tế.
  - Thay đổi: Cập nhật vị trí nút trượt căn giữa dọc ở 2 đầu và bỏ overflow container cha.
- `Sửa`: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
  - Vai trò: Bản xem trước chi tiết sản phẩm trong admin.
  - Thay đổi: Cập nhật vị trí nút trượt và cấu trúc viewport đồng bộ với site thực tế.

# VI. Execution Preview (Xem trước thực thi)
1. Định vị vùng container dải thuộc tính Premium trong `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
2. Thay đổi class `overflow-hidden` thành rỗng hoặc xóa bỏ trên container cha.
3. Cập nhật JSX nút bấm Prev/Next và viewport Embla.
4. Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi compile.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh (Static Check)**: Chạy `bunx tsc --noEmit` toàn dự án.
- **Visual Check**: Truy cập site thực tế và Preview để kiểm tra xem hai nút trượt `<` và `>` đã hiển thị tinh tế ở 2 đầu dải thuộc tính khi có nhiều hơn số lượng limit items.

# VIII. Todo
- [ ] Cập nhật file `ProductDetailPage.tsx` (site thực tế).
- [ ] Cập nhật file `ProductDetailPreview.tsx` (bản xem trước).
- [ ] Chạy kiểm tra TypeScript compile check.
- [ ] Commit code và phát âm báo hoàn thành `Done, Sir.`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hai nút trượt `<` và `>` hiển thị rõ ràng và tinh tế ở 2 đầu dải thuộc tính Premium khi có tràn thuộc tính.
- Viewport trượt không bị đè chữ bởi nút trượt.
- Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Không có rủi ro lớn. Hoàn tác bằng Git checkout.

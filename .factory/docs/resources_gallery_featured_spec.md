# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1**: Tính năng "Nổi bật" của tài nguyên đã bị tắt trong phần Cài đặt Hệ thống nhưng ô checkbox "Đánh dấu nổi bật" vẫn hiển thị trong trang tạo/sửa tài nguyên. Chúng ta cần ẩn nó đi nếu tính năng này không được bật.
* **Vấn đề 2**: Khu vực upload ảnh thư viện (Gallery) của tài nguyên hiển thị các nút thao tác rời rạc và thô sơ. Chúng ta cần chuyển sang dùng layout dạng dọc (`layout="vertical"`) giống như trang sản phẩm để hiển thị gọn gàng, đẹp mắt.
* **Vấn đề 3**: Nút "Xem ngoài site" to đòn ở đầu trang chỉnh sửa tài nguyên chiếm diện tích. Chúng ta cần chuyển nó xuống thanh công cụ cố định bên dưới (Sticky Footer) dưới dạng một nút icon nhỏ gọn và tinh tế.

## 2. Elaboration & Self-Explanation
* **Ẩn/hiện tính năng động**: Hệ thống có trang quản trị tính năng module (`/system/modules/resources`). Khi tắt tính năng "Nổi bật", giá trị `enableFeatured` trong database sẽ là `false`. Trang tạo/sửa tài nguyên cần truy vấn trạng thái này thông qua Convex query và chỉ render card "Tuỳ chọn" khi tính năng này được kích hoạt.
* **Cải thiện MultiImageUploader**: Component `MultiImageUploader` có tham số cấu hình `layout`. Giá trị mặc định là `horizontal` khiến các nút hành động (Upload, URL, Paste) bị vỡ và thô kệch trên màn hình. Thiết lập `layout="vertical"` sẽ xếp ảnh lên trên, các trường/nút thao tác xuống dưới tạo thành dạng thẻ card cân đối và đồng bộ với trang sản phẩm.
* **Tối ưu hóa Sticky Footer**: Thay vì sử dụng nút "Xem ngoài site" dạng văn bản ở phần header trang, việc đưa nó xuống Sticky Footer cạnh nút "Lưu thay đổi" dưới dạng một nút icon (`size="icon"`) chứa biểu tượng `ExternalLink` giúp giao diện tinh gọn, tập trung và giảm bớt hành động thừa ở phần đầu trang.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Khi vào chỉnh sửa một tài nguyên, bạn sẽ thấy ảnh gallery được xếp thành các ô vuông cân xứng, bên dưới mỗi ảnh là các nút chỉnh sửa nhỏ gọn thay vì các nút bấm to tướng đè lên nhau.
  * Ở chân trang (Sticky Footer), bên cạnh nút "Hủy bỏ" và "Lưu thay đổi", sẽ xuất hiện thêm một nút hình vuông nhỏ có biểu tượng mũi tên chỉ ra ngoài để bạn bấm xem trực tiếp tài nguyên đó ngoài site mà không cần cuộn lên trên cùng.
* **Hình ảnh ẩn dụ**: Giống như việc bạn thu gọn chiếc bảng hiệu to đùng trước cửa hàng thành một bảng chỉ dẫn nhỏ xinh đặt ngay quầy thu ngân để khách hàng tiện bấm xem menu online khi thanh toán.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra giao diện quản lý module: Tính năng "Nổi bật" có key tương ứng là `enableFeatured`.
* Tệp tin [resources/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx) dòng 352-357: Đang render card "Tuỳ chọn" cố định, không kiểm tra điều kiện của feature `enableFeatured`.
* Tệp tin [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx) dòng 464-472: Đang render card "Tuỳ chọn" tương tự, thiếu kiểm tra điều kiện.
* Tệp tin [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx) dòng 250-252: Nút "Xem ngoài site" đang hiển thị ở header.
* Cả hai tệp đang render component `MultiImageUploader` thiếu các thuộc tính `layout="vertical"` và `imageKey="url"`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: High.
* **Nguyên nhân**: Module resources được phát triển độc lập và chưa áp dụng triệt để cơ chế bật/tắt tính năng động của module (đối với "Nổi bật"), cũng như chưa đồng bộ các tham số cấu hình hiển thị UI nâng cao của `MultiImageUploader` và `HomeComponentStickyFooter` từ module sản phẩm.
* **Giả thuyết đối chứng**: Việc hiển thị cố định nút nổi bật và nút xem ngoài site không gây lỗi crash app, nhưng nó vi phạm tính đồng bộ của hệ thống quản trị module động và làm giảm tính thẩm mỹ của giao diện.

# IV. Proposal (Đề xuất)
* **Ẩn/hiện tính năng nổi bật**:
  * Thực hiện query feature `enableFeatured`:
    ```tsx
    const featuredFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: MODULE_KEY, featureKey: 'enableFeatured' });
    ```
  * Chỉ render card "Tuỳ chọn" (checkbox nổi bật) khi `featuredFeature?.enabled` là `true`.
* **Cấu hình lại MultiImageUploader**:
  * Cập nhật `MultiImageUploader` trong cả hai tệp: bổ sung `layout="vertical"`, `imageKey="url"`, và các tham số đặt tên ảnh `naming` / `namingIndexOffset={1}`.
* **Đưa nút xem ngoài site xuống Sticky Footer**:
  * Xóa link xem ngoài site ở header của [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx).
  * Chuyển `HomeComponentStickyFooter` ở trang edit sang sử dụng custom `children` để tùy biến nút bấm: thêm nút icon `ExternalLink` bên cạnh nút "Lưu thay đổi".

# V. Files Impacted (Tệp bị ảnh hưởng)
* `Sửa`: [resources/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx)
  * Khai báo query `featuredFeature`, bọc card "Tuỳ chọn" và bổ sung props cho `MultiImageUploader`.
* `Sửa`: [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
  * Khai báo query `featuredFeature`, bọc card "Tuỳ chọn", bổ sung props cho `MultiImageUploader`, xóa nút header và thiết kế lại Sticky Footer bằng custom `children`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và xác định vị trí của card "Tuỳ chọn" và `MultiImageUploader` trong cả hai file.
2. Thực hiện sửa đổi tệp `app/admin/resources/create/page.tsx`.
3. Thực hiện sửa đổi tệp `app/admin/resources/[id]/edit/page.tsx`.
4. Rà soát tĩnh để đảm bảo các component và icons (`ExternalLink`) được import đầy đủ.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kế hoạch kiểm chứng**:
  * Chạy `bunx tsc --noEmit` để đảm bảo code compile thành công không có lỗi type.
  * Bàn giao để kiểm tra hiển thị thực tế trên trình duyệt.

# VIII. Todo
* [ ] Thêm query `enableFeatured` và bọc điều kiện hiển thị card "Tuỳ chọn" trong `resources/create/page.tsx`.
* [ ] Cấu hình lại `MultiImageUploader` với `layout="vertical"` trong `resources/create/page.tsx`.
* [ ] Thực hiện tương tự cho `resources/[id]/edit/page.tsx` đối với card "Tuỳ chọn" và `MultiImageUploader`.
* [ ] Xóa nút xem ngoài site ở header của `resources/[id]/edit/page.tsx`.
* [ ] Thiết kế lại `HomeComponentStickyFooter` trong `resources/[id]/edit/page.tsx` để tích hợp nút icon xem ngoài site.
* [ ] Chạy kiểm tra TypeScript compiler toàn dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Checkbox "Đánh dấu nổi bật" chỉ xuất hiện khi tính năng "Nổi bật" được kích hoạt trong `/system/modules/resources`.
* Gallery ảnh hiển thị theo layout dọc đồng bộ với trang sản phẩm, các nút upload/url hiển thị cân đối và gọn gàng bên dưới ảnh.
* Trang edit không còn nút "Xem ngoài site" ở trên đầu; thay vào đó là nút icon vuông biểu tượng liên kết ngoài nằm bên trái nút "Lưu thay đổi" ở Sticky Footer.
* Sticky Footer vẫn thực hiện lưu dữ liệu chính xác khi nhấn nút Lưu thay đổi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Thay đổi nhỏ về giao diện, nguy cơ lỗi type do thiếu import icon `ExternalLink` hoặc lỗi thẻ đóng mở jsx.
* **Hoàn tác**: Dùng lệnh Git restore để khôi phục trạng thái trước khi sửa.

# XI. Out of Scope (Ngoài phạm vi)
* Tùy chỉnh các layout hiển thị bên ngoài website client.

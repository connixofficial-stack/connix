# I. Primer

## 1. TL;DR kiểu Feynman
* Hệ thống thuộc tính cho phép admin cấu hình cách hiển thị (Dropdown, Radio, Checkbox, Nút chọn) và cách lọc (Chỉ chọn một, Chọn nhiều, Khoảng slider).
* Trước đây, ngoài frontend, bộ lọc thuộc tính chỉ được vẽ cứng theo 3 kiểu cơ bản và không hỗ trợ kéo Slider (Range Filter).
* Nhiệm vụ của chúng ta là thay thế cơ chế cũ bằng component `AttributeFilterGroupWidget` có khả năng tự động điều chỉnh giao diện chính xác theo cấu hình trong admin.
* Đối với kiểu lọc Khoảng slider (range), component sẽ tự động tách số trong tên các thuộc tính, dựng một slider hai đầu kéo, và lọc các sản phẩm nằm trong khoảng đó để gửi lên Convex.

## 2. Elaboration & Self-Explanation
Hiện tại trong trang admin quản lý Nhóm thuộc tính, chúng ta có hai cấu hình chính cho bộ lọc:
* **Kiểu lọc (filterType)**: gồm `single` (chỉ chọn một), `multiple` (chọn nhiều), và `range` (lọc theo khoảng giá trị số liên tục).
* **Kiểu hiển thị (inputType)**: gồm `select` (dropdown), `buttons` (nút bấm độc lập), `radio` (chọn một), `checkbox` (chọn nhiều).

Trong mã nguồn ngoài frontend (`ProductsPage.tsx`), hàm render cũ `renderAttributeFilterGroup` chỉ xử lý đơn sơ các kiểu `select`, `buttons`, và `radio/checkbox`, hoàn toàn bỏ qua kiểu lọc `range`. Việc này khiến trải nghiệm người dùng ngoài site thực tế không đồng bộ với tính năng Live Preview trong admin.
Để khắc phục, chúng ta sẽ viết component `AttributeFilterGroupWidget` hỗ trợ đầy đủ:
* Khi `filterType` là `range`: hiển thị một Range Slider 2 đầu kéo (min/max). Component sẽ tự parse các giá trị số từ tên của các Attribute Terms (ví dụ: "750ml" -> 750), xác định giới hạn min/max và gửi danh sách các term IDs thỏa mãn về backend khi người dùng thả chuột.
* Khi `inputType` là `select`, `buttons`, `radio`, `checkbox`: render chính xác cấu trúc HTML, CSS giống như Live Preview để đảm bảo tính thẩm mỹ cao cấp.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Nhóm thuộc tính "Dung tích" có các giá trị: "187ml", "375ml", "750ml", "1500ml".
  * Nếu chọn kiểu lọc `range`:
    * Hệ thống parse ra các số tương ứng: 187, 375, 750, 1500.
    * Slider sẽ có khoảng chạy từ 187 đến 1500.
    * Khi người dùng kéo từ 375ml đến 750ml rồi thả chuột, component sẽ thu thập các term IDs của "375ml" và "750ml" rồi cập nhật vào URL dưới dạng mảng các term IDs.
* **Hình ảnh tương tự**: Việc này giống như bạn đi mua điều hòa. Bạn có thể chọn cách bấm nút chọn công suất (nút 1HP, 2HP - tương ứng kiểu `buttons`), chọn từ danh sách thả xuống (kiểu `select`), hoặc kéo một thanh trượt nhiệt độ từ 16 đến 30 độ (kiểu `range`). Hệ thống cần phải hiểu và vẽ đúng các công cụ điều khiển này tương ứng với mong muốn của bạn.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra file `ProductsPage.tsx`: Hàm `renderAttributeFilterGroup` cũ vẽ trực tiếp các input và không có state lưu trữ cho range slider. Nó được dùng tại `MobileProductsFilters` và `CatalogLayout`.
* Đã kiểm tra file `AttributeGroupPreview.tsx` trong admin: Code preview chứa toàn bộ logic dựng UI của slider 2 đầu kéo cùng phong cách CSS inline rất đẹp, chúng ta sẽ mang các logic này ra ngoài frontend để tái sử dụng.
* Đã kiểm tra kiểu dữ liệu `onAttributeChange`: Callback này hiện tại chỉ nhận `termId: string`, cần mở rộng thành `termId: string | string[]` để hỗ trợ truyền mảng các ID thuộc tính thỏa mãn khoảng slider.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: High.
* **Nguyên nhân**: Hàm `renderAttributeFilterGroup` cũ ngoài frontend chưa được lập trình để xử lý trường hợp `filterType === 'range'`, đồng thời các hàm callback xử lý sự kiện lọc chưa hỗ trợ truyền mảng term IDs. Do đó trang web thực tế bị hiển thị sai lệch so với Live Preview trong Admin.

# IV. Proposal (Đề xuất)
* **Bước 1**: Cập nhật định nghĩa TypeScript cho `onAttributeChange` trong các interface `LayoutProps` và `MobileProductsFiltersProps` ở `ProductsPage.tsx` để chấp nhận `termId: string | string[]`.
* **Bước 2**: Sửa hàm `handleAttributeChange` trong `ProductsPage.tsx` để xử lý trường hợp `termId` là một mảng `string[]` (gán trực tiếp vào bộ lọc của nhóm thuộc tính).
* **Bước 3**: Tạo component `AttributeFilterGroupWidget` thay thế cho `renderAttributeFilterGroup`.
  * Hỗ trợ đầy đủ các dạng hiển thị: `select`, `buttons`, `radio`, `checkbox`.
  * Hỗ trợ bộ lọc `range` bằng Slider 2 đầu kéo. Tự động parse số từ tên thuộc tính để xác định giới hạn min/max động.
  * Cập nhật URL (apply filter) khi thả chuột (`onMouseUp` / `onTouchEnd`) để tránh giật lag khi đang kéo slider.
* **Bước 4**: Thay thế các hàm `renderAttributeFilterGroup` cũ trong `MobileProductsFilters` và `CatalogLayout` bằng component `AttributeFilterGroupWidget`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Vai trò hiện tại: Quản lý giao diện danh sách sản phẩm và các bộ lọc ngoài site.
  * Thay đổi: Mở rộng kiểu dữ liệu interface/callback, cập nhật logic xử lý thay đổi filter dạng mảng, thêm component `AttributeFilterGroupWidget` và áp dụng vào giao diện desktop & mobile.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa các interface `LayoutProps`, `MobileProductsFiltersProps` trong `ProductsPage.tsx`.
2. Sửa logic callback `handleAttributeChange` trong `ProductsPage.tsx`.
3. Khai báo import `Check` từ `lucide-react` trong `ProductsPage.tsx`.
4. Tạo component `AttributeFilterGroupWidget` và định nghĩa các hàm parse số, state slider đồng bộ.
5. Thay thế lệnh gọi render cũ trong `MobileProductsFilters` và `CatalogLayout`.
6. Thực hiện kiểm tra biên dịch tĩnh TypeScript bằng lệnh `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tự động**: Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo compile thành công không có lỗi kiểu dữ liệu.
* **Kiểm tra thủ công**: Người dùng kiểm tra trực quan trên các trang sản phẩm, đảm bảo các nhóm thuộc tính hiển thị chuẩn như cấu hình (ví dụ: nhóm Dung tích dạng slider kéo mượt mà, lọc chính xác sản phẩm; nhóm Giống nho hiển thị dropdown/buttons chính xác).

# VIII. Todo
* [ ] Sửa interface `LayoutProps` và `MobileProductsFiltersProps` trong `ProductsPage.tsx`.
* [ ] Cập nhật hàm `handleAttributeChange` hỗ trợ `string[]`.
* [ ] Thêm import `Check` từ `lucide-react`.
* [ ] Viết component `AttributeFilterGroupWidget` thay thế `renderAttributeFilterGroup`.
* [ ] Cập nhật giao diện Desktop và Mobile sang dùng component mới.
* [ ] Chạy `bunx tsc --noEmit` để xác minh.
* [ ] Phát âm báo hoàn thành và commit code.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Giao diện bộ lọc thuộc tính ngoài frontend thay đổi động và chính xác theo cấu hình `filterType` và `inputType` của từng nhóm thuộc tính.
* Bộ lọc `range` hiển thị slider hai đầu kéo, hiển thị nhãn dải chọn hiện tại, kéo mượt và lọc đúng sản phẩm khi thả chuột.
* Không có lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Nếu parse số từ tên thuộc tính thất bại hoặc không có thuộc tính nào có số cho range slider.
* **Giải pháp**: Nếu không parse được số, component sẽ ẩn range slider hoặc fallback hiển thị dạng nút chọn thông thường để không làm vỡ giao diện.
* **Rollback**: Dùng Git để revert file `ProductsPage.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi schema database của Convex hoặc logic index sản phẩm ở backend.

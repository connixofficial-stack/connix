# I. Primer

## 1. TL;DR kiểu Feynman
Hiện tại, nút bấm hành động (CTA) của sơ đồ vòng tròn (Circular Layout) đang lấy nhãn từ ô "Badge" và cố định liên kết dẫn đến `#contact`. Điều này làm hạn chế khả năng chỉnh sửa của quản trị viên. Chúng ta sẽ:
* Thêm một khu vực cấu hình riêng cho Circular trong trang Admin để quản trị viên có thể nhập nhãn nút (Text) và liên kết tùy ý (Link).
* Thêm một nút chọn đường dẫn nhanh (Gợi ý) giống như tính năng chọn liên kết trong trang Quản lý Menu để quản trị viên không cần gõ link bằng tay.
* Cập nhật giao diện trang chủ để áp dụng trực tiếp các cài đặt tùy chọn mới này.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ thực hiện mở rộng cấu trúc dữ liệu và giao diện cấu hình của cấu phần Process:
* **Mở rộng Kiểu dữ liệu (Data Contract / Types):** Thêm hai trường `circularCtaText` (chuỗi) và `circularCtaLink` (chuỗi) vào cấu hình của Process. Chuẩn hóa hai trường này trong file normalize logic (sử dụng fallback về giá trị mặc định trống hoặc `#contact`).
* **Cập nhật Giao diện Quản trị (Admin UI):**
  * Trong tệp `ProcessForm.tsx`, chúng ta sẽ bổ sung một tiểu mục (SubSection) riêng có tiêu đề "Cấu hình Circular (Builder.io)". Mục này chỉ hiển thị khi quản trị viên chọn kiểu bố cục là "Circular (Builder.io)".
  * Tiểu mục này chứa hai trường: "Nút CTA (Text)" và "Đường dẫn CTA (Link)". 
  * Trường "Đường dẫn CTA (Link)" sẽ sử dụng component `QuickRouteInput` (ô nhập kèm nút chọn gợi ý) được thiết kế sẵn để mở popup `QuickRoutePickerModal` giúp tìm kiếm nhanh các trang, bài viết, dịch vụ hay danh mục trong hệ thống.
  * Đồng bộ hóa trạng thái thay đổi này trong trang tạo mới (`create/process/page.tsx`) và trang cập nhật (`process/[id]/edit/page.tsx`).
* **Cập nhật Giao diện Hiển thị (Runtime UI):**
  * Chuyển hai giá trị cấu hình này từ component wrapper ngoài vào component dùng chung `ProcessSectionShared` và truyền tiếp vào `RenderCircular`.
  * Thay thế nhãn CTA cứng từ `badgeText` sang `circularCtaText` và thuộc tính `href` của thẻ neo từ `#contact` sang `circularCtaLink`.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Thay vì bắt người quản trị phải điền thông tin của nút bấm kêu gọi hành động vào ô "Nhãn dán" (Badge) vốn dùng để gắn thẻ nổi bật ở tiêu đề, và bắt họ phải nhớ hoặc copy tay đường dẫn trang liên hệ (vd: `/lien-he`), chúng ta thiết lập cho họ một ô riêng tên là "Nút liên hệ" cùng một nút bấm "Gợi ý". Khi bấm vào nút "Gợi ý", một danh sách các đường dẫn có sẵn trong trang web hiện ra (như Trang chủ, Sản phẩm, Liên hệ, Bài viết...) để họ chỉ việc click chọn.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Component input gợi ý link:** Component `QuickRouteInput` đã được phát triển sẵn tại `app/admin/home-components/_shared/components/QuickRouteInput.tsx`, đã hỗ trợ đầy đủ picker modal chọn route động.
* **Component form của Process:** `ProcessForm.tsx` quản lý danh sách bước nhưng chưa có phần cấu hình nâng cao riêng cho các layout cụ thể.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Vấn đề:** Bố cục Circular bị phụ thuộc vào badge để hiển thị text nút và bị khóa cứng link tại `#contact`, không cho cấu hình linh hoạt.
* **Giải pháp:** Tách biệt cấu hình CTA thành các trường độc lập trong schema động của Process và tích hợp input chọn link gợi ý.

---

# IV. Proposal (Đề xuất)
* **Bước 1:** Cập nhật tệp [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_types/index.ts) để thêm `circularCtaText` và `circularCtaLink` vào interface `ProcessConfig`.
* **Bước 2:** Cập nhật tệp [normalize.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_lib/normalize.ts) để:
  * Thêm `circularCtaText` và `circularCtaLink` vào quá trình chuẩn hóa `normalizeProcessConfig`.
* **Bước 3:** Cập nhật component [ProcessForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessForm.tsx):
  * Nhận thêm `style`, `circularCtaText`, `circularCtaLink`, `onChangeCircularCtaText`, `onChangeCircularCtaLink` làm props.
  * Hiển thị tiểu mục "Cấu hình Circular" khi `style === 'circular'`.
  * Sử dụng `QuickRouteInput` cho trường nhập link.
* **Bước 4:** Cập nhật trang Edit [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/%5Bid%5D/edit/page.tsx) và trang Create [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/process/page.tsx) để lưu trữ và truyền props mới vào `ProcessForm` và `ProcessPreview`.
* **Bước 5:** Cập nhật [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx) và [ProcessRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/sections/ProcessRuntimeSection.tsx) để truyền và nhận hai trường dữ liệu này ở runtime nhằm thay thế cho logic badge cũ.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
1. `Sửa:` [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_types/index.ts)
   * Vai trò: Khai báo kiểu dữ liệu cấu hình cho Process.
   * Thay đổi: Bổ sung định nghĩa `circularCtaText` và `circularCtaLink`.
2. `Sửa:` [normalize.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_lib/normalize.ts)
   * Vai trò: Xử lý và chuẩn hóa dữ liệu từ database.
   * Thay đổi: Thêm logic chuẩn hóa `circularCtaText` và `circularCtaLink`.
3. `Sửa:` [ProcessForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessForm.tsx)
   * Vai trò: Form nhập dữ liệu cấu hình Process.
   * Thay đổi: Thêm một tiểu mục cấu hình CTA Circular sử dụng `QuickRouteInput`.
4. `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/%5Bid%5D/edit/page.tsx)
   * Vai trò: Trang chỉnh sửa Process trong admin.
   * Thay đổi: Quản lý state cho `circularCtaText`, `circularCtaLink` và truyền vào các component con.
5. `Sửa:` [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/process/page.tsx)
   * Vai trò: Trang tạo mới Process trong admin.
   * Thay đổi: Đồng bộ state `circularCtaText`, `circularCtaLink` tương tự trang Edit.
6. `Sửa:` [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
   * Vai trò: Giao diện hiển thị Process dùng chung.
   * Thay đổi: Nhận các props mới và áp dụng chúng vào thẻ neo CTA trong `RenderCircular`.
7. `Sửa:` [ProcessRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/sections/ProcessRuntimeSection.tsx)
   * Vai trò: Component runtime ngoài client thực tế.
   * Thay đổi: Trích xuất `circularCtaText`, `circularCtaLink` từ config DB và truyền vào component dùng chung.

---

# VI. Execution Preview (Xem trước thực thi)
1. Sửa tệp kiểu dữ liệu `_types/index.ts`.
2. Sửa tệp normalize `_lib/normalize.ts`.
3. Sửa form `ProcessForm.tsx` để tích hợp `QuickRouteInput`.
4. Sửa trang Edit `process/[id]/edit/page.tsx` và trang Create `create/process/page.tsx` để truyền các props mới.
5. Sửa `ProcessSectionShared.tsx` để hiển thị nhãn và link động.
6. Sửa `ProcessRuntimeSection.tsx` để đồng bộ runtime.
7. Chạy `bunx tsc --noEmit` để kiểm tra lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh:** Chạy `bunx tsc --noEmit` xác minh compile không có lỗi TypeScript.
* **Kiểm tra trực quan trong Admin:** Chọn layout Circular, nhập nhãn nút CTA và click chọn link "Gợi ý" để kiểm tra xem modal hiển thị đúng và điền link chuẩn xác hay không.
* **Kiểm tra ở trang chủ:** Kiểm tra nút CTA hiển thị đúng nhãn và chuyển hướng đúng đường dẫn cấu hình.

---

# VIII. Todo
* [x] Cập nhật kiểu cấu hình `ProcessConfig` trong [_types/index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_types/index.ts).
* [x] Cập nhật logic chuẩn hóa trong [_lib/normalize.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_lib/normalize.ts).
* [x] Thêm section cấu hình Circular sử dụng `QuickRouteInput` trong [ProcessForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessForm.tsx).
* [x] Cập nhật trang Edit [process/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/%5Bid%5D/edit/page.tsx).
* [x] Cập nhật trang Create [create/process/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/process/page.tsx).
* [x] Cập nhật component render [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [x] Cập nhật component runtime [ProcessRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/sections/ProcessRuntimeSection.tsx).
* [x] Kiểm tra lỗi biên dịch TypeScript tĩnh (`bunx tsc --noEmit`).
* [x] Phát âm thanh thông báo hoàn thành.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang admin hiển thị thêm tiểu mục "Cấu hình Circular" khi chọn kiểu bố cục Circular.
* Ô nhập link gợi ý hoạt động mượt mà, hỗ trợ picker modal chọn link.
* Sơ đồ Circular hiển thị text và link động cấu hình từ admin, không lấy badge làm text và link không bị hardcode.
* TypeScript biên dịch thành công.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro về cơ sở dữ liệu vì trường cấu hình được lưu trong trường JSON `config` kiểu `any`. 
* **Hoàn tác:** Sử dụng `git checkout` để rollback các tệp đã sửa đổi.

---

# XI. Out of Scope (Ngoài phạm vi)
* Tích hợp picker link gợi ý cho các component khác không thuộc cấu phần Process.

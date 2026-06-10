# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Admin có 30 loại Home Component khác nhau, mỗi loại lại có khoảng 6-10 layout (style). Khi admin thiết kế trang, họ chỉ sử dụng một số ít loại component và layout nhất định. Những loại component và layout còn lại không dùng (gọi là "layout thừa" và "component thừa") vẫn hiển thị trong trang quản trị, làm giao diện cồng kềnh và khó chọn lựa.
* **Giải pháp**: 
  1. Thêm 2 nút bấm trên giao diện cấu hình hệ thống: một nút để **"Ẩn toàn bộ layout và type chưa dùng"** (quét DB tìm cái nào admin không chọn thì ẩn đi), và một nút **"Hiện toàn bộ layout và type"** để hoàn tác.
  2. Nâng cấp bộ Preview trong trang chỉnh sửa/tạo mới để tự động lọc và không hiển thị các layout đã bị ẩn này.
* **Hạn chế rủi ro**: Nhận diện thông minh component type từ URL trình duyệt để tự động ẩn layout tương ứng mà không cần sửa đổi hàng loạt 50 file preview khác nhau.

## 2. Elaboration & Self-Explanation
Quy trình hoạt động cụ thể:
* **Ẩn layout & type chưa dùng**:
  * Backend quét toàn bộ các bản ghi trong bảng `homeComponents`.
  * Những loại component (`type`) nào không có bản ghi nào thì bị đưa vào danh sách `hiddenTypes`.
  * Với những loại component đang được sử dụng, backend kiểm tra trường `config.style` để biết style nào đang được chọn. Những style khả dụng khác của loại component đó mà không có bản ghi nào chọn sẽ được đưa vào danh sách `hiddenLayouts` dưới định dạng `Type:style` (ví dụ: `Hero:bento`).
  * Lưu danh sách này vào bảng `settings` trong Convex DB.
* **Hiện lại tất cả**:
  * Xóa sạch danh sách `hiddenTypes` và `hiddenLayouts` trong `settings`, trả lại trạng thái hiển thị đầy đủ ban đầu.
* **Tự động lọc ở bộ Preview**:
  * Khi hiển thị thanh chọn style trong component `PreviewWrapper`, hệ thống sẽ đọc `hiddenLayouts` từ cài đặt hệ thống.
  * Tự động lấy component type bằng cách phân tích URL hiện tại (ví dụ: `/admin/home-components/create/hero` $\rightarrow$ `Hero`).
  * Ẩn các style nằm trong danh sách đen `hiddenLayouts` của type đó, giúp admin chỉ nhìn thấy những layout được cho phép sử dụng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Dự án chỉ dùng component `Hero` với layout `slider` và component `About` với layout `classic`.
  * Khi ấn nút **"Ẩn layout & type chưa dùng"**:
    * Các component khác như `Marquee`, `Faq`, `Timeline`... (không được tạo bản ghi nào) sẽ bị ẩn khỏi trang tạo mới.
    * Riêng component `Hero`, các layout khác như `fade`, `bento`, `triple`... (không được bản ghi Hero nào dùng) sẽ bị ẩn khỏi thanh chọn style. Chỉ còn layout `slider` hiển thị.
    * Riêng component `About`, các layout khác như `bento`, `minimal`... sẽ bị ẩn. Chỉ còn layout `classic` hiển thị.
  * Khi ấn nút **"Hiện toàn bộ"**, tất cả component và layout lại hiển thị đầy đủ như cũ.
* **Ẩn dụ đời thường**: Giống như việc dọn dẹp tủ đồ gia đình. Ta xếp cất những bộ quần áo mùa đông không ai mặc vào kho để tủ đồ hàng ngày gọn gàng dễ lấy. Khi cần thiết (sang mùa mới), ta lại mở kho mang toàn bộ quần áo ra ngoài treo lại bình thường.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Hiện trạng**: 
  * Cấu hình hệ thống `homeComponentSystemConfig` hiện tại mới chỉ hỗ trợ ẩn component type (`hiddenTypes`).
  * Dữ liệu style đang được chọn của mỗi component được lưu tại trường `config.style` dưới dạng chuỗi.
  * Các preview component sử dụng component dùng chung `PreviewWrapper` để render thanh tab chọn các style.
* **Giải pháp tối ưu**:
  * Thêm cấu hình `hiddenLayouts` vào backend Convex.
  * Viết thêm các mutation Convex để thực hiện quét và tự động ẩn/hiện.
  * Nâng cấp `PreviewWrapper` để tự nhận diện component type từ URL thông qua `usePathname` và lọc các style bị ẩn tương ứng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Yêu cầu nâng cấp**: Tính năng ẩn type chưa dùng hiện tại hoạt động tốt nhưng chưa đủ, vì một type có rất nhiều layout (style) khác nhau và admin thường chỉ chọn 1 style cố định cho mỗi dự án. Các style còn lại là thừa thãi và cần được ẩn đi để tối ưu hóa trải nghiệm quản trị.
* **Giả thuyết đối chứng**: Nếu chúng ta truyền prop `type` thủ công vào từng component gọi `PreviewWrapper`, ta sẽ phải chỉnh sửa khoảng 50 file component khác nhau, dẫn tới rủi ro cao về xung đột git và tốn thời gian. Giải pháp phân tích URL tự động thông qua `usePathname` trong `PreviewWrapper` là tối ưu, an toàn và chỉ cần sửa đúng 1 tệp tin.

---

# IV. Proposal (Đề xuất)

### 1. Định nghĩa danh sách layout tĩnh của 31 component type ở Backend Convex
Tạo tệp tin mới [componentLayouts.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/componentLayouts.ts) chứa bản đồ ánh xạ tĩnh từ `type` sang danh sách các `style` tương ứng. Điều này giúp backend Convex có thể chạy quét độc lập mà không phụ thuộc vào code React phía client.

### 2. Cấu hình schema và API Convex mới
Cập nhật [homeComponentSystemConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/homeComponentSystemConfig.ts):
* Thêm hằng số `const HIDDEN_LAYOUTS_KEY = "create_hidden_layouts";`.
* Cập nhật query `getConfig` để lấy thêm `hiddenLayouts` từ DB và bổ sung schema check `returns` tương ứng.
* Thêm mutation `hideUnusedLayoutsAndTypes`:
  * Quét toàn bộ `homeComponents` trong DB để gom danh sách `type` và `config.style` đang dùng.
  * Xác định các `type` chưa dùng $\rightarrow$ đưa vào `hiddenTypes`.
  * Xác định các `layout` của từng type chưa dùng $\rightarrow$ đưa vào `hiddenLayouts` dưới dạng `Type:style`.
  * Lưu cả hai vào DB.
* Thêm mutation `showAllLayoutsAndTypes`:
  * Xóa sạch `hiddenTypes` và `hiddenLayouts` (set về mảng rỗng `[]`).

### 3. Nâng cấp trang cấu hình hệ thống
Cập nhật [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/home-components/page.tsx):
* Thêm 2 nút bấm tương ứng:
  * Nút "Ẩn layout & type chưa dùng" gọi mutation `hideUnusedLayoutsAndTypes`.
  * Nút "Hiện toàn bộ" gọi mutation `showAllLayoutsAndTypes`.
* Hiển thị số lượng layout đang bị ẩn trên giao diện để người dùng dễ theo dõi.

### 4. Nâng cấp PreviewWrapper để tự động lọc style
Cập nhật [PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx):
* Sử dụng `usePathname` từ `next/navigation` để lấy URL hiện tại.
* Dùng `COMPONENT_TYPES` để so sánh và tự động nhận diện `type` của component hiện tại từ URL.
* Gọi query `getConfig` để lấy `hiddenLayouts`.
* Lọc bỏ những style bị ẩn khỏi mảng `styles` trước khi hiển thị các tab chọn style cho admin.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
1. [convex/homeComponentSystemConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/homeComponentSystemConfig.ts): Cấu hình query `getConfig` trả về `hiddenLayouts`, thêm các mutation `hideUnusedLayoutsAndTypes` và `showAllLayoutsAndTypes`.
2. [app/system/home-components/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/home-components/page.tsx): Thêm giao diện 2 nút bấm ẩn/hiện layout và type chưa dùng.
3. [app/admin/home-components/_shared/components/PreviewWrapper.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/components/PreviewWrapper.tsx): Tự động nhận diện type từ URL và lọc các style/layout bị ẩn.

### Thêm mới:
1. [convex/lib/componentLayouts.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/componentLayouts.ts): Định nghĩa tĩnh danh sách layout của tất cả các component type cho backend Convex.

---

# VI. Execution Preview (Xem trước thực thi)

1. Tạo tệp map tĩnh `convex/lib/componentLayouts.ts`.
2. Chỉnh sửa `convex/homeComponentSystemConfig.ts` để cập nhật query `getConfig` và thêm các mutation mới.
3. Chỉnh sửa trang cấu hình hệ thống `app/system/home-components/page.tsx` để thêm 2 nút ẩn/hiện layout thừa.
4. Chỉnh sửa component `PreviewWrapper.tsx` để tự động lọc style bị ẩn dựa trên URL.
5. Tiến hành typecheck và kiểm tra hoạt động.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static Check)
* Chạy biên dịch TypeScript toàn dự án:
  `bunx tsc --noEmit`
  *(Giới hạn context hiển thị dòng đầu bằng pipe qua Select-Object)*

### Kiểm tra thủ công (Manual Verification)
1. Truy cập trang `http://localhost:3000/system/home-components`.
2. Bấm nút **"Ẩn layout & type chưa dùng"**. Kiểm tra xem thông báo Toast có hiển thị số lượng type và layout đã ẩn thành công không.
3. Kiểm tra xem các type và layout chưa dùng có bị ẩn đi thật không (truy cập thử trang tạo component mới và xem danh sách style ở Preview).
4. Quay lại trang cấu hình hệ thống bấm nút **"Hiện toàn bộ layout & type"** xem mọi thứ có được phục hồi đầy đủ hay không.

---

# VIII. Todo

- [ ] Tạo tệp map tĩnh layout `convex/lib/componentLayouts.ts`
- [ ] Cập nhật API Convex trong `convex/homeComponentSystemConfig.ts`
- [ ] Nâng cấp giao diện quản lý hệ thống trong `app/system/home-components/page.tsx`
- [ ] Cập nhật component `PreviewWrapper.tsx` để tự động lọc các style bị ẩn
- [ ] Chạy biên dịch TypeScript để kiểm tra lỗi type

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Giao diện cấu hình hệ thống có thêm 2 nút bấm tương ứng với hành động ẩn tự động layout + type chưa dùng và hiện lại toàn bộ.
2. Khi ẩn layout chưa dùng, các tab chọn style trong trang Preview của component đó sẽ lọc bỏ các layout bị ẩn.
3. Không làm lỗi biên dịch TypeScript.
4. Không làm ảnh hưởng đến cấu hình của các component đang được sử dụng thực tế.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thấp, vì các mutation chỉ thay đổi cấu hình hiển thị ở mức hệ thống (`settings`), không chỉnh sửa hay xóa dữ liệu thực tế của các bản ghi `homeComponents`.
* **Rollback**: Có thể gọi mutation `showAllLayoutsAndTypes` để xóa sạch cấu hình ẩn, đưa hệ thống về trạng thái ban đầu ngay lập tức. Hoặc sử dụng `git checkout` để hoàn tác mã nguồn.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không chỉnh sửa code render của từng layout cụ thể ở frontend.
* Không thay đổi schema hay cấu trúc dữ liệu của các bản ghi `homeComponents` thực tế.

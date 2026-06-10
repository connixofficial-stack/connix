# I. Primer

## 1. TL;DR kiểu Feynman
Lỗi xảy ra vì chúng ta đặt bộ điều khiển kéo thả `<DndContext>` trực tiếp bên trong thẻ `<table>` (được bọc trong component `<Table>`). Theo chuẩn HTML, thẻ `<table>` chỉ được chứa một số thẻ con hợp lệ như `<thead>`, `<tbody>`, `<tr>`... nhưng `<DndContext>` lại tự sinh ra một thẻ ẩn `<div>` để hỗ trợ thiết bị đọc màn hình (accessibility). Khi trình duyệt thấy thẻ `<div>` nằm trực tiếp dưới `<table>`, nó sẽ báo lỗi cấu trúc HTML không hợp lệ và gây ra lỗi Hydration (đồng bộ giao diện giữa máy chủ và trình duyệt bị lệch). Giải pháp rất đơn giản: di chuyển `<DndContext>` ra bên ngoài bọc toàn bộ component `<Table>`, giữ nguyên logic kéo thả nhưng đảm bảo thẻ `<div>` ẩn được render ngoài thẻ `<table>`.

## 2. Elaboration & Self-Explanation
Thư viện `@dnd-kit/core` cung cấp component `<DndContext>` để quản lý trạng thái kéo thả. Mặc định, component này sẽ render ra các thẻ ẩn (`div` hoặc `span`) phục vụ việc thông báo trạng thái kéo thả cho người khiếm thị sử dụng screen reader. 
Trong file `app/admin/product-types/page.tsx`, `<DndContext>` được đặt giữa `<TableHeader>` và `<TableBody>`, tức là trực tiếp làm con của component `<Table>`. Component `<Table>` này render ra thẻ `<table>` thật của HTML. 
Trình duyệt web phân tích cú pháp HTML rất nghiêm ngặt đối với thẻ `<table>`. Việc xuất hiện thẻ `<div>` trực tiếp làm con của `<table>` là vi phạm chuẩn cấu trúc DOM.
Bằng cách di chuyển `<DndContext>` ra ngoài bọc thẻ `<Table>`, thẻ `<div>` ẩn hỗ trợ accessibility của `@dnd-kit` sẽ được xuất hiện ngoài thẻ `<table>` (như một thẻ anh em của `<table>`), giải quyết triệt để lỗi cấu trúc HTML và lỗi Hydration.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng thẻ `<table>` giống như một cái tủ hồ sơ có cấu trúc ngăn nắp: chỉ được phép chứa các ngăn kéo (`<tbody>`, `<thead>`). Bạn không thể nhét trực tiếp một món đồ chơi (`<div>`) vào giữa tủ mà không thông qua ngăn kéo nào.
* **Cấu trúc lỗi hiện tại**:
```html
<table>
  <thead>...</thead>
  <!-- DndContext nằm ở đây -->
  <div style="display:none">DndDescribedBy-0</div> <!-- Lỗi: div nằm trực tiếp dưới table! -->
  <tbody>...</tbody>
</table>
```
* **Cấu trúc đúng sau khi sửa**:
```html
<!-- DndContext bọc ngoài cùng -->
<div style="display:none">DndDescribedBy-0</div> <!-- Hợp lệ: div nằm ngoài table -->
<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>
```

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng tôi đã kiểm tra toàn bộ các file trong thư mục `app/admin` có sử dụng `DndContext`. Kết quả như sau:
* `app/admin/product-types/page.tsx`: **Lỗi** - `DndContext` nằm trong `Table`, giữa `TableHeader` và `TableBody`.
* `app/admin/attribute-groups/[id]/edit/page.tsx`: **Hợp lệ** - `DndContext` bọc ngoài một thẻ `div` thường chứa danh sách các hàng.
* `app/admin/home-components/page.tsx`: **Hợp lệ** - `DndContext` bọc bên ngoài component `Table`.
* `app/admin/home-components/snapshots/[snapshotId]/home-components/page.tsx`: **Hợp lệ** - `DndContext` bọc bên ngoài component `Table`.
* `app/admin/kanban/page.tsx`: **Hợp lệ** - Dùng thẻ `div` thường cho layout Kanban, không dùng Table.
* `app/admin/product-options/[id]/values/page.tsx`: **Hợp lệ** - `DndContext` bọc bên ngoài component `Table`.
* `app/admin/product-options/page.tsx`: **Hợp lệ** - `DndContext` bọc bên ngoài component `Table`.
* `app/admin/products/[id]/variants/page.tsx`: **Hợp lệ** - `DndContext` bọc bên ngoài component `Table`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Việc lồng ghép component `<DndContext>` trực tiếp bên trong component `<Table>` ở file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/page.tsx) tạo ra cấu trúc DOM không hợp lệ: `<table>` -> `<div>` (được sinh ra bởi cơ chế hỗ trợ Accessibility của `@dnd-kit`).
* **Độ tin cậy nguyên nhân gốc**: High (100%). Đây là lỗi Hydration kinh điển khi dùng các thư viện kéo thả kết hợp với bảng dữ liệu HTML mà không bọc đúng vị trí.
* **Giả thuyết đối chứng**: Liệu lỗi có phải do `SortableContext`? `SortableContext` không tự render ra thẻ HTML nào mà chỉ dùng React Context Provider, do đó nó không gây lỗi. Chỉ có `DndContext` render ra thẻ ẩn `div`. Di chuyển `DndContext` ra ngoài chắc chắn sửa được lỗi.

# IV. Proposal (Đề xuất)
Điều chỉnh cấu trúc JSX trong file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/page.tsx) để `<DndContext>` bọc ngoài `<Table>` thay vì nằm bên trong.

# V. Files Impacted (Tệp bị ảnh hưởng)
* Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/page.tsx)
  * Vai trò hiện tại: Trang quản lý danh sách kiểu sản phẩm (Product Types) trong Admin.
  * Thay đổi: Di chuyển `<DndContext>` ra bên ngoài component `<Table>`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/page.tsx) để xác định chính xác các dòng mở/đóng thẻ `<Table>` và `<DndContext>`.
2. Sử dụng công cụ chỉnh sửa file để di chuyển vị trí mở thẻ `<DndContext>` lên trước `<Table>` và đóng thẻ `</DndContext>` xuống sau `</Table>`.
3. Kiểm tra tĩnh TypeScript lỗi biên dịch bằng lệnh `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh bất kỳ lỗi cú pháp hoặc TypeScript nào.
* **Kiểm chứng Runtime (do Tester thực hiện)**:
  1. Truy cập trang `/admin/product-types` trên localhost.
  2. Mở F12 Console, kiểm tra xem còn xuất hiện lỗi Hydration / ` In HTML, <div> cannot be a child of <table>` hay không.
  3. Thử nghiệm tính năng kéo thả thay đổi vị trí các kiểu sản phẩm xem còn hoạt động bình thường hay không.

# VIII. Todo
- [ ] Chỉnh sửa file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/page.tsx) để di chuyển `DndContext` ra ngoài `Table`.
- [ ] Chạy `bunx tsc --noEmit` để xác nhận kiểu dữ liệu và cú pháp đúng.
- [ ] Commit thay đổi kèm tài liệu spec.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thẻ `<table>` được render hoàn chỉnh mà không chứa bất kỳ thẻ `<div>` nào trực tiếp bên trong cấu trúc của nó (loại trừ các cell `<td>`/`<th>` chứa div hợp lệ).
* Không còn lỗi hydration console error trên trang `/admin/product-types`.
* Tính năng sắp xếp kéo thả các dòng kiểu sản phẩm vẫn hoạt động bình thường, lưu thứ tự vào DB thành công.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro về mặt logic dữ liệu vì đây chỉ là thay đổi cấu trúc bọc giao diện JSX.
* **Hoàn tác**: Sử dụng `git checkout app/admin/product-types/page.tsx` để rollback nếu có bất cứ lỗi hiển thị nào không lường trước.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic sắp xếp kéo thả hoặc giao diện hiển thị của bảng.
* Sửa đổi các file khác không bị lỗi.

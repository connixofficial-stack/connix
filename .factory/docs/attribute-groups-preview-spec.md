# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi tạo hoặc chỉnh sửa nhóm thuộc tính, người quản trị khó hình dung ra "Kiểu lọc" (Single/Multiple) và "Kiểu hiển thị" (Select, Buttons, Color, Radio) sẽ xuất hiện thế nào trên giao diện bộ lọc ngoài trang chủ.
* **Giải pháp:** 
  1. Thiết kế lại bố cục trang `create` và `edit` thành dạng Grid 2 cột trên màn hình lớn (Desktop).
  2. Cột bên trái giữ nguyên Form điền thông tin nhóm thuộc tính.
  3. Cột bên phải thêm một Card **"Xem trước giao diện bộ lọc (Live Preview)"** động. Card này sẽ phản hồi lập tức theo các lựa chọn: Kiểu hiển thị, Kiểu lọc, Icon đại diện và Màu sắc icon mà người dùng đang cấu hình trên form.

## 2. Elaboration & Self-Explanation
Live Preview sẽ giả lập một tập hợp các giá trị thuộc tính mẫu (ví dụ: S, M, L khi chọn hiển thị nút; Đỏ, Trắng, Vàng khi chọn màu sắc).
Các trạng thái tương tác của Preview:
- **Kiểu hiển thị Dropdown (Select):** Giả lập một dropdown cho phép click mở và chọn một giá trị.
- **Kiểu hiển thị Nút bấm (Buttons):** Giả lập các button badge cạnh nhau. Người dùng có thể click chọn. Nếu là Kiểu lọc "Một lựa chọn (Single)", click nút này sẽ bỏ chọn nút kia. Nếu là "Nhiều lựa chọn (Multiple)", click có thể chọn nhiều nút đồng thời.
- **Kiểu hiển thị Màu sắc (Color):** Giả lập 3 vòng tròn màu sắc (Đỏ, Trắng, Cam) cho phép click chọn, có viền hoạt ảnh active.
- **Kiểu hiển thị Radio:** Giả lập các nút radio tròn kèm label.
Live Preview cũng đính kèm hiển thị Icon đại diện đã chọn với Màu sắc icon tương ứng để admin hình dung chuẩn xác sự kết hợp giữa biểu tượng và kiểu chọn.

## 3. Concrete Examples & Analogies
* **Ví dụ:** 
  * Khi chọn Kiểu hiển thị là **Màu sắc (Color/Hình ảnh)** và Kiểu lọc là **Nhiều lựa chọn (Multiple)**: Box xem trước bên phải sẽ lập tức hiển thị 3 nút tròn màu sắc đẹp đẽ kèm theo ghi chú: "Bạn có thể click chọn nhiều màu sắc cùng lúc". Khi admin click thử vào các chấm tròn màu, hệ thống sẽ mô phỏng trạng thái active thật sự (có vòng border cam đậm bo ngoài).
  * Điều này tương tự như khi bạn đi mua xe ô tô online, khi bạn đổi màu sơn xe hoặc kiểu mâm bánh xe, ảnh 3D xem trước của xe lập tức cập nhật tương ứng, giúp bạn ra quyết định dễ dàng mà không cần phải đoán mò.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng tôi đã xác định hai file frontend chính cần bổ sung tính năng Preview là:
1. `app/admin/attribute-groups/create/page.tsx`
2. `app/admin/attribute-groups/[id]/edit/page.tsx`

Cả hai trang đều có chung tập hợp các state:
- `filterType` (single / multiple)
- `inputType` (select / buttons / color / radio)
- `iconName` (Ví dụ: Wine, Tag, v.v.)
- `iconColor` (Mã màu HEX như `#ea580c`)
- `name` (Tên nhóm thuộc tính)

Chúng ta có thể đóng gói phần Live Preview thành một component dùng chung đặt tại `app/admin/attribute-groups/_components/AttributeGroupPreview.tsx` hoặc một file dùng chung trong thư mục `_lib` hoặc viết trực tiếp/chia sẻ để đảm bảo tính KISS và DRY.
Để tối ưu và sạch sẽ nhất, ta sẽ tạo một file component dùng chung tại `app/admin/attribute-groups/_components/AttributeGroupPreview.tsx` để cả hai trang `create/page.tsx` và `edit/page.tsx` đều có thể import sử dụng dễ dàng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc:** Giao diện quản trị hiện tại chỉ có các thẻ select dạng text đơn thuần mà không có phản hồi trực quan, khiến admin mất công đoán mò cách hiển thị ở trang public hoặc phải lưu lại rồi ra ngoài site F5 để xem thử.
* **Độ tin cậy nguyên nhân gốc:** **High** (Xác minh từ ảnh chụp màn hình do người dùng cung cấp - các lựa chọn chỉ là dropdown text phẳng lặng).
* **Giả thuyết đối chứng:** Thêm live preview động mô phỏng chính xác hành vi tương tác (click chọn đơn/nhiều) sẽ giải quyết triệt để trải nghiệm mơ hồ này, nâng cao tính chuyên nghiệp của trang Admin.

---

# IV. Proposal (Đề xuất)
1. **Tạo component Preview dùng chung:**
   * File: `app/admin/attribute-groups/_components/AttributeGroupPreview.tsx`
   * Nhận vào các props: `name`, `filterType`, `inputType`, `iconName`, `iconColor`.
   * Chứa state nội bộ giả lập các giá trị mẫu và các giá trị đang được click chọn (selected terms).
   * Giả lập giao diện cho 4 kiểu `inputType` và hỗ trợ logic chọn đơn/nhiều của `filterType`.
2. **Cập nhật Layout Grid 2 cột ở Create & Edit:**
   * Sắp xếp layout: Bọc form và Preview trong một flexbox hoặc CSS Grid:
     `grid grid-cols-1 lg:grid-cols-12 gap-6`
     * Cột form chiếm 5/12 hoặc 6/12 cột.
     * Cột Preview chiếm 6/12 hoặc 7/12 cột.
   * Import và nhúng `AttributeGroupPreview` vào cột bên phải.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Thêm: [app/admin/attribute-groups/_components/AttributeGroupPreview.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/_components/AttributeGroupPreview.tsx)
* **Vai trò hiện tại:** Component xem trước trực quan (Live Preview).
* **Thay đổi:** Mới hoàn toàn. Giả lập hiển thị và tương tác của bộ lọc thuộc tính.

### Sửa: [app/admin/attribute-groups/create/page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/create/page.tsx)
* **Vai trò hiện tại:** Trang tạo mới Nhóm thuộc tính.
* **Thay đổi:** Chuyển đổi layout thành grid 2 cột, nhúng component `AttributeGroupPreview` ở cột phải.

### Sửa: [app/admin/attribute-groups/[id]/edit/page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/[id]/edit/page.tsx)
* **Vai trò hiện tại:** Trang chỉnh sửa Nhóm thuộc tính và quản lý giá trị con.
* **Thay đổi:** Chuyển đổi layout thành grid 2 cột ở phần cấu hình nhóm thuộc tính, nhúng component `AttributeGroupPreview` ở cột phải.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Tạo component Preview:** Triển khai code React chất lượng cao, thiết kế giao diện sang trọng cho `AttributeGroupPreview.tsx`.
2. **Cập nhật trang Create:** Tích hợp layout Grid 2 cột và nhúng Preview.
3. **Cập nhật trang Edit:** Tích hợp layout Grid 2 cột và nhúng Preview.
4. **Xác thực kiểu dữ liệu:** Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.
5. **Âm báo:** Chạy âm báo hoàn thành `Done, Sir.`

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **TypeScript Check:** Chạy `bunx tsc --noEmit` và kỳ vọng không có lỗi compile phát sinh ở các file thay đổi.
* **Kiểm tra trực quan:**
  1. Vào `/admin/attribute-groups/create`. Cột bên phải xuất hiện ô "Xem trước giao diện bộ lọc (Live Preview)".
  2. Thay đổi Kiểu hiển thị thành `Màu sắc`: Giao diện preview đổi sang các chấm tròn màu sắc. Click chọn đổi trạng thái bình thường.
  3. Thay đổi Kiểu lọc thành `Nhiều lựa chọn`: Click thử các button/chấm màu xem có chọn được nhiều cái đồng thời không.
  4. Đổi Icon và Màu sắc icon: Xem icon tiêu đề bộ lọc có cập nhật ngay lập tức không.
  5. Thực hiện tương tự tại trang `/edit`.

---

# VIII. Todo
- [ ] Thiết kế và tạo component `AttributeGroupPreview.tsx`.
- [ ] Chỉnh sửa layout và nhúng component preview vào `app/admin/attribute-groups/create/page.tsx`.
- [ ] Chỉnh sửa layout và nhúng component preview vào `app/admin/attribute-groups/[id]/edit/page.tsx`.
- [ ] Chạy `bunx tsc --noEmit` kiểm tra TypeScript.
- [ ] Phát âm báo hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Hỗ trợ Live Preview mượt mà, cập nhật tức thời (real-time) theo các lựa chọn trên form.
* Giao diện responsive tốt (trên mobile tự động dồn xuống dưới form chính, trên desktop chia 2 cột cân đối).
* Logic tương tác chọn đơn (Single) và chọn nhiều (Multiple) hoạt động chuẩn xác trên giao diện xem trước.
* Build TypeScript sạch lỗi.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không làm ảnh hưởng đến cơ sở dữ liệu Convex của nhóm thuộc tính hay các logic crud hiện có.

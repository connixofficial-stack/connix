# I. Primer

## 1. TL;DR kiểu Feynman
Admin không thể xem nội dung chi tiết của các thông báo đã gửi (ví dụ: thông báo đơn hàng mới) vì trang quản lý đang ẩn nút Sửa (Edit) và chặn không cho vào trang xem đối với các thông báo có trạng thái "Đã gửi" (`Sent`).
Để khắc phục:
- Chúng ta sẽ luôn hiển thị nút sửa/xem (biểu tượng bút chì) cho tất cả các thông báo trong danh sách.
- Khi người dùng bấm vào thông báo đã gửi, hệ thống vẫn cho phép vào trang chi tiết, nhưng toàn bộ các ô nhập liệu sẽ bị khóa lại (chế độ chỉ đọc - Read-only) để bảo vệ dữ liệu, đồng thời ẩn nút "Lưu thay đổi" và hiển thị một dòng thông báo nhỏ để admin biết họ đang xem chi tiết.

## 2. Elaboration & Self-Explanation
Hiện tại:
- Trong file `app/admin/notifications/page.tsx`, nút chỉnh sửa chỉ xuất hiện khi `notif.status !== 'Sent'`.
- Trong file `app/admin/notifications/[id]/edit/page.tsx`, nếu thông báo có trạng thái `'Sent'`, component sẽ trả về ngay lập tức một giao diện thông báo lỗi "Không thể chỉnh sửa thông báo đã gửi".

Giải pháp:
1. Sửa trang danh sách để luôn hiển thị nút Edit.
2. Sửa trang chỉnh sửa để giải phóng luồng chặn. Định nghĩa biến `isReadOnly = notificationData.status === 'Sent'`.
3. Trong giao diện trang chỉnh sửa:
   - Thêm banner thông báo: "Thông báo này đã được gửi. Bạn đang xem chi tiết ở chế độ chỉ đọc." khi `isReadOnly` là `true`.
   - Gán thuộc tính `disabled={isReadOnly}` cho tất cả các thẻ điều khiển (`Input`, `textarea`, `select`, `input[type=checkbox]`).
   - Ẩn nút "Lưu thay đổi" và hiển thị nút "Quay lại" thay cho nút "Hủy bỏ".

## 3. Concrete Examples & Analogies
- **Ví dụ**:
  - Admin vào danh sách thấy thông báo "Đơn hàng mới #ORD-20260530-7738" có trạng thái "Đã gửi". Admin bấm vào biểu tượng Edit.
  - Trang chuyển hướng sang `/admin/notifications/[id]/edit`. Admin thấy banner màu xanh dương thông báo chế độ chỉ đọc. Tất cả các ô Tiêu đề, Nội dung, Loại thông báo đều hiển thị đầy đủ thông tin nhưng có nền mờ và không gõ được chữ vào. Ở cuối trang chỉ có nút "Quay lại".
- **Analogy**: Nó giống như một hợp đồng đã được ký kết và đóng dấu (Đã gửi). Bạn không thể lấy bút tẩy xóa hay viết đè lên hợp đồng đó nữa (ReadOnly). Nhưng bạn vẫn phải được quyền mở tủ tài liệu ra để xem các điều khoản trong hợp đồng đó ghi gì (Xem chi tiết), thay vì bị bảo vệ cấm không cho mở tủ ra xem.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát**: 
  - Trang danh sách thông báo admin không hiển thị nút sửa cho thông báo đã gửi.
  - Trang chỉnh sửa thông báo block hoàn toàn thông báo có trạng thái `Sent` thay vì cho xem chi tiết.
- **Mức độ ảnh hưởng**: Admin không thể xem lại chi tiết nội dung của các thông báo hệ thống tự động sinh ra (như thông báo đơn đặt hàng).
- **Khả năng tái hiện**: 100%.
- **Tiêu chuẩn pass/fail**:
  - *Pass*: Luôn hiển thị nút Sửa/Xem ở trang danh sách. Trang sửa thông báo đã gửi hiển thị đầy đủ thông tin ở dạng khóa (disabled), ẩn nút lưu thay đổi.
  - *Fail*: Bấm vào xem thông báo đã gửi vẫn báo lỗi chặn, hoặc các trường thông tin không bị khóa làm admin có thể chỉnh sửa và bấm lưu gây lỗi.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**:
  - `app/admin/notifications/page.tsx` ẩn nút chuyển hướng bằng điều kiện `notif.status !== 'Sent'`.
  - `app/admin/notifications/[id]/edit/page.tsx` chặn render form bằng câu điều kiện `if (notificationData.status === 'Sent')` trả về thông báo lỗi ở dòng 86.

---

# IV. Proposal (Đề xuất)

1. **Cập nhật `app/admin/notifications/page.tsx`**:
   - Loại bỏ điều kiện `notif.status !== 'Sent' &&` quanh thẻ `<Link href={...}>` của nút Edit.
   - Thêm nhãn tooltip `title={notif.status === 'Sent' ? "Xem chi tiết" : "Chỉnh sửa"}` cho nút.
   - Ẩn nút xóa (thùng rác) đối với các thông báo đã gửi (`notif.status !== 'Sent'`) vì backend (`convex/notifications.ts`) cấm xóa thông báo đã gửi để giữ audit trail.
2. **Cập nhật `app/admin/notifications/[id]/edit/page.tsx`**:
   - Loại bỏ đoạn code chặn ở dòng 86-97.
   - Khởi tạo biến: `const isReadOnly = notificationData.status === 'Sent';`.
   - Thêm banner hiển thị chế độ chỉ đọc ở đầu thẻ `<Card>`.
   - Thêm thuộc tính `disabled={isReadOnly}` cho `Input`, `textarea`, `select`, `input[type=checkbox]`.
   - Điều chỉnh nút footer: Ẩn nút "Lưu thay đổi" nếu `isReadOnly` là `true`, và đổi text nút hủy bỏ thành "Quay lại".

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **[app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx)**:
  - *Sửa*: Cho phép hiển thị nút Edit đối với mọi thông báo.
- **[app/admin/notifications/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/[id]/edit/page.tsx)**:
  - *Sửa*: Gỡ bỏ điều kiện chặn render, tích hợp chế độ chỉ đọc (Read-only) khi trạng thái là `'Sent'`.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa đổi [app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx) để mở hiển thị nút Edit.
2. Chỉnh sửa [app/admin/notifications/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/[id]/edit/page.tsx) để hỗ trợ chế độ chỉ xem (ReadOnly).
3. Đảm bảo chạy typecheck kiểm tra tĩnh thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit`.
- **Kiểm tra thủ công**:
  - Truy cập `/admin/notifications`.
  - Kiểm tra xem thông báo đã gửi có hiện nút Edit không. Bấm vào nút đó.
  - Xác nhận trang chi tiết hiện thông tin đầy đủ, các ô nhập liệu bị khóa, không có nút Lưu thay đổi.
  - Bấm vào nút Edit của một thông báo nháp (`Draft`), xác nhận form cho phép sửa và lưu bình thường.

---

# VIII. Todo

- [ ] Sửa [app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx) để luôn hiển thị nút sửa/xem.
- [ ] Sửa [app/admin/notifications/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/[id]/edit/page.tsx) hỗ trợ chế độ xem chi tiết chỉ đọc cho thông báo đã gửi.
- [ ] Chạy check TypeScript tĩnh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả thông báo trong danh sách đều có nút hành động Edit/Xem chi tiết.
- Thông báo trạng thái `Sent` khi bấm vào sẽ mở trang chi tiết dạng chỉ đọc, không cho sửa, không cho submit.
- Thông báo trạng thái khác (`Draft`, `Scheduled`) vẫn cho phép chỉnh sửa bình thường.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Không có rủi ro lớn vì đây chỉ là thay đổi UI ở admin panel.
- **Rollback**: Dùng `git checkout` để hoàn tác các thay đổi trên 2 file.

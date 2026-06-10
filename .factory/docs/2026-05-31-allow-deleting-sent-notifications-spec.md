# I. Primer

## 1. TL;DR kiểu Feynman
Admin muốn có quyền xóa bất kỳ thông báo nào, kể cả các thông báo đã gửi đi (ví dụ: thông báo đơn hàng mới), nhưng hệ thống hiện tại đang chặn hành vi này ở cả giao diện frontend và nghiệp vụ backend (để giữ lịch sử).
Để sửa đổi theo yêu cầu:
- Chúng ta sẽ sửa backend để cho phép xóa tất cả thông báo, loại bỏ câu lệnh ngăn chặn thông báo "Đã gửi".
- Chúng ta sẽ khôi phục lại nút xóa (biểu tượng thùng rác) cho mọi thông báo trên trang danh sách admin.

## 2. Elaboration & Self-Explanation
Hiện tại:
- Trong file [notifications.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/notifications.ts) tại mutation `remove`, có một đoạn kiểm tra chặn xóa:
  ```typescript
  if (notif.status === "Sent") {
    throw new Error("Không thể xóa thông báo đã gửi");
  }
  ```
  Đoạn kiểm tra này được thiết kế trước đây để bảo vệ nhật ký thông báo (audit trail) nhưng gây bất tiện khi admin muốn dọn dẹp các thông báo rác hoặc cũ.
- Ở giao diện [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx), nút xóa bị ẩn đi đối với thông báo đã gửi.

Giải pháp:
1. Sửa backend: Xóa đoạn kiểm tra chặn `status === "Sent"` trong mutation `remove`. Khi thực hiện xóa, mutation vẫn gọi `updateNotificationStats` để giảm bộ đếm số lượng thông báo theo trạng thái, bao gồm cả trạng thái "Sent".
2. Sửa frontend: Khôi phục lại hiển thị nút xóa cho toàn bộ thông báo bất kể trạng thái.

## 3. Concrete Examples & Analogies
- **Ví dụ**:
  - Admin có thông báo đơn hàng mới đã gửi có trạng thái "Đã gửi". Admin bấm nút thùng rác đỏ bên cạnh dòng thông báo đó.
  - Một popup xác nhận hiện ra. Admin bấm "OK".
  - Thông báo được xóa thành công khỏi database, bộ đếm tổng số thông báo giảm đi 1, bộ đếm số thông báo "Đã gửi" giảm đi 1. Không có lỗi màu đỏ nào hiện lên ở console.
- **Analogy**: Nó giống như việc bạn được cấp quyền đốt các tờ hóa đơn cũ trong kho lưu trữ. Trước đây, thủ kho (backend) quy định "Hóa đơn đã xuất không được phép hủy" để lưu trữ đối chứng. Nhưng khi chủ doanh nghiệp yêu cầu "Dọn kho để lấy chỗ trống, cho phép hủy các hóa đơn này", thủ kho sẽ gỡ bỏ quy định cấm đó để cho phép tiêu hủy các giấy tờ này.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát**: Bấm xóa thông báo đã gửi bị báo lỗi từ phía server Convex. Giao diện cũng đang ẩn nút xóa đối với các thông báo này.
- **Mức độ ảnh hưởng**: Admin không thể dọn dẹp danh sách thông báo đã gửi.
- **Khả năng tái hiện**: Tái hiện ổn định 100%.
- **Tiêu chuẩn pass/fail**:
  - *Pass*: Cho phép xóa thành công thông báo đã gửi mà không ném lỗi server. Nút xóa hiển thị đầy đủ trên giao diện.
  - *Fail*: Xóa thông báo đã gửi vẫn bị chặn hoặc không hiển thị nút xóa trên danh sách.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**:
  - Backend mutation `notifications:remove` trong `convex/notifications.ts` ném lỗi chặn ở dòng 396-398.
  - Giao diện `app/admin/notifications/page.tsx` ẩn nút xóa thông qua điều kiện `notif.status !== 'Sent'`.

---

# IV. Proposal (Đề xuất)

1. **Cập nhật `convex/notifications.ts`**:
   - Trong mutation `remove`, xóa đoạn kiểm tra `if (notif.status === "Sent")`.
2. **Cập nhật `app/admin/notifications/page.tsx`**:
   - Loại bỏ điều kiện bọc `notif.status !== 'Sent' &&` quanh nút xóa (thùng rác), khôi phục hiển thị nút xóa cho tất cả thông báo.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **[convex/notifications.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/notifications.ts)**:
  - *Sửa*: Cho phép xóa thông báo có trạng thái `'Sent'`.
- **[app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx)**:
  - *Sửa*: Khôi phục hiển thị nút xóa cho mọi trạng thái thông báo.

---

# VI. Execution Preview (Xem trước thực thi)

1. Chỉnh sửa [convex/notifications.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/notifications.ts) để gỡ bỏ logic chặn xóa.
2. Chỉnh sửa [app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx) để khôi phục nút xóa.
3. Chạy TypeScript compiler để typecheck toàn dự án.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit`.
- **Kiểm tra thủ công**:
  - Truy cập danh sách thông báo admin.
  - Bấm xóa một thông báo có trạng thái "Đã gửi", xác nhận xóa thành công và không bị báo lỗi.

---

# VIII. Todo

- [ ] Sửa [convex/notifications.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/notifications.ts) gỡ bỏ điều kiện chặn xóa thông báo đã gửi.
- [ ] Sửa [app/admin/notifications/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/notifications/page.tsx) để khôi phục hiển thị nút xóa.
- [ ] Chạy check TypeScript tĩnh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả thông báo trong danh sách đều hiển thị nút xóa (thùng rác).
- Bấm xóa thông báo đã gửi thành công, không gặp lỗi server.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Không có rủi ro lớn. Lịch sử thông báo sẽ bị mất vĩnh viễn khi xóa khỏi DB, tuy nhiên đây là hành vi chủ đích của admin.
- **Rollback**: Dùng `git checkout` khôi phục lại các file.

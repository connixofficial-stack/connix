# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi quyền tải tài nguyên của khách hàng ở trạng thái "Đã thu hồi", nút "Thu hồi" bị tắt đi (disabled) và không có cách nào để Admin có thể kích hoạt lại quyền của khách hàng đó từ danh sách này.
* **Giải pháp**:
  1. Thêm một hàm xử lý (Mutation) mới ở Backend tên là `activateAccess` để đổi lại trạng thái `status` thành `active` cho một bản ghi quyền truy cập trong cơ sở dữ liệu.
  2. Ở Frontend, nếu trạng thái là "Đã thu hồi", chúng ta sẽ thay thế nút "Thu hồi" (màu xám bị tắt) bằng nút "Cấp lại" (màu xanh lá) cho phép Admin khôi phục lại quyền tải ngay lập tức.

## 2. Elaboration & Self-Explanation
* **Cơ chế cấp lại quyền (Re-grant/Activate)**: Khi Admin bấm nút "Cấp lại", hệ thống sẽ gọi mutation `activateAccess` với `accessId` tương ứng. Hàm này sẽ thay đổi trạng thái của bản ghi từ `revoked` quay về `active` và cập nhật trường `updatedAt` thành thời gian hiện tại.
* **Nâng cao trải nghiệm quản trị (UX)**:
  * Trực quan hóa nút thao tác: Khi có quyền -> Nút "Thu hồi". Khi đã thu hồi -> Nút "Cấp lại" màu xanh lá để thu hút hành động.
  * Hộp thoại xác nhận giúp ngăn ngừa lỗi click nhầm.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Tài khoản của khách hàng Trần Mạnh Hiếu hiện đang "Đã thu hồi". Nút "Thu hồi" trước kia bị xám màu nay được thay bằng nút "Cấp lại" màu xanh lá. Khi Admin bấm vào nút "Cấp lại", một popup hiện ra hỏi "Cấp lại quyền tải tài nguyên cho khách hàng này?". Admin chọn Đồng ý, trạng thái chuyển tức khắc thành "Đang có quyền" (màu xanh lá) và nút chuyển lại thành nút "Thu hồi".
* **Hình ảnh ẩn dụ**: Giống như việc bạn cấp một chiếc thẻ thành viên đã bị khóa tạm thời trở lại trạng thái hoạt động bình thường thay vì phải vứt chiếc thẻ đó đi làm lại thẻ mới từ đầu.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra tệp tin backend [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts): Chưa có mutation `activateAccess` để cập nhật trạng thái `status` thành `active`.
* Đã kiểm tra tệp tin frontend [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx) dòng 582-598: Đang render nút "Thu hồi" bị disabled cứng khi trạng thái là `revoked`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: High.
* **Nguyên nhân**: Thiết kế UI ban đầu thiếu nút chuyển đổi trạng thái hai chiều (Active <-> Revoked) cho bản ghi truy cập mà chỉ hỗ trợ một chiều thu hồi.
* **Giả thuyết đối chứng**: Việc thêm mutation `activateAccess` là an toàn vì nó chỉ cập nhật trạng thái của bản ghi liên kết có sẵn, không tạo thêm bản ghi trùng lặp trong DB.

# IV. Proposal (Đề xuất)
* **Bổ sung API Backend**:
  * Thêm mutation `activateAccess` trong [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts):
    ```typescript
    export const activateAccess = mutation({
      args: { accessId: v.id("resourceCustomers") },
      handler: async (ctx, args) => {
        const access = await ctx.db.get(args.accessId);
        if (!access) return null;
        await ctx.db.patch(args.accessId, { status: "active", updatedAt: Date.now() });
        return null;
      },
      returns: v.null(),
    });
    ```
* **Bổ sung UI Frontend**:
  * Import mutation `activateAccess` trong [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx).
  * Định nghĩa state `activatingAccessId` và hàm `handleActivateAccess(accessId)`.
  * Cập nhật UI cột "Hành động" bằng toán tử ba ngôi để hiển thị nút "Thu hồi" hoặc nút "Cấp lại" tùy thuộc vào trạng thái `item.status`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* `Thêm logic`: [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)
  * Khai báo mutation `activateAccess` ở cuối tệp.
* `Sửa`: [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
  * Tích hợp mutation `activateAccess`, viết hàm `handleActivateAccess` và cập nhật nút trong TableCell cột Hành động.

# VI. Execution Preview (Xem trước thực thi)
1. Bổ sung mutation `activateAccess` vào backend.
2. Khai báo mutation, thêm state `activatingAccessId` và hàm `handleActivateAccess` ở frontend.
3. Sửa cấu trúc render của cột hành động trong bảng danh sách khách hàng.
4. Chạy kiểm tra TypeScript và Oxlint toàn bộ dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kế hoạch kiểm chứng**:
  * Chạy `bunx tsc --noEmit` toàn dự án.
  * Bàn giao để kiểm tra trực quan trên trình duyệt (Thử thu hồi quyền một tài khoản rồi cấp lại để xem sự thay đổi trạng thái).

# VIII. Todo
* [ ] Viết mutation `activateAccess` vào [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)
* [ ] Tích hợp mutation và viết hàm `handleActivateAccess` trong [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
* [ ] Cập nhật UI cột hành động để hiển thị nút "Cấp lại" khi trạng thái là `revoked` trong [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
* [ ] Chạy kiểm tra compiler TypeScript toàn dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trong danh sách khách đã mua/tải tài nguyên, nếu trạng thái là "Đã thu hồi", nút "Thu hồi" sẽ đổi thành nút "Cấp lại" có chữ màu xanh lá.
* Khi click "Cấp lại" và xác nhận, trạng thái đổi thành "Đang có quyền" (màu xanh lá) và nút đổi lại thành "Thu hồi".
* Nút "Xóa" màu đỏ vẫn hiển thị bên cạnh bình thường.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro, đây chỉ là thay đổi trạng thái của bản ghi trung gian.
* **Hoàn tác**: Sử dụng Git revert để khôi phục trạng thái cũ.

# XI. Out of Scope (Ngoài phạm vi)
* Tự động gửi email thông báo cho khách hàng khi cấp lại quyền.

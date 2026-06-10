# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại trong trang chỉnh sửa tài nguyên (`/admin/resources/[id]/edit`), ở tab "Khách đã mua/tải", chúng ta chỉ có duy nhất một hành động là "Thu hồi" quyền truy cập. Khi đã thu hồi, bản ghi của khách hàng vẫn hiển thị mãi mãi ở đó dưới trạng thái "Đã thu hồi" mà không cách nào xóa đi được.
* **Giải pháp**: 
  1. Chúng ta sẽ tạo thêm một hàm xử lý (Mutation) mới ở Backend tên là `removeAccess` để xóa hoàn toàn một bản ghi quyền truy cập trong cơ sở dữ liệu Convex.
  2. Ở Frontend, bên cạnh nút "Thu hồi" (màu xám), chúng ta sẽ thêm một nút "Xóa" (màu đỏ) hoạt động trong mọi trạng thái của bản ghi.

## 2. Elaboration & Self-Explanation
* **Cơ chế thu hồi (Revoke)**: Khi bấm "Thu hồi", chúng ta chỉ thay đổi trạng thái của bản ghi `resourceCustomers` thành `revoked` (Đã thu hồi). Cách này giúp giữ lại lịch sử rằng khách hàng này từng có quyền truy cập nhưng hiện đã bị tắt.
* **Cơ chế xóa hoàn toàn (Delete/Remove)**: Khác với thu hồi, hành động xóa sẽ xóa hẳn dòng dữ liệu đó ra khỏi bảng `resourceCustomers`. Việc này giúp làm sạch danh sách khách hàng của tài nguyên, đặc biệt khi quản trị viên cấp quyền nhầm hoặc muốn dọn dẹp các bản ghi rác.
* **Thay đổi luồng UI**:
  * Thêm nút "Xóa" với biểu tượng thùng rác hoặc nhãn văn bản nổi bật màu đỏ.
  * Khi bấm, hệ thống hiển thị hộp thoại xác nhận (`confirm`) trước khi gửi yêu cầu lên Convex DB để tránh người dùng click nhầm.
  * Nút "Xóa" luôn hoạt động kể cả khi quyền của khách hàng đã bị thu hồi.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Khách hàng Trần Mạnh Hiếu có quyền truy cập và đã bị thu hồi. Quản trị viên muốn dọn dẹp để danh sách chỉ hiển thị những người đang hoạt động hoặc không muốn lưu trữ thông tin của người này nữa. Quản trị viên bấm nút "Xóa" màu đỏ ở cột Hành động, xác nhận, và dòng dữ liệu của khách hàng đó biến mất hoàn toàn khỏi bảng.
* **Hình ảnh ẩn dụ**: Giống như việc bạn rút tên ai đó ra khỏi danh sách thành viên của một câu lạc bộ và xé bỏ luôn tờ giấy ghi danh của họ thay vì chỉ dùng bút gạch chéo tên họ.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra tệp tin backend [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts): Chỉ có mutation `revokeAccess` để đổi trạng thái, chưa có mutation `removeAccess` để xóa bản ghi `resourceCustomers`.
* Đã kiểm tra tệp tin frontend [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx): Cột "Hành động" (dòng 583-593) chỉ render một nút duy nhất để gọi hàm `handleRevokeAccess`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence**: High.
* **Nguyên nhân**: Tính năng quản lý quyền truy cập tài nguyên trước đây chỉ được thiết kế ở mức độ thu hồi quyền (soft disable) mà chưa bổ sung tính năng xóa cứng (hard delete) dữ liệu liên kết giữa khách hàng và tài nguyên.
* **Giả thuyết đối chứng**: Việc thêm tính năng xóa không ảnh hưởng đến đơn hàng hay thông tin khách hàng chính (bảng `customers`), chỉ xóa bản ghi trung gian `resourceCustomers`, do đó hoàn toàn an toàn và độc lập.

# IV. Proposal (Đề xuất)
* **Bổ sung API Backend**:
  * Thêm mutation `removeAccess` trong `convex/resources.ts`:
    ```typescript
    export const removeAccess = mutation({
      args: { accessId: v.id("resourceCustomers") },
      handler: async (ctx, args) => {
        const access = await ctx.db.get(args.accessId);
        if (!access) return null;
        await ctx.db.delete(args.accessId);
        return null;
      },
      returns: v.null(),
    });
    ```
* **Bổ sung UI Frontend**:
  * Nhập mutation mới `const removeAccess = useMutation(api.resources.removeAccess);` vào [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx).
  * Định nghĩa state và hàm `handleRemoveAccess(accessId)` có hiển thị xác nhận `confirm`.
  * Thêm nút "Xóa" vào cột "Hành động", đặt nằm cạnh nút "Thu hồi" trong thẻ `<TableCell>`. Sử dụng style `variant="ghost"` và màu đỏ `text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20` để tách biệt trực quan.

# V. Files Impacted (Tệp bị ảnh hưởng)
* `Thêm logic`: [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)
  * Khai báo thêm mutation `removeAccess`.
* `Sửa`: [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
  * Đọc mutation `removeAccess`, thêm hàm `handleRemoveAccess` và render nút Xóa trong bảng danh sách khách hàng.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm mã nguồn mutation vào cuối tệp `convex/resources.ts`.
2. Khai báo mutation, thêm state `deletingAccessId` và hàm `handleRemoveAccess` vào `app/admin/resources/[id]/edit/page.tsx`.
3. Sửa thẻ `<TableCell>` cột hành động trong bảng danh sách khách đã mua/tải để hiển thị thêm nút Xóa.
4. Rà soát TypeScript compile và kiểm tra Oxlint.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kế hoạch kiểm chứng**:
  * Chạy `bunx tsc --noEmit` để đảm bảo code compile thành công.
  * Bàn giao để kiểm tra trực quan trên trình duyệt (thực hiện thu hồi rồi xóa, hoặc xóa trực tiếp bản ghi quyền truy cập).

# VIII. Todo
* [ ] Viết mutation `removeAccess` vào [convex/resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)
* [ ] Tích hợp mutation và viết hàm `handleRemoveAccess` trong [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
* [ ] Bổ sung nút Xóa trong bảng UI của tab khách hàng trong [resources/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx)
* [ ] Chạy kiểm tra compiler TypeScript toàn dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Tab "Khách đã mua/tải" của trang chỉnh sửa tài nguyên hiển thị thêm nút "Xóa" màu đỏ bên cạnh nút "Thu hồi".
* Khi click nút "Xóa", hiển thị cảnh báo yêu cầu xác nhận. Sau khi xác nhận, bản ghi liên kết bị xóa hoàn toàn khỏi cơ sở dữ liệu Convex và danh sách cập nhật ngay lập tức.
* Nút "Xóa" hoạt động cho cả bản ghi đang có quyền và bản ghi đã bị thu hồi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Không có rủi ro lớn, chỉ tác động đến liên kết tải tài nguyên của khách hàng tương ứng.
* **Hoàn tác**: Sử dụng Git revert để khôi phục lại trạng thái cũ.

# XI. Out of Scope (Ngoài phạm vi)
* Tác động đến thông tin khách hàng gốc trong bảng `customers` hay thông tin tài nguyên trong bảng `resources`.

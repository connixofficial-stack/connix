# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Menu bên trái (sidebar) của trang Admin hiện có khoảng cách giữa các phần quá rộng (`space-y-6`) và các nút menu có chiều cao lớn (`py-2.5`), làm cho menu chiếm nhiều diện tích dọc và gây cuộn trang không đáng có trên màn hình nhỏ.
- **Giải pháp**:
  - Giảm khoảng cách dọc (spacing) của các khối lớn trên sidebar từ `space-y-6` xuống `space-y-3.5`.
  - Giảm chiều cao (padding) của từng mục menu cha từ `py-2.5` xuống `py-2` và menu con từ `py-2` xuống `py-1.5`.
  - Giảm padding của container chính từ `py-6` xuống `py-4`.
  - Đồng bộ hiển thị tiêu đề nhóm (Group Title) của tất cả các khối khi menu mở rộng để giao diện gọn gàng, cân đối và chuyên nghiệp.

## 2. Elaboration & Self-Explanation
Việc tinh chỉnh này tập trung tối đa vào tính thẩm mỹ và mật độ thông tin của Sidebar. Spacing ban đầu (`space-y-6`) quá rộng khiến khoảng cách giữa các khối chức năng (như Nội dung, Bán hàng, Hệ thống) bị rời rạc. Khi giảm xuống `space-y-3.5` (14px) và padding item xuống `py-2` (8px), các nút menu sẽ sát lại gần nhau hơn một chút nhưng vẫn giữ được độ thoáng cần thiết của một giao diện hiện đại.
Điều này giúp tăng mật độ thông tin theo chiều dọc, giúp admin dễ dàng bao quát toàn bộ hệ thống menu mà không cần phải cuộn chuột lên xuống liên tục trên màn hình laptop thông thường.

## 3. Concrete Examples & Analogies
- **Ví dụ**: Trên màn hình laptop 13-14 inch, trước đây admin phải cuộn dọc sidebar mới có thể nhìn thấy menu "Cài đặt" ở dưới cùng. Sau khi tinh chỉnh, toàn bộ menu từ "Tổng quan" đến "Cài đặt" sẽ nằm trọn vẹn trong một màn hình hiển thị.
- **Analogy**: Giống như việc bạn điều chỉnh khoảng cách dòng (line spacing) trong một văn bản từ 2.0 (Double spaced) xuống 1.15. Văn bản sẽ ngắn gọn hơn, dễ đọc lướt hơn và không bị tốn giấy in mà chữ vẫn rất rõ ràng.

# II. Audit Summary (Tóm tắt kiểm tra)

| Loại Vấn Đề | Vị Trí File | Chi Tiết Lỗi | Ảnh Hưởng |
| :--- | :--- | :--- | :--- |
| **Design Debt** | [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx#L324) | Spacing container `space-y-6` quá rộng. Menu items padding `py-2.5` quá lớn. | Chiếm diện tích dọc, gây cuộn sidebar không đáng có, giảm tính thẩm mỹ của một dashboard chuyên nghiệp. |
| **UX Debt** | [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx#L226-L234) | Tiêu đề nhóm (Group Title) hiển thị không nhất quán (chỉ hiện khi nhóm có > 1 item). | Tạo cảm giác đứt gãy bố cục. Nhóm có title, nhóm không có title trông rất lộn xộn. |

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân spacing sidebar rộng**: Do thiết kế ban đầu muốn tạo cảm giác thoáng đãng, tuy nhiên khi số lượng menu tăng lên thực tế (hơn 10 menu lớn nhỏ), spacing rộng phản tác dụng, gây loãng thông tin.
- **Giả thuyết đối chứng**: Nếu chỉ giảm spacing dọc mà không giảm padding của từng item, sidebar trông sẽ rất mất cân đối (khoảng cách giữa các khối thì hẹp nhưng bản thân từng nút lại quá to). Vì vậy cần giảm đồng bộ cả `space-y` của container và `py` của item.

# IV. Proposal (Đề xuất)

## 1. Tối ưu Spacing & Spacing Debt ở Sidebar
- Chỉnh sửa `Sidebar.tsx`:
  - Đổi `space-y-6` thành `space-y-3.5` ở container chính.
  - Đổi `py-6` thành `py-4` ở container chính.
  - Đổi padding của `SidebarItem` từ `py-2.5` thành `py-2` (cho trạng thái mở rộng) và từ `p-3` thành `p-2` (cho trạng thái thu gọn).
  - Đổi padding của subItems từ `py-2` thành `py-1.5` để cân xứng.
  - Đồng bộ hiển thị Group Title: Hiển thị Group Title cho toàn bộ các nhóm chính bất kể số lượng item khi sidebar ở trạng thái mở rộng (Tổng quan, Nội dung, Bán hàng, Media, Marketing, Hệ thống) để sidebar có cấu trúc phân mục rõ ràng, chuyên nghiệp.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa**: [app/admin/components/Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx)
  - *Vai trò*: Sidebar điều hướng chính cho admin.
  - *Thay đổi*: Giảm spacing dọc (`space-y-6` -> `space-y-3.5`), padding items (`py-2.5` -> `py-2`), và hiện tiêu đề nhóm thống nhất.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa đổi `Sidebar.tsx` để tối ưu spacing, padding và Group Title.
2. Review tĩnh (kiểm tra type TypeScript, các biến import, cấu trúc layout).

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Kiểm tra compile TypeScript qua pre-commit hook của dự án.

### Manual Verification
- Truy cập `/admin` để kiểm tra trực quan khoảng cách sidebar.
- Kiểm tra trạng thái collapse và expanded xem icon và text có bị lệch hay tràn không.

# VIII. Todo

- [ ] Sửa đổi khoảng cách và padding của Sidebar trong [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Sidebar gọn gàng, tăng mật độ hiển thị thông tin.
- Menu chính hiển thị trọn vẹn không cần cuộn dọc trên màn hình laptop tiêu chuẩn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rollback: `git checkout -- app/admin/components/Sidebar.tsx`

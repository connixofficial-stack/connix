# Bugfix Requirements Document

## Introduction

Tại trang chỉnh sửa logo khách hàng (`/admin/home-components/clients/[id]/edit`), nút xóa (×) bị vô hiệu hóa khi số lượng logo còn lại nhỏ hơn hoặc bằng 3 items do logic `disabled={items.length <= minItems}` trong `ClientsForm.tsx`. Điều này ngăn người dùng xóa logo xuống còn ít hơn 3 items, mặc dù không có yêu cầu nghiệp vụ bắt buộc phải giữ tối thiểu 3 logo.

Bug này ảnh hưởng đến trải nghiệm người dùng khi họ muốn xóa bớt logo hoặc xóa hết để bắt đầu lại từ đầu.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN số lượng items còn lại bằng 3 (items.length = 3) THEN nút xóa (×) bị disable và người dùng không thể xóa thêm bất kỳ logo nào

1.2 WHEN số lượng items còn lại nhỏ hơn 3 (items.length < 3) THEN nút xóa (×) vẫn bị disable và người dùng không thể xóa logo

1.3 WHEN người dùng click vào nút xóa (×) khi items.length <= 3 THEN không có hành động nào xảy ra do nút bị disable

### Expected Behavior (Correct)

2.1 WHEN số lượng items còn lại bằng 3 (items.length = 3) THEN nút xóa (×) SHALL được enable và người dùng có thể xóa logo

2.2 WHEN số lượng items còn lại nhỏ hơn 3 (items.length < 3) THEN nút xóa (×) SHALL được enable và người dùng có thể tiếp tục xóa logo

2.3 WHEN người dùng click vào nút xóa (×) với bất kỳ số lượng items nào (kể cả items.length = 1) THEN hệ thống SHALL xóa logo đó và cập nhật danh sách

2.4 WHEN số lượng items giảm xuống 0 THEN hệ thống SHALL hiển thị danh sách rỗng mà không có lỗi

### Unchanged Behavior (Regression Prevention)

3.1 WHEN số lượng items lớn hơn 3 (items.length > 3) THEN nút xóa (×) SHALL CONTINUE TO hoạt động bình thường như hiện tại

3.2 WHEN người dùng xóa một logo THEN hệ thống SHALL CONTINUE TO cập nhật state và re-render UI đúng cách

3.3 WHEN số lượng items nhỏ hơn minItems (3) THEN warning message "⚠ Nên có ít nhất 3 logo để marquee mượt hơn" SHALL CONTINUE TO hiển thị như hiện tại

3.4 WHEN người dùng thêm logo mới THEN hệ thống SHALL CONTINUE TO hoạt động bình thường không bị ảnh hưởng

3.5 WHEN người dùng di chuyển logo (move left/right) THEN hệ thống SHALL CONTINUE TO hoạt động bình thường không bị ảnh hưởng

3.6 WHEN người dùng upload hoặc nhập URL cho logo THEN hệ thống SHALL CONTINUE TO hoạt động bình thường không bị ảnh hưởng

3.7 WHEN số lượng items đạt maxItems (20) THEN nút "Thêm" SHALL CONTINUE TO bị disable như hiện tại

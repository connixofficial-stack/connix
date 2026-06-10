# I. Primer

## 1. TL;DR kiểu Feynman
Khi vẽ cái nhãn (Badge) "ƯU ĐÃI ĐẶC BIỆT" trên màn hình của 3 kiểu bố cục Centered, Split, Floating, chúng ta đang dùng một công thức tính màu làm cho nền thì xám đen thui còn chữ cũng đen sẫm, nhìn rất tối và không đọc được. Trong khi đó, kiểu bố cục Banner lại có công thức tính rất đẹp: dùng màu nhạt sáng làm nền, chữ màu tối tương phản rõ ràng.
Chúng ta sẽ sửa lại công thức của 3 kiểu Centered, Split, Floating cho giống hệt kiểu Banner để các nhãn này luôn sáng sủa, dễ đọc trên mọi màn hình.

## 2. Elaboration & Self-Explanation
Hiện tượng nhãn (Badge) có nền tối chữ tối xảy ra do hệ thống đang dùng `secondaryPalette.surface` (màu bề mặt) làm màu nền và `secondaryPalette.textInteractive` làm màu chữ cho Badge ở các layout mặc định. Khi màu thương hiệu phụ (secondary color) là các tone màu sáng như màu vàng, công thức này tính toán ra màu nền xám tối và chữ đen, làm mất tương phản nghiêm trọng.
Để giải quyết triệt để, chúng ta thay đổi cấu hình màu mặc định của Badge trong đối tượng `base` của hàm `getCTAColors`. Thay vì dùng `surface` và `textInteractive`, chúng ta sử dụng màu nền dạng tint sáng của màu phụ (`getSolidTint(secondaryPalette.solid, 0.42)`) và tự động tính màu chữ tương phản cao bằng thuật toán APCA (`getAPCATextColor`). Việc này giúp đồng bộ hóa cách hiển thị của tất cả layout (Centered, Split, Floating) theo chuẩn trực quan xuất sắc của layout Banner.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế**: Nếu màu thương hiệu phụ của trang web là màu vàng ấm (`#eab308`), cách tính cũ sẽ sinh ra Badge có nền xám sẫm `#27272a` và chữ đen `#0f172a`. Cách tính mới sẽ sinh ra Badge có nền màu vàng nhạt sữa rất dịu mắt, chữ màu đen sẫm rõ ràng.
- **Analogy**: Giống như việc bạn viết chữ bằng bút bi đen lên một tờ giấy màu xám đen, rất khó nhìn. Thay vào đó, chúng ta đổi sang viết bằng bút bi đen trên một tờ giấy nhớ màu vàng nhạt hoặc hồng nhạt, thông tin lập tức nổi bật và dễ đọc.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp kiểm tra**: [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_lib/colors.ts)
- **Hiện trạng**: Công thức gán màu mặc định cho Badge trong biến `base` đang sử dụng `badgeBg: secondaryPalette.surface` và `badgeText: secondaryPalette.textInteractive`.
- **Kết quả**: Các layout `Centered`, `Split`, `Floating` không ghi đè cấu hình Badge nên kế thừa trực tiếp từ `base`, dẫn đến việc phối màu bị lỗi tương phản thấp.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Cấu hình mặc định của Badge trong `base` dùng cặp màu `surface` và `textInteractive` từ bảng màu phụ. Công thức tạo `surface` và `textInteractive` bằng cách dịch chuyển độ sáng (Lightness) trong hệ OKLCH hoạt động không ổn định trên một số dải màu thương hiệu đặc thù (như màu vàng), tạo ra tương phản kém (nền tối chữ tối).
- **Giả thuyết đối chứng**: Nếu thay đổi cấu hình mặc định trong `base` thành công thức tạo màu tint sáng (`getSolidTint`) kết hợp kiểm tra tương phản APCA (`getAPCATextColor`), các Badge trên tất cả layout kế thừa sẽ tự động hiển thị với độ tương phản cao và thẩm mỹ xuất sắc như ở layout Banner.

# IV. Proposal (Đề xuất)
- Sửa đổi hàm `getCTAColors` trong [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_lib/colors.ts):
  - Cập nhật định nghĩa màu Badge trong đối tượng `base`:
    - `badgeBg`: Dùng `getSolidTint(secondaryPalette.solid, 0.42)` giống layout Banner.
    - `badgeText`: Dùng `getAPCATextColor(badgeBgSolid, 12, 600)`.
    - `badgeBorder`: Dùng `secondaryPalette.border`.
  - Trong nhánh `styleNormalized === 'banner'`, do đã trùng với giá trị mặc định mới trong `base`, có thể giữ nguyên hoặc loại bỏ phần ghi đè không cần thiết để giữ code gọn gàng (DRY). Để giảm thiểu rủi ro, ta cập nhật trực tiếp `base` và giữ nguyên code của `banner` (hoặc tối giản nó).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_lib/colors.ts)
  - Vai trò hiện tại: Quản lý tính toán màu sắc cho toàn bộ CTA Component.
  - Thay đổi: Thay đổi cách tính toán `badgeBg`, `badgeText` và `badgeBorder` mặc định trong đối tượng `base` để kế thừa trực tiếp công thức phối màu thông minh của `banner`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_lib/colors.ts).
2. Tạo bản chỉnh sửa thay thế cặp giá trị màu của Badge trong `base`.
3. Kiểm tra tĩnh xem code compile thành công không (sử dụng Oxlint/TypeScript).
4. Xác nhận sự thay đổi hiển thị trong preview và runtime.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch**: Chạy `tsc --noEmit` để đảm bảo không lỗi cú pháp hoặc kiểu dữ liệu.
- **Kiểm tra thủ công**: Người dùng kiểm tra trực quan trên trình duyệt (admin edit/create và site preview) với 3 layout Centered, Split, Floating để đảm bảo Badge hiển thị rõ ràng, phối màu hài hòa và có tương phản cao.

# VIII. Todo
- [ ] Cập nhật đối tượng `base` trong hàm `getCTAColors` trong file `colors.ts`.
- [ ] Chạy kiểm tra kiểu tĩnh (TypeScript compile) để xác nhận tính chính xác của mã nguồn.
- [ ] Phát âm báo hoàn thành tác vụ.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Badge của 3 layout Centered, Split, Floating hiển thị nền màu nhạt sáng (tint của secondary color) và chữ màu tối sẫm (hoặc ngược lại nếu nền tối), đảm bảo chuẩn tương phản APCA.
- Độ thẩm mỹ tương đương với cách phối màu của layout Banner.
- Không phát sinh lỗi biên dịch dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp vì đây chỉ là thay đổi tính toán màu tĩnh dựa trên các helper đã có sẵn.
- **Hoàn tác**: Hoàn tác các dòng sửa đổi trong `colors.ts` về trạng thái ban đầu qua git.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc HTML/CSS của các layout.
- Thay đổi màu sắc của các phần tử khác như button, title, description (trừ khi có lỗi trực tiếp liên quan đến badge).

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Giao diện layout 4 (Dark Glass) hiện đang fix cứng màu vàng sáng `#FFD700` khi hover chuột vào menu và fix cứng màu trắng-đen cho nút liên hệ (CTA). Điều này làm cho giao diện không đồng bộ với màu sắc thương hiệu chính mà người dùng cấu hình trong phần cài đặt.
* **Cách giải quyết**:
  - Đổi màu chữ của menu cấp 1 khi hover sang màu chính thương hiệu (`tokens.primary` hoặc `brandColors.primary`).
  - Đổi màu nút liên hệ (CTA) sang màu nền chính thương hiệu (`tokens.primary` hoặc `tokens.ctaBg`) và chữ tương phản phù hợp (`tokens.textInverse` hoặc `tokens.ctaText`).
  - Áp dụng thay đổi này đồng bộ cho cả tệp ngoài site thực tế (`Header.tsx`) và tệp xem trước admin (`HeaderMenuPreview.tsx`).

## 2. Elaboration & Self-Explanation
Hiện nay, màu sắc thương hiệu được định nghĩa động thông qua Convex DB và được tính toán trong hook `useBrandColors`.
- Trong `Header.tsx`, ta có đối tượng `tokens` chứa `tokens.primary` đại diện cho màu chính của thương hiệu, và `tokens.textInverse` là màu chữ tương phản tối ưu trên nền `tokens.primary`.
- Chúng ta sẽ loại bỏ việc truyền tham số `hoverTextClassName` (vốn chứa class Tailwind fix cứng màu `hover:text-[#FFD700]`) cho hàm `renderDarkGlassNav`.
- Thay vào đó, ta sử dụng thuộc tính `style` trên thẻ `Link` (và thẻ `a` trong preview) để gán màu sắc trực tiếp dựa trên trạng thái hover: `color: hoveredItem === item._id ? tokens.primary : '#ffffff'`.
- Nút CTA của Dark Glass sẽ sử dụng cặp màu động `backgroundColor: tokens.primary` và `color: tokens.textInverse` (hoặc `tokens.ctaBg`/`tokens.ctaText`).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  - Nếu quản trị viên cấu hình màu chính của trang web là Màu Xanh Dương (`#007acc`), thì:
    - Khi hover vào menu "Trang chủ", "Sản phẩm", chữ sẽ chuyển sang Màu Xanh Dương thay vì màu vàng `#FFD700`.
    - Nút "Về chúng tôi" hoặc "Liên hệ" (CTA) ở góc phải sẽ có nền màu Xanh Dương và chữ màu trắng thay vì nền trắng chữ đen.
* **Phép ẩn dụ thực tế**:
  - Giống như việc một nhà hàng thay đổi tông màu chủ đạo từ xanh lá sang đỏ. Nếu đồng phục của nhân viên và bảng hiệu được in sẵn tĩnh màu xanh lá (fix cứng), họ sẽ bị lệch tông. Việc chuyển sang màu động giống như may đồng phục bằng loại vải đổi màu theo ánh đèn chủ đạo của nhà hàng, giúp mọi thứ luôn đồng bộ 100%.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tệp kiểm tra**:
  - [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
    - Dòng 1898: Khai báo Link cấp 1 của Dark Glass dùng `hoverTextClassName`.
    - Dòng 2120: Nút CTA của Dark Glass dùng style cứng `{ backgroundColor: '#ffffff', color: '#000000', padding: '8px 20px' }`.
    - Dòng 2168, 2182: Gọi `renderDarkGlassNav("text-white", "hover:text-[#FFD700]")`.
  - [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx):
    - Dòng 1668: Thẻ `a` cấp 1 của Dark Glass dùng màu vàng cứng `hoveredItem === item._id ? darkGlassAccentText : darkGlassNavText`.
    - Dòng 1812: Nút CTA của Dark Glass dùng style cứng `{ backgroundColor: '#ffffff', color: '#000000', padding: '8px 18px' }`.
* **Minh chứng (Evidence)**:
  - Cả 2 file đều định nghĩa tĩnh màu `#FFD700` cho hover và `#ffffff` cho nút CTA của Dark Glass.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Do thiết kế ban đầu của layout Dark Glass học theo mẫu có sẵn sử dụng phong cách kính mờ với các màu nhấn vàng/trắng cố định, chưa được kết nối với hệ thống cấu hình màu động của thương hiệu.
* **Độ tin cậy nguyên nhân gốc**: **High (Cao)**

---

# IV. Proposal (Đề xuất)
* **Đề xuất xử lý**:
  1. Cập nhật [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
     - Đổi style Link cấp 1 của Dark Glass: `color: hoveredItem === item._id ? tokens.primary : '#ffffff'`.
     - Đổi style nút CTA của Dark Glass sang màu chính của thương hiệu: `backgroundColor: tokens.primary, color: tokens.textInverse`.
     - Loại bỏ tham số `hoverTextClassName` khỏi hàm `renderDarkGlassNav`.
  2. Cập nhật [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx):
     - Thực hiện tương tự để đảm bảo giao diện xem trước trong Admin đồng bộ màu sắc.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
  - *Thay đổi*: Cập nhật style màu chữ hover và nút CTA của Dark Glass theo `tokens.primary`.
* **Sửa**: [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
  - *Thay đổi*: Cập nhật style màu chữ hover và nút CTA của Dark Glass theo `tokens.primary` trong admin preview.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại các khối code cần sửa đổi.
2. Thay thế logic render Link và nút CTA của Dark Glass trong `Header.tsx`.
3. Thay thế logic render Link và nút CTA của Dark Glass trong `HeaderMenuPreview.tsx`.
4. Xác minh lỗi biên dịch tĩnh.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy kiểm tra tĩnh TypeScript:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### Manual Verification
- Thay đổi màu chính (Primary Color) trong trang cài đặt Admin.
- Xem giao diện ngoài site thực tế và trang preview xem màu của nút CTA và hover menu của layout Dark Glass có tự động thay đổi theo màu mới hay không.

---

# VIII. Todo
- [ ] Thay đổi màu chữ hover và nút CTA Dark Glass trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
- [ ] Thay đổi màu chữ hover và nút CTA Dark Glass trong [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
- [ ] Chạy `bunx tsc --noEmit` để đảm bảo biên dịch thành công.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout Dark Glass hiển thị nút CTA và màu chữ hover theo màu Primary của thương hiệu.
- Giao diện Admin Preview đồng bộ hoàn toàn với giao diện ngoài site thực tế.
- Biên dịch dự án thành công.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi hành vi hiển thị của các layout khác.

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Menu của layout 3 (Allbirds) và layout 4 (Dark Glass) hiển thị không đẹp, bị lỗi dàn hàng ngang kỳ lạ khi chỉ có 2 cấp con, đồng thời menu sâu 4-5 cấp bị mất logic bay ngang (flyout) và layout Allbirds đang bị lỗi cú pháp làm hỏng giao diện.
* **Cách giải quyết**:
  - Dùng chung 1 logic sổ menu chuẩn từ Classic/Topbar:
    - Nếu menu chỉ có 2 cấp: Hiển thị 1 cột dọc tinh tế (Flyout).
    - Nếu menu từ 3 cấp trở lên: Hiển thị dạng lưới Mega Menu (Grid), các cấp sâu hơn (4-5 cấp) tự động gọi đệ quy hiển thị flyout chĩa sang ngang.
  - Sửa lại lỗi cú pháp JSX bị hỏng ở layout Allbirds trong `Header.tsx`.
  - Đồng bộ hóa logic này cho cả tệp chạy thực tế (`Header.tsx`) và tệp xem trước admin (`HeaderMenuPreview.tsx`).

## 2. Elaboration & Self-Explanation
Hiện tại, trong khi layout Classic và Topbar đã có cơ chế xử lý menu rất tốt (sử dụng hàm `isDeepMenuForItem` để quyết định xem có nên hiển thị Mega Menu hay Flyout 1 cột, đồng thời gọi đệ quy `renderDesktopFlyoutNodes` cho các cấp sâu), thì layout Allbirds và Dark Glass lại:
- **Dark Glass**: Luôn hiển thị Mega Menu Grid bất kể số cấp của menu. Điều này khiến cho các menu đơn giản chỉ có 2 cấp (ví dụ: Chính sách -> Chính sách bảo mật, Chính sách đổi trả) bị trải rộng theo chiều ngang cực kỳ mất thẩm mỹ.
- **Allbirds**: Có chia `isDeepMenuForItem` nhưng do lỗi biên tập code trước đó, tệp `Header.tsx` ở phần Allbirds bị hỏng cú pháp (cắt cụm ở `hoveredIte` và lặp code đóng mở thẻ div) khiến cho dự án không thể biên dịch thành công.
- **HeaderMenuPreview.tsx**: Chưa được đồng bộ hóa logic tương ứng cho Dark Glass.

Hướng xử lý:
- Chúng ta sẽ bám sát logic của Classic/Topbar:
  - Sử dụng hàm kiểm tra `isDeepMenuForItem(itemId)` (trả về `true` nếu menu có chiều sâu từ 3 cấp trở lên).
  - Nếu `isDeepMenuForItem` là `true`: Hiển thị Mega Menu Grid 3/4/5 cột tùy số lượng item con, và gọi đệ quy `renderDesktopFlyoutNodes(child.children, true)` cho các tầng sâu hơn.
  - Nếu `isDeepMenuForItem` là `false`: Hiển thị Flyout dọc gọn gàng với chiều rộng tối thiểu `200px`. Các cấp con sâu hơn nếu có cũng sẽ được định hướng bay sang bên phải (hoặc bên trái nếu bị tràn viền màn hình) bằng cách gọi hàm `updateFlyoutDirection`.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  - Giả sử có cấu trúc menu:
    - *Chính sách* (cấp 1) -> *Điều khoản sử dụng* (cấp 2), *Chính sách bảo mật* (cấp 2).
    => Chiều sâu menu này chỉ là 2. Do đó, khi hover vào "Chính sách", dropdown hiển thị sẽ là 1 cột dọc thẳng đứng (Flyout), chứa 2 mục con.
    - *Sản phẩm* (cấp 1) -> *Nam* (cấp 2) -> *Áo thun* (cấp 3) -> *Áo thun cổ tròn* (cấp 4).
    => Chiều sâu menu này là 4. Khi hover vào "Sản phẩm", dropdown hiển thị sẽ là Mega Menu (Grid). Mục "Nam" là tiêu đề cột, bên dưới có "Áo thun" và khi hover vào "Áo thun", một flyout phụ sẽ bay sang ngang chứa "Áo thun cổ tròn".
* **Phép ẩn dụ thực tế**:
  - Giống như việc phân loại hộp quà. Hộp quà nhỏ chỉ có 2 món đồ bên trong thì ta xếp dọc gọn gàng trong một chiếc túi xách (Flyout dọc). Nếu là một giỏ quà lớn có nhiều ngăn và nhiều tầng lớp đồ phức tạp (Menu 3 cấp trở lên), ta phải bày ra một chiếc khay rộng (Mega Menu Grid) để người dùng dễ nhìn, và các hộp nhỏ bên trong khay sẽ có thêm nhãn phụ chĩa ra khi chạm vào (Đệ quy Flyout).

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tệp kiểm tra**:
  - [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
    - Dòng 1907-2028: Chứa dropdown menu của Dark Glass, hiện tại luôn dùng Grid layout p-6 và hiển thị cột.
    - Dòng 2346-2531: Chứa dropdown menu của Allbirds bị lỗi cú pháp JSX (bị đè chữ `hoveredIte` và lặp đóng thẻ).
  - [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx):
    - Dòng 1410-1491: Chứa dropdown menu của Allbirds.
    - Dòng 1678-1727: Chứa dropdown menu của Dark Glass, luôn hiển thị Grid.
* **Minh chứng (Evidence)**:
  - Trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx), dòng 1907 chỉ kiểm tra `item.children.length > 0 && hoveredItem === item._id` chứ không kiểm tra `isDeepMenuForItem(item._id)`.
  - Dòng 2346 trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) bị cụt cú pháp: `hoveredIte                    {item.children.length > 0 && hoveredItem === item._id && (`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**:
  - Do việc phát triển layout Dark Glass và Allbirds trước đó chưa được cập nhật đầy đủ logic xử lý menu đa cấp động từ Classic/Topbar, dẫn đến việc dùng Grid cố định cho Dark Glass.
  - Đồng thời, quá trình gộp code trước đó gặp xung đột hoặc lỗi thay thế chuỗi dẫn đến cú pháp JSX của Allbirds trong `Header.tsx` bị lỗi nặng.
* **Độ tin cậy nguyên nhân gốc**: **High (Cao)**
  - *Lý do*: Lỗi cú pháp hiển thị trực tiếp trong file code và logic thiếu sót là rõ ràng khi so sánh trực diện cấu trúc JSX của `classic` với `darkglass`/`allbirds`.

---

# IV. Proposal (Đề xuất)
* **Đề xuất xử lý**:
  1. Đồng bộ hóa logic dropdown của **Allbirds** trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
     - Thay thế toàn bộ khối dropdown bị hỏng bằng logic chuẩn của Classic, giữ nguyên cấu trúc link cấp 1 của Allbirds.
  2. Đồng bộ hóa logic dropdown của **Dark Glass** trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
     - Sửa hàm `renderDarkGlassNav` để kiểm tra `isDeepMenuForItem(item._id)`.
     - Nếu là deep menu: hiển thị Mega Menu (Grid) giống Classic.
     - Nếu không phải deep menu: hiển thị Flyout dọc (1 cột), hỗ trợ hover chĩa sang ngang các cấp con thông qua `updateFlyoutDirection`.
  3. Đồng bộ hóa tương tự cho **Allbirds** và **Dark Glass** trong [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx) để đảm bảo giao diện xem trước trong trang Admin hiển thị chuẩn xác 100%.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
  - *Vai trò hiện tại*: Hiển thị Header ngoài site thực tế.
  - *Thay đổi*: Đồng bộ hóa dropdown menu của Dark Glass và Allbirds theo chuẩn Classic, sửa lỗi cú pháp.
* **Sửa**: [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
  - *Vai trò hiện tại*: Hiển thị Header xem trước trong trang quản trị Admin.
  - *Thay đổi*: Đồng bộ hóa dropdown menu của Dark Glass và Allbirds theo chuẩn Classic/Topbar.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ lại các vùng code cần sửa đổi trong `Header.tsx` và `HeaderMenuPreview.tsx`.
2. Dùng công cụ `replace_file_content` sửa dropdown của `darkglass` trong hàm `renderDarkGlassNav` ở `Header.tsx`.
3. Dùng công cụ `replace_file_content` sửa dropdown của `allbirds` bị hỏng cú pháp ở `Header.tsx`.
4. Dùng công cụ `replace_file_content` sửa dropdown của `allbirds` và `darkglass` trong `HeaderMenuPreview.tsx`.
5. Đánh giá tĩnh lại toàn bộ mã nguồn.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy kiểm tra tĩnh kiểu dữ liệu TypeScript toàn dự án:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
  (Không được có lỗi liên quan đến file `Header.tsx` và `HeaderMenuPreview.tsx`).

### Manual Verification
- Người dùng kiểm tra trực quan trên trình duyệt ở trang Admin `/system/experiences/menu` và ngoài trang chủ (site thực tế) đối với các layout Allbirds và Dark Glass để đảm bảo:
  - Menu 2 cấp hiển thị dạng dọc (Flyout 1 cột).
  - Menu từ 3 cấp trở lên hiển thị dạng lưới Mega Menu (Grid) có flyout chĩa ngang ở các cấp con sâu hơn.
  - Chevron hiển thị đúng và xoay mượt mà.

---

# VIII. Todo
- [ ] Cập nhật dropdown menu Dark Glass trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
- [ ] Sửa lỗi cú pháp và cập nhật dropdown menu Allbirds trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
- [ ] Cập nhật dropdown menu Allbirds trong [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
- [ ] Cập nhật dropdown menu Dark Glass trong [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/HeaderMenuPreview.tsx)
- [ ] Chạy `bunx tsc --noEmit` để xác minh dự án biên dịch thành công không lỗi type.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Mã nguồn biên dịch thành công không lỗi syntax hay type.
- Cả ngoài site thực tế và trang preview admin đều áp dụng đúng cơ chế:
  - Menu <= 2 cấp: Sổ dọc gọn gàng (Flyout 1 cột).
  - Menu >= 3 cấp: Sổ lưới rộng (Mega Grid) + các cấp 4-5 tự động gọi đệ quy hiển thị flyout phụ chĩa sang ngang.
- Chevron chỉ hướng menu con hoạt động nhất quán trên tất cả layout.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi gộp code làm đứt gãy cấu trúc JSX (như lần thay thế trước).
* **Biện pháp giảm thiểu**: So khớp kỹ lượng dòng bắt đầu và dòng kết thúc, sử dụng block code lớn độc nhất để thay thế thay vì các chuỗi nhỏ dễ nhầm lẫn.
* **Hoàn tác**: Sử dụng `git checkout -- <filepath>` để khôi phục trạng thái sạch của các file nếu xảy ra lỗi biên dịch không mong muốn.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa các phần logic giỏ hàng, tìm kiếm, đăng nhập hay các layout Classic/Topbar khác.
- Không cấu hình thêm menu mới trong database.

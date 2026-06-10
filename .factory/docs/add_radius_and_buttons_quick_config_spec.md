# I. Primer

## 1. TL;DR kiểu Feynman
Trang cấu hình hệ thống (`/system/experiences`) cần có thêm các nút bấm để cài đặt nhanh cho **Bo góc** của các danh sách (Bỏ bo góc, Bo góc ít, Bo góc nhiều) và cài đặt **Bố cục nút** cho danh sách Sản phẩm (Stack - Dọc, Grid-2 - Ngang 2 cột). Ta sẽ:
- Thêm các ô chọn cài đặt Bo góc cho cả 6 danh sách dữ liệu.
- Thêm ô chọn cài đặt Bố cục nút riêng cho danh sách Sản phẩm.
- Thêm thanh cài đặt nhanh ở trên đầu để đổi bo góc cho tất cả danh sách chỉ với 1 click.

## 2. Elaboration & Self-Explanation
Hiện tại tab "Cấu hình nhanh danh sách" của trang `/system/experiences` (code ở [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)) đang cho phép chỉnh nhanh Layout Style (Grid/Sidebar/List) và Số cột hiển thị (3/4 cột) của 6 danh sách. Để nâng cao khả năng cấu hình giao diện linh hoạt:
- Ta bổ sung thuộc tính `cornerRadius` (hỗ trợ 3 giá trị: `'none'` - Bỏ bo, `'sm'` - Bo ít, `'lg'` - Bo nhiều) cho cả 6 danh sách.
- Bổ sung thuộc tính `cartButtonsLayout` (hỗ trợ 2 giá trị: `'stack'` - Dọc, `'grid-2'` - Ngang 2 cột) cho riêng danh sách sản phẩm.
- Cập nhật state local (`localCornerRadius`, `localCartButtonsLayout`) để theo dõi các thay đổi này, đồng thời lưu trữ vào Convex DB trong mutation `handleSaveAll`.

## 3. Concrete Examples & Analogies
- **Bo góc (Corner Radius)** giống như việc bo tròn cạnh bàn ghế trong nhà: cạnh vuông sắc nhọn (`none`), bo nhẹ an toàn (`sm`), hoặc bo tròn mềm mại (`lg`).
- **Bố cục nút (Cart Buttons Layout)** giống như cách xếp hàng cho hai nút bấm "Mua ngay" và "Thêm giỏ hàng" trên card sản phẩm: hoặc xếp chồng lên nhau thành 2 hàng dọc (`stack`), hoặc đặt cạnh nhau thành 2 cột nằm ngang (`grid-2`).

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **File kiểm tra:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
- **Hành vi hiện tại:** Tab "Cấu hình nhanh danh sách" chỉ hiển thị 2 bộ cài đặt (Số cột và Layout Style).
- **Hành vi mong muốn:** Hiển thị thêm bộ cài đặt Bo góc (cho cả 6 items) và bộ cài đặt Bố cục nút (cho riêng sản phẩm).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Chưa khai báo state và render UI cho thuộc tính `cornerRadius` (đã có sẵn trong data model của cả 6 danh sách) và `cartButtonsLayout` (đã có sẵn trong products config) trong trang cấu hình tổng.
- **Giả thuyết đối chứng:** Nếu ta khai báo thêm 2 state local, tích hợp chúng vào hàm map database query, hasChanges, handleSaveAll, và render giao diện tương ứng bằng các Segmented Control, quản trị viên có thể dễ dàng kiểm soát bo góc và bố cục nút trực tiếp.

---

# IV. Proposal (Đề xuất)

1. Khai báo state:
   - `localCornerRadius` dạng `Record<string, 'none' | 'sm' | 'lg'>`
   - `localCartButtonsLayout` dạng `'stack' | 'grid-2'`
2. Đọc và gán giá trị mặc định cho 2 state này từ data queries của Convex.
3. Tích hợp kiểm tra thay đổi trong `hasChanges` và ghi nhận giá trị lưu trong `handleSaveAll`.
4. Thêm nút "Đồng bộ nhanh" Bo góc vào Quick Apply Card.
5. Thêm UI chọn Bo góc (Bỏ, Ít, Nhiều) ở từng hàng cấu hình danh sách.
6. Thêm UI chọn Bố cục nút (Dọc, Ngang 2 cột) ở hàng cấu hình Sản phẩm.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
- **Vai trò hiện tại:** Trang cấu hình hệ thống tổng quản lý Layouts và Dark Mode.
- **Thay đổi:** Bổ sung state, logic lưu DB và UI cấu hình nhanh Bo góc, Bố cục nút.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa code state và useEffect của [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx).
2. Sửa logic lưu DB và nút Apply nhanh trong file.
3. Cập nhật UI render của tab `layout_config`.
4. Biên dịch typecheck bằng `bunx tsc --noEmit`.
5. Git commit và phát âm báo hoàn thành.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Typecheck: `bunx tsc --noEmit`

---

# VIII. Todo

- [ ] Cập nhật file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx) với Bo góc và Bố cục nút.
- [ ] Chạy tsc.
- [ ] Git commit.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Có thanh Quick Apply hỗ trợ đặt nhanh bo góc cho tất cả danh sách (Bỏ bo, Bo ít, Bo nhiều).
2. Từng danh sách đều hiển thị nút chọn Bo góc.
3. Danh sách sản phẩm có thêm nút chọn Bố cục nút (Dọc, Ngang 2 cột).
4. Lưu cấu hình thành công vào DB và load lại đúng giá trị đã lưu.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Hoàn tác:** `git restore app/system/experiences/page.tsx`

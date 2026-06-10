# I. Primer

## 1. TL;DR kiểu Feynman
Tương tự như Banner, khi người dùng chọn chế độ "Giới hạn chiều rộng gọn gàng" (Max-w-7xl) cho layout Gradient hoặc Minimal, họ mong muốn toàn bộ khối màu nền của các layout này cũng phải co gọn lại và được bo góc ở giữa màn hình. Hiện tại, chúng vẫn luôn tràn viền hết 100% màn hình.
Chúng ta sẽ bổ sung logic phân tách tương tự:
- Nếu chọn "Mở rộng toàn chiều ngang" (Full width): Nền trải dài tràn viền 100%.
- Nếu chọn "Giới hạn chiều rộng gọn gàng" (Max-w-7xl): Cả khối nền co lại thành card rộng tối đa `7xl` căn giữa trang, bo góc mềm mại.

## 2. Elaboration & Self-Explanation
Chúng ta thực hiện cập nhật cấu trúc JSX cho layout `gradient` và layout mặc định `minimal` trong `CTASectionShared.tsx` để phản hồi chính xác với cấu hình `containerWidth`.
Logic thực hiện:
- Với `isFullWidth = true`: Màu nền `tokens.sectionBg` và border được áp dụng trực tiếp lên thẻ `section` ngoài cùng (chiều rộng 100%).
- Với `isFullWidth = false`: Thẻ `section` ngoài cùng làm nền trong suốt. Màu nền `tokens.sectionBg`, viền và bo góc được áp dụng lên thẻ `div` bên trong có thuộc tính `mx-auto max-w-7xl border`.

## 3. Concrete Examples & Analogies
Tương tự như Banner, dải màu gradient sống động (layout Gradient) hay khối viền ngang đơn giản (layout Minimal) sẽ tự động co lại thành một chiếc card độc lập đẹp mắt nằm giữa trang nếu chọn Max-w-7xl, thay vì kéo dài vô tận sang hai bên viền màn hình.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp kiểm tra**: [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx)
- **Hiện trạng**: Dòng 279-325 render layout `gradient` và layout mặc định `minimal` với màu nền gán trực tiếp lên `section` ngoài cùng, bỏ qua tùy chọn co giãn chiều rộng của `containerWidth`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Gán màu nền của component lên phần tử ngoài cùng `section` (vốn có width 100% viewport) thay vì gán linh hoạt dựa vào cấu hình `containerWidth` của người dùng.
- **Giả thuyết đối chứng**: Phân chia nhánh hiển thị của `gradient` và `minimal` theo `isFullWidth` sẽ làm các layout này tôn trọng cấu hình chiều rộng giống như Banner.

# IV. Proposal (Đề xuất)
- Cập nhật layout `gradient` và layout mặc định `minimal` trong [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx):
  - Nhánh `isFullWidth`: Giữ nguyên cấu trúc render tràn viền.
  - Nhánh `!isFullWidth`: Chuyển màu nền và bo góc vào thẻ `div` bên trong để tạo cấu trúc card co gọn `max-w-7xl mx-auto`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx)
  - Vai trò hiện tại: Render các layout của CTA Component.
  - Thay đổi: Cập nhật cấu trúc JSX/TSX của layout `gradient` và layout mặc định `minimal`.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa [CTASectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/cta/_components/CTASectionShared.tsx).
2. Chạy Typecheck để kiểm tra build.
3. Bàn giao kết quả.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Biên dịch**: Chạy `bunx tsc --noEmit`.
- **Trực quan**: Kiểm tra tùy chỉnh chiều rộng trong trang edit/create CTA với layout Gradient và Minimal.

# VIII. Todo
- [ ] Thay đổi cấu trúc JSX của layout `gradient` trong `CTASectionShared.tsx`.
- [ ] Thay đổi cấu trúc JSX của layout mặc định `minimal` trong `CTASectionShared.tsx`.
- [ ] Chạy typecheck kiểm tra build.
- [ ] Phát âm báo hoàn thành.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout Gradient và Minimal co giãn chính xác theo cấu hình `containerWidth`.
- Không phát sinh lỗi typecheck.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Thấp, chỉ thay đổi CSS classes và cấu trúc wrapper trong JSX.
- Hoàn tác file qua Git.

# XI. Out of Scope (Ngoài phạm vi)
- Các thay đổi logic hoặc các layout khác.

# I. Primer

## 1. TL;DR kiểu Feynman
- Hiện tại, các thông báo (toast) của Sonner trong dự án được cấu hình rời rạc ở 3 file layout khác nhau và chỉ có thể đóng bằng cách vuốt (swipe) hoặc chờ tự biến mất.
- Chúng ta muốn người dùng có thể click vào bất kỳ đâu trên thông báo (trừ nút hành động hoặc link) để đóng nhanh nó ngay lập tức.
- Để làm điều này một cách nhất quán (Source of Truth), ta sẽ tạo một component `CustomToaster` dùng chung, chứa logic bắt sự kiện click toàn cục và gọi lệnh ẩn toast tương ứng. Sau đó thay thế thẻ `<Toaster />` trực tiếp từ thư viện ở 3 layout bằng component mới này.

## 2. Elaboration & Self-Explanation
Sonner là một thư viện hiển thị thông báo rất mượt mà. Tuy nhiên, nó không hỗ trợ sẵn tính năng click vào thân thông báo để đóng (dismiss). Người dùng thường có thói quen click trực tiếp vào thông báo để dọn dẹp màn hình nhanh hơn.
Giải pháp của chúng ta là:
- Tạo một component bọc `CustomToaster` đóng vai trò là "Source of Truth" cho toàn bộ cấu hình thông báo của dự án.
- Sử dụng hook `useSonner()` từ thư viện để lấy danh sách các thông báo đang hoạt động.
- Lắng nghe sự kiện click trên toàn bộ tài liệu (document click listener). Khi phát hiện click vào một toast element (li có thuộc tính `data-sonner-toast`), ta xác định chỉ số (index) và vị trí của nó để tìm ra ID chính xác của toast trong state, sau đó gọi `toast.dismiss(id)`.
- Đảm bảo loại trừ các click vào thẻ `button` hoặc `a` bên trong toast để tránh làm mất các hành động click của người dùng (ví dụ: nút "Đồng ý", "Hủy", link liên kết).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Người dùng nhận được thông báo thành công "Cập nhật dữ liệu thành công". Thay vì phải di chuột tìm nút "X" nhỏ ở góc hoặc chờ 4 giây, họ chỉ cần click bất kỳ đâu vào hộp thông báo đó để nó biến mất ngay lập tức. Nếu thông báo có nút "Hoàn tác", họ click vào nút "Hoàn tác" thì hành động hoàn tác vẫn chạy bình thường mà không bị tắt bất ngờ.
- **Analogy đời thường**: Nó giống như việc bạn nhận một tờ giấy ghi chú dán trên bàn làm việc. Thay vì phải dùng nhíp gỡ cẩn thận ở góc, bạn chỉ cần lấy tay gạt nhẹ hoặc đập nhẹ lên tờ giấy là nó rơi xuống thùng rác, nhưng nếu trên tờ giấy có đính kèm một cây bút (nút hành động), bạn vẫn có thể rút cây bút ra dùng bình thường.

# II. Audit Summary (Tóm tắt kiểm tra)
- Có 3 file đang sử dụng trực tiếp `<Toaster />` từ thư viện `sonner`:
  1. [app/admin/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/layout.tsx#L38)
  2. [app/system/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/layout.tsx#L312)
  3. [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx#L49)
- Thư viện `sonner` phiên bản hiện tại là `^2.0.7` và sử dụng thuộc tính `data-index`, `data-y-position`, `data-x-position` để quản lý vị trí render của các toast trong DOM.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng**: Người dùng không thể click vào thân thông báo để đóng nhanh, gây khó chịu khi có nhiều thông báo xếp chồng lên nhau.
- **Nguyên nhân**: Sonner mặc định chỉ cho phép tắt qua swipe (vuốt) hoặc click nút `closeButton` (nếu bật). Không có thuộc tính cấu hình `closeOnClick` toàn cục.
- **Độ tin cậy nguyên nhân gốc**: High. (API của Sonner đã được kiểm tra qua tài liệu và mã nguồn).

# IV. Proposal (Đề xuất)
1. Tạo component `CustomToaster` tại [components/shared/CustomToaster.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/CustomToaster.tsx).
   - Component này sẽ render `<Toaster />` gốc từ `sonner`.
   - Thêm component con `ClickDismissHandler` sử dụng hook `useSonner()` để lắng nghe sự kiện click và tự động dismiss toast.
   - Thêm thuộc tính CSS `cursor: pointer` cho toast để cải thiện trải nghiệm người dùng (UX).
2. Thay thế `<Toaster />` từ `'sonner'` bằng `<CustomToaster />` từ `@/components/shared/CustomToaster` tại 3 file layout đã liệt kê ở phần Audit.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Thêm**:
  - [components/shared/CustomToaster.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/CustomToaster.tsx): Tạo component bọc Toaster mới chứa logic click đóng nhanh.
- **Sửa**:
  - [app/admin/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/layout.tsx): Thay `<Toaster>` bằng `<CustomToaster>`.
  - [app/system/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/layout.tsx): Thay `<Toaster>` bằng `<CustomToaster>`.
  - [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx): Thay `<Toaster>` bằng `<CustomToaster>`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích kỹ cấu trúc prop của Toaster.
2. Tạo file [components/shared/CustomToaster.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/CustomToaster.tsx).
3. Cập nhật các file layout để chuyển sang dùng `CustomToaster`.
4. Rà soát kiểu dữ liệu và thực hiện biên dịch tĩnh để đảm bảo không lỗi TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Thực hiện chạy `bunx tsc --noEmit` toàn dự án để verify tính đúng đắn của code TypeScript.
- Kiểm tra tính năng bằng cách chạy ứng dụng (sẽ do tester/user verify trực tiếp trên giao diện thực tế).

# VIII. Todo
- [ ] Tạo file [components/shared/CustomToaster.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/shared/CustomToaster.tsx) với logic click dismiss.
- [ ] Cập nhật [app/admin/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/layout.tsx) sử dụng component mới.
- [ ] Cập nhật [app/system/layout.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/layout.tsx) sử dụng component mới.
- [ ] Cập nhật [components/site/SiteProviders.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/SiteProviders.tsx) sử dụng component mới.
- [ ] Chạy check TypeScript `bunx tsc --noEmit` để verify toàn bộ dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Mọi thông báo hiển thị trên trang admin, system, hay client site đều có cursor là pointer khi di chuột qua thân thông báo.
- Click trực tiếp vào thân thông báo (không chứa button/link) sẽ làm thông báo đó biến mất ngay lập tức.
- Click vào nút hành động (như "Hủy" hoặc nút tương tự) vẫn thực hiện đúng hành động của nút đó.
- Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lệch index nếu có nhiều toast hiển thị cùng lúc ở nhiều vị trí khác nhau.
- **Giải pháp**: Logic đã được thiết kế để phân loại chính xác các toast theo `y-position` và `x-position` (ví dụ: `top-right`), do đó loại bỏ rủi ro lệch index giữa các vị trí render khác nhau.
- **Rollback**: Khôi phục lại import `<Toaster>` trực tiếp từ `'sonner'` ở 3 file layout.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi giao diện CSS của toast (giữ nguyên phong cách thiết kế hiện tại của dự án).
- Thay đổi logic tự động đóng (auto-close duration) của các API gọi toast hiện có trong code.

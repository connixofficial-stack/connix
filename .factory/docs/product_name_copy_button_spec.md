# I. Primer

## 1. TL;DR kiểu Feynman
Ở trang sửa sản phẩm (edit product), bên cạnh ô nhập "Tên sản phẩm" có một nút copy rất tiện giúp admin sao chép nhanh tên sản phẩm. Tuy nhiên, ở trang tạo sản phẩm (create product) lại chưa có nút này. 
Chúng ta sẽ thêm nút copy và logic tương ứng vào trang tạo sản phẩm để đảm bảo tính đồng bộ, nhất quán và mang lại trải nghiệm tiện lợi tối đa cho admin.

## 2. Elaboration & Self-Explanation
Hiện tại, trang tạo mới sản phẩm `app/admin/products/create/page.tsx` sử dụng thẻ `Input` đơn lẻ cho trường tên sản phẩm.
Chúng ta sẽ bọc thẻ `Input` này trong một div container cùng với một `Button` copy dạng icon (sử dụng icon `Copy` và `Check` khi đã copy thành công từ thư viện `lucide-react`).
Về mặt logic:
- Khai báo state `isNameCopied` để theo dõi trạng thái đã copy hay chưa.
- Hàm `handleCopyName` sử dụng `navigator.clipboard.writeText` để đưa tên sản phẩm vào clipboard của hệ điều hành và hiển thị thông báo toast thành công bằng tiếng Việt ("Đã copy tên sản phẩm"). Sau 2 giây, trạng thái sẽ tự động reset.
- Bổ sung import `Check` và `Copy` từ `lucide-react` để hiển thị trên nút bấm.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Khi admin đang ở trang tạo sản phẩm mới, sau khi gõ tên sản phẩm là "Rượu Vang Đỏ Thượng Hạng 2026", admin có thể bấm vào nút icon copy bên phải ô input. Ngay lập tức, hệ thống hiển thị thông báo "Đã copy tên sản phẩm", icon đổi thành dấu check xanh lá cây trong 2 giây rồi trở lại icon copy ban đầu. Admin có thể paste tên này vào bất cứ đâu khác rất tiện lợi.
- **Trực quan đời thực**: Nó giống như việc bạn điền form đăng ký thông tin ở quầy lễ tân. Thay vì phải lấy bút tự chép tay lại dòng tên dài dòng sang một tờ giấy khác, lễ tân đưa cho bạn một nút bấm thần kỳ, ấn một phát là thông tin đó tự động được ghi nhớ vào đầu bạn để sẵn sàng dùng ở chỗ khác.

# II. Audit Summary (Tóm tắt kiểm tra)
- Tệp tin chính chịu trách nhiệm giao diện tạo sản phẩm là [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx).
- Giao diện ô nhập tên sản phẩm nằm ở dòng 647-650 và hiện tại đang dùng Input độc lập.
- Thư viện `lucide-react` đã được import ở dòng 10 nhưng chưa bao gồm icon `Check` và `Copy`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng quan sát được**: Thiếu nút copy kế bên ô nhập tên sản phẩm ở trang create, trong khi trang edit lại có tính năng này.
- **Nguyên nhân gốc (Root Cause)**: Do thiết kế ban đầu của trang create chưa cập nhật đồng bộ các thay đổi tiện ích giao diện từ trang edit.
- **Giả thuyết đối chứng (Counter-Hypothesis)**: Bằng cách sao chép chính xác cấu trúc và logic UI của nút copy từ trang edit sang trang create, chúng ta sẽ tạo ra sự nhất quán hoàn hảo 1:1 giữa hai trang mà không ảnh hưởng đến bất kỳ API hay state nào khác của form tạo sản phẩm.

# IV. Proposal (Đề xuất)
1. Thêm import `Check` và `Copy` vào dòng import `lucide-react` ở đầu file `app/admin/products/create/page.tsx`.
2. Khai báo state `isNameCopied` trong component `ProductCreateContent`:
   ```typescript
   const [isNameCopied, setIsNameCopied] = useState(false);
   ```
3. Thêm hàm xử lý copy `handleCopyName`:
   ```typescript
   const handleCopyName = async () => {
     const trimmedName = name.trim();
     if (!trimmedName) return;
     try {
       await navigator.clipboard.writeText(trimmedName);
       setIsNameCopied(true);
       toast.success('Đã copy tên sản phẩm');
       setTimeout(() => { setIsNameCopied(false); }, 2000);
     } catch {
       toast.error('Không thể copy, vui lòng copy thủ công');
     }
   };
   ```
4. Cập nhật layout trường "Tên sản phẩm" thành một flex row chứa `Input` và `Button` copy.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  - Vai trò hiện tại: Trang giao diện tạo sản phẩm của quản trị viên.
  - Thay đổi: Tích hợp nút copy tên sản phẩm và logic đi kèm.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx) bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
2. Kiểm tra lại TypeScript compile để loại trừ lỗi cú pháp.
3. Chạy dev server kiểm chứng thực tế.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Typecheck**: Chạy `bunx tsc --noEmit` để đảm bảo import và React Component không gặp bất kỳ lỗi kiểu dữ liệu nào.
- **Manual Verification**: Kiểm tra trực quan bằng cách nhập tên ở trang create và bấm nút copy xem toast có hoạt động và dữ liệu có được copy thật sự không.

# VIII. Todo
- [ ] Import `Check` và `Copy` từ `lucide-react` trong file create page.
- [ ] Định nghĩa state `isNameCopied` và hàm `handleCopyName`.
- [ ] Sửa UI Input Tên sản phẩm sang dạng flex row cùng Button copy.
- [ ] Thực hiện chạy typecheck để đảm bảo an toàn.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Ô nhập "Tên sản phẩm *" có thêm nút copy dạng icon kế bên giống hệt trang edit.
- Bấm nút copy sẽ đưa nội dung ô nhập tên sản phẩm vào bộ nhớ tạm (clipboard).
- Hiện toast thông báo "Đã copy tên sản phẩm" khi thành công.
- Icon nút chuyển sang dấu Check màu xanh lá trong 2 giây rồi quay lại icon Copy ban đầu.
- Dự án không phát sinh lỗi compile TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Không có rủi ro về mặt logic luồng lưu dữ liệu vì nút copy độc lập hoàn toàn với việc submit form.
- **Hoàn tác**: Sử dụng `git checkout` để rollback file về trạng thái ban đầu nếu cần.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa trường tên của các thực thể khác ngoài sản phẩm (như bài viết, dịch vụ) trừ khi có yêu cầu thêm.

# Cấu hình SSH Key Nhiều Tài Khoản và Đẩy Dự Án system_thienkim Lên GitHub

Tài liệu này đặc tả quy trình và cách thức thực hiện cấu hình SSH Key mới cho tài khoản GitHub thứ hai (`lethuongwebthienkim-stack`), cấu hình định danh SSH trên Windows và thực hiện đẩy (push) mã nguồn dự án `system_thienkim` lên GitHub an toàn mà không làm ảnh hưởng đến tài khoản chính của bạn.

# I. Primer

## 1. TL;DR kiểu Feynman
Khi máy tính của bạn sử dụng nhiều tài khoản GitHub cùng lúc (ví dụ: tài khoản chính để đi làm và tài khoản phụ để làm dự án `system_thienkim`), Git sẽ bị bối rối không biết dùng chìa khóa (SSH Key) nào để mở cửa GitHub.
Giải pháp là:
- Chúng ta đúc một chìa khóa mới (SSH Key riêng cho Thiên Kim).
- Gắn một bảng tên (Host Alias) trong tệp cấu hình SSH của Windows.
- Khi đẩy code lên GitHub, chúng ta dùng địa chỉ đã gắn bảng tên đó. Git sẽ tự động chọn đúng chìa khóa để mở cửa mà không đụng chạm đến tài khoản chính của bạn.

## 2. Elaboration & Self-Explanation
Mặc định khi kết nối với GitHub qua SSH (`git@github.com:...`), SSH sẽ sử dụng khóa mặc định là `id_ed25519`. Nếu tài khoản GitHub phụ của bạn (`lethuongwebthienkim-stack`) không được cấp quyền cho khóa mặc định này, kết nối sẽ bị từ chối (Permission Denied).
Để giải quyết triệt để:
a) Chúng ta tạo cặp khóa mới mang tên `id_ed25519_lethuongwebthienkim_stack` tương thích thuật toán Ed25519 bảo mật và gọn nhẹ.
b) Chúng ta khai báo một máy chủ ảo trong cấu hình SSH (`C:\Users\VT5\.ssh\config`) với tên gọi là `github-lethuongwebthienkim-stack`. Khi bất kỳ câu lệnh Git nào gọi tới địa chỉ này, SSH sẽ tự động ánh xạ về `github.com` nhưng dùng đúng tệp khóa riêng tư này.
c) Lấy khóa công khai (Public Key) dán lên phần cấu hình SSH Keys của tài khoản GitHub tương ứng.
d) Cấu hình remote trong dự án trỏ tới `git@github-lethuongwebthienkim-stack:lethuongwebthienkim-stack/system_thienkim.git` thay vì `github.com` thông thường.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn có hai căn nhà:
- Căn nhà chính: Dùng chìa khóa nhà chính `id_ed25519`.
- Căn nhà thứ hai (Thiên Kim Wine): Dùng chìa khóa phụ `id_ed25519_lethuongwebthienkim_stack`.
Nếu bạn cầm chìa khóa nhà chính đến mở cửa căn nhà thứ hai, ổ khóa sẽ không khớp và bạn bị chặn lại. Bạn cần gắn một nhãn trên chùm chìa khóa ghi rõ "Khóa Thiên Kim" (Host Alias) và khi đến căn nhà thứ hai, bạn rút đúng chìa có nhãn đó để mở cửa.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra tệp cấu hình SSH hiện tại của bạn tại `C:\Users\VTOS\.ssh\config` và ghi nhận:
- File config đã tồn tại và đang quản lý nhiều tài khoản khác nhau rất khoa học như `github.com-trquocviet`, `github-hnkt9602`, `github-infoktecvina`, `github-tomone2kd000-ux`, và `github-thaivui5107-max`.
- SSH Agent đã được cấu hình hoạt động trên máy tính của bạn.
- Thư mục `.ssh` nằm tại `C:\Users\VTOS\.ssh` hoạt động bình thường.
- Kho lưu trữ Git hiện tại ở thư mục `system_thienkim` đã có 1 commit Squash hoàn chỉnh nhưng chưa có `remote` nào được cấu hình.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Vấn đề:** Bạn muốn đẩy mã nguồn lên GitHub phụ `git@github.com:lethuongwebthienkim-stack/system_thienkim.git` nhưng máy tính hiện đang dùng khóa SSH của tài khoản khác làm mặc định.
- **Giả thuyết đối chứng:** Nếu không cấu hình Host Alias và chỉ chạy lệnh `git push` mặc định, GitHub sẽ nhận diện bạn dưới danh nghĩa tài khoản mặc định và báo lỗi `Permission to lethuongwebthienkim-stack/system_thienkim.git denied to [tài khoản mặc định]`. Do đó, việc cấu hình SSH Config Host Alias là bắt buộc để phân tách quyền truy cập.

# IV. Proposal (Đề xuất)

1. **Đúc SSH Key mới:** Tạo khóa SSH Ed25519 với nhãn email `lethuongwebthienkim@gmail.com` tại đường dẫn `C:\Users\VTOS\.ssh\id_ed25519_lethuongwebthienkim_stack`.
2. **Khai báo trong SSH Config:** Thêm cấu hình Host Alias `github-lethuongwebthienkim-stack` trỏ tới khóa mới tạo vào cuối tệp `C:\Users\VTOS\.ssh\config`.
3. **Thêm khóa vào SSH Agent:** Đảm bảo hệ thống Windows nhận dạng khóa mới ngay lập tức.
4. **Xuất khóa công khai:** Đọc khóa công khai để người dùng sao chép lên GitHub.
5. **Cấu hình Git Remote & Push:** Khai báo remote sử dụng Host Alias và thực hiện đẩy nhánh `master` lên GitHub.

# V. Files Impacted (Tệp bị ảnh hưởng)

- `C:\Users\VTOS\.ssh\config`: Sửa - Thêm khối cấu hình Host `github-lethuongwebthienkim-stack`.
- `C:\Users\VTOS\.ssh\id_ed25519_lethuongwebthienkim_stack`: Thêm mới - Chứa khóa riêng tư (Private Key) mới.
- `C:\Users\VTOS\.ssh\id_ed25519_lethuongwebthienkim_stack.pub`: Thêm mới - Chứa khóa công khai (Public Key) mới để đưa lên GitHub.
- `e:\NextJS\job\job_from_system_vietadmin\system_thienkim\.git\config`: Sửa - Tự động cập nhật khi chạy lệnh `git remote add`.

# VI. Execution Preview (Xem trước thực thi)

1. Sinh khóa SSH Ed25519 mới không cần mật khẩu bảo vệ để tránh treo luồng.
2. Đọc tệp `config` hiện tại, chèn khối cấu hình cho `lethuongwebthienkim-stack` và ghi lại tệp.
3. Đăng ký khóa mới với `ssh-agent`.
4. In ra khóa công khai `.pub` cho người dùng.
5. Sau khi người dùng dán khóa lên GitHub, kiểm tra kết nối với `ssh -T`.
6. Thiết lập remote trỏ về Host Alias mới và chạy `git push -u origin master`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm thử tự động / Kiểm thử kết nối
- Chạy lệnh `ssh -T git@github-lethuongwebthienkim-stack` trong PowerShell. Kết quả mong đợi: GitHub trả về câu chào mừng `"Hi lethuongwebthienkim-stack! You've successfully authenticated..."`.
- Chạy lệnh `git remote -v` để kiểm tra remote đúng định dạng.

# VIII. Todo

- [ ] Tạo SSH Key mới `id_ed25519_lethuongwebthienkim_stack`
- [ ] Thêm cấu hình Host Alias vào tệp `C:\Users\VTOS\.ssh\config`
- [ ] Đăng ký khóa mới vào `ssh-agent`
- [ ] Lấy nội dung Public Key hiển thị cho người dùng
- [ ] Đợi người dùng cấu hình Public Key trên GitHub và xác nhận
- [ ] Kiểm tra kết nối SSH tới GitHub bằng Host Alias
- [ ] Thiết lập Remote URL mới sử dụng Host Alias trong dự án
- [ ] Thực hiện đẩy (push) code lên GitHub nhánh `master`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Khóa SSH mới được tạo thành công tại đúng thư mục `.ssh`.
- Tệp cấu hình SSH được cập nhật chính xác khối cấu hình tài khoản Thiên Kim Wine.
- Kết nối tới `git@github-lethuongwebthienkim-stack` thành công.
- Mã nguồn dự án `system_thienkim` được đẩy lên GitHub nhánh `master` chỉ bằng 1 câu lệnh push duy nhất qua Host Alias.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Ghi đè nhầm cấu hình SSH hiện tại của các tài khoản khác.
- **Hoàn tác:** Chúng ta sẽ ghi chèn (append) vào cuối tệp cấu hình, tuyệt đối không chạm vào các dòng cũ. Nếu có sự cố, chỉ cần xóa khối cấu hình Thiên Kim ở cuối file và xóa 2 tệp khóa SSH mới tạo là hệ thống quay lại trạng thái ban đầu 100%.

# XI. Out of Scope (Ngoài phạm vi)

- Không can thiệp vào các tài khoản SSH khác đang hoạt động trên máy tính của bạn.
- Không thay đổi cài đặt Git toàn cục (`git config --global`) để tránh ảnh hưởng đến các dự án khác.

# XII. Open Questions (Câu hỏi mở)

- Bạn muốn sử dụng email nào làm nhãn định danh cho SSH Key Thiên Kim? Hiện tại tôi đang sử dụng tạm thời `lethuongwebthienkim@gmail.com`. (Bạn có thể đổi nếu muốn, tuy nhiên nhãn email này chỉ có tác dụng chú thích, không ảnh hưởng đến hoạt động kỹ thuật của khóa).

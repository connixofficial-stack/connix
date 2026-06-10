# I. Primer

## 1. TL;DR kiểu Feynman
- Chúng ta có hai thư mục code: Thư mục Core (`system-vietadmin-nextjs`) và thư mục con đã được nâng cấp (`system_thanshoes`).
- Bây giờ, chúng ta muốn đưa toàn bộ những nâng cấp, cải tiến mới nhất từ `system_thanshoes` quay trở lại Core.
- Để làm điều này một cách sạch sẽ mà không làm rối lịch sử git (git history), chúng ta dùng phương pháp **Squash Merge**.
- Phương pháp này sẽ gom tất cả các thay đổi từ `system_thanshoes` lại thành một commit duy nhất và đè lên Core.
- Nếu có bất kỳ xung đột (conflict) nào xảy ra, chúng ta sẽ ưu tiên chọn hoàn toàn phiên bản mới nhất từ `system_thanshoes` (`git checkout --theirs .`).
- Cuối cùng, chúng ta cài đặt lại các thư viện bằng `bun install` để đảm bảo hệ thống chạy mượt mà.

## 2. Elaboration & Self-Explanation
- **Vấn đề**: Khi clone dự án con `system_thanshoes` từ commit đầu của Core, tác giả đã phát triển và nâng cấp rất nhiều tính năng, đặc biệt là các bảng dữ liệu trên `system_thanshoes`. Tuy nhiên, Core (`system-vietadmin-nextjs`) vẫn đang ở phiên bản cũ và chưa được cập nhật những cải tiến này.
- **Mục tiêu**: Đồng bộ hóa ngược (reverse-sync) từ `system_thanshoes` về lại Core.
- **Giải pháp**: Sử dụng Git Squash Merge.
  - Ta thêm repo `system_thanshoes` làm một remote tạm thời (`core-update`).
  - Lấy toàn bộ dữ liệu lịch sử từ remote này về máy.
  - Sử dụng lệnh `git merge --squash` để gộp toàn bộ sự khác biệt của nhánh `master` bên `system_thanshoes` vào nhánh `master` của Core hiện tại thành một thay đổi duy nhất chưa commit.
  - Để đảm bảo tính toàn vẹn và nhanh chóng, bất kỳ conflict nào xảy ra giữa hai bên sẽ được tự động giải quyết bằng cách lấy code của `system_thanshoes` (`--theirs`).
  - Lưu thay đổi bằng một commit duy nhất: `chore: sync and upgrade to latest Viet Admin core`.
  - Xóa remote tạm thời để dọn dẹp môi trường.
  - Cập nhật và cài đặt lại các dependency mới bằng `bun install`.

## 3. Concrete Examples & Analogies
- *Ví dụ thực tế*: Hãy tưởng tượng bạn có một cuốn sách giáo khoa bản gốc (Core). Bạn cho một người bạn mượn (clone thành `system_thanshoes`). Người bạn đó đã viết thêm rất nhiều ghi chú bổ ích, sửa các lỗi chính tả và cập nhật thêm các chương mới trực tiếp vào cuốn sách đó. Bây giờ, bạn muốn tạo ra một phiên bản sách giáo khoa mới bao gồm tất cả các ghi chú, chỉnh sửa đó của người bạn mà không cần phải tự tay chép lại từng chữ. Squash merge giống như việc bạn chụp ảnh toàn bộ các trang sách đã chỉnh sửa của người bạn và dán đè lên cuốn sách cũ của bạn, tạo thành một ấn bản nâng cấp hoàn hảo chỉ trong một lần thực hiện.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Nhánh hiện tại của Core (`system-vietadmin-nextjs`)**: `master` (working tree clean, nothing to commit).
- **Nhánh hiện tại của nguồn nâng cấp (`system_thanshoes`)**: `master` (working tree clean, nothing to commit).
- **Đường dẫn nguồn nâng cấp**: `E:\NextJS\job\job_from_system_vietadmin\system_thanshoes`.
- **Remote tạm thời cần thêm**: `core-update`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Lý do thực hiện**: Core bị tụt hậu so với nhánh phát triển thực tế của dự án `system_thanshoes`.
- **Giả thuyết đối chứng**: Nếu merge bình thường (`git merge` không squash), lịch sử commit của dự án Core sẽ bị trộn lẫn với các commit vụn vặt từ `system_thanshoes`, gây khó khăn cho việc quản lý mã nguồn core sạch sẽ sau này. Việc sử dụng `git merge --squash` là tối ưu nhất vì nó đóng gói tất cả thay đổi thành 1 commit duy nhất mang tính cột mốc (milestone commit).
- **Giải quyết conflict**: Dùng `git checkout --theirs .` để đảm bảo code của `system_thanshoes` được đè lên hoàn toàn, giải quyết triệt để các conflict phát sinh do sai lệch lịch sử git (`--allow-unrelated-histories`).

# IV. Proposal (Đề xuất)

Thực hiện đúng các bước theo quy trình đã được hướng dẫn, cấu hình đường dẫn và tên nhánh chính xác:
1. `git remote add core-update "E:\NextJS\job\job_from_system_vietadmin\system_thanshoes"`
2. `git fetch core-update`
3. `git merge --squash core-update/master --allow-unrelated-histories` (nhánh chính là `master`)
4. `git checkout --theirs .`
5. `git add .`
6. `git commit -m "chore: sync and upgrade to latest Viet Admin core"`
7. `git remote remove core-update`
8. `bun install`

# V. Files Impacted (Tệp bị ảnh hưởng)

Sẽ ảnh hưởng đến toàn bộ các tệp nguồn trong workspace `system-vietadmin-nextjs` có sự khác biệt so với `system_thanshoes` (đặc biệt là các thư mục components, pages, package.json, cấu hình, v.v.). Các tệp này sẽ được cập nhật hoàn toàn lên phiên bản mới nhất từ `system_thanshoes`.

# VI. Execution Preview (Xem trước thực thi)

1. Tạo thư mục `.factory/docs` và lưu tài liệu Spec nâng cấp.
2. Tạo Implementation Plan và Task List để người dùng duyệt.
3. Sau khi được duyệt, thực hiện các lệnh git squash merge.
4. Chạy `git checkout --theirs .` để giải quyết conflict.
5. Commit thay đổi và xóa remote tạm thời.
6. Cài đặt lại thư viện bằng `bun install`.
7. Kiểm tra trạng thái build/typecheck tĩnh bằng `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Chạy `bunx tsc --noEmit` để kiểm tra lỗi TypeScript sau khi merge (chỉ chạy kiểm tra tĩnh, pipe qua `2>&1 | Select-Object -First 10` như rule yêu cầu).
- Kiểm tra `git status` và `git log -n 1` để xác nhận commit squash merge thành công.

# VIII. Todo

- `[ ]` Tạo Spec tại `.factory/docs/upgrade_core_spec.md`
- `[ ]` Thêm remote tạm thời chỉ tới `system_thanshoes`
- `[ ]` Fetch dữ liệu từ remote tạm thời
- `[ ]` Tiến hành Squash Merge với `--allow-unrelated-histories`
- `[ ]` Giải quyết conflict bằng cách chọn code của bên remote (`--theirs`)
- `[ ]` Commit thay đổi
- `[ ]` Xóa remote tạm thời
- `[ ]` Cài đặt các thư viện mới (`bun install`)
- `[ ]` Chạy typecheck kiểm tra (`bunx tsc --noEmit`)

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `git status` sạch sẽ.
- Commit mới nhất là `chore: sync and upgrade to latest Viet Admin core`.
- Dự án build/typecheck tĩnh không có lỗi nghiêm trọng cản trở khởi động.
- Không còn remote `core-update`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Có thể có các file cấu hình môi trường local bị đè.
- **Hoàn tác (Rollback)**: Vì trước khi làm working tree sạch sẽ, nếu xảy ra lỗi giữa chừng, ta có thể rollback cực kỳ đơn giản bằng:
  `git merge --abort` hoặc `git reset --hard HEAD` để quay về trạng thái ban đầu.

# XI. Out of Scope (Ngoài phạm vi)

- Không sửa lỗi logic nghiệp vụ phát sinh sau merge (nếu có) trong phạm vi task này trừ khi đó là lỗi cú pháp cơ bản ngăn cản dự án khởi động. Các lỗi logic khác sẽ được xử lý trong các task riêng biệt.

# I. Primer

## 1. TL;DR kiểu Feynman
* Chúng ta có hai chiếc hộp chứa mã nguồn: Hộp A (`system-vietadmin-nextjs`) là bản gốc cũ, và Hộp B (`system_thanshoes`) là bản được phát triển thêm nhiều tính năng mới từ Hộp A.
* Bây giờ, chúng ta muốn mang toàn bộ những cải tiến mới từ Hộp B bỏ vào Hộp A để Hộp A cũng hiện đại như Hộp B.
* Để làm việc này mà không bị rối loạn lịch sử commit, chúng ta sẽ gom toàn bộ các thay đổi ở Hộp B thành một "cục" duy nhất (Squash) rồi đè thẳng lên Hộp A.
* Nếu có bất kỳ sự xung đột (Conflict) nào giữa hai bên, chúng ta sẽ chọn hoàn toàn phiên bản mới từ Hộp B (`--theirs`).
* Cuối cùng, chúng ta cài đặt lại các thư viện mới (`bun install`) và quét dọn các lỗi cú pháp/kiểu dữ liệu bằng công cụ kiểm tra tự động (`oxlint --fix`).

## 2. Elaboration & Self-Explanation
Mục tiêu của nhiệm vụ này là đồng bộ ngược (backport) các thay đổi và tính năng mới từ dự án con `system_thanshoes` về lại dự án gốc `system-vietadmin-nextjs` (đóng vai trò là core). 
Để thực hiện việc này, chúng ta sử dụng cơ chế Git Remote tạm thời để kết nối hai kho chứa cục bộ. Bằng việc thực hiện `git merge --squash`, Git sẽ so sánh sự khác biệt và gom tất cả các commit mới từ dự án nguồn thành một thay đổi chưa commit duy nhất trên dự án đích. 
Do hai dự án đã phân tách một thời gian, chắc chắn sẽ xuất hiện xung đột (conflicts). Quy tắc xử lý xung đột ở đây là ưu tiên tuyệt đối code mới từ dự án nguồn, sử dụng lệnh `git checkout --theirs .` để áp dụng bản mới cho toàn bộ các file bị xung đột. Sau khi dọn dẹp Git Remote và tạo commit hoàn tất, chúng ta cập nhật các gói phụ thuộc để đảm bảo ứng dụng có đủ thư viện chạy. Bước cuối cùng là dùng `oxlint --fix` để tự động phát hiện và sửa các lỗi type/lint phát sinh do sự khác biệt giữa hai codebase.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang viết một cuốn sách hướng dẫn (VietAdmin Core). Bạn gửi một bản sao cuốn sách này cho một người bạn. Người bạn đó đã chỉnh sửa, thêm bớt rất nhiều chương mới, sửa lỗi chính tả và nâng cấp cuốn sách đó thành phiên bản cực kỳ xịn (ThanShoes). 
Bây giờ, bạn muốn cuốn sách gốc của mình cũng có đầy đủ các nội dung xịn đó. Thay vì đi tìm từng trang để chép tay lại, bạn lấy toàn bộ nội dung cuốn sách mới của bạn mình, dùng kéo dán đè tất cả các trang mới lên cuốn sách cũ của bạn. Nếu trang nào cả hai người cùng sửa mà khác nhau, bạn mặc định xé trang cũ đi và dán trang của người bạn vào (`--theirs`). Cuối cùng, bạn soát lại lỗi chính tả toàn bộ cuốn sách bằng một cây bút màu đỏ tự động (`oxlint`).

# II. Audit Summary (Tóm tắt kiểm tra)
* **Thư mục hiện tại (Đích):** `e:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs` (Nhánh: `master`, Trạng thái: Sạch - clean).
* **Thư mục nguồn (Mới):** `E:\NextJS\job\job_from_system_vietadmin\system_thanshoes` (Nhánh: `master`, Trạng thái: Sạch - clean).
* **Công cụ quản lý gói:** Sử dụng `bun`.
* **Kiểm tra linter:** Dự án nguồn và đích đều hỗ trợ `oxlint` hoặc các quy tắc kiểm tra tĩnh.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Vấn đề:** Dự án VietAdmin Core hiện tại đang bị tụt hậu so với nhánh phát triển thực tế `system_thanshoes`. Nhiều tính năng, tối ưu hóa và sửa lỗi ở `system_thanshoes` chưa được tích hợp ngược lại Core.
* **Độ tin cậy nguyên nhân gốc:** High (Vì `system_thanshoes` được phát triển trực tiếp từ Core này và đã chạy ổn định với các nâng cấp mới).
* **Giả thuyết đối chứng:** Nếu thực hiện merge thông thường (non-squash merge), lịch sử commit của Core sẽ bị xáo trộn bởi các commit thử nghiệm hoặc commit không liên quan từ `system_thanshoes`. Việc sử dụng `git merge --squash` loại bỏ rủi ro này bằng cách gom toàn bộ thay đổi thành 1 commit duy nhất, giúp giữ lịch sử Core sạch sẽ.

# IV. Proposal (Đề xuất)
Thực hiện nâng cấp thông qua quy trình 5 bước:
1. Thêm remote tạm thời trỏ đến thư mục `system_thanshoes`.
2. Fetch dữ liệu lịch sử từ remote này.
3. Thực hiện Squash Merge từ remote `core-update/master`.
4. Giải quyết triệt để conflict bằng cách chọn code của remote nguồn (`--theirs`).
5. Tạo commit hoàn tất nâng cấp, dọn dẹp remote, chạy `bun install` và liên tục chạy `bunx oxlint --type-aware --type-check --fix` cho đến khi không còn lỗi.

# V. Files Impacted (Tệp bị ảnh hưởng)
Do đây là quá trình đồng bộ hóa toàn bộ dự án (Squash Merge), hầu hết các tệp nguồn trong dự án sẽ bị ảnh hưởng (sửa đổi hoặc thêm mới).
* **Sửa/Thêm:** Toàn bộ cấu trúc thư mục bao gồm `app/`, `components/`, `convex/`, `package.json`, v.v. từ dự án `system_thanshoes` sẽ được áp dụng vào dự án hiện tại.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm remote: `git remote add core-update "E:\NextJS\job\job_from_system_vietadmin\system_thanshoes"`
2. Fetch: `git fetch core-update`
3. Merge: `git merge --squash core-update/master --allow-unrelated-histories`
4. Giải quyết conflict: `git checkout --theirs .` và `git add .`
5. Commit: `git commit -m "chore: sync and upgrade to latest Viet Admin core"`
6. Xóa remote: `git remote remove core-update`
7. Cài đặt dependency: `bun install`
8. Chạy sửa lỗi lint: `bunx oxlint --type-aware --type-check --fix` cho đến khi sạch lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Tự động:**
  * Chạy `bunx oxlint --type-aware --type-check` để đảm bảo không còn lỗi cú pháp/lint nào.
  * Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để kiểm tra kiểu dữ liệu TypeScript.
* **Thủ công (Ủy quyền cho Tester/User):**
  * Khởi động server bằng `bun run dev` để kiểm tra giao diện và hoạt động cơ bản.

# VIII. Todo
- [ ] Thêm git remote tạm thời trỏ tới dự án `system_thanshoes`
- [ ] Fetch lịch sử từ remote `core-update`
- [ ] Thực hiện squash merge nhánh `core-update/master` vào nhánh hiện tại
- [ ] Giải quyết toàn bộ xung đột bằng cách nhận code mới (`checkout --theirs`)
- [ ] Add các file đã giải quyết xung đột và tạo commit nâng cấp
- [ ] Xóa remote tạm thời `core-update`
- [ ] Chạy `bun install` để cài đặt các package mới
- [ ] Chạy kiểm tra và sửa lỗi tự động bằng `oxlint` cho đến khi sạch lỗi

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
1. Tiến trình squash merge hoàn thành mà không để lại bất kỳ file nào ở trạng thái xung đột (unresolved conflict).
2. Lịch sử commit có thêm commit nâng cấp `chore: sync and upgrade to latest Viet Admin core`.
3. Lệnh `bun install` thực thi thành công, không bị lỗi cài đặt package.
4. Lệnh `bunx oxlint --type-aware --type-check` trả về kết quả không có lỗi (hoặc đã được sửa tối đa lỗi thông qua flag `--fix`).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Một số cấu hình đặc thù cục bộ của Core (nếu có) có thể bị đè ghi hoàn toàn bởi code mới của `system_thanshoes`.
* **Hoàn tác:** Vì chúng ta chưa push lên remote, nếu gặp sự cố nghiêm trọng, ta có thể dễ dàng khôi phục trạng thái ban đầu bằng lệnh:
  `git reset --hard HEAD` (hoặc commit hash trước khi merge).

# XI. Out of Scope (Ngoài phạm vi)
* Tự động triển khai dự án lên môi trường staging hoặc production.
* Viết thêm các test case mới ngoài việc sửa lỗi lint hiện có.

# XII. Open Questions (Câu hỏi mở)
* Không có câu hỏi mở nào ở thời điểm hiện tại vì quy trình đã được người dùng chỉ định rõ ràng.

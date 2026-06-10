# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta có một phần mềm quản trị (Viet Admin Core) đang chạy trên một trang web cũ. Gần đây, phiên bản Core này đã được cải tiến và nâng cấp rất nhiều tính năng mới ở một dự án khác tên là `system_thienkim`. Nhiệm vụ của chúng ta là lấy toàn bộ những cải tiến mới đó đè lên mã nguồn trang web hiện tại (đồng bộ code), sau đó kiểm tra xem dữ liệu trong cơ sở dữ liệu cũ có bị thiếu hụt gì so với cấu trúc mới hay không và bổ sung (backfill) cho khớp, đảm bảo trang web cũ hoạt động mượt mà với phiên bản mới mà không làm mất dữ liệu của khách hàng.

## 2. Elaboration & Self-Explanation
Quá trình này được thực hiện qua hai bước độc lập và nghiêm ngặt:
- **Bước 1 (Đồng bộ Code):** Chúng ta liên kết tạm thời mã nguồn hiện tại với thư mục chứa code mới (`system_thienkim`). Sau đó, dùng Git để gộp tất cả thay đổi lại (Squash Merge). Nếu xảy ra bất kỳ xung đột nào giữa code cũ và code mới, chúng ta mặc định chọn hoàn toàn code mới (`checkout --theirs`). Tiếp theo, chúng ta chạy trình kiểm tra lỗi lập trình (`tsc`) và lỗi định dạng (`oxlint`) cho đến khi hoàn toàn sạch lỗi rồi mới lưu lại (Commit).
- **Bước 2 (Cập nhật Dữ liệu - DB Migration):** Sau khi code đã lên đời mới nhất, cấu trúc dữ liệu mong muốn (Schema) cũng thay đổi theo. Chúng ta không tự ý sửa code hay viết lệnh tạo bảng mới. Thay vào đó, chúng ta chạy tính năng quét dữ liệu (`scanDataContracts`) để tìm xem dữ liệu thực tế hiện tại thiếu những cột/trường nào so với yêu cầu mới, sau đó dùng các hàm sửa đổi dữ liệu đã có sẵn trong mã nguồn để bổ sung những phần thiếu này (Backfill) theo từng nhóm nhỏ.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế:** Tưởng tượng bạn có một chiếc điện thoại cũ (Dự án hiện tại) đang dùng hệ điều hành phiên bản 1.0. Ở một chiếc điện thoại mẫu khác (Dự án `system_thienkim`), hãng đã phát triển phiên bản 2.0 tối ưu hơn rất nhiều. Việc chúng ta làm là chép đè hệ điều hành 2.0 lên chiếc điện thoại cũ. Sau khi nâng cấp hệ điều hành, các ứng dụng danh bạ hoặc tin nhắn có thể yêu cầu thêm các trường thông tin mới (ví dụ trước đây chỉ cần số điện thoại, nay hệ điều hành 2.0 yêu cầu thêm cả mã quốc gia). Chúng ta sẽ quét qua danh bạ cũ, tìm những số thiếu mã quốc gia và tự động điền thêm vào cho đúng chuẩn mới, giúp máy hoạt động ổn định.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Mã nguồn hiện tại:** Nằm ở thư mục `e:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`. Git status cho thấy thư mục làm việc sạch sẽ (`working tree clean`).
- **Thư mục Core mới:** Nằm ở đường dẫn `E:\NextJS\job\job_from_system_vietadmin\system_thienkim`. Thư mục này cũng là một Git repository hợp lệ và chứa phiên bản mã nguồn mới nhất.
- **Cơ sở dữ liệu (Convex Deployment):** Dự án hiện tại đang kết nối với cơ sở dữ liệu môi trường phát triển `dev:bright-chicken-833` thông qua file cấu hình `.env.local`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Đây là tác vụ nâng cấp định kỳ và đồng bộ hóa hệ thống cốt lõi (Core), không phải xử lý một lỗi đơn lẻ (bug fix). 
- **Giả thuyết đối chứng:** Nếu chúng ta tự ý sửa code thủ công khi gộp mã nguồn, khả năng cao sẽ tạo ra sự bất nhất về logic hoặc sót các tính năng mới đã được kiểm thử kỹ càng ở bản `system_thienkim`. Do đó, quy tắc tối thượng là "luôn nhận toàn bộ từ Core" (`checkout --theirs`) và giải quyết triệt để lỗi kiểu (type errors) bằng `tsc`.

# IV. Proposal (Đề xuất)
Thực hiện đúng quy trình 2 giai đoạn do người dùng yêu cầu:
1. **Giai đoạn 1 (Sync Code):**
   - Thêm remote tạm thời `core-update` trỏ đến `E:/NextJS/job/job_from_system_vietadmin/system_thienkim`.
   - Fetch dữ liệu và squash merge branch chính (mặc định là `master` hoặc `main`).
   - Xử lý conflict bằng cách chọn toàn bộ code từ remote `core-update`.
   - Chạy kiểm tra tĩnh (`bunx tsc --noEmit` và `bunx oxlint --type-aware --type-check --fix`). Sửa các lỗi phát sinh (nếu có) cho đến khi đạt trạng thái 0 lỗi.
   - Commit thay đổi và gỡ remote tạm.
   - Cài đặt lại các gói thư viện (`bun install`).
2. **Giai đoạn 2 (Data Ops):**
   - Xác nhận deployment `dev:bright-chicken-833`.
   - Quét sự tương thích dữ liệu thực tế bằng hàm quét hợp đồng dữ liệu có sẵn.
   - Chạy các hàm backfill có sẵn trong codebase để đưa dữ liệu cũ về chuẩn dữ liệu mới.
   - Xác minh lại sự toàn vẹn của dữ liệu và hệ thống.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa/Đè toàn bộ dự án:** Do thực hiện gộp mã nguồn diện rộng từ Core mới, hầu hết các tệp tin trong các thư mục `app/`, `components/`, `convex/`, `lib/`, `types/` và các file cấu hình hệ thống (`package.json`, `tsconfig.json`...) đều có thể được cập nhật hoặc thay thế để đồng bộ với `system_thienkim`.

# VI. Execution Preview (Xem trước thực thi)
1. Chạy lệnh Git để thêm remote, fetch và thực hiện squash merge.
2. Xử lý conflict bằng lệnh `git checkout --theirs .` để ghi đè toàn bộ code mới.
3. Chạy kiểm tra type và lint, sửa lỗi nếu có.
4. Commit thay đổi mã nguồn.
5. Xóa remote tạm và cài lại dependency bằng `bun install`.
6. Chạy ứng dụng ở chế độ dev để kiểm tra runtime ban đầu.
7. Chạy scan và thực hiện backfill dữ liệu Convex.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Automated Verification:**
  - Chạy `bunx tsc --noEmit` để xác nhận không còn lỗi kiểu dữ liệu.
  - Chạy `bunx oxlint --type-aware --type-check` để xác nhận không còn lỗi linting.
  - Quét Convex contracts bằng function scan tích hợp.
- **Manual Verification:**
  - Khởi động dự án bằng `bun run dev` xem có lỗi crash không.
  - Thao tác nhanh trên UI quản trị (Products, Home Components, Settings) để đảm bảo dữ liệu render đúng cấu trúc.

# VIII. Todo
- [ ] Thêm remote tạm thời trỏ đến `E:\NextJS\job\job_from_system_vietadmin\system_thienkim`.
- [ ] Fetch lịch sử code từ remote mới.
- [ ] Thực hiện squash merge từ branch chính của remote vào branch hiện tại.
- [ ] Chạy `git checkout --theirs .` để tự động chọn code mới từ remote cho tất cả các file.
- [ ] Thực hiện add toàn bộ file vào stage (`git add .`).
- [ ] Chạy `bunx tsc --noEmit` để kiểm tra lỗi type.
- [ ] Chạy `bunx oxlint --type-aware --type-check --fix` để định dạng và sửa lỗi lint tự động.
- [ ] Tiến hành commit chốt giai đoạn 1.
- [ ] Gỡ bỏ remote tạm thời.
- [ ] Cài đặt lại các gói phụ thuộc bằng `bun install`.
- [ ] Chạy thử ứng dụng bằng `bun run dev` để kiểm tra runtime.
- [ ] Đọc cấu hình và xác nhận Convex deployment.
- [ ] Chạy scan contract để kiểm tra tính tương thích dữ liệu.
- [ ] Thực hiện chạy các hàm backfill/migration có sẵn trên DB.
- [ ] Quét lại contract để đảm bảo không còn cảnh báo hoặc lỗi dữ liệu.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Mã nguồn được đồng bộ hoàn toàn với bản `system_thienkim`.
- Lệnh `bunx tsc --noEmit` kết thúc thành công với 0 lỗi.
- Lệnh `bunx oxlint` kết thúc thành công với 0 lỗi.
- Ứng dụng khởi động bình thường qua `bun run dev`.
- Quá trình scan contract dữ liệu Convex hoàn thành và không phát hiện các trường lỗi thời nghiêm trọng hay thiếu trường bắt buộc (`0 issues / 0 warnings`).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một số file cấu hình riêng biệt hoặc file môi trường cục bộ bị ghi đè gây mất cấu hình kết nối.
- **Cách hạn chế:** File `.env.local` không nằm trong git tracking nên sẽ an toàn. Nếu các file cấu hình khác bị ghi đè sai lệch, ta có thể dùng `git checkout HEAD <file>` trước khi commit để khôi phục.
- **Rollback:** Nếu quá trình merge gặp lỗi không thể giải quyết hoặc runtime bị crash nghiêm trọng, ta có thể thực hiện `git merge --abort` hoặc `git reset --hard HEAD` để quay lại trạng thái sạch ban đầu của workspace.

# XI. Out of Scope (Ngoài phạm vi)
- Không tự ý chỉnh sửa logic code, giao diện UI hoặc các tính năng nghiệp vụ của ứng dụng ngoài việc đồng bộ từ Core.
- Không tự viết script migrate dữ liệu Convex tự chế; chỉ dùng các function có sẵn trong codebase.

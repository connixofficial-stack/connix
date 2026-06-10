# I. Primer

## 1. TL;DR kiểu Feynman
* Dự án hiện tại (`system-dien-tran`) sử dụng chung lõi (core) với dự án gốc `system-vietadmin-nextjs`.
* Dự án core gốc đã có nhiều cập nhật mới, cần được đồng bộ sang dự án hiện tại để thừa hưởng các tối ưu và sửa lỗi.
* Quá trình đồng bộ được thực hiện bằng Git squash merge để gộp toàn bộ thay đổi thành 1 commit duy nhất và lấy code core đè lên toàn bộ code cũ.
* Sau khi đồng bộ, chạy kiểm tra kiểu TypeScript (`tsc`) và lint (`oxlint`), sửa các lỗi tĩnh nếu có trước khi commit.
* Tiếp theo, thực hiện kiểm tra và migrate/backfill dữ liệu Convex DB cũ của dự án hiện tại cho tương thích hoàn toàn với schema mới thông qua các hàm có sẵn.

## 2. Elaboration & Self-Explanation
Dự án `system-dien-tran` được phát triển dựa trên nền tảng (core) của dự án `system-vietadmin-nextjs`. Theo thời gian, dự án core đã được tối ưu hóa, sửa lỗi, và bổ sung tính năng mới. Để dự án hiện tại thừa hưởng các nâng cấp này, chúng ta cần kéo toàn bộ mã nguồn mới nhất từ repo core về.
Thay vì ghép nối thủ công dễ gây ra lỗi không tương thích, ta sử dụng Git để squash merge từ repo core vào. Ta sẽ thêm remote trỏ tới thư mục của repo core, fetch lịch sử, sau đó chạy merge với tùy chọn `--squash` và `--allow-unrelated-histories` để tạo ra một trạng thái merge tạm thời. Để giải quyết conflict một cách tuyệt đối theo hướng "nhận toàn bộ từ Core", ta checkout toàn bộ file conflict theo nhánh của Core (`--theirs`).
Sau khi code đã được đồng bộ, ta cài đặt lại các thư viện (`bun install`) và thực hiện kiểm tra tĩnh (static check) bằng `bunx tsc --noEmit` để phát hiện lỗi kiểu dữ liệu TypeScript, và `bunx oxlint --type-aware --type-check --fix` để định dạng và sửa các lỗi linting tự động. Chỉ khi hệ thống sạch lỗi ta mới commit.
Đối với dữ liệu Convex DB, do cấu trúc DB có thể thay đổi sau khi đồng bộ mã nguồn core mới, ta cần chạy quy trình rà soát dữ liệu (data contract check) và chạy các hàm backfill được viết sẵn để chuyển đổi dữ liệu cũ sang cấu trúc mới mà không làm mất thông tin cũ của khách hàng.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Giả sử trong core mới, table `products` yêu cầu thêm trường `status` với giá trị mặc định là `"active"`. Khi sync code mới về, mã nguồn frontend và backend (Convex schema) sẽ bắt buộc phải có trường này. Tuy nhiên, DB hiện tại của `system-dien-tran` chưa có trường `status` cho các sản phẩm cũ. Ta sẽ chạy function `dataManager:scanDataContracts` để phát hiện ra sự thiếu sót này (missing field `status` ở table `products`). Sau đó, chạy một mutation backfill có sẵn (ví dụ: `backfillProductsStatus`) để cập nhật trường `status: "active"` cho toàn bộ sản phẩm cũ trong DB mà không đụng vào các trường khác.
* **Phép so sánh đời thường:** Giống như bạn đang chạy một chuỗi cửa hàng trà sữa nhượng quyền thương hiệu (như `system-dien-tran`) dùng chung công thức và quy trình từ tổng công ty (`core`). Khi tổng công ty cập nhật menu mới và hệ thống quản lý mới (nâng cấp core), bạn cần cập nhật lại toàn bộ phần mềm bán hàng ở cửa hàng của mình theo tổng công ty. Đồng thời, bạn phải kiểm tra và cập nhật lại danh sách nguyên liệu và nhãn mác cũ trong kho (dữ liệu DB cũ) sao cho khớp với menu mới để hệ thống hoạt động trơn tru mà không làm mất đi các khách hàng hiện tại.

# II. Audit Summary (Tóm tắt kiểm tra)
* Workspace hiện tại: `e:\NextJS\job\job_from_system_vietadmin\system-dien-tran`.
* Trạng thái Git: `working tree clean` trên branch `master`.
* Đường dẫn repo Core: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.
* Tên deployment Convex: `dev:watchful-turtle-840` (xác nhận trong `.env.local`).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* Độ tin cậy nguyên nhân gốc: **High** (Đây là tác vụ nâng cấp đồng bộ core định kỳ theo yêu cầu nghiệp vụ để giữ mã nguồn đồng bộ với phiên bản lõi mới nhất).
* Giả thuyết đối chứng: Nếu thực hiện merge thông thường (không squash), lịch sử git sẽ bị lẫn lộn giữa hai dự án có lịch sử khác nhau, dẫn đến conflict phức tạp và khó quản lý. Sử dụng `--squash` giúp gom toàn bộ thay đổi thành 1 commit duy nhất, giúp lịch sử commit của dự án đích sạch sẽ và dễ dàng rollback nếu có sự cố.

# IV. Proposal (Đề xuất)
* Thực hiện đúng 2 Phase trong quy trình nâng cấp core:
  * **Phase 1 — Sync Code Mới:** Thêm remote tạm trỏ tới thư mục core, fetch, squash merge, ưu tiên nhận toàn bộ file từ core (`git checkout --theirs .`), cài dependency, chạy type-check & lint fix cho đến khi sạch lỗi, sau đó commit và dọn dẹp remote.
  * **Phase 2 — Migrate/Backfill Convex DB:** Chạy quét data contract, chạy các function backfill tương ứng để giải quyết các trường bị thiếu hoặc lỗi thời trên DB của deployment `dev:watchful-turtle-840`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* Vì đây là quá trình squash merge toàn bộ core từ dự án khác, số lượng file bị ảnh hưởng là rất lớn (toàn bộ codebase).
* **Sửa/Thêm/Xóa:** Toàn bộ các tệp nguồn trong `app/`, `convex/`, `components/`, `lib/`, `types/`, `package.json`, v.v. được đồng bộ trực tiếp từ repo Core `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm remote `core-update` trỏ tới `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.
2. Fetch remote `core-update`.
3. Squash merge từ `core-update/main` (hoặc `master`).
4. Chấp nhận toàn bộ thay đổi từ core bằng `git checkout --theirs .`.
5. Cài đặt lại các package bằng `bun install`.
6. Chạy `bunx tsc --noEmit` và `bunx oxlint --type-aware --type-check --fix` để sửa các lỗi tĩnh.
7. Commit các thay đổi với message `chore: sync and upgrade to latest Viet Admin core`.
8. Gỡ bỏ remote `core-update`.
9. Chạy thử local server (`bun run dev`) và tiến hành Phase 2: kiểm tra và backfill dữ liệu Convex DB qua các function có sẵn.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh (Static check):** Chạy `bunx tsc --noEmit` và `bunx oxlint --type-aware --type-check --fix` không có lỗi.
* **Kiểm tra runtime:** Local server chạy bình thường bằng `bun run dev`.
* **Kiểm tra dữ liệu:** Chạy function quét dữ liệu Convex, đảm bảo kết quả trả về không có lỗi legacy (`0 issues / 0 warnings`).

# VIII. Todo
- [ ] Thực hiện Phase 1: Đồng bộ code từ Core qua Git Squash Merge.
  - [ ] Thêm remote `core-update` trỏ tới `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.
  - [ ] Fetch dữ liệu từ `core-update`.
  - [ ] Squash merge `core-update/main` (hoặc `master`).
  - [ ] Checkout ghi đè toàn bộ bằng `--theirs .`.
  - [ ] Cài đặt lại dependencies (`bun install`).
  - [ ] Sửa lỗi TypeScript và Linting.
  - [ ] Commit thay đổi và dọn dẹp remote.
- [ ] Thực hiện Phase 2: Migrate và Backfill Convex DB.
  - [ ] Đọc config để xác nhận đúng deployment `dev:watchful-turtle-840`.
  - [ ] Quét lỗi cấu trúc dữ liệu qua `dataManager:scanDataContracts`.
  - [ ] Thực thi các hàm backfill có sẵn để giải quyết các lỗi cấu trúc dữ liệu.
  - [ ] Verify lại để đảm bảo 0 issues.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Mã nguồn được đồng bộ thành công, không còn lỗi TypeScript hay Lint.
* Convex DB được cập nhật hoàn chỉnh, tương thích với schema mới, `scanDataContracts` không có cảnh báo.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Merge squash đè lên toàn bộ file có thể làm mất các cấu hình đặc thù của `system-dien-tran` nếu có.
* **Hoàn tác:** Vì chúng ta làm việc trên Git sạch, nếu có lỗi phát sinh trong quá trình merge, ta có thể dễ dàng rollback bằng `git merge --abort` hoặc reset về commit trước đó (`git reset --hard HEAD`).

# XI. Out of Scope (Ngoài phạm vi)
* Không phát triển thêm tính năng mới trong quá trình nâng cấp core.
* Không tự ý viết thêm migration script hoặc sửa schema của Convex DB thủ công.

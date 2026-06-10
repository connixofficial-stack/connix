# I. Primer

## 1. TL;DR kiểu Feynman
Việc nâng cấp này giống như việc thay thế toàn bộ động cơ (mã nguồn frontend và backend) của chiếc xe hiện tại bằng một động cơ mới, hiện đại hơn được lấy từ chiếc xe Dohy (`system_dohy`). Tuy nhiên, chúng ta vẫn giữ nguyên bình chứa nhiên liệu cũ (Convex DB hiện tại). Sau khi lắp động cơ mới, chúng ta cần cắm các đầu nối điện và ống dẫn cho khớp (migrate/backfill data cũ cho tương thích với schema mới của động cơ) và dọn dẹp các đường ống thừa không dùng nữa (deprecated fields).

## 2. Elaboration & Self-Explanation
Quá trình này bao gồm 2 giai đoạn chính:
- **Phase 1: Đồng bộ mã nguồn (Sync Code)**: Sử dụng Git để squash merge từ kho mã nguồn Dohy (`E:\NextJS\job\job_from_system_vietadmin\system_dohy`). Khi có xung đột (conflict), chúng ta hoàn toàn chấp nhận code mới từ Dohy bằng lệnh `git checkout --theirs .` vì Dohy đóng vai trò là "Core chuẩn mới". Tiếp theo, chạy công cụ kiểm tra tĩnh (`tsc --noEmit` và `oxlint`) để đảm bảo mã nguồn mới không có lỗi biên dịch hoặc lỗi cú pháp trước khi commit.
- **Phase 2: Đồng bộ dữ liệu (Migrate Convex DB)**: Kiểm tra thông tin môi trường Convex qua file cấu hình `.env.local` để đảm bảo chúng ta đang trỏ tới đúng cơ sở dữ liệu. Sau đó chạy function `dataManager:scanDataContracts` có sẵn trong mã nguồn mới để phát hiện sự lệch pha giữa dữ liệu hiện tại và schema mới. Chúng ta thực hiện vá dữ liệu (backfill) bằng các function có sẵn để đưa tất cả các trường bắt buộc (`missing`) và khuyến nghị (`recommended`) về đúng chuẩn, sau đó dọn dẹp dữ liệu cũ (`deprecated`).

## 3. Concrete Examples & Analogies
- *Ví dụ về Git checkout --theirs:* Nếu file `app/page.tsx` ở dự án hiện tại và dự án Dohy có sự khác biệt, thay vì ngồi so sánh thủ công từng dòng để ghép lại, chúng ta lấy nguyên trạng file `app/page.tsx` từ Dohy sang đè lên file hiện tại.
- *Ví dụ về Data Contract Check:* Schema mới của bảng `products` yêu cầu trường `saleMode` phải có giá trị là `"contact"` hoặc `"affiliate"` hoặc `"normal"`. Dữ liệu cũ của bảng `products` trong DB hiện tại chưa có trường `saleMode` (giá trị là `null` hoặc không tồn tại). Quá trình Backfill sẽ cập nhật giá trị mặc định (ví dụ `"normal"`) cho trường này ở tất cả các sản phẩm cũ để tránh ứng dụng bị lỗi khi cố gắng đọc dữ liệu mới.

# II. Audit Summary (Tóm tắt kiểm tra)
- Trạng thái git workspace hiện tại: `working tree clean`, không có thay đổi chưa commit.
- Thư mục nguồn `system_dohy` tồn tại hợp lệ tại `E:\NextJS\job\job_from_system_vietadmin\system_dohy` và cũng ở trạng thái `working tree clean`.
- Hệ thống có sẵn công cụ `tsc` và `oxlint` cho việc kiểm tra chất lượng mã nguồn trước khi commit.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề**: Mã nguồn hiện tại lỗi thời hơn so với dohy, dẫn đến thiếu hụt tính năng và có thể không tương thích với cấu trúc DB mới.
- **Giả thuyết đối chứng**: Việc tự cập nhật thủ công từng file sẽ mất rất nhiều thời gian và dễ bỏ sót lỗi. Giải pháp squash merge từ remote chính thức của dohy và giải quyết xung đột bằng cách nhận toàn bộ từ phía dohy (`--theirs`) là cách an toàn nhất, đảm bảo tính nhất quán của core. Dữ liệu cũ cần được kiểm tra đối chiếu qua data contracts để tránh lỗi runtime khi frontend chạy phiên bản code mới.

# IV. Proposal (Đề xuất)
- Thực hiện đầy đủ quy trình Git Squash Merge với repository `system_dohy` là remote tạm thời.
- Chạy `tsc` và `oxlint --fix` để làm sạch code.
- Chạy `dataManager:scanDataContracts` qua Convex CLI/Dashboard để phát hiện trường lệch schema và thực hiện backfill.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: Toàn bộ codebase (áp dụng squash merge từ `system_dohy`).
- **Thêm**: `.factory/docs/2026-06-11-sync-core-vietadmin-dohy-upgrade-spec.md` (Lưu trữ tài liệu thiết kế).

# VI. Execution Preview (Xem trước thực thi)
1. Thêm git remote `core-update` trỏ đến `E:\NextJS\job\job_from_system_vietadmin\system_dohy`.
2. Fetch code và chạy squash merge.
3. Giải quyết xung đột bằng `git checkout --theirs .` và add vào git.
4. Chạy `bunx tsc --noEmit` và `bunx oxlint --type-aware --type-check --fix` để sửa lỗi.
5. Thực hiện commit nâng cấp core.
6. Xóa remote tạm thời `core-update`.
7. Chạy `bun install`.
8. Chạy dev server `bun run dev` để kiểm tra khởi động.
9. Đọc `.env.local` xác định Convex deployment.
10. Quét data contract check.
11. Backfill dữ liệu thông qua Convex functions.
12. Quét lại và xác nhận 0 issue.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch tĩnh**: `bunx tsc --noEmit` phải chạy thành công và không báo lỗi type nào.
- **Kiểm tra cú pháp**: `bunx oxlint --type-aware --type-check` phải chạy thành công không lỗi (exit 0).
- **Kiểm tra cơ sở dữ liệu**: Quét data contract check `dataManager:scanDataContracts` trả về 0 issues và 0 warnings.
- **Kiểm tra trực quan**: Khởi chạy thành công local dev server.

# VIII. Todo
- [ ] 1. Thêm remote tạm thời `core-update` trỏ tới `E:\NextJS\job\job_from_system_vietadmin\system_dohy`
- [ ] 2. Fetch lịch sử git từ `core-update`
- [ ] 3. Squash merge từ `core-update/master`
- [ ] 4. Chọn nhận toàn bộ code mới qua `git checkout --theirs .`
- [ ] 5. Chạy typecheck và lint sửa lỗi cho tới khi sạch 100%
- [ ] 6. Commit chốt thay đổi mã nguồn
- [ ] 7. Xóa remote tạm thời
- [ ] 8. Cài đặt lại node dependencies với `bun install`
- [ ] 9. Chạy dev server kiểm tra
- [ ] 10. Xác nhận Convex Deployment từ `.env.local`
- [ ] 11. Chạy scan data contract check lần 1
- [ ] 12. Thực hiện chạy backfill data qua các hàm có sẵn
- [ ] 13. Chạy scan data contract check lần 2 để kiểm tra xem có còn issue nào không

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Codebase đồng bộ hoàn toàn với dohy tại thời điểm hiện tại.
- Code compile bình thường, tsc và oxlint báo sạch hoàn toàn.
- Data contract check trả về kết quả 0 issues và 0 warnings.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi merge hoặc lỗi type phức tạp không tự động sửa được.
- **Hoàn tác**: Sử dụng lệnh `git merge --abort` để hủy merge, hoặc `git reset --hard HEAD` nếu đã chạy squash merge nhưng chưa commit, đảm bảo khôi phục lại trạng thái làm việc ban đầu.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa code thủ công để tạo tính năng mới.
- Không tự ý thêm schema mới hoặc tạo file migration độc lập nếu không có sẵn trong core.

# XII. Open Questions (Câu hỏi mở)
- (Không có câu hỏi mở)

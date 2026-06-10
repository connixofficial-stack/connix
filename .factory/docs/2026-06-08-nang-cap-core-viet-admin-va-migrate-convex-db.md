# I. Primer

## 1. TL;DR kiểu Feynman
- Giống như việc nâng cấp hệ điều hành (OS) cho điện thoại của bạn:
  - **Phase 1 (Sync Code):** Tải phiên bản phần mềm mới nhất từ hãng (Core) về máy, cài đè lên toàn bộ phiên bản cũ mà không làm mất hình ảnh hay danh bạ (dữ liệu Convex DB cũ). Sau đó dọn dẹp và sửa lỗi ngữ pháp trong mã nguồn (tsc, oxlint).
  - **Phase 2 (Migrate DB):** Bật điện thoại lên, kiểm tra xem danh bạ cũ có thiếu trường thông tin nào mới không (ví dụ: ngày sinh, email phụ) bằng công cụ quét. Nếu thiếu, dùng các công cụ có sẵn để điền tự động (backfill) mà không xóa dữ liệu cũ.

## 2. Elaboration & Self-Explanation
Dự án của chúng ta hiện tại đang sử dụng phiên bản code Viet Admin cũ. Trong khi đó, dự án Core (`E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`) đã có nhiều cải tiến và cập nhật quan trọng. Chúng ta cần mang toàn bộ cập nhật này sang dự án hiện tại (`e:\NextJS\job\job_from_system_vietadmin\system_thienkim`), đồng thời bảo toàn cơ sở dữ liệu (Convex DB) đang hoạt động.
- Để làm điều này, trước hết ta thêm địa chỉ của Core vào Git dưới dạng một remote tạm thời, tải toàn bộ code mới về và gộp (squash merge) vào nhánh hiện tại. Ta sẽ ưu tiên chọn code của Core (`checkout --theirs .`) để tránh xung đột mã nguồn.
- Sau khi có code mới, ta kiểm tra kiểu dữ liệu (Typescript) và chạy trình kiểm tra mã nguồn (lint) để sửa các lỗi cú pháp.
- Cuối cùng, chúng ta chạy một chương trình kiểm tra cơ sở dữ liệu trên Convex để phát hiện sự khác biệt về cấu trúc dữ liệu (Data Contract) giữa phiên bản cũ và mới, sau đó chạy các mutation có sẵn để điền các trường dữ liệu bị thiếu hoặc cập nhật các trường cũ.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Trong DB cũ, bảng `products` có thể chỉ lưu `price` (giá bán). Nhưng trong Core mới, hệ thống hỗ trợ cả `salemode` (chế độ bán hàng) và `variantPricing` (giá theo phiên bản). Nếu ta chạy code mới với DB cũ, trang web sẽ bị lỗi vì thiếu các trường dữ liệu này. Quy trình Phase 2 sẽ quét toàn bộ DB, phát hiện bảng `products` thiếu các trường mới và tự động điền giá trị mặc định cho chúng (ví dụ: `salemode = "standard"`).
- **Ví dụ tương đồng:** Việc này giống như việc chuyển một cửa hàng sách truyền thống sang mô hình kỹ thuật số. Phase 1 là mua phần mềm quản lý kho mới nhất. Phase 2 là kiểm tra sổ sách cũ xem có thiếu mã SKU hay mã vạch không và bổ sung mã vạch vào các cuốn sách cũ trong kho để phần mềm mới đọc được.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Repo hiện tại:** `e:\NextJS\job\job_from_system_vietadmin\system_thienkim`
- **Repo Core nguồn:** `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`
- **Tình trạng DB hiện tại:** Đang trỏ tới deployment `dev:incredible-hamster-348` (URL: `https://incredible-hamster-348.convex.cloud`).
- **Function kiểm tra:** `dataManager:scanDataContracts` được định nghĩa tại `convex/dataManager.ts:L580`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- *Lưu ý: Phần này không áp dụng cho trường hợp nâng cấp (Upgrade) định kỳ vì không có lỗi phát sinh cần debug.*
- **Nguyên nhân cần nâng cấp:** Mã nguồn hiện tại bị tụt hậu so với Core, thiếu các tính năng mới và các bản sửa lỗi type/lint đã được chuẩn hóa ở Core.
- **Giả thuyết đối chứng:** Nếu nâng cấp từng phần thủ công thay vì squash merge từ Core, nguy cơ bị sót file rất cao, dẫn tới xung đột runtime khó phát hiện và tốn nhiều công sức resolve conflict. Do đó, quy trình squash merge + checkout `--theirs` là tối ưu nhất.

# IV. Proposal (Đề xuất)
Thực hiện đúng 2 phase theo quy trình nâng Core Viet Admin được chỉ định:
1. **Phase 1: Sync Code Mới**
   - Thêm remote `core-update` trỏ tới `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.
   - Fetch và Squash merge code từ Core.
   - Nhận toàn bộ code từ Core, ghi đè hoàn toàn mã nguồn cục bộ.
   - Chạy `bunx tsc --noEmit` và `bunx oxlint --type-aware --type-check --fix` để đảm bảo code sạch trước khi commit.
   - Commit chốt, xóa remote tạm, cài đặt lại dependencies bằng `bun install`.
2. **Phase 2: Migrate / Backfill Convex DB**
   - Xác nhận deployment `CONVEX_DEPLOYMENT` là `dev:incredible-hamster-348`.
   - Chạy `dataManager:scanDataContracts` để quét hợp đồng dữ liệu.
   - Chạy các mutation backfill có sẵn cho các bảng dữ liệu bị thiếu hoặc sai lệch trường.
   - Xác nhận kết quả quét lại đạt 0 issue/warning.
   - Thực hiện test query các bề mặt (surface) chính.

# V. Files Impacted (Tệp bị ảnh hưởng)
Do quá trình squash merge từ Core, toàn bộ mã nguồn của dự án sẽ được đồng bộ. Hầu hết các file trong `app/`, `components/`, `convex/`, `lib/` sẽ được cập nhật. Dưới đây là các file chính cần lưu ý:
- `[MODIFY] package.json` (Sửa: cập nhật phiên bản thư viện đồng bộ với Core)
- `[MODIFY] bun.lock` (Sửa: cập nhật khóa phiên bản thư viện)
- `[MODIFY] tsconfig.json` (Sửa: đồng bộ cấu hình Typescript)
- `[MODIFY] .env.local` (Sửa: Bảo toàn giá trị cũ để giữ kết nối DB hiện tại)
- `[NEW] .factory/docs/2026-06-08-nang-cap-core-viet-admin-va-migrate-convex-db.md` (Thêm: file spec hiện tại)

# VI. Execution Preview (Xem trước thực thi)
1. Tạo spec và implementation plan, đợi user duyệt.
2. Chạy lệnh git remote add, fetch và squash merge từ Core.
3. Chạy lệnh checkout `--theirs .` và add toàn bộ file vào git.
4. Chạy kiểm tra tĩnh (`tsc --noEmit` và `oxlint --fix`). Sửa các lỗi nếu có.
5. Commit code và xóa remote tạm.
6. Chạy `bun install`.
7. Start app `bun run dev` để kiểm tra runtime ban đầu.
8. Chạy quét contract DB qua CLI hoặc script.
9. Thực hiện backfill dữ liệu qua Convex CLI.
10. Quét lại và chạy kiểm tra chức năng.
11. Commit các file spec và walkthrough. Phát âm thanh thông báo hoàn thành.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch & Cú pháp:**
  - `bunx tsc --noEmit` -> Trả về 0 lỗi.
  - `bunx oxlint --type-aware --type-check` -> Trả về 0 lỗi.
- **Kiểm tra dữ liệu:**
  - Chạy `npx convex run dataManager:scanDataContracts` -> Trả về kết quả không có issue nghiêm trọng liên quan đến cấu trúc dữ liệu mới.
- **Kiểm tra chức năng:**
  - Chạy `bun run dev` kiểm tra xem trang admin và site hoạt động bình thường, không bị crash.

# VIII. Todo
- [ ] Phase 1: Thêm remote tạm và fetch lịch sử từ Core.
- [ ] Phase 1: Squash merge và checkout `--theirs .` để nhận toàn bộ code mới.
- [ ] Phase 1: Chạy type check (`tsc`) và sửa lỗi nếu có.
- [ ] Phase 1: Chạy linter (`oxlint --fix`) và sửa lỗi cho đến khi sạch.
- [ ] Phase 1: Commit chốt code sync và xóa remote tạm.
- [ ] Phase 1: Chạy `bun install` để cập nhật dependencies.
- [ ] Phase 1: Chạy `bun run dev` verify ứng dụng khởi chạy thành công.
- [ ] Phase 2: Xác nhận deployment Convex DB (`dev:incredible-hamster-348`).
- [ ] Phase 2: Chạy `scanDataContracts` kiểm tra sự không tương thích dữ liệu.
- [ ] Phase 2: Chạy backfill dữ liệu bằng các mutation/action có sẵn.
- [ ] Phase 2: Quét lại DB để đạt mục tiêu 0 issue.
- [ ] Phase 2: Kiểm tra các surface quan trọng (Products, HomeComponents, Settings).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Codebase đồng bộ hoàn toàn với Core mà không có conflict.
- Build và Typecheck chạy qua không có lỗi (`tsc` sạch, `oxlint` sạch).
- Ứng dụng khởi động bình thường không gặp lỗi runtime.
- Convex DB được backfill đầy đủ các trường mới, kết quả quét data contract không còn issue nghiêm trọng.
- Các trang chính (Products, HomeComponents) hoạt động đúng chức năng, không bị lỗi hiển thị.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Merge code mới từ Core có thể làm hỏng các tùy chỉnh riêng biệt (nếu có) của dự án `system_thienkim`.
- **Hoàn tác:** Vì đây là git merge chưa push, ta có thể dễ dàng rollback về commit trước khi merge bằng lệnh `git merge --abort` hoặc `git reset --hard HEAD` nếu gặp lỗi nghiêm trọng không thể khắc phục.

# XI. Out of Scope (Ngoài phạm vi)
- Không tự ý viết thêm các hàm API hoặc mutation mới trên Convex nếu codebase đã có sẵn.
- Không sửa giao diện hay logic nghiệp vụ của Core (chỉ sync).
- Không tự ý can thiệp vào các bảng dữ liệu không liên quan đến đợt nâng cấp này.

# XII. Open Questions (Câu hỏi mở)
- Dự án `system_thienkim` có những thay đổi tùy biến (customization) nào quan trọng ở phần giao diện hay logic mà Core không có hay không? Nếu có, chúng ta có cần backup các phần đó để khôi phục sau khi merge không? (Giả định tạm thời là không, theo quy trình nhận toàn bộ từ Core).

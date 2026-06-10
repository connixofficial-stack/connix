# I. Primer

## 1. TL;DR kiểu Feynman

- Chúng ta sẽ nâng cấp toàn bộ dự án hiện tại bằng cách đồng bộ hóa ("sync" hoặc "port") những cải tiến mới nhất từ bản `system_thienkim`.
- Bản cập nhật này mang lại ba thay đổi cực kỳ quan trọng:
  - **Kiến trúc Thông tin Hợp nhất (Unified Information Architecture)**: Hộp toàn bộ route động riêng rẽ cũ vào một route catch-all duy nhất (`app\(site)\[...slugs]\page.tsx`), phân giải thông minh qua backend Convex.
  - **Bảo vệ Vòng đời Tệp (File Lifecycle Service - FLS)**: Sửa triệt để các form upload avatar/icon để không bị xóa nhầm ảnh đang hiển thị trong các chu kỳ dọn dẹp (cleanup) định kỳ của hệ thống.
  - **Bộ công cụ phát triển chuyên nghiệp**: Tích hợp `husky` và `lint-staged` tự động chạy `oxlint` sửa lỗi TS/JS nhanh trước khi commit.
- Để làm việc này, chúng ta sẽ chép đè có chọn lọc toàn bộ file từ `system_thienkim` sang dự án hiện tại, loại trừ các file config cá nhân (`.env.local`), file tạm (`.next`, `node_modules`, `scratch`), và dữ liệu Git `.git`.
- Sau cùng, chúng ta gom tất cả các thay đổi vào một **Single Commit Squash** duy nhất với tên commit được đề xuất rõ ràng để người dùng dễ theo dõi.

## 2. Elaboration & Self-Explanation

Việc nâng cấp lần này không đơn thuần là sửa một vài dòng code mà là đồng bộ hóa một bước nhảy vọt về cấu trúc kiến trúc (Architectural Leap).

Đầu tiên, hệ thống routing của Next.js cũ có rất nhiều file trùng lặp cho các trang sản phẩm, bài viết và dịch vụ. Bản nâng cấp chuyển sang **Unified Catch-all Routing**. Khi người dùng truy cập bất kỳ URL nào, Next.js sẽ gửi slug cho Convex phân giải thông tin qua API `resolveProductLandingContext`. Nhờ đó, backend sẽ cho biết URL này là một Danh mục (Category), một kiểu sản phẩm kèm filter (Product Type / Attribute), hay một trang chi tiết (Detail Page). Từ đó, trang unified router chỉ cần render các view component tương ứng từ thư mục phẳng `app\(site)\_components\`. Cách này giúp cấu trúc thư mục sạch sẽ, quản lý tập trung và nâng cao khả năng tối ưu SEO thông qua JSON-LD schemas tự động.

Thứ hai, cơ chế upload file trước đây lưu URL trực tiếp vào DB nhưng vô tình làm rơi mất định danh file (`storageId`). Trong chu kỳ dọn dẹp tự động (media cleanup), hệ thống quét và tưởng lầm các file này không còn ai sử dụng nên đã xóa sạch chúng. Bản nâng cấp bổ sung việc lưu trữ cả `storageId` song hành cùng URL tại tất cả các form (Team, Stats, Process, v.v.), đồng thời thắt chặt cổng dọn dẹp file an toàn (`convex/storage.ts`) để bảo vệ dữ liệu media của người dùng.

## 3. Concrete Examples & Analogies

- **Ví dụ cụ thể**: Trước đây, trang chi tiết sản phẩm nằm ở `app\(site)\[categorySlug]\[recordSlug]\_components\ProductDetailPage.tsx`. Sau khi nâng cấp, file này được chuyển sang `app\(site)\_components\details\ProductDetailPage.tsx`, và route catch-all tại `app\(site)\[...slugs]\page.tsx` sẽ tự động import và render nó khi phân giải thành công context là sản phẩm.
- **Phép so sánh (Analogy)**:
  - Cấu trúc route catch-all giống như một **Quầy lễ tân trung tâm** duy nhất của tòa nhà. Khách đến chỉ cần nói tên phòng, lễ tân sẽ tra cứu sơ đồ (Convex IA API) rồi chỉ dẫn khách đến đúng căn hộ mong muốn. Thay vì trước đây khách phải tự tìm cửa đi riêng biệt cho từng loại phòng.
  - URL ảnh giống như **địa chỉ tạm thời** để gửi thư; còn `storageId` giống như **số căn cước công dân** của tệp. Hệ thống dọn dẹp an toàn không hỏi "địa chỉ này còn ai nhớ không?", mà phải hỏi "căn cước công dân của tệp này có thuộc về hồ sơ nào đang hoạt động hay không?".

# II. Audit Summary (Tóm tắt kiểm tra)

- Thư mục nguồn nâng cấp: `E:\NextJS\job\job_from_system_vietadmin\system_thienkim` (Tồn tại: Đúng).
- Dự án hiện tại: `e:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs` (Sạch, không có local change trong code, chỉ có file `bun.lock` biến động nhẹ).
- So sánh thống kê sơ bộ giữa 2 dự án (sau khi loại trừ các file config cá nhân và file tạm):
  - **Modified (Đã chỉnh sửa)**: 686 files. Bao gồm phần lớn tài liệu spec cũ, các component quản trị (`app/admin/...`), file backend Convex (`convex/...`), và các thư viện bổ trợ (`lib/...`).
  - **Added (Thêm mới)**: 124 files. Bao gồm file catch-all router `app\(site)\[...slugs]\page.tsx`, bộ component detail/list mới đặt trong `app\(site)\_components\`, cấu hình Git hook `.husky`, các script kiểm tra và hướng dẫn nâng cấp.
  - **Deleted (Đã xóa)**: Các route dynamic cũ (`app\(site)\[categorySlug]...`) được gộp lại và dọn dẹp để cấu trúc folder gọn gàng hơn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- Độ tin cậy nguyên nhân gốc: **High (Độ tin cậy cao)**.
- Lý do đồng bộ: Bản nâng cấp từ `system_thienkim` giải quyết triệt để các vấn đề về phân mảnh route động, nâng cấp bảo mật media (FLS) không bị xóa nhầm, và tối ưu hóa trải nghiệm nhà phát triển bằng Git hooks tự động. Do dự án hiện tại chưa có các tính năng này, việc đồng bộ hóa là hoàn toàn cần thiết để đồng nhất phiên bản SaaS mới nhất.

# IV. Proposal (Đề xuất)

Chúng ta sẽ thực hiện quy trình đồng bộ hóa toàn diện từ `system_thienkim` sang dự án hiện tại theo các bước cụ thể:

1. **Chuẩn bị và Sao lưu**: Xác nhận dự án hiện tại đang sạch (`git status`) để đảm bảo quá trình ghi đè không làm mất bất kỳ code local nào của người dùng.
2. **Đồng bộ hóa Code (Sync)**: Viết và chạy một script PowerShell tự động sao chép toàn bộ các tệp thay đổi và thêm mới từ `system_thienkim` sang dự án hiện tại.
   - Các thư mục sao chép chính: `app`, `components`, `convex`, `lib`, `public`, `scripts`, `types`, `.factory`, `.husky`.
   - Các file sao chép chính: `package.json`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `next.config.ts`, `AGENTS.md`, `CLAUDE.md`, `README.md`.
   - **Loại trừ tuyệt đối**: `.git`, `.next`, `node_modules`, `.agents`, `scratch`, `bun.lock`, `package-lock.json`, `.env.local` và các tệp cấu hình môi trường đặc thù của dự án hiện tại để tránh xung đột cấu hình.
3. **Cài đặt Dependencies mới**:
   - Sau khi cập nhật `package.json`, chạy lệnh cài đặt để cập nhật `husky` và `lint-staged`.
4. **Tạo Commit Squash**:
   - Thêm toàn bộ các file thay đổi vào staging (`git add .`).
   - Thực hiện commit duy nhất (squash) với thông điệp rõ ràng, nêu bật các cải tiến thú vị.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Do số lượng file thay đổi lên tới ~800 file, chúng tôi nhóm theo các khu vực kiến trúc chính:
  - **Thêm/Sửa (UI & Routing)**:
    - `Sửa:` `package.json` — bổ sung `husky`, `lint-staged` và lệnh pre-commit.
    - `Thêm:` `.husky/pre-commit` — cấu hình tự động chạy oxlint khi commit.
    - `Thêm:` `app\(site)\[...slugs]\page.tsx` — route catch-all hợp nhất toàn site.
    - `Thêm:` `app\(site)\_components\details\ProductDetailPage.tsx` cùng các trang detail/list khác — cấu trúc thư mục phẳng mới cho component site.
  - **Sửa (Convex Backend & FLS)**:
    - `Sửa:` `convex/schema.ts` — bổ sung `urlStorageKey` cho bảng media.
    - `Sửa:` `convex/storage.ts` — thắt chặt gateway xóa ảnh an toàn.
    - `Sửa:` `convex/homeComponents.ts` — cập nhật cơ chế phân giải storageId từ URL và kiểm tra reference lồng nhau.

# VI. Execution Preview (Xem trước thực thi)

1. Ghi nhận sự đồng thuận từ người dùng về kế hoạch.
2. Viết file script PowerShell `sync.ps1` trong thư mục `scratch` để thực hiện sao chép có chọn lọc từ `system_thienkim` sang dự án hiện tại.
3. Chạy `sync.ps1` để thực hiện sao chép code.
4. Chạy `bun install` hoặc `npm install` để cập nhật dependencies mới (`husky`, `lint-staged`).
5. Kích hoạt Husky bằng cách chạy `npx husky init` hoặc lệnh `prepare` tương ứng nếu cần.
6. Chạy `git add .` để chuẩn bị commit.
7. Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để verify kiểu dữ liệu TypeScript toàn dự án không bị lỗi sau nâng cấp.
8. Thực hiện commit duy nhất với tên commit được thống nhất.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tự động
- Chạy kiểm tra kiểu TypeScript:
  ```powershell
  bunx tsc --noEmit 2>&1 | Select-Object -First 10
  ```
  Yêu cầu: Không có lỗi kiểu dữ liệu nghiêm trọng phát sinh từ code mới.

### Kiểm tra tĩnh
- Kiểm tra trạng thái Git (`git status`) để đảm bảo tất cả các file nâng cấp đã được đưa vào vùng chuẩn bị commit (Staged).
- Xác minh sự tồn tại của file route catch-all hợp nhất mới tại `app\(site)\[...slugs]\page.tsx` và cấu trúc các component trong `app\(site)\_components\`.

# VIII. Todo

- [ ] Người dùng phê duyệt Kế hoạch nâng cấp và Tên Commit đề xuất.
- [ ] Tạo script PowerShell `sync.ps1` trong thư mục `scratch`.
- [ ] Thực thi `sync.ps1` để copy chọn lọc toàn bộ codebase mới từ `system_thienkim`.
- [ ] Chạy lệnh cài đặt thư viện (`npm install` hoặc `bun install`).
- [ ] Chạy kiểm thử TypeScript tĩnh (`bunx tsc --noEmit`).
- [ ] Gom tất cả thay đổi vào vùng chuẩn bị commit (`git add .`).
- [ ] Thực hiện lệnh Commit Squash duy nhất.
- [ ] Phát âm thanh thông báo hoàn thành task `Done, Sir.` qua SAPI.SpVoice.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Toàn bộ codebase được đồng bộ hóa thành công với `system_thienkim`.
- Cấu trúc thư mục `app\(site)` chuyển đổi hoàn toàn sang mô hình Unified Catch-all Router phẳng và sạch sẽ.
- Dependencies mới (`husky`, `lint-staged`) được cài đặt và cấu hình pre-commit hoạt động bình thường.
- Lệnh kiểm tra kiểu TypeScript (`tsc`) không báo lỗi biên dịch nghiêm trọng.
- Tạo duy nhất một commit local mô tả đầy đủ các tính năng nâng cấp.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Ghi đè file có thể làm mất các cấu hình đặc thù hoặc gây lỗi import cục bộ.
- **Giải pháp giảm thiểu**: Thư mục đích hiện tại đang hoàn toàn sạch và đã được lưu trữ trong Git. Nếu có bất kỳ lỗi không mong muốn nào phát sinh, ta có thể dễ dàng rollback toàn bộ về trạng thái trước khi nâng cấp bằng lệnh:
  ```bash
  git reset --hard HEAD
  git clean -fd
  ```

# XI. Out of Scope (Ngoài phạm vi)

- Không tự ý thay đổi file cấu hình môi trường `.env.local` của người dùng.
- Không tự động thực hiện lệnh push lên kho lưu trữ remote (`git push`), chỉ commit local theo đúng nguyên tắc của kho.
- Không tự ý chạy lint hoặc unit test vì quy tắc `AGENTS.md` nghiêm cấm tự chạy.

# XII. Open Questions (Câu hỏi mở)

- (Không có câu hỏi mở nào. Kế hoạch đã sẵn sàng để thực thi ngay khi được phê duyệt).

## TL;DR kiểu Feynman
- Convex CLI có sẵn lệnh `export` để tải snapshot dữ liệu về máy.
- Muốn lấy cả database lẫn file storage thì cần thêm cờ `--include-file-storage`.
- Với Windows PowerShell, đường dẫn có khoảng trắng phải đặt trong dấu nháy kép.
- Vì bạn chọn môi trường dev, không cần thêm `--prod`.
- Kết quả sẽ là file `.zip` hoặc export tại path chỉ định trong `C:\Users\VTOS\Downloads\convex ktec`.

## Audit Summary
- Observation: Tài liệu chính thức Convex CLI ghi rõ các lệnh:
  - `npx convex export --path <directoryPath>`
  - `npx convex export --path <filePath>.zip`
  - `npx convex export --include-file-storage --path <path>`
- Observation: Trang Data Export của Convex xác nhận có thể export dữ liệu bằng CLI về thư mục local.
- Observation: Bạn muốn “tải cả db lẫn storage” về thư mục `C:\Users\VTOS\Downloads\convex ktec`.
- Observation: Bạn đã chốt deployment là Dev và shell là PowerShell.
- Inference: Lệnh phù hợp nhất là `npx convex export --include-file-storage --path "C:\Users\VTOS\Downloads\convex ktec"`.
- Counter-hypothesis: Nếu CLI hiểu path thư mục theo cách tạo zip bên trong thư mục thay vì bung toàn bộ nội dung trực tiếp, vẫn OK vì docs cho phép truyền cả directory path lẫn file path `.zip`; nếu cần deterministic hơn có thể chỉ định thẳng file zip.

## Root Cause Confidence
- High — vì đã có evidence trực tiếp từ docs Convex CLI và Data Export, đồng thời yêu cầu của bạn map 1-1 với option `--include-file-storage`.

## Files Impacted
- Không sửa file nào trong repo.
- Sửa: không có.
- Thêm: không có.

## Proposal
Mình sẽ chỉ thực thi lệnh export từ root project, dùng deployment dev hiện tại và lưu output vào thư mục đích của bạn.

### Lệnh đề xuất
Option A (Recommend) — Confidence 95%: xuất vào thư mục đích, ngắn gọn đúng nhu cầu.
```powershell
npx convex export --include-file-storage --path "C:\Users\VTOS\Downloads\convex ktec"
```

Option B — Confidence 85%: chỉ định thẳng file zip để tên file deterministic hơn, phù hợp nếu bạn muốn quản lý nhiều bản backup.
```powershell
npx convex export --include-file-storage --path "C:\Users\VTOS\Downloads\convex ktec\convex-dev-export.zip"
```

## Execution Preview
1. Kiểm tra nhanh CLI/credentials/deployment hiện tại có sẵn.
2. Nếu thư mục đích chưa tồn tại, tạo thư mục đích.
3. Chạy `convex export` với `--include-file-storage` trên deployment dev.
4. Kiểm tra artifact được tạo trong `C:\Users\VTOS\Downloads\convex ktec`.
5. Báo lại tên file/thư mục export thực tế cho bạn.

## Acceptance Criteria
- Pass khi export chạy thành công không lỗi auth/deployment.
- Pass khi trong `C:\Users\VTOS\Downloads\convex ktec` có artifact export được tạo.
- Pass khi export bao gồm cả dữ liệu database và file storage.
- Fail nếu thiếu quyền truy cập Convex, chưa đăng nhập CLI, hoặc deployment dev không resolve được từ config hiện tại.

## Verification Plan
- Repro: chạy lệnh export ở PowerShell từ root project `E:\NextJS\job\ktec`.
- Verify 1: xác nhận CLI output báo export thành công.
- Verify 2: xác nhận file/thư mục output xuất hiện đúng path đích.
- Verify 3: nếu cần, đối chiếu kích thước output để chắc chắn file storage đã được include.

## Out of Scope
- Không import lại dữ liệu vào deployment khác.
- Không đổi `.env.local`, deployment config, hay code trong repo.
- Không chạy lint/build/test.

## Risk / Rollback
- Risk thấp: thao tác export là read/export từ Convex về local, không sửa code repo.
- Risk chính là lộ dữ liệu nhạy cảm nếu lưu backup ở thư mục chia sẻ hoặc commit nhầm file export.
- Rollback đơn giản: xóa file export local nếu không cần giữ.

## Nguồn evidence
- Convex CLI docs: mục “Export data to a file” nêu rõ `npx convex export --include-file-storage --path <path>`.
- Convex Data Export docs: xác nhận có thể export dữ liệu từ CLI về local path.
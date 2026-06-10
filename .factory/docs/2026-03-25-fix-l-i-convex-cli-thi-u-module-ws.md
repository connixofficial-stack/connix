## TL;DR kiểu Feynman
- `convex@1.34.0` có dependency runtime trực tiếp vào `ws`.
- Log báo `Cannot find module 'ws'` nghĩa là package này không hiện diện trong `node_modules`, dù `convex` đang được cài.
- Repo đang dùng Bun (`bun.lock`), nhưng trạng thái cài dependency hiện tại bị lệch: lock có `convex`, còn thư mục `node_modules` không có `ws`.
- Hướng bạn chọn là fix nhanh: cài lại đúng package thiếu `ws`, rồi thử chạy lại `bunx convex dev`.
- Nếu fix nhanh không pass, fallback an toàn là reinstall dependency sạch theo lockfile.

## Audit Summary
### Observation
- Lỗi thực tế: `bunx convex dev` crash với `Error: Cannot find module 'ws'` từ `node_modules/convex/dist/cli.bundle.cjs`.
- `package.json` của project đang có `convex: ^1.34.0`.
- `node_modules/convex/package.json` xác nhận `convex@1.34.0` khai báo dependency runtime: `"ws": "8.18.0"`.
- Kiểm tra `node_modules` không tìm thấy thư mục `ws`.
- `bun.lock` có entry cho `convex`, nhưng output tìm kiếm không cho thấy `ws` đang hiện diện vật lý trong install hiện tại.

### Root cause questions
1. Triệu chứng: chạy `bunx convex dev` fail ngay lúc CLI load, expected là Convex dev server khởi động.
2. Phạm vi ảnh hưởng: local dev environment của repo này; mọi lệnh Convex CLI cần `ws` đều có thể fail.
3. Tái hiện: có, tái hiện ổn định chỉ cần chạy `bunx convex dev` trong repo hiện tại.
4. Mốc thay đổi gần nhất: chưa đủ evidence để chốt commit nào gây ra; chỉ biết state hiện tại của install bị thiếu transitive dependency.
5. Dữ liệu còn thiếu: vì sao Bun install trước đó bỏ sót `ws` (cache, install interrupted, lock/node_modules lệch, hoặc bug cài đặt).
6. Giả thuyết thay thế chưa loại trừ hoàn toàn: `node_modules` bị hỏng một phần, hoặc lockfile/install state không đồng bộ.
7. Rủi ro nếu fix sai nguyên nhân: chỉ thêm `ws` có thể chữa triệu chứng nhưng chưa xử lý nguyên nhân sâu hơn của install state.
8. Tiêu chí pass/fail: `bunx convex dev` không còn ném lỗi `Cannot find module 'ws'`.

## Root Cause Confidence
**High** — Evidence trực tiếp từ `node_modules/convex/package.json` cho thấy Convex cần `ws`, trong khi `node_modules/ws` không tồn tại và stack trace fail đúng tại `require("ws")`.

## Proposal
### Option đã chọn
**Option A (Recommend): thêm/cài lại `ws`**

### Cách triển khai dự kiến
1. Kiểm tra lại package manager convention của repo để không lệch cách cài hiện có.
2. Cài `ws@8.18.0` vào project bằng Bun để khôi phục runtime dependency bị thiếu.
3. Xác nhận `node_modules/ws` đã xuất hiện và Bun lock/package manifest ở trạng thái nhất quán.
4. Chạy verify tối thiểu bằng cách thử lại `bunx convex dev` để xác nhận lỗi cũ biến mất.
5. Nếu vẫn fail, chuyển sang fallback: xóa install state cục bộ liên quan và reinstall sạch theo lockfile.

## Files Impacted
- **Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\package.json`** — Hiện đang khai báo dependencies chính của app; có thể được cập nhật để thêm `ws` trực tiếp nếu Bun yêu cầu ghi manifest.
- **Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\bun.lock`** — Hiện giữ snapshot dependency của Bun; sẽ được refresh nếu thêm/cài lại `ws`.
- **Không sửa code app/convex functions** — Root cause nằm ở dependency install state, không phải logic ứng dụng.

## Execution Preview
1. Đọc nhanh convention dependency hiện tại của repo.
2. Cài lại `ws` theo version Convex đang cần.
3. Kiểm tra artifact sau cài (`package.json`, `bun.lock`, `node_modules/ws`).
4. Verify lại bằng repro command cũ.
5. Nếu cần, chuẩn bị fallback reinstall sạch.

## Acceptance Criteria
- `bunx convex dev` không còn throw `Cannot find module 'ws'`.
- `node_modules/ws` tồn tại sau khi cài.
- Version `ws` tương thích với `convex@1.34.0`.
- Không có thay đổi ngoài scope dependency fix cho lỗi này.

## Verification Plan
- Repro trước sửa: giữ nguyên command `bunx convex dev` làm baseline.
- Verify sau sửa: chạy lại đúng command trên và quan sát không còn stack trace thiếu `ws`.
- Static check bổ sung: xác nhận manifest/lock không bị lệch bất thường.

## Counter-hypothesis
- Nếu sau khi thêm `ws` vẫn lỗi, root cause thực sự có thể là install state của Bun bị corruption rộng hơn, khi đó cần chuyển sang clean reinstall thay vì chỉ vá một package.

## Out of Scope
- Không refactor Convex config.
- Không nâng version Convex/Bun/Node.
- Không xử lý các lỗi khác sau khi Convex start nếu chúng không liên quan `ws`.

## Risk / Rollback
- Risk thấp: thay đổi chỉ ở dependency cục bộ.
- Rollback đơn giản: revert manifest/lock về trạng thái trước nếu cần.
- Nếu Bun ghi trực tiếp vào manifest mà bạn không muốn pin `ws`, có thể dùng bước reinstall sạch để quay về transitive-only state.

Nếu bạn duyệt spec này, mình sẽ tiến hành fix theo Option A trước, và chỉ fallback sang reinstall sạch nếu verify cho thấy lỗi vẫn còn.
## Audit Summary
- Observation: `origin` đang dùng SSH: `git@github.com:infoktecvina-code/ktec.git`.
- Observation: Lỗi trước đó là `Permission to infoktecvina-code/ktec.git denied to hieubkbk10-hue`.
- Inference: GitHub đang map SSH key hiện tại sang account `hieubkbk10-hue` hoặc một account không có quyền push repo này.
- Decision: Tiếp tục audit read-only để xác định chính xác SSH identity nào đang được dùng, chưa sửa credential ở bước này.

## Root Cause Confidence
**High** — Vì remote là SSH nên danh tính push đến từ SSH key/agent, không phải `user.name/email` hay HTTPS credential helper. Cần thêm evidence từ `ssh -T`, `ssh-add -l`, và `ssh -v` để chốt key nào đang được chọn.

## TL;DR kiểu Feynman
- Repo đích vẫn đúng là `infoktecvina-code/ktec`.
- Nhưng GitHub nhận bạn qua một SSH key đang gắn với account khác.
- Muốn biết chính xác “chìa khóa nào đang mở cửa”, phải hỏi SSH agent và xem log bắt tay SSH.
- Bước này chỉ đọc thông tin, chưa đụng gì vào config hay key.

## Files Impacted
- Không sửa file nào trong repo.
- Chỉ đọc trạng thái SSH/client và cấu hình liên quan nếu có.

## Execution Preview
1. Chạy `ssh -T git@github.com` để xem GitHub nhận diện account nào.
2. Chạy `ssh-add -l` để liệt kê key đang nạp trong agent.
3. Chạy `ssh -vT git@github.com` để xem client chọn key nào khi bắt tay.
4. Nếu cần, đọc `~/.ssh/config` và danh sách public key trong `~/.ssh` theo chế độ read-only để đối chiếu.
5. Tổng hợp evidence và chỉ ra nguyên nhân gần nhất.

## Verification Plan
- Repro: xác nhận GitHub greet account nào qua `ssh -T`.
- Trace: xác nhận key fingerprint nào đang active qua `ssh-add -l`.
- Match: đối chiếu fingerprint/log verbose để biết key nào được offer/accept.
- Pass khi xác định được account hoặc key đang bị dùng sai.
- Fail khi máy không có SSH agent/key hoặc output không đủ evidence; khi đó sẽ nêu gap cụ thể.

## Acceptance Criteria
- Có bằng chứng rõ GitHub đang nhận account nào qua SSH.
- Có bằng chứng key nào đang được agent giữ hoặc SSH client chọn.
- Kết luận được nguyên nhân gần nhất của việc push bị map sang sai account.
- Chưa có thay đổi nào tới remote, key, credential, hay git config.

## Out of Scope
- Chưa đổi SSH key.
- Chưa sửa `~/.ssh/config`.
- Chưa push lại.
- Chưa chuyển từ SSH sang HTTPS.

## Risk / Rollback
- Rủi ro rất thấp vì toàn bộ lệnh đều read-only.
- Không cần rollback vì không có thay đổi hệ thống.

## Counter-Hypothesis
- Có thể key đúng account nhưng account đó chưa được cấp quyền vào repo `infoktecvina-code/ktec`.
- Có thể SSH agent đang nạp nhiều key và GitHub chọn nhầm key ưu tiên cao hơn.
- Có thể `~/.ssh/config` đang ép dùng một IdentityFile khác với key bạn mong đợi.

## Đề xuất thực thi sau khi bạn xác nhận
- Chạy bộ lệnh read-only `ssh -T`, `ssh-add -l`, `ssh -vT`.
- Nếu phát hiện rõ key/account sai, tôi sẽ đề xuất đúng 1 hướng sửa nhỏ nhất, dễ rollback.
## Audit Summary
- Observation: `git push` bị từ chối với account `hieubkbk10-hue`.
- Observation: Remote hiện tại dùng `git@github.com:infoktecvina-code/ktec.git` nên SSH chọn key mặc định `id_ed25519` (account sai).
- Observation: Máy đã có alias `github-infoktecvina` trỏ đúng key `id_ed25519_infoktecvina` trong `~/.ssh/config`.
- Decision: Theo lựa chọn của bạn, dùng phương án A: chỉ đổi remote của repo này sang host alias `github-infoktecvina` để không ảnh hưởng repo khác.

## Root Cause Confidence
**High** — Có đủ evidence từ `ssh -T`, `ssh -vT`, fingerprint key và `~/.ssh/config` cho thấy sai account do chọn sai IdentityFile mặc định.

## TL;DR kiểu Feynman
- Cửa repo đúng, nhưng chìa khóa mặc định đang là chìa của account khác.
- Máy đã có sẵn chìa đúng cho `infoktecvina` dưới alias riêng.
- Ta chỉ đổi “địa chỉ remote” của repo này để ép dùng chìa đúng.
- Không đụng global config, nên ít rủi ro.

## Files Impacted
- Không sửa file code.
- Sửa cấu hình git local của repo (`.git/config`) qua `git remote set-url`.

## Execution Preview
1. Kiểm tra trạng thái git và remote hiện tại (read-only).
2. Chạy `git remote set-url origin git@github-infoktecvina:infoktecvina-code/ktec.git`.
3. Verify `git remote -v` đã đổi đúng host alias.
4. Chạy `ssh -T git@github-infoktecvina` để xác nhận account nhận diện.
5. Thử `git push origin master`.
6. Báo kết quả + nếu fail thì đưa root-cause tiếp theo (ví dụ thiếu quyền collaborator).

## Verification Plan
- Kiểm tra trước/sau URL remote bằng `git remote -v`.
- Kiểm tra SSH identity bằng `ssh -T git@github-infoktecvina`.
- Pass khi `git push origin master` thành công lên `infoktecvina-code/ktec`.
- Fail khi vẫn bị denied; khi đó kiểm tra quyền repo của account gắn key infoktecvina.

## Acceptance Criteria
- Remote `origin` của repo này dùng host `github-infoktecvina`.
- SSH handshake nhận diện account đúng cho key infoktecvina.
- Push nhánh `master` thành công lên repo `infoktecvina-code/ktec`.

## Out of Scope
- Không đổi `Host github.com` mặc định toàn máy.
- Không chỉnh/sinh mới SSH key.

## Risk / Rollback
- Rủi ro thấp, scope cục bộ repo.
- Rollback nhanh: set lại remote cũ `git@github.com:infoktecvina-code/ktec.git`.
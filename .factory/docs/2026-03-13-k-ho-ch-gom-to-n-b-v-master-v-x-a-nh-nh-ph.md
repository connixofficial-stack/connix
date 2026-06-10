## Audit Summary
- Observation: repo hiện có 4 nhánh local: `master`, `sync/dien-tran-core-upgrade`, `backup-before-backport`, `backup-before-color-refactor`.
- Observation: `sync/dien-tran-core-upgrade` đang đi trước `master` 4 commit (left-right `0 4`), merge-base đúng tại `8d3f2a96`.
- Observation: bạn xác nhận mục tiêu là chỉ giữ `master`, chọn phương án **fast-forward master rồi xóa nhánh phụ**, và muốn xóa luôn 2 nhánh backup sau khi xác nhận an toàn.
- Inference: cách an toàn nhất là FF `master` tới commit sync hiện tại, xác minh working tree sạch, rồi xóa 3 nhánh phụ local.

## Root Cause Confidence
- High — Vì quan hệ lịch sử giữa `master` và `sync` là tuyến tính (không divergence), nên fast-forward không tạo merge commit và không làm bẩn history.
- Rủi ro chính: nếu một nhánh backup có commit chưa nằm trên `master`, xóa bằng `-d` sẽ bị chặn; khi đó cần quyết định có force delete hay giữ lại tạm.

## Proposal
1. **Pre-check an toàn**
   - `git status --porcelain` (đảm bảo sạch).
   - `git log --oneline --decorate --graph -10` (xác minh 4 commit sync).

2. **Gom về master bằng fast-forward**
   - `git checkout master`
   - `git merge --ff-only sync/dien-tran-core-upgrade`
   - Kết quả mong đợi: `master` trỏ tới `d3fe360c` (commit mới nhất từ sync), không phát sinh merge commit.

3. **Xóa nhánh phụ local**
   - Xóa an toàn trước:  
     `git branch -d sync/dien-tran-core-upgrade`  
     `git branch -d backup-before-backport`  
     `git branch -d backup-before-color-refactor`
   - Nếu nhánh backup bị báo chưa merged, dừng lại và báo bạn trước khi dùng `-D`.

4. **Xác minh cuối**
   - `git branch --list` chỉ còn `master`.
   - `git status --porcelain` sạch.
   - `git log --oneline -6` có 4 commit đồng bộ trên `master`.

## Verification Plan
- Pass:
  1. `master` chứa đầy đủ 4 commit đồng bộ gần nhất.
  2. Chỉ còn 1 nhánh local `master`.
  3. Không có thay đổi chưa commit.
- Fail:
  - `merge --ff-only` thất bại hoặc nhánh backup chưa merged không xóa được bằng `-d` (sẽ dừng và hỏi lại trước khi force).
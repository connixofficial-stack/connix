## Problem Graph
1. Bỏ khối hardcode trên trang chủ <- depends on 1.1
   1.1 Xác định commit gây ra <- ROOT CAUSE
2. Đếm hardcode “vớ vẩn” trong 2 commit gần nhất ở `app/(site)/**` <- depends on 2.1, 2.2
   2.1 Chốt tiêu chí đếm với user
   2.2 Rà diff 2 commit theo tiêu chí

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Tìm chuỗi đặc trưng “Trang chủ VietAdmin” để lần về file/commit.
   - Action: grep + `git show` 2 commit gần nhất.
   - Observation: Chuỗi nằm ở `app/(site)/page.tsx`, được thêm trong commit `0a51a91` (không phải `7f30c36`).
   - Reflection: ✓ Valid.

2. Solving 2.1...
   - Thought: “Hardcode vớ vẩn” mơ hồ, cần chốt tiêu chí trước khi đếm.
   - Action: Hỏi lại bằng AskUser.
   - Observation: User chọn phạm vi đếm chỉ trong `app/(site)/**`, và muốn bỏ section hardcode ở homepage nhưng giữ `HomePageClient`.
   - Reflection: ✓ Valid.

3. Solving 2.2...
   - Thought: Rà 2 commit `0a51a91` + `7f30c36` chỉ trong `app/(site)/**`.
   - Action: `git show <commit> -- app/(site)`.
   - Observation:
     - `7f30c36`: chỉ đổi flow checkout xử lý lỗi stock, **không thêm khối hardcode UI kiểu header/nav**.
     - `0a51a91`: thêm các section intro/nav hardcode ở 4 file:
       - `app/(site)/page.tsx` (1 section: H1 + mô tả + 4 link)
       - `app/(site)/products/layout.tsx` (1 section: H1 + mô tả + 3 link)
       - `app/(site)/services/layout.tsx` (1 section: H1 + mô tả + 3 link)
       - `app/(site)/posts/layout.tsx` (1 section: H1 + mô tả + 3 link)
     - Tổng theo tiêu chí đã chốt: **4 khối hardcode UI** được thêm bởi 2 commit gần nhất (thực tế đều từ `0a51a91`).
   - Reflection: ✓ Valid.

## Kế hoạch implement ngay sau khi bạn duyệt
1. Sửa `app/(site)/page.tsx`: xóa toàn bộ `<section ...>` chứa “Trang chủ VietAdmin...”, giữ nguyên `HomePageClient` và phần metadata.
2. Kiểm tra nhanh bằng grep để đảm bảo chuỗi này không còn ở homepage.
3. Chạy `bunx tsc --noEmit` theo rule dự án.
4. Rà `git diff --cached` + `git status` (kiểm tra an toàn, không dính secrets).
5. Commit 1 commit local (không push) với message kiểu: `fix(home): remove hardcoded hero section from site homepage`.

Bạn duyệt spec này, mình sẽ tiến hành sửa và commit luôn.
## Problem Graph
1. [Main] Header /system đang có text hard-code không cần thiết + spacing hơi rộng <- depends on 1.1, 1.2
   1.1 [Sub] Có 2 text hard-code cần bỏ: `Console v2.5` (sidebar brand) và `PROD` (header badge)
      1.1.1 [ROOT CAUSE] JSX trong `app/system/layout.tsx` đang render trực tiếp 2 phần tử này
   1.2 [Sub] Header cao và padding ngang lớn hơn mức mong muốn

## Execution (with reflection)
1. Solving 1.1.1 (remove hard-coded labels):
   - Thought: Xóa đúng 2 node UI, giữ nguyên logic/auth/theme.
   - Action (`app/system/layout.tsx`):
     - Trong sidebar brand block: xóa `<span ...>Console v2.5</span>`.
     - Trong header actions: xóa toàn bộ badge `PROD` (wrapper `div` chứa `span`).
   - Reflection: ✓ Đúng scope, không ảnh hưởng business logic.

2. Solving 1.2 (reduce header spacing nhẹ):
   - Thought: Áp dụng mức “giảm nhẹ” theo lựa chọn của anh.
   - Action (`app/system/layout.tsx`):
     - Header: `h-16` -> `h-14`.
     - Header horizontal padding: `px-4 sm:px-6` -> `px-3 sm:px-4`.
     - Giảm nhẹ khoảng cách cụm phải: `gap-3 sm:gap-4` -> `gap-2 sm:gap-3`.
     - Có thể giảm thêm divider margin `mx-1` -> `mx-0.5` để cân tổng thể compact.
   - Reflection: ✓ Gọn hơn nhưng vẫn giữ click target hợp lý.

3. Verify + commit theo rule repo:
   - Thought: Có thay đổi TSX nên chỉ cần typecheck theo guideline dự án.
   - Action:
     - Run `bunx tsc --noEmit`.
     - `git status`, `git diff --cached` kiểm tra sạch và không lộ dữ liệu nhạy cảm.
     - Commit (không push), kèm `.factory/docs` nếu có.
   - Reflection: ✓ Hoàn tất đúng quy ước repo.

### Kết quả mong đợi
- Không còn `Console v2.5` ở sidebar `/system`.
- Không còn badge `PROD` trên header `/system`.
- Header compact hơn (giảm nhẹ chiều cao + padding/gap), nhìn gọn nhưng vẫn dễ thao tác.
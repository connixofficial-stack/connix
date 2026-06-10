## Problem Graph
1. [Main] Crash runtime `Cannot read properties of undefined (reading 'toLowerCase')` tại `SystemGlobalSearch.handleKeyDown` <- depends on 1.1
   1.1 [ROOT CAUSE] Code gọi trực tiếp `event.key.toLowerCase()` mà không guard kiểu dữ liệu khi `event.key` không phải string (IME/composition edge-case)

## Execution (with reflection)
1. Solving 1.1 (hardening keydown handler)
   - Thought: Bạn đã chọn fix nhanh, phạm vi chỉ `SystemGlobalSearch`, strategy guard an toàn và return sớm.
   - Action:
     - File: `app/system/components/SystemGlobalSearch.tsx`
     - Trong `handleKeyDown` thay đoạn:
       - `const key = event.key.toLowerCase();`
     - Bằng logic an toàn:
       - Lấy `rawKey = event.key`
       - Nếu `typeof rawKey !== 'string' || !rawKey` thì `return`
       - Sau đó mới `const key = rawKey.toLowerCase()`
   - Reflection: ✓ Loại bỏ crash tại nguồn, không đổi behavior phím hợp lệ.

2. Giữ nguyên hành vi hiện tại của global search
   - Thought: Không mở rộng scope theo yêu cầu “fix nhanh”.
   - Action:
     - Không thay đổi logic Ctrl/Cmd+K, Escape, ArrowUp/Down, Enter.
     - Không đụng các component keydown khác.
   - Reflection: ✓ KISS, YAGNI, đúng phạm vi bạn chọn.

3. Verification
   - Thought: Có thay đổi TS/React nên cần check type theo rule repo.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Test tay nhanh flow: mở `/system/data` -> bật Seed Wizard -> thao tác bàn phím, đảm bảo không còn crash khi key event bất thường.
   - Reflection: ✓ Đảm bảo fix đúng lỗi bạn gặp trong wizard.

4. Commit local (không push)
   - Thought: Repo rule yêu cầu commit mọi thay đổi code.
   - Action:
     - `git status`
     - `git add` file đã sửa (và kèm `.factory/docs` nếu có phát sinh)
     - `git diff --cached` kiểm tra an toàn
     - `git commit -m "fix(system): guard keydown key in global search"`
   - Reflection: ✓ Hoàn tất theo convention hiện tại.

## Checklist
- [ ] Guard `event.key` trước khi `toLowerCase()` trong `SystemGlobalSearch`
- [ ] Giữ nguyên toàn bộ keyboard behavior hiện tại
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Commit local (không push)

Nếu bạn duyệt spec này, mình sẽ implement ngay.
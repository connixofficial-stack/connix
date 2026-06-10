## Problem Graph
1. Fix warning `no-unused-vars` tại `app/admin/posts/[id]/edit/page.tsx` <- depends on 1.1
   1.1 Biến `router` được khai báo nhưng không dùng <- ROOT CAUSE

## Execution (with reflection)
1. Solving 1.1 (ROOT CAUSE)...
   - Thought: Warning xuất phát từ `const router = useRouter();` nhưng file không dùng `router` ở đâu.
   - Action: Xóa import `useRouter` khỏi `next/navigation` và xóa dòng `const router = useRouter();`.
   - Reflection: ✓ Valid — fix đúng trọng tâm, không đổi logic runtime vì biến chưa từng được sử dụng.

2. Verify sau chỉnh sửa
   - Thought: Cần xác nhận warning biến mất.
   - Action: Chạy lại đúng lệnh bạn dùng: `bunx oxlint --type-aware --type-check --fix` (hoặc tối thiểu lint file này nếu bạn muốn nhanh hơn).
   - Reflection: ✓ Valid — đảm bảo warning đã được xử lý thực tế.

3. Theo rule repo sau khi có thay đổi code
   - Action: Chạy `bunx tsc --noEmit`.
   - Action: Commit với message ngắn gọn, add cả `.factory/docs` nếu thư mục có thay đổi.
   - Reflection: ✓ Valid — đúng convention trong `CLAUDE.md/AGENTS.md`.

### Files sẽ thay đổi
- `app/admin/posts/[id]/edit/page.tsx`
  - Remove: `import { useRouter } from 'next/navigation';`
  - Remove: `const router = useRouter();`

### Kết quả mong đợi
- Không còn warning `eslint(no-unused-vars)` cho `router`.
- Không thay đổi hành vi trang edit post.
- Pass typecheck theo rule dự án.
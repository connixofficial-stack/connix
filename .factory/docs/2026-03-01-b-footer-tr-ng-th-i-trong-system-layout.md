## Problem Graph
1. Bỏ phần footer trạng thái khỏi toàn bộ `/system` <- depends on 1.1, 1.2
   1.1 Xác định đúng nơi render footer <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Footer đang render trực tiếp trong `app/system/layout.tsx` (khối `<footer ...>` chứa `t.footer.systemHealthy`)
   1.2 Dọn i18n key không còn dùng sau khi xoá footer

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Footer được hardcode trong layout gốc nên chỉ cần sửa 1 file là áp dụng cho toàn bộ route `/system`.
   - Action: Cập nhật `app/system/layout.tsx`:
     - Xoá toàn bộ block `/* System Status Bar */` (thẻ `<footer>` cuối layout).
     - Giữ nguyên `main` spacing hiện tại (`p-4 sm:p-6`) theo yêu cầu “Giữ như hiện tại (không tăng)”.
   - Reflection: ✓ Valid — đúng phạm vi toàn bộ `/system`, không ảnh hưởng các phần khác.

2. Solving 1.2...
   - Thought: Sau khi xoá footer, key `t.footer.systemHealthy` sẽ thành dead key trong i18n.
   - Action: Cập nhật `app/system/i18n/translations.ts`:
     - Xoá object `footer` trong `vi` (`systemHealthy`).
     - Xoá object `footer` tương ứng trong `en` để đồng bộ type `const en: typeof vi`.
   - Reflection: ✓ Valid — tránh key thừa, giữ type an toàn.

3. Validation trước commit
   - Chạy duy nhất: `bunx tsc --noEmit` (theo rule dự án khi có thay đổi TS/code).
   - Nếu pass, tạo commit local (không push).
   - Commit sẽ include cả `.factory/docs` nếu có thay đổi trong thư mục này.

4. Git workflow thực thi
   - `git status`
   - `git diff --cached` (sau khi stage) để rà soát secrets/sensitive data
   - `git add` các file đã sửa
   - `git commit -m "refactor(system-layout): remove status footer from /system"`
   - `git status` xác nhận clean

### Files sẽ thay đổi
- `app/system/layout.tsx` (xoá footer status bar)
- `app/system/i18n/translations.ts` (xoá key `footer.systemHealthy` ở vi/en)

### Kết quả kỳ vọng
- Toàn bộ trang trong `/system` không còn dòng “Hệ thống: Hoạt động tốt”.
- Không đổi spacing `main` (giữ nguyên như hiện tại).
- Không còn i18n key thừa liên quan footer.
- TypeScript pass và có commit local hoàn chỉnh.
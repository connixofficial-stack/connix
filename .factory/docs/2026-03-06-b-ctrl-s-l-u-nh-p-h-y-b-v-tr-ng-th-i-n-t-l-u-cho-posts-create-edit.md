## Problem Graph
1. [Main] Đồng bộ action bar của Posts create/edit theo UX mới <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Loại bỏ các thao tác không mong muốn (Ctrl+S, Lưu nháp, Hủy bỏ)
   1.2 [Sub] Thêm cơ chế nhận diện thay đổi (dirty-check) cho trang edit
   1.3 [Sub] Cập nhật trạng thái nút submit đúng ngữ cảnh create vs edit

## Execution (with reflection)
1. Solving 1.1 (remove actions)
   - Thought: Hiện đang gắn `useFormShortcuts` + có 3 control ở footer cả create/edit.
   - Action:
     - File `app/admin/posts/[id]/edit/page.tsx`: bỏ import `useCallback`, bỏ import `useFormShortcuts`, xóa `handleSaveShortcut`, `handleCancelShortcut`, và xóa call `useFormShortcuts(...)`.
     - File `app/admin/posts/create/page.tsx`: làm tương tự (bỏ toàn bộ logic Ctrl+S/Esc).
     - Ở cả 2 file: trong footer xóa text `Ctrl+S để lưu`, xóa nút `Lưu nháp`, xóa nút `Hủy bỏ`.
   - Reflection: ✓ Đúng yêu cầu “bỏ Ctrl+S, Lưu Nháp, Hủy bỏ”.

2. Solving 1.2 (dirty-check edit)
   - Thought: Cần chỉ cho phép “Cập nhật” khi có thay đổi thực sự; ngược lại hiển thị “Đã lưu” và disable.
   - Action:
     - Trong `app/admin/posts/[id]/edit/page.tsx`, tạo `initialFormRef` (hoặc `initialSnapshot`) sau khi `postData` load, gồm các field đang submit: `title, slug, content, excerpt, metaTitle, metaDescription, thumbnail, categoryId, authorName, status`.
     - Tạo `hasChanges` bằng `useMemo` so sánh snapshot hiện tại với snapshot ban đầu (so sánh primitive trực tiếp; normalize string bằng `trim()` theo đúng submit behavior).
     - Sau submit thành công, cập nhật lại snapshot ban đầu = giá trị hiện tại để nút chuyển về trạng thái “Đã lưu”.
   - Reflection: ✓ Bảo đảm trạng thái nút phản ánh đúng dữ liệu đã lưu.

3. Solving 1.3 (button behavior)
   - Thought: User đã chốt: áp dụng cả create+edit; text khi không đổi là `Đã lưu`; create giữ text `Đăng bài`.
   - Action:
     - `app/admin/posts/[id]/edit/page.tsx`:
       - Nút submit: `disabled={isSubmitting || !hasChanges}`.
       - Label: `isSubmitting ? 'Đang lưu...' : hasChanges ? 'Cập nhật' : 'Đã lưu'`.
       - Title/tooltip bỏ tham chiếu Ctrl+S.
     - `app/admin/posts/create/page.tsx`:
       - Nút submit chỉ còn một nút duy nhất `Đăng bài`.
       - `disabled={isSubmitting || !title.trim() || !categoryId}` để giữ validate hiện tại.
       - Không thêm trạng thái `Đã lưu` cho create (theo chốt yêu cầu).
   - Reflection: ✓ Tách đúng ngữ nghĩa create/edit, không ép logic edit sang create.

4. Verification
   - Chạy `bunx tsc --noEmit` sau khi sửa code TS/TSX.
   - Manual check:
     - Edit: vào `/admin/posts/[id]/edit` -> chưa sửa gì: nút `Đã lưu` disabled; sửa 1 field: nút thành `Cập nhật` clickable; bấm lưu thành công -> quay lại `Đã lưu` disabled.
     - Create: không còn Ctrl+S/Lưu nháp/Hủy bỏ; nút `Đăng bài` hoạt động theo điều kiện hợp lệ form.

5. Commit plan (sau khi implement)
   - `git add` 2 file posts create/edit (+ `.factory/docs` nếu có phát sinh theo rule repo).
   - `git diff --cached` + `git status` kiểm tra không lộ secret.
   - Commit message đề xuất: `refactor(posts-admin): simplify action bar and add dirty-state save button`

## Checklist chốt với anh/chị
- [x] Áp dụng cho **cả create + edit posts**
- [x] Bỏ **Ctrl+S**, **Lưu nháp**, **Hủy bỏ**
- [x] Trang edit: chỉ khi có thay đổi mới hiện **Cập nhật** và click được
- [x] Trang edit: không đổi dữ liệu thì hiện **Đã lưu** và disable
- [x] Trang create: giữ nút **Đăng bài** theo validate form
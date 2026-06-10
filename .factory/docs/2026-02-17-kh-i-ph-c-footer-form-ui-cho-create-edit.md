## Problem Graph
1. [Main] Khôi phục Footer từ JSON editor sang form typed cho cả create + edit, vẫn tương thích dữ liệu cũ <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] `footer/[id]/edit/page.tsx` đang dùng `ConfigJsonForm` thay vì form fields Footer
   1.2 Cần chuẩn hoá logic normalize/fallback config để đọc được dữ liệu cũ (thiếu field)
   1.3 Cần tái sử dụng UI form giữa create/edit để tránh lặp code (DRY)
   1.4 Cần giữ nguyên preview + flow save hiện tại

## Execution (with reflection)
1. Tạo component form typed dùng chung
   - File mới: `app/admin/home-components/footer/_components/FooterForm.tsx`
   - Nội dung:
     - Props tối thiểu: `value: FooterConfig`, `onChange`, `brandMode`, `brandColors` (nếu cần cho UX), `disabled?`.
     - Render đầy đủ field form cho Footer (logo, description, copyright, columns, social links, showSocialLinks, style) theo pattern UI hiện có trong project.
     - Các thao tác add/remove/update item cho `columns` và `socialLinks` dùng immutable update.
   - Reflection: đảm bảo component không chứa logic fetch/mutation; chỉ thuần UI + state callbacks.

2. Chuẩn hoá helper normalize config với fallback an toàn
   - Cập nhật: `app/admin/home-components/footer/_lib/constants.ts` (hoặc thêm helper mới trong `_lib` nếu file đã có pattern tương tự).
   - Bổ sung hàm kiểu `normalizeFooterConfig(raw): FooterConfig`:
     - fallback từng field về `DEFAULT_FOOTER_CONFIG` khi thiếu/sai kiểu.
     - giữ tương thích record cũ từ JSON editor.
   - Reflection: helper dùng chung ở create/edit để nhất quán dữ liệu.

3. Refactor trang create Footer sang dùng `FooterForm`
   - File: `app/admin/home-components/create/footer/page.tsx`
   - Thay phần cấu hình (nếu đang JSON/inline) bằng `<FooterForm .../>`.
   - Dùng `normalizeFooterConfig` khi init state nếu cần.
   - Giữ nguyên mutation create, toast, preview, style switch và UX hiện tại.
   - Reflection: không đổi contract dữ liệu gửi backend (`FooterConfig`).

4. Refactor trang edit Footer bỏ `ConfigJsonForm`
   - File: `app/admin/home-components/footer/[id]/edit/page.tsx`
   - Gỡ import/use `ConfigJsonForm`, thay bằng `FooterForm`.
   - Khi load component:
     - dùng `normalizeFooterConfig(component.config)` để set state + initialData.
   - Giữ nguyên:
     - title/active controls,
     - `hasChanges` logic,
     - mutation update,
     - preview `FooterPreview`.
   - Reflection: đảm bảo không làm đổi hành vi save/route guard cho type Footer.

5. Dọn phụ thuộc và kiểm tra type
   - Loại import không còn dùng sau refactor.
   - Chạy validator theo rule repo: `bunx tsc --noEmit`.
   - Nếu lỗi type, sửa trực tiếp tại các file liên quan đến Footer form cho đến khi pass.
   - Reflection: chỉ chốt khi không còn TS diagnostics.

6. Commit theo yêu cầu project
   - Review thay đổi: `git status` + `git diff --cached` trước commit để tránh lộ dữ liệu nhạy cảm.
   - Commit 1 commit tập trung cho Footer form restore (không push).

## Kết quả mong đợi
- `/admin/home-components/create/footer` và `/admin/home-components/footer/[id]/edit` đều dùng form UI typed, không còn editor JSON.
- Dữ liệu cũ vẫn mở/lưu được nhờ fallback default an toàn.
- Preview + save flow giữ nguyên, typecheck pass.
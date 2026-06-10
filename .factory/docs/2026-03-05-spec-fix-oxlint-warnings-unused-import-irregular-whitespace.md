## Root cause
1. `app/admin/subscriptions/page.tsx` import dư `BulkDeleteConfirmDialog` nhưng không dùng.
2. `components/data/SeedWizardDialog.tsx` có BOM/irregular whitespace ngay đầu file trước `'use client';`.

## Kế hoạch fix
1. Xóa import không dùng
- File: `app/admin/subscriptions/page.tsx`
- Xóa dòng:
  - `import { BulkDeleteConfirmDialog } from '../components/BulkDeleteConfirmDialog';`
- Không đổi logic khác.

2. Xóa ký tự BOM/irregular whitespace đầu file
- File: `components/data/SeedWizardDialog.tsx`
- Chuẩn hóa ký tự đầu file để bắt đầu đúng bằng `'use client';` (không BOM, không khoảng trắng lạ).
- Không đổi nội dung logic.

3. Verify
- Chạy lại: `bunx oxlint --type-aware --type-check --fix`
- Đảm bảo 2 warning trên biến mất.
- Theo rule repo, chạy thêm `bunx tsc --noEmit` nếu có thay đổi TS/code.

4. Commit
- Commit local và include `.factory/docs` nếu có file spec mới theo quy định repo.

## Acceptance checklist
- [ ] Không còn warning `no-unused-vars` cho `BulkDeleteConfirmDialog`.
- [ ] Không còn warning `no-irregular-whitespace` ở `SeedWizardDialog.tsx`.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit local.
## Problem Graph
1. [Main] Bunx oxlint cảnh báo `no-unused-vars` tại `SeedWizardDialog.tsx`
   1.1 [ROOT CAUSE] Biến `seedModule` được khai báo nhưng không sử dụng

## Execution (with reflection)
1. Sửa đúng 1 điểm trong `components/data/SeedWizardDialog.tsx`
   - Xóa dòng: `const seedModule = useMutation(api.seedManager.seedModule);`
   - Không đụng vào logic khác để đảm bảo KISS/YAGNI.
   - Reflection: ✓ Đúng theo lựa chọn của anh (xóa hẳn).

2. Verify
   - Chạy lại: `bunx oxlint --type-aware --type-check --fix`
   - Kỳ vọng: hết warning `no-unused-vars` cho `seedModule`.
   - Reflection: ✓ Xác nhận fix thực tế bằng chính command anh đang dùng.

3. Hoàn tất
   - Commit thay đổi với message ngắn theo style repo, ví dụ: `fix(seed): remove unused seedModule mutation in wizard dialog`.
   - (Không push).

## Checklist
- [x] Xóa biến thừa `seedModule`
- [x] Không thay đổi hành vi seeding
- [x] Re-run oxlint để xác nhận sạch cảnh báo
- [x] Commit local
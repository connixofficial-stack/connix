## Problem Graph
1. [Main] Thêm toggle trong Module Products để ẩn toàn bộ chức năng Excel ở `/admin/products` <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Chưa có setting module để điều khiển Excel actions
   1.2 UI `/admin/products` đang luôn render nút Excel, chưa đọc setting bật/tắt

## Execution (with reflection)
1. Solving 1.1.1 (Bổ sung setting module)
   - Thought: Cần dùng đúng cơ chế settings hiện có để tránh xung đột kiến trúc module.
   - Action:
     - Sửa `lib/modules/configs/products.config.ts`.
     - Thêm setting mới trong nhóm `general`:
       - `key: 'enableExcelActions'`
       - `label: 'Bật Import/Export Excel'`
       - `type: 'toggle'`
       - `default: true` (theo yêu cầu của bạn: mặc định Bật)
   - Reflection: ✓ Valid (không thêm pattern mới, dùng đúng ModuleConfigPage hiện có).

2. Solving 1.2 (Ẩn UI Excel ở admin products)
   - Thought: Bạn chọn “chỉ ẩn nút UI”, nên không chặn API Convex để giữ scope gọn.
   - Action:
     - Sửa `app/admin/products/page.tsx`:
       - Đọc `settingsData` và derive `excelActionsEnabled` từ `settingKey === 'enableExcelActions'`.
       - Chỉ render các control Excel khi `excelActionsEnabled === true`:
         - `Tải file mẫu`
         - `Import Excel`
         - `Xuất theo lọc`
         - `Xuất toàn bộ`
         - `input type=file` ẩn cho import.
       - Thêm guard mềm trong handlers (`handleDownloadTemplate`, `handleImportClick`, `handleExport`) để return sớm nếu setting tắt (an toàn khi state cũ còn giữ).
   - Reflection: ✓ Valid (đúng yêu cầu ẩn UI, không thay đổi behavior API backend).

## Ordered actions (file-level)
1. Update `lib/modules/configs/products.config.ts` thêm `enableExcelActions` trong `settings` (group `general`, default `true`).
2. Update `app/admin/products/page.tsx` để:
   - derive `excelActionsEnabled` từ `settingsData`.
   - wrap render block nút Excel bằng điều kiện này.
   - thêm early-return guard trong các handler Excel.
3. Verify typecheck: `bunx tsc --noEmit`.
4. Commit local 1 commit (không push).

## Gate matrix
### Critical
- [ ] Setting mới hiển thị trong Module Products > Cài đặt chung.
- [ ] Mặc định setting = Bật.
- [ ] Khi tắt setting, toàn bộ nút Excel + input file không còn xuất hiện tại `/admin/products`.
- [ ] Không ảnh hưởng các chức năng khác của trang Products.
- [ ] `bunx tsc --noEmit` pass.

### Non-critical
- [ ] Không thêm chặn API Convex (theo đúng scope bạn chọn “chỉ ẩn UI”).

## Warnings
- Vì bạn chọn chỉ ẩn UI, API import/export vẫn callable nếu ai gọi trực tiếp từ client/devtools. Nếu sau này cần harden, có thể thêm gate ở Convex bằng cùng setting này.

## Next-safe-step
Nếu bạn duyệt, mình sẽ implement đúng 2 file trên, chạy `bunx tsc --noEmit`, rồi commit local ngay.
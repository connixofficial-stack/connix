## Audit Summary
- Observation: spacing dọc của header hiện đang hard-code trong preview/site bằng các class như `py-3`, `py-4`, `px-6 py-4`, xuất hiện riêng cho từng layout (`classic`, `topbar`, `allbirds`).
- Observation: editor `/system/experiences/menu` hiện có các control cho logo size, nền logo, separator..., nhưng chưa có field nào điều khiển spacing trên/dưới của hàng header chính.
- Observation: phần user muốn chỉnh là hàng header chính chứa logo/menu/search/CTA, không phải topbar hay mobile menu.
- Decision đã chốt với bạn:
  1. Chỉ áp dụng cho hàng header chính
  2. Dùng 1 mức chung nhiều nấc
  3. Hỗ trợ cả 3 layout
  4. Mặc định giữ gần hiện trạng

## Root Cause Confidence
- High — nguyên nhân gốc là spacing đang được encode trực tiếp trong className của từng layout, nên user không thể tinh chỉnh từ experience editor. Evidence nằm ở:
  - `components/experiences/previews/HeaderMenuPreview.tsx`: các block header chính đang dùng `py-3` / `py-4`
  - `components/site/Header.tsx`: site thật cũng hard-code cùng pattern spacing
  - `app/system/experiences/menu/page.tsx`: chưa có field config spacing tương ứng
- Counter-hypothesis đã loại trừ: không phải do logo size hay border làm header “rộng”, vì ngay cả khi giữ logo như cũ thì `py-*` cố định vẫn làm chiều cao header neo ở mức hiện tại.

## Proposal
1. Mở rộng config với 1 field spacing mới
   - File `components/experiences/previews/HeaderMenuPreview.tsx`
   - File `components/site/Header.tsx`
   - Thêm field mới vào config type, ví dụ: `headerSpacingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7`
   - Default ở mức giữa, tương đương gần spacing hiện trạng để backward compatible.

2. Thêm control trong editor `/system/experiences/menu`
   - File `app/system/experiences/menu/page.tsx`
   - Thêm select hoặc segmented control tên kiểu: `Độ thoáng header`
   - 5–7 nấc rõ ràng, ví dụ từ `Rất gọn` → `Mặc định` → `Rất thoáng`
   - Field này nằm gần `Kích thước logo` vì cả hai cùng tác động đến chiều cao header.
   - Khi merge config từ server, fallback về mức mặc định nếu config cũ chưa có field này.

3. Chuẩn hoá map spacing dùng chung cho cả preview và site
   - Tạo mapping từ `headerSpacingLevel` sang padding Y thực tế theo từng layout, ví dụ:
     - `classic`: từ compact hơn một chút đến thoáng hơn một chút quanh mốc `py-4`
     - `topbar`: quanh mốc `py-3`
     - `allbirds`: quanh mốc `py-4`
   - Dùng 1 helper map trong preview và 1 helper tương đương ở site để đảm bảo parity.
   - Không đổi spacing của topbar, dropdown, mobile menu theo đúng scope đã chốt.

4. Áp dụng vào 3 layout
   - `HeaderMenuPreview.tsx`
     - Classic: thay `px-6 py-4 border-b` bằng class/style được tính từ spacing level
     - Topbar: thay `px-4 py-3 border-b`
     - Allbirds: thay `px-6 py-4`
   - `Header.tsx`
     - Làm tương tự cho site thật ở 3 layout
   - Giữ nguyên horizontal spacing (`px-*`) nếu user chỉ yêu cầu vertical spacing.

5. Giữ thay đổi nhỏ, dễ rollback
   - Không thêm config mới cho topbar/mobile menu
   - Không đổi layout logic nav/search/logo ngoài việc thay padding Y
   - Không thay đổi behavior của config cũ nếu field mới không tồn tại

## Post-Audit Notes
- Pass criteria:
  1. Editor có control `Độ thoáng header` hoặc tên tương đương
  2. Đổi nấc spacing làm preview thay đổi chiều cao hàng header chính ngay
  3. Site thật render giống preview ở cả `classic`, `topbar`, `allbirds`
  4. Topbar và mobile menu không bị ảnh hưởng
  5. Mức mặc định gần hiện trạng, không làm lệch giao diện cũ

## Verification Plan
- Static review:
  - kiểm tra field mới được merge an toàn với config cũ
  - kiểm tra parity preview/site cho 3 layout
  - kiểm tra chỉ padding Y của main header row thay đổi, không lan sang topbar/mobile menu
  - kiểm tra type union cho spacing level không gây lỗi save/load
- Theo rule repo, không chạy lint/test runtime/build.
- Nếu bạn duyệt implement, tôi sẽ self-review tĩnh và chạy `bunx tsc --noEmit` vì có thay đổi TypeScript.
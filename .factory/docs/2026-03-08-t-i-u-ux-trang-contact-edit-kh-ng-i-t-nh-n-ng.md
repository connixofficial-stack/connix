## Audit Summary
### Observation (evidence)
- Trang edit đang có nhiều khối dọc liên tiếp: phần meta + cảnh báo + `ConfigEditor` (5 card) + preview/color, làm chiều cao dài và khó scan nhanh.  
  - `page.tsx`: container `space-y-6`, nhiều block `mb-6`, layout 2 cột chỉ dành cho preview ở dưới (`lg:grid-cols-[1fr,420px]`).
- `ConfigEditor.tsx` chia thành 5 Card riêng (`Cài đặt bản đồ`, `Thông tin liên hệ`, `Cài đặt form liên hệ`, `Social Links`, `Tùy chỉnh văn bản`) khiến người dùng phải cuộn nhiều.
- Toggle hiện dùng `div onClick` cho `showMap/showForm` (khó keyboard/a11y chuẩn, ít affordance).
- Thiếu điều hướng theo ngữ nghĩa trong form dài (không có section-nav/tóm tắt nhanh), nên “khó hiểu mình đang ở đâu”.

### Root-cause Q&A (theo protocol)
1. Triệu chứng: UI dài, cảm giác rối, khó hiểu luồng chỉnh sửa (expected: gọn, scan nhanh).  
2. Phạm vi: admin route Contact edit, ảnh hưởng người cấu hình Home Component Contact.  
3. Tái hiện: ổn định, mở route localhost user gửi là thấy ngay.  
4. Mốc thay đổi gần: code hiện tại đã tách nhiều card và thêm custom color/preview sticky.  
5. Thiếu dữ liệu: chưa có heatmap/analytics thao tác; tạm dùng heuristic UX + cấu trúc DOM hiện tại.  
6. Giả thuyết thay thế: do text dài hoặc lỗi nội dung; loại trừ một phần vì vấn đề chính đến từ information architecture (5 card dọc + thiếu grouping).  
7. Rủi ro fix sai: nếu chỉ “đẹp lại” nhưng không đổi cấu trúc nhận thức, vẫn dài và khó dùng.  
8. Pass/fail: giảm cuộn, tăng khả năng scan, giữ nguyên field + payload + validation + save flow.

## Root Cause Confidence
**High** — Bằng chứng trực tiếp từ cấu trúc component hiện tại cho thấy vấn đề nằm ở hierarchy và grouping, không phải business logic hay thiếu tính năng.

## Proposal (không đổi tính năng, chỉ tối ưu UX)
### 1) Re-layout trang edit để giảm cuộn và rõ luồng
- File: `app/admin/home-components/contact/[id]/edit/page.tsx`
- Đổi bố cục desktop thành 2 cột ngay từ đầu:  
  - Cột trái: form cấu hình.  
  - Cột phải (sticky): Preview + Màu custom + trạng thái cảnh báo màu + action Save/Cancel (giữ nguyên logic disable/save).
- Giữ mobile 1 cột (responsive-first), nhưng thêm “quick summary” ngắn trên đầu: `Tiêu đề`, `Trạng thái`, `Style đang chọn`.

### 2) Rút gọn hierarchy của ConfigEditor bằng nhóm có thể thu gọn (accordion)
- File: `app/admin/home-components/contact/_components/ConfigEditor.tsx`
- Thay 5 Card dọc bằng 3 nhóm chính (accordion/shadcn):
  1. **Thông tin chính**: bản đồ + thông tin liên hệ  
  2. **Form liên hệ**: toggle form + field selector + nội dung form  
  3. **Nội dung mở rộng**: social links + tùy chỉnh văn bản
- Mặc định mở nhóm 1; nhóm còn lại collapse để giảm noise.  
- Không bỏ bất kỳ field nào; chỉ đổi vị trí hiển thị.

### 3) Chuẩn hóa điều khiển toggle cho dễ hiểu và a11y
- File: `ConfigEditor.tsx`, `page.tsx`
- Đổi các `div onClick` toggle sang `Switch`/`button` semantic (shadcn pattern) có keyboard + focus-visible rõ.
- Label ngắn gọn hơn (text economy), ví dụ:  
  - `Hiển thị bản đồ` (giữ)  
  - `Hiển thị form liên hệ` → `Bật form liên hệ`
- Giữ nguyên state (`showMap`, `showForm`, `active`) và payload.

### 4) Giảm tải nhận thức bằng progressive disclosure + microcopy ngắn
- File: `ConfigEditor.tsx`
- Chỉ hiển thị metadata bản đồ khi `showMap=true` (đã có), nhưng rút gọn câu chữ thành bullet ngắn 1 dòng/ý.
- Với `showForm=false`, ẩn toàn bộ sub-fields (đã có) và thêm hint ngắn “Bật form để chỉnh tiêu đề/nút gửi/trường nhập”.
- Validation message giữ nguyên logic, chuẩn hóa vị trí gần field để scan lỗi nhanh hơn.

### 5) Giữ nguyên contract dữ liệu
- Không đổi: `ContactConfigState`, normalize/validation/payload (`normalizeContactConfig`, `validateContactConfig`, `toContactConfigPayload`), queries/mutations.
- Chỉ thay presentation layer và bố cục.

## Verification Plan
1. **Typecheck**: `bunx tsc --noEmit` (vì có sửa TS/TSX).  
2. **Repro UX tại route user gửi**:  
   - Mở `/admin/home-components/contact/k974bkz6rk9k5qpz6wcv2zt7b182hzvw/edit`.  
   - Xác nhận form ngắn hơn khi mới vào (accordion collapse + sticky right rail).  
3. **Functional parity checklist** (không đổi tính năng):  
   - Edit title/active/save thành công.  
   - Toggle map/form/social/text giữ đúng dữ liệu sau lưu + reload.  
   - Validation phone/email vẫn chặn submit như cũ.  
   - Preview/style/color custom vẫn hoạt động.  
4. **A11y quick check**: tab được vào toggle, focus-visible rõ, thao tác keyboard bật/tắt được.

Nếu bạn duyệt, mình sẽ triển khai đúng phạm vi trên, không thêm tính năng mới.
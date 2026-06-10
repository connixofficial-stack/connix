## Audit Summary
**Observation**
- Route anh nêu (`/admin/home-components/contact/[id]/edit`) dùng `ConfigEditor` và đang render:
  - `FormFieldsSelector` = checkbox tĩnh 5 field (`name/email/phone/subject/message`), không có UX dạng row động.
  - `ContactInfoItemsManager` = có add/remove/drag nhưng phần icon đang là `<select>` text option nên “không thấy icon”.
- `iconOptions.ts` đã có sẵn đúng **100 icon Lucide** trong `CONTACT_ICON_OPTIONS`.
- Dữ liệu site/preview đang đọc `contactItems[].icon` qua `renderContactIcon`, nên chỉ cần đổi UI chọn icon, không cần đổi contract render.

**Root-cause checklist (rút gọn 6/8)**
1) Expected vs actual: expected chọn icon trực quan/popup + form động; actual icon select text + form checkbox tĩnh.  
2) Scope: admin create/edit Contact component; ảnh hưởng config UX, không đổi API public nếu giữ model cũ.  
3) Repro: ổn định 100% tại page edit/create Contact.  
4) Mốc thay đổi gần nhất: chưa thấy evidence có popup picker; pattern hiện tại là native select.  
6) Counter-hypothesis: “icon mất do data sai” bị loại trừ vì preview render icon đúng khi có `icon` key hợp lệ.  
8) Pass/fail: pass khi có popup grid+search chọn được icon và form editor dạng rows add/remove/reorder hoạt động.

**Decision đã chốt với anh**
- Form: **A UI động như rows** (giữ data model hiện tại).
- Icon picker: **C Popup grid + search** (100 icon, layout 10x10).

## Root Cause Confidence
**High** — vì đã trace trực tiếp file đang dùng ở route edit/create:
- `.../contact/_components/FormFieldsSelector.tsx` (checkbox tĩnh)
- `.../contact/_components/ContactInfoItemsManager.tsx` (icon select text)
- `.../contact/_lib/iconOptions.ts` (đã có 100 icon, thiếu UI picker)

## Proposal (implementation plan)
1. **Tạo icon picker popup tái sử dụng**
   - File mới: `app/admin/home-components/contact/_components/IconPickerDialog.tsx`.
   - Dùng component dialog có sẵn trong hệ UI repo (bám pattern hiện có), gồm:
     - Ô search theo `label` + `value`.
     - Grid 10 cột x 10 hàng tối đa (100 icon).
     - Mỗi item hiển thị icon + trạng thái selected.
   - Props: `open`, `onOpenChange`, `value`, `onSelect`, `options`.

2. **Refactor ContactInfoItemsManager để bỏ select text**
   - Thay `<select>` bằng nút “icon preview + tên” mở `IconPickerDialog`.
   - Giữ nguyên add/remove/drag/drop và shape `ContactInfoItem`.
   - Không đổi normalize/validation contract.

3. **Đổi FormFieldsSelector sang UI động kiểu row manager (như MXH/Dòng thông tin)**
   - Giữ output vẫn là `string[] formFields` (để không phá site/preview).
   - UX mới:
     - Danh sách row đã chọn (draggable).
     - Nút “Thêm trường” từ pool 5 field chuẩn (không trùng).
     - Xóa row + reorder.
   - Không thêm schema field builder (đúng lựa chọn A).

4. **Kết nối lại trong ConfigEditor (create + edit tự hưởng)**
   - `ConfigEditor` vẫn gọi `FormFieldsSelector` và `ContactInfoItemsManager` nhưng nhận UI mới.
   - Vì create/edit dùng chung `ConfigEditor`, không cần sửa luồng submit.

5. **Rà soát tĩnh tương thích**
   - Đảm bảo id drag/drop vẫn ổn khi number/string.
   - Đảm bảo search popup không làm mất hiệu năng (memoized filter).
   - A11y cơ bản: focus-visible, keyboard close dialog.

## File dự kiến thay đổi
- `app/admin/home-components/contact/_components/ContactInfoItemsManager.tsx`
- `app/admin/home-components/contact/_components/FormFieldsSelector.tsx`
- `app/admin/home-components/contact/_components/IconPickerDialog.tsx` (new)
- (nếu cần) `app/admin/home-components/contact/_components/ConfigEditor.tsx` (chỉ wiring nhỏ)

## Verification Plan
- **Typecheck**: theo guideline repo, sau khi đổi code TS sẽ chạy `bunx tsc --noEmit` trước commit.
- **Repro thủ công**:
  1) Vào create Contact: thêm/xóa/sắp xếp form fields hoạt động.  
  2) Vào “Dòng thông tin liên hệ”: bấm chọn icon mở popup, search được, chọn icon cập nhật tức thì.  
  3) Edit component cũ: dữ liệu cũ vẫn load bình thường, không vỡ preview.  
  4) Lưu thành công và reload còn giữ đúng icon/field order.
- **Test/Lint**: không tự chạy thêm nếu anh không yêu cầu (theo project guideline).
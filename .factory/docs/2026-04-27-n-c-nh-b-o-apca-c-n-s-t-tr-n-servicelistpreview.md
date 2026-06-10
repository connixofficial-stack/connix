# I. Primer

## 1. TL;DR kiểu Feynman
- Dòng cảnh báo vẫn hiện vì nó không nằm trong `ServiceListForm` hay route edit nữa.
- Nó đang được render trực tiếp trong `ServiceListPreview.tsx`.
- Cần xóa đúng 2 phần: tạo `warningMessages` và khối JSX màu vàng hiển thị nó.
- Giữ nguyên `getServiceListValidationResult` vì preview vẫn cần `validation.tokens` để render màu đúng.
- Không dùng regex bulk nữa; chỉ sửa bằng exact edit theo block đã đọc.

## 2. Elaboration & Self-Explanation
Trang `/admin/home-components/service-list/.../edit` gọi component preview ở cột phải. Route edit truyền `brandColor`, `secondary`, `mode` vào `ServiceListPreview`. Trong `ServiceListPreview`, code vẫn tự tính validation rồi tạo text cảnh báo: `Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = ...)`. Vì vậy dù route edit và form đã không truyền `warningMessages`, cảnh báo vẫn hiện từ bên trong preview.

Hướng xử lý đúng là không xóa validation toàn bộ. `validation.tokens` vẫn là dữ liệu cần thiết cho `ServiceListSectionShared` để preview có màu đúng. Chỉ xóa phần biến `warningMessages`, icon import phục vụ cảnh báo, và JSX render hộp amber.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể: trong `ServiceListPreview.tsx`, dòng grep cho thấy `warningMessages` tạo message APCA tại `_components/ServiceListPreview.tsx:107-115`, sau đó render tại `:159-164`.
- Analogy: route edit giống người gọi món, còn `ServiceListPreview` giống bếp tự rắc thêm tiêu. Ta đã bảo người gọi món không yêu cầu tiêu nữa, nhưng bếp vẫn tự rắc; cần sửa đúng ở bếp.

# II. Audit Summary (Tóm tắt kiểm tra)

Observation:
- URL user báo: `/admin/home-components/service-list/js79an6ms44jpcna3wteqfj9xh85gmvj/edit`.
- `ServiceListForm.tsx` hiện không còn prop/render `warningMessages`.
- `service-list/[id]/edit/page.tsx` hiện không còn truyền `warningMessages` vào `ServiceListForm` hoặc `ServiceListPreview`.
- `ServiceListPreview.tsx` vẫn còn:
  - import `AlertTriangle, Eye` từ `lucide-react`.
  - `const warningMessages = React.useMemo(...)` tạo message `APCA (minLc = ...)`.
  - JSX `{warningMessages.length > 0 && (...)}` render hộp cảnh báo màu vàng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Root Cause Confidence: High.

Lý do:
- Chuỗi user thấy khớp trực tiếp với string trong `ServiceListPreview.tsx`.
- Route edit đang render `<ServiceListPreview ... />`, nên cảnh báo xuất hiện trong preview là đúng luồng.
- `ServiceListForm.tsx` không còn render warning, loại trừ giả thuyết cảnh báo đến từ form.

Counter-Hypothesis:
- Có thể còn cảnh báo tương tự ở component khác, nhưng với URL service-list edit hiện tại, source trực tiếp là `ServiceListPreview.tsx`.
- Có thể cache dev server giữ UI cũ, nhưng file hiện tại vẫn có string cảnh báo nên chưa cần giả định cache.

# IV. Proposal (Đề xuất)

Thực hiện patch hẹp, ưu tiên sửa đúng lỗi user đang thấy:

1. Sửa `app/admin/home-components/service-list/_components/ServiceListPreview.tsx`
   - Xóa import `AlertTriangle, Eye`.
   - Xóa `warningMessages` useMemo.
   - Xóa block JSX render hộp amber warning.
   - Giữ `validation` useMemo và `validation.tokens` nguyên vẹn.
   - Giữ `ColorInfoPanel`, `PreviewWrapper`, `BrowserFrame`, `ServiceListSectionShared` nguyên vẹn.

2. Rà tĩnh sau sửa
   - Đảm bảo không còn reference tới `warningMessages`, `AlertTriangle`, `Eye` trong file.
   - Đảm bảo function vẫn `return (...)` đầy đủ, không lặp lỗi preview trả `void`.

3. Sau khi fix service-list, nếu user đồng ý tiếp tục theo scope ban đầu, áp dụng cùng pattern exact-edit cho các preview/form còn sót khác đã được restore externally:
   - `BlogPreview.tsx`
   - `CareerPreview.tsx`
   - `ContactPreview.tsx`
   - `PricingPreview.tsx`
   - `TeamPreview.tsx`
   - `CountdownForm.tsx`

# V. Files Impacted (Tệp bị ảnh hưởng)

## UI / Preview
- Sửa: `app/admin/home-components/service-list/_components/ServiceListPreview.tsx`
  - Vai trò hiện tại: render preview cho service-list trong trang edit/create và tự hiển thị warning APCA.
  - Thay đổi: bỏ UI warning jargon, giữ validation tokens để preview màu không đổi.

## Có thể sửa tiếp sau khi service-list pass
- Sửa: `app/admin/home-components/blog/_components/BlogPreview.tsx`
  - Vai trò hiện tại: preview blog có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.
- Sửa: `app/admin/home-components/career/_components/CareerPreview.tsx`
  - Vai trò hiện tại: preview career có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.
- Sửa: `app/admin/home-components/contact/_components/ContactPreview.tsx`
  - Vai trò hiện tại: preview contact có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.
- Sửa: `app/admin/home-components/pricing/_components/PricingPreview.tsx`
  - Vai trò hiện tại: preview pricing có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.
- Sửa: `app/admin/home-components/team/_components/TeamPreview.tsx`
  - Vai trò hiện tại: preview team có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.
- Sửa: `app/admin/home-components/countdown/_components/CountdownForm.tsx`
  - Vai trò hiện tại: form countdown có pattern warning tương tự.
  - Thay đổi: bỏ warning UI nếu còn hiện.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại `ServiceListPreview.tsx` ngay trước khi sửa vì file vừa có external modifications.
2. Dùng exact `Edit` để xóa import icon warning.
3. Dùng exact `Edit` để xóa block `warningMessages`.
4. Dùng exact `Edit` để xóa block JSX warning.
5. Grep service-list để xác nhận không còn APCA/minLc trong UI preview.
6. Chạy `bunx tsc --noEmit` vì có thay đổi TypeScript.
7. Nếu typecheck còn fail ở preview khác, xử lý từng file bằng cùng pattern, không dùng bulk regex.
8. Commit toàn bộ thay đổi code và `.factory/docs` nếu mọi thứ pass.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static check (kiểm tra tĩnh): grep trong `app/admin/home-components/service-list` không còn `warningMessages`, `APCA`, `minLc` ở file UI preview/form; giữ APCA trong `_lib/colors.ts` là hợp lệ vì đó là logic nội bộ.
- Typecheck (kiểm tra kiểu): chạy `bunx tsc --noEmit` theo rule repo vì có sửa TS/TSX.
- Manual repro (tester/runtime): mở lại URL user báo và xác nhận hộp cảnh báo `Một số cặp màu chữ/nền... APCA` không còn hiện trong preview.

# VIII. Todo

- [ ] Read latest `ServiceListPreview.tsx` sau external modification.
- [ ] Remove warning icon import.
- [ ] Remove `warningMessages` useMemo.
- [ ] Remove amber warning JSX block.
- [ ] Grep verify service-list UI không còn APCA/minLc warning.
- [ ] Run `bunx tsc --noEmit`.
- [ ] Fix các preview khác nếu typecheck chỉ ra lỗi còn sót.
- [ ] Commit thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Trên service-list edit page, dòng `Một số cặp màu chữ/nền chưa đủ tương phản APCA (minLc = 37.9)` không còn hiển thị.
- Preview ServiceList vẫn render bình thường, không mất BrowserFrame, style selector, ColorInfoPanel, hoặc danh sách dịch vụ.
- `ServiceListSectionShared` vẫn nhận `tokens={validation.tokens}`.
- Không còn unused imports `AlertTriangle`, `Eye` trong `ServiceListPreview.tsx`.
- `bunx tsc --noEmit` pass trước commit.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk chính: xóa nhầm `validation` sẽ làm preview mất token màu hoặc lỗi JSX. Giảm rủi ro bằng exact edit nhỏ, không dùng regex bulk.
- Rollback: nếu có lỗi, restore riêng `ServiceListPreview.tsx` từ git rồi apply lại patch nhỏ hơn.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi thuật toán APCA/minLc/deltaE trong `_lib/colors.ts`.
- Không đổi dữ liệu Convex hoặc màu đang lưu.
- Không redesign UI preview.
- Không xóa ColorInfoPanel vì đó là thông tin màu, không phải warning jargon.
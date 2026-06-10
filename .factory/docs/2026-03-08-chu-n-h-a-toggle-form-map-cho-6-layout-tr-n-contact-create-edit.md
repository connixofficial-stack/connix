## Audit Summary

### Evidence
- `ContactSectionShared.tsx` đã có check `config.showForm`/`config.showMap` ở đủ 6 layout, nhưng một số layout vẫn đang giữ cấu trúc 2 cột cố định khi tắt 1 trong 2 block, có thể tạo khoảng trống/không cân UI.
- `create/contact/page.tsx` đang dùng UI config riêng (thông tin + map toggle thủ công, form config theo style), trong khi `edit` dùng `ConfigEditor` chuẩn hóa đầy đủ toggle/fields.
- `edit` page (`contact/[id]/edit/page.tsx`) đã dùng `ConfigEditor`, nên create/edit hiện đang lệch contract UX và nguy cơ lệch behavior.

### Audit Questions (đã trả lời các câu bắt buộc)
1) Triệu chứng: user muốn cả 6 layout toggle form/map không phá UI, render đẹp ở create + edit.  
3) Repro: ổn định khi bật/tắt showForm/showMap trên từng style trong preview.  
6) Giả thuyết thay thế: không phải lỗi data/query; chủ yếu do layout fallback và create/edit config divergence.  
8) Pass/fail: tắt/bật mọi tổ hợp (form/map) ở 6 layout vẫn cân đối, create và edit cùng behavior.

---

## Root Cause Confidence

**High**
- Root cause #1: Thiếu “layout fallback contract” nhất quán khi một hoặc cả hai block form/map bị tắt.  
- Root cause #2: Create page chưa dùng chung `ConfigEditor` nên UX/config path khác edit, dễ gây mismatch.

---

## Problem Graph
1. [Main] Toggle form/map chưa đảm bảo đẹp cho đủ 6 layout ở create/edit <- depends on 1.1, 1.2
   1.1 [Layout fallback chưa nhất quán] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Một số layout giữ grid/split cứng khi form/map off
   1.2 [Create/Edit parity lệch] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Create dùng form config custom thay vì shared ConfigEditor

---

## Execution (with reflection)
1. Solving 1.1.1
- Thought: mỗi layout cần explicit branch theo 4 trạng thái: both on / form only / map only / both off.
- Action: thêm helper layout-state và class mapping để co giãn cột động.
- Reflection: ✓ đảm bảo không còn khoảng trống khi toggle.

2. Solving 1.2.1
- Thought: parity tốt nhất là create và edit cùng dùng ConfigEditor.
- Action: thay config section ở create bằng `ConfigEditor` giống edit.
- Reflection: ✓ giảm drift, đúng CoC/DRY.

---

## Proposal (step-by-step actionable)

### Bước 1 — Chuẩn hóa contract toggle state cho 6 layouts
**File:** `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- Tạo helper:
  - `const hasForm = Boolean(config.showForm)`
  - `const hasMap = Boolean(config.showMap)`
  - `const hasAux = hasForm || hasMap`
- Mỗi renderer (`modern`, `floating`, `grid`, `elegant`, `minimal`, `centered`) thêm nhánh class theo state:
  - both on: giữ split/grid hiện tại.
  - form only: cột form full-width, map block bỏ hoàn toàn.
  - map only: map block full-width + info block co hợp lý.
  - both off: chỉ giữ info/contact cards; xóa spacing/border thừa (vd `border-t`, `pt-*`, wrapper rỗng).
- Đảm bảo không render container map/form rỗng (tránh “ghost whitespace”).

### Bước 2 — Cố định fallback UI khi both off
**File:** `ContactSectionShared.tsx`
- Áp dụng quyết định user: “Tự co layout, chỉ giữ khối thông tin liên hệ”.
- Với mỗi style:
  - loại bỏ badge/section phụ thuộc form-map nếu không còn ý nghĩa.
  - giữ hierarchy đẹp: heading → info cards → socials (nếu có).
  - cân lại spacing (`mt/pt/border`) chỉ khi block tồn tại.

### Bước 3 — Đồng bộ create page dùng chung ConfigEditor
**File:** `app/admin/home-components/create/contact/page.tsx`
- Xóa các card config thủ công đang trùng chức năng (`Thông tin liên hệ cơ bản`, `Mạng xã hội`, `Cấu hình Form liên hệ`, text fields theo style).
- Thay bằng:
  - `<ConfigEditor value={normalizedConfig} onChange={(next) => setConfig(normalizeContactConfig(next))} title="Cấu hình Contact" />`
- Giữ nguyên luồng submit hiện tại qua `toContactConfigPayload`.
- Giữ preview + color warning logic hiện tại.

### Bước 4 — Giữ edit page parity (không đổi logic)
**File:** `app/admin/home-components/contact/[id]/edit/page.tsx`
- Chỉ verify rằng `ConfigEditor` path giống create sau refactor.
- Không đổi mutation/query logic.

### Bước 5 — Verify contract cho create + edit + runtime preview
**Files check:**
- `/admin/home-components/create/contact`
- `/admin/home-components/contact/[id]/edit`
- `ContactPreview` trong cả hai trang
- Mỗi style test 4 tổ hợp: 
  - showForm=true/showMap=true
  - showForm=true/showMap=false
  - showForm=false/showMap=true
  - showForm=false/showMap=false

---

## Verification Plan
1. Typecheck: `bunx tsc --noEmit`.  
2. Manual visual QA:
   - Create + Edit: đổi style qua 6 layout, toggle form/map theo 4 tổ hợp trạng thái.
   - Xác nhận không có cột rỗng, không border/spacing thừa, thông tin liên hệ vẫn cân đối.
3. Repro criteria:
   - Render preview ổn định khi switch style liên tục và toggle nhanh.
4. Pass criteria:
   - 6/6 layout hỗ trợ toggle form/map không phá UI.
   - Create và Edit cùng behavior/config UI (parity đạt).
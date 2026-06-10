## Audit Summary

### Evidence chính từ codebase (đã đọc)
- Home-component Contact create/edit:  
  - `app/admin/home-components/create/contact/page.tsx`  
  - `app/admin/home-components/contact/[id]/edit/page.tsx`
- Renderer preview/site dùng chung `ContactSectionShared`:  
  - `app/admin/home-components/contact/_components/ContactSectionShared.tsx`  
  - `components/site/ContactSection.tsx`
- Hệ màu Contact hiện tại dùng token + APCA/OKLCH:  
  - `app/admin/home-components/contact/_lib/colors.ts`
- Config editor hiện có toggle `showForm`, nhưng renderer chưa render form thật:  
  - `app/admin/home-components/contact/_components/ConfigEditor.tsx`  
  - `app/admin/home-components/contact/_types/index.ts` (`showForm?: boolean`)  
  - `ContactSectionShared.tsx` chưa dùng `showForm` để hiển thị form.
- Map data source đang bị phân mảnh:
  - Home-component Contact dùng `mapEmbed` trong config riêng.
  - Site `/contact` + experience contact đang dùng settings map (`contact_map_provider`, `contact_google_map_embed_iframe`, lat/lng) qua `useContactPageData`.
- Contact Inbox backend đã sẵn có submit + validation + module feature flags:  
  - `convex/contactInbox.ts` (`submitContactInquiry`, `enableContactFormSubmission`, requireEmail/requirePhone).

### Audit Questions (đáp ứng bắt buộc)
1) Triệu chứng (Expected vs Actual):  
- Expected: 6 layout enterprise-friendly, màu đẹp/đúng skill, map thống nhất, toggle form hoạt động, submit về cùng inbox module.  
- Actual: layout #2 (Floating) và #6 (Centered) thiên decorative/AI-style, form chưa xuất hiện trong home-component runtime, map source tách riêng, parity giữa home-component vs experience/site chưa chặt.

3) Repro ổn định?  
- Có. Điều kiện tối thiểu: mở `/admin/home-components/create/contact` và preview từng style; mở site `/contact`, `system/experiences/contact`, `admin/settings`.

6) Giả thuyết thay thế đã loại trừ?  
- Giả thuyết A: “chỉ cần chỉnh màu là đủ” → loại vì vấn đề chính còn ở cấu trúc layout + map source + form toggle not wired.  
- Giả thuyết B: “giữ map riêng từng home-component để linh hoạt” → loại theo quyết định user + tránh drift dữ liệu.

8) Tiêu chí pass/fail sau sửa?  
- Pass khi: bỏ/thay style #2,#6; 6 layout đều có thể bật/tắt form; form submit dùng `contactInbox`; map lấy từ settings ở cả preview/site; màu đạt guardrails skill; UX enterprise ổn định đa bối cảnh.

(Thêm)
2) Phạm vi ảnh hưởng: admin home-component contact, site Contact section runtime, preview contact, shared form/map utils, integration contact inbox module.

5) Data gap còn thiếu: chưa có benchmark định lượng conversion; xử lý bằng heuristic enterprise UX + APCA + consistency contract.

7) Rủi ro fix sai nguyên nhân: tạo UI đẹp nhưng lệch data flow/inbox, gây regression submit/map ở runtime.

---

## Root Cause Confidence

**High** — vì có evidence trực tiếp trong code:
1. **Layout anti-pattern**: style 2/6 dùng nhiều lớp decorative (blur/overlay, tone nặng) không phù hợp enterprise “99% thuận mắt”.
2. **Parity gap**: `showForm` có trong config nhưng không được thực thi trong `ContactSectionShared` => toggle chưa tác động runtime.
3. **Map source mismatch**: Home-component dùng `mapEmbed` riêng, trong khi /contact + experiences dùng settings map provider => nguy cơ lệch dữ liệu.
4. **Form submission chưa thống nhất cho home-component**: logic submit inbox hiện nằm ở `/contact`, chưa reusable cho 6 layout của home-component.

---

## Problem Graph
1. [Main] Contact ecosystem chưa đạt enterprise best practice <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [UX Layout debt] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Style 2/6 hiện tại không tuân anti AI-styling + visual hierarchy enterprise
   1.2 [Data-source mismatch] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Map config tách giữa home-component và settings
   1.3 [Behavior mismatch] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] showForm có trong schema nhưng chưa wired ở shared renderer
   1.4 [Submission duplication risk] <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Chưa có form engine dùng chung cho 6 layout + /contact

---

## Execution (with reflection)
1. Solving 1.1.1 (layout #2/#6)
- Thought: thay hẳn 2 style bằng 2 layout enterprise-neutral, ưu tiên readability, spacing, cognitive load thấp.
- Action: giữ id style để không vỡ data cũ (`floating`, `centered`) nhưng đổi implementation + label hiển thị.
- Reflection: ✓ Valid (không migration data, giảm blast radius).

2. Solving 1.2.1 (map source)
- Thought: map phải “single source of truth” từ Settings.
- Action: tạo adapter map settings dùng chung cho site + home-component + preview; deprecate mapEmbed input trong contact home-component.
- Reflection: ✓ Valid (đúng yêu cầu user + tránh drift).

3. Solving 1.3.1 (showForm toggle)
- Thought: showForm là UI toggle chung mọi layout.
- Action: wire vào ContactSectionShared để 6 layout conditionally render form block.
- Reflection: ✓ Valid (đúng functional requirement).

4. Solving 1.4.1 (inbox parity)
- Thought: một form engine cho submit/validation để tránh duplicate.
- Action: extract hook/component form dùng `api.contactInbox.submitContactInquiry`, đọc requireEmail/requirePhone từ module settings.
- Reflection: ✓ Valid (DRY + consistency runtime).

---

## Proposal (step-by-step actionable, 1 lần implement)

### Bước 1 — Chuẩn hóa cấu hình Contact style + rename semantic labels
**File:** `app/admin/home-components/contact/_lib/constants.ts`
- Giữ 6 ids hiện có để tương thích dữ liệu.
- Đổi label hiển thị enterprise-oriented:
  - `floating` -> “Executive Panel” (thay UI cũ)
  - `centered` -> “Balanced Split” (thay UI cũ)
- Giữ default style `modern`.

### Bước 2 — Refactor 2 layout #2 và #6 theo enterprise UI (flat, subtle, no decorative blur)
**File:** `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- Thay toàn bộ `renderFloating` và `renderCentered`:
  - **Layout #2 mới (Executive Panel)**: 2 cột rõ ràng (info panel + content panel), border nhẹ, không gradient blur.
  - **Layout #6 mới (Balanced Split)**: heading + 2 block chính (contact info/form) với hierarchy dễ quét mắt.
- Tuân skill anti AI styling:
  - Không blur/backdrop, không shadow nhiều lớp, không opacity decorative chồng chéo.
  - Chỉ `border + shadow-sm` tối thiểu, spacing theo 8/12/16/24.

### Bước 3 — Áp contract màu dual-brand cho tất cả 6 layout (không lệch preview/site)
**Files:**
- `app/admin/home-components/contact/_lib/colors.ts`
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `components/site/ContactSection.tsx` (verify parity call path)
- Bổ sung semantic tokens thiếu cho form states (input border/focus, submit btn, disabled, helper/error text, panel surface).
- Đảm bảo dùng token cho mọi element, không hardcode màu mới trong layout mới.
- Duy trì APCA guard cho text/icon trên nền solid/tint.

### Bước 4 — Chuẩn hóa form engine dùng chung cho 6 layout + site contact
**Files mới đề xuất:**
- `components/contact/ContactInquiryForm.tsx` (UI form chuẩn reusable)
- `components/contact/useContactInquiryForm.ts` (hook submit + state + validation)
**Files tích hợp:**
- `app/(site)/contact/page.tsx`
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- Logic submit duy nhất qua `api.contactInbox.submitContactInquiry`.
- Đọc `requireEmail/requirePhone` theo module settings (giống site hiện tại).
- `sourcePath` truyền theo context (`/contact` hoặc home route tương ứng).

### Bước 5 — Wire toggle showForm cho đủ 6 layout
**Files:**
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `app/admin/home-components/contact/_lib/normalize.ts` (nếu cần default cứng)
- `app/admin/home-components/create/contact/page.tsx`
- `app/admin/home-components/contact/[id]/edit/page.tsx`
- Mặc định `showForm = true` khi normalize config.
- Mỗi layout render form conditionally theo `config.showForm`.
- Toggle OFF chỉ ẩn UI form, không đụng inbox module state (đúng quyết định user).

### Bước 6 — Đồng bộ source map từ Settings cho home-component Contact
**Files mới đề xuất:**
- `lib/contact/getContactMapData.ts` (normalize map provider + iframe + lat/lng + address)
**Files tích hợp:**
- `components/site/useContactPageData.ts` (reuse helper)
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `app/admin/home-components/contact/_components/ContactPreview.tsx`
- `app/admin/home-components/create/contact/page.tsx`
- `app/admin/home-components/contact/[id]/edit/page.tsx`
- Ngưng phụ thuộc `config.mapEmbed` cho runtime hiển thị map (giữ backward fallback nếu settings trống).
- Preview admin hiển thị trạng thái map theo settings (có/không có iframe + provider).

### Bước 7 — Dọn ConfigEditor/Create để tránh nhập map riêng gây lệch
**Files:**
- `app/admin/home-components/contact/_components/ConfigEditor.tsx`
- `app/admin/home-components/create/contact/page.tsx`
- Chuyển “Map Embed URL” thành block chỉ đọc trạng thái map from settings + link sang `/admin/settings`.
- Giữ `showMap` toggle ở Contact component (UI toggle), nhưng nguồn dữ liệu map là settings.

### Bước 8 — Cập nhật Experience Contact preview parity
**Files:**
- `components/experiences/previews/ContactPreview.tsx`
- `app/system/experiences/contact/page.tsx`
- Đồng bộ visual language với layout enterprise mới (đặc biệt khi map/info/form toggle).
- Bảo đảm useBrandColors primary/secondary/mode đã sync đủ (hiện đã đúng, chỉ giữ parity UI/behavior).

### Bước 9 — Verification bắt buộc
- Repro matrix:
  1) 6 layout: form ON/OFF
  2) map ON/OFF
  3) single/dual mode
  4) module `enableContactFormSubmission` ON/OFF
  5) requireEmail/requirePhone variations
- Kiểm thử manual routes:
  - `/admin/home-components/create/contact`
  - `/admin/home-components/contact/[id]/edit`
  - `/admin/settings`
  - `/system/experiences/contact`
  - `/contact`
  - `/admin/contact-inbox`
- Typecheck theo rule repo: `bunx tsc --noEmit`

---

## Counter-Hypothesis Check
- Counter-hypothesis: giữ form logic riêng giữa home-component và /contact để linh hoạt hơn.
- Loại vì: tăng chi phí bảo trì + dễ lệch validation/submission + trái yêu cầu “cùng module contact inbox và toggle đồng bộ 6 layout”.

---

## Post-Audit (blast radius / regression risk / complexity)
- Blast radius: trung bình (Contact ecosystem + shared component).
- Regression risk chính: ảnh hưởng style cũ `floating/centered` và dữ liệu map cũ `mapEmbed`.
- Giảm rủi ro:
  - Giữ id style cũ (không migrate DB).
  - Dùng fallback map cũ chỉ khi settings chưa có dữ liệu.
  - Thêm integration check submit inbox sau refactor.
- KISS/YAGNI/DRY:
  - KISS: 1 form engine + 1 map source.
  - YAGNI: không thêm layout thứ 7, chỉ thay 2 layout tệ.
  - DRY: bỏ duplicate submit/map logic.

---

## Verification Plan
1. Typecheck: `bunx tsc --noEmit`.
2. Functional repro:
   - Tạo/sửa Contact home-component với từng style, bật/tắt form/map.
   - Submit form từ home-component và `/contact` đều xuất hiện trong `/admin/contact-inbox`.
3. Visual QA:
   - Desktop/tablet/mobile preview cho 6 layout.
   - Single/dual colors và APCA warnings không phát sinh lỗi mới.
4. Regression checks:
   - Module contact inbox OFF => form disabled message đúng.
   - Settings map đổi provider => home-component preview + site reflect đúng.

---

## Checklist chốt cho implement
- [x] Bỏ/thay style #2 và #6 (giữ id cũ để không vỡ data)
- [x] 6 layout hỗ trợ toggle showForm
- [x] Form submit thống nhất về contact inbox module
- [x] Map dùng chung từ admin settings cho mọi bề mặt
- [x] Màu tuân dual-brand-color-system + apply-home-component-custom-colors
- [x] UX enterprise 99% thuận mắt, giảm decorative noise
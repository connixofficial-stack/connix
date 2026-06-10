# Spec: Nâng cấp `dual-brand-color-system` + Fix Stats Home Component (single mode, save-state, runtime crash)

## Mục tiêu
Giải quyết đầy đủ 3 vấn đề liên quan Stats theo đúng yêu cầu:
1. Chế độ **1 màu** trong Settings chưa phản ánh đúng ở Stats (khác Hero).
2. Nút **Lưu thay đổi** ở Stats Edit chưa disable/xám khi không có thay đổi (khác Hero).
3. Lỗi runtime trang chủ khi single mode: `Cannot read properties of undefined (reading 'l')` tại `stats/_lib/colors.ts`.

Đồng thời nâng cấp skill `.factory/skills/dual-brand-color-system` để tránh tái phát.

---

## Kết luận review skill hiện tại

### Skill đã đề cập
- Có đề cập generic về mode single/dual, harmony, APCA, Single Source of Truth.
- Có checklist về palette/contrast/distribution.

### Skill **chưa đề cập trực tiếp** 2 vấn đề user yêu cầu
1. **Không có guard pattern** cho trường hợp `secondary = ''` ở single mode dẫn đến `oklch('')` trả về `undefined` và crash khi đọc `.l`.
2. **Không có rule UX cho trang edit**: Save button phải disable khi không có thay đổi (dirty-state parity với Hero).

### Bằng chứng
- `SKILL.md`, `checklist.md`, `reference.md`, `examples/quick-fix-templates.md` chưa có mục nào nói rõ 2 điểm trên.
- Skill hiện chỉ nói tổng quát “single mode auto secondary” nhưng không có “defensive handling” khi dữ liệu settings trả chuỗi rỗng.

---

## Bằng chứng kỹ thuật từ codebase
1. `components/site/hooks.ts` trả `secondary = ''` khi `site_brand_mode === 'single'` (đúng theo settings).
2. `components/site/ComponentRenderer.tsx` (case Stats) truyền trực tiếp `secondary` vào `getCounterColors(...)`.
3. `app/admin/home-components/stats/_lib/colors.ts`:
   - `getTint()` gọi `oklch(hex)` rồi dùng `color.l` ngay.
   - Khi `hex = ''` => `color` undefined => crash `reading 'l'`.
4. `app/admin/home-components/stats/[id]/edit/page.tsx`:
   - Nút save chỉ `disabled={isSubmitting}`.
   - Không có `hasChanges` / `initialData` như Hero.
5. Hero đã có pattern chuẩn (`hasChanges`, disable save, mode-aware render), Stats chưa áp dụng pattern này.

---

## Scope

### In scope
- Nâng cấp skill `dual-brand-color-system` để có guideline + checklist + quick-fix cho:
  - Null-safe color parsing trong single mode.
  - Dirty-state save button parity.
- Fix Stats component ở:
  - Admin create/edit preview (single mode behavior).
  - Frontend render trang chủ (runtime crash + mode mapping).
  - Save button UX ở trang edit Stats.

### Out of scope
- Refactor toàn bộ các home-components khác.
- Thay đổi schema Convex.
- Thay đổi behavior Hero/CTA/FAQ ngoài việc tham chiếu pattern.

---

## File dự kiến thay đổi

### A) Skill docs
1. `.factory/skills/dual-brand-color-system/SKILL.md`
2. `.factory/skills/dual-brand-color-system/checklist.md`
3. `.factory/skills/dual-brand-color-system/reference.md`
4. `.factory/skills/dual-brand-color-system/examples/quick-fix-templates.md`

### B) Code fix Stats
1. `app/admin/home-components/stats/_types/index.ts`
2. `app/admin/home-components/stats/_lib/colors.ts`
3. `app/admin/home-components/stats/_components/StatsPreview.tsx`
4. `app/admin/home-components/stats/[id]/edit/page.tsx`
5. `app/admin/home-components/create/stats/page.tsx`
6. `components/site/ComponentRenderer.tsx`

---

## Problem Graph
1. [Main] Stats không đồng bộ single-mode + có runtime crash + thiếu UX save-state, và skill chưa cover root causes <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Sub] Skill gap: thiếu guideline phòng lỗi production đặc thù single mode <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Skill chỉ nói nguyên tắc màu tổng quát, chưa có null-safe rule + save-state rule
   1.2 [Sub] Runtime crash trên site khi single mode <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] `secondary=''` đi vào `oklch()` không được sanitize, sau đó đọc `.l`
   1.3 [Sub] Stats preview/edit chưa phản ánh đúng mode single <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Pipeline Stats chưa truyền/áp mode như Hero; helper màu chưa mode-aware
   1.4 [Sub] Nút save Stats edit không disable khi không đổi dữ liệu <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Thiếu `initialData + hasChanges` dirty tracking pattern

---

## Execution (with reflection)
1. Solving 1.1.1 — nâng cấp skill để chặn tái phát lỗi
   - Thought: Nếu chỉ fix code mà không nâng checklist/rules thì lỗi tương tự sẽ lặp lại ở component khác.
   - Action:
     - `SKILL.md`: thêm mục “Critical Safety Rules” gồm:
       - Rule S1: Không gọi OKLCH/APCA với giá trị rỗng/invalid.
       - Rule S2: Single mode phải có `resolveSecondaryForMode(...)` trước khi build palette.
       - Rule S3: Edit page phải có `hasChanges` parity (disable save khi pristine).
     - `checklist.md`: thêm checklist section mới “State & Runtime Safety”.
     - `reference.md`: thêm snippet canonical cho `safeOklch` + `resolveSecondaryForMode`.
     - `quick-fix-templates.md`: thêm 2 template fix nhanh cho crash `.l` và save button luôn enable.
   - Reflection: ✓ Giải quyết gốc rễ ở mức quy trình, không chỉ patch cục bộ.

2. Solving 1.2.1 — fix runtime crash ở Stats colors
   - Thought: Cần fix ngay tại layer helper màu vì đây là điểm fail chung cho preview/site.
   - Action (trong `stats/_lib/colors.ts`):
     - Bổ sung type mode: `'single' | 'dual'`.
     - Bổ sung `resolveStatsSecondary(primary, secondary, mode)`:
       - mode=single => dùng `primary` (1 màu đúng kỳ vọng user).
       - mode=dual => dùng `secondary` nếu hợp lệ, fallback `primary`.
     - Bổ sung `safeParseOklch(input, fallback)` để không bao giờ trả undefined.
     - Refactor `getTint` dùng `safeParseOklch`.
     - Refactor toàn bộ `getHorizontalColors/getCardsColors/.../getCounterColors` nhận thêm `mode` và luôn resolve secondary trước.
   - Reflection: ✓ Chặn dứt điểm crash `reading 'l'` và thống nhất behavior single mode.

3. Solving 1.3.1 — đồng bộ mode trong Stats preview/site
   - Thought: Cùng helper nhưng không truyền mode thì vẫn sai behavior.
   - Action:
     - `StatsPreview.tsx`: thêm prop `mode`, truyền mode vào mọi `get*Colors(...)`.
     - `create/stats/page.tsx`: query `site_brand_mode`, derive `brandMode`, truyền xuống preview.
     - `stats/[id]/edit/page.tsx`: query `site_brand_mode`, derive `brandMode`, truyền xuống preview.
     - `ComponentRenderer.tsx`:
       - case `Stats` truyền `mode` từ `useBrandColors()`.
       - `StatsSection` nhận prop `mode` và truyền mode vào `get*Colors(...)`.
   - Reflection: ✓ Create/Edit/Site dùng chung contract mode-aware, giống pattern Hero.

4. Solving 1.4.1 — fix UX save button Stats edit
   - Thought: Hero đã có pattern tốt, nên reuse để đảm bảo CoC/UX consistency.
   - Action (trong `stats/[id]/edit/page.tsx`):
     - Thêm state `initialData` (title, active, items, style).
     - Thêm state `hasChanges`.
     - Sau khi load component: set `initialData` + reset `hasChanges=false`.
     - Thêm `useEffect` so sánh deep (JSON.stringify cho mảng items) để cập nhật `hasChanges`.
     - Nút save: `disabled={isSubmitting || !hasChanges}`.
     - Label nút: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu` giống Hero.
     - Sau save success: cập nhật lại `initialData`, set `hasChanges=false`.
   - Reflection: ✓ Đúng kỳ vọng user “không đổi gì thì nút xám”.

5. Hardening type contract
   - Thought: Giảm sai sót truyền mode/string tự do.
   - Action:
     - `stats/_types/index.ts`: thêm `StatsBrandMode = 'single' | 'dual'`.
     - Dùng type này ở `StatsPreview` và `stats/_lib/colors.ts`.
   - Reflection: ✓ Tăng an toàn compile-time, diff nhỏ.

6. Validation
   - Thought: Cần kiểm chứng đủ 3 vấn đề user nêu và không side-effect.
   - Action:
     - Chạy `bunx tsc --noEmit` sau khi sửa code TS.
     - Manual QA matrix (chi tiết phía dưới).
   - Reflection: ✓ Đủ điều kiện nghiệm thu kỹ thuật + UX.

---

## Plan triển khai chi tiết (step-by-step actionable, không chia phase)

1. Sửa `stats/_types/index.ts`:
   - Thêm `export type StatsBrandMode = 'single' | 'dual';`.

2. Sửa `stats/_lib/colors.ts`:
   - Thêm helper `isNonEmptyHex` (hoặc validate tối thiểu string non-empty).
   - Thêm helper `resolveStatsSecondary(primary, secondary, mode)`.
   - Thêm helper `safeParseOklch(input, fallback)`.
   - Refactor `getTint` để dùng `safeParseOklch`.
   - Update signature 6 hàm color nhận `mode`.
   - Đảm bảo mọi chỗ dùng secondary đều qua biến `secondaryResolved`.

3. Sửa `stats/_components/StatsPreview.tsx`:
   - Import type `StatsBrandMode`.
   - Thêm prop `mode: StatsBrandMode`.
   - Truyền `mode` vào 6 hàm `get*Colors`.

4. Sửa `create/stats/page.tsx`:
   - Query `modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' })`.
   - Derive `brandMode`.
   - Truyền `mode={brandMode}` cho `StatsPreview`.

5. Sửa `stats/[id]/edit/page.tsx` — mode propagation:
   - Query `modeSetting` như Hero edit.
   - Derive `brandMode`.
   - Truyền `mode={brandMode}` vào `StatsPreview`.

6. Sửa `stats/[id]/edit/page.tsx` — dirty tracking:
   - Thêm `initialData` state gồm `{ title, active, items, style }`.
   - Thêm `hasChanges` state.
   - Trong effect load component:
     - set form state.
     - set `initialData` theo data load.
     - set `hasChanges(false)`.
   - Thêm effect compare:
     - so sánh title/active/style.
     - so sánh `statsItems` bằng `JSON.stringify`.
     - update `hasChanges`.
   - Update submit success:
     - set lại `initialData` bằng current values.
     - set `hasChanges(false)`.
   - Update button submit disabled + label.

7. Sửa `components/site/ComponentRenderer.tsx` — case Stats:
   - Trong switch `Stats`, truyền thêm `mode` vào `StatsSection`.
   - Update type signature `StatsSection(..., mode: 'single' | 'dual')`.

8. Sửa `components/site/ComponentRenderer.tsx` — trong `StatsSection`:
   - 6 chỗ gọi `get*Colors` truyền thêm `mode`.
   - Không để bất kỳ call nào dùng `secondary` trực tiếp để tạo tint.

9. Nâng cấp `.factory/skills/dual-brand-color-system/SKILL.md`:
   - Bump version (ví dụ `11.0.0` -> `11.1.0`).
   - Add section “Critical Safety Rules (v11.1)”:
     - Runtime guard cho parse màu.
     - Mode-resolve bắt buộc trước palette.
     - Save-button dirty-state rule.
   - Add anti-pattern mới:
     - “Không dùng `oklch(x).l` khi chưa null-check”.

10. Nâng cấp `.factory/skills/dual-brand-color-system/checklist.md`:
   - Thêm section F:
     - [ ] Single mode với `secondary=''` không crash.
     - [ ] Helper màu có fallback parse hợp lệ.
     - [ ] Edit form save disabled khi pristine.
     - [ ] Sau save, trạng thái pristine được reset đúng.

11. Nâng cấp `.factory/skills/dual-brand-color-system/reference.md`:
   - Thêm snippet chuẩn:
     - `resolveSecondaryForMode(primary, secondary, mode)`.
     - `safeParseOklch(value, fallback)`.

12. Nâng cấp `.factory/skills/dual-brand-color-system/examples/quick-fix-templates.md`:
   - Template A: fix runtime `.l` undefined.
   - Template B: fix save button luôn enable.

13. Chạy kiểm tra TypeScript:
   - `bunx tsc --noEmit`.

14. Manual QA bắt buộc:
   - Settings mode = single:
     - Vào `admin/home-components/stats/.../edit` → preview chỉ còn 1 hệ màu, không lỗi.
     - Trang chủ render Stats đủ 6 layouts không crash.
   - Settings mode = dual:
     - Stats hiển thị 2 màu đúng.
   - Save button Stats edit:
     - load lần đầu: disabled/xám.
     - sửa 1 field: enabled.
     - save thành công: disabled lại.

---

## Acceptance Criteria
- [ ] Skill `dual-brand-color-system` đã mention rõ 2 vấn đề: null-safe single-mode + dirty save-state parity.
- [ ] Không còn lỗi runtime `Cannot read properties of undefined (reading 'l')` ở trang chủ khi `site_brand_mode='single'`.
- [ ] Stats preview/edit phản ánh đúng single mode (1 màu) và dual mode (2 màu).
- [ ] Nút “Lưu thay đổi” ở Stats edit disable khi không có thay đổi, behavior tương tự Hero.
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. Rủi ro: đổi signature helper màu làm sót call site.
   - Giảm thiểu: dùng TS compile errors + grep toàn repo các `get*Colors(` Stats.
2. Rủi ro: dirty-check false positive do thứ tự items.
   - Giảm thiểu: chỉ compare đúng state đang edit (không sort ngầm), reset initialData sau save.
3. Rủi ro: thay đổi mode logic ảnh hưởng layout gradient/counter.
   - Giảm thiểu: QA đủ 6 layouts ở cả single/dual trên preview và site.

---

## Ghi chú triển khai
- Tuân thủ KISS/YAGNI/DRY: chỉ chạm Stats + skill docs liên quan trực tiếp bug.
- Không mở rộng sang component khác trong ticket này.
- Hero hiện là reference pattern cho mode-aware + hasChanges parity, Stats cần bám theo đúng mức cần thiết.

# Spec: DARE review FAQ `create + preview + render(site)` cho 6 layouts theo `dual-brand-color-system` (v2)

## Mục tiêu
Đánh giá thực tế route `http://localhost:3000/admin/home-components/create/faq` và pipeline render tương ứng (create/edit preview + homepage site) xem đã áp dụng **đầy đủ** skill `.factory/skills/dual-brand-color-system` chưa; sau đó chốt spec vá các gap còn lại theo đúng KISS/YAGNI/DRY.

---

## Kết luận nhanh
**Chưa áp dụng đầy đủ skill.**

### Những gì đã làm đúng (đạt nền tảng)
1. Đã có đủ 6 layout FAQ: `accordion`, `cards`, `two-column`, `minimal`, `timeline`, `tabbed`.
2. Đã dùng shared renderer cho preview và site (`FaqSectionShared`) + shared color helper (`getFaqColors`) → đi đúng hướng Single Source of Truth.
3. Create/Edit/Site đều đã truyền `mode` vào FAQ color pipeline.

### Những gì chưa đạt “đầy đủ skill” (còn gap gốc rễ)
1. **S1 Runtime Safety chưa đạt**: parse OKLCH chưa guard null/invalid (`oklch(hex)` có thể undefined rồi đọc `.l/.c/.h`).
2. **S2 Mode Resolution chưa đúng spec skill**: single mode đang resolve secondary bằng analogous thay vì `primary` theo Critical Rule S2.
3. **APCA chưa phủ kín tầng text**: còn hard-code `#0f172a`/`text-slate-900` trong renderer 6 layout.
4. **Harmony workflow chưa đầy đủ**: chưa có `harmony` trong config/UI (analogous/complementary/triadic) + chưa có similarity check (ΔE).
5. **S3 Save-state parity chưa đạt ở FAQ edit**: nút save chưa disable khi pristine, chưa có `initialData + hasChanges + reset sau save`.
6. **Tooling check của skill chưa được thực thi**: chưa có bước đo accessibility score/accent balance cho FAQ trước nghiệm thu.

---

## Bằng chứng kỹ thuật (điểm chính)
1. `app/admin/home-components/faq/_lib/colors.ts`
   - `getOKLCH()` đang đọc `parsed.l/c/h` trực tiếp từ `oklch(hex)` mà chưa null-guard.
   - `resolveFaqSecondary()` ở `mode='single'` trả về `getAnalogous(primary)[0]`.
2. `app/admin/home-components/faq/_components/FaqSectionShared.tsx`
   - Nhiều chỗ hard-code màu text: `#0f172a`, `text-slate-900` thay vì token APCA.
3. `app/admin/home-components/faq/_types/index.ts`
   - `FaqConfig` chưa có `harmony`; chưa có contract cho similarity/accessibility audit.
4. `app/admin/home-components/faq/[id]/edit/page.tsx`
   - Submit button chỉ `disabled={isSubmitting}`, chưa có dirty-state parity theo S3.
5. `Grep` toàn thư mục FAQ không thấy gọi `getHarmonyStatus/getAccessibilityScore/calculateAccentBalance`.

---

## Problem Graph
1. [Main] FAQ chưa đạt mức “áp dụng đầy đủ dual-brand-color-system” cho create + preview + render 6 layouts <- depends on 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   1.1 [Sub] Runtime safety còn hở ở color engine <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `oklch()` parse chưa được guard trước khi đọc channel (`.l/.c/.h`)
   1.2 [Sub] Single-mode behavior lệch Critical Rule S2 <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] `resolveFaqSecondary()` ở single mode không resolve về primary
   1.3 [Sub] APCA chưa thực thi end-to-end ở renderer 6 layouts <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Renderer còn hard-coded neutral text thay vì token APCA theo background thực tế
   1.4 [Sub] Harmony workflow chưa hoàn chỉnh <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Thiếu `harmony` trong config/form + thiếu similarity validation (ΔE)
   1.5 [Sub] Edit UX không parity với Skill S3 <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Thiếu mô hình `initialData + hasChanges + reset pristine sau save`
   1.6 [Sub] Chưa có bước đo chất lượng màu trước nghiệm thu <- depends on 1.6.1
      1.6.1 [ROOT CAUSE] Chưa tích hợp accessibility/accent checks vào flow review FAQ

---

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Nếu parse màu không safe thì chỉ cần settings invalid là có thể tái phát runtime crash kiểu Stats.
   - Action: Xác nhận `getOKLCH` đang assume `oklch(hex)` luôn trả object; chưa có fallback chain.
   - Reflection: ✓ Đây là root cause runtime quan trọng, cần chốt fix ở `_lib/colors.ts` trước.

2. Solving 1.2.1...
   - Thought: Skill v11.1 đã có Critical Rule S2, single mode phải coi như 1 màu thật sự.
   - Action: Đối chiếu `resolveFaqSecondary` hiện tại, thấy single mode trả analogous → sai contract S2.
   - Reflection: ✓ Root cause xác định rõ; cần đổi logic resolve và chuẩn hóa toàn call path.

3. Solving 1.3.1...
   - Thought: Có APCA helper nhưng renderer vẫn hard-code text thì accessibility không thực sự được kiểm soát.
   - Action: Quét `FaqSectionShared` thấy nhiều `text-slate-900`/`#0f172a` ở cả 6 nhánh layout.
   - Reflection: ✓ Root cause nằm ở “token chưa phủ hết UI text roles”, không phải ở helper APCA.

4. Solving 1.4.1...
   - Thought: “Đầy đủ skill” không chỉ có 6 layout chạy, mà còn phải có harmony workflow hoàn chỉnh.
   - Action: Kiểm tra type/config/form/color API: chưa có trường `harmony`, chưa có similarity check.
   - Reflection: ✓ Đây là thiếu sót feature-level đúng theo yêu cầu skill.

5. Solving 1.5.1...
   - Thought: Skill S3 là critical safety/UX rule; FAQ edit chưa parity thì chưa thể gọi là done.
   - Action: Kiểm tra nút save ở edit FAQ: chỉ khóa khi submitting.
   - Reflection: ✓ Root cause đã rõ, fix theo pattern Hero/Stats là đủ.

6. Solving 1.6.1...
   - Thought: Không đo thì không chứng minh được “áp dụng đầy đủ”.
   - Action: Quét code FAQ không có analyzer calls cho harmony/accessibility/accent balance.
   - Reflection: ✓ Cần thêm acceptance gate rõ ràng ở spec/QA checklist.

---

## Plan triển khai chi tiết (step-by-step actionable, không chia phase)

1. **`app/admin/home-components/faq/_types/index.ts`**
   - Thêm `FaqHarmony = 'analogous' | 'complementary' | 'triadic'`.
   - Mở rộng `FaqConfig` thêm `harmony?: FaqHarmony`.
   - Giữ backward-compatible: nếu config cũ không có `harmony` thì default `analogous`.

2. **`app/admin/home-components/faq/_lib/constants.ts`**
   - Bổ sung `DEFAULT_FAQ_CONFIG.harmony = 'analogous'`.
   - (Nếu cần UI selector) thêm constant options cho harmony để tái sử dụng ở form/preview.

3. **`app/admin/home-components/faq/[id]/edit/page.tsx`** (parse + persist)
   - Update `toFaqConfig()` để parse/validate `harmony` từ config cũ.
   - Trong payload update, ghi kèm `harmony`.
   - Thêm dirty-state parity:
     - State `initialData` (title, active, faqItems, faqStyle, faqConfig).
     - State `hasChanges` tính từ compare state hiện tại với `initialData`.
     - Button submit: `disabled={isSubmitting || !hasChanges}`.
     - Label: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu`.
     - Sau save success: reset `initialData` và `hasChanges=false`.

4. **`app/admin/home-components/create/faq/page.tsx`**
   - Đảm bảo payload create luôn có `harmony` (lấy từ `faqConfig.harmony`, fallback `analogous`).
   - Không thay đổi schema Convex, chỉ bổ sung key config.

5. **`app/admin/home-components/faq/_components/FaqForm.tsx`**
   - Thêm section chọn harmony (3 options) trong form FAQ.
   - Chỉ update state `faqConfig.harmony`; không thêm logic ngoài scope.

6. **`app/admin/home-components/faq/_lib/colors.ts`** (fix root S1 + S2 + APCA coverage)
   - Thêm `safeParseOklch(value, fallback)` trả object hợp lệ 100%.
   - Refactor `getOKLCH()` dùng `safeParseOklch`, tuyệt đối không truy cập channel khi parse có thể undefined.
   - Refactor `resolveFaqSecondary(primary, secondary, mode, harmony)`:
     - `mode='single'` => trả `primary` (đúng Critical Rule S2).
     - `mode='dual'` => nếu secondary hợp lệ dùng secondary, không thì fallback theo harmony từ primary.
   - Bổ sung token text theo APCA cho các role còn hard-code:
     - `questionText`, `panelTitleText`, `tabOverflowText` (tên token có thể gọn theo convention file).
   - Nếu cần, thêm helper `getFaqAccessibilityScore(tokens)` tối thiểu để QA gate (dev-only usage).

7. **`app/admin/home-components/faq/_components/FaqSectionShared.tsx`**
   - Thay toàn bộ màu text hard-code (`#0f172a`, `text-slate-900`) bằng token từ `getFaqColors`.
   - Giữ class typography/spacing như cũ, chỉ thay color source.
   - Kiểm tra cả 6 nhánh layout + empty states + tab overflow badge.

8. **`components/site/ComponentRenderer.tsx`**
   - Trong FAQSection, đọc `harmony` từ config (default `analogous`) và truyền vào `getFaqColors`.
   - Không thay đổi JSON-LD schema logic.

9. **`app/admin/home-components/faq/_components/FaqPreview.tsx`**
   - Truyền `config?.harmony` vào `getFaqColors` để preview/site cùng contract.

10. **`app/admin/home-components/faq/[id]/edit/page.tsx` + `create/faq/page.tsx`** (consistency check)
    - Đảm bảo create/edit/preview/site đều dùng cùng 1 config contract: `{ style, items, description, buttonText, buttonLink, harmony }`.

11. **Manual QA matrix bắt buộc (không bỏ qua)**
    - 6 layouts × 3 context: create preview, edit preview, site render.
    - 2 mode: single, dual.
    - 3 data states: empty, <=6 items, >6 items.
    - Verify:
      - Không runtime crash khi màu invalid/rỗng.
      - Single mode hiển thị đúng 1 hệ màu.
      - Text luôn readable (APCA pass theo threshold chính).
      - Save button edit disable khi pristine, enable khi có thay đổi, reset sau save.

12. **Validation kỹ thuật cuối**
    - Vì có sửa TS/code: chạy duy nhất `bunx tsc --noEmit` trước khi chốt.

---

## Acceptance Criteria
- [ ] Không còn điểm parse OKLCH unsafe trong FAQ color engine.
- [ ] `mode='single'` resolve secondary đúng theo Critical Rule S2 (secondaryResolved = primary).
- [ ] 6 layout FAQ không còn hard-coded text colors ở renderer; dùng token APCA.
- [ ] FAQ có `harmony` trong config và chạy xuyên suốt create/edit/preview/site.
- [ ] FAQ edit có dirty-state parity chuẩn (`initialData + hasChanges + reset`).
- [ ] QA matrix 6×3×2×3 pass, không mismatch create-preview-site.
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. **Rủi ro**: đổi rule single-mode làm màu hiện tại khác trước.
   - **Giảm thiểu**: chốt đúng theo skill S2; ghi rõ trong release note nội bộ.
2. **Rủi ro**: thêm harmony có thể làm payload config cũ thiếu field.
   - **Giảm thiểu**: luôn fallback `analogous` khi parse.
3. **Rủi ro**: thay text token có thể lệch visual nhẹ.
   - **Giảm thiểu**: QA side-by-side 6 layouts giữa preview/site.

---

## Out of scope
- Refactor hooks brand màu dùng chung toàn hệ thống.
- Can thiệp các home-components ngoài FAQ.
- Thay đổi schema database/Convex.

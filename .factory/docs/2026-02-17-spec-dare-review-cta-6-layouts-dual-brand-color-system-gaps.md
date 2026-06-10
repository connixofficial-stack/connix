# Spec (DARE): Review CTA 6 layouts theo `dual-brand-color-system` (Create/Edit/Preview/Render)

## Bối cảnh & phạm vi
- URL user yêu cầu review: `/admin/home-components/cta/[id]/edit`.
- Đã đối chiếu đầy đủ các luồng liên quan:
  - Create: `app/admin/home-components/create/cta/page.tsx`
  - Edit: `app/admin/home-components/cta/[id]/edit/page.tsx`
  - Preview: `app/admin/home-components/cta/_components/CTAPreview.tsx`
  - Shared render 6 layouts: `app/admin/home-components/cta/_components/CTASectionShared.tsx`
  - Color engine: `app/admin/home-components/cta/_lib/colors.ts`
  - Site render: `components/site/ComponentRenderer.tsx` (case `CTA`)
  - Brand hooks: `app/admin/home-components/create/shared.tsx`, `components/site/hooks.ts`

## Kết luận nhanh
CTA đã áp dụng **phần lớn** skill (OKLCH/APCA/Harmony, 6 layouts, shared preview/render), nhưng **chưa đầy đủ v11.1** vì còn thiếu các safety/consistency rules quan trọng (đặc biệt S1, S3 và parity dữ liệu màu admin-vs-site).

---

## Problem Graph
1. [Main] CTA chưa đạt full compliance với `dual-brand-color-system` v11.1 trên toàn luồng create/edit/preview/site <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Sub] Dirty-state UX chưa parity ở edit page <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Save button ở CTA edit chưa có `initialData + hasChanges`, chỉ disable khi submitting
   1.2 [Sub] Runtime safety parse màu chưa robust theo S1 <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] `getOKLCH()` đọc trực tiếp `parsed.l/c/h` mà không guard khi input invalid
   1.3 [Sub] Dual-mode preview/render có nguy cơ lệch khi thiếu secondary setting <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] `useBrandColors` admin và site đang có fallback secondary khác nhau
   1.4 [Sub] Harmony/Accessibility mới ở mức warning, chưa có save-gate <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Create/Edit submit không chặn config fail APCA hoặc quá giống màu (deltaE < 20)
   1.5 [Sub] Input config từ DB chưa normalize tập trung <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] `style/harmony` cast trực tiếp, chưa có normalize helper chuẩn cho runtime resilience

---

## Execution (with reflection)
1. Solving 1.1.1 (dirty-state parity)
   - Thought: Skill v11.1 S3 yêu cầu Save disable khi pristine; Hero đã làm chuẩn nhưng CTA edit chưa áp dụng.
   - Action (evidence):
     - `app/admin/home-components/cta/[id]/edit/page.tsx`: nút submit chỉ `disabled={isSubmitting}`.
     - Không có `hasChanges` + `initialData` như Hero edit.
   - Reflection: ✓ Root cause xác định rõ, ảnh hưởng trực tiếp UX và không đạt skill checklist F.

2. Solving 1.2.1 (safe parse màu)
   - Thought: Nếu input màu không hợp lệ, gọi `.l` trên parse result có thể crash runtime.
   - Action (evidence):
     - `app/admin/home-components/cta/_lib/colors.ts`: `const parsed = oklch(hex);` rồi dùng `parsed.l` trực tiếp.
     - Không có `safeParseOklch(value, fallback)` như canonical snippet trong skill reference.
   - Reflection: ✓ Đây là root cause hệ thống, không chỉ CTA; cần fix ở lõi helper.

3. Solving 1.3.1 (admin-vs-site parity màu)
   - Thought: Nếu fallback secondary khác nhau giữa admin và site, preview có thể khác render thật dù dùng chung CTASectionShared.
   - Action (evidence):
     - `app/admin/home-components/create/shared.tsx`: khi thiếu `site_brand_secondary` => `secondary = primary`.
     - `components/site/hooks.ts`: dual mode thiếu `site_brand_secondary` => `secondary = generateComplementary(primary)`.
   - Reflection: ✓ Root cause consistency; vi phạm tinh thần Single Source of Truth ở tầng data-resolve.

4. Solving 1.4.1 (warning-only chưa đủ)
   - Thought: Skill checklist yêu cầu “không fail”, nhưng hiện tại chỉ cảnh báo, vẫn cho save.
   - Action (evidence):
     - `CTAPreview` có warning harmony/accessibility.
     - `create/cta/page.tsx` và `cta/[id]/edit/page.tsx` submit không kiểm APCA/deltaE trước save.
   - Reflection: ✓ Root cause quy trình; cần save-gate (ít nhất soft-block có xác nhận).

5. Solving 1.5.1 (normalize config runtime)
   - Thought: Cast thẳng từ `config` dễ tạo behavior ngầm khi data cũ/lỗi.
   - Action (evidence):
     - `ComponentRenderer.tsx` và edit page dùng cast `config.style as CTAStyle`, `config.harmony as CTAHarmony`.
     - Chưa có helper normalize tập trung cho style/harmony.
   - Reflection: ✓ Root cause độ bền runtime; không vỡ ngay nhưng dễ phát sinh mismatch ngầm.

---

## Đánh giá coverage 6 layouts hiện tại
- 6 layouts đã hiện diện đầy đủ ở cả preview + site:
  - `banner`, `centered`, `split`, `floating`, `gradient`, `minimal`.
- Preview và site đã dùng chung `CTASectionShared` + `getCTAColors` (điểm mạnh lớn).
- Tuy nhiên full-compliance vẫn **chưa đạt** do 5 root causes ở trên.

---

## Plan triển khai chi tiết (step-by-step actionable, không chia phase)

1. **Thêm helper normalize + safe parse cho CTA color engine**
   - File: `app/admin/home-components/cta/_lib/colors.ts`
   - Thay đổi:
     - Thêm `safeParseOklch(value, fallback)` (guard null/invalid).
     - Thêm `normalizeHex(value, fallback)` để đảm bảo chuỗi màu hợp lệ.
     - Refactor `getOKLCH()` dùng safe parse, tuyệt đối không truy cập property trên parse result chưa guard.
   - Logic cụ thể:
     - `safeParseOklch` fallback chain: `value -> fallback -> '#3b82f6'`.
     - Nếu normalize fail, dùng fallback chứ không throw.

2. **Chuẩn hóa resolve secondary theo mode + sanitize input**
   - File: `app/admin/home-components/cta/_lib/colors.ts`
   - Thay đổi:
     - Refactor `resolveSecondaryColor(primary, secondary, mode, harmony)`:
       - sanitize `primary`, `secondary` trước.
       - `single`: derive từ harmony.
       - `dual`: dùng secondary hợp lệ, nếu invalid fallback `primary`.
   - Logic cụ thể:
     - Không để `secondary` raw đi thẳng vào palette build.

3. **Tạo helper normalize style/harmony**
   - File: `app/admin/home-components/cta/_lib/constants.ts` (hoặc `_lib/colors.ts`, chọn 1 nơi)
   - Thay đổi:
     - `normalizeCTAStyle(input): CTAStyle`
     - `normalizeCTAHarmony(input): CTAHarmony`
   - Logic cụ thể:
     - unknown -> fallback `banner` / `analogous`.

4. **Áp normalize helper ở edit page**
   - File: `app/admin/home-components/cta/[id]/edit/page.tsx`
   - Thay đổi:
     - Khi load config: dùng `normalizeCTAStyle`, `normalizeCTAHarmony` thay cast trực tiếp.
   - Logic cụ thể:
     - Tránh state nhận giá trị style/harmony không hợp lệ.

5. **Áp normalize helper ở site render**
   - File: `components/site/ComponentRenderer.tsx`
   - Thay đổi:
     - Trong `CTASection`, normalize `style/harmony` trước khi gọi `getCTAColors`.
   - Logic cụ thể:
     - Đảm bảo site render deterministic cho dữ liệu cũ/lỗi.

6. **Đồng bộ hook `useBrandColors` admin với site về mode + secondary fallback**
   - File: `app/admin/home-components/create/shared.tsx`
   - Thay đổi:
     - Query thêm `site_brand_mode`.
     - Trả về `{ primary, secondary, mode }`.
     - Behavior giống `components/site/hooks.ts`:
       - single => `secondary = ''`
       - dual => `secondary = setting hợp lệ || complementary(primary)`
   - Logic cụ thể:
     - Đồng nhất data-resolve, giảm risk preview/render lệch.

7. **Cập nhật CTA create page dùng mode từ hook thống nhất**
   - File: `app/admin/home-components/create/cta/page.tsx`
   - Thay đổi:
     - Dùng `const { primary, secondary, mode } = useBrandColors()`.
     - Bỏ query mode riêng tại page.
     - Truyền `mode` cho `CTAForm/CTAPreview`.
   - Logic cụ thể:
     - DRY + loại bỏ divergence do nhiều nguồn mode.

8. **Cập nhật CTA edit page dùng mode từ hook thống nhất**
   - File: `app/admin/home-components/cta/[id]/edit/page.tsx`
   - Thay đổi:
     - Dùng `mode` từ `useBrandColors()`.
     - Bỏ query mode riêng.
   - Logic cụ thể:
     - Đồng nhất create/edit/site contract.

9. **Thêm dirty-state parity cho CTA edit (S3)**
   - File: `app/admin/home-components/cta/[id]/edit/page.tsx`
   - Thay đổi:
     - Thêm `initialData` gồm: `title, active, ctaConfig, ctaStyle, ctaHarmony`.
     - Thêm `hasChanges` + effect compare.
     - Nút save: `disabled={isSubmitting || !hasChanges}`.
     - Label: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu`.
     - Sau save thành công: reset `initialData`, `hasChanges=false`.
   - Logic cụ thể:
     - Compare deep với `JSON.stringify` cho config object.

10. **Bổ sung save-gate cho APCA/harmony trước submit (create + edit)**
    - Files:
      - `app/admin/home-components/create/cta/page.tsx`
      - `app/admin/home-components/cta/[id]/edit/page.tsx`
      - (reuse hàm từ) `app/admin/home-components/cta/_lib/colors.ts`
    - Thay đổi:
      - Trước submit, tính tokens + accessibility + harmony status.
      - Nếu fail nghiêm trọng: block save, toast lỗi rõ nguyên nhân.
    - Logic cụ thể:
      - Block khi `harmonyStatus.isTooSimilar === true` hoặc `accessibility.failing.length > 0`.

11. **Giữ warning UI tại preview nhưng đồng bộ message với save-gate**
    - File: `app/admin/home-components/cta/_components/CTAPreview.tsx`
    - Thay đổi:
      - Giữ warnings hiện tại.
      - Chuẩn hóa text theo cùng ngưỡng của save-gate.

12. **Manual QA matrix bắt buộc (6 layouts × 2 modes × 3 context)**
    - Context:
      - Create preview (`/admin/home-components/create/cta`)
      - Edit preview (`/admin/home-components/cta/[id]/edit`)
      - Site render (`ComponentRenderer`)
    - Kiểm tra:
      - 6 layout khớp preview/site.
      - single mode: harmony hoạt động đúng 3 lựa chọn.
      - dual mode: secondary fallback giống nhau admin/site khi thiếu setting.
      - edit save button đúng pristine/dirty behavior.
      - save bị chặn khi APCA fail hoặc deltaE < 20.

13. **Type check sau khi sửa code TS**
    - Command: `bunx tsc --noEmit`

---

## Acceptance Criteria
- [ ] CTA edit có dirty-state parity chuẩn skill S3.
- [ ] Không còn đường parse màu unsafe trong CTA color engine (S1 pass).
- [ ] Secondary fallback giữa admin preview và site render thống nhất.
- [ ] Save CTA bị chặn khi fail APCA hoặc harmony quá giống.
- [ ] 6 layouts CTA khớp giữa create/edit preview và site render.
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. **Rủi ro:** đổi contract `useBrandColors` ở `create/shared.tsx` ảnh hưởng các page create khác.
   - **Giảm thiểu:** thêm field `mode` dạng mở rộng (backward compatible), giữ nguyên `primary/secondary`.
2. **Rủi ro:** save-gate có thể chặn nhầm case hợp lệ.
   - **Giảm thiểu:** dùng đúng ngưỡng APCA từ skill + hiển thị lý do fail cụ thể.
3. **Rủi ro:** dirty-check false-positive.
   - **Giảm thiểu:** reset `initialData` ngay sau save success, compare đúng field được edit.

---

## Ghi chú
- Theo review hiện tại: CTA **đạt ~80-85% compliance**, chưa thể kết luận “đã áp dụng đầy đủ skill” cho tới khi xử lý 5 root causes ở trên.

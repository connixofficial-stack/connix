# Spec: DARE review Footer (create/edit/preview/render) cho 6 layouts theo `dual-brand-color-system` + fix warning key

## Kết luận nhanh
- **Chưa áp dụng đầy đủ skill** `.factory/skills/dual-brand-color-system` cho Footer.
- Lỗi console `Each child in a list should have a unique "key" prop` ở `FooterPreview` đã xác định đúng root cause và đã có hotfix.

---

## Phạm vi đã review
1. Route user cung cấp: `app/admin/home-components/footer/[id]/edit/page.tsx`
2. Create tương ứng: `app/admin/home-components/create/footer/page.tsx`
3. Preview tương ứng: `app/admin/home-components/_shared/legacy/previews.tsx` (`FooterPreview`)
4. Render site tương ứng: `components/site/ComponentRenderer.tsx` (`FooterSection`)
5. Skill chuẩn đối chiếu: `.factory/skills/dual-brand-color-system/*`

---

## Bằng chứng kỹ thuật chính
1. **Create/Edit Footer không truyền `mode`**
   - `create/footer/page.tsx` dùng `useBrandColors()` từ `create/shared.tsx` chỉ có `{ primary, secondary }`, không có `mode`.
   - `footer/[id]/edit/page.tsx` cũng chỉ truyền `brandColor`, `secondary` cho preview.
2. **Nguồn màu Admin và Site không đồng nhất**
   - `app/admin/home-components/create/shared.tsx`: `useBrandColors()` không đọc `site_brand_mode`.
   - `components/site/hooks.ts`: `useBrandColors()` có `mode`, và khi single mode trả `secondary=''`.
3. **Footer preview/render không có color engine chuẩn skill**
   - Không có `footer/_lib/colors.ts`.
   - Color logic inline duplicated ở `previews.tsx` và `ComponentRenderer.tsx`.
   - Chưa dùng OKLCH/APCA helpers theo skill.
4. **Single mode có nguy cơ style invalid ở Footer**
   - Nhiều style dùng `${secondary}20`, `${secondary}40`, `${secondary}15`.
   - Khi `secondary=''` (site single mode), các giá trị này thành chuỗi màu không hợp lệ.
5. **Lỗi key trong FooterPreview**
   - `previews.tsx` map socials dùng `key={s.id}` nhưng dữ liệu có thể thiếu/đụng `id`.
   - `FooterSocialLink` ở `footer/_types/index.ts` không có trường `id`, gây lệch contract với preview (preview giả định có `id`).
6. **Footer edit chưa có dirty-state parity**
   - Nút save chỉ `disabled={isSubmitting}`, chưa có `hasChanges` như rule S3 trong skill.

---

## Đánh giá mức độ áp dụng skill cho 6 layouts Footer
| Layout | Create/Edit Preview | Site Render | Tuân thủ skill |
|---|---|---|---|
| classic | có dùng 2 màu nhưng không mode-aware | tương tự preview nhưng tách logic riêng | ❌ chưa đầy đủ |
| modern | có dual accent, có gradient decorative | tương tự | ❌ chưa đầy đủ |
| corporate | có dual accent cơ bản | tương tự | ❌ chưa đầy đủ |
| minimal | có dual accent cơ bản | tương tự | ❌ chưa đầy đủ |
| centered | phụ thuộc mạnh vào `secondary` + alpha string | tương tự, single mode dễ invalid color | ❌ chưa đầy đủ |
| stacked | border top dùng `secondary` trực tiếp | tương tự | ❌ chưa đầy đủ |

Lý do chung: thiếu mode pipeline chuẩn, thiếu SSOT color helper, thiếu safety rules của skill v11.1.

---

## Problem Graph
1. [Main] Footer 6 layouts chưa áp dụng đầy đủ dual-brand-color-system cho create/edit/preview/render, đồng thời phát sinh warning key <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Sub] Color architecture chưa theo skill <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Không có `footer/_lib/colors.ts` làm Single Source of Truth; color logic inline và duplicated, chưa dùng OKLCH/APCA
   1.2 [Sub] Mode propagation đứt gãy giữa admin và site <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Admin `useBrandColors` (create/shared) không đọc `site_brand_mode`
      1.2.2 [ROOT CAUSE] Site single mode trả `secondary=''`, nhưng footer styles vẫn build alpha string từ `secondary`
   1.3 [Sub] Preview và render không parity tuyệt đối <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Hai bản implementation copy thủ công, dễ drift, khó đảm bảo cùng behavior
   1.4 [Sub] Warning key tại FooterPreview <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Contract `socialLinks` lệch: preview giả định `id` ổn định, data thực tế có thể thiếu/duplicate `id`
   1.5 [Sub] Edit UX chưa đạt rule S3 <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Thiếu `initialData + hasChanges` nên Save chưa disable khi pristine

---

## Execution (with reflection)
1. Solving 1.2.1 + 1.2.2 (trace mode pipeline)
   - Thought: Muốn kết luận đúng phải trace nguồn màu từ settings -> create/edit -> preview -> site render.
   - Action: Đọc `create/shared.tsx`, `create/footer/page.tsx`, `footer/[id]/edit/page.tsx`, `components/site/hooks.ts`, `ComponentRenderer.tsx`.
   - Reflection: ✓ Xác nhận admin/site đang dùng 2 pipeline khác nhau cho mode.

2. Solving 1.1.1 + 1.3.1 (đối chiếu skill và kiến trúc)
   - Thought: Skill yêu cầu SSOT + safety rules, cần kiểm tra Footer đã có engine riêng chưa.
   - Action: Đọc `footer/_lib/*`, `footer/_components/*`, `legacy/previews.tsx`, `dual-brand-color-system/*`.
   - Reflection: ✓ Xác nhận Footer chưa có `_lib/colors.ts`, logic duplicated và chưa mode-safe theo chuẩn v11.1.

3. Solving 1.4.1 (warning key)
   - Thought: Warning ở React list key thường đến từ key undefined/duplicate.
   - Action: So khớp kiểu dữ liệu social links giữa `FooterConfig` và nơi render map socials.
   - Reflection: ✓ Root cause rõ: `key={s.id}` không ổn định với dữ liệu thiếu/trùng `id`.

4. Execute hotfix runtime warning
   - Thought: Fix nhỏ, an toàn, không đổi behavior UI.
   - Action: Cập nhật map socials trong FooterPreview sang key fallback ổn định theo index (`key={`${s.id ?? 'social'}-${index}`}`) ở tất cả 6 layout.
   - Reflection: ✓ Giải quyết warning key, diff nhỏ, không đụng logic nghiệp vụ.

---

## Hotfix đã thực hiện
- **File đã sửa:** `app/admin/home-components/_shared/legacy/previews.tsx`
- **Nội dung:** với các map social links của FooterPreview, đổi callback thành `(s, index)` và key thành fallback ổn định `key={`${s.id ?? 'social'}-${index}`}`.
- **Mục tiêu đạt:** chặn warning `Each child in a list should have a unique "key" prop` ở `FooterPreview`.

---

## Plan triển khai chi tiết để áp dụng đầy đủ skill (step-by-step actionable)
1. Sửa `app/admin/home-components/footer/_types/index.ts`
   - Thêm `export type FooterBrandMode = 'single' | 'dual';`
   - Bổ sung `id?: number | string` cho `FooterSocialLink` để phản ánh dữ liệu thực tế.

2. Tạo mới `app/admin/home-components/footer/_lib/colors.ts`
   - Thêm `resolveSecondaryForMode(primary, secondary, mode)`.
   - Thêm helper safety parse màu + alpha color (không dùng string concat kiểu `${secondary}20`).
   - Tạo API `getFooterLayoutColors(style, primary, secondary, mode)` trả token màu cho 6 layouts.

3. Refactor `app/admin/home-components/_shared/legacy/previews.tsx` (FooterPreview block)
   - Dừng tính màu inline trong FooterPreview.
   - Dùng token từ `footer/_lib/colors.ts`.
   - Nhận thêm prop `mode` và truyền vào helper màu.

4. Sửa `app/admin/home-components/create/footer/page.tsx`
   - Query `site_brand_mode`.
   - Derive `brandMode` (`single|dual`).
   - Truyền `mode={brandMode}` vào `FooterPreview`.

5. Sửa `app/admin/home-components/footer/[id]/edit/page.tsx` (mode parity)
   - Query `site_brand_mode`.
   - Derive `brandMode`.
   - Truyền `mode={brandMode}` vào `FooterPreview`.

6. Sửa `components/site/ComponentRenderer.tsx` (Footer case)
   - `case 'Footer'` truyền thêm `mode` vào `FooterSection`.
   - `FooterSection` nhận `mode`, resolve secondary trước khi build mọi màu.
   - Chuyển toàn bộ màu alpha sang helper an toàn từ `footer/_lib/colors.ts`.

7. Sửa `components/site/ComponentRenderer.tsx` + `previews.tsx` để cùng dùng contract token
   - Mỗi layout (classic/modern/corporate/minimal/centered/stacked) chỉ consume token màu từ helper.
   - Loại bỏ drift giữa preview và render.

8. Sửa `app/admin/home-components/footer/[id]/edit/page.tsx` (dirty-state)
   - Thêm `initialData` + `hasChanges`.
   - Compare title/active/config/style.
   - Save button: `disabled={isSubmitting || !hasChanges}`.
   - Sau save thành công: cập nhật lại `initialData`, reset pristine.

9. Cập nhật skill docs (đúng scope Footer rollout)
   - `.factory/skills/dual-brand-color-system/SKILL.md`: thêm note Footer-specific pitfalls (secondary alpha, mode single).
   - `.factory/skills/dual-brand-color-system/checklist.md`: thêm checkbox parity preview/render cho component có 6 layouts.

10. Validate kỹ thuật
   - Chạy `bunx tsc --noEmit`.

11. QA manual bắt buộc (create + edit + render + preview)
   - Test đủ 6 layout trong create footer.
   - Test đủ 6 layout trong edit footer.
   - Test site render 6 layout với `site_brand_mode=single` (không invalid color, không warning).
   - Test site render 6 layout với `site_brand_mode=dual` (dual màu đúng).
   - Verify save button edit: pristine disabled, dirty enabled, save xong disabled lại.

12. Commit
   - Stage đúng file scope Footer + skill/doc liên quan.
   - Commit message rõ ràng theo ticket Footer.

---

## Acceptance Criteria
- [ ] Footer create/edit/preview/render đồng bộ mode `single|dual`.
- [ ] Không còn build màu bằng `${secondary}xx` trực tiếp.
- [ ] Footer 6 layouts dùng chung color helper (SSOT) thay vì duplicated inline.
- [ ] Không còn warning key trong `FooterPreview` social links.
- [ ] Footer edit save button disable khi pristine.
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. Rủi ro: refactor trong file `legacy/previews.tsx` dễ ảnh hưởng component khác.
   - Giảm thiểu: chỉ chạm block FooterPreview, giữ diff nhỏ, grep lại symbol sau sửa.
2. Rủi ro: thay đổi màu làm lệch visual hiện tại.
   - Giảm thiểu: snapshot QA 6 layouts trước/sau ở create + site render.
3. Rủi ro: mode single tạo fallback màu không mong muốn.
   - Giảm thiểu: helper `resolveSecondaryForMode` bắt buộc dùng tại mọi callsite.

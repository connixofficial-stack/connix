# Spec: FAQ Dual Brand Color System cho 6 layouts (Create + Edit + Preview + Render trang chủ)

## Mục tiêu
Áp dụng đúng skill `.factory/skills/dual-brand-color-system` cho FAQ component tại route `http://localhost:3000/admin/home-components/create/faq`, đảm bảo **đồng bộ 6 layouts** giữa:
- Create form
- Edit form
- Admin preview
- Frontend render (`/(site)` homepage)

Không mở rộng tính năng ngoài FAQ.

---

## Kết luận review hiện trạng (tại thời điểm viết spec)
**Chưa áp dụng tốt skill dual-brand-color-system.**

### Bằng chứng chính
1. `app/admin/home-components/create/faq/page.tsx` đang dùng preview legacy (`../../_shared/legacy/previews`), không có màu dùng chung với site.
2. `app/admin/home-components/faq/_components/FaqPreview.tsx` chỉ re-export từ file legacy, chưa có module preview riêng cho FAQ.
3. `components/site/ComponentRenderer.tsx` chứa FAQSection inline, hardcode màu trực tiếp theo từng layout, chưa có `_lib/colors.ts` cho FAQ.
4. FAQ chưa có OKLCH/APCA helper riêng; chưa có cơ chế single-mode auto secondary theo harmony.
5. Vi phạm rule “Heading (h2) luôn dùng brandColor”: layout `two-column` đang dùng `secondary` cho heading.
6. Preview và site đang duplicate logic, nguy cơ lệch màu/lệch UX theo thời gian.

### Đánh giá theo checklist skill
- OKLCH only: ❌ (FAQ chưa có color helper riêng)
- APCA text color: ❌
- 60-30-10 content state: ⚠️ (một phần đúng, nhưng không nhất quán)
- Single Source of Truth (preview = site): ❌
- Mode-aware single/dual: ⚠️ (site có mode, FAQ chưa xử lý chuẩn)

---

## Scope triển khai
### In scope
- FAQ 6 layouts: `accordion`, `cards`, `two-column`, `minimal`, `timeline`, `tabbed`
- Đồng bộ create/edit/preview/site render
- Chuẩn hóa token màu FAQ theo dual-brand skill

### Out of scope
- Refactor toàn bộ file legacy preview cho component khác
- Thêm feature mới ngoài FAQ (filter/search/analytics/...)

---

## File dự kiến thay đổi
1. `app/admin/home-components/faq/_types/index.ts`
2. `app/admin/home-components/faq/_lib/constants.ts`
3. `app/admin/home-components/faq/_lib/colors.ts` (new)
4. `app/admin/home-components/faq/_components/FaqSectionShared.tsx` (new)
5. `app/admin/home-components/faq/_components/FaqPreview.tsx`
6. `app/admin/home-components/faq/_components/FaqForm.tsx`
7. `app/admin/home-components/create/faq/page.tsx`
8. `app/admin/home-components/faq/[id]/edit/page.tsx`
9. `components/site/ComponentRenderer.tsx`

---

## Problem Graph
1. [Main] FAQ chưa tuân thủ dual-brand-color-system xuyên suốt create/edit/preview/site <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Sub] Thiếu single source of truth cho màu FAQ <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Chưa có `faq/_lib/colors.ts` + chưa có shared renderer cho 6 layouts
   1.2 [Sub] Lệch giữa create/edit preview và site render <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Preview dùng legacy file, site dùng code inline khác
   1.3 [Sub] Chưa pass checklist OKLCH/APCA/60-30-10 đầy đủ <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Màu hardcoded theo layout, thiếu token hóa semantic
   1.4 [Sub] Chưa xử lý mode `single/dual` nhất quán <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] FAQSection chưa nhận `mode`, secondary có thể rỗng ở site

---

## Execution (with reflection)
1. Solving 1.1.1 — tạo nền tảng màu chuẩn cho FAQ
   - Thought: Phải có một nguồn token màu duy nhất cho cả preview + site.
   - Action:
     - Tạo `app/admin/home-components/faq/_lib/colors.ts` với API:
       - `resolveFaqSecondary(primary, secondary, mode)` (single mode => auto analogous)
       - `getAPCATextColor(bg, fontSize, fontWeight)`
       - `getFaqColors({ primary, secondary, mode, style })`
     - Dùng `culori/oklch` để sinh tint/surface/border/hover, không dùng HSL.
     - Dùng APCA để chọn text on solid.
   - Reflection: ✓ Giải quyết gốc rễ token hóa màu + accessibility.

2. Solving 1.3.1 — map 60-30-10 cho 6 layouts
   - Thought: Cần rule màu rõ theo element-level, tránh “layout nào thích tô gì thì tô”.
   - Action: Chuẩn hóa semantic map trong `getFaqColors`:
     - Neutral (60%): page bg, panel bg, body text
     - Primary (>=25%): heading h2, CTA chính, icon container chính
     - Secondary (>=5%): border accent, chevron, tab active, timeline dot, badge phụ
   - Reflection: ✓ Đảm bảo thống nhất với skill checklist.

3. Solving 1.2.1 — thống nhất renderer 6 layouts dùng chung
   - Thought: Cần tách UI render FAQ thành shared component, tránh duplicate giữa preview/site.
   - Action:
     - Tạo `app/admin/home-components/faq/_components/FaqSectionShared.tsx`.
     - Props tối thiểu: `items`, `title`, `style`, `config`, `tokens`, `context`, `maxVisible?`.
     - Chứa toàn bộ 6 nhánh render layout; giữ state `openIndex`, `activeTab` ngay trong component.
     - Chuẩn ARIA/keyboard cho accordion + tabs.
   - Reflection: ✓ Triệt tiêu drift giữa preview và site (single source of truth UI level).

4. Solving 1.2.1 (tiếp) — refactor FAQ preview module chính thức
   - Thought: FAQ preview không được phụ thuộc legacy nữa.
   - Action:
     - Viết lại `app/admin/home-components/faq/_components/FaqPreview.tsx`:
       - Dùng `PreviewWrapper`, `BrowserFrame`, `usePreviewDevice`.
       - Dùng `FaqSectionShared` + `getFaqColors`.
       - Dùng styles từ constant FAQ module (không hardcode lặp).
       - Cắt item theo device bằng `maxVisible` nhưng không đổi logic màu.
   - Reflection: ✓ Preview tách biệt rõ, dễ maintain.

5. Solving 1.2.1 (tiếp) — refactor create page FAQ về module mới
   - Thought: `create/faq/page.tsx` hiện duplicated form logic + import legacy.
   - Action:
     - `app/admin/home-components/create/faq/page.tsx`:
       - Bỏ import `FaqPreview` từ legacy.
       - Dùng `FaqForm` + `FaqPreview` từ `faq/_components`.
       - Dùng type/constants từ `faq/_types` và `faq/_lib/constants`.
       - Đọc `site_brand_mode` để có `brandMode` và truyền vào preview.
   - Reflection: ✓ DRY hơn, create bám đúng nguồn render mới.

6. Solving 1.2.1 (tiếp) — đồng bộ edit page FAQ
   - Thought: edit phải dùng cùng pipeline như create.
   - Action:
     - `app/admin/home-components/faq/[id]/edit/page.tsx`:
       - Truyền `brandMode` vào preview.
       - Giữ logic config hiện tại nhưng loại bỏ cast `any` không cần thiết sau khi chuẩn type.
       - Đảm bảo style/config giữ nguyên compatibility dữ liệu cũ.
   - Reflection: ✓ Edit và create dùng cùng contract.

7. Solving 1.3.1 (chi tiết layout) — áp rule màu cho từng layout
   - Thought: Mỗi layout phải có role primary/secondary rõ ràng.
   - Action (trong `FaqSectionShared.tsx`):
     - `accordion`: heading primary; border/chevron secondary; answer bg neutral.
     - `cards`: icon container primary-surface; border secondary-subtle; question neutral-strong.
     - `two-column`: **heading đổi sang primary**; CTA bg primary + text APCA; divider secondary-subtle.
     - `minimal`: số thứ tự secondary; heading primary; body neutral.
     - `timeline`: line + dot secondary; card bg neutral; heading primary.
     - `tabbed`: tab active secondary, heading primary, panel border secondary-subtle.
   - Reflection: ✓ Đáp ứng yêu cầu “đủ 6 layout” + rule heading của skill.

8. Solving 1.4.1 — mode-aware single/dual cho FAQ
   - Thought: Site single mode có thể trả `secondary = ''`, phải an toàn.
   - Action:
     - `getFaqColors` bắt buộc nhận `mode` và luôn resolve ra secondary hợp lệ.
     - Tránh string concat kiểu `${secondary}15` trực tiếp; dùng helper alpha/tint từ palette.
     - Tại site: truyền `mode` từ `useBrandColors()` xuống FAQSection.
   - Reflection: ✓ Tránh CSS invalid + đồng nhất behavior single/dual.

9. Solving 1.2.1 + 1.4.1 — tích hợp vào homepage renderer
   - Thought: `ComponentRenderer.tsx` đang để FAQ inline, cần bọc lại bằng shared pipeline.
   - Action:
     - Sửa `components/site/ComponentRenderer.tsx`:
       - `switch case 'FAQ'` truyền thêm `mode`.
       - `FAQSection` dùng `getFaqColors` + `FaqSectionShared` thay vì inline JSX 6 layout.
       - Giữ JSON-LD FAQ schema như cũ (không mất SEO).
   - Reflection: ✓ Render trang chủ match preview cùng một nguồn logic.

10. Hoàn thiện contract & constants
   - Thought: tránh hardcode style list ở nhiều nơi.
   - Action:
     - `faq/_types/index.ts`: chuẩn hóa `FaqStyle`, `FaqConfig`, thêm `FaqBrandMode`.
     - `faq/_lib/constants.ts`: thêm `FAQ_STYLES`, `DEFAULT_FAQ_CONFIG`.
   - Reflection: ✓ KISS + DRY, giảm sai lệch do copy-paste.

11. Validation kỹ thuật bắt buộc
   - Thought: spec cần tiêu chí nghiệm thu đo được.
   - Action:
     - Chạy `bunx tsc --noEmit` sau khi code xong.
     - Manual QA matrix:
       - 6 layouts × 3 context (create preview, edit preview, site homepage)
       - 2 mode màu (`single`, `dual`)
       - 3 data states (empty, <=6 items, >6 items)
       - Kiểm tra heading luôn primary và không còn secondary rỗng gây style lỗi.
   - Reflection: ✓ Có kiểm thử đủ sâu cho yêu cầu user.

12. Cleanup an toàn
   - Thought: giảm rủi ro từ legacy nhưng không mở rộng scope.
   - Action:
     - Chỉ bỏ phụ thuộc FAQ vào legacy; không refactor toàn file legacy.
     - Không đổi schema dữ liệu FAQ trong Convex.
   - Reflection: ✓ Đúng YAGNI, không tạo side-effect lớn.

---

## Acceptance Criteria
- [ ] Route `/admin/home-components/create/faq` không còn import FAQ preview từ legacy.
- [ ] 6 layouts FAQ hiển thị đúng ở create preview.
- [ ] 6 layouts FAQ hiển thị đúng ở edit preview.
- [ ] 6 layouts FAQ render đồng nhất trên trang chủ (`app/(site)/page.tsx` + `ComponentRenderer`).
- [ ] FAQ có color helper riêng theo OKLCH + APCA.
- [ ] Layout `two-column` dùng heading primary (không dùng secondary).
- [ ] Single mode vẫn render hợp lệ (không lỗi màu rỗng/invalid CSS).
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & cách giảm thiểu
1. Rủi ro: Sửa `ComponentRenderer.tsx` dễ va chạm component khác.
   - Giảm thiểu: chỉ khoanh vùng case FAQ + function FAQSection.
2. Rủi ro: Mismatch behavior do preview giới hạn số item còn site render full.
   - Giảm thiểu: shared renderer nhận `maxVisible` tùy context, không đổi color logic.
3. Rủi ro: Single mode không có secondary thực.
   - Giảm thiểu: resolve secondary trong `getFaqColors` theo harmony mặc định analogous.

---

## Ghi chú triển khai
- Tuân thủ KISS/YAGNI/DRY: chỉ tách những gì FAQ đang duplicate và gây drift.
- Không đổi API Convex `homeComponents`.
- Không thay đổi các component khác ngoài FAQ trong spec này.

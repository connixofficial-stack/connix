## TL;DR kiểu Feynman
- Anh nói đúng: `Màu custom Hero danh mục` hiện gần như chưa được áp dụng đúng theo skill `dual-brand-color-system`.
- Em đã đọc skill, checklist, reference và đối chiếu với `HomepageCategoryHeroSection` hiện tại.
- Root cause không phải thiếu state lưu màu, mà là thiếu hẳn lớp `_lib/colors.ts` + semantic tokens dùng chung giữa preview/site.
- File runtime đang còn hardcode màu, inline accent rời rạc, thậm chí còn vi phạm rule của skill như `hover:text-blue-600`, `bg-blue-50`, `backdrop-blur`, `shadow-xl`.
- Hướng sửa đúng là: tạo helper màu chuẩn cho `HomepageCategoryHero`, sau đó cho Preview và Site cùng consume tokens, không patch màu lẻ tẻ nữa.

## Audit Summary
### Observation
1. Skill `dual-brand-color-system` yêu cầu `Single Source of Truth`: Preview và Site phải dùng cùng helper `_lib/colors.ts`, không hardcode màu trong site runtime.
2. `HomepageCategoryHero` hiện **không có** file màu riêng kiểu `app/admin/home-components/homepage-category-hero/_lib/colors.ts`, trong khi các component chuẩn như `hero`, `stats` đều có helper màu riêng.
3. `components/site/HomepageCategoryHeroSection.tsx` hiện còn hardcode nhiều màu giao diện như:
   - `bg-blue-50 text-blue-700`
   - `hover:text-blue-600`
   - nhiều `text-slate-*`, `border-slate-*`
   - inline `style={{ backgroundColor: accentColor }}` kiểu patch lẻ
4. File này còn chứa nhiều pattern skill cấm hoặc cần tránh cho UI enterprise như `backdrop-blur`, `shadow-xl`, `shadow-lg`, `shadow-2xl` ở mega panel.
5. Logic màu hiện tại chỉ có `accentColor = mode === 'dual' ? secondary : primary`, tức là mới thay 1 vài điểm trang trí, chưa có semantic palette cho section title, badge, link, active state, panel border, divider, CTA, placeholder, nav controls.
6. Skill yêu cầu `single mode = monochromatic`, resolve secondary trước khi build palette, APCA guard cho text trên nền solid, và mapping 60-30-10; `HomepageCategoryHeroSection` hiện chưa có pipeline đó.
7. `ComponentRenderer` và `HomepageCategoryHeroPreview` đã truyền `primary/secondary/mode`, nhưng section runtime vẫn chưa có token engine để tiêu thụ đúng.

### Inference
- Vấn đề gốc là kiến trúc màu của `HomepageCategoryHero` đang đi theo kiểu vá trực tiếp ở UI render, không theo pattern chuẩn của skill.
- Vì không có helper semantic tokens, nên custom màu có lưu cũng không lan đúng vào giao diện.
- Nếu chỉ tiếp tục vá vài `style={{ color: ... }}` thì vẫn sai hướng và sẽ còn lệch Preview/Site.

### Decision
- Em đề xuất **không sửa kiểu chấm vá thêm vài chỗ** nữa.
- Thay vào đó sẽ refactor `HomepageCategoryHero` theo đúng `dual-brand-color-system`: tạo helper màu riêng + semantic tokens + Preview/Site dùng chung.

## Root Cause Confidence
**High** — vì evidence rất rõ:
- Skill yêu cầu bắt buộc `_lib/colors.ts` + tokens dùng chung.
- `HomepageCategoryHero` không có helper này.
- Runtime đang hardcode màu và dùng inline patch rời rạc.
- Các component chuẩn khác (`hero`, `stats`) đã có helper màu riêng để làm source of truth.

## Files Impacted
### UI / shared color system
- `app/admin/home-components/homepage-category-hero/_lib/colors.ts` — Vai trò hiện tại: **Chưa có**; Thay đổi: **Thêm** helper semantic tokens cho `HomepageCategoryHero` theo OKLCH + APCA + single/dual mode.
- `components/site/HomepageCategoryHeroSection.tsx` — Vai trò hiện tại: render runtime với nhiều hardcoded colors; Thay đổi: **Sửa** để nhận `tokens` và thay toàn bộ màu hardcode/inline bằng semantic tokens.
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx` — Vai trò hiện tại: preview truyền màu thô; Thay đổi: **Sửa** để generate cùng tokens từ helper mới và truyền vào section/runtime preview.
- `components/site/ComponentRenderer.tsx` — Vai trò hiện tại: resolve primary/secondary/mode; Thay đổi: **Sửa** để build `HomepageCategoryHero` tokens từ helper mới rồi pass vào section.

### Có thể cần sửa nhẹ nếu thiếu typing
- `app/admin/home-components/homepage-category-hero/_types/index.ts` — Vai trò hiện tại: khai báo types config hiện có; Thay đổi: **Có thể sửa** nếu cần thêm type cho color tokens export/public signature.

## Problem Graph
1. [Main] Custom màu Hero danh mục không áp dụng đúng giao diện
   1.1 [Sub] Không có helper màu chuẩn `_lib/colors.ts`
      1.1.1 [ROOT CAUSE] Site/Preview không có single source of truth cho màu
   1.2 [Sub] Runtime đang hardcode Tailwind/inline colors
   1.3 [Sub] Chưa có semantic token mapping cho primary/secondary/neutral
   1.4 [Sub] Một số surface còn vi phạm guardrails skill (blur/shadow/blue hardcode)

## Execution Preview
1. Đọc pattern của `hero/_lib/colors.ts` và `stats/_lib/colors.ts` để bám convention repo.
2. Thêm `homepage-category-hero/_lib/colors.ts` với các helper:
   - `safeParseOklch`
   - `resolveSecondaryForMode`
   - APCA text guard
   - semantic tokens cho nav item, panel, links, title, border, placeholder, controls.
3. Refactor `HomepageCategoryHeroSection` để:
   - nhận `tokens`
   - bỏ hardcode `bg-blue-50`, `hover:text-blue-600`, inline accent patch rời rạc
   - map primary/secondary theo 60-30-10 rule
   - giữ single mode = monochromatic.
4. Refactor `HomepageCategoryHeroPreview` và `ComponentRenderer` để cùng dùng `getHomepageCategoryHeroColors(...)`.
5. Static review các surface đang vi phạm skill (`backdrop-blur`, decorative shadow mạnh, opacity decorative) và hạ về border/shadow-sm nếu cần.
6. Chạy `bunx tsc --noEmit` rồi commit.

## Acceptance Criteria
- `HomepageCategoryHero` có helper màu riêng trong `_lib/colors.ts` và Preview/Site cùng dùng helper đó.
- Đổi custom màu ở system/type override → preview và site runtime cùng đổi, không lệch nhau.
- `single` mode chỉ dùng 1 family màu, không phát sinh harmony giả.
- `dual` mode dùng được cả primary và secondary trên các surface có nghĩa, không chỉ 1-2 chấm nhỏ.
- Không còn hardcode `bg-blue-*`, `text-blue-*`, `hover:text-blue-*` trong render chính của `HomepageCategoryHeroSection`.
- Các điểm màu solid cần text/icon readable đều đi qua APCA guard.

## Verification Plan
- Static audit sau sửa:
  1. grep lại các hardcode màu xanh/hardcode inline trong `HomepageCategoryHeroSection`
  2. xác nhận Preview và Site cùng gọi chung helper màu
  3. rà single-mode fallback = primary
- Typecheck: chạy `bunx tsc --noEmit`.
- Không chạy lint/build/test vì guideline repo cấm.

## Out of Scope
- Không đổi schema settings hoặc flow save custom màu/font vì backend/state hiện đã có.
- Không redesign layout `HomepageCategoryHero`, chỉ chuẩn hóa hệ màu theo skill.

## Risk / Rollback
- Rủi ro chính: đổi token mạnh tay có thể làm một số layout (`flush`, `soft`, `top-nav`) lệch cảm giác thị giác ban đầu.
- Rollback đơn giản vì scope tập trung ở helper màu mới + wiring vào 2 nơi render.

## Post-Audit Note
Bản fix trước của em mới chỉ là patch bề mặt, chưa đúng skill. Bản triển khai tiếp theo sẽ sửa đúng kiến trúc màu theo `dual-brand-color-system`, không vá thêm kiểu thủ công nữa.
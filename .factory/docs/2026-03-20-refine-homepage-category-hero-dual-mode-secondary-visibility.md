## TL;DR kiểu Feynman
- Anh đang để mode 2 màu là đúng, nhưng màu phụ hiện tại gần như không có chỗ “đủ lớn” để mắt nhìn thấy.
- Code bây giờ chỉ dùng màu phụ cho vài chi tiết rất nhỏ như bullet và hover link, nên nhìn thực tế vẫn giống 1 màu.
- Root cause không còn là thiếu wiring, mà là **phân phối accent sai**: primary chiếm gần hết, secondary không có surface đủ prominence.
- Theo skill, dual mode phải có secondary ở subtitle/label/badge/secondary action/accent đủ rõ, không chỉ 1 chấm nhỏ.
- Hướng sửa tiếp là chỉnh lại token mapping cho `HomepageCategoryHero`: giữ primary cho heading/active chính, nhưng đẩy secondary vào các surface lớn hơn và luôn-visible.

## Audit Summary
### Observation
1. Trong helper `app/admin/home-components/homepage-category-hero/_lib/colors.ts`, token secondary hiện có được tạo đúng (`secondaryPalette`), nhưng mapping vào UI còn quá yếu:
   - `topNav.bullet = secondaryPalette.solid`
   - `menuLink.hover = secondaryPalette.textInteractive`
   - `softPill.hoverBg = secondaryPalette.surface`
2. Các surface luôn-visible, diện tích lớn lại vẫn đang do primary hoặc neutral nắm hết:
   - `sidebar.activeBg = primaryPalette.surface`
   - `sidebar.activeBorder = primaryPalette.solid`
   - `sidebar.groupTitle = primaryPalette.textInteractive`
   - `topNav.activeBg = primaryPalette.solid`
   - `panel.border = neutral.border`
   - `control.* = neutral`
3. Ở `components/site/HomepageCategoryHeroSection.tsx`, các line đang consume secondary chủ yếu nằm ở:
   - bullet top-nav
   - hover text/link
   - soft-pill hover
   Đây đều là state nhỏ, thậm chí chỉ hiện khi hover/focus.
4. Ảnh anh gửi cho thấy giao diện đang hiển thị gần như toàn neutral + primary, không có mảng secondary đủ lớn để user nhận ra đang ở dual-mode.
5. Theo skill `dual-brand-color-system`, secondary phải xuất hiện ở subtitle/label/badge/secondary action/decorative accent với prominence đủ nhìn thấy; không nên chỉ nằm ở micro-detail.
6. Checklist skill cũng yêu cầu accent balance và “secondary có element đủ lớn (không chỉ icon < 20px)”. Bản hiện tại chưa đạt điều này.

### Inference
- Dual-mode hiện **đang hoạt động về mặt dữ liệu**, nhưng **không đạt visibility contract**.
- Vấn đề bây giờ là **token distribution**, không phải save/load config.
- Nếu không đổi mapping token, user sẽ tiếp tục thấy “mode 2 màu” nhưng UI vẫn trông như 1 màu.

### Decision
- Cần một vòng refine nữa để tăng độ hiện diện của secondary trên các surface luôn-visible.
- Em đề xuất sửa theo hướng tối thiểu nhưng đúng skill: không redesign layout, chỉ phân phối lại role của secondary cho các vùng đủ lớn và luôn hiển thị.

## Root Cause Confidence
**High** — vì evidence trực tiếp từ code mapping:
- secondary hiện chỉ map vào bullet/hover/surface nhỏ
- primary chiếm hầu hết vùng visual lớn
- ảnh thực tế user gửi khớp với code path này

## Files Impacted
### UI / color distribution
- `app/admin/home-components/homepage-category-hero/_lib/colors.ts` — Vai trò hiện tại: sinh token dual-brand; Thay đổi: **Sửa** lại mapping role primary/secondary để secondary xuất hiện trên surface đủ lớn và always-visible.
- `components/site/HomepageCategoryHeroSection.tsx` — Vai trò hiện tại: consume tokens ở runtime/preview; Thay đổi: **Sửa** chỗ consume token để một số vùng dùng secondary thật thay vì neutral/primary.

## Problem Graph
1. [Main] Dual mode bật nhưng màu phụ không thấy rõ
   1.1 [Sub] Secondary chỉ gắn vào micro-accent (bullet, hover)
      1.1.1 [ROOT CAUSE] Token distribution không cho secondary một surface đủ prominence
   1.2 [Sub] Primary đang chiếm cả active state lẫn section emphasis
   1.3 [Sub] Nhiều surface currently neutral nên secondary không có “đất diễn”

## Execution Preview
1. Rà lại token contract trong `_lib/colors.ts` và chọn 3–5 surface always-visible cho secondary.
2. Giữ primary cho các role đúng skill:
   - active state chính
   - heading/CTA chính
3. Đẩy secondary vào các role đúng skill và đủ to:
   - group title / label phụ
   - border hoặc accent bar của mega panel
   - link phụ “Tất cả” / secondary action
   - soft-pill background hoặc section sub-accent luôn visible
   - top-nav inactive/hover accent hoặc panel badge-like accent
4. Đảm bảo single mode vẫn monochromatic: mọi secondary fallback về primary.
5. Static review lại 60-30-10 + secondary prominence + APCA text pairs.

## Acceptance Criteria
- Khi mode = `dual`, user nhìn vào giao diện preview/site sẽ thấy rõ có 2 màu mà không cần hover.
- Màu phụ xuất hiện ở ít nhất 2–3 surface luôn-visible, không chỉ bullet/icon nhỏ.
- Primary vẫn là màu dominant cho active state chính và branding chính.
- Single mode không đổi behavior: vẫn mono, không phát sinh màu phụ giả.
- Preview và site runtime tiếp tục đồng bộ cùng token helper.

## Verification Plan
- Audit tĩnh sau sửa:
  1. grep lại toàn bộ consumer của `resolvedTokens.secondary` / token secondary-related
  2. xác nhận có ít nhất 2–3 surface always-visible consume secondary
  3. rà single mode fallback = primary
- Typecheck: `bunx tsc --noEmit`
- Không chạy lint/build/test theo guideline repo.

## Out of Scope
- Không đổi flow save custom color ở admin/system.
- Không làm lại layout `HomepageCategoryHero` hay thêm feature mới.

## Risk / Rollback
- Nếu đẩy secondary quá mạnh có thể làm layout mất cân bằng, đặc biệt variant `soft` và `top-nav`.
- Rollback đơn giản vì chỉ đổi mapping token + consumer style, không đụng schema/data.

## Post-Audit Note
Kết luận ngắn: hiện tại dual-mode không bị hỏng, nhưng đang **quá kín**. Cần refine prominence của secondary để đúng cảm nhận người dùng và đúng contract của skill.
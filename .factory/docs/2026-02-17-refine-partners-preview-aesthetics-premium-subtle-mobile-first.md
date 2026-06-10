## Problem Graph
1. [Main] Nâng aesthetic cho Partners Preview (6 layout) theo hướng premium tinh xảo, giữ nguyên dual-brand logic
   1.1 [ROOT CAUSE] Visual rhythm chưa tinh tế: spacing, hierarchy, density chưa đồng nhất giữa 6 layout
   1.2 Motion đang chưa đủ subtle/premium cho marquee/carousel
   1.3 Accent placement đúng kỹ thuật nhưng chưa đẹp về nhịp điệu thị giác

## Execution (with reflection)
1. Solving 1.1.1 (ROOT): chuẩn hóa visual system cho Preview-only
   - Thought: Cần một “design token layer” riêng cho aesthetic (không đổi business/color logic) để đồng bộ 6 layout.
   - Action: Mở rộng `app/admin/home-components/partners/_lib/colors.ts` bằng nhóm token aesthetic:
     - spacing scale cho preview (`sectionY`, `contentGap`, `cardPad`, `logoHeight` theo mobile-first)
     - radius scale (`badge`, `card`, `feature`)
     - border hierarchy (primary border vs subtle divider)
     - typography mapping (title weight/size, meta text tone)
   - Reflection: ✓ Giữ nguyên dual-brand; chỉ cải thiện “cách hiển thị”.

2. Solving 1.1.2: nâng hierarchy cho 6 layout trong Preview
   - Thought: Cùng một palette nhưng thiếu nhịp “hero/secondary/supporting”.
   - Action (file `app/admin/home-components/partners/_components/PartnersPreview.tsx`):
     - Chuẩn title block: accent bar mảnh hơn, khoảng cách title-content nhất quán.
     - Grid: giảm cảm giác thô bằng card density nhẹ (padding/logos/empty state icon scale chuẩn).
     - Featured: tinh chỉnh tỉ lệ khối nổi bật vs khối phụ để có focal point rõ.
   - Reflection: ✓ Không đổi mode/color semantics, chỉ tăng độ premium.

3. Solving 1.2: motion rất nhẹ cho marquee/carousel
   - Thought: User chọn “Rất nhẹ”, nên giảm speed, giảm transform mạnh, bỏ hiệu ứng gây nhiễu.
   - Action:
     - `PartnersMarqueeShared.tsx`: giảm base speed + adaptive multiplier; hover chỉ dừng/cuộn nhẹ, không scale mạnh logo.
     - `PartnersCarouselShared.tsx`: nav transition ngắn, dot/page chuyển mượt nhẹ, giảm motion distance.
   - Reflection: ✓ Premium subtle, mobile-friendly, không flashy.

4. Solving 1.3: tinh chỉnh badge/carousel/featured cho premium micro-contrast
   - Thought: Cần micro-contrast và tonal layering để nhìn “đắt” nhưng vẫn flat enterprise.
   - Action:
     - `PartnersBadgeShared.tsx`: đổi balance bg/border/text để badge rõ tầng, tên logo đọc tốt hơn.
     - `PartnersFeaturedShared.tsx`: refined badge “NỔI BẬT” (size/weight/spacing), khung phụ đồng nhất optical alignment.
     - `PartnersCarouselShared.tsx`: controls gọn, spacing nav-group và page-indicator cân đối mobile-first.
   - Reflection: ✓ Tăng độ tinh tế mà không phá anti-ai styling rule.

5. Scope guard: chỉ Preview admin (theo yêu cầu)
   - Thought: User chọn chỉ preview admin, nên không chỉnh site render để tránh vượt scope.
   - Action:
     - Chỉ sửa các file preview-side:
       - `app/admin/home-components/partners/_components/PartnersPreview.tsx`
       - `app/admin/home-components/partners/_components/PartnersMarqueeShared.tsx`
       - `app/admin/home-components/partners/_components/PartnersBadgeShared.tsx`
       - `app/admin/home-components/partners/_components/PartnersCarouselShared.tsx`
       - `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
       - `app/admin/home-components/partners/_lib/colors.ts` (token mở rộng nhưng không đổi logic mode)
     - Không sửa `components/site/ComponentRenderer.tsx` trong vòng này.
   - Reflection: ✓ Đúng phạm vi user yêu cầu.

6. Validation & hoàn tất
   - Chạy `bunx tsc --noEmit`.
   - Kiểm tra nhanh 6 style trong preview (mobile-first):
     - title hierarchy ổn
     - spacing/radius thống nhất
     - motion subtle
     - contrast text đủ đọc.
   - Commit theo convention: `refactor(partners): refine premium preview aesthetics for 6 layouts`.

## Acceptance Criteria
- Giữ nguyên đúng dual-brand logic đã làm đúng trước đó.
- Preview admin nhìn premium/tinh tế hơn rõ rệt (không flashy, không nặng hiệu ứng).
- Mobile-first hiển thị cân đối hơn desktop.
- Không ảnh hưởng site render trong vòng chỉnh này.
- TypeScript pass (`bunx tsc --noEmit`).
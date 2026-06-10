## Problem Graph
1. [Main] Rollout full custom-color theo skill cho toàn bộ home-components, đồng bộ 3 route `/system/home-components`, `/admin/home-components`, `/admin/home-components/create` <- depends on 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   1.1 [ROOT CAUSE] Tầng Create chưa parity: chỉ `create/hero/page.tsx` dùng `useTypeColorOverrideState`, các create page còn lại vẫn dùng `useBrandColors` trực tiếp
   1.2 `/admin/home-components/page.tsx` còn hardcode `COMPONENT_TYPES` + `EDIT_ROUTE_MAP`, lệch nguồn chuẩn `lib/home-components/componentTypes.ts`
   1.3 Fallback route `/admin/home-components/[id]/edit/page.tsx` có redirect map cứng, dễ drift khi thêm/sửa type
   1.4 System page đã có custom toggle/bulk nhưng vẫn thiếu feedback ở 1 nhánh (`handleHideSelected`)
   1.5 Cần parity contract xuyên suốt System -> Convex -> Create/Edit -> Site renderer cho tất cả type
   1.6 Cần verification matrix theo mapping route/code (không chạy browser) để chứng minh đồng bộ 3 URL localhost

## Execution (with reflection)
1. Solving 1.1.1 — Chuẩn hoá nền tảng mapping type dùng chung
- Thought: Muốn rollout all-type không lỗi lặp thì mọi page phải dùng chung metadata type.
- Action:
  - Chuẩn hoá import từ `@/lib/home-components/componentTypes` tại các nơi còn hardcode.
  - Tạo helper route dùng chung (nếu chưa có) trong `app/admin/home-components/_shared/lib/` để map type -> create/edit slug từ 1 nguồn.
- Reflection: ✓ Valid — giảm drift khi thêm type mới.

2. Solving 1.1.2 — Full parity cho `/admin/home-components/create/*`
- Thought: Gap lớn nhất hiện tại là create pages chưa ăn theo override per-type.
- Action:
  - Áp dụng pattern Template B của skill cho toàn bộ create pages (trừ `create/page.tsx` là selector):
    - `create/about/page.tsx`
    - `create/benefits/page.tsx`
    - `create/blog/page.tsx`
    - `create/career/page.tsx`
    - `create/case-study/page.tsx`
    - `create/category-products/page.tsx`
    - `create/clients/page.tsx`
    - `create/contact/page.tsx`
    - `create/countdown/page.tsx`
    - `create/cta/page.tsx`
    - `create/faq/page.tsx`
    - `create/features/page.tsx`
    - `create/footer/page.tsx`
    - `create/gallery/page.tsx`
    - `create/partners/page.tsx`
    - `create/pricing/page.tsx`
    - `create/process/page.tsx`
    - `create/product-categories/page.tsx`
    - `create/product-grid/page.tsx`
    - `create/product-list/page.tsx`
    - `create/service-list/page.tsx`
    - `create/services/page.tsx`
    - `create/speed-dial/page.tsx`
    - `create/stats/page.tsx`
    - `create/team/page.tsx`
    - `create/testimonials/page.tsx`
    - `create/trust-badges/page.tsx`
    - `create/video/page.tsx`
    - `create/voucher-promotions/page.tsx`
  - Mỗi file tạo state:
    - `const { customState, effectiveColors, showCustomBlock, setCustomState } = useTypeColorOverrideState('<Type>')`
  - Trước `handleSubmit`, gọi `setTypeColorOverride` khi `showCustomBlock`.
  - Preview props đổi từ `useBrandColors()` sang `effectiveColors`.
  - Nếu có mode switch UI: single mode ép secondary = primary bằng `resolveSecondaryByMode`.
- Reflection: ✓ Valid — hoàn tất parity create/edit/preview theo skill.

3. Solving 1.2 — Chuẩn hoá `/admin/home-components/page.tsx` theo source chung
- Thought: Page list admin đang là điểm drift lớn vì hardcode types/routes cũ.
- Action:
  - Thay `COMPONENT_TYPES` cục bộ bằng `HOME_COMPONENT_BASE_TYPES`/`COMPONENT_TYPES` từ shared source.
  - Thay `EDIT_ROUTE_MAP` hardcode bằng helper map route chung từ `_shared/lib` (được build từ `componentTypes.ts`).
  - Giữ nguyên UX kéo-thả/bulk/delete hiện tại (KISS/YAGNI), chỉ thay nguồn dữ liệu route/type.
- Reflection: ✓ Valid — đồng bộ chặt `/admin/home-components` với `/admin/home-components/create`.

4. Solving 1.3 — Chuẩn hoá fallback route `/admin/home-components/[id]/edit/page.tsx`
- Thought: Fallback redirect map cứng sẽ lệch khi thêm type mới.
- Action:
  - Refactor redirect map trong `app/admin/home-components/[id]/edit/page.tsx` để dùng chung helper type->slug.
  - Nếu type không có mapping: giữ toast lỗi + redirect về list.
- Reflection: ✓ Valid — loại bỏ drift route-level.

5. Solving 1.4 — Hoàn thiện feedback ở `/system/home-components`
- Thought: Skill yêu cầu mọi toggle/action có toast success/error.
- Action:
  - Bọc `handleHideSelected` trong try/catch + toast success/error, thống nhất với các action khác.
  - Không đổi payload/settings shape hiện tại.
- Reflection: ✓ Valid — khép kín contract UX ở system control center.

6. Solving 1.5 — Giữ parity backend + renderer
- Thought: Phần này gần đạt nhưng cần xác nhận theo contract all-type.
- Action:
  - Giữ `convex/homeComponentSystemConfig.ts` dùng `HOME_COMPONENT_TYPE_VALUES` (đã đúng).
  - Xác nhận `components/site/ComponentRenderer.tsx` resolve màu bằng `resolveTypeOverrideColors` cho mọi case.
  - Chỉ bổ sung nếu phát hiện branch còn dùng raw color.
- Reflection: ✓ Valid — tránh sửa thừa, giữ DRY/KISS.

7. Solving 1.6 — Verification matrix theo mapping route/code (không browser)
- Thought: User yêu cầu verify bằng checklist logic + mapping code, không chạy localhost browser.
- Action:
  - Lập bảng pass/fail theo nhóm:
    - System route `/system/home-components`: action có toast + source types chung + bulk/per-row.
    - Admin list `/admin/home-components`: type source + edit link source đồng nhất.
    - Create hub `/admin/home-components/create`: filter hiddenTypes đúng source.
    - All create pages: có `useTypeColorOverrideState` + `setTypeColorOverride` + preview dùng `effectiveColors`.
    - All edit pages: có `TypeColorOverrideCard` + `useTypeColorOverrideState` (đã có, chỉ verify).
    - Site renderer: resolve override all-type.
  - Verification bằng grep/read theo pattern, xuất báo cáo rõ file đạt/chưa đạt.
- Reflection: ✓ Valid — đúng yêu cầu “logic + mapping route/code”.

## File-level Plan chi tiết
1) `app/admin/home-components/_shared/lib/*` (thêm/chuẩn hoá helper route mapping)
- Tạo hàm chuẩn:
  - `getTypeRoute(type)`
  - `getCreateRoute(type)`
  - `getEditRoute(type, id)`
- Source duy nhất từ `componentTypes.ts`.

2) `app/admin/home-components/page.tsx`
- Bỏ constants hardcode `COMPONENT_TYPES` và `EDIT_ROUTE_MAP`.
- Import source chung + helper route.
- Giữ nguyên flow DnD, select, bulk delete, toggle active.

3) `app/admin/home-components/[id]/edit/page.tsx`
- Thay `redirectMap` hardcode bằng helper route.

4) `app/system/home-components/page.tsx`
- Bổ sung toast cho `handleHideSelected`.

5) `app/admin/home-components/create/*/page.tsx` (toàn bộ type pages)
- Áp dụng pattern override create từ skill.
- Đồng bộ preview color props sang `effectiveColors`.
- Đảm bảo single mode xử lý secondary nhất quán.

6) `app/admin/home-components/create/page.tsx`
- Giữ logic hiddenTypes hiện tại.
- Chỉ chỉnh import/source nếu cần đồng bộ helper/type.

7) `components/site/ComponentRenderer.tsx`
- Chỉ verify/patch nếu còn branch raw color.

8) `convex/homeComponentSystemConfig.ts`
- Chỉ verify (không đổi nếu đã đạt contract).

## Checklist nghiệm thu cuối
- [ ] `/system/home-components` dùng source types chuẩn, per-row + bulk + hide-selected đều có toast.
- [ ] `/admin/home-components` không còn type/route hardcode riêng.
- [ ] `/admin/home-components/[id]/edit` redirect dùng helper route chung.
- [ ] `/admin/home-components/create` vẫn lọc hiddenTypes đúng.
- [ ] 100% create type pages dùng `useTypeColorOverrideState` + persist override trước create mutation.
- [ ] 100% edit type pages giữ parity custom block + effectiveColors.
- [ ] Site renderer áp dụng override cho mọi type.
- [ ] Verification matrix (logic/mapping) có báo cáo pass/fail rõ ràng.

## Commit plan
- Commit 1: refactor nguồn route/type dùng chung + admin list/fallback/system page.
- Commit 2: rollout create pages all-type theo skill template.
- Commit 3: verification fixes (nếu phát hiện nhánh lệch) + finalize.

## Best practices áp dụng xuyên suốt
- KISS: chỉ sửa phần route/type/color parity, không mở rộng feature mới.
- DRY: một nguồn type/route duy nhất, không map hardcode lặp.
- YAGNI: không thêm abstraction ngoài nhu cầu rollout custom-color.
- Guardrail skill: single=primary/secondary, toast đầy đủ, renderer luôn resolve override.
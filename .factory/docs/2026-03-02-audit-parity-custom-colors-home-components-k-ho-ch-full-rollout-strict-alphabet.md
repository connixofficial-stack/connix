Đã audit theo mức **Strict full parity** và ưu tiên **alphabet** như bạn chọn.

## Kết quả audit hiện tại
- Tổng home-component type: **30** (theo `HOME_COMPONENT_TYPE_VALUES`).
- **Create parity (wrapper contract): 30/30 đạt**
  - Dùng `useTypeColorOverrideState(...)` + `ComponentFormWrapper` (hoặc shared wrapper), không render card rời, không tự gọi `setTypeColorOverride` trong create page.
- **Site renderer parity: 30/30 đạt**
  - `components/site/ComponentRenderer.tsx` đã resolve màu qua `resolveTypeOverrideColors(...)` và truyền `resolvedColors` vào từng case (không dùng raw system colors cho runtime branch chính).
- **Edit parity strict (handler chuẩn Features): 15/30 đạt, 15/30 chưa đạt**
  - Các file chưa đạt chủ yếu đang dùng `onModeChange={(next) => setCustomState(prev => ({ ...prev, mode: next }))}` nên thiếu ép single/dual theo contract.

### Nhóm đã đạt Edit parity strict (15)
`Benefits, Blog, CategoryProducts, CTA, FAQ, Features, Footer, Hero, Partners, ProductCategories, ProductGrid, ProductList, ServiceList, Stats, TrustBadges`.

### Nhóm chưa đạt Edit parity strict (15)
`About, Career, CaseStudy, Clients, Contact, Countdown, Gallery, Pricing, Process, Services, SpeedDial, Team, Testimonials, Video, VoucherPromotions`.

## Root cause
- Contract create + renderer đã chuẩn hoá tốt.
- Chênh lệch còn lại nằm ở **edit custom card handlers** của 15 component chưa đạt (không ép mode/state giống Features).

## Full plan xử lý (alphabet, không refactor lan man)
1. **Chuẩn hoá template handler chung (không tạo abstraction mới)**
   - Dùng đúng pattern Features tại từng file edit:
     - `onModeChange('single') => secondary = primary`
     - `onModeChange('dual')` từ single => `secondary = getSuggestedSecondary(primary)`
     - `onPrimaryChange` khi single => sync `secondary = primary`
   - Giữ nguyên mọi UI/UX hiện có, chỉ thay phần logic handler.

2. **Áp dụng cho 15 file edit theo alphabet**
   - `app/admin/home-components/about/[id]/edit/page.tsx`
   - `app/admin/home-components/career/[id]/edit/page.tsx`
   - `app/admin/home-components/case-study/[id]/edit/page.tsx`
   - `app/admin/home-components/clients/[id]/edit/page.tsx`
   - `app/admin/home-components/contact/[id]/edit/page.tsx`
   - `app/admin/home-components/countdown/[id]/edit/page.tsx`
   - `app/admin/home-components/gallery/[id]/edit/page.tsx`
   - `app/admin/home-components/pricing/[id]/edit/page.tsx`
   - `app/admin/home-components/process/[id]/edit/page.tsx`
   - `app/admin/home-components/services/[id]/edit/page.tsx`
   - `app/admin/home-components/speed-dial/[id]/edit/page.tsx`
   - `app/admin/home-components/team/[id]/edit/page.tsx`
   - `app/admin/home-components/testimonials/[id]/edit/page.tsx`
   - `app/admin/home-components/video/[id]/edit/page.tsx`
   - `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx`

3. **Giữ nguyên các phần đã đúng, chỉ verify lại**
   - Không sửa create pages (đã đạt 30/30).
   - Không sửa renderer (đã đạt parity runtime).
   - Không sửa shared hook/lib trừ khi phát hiện regression blocker.

4. **Contract verification matrix sau khi sửa (bắt buộc pass)**
   - `systemEnabled=true, enabled=false`: panel hiện ở create/edit; preview+site fallback system.
   - `systemEnabled=true, enabled=true`: preview+site dùng custom.
   - `systemEnabled=false`: panel ẩn create/edit; site fallback settings.
   - `single mode`: secondary = primary ở state/payload/render.

5. **Validate & git workflow**
   - Chạy: `bunx --no-install tsc --noEmit`.
   - Stage đúng file thay đổi + `.factory/docs` (nếu có phát sinh).
   - Commit local: `fix(home-components): align features custom colors` (hoặc message tương đương theo scope thực tế).

## Expected outcome sau rollout
- Edit parity strict từ **15/30 -> 30/30**.
- Full parity create + edit + site renderer theo contract 2 cờ cho toàn bộ home-components.
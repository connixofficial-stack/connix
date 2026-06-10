Chuẩn, mình sẽ fix **toàn bộ 30 home-components** (không chỉ Hero) theo đúng yêu cầu của bạn.

## Mục tiêu (áp dụng cho 30 type)
- Nếu DB **chưa có component của type đó** (`count(type)=0`):
  - create vẫn hiển thị panel custom,
  - toggle/card **không bị lock**,
  - state custom mặc định lấy theo màu trong `/admin/settings`.
- Nếu DB **đã có component của type đó** (`count(type)>0`):
  - create dùng custom override hiện có như hiện tại.
- Cả 2 trường hợp đều cho phép user bật/tắt/chỉnh custom và submit lưu override bình thường.

## Kế hoạch kỹ thuật
1) **Hook trung tâm (1 chỗ, áp lực chính)**
- File: `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
- Thêm option cho create context, ví dụ: `seedCustomFromSettingsWhenTypeEmpty?: boolean`.
- Khi option bật, hook query `api.homeComponents.listByType({ type })` để biết type có data chưa.
- Logic state:
  - `hasTypeData=false` => seed `customState` ban đầu từ settings (`mode/primary/secondary`), không khóa enabled toggle.
  - `hasTypeData=true` => giữ behavior hiện tại dựa trên override.
- Giữ nguyên contract `effectiveColors`:
  - `customState.enabled=true` => preview dùng custom,
  - `enabled=false` => fallback settings.
- Tuyệt đối không trả cờ lock/disable UI.

2) **Create wrapper dùng option seed (không lock UI)**
- File: `app/admin/home-components/create/shared.tsx`
- `ComponentFormWrapper` dùng hook với option seed cho create context.
- Không disable `TypeColorOverrideCard`, không thêm thông báo lock.
- Submit create vẫn gọi `setTypeColorOverride` như hiện tại.

3) **Áp dụng đồng bộ cho toàn bộ create pages (30 type)**
- Scope: toàn bộ `app/admin/home-components/create/**` + `create/product-list/_shared.tsx` (shared cho ProductList/ServiceList/Blog).
- Các chỗ gọi `useTypeColorOverrideState(...)` ở create sẽ truyền option seed.
- Không đụng edit pages, không đụng site renderer.

## Danh sách type trong scope (30)
Hero, Stats, Partners, TrustBadges, ProductCategories, ProductList, ProductGrid, CategoryProducts, ServiceList, Blog, Benefits, Features, Services, Process, Testimonials, CaseStudy, Gallery, Clients, CTA, Pricing, VoucherPromotions, Countdown, FAQ, About, Team, Video, Contact, Career, Footer, SpeedDial.

## Verification bắt buộc
A. Với vài type đại diện (Hero, Stats, ProductList(shared), Footer, Video):
- `count(type)=0`: mở create thấy custom card vẫn thao tác được, giá trị custom mặc định khớp settings.
- bật custom/chỉnh màu: preview đổi ngay.
- submit create: override lưu thành công.

B. `count(type)>0`:
- create giữ behavior custom override như trước (không regression).

C. Cross-check 30 type:
- không còn type nào bị lock toggle trong create.

D. Chạy `bunx --no-install tsc --noEmit` pass.

## Git workflow
- Stage đúng file thay đổi + `.factory/docs`.
- Commit local (không push).
- Commit message gợi ý: `fix(home-components): seed create custom from settings for empty types`
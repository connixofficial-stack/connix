## TL;DR kiểu Feynman
- Mình đã soi 10 commit mới nhất ở `system-nhan`, phần lớn đã có sẵn trong dự án hiện tại.
- Có 2 điểm còn thiếu đáng áp dụng: **ưu tiên ảnh hero để cải thiện LCP** và **ổn định màu brand lúc SSR/hydration để tránh flash**.
- Các phần như SEO verification configurable, homepage-category-hero, loading skeleton, metadata alternates đã có parity rồi.
- Kế hoạch là sửa rất hẹp (3–5 file), không mở rộng scope, rollback dễ.

## Audit Summary
- **Observation**
  - `system-nhan` có commit `b9bd5a88` ưu tiên ảnh hero (`priority`) cho path ảnh above-the-fold.
  - `system-nhan` có cặp commit `ec041bac` + `e707ad96` để đồng bộ màu brand giữa server/client (tránh flash màu khi hard refresh).
  - Repo hiện tại đã có sẵn phần lớn các nâng cấp khác:
    - SEO verification lấy từ settings: `app/layout.tsx`, `lib/get-settings.ts`.
    - HomepageCategoryHero runtime: `components/site/HomepageCategoryHeroSection.tsx` + render trong `components/site/ComponentRenderer.tsx`.
    - HomePageLoading đã tồn tại: `components/site/loading/HomePageLoading.tsx`.
- **Inference**
  - Khoảng trống thực tế còn lại tập trung vào **performance cảm nhận đầu trang** và **ổn định brand UX**.
- **Decision**
  - Đề xuất triển khai 2 hạng mục ưu tiên cao, bỏ qua các hạng mục đã parity để tránh scope creep.

## Root Cause Confidence
- **High**
  - Evidence trực tiếp từ code hiện tại:
    - `components/seo/LandingHeroImage.tsx` dùng `next/image` nhưng chưa set `priority/fetchPriority` cho variant `hero`.
    - `components/site/ComponentRenderer.tsx` có nhiều `SiteImage` ở hero styles nhưng chưa có cơ chế đánh dấu slide đầu là priority.
    - `app/layout.tsx` hiện có `BrandColorProvider` client-side nhưng chưa inline CSS vars brand ở SSR để khóa màu ngay first paint.
  - Vì vậy LCP và color flash có khả năng còn tối ưu được mà không đụng business logic.

## Files Impacted
### UI
- **Sửa:** `components/seo/LandingHeroImage.tsx`
  - Vai trò hiện tại: wrapper ảnh hero/card cho các landing pages.
  - Thay đổi: thêm `priority` + `fetchPriority="high"` khi `variant === 'hero'` (giữ `card` như cũ).

- **Sửa:** `components/site/ComponentRenderer.tsx`
  - Vai trò hiện tại: render runtime home-components, bao gồm Hero đa style.
  - Thay đổi: truyền `priority` cho ảnh slide đầu tiên ở các nhánh hero above-the-fold (giới hạn đúng chỗ cần thiết để tránh tranh băng thông).

- **Thêm:** `components/providers/InitialBrandColorsProvider.tsx`
  - Vai trò mới: hydrate giá trị brand ban đầu từ SSR vào client context nhẹ để fallback khi query settings chưa xong.
  - Thay đổi: provider nhỏ, không thay đổi API public hiện có.

- **Sửa:** `components/site/hooks.ts`
  - Vai trò hiện tại: `useBrandColors` đọc màu qua Convex query.
  - Thay đổi: thêm fallback từ initial provider trước khi query resolved, giảm mismatch SSR/CSR.

### Server/Layout
- **Sửa:** `app/layout.tsx`
  - Vai trò hiện tại: root layout + metadata verification.
  - Thay đổi: lấy site settings ở server để inline CSS vars (`--site-brand-primary`, `--site-brand-secondary`) trên `<html>` và bọc `InitialBrandColorsProvider` với giá trị ban đầu.

## Execution Preview
1. Đọc/chỉnh `LandingHeroImage.tsx` để bật priority có điều kiện cho hero.
2. Đọc/chỉnh `ComponentRenderer.tsx` để đánh dấu đúng ảnh hero LCP candidate (slide đầu / ảnh đầu vùng above-the-fold).
3. Thêm `InitialBrandColorsProvider.tsx`.
4. Chỉnh `hooks.ts` để dùng initial fallback (không đổi contract hook hiện tại).
5. Chỉnh `app/layout.tsx` để cấp initial brand từ server + inline CSS vars.
6. Static self-review: typing/null-safety/khả năng tương thích settings cũ (`site_brand_color` legacy).

## Acceptance Criteria
- Với các route dùng `LandingHeroImage` variant `hero`, ảnh hero được Next đánh dấu ưu tiên tải.
- Không làm đổi hành vi ảnh card thường.
- Hard refresh trên site không còn hiện tượng nháy màu brand rõ rệt trước khi hydration xong.
- `useBrandColors` vẫn tương thích mode `single/dual` và fallback legacy key.
- Không thay đổi business logic home components ngoài phần ảnh ưu tiên + brand hydration.

## Verification Plan
- **Typecheck:** không chạy theo guideline repo (tester phụ trách runtime/integration).
- **Static review bắt buộc trước bàn giao:**
  - Kiểm tra prop `priority/fetchPriority` không truyền sai type.
  - Rà nhánh hero style để không ưu tiên quá nhiều ảnh cùng lúc.
  - Rà fallback settings khi thiếu `site_brand_secondary` hoặc mode `single`.
- **Repro thủ công (đề xuất cho tester):**
  1) Mở route có hero ảnh lớn, hard refresh, quan sát waterfall/LCP candidate.
  2) Hard refresh nhiều lần ở theme có brand custom, quan sát color flash trước/sau.

## Out of Scope
- Không port toàn bộ commit sync lớn từ `system-nhan`.
- Không thay đổi UI layout/SEO flows đã parity.
- Không chỉnh docs/readme.

## Risk / Rollback
- **Rủi ro:** nếu đánh dấu quá nhiều ảnh `priority`, có thể tăng cạnh tranh băng thông đầu trang.
- **Giảm thiểu:** chỉ ưu tiên ảnh hero đầu tiên/candidate rõ ràng.
- **Rollback:** revert 1 commit cho 5 file trên là quay lại trạng thái cũ.

Nếu bạn duyệt spec này, mình sẽ triển khai đúng theo thứ tự trên và giữ phạm vi hẹp.
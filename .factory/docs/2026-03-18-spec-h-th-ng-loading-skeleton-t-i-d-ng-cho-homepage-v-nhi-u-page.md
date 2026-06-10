## Audit Summary
- Observation: Homepage hiện SSR lấy `initialComponents` ở `app/(site)/page.tsx`, sau đó `HomePageClient` chỉ fallback về spinner toàn trang khi `resolvedComponents === undefined` (`app/(site)/_components/HomePageClient.tsx`). Vì đã có SSR data, spinner này gần như không giải quyết nhu cầu “đợi đủ component nhìn thấy mới show ra”.
- Observation: `ComponentRenderer` và nhiều section bên trong còn gọi thêm `useQuery(...)` ở client (`components/site/ComponentRenderer.tsx`), nên trang có thể hiện shell trước rồi từng phần nhảy nội dung sau.
- Observation: `/system/experiences` đang là nơi quản UI/UX cho các surface người dùng như posts/products/cart/menu..., tức đúng pattern cho cấu hình behavior theo page/surface (`app/system/experiences/_constants.ts`).
- Observation: User đã chọn `Tái dùng nhiều page` + `Skeleton theo section`.
- Web evidence 2024-2026: skeleton screen là pattern phổ biến hơn spinner cho content-heavy SaaS/enterprise; branded logo loader chỉ phù hợp bootstrap rất ngắn; spinner thuần bị đánh giá UX yếu hơn cho trang nội dung. Nguồn nổi bật: NN/g Skeleton Screens 2024, LogRocket 2025, GitLab Pajamas Skeleton Loader, OpenReplay comparison.

## Root Cause Confidence
**High** — Vấn đề không nằm ở thiếu một spinner mới, mà ở chỗ hệ thống hiện chưa có “loading contract” tái dùng cho route/page/section. `loading.tsx` chỉ cover lúc route segment đang tải; còn dữ liệu client-side trong các section vẫn cần skeleton riêng. Nếu chỉ thêm logo spinner toàn trang thì sẽ không khớp nhu cầu “chỉ show khi các component nhìn thấy đã đủ khung”.

## Đề xuất
### Option A - Loading Experience dùng chung (Recommend)
Confidence 88%.

Tạo **experience mới trong `/system/experiences` tên kiểu `loading-states`** để quản loading cho nhiều page, nhưng scope config sẽ là:
1. **Global defaults**
   - `strategy`: `section-skeleton` | `page-skeleton` | `logo-loader` | `mixed`
   - `revealMode`: `when-above-the-fold-ready` | `stream-immediately`
   - `showBrandLogo`: boolean
   - `animation`: shimmer | pulse | none
   - `minDisplayMs` / `delayMs` để tránh flash
2. **Per-surface overrides**
   - homepage
   - products-list
   - posts-list
   - services-list
   - product-detail
   - posts-detail
3. **Section skeleton registry cho homepage**
   - map `Hero`, `Stats`, `About`, `Services`, `Blog`, `ProductList`... sang skeleton component tương ứng
   - fallback skeleton generic nếu type chưa có skeleton riêng

### Vì sao recommend
- Khớp pattern repo: behavior theo surface đang nằm ở `/system/experiences`.
- Đúng nhu cầu user: tái dùng nhiều page, không chỉ homepage.
- Tránh over-engineer hơn so với tạo module mới riêng cho loading.
- Cho phép rollout dần: trước hết homepage + list pages, sau đó mở rộng detail pages.

### Option B - Module setting riêng từng page
Confidence 64%.

Thêm loading settings vào từng module/experience hiện có (homepage, posts list, products list...). Cách này ít tạo route mới, nhưng sẽ bị:
- lặp config ở nhiều nơi,
- khó giữ consistency giữa các page,
- khó có default/fallback chung.

Phù hợp khi anh muốn mỗi page hoàn toàn độc lập và không cần design language loading thống nhất.

## Scope triển khai nếu chọn Option A
1. **Tạo experience mới**
   - `app/system/experiences/loading-states/page.tsx`
   - thêm entry vào `app/system/experiences/_constants.ts`
   - thêm key/name/color vào `lib/experiences/constants.ts`
2. **Định nghĩa schema config loading dùng chung**
   - tạo thư mục mới kiểu `lib/experiences/loading-states/`
   - gồm `types.ts`, `defaults.ts`, `normalize.ts`
   - config có global + overrides theo page key
3. **Tạo shared loading UI runtime**
   - `components/site/loading/` hoặc `components/site/_loading/`
   - `PageSkeletonShell`
   - `SectionSkeletonRenderer`
   - skeleton riêng cho các loại section homepage phổ biến: Hero, Stats, About, Services, Blog/Product list
4. **Áp dụng cho homepage trước**
   - refactor `app/(site)/_components/HomePageClient.tsx`
   - thay spinner toàn trang bằng logic:
     - đọc loading config
     - render skeleton shell cho các component above-the-fold
     - chỉ reveal phần thật khi đủ dữ liệu cho vùng nhìn thấy
   - không chặn toàn bộ page vô thời hạn; phần dưới fold có thể stream/lazy sau
5. **Áp dụng dần cho các page khác**
   - list pages dùng skeleton theo layout card/list/filter bar
   - detail pages dùng hero/content/sidebar skeleton
6. **Guardrails**
   - Không dùng spinner thuần cho content page dài
   - Logo loader chỉ là lớp rất ngắn trước khi skeleton hiện, không thay skeleton
   - Có generic fallback để type mới không bị trắng trang

## Thiết kế UX nên theo
- Homepage/doanh nghiệp: ưu tiên **skeleton theo section** cho vùng first viewport.
- Nếu cần branding: dùng **logo loader rất ngắn (150–400ms)** trước skeleton, không dùng kéo dài.
- Với list/detail pages: skeleton nên mô phỏng layout thật, tránh spinner giữa trang.
- Reveal theo block lớn, không bật từng item lẻ gây nhấp nháy.

## Counter-hypothesis
- Giả thuyết thay thế: chỉ cần `app/(site)/loading.tsx` là đủ.
- Kết luận: **không đủ** vì route loading không cover các `useQuery` client-side sâu trong `ComponentRenderer` và section runtime.

## File-level plan chi tiết
- `app/system/experiences/_constants.ts`
  - thêm card “Loading States”.
- `lib/experiences/constants.ts`
  - thêm `loading_states_ui` vào union, color, name.
- `app/system/experiences/loading-states/page.tsx`
  - UI cấu hình global strategy + per-page overrides.
- `lib/experiences/loading-states/*`
  - type/default/normalize helpers.
- `app/(site)/_components/HomePageClient.tsx`
  - thay fallback spinner bằng page/section skeleton orchestration.
- `components/site/loading/*`
  - shared skeleton components và registry theo section/page.
- Có thể cần đọc config ở runtime qua Convex/system config theo pattern experience hiện có.

## Verification Plan
- Repro cần đạt sau khi làm:
  1. Vào homepage chậm mạng: thấy skeleton theo section thay vì spinner trắng giữa trang.
  2. Vùng above-the-fold chỉ reveal khi đủ khung chính.
  3. Section chưa có skeleton riêng vẫn có generic skeleton, không trắng trang.
  4. Có thể tái dùng cùng config cho ít nhất 1 page khác ngoài homepage.
- Static verification sau khi code xong:
  - tự review typing/null-safety/fallback cũ mới
  - kiểm tra không làm vỡ path hiện có trong `/system/experiences`
  - nếu có thay đổi TS code thì chạy `bunx tsc --noEmit` theo guideline repo

Nếu anh duyệt, em đề xuất đi theo **Option A**: tạo experience `Loading States` dùng chung, rồi rollout phase 1 cho homepage trước.
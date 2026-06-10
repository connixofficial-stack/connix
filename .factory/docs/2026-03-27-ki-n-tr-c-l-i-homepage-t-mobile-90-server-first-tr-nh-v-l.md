## TL;DR kiểu Feynman
- Điểm mobile vẫn thấp vì homepage đang hydrate quá nhiều JS ngay lúc vào trang.
- Gốc vấn đề là kiến trúc: `HomePageClient` + `ComponentRenderer` monolith + provider phạm vi rộng + font global quá nặng.
- Vá từng file sẽ tiếp tục “rách việc”; cần chuyển sang kiến trúc **server-first + client islands**.
- Mục tiêu vòng này: refactor có lộ trình, rollback được theo phase, giữ UI y nguyên, target **Mobile >= 90**.

## Audit Summary
### Observation
1. `app/(site)/page.tsx` đang server-fetch `homeComponents` nhưng render qua `HomePageClient` (client entry lớn).  
2. `components/site/ComponentRenderer.tsx` là file rất lớn (monolith), import rất rộng từ `app/admin/home-components/**` và chứa nhiều nhánh UI/logic runtime.  
3. `components/site/SiteShell.tsx` + `SiteProviders.tsx` vẫn tạo client runtime khá rộng cho toàn homepage (auth/cart/toaster path).  
4. `app/layout.tsx` đang nạp nhiều font families toàn cục (11 font), tăng cost khởi tạo mobile.  
5. Header vẫn là client component nặng logic/query dù đã có prefetch một phần.

### Inference
- Nút thắt hiện tại không còn là “chỉnh vài timeout/defer”, mà là **bundle boundary sai** và **RSC/client split chưa tối ưu**.
- Muốn lên >=90 bền vững phải giảm JS parse/execute ban đầu bằng cách đổi kiến trúc render, không chỉ patch local.

## Root Cause Confidence
- **High:** `ComponentRenderer` monolith client là nguồn bundle/hydration cost chính.  
- **High:** Homepage render path còn client-heavy thay vì server-first.  
- **Medium-High:** Provider + Header interactive phạm vi rộng làm main-thread cạnh tranh tài nguyên trên mobile.  
- **Medium:** Font global quá nhiều làm nặng startup, đặc biệt mobile chậm.

## Problem Graph
1. [Main] Mobile homepage thấp, khó vượt 90
   1.1 [ROOT CAUSE] Monolith renderer client (`ComponentRenderer`) + import chéo admin/site
   1.2 [ROOT CAUSE] Trang chủ đi qua `HomePageClient` cho phần lớn nội dung
   1.3 [Sub] Provider/runtime interactive mounted rộng ở shell
   1.4 [Sub] Font global load quá nhiều ở root layout

## Target Architecture (đích)
1. **Server-first Homepage:** homepage render phần tĩnh/above-fold bằng Server Components.  
2. **Client Islands:** chỉ hydrate phần thật sự tương tác (slider/search/cart overlay...).  
3. **Renderer theo registry:** tách `ComponentRenderer` thành module theo type (không monolith).  
4. **Tách shared runtime khỏi admin path:** site không import trực tiếp sâu từ `app/admin/**`.  
5. **Provider boundary hẹp:** commerce/auth/cart chỉ mount nơi cần, không ép toàn homepage.  
6. **Font strategy tối giản:** giảm root fonts xuống bộ cần thiết cho public homepage.

## Files Impacted
### Nhóm Homepage rendering
- **Sửa:** `app/(site)/page.tsx`  
  Vai trò hiện tại: fetch server nhưng chuyển ngay vào client wrapper.  
  Thay đổi: chuyển sang entry server-first, chỉ bọc client islands khi cần.

- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: điều phối render phần lớn homepage bằng client.  
  Thay đổi: thu nhỏ trách nhiệm thành island orchestrator (không render toàn bộ content path).

- **Sửa lớn/tách:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: monolith renderer cho mọi type.  
  Thay đổi: tách registry + modules theo type để chia bundle và giảm hydrate cost.

- **Thêm:** `components/site/home/registry.ts`, `components/site/home/types.ts`  
  Vai trò mới: ánh xạ type -> renderer phù hợp (server/client).

- **Thêm:** `components/site/home/components/*`  
  Vai trò mới: mỗi component type là module độc lập, dễ lazy/island.

### Nhóm Shell / Provider
- **Sửa:** `components/site/SiteShell.tsx`  
  Vai trò hiện tại: shell client-centric.  
  Thay đổi: tách rõ shell và interactive islands, giữ boundary provider an toàn.

- **Sửa:** `components/site/SiteProviders.tsx`  
  Vai trò hiện tại: gộp customer auth + cart + toaster cho toàn shell.  
  Thay đổi: tách base providers và commerce providers theo nhu cầu route/interaction.

- **Sửa/tách:** `components/site/Header.tsx`  
  Vai trò hiện tại: header client nặng.  
  Thay đổi: split `HeaderShell` (SSR/static) + `HeaderInteractive` (client island).

### Nhóm Root startup
- **Sửa:** `app/layout.tsx`  
  Vai trò hiện tại: nạp nhiều fonts global.  
  Thay đổi: tối giản fonts cho public runtime, defer phần không cần.

## Execution Preview
### Phase 1 (An toàn, ROI cao)
1. Dựng `home/registry` + tách `ComponentRenderer` theo module type (chưa đổi UI).  
2. Chuyển homepage sang server-first cho top content, giữ interactive bằng client islands.  
3. Đảm bảo không import chéo nặng từ `app/admin/**` trong runtime site path.

### Phase 2 (Giảm runtime shell)
4. Tách provider boundary (`BaseProviders` vs `CommerceProviders`).  
5. Split Header: static shell SSR + interactive island.

### Phase 3 (Startup polish)
6. Giảm font global ở root layout, chỉ giữ tập cần thiết cho homepage.  
7. Rà lại deferred/lazy cho các section nặng dưới fold.

### Phase 4 (Hardening)
8. Static review type/null-safety + chống regression wiring.  
9. `bunx tsc --noEmit` trước commit.

## Acceptance Criteria
- Mobile homepage đạt **>= 90** (theo mục tiêu bạn chốt).  
- UI/UX nhìn thấy không đổi so với hiện tại.  
- Không còn lỗi runtime do boundary context/provider.  
- Kiến trúc render rõ ràng: server-first + islands, tránh monolith renderer.  
- Các phase rollback độc lập được.

## Verification Plan
1. So sánh PSI mobile sau từng phase (không dồn một cục).  
2. Theo dõi giảm JS initial / long tasks / TBT/INP trong report.  
3. Soát parity UI homepage desktop/mobile.  
4. Chạy `bunx tsc --noEmit` sau mỗi phase có đổi TS.

## Out of Scope
- Không redesign giao diện.  
- Không thay đổi business logic modules/cart/auth.  
- Không tối ưu toàn hệ thống ngoài phạm vi homepage + shared shell liên quan trực tiếp.

## Risk / Rollback
- **Risk:** refactor kiến trúc rộng hơn patch lẻ, có thể phát sinh mismatch nếu split sai boundary server/client.  
- **Giảm rủi ro:** triển khai theo phase nhỏ, mỗi phase 1 commit độc lập.  
- **Rollback:** revert từng phase nếu metric/regression không đạt.

## Đề xuất chốt
Tôi sẽ triển khai theo đúng roadmap phase 1 -> 4, ưu tiên thiết kế kiến trúc bền vững để đạt mobile >= 90 thay vì tiếp tục vá lẻ từng điểm.
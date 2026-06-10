## TL;DR kiểu Feynman
- Với homepage, thứ user nhìn thấy đầu tiên phải được tải trước; phần còn lại tải sau. Đây là chiến lược đúng nhất khi nguồn lực có hạn.
- Dự án hiện đang làm ngược ở vài điểm: ảnh đầu trang chưa tối ưu, JS client quá nặng, và layout/public shell fetch quá nhiều ngay từ đầu.
- Muốn mobile + desktop đều >90 mà không đổi UI, nên tối ưu theo 3 mũi song song: LCP image, JS/hydration, cache/TTFB.
- Các tài liệu Next.js, Vercel và Google đều đồng ý cùng một hướng: server-first, ưu tiên above-the-fold, lazy-load below-the-fold, giảm client JS, tối ưu ảnh LCP, và giảm blocking work.
- Kế hoạch dưới đây ưu tiên ROI trước, giữ nguyên giao diện, rollback nhỏ, và có đường đi nếu nguồn lực bị giới hạn giữa chừng.

## Audit Summary
### 1) Observation
Từ codebase hiện tại và 2 ảnh PSI:
- Mobile khoảng 59, desktop khoảng 78; nghĩa là mobile đang bị phạt mạnh bởi CPU/network/JS, desktop đỡ hơn nhưng vẫn chưa qua ngưỡng tốt.
- Homepage render bằng `HomePageClient` và vẫn `useQuery` runtime cho `homeComponents.listActive` dù server đã có `initialComponents`:
  - `app/(site)/page.tsx`
  - `app/(site)/_components/HomePageClient.tsx`
- `ComponentRenderer` là client component rất lớn, import nhiều module admin/home-components trong cùng một entry và có thêm query runtime:
  - `components/site/ComponentRenderer.tsx`
- Ảnh vùng đầu trang đang dùng `unoptimized` ở các đường render có khả năng thành LCP:
  - `components/site/ComponentRenderer.tsx`
  - `components/site/HomepageCategoryHeroSection.tsx`
- Root layout đang ép dynamic toàn cục:
  - `app/layout.tsx:103` với `export const dynamic = "force-dynamic"`
- Public site layout fetch nhiều dữ liệu cho shell/header mỗi request và luôn render telemetry:
  - `app/(site)/layout.tsx`
- Header client gọi nhiều `useQuery` cho menu, settings, modules, features:
  - `components/site/Header.tsx:163-174`
- Root layout load nhiều font families cùng lúc:
  - `app/layout.tsx`

### 2) Root Cause Confidence
- **High**: Ảnh LCP/top-fold chưa tối ưu là nguyên nhân lớn nhất cho LCP.
- **High**: Client bundle/hydration lớn từ homepage renderer là nguyên nhân lớn cho mobile score.
- **Medium-High**: `force-dynamic` + query tại layout/header làm TTFB và waterfall xấu hơn.
- **Medium**: Fonts và telemetry góp phần làm nặng initial load, nhưng không phải root cause số 1.

### 3) Verification Plan
- So sánh PSI mobile/desktop sau từng phase P0/P1.
- Đối chiếu LCP element trước/sau.
- Kiểm tra waterfall: request ảnh hero, JS chunk homepage, query shell/header.
- Kiểm tra tĩnh: type safety, null safety, parity UI homepage.

---

## Root cause protocol (8 câu)
1. **Triệu chứng là gì?**  
   Expected: homepage >90 mobile và desktop.  
   Actual: mobile ~59, desktop ~78; dấu hiệu rõ của LCP cao + JS nặng + initial render tốn tài nguyên.

2. **Phạm vi ảnh hưởng?**  
   Homepage public là trọng tâm. Có phụ thuộc shared shell/header, nhưng không mở rộng sang các route khác trong spec này.

3. **Có tái hiện ổn định không?**  
   Có. User cung cấp 2 ảnh PSI thực tế của homepage cho mobile/desktop.

4. **Mốc thay đổi gần nhất?**  
   Chưa có đủ evidence để chỉ ra 1 commit regression duy nhất trong phiên này. Tuy nhiên code hiện tại cho thấy nhiều pattern có chi phí cao tồn tại đồng thời.

5. **Dữ liệu nào còn thiếu?**  
   PSI JSON đầy đủ, trace chi tiết, LCP candidate chính xác, transfer size/chunk map per route.

6. **Giả thuyết thay thế chưa loại trừ?**  
   Có: backend latency Convex đơn lẻ, script 3rd-party, hoặc network variability. Nhưng chưa đủ mạnh để thay 3 root cause chính vì code evidence đang trực tiếp hơn.

7. **Rủi ro nếu fix sai nguyên nhân?**  
   Refactor lớn nhưng điểm tăng ít; nguy cơ đụng parity preview/site; mất thời gian vào P2 trong khi P0 còn chưa giải quyết.

8. **Tiêu chí pass/fail?**  
   Mobile >= 90, desktop >= 90; UI homepage giữ nguyên; không mất tính năng chính; above-the-fold nhanh hơn rõ rệt; JS initial giảm; LCP cải thiện rõ.

---

## Nghiên cứu tổng hợp: Next.js / Vercel / Google đang khuyên gì
### Nguồn tham chiếu đã tổng hợp
1. **Next.js docs – Optimizing / Images / Lazy Loading / Production performance**
   - Next.js nhấn mạnh: dùng `next/image`, ưu tiên ảnh above-the-fold bằng `priority`, `sizes`, tránh gửi JS không cần thiết, và lazy-load client code khi hợp lý.
   - Tư tưởng chính: **Server Components mặc định, Client Components chỉ khi thực sự cần tương tác**.

2. **Vercel guides – Core Web Vitals / RSC payload / image bandwidth / document size**
   - Vercel nhấn mạnh: giảm JS gửi xuống client, tối ưu RSC payload, chỉ truyền props tối thiểu, giảm document size và lazy-load những phần không cần cho first paint.
   - Với ảnh: tối ưu theo kích thước thực tế, tránh ảnh vượt nhu cầu viewport.

3. **Google web.dev – Optimize LCP / Lazy loading best practices / Fetch Priority**
   - Google nhấn mạnh: xác định đúng LCP element, tải nó sớm nhất, không lazy-load LCP image, giảm resource contention, dùng `fetchpriority=high`/ưu tiên đúng resource, lazy-load phần dưới fold.
   - Không nên để tài nguyên dưới fold cạnh tranh với tài nguyên top-fold.

### Điểm đồng thuận giữa 3 bên
- Ưu tiên **above-the-fold first**.
- Giảm **client JS/hydration**.
- Tối ưu **LCP image** đúng cách.
- Chuyển phần không cần tương tác sang **server-first**.
- **Lazy-load** mọi thứ dưới fold hoặc không critical.
- Tối ưu **cache/TTFB** để HTML và dữ liệu đến sớm.

### Suy ra cho dự án này
Với homepage của repo này, chiến lược mạnh nhất là:
1. Cố định vùng top-fold như một “critical path” riêng.
2. Chỉ cho vùng này quyền ưu tiên tải cao.
3. Phần dưới fold dùng lazy boundary hoặc dynamic section loading.
4. Giảm query và client state ở shared shell/header lúc first load.
5. Giữ nguyên UI bằng cách thay rendering strategy, không đổi cấu trúc nhìn thấy.

---

## Problem Graph
1. [Main] Homepage PSI thấp hơn mục tiêu 90/90
   1.1 [LCP path nặng] <- depends on 1.1.1, 1.1.2
      1.1.1 [ROOT CAUSE] Ảnh hero/top-fold `unoptimized`
      1.1.2 Background/slider image delivery đang cạnh tranh băng thông
   1.2 [JS path nặng] <- depends on 1.2.1, 1.2.2, 1.2.3
      1.2.1 [ROOT CAUSE] Homepage render qua client entry lớn
      1.2.2 [ROOT CAUSE] `ComponentRenderer` monolithic import quá rộng
      1.2.3 [ROOT CAUSE] Header + section runtime `useQuery` nhiều
   1.3 [TTFB/data path nặng] <- depends on 1.3.1, 1.3.2
      1.3.1 [ROOT CAUSE] `force-dynamic` ở root layout
      1.3.2 Public shell fetch nhiều dữ liệu trên request path
   1.4 [Secondary overhead]
      1.4.1 Quá nhiều fonts global
      1.4.2 Analytics/SpeedInsights nằm trong initial path

---

## Chiến lược tối ưu mạnh, theo triết lý “khách lăn tới đâu tối ưu tới đó”
### Nguyên tắc vận hành
- **Những gì user nhìn thấy ngay**: render trước, ưu tiên cao nhất.
- **Những gì user có thể nhìn thấy sau 1–3 giây**: tách khỏi critical path.
- **Những gì user chưa chắc dùng**: tải sau hoặc chỉ tải khi cần.
- **Không đổi UI**: chỉ thay kiến trúc render/load order/cache.

### Chia homepage thành 3 vòng ưu tiên
#### Vòng A – Critical path (phải tối ưu trước)
Bao gồm:
- Header phần nhìn thấy ngay
- Hero/banner đầu trang
- Nội dung text/call-to-action đầu tiên
- Logo/menu cần thiết để user tin tưởng và bắt đầu tương tác

Mục tiêu:
- HTML tới nhanh
- Hero image tới sớm
- JS tối thiểu
- Không re-query vô ích

#### Vòng B – Near-fold path
Bao gồm:
- Các section ngay dưới hero mà có thể xuất hiện khi scroll nhẹ
- Các widget trang chủ có giá trị nhưng không phải LCP

Mục tiêu:
- Render muộn hơn A
- Có thể stream/lazy/dynamic section-by-section

#### Vòng C – Below-fold / optional path
Bao gồm:
- Gallery, partners, testimonial carousel, section nặng tương tác, các khối không cần cho first impression

Mục tiêu:
- Chỉ tải khi cần
- Hoặc hydration muộn

---

## Kế hoạch triển khai chi tiết hơn, sâu hơn
## P0 — Làm đồng thời cả 3 hướng, ROI cao nhất
### P0.1 — Cắt chi phí LCP image
**Mục tiêu:** làm hero/top-fold xuất hiện nhanh nhất mà không đổi UI.

**Sửa:** `components/site/ComponentRenderer.tsx`  
**Sửa:** `components/site/HomepageCategoryHeroSection.tsx`

**Hướng kỹ thuật:**
- Bỏ `unoptimized` cho ảnh top-fold thực sự là critical.
- Thêm `priority` chỉ cho đúng ảnh LCP đầu tiên, không lạm dụng cho toàn bộ slider.
- Thêm `sizes` chính xác theo viewport để tránh tải file lớn hơn nhu cầu.
- Nếu cùng một component có nhiều slide, chỉ slide đầu tiên được ưu tiên cao; slide còn lại tải bình thường/lazy hơn.
- Với ảnh nền blur/backdrop: tránh để cùng lúc cạnh tranh với ảnh chính; cân nhắc giảm độ nặng hoặc đổi chiến lược fallback visual nhưng vẫn giữ UI nhìn tương đương.

**Tại sao ROI cao:**
- Đây là phần Google đo trực tiếp cho LCP.
- Fix đúng ảnh đầu tiên thường là đường tăng điểm nhanh nhất.

**Guardrail giữ UI:**
- Không đổi bố cục, không đổi tỉ lệ khung, không đổi content.
- Chỉ thay đường tải ảnh và độ ưu tiên tải.

### P0.2 — Tối ưu JS/hydration theo hướng homepage-first
**Mục tiêu:** homepage không hydrate cả “nhà máy component” ngay lúc mở trang.

**Sửa:** `app/(site)/_components/HomePageClient.tsx`  
**Sửa:** `app/(site)/page.tsx`  
**Sửa:** `components/site/ComponentRenderer.tsx`

**Hướng kỹ thuật:**
- Tránh query lại `homeComponents.listActive` ở client nếu server đã có dữ liệu đủ để render lần đầu.
- Chuyển phần homepage tĩnh/ít tương tác sang server-first nhiều hơn.
- Tách renderer theo section type hoặc nhóm type để homepage không import toàn bộ runtime sections ngay initial load.
- Những section dưới fold hoặc ít quan trọng có thể dynamic import/lazy load.
- Chỉ hydrate section nào thực sự có interaction cần thiết ở first view.

**Tại sao ROI cao:**
- Mobile bị phạt mạnh bởi JS parse/execute/hydrate.
- Cắt bundle initial thường cải thiện đồng thời FCP/LCP/TBT/INP.

**Guardrail giữ UI:**
- Output DOM và visual vẫn giữ nguyên.
- Chỉ thay nơi render (server/client) và thời điểm tải JS.

### P0.3 — Tối ưu cache/TTFB cho homepage public
**Mục tiêu:** HTML và shell đến sớm hơn, ít chờ server hơn.

**Sửa:** `app/layout.tsx`  
**Sửa:** `app/(site)/layout.tsx`  
**Sửa (nếu cần):** `components/site/Header.tsx`

**Hướng kỹ thuật:**
- Rà lại `force-dynamic` để không ép dynamic toàn root nếu homepage public có thể cache/an toàn hơn.
- Phân loại dữ liệu nào thật sự cần fresh mỗi request, dữ liệu nào có thể cache/revalidate.
- Tận dụng initial header data thay vì để header tự query quá nhiều khi mount.
- Nếu module/status/features không cần ảnh hưởng đến first paint, đẩy ra khỏi critical path.

**Tại sao ROI cao:**
- TTFB tốt hơn giúp tất cả chuỗi render nhanh hơn.
- Above-the-fold có HTML sớm hơn, ảnh/JS cũng được start sớm hơn.

**Guardrail giữ UI:**
- Không đổi dữ liệu hiển thị ra ngoài trừ khi có độ trễ revalidate chấp nhận được.
- Ưu tiên cache public-safe, không đụng dữ liệu nhạy cảm.

---

## P1 — Tối ưu bổ sung khi P0 xong
### P1.1 — Giảm global font cost
**Sửa:** `app/layout.tsx`
- Giảm số font families gắn toàn cục; chỉ giữ font thực sự dùng trên homepage public.
- Font ít dùng đưa về scope hẹp hơn hoặc chỉ load ở route cần.

**Vì sao sau P0:**
- Có lợi nhưng thường không bằng 3 mũi chính.

### P1.2 — Giảm query fan-out ở header
**Sửa:** `components/site/Header.tsx`
- Gom/giảm `useQuery` runtime cho header.
- Tận dụng `initialData` triệt để hơn cho first paint.
- Các module flags ít thay đổi có thể không cần query tức thời ở mount.

### P1.3 — Defer telemetry khỏi initial path nếu phù hợp
**Sửa:** `app/layout.tsx`, `app/(site)/layout.tsx`
- Xem lại chiến lược mount `Analytics` / `SpeedInsights` để giữ đo lường nhưng không cạnh tranh critical path nhiều hơn cần thiết.

---

## P2 — Tối ưu sâu hơn nếu vẫn chưa qua 90
### P2.1 — Section-level streaming / progressive reveal
- Nhóm section theo thứ tự hiển thị thực tế.
- Section dưới fold render sau hoặc stream sau.

### P2.2 — Tối ưu payload dữ liệu homepage
- Chỉ truyền field cần để render homepage.
- Tránh đưa config/object lớn không cần cho first paint.

### P2.3 — Chuyên biệt top-fold shell cho homepage
- Nếu cần, homepage có thể có “lite header path” trong first render rồi nâng cấp dần, nhưng vẫn giữ UI y hệt.

---

## Nếu nguồn lực bị giới hạn: ưu tiên gì trước, gì sau
### Option A (Recommend) — ROI cao nhất trong ít effort nhất
1. Ảnh LCP/top-fold
2. Giảm re-query homepage client
3. Giảm `ComponentRenderer` initial bundle
4. Xử lý `force-dynamic` / cache public shell
5. Fonts/telemetry

**Confidence 90%** vì bám sát PSI symptoms và code evidence hiện tại.

### Option B — Khi có thể mạnh tay về kiến trúc
1. Server-first homepage
2. Renderer phân lớp critical vs deferred
3. Header/query cache refactor
4. Image fine-tuning
5. Fonts/telemetry

**Confidence 78%** vì tiềm năng lớn hơn nhưng effort/risk cao hơn.

### Recommendation
Chọn thực thi theo **Option A nhưng làm đồng thời 3 mũi P0** như bạn yêu cầu: ảnh + JS/hydration + cache/TTFB.  
Lý do: đây là điểm cân bằng tốt nhất giữa tốc độ tăng điểm, rủi ro rollback, và giữ nguyên UI.

---

## Files Impacted
### Homepage critical path
- **Sửa:** `app/(site)/page.tsx`  
  Vai trò hiện tại: server entry của homepage, lấy `initialComponents`.  
  Thay đổi: làm rõ ranh giới server-first cho first render và giảm phụ thuộc client re-query.

- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: client render homepage + loading logic + query runtime.  
  Thay đổi: giảm query/hydration ở first load, giữ nguyên UI output.

- **Sửa:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: client renderer monolithic cho toàn bộ home components, chứa `SiteImage`.  
  Thay đổi: tối ưu image path, giảm initial imports, phân tách critical/deferred sections.

- **Sửa:** `components/site/HomepageCategoryHeroSection.tsx`  
  Vai trò hiện tại: hero đầu trang kiểu category + banner slider.  
  Thay đổi: tối ưu ảnh hero/banner/category cho LCP và bandwidth.

### Shared shell / layout
- **Sửa:** `app/layout.tsx`  
  Vai trò hiện tại: root layout, dynamic mode, font loading, analytics.  
  Thay đổi: giới hạn dynamic scope, giảm global font cost, xem lại telemetry load order.

- **Sửa:** `app/(site)/layout.tsx`  
  Vai trò hiện tại: site shell layout, header data, menu/settings query, SpeedInsights.  
  Thay đổi: giảm request-path work cho homepage, tối ưu cache/revalidate strategy.

- **Sửa:** `components/site/Header.tsx`  
  Vai trò hiện tại: header client nhiều `useQuery`.  
  Thay đổi: giảm fan-out query trên first paint, tận dụng initial data.

---

## Execution (with reflection)
1. Solving 1.1.1 (ảnh LCP)
   - Thought: điểm tăng nhanh nhất thường đến từ hero image.
   - Action: audit và đổi chiến lược image delivery cho top-fold trước.
   - Reflection: kỳ vọng valid cao vì evidence trực tiếp.

2. Solving 1.2.1 + 1.2.2 (JS/hydration)
   - Thought: mobile đang thua nặng, nên phải giảm client work.
   - Action: tách critical renderer khỏi deferred renderer; giảm re-query client.
   - Reflection: valid nếu JS initial/chunk homepage giảm rõ.

3. Solving 1.3.1 + 1.3.2 (TTFB/cache)
   - Thought: HTML đến sớm hơn sẽ giúp toàn chuỗi tài nguyên khởi động sớm.
   - Action: rà lại dynamic/cache/layout fetch strategy cho homepage public.
   - Reflection: valid nếu server response và waterfall khởi động tốt hơn.

4. Solving 1.4.x (fonts/telemetry)
   - Thought: đây là phần cộng dồn; làm sau để tối đa ROI.
   - Action: scope nhỏ hơn, load muộn hơn.
   - Reflection: nên làm sau P0 để tránh nhiễu đo lường.

---

## Acceptance Criteria
- Homepage mobile PSI >= 90.
- Homepage desktop PSI >= 90.
- Không thay đổi bố cục UI nhìn thấy.
- Không làm mất functionality header/menu/hero/home sections.
- First render cho top-fold nhanh hơn rõ, LCP giảm, JS initial giảm.

## Out of Scope
- Không tối ưu route public khác ngoài homepage.
- Không redesign UI, không thay microcopy, không đổi behavior business.
- Không tối ưu admin/system trong phase này.

## Risk / Rollback
- **Risk lớn nhất:** refactor renderer/server-client boundary có thể ảnh hưởng parity preview/site.
- **Giảm rủi ro:** đi theo commit nhỏ, ưu tiên P0.1 rồi P0.2 rồi P0.3; mỗi bước giữ nguyên output UI.
- **Rollback:** nếu issue phát sinh, rollback theo từng phase độc lập; thay đổi ảnh/caching có thể tách riêng khỏi refactor renderer.

## Đề xuất chốt
Nếu bạn duyệt spec này, tôi sẽ triển khai theo thứ tự:
1. P0.1 ảnh top-fold
2. P0.2 JS/hydration homepage
3. P0.3 cache/TTFB homepage shell
4. P1 fonts/header/telemetry nếu còn thiếu điểm

Đây là đường đi mạnh tay nhưng vẫn kiểm soát được rủi ro, đúng với yêu cầu: tối ưu nơi khách chạm trước, phần còn lại tải sau, và tránh đổi UI.
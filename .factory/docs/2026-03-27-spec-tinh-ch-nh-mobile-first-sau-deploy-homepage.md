## TL;DR kiểu Feynman
- Desktop đã lên rất tốt, nên hướng vừa làm là đúng; vấn đề còn lại là mobile vẫn bị phạt bởi CPU/JS/runtime nhiều hơn desktop.
- Root cause lớn nhất bây giờ không còn nằm ở ảnh hero là chính nữa, mà nằm ở **JS client còn quá nặng trên first load mobile**.
- 3 cụm còn đắt nhất cho mobile là: **Header nhiều query client**, **tracking chạy quá sớm**, và **homepage vẫn hydrate/render một renderer monolithic**.
- Để tăng mobile mà không đổi UI, chiến lược tốt nhất là: **defer tối đa runtime không critical**, **server-prefetch header data**, và **dời tracking ra khỏi first paint**.
- Tôi đề xuất một pha tối ưu mobile-first mạnh tay, nhưng chỉ đổi thứ tự tải/render, không đổi giao diện.

## Audit Summary
### Observation
Từ 2 report sau deploy:
- **Desktop đã tốt**: performance khoảng **97**, LCP/FCP/CLS đều ổn.
- **Mobile vẫn kém**: performance khoảng **61**, dù accessibility/best practices/SEO đều tốt.
- Nghĩa là bài toán hiện tại đã chuyển từ “ảnh/LCP tổng quát” sang “mobile CPU + JS + runtime path”.

### Evidence từ code hiện tại
1. **Header vẫn còn nhiều query client trên first load**
   - `components/site/Header.tsx:171-178` vẫn gọi liên tiếp nhiều `useQuery` cho `cart`, `wishlist`, `customers`, `orders`, `products`, `posts`, `services`, `customerLoginFeature`.
   - Dù menu/style/config/contact đã được skip khi có `initialData`, nhóm module flags vẫn còn chạy trên client.

2. **Tracking vẫn nằm trong critical path của root/site**
   - `app/layout.tsx` vẫn mount `PageViewTracker` và `Analytics` ngay từ đầu.
   - `components/PageViewTracker.tsx` gọi `useMutation(api.pageViews.track)` và gửi mutation ngay khi route mount.
   - `app/(site)/layout.tsx` vẫn render `SpeedInsights` trong shell public.
   - Với mobile, các tác vụ này dễ ăn vào main-thread/network contention sớm hơn desktop.

3. **Global font cost vẫn quá rộng**
   - `app/layout.tsx` vẫn import và gắn rất nhiều font variables cùng lúc: `Be_Vietnam_Pro`, `Geist`, `Roboto`, `Noto_Sans`, `Nunito`, `Source_Sans_3`, `Merriweather`, `Lora`, `Montserrat`, `Roboto_Slab`, `Noto_Serif`.
   - Đây là chi phí global cho mọi page, trong khi homepage public không cần ngần ấy font cho first paint.

4. **Homepage renderer vẫn là client monolith**
   - `components/site/ComponentRenderer.tsx` vẫn import rất rộng từ `app/admin/home-components/**`.
   - Có thêm `useQuery` runtime ngay trong renderer (`homeComponentSystemConfig`, product/category queries ở vài section).
   - `HomePageClient` mới chỉ defer phần section phía sau, nhưng mỗi section render ra vẫn đi qua cùng một khối client lớn.

5. **Client providers/shell vẫn góp vào hydration path**
   - `components/site/SiteProviders.tsx` bọc `CustomerAuthProvider`, `CartProvider`, `Toaster` cho toàn shell.
   - `components/site/CartDrawer.tsx` luôn có mặt trong shell client dù drawer đóng.
   - Các phần này không nhất thiết phải cạnh tranh tài nguyên ở first paint mobile.

### Inference
- Desktop qua 90 chứng minh tối ưu ảnh/caching vừa rồi có hiệu quả.
- Mobile còn thấp cho thấy **bottleneck mới là main-thread / hydration / query fan-out**, không phải chỉ riêng image delivery nữa.
- Nếu tiếp tục tối ưu ảnh đơn thuần, biên lợi ích sẽ nhỏ hơn so với việc cắt runtime JS và dời tracking khỏi critical path.

## Root Cause Confidence
- **High**: Header client query fan-out là một nguyên nhân chính còn lại cho mobile.
- **High**: Tracking/telemetry mount sớm làm mobile first paint và main-thread tệ hơn cần thiết.
- **High**: ComponentRenderer monolithic client import vẫn giữ JS initial quá lớn cho mobile.
- **Medium**: Global fonts vẫn cộng thêm chi phí tải/render; nên làm cùng phase nhưng sau runtime/runtime-network.

## Root-cause protocol (8 câu)
1. **Triệu chứng**  
   Expected: mobile > 90 giống desktop.  
   Actual: desktop ~97 nhưng mobile ~61, nghĩa là còn bottleneck mobile-specific.

2. **Phạm vi ảnh hưởng**  
   Homepage public mobile, chủ yếu vùng first load và hydration path.

3. **Có tái hiện ổn định không**  
   Có, theo report mới sau deploy: desktop tốt, mobile chưa tốt.

4. **Mốc thay đổi gần nhất**  
   Các tối ưu trước đã cải thiện desktop rõ rệt; mobile còn kém chứng minh bước tiếp theo phải đổi trọng tâm sang JS/runtime.

5. **Dữ liệu còn thiếu**  
   Lighthouse trace JSON để định lượng long tasks/chunk size chính xác hơn.

6. **Giả thuyết thay thế chưa loại trừ**  
   Có thể còn một số ảnh/section cụ thể dưới fold cạnh tranh tài nguyên; nhưng evidence code hiện tại cho thấy runtime client là ứng viên mạnh hơn.

7. **Rủi ro nếu fix sai nguyên nhân**  
   Tốn effort refactor nhưng điểm mobile tăng ít; có thể làm architecture phức tạp hơn không cần thiết.

8. **Tiêu chí pass/fail**  
   Mobile score tăng rõ rệt; main-thread bớt nặng; UI homepage giữ nguyên; desktop không regress.

## Quyết định tối ưu theo lựa chọn tốt nhất
### 1) Runtime mobile-first
**Chọn:** `Mạnh tay (defer tối đa)`  
**Lý do:** desktop đã đạt, nên dư địa lớn nhất nằm ở cắt mobile runtime. Đây là option có ROI cao nhất hiện tại.

### 2) Tracking
**Recommend:** `Defer toàn bộ sau tương tác/idle`  
**Confidence 88%** — tốt nhất cho mobile first paint vì tracking không phải nội dung user cần thấy ngay.  
Tradeoff: số liệu analytics có thể đến muộn vài trăm ms–vài giây, nhưng UI không đổi.

### 3) Header data
**Recommend:** `Prefetch server + bỏ query client không cần thiết`  
**Confidence 91%** — tốt nhất vì vừa giảm network fan-out vừa giảm hydration work, ít rủi ro hơn việc tạo endpoint mới trong pha đầu.  
Tradeoff: cần mở rộng initial header payload và phân loại cái gì thật sự cần fresh.

## Problem Graph
1. [Main] Mobile homepage vẫn ~61 sau deploy
   1.1 [Runtime path nặng] <- depends on 1.1.1, 1.1.2, 1.1.3
      1.1.1 [ROOT CAUSE] Header còn nhiều `useQuery` client trên first load
      1.1.2 [ROOT CAUSE] Tracking chạy quá sớm (`PageViewTracker`, `Analytics`, `SpeedInsights`)
      1.1.3 [ROOT CAUSE] `ComponentRenderer` vẫn là client monolith lớn
   1.2 [Secondary startup overhead]
      1.2.1 [Sub] Quá nhiều fonts global
      1.2.2 [Sub] SiteProviders/CartDrawer vẫn nằm trên shell hydration path

## Files Impacted
### Shared shell / tracking
- **Sửa:** `app/layout.tsx`  
  Vai trò hiện tại: root layout, global fonts, analytics, page tracking.  
  Thay đổi: giảm font global cho homepage path, dời tracking/analytics khỏi critical path.

- **Sửa:** `app/(site)/layout.tsx`  
  Vai trò hiện tại: site shell public + `SpeedInsights`.  
  Thay đổi: dời `SpeedInsights` khỏi initial critical path hoặc chỉ mount sau idle.

- **Sửa:** `components/PageViewTracker.tsx`  
  Vai trò hiện tại: gửi page-view mutation ngay khi route mount.  
  Thay đổi: defer tracking sau idle/interaction/visibility ổn định.

### Header / homepage runtime
- **Sửa:** `components/site/Header.tsx`  
  Vai trò hiện tại: header client với nhiều query flags/features.  
  Thay đổi: nhận thêm initial module-state từ server và bỏ query client không critical.

- **Sửa:** `app/(site)/layout.tsx`  
  Vai trò hiện tại: tạo `initialHeaderData`.  
  Thay đổi: prefetch luôn các module/feature flags cần cho header mobile-first.

- **Sửa:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: renderer client monolithic import rộng.  
  Thay đổi: tách critical renderer vs deferred renderer, hoặc dynamic import section dưới fold.

- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: defer phần section sau top 3.  
  Thay đổi: mạnh tay hơn với below-fold, có thể dựa trên intersection/idle thay vì timeout đơn thuần.

### Optional cleanup
- **Sửa:** `components/site/SiteProviders.tsx`  
  Vai trò hiện tại: mount auth/cart/toaster cho toàn shell.  
  Thay đổi: xem xét hoãn mount phần không cần cho homepage first paint.

- **Sửa:** `components/site/CartDrawer.tsx`  
  Vai trò hiện tại: nằm trong shell client mọi lúc.  
  Thay đổi: dynamic import hoặc mount khi có tương tác cart.

## Execution Preview
1. **P0.1** Defer tracking/telemetry khỏi first paint mobile.
2. **P0.2** Server-prefetch header module flags và bỏ query client không cần thiết.
3. **P0.3** Tách homepage renderer thành critical vs deferred sâu hơn cho mobile.
4. **P1.1** Giảm global font cost.
5. **P1.2** Hoãn providers/cart shell không critical.
6. Review tĩnh và soát parity UI mobile/desktop.

## Backlog ưu tiên mobile-first
### P0 — ROI cao nhất
1. **Defer toàn bộ tracking sau idle/interaction**
   - `PageViewTracker`
   - `Analytics`
   - `SpeedInsights`

2. **Prefetch server cho header state, bỏ query client flags/features**
   - Nhất là nhóm module/feature không cần realtime trong first paint.

3. **Tách deeper deferred rendering cho homepage**
   - Không chỉ top 3 vs còn lại bằng timeout.
   - Chuyển sang critical above-the-fold trước, below-the-fold mount theo idle/intersection.

### P1
1. Giảm font global xuống bộ tối thiểu cho public homepage.
2. Dynamic import `CartDrawer` hoặc providers phụ.

### P2
1. Tách `ComponentRenderer` theo section family để giảm chunk JS.
2. Audit tiếp section-specific queries còn nặng trên mobile.

## Acceptance Criteria
- Mobile homepage tăng đáng kể so với ~61 hiện tại.
- Desktop giữ ổn định, không tụt đáng kể.
- UI homepage không đổi bố cục/hành vi nhìn thấy.
- Tracking vẫn hoạt động nhưng không nằm trong first paint path.
- Header hiển thị đúng như cũ nhưng ít query client hơn.

## Verification Plan
- Re-run PSI mobile sau từng cụm P0 riêng biệt để biết cụm nào mang ROI lớn nhất.
- So sánh network/main-thread trước-sau cho mobile.
- Soát static parity cho header, hero, deferred sections, cart shell.
- Chỉ chạy `bunx tsc --noEmit` nếu bước sau có thay đổi code TypeScript.

## Out of Scope
- Không redesign UI.
- Không mở rộng tối ưu toàn site ngoài homepage trừ shared shell trực tiếp ảnh hưởng homepage.
- Không đổi business behavior của cart/auth/header.

## Risk / Rollback
- **Risk:** defer quá tay có thể làm tracking chậm hoặc một số section xuống quá muộn trên máy yếu.
- **Rollback:** chia commit nhỏ theo từng cụm P0; nếu cụm nào gây side effect thì rollback độc lập mà không ảnh hưởng phần còn lại.

## Đề xuất chốt
Nếu bạn duyệt, tôi sẽ đi theo thứ tự tối ưu nhất cho mobile hiện tại:
1. Dời tracking/telemetry khỏi critical path
2. Prefetch server cho header và bỏ query client không cần thiết
3. Tách deeper deferred rendering cho below-the-fold homepage
4. Sau đó mới giảm fonts/providers nếu mobile vẫn chưa đủ
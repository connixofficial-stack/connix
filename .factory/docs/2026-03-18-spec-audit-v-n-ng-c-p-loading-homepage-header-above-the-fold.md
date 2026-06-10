## Audit Summary
- Observation: `Loading States` hiện chỉ đọc config ở `app/(site)/_components/HomePageClient.tsx`, tức chỉ ảnh hưởng phần `children` của homepage; **Header nằm ngoài flow này** vì `SiteShell` render `<Header />` trước `<main>` (`components/site/SiteShell.tsx`).
- Observation: Vì vậy setting `revealMode = when-above-the-fold-ready` hiện **không thể** đảm bảo “Header và Hero cùng lúc” như anh mong muốn; nó chỉ delay phần homepage body, không orchestration được header.
- Observation: `Header` hiện là client component và tự gọi nhiều `useQuery(...)` (`components/site/Header.tsx`): menu, header config, contact, cart/wishlist/customers/orders/products/posts/services, feature login. Nghĩa là header thật có thể đến muộn và nhảy layout.
- Observation: `HomePageLoading` hiện render skeleton chung theo type nhưng không mô phỏng thật vùng above-the-fold của homepage. Nó không có contract riêng cho header + hero, không ưu tiên hero image/text/CTA theo layout thật, nên cảm giác “xấu” là có cơ sở.
- Observation: `Loading States` page hiện chỉ có form config text/select/toggle, chưa có preview/audit signal nên user khó biết config nào thực sự áp dụng vào homepage.
- Observation: Header data thực ra có phần có thể preload server-side: `app/(site)/layout.tsx` đã query menu header bằng Convex server client (`getMenuByLocation`, `listActiveMenuItems`), nhưng data đó mới dùng cho SEO schema, **chưa bơm xuống Header runtime**.
- Web evidence 2024–2026: NN/g, LogRocket, OpenReplay đều nghiêng về skeleton cho content area; còn navigation/header nên ưu tiên stable shell hoặc preload real data thay vì skeleton giả toàn thanh menu. Đây khớp phản hồi của anh là “skeleton header menu dở”.

## Root Cause Confidence
**High** — Root cause không phải chỉ do style skeleton xấu, mà là sai kiến trúc orchestrate above-the-fold:
1. Header bị tách khỏi loading contract của homepage.
2. Header đang phụ thuộc nhiều client queries nên không thể hiện “thật” sớm.
3. Hero skeleton chưa bám layout thực tế nên perceived quality thấp.
4. Trang `/system/experiences/loading-states` chưa có preview/reality check nên config không tạo niềm tin.

## Root Cause Protocol
1. Triệu chứng: homepage loading nhìn xấu; header skeleton/menu không tự nhiên; setting loading-states không cho cảm giác “đã áp dụng tốt”.
2. Phạm vi: homepage trước mắt, nhưng ảnh hưởng nền tảng cho mọi page cần above-the-fold orchestration.
3. Tái hiện: ổn định, vì code hiện tại luôn render Header ngoài `HomePageClient`.
4. Mốc thay đổi gần nhất: loading config mới được gắn vào `HomePageClient`, chưa chạm `SiteShell/Header`.
5. Dữ liệu còn thiếu: chưa có measured timing thực tế từng query, nhưng evidence code đã đủ để kết luận kiến trúc hiện tại không đáp ứng yêu cầu UX.
6. Giả thuyết thay thế chưa bị loại trừ: chỉ redesign skeleton đẹp hơn. Kết luận: chưa đủ, vì header vẫn ngoài contract.
7. Rủi ro nếu fix sai nguyên nhân: tốn công polish skeleton nhưng UX vẫn bị lệch giữa header và hero.
8. Pass/fail: vào homepage phải thấy header thật và hero skeleton/hero thật phối hợp đúng, không có cảm giác “menu giả”.

## Đề xuất
### Option A - Header preload thật + Hero skeleton hợp đồng (Recommend)
Confidence 91%.

Hướng này sẽ:
1. **Preload header thật ở server/layout**
   - Lấy menu/config/site/contact server-side trong `app/(site)/layout.tsx`
   - Truyền `initialHeaderData` vào `SiteShell` -> `Header`
   - Header render real content ngay từ first paint, không skeleton menu giả
2. **Tách loading contract above-the-fold**
   - Loading config thêm khái niệm `priorityZones`: `header`, `hero`, `top-content`
   - Với homepage phase 1: mặc định `header + hero`
3. **Hero-first skeleton đúng layout thật**
   - Skeleton riêng cho Hero theo style thực tế phổ biến của homepage
   - Có title lines, CTA pills, media block đúng tỉ lệ; không dùng block generic thô
4. **Reveal orchestration đúng nghĩa**
   - `when-above-the-fold-ready` = chỉ chờ `header real ready + hero ready/skeleton contract ready`
   - Không chặn các section dưới fold
5. **Nâng cấp Loading States page**
   - Rename/diễn giải rõ “Above-the-fold contract”
   - Thêm preview card cho homepage: header strategy, hero strategy, reveal rule
   - Thêm notes giải thích page nào thực sự áp dụng

### Vì sao recommend
- Đúng yêu cầu của anh: `Header và Hero cùng lúc` + `Preload header thật`.
- Theo best practice SaaS/enterprise: nav/header nên stable hoặc real, skeleton tập trung cho main content.
- Giải quyết tận gốc, không chỉ làm skeleton đẹp hơn.
- Tạo được nền tái dùng cho các page khác sau này.

### Option B - Header shell tối giản + Hero skeleton
Confidence 68%.

Không preload full header data; chỉ render shell header rất tối giản ổn định (logo, 2–3 slot, không fake menu detail), còn hero dùng skeleton đẹp hơn.

Phù hợp khi muốn giảm scope kỹ thuật ở phase đầu, nhưng sẽ kém chuẩn hơn Option A vì header chưa phải “real”.

## Counter-hypothesis
- Giả thuyết: chỉ cần chỉnh CSS của `HomePageLoading` cho đẹp hơn.
- Kết luận: **Low confidence**. Dù đẹp hơn, header vẫn nằm ngoài contract và vẫn có thể load lệch hero.

## Problem Graph
1. [Homepage loading xấu] <- depends on 1.1, 1.2, 1.3
   1.1 [Header outside contract] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] SiteShell render Header độc lập, HomePageClient không kiểm soát được
   1.2 [Header client queries nhiều] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] chưa truyền initial server data vào Header
   1.3 [Hero skeleton generic] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] chưa có skeleton bám layout above-the-fold thật

## Proposal chi tiết (Option A)
### 1) Server-preload Header
Đổi luồng dữ liệu:
- `app/(site)/layout.tsx`
  - query thêm header config/site/contact cần thiết cho runtime header
  - build `initialHeaderData`
- `components/site/SiteShell.tsx`
  - nhận `initialHeaderData`
- `components/site/Header.tsx`
  - ưu tiên initial data trước, rồi hydrate/update bằng `useQuery`

### 2) Định nghĩa loading config mới cho homepage
Mở rộng `lib/experiences/loading-states/config.ts`:
- `homepage.headerMode`: `real-preloaded` | `minimal-shell`
- `homepage.heroMode`: `hero-skeleton` | `immediate`
- `homepage.priorityZones`: `['header','hero']`
- `homepage.revealMode`: giữ `when-above-the-fold-ready`

### 3) Thay generic HomePageLoading bằng AboveTheFold loader
Tách component mới kiểu:
- `components/site/loading/HomepageAboveFoldLoading.tsx`
- Render:
  - header thật nếu preload được
  - hero skeleton chất lượng cao
  - optional top-content strip nếu cần
- Các section dưới fold không cần skeleton dày ngay phase này

### 4) Refactor HomePageClient
- Chỉ giữ orchestration cho hero + body content
- Nếu `when-above-the-fold-ready`, reveal theo contract `header+hero`
- Không dùng `Math.max(delayMs, minDisplayMs)` một cách cứng nữa; thay bằng rule rõ:
  - có `delayMs`
  - có `minDisplayMs`
  - chỉ áp dụng khi thực sự đang loading

### 5) Nâng cấp trang `/system/experiences/loading-states`
- Đổi copy cho rõ: setting nào áp dụng homepage/header/hero
- Thêm control riêng cho homepage above-the-fold
- Thêm preview/audit summary nhỏ:
  - Header strategy: Real preloaded
  - Hero strategy: Skeleton
  - Reveal contract: Header + Hero
- Nếu một setting chưa áp dụng runtime nào, hiển thị note thay vì tạo kỳ vọng sai

## File-level plan
- `app/(site)/layout.tsx`
  - preload initial header/menu data từ server và truyền xuống shell
- `components/site/SiteShell.tsx`
  - nhận props initial data cho header
- `components/site/Header.tsx`
  - hỗ trợ `initialHeaderData`; giảm flash/loading client-only
- `app/(site)/_components/HomePageClient.tsx`
  - refactor logic reveal theo above-the-fold contract
- `components/site/loading/HomePageLoading.tsx`
  - có thể thay bằng loader mới focused vào homepage above-the-fold
- `components/site/loading/*`
  - thêm skeleton hero chất lượng cao, bỏ fake menu skeleton kiểu cũ
- `lib/experiences/loading-states/config.ts`
  - mở rộng schema cho homepage/header/hero priority
- `app/system/experiences/loading-states/page.tsx`
  - thêm controls + preview đúng runtime contract

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Header phải vào cùng contract với homepage.
   - Action: preload server data từ layout vào Header.
   - Reflection: nếu header hiện thật ngay, menu skeleton xấu sẽ biến mất.
2. Solving 1.3.1...
   - Thought: Hero skeleton phải bám layout thật để nhìn premium.
   - Action: làm hero-specific skeleton thay vì section block generic.
   - Reflection: đây là phần cải thiện cảm nhận UX mạnh nhất.
3. Solving 1.2.1...
   - Thought: client query vẫn cần, nhưng chỉ để revalidate.
   - Action: Header dùng initial data trước rồi sync sau.
   - Reflection: giảm flash mà vẫn giữ realtime compatibility.

## Verification Plan
- Repro sau nâng cấp:
  1. Vào homepage mạng chậm: thấy **header thật** và **hero loading hợp lý** cùng lúc.
  2. Không còn skeleton menu giả nguyên thanh.
  3. Hero skeleton nhìn gần layout thật của hero hiện tại.
  4. `Loading States` page mô tả đúng runtime đang áp dụng, không gây hiểu nhầm.
  5. Config homepage có thể mở rộng tái dùng cho page khác sau này.
- Static verification:
  - review typing/fallback cho initial server data + client hydration
  - đảm bảo không làm vỡ `Header` ở các route site khác
  - nếu có đổi TS code thì chạy `bunx tsc --noEmit` sau khi implement

Em recommend đi **Option A**: preload header thật + contract above-the-fold cho header và hero, rồi mới polish lại UI của `Loading States` page để phản ánh đúng runtime.
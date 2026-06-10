## TL;DR kiểu Feynman
- Điểm đã lên rất sát đích, nên giờ không cần refactor rộng nữa; chỉ cần chốt vài đòn ROI cao cuối.
- Anh đã cho phép mức mạnh: defer footer + search/cart tới interaction, miễn không đổi tính năng.
- Pha này sẽ tập trung song song 3 trục: `Hero/Stats path`, `Header/Shell hydration`, và `ảnh/tải tài nguyên`.
- Mục tiêu: đẩy mobile càng cao càng tốt, ưu tiên vượt 90 nếu code path cho phép.
- Cách làm vẫn theo commit nhỏ, rollback dễ, không đụng business logic.

## Audit Summary
### Observation
1. PSI mobile đã tăng mạnh qua các pha trước, nghĩa là các bottleneck còn lại đã thu hẹp vào critical path đầu trang.
2. `Hero/Stats` đã được tách khỏi fallback monolith, nên dư địa còn lại chủ yếu nằm ở hydration của shell/header và tài nguyên hiển thị sớm.
3. Homepage vẫn còn các phần có thể defer mạnh hơn mà không đổi feature contract: footer, search/cart interaction, một phần asset của hero.
4. User cho phép defer mạnh ở homepage và muốn ưu tiên đồng thời cả 3 hướng cuối cùng.

### Counter-hypothesis
- Có thể điểm còn thiếu chủ yếu do mạng hoặc backend response.
- Nhưng chuỗi cải thiện trước đó đến từ render/hydration split và runtime trimming, nên code-path frontend vẫn là đòn bẩy tốt nhất cho pha chốt.

## Root Cause Confidence
- **High:** Header/Shell interactive hydration vẫn còn chi phí đầu trang trên mobile.
- **High:** Hero asset path vẫn có thể tối giản thêm về tải sớm/priority.
- **Medium-High:** Footer và interactive islands dù đã giảm vẫn còn dư địa defer mạnh hơn ở homepage.

## Files Impacted
### Homepage render / assets
- **Sửa:** `components/site/home/sections/HeroRuntimeSection.tsx`  
  Vai trò hiện tại: render hero runtime cho homepage.  
  Thay đổi: giảm chi phí asset đầu trang theo hướng ưu tiên slide đầu, hạ ưu tiên phần còn lại, tránh tải sớm không cần thiết.

- **Sửa:** `components/site/home/sections/StatsRuntimeSection.tsx`  
  Vai trò hiện tại: render stats runtime tách khỏi monolith.  
  Thay đổi: rà lại markup/branch nhẹ hóa nếu còn chi phí không cần trên mobile.

### Header / Shell
- **Sửa:** `components/site/Header.tsx`  
  Vai trò hiện tại: header đã có gate `interactiveReady` nhưng vẫn còn một số interactive path có thể trì hoãn hơn nữa.  
  Thay đổi: defer mạnh homepage-only cho search/cart/wishlist/user interaction, giữ nguyên feature khi người dùng thực sự tương tác.

- **Sửa:** `components/site/SiteShell.tsx`  
  Vai trò hiện tại: đã defer cart drawer/footer một phần.  
  Thay đổi: siết thêm homepage-only footer/search/cart mount timing để giảm startup cost.

### Nếu cần polish tài nguyên
- **Sửa (nếu evidence ủng hộ):** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: điều phối critical/deferred render.  
  Thay đổi: cân nhắc siết tiếp trigger deferred theo interaction/viewport nhưng không làm blank UX.

## Execution Preview
1. Audit lại chính xác phần nào còn mount/tải sớm trên homepage sau các commit vừa rồi.
2. Siết tiếp `Header` và `SiteShell` cho homepage-only defer mạnh hơn, không đổi feature contract.
3. Tối ưu `HeroRuntimeSection` để giảm tải ảnh/priority không cần thiết ngoài phần đầu tiên.
4. Nếu còn dư địa, giảm thêm chi phí deferred render ở `HomePageClient`.
5. `bunx tsc --noEmit`.
6. Commit phase chốt riêng để dễ rollback nếu PSI không tăng.

## Acceptance Criteria
- PSI mobile tăng tiếp và mục tiêu ưu tiên là **vượt 90**.
- Không mất tính năng search/cart/footer; chỉ đổi thời điểm mount cho homepage.
- Không phát sinh lỗi runtime/hydration/context.
- Không thay đổi UI contract nhìn thấy rõ rệt khi người dùng vào homepage và tương tác bình thường.

## Verification Plan
1. `bunx tsc --noEmit` sau khi sửa.
2. Soát parity homepage: header, search, cart, hero, footer.
3. Redeploy và đo lại PSI mobile.
4. Nếu một đòn không mang thêm điểm hoặc gây regression, revert đúng commit đó.

## Out of Scope
- Không thêm tính năng mới.
- Không redesign homepage.
- Không mở rộng tối ưu ngoài phạm vi homepage/shell liên quan trực tiếp.

## Risk / Rollback
- **Risk:** defer mạnh có thể làm interactive control xuất hiện muộn hơn trên homepage trước khi người dùng chạm.
- **Mitigation:** chỉ áp dụng homepage-only, gate theo interaction/idle rõ ràng, giữ logic cũ cho route khác.
- **Rollback:** revert commit phase chốt nếu UX hoặc PSI không đạt như kỳ vọng.
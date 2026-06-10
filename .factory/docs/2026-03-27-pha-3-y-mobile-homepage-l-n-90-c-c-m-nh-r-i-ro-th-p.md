## TL;DR kiểu Feynman
- Mobile 65% nghĩa là còn nghẽn ở **JS/hydration trên homepage**, không phải SEO/accessibility.
- Để lên >90 mà ít rủi ro, ta không đổi UI, chỉ đổi **thứ tự mount** và **thời điểm tải code**.
- Pha này tập trung **chỉ homepage**: cắt runtime không cần thiết ở first paint.
- Ưu tiên các bước có thể rollback từng commit nhỏ.

## Audit Summary
### Observation
- Desktop đã tốt, mobile còn ~65.
- Các chỉ số non-performance ổn (A11y/Best Practices/SEO), nên bottleneck là performance runtime.
- Homepage đang là client-heavy path: header tương tác + renderer lớn + deferred chưa đủ sâu.

### Inference
- Cần giảm JS thực thi trong 1–3s đầu trên mobile (main-thread contention).
- Tối ưu ảnh/caching thêm sẽ cho lợi ích thấp hơn tối ưu hydration/runtime ở thời điểm này.

## Root Cause Confidence
- **High:** Homepage renderer vẫn nặng ở initial hydration path.
- **High:** Một số phần tương tác header/cart/search vẫn mount sớm hơn mức cần thiết.
- **Medium-High:** Deferred hiện tại đã có nhưng chưa “gắt” đủ cho mobile yếu.

## Verification Plan
1. So sánh PSI mobile trước/sau từng cụm (P0.1 → P0.2 → P0.3).
2. Đối chiếu waterfall/long-task giảm ở first load homepage.
3. Kiểm tra parity UI (không đổi layout/visual) trên mobile.
4. Chạy `bunx tsc --noEmit` sau khi code xong.

## Files Impacted
### UI Homepage
- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: điều phối render critical/deferred của homepage.  
  Thay đổi: siết deferred mạnh hơn (2-phase defer: idle + intersection), giảm lượng component mount trong đợt đầu.

- **Sửa:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: renderer monolithic cho mọi loại section.  
  Thay đổi: tách nhánh render “critical-only” cho first pass và dời nhánh nặng sang lazy branch cho below-the-fold.

### Header (homepage-only behavior)
- **Sửa:** `components/site/Header.tsx`  
  Vai trò hiện tại: mount đầy đủ interactive logic sớm.  
  Thay đổi: homepage-only hydration gating cho phần không critical (cart/wishlist/search overlays) đến khi có interaction.

- **Sửa:** `components/site/SiteShell.tsx` (nếu cần wiring cờ route homepage)  
  Vai trò hiện tại: ghép Header + page content.  
  Thay đổi: truyền cờ tối ưu mobile homepage để Header áp dụng defer mà không ảnh hưởng route khác.

### Optional (chỉ khi cần để chạm >90)
- **Sửa:** `components/site/CartDrawer.tsx`  
  Vai trò hiện tại: logic drawer có thể vào hydration sớm.  
  Thay đổi: dynamic mount khi user mở cart lần đầu (homepage route).

## Execution Preview
1. **P0.1 (ít rủi ro, lợi ích cao):** Trong `HomePageClient`, giảm initial mounted sections xuống mức tối thiểu và defer sâu phần còn lại bằng điều kiện intersection + idle + interaction.
2. **P0.2:** Trong `Header`, homepage-only defer cho các cụm interactive nặng (overlay/search/cart panel), giữ visual tĩnh y như cũ.
3. **P0.3:** Trong `ComponentRenderer`, tách nhánh nặng khỏi first pass để giảm JS execute lúc đầu.
4. **P1 (fallback nếu chưa >90):** lazy mount `CartDrawer` homepage-only.
5. Static review + `bunx tsc --noEmit`.

## Acceptance Criteria
- Mobile PSI homepage tăng rõ rệt, mục tiêu >90 theo yêu cầu.
- Không thay đổi UI/UX nhìn thấy của homepage.
- Desktop không regress đáng kể.
- Không ảnh hưởng route public khác (scope chỉ homepage).

## Out of Scope
- Không tối ưu toàn public site.
- Không thay đổi business logic auth/cart/search.
- Không redesign component.

## Risk / Rollback
- **Risk chính:** defer quá mạnh có thể làm một số hành vi interactive “kích hoạt muộn” trong vài trăm ms đầu.
- **Giảm rủi ro:** áp dụng homepage-only, commit theo từng cụm P0.
- **Rollback:** revert từng commit độc lập (P0.1/P0.2/P0.3) nếu có side effect.

## Đề xuất thực thi
Tôi đề xuất chạy ngay theo thứ tự P0.1 → P0.2 → P0.3 (đúng tiêu chí “cực mạnh nhưng ít rủi ro”, scope chỉ homepage, mục tiêu >90).
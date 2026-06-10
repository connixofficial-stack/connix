## TL;DR kiểu Feynman
- Điểm đã tăng lên 69 nghĩa là hướng kiến trúc mới đúng, nhưng vẫn còn JS/hydration đầu trang quá nặng.
- Muốn lên >=90 bền vững phải làm **song song 2 nhánh**: (A) gọn Header/Providers và (B) server-first/renderer split sâu hơn.
- Triển khai theo **commit nhỏ, rollback dễ**, không đổi tính năng/behavior người dùng.
- Không đụng business feature; chỉ thay đổi boundary render/hydration và tải tài nguyên.
- Chốt KPI: tiếp tục tối ưu cho đến khi PSI mobile >= 90.

## Audit Summary
### Observation
1. Mobile đã tăng từ mức thấp lên **69** sau các commit defer + registry => chứng minh bottleneck chính là runtime/hydration, không phải nội dung.
2. `HomePageClient` vẫn là client orchestrator; dù đã bớt live-query sau hydration, path render vẫn còn client work lớn khi fallback legacy xảy ra.
3. `ComponentRenderer` legacy vẫn tồn tại làm fallback cho type chưa port, kéo theo JS parse/execute lớn trong trường hợp hit fallback.
4. Header/SiteProviders vẫn có interactive boundary rộng, gây chi phí khởi tạo sớm trên mobile.
5. Mục tiêu người dùng: **không đổi tính năng**, tiếp tục đến khi >=90.

### Counter-hypothesis (đã cân nhắc)
- Giả thuyết thay thế: điểm thấp chủ yếu do network/server response, không phải JS runtime.
- Lý do chưa chọn: chuỗi cải thiện vừa qua đến từ defer/hydration split (không đổi backend payload đáng kể), cho thấy JS runtime vẫn là đòn bẩy chính.

## Root Cause Confidence
- **High:** Client runtime đầu trang còn dày (Header + provider boundary + fallback renderer).
- **High:** Fallback sang legacy monolith cho một số type vẫn kéo bundle thực thi không cần thiết.
- **Medium:** Font/global startup có ảnh hưởng nhưng cần xử lý theo hướng an toàn, không làm đổi tính năng/UI.

## Files Impacted
### UI Runtime / Homepage
- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: điều phối critical/deferred render bằng client.  
  Thay đổi: ưu tiên đường registry-only cho type đã hỗ trợ; chỉ fallback khi thực sự thiếu mapping, giảm khả năng kéo legacy path sớm.

- **Sửa:** `components/site/home/registry.tsx`  
  Vai trò hiện tại: map type -> dynamic section.  
  Thay đổi: mở rộng mapping theo type xuất hiện thực tế trên homepage production để giảm tỷ lệ fallback legacy.

- **Sửa:** `components/site/home/HomeComponentRenderer.tsx`  
  Vai trò hiện tại: resolve màu/font + render registry hoặc fallback legacy.  
  Thay đổi: thêm guard để chỉ import/render fallback khi bắt buộc; giữ parity style và không đổi behavior.

### Header / Providers (A)
- **Sửa:** `components/site/Header.tsx`  
  Vai trò hiện tại: header client nhiều logic interactive/query.  
  Thay đổi: tách phần static shell khỏi interactive fragment; chỉ mount interactive khi cần (idle/interaction/homepage gate), không đổi tính năng hiển thị.

- **Sửa:** `components/site/SiteShell.tsx`  
  Vai trò hiện tại: bọc layout + wiring header/cart drawer.  
  Thay đổi: trì hoãn mount phần commerce interactive sâu hơn trên homepage (không đổi hành vi mở drawer/search/login khi người dùng tương tác).

- **Sửa:** `components/site/SiteProviders.tsx`  
  Vai trò hiện tại: provider phạm vi rộng.  
  Thay đổi: tách boundary nhẹ hơn (base vs interactive) trong cùng behavior contract để giảm hydration ban đầu.

### Root startup (an toàn, không đổi tính năng)
- **Sửa (thận trọng):** `app/layout.tsx`  
  Vai trò hiện tại: nạp font global lớn.  
  Thay đổi: chỉ tối ưu cách áp dụng/tải để giảm startup cost mà **không làm mất tính năng** và không thay đổi UI contract.

## Execution Preview
1. **Pre-audit type usage homepage**: thống kê type xuất hiện thực tế để ưu tiên port registry (không đoán mò).
2. **Commit #1 (A - Header/Providers)**: thu hẹp interactive boundary ở `Header` + `SiteShell` + `SiteProviders`, giữ nguyên behavior.
3. **Commit #2 (B - Renderer/Server-first sâu hơn)**: tăng coverage `registry`, giảm fallback legacy ở đường render homepage.
4. **Commit #3 (Startup polish an toàn)**: tối ưu root startup liên quan font/apply strategy theo mức không đổi tính năng/UI.
5. Sau mỗi commit: review tĩnh + `bunx tsc --noEmit`.
6. Chốt mỗi vòng bằng PSI mobile; lặp cho đến khi >=90.

## Acceptance Criteria
- PSI mobile homepage tăng qua từng phase và đạt **>=90**.
- Không phát sinh lỗi runtime/context/provider.
- Không đổi tính năng/luồng người dùng (search/cart/login/navigation hoạt động như cũ).
- Không thay đổi UI contract nhìn thấy rõ rệt.
- Mỗi phase rollback độc lập được bằng 1 commit.

## Verification Plan
1. `bunx tsc --noEmit` sau mỗi commit có đổi TS/TSX.
2. Soát parity hành vi: header, cart drawer, search, login state, render component homepage.
3. Đối chiếu PSI mobile trước/sau từng commit để xác nhận đóng góp thực tế.
4. Nếu một commit không cải thiện hoặc gây regression -> revert commit đó, giữ commit còn hiệu quả.

## Out of Scope
- Không thêm/chỉnh business feature mới.
- Không redesign UI homepage.
- Không mở rộng tối ưu ra toàn hệ thống ngoài phạm vi homepage/shell liên quan trực tiếp.

## Risk / Rollback
- **Risk:** tách boundary sai có thể gây lỗi hydration/provider.
- **Mitigation:** chia commit nhỏ, mỗi commit chỉ một nhóm thay đổi rõ ràng.
- **Rollback:** revert theo commit riêng lẻ, không ảnh hưởng toàn bộ chuỗi tối ưu.
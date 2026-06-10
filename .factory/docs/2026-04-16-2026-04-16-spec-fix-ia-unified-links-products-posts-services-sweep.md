# I. Primer
## 1. TL;DR kiểu Feynman
- Lỗi không nằm ở màn `/system/ia`, mà nằm ở các chỗ dựng link chi tiết đang hardcode `/products/{slug}`, `/posts/{slug}`, `/services/{slug}`.
- Khi bật chế độ `hợp nhất`, link đúng phải đi qua `buildDetailPath(...)` để ra dạng `/{categorySlug}/{recordSlug}`.
- Hiện nhiều component site bỏ qua helper này nên vẫn ra `/products/...`.
- Em sẽ làm sweep có kiểm soát cho 3 module products/posts/services: thay hardcode bằng helper IA + truyền `routeMode` và `categorySlug`.
- Không đổi schema/data Convex, không đổi behavior business khác.

## 2. Elaboration & Self-Explanation
Hiện hệ thống đã có “bộ não” cho IA mode trong `lib/ia/route-mode.ts` (`buildDetailPath`, `buildCategoryPath`) và một số nơi đã dùng đúng (ví dụ layout canonical/redirect). Tuy nhiên nhiều UI render card/link ở site vẫn ghép chuỗi thủ công (`/products/${slug}`...), nên khi người dùng chọn mode hợp nhất, các link này không theo mode mà vẫn ép về namespace cũ.

Vì vậy cách sửa đúng là đồng bộ tất cả “điểm phát sinh URL chi tiết” của products/posts/services về một cơ chế duy nhất: luôn dùng helper IA route, có đủ `moduleKey + routeMode + categorySlug + recordSlug`. Như vậy mode đổi ở `/system/ia` sẽ tác động nhất quán toàn site.

## 3. Concrete Examples & Analogies
- Ví dụ đúng với case anh/chị nêu:
  - Input: `mode=unified`, `module=products`, `categorySlug=website-ban-hang`, `recordSlug=website-giay-thanshoesvn-ghh`
  - Kết quả đúng: `/website-ban-hang/website-giay-thanshoesvn-ghh`
  - Kết quả lỗi hiện tại: `/products/website-giay-thanshoesvn-ghh`

- Analogy (so sánh đời thường):
  - `buildDetailPath` giống “bộ định tuyến trung tâm”. Nếu từng tài xế tự chọn đường (hardcode), sẽ đi sai lộ trình khi thành phố đổi luật giao thông (đổi IA mode).

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation (Quan sát):
  - `app/system/ia/page.tsx` chỉ lưu setting `ia_route_mode`, không tự dựng link chi tiết sản phẩm.
  - `lib/ia/route-mode.ts` đã có helper chuẩn cho unified/namespace.
  - `app/(site)/products/page.tsx` có nhiều `router.push('/products/${slug}')` và `href='/products/${slug}'`.
  - Các vùng posts/services và nhiều component layout/section cũng có pattern hardcode tương tự.
- Inference (Suy luận): lỗi do link generation không đi qua IA helper ở nhiều surface.
- Decision (Quyết định): sửa sweep toàn bộ products/posts/services theo yêu cầu user, nhưng giữ thay đổi tối thiểu (chỉ thay logic build URL).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause (High confidence):
  1. Triệu chứng: mode hợp nhất bật nhưng click detail ra `/products/...` (Actual) thay vì `/{category}/{record}` (Expected).
  2. Phạm vi: public site rendering (cards/buttons/CTA) của products/posts/services; không giới hạn ở 1 page.
  3. Repro: ổn định ở các điểm đang hardcode template string.
  4. Mốc thay đổi: codebase đang mixed pattern (một số nơi dùng helper, một số nơi hardcode).
  5. Thiếu dữ liệu: chưa có danh sách 100% điểm phát sinh URL ở runtime dynamic blocks; sẽ quét grep trước khi sửa.
  6. Counter-hypothesis: có thể do `ia_route_mode` không load đúng. Bị loại trừ vì nhiều nơi đã đọc mode đúng nhưng vẫn hardcode URL.
  7. Rủi ro fix sai nguyên nhân: còn sót chỗ hardcode, gây behavior không nhất quán giữa các khu vực UI.
  8. Pass/fail: mọi link chi tiết 3 module phải đổi theo mode tức thời (unified vs namespace) và không tạo URL rỗng.

```mermaid
flowchart TD
  A[User bật ia_route_mode=unified] --> B[UI dựng link chi tiết]
  B --> C{Dùng buildDetailPath?}
  C -- Có --> D[URL đúng: /{category}/{record}]
  C -- Không --> E[URL sai: /products|posts|services/{slug}]
```

# IV. Proposal (Đề xuất)
1. Chuẩn hóa cơ chế build detail URL cho site surfaces:
   - Dùng `buildDetailPath` cho products/posts/services.
   - Tạo helper cục bộ nhỏ ở từng page/component để giảm lặp tham số.
2. Bổ sung đủ dữ liệu đầu vào:
   - Đảm bảo mỗi card item có `categorySlug` (map từ `categoryId -> slug` từ query categories đã có sẵn ở page).
   - Nếu thiếu categorySlug, fallback an toàn về namespace để tránh link gãy.
3. Sweep theo nhóm:
   - Nhóm A: các page list chính (`app/(site)/products|posts|services/page.tsx`).
   - Nhóm B: component layouts/sections render link detail (Blog, ServiceList, ProductListSection, các layout fullwidth/sidebar/magazine...).
   - Nhóm C: renderer động (`ComponentRenderer`) và util internal links nếu đang xuất link detail hardcode.
4. Không thay đổi:
   - Không đổi schema, không đổi API contract Convex, không đổi setting key.

# V. Files Impacted (Tệp bị ảnh hưởng)
## UI/site core pages
- Sửa: `app/(site)/products/page.tsx`
  - Vai trò hiện tại: trang list products + action điều hướng detail.
  - Thay đổi: thay toàn bộ push/href hardcode detail bằng IA-aware URL builder.
- Sửa: `app/(site)/posts/page.tsx`
  - Vai trò hiện tại: trang list posts + truyền data cho layouts.
  - Thay đổi: chuẩn hóa URL detail truyền xuống layout/component theo route mode.
- Sửa: `app/(site)/services/page.tsx`
  - Vai trò hiện tại: trang list services + bộ lọc/sort/pagination.
  - Thay đổi: tương tự posts/products cho link detail.

## UI/site shared components
- Sửa: `components/site/ProductListSection.tsx`
  - Vai trò hiện tại: home section hiển thị card sản phẩm với nhiều style.
  - Thay đổi: thay `href=/products/...` bằng URL build theo IA mode.
- Sửa: `components/site/BlogSection.tsx` + `components/site/posts/layouts/*`
  - Vai trò hiện tại: render card/list bài viết.
  - Thay đổi: bỏ hardcode `/posts/...`, dùng URL IA-aware.
- Sửa: `components/site/ServiceListSection.tsx` + `components/site/services/layouts/*`
  - Vai trò hiện tại: render card/list dịch vụ.
  - Thay đổi: bỏ hardcode `/services/...`, dùng URL IA-aware.
- Sửa: `components/site/ComponentRenderer.tsx`
  - Vai trò hiện tại: renderer block động cho nhiều home components.
  - Thay đổi: cập nhật các anchor detail đang hardcode sang helper IA route.

## Shared logic
- Giữ nguyên (có thể tái sử dụng thêm): `lib/ia/route-mode.ts`
  - Vai trò hiện tại: source of truth cho route mode.
  - Thay đổi: chỉ dùng lại, hạn chế sửa nếu chưa cần.

# VI. Execution Preview (Xem trước thực thi)
1. Quét tất cả hardcoded detail links 3 module trong `app/(site)` và `components/site`.
2. Nhóm theo module và surface để tránh sửa sót.
3. Tại từng file: thêm/đẩy dữ liệu `routeMode`, `categorySlug`, thay link sang `buildDetailPath`.
4. Bổ sung fallback namespace khi thiếu category slug.
5. Self-review tĩnh: type-safety, null-safety, không đổi behavior ngoài URL.
6. Commit gói sweep (không push).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static verification (agent):
  - Soát compile-level logic và type consistency tại các file sửa.
  - Soát thủ công các nhánh: unified + namespace + missing categorySlug fallback.
- Runtime/integration verification (tester phụ trách theo AGENTS.md):
  - Case 1: `ia_route_mode=unified`, click card product/post/service => URL dạng `/{category}/{record}`.
  - Case 2: `ia_route_mode=namespace`, click card => URL dạng `/products|posts|services/{slug}`.
  - Case 3: thiếu category mapping => vẫn vào namespace, không crash.

# VIII. Todo
1. Quét và lập danh sách toàn bộ điểm hardcode detail URL cho products/posts/services.
2. Refactor page-level routing ở 3 trang list chính để phát URL IA-aware.
3. Refactor shared components/layouts đang render link detail hardcode.
4. Rà null-safety/fallback categorySlug và consistency giữa unified/namespace.
5. Tự review tĩnh và chuẩn bị commit (không push).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- [Pass] Ở mode hợp nhất, click mọi link detail products/posts/services trên site đều ra `/{categorySlug}/{recordSlug}`.
- [Pass] Ở mode phân vùng, link detail giữ đúng `/products|posts|services/{slug}`.
- [Pass] Không phát sinh route rỗng/`undefined`/404 do thiếu category slug.
- [Pass] Không đổi hành vi ngoài URL routing (giỏ hàng, wishlist, filter, pagination vẫn như cũ).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro:
  - Sweep lớn dễ sót một số component dynamic/variant style.
  - Có thể thiếu `categorySlug` ở vài data shape cũ.
- Rollback:
  - Giữ commit atomic theo đợt (page core trước, shared components sau).
  - Nếu lỗi diện rộng: revert commit sweep để quay về behavior cũ nhanh.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi schema Convex/table/index.
- Không thêm tính năng IA mới, không đổi UI setting `/system/ia`.
- Không tối ưu SEO/canonical ngoài phần link click đang lỗi.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity chính; scope đã chốt theo yêu cầu: sweep products/posts/services toàn site theo IA mode.
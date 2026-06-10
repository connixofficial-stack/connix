## TL;DR kiểu Feynman
- Repo `ktec` sau first commit chỉ hơn repo hiện tại 3 phần đáng port: Speed Insights, cache public settings, và revalidate SEO khi đổi domain.
- 2 phần đầu là perf/observability, ít đụng business logic.
- Phần SEO revalidate có giá trị rõ, nhưng không nên bê nguyên cách dùng `NEXT_PUBLIC_*` vì lộ secret phía client.
- Theo lựa chọn của bạn, kế hoạch sẽ đi nhanh tối đa, làm đủ cả 3, nhưng phần revalidate sẽ đổi sang server-side only.
- Port nên theo thứ tự: observability nhỏ → cache fetch settings → wiring revalidate domain change.

## Audit Summary
### Observation
- `ktec` first commit: `f193b0c first commit` được xem là baseline theo yêu cầu của bạn.
- Các commit sau baseline đáng chú ý:
  - `4066c94 fix: revalidate seo after domain change`
  - `d810de3 feat: add speed insights for public site`
  - `6cc028b perf: cache public settings fetch`
  - `418e008 fix: allow npm legacy peer deps`
  - `b54ea62 build(deps): upgrade @vercel/speed-insights 1.2.0 → 2.0.0`
- Đối chiếu file cho thấy `ktec` hơn repo hiện tại ở các điểm sau:
  1. `app/(site)/layout.tsx`: có render `<SpeedInsights />`.
  2. `lib/get-settings.ts`: gom fetch public settings bằng `cache()` + `getPublicSettings()`.
  3. `lib/modules/hooks/useModuleConfig.ts`: khi `site_url` đổi thì trigger SEO revalidate.
  4. `.npmrc`: có `legacy-peer-deps=true`.
- Repo hiện tại đã có route `app/api/internal/seo/revalidate/route.ts`, nên nền revalidate server đã sẵn.

### Inference
- Chênh lệch chức năng thực sự nằm ở 3 nhóm chính:
  1. Observability/perf đo tốc độ public site.
  2. Tối ưu số lần gọi settings public.
  3. Đồng bộ SEO artifacts khi domain đổi.
- `.npmrc` không phải feature người dùng cuối; chỉ là hỗ trợ môi trường cài package, có thể xem là optional.

### Decision
- Port toàn bộ 3 nhóm chính.
- Không bê nguyên flow revalidate của `ktec`; thay bằng server-side only như bạn chọn để tránh lộ secret public env.
- `.npmrc` không đưa vào đợt port chính trừ khi lúc cài dependency thực sự phát sinh peer-deps conflict.

## Root Cause Confidence
**High** — Evidence trực tiếp từ diff file giữa 2 repo cho thấy chênh lệch nằm đúng ở 3 khu vực nêu trên; route revalidate đã tồn tại ở repo hiện tại nên đây là bài toán wiring/tối ưu, không phải thiết kế mới. Điểm chưa tuyệt đối chỉ là baseline first commit chưa được full diff 1-1, nhưng không ảnh hưởng kết luận về các commit mới hơn vì chênh lệch hiện tại đã quan sát được trực tiếp ở file đích.

## Files Impacted
### UI / layout
- `Sửa: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\(site)\layout.tsx`
  - Vai trò hiện tại: dựng metadata, schema và shell cho public site, đang fetch settings theo 4 hàm riêng.
  - Thay đổi: chuyển sang dùng `getPublicSettings()` để giảm fetch lặp, đồng thời gắn `SpeedInsights` vào cuối layout.

### Shared settings / perf
- `Sửa: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\lib\get-settings.ts`
  - Vai trò hiện tại: cung cấp các hàm đọc settings public theo từng nhóm, mỗi hàm tự query Convex.
  - Thay đổi: thêm lớp normalize dùng chung + `cache()` + `getPublicSettings()` để gom query một lần rồi fan-out lại cho các hàm hiện có.

### Module config / SEO sync
- `Sửa: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\lib\modules\hooks\useModuleConfig.ts`
  - Vai trò hiện tại: quản lý local state, detect thay đổi và batch save cấu hình module.
  - Thay đổi: phát hiện `site_url` đổi trong module `settings` và gọi một server-side revalidate flow sau khi save thành công.

### Server route / action layer
- `Sửa hoặc Thêm: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\api\internal\seo\revalidate\route.ts` hoặc một server action/helper gần đó`
  - Vai trò hiện tại: nhận request với secret header và revalidate các SEO paths.
  - Thay đổi: giữ route hiện tại nếu còn phù hợp, nhưng wiring từ UI phải chuyển sang server-side only; có thể cần helper/action nội bộ để tránh đưa secret ra client.

### Dependencies
- `Sửa: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\package.json`
  - Vai trò hiện tại: khai báo dependencies cho app.
  - Thay đổi: thêm `@vercel/speed-insights` tương thích với stack hiện tại.

- `Cân nhắc thêm: E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\.npmrc`
  - Vai trò hiện tại: chưa có.
  - Thay đổi: chỉ thêm nếu cần xử lý peer dependency conflict khi cài package; không bắt buộc cho feature port.

## Execution Preview
1. Đọc lại các điểm wiring liên quan settings/layout/revalidate để chốt vị trí cấy thay đổi nhỏ nhất.
2. Refactor `lib/get-settings.ts` sang pattern cached aggregate nhưng giữ nguyên public API cũ để giảm blast radius.
3. Cập nhật `app/(site)/layout.tsx` sang `getPublicSettings()` và gắn `SpeedInsights`.
4. Bổ sung dependency `@vercel/speed-insights`.
5. Thiết kế lại flow revalidate domain change theo server-side only:
   - detect `site_url` changed trong `useModuleConfig`
   - gọi một server-side surface an toàn
   - server mới đọc secret/revalidate, client không thấy secret.
6. Review tĩnh toàn bộ typing, null-safety, và backward compatibility.
7. Nếu bạn xác nhận cho implement, sau khi code xong mình sẽ commit local theo rule của repo.

## Proposal chi tiết theo đợt port
### Đợt 1 — Speed Insights
- Mục tiêu: thêm observability cho public site.
- Cách làm: cài `@vercel/speed-insights`, import `SpeedInsights` trong `app/(site)/layout.tsx`, render một lần ở root public layout.
- Rủi ro: thấp, chủ yếu dependency/runtime wrapper.

### Đợt 2 — Cache public settings
- Mục tiêu: giảm số query Convex lặp lại khi render metadata/layout public.
- Cách làm:
  - thêm `cache` từ `react`
  - tạo `getSettingsByKeys(keys)` cached
  - tạo `getPublicSettings()` trả về `{ site, seo, contact, social }`
  - giữ `getSiteSettings/getSEOSettings/getContactSettings/getSocialSettings` bằng cách đọc từ `getPublicSettings()` để không phá caller cũ.
- Rủi ro: thấp-trung bình; cần giữ đúng shape dữ liệu hiện tại.

### Đợt 3 — SEO revalidate khi đổi domain
- Mục tiêu: sau khi user đổi `settings.site_url`, robots/sitemap được revalidate ngay.
- Cách làm được recommend:
  - vẫn detect `hasSiteUrlChanged` trong `useModuleConfig` sau khi save thành công.
  - thay vì fetch route kèm public secret từ client, tạo server-side surface an toàn.
  - surface này sẽ đọc secret từ env server và gọi logic revalidate nội bộ.
- Tradeoff:
  - hơn `ktec` ở bảo mật.
  - cần thêm một bước wiring server-side nên phức tạp hơn chút.
- Confidence: Medium-High vì route revalidate đã có sẵn, chỉ còn vấn đề chọn surface gọi an toàn.

## Acceptance Criteria
- Public site root layout có Speed Insights hoạt động mà không phá render hiện tại.
- `generateMetadata` và `SiteLayout` không còn gọi 4 query settings riêng lẻ cho cùng một request path khi có thể dùng aggregate cached settings.
- Khi lưu module `settings` và `site_url` thay đổi, flow server-side trigger revalidate SEO artifacts thành công.
- Client code không cần đọc hoặc gửi `NEXT_PUBLIC_SEO_REVALIDATE_SECRET`.
- Các type trong `lib/get-settings.ts` và `useModuleConfig.ts` vẫn đúng, không làm đổi contract dữ liệu cũ.

## Verification Plan
- Static review bắt buộc:
  - kiểm tra type flow của `PublicSettings`, các normalize functions và các caller cũ.
  - kiểm tra `useModuleConfig` không tạo side effect lặp hoặc double-trigger khi save.
  - kiểm tra route/server helper chỉ dùng server env, không rò secret sang client.
- Typecheck sau khi implement: `bunx tsc --noEmit`.
- Repro logic cần tester/runtime xác nhận:
  1. đổi `site_url` trong settings.
  2. bấm lưu.
  3. xác nhận revalidate surface chạy và không cần secret ở client.
  4. mở public site để xác nhận layout vẫn render và analytics wrapper không lỗi.

## Out of Scope
- Không port các file `.factory/docs` từ `ktec`.
- Không mở rộng thêm SEO features ngoài revalidate domain change.
- Không refactor sâu các consumer khác của settings nếu không cần cho đợt port này.
- Không thêm `.npmrc` nếu chưa có evidence về peer-deps conflict thực tế.

## Risk / Rollback
- Risk chính: thay đổi flow đọc settings có thể ảnh hưởng metadata/layout nếu normalize lệch shape cũ.
- Risk phụ: wiring revalidate server-side nếu đặt sai surface có thể không được trigger sau save.
- Rollback:
  1. revert `layout.tsx` về 4 getter cũ.
  2. revert `lib/get-settings.ts` về pattern query riêng.
  3. bỏ flow revalidate mới, giữ nguyên route hiện tại.
  4. gỡ `@vercel/speed-insights` nếu cần.

## Open Questions
- Không còn ambiguity lớn cho scope hiện tại; đủ để implement ngay sau khi bạn duyệt spec này.
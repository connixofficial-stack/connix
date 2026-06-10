## TL;DR kiểu Feynman
- Frontend đang gọi một query Convex mới, nhưng môi trường Convex hiện tại chưa publish query đó.
- Vì `api._generated` cũng chưa có function reference tương ứng, site bị crash ngay khi render hero.
- Fix an toàn nhất là thêm guard/fallback: nếu query mới chưa sẵn sàng thì frontend tự quay về payload cũ, không crash.
- Sau đó vẫn giữ đường nâng cấp: khi Convex được regenerate/deploy, frontend tự dùng query mới trở lại.
- Mục tiêu là vừa hết lỗi runtime ngay, vừa không khóa hướng logic tree/product fallback đã làm trước đó.

## Audit Summary
### Observation
- Runtime error báo rõ: `Could not find public function for 'productCategories:listActiveWithStatsForHero'`. Evidence: stack trace user cung cấp tại `HomepageCategoryHeroSection (components/site/HomepageCategoryHeroSection.tsx:201:31)`.
- File Convex source `convex/productCategories.ts` hiện có khai báo `export const listActiveWithStatsForHero = query(...)`. Evidence: `convex/productCategories.ts`.
- Nhưng file generated API hiện tại `convex/_generated/api.d.ts` chưa chứa function reference mới này, nghĩa là codegen/runtime Convex environment chưa được cập nhật. Evidence: `convex/_generated/api.d.ts` chỉ import module `productCategories` tổng quát, nhưng function mới chưa được generate ra usable public reference trong client build hiện tại.
- Frontend site đang gọi trực tiếp `api.productCategories.listActiveWithStatsForHero` trong `HomepageCategoryHeroSection.tsx`, nên chỉ cần environment chưa sync là sẽ crash ngay. Evidence: `components/site/HomepageCategoryHeroSection.tsx:199-207`.
- User đã chọn hướng fix: **Thêm guard fallback an toàn**.

### Root cause answers (theo protocol)
1. Triệu chứng: trang site crash khi render Homepage Category Hero, thay vì degrade gracefully.
2. Phạm vi: runtime site của homepage hero; có thể ảnh hưởng preview/runtime khác nếu cũng gọi query mới trực tiếp.
3. Tái hiện tối thiểu: chạy frontend với code mới nhưng Convex dev/deploy chưa regenerate public API/query mới.
4. Mốc thay đổi gần nhất: frontend đã chuyển sang dùng query mới `listActiveWithStatsForHero`, nhưng môi trường Convex chưa đồng bộ.
5. Dữ liệu còn thiếu: trạng thái thật của `npx convex dev`/deploy ở máy hiện tại; nhưng evidence hiện tại đủ để kết luận bug integration.
6. Giả thuyết thay thế chưa loại trừ hoàn toàn: có thể query đã tồn tại trong source nhưng Convex server đang chạy process cũ; tuy nhiên với user requirement “guard fallback an toàn”, ta không cần phụ thuộc vào việc chẩn đoán process nào đang stale để chốt fix.
7. Rủi ro fix sai nguyên nhân: nếu chỉ nhắc chạy Convex mà không thêm guard, lỗi sẽ tái phát mỗi khi code frontend đi trước backend generation.
8. Tiêu chí pass/fail: khi query mới chưa có, site không crash; hero vẫn render theo fallback cũ; khi query mới có, logic mới tự hoạt động.

## Root Cause Confidence
**High** — Source code có query mới, nhưng generated/public API và runtime environment chưa đồng bộ; frontend lại gọi thẳng function mới không có guard. Đây giải thích trực tiếp lỗi user thấy.

## Counter-Hypothesis
- **Medium**: Có thể chỉ cần chạy `npx convex dev` là xong. Đúng cho môi trường local ngay lúc này, nhưng không giải quyết độ bền của code khi frontend/backend lệch version hoặc khi deploy nửa chừng.
- **Low**: Có thể query name sai. Evidence hiện tại cho thấy tên source và runtime error khớp nhau, nên không phải typo chính.

## Proposal
### Option A (Recommend) — Confidence 92%
Thêm guard fallback an toàn ở frontend/hook/runtime:
1. Không phụ thuộc tuyệt đối vào `api.productCategories.listActiveWithStatsForHero` trong runtime path.
2. Tách logic lấy payload hero thành hai lớp:
   - **Preferred**: query mới `listActiveWithStatsForHero` khi available.
   - **Fallback**: query cũ `listActiveWithStats` + `listActive` + behavior degrade an toàn.
3. Tránh reference cứng gây crash nếu generated API chưa có function mới.
4. Khi Convex được regenerate/deploy xong, app tự quay lại dùng query mới mà không cần sửa thêm.

### Option B — Confidence 58%
Chỉ thêm thông báo yêu cầu chạy lại `npx convex dev`/deploy, không sửa code guard.

**Khi nào phù hợp:** nội bộ team dev-only, chấp nhận crash nếu environment chưa sync. Không recommend vì user đã chọn fallback an toàn.

## Files Impacted
### UI / runtime
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: gọi trực tiếp query hero mới.
  - Thay đổi: thêm strategy fallback để không crash khi query mới chưa available; nếu không có payload mới thì dùng data/query cũ và degrade behavior.

### Shared hook / admin runtime
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`
  - Vai trò hiện tại: hook admin cũng đang dùng query mới.
  - Thay đổi: cùng strategy fallback an toàn để create/edit không phụ thuộc cứng vào query mới.

### Shared generator / adapter
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts` hoặc thêm adapter nhỏ gần hook/runtime
  - Vai trò hiện tại: nhận payload already-normalized từ query mới.
  - Thay đổi: cho phép chạy với payload fallback ít dữ liệu hơn, ví dụ không có `productsByCategory` thì degrade sang category-only/group-less hoặc tree cũ.

### Server / docs state
- `Không bắt buộc sửa thêm: convex/productCategories.ts`
  - Query mới đã tồn tại ở source; bug chính hiện tại là missing runtime sync + thiếu guard.

- `Không bắt buộc nhưng nên lưu ý: convex/_generated/api.d.ts`
  - Đây là generated file, không sửa tay. Sau khi implement guard, tester/dev vẫn cần regenerate Convex để dùng full logic mới.

## Execution Preview
1. Đọc nơi nào đang reference trực tiếp `api.productCategories.listActiveWithStatsForHero`.
2. Thiết kế guard để code không chạm function reference mới nếu generated API/environment chưa sync.
3. Ở runtime site, fallback sang query cũ `listActiveWithStats` hoặc `listActive` và disable phần product-fallback nâng cao khi thiếu payload.
4. Ở admin hook, áp dụng cùng guard để form create/edit không crash.
5. Static review typing, tránh import/reference gây compile/runtime issue.
6. Chạy `bunx tsc --noEmit` sau khi implement.
7. Commit local kèm `.factory/docs`.

## Thiết kế fix cụ thể
### 1) Nguyên tắc guard
Không để path render chính phụ thuộc vào function reference mới chưa được generate.

### 2) Cách implement an toàn nhất
**Khuyến nghị:** tránh gọi trực tiếp `api.productCategories.listActiveWithStatsForHero` trong component nếu generated API có thể chưa sync.

Có 2 hướng kỹ thuật khả thi:

#### Hướng 1 (Recommend): feature flag bằng generated-safe fallback
- Tạm thời runtime/site và hook admin quay về dùng `listActiveWithStats` làm nguồn chính an toàn.
- Nếu cần product fallback nâng cao, chỉ bật khi query mới đã sẵn sàng sau một bước sync khác hoặc qua cờ runtime riêng.
- Ưu điểm: chắc chắn không crash.
- Tradeoff: tạm giảm một phần behavior mới cho tới khi Convex sync hoàn tất.

#### Hướng 2: dynamic resilient adapter
- Dùng một lớp adapter kiểm tra availability của function reference theo cách không làm bundler/runtime resolve ngay path mới.
- Chỉ gọi query mới khi reference thực sự tồn tại.
- Tradeoff: phức tạp hơn, dễ mắc lỗi typing hơn trong codebase hiện tại.

Với yêu cầu “fix an toàn”, tôi recommend **Hướng 1** trước.

### 3) Hành vi degrade mong muốn
Khi query mới chưa available:
- Site không crash.
- Hero vẫn render bằng categories + stats cũ.
- `hideEmptyCategories` vẫn hoạt động ở mức cũ hoặc aggregate nội bộ nếu đủ data.
- Product fallback thật có thể tạm không đầy đủ cho tới khi Convex sync, nhưng UI phải usable.

### 4) Sau khi Convex sync xong
- Có thể chuyển lại path ưu tiên sang query mới.
- Hoặc giữ code fallback lâu dài để future deploy mismatch không làm site chết nữa.

## Acceptance Criteria
- Nếu Convex environment chưa có `listActiveWithStatsForHero`, homepage không crash.
- Homepage Category Hero vẫn render theo fallback an toàn.
- Admin create/edit của hero cũng không crash vì missing query mới.
- Khi môi trường Convex đã sync đầy đủ, app vẫn hỗ trợ dùng logic mới mà không cần rollback lớn.
- Không sửa generated files bằng tay.

## Out of Scope
- Tự chạy `npx convex dev`/deploy trong task spec này.
- Refactor toàn bộ hạ tầng release/sync của Convex.
- Đảm bảo product fallback 100% feature-complete trong chế độ fallback tạm thời nếu query mới chưa sync.

## Risk / Rollback
- Risk thấp đến trung bình: thay đổi chủ yếu ở runtime query strategy.
- Rollback đơn giản: revert adapter/guard, nhưng không recommend vì sẽ quay lại trạng thái crash khi environment lệch sync.

## Verification Plan
- Static review:
  - đảm bảo không còn reference runtime bắt buộc tới query mới trong path fallback;
  - đảm bảo types của payload cũ/mới cùng đi qua generator mà không null-crash.
- Typecheck:
  - chạy `bunx tsc --noEmit` sau khi implement.
- Repro plan cho tester:
  1. Giữ environment Convex chưa sync query mới, mở homepage và admin hero.
  2. Verify không crash, hero vẫn render.
  3. Sau khi sync Convex, verify behavior mới hoạt động lại.

## Open Questions
- Không còn ambiguity lớn vì user đã chọn rõ chiến lược `Thêm guard fallback an toàn`.
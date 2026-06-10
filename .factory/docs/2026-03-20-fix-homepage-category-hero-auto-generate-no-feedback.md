## TL;DR kiểu Feynman
- Nút `Sinh ngay` đang gọi hàm sinh menu, nhưng nếu dữ liệu Convex chưa về thì hàm trả `null` và màn hình không đổi.
- Vì không có loading/disable/toast trong nhánh này, người dùng cảm giác nút bị hỏng.
- Fix nhỏ nhất là: biết lúc nào dữ liệu chưa sẵn sàng, khóa nút hoặc báo rõ lý do, và báo khi sinh ra 0 mục.
- Logic sinh menu hiện tại không sai rõ ràng; vấn đề chính là thiếu trạng thái và feedback ở UI edit.
- Phạm vi sửa nhỏ, chủ yếu ở hook auto-generate, page edit, và form hiển thị nút.

## Audit Summary
### Observation
- Route user báo lỗi map tới file `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`.
- `handleAutoGenerate()` chỉ gọi `generateFromRealData({ hideEmptyCategories })`, rồi `return` ngay nếu falsy. Evidence: `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx:210-213`.
- Trong hook, `generateFromRealData()` trả `null` khi `categoriesPayload` chưa sẵn sàng. Evidence: `app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts:29-34`.
- Nút `Sinh ngay` luôn clickable, không disabled/loading, và không có toast trong case dữ liệu chưa sẵn sàng. Evidence: `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx:178-179`.
- Query dữ liệu thật lấy từ `api.productCategories.listActiveWithStats`; nếu không có category active thì trả `{ categories: [], stats: [] }`, nếu có category nhưng chưa có product active thì stats có thể rỗng. Evidence: `convex/productCategories.ts:109-164`.
- Auto-generator vẫn có thể sinh summary `Sinh 0 danh mục...` nếu đầu vào hợp lệ nhưng không chọn được mục nào. Evidence: `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts` phần `buildSummary` và `result.push` chỉ khi có groups.

### Root cause answers (theo protocol)
1. Triệu chứng: bấm `Sinh nhanh từ dữ liệu thật` nhưng UI không đổi; expected là danh sách menu được sinh hoặc có thông báo rõ ràng.
2. Phạm vi: trang edit của home-component `homepage-category-hero`; không thấy evidence ảnh hưởng các home-component khác.
3. Tái hiện tối thiểu: mở trang edit và bấm sớm trước khi query `listActiveWithStats` resolve, hoặc khi query resolve nhưng không sinh được item nào.
4. Mốc thay đổi gần nhất: chưa audit sâu git history file-level trong spec này, nhưng code hiện tại cho thấy nhánh early return không có feedback.
5. Dữ liệu còn thiếu: runtime state thực tế của `categoriesPayload` lúc user bấm; số category active / product active trong DB ở môi trường local.
6. Giả thuyết thay thế chưa loại trừ hoàn toàn: (a) dữ liệu thật rỗng nên generator chạy nhưng kết quả 0; (b) kết quả mới trùng state cũ nên user tưởng không chạy; (c) query Convex lỗi runtime. Tuy vậy, thiếu feedback vẫn là bug UX chắc chắn theo code evidence.
7. Rủi ro fix sai nguyên nhân: nếu chỉ sửa UI feedback mà backend query có lỗi riêng, user sẽ thấy thông báo tốt hơn nhưng vẫn chưa có dữ liệu; tuy nhiên đây vẫn là cải thiện an toàn và rollback dễ.
8. Tiêu chí pass/fail: khi data chưa sẵn sàng phải có disabled/loading/toast; khi data rỗng phải có thông báo rõ; khi data hợp lệ phải thấy `categoryItems` hoặc summary thay đổi.

## Root Cause Confidence
**High** — Có evidence trực tiếp rằng nhánh `!categoriesPayload` trả `null` và page `return` im lặng, trong khi nút không biểu lộ trạng thái loading/không sẵn sàng. Đây đủ giải thích case “ấn nút chả có gì cả”.

## Counter-Hypothesis
- **Medium**: DB local không có `productCategories` active hoặc không có `products` status `Active`, nên generator ra 0 mục. Dù vậy, UI hiện vẫn thiếu feedback nên user experience vẫn lỗi.
- **Low/Medium**: query Convex đang fail ở runtime. Chưa có log/error evidence trong spec mode.

## Proposal
### Files Impacted
#### UI
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit, nối hook auto-generate với form và preview.
  - Thay đổi: lấy thêm trạng thái readiness/loading từ hook; trong `handleAutoGenerate` thêm toast cho các case `data chưa sẵn sàng` và `sinh 0 mục`; chỉ update `categoryItems` khi có kết quả hợp lệ.

- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: render UI form và nút `Sinh ngay`.
  - Thay đổi: nhận props trạng thái auto-generate (`isReady`, `isLoading`, có thể thêm `generateDisabledReason`); disable nút khi chưa sẵn sàng hoặc đang load; nếu cần đổi label sang `Đang tải dữ liệu...`/`Sinh ngay` để giảm mơ hồ.

#### Shared/UI logic
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`
  - Vai trò hiện tại: query dữ liệu category/stats và expose hàm `generateFromRealData`.
  - Thay đổi: expose rõ trạng thái query như `isCategoriesReady`, `hasCategoriesData`, `canAutoGenerate`; có thể trả thêm result metadata phân biệt `not_ready` / `empty_result` / `success` thay vì chỉ `null | items` để page xử lý toast chính xác.

#### Server
- `Không bắt buộc sửa: convex/productCategories.ts`
  - Vai trò hiện tại: trả category active + stats từ product active.
  - Thay đổi dự kiến: chưa cần sửa ở bước fix nhỏ nhất vì chưa có evidence query sai logic.

### Execution Preview
1. Đọc hook auto-generate và chuẩn hóa contract trả về để phân biệt `chưa sẵn sàng` với `sinh xong nhưng rỗng`.
2. Cập nhật `page.tsx` để xử lý từng case bằng toast + chỉ set state khi có categories mới.
3. Cập nhật `HomepageCategoryHeroForm` để disable/loading cho nút `Sinh ngay` theo đúng contract mới.
4. Review tĩnh lại typing, nhánh null, backward compatibility với summary/meta hiện có.

### Chi tiết fix đề xuất
**Option A (Recommend)** — Confidence 90%
- Giữ nguyên generator/backend.
- Mở rộng hook để expose trạng thái sẵn sàng (`isLoading`/`isReady`) và kết quả có nghĩa (`success`, `not_ready`, `empty_result`).
- Page dùng `toast.info/error` cho case chưa sẵn sàng hoặc không có dữ liệu hợp lệ.
- Form disable nút khi dữ liệu chưa sẵn sàng.
- Lý do recommend: thay đổi nhỏ nhất, đúng root cause theo evidence, ít rủi ro, không động vào server logic.

**Option B** — Confidence 65%
- Chỉ thêm toast trong `handleAutoGenerate` nếu `generated` falsy và disable nút dựa trên `categoriesData.length === 0`.
- Tradeoff: đơn giản hơn nhưng không phân biệt được `loading` với `thật sự không có category`, nên UX kém chính xác hơn.

## Acceptance Criteria
- Khi vừa mở trang edit và query chưa xong, nút `Sinh ngay` không còn cho cảm giác bấm vô tác dụng: hoặc bị disable, hoặc hiện loading rõ ràng.
- Khi query chưa sẵn sàng mà vẫn trigger được flow, user nhận được thông báo `Dữ liệu chưa sẵn sàng` thay vì im lặng.
- Khi dữ liệu trả về nhưng không sinh được menu nào, user nhận được thông báo rõ ràng kiểu `Không có danh mục/sản phẩm phù hợp để sinh menu`.
- Khi dữ liệu hợp lệ, bấm nút sẽ cập nhật `categoryItems` và summary/meta phản ánh kết quả mới.
- Không làm thay đổi logic lưu form ngoài phạm vi auto-generate UX/state.

## Out of Scope
- Đổi thuật toán chọn category/group/link trong `autoGenerateHomepageCategoryHeroMenu`.
- Tối ưu query Convex hoặc thêm logging server-side.
- Sửa các home-component khác.

## Risk / Rollback
- Risk thấp: chủ yếu thêm state/feedback ở client, không đụng schema/data.
- Rollback đơn giản: revert 3 file UI/hook nếu phát sinh side effect.

## Verification Plan
- Static review: kiểm tra type contract mới giữa hook → page → form, tránh breaking props và nhánh `undefined/null`.
- Repro plan cho tester: 
  1. Mở route edit vừa load xong, thử bấm ngay.
  2. Chờ data sẵn sàng, bấm lại.
  3. Kiểm tra case DB không có product active/category hợp lệ.
  4. Kiểm tra case có data thật thì menu/summary thay đổi.
- Theo repo rules: chỉ chạy `bunx tsc --noEmit` sau khi user duyệt spec và sau khi có thay đổi code TS; không chạy lint/test/build.
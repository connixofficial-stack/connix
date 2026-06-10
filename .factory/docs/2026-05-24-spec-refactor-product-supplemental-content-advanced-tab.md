# I. Primer

## 1. TL;DR kiểu Feynman

- Hiện “Mẫu nội dung dùng chung (Hàng loạt)” đang làm quá nhiều việc: nhiều template, chọn sản phẩm, chọn danh mục, FAQ, chống trùng phạm vi.
- Hướng mới: biến nó thành **một khối nội dung dùng chung toàn cục** cho tất cả sản phẩm đang `Active`, chỉ gồm 2 vùng: nội dung **trên** mô tả và nội dung **dưới** mô tả.
- UI quản trị sẽ không còn route riêng `/admin/settings/product-supplemental-content`; chuyển vào tab trong `/admin/settings/advanced`.
- Nếu bật cả nội dung theo danh mục, thứ tự dưới mô tả phải là: `Nội dung nối đuôi chi tiết sản phẩm` của danh mục trước, rồi `Nội dung cuối mô tả sản phẩm` của template ở cuối cùng.

## 2. Elaboration & Self-Explanation

Chức năng hiện tại giống một mini rule-engine (bộ máy luật nhỏ): admin phải tạo template, chọn trạng thái, chọn áp dụng theo sản phẩm hoặc danh mục, chọn nhiều record, thêm FAQ, backend còn phải kiểm tra xung đột template. Với nhu cầu mới, toàn bộ phần “áp dụng theo đâu” không còn cần thiết vì chỉ còn một luật: bật feature thì áp dụng cho tất cả sản phẩm đang active.

Vì vậy refactor đúng hướng là giảm bề mặt cấu hình, không thêm option mới. Admin chỉ cần vào `Cài đặt > Nâng cao > Nội dung mô tả sản phẩm`, nhập 2 rich text: nội dung đầu mô tả và nội dung cuối mô tả. Vì chức năng này còn mới/thử nghiệm và chưa dùng nhiều, spec chọn hướng **clean break (cắt legacy dứt khoát)**: xóa assignment/category/product/FAQ khỏi schema/API/UI thay vì giữ các field cũ làm hệ thống dơ dần.

Quan trọng nhất ở frontend site là thứ tự render. Nội dung theo danh mục (`productDetailSuffixContent`) mang nghĩa “nối đuôi chi tiết sản phẩm”, nên nó phải nằm ngay sau mô tả/ảnh chi tiết. Nội dung dùng chung của template (`postContent`) mang nghĩa “cuối mô tả sản phẩm”, nên nếu cả hai cùng bật thì `postContent` phải là block cuối cùng.

## 3. Concrete Examples & Analogies

- Ví dụ cụ thể: sản phẩm `Giày Sneaker A` có mô tả riêng. Danh mục `Sneaker` có “Cam kết chọn size / đổi trả”. Template dùng chung có “Chính sách vận chuyển toàn shop”. Thứ tự hiển thị đúng là: nội dung đầu template → mô tả giày → ảnh chi tiết → cam kết danh mục → chính sách vận chuyển toàn shop.
- Analogy đời thường: mô tả sản phẩm là bài viết chính, nội dung danh mục là đoạn tái bút theo nhóm sản phẩm, còn template dùng chung là footer chung của mọi bài. Footer chung phải nằm cuối cùng.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Observation (Quan sát có evidence)

- `lib/modules/configs/products.config.ts` đang có group `supplementalContent` với toggle `enableProductSupplementalContent`, select `supplementalContentAssignmentMode`, select `supplementalContentConflictMode`, label group `Mẫu nội dung dùng chung (Hàng loạt)`.
- `app/admin/settings/product-supplemental-content/page.tsx` là route admin riêng, guard bằng setting `enableProductSupplementalContent`, tắt thì redirect về `/admin/settings/general`.
- `app/admin/components/Sidebar.tsx` thêm subitem riêng `/admin/settings/product-supplemental-content` khi feature bật.
- `app/admin/settings/_components/SettingsPageShell.tsx` đã có section `advanced` với các tab hiện tại: `product-placeholder`, `product-frame`, `watermark`, `header`.
- `app/admin/settings/_components/ProductSupplementalContentManager.tsx` hiện quản lý nhiều template, có `name`, `status`, `assignmentMode`, chọn `productIds/categoryIds`, `preContent`, `faqItems`, `postContent`.
- `convex/schema.ts` table `productSupplementalContents` hiện có `name`, `status`, `assignmentMode`, `productIds`, `categoryIds`, `preContent`, `postContent`, `faqItems`; đây là shape cũ cần dọn sạch.
- `convex/productSupplementalContents.ts` hiện có logic `sanitizePayload`, `ensureNoEffectiveOverlap`, `buildTemplateProductSet`, `createTemplate`, `updateTemplate`, `removeTemplate`, `getEffectiveByProduct`.
- `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` đã render thứ tự đúng ở 3 layout chính: `preContent` → mô tả sản phẩm → ảnh mô tả → `category.productDetailSuffixContent` → `postContent`.

## 2. Inference (Suy luận)

- Root complexity đến từ assignment + multi-template + conflict prevention, trong khi requirement mới chỉ cần global singleton (một cấu hình toàn cục).
- Route riêng trong settings làm sidebar dài hơn và làm feature trông như module riêng, không đúng mức độ quan trọng mới.
- Render order “category suffix trước template post” hiện đang đúng, nhưng bị lặp ở nhiều block layout nên cần chuẩn hóa để tránh lệch sau này.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Evidence nằm trực tiếp ở các file audit: UI và Convex đang model hóa nhiều template có phạm vi áp dụng, trong khi yêu cầu hiện tại là một template toàn cục chỉ có hai vùng rich text.

## 2. Trả lời câu hỏi root cause bắt buộc

1. Triệu chứng quan sát được: expected là cấu hình đơn giản trong `/admin/settings/advanced`; actual là route riêng và form nhiều section/luật áp dụng.
2. Phạm vi ảnh hưởng: Products system config, Admin settings, Convex table/functions, Product detail runtime.
3. Tái hiện ổn định: bật `enableProductSupplementalContent` ở `/system/modules/products`, sidebar admin sẽ hiện `/admin/settings/product-supplemental-content` và form nhiều template.
4. Mốc thay đổi gần nhất: các spec cũ trong `.factory/docs` cho thấy chức năng từng được mở rộng qua nhiều bước như CRUD/delete/collapse/refactor supplemental content.
5. Dữ liệu thiếu: chưa audit dữ liệu production hiện có bao nhiêu template cũ; tuy nhiên user xác nhận chức năng mới thử nghiệm/chưa dùng nhiều, nên chấp nhận clean break và không giữ legacy.
6. Giả thuyết thay thế: có thể vấn đề chỉ là UI xấu, không phải data model. Nhưng requirement mới bỏ chọn sản phẩm/danh mục/FAQ nên data/API cũng cần đơn giản hóa behavior.
7. Rủi ro nếu fix sai nguyên nhân: chỉ chuyển route nhưng giữ multi-template thì vẫn phức tạp; còn xóa legacy cần được ghi rõ là breaking cleanup có thể mất template thử nghiệm cũ.
8. Tiêu chí pass/fail: pass khi admin chỉ thấy một tab trong advanced với 2 rich text field, site render active products đúng thứ tự; fail nếu còn route/sidebar riêng hoặc còn chọn product/category/FAQ trong UI.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)

- Có thể giữ multi-template và chỉ ẩn bớt UI. Không khuyến nghị vì backend vẫn còn overlap logic, list query, chọn phạm vi và conflict state khó hiểu.
- Có thể giữ field legacy để tránh migration. Không khuyến nghị nữa vì user muốn loại bỏ legacy hoàn toàn và chức năng chưa có dữ liệu quan trọng.

# IV. Proposal (Đề xuất)

## 1. Scope & impacted paths

- System config: `lib/modules/configs/products.config.ts`, `components/modules/ModuleConfigPage.tsx`.
- Admin settings: `app/admin/settings/_components/SettingsPageShell.tsx`, `app/admin/settings/_components/ProductSupplementalContentManager.tsx`, `app/admin/settings/product-supplemental-content/page.tsx`, `app/admin/components/Sidebar.tsx`.
- Convex: `convex/productSupplementalContents.ts`, `convex/schema.ts`, `convex/media.ts`, `convex/migrationBundles.ts`, `lib/migration-bundle/client.ts`.
- Site render: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`, `lib/products/product-supplemental-content.ts`.

## 2. Ordered actions (Thứ tự thực thi)

1. Đổi module config Products:
   - Giữ `enableProductSupplementalContent`.
   - Bỏ `supplementalContentAssignmentMode` và `supplementalContentConflictMode` khỏi UI/system settings.
   - Đổi label/help text group sang nghĩa đơn giản hơn, ví dụ `Nội dung mô tả dùng chung`.
2. Chuyển admin surface:
   - Thêm `AdvancedTab = 'product-supplemental'` trong `SettingsPageShell`.
   - Thêm tab label `Nội dung mô tả SP` trong `/admin/settings/advanced`.
   - Chỉ hiển thị tab này khi `enableProductSupplementalContent === true` (được truy vấn từ `moduleSettings` của module `products` trong `SettingsPageShell`); nếu tắt thì không hiện hoặc hiện callout ngắn dẫn về `/system/modules/products`.
   - `SettingsPageShell` cần đọc query param `tab=product-supplemental` bằng `useSearchParams` và set `advancedTab` nếu tab hợp lệ + feature đang bật, để route cũ redirect đúng vào tab mới thay vì chỉ mở tab mặc định.
   - Bỏ subitem sidebar `/admin/settings/product-supplemental-content`.
   - Route cũ `app/admin/settings/product-supplemental-content/page.tsx` redirect về `/admin/settings/advanced?tab=product-supplemental` bằng `router.replace` ngay khi mount.
3. Đơn giản hóa `ProductSupplementalContentManager`:
   - Bỏ list nhiều templates, nút tạo mới, xóa, chọn sản phẩm, chọn danh mục, FAQ, trạng thái template thủ công, conflict hint.
   - UI chỉ còn 2 card/section: `Nội dung đầu mô tả sản phẩm` và `Nội dung cuối mô tả sản phẩm`.
   - Save bằng sticky footer hiện có.
   - Empty state: nếu chưa có global template thì form vẫn mở sẵn với 2 editor rỗng.
4. Đơn giản hóa Convex API theo hướng clean break, không giữ legacy:
   - Trước khi narrow schema, chạy cleanup dữ liệu cũ cho table `productSupplementalContents`: xóa toàn bộ docs thử nghiệm cũ. Sau deploy schema mới, admin nhập lại nội dung trong tab mới. Đây là bước cố ý để tránh giữ assignment/category/product/FAQ rác.
   - Sửa schema `productSupplementalContents` còn shape tối thiểu: `preContent?: string`, `postContent?: string`, `createdBy?: Id<"users"> | null`, `updatedBy?: Id<"users"> | null`, có thể thêm `updatedAt?: number` nếu project cần hiển thị trạng thái lưu gần nhất.
   - Xóa khỏi schema và types: `name`, `status`, `assignmentMode`, `productIds`, `categoryIds`, `faqItems`, index `by_status`, index `by_assignment_mode`.
   - Thêm query `getGlobalTemplate` chỉ để đọc doc singleton đầu tiên/mới nhất; không tạo dữ liệu trong query.
   - Thêm mutation `upsertGlobalTemplate({ preContent, postContent, updatedBy })`. Mutation này update doc singleton nếu có, hoặc tạo mới nếu chưa có; nếu lỡ có nhiều doc cùng shape mới thì giữ doc mới nhất và xóa các doc còn lại.
   - Xóa `listAll`, `getById`, `createTemplate`, `updateTemplate`, `removeTemplate`, `buildTemplateProductSet`, `ensureNoEffectiveOverlap`, `sanitizeFaqItems` nếu không còn caller.
   - Runtime `getEffectiveByProduct(productId)` phải kiểm tra cấu hình `enableProductSupplementalContent` trong bảng `moduleSettings` của module `products`. Nếu cấu hình này bị tắt, lập tức trả về `null`. Nếu bật và product đang ở trạng thái `Active`, trả về template global.
5. Chuẩn hóa site render order:
   - Giữ thứ tự hiện có: `preContent` → mô tả → ảnh mô tả → category suffix → `postContent`.
   - Thêm class CSS phân tách (`mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800`) cho `postContent` khi hiển thị ở detail page để giao diện rõ ràng, tránh dính liền nội dung khi cả category suffix và template post cùng hiển thị.
   - Bỏ render supplemental FAQ cũ khỏi product detail vì scope mới không còn FAQ bổ sung.
6. Cập nhật media/migration theo shape mới:
   - `convex/media.ts`: chỉ scan `preContent` và `postContent`, xóa scan `faqItems`.
   - Migration bundle: export/import `supplemental-contents.json` theo shape mới `preContent/postContent`; không import/export legacy fields `assignmentMode/productIds/categoryIds/faqItems`.

## 3. Decision (Quyết định đề xuất)

- **Recommend — Confidence 90%:** giữ tên table `productSupplementalContents` để giảm số file phải đổi, nhưng đổi schema/API thành singleton sạch chỉ còn `preContent/postContent`; xóa legacy fields và functions cũ ngay trong bước refactor.
- Chấp nhận breaking cleanup vì user xác nhận chức năng mới thử nghiệm/chưa dùng nhiều. Không thêm default fake như `name: "Global Template"` hay `assignmentMode: "products"` vì đó chính là legacy noise.
- Không khuyến nghị tạo settings key mới cho 2 HTML vì rich text có media/file references và migration bundle hiện đã có đường cho supplemental contents.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / Admin

- Sửa: `app/admin/settings/_components/SettingsPageShell.tsx` — hiện là shell cho các tab advanced; thêm tab `product-supplemental` và mount manager trong `/admin/settings/advanced`. Cần query settings từ module `products` (sử dụng query `api.admin.modules.listModuleSettings`) để lấy toggle `enableProductSupplementalContent`.
- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx` — hiện là CRUD nhiều template; rút gọn thành form singleton chỉ gồm 2 editor và lưu qua mutation `upsertGlobalTemplate` mới, loại bỏ toàn bộ dialog delete, state list template, select combobox, FAQ editor, status/name field.
- Sửa: `app/admin/settings/product-supplemental-content/page.tsx` — hiện render route riêng; đổi thành redirect về `/admin/settings/advanced?tab=product-supplemental` bằng `router.replace` ngay trong component mount.
- Sửa: `app/admin/components/Sidebar.tsx` — hiện thêm menu con route riêng; bỏ subitem `Nội dung bổ sung SP`.

## 2. System / Module config

- Sửa: `lib/modules/configs/products.config.ts` — hiện chứa toggle + 2 select assignment/conflict; chỉ giữ toggle và đổi nhãn group đơn giản hơn.
- Sửa: `components/modules/ModuleConfigPage.tsx` — hiện help text mô tả template hàng loạt/FAQ; cập nhật wording theo global pre/post.

## 3. Convex / Data

- Sửa: `convex/productSupplementalContents.ts` — xóa multi-template/overlap/assignment/FAQ logic; chỉ giữ API singleton (`getGlobalTemplate`, `upsertGlobalTemplate`, `getEffectiveByProduct`) và self-heal nhiều doc cùng shape mới nếu gặp.
- Sửa: `convex/schema.ts` — đổi table `productSupplementalContents` sang shape mới sạch, xóa legacy fields/indexes; yêu cầu cleanup dữ liệu cũ trước khi deploy schema mới để tránh schema validation fail.
- Sửa: `convex/media.ts` — chỉ scan `preContent/postContent`, xóa scan `faqItems`.
- Sửa: `convex/migrationBundles.ts`, `lib/migration-bundle/client.ts` — export/import shape mới; không giữ lại legacy fields.

## 4. Site render / Shared

- Sửa: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` — giữ/chuẩn hóa order category suffix nằm trên template post ở cả 3 layout, thêm spacing CSS (`mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800`) cho `postContent`, bỏ hoàn toàn supplemental FAQ của template.
- Sửa: `lib/products/product-supplemental-content.ts` — bỏ type/helper FAQ nếu không còn caller.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại các API Convex đang được `ProductSupplementalContentManager` và `ProductDetailPage` gọi.
2. Thêm/chạy cleanup dữ liệu cũ cho `productSupplementalContents` trước khi narrow schema.
3. Sửa Convex schema/API để có shape mới sạch và `getGlobalTemplate/upsertGlobalTemplate`, trong đó query chỉ đọc và mutation mới được tạo/update singleton.
4. Refactor manager thành UI 2 editor, không còn list template và assignment.
5. Gắn manager vào tab advanced, hỗ trợ `?tab=product-supplemental`, xóa sidebar route riêng, route cũ redirect.
6. Sửa module config/help text.
7. Chuẩn hóa product detail render order và bỏ FAQ supplemental.
8. Review tĩnh theo edge cases: feature off, chưa có template, product không Active, nhiều doc cùng shape mới cần cleanup còn 1 doc.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Static verification (Agent tự kiểm)

- Kiểm tra TypeScript import/type không còn unused sau khi bỏ FAQ/multi-select.
- Kiểm tra không fetch all products/categories trong manager mới.
- Kiểm tra `getEffectiveByProduct` không trả nội dung cho product không `Active`.
- Kiểm tra schema/API không còn references tới `assignmentMode`, `productIds`, `categoryIds`, `faqItems` trong supplemental flow.
- Kiểm tra 3 layout product detail cùng thứ tự render.

## 2. Runtime verification (Tester chạy)

- Vào `http://localhost:3000/system/modules/products`, bật `Bật mẫu nội dung dùng chung cho sản phẩm`; xác nhận không còn select phạm vi áp dụng/quy tắc conflict.
- Vào `http://localhost:3000/admin/settings/advanced`, thấy tab nội dung mô tả sản phẩm và chỉ có 2 editor.
- Vào `http://localhost:3000/admin/settings/product-supplemental-content`, được redirect về `/admin/settings/advanced?tab=product-supplemental` và tab mới được active thật sự.
- Lưu nội dung trên/dưới, mở chi tiết một sản phẩm `Active`, thấy nội dung hiển thị.
- Bật thêm `Nối nội dung danh mục vào chi tiết sản phẩm`, nhập content danh mục, xác nhận thứ tự: mô tả → nội dung nối đuôi danh mục → nội dung cuối template.

## 3. Gate matrix (Ma trận cổng kiểm)

- Critical: Typecheck `bunx tsc --noEmit 2>&1 | Select-Object -First 10` sau khi có code changes.
- Critical: Admin advanced tab không crash khi feature on/off.
- Critical: Save global content không yêu cầu chọn product/category.
- Critical: Product detail không render supplemental FAQ cũ.
- Non-critical: Route cũ redirect đúng tab nếu query param tab được hỗ trợ.

# VIII. Todo

- [ ] Refactor Products module config, bỏ assignment/conflict setting khỏi UI.
- [ ] Thêm tab `product-supplemental` vào `/admin/settings/advanced`.
- [ ] Rút gọn `ProductSupplementalContentManager` còn 2 rich text editor.
- [ ] Thêm/sửa Convex query + mutation global singleton.
- [ ] Cleanup/xóa dữ liệu thử nghiệm cũ trong `productSupplementalContents` trước khi deploy schema mới.
- [ ] Redirect route cũ và bỏ sidebar subitem riêng.
- [ ] Chuẩn hóa render order ở product detail, bỏ supplemental FAQ.
- [ ] Xóa legacy fields/functions khỏi schema, media scan và migration bundle.
- [ ] Chạy typecheck theo rule dự án sau khi sửa code.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `/system/modules/products` chỉ còn toggle cho mẫu nội dung dùng chung, không còn chọn “Theo sản phẩm/Theo danh mục” và không còn “Quy tắc chống trùng lặp template”.
- `/admin/settings/advanced` có tab quản lý nội dung mô tả sản phẩm.
- `/admin/settings/product-supplemental-content` không còn là surface chính; route cũ redirect an toàn.
- Admin form chỉ có 2 field rich text: nội dung đầu mô tả và nội dung cuối mô tả.
- Nội dung template áp dụng cho tất cả product `Active`; không yêu cầu chọn record.
- Nếu category suffix và template post cùng bật, block cuối cùng luôn là template post.
- Không render supplemental FAQ từ template mới.
- Schema/API supplemental content không còn `name`, `status`, `assignmentMode`, `productIds`, `categoryIds`, `faqItems`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro dữ liệu cũ: template thử nghiệm cũ có thể bị mất do clean break. Mitigation: user đã xác nhận chức năng mới/chưa dùng nhiều; trước khi deploy có thể export DB nếu cần rollback thủ công.
- Rủi ro deploy schema fail nếu còn docs theo shape cũ: mitigation bằng cleanup/xóa toàn bộ docs `productSupplementalContents` trước khi deploy schema mới.
- Rủi ro route cũ/bookmark: mitigation bằng redirect về advanced tab.
- Rủi ro file lớn `ProductDetailPage.tsx`: nếu extract helper quá rộng gây side effect, rollback bằng cách chỉ sửa 3 block render hiện có, giữ diff nhỏ.
- Rollback: revert commit refactor. Nếu đã cleanup dữ liệu thật, rollback dữ liệu chỉ thực hiện được từ backup/export trước deploy.

# XI. Out of Scope (Ngoài phạm vi)

- Không redesign toàn bộ product detail page.
- Không giữ lại assignment/product/category/FAQ cũ của template.
- Không thay đổi category content editor ngoài thứ tự render với template.
- Không đổi cơ chế Lexical upload/media nếu không phát sinh lỗi trực tiếp.

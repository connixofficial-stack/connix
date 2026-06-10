# I. Primer

## 1. TL;DR kiểu Feynman

- Mỗi danh mục sản phẩm đang chỉ có `name`, `slug`, `description` ngắn và vài field cơ bản; chưa có nội dung Lexical riêng cho trang lọc danh mục.
- Trang `/giay-nike` hiện lấy danh mục theo slug rồi render lại list sản phẩm; title đã là tên danh mục, nhưng chưa render subtitle/mô tả bên dưới.
- Cách gọn nhất: để `/system/modules/products` quản 4 toggle hiển thị, còn `/admin/categories/create|edit` quản nội dung từng danh mục.
- Thêm 2 field rich text vào `productCategories`: nội dung cuối trang lọc danh mục và nội dung nối đuôi mô tả chi tiết sản phẩm.
- Với chế độ sản phẩm N-N danh mục, cấu hình chi tiết sản phẩm luôn ăn theo **danh mục chính** là `products.categoryId`, không ăn theo danh mục phụ trên URL.
- FAQ chi tiết sản phẩm do danh mục nắm, render dưới cùng trang chi tiết, nằm dưới sản phẩm liên quan và reuse FAQ home-component hiện có.
- Không tạo bảng mới, không refactor lớn, không bỏ hệ `productSupplementalContents` hiện có.

## 2. Elaboration & Self-Explanation

Hiện flow public có 2 nơi cần chèn nội dung:

1. Trang danh mục như `/giay-nike`:
   - `app/(site)/[categorySlug]/page.tsx` resolve slug bằng `api.ia.resolveUnifiedCategory`.
   - Nếu là product category thì render `ProductsPage`.
   - `ProductsPage` tự đọc `pathname`, match category trong `api.productCategories.listActive`, rồi lọc sản phẩm.
   - Header hiện chỉ render tên danh mục hoặc fallback `Sản phẩm`.

2. Trang chi tiết sản phẩm:
   - Product detail đã có `product.description` dạng rich text.
   - Đã có hệ `productSupplementalContents` để thêm `preContent`/`postContent` theo sản phẩm hoặc danh mục, nhưng nó nằm ở admin settings và phức tạp hơn nhu cầu “cấu hình gọn theo danh mục”.

Quyết định spec: thêm trực tiếp các field tùy chọn vào `productCategories` để admin nhập ngay tại form danh mục, còn system chỉ bật/tắt việc hiển thị. Đây là hướng đơn giản nhất vì dữ liệu đi cùng danh mục, không cần bảng/template/assignment mới.

## 3. Concrete Examples & Analogies

Ví dụ với danh mục `Giày Nike` có slug `giay-nike`:

- `/giay-nike` hiển thị:
  - Title: `Giày Nike`.
  - Subtitle: lấy từ `productCategories.description`, chỉ hiện khi toggle `showCategorySubtitle` bật.
  - Cuối danh sách sản phẩm: render Lexical `filterFooterContent`, chỉ hiện khi toggle `enableCategoryFilterFooterContent` bật.
- `/giay-nike/air-force-1` hiển thị:
  - Mô tả riêng của sản phẩm.
  - Sau đó nối thêm Lexical `productDetailSuffixContent` từ danh mục `Giày Nike`, chỉ hiện khi toggle `enableCategoryProductDetailSuffix` bật.
  - Cuối trang, dưới sản phẩm liên quan, render FAQ riêng của danh mục `Giày Nike`.
  - Nếu sản phẩm có thêm danh mục phụ `Sneaker hot`, phần suffix/FAQ vẫn lấy từ danh mục chính `Giày Nike`.

Analogy: danh mục giống “kệ hàng”. Subtitle là tấm biển nhỏ dưới tên kệ, nội dung cuối trang là bảng tư vấn đặt ở cuối kệ, còn suffix chi tiết sản phẩm là đoạn ghi chú chung dán thêm vào từng sản phẩm trên kệ đó.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Observation (Quan sát)

- `convex/schema.ts` table `productCategories` hiện có `description?: string`, chưa có rich content fields.
- `convex/productCategories.ts` validator `categoryDoc`, `create`, `update`, `getBySlug`, `getById`, `listActive` chỉ trả/nhận `description` hiện tại.
- `lib/modules/runtime-config/index.ts` định nghĩa runtime fields cho `productCategories`; `description` là `textarea`, chưa có richtext cuối trang lọc hoặc suffix chi tiết sản phẩm.
- `lib/modules/configs/products.config.ts` đã có nhóm setting `supplementalContent` và toggle `enableProductSupplementalContent`, nhưng toggle này phục vụ template chi tiết sản phẩm hiện có, không phải content trực tiếp ở category form.
- `app/admin/categories/create/page.tsx`, `app/admin/categories/[id]/edit/page.tsx` và route cũ `app/admin/product-categories/*` đang render `description` bằng `<textarea>`, không dùng `LexicalEditor`.
- `app/(site)/[categorySlug]/_components/ProductsPage.tsx` hiện render title bằng `categoryMap.get(activeCategory)` nhưng chưa render subtitle hoặc footer content.
- `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` đã render `RichContent` cho product description và supplemental `preContent`/`postContent`.
- `convex/lib/multiCategory.ts` cho thấy N-N category dùng `productCategoryAssignments`, nhưng `products.categoryId` vẫn là danh mục chính/canonical.
- `convex/ia.ts::resolveUnifiedDetail` cho phép truy cập detail qua category phụ nhưng trả về primary category từ `product.categoryId`.
- FAQ home-component đã có renderer tốt ở `app/admin/home-components/faq/_components/FaqSectionShared.tsx`, form ở `FaqForm.tsx`, types ở `_types/index.ts`, colors ở `_lib/colors.ts`, và runtime site đang reuse qua `components/site/home/sections/FaqRuntimeSection.tsx`.

## 2. Scope & impacted paths

- Convex data contract: `convex/schema.ts`, `convex/productCategories.ts`.
- System module config: `lib/modules/configs/products.config.ts`, `lib/modules/runtime-config/index.ts`.
- Admin category forms: ưu tiên canonical route `app/admin/categories/create/page.tsx`, `app/admin/categories/[id]/edit/page.tsx`; đồng bộ route cũ `app/admin/product-categories/*` nếu còn được link tới.
- Public category list: `app/(site)/[categorySlug]/_components/ProductsPage.tsx`.
- Public product detail: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`.
- FAQ reuse: `app/admin/home-components/faq/_components/FaqForm.tsx`, `app/admin/home-components/faq/_components/FaqSectionShared.tsx`, `app/admin/home-components/faq/_types/index.ts`, `app/admin/home-components/faq/_lib/colors.ts`.
- Optional SEO metadata touch: `convex/ia.ts` only if muốn expose thêm plain text later; không bắt buộc trong MVP.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Hiện schema/category contract chỉ có `description` dạng string ngắn và frontend list chỉ dùng tên danh mục làm title. Không có field hay toggle nào để render rich content cuối trang lọc danh mục hoặc suffix chi tiết sản phẩm từ category form.

## 2. Trả lời câu hỏi audit bắt buộc

1. Triệu chứng expected vs actual:
   - Expected: danh mục có subtitle tùy bật/tắt, rich content cuối trang lọc, rich suffix nối đuôi chi tiết sản phẩm, và FAQ chi tiết sản phẩm nằm dưới related products.
   - Actual: chỉ có `description` ngắn, chưa render subtitle/footer, suffix/FAQ chi tiết chủ yếu nằm ở hệ template riêng.
2. Phạm vi ảnh hưởng:
   - Product category admin forms, system products module settings, public category list, public product detail.
3. Tái hiện tối thiểu:
   - Mở `/giay-nike`; title có thể hiện tên danh mục nhưng không có subtitle hoặc Lexical content cuối danh sách.
   - Mở `/admin/categories/create`; chỉ có textarea mô tả, không có Lexical/FAQ fields mới.
4. Dữ liệu thiếu:
   - Chưa có dữ liệu mẫu cho `filterFooterContent`, `productDetailSuffixContent`, `productDetailFaqItems` vì fields chưa tồn tại.
5. Giả thuyết thay thế:
   - Có thể reuse `productSupplementalContents` cho suffix chi tiết sản phẩm, nhưng không đáp ứng yêu cầu quản lý trực tiếp ở create/edit danh mục và phức tạp hơn.
6. Rủi ro nếu fix sai:
   - Duplicate nội dung nếu vừa bật suffix category vừa dùng existing supplemental `postContent`.
   - Sai nguồn nếu product có nhiều danh mục mà lấy nhầm category phụ thay vì `product.categoryId`.
   - Duplicate FAQ nếu render cả category FAQ mới và supplemental FAQ cũ mà không có precedence rõ.
   - Render HTML không chuẩn nếu không đi qua `RichContent`/`normalizeRichText`.
7. Tiêu chí pass/fail:
   - Toggle off thì UI public không hiện nội dung.
   - Toggle on + field có nội dung thì render đúng vị trí.
   - Category form không mất dữ liệu cũ khi field mới undefined.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)

- **Hướng không chọn:** mở rộng `productSupplementalContents` làm nguồn duy nhất cho suffix chi tiết.
- **Lý do không chọn:** hiện manager này là template theo sản phẩm/danh mục, có conflict validation và lives under admin settings. Với yêu cầu “gọn, đơn giản, nhập tại category create/edit”, field trực tiếp trên `productCategories` ít moving parts hơn.
- **Hướng không chọn:** đọc FAQ từ home-component FAQ.
- **Lý do không chọn:** chỉ reuse component/form/types; dữ liệu FAQ trang chủ và FAQ chi tiết sản phẩm phải tách riêng, không merge.

# IV. Proposal (Đề xuất)

## 1. Data model (Mô hình dữ liệu)

Thêm optional fields vào `productCategories`:

- `filterFooterContent?: string`
  - HTML rich text từ Lexical.
  - Render dưới khu vực danh sách/filter sản phẩm của trang danh mục.
- `productDetailSuffixContent?: string`
  - HTML rich text từ Lexical.
  - Render nối đuôi mô tả chi tiết sản phẩm cho mọi sản phẩm thuộc danh mục.
- `productDetailFaqItems?: Array<{ id: string; question: string; answer: string; order: number }>`
  - FAQ riêng cho trang chi tiết sản phẩm của danh mục.
  - Render dưới cùng trang chi tiết sản phẩm, sau khối sản phẩm liên quan.
- `productDetailFaqStyle?: 'accordion' | 'cards' | 'two-column' | 'minimal' | 'timeline' | 'tabbed' | 'wine-list'`
  - Optional, default `accordion`.
  - Giữ để reuse `FaqSectionShared` đúng contract, nhưng MVP có thể chỉ expose `accordion` nếu muốn UI đơn giản.

Giữ nguyên `description?: string` là subtitle/plain text ngắn của danh mục. Không đổi semantic của `description` để không ảnh hưởng SEO metadata hiện đang dùng `categoryDescription`.

Quy tắc N-N: mọi field chi tiết sản phẩm ở trên luôn resolve từ danh mục chính `product.categoryId`; không dùng category phụ trong `productCategoryAssignments` để lấy suffix/FAQ, kể cả khi user vào URL detail qua category phụ.

## 2. System toggles (Toggle ở `/system/modules/products`)

Thêm vào `productsModule.settings`, group mới hoặc reuse group `supplementalContent`:

- `showCategorySubtitle`
  - Label: `Hiện mô tả dưới tên danh mục`
  - Type: `toggle`
  - Default: `false`
  - Khi bật, cần đảm bảo field `productCategories.description` bật theo trong runtime fields.
- `enableCategoryFilterFooterContent`
  - Label: `Hiện nội dung cuối trang danh mục`
  - Type: `toggle`
  - Default: `false`
  - Khi bật, admin form hiển thị Lexical `filterFooterContent`, public render ở cuối trang danh mục.
- `enableCategoryProductDetailSuffix`
  - Label: `Nối nội dung danh mục vào chi tiết sản phẩm`
  - Type: `toggle`
  - Default: `false`
  - Khi bật, admin form hiển thị Lexical `productDetailSuffixContent`, product detail append nội dung sau product description.
- `enableCategoryProductDetailFaq`
  - Label: `Hiện FAQ danh mục ở chi tiết sản phẩm`
  - Type: `toggle`
  - Default: `false`
  - Khi bật, admin category form hiển thị FAQ editor và product detail render FAQ dưới related products.

Gợi ý group: thêm `categoryContent` với label `Nội dung danh mục` để tách khỏi `supplementalContent` hiện đang phục vụ template chi tiết sản phẩm.

## 3. Admin UX (Quản trị nội dung)

Trong `/admin/categories/create` và `/admin/categories/[id]/edit`:

- `description` vẫn là textarea ngắn, dùng cho subtitle.
- Nếu `enableCategoryFilterFooterContent` bật:
  - Hiện card `Nội dung cuối trang danh mục`.
  - Dùng `LexicalEditor`, `normalizeRichText`, folder gợi ý `product-categories-filter-footer`.
- Nếu `enableCategoryProductDetailSuffix` bật:
  - Hiện card `Nội dung nối đuôi chi tiết sản phẩm`.
  - Dùng `LexicalEditor`, `normalizeRichText`, folder gợi ý `product-categories-detail-suffix`.
- Nếu `enableCategoryProductDetailFaq` bật:
  - Hiện card `FAQ chi tiết sản phẩm`.
  - Reuse `FaqForm` từ `app/admin/home-components/faq/_components/FaqForm.tsx` thay vì viết lại UI kéo-thả/câu hỏi/câu trả lời.
  - Reuse `FaqItem`, `FaqStyle` types từ `app/admin/home-components/faq/_types/index.ts`.
  - Lưu dữ liệu vào `productCategories.productDetailFaqItems`; không đọc/ghi home-component FAQ config.

Không cần toggle per-category trong admin form ở MVP; field rỗng nghĩa là không render. System toggle quyết định bật/tắt toàn site.

## 4. Public rendering (Hiển thị public)

Trang category list:

- Tạo `activeCategoryDoc = categoryOptions.find(c => c._id === activeCategory)`.
- Title dùng `activeCategoryDoc?.name ?? 'Sản phẩm'`.
- Subtitle:
  - Query `api.admin.modules.getModuleSetting({ moduleKey: 'products', settingKey: 'showCategorySubtitle' })`.
  - Nếu setting true và `activeCategoryDoc.description` có text, render `<p>` dưới `<h1>`.
- Footer content:
  - Query `enableCategoryFilterFooterContent`.
  - Nếu true và `activeCategoryDoc.filterFooterContent` có HTML, render `RichContent(content={toRichTextContent(...)})` dưới product grid/pagination, trong container `max-w-3xl` hoặc `max-w-4xl` để đọc tốt.

Trang product detail:

- Query `enableCategoryProductDetailSuffix`.
- Đã có `category = api.productCategories.getById(product.categoryId)`.
- Render order đề xuất:
  1. Existing `supplementalTemplate.preContent` nếu hệ cũ đang dùng.
  2. `product.description`.
  3. `category.productDetailSuffixContent` nếu toggle bật.
  4. Existing `supplementalTemplate.postContent` nếu hệ cũ đang dùng.

Lý do đặt suffix category ngay sau product description: đúng ý “nối đuôi mô tả lexical có sẵn”, còn existing template postContent vẫn giữ backward compatibility.

FAQ chi tiết sản phẩm:

- Data source chính: `category.productDetailFaqItems` từ danh mục chính `product.categoryId`.
- Render position: sau `RelatedProductsSection` / khối sản phẩm liên quan trong mọi layout `classic`, `modern`, `minimal`.
- Renderer: ưu tiên reuse `FaqSectionShared`, `getFaqColors`, `FaqItem`, `FaqStyle` từ home-component FAQ; nếu implement thấy scope hợp lý thì tách phần renderer/types/colors ổn định sang shared path trước để giảm coupling.
- Data separation: không dùng home-component FAQ items; FAQ trang chủ và FAQ chi tiết sản phẩm là 2 nguồn dữ liệu riêng.
- Precedence để tránh duplicate:
  1. Nếu `enableCategoryProductDetailFaq` bật và category chính có `productDetailFaqItems`, render category FAQ.
  2. Nếu category FAQ rỗng, có thể fallback render `supplementalTemplate.faqItems` cũ để giữ backward compatibility.
  3. Không render đồng thời cả 2 FAQ source trong cùng một product detail.

## 5. Guardrails QA senior (Ràng buộc triển khai)

- **Giảm coupling FAQ:** không copy-paste FAQ renderer. MVP được phép import lại path hiện có như runtime site đang làm, nhưng hướng tốt hơn là tạo shared façade nhỏ như `components/site/shared/faq/*` hoặc `lib/types/faq.ts` để product detail không phụ thuộc trực tiếp vào toàn bộ module home-component.
- **Chống stale Lexical:** mỗi `LexicalEditor` trong edit form phải có `key`/`resetKey` gắn với `categoryId + fieldKey` hoặc `slug + fieldKey`, ví dụ `key={`${id}:productDetailSuffixContent`}` và `resetKey={`${id}:productDetailSuffixContent`}` để React không giữ state cũ khi đổi danh mục.
- **DB bandwidth:** không thêm N+1 query theo từng sản phẩm/category. Trang list nên tận dụng `listActive`/active category doc đã có; detail chỉ fetch category chính `product.categoryId`. Nếu server-side/helper cần nhiều nguồn độc lập, load song song bằng `Promise.all`, không await tuần tự.
- **Toggle vs runtime fields:** khi `showCategorySubtitle` bật thì field `productCategories.description` phải có đường nhập liệu. Cách ưu tiên là auto-enable/force-visible field `description` trong category form khi toggle subtitle bật, thay vì để admin bật subtitle nhưng không có nơi nhập mô tả.

# V. Files Impacted (Tệp bị ảnh hưởng)


## 1. Server / Convex

- Sửa: `convex/schema.ts` — hiện là source of truth schema; thêm 2 optional rich text fields và FAQ fields vào `productCategories`.
- Sửa: `convex/productCategories.ts` — hiện validate/return category doc; thêm rich content fields + FAQ fields vào `categoryDoc`, `create.args`, `update.args`.
- Không thêm query N+1 mới; nếu cần query tổng hợp category content thì filter/index theo slug/id hiện có.

## 2. System module config

- Sửa: `lib/modules/configs/products.config.ts` — hiện định nghĩa products module settings; thêm group/toggles category content.
- Sửa: `lib/modules/runtime-config/index.ts` — hiện định nghĩa fields runtime cho `productCategories`; thêm `filterFooterContent`, `productDetailSuffixContent` type `richtext` và FAQ field/config nếu cần.
- Có thể sửa: `components/modules/ModuleConfigPage.tsx` — nếu cần auto bật/force-visible `description` khi bật `showCategorySubtitle`.
- Có thể thêm: `components/site/shared/faq/*` hoặc `lib/types/faq.ts` — chỉ khi muốn tách façade shared để giảm coupling với `app/admin/home-components/faq/*`.

## 3. Admin UI

- Sửa: `app/admin/categories/create/page.tsx` — thêm state, Lexical editors, FAQ state, submit payload cho fields mới.
- Sửa: `app/admin/categories/[id]/edit/page.tsx` — load/save fields mới, dùng `key`/`resetKey` theo category id + field key để tránh stale content.
- Đồng bộ nếu cần: `app/admin/product-categories/create/page.tsx`, `app/admin/product-categories/[id]/edit/page.tsx` — tránh 2 route category lệch behavior.
- Reuse hoặc re-export qua shared façade: `app/admin/home-components/faq/_components/FaqForm.tsx` — dùng lại editor FAQ kéo-thả/câu hỏi/câu trả lời cho category form.

## 4. Public UI

- Sửa: `app/(site)/[categorySlug]/_components/ProductsPage.tsx` — render subtitle và footer rich content theo system toggles.
- Sửa: `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` — render category suffix content trong description block, render FAQ dưới related products, và luôn lấy config từ danh mục chính.
- Reuse hoặc re-export qua shared façade: `FaqSectionShared` + `_lib/colors.ts` — dùng lại renderer/style FAQ cho product detail thay vì viết accordion mới.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại schema + generated API sau khi chỉnh để chắc validator khớp field mới.
2. Thêm fields optional vào Convex schema/category functions.
3. Thêm settings ở products module và runtime category fields.
   - Đảm bảo `showCategorySubtitle` bật thì `description` vẫn có nơi nhập trong category form.
4. Cập nhật admin category create/edit:
   - state mới,
   - query module settings,
   - `LexicalEditor` có `key`/`resetKey` riêng theo category + field,
   - reuse `FaqForm`,
   - payload create/update.
5. Cập nhật public list:
   - derive active category doc,
   - query toggles,
   - render subtitle/footer content.
   - không thêm query theo từng product/category; dùng dữ liệu category đã batch hoặc query độc lập song song.
6. Cập nhật public detail:
   - query toggle,
   - render `category.productDetailSuffixContent` trong các layout description blocks.
   - render FAQ dưới related products bằng `FaqSectionShared`.
   - kiểm tra N-N vẫn lấy `product.categoryId`.
   - nếu tách shared façade FAQ thì public detail import từ façade, không import trực tiếp admin path.
7. Static review:
   - undefined-safe,
   - no render when toggle false,
   - no schema mismatch,
   - no stale editor state,
   - no N+1 query,
   - no route behavior changes.

# VII. Verification Plan (Kế hoạch kiểm chứng)

Theo rule dự án, không tự chạy lint/unit test. Vì đây là spec-only nên chưa chạy validator.

Khi implement code thật, verification nên là:

1. `bunx tsc --noEmit 2>&1 | Select-Object -First 10` sau khi đổi TS/TSX.
2. Manual smoke test:
   - `/system/modules/products`: bật/tắt 4 toggle.
   - `/admin/categories/create`: nhập description + 2 Lexical fields + FAQ items.
   - `/admin/categories/[id]/edit`: reload vẫn giữ nội dung.
   - Chuyển qua lại 2 danh mục edit khác nhau không bị giữ nội dung Lexical cũ.
   - `/giay-nike`: toggle off không hiện; toggle on hiện subtitle/footer.
   - `/giay-nike/[product-slug]`: suffix hiện sau mô tả sản phẩm.
   - Với sản phẩm có nhiều danh mục: FAQ/suffix lấy theo danh mục chính, không đổi khi truy cập bằng URL danh mục phụ.
   - FAQ chi tiết sản phẩm nằm dưới sản phẩm liên quan và không dùng dữ liệu FAQ trang chủ.
   - Kiểm tra static data flow: không có loop query category/product gây N+1.
3. Regression check:
   - `/products` không category vẫn không hiện subtitle/footer.
   - Product detail không có category suffix không crash.
   - Existing `productSupplementalContents` vẫn render như cũ.

# VIII. Todo

- [ ] Implement Convex schema + validators.
- [ ] Implement products module settings + runtime fields.
- [ ] Implement admin category create/edit Lexical fields.
- [ ] Reuse home-component FAQ form/shared renderer cho FAQ chi tiết sản phẩm theo danh mục.
- [ ] Implement public category subtitle/footer rendering.
- [ ] Implement product detail category suffix + FAQ rendering theo danh mục chính.
- [ ] Static review + `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Toggle `showCategorySubtitle = false`: `/giay-nike` chỉ hiện title, không hiện `description` dưới title.
- Toggle `showCategorySubtitle = true` + category có `description`: `/giay-nike` hiện description như subtitle dưới title.
- Khi toggle `showCategorySubtitle = true`, admin category form luôn có nơi nhập `description` dù runtime field `description` từng bị tắt.
- Toggle `enableCategoryFilterFooterContent = true` + category có `filterFooterContent`: cuối trang list danh mục render rich content đúng định dạng Lexical.
- Toggle `enableCategoryFilterFooterContent = false`: field có dữ liệu vẫn không render public.
- Toggle `enableCategoryProductDetailSuffix = true` + category có `productDetailSuffixContent`: product detail render suffix sau mô tả sản phẩm.
- Toggle `enableCategoryProductDetailFaq = true` + category chính có `productDetailFaqItems`: product detail render FAQ dưới sản phẩm liên quan.
- Với N-N product-category, dù detail route vào bằng category phụ, suffix/FAQ vẫn lấy từ `product.categoryId`.
- FAQ chi tiết sản phẩm reuse `FaqSectionShared`/`FaqForm` contract hiện có, không viết accordion mới.
- Nếu có tách shared façade FAQ, product detail import qua shared façade thay vì phụ thuộc trực tiếp vào toàn bộ module home-component.
- FAQ chi tiết sản phẩm không đọc hoặc merge dữ liệu home-component FAQ trang chủ.
- Lexical editor ở create/edit không bị stale content khi đổi danh mục.
- Không phát sinh N+1 query khi render subtitle/footer/FAQ theo danh mục.
- Existing product description, supplemental pre/post content, pagination/filter/sort vẫn hoạt động.
- Dữ liệu category cũ không cần migration bắt buộc vì fields mới đều optional.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## 1. Risks

- Duplicate nội dung nếu admin dùng cả category suffix mới và existing `productSupplementalContents.postContent`.
- Duplicate FAQ nếu không áp dụng precedence category FAQ trước, supplemental FAQ fallback sau.
- Sai ngữ cảnh N-N nếu lấy config theo category slug trên URL thay vì `product.categoryId`.
- High coupling nếu product detail import trực tiếp quá sâu từ `app/admin/home-components/faq/*` và home FAQ bị refactor sau này.
- Stale content nếu `LexicalEditor` thiếu `key`/`resetKey` theo category field.
- Tăng latency/bandwidth nếu implement query category content theo loop thay vì batch/derive từ data đã có.
- Rich text có ảnh upload qua Lexical cần lưu ý lifecycle media; MVP này chỉ theo pattern Lexical hiện có, chưa mở rộng File Lifecycle Service.
- Nếu muốn “bật subtitle thì field description tự bật theo” cần thêm logic sync setting-field; nếu không làm, system user có thể bật subtitle nhưng field `description` đang bị tắt trong category fields.

## 2. Rollback

- Tắt 4 system toggles để public không render nội dung mới.
- Nếu cần rollback code: bỏ render UI public và bỏ fields khỏi form; fields optional còn trong DB không gây lỗi.
- Không cần data migration rollback vì không thay đổi field bắt buộc.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor hệ `productSupplementalContents`.
- Không thêm bảng template mới.
- Không đổi SEO metadata từ rich content; SEO vẫn dùng `description` plain text.
- Không thêm per-category toggle riêng trong admin category form.
- Không gộp dữ liệu FAQ trang chủ với FAQ chi tiết sản phẩm.
- Không refactor toàn bộ FAQ home-component sang thư mục shared mới trong MVP; chỉ reuse component/hooks/type hiện có.
- Không xử lý cleanup media nâng cao cho ảnh được chèn trong Lexical.

# XII. Open Questions (Câu hỏi mở)

Không còn câu hỏi mở bắt buộc. Spec đã chốt hướng gọn: system quản toggle, admin category form quản nội dung, public render theo toggle.

# XIII. System Extension Gate (Gate matrix)

## 1. Critical gates

- Contract Mapping: Pass — đã map System settings → Admin fields → Convex fields → Public render.
- Schema optional-safe: Pass — fields mới optional, không cần migration bắt buộc.
- Public toggle safety: Pass theo spec — toggle false phải không render.
- N-N primary category rule: Pass theo spec — product detail category content lấy từ `product.categoryId`.
- FAQ reuse: Pass theo spec — reuse `FaqForm`/`FaqSectionShared`, dữ liệu riêng.
- Runtime field consistency: Pass theo spec — `showCategorySubtitle` bật thì `description` phải force-visible/auto-enabled ở admin category form.
- DB bandwidth guard: Pass theo spec — không thêm N+1 query; load song song các query độc lập.
- Lexical stale-state guard: Pass theo spec — editor dùng `key`/`resetKey` theo category + field.
- Backward compatibility: Pass theo spec — không xóa/đổi `description`, không bỏ supplemental manager.

## 2. Non-critical warnings

- Warning: existing `productSupplementalContents` không bị system toggle `enableProductSupplementalContent` gate trực tiếp ở product detail theo quan sát hiện tại. Remediation: khi implement có thể gate lại riêng nếu muốn đúng semantics, nhưng không bắt buộc cho scope này.
- Warning: Lexical images trong category content có thể tạo media cần lifecycle cleanup về sau. Remediation: nếu content này dùng ảnh nhiều, mở follow-up FLS.
- Warning: FAQ shared component hiện vẫn nằm dưới path `app/admin/home-components/faq`. Remediation: nếu implement thuận tiện, tạo façade/tách renderer/types sang `components/site/shared/faq/*` hoặc `lib/types/faq.ts`; nếu không, MVP được phép reuse path hiện có nhưng phải ghi rõ coupling.
- Warning: Nếu auto-enable runtime field `description` đụng flow sync module hiện tại, có thể chọn force-visible trong admin form khi `showCategorySubtitle` bật. Remediation: ưu tiên thay đổi nhỏ, tránh refactor `ModuleConfigPage` nếu chưa cần.

## 3. Next-safe-step

Nếu duyệt spec này, bước an toàn tiếp theo là implement MVP nhỏ theo thứ tự: schema → module settings/runtime fields + subtitle field consistency → admin forms + FAQ reuse/shared façade nếu gọn → public render theo primary category, không N+1 → static review/typecheck.

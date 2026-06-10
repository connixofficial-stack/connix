# I. Primer

## 1. TL;DR kiểu Feynman

- Khi bật **Bật hệ thống Phân loại & Thuộc tính**, `Product Type (Loại sản phẩm)` là “ngôi nhà chính” của catalog.
- URL đẹp luôn bắt đầu bằng `/{productTypeSlug}` nếu đang ở ngữ cảnh phân loại mới.
- Người dùng click filter nào thì filter đó trở thành phần chính trên path; filter còn lại nằm trong query.
- Nếu chưa có product type rõ ràng, không tự dựng URL đẹp; dùng `/products?...` để tránh nhầm với detail legacy.
- Mọi route public phải validate đủ: type active, category được gán vào type, group filterable, group được gán vào type, term active, slug không mơ hồ.
- Product list phải lọc theo phép AND đầy đủ, không được có tình trạng có `productTypeId` nhưng query chỉ lọc `categoryId`.

## 2. Elaboration & Self-Explanation

Hệ thống hiện có hai chế độ IA (Information Architecture - Kiến trúc thông tin). Khi tắt taxonomy, site dùng route truyền thống như `/products`, `/{categorySlug}`, `/{categorySlug}/{productSlug}`. Khi bật taxonomy, route bắt đầu có thêm `Product Type`, `Attribute Group (Nhóm thuộc tính)`, `Attribute Term (Giá trị thuộc tính)` và `Price Range (Nấc giá)`.

Vấn đề chính không nằm ở việc có nhiều filter, mà nằm ở việc một slug có thể mang nhiều nghĩa. Ví dụ `pinot-noir` là giống nho, `ruou-vang-do` là danh mục, `duoi-500k` là nấc giá. Nếu resolver không có luật rõ, user click filter có thể bị đưa tới URL hợp lệ về mặt kỹ thuật nhưng sai nghĩa về mặt IA.

Option B chốt lại một nguyên tắc đơn giản: **Product Type là trục cha; filter vừa click là primary route; các filter phụ giữ bằng query; canonical chỉ index landing có intent rõ.**

## 3. Concrete Examples & Analogies

Ví dụ cụ thể:

- User vào `/ruou-vang-sam-panh`.
- Click `Giống nho = Pinot Noir`.
- URL phải là `/ruou-vang-sam-panh/giong-nho/pinot-noir`.
- Nếu sau đó click thêm `Danh mục = Rượu vang đỏ`, URL nên là `/ruou-vang-sam-panh/ruou-vang-do?attr_giong-nho=pinot-noir` nếu category là filter vừa click.
- Nếu click lại `Giống nho = Chardonnay`, URL nên là `/ruou-vang-sam-panh/giong-nho/pinot-noir,chardonnay`.

Analogy đời thường: `Product Type` giống như khu trong siêu thị, ví dụ “Rượu vang & Sâm panh”. `Category`, `Giống nho`, `Quốc gia`, `Khoảng giá` là các biển chỉ dẫn trong khu đó. Không nên lấy biển chỉ dẫn của khu khác đem treo vào khu này.

# II. Audit Summary (Tóm tắt kiểm tra)

- `lib/modules/configs/products.config.ts`: setting `enableProductTypes` điều khiển bật/tắt hệ phân loại mới.
- `convex/ia.ts`: `resolveProductLandingContext` đang resolve các route taxonomy.
- `app/(site)/[...slugs]/page.tsx`: catch-all render product type/category/price/attribute landing.
- `app/(site)/products/[slug]/page.tsx`: legacy route `/products/[slug]`, hiện chỉ xử lý một phần context taxonomy.
- `app/(site)/_components/products/ProductsPage.tsx`: build URL khi user click filter.
- `app/admin/attribute-groups/[id]/edit/page.tsx`: cấu hình `filterType`, `inputType`, `isFilterable`, icon/color và nút mở ngoài site.
- `app/admin/product-types/create/page.tsx`, `app/admin/product-types/[id]/edit/page.tsx`: gán category, attribute group, price range cho product type.
- `convex/products.ts`: query public list/count sản phẩm; hiện có rủi ro ưu tiên `categoryId` rồi bỏ qua `productTypeId`.
- `convex/schema.ts`: data model gồm `productTypes`, `attributeGroups`, `attributeTerms`, `productTypeAttributeGroups`, `productCategoryTypes`, `productAttributeTerms`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc: High)

Nguyên nhân gốc là **route resolver, URL builder và query filter chưa cùng dùng một IA contract duy nhất**. Evidence:

- `ProductsPage.navigateWithFilters` đang ưu tiên cứng `category > price > attribute` thay vì “filter vừa click là primary”.
- `convex/products.ts` trong các query public xử lý `if (categoryId) ... else if (productTypeId) ...`, nên khi có cả hai thì product type bị bỏ qua.
- `convex/ia.ts` route 3 segments cho `/{type}/{group}/{term}` chưa check đầy đủ `group.isFilterable`.
- Multi-term route dùng `find`, chỉ cần một term hợp lệ là route pass, khiến slug rác có thể bị bỏ qua âm thầm.
- Admin “Mở ngoài site” ở attribute group fallback về `/products/...`, dễ tạo route global chưa được chốt rõ.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- Có thể giữ rule hiện tại `category > price > attribute` để ổn định SEO category trước. Tuy nhiên hướng này làm user click attribute nhưng URL vẫn bị category giữ làm primary, gây cảm giác click filter sai chỗ.
- Có thể namespace toàn bộ taxonomy dưới `/products/types/...` để hết collision. Tuy nhiên user đã chọn Option B vì muốn URL đẹp, ngắn, tự nhiên.
- Có thể cho mọi attribute group có global route `/products/{group}/{term}`. Tuy nhiên route này đụng trực tiếp legacy `/products/[slug]`, tăng rủi ro nhầm với detail.

# IV. Proposal (Đề xuất)

## 1. IA Contract (Hợp đồng IA)

- Khi `enableProductTypes=false`:
  - Giữ behavior cũ.
  - `/products` là list module.
  - `/{categorySlug}` là category unified.
  - `/{categorySlug}/{productSlug}` là detail.

- Khi `enableProductTypes=true`:
  - Product type là root semantic cho catalog SEO.
  - URL đẹp chỉ được tạo khi có `productTypeSlug` hợp lệ.
  - Nếu không có product type, dùng `/products?...query` thay vì tự dựng path taxonomy.

## 2. Canonical Routes (Route chính)

- `/products`
  - Global product listing.
  - Không gắn semantic product type.

- `/{productTypeSlug}`
  - Product type landing.
  - Ví dụ: `/ruou-vang-sam-panh`.

- `/{productTypeSlug}/{categorySlug}`
  - Product type + category landing.
  - Category phải được map với product type qua `productCategoryTypes`.

- `/{productTypeSlug}/{priceRangeSlug}`
  - Product type + price range landing.
  - Price range phải thuộc `productType.priceRanges`.

- `/{productTypeSlug}/{attributeGroupSlug}`
  - Group landing tùy chọn.
  - Chỉ hiện nếu group `isFilterable=true` và được gán vào type.
  - Không lọc term cụ thể; dùng để giới thiệu nhóm filter nếu cần SEO.

- `/{productTypeSlug}/{attributeGroupSlug}/{termSlug}`
  - Product type + attribute term landing.
  - Group phải filterable, được gán vào type.
  - Term phải active, thuộc đúng group.

## 3. Click Routing Rules (Quy tắc khi click filter)

### a) Click Product Type

- Route:
  - `/{typeSlug}`
- Clear:
  - category
  - priceRange
  - all `attr_*`
  - page
- Có thể giữ:
  - sort nếu muốn UX continuity.
- Nên clear:
  - search, nếu mục tiêu là landing SEO sạch.

### b) Click Category

- Nếu có product type:
  - `/{typeSlug}/{categorySlug}`
- Nếu không có product type:
  - `/products?category={categorySlug}`
- Filter phụ:
  - `priceRange={priceRangeSlug}`
  - `attr_{groupSlug}={termSlug}`

### c) Click Price Range

- Nếu có product type:
  - `/{typeSlug}/{priceRangeSlug}`
- Nếu không có product type:
  - `/products?priceRange={priceRangeSlug}`
- Filter phụ:
  - `category={categorySlug}`
  - `attr_{groupSlug}={termSlug}`

### d) Click Attribute Term

- Nếu có product type:
  - `/{typeSlug}/{groupSlug}/{termSlug}`
- Nếu multi-select cùng group:
  - `/{typeSlug}/{groupSlug}/{term-a,term-b}`
- Nếu không có product type:
  - `/products?attr_{groupSlug}={termSlug}`
- Filter phụ:
  - `category={categorySlug}`
  - `priceRange={priceRangeSlug}`
  - `attr_{otherGroupSlug}={termSlug}`

### e) Clear Filter

- Clear filter đang là primary path:
  - Promote filter còn lại theo priority fallback: category → priceRange → first attribute group → type root.
- Clear filter phụ trong query:
  - Giữ path hiện tại, xóa param tương ứng.
- Clear tất cả:
  - Nếu có type: `/{typeSlug}`.
  - Nếu không có type: `/products`.

## 4. Attribute Group Rules (Quy tắc nhóm thuộc tính)

### a) `filterType=single`

- Chỉ chọn một term.
- Chọn term mới thay term cũ.
- Click lại term đang chọn thì clear.
- URL type-specific:
  - `/{typeSlug}/{groupSlug}/{termSlug}`

### b) `filterType=multiple`

- Cho phép nhiều term cùng group.
- URL type-specific:
  - `/{typeSlug}/{groupSlug}/{term-a,term-b}`
- Rule validate:
  - Tất cả term slugs trong comma list phải tồn tại, active, cùng group.
  - Nếu có slug rác: 404 hoặc redirect về URL sạch.

### c) `filterType=range`

- Dùng cho attribute numeric như dung tích/nồng độ.
- Không nên tạo route SEO path dạng comma term.
- Nên dùng query:
  - `/{typeSlug}?attr_dung-tich=500ml,750ml`
- Price range marketing là case riêng, thuộc `productType.priceRanges`, có route:
  - `/{typeSlug}/{priceRangeSlug}`

## 5. Input Type Rules (Quy tắc kiểu hiển thị)

- `inputType=select`
  - Chỉ ảnh hưởng UI dropdown.
  - Không ảnh hưởng route semantic.

- `inputType=buttons`
  - Chỉ ảnh hưởng UI chip/buttons.
  - Không ảnh hưởng route semantic.

- `inputType=radio`
  - Nếu `filterType=single`: render radio.
  - Nếu `filterType=multiple`: nên render checkbox-style để tránh hiểu nhầm.

## 6. Critical Case Matrix (Ma trận case nguy hiểm)

### a) Attribute group chưa thuộc product type nào

- Không hiện route:
  - `/{typeSlug}/{groupSlug}`
  - `/{typeSlug}/{groupSlug}/{termSlug}`
- Không hiện group trong filter của type page.
- Admin “Mở ngoài site”:
  - Disable, hoặc dùng `/products?attr_{groupSlug}=...` nếu chốt hỗ trợ global filter.

### b) Attribute group `isFilterable=false`

- Không hiện UI filter.
- Không tạo public route.
- Resolver phải trả 404 cho cả group landing và term landing.

### c) Term inactive

- Không hiện UI filter.
- Không mở ngoài site.
- Resolver trả 404.

### d) Product type inactive

- Không hiện landing type/filter.
- Nếu slug trùng category truyền thống thì fallback category chỉ hợp lệ khi route thật sự là category, không phải link generated từ taxonomy.

### e) Category chưa map vào product type

- Không hiện category trong dropdown của type.
- Route `/{typeSlug}/{categorySlug}` phải 404.

### f) Product thiếu `productTypeId`

- Không hiện trong `/{typeSlug}` và mọi child route của type.
- Vẫn có thể hiện trong `/products` global.

### g) Product có type nhưng thiếu term

- Hiện trong type/category landing.
- Không hiện trong attribute term landing.

### h) Slug collision

- Admin phải chặn:
  - product type slug trùng route root quan trọng.
  - category slug trùng price range slug trong cùng type.
  - category slug trùng attribute group slug trong cùng type.
  - price range slug trùng attribute group slug trong cùng type.
- Term slug unique trong cùng group là đủ, nhưng comma URL phải validate toàn bộ.

### i) Multi-term invalid

- `/type/group/valid,invalid` không được âm thầm pass.
- Chuẩn:
  - 404, hoặc
  - permanent redirect về `/type/group/valid` nếu muốn canonical clean.

### j) `/products` fallback

- Supported:
  - `/products`
  - `/products?category=...`
  - `/products?priceRange=...`
  - `/products?attr_group=term`
- Không khuyến nghị:
  - `/products/{group}`
  - `/products/{group}/{term}`
- Lý do: dễ xung đột với `app/(site)/products/[slug]/page.tsx` legacy detail.

## 7. SEO / Index Rules (Quy tắc SEO / lập chỉ mục)

- Index:
  - `/{typeSlug}`
  - `/{typeSlug}/{categorySlug}`
  - `/{typeSlug}/{attributeGroupSlug}/{termSlug}` nếu term có search intent rõ.
  - `/{typeSlug}/{priceRangeSlug}` nếu price range có intent rõ.
- Noindex hoặc canonical về landing gần nhất:
  - `sort`
  - `search`
  - `page > 1`
  - tổ hợp nhiều filter query.
- Canonical:
  - filter phụ query canonical về primary path hiện tại.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / Route

- Sửa: `app/(site)/_components/products/ProductsPage.tsx`
  - Hiện là nơi build URL khi click filter.
  - Cần thêm notion `primaryFilter` hoặc truyền action source vào `navigateWithFilters` để “filter vừa click là path chính”.

- Sửa: `app/(site)/[...slugs]/page.tsx`
  - Hiện render context từ `resolveProductLandingContext`.
  - Cần đảm bảo metadata/canonical/breadcrumb theo IA Option B.

- Sửa: `app/(site)/products/[slug]/page.tsx`
  - Hiện route legacy chỉ xử lý `productTypeAttribute`.
  - Cần quyết định rõ `/products/{slug}` chỉ là product detail legacy hay có hỗ trợ category/group fallback; khuyến nghị không dùng global taxonomy path.

## 2. Server / Convex

- Sửa: `convex/ia.ts`
  - Validate chặt `isFilterable`, assigned group, active term, all comma terms.
  - Loại hoặc hạn chế `/products/{group}/{term}` nếu không support global path.

- Sửa: `convex/products.ts`
  - Query list/count phải AND đầy đủ `productTypeId`, `categoryId`, price, attributes.
  - Không được `if categoryId else if productTypeId`.

- Sửa: `convex/productTypes.ts`
  - Validate price range slug collision trong context type.
  - Có thể thêm helper trả category/group/range assigned cho UI type page.

- Sửa: `convex/attributeGroups.ts`
  - `listFilterable` nên có biến thể theo `productTypeId` để UI không hiện group chưa gán vào type.

## 3. Admin

- Sửa: `app/admin/attribute-groups/[id]/edit/page.tsx`
  - Nút “Mở ngoài site” phải disable nếu group chưa gán vào type hoặc không filterable.
  - Term “Mở ngoài site” phải chỉ tạo URL type-specific khi có assigned type hợp lệ.

- Sửa: `app/admin/product-types/create/page.tsx`
  - Validate price range slug và mapping trước khi submit.

- Sửa: `app/admin/product-types/[id]/edit/page.tsx`
  - Validate collision khi đổi category/group/range assignment.

# VI. Execution Preview (Xem trước thực thi)

1. Định nghĩa helper route builder cho taxonomy:
   - build type root
   - build category route
   - build price route
   - build attribute route
   - build `/products?...` fallback
2. Refactor `navigateWithFilters` để nhận `primary: 'category' | 'priceRange' | 'attribute' | 'type'`.
3. Lọc category options và attribute groups theo product type assignment.
4. Sửa Convex resolver trong `convex/ia.ts`:
   - validate `isFilterable`
   - validate all comma terms
   - validate category mapped type
   - validate price/group collision behavior.
5. Sửa product list/count queries trong `convex/products.ts` để AND filter đúng.
6. Cập nhật admin external links:
   - disable hoặc query fallback khi thiếu assigned type.
7. Review tĩnh:
   - route không tạo URL mơ hồ
   - UI không hiện filter không hợp lệ
   - backend không trả data sai scope.

# VII. Verification Plan (Kế hoạch kiểm chứng)

Không chạy lint/build theo instruction repo hiện tại. Kế hoạch kiểm chứng cho tester/developer:

- Type check:
  - `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
- Manual route QA:
  - `/products`
  - `/products?category=ruou-vang-do`
  - `/ruou-vang-sam-panh`
  - `/ruou-vang-sam-panh/ruou-vang-do`
  - `/ruou-vang-sam-panh/giong-nho/pinot-noir`
  - `/ruou-vang-sam-panh/giong-nho/pinot-noir,chardonnay`
  - `/ruou-vang-sam-panh/duoi-500k`
- Negative QA:
  - group chưa gán type → 404/không link
  - group `isFilterable=false` → 404/không link
  - term inactive → 404/không link
  - category chưa map type → 404/không link
  - invalid comma term → 404 hoặc redirect sạch
  - product thiếu type không xuất hiện trong type route.
- Data correctness QA:
  - `/{type}/{category}` chỉ hiện product có đúng cả `productTypeId` và `categoryId`.
  - attribute route chỉ hiện product có đúng `productTypeId` và term.

# VIII. Todo

- [ ] Implement taxonomy route builder/helper.
- [ ] Refactor `ProductsPage.navigateWithFilters` theo primary clicked filter.
- [ ] Scope category list theo assigned product type.
- [ ] Scope attribute groups theo assigned product type.
- [ ] Harden `convex/ia.ts` validation.
- [ ] Fix `convex/products.ts` list/count AND filters.
- [ ] Update admin external links/disabled states.
- [ ] Add IA preflight checks before enabling taxonomy.
- [ ] Run static review and hand off validation commands to tester.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Khi click category trong product type, URL là `/{type}/{category}`.
- Khi click price range trong product type, URL là `/{type}/{priceRange}`.
- Khi click attribute term trong product type, URL là `/{type}/{group}/{term}`.
- Filter phụ luôn nằm trong query và không làm đổi semantic path chính.
- Group chưa gán vào type không hiện trong filter của type.
- Category chưa gán vào type không hiện trong filter của type.
- Product thiếu `productTypeId` không xuất hiện trong type landing.
- `/{type}/{category}` không hiện sản phẩm sai type.
- `/{type}/{group}/{term}` không hoạt động nếu group không filterable.
- Multi-term URL có slug invalid không pass âm thầm.
- Admin không tạo link public cho taxonomy item chưa đủ điều kiện route.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro:
  - Thay đổi route/canonical có thể ảnh hưởng SEO nếu site đã index URL cũ.
  - Fix query AND có thể làm số lượng sản phẩm hiển thị giảm nếu data cũ thiếu `productTypeId`.
  - Chặn route invalid có thể làm một số link admin cũ mở ra 404.
- Rollback:
  - Tắt `enableProductTypes` để quay về route truyền thống.
  - Revert các thay đổi route builder/resolver nếu cần.
  - Giữ redirect từ URL taxonomy cũ sang URL mới nếu đã public.

# XI. Out of Scope (Ngoài phạm vi)

- Không thiết kế lại toàn bộ UI catalog.
- Không migration dữ liệu thật trong spec này.
- Không tối ưu sâu hiệu năng query Convex ngoài yêu cầu correctness.
- Không viết nội dung SEO cho từng landing.

# XII. Open Questions (Câu hỏi mở)

- Có muốn support global attribute path `/products/{group}/{term}` không, hay chỉ dùng `/products?attr_group=term`?
- Có muốn redirect clean cho multi-term invalid hay trả 404 cứng?
- Có muốn giữ `search/sort` khi đổi product type không, hay clear để landing sạch hơn?

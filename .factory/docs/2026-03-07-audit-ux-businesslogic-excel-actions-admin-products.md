## Audit Summary

### Pre-Audit
- Đã audit cả UI lẫn business logic cho 4 nút Excel tại `app/admin/products/page.tsx`.
- Đã đọc các helper contract/style:
  - `lib/products/excel-contract.ts`
  - `lib/products/excel-styles.ts`
- Đã đọc backend Convex liên quan:
  - `convex/products.ts`
  - `convex/schema.ts`
  - `lib/modules/configs/products.config.ts`
- Đã chốt yêu cầu từ bạn:
  - UX: gom 4 nút vào 1 cụm `Excel Actions`
  - Ưu tiên: rõ trạng thái thao tác
  - Label: Việt + keyword chuẩn trong ngoặc
  - Business logic: audit thật kỹ, nhưng lần này chỉ audit + đề xuất, chưa sửa business logic sâu
  - Validation import tương lai: muốn nâng mạnh, có slug format + normalize SKU/slug lowercase
  - Export: giữ limit 5.000 nhưng phải cảnh báo rõ bị cắt

### Evidence hiện trạng UX
1. 4 nút Excel đang nằm ngang, cùng cấp, cùng outline, không có nhóm ngữ nghĩa:
   - `Tải file mẫu`
   - `Import Excel`
   - `Xuất theo lọc`
   - `Xuất toàn bộ`
   - Evidence: `app/admin/products/page.tsx:603-622`
2. Header đang dùng `flex justify-between items-center` + cụm action `flex gap-2`, nên mobile/tablet dễ wrap rối khi đi cùng nút `Thêm sản phẩm`.
3. Feedback loading hiện chưa local theo từng action:
   - import có `Đang import...`
   - export dùng `isExporting || exportRequested` chung cho cả 2 nút
   - download template chưa có loading state

### Evidence hiện trạng business logic
#### A. Import flow client
- Client parse file, map header, validate required/price/status cơ bản ở `handleImportFile`:
  - `app/admin/products/page.tsx:355-457`
- Hiện client chỉ toast tổng: `Đã tạo X sản phẩm, bỏ qua Y`, và nếu lỗi thì chỉ báo `Có N dòng lỗi cần kiểm tra`.
- Không render lỗi theo từng dòng ngay trong UI, nên người dùng khó sửa file nhanh.

#### B. Import flow server
- `importFromExcelRows` ở `convex/products.ts:1005+`
- Business rules hiện có:
  - chỉ import tối đa 5.000 dòng
  - chỉ map category theo `categorySlug`
  - kiểm tra required field cơ bản
  - kiểm tra `price` là finite
  - duplicate SKU/slug: skip silently, không push vào `errors`, chỉ tăng `skipped`
  - nếu `status` thiếu thì fallback `defaultStatus`
  - stock invalid thì fallback 0
  - salePrice <= 0 thì bỏ qua
- Hệ quả nghiệp vụ:
  1. Dữ liệu duplicate bị skip nhưng user không biết dòng nào bị skip vì SKU hay slug.
  2. `stock` âm vẫn có thể lọt vì chỉ check finite, không check `>= 0`.
  3. `price` âm vẫn có thể lọt ở import, trong khi create/update thường yêu cầu price > 0 khi `saleMode = cart` và không hide base pricing.
  4. `salePrice > price` chưa bị chặn.
  5. `slug` hiện không validate format chuẩn SEO/kỹ thuật.
  6. `sku`/`slug` duplicate check đang case-sensitive theo giá trị lưu thực tế; chưa normalize lowercase nhất quán trước khi check.
  7. `getNextOrder(ctx)` bị gọi trong từng vòng lặp import; do `updateStats` tăng `lastOrder`, logic vẫn chạy nhưng tạo pattern query lặp lại không tối ưu.

#### C. Export flow server
- `listAdminExport` ở `convex/products.ts:402+`
- Có giới hạn 5.000 dòng, nhưng UI hiện không cảnh báo rõ khi dữ liệu thật vượt limit.
- Search/filter đang làm kiểu:
  - lấy `take(fetchLimit)` trước
  - rồi `.filter()` ở JS theo `name`/`sku`
- Điều này tạo rủi ro:
  - export theo lọc có thể không đầy đủ nếu dữ liệu lớn hơn fetch window
  - user tưởng là “xuất toàn bộ theo lọc”, nhưng thực tế là “xuất tối đa trong fetch window rồi lọc ở app layer”

#### D. Count / select all / admin list
- `listAdminWithOffset`, `countAdmin`, `listAdminIds`, `listAdminExport` đều có pattern lấy tập dữ liệu rồi filter search ở JS:
  - `convex/products.ts:256-435`
- `countAdmin` dùng `take(5001)` rồi đếm, không phải true count.
- `listAdminIds` cũng tương tự.
- Nếu dữ liệu tăng lớn, admin page sẽ có nguy cơ:
  - count sai tương đối
  - select all không thực sự all
  - export filtered không thực sự export hết filtered set
- Đây là issue business logic/scale thực sự, không chỉ UX.

#### E. Stats logic
- `getStats` đang dùng 3 lần `.collect()` theo status rồi lấy `.length`:
  - `convex/products.ts:466-489`
- Trong khi repo đã có `productStats` counter table (`convex/schema.ts:374+`).
- Có dấu hiệu inconsistency kiến trúc: một số count dùng counter table, nhưng `getStats` vẫn full scan theo status.

### Root Cause Confidence
- High
- Lý do:
  1. UX problem đến từ action architecture phẳng, thiếu semantic grouping, thiếu local state.
  2. Business logic problem đến từ việc search/count/export admin đang filter ở JS sau khi fetch một cửa sổ dữ liệu giới hạn.
  3. Import validation đang lệch chuẩn so với create/update flow nên có nguy cơ đưa dữ liệu bẩn vào DB.

### Audit Questions
1. Triệu chứng observed?
   - Expected: 4 nút Excel rõ nghĩa, responsive, export/import đáng tin, feedback rõ.
   - Actual: UI phẳng/rối; business logic có các điểm mơ hồ về completeness, validation, và feedback lỗi.
2. Phạm vi ảnh hưởng?
   - `/admin/products`, import/export Excel, count/select-all/search của admin products.
3. Có tái hiện ổn định không?
   - Có, đọc code path thấy pattern lặp lại ổn định.
4. Mốc thay đổi gần nhất?
   - Chưa xác định commit introduce cụ thể; evidence hiện có nằm trong code hiện tại.
5. Dữ liệu còn thiếu?
   - Chưa có metric dataset thực tế > 5.000 để đo blast radius runtime.
6. Có giả thuyết thay thế nào?
   - Có: vấn đề nằm ở template/guide sheet. Đã loại phần lớn vì helper sheet khá ổn; gốc nằm ở UI grouping + server query strategy + validation.
7. Rủi ro nếu fix sai nguyên nhân?
   - Chỉ sửa UI sẽ làm đẹp hơn nhưng không xử lý trust issue của export/count/search.
8. Tiêu chí pass/fail?
   - User/AI hiểu ngay action nào làm gì; export/import có trạng thái rõ; scope business logic issues được chỉ rõ minh bạch; nếu có implement sau thì phải không còn silent ambiguity.

## Problem Graph
1. [Excel actions ở /admin/products chưa thật UX và chưa thật đáng tin về nghiệp vụ] <- depends on 1.1, 1.2, 1.3
   1.1 [UI action architecture phẳng] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] 4 action đang ngang hàng, không có nhóm Template / Import / Export
   1.2 [Business logic import/export thiếu minh bạch] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Validation import chưa đồng bộ với rule create/update
      1.2.2 [ROOT CAUSE] Search/count/export admin đang filter sau fetch window giới hạn
   1.3 [Feedback lỗi/trạng thái chưa đủ actionable]

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Gom 4 nút thành 1 cụm `Excel Actions` là cách ít đổi code nhất nhưng tăng clarity mạnh nhất.
   - Action: Đề xuất menu/panel với 3 nhóm rõ nghĩa.
   - Reflection: ✓ Đúng lựa chọn bạn đã chốt.
2. Solving 1.2.1...
   - Thought: Import phải theo cùng logic nghiệp vụ với create/update, nếu không Excel sẽ trở thành đường bypass validation.
   - Action: Audit rule hiện có giữa `importFromExcelRows` và `create/update`.
   - Reflection: ✓ Tìm thấy lệch chuẩn rõ ràng: import đang lỏng hơn create/update.
3. Solving 1.2.2...
   - Thought: Nếu count/export/search admin fetch trước rồi filter JS, dữ liệu lớn sẽ sai nghiệp vụ.
   - Action: Audit `listAdminWithOffset`, `countAdmin`, `listAdminIds`, `listAdminExport`.
   - Reflection: ✓ Có evidence rõ của pattern fetch-window + filter-in-JS.
4. Solving 1.3...
   - Thought: User cần actionable feedback chứ không chỉ tổng số lỗi.
   - Action: Đề xuất error summary rõ nguyên nhân theo dòng / theo loại lỗi.
   - Reflection: ✓ Quan trọng cho UX và cho AI/automation readability.

## Proposal

### Option A — UX-only hardening (nhẹ nhất)
- Chỉ refactor UI 4 nút thành `Excel Actions`
- Thêm loading/disabled/hint tốt hơn
- Không sửa backend business logic
- Ưu điểm: ít rủi ro, nhanh
- Nhược: vẫn giữ risk count/export/search/import validation như cũ

### Option B — UX + business transparency trong UI (Recommend cho lần này)
- Vẫn chưa sửa query backend lớn
- Nhưng UI phải nói thật và rõ:
  - Export toàn bộ: hiển thị rõ `tối đa 5.000 dòng`
  - Export theo lọc: hiển thị `xuất trong giới hạn hệ thống`
  - Import: hiển thị summary lỗi actionable hơn
  - Loading state cụ thể từng action
- Đồng thời chuẩn hóa kiến trúc UI để lần sau cắm fix business logic dễ hơn
- Ưu điểm: đúng scope bạn chốt “audit + đề xuất, chưa sửa business logic sâu”, nhưng vẫn trung thực với người dùng
- Nhược: trust issue backend chưa biến mất hoàn toàn, chỉ được phơi bày minh bạch hơn

### Option C — UX + full business logic fix
- Sửa luôn count/search/export/import validation/backend query
- Đây là hướng tốt nhất về kỹ thuật nhưng vượt scope bạn vừa chốt

## Kế hoạch implement step-by-step nếu theo Option B (Recommend)

### 1) Refactor header actions
File: `app/admin/products/page.tsx`
- Đổi header sang layout responsive:
  - desktop: title bên trái, action bên phải
  - mobile: action xuống hàng, không wrap rối
- Chỉ giữ 2 CTA ngoài mặt:
  - `Excel Actions`
  - `Thêm sản phẩm`

### 2) Tạo Excel action state machine
File: `app/admin/products/page.tsx`
- Thêm state tập trung:
  - `excelActionState = 'idle' | 'template' | 'import' | 'export-filter' | 'export-all'`
  - `isExcelMenuOpen`
- Derive disabled/loading từ state này thay vì mỗi nút tự xử riêng

### 3) Gom 4 action thành 1 panel/menu
File: `app/admin/products/page.tsx`
- Không thêm thư viện mới nếu codebase chưa có dropdown/popover chuẩn
- Dùng panel nội bộ responsive
- Chia 3 nhóm:
  - Template
  - Import
  - Export
- Mỗi action có:
  - icon
  - title
  - mô tả 1 dòng
  - trạng thái loading/disabled riêng
  - label chuẩn hóa dạng Việt + keyword

### 4) Chuẩn hóa microcopy để AI/người dùng đều hiểu
File: `app/admin/products/page.tsx`
- `Tải mẫu (Template)`
- `Nhập Excel (Import)`
- `Xuất theo lọc (Export Filtered)`
- `Xuất toàn bộ (Export All)`
- Thêm description ngắn:
  - template: có hướng dẫn + lỗi mẫu
  - import: tạo sản phẩm hàng loạt từ `.xlsx`
  - export filtered: xuất danh sách đang lọc
  - export all: xuất tối đa 5.000 dòng

### 5) Làm rõ giới hạn business logic trong UI
File: `app/admin/products/page.tsx`
- Vì chưa sửa backend sâu ở lần này, UI phải cảnh báo đúng sự thật:
  - Export all: badge/hint `Giới hạn tối đa 5.000 dòng`
  - Export filtered: hint `Áp dụng bộ lọc hiện tại, giới hạn tối đa 5.000 dòng`
- Nếu `totalCountData.hasMore` hoặc backend có dấu hiệu vượt limit, hiển thị note rõ ràng ngay trong panel
- Không để user hiểu nhầm là export full không giới hạn

### 6) Nâng feedback import trong UI
File: `app/admin/products/page.tsx`
- Sau import, thay vì chỉ toast tổng số lỗi:
  - hiển thị summary có cấu trúc hơn trong toast/message
  - ví dụ: `Tạo 120, bỏ qua 8, lỗi 5 dòng`
- Nếu có thể trong scope UI file hiện tại, tạo lightweight error summary panel/drawer dưới header hoặc trên table sau import xong
- Vì chưa sửa mutation lần này, phần lỗi chi tiết vẫn giới hạn bởi dữ liệu server trả về; nhưng clientErrors hiện có thể group tốt hơn

### 7) Chuẩn hóa path cho đợt sửa business logic sau
File: `app/admin/products/page.tsx`
- Tách helper hiển thị action metadata ra constant nhỏ trong file hoặc component con nội bộ, để lần sau thay semantics/limit/rules dễ hơn
- Không đổi business handlers lõi ở lần này

## Business Logic Audit Notes để dành cho đợt implement sâu sau

### Import logic issues cần sửa trong phase sau
Files:
- `app/admin/products/page.tsx`
- `convex/products.ts`
- `lib/products/excel-contract.ts`

Đề xuất sâu cho phase sau:
1. Validate `price > 0` khi saleMode/cart và không dùng variant pricing che base price.
2. Validate `stock >= 0`.
3. Validate `salePrice <= price` khi có salePrice.
4. Validate format slug chuẩn lowercase kebab-case.
5. Normalize `slug` lowercase + trim trước duplicate check.
6. Normalize SKU theo policy thống nhất trước duplicate check.
7. Duplicate không nên chỉ `skipped`; nên trả về `errors/skippedReasons` theo từng dòng.
8. Cân nhắc batch hóa duplicate lookup tốt hơn nếu dataset import lớn.

### Export/count/search issues cần sửa trong phase sau
Files:
- `convex/products.ts`
- có thể thêm query mới chuyên cho admin search/export

Đề xuất sâu cho phase sau:
1. Tránh filter JS sau `take(fetchLimit)` cho admin count/export/list.
2. Nếu cần search theo name/SKU admin, tạo strategy query rõ ràng hơn:
   - search index phù hợp
   - hoặc query riêng cho SKU exact/prefix
   - hoặc server-side ranking + cursor strategy
3. `countAdmin` nên trả true count trong giới hạn nghiệp vụ rõ ràng, không chỉ `take(5001)`.
4. `listAdminIds` và `listAdminExport` phải dùng cùng semantics với count để tránh mismatch.
5. `getStats` nên tận dụng `productStats` counter table thay vì full collect 3 status.

## Counter-Hypothesis Check
- Giả thuyết đối chứng 1: “Chỉ cần đổi UI là đủ.”
  - Bị loại vì evidence cho thấy count/export/search có rủi ro sai khi dữ liệu lớn.
- Giả thuyết đối chứng 2: “Business logic Excel hiện đã chặt vì có template + guide + error sheet.”
  - Bị loại vì đó chỉ là trợ giúp nhập liệu; mutation import vẫn còn các lỗ validation và silent skip.

## Post-Audit
- Blast radius nếu implement Option B: thấp, chủ yếu `app/admin/products/page.tsx`
- Regression risk: thấp-trung bình, chủ yếu ở open/close panel và loading state
- Chi phí/độ phức tạp: thấp, đúng KISS/YAGNI vì chưa đụng backend sâu
- Blast radius nếu sau này implement full business fix: trung bình-cao, vì đụng `convex/products.ts` và semantics admin list/search/export/count

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Repro manual:
  1. Desktop/mobile vào `/admin/products`
  2. Mở `Excel Actions`
  3. Kiểm tra đủ 4 action + mô tả + trạng thái
  4. Trigger từng action, xác nhận loading local
  5. Kiểm tra note limit 5.000 hiển thị rõ
  6. Kiểm tra label song ngữ nhẹ, dễ hiểu
- Business verification ở scope audit lần này:
  - Confirm UI không che giấu giới hạn nghiệp vụ hiện tại
  - Confirm import/export wording không gây hiểu nhầm “full without limit”

## Chốt dễ hiểu
Mình audit kỹ và kết luận như sau:
- UX hiện tại của 4 nút Excel chưa gọn và chưa responsive tốt.
- Quan trọng hơn, business logic hiện cũng có vài điểm cần cảnh giác thật sự:
  - import validation còn lỏng hơn create/update
  - duplicate đang skip khá âm thầm
  - count/search/export admin có nguy cơ sai semantics khi dữ liệu lớn
- Vì bạn chốt lần này chỉ audit + đề xuất business logic, spec recommend là:
  - implement UX mạnh tay ngay
  - đồng thời làm UI “nói thật” về giới hạn 5.000 dòng và trạng thái action
  - chưa sửa backend sâu ở vòng này

Checklist:
- [ ] Gom 4 nút thành `Excel Actions`
- [ ] Rõ 3 nhóm Template / Import / Export
- [ ] Loading/disabled đúng từng action
- [ ] Label Việt + keyword chuẩn trong ngoặc
- [ ] Responsive tốt trên mobile
- [ ] Hiển thị rõ giới hạn export 5.000 dòng
- [ ] Không che giấu business logic limitation hiện tại
- [ ] Giữ business logic cũ, chỉ audit và expose rõ hơn ở UI

Nếu bạn duyệt, mình sẽ implement theo Option B.
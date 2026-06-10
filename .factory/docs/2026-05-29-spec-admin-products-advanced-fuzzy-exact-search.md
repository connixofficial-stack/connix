# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại, khi Admin tìm kiếm sản phẩm trên trang quản trị, hệ thống dùng tìm kiếm "mập mờ" (fuzzy search) của Convex. Nếu Admin gõ `[B]` (để tìm các sản phẩm phân loại lỗi/quà tặng được ký hiệu là `[B]`), hệ thống sẽ trả về tất cả các sản phẩm có chữ B (như Giày MLB, Giày JD1...) vì Convex chia từ và bỏ qua các dấu ngoặc vuông `[ ]`. Admin cũng không thể loại trừ (ví dụ lọc bỏ các sản phẩm có chữ `[B]`).
* **Giải pháp**: 
  a) Cho phép Admin sử dụng cú pháp tìm kiếm nâng cao: thêm dấu trừ `-` ở trước để loại trừ (ví dụ: `-[B]`), hoặc đặt trong dấu ngoặc kép `"..."` để tìm chính xác (ví dụ: `"[B]"`).
  b) Thêm nút toggle "Tìm chính xác" (Exact Match) ngay cạnh ô tìm kiếm để dễ dàng tìm khớp từng ký tự mà không cần dùng ngoặc kép.
  c) Hệ thống ở Backend sẽ tự động phân tách chuỗi tìm kiếm, thực hiện lọc chính xác bằng JavaScript trước khi phân trang để đảm bảo dữ liệu hiển thị đúng 100%.

## 2. Elaboration & Self-Explanation
Hiện tại Convex Search Index sử dụng giải thuật tìm kiếm toàn văn (full-text search) dựa trên token. Các ký tự đặc biệt như `[` và `]` bị loại bỏ, và việc tìm kiếm mang tính chất tương đối (fuzzy search). Điều này rất tốt khi Admin nhớ mang máng tên sản phẩm, nhưng lại gây khó khăn khi cần thao tác chính xác với các ký hiệu kỹ thuật như `[B]`.

Để giải quyết, ta sẽ xây dựng bộ lọc nâng cao chạy tại Convex Backend:
* Khi nhận tham số `search`, Convex sẽ chạy hàm parser để phân tích thành 3 danh sách từ khóa:
  - `excludes`: Các từ khóa bắt đầu bằng `-` (ví dụ: `-[b]`, `-giày`).
  - `exacts`: Các từ khóa nằm trong dấu ngoặc kép `""` (ví dụ: `"nike"`, `"[b]"`).
  - `normals`: Các từ khóa tìm kiếm thông thường.
* Nếu Admin kích hoạt chế độ `exactMode` từ giao diện, các từ khóa `normals` cũng sẽ được đối xử như `exacts` (so khớp chính xác dạng substring).
* Backend sẽ lấy danh sách sản phẩm thô từ cơ sở dữ liệu (qua Search Index nếu có từ khóa dương tính, hoặc qua index thường nếu chỉ có từ khóa loại trừ), sau đó lọc lại bằng JavaScript bằng cách đối chiếu chính xác (substring match) với tên và SKU của sản phẩm. 
* Cuối cùng, danh sách sau khi lọc sẽ được phân trang (slice) và đếm tổng số lượng để đảm bảo tính năng phân trang trên giao diện hoạt động chính xác 100%.

## 3. Concrete Examples & Analogies
* **Ví dụ 1**: Admin gõ `-[B]` vào ô tìm kiếm.
  - Hệ thống sẽ lấy toàn bộ sản phẩm hoạt động, sau đó lọc bỏ toàn bộ sản phẩm có tên hoặc SKU chứa cụm từ `[B]`. Kết quả là các sản phẩm như `[B] Giày MLB...` sẽ biến mất khỏi danh sách.
* **Ví dụ 2**: Admin gõ `giày -[B]` và bật toggle "Tìm chính xác".
  - Hệ thống tìm các sản phẩm chứa từ khóa `giày` (chính xác từng ký tự), đồng thời loại bỏ các sản phẩm chứa `[B]`.
* **Phép so sánh đời thường**: Giống như bạn đi thư viện nhờ thủ thư tìm sách. Thay vì chỉ nói "Tìm sách về Lịch sử", bạn nói "Tìm sách Lịch sử nhưng loại trừ sách về Chiến tranh Thế giới (bằng cách ghi `-Chiến tranh`) và phải có từ khóa chính xác là `1945`". Người thủ thư sẽ lấy chồng sách Lịch sử ra, lật từng cuốn để lọc bỏ những cuốn về Chiến tranh và chỉ giữ lại những cuốn nhắc chính xác đến số `1945`.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file UI: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/page.tsx)
  - Sử dụng `useQuery(api.products.listAdminWithOffset)` để lấy dữ liệu trang hiện tại.
  - Sử dụng `useQuery(api.products.countAdmin)` để lấy tổng số lượng sản phẩm phù hợp.
  - Giao diện có ô nhập `<Input placeholder="Tìm tên sản phẩm..." value={searchTerm} />`.
* Đã kiểm tra file Backend: [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts)
  - Hàm `searchAdminProducts` đang thực hiện tìm kiếm fuzzy trên `search_name` và `search_sku` bằng Convex `withSearchIndex`.
  - Các hàm `listAdminWithOffset`, `countAdmin`, `listAdminIds` và `listAdminExport` đều gọi qua `searchAdminProducts` nếu tham số `search` tồn tại.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Cơ chế tìm kiếm `withSearchIndex` của Convex không hỗ trợ toán tử loại trừ (`NOT` hoặc `AND NOT`) và tự động tokenize loại bỏ ký tự đặc biệt (như `[` và `]`), làm mất đi khả năng tìm kiếm chính xác 100% khi có ký hiệu đặc biệt.
* **Giả thuyết đối chứng**: Nếu ta chỉ filter danh sách sản phẩm ở phía Client (React), ta chỉ có thể filter trên trang hiện tại (ví dụ 12 hoặc 20 sản phẩm đang hiển thị). Việc này làm sai lệch hoàn toàn số lượng phân trang, tổng số lượng sản phẩm, và Admin không thể chọn hàng loạt (bulk select) trên toàn bộ kết quả lọc. Vì vậy, logic lọc nâng cao bắt buộc phải nằm ở Backend (Convex) trước khi thực hiện slice phân trang.

---

# IV. Proposal (Đề xuất)

## 1. Backend (Convex)
* Xây dựng hàm parser `parseSearchQuery(search: string)` để bóc tách từ khóa loại trừ, khớp chính xác và tìm thường.
* Cập nhật hàm `searchAdminProducts` để hỗ trợ lọc kết quả thô bằng JS:
  - Nếu chuỗi tìm kiếm chỉ chứa từ khóa loại trừ (ví dụ: `-[B]`), ta lấy toàn bộ sản phẩm của category/status đó (tối đa 5000), sau đó lọc bỏ sản phẩm chứa từ khóa loại trừ.
  - Nếu có từ khóa tìm kiếm dương tính, ta dùng search index của Convex để lấy danh sách thô (nới rộng giới hạn lấy để tránh bị thiếu sau khi lọc), sau đó lọc lại qua JS.
* Cập nhật các API query: `listAdminWithOffset`, `countAdmin`, `listAdminIds`, `listAdminExport` để chấp nhận thêm tham số `exactMode?: boolean` và áp dụng logic lọc nâng cao.

## 2. Frontend (NextJS UI)
* Thêm nút checkbox/toggle "Khớp chính xác" (Exact match) bên cạnh ô input tìm kiếm.
* Truyền tham số `exactMode` vào các query Convex tương ứng.
* Việt hóa nhãn và tooltip để hướng dẫn Admin sử dụng cú pháp tìm nâng cao (ví dụ: "Dùng dấu trừ - để loại trừ, ví dụ: -[B]").

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [convex/products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts)
  - Cập nhật logic tìm kiếm, thêm hàm helper parse search query, hỗ trợ tham số `exactMode` và filter JS.
* **Sửa**: [app/admin/products/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/page.tsx)
  - Thêm checkbox toggle "Khớp chính xác" và truyền `exactMode` vào API Convex. Hướng dẫn cú pháp lọc loại trừ trong placeholder/helper text.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và phân tích kỹ code search hiện tại ở [convex/products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/products.ts).
2. Định nghĩa hàm parse search query ở đầu file hoặc file helper phù hợp.
3. Cập nhật `searchAdminProducts` và các query `listAdminWithOffset`, `countAdmin`, `listAdminIds`, `listAdminExport` để tích hợp parser và filter JS.
4. Chỉnh sửa component UI ở `app/admin/products/page.tsx` để thêm toggle và tooltip/placeholder hướng dẫn.
5. Review tĩnh code, đảm bảo types và null-safety.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Automated Tests & Typecheck
* Thực hiện chạy `bunx tsc --noEmit` thủ công để đảm bảo không có lỗi TypeScript.

## 2. Manual Verification
* Mở trình duyệt tại http://localhost:3000/admin/products.
* Nhập `[B]` và kiểm tra xem danh sách sản phẩm có được thu hẹp về các sản phẩm chứa chính xác `[B]` hay không (khi bật toggle "Khớp chính xác" hoặc gõ `"[B]"`).
* Nhập `-[B]` và kiểm tra xem tất cả sản phẩm có ký hiệu `[B]` đã bị loại bỏ khỏi danh sách hay chưa.
* Thử kết hợp: `giày -[B]` để xem các sản phẩm giày không chứa `[B]` được hiển thị, phân trang và đếm tổng số lượng vẫn chính xác.

---

# VIII. Todo

- [ ] Viết hàm parseSearchQuery và hàm matchProduct trong `convex/products.ts`.
- [ ] Cập nhật API query `listAdminWithOffset`, `countAdmin`, `listAdminIds`, và `listAdminExport` để hỗ trợ `exactMode` và áp dụng logic lọc nâng cao.
- [ ] Thêm toggle "Tìm chính xác" và tooltip hướng dẫn cú pháp `-` loại trừ vào giao diện `app/admin/products/page.tsx`.
- [ ] Kiểm tra typecheck và review tĩnh trước khi bàn giao.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Đạt**:
  - Khi gõ `-[B]`, tất cả sản phẩm chứa `[B]` trong tên hoặc SKU biến mất khỏi danh sách.
  - Khi gõ `"[B]"` hoặc gõ `[B]` và bật toggle "Tìm chính xác", chỉ hiển thị các sản phẩm có chứa cụm từ `[B]`.
  - Phân trang, tổng số lượng ("Đã chọn X sản phẩm trên trang này", "X sản phẩm phù hợp") cập nhật chính xác theo kết quả sau khi lọc nâng cao.
  - Không làm ảnh hưởng đến tốc độ load trang hoặc gây lỗi biên dịch.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lọc ở JS có thể làm giảm hiệu năng nếu số lượng sản phẩm quá lớn (>10.000 sản phẩm). Tuy nhiên, số lượng sản phẩm hiện tại của hệ thống ở admin chỉ khoảng hơn 300 sản phẩm và Convex giới hạn query tối đa 5.000 sản phẩm, nên việc lọc trên JS diễn ra cực kỳ nhanh (dưới 5ms).
* **Hoàn tác**: Sử dụng `git checkout` để hoàn tác các file `convex/products.ts` và `app/admin/products/page.tsx` về trạng thái ban đầu.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không áp dụng bộ lọc nâng cao này cho phía khách hàng (frontend client-facing search) vì khách hàng không cần dùng cú pháp loại trừ phức tạp. Chỉ áp dụng cho khu vực quản trị Admin.

---

# XII. Open Questions (Câu hỏi mở)
* Không có câu hỏi nào thêm. Cú pháp loại trừ bằng dấu trừ `-` và tìm chính xác bằng dấu ngoặc kép hoặc checkbox toggle là phương án tối ưu nhất.

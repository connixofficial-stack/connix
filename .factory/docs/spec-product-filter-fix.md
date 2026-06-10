# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các bộ lọc (filters) của trang danh sách sản phẩm (như `/ruou-manh`) bị ẩn mất một cách vô lý.
* **Nguyên nhân**: Hệ thống chỉ nhìn vào các sản phẩm ở **trang hiện tại (trang 1)** để quyết định xem hiển thị bộ lọc nào. Vì cả 3 chai rượu ở trang 1 đều là xuất xứ "Scotland", hệ thống nghĩ "tất cả rượu mạnh đều ở Scotland" nên tự động giấu luôn bộ lọc "Xuất xứ".
* **Cách sửa**: Tách biệt danh sách bộ lọc khỏi danh sách sản phẩm của một trang. Trả lại toàn bộ các bộ lọc thuộc về Loại sản phẩm đó để người dùng có thể lọc, thay vì tự ý ẩn đi.

## 2. Elaboration & Self-Explanation
Hiện tại, trang danh sách sản phẩm lấy danh sách 12 sản phẩm của trang đầu tiên (`productIds`), sau đó gửi xuống hệ thống hỏi: "Này, 12 sản phẩm này dùng những terms (giá trị thuộc tính) nào?". Hệ thống trả về `activeTermIds`.
Sau đó, giao diện dùng `activeTermIds` này để cắt gọt các bộ lọc hiển thị. Khổ nỗi, nếu 12 sản phẩm đầu tiên tình cờ có chung một vài đặc điểm (cùng Thương hiệu, cùng Xuất xứ, cùng Thùng ủ), số lượng term của nhóm thuộc tính đó sẽ bị giảm xuống chỉ còn `1`. 
Lúc này, một đoạn code cũ kiểm tra `group.terms.length > 1` sẽ thấy: "Ồ, bộ lọc này chỉ có 1 giá trị duy nhất, không cần thiết cho user chọn" và **ẩn luôn** bộ lọc đó đi. Điều này khiến user không thể nào lọc để tìm các chai rượu Pháp hay Ý (vốn nằm ở trang 2, trang 3).

## 3. Concrete Examples & Analogies
**Analogy (Trực giác)**: Tưởng tượng bạn vào thư viện tìm sách. Bà thủ thư nhìn vào 10 quyển sách trên mặt bàn (đều là sách Toán), nên bà ấy cất luôn tấm biển "Khoa học - Văn học - Lịch sử" đi. Thế là bạn tưởng thư viện này chỉ có mỗi sách Toán, trong khi hàng ngàn quyển Văn học đang nằm ở các kệ phía sau.

**Ví dụ thực tế**: Tại route `/ruou-manh`, admin đã gán 8 nhóm thuộc tính (Tuổi rượu, Thùng ủ, Thương hiệu, Dung tích, %abv, Hương vị, Xuất xứ, Chất liệu). Trang 1 load lên 3 sản phẩm, cả 3 đều có xuất xứ "Scotland". Hệ thống lọc term của nhóm Xuất xứ chỉ còn 1 term là "Scotland". Kế tiếp, điều kiện `group.terms.length > 1` (1 > 1 là `false`) kích hoạt, khiến nhóm Xuất xứ bị ẩn hoàn toàn.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng quan sát được**: Truy cập `/ruou-manh`, không thấy hiển thị đầy đủ 8 bộ lọc đã cấu hình trong Admin.
* **Phạm vi ảnh hưởng**: Toàn bộ trang danh sách sản phẩm có bật tính năng "Phân loại & Thuộc tính" (Product Types).
* **Mốc thay đổi**: Lỗi xảy ra do cơ chế Pagination áp dụng sai lên việc build giao diện Filter Facets.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
**Root Cause Confidence: High**
* **Nguyên nhân chính**: Việc giới hạn các Term (giá trị bộ lọc) dựa vào danh sách sản phẩm của **trang hiện tại** (`activeTermIds`) kết hợp với điều kiện kiểm tra độ dài `group.terms.length > 1` (tại dòng 563 file `ProductsPage.tsx`) đã vô tình giấu đi các bộ lọc hợp lệ.
* **Bằng chứng**: Bằng công cụ CLI, truy vấn Convex trả về 3 sản phẩm trên trang 1 của `/ruou-manh`. Tất cả 3 sản phẩm này đều có chung `groupId` của "Thùng ủ", "Thương hiệu", "Xuất xứ", v.v., khiến số lượng term trả về cho các group này bằng 1.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Có thể do API Convex không trả về cấu hình groups? Đã loại trừ, CLI xác nhận trả về đủ 8 assigned groups. Có thể do `isFilterable = false`? Đã loại trừ, DB ghi nhận `isF: true` cho cả 8 nhóm.

# IV. Proposal (Đề xuất)
Ngừng việc sử dụng `activeTermIds` (của trang hiện tại) để "cắt xén" danh sách terms trong sidebar Filter.
Sửa đổi logic `displayFilterableGroups` trong `ProductsPage.tsx`:
1. Giữ nguyên toàn bộ terms gốc được cung cấp từ `filterableGroups`.
2. Thay đổi điều kiện `group.terms.length > 1` thành `group.terms.length > 0` để các nhóm thuộc tính có ít nhất 1 term hợp lệ vẫn được hiển thị (đề phòng admin lỡ tay chỉ nhập 1 term vào nhóm).

# V. Files Impacted (Tệp bị ảnh hưởng)
1. **`app/(site)/_components/products/ProductsPage.tsx`**
   * *Vai trò*: Trang danh sách sản phẩm chính, xử lý load data và render filter.
   * *Thay đổi*: Sửa lại `useMemo` của `displayFilterableGroups`. Bỏ dòng code lọc term theo `activeTermSet`, sửa điều kiện filter mảng từ `> 1` sang `> 0`.

# VI. Execution Preview (Xem trước thực thi)
1. Mở file `ProductsPage.tsx`.
2. Định vị block `const displayFilterableGroups = useMemo(...)` (khoảng dòng 530).
3. Sửa phần nội dung để không dùng `activeTermSet` cho các group non-range.
4. Đổi return của `filter` non-range thành `return group.terms.length > 0`.
5. Đảm bảo UI không bị crash, giao diện Filter Sidebar trên desktop và mobile nhận đủ danh sách bộ lọc.

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. Tải lại trang `http://localhost:3000/ruou-manh`.
2. Xác minh rằng sidebar Filter (và Mobile filter) hiển thị đủ các nhóm: "Tuổi rượu", "Thùng ủ", "Thương hiệu", "Dung tích", "%abv", "Hương vị", "Xuất xứ", "Chất liệu".
3. Xác minh click vào các giá trị bộ lọc không gây lỗi router.

# VIII. Todo
- [ ] Cập nhật logic `displayFilterableGroups` trong `ProductsPage.tsx`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/ruou-manh` hiển thị đầy đủ các bộ lọc đã cấu hình cho Product Type "Rượu mạnh".
- Bộ lọc không tự động biến mất khi người dùng chuyển trang hoặc khi trang hiện tại chỉ có 1 giá trị.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Khi bỏ giới hạn, người dùng có thể chọn các bộ lọc mà hệ thống chưa có sản phẩm (hiển thị thông báo "Không có sản phẩm nào"). Tuy nhiên, đây là hành vi tiêu chuẩn (standard behavior) của đa số E-commerce UI khi không áp dụng Advanced ElasticSearch Faceted Search.
- **Hoàn tác**: Revert code trong `ProductsPage.tsx` bằng git.

# XI. Out of Scope (Ngoài phạm vi)
- Xây dựng Advanced Faceted Search chạy trên database Convex (tự động đếm sản phẩm cho toàn danh mục) là ngoài phạm vi của Task này vì sẽ phải viết lại backend query rất nặng. Dùng standard fallback filter.

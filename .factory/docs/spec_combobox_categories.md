# Spec: Tối ưu hiển thị danh mục storefront & Khung cuộn kèm lọc tìm kiếm khi danh sách dài

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Danh sách danh mục sản phẩm ở Sidebar storefront hiện tại hiển thị thô cứng, có đường viền đen đậm bao quanh từng nút bấm không được thẩm mỹ. Hơn nữa, khi cửa hàng có quá nhiều danh mục (trên 8 danh mục), danh sách này kéo dài lê thê xuống dưới, làm hỏng giao diện tổng thể.
* **Giải pháp**:
  * **Cải tiến giao diện**: Thiết kế lại các nút danh mục với phong cách hiện đại: bo góc mềm mại (`rounded-lg`), loại bỏ đường viền thô cứng (dùng `border-transparent`), nút active dùng màu đỏ/primary đậm nổi bật, nút inactive dùng màu nền xám nhạt tự nhiên và chữ tối màu.
  * **Giải pháp thông minh**: Khi số lượng danh mục vượt quá 8, hệ thống không ẩn đi hoàn toàn mà vẫn hiển thị trực tiếp danh sách các danh mục (tối đa khoảng 8-10 danh mục hiển thị cùng lúc), giới hạn chiều cao (`max-h-72`) và cho phép cuộn chuột (`overflow-y-auto`). Đồng thời, tích hợp một ô nhập liệu tìm kiếm nhanh ngay phía trên danh sách nút để người dùng lọc nhanh danh mục theo thời gian thực.

## 2. Elaboration & Self-Explanation
Storefront sử dụng hai layout chính là `CatalogLayout` và `ListLayout` (trong tệp [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/LayoutComponents.tsx)) để hiển thị danh sách sản phẩm. Cấu hình `showCategories` quyết định việc hiển thị sidebar danh mục này.

Để giải quyết vấn đề hiển thị và số lượng danh mục quá lớn, chúng ta sẽ thực hiện:
a) **Thiết kế lại nút danh mục**:
* Loại bỏ border cứng bằng cách gán `border-transparent`.
* Sử dụng màu nền nhạt của hệ thống (`tokens.filterChipBg`) cho các nút inactive để tạo chiều sâu thay vì dùng viền xám thô.
* Đồng bộ bo góc `rounded-lg` để bo tròn mềm mại giống như thiết kế hiện đại 2026.
* Khoảng đệm (padding) êm ái hơn để các ngón tay dễ chạm.

b) **Xây dựng khung cuộn kèm lọc tìm kiếm (khi số lượng > 8)**:
* Quản lý trạng thái từ khóa tìm kiếm `categoryQuery` bằng React State trực tiếp trong `CatalogLayout` và `ListLayout`.
* Lọc danh sách danh mục hiển thị theo thời gian thực bằng `useMemo`.
* Hiển thị ô tìm kiếm nhỏ gọn phía trên danh sách danh mục (có icon Search và nút xóa nhanh X).
* Giới hạn chiều cao danh sách danh mục bằng class Tailwind `max-h-72` và cho phép cuộn bằng `overflow-y-auto`.
* Cho phép hiển thị nút "Tất cả danh mục" khi từ khóa tìm kiếm trống hoặc khớp với cụm từ "tất cả".

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  * Cửa hàng có 4 danh mục: "Vang đỏ", "Vang trắng", "Whisky", "Sake". Sidebar hiển thị 4 nút bấm bo góc tròn đều, nền xám nhạt, nút "Vang đỏ" đang chọn thì có nền đỏ sẫm chữ trắng nổi bật.
  * Cửa hàng thêm 6 danh mục mới (tổng 10). Ngay lập tức, sidebar hiển thị một ô nhập liệu "Tìm nhanh danh mục..." ở trên cùng. Dưới đó là danh sách danh mục được bọc trong khung cuộn cao 288px (max-h-72). Người dùng nhìn thấy ngay 8 danh mục đầu tiên, có thể cuộn chuột để xem các mục dưới. Nếu họ gõ chữ "sake" vào ô tìm kiếm, danh sách ở dưới lập tức thu hẹp lại chỉ hiển thị nút "Sake Junmai" để click chọn.
* **Hình ảnh đời thường**: Hãy tưởng tượng một tủ gia vị trong nhà bếp. Nếu bạn chỉ có 5 lọ gia vị, bạn xếp chúng thẳng hàng trên kệ. Nhưng nếu bạn có 20 lọ gia vị, việc xếp tất cả chúng thành một hàng ngang dài sẽ làm chật kệ bếp. Thay vào đó, bạn xếp chúng trong một khay xoay (giới hạn diện tích kệ) để xoay tìm, đồng thời dán nhãn lớn nổi bật trên nắp lọ để khi nhìn lướt qua hoặc tìm kiếm là thấy ngay.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp mã nguồn liên quan**:
  * [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/LayoutComponents.tsx): Chứa định nghĩa của `CatalogLayout` và `ListLayout`. Cả hai đang chứa khối render danh mục dạng danh sách các nút bấm thô sơ với style border cứng: `borderColor: tokens.filterChipBorder` hoặc `tokens.filterChipActiveBorder`.
  * Chúng ta đã thêm component `CategoryCombobox` trong commit nháp trước đó. Giờ ta sẽ loại bỏ nó và thay bằng cơ chế Input lọc trực tiếp trên danh sách nút có chiều cao giới hạn và scrollbar như yêu cầu mới của user.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause (Nguyên nhân gốc)**: Thiết kế hiện tại hiển thị tĩnh toàn bộ danh sách danh mục sản phẩm, không có cơ chế giới hạn chiều cao tối đa cho danh sách dài và thiếu ô tìm kiếm tại chỗ để lọc danh mục nhanh.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Nếu ẩn toàn bộ danh mục dưới 1 nút dropdown popover, khách hàng sẽ mất thêm 1 click để mở danh sách, làm giảm tỷ lệ tương tác trực tiếp với các danh mục hàng đầu. Do đó, hiển thị trực tiếp danh sách trong khung cuộn giới hạn chiều cao kèm ô lọc tìm kiếm là lựa chọn tối ưu nhất cho cả mặt thẩm mỹ và khả năng tiếp cận (Accessibility).

---

# IV. Proposal (Đề xuất)

1. **Thêm state quản lý tìm kiếm danh mục** vào `CatalogLayout` và `ListLayout`:
   ```typescript
   const [categoryQuery, setCategoryQuery] = useState('');
   ```
2. **Lọc danh mục bằng `useMemo`**:
   ```typescript
   const filteredCategories = useMemo(() => {
     const query = categoryQuery.trim().toLowerCase();
     if (!query) return categories;
     return categories.filter((cat) => cat.name.toLowerCase().includes(query));
   }, [categories, categoryQuery]);
   ```
3. **Logic hiển thị danh mục trong Sidebar & Mobile Drawer**:
   * Nếu `categories.length > 8`, hiển thị ô input tìm kiếm danh mục phía trên.
   * Bọc danh sách các nút danh mục trong `div` có class `max-h-72 overflow-y-auto pr-1` (nếu > 8 danh mục) để hiển thị thanh cuộn dọc mượt mà.
   * Loại bỏ toàn bộ viền thô cứng của các nút danh mục, dùng `border-transparent`, bo góc mềm mại `rounded-lg` và padding thích hợp.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/LayoutComponents.tsx)
  * Xóa component helper `CategoryCombobox` (không còn cần thiết).
  * Thêm state `categoryQuery` và logic lọc trong `CatalogLayout` và `ListLayout`.
  * Style lại phần render danh mục hiện tại (danh sách nút) để đạt thẩm mỹ cao (nền xám nhạt cho inactive, không viền cứng, bo góc mềm mại).
  * Thêm ô tìm kiếm danh mục và bọc trong khung cuộn `max-h-72` khi `categories.length > 8`.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Cập nhật mã nguồn**:
   * Chỉnh sửa tệp [LayoutComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/LayoutComponents.tsx) để thay đổi logic render danh mục.
2. **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo code sạch, không lỗi kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kế hoạch kiểm chứng: Typecheck và manual check
* **Kiểm tra tự động**:
  `bunx tsc --noEmit`
* **Kiểm tra thủ công**:
  1. Kiểm tra trường hợp danh mục <= 8: Các nút hiển thị dạng danh sách nút dọc bo góc tròn mềm mại, không có viền thô xung quanh, nút active màu đỏ đậm.
  2. Trường hợp danh mục > 8: Sidebar hiển thị ô tìm kiếm "Tìm nhanh danh mục..." và danh sách danh mục có thanh cuộn dọc (chiều cao giới hạn).
  3. Thử gõ từ khóa tìm kiếm: Danh sách nút lập tức được lọc theo thời gian thực, nút "Tất cả danh mục" ẩn đi nếu từ khóa không khớp.

---

# VIII. Todo
- [ ] Xóa component `CategoryCombobox` thừa khỏi `LayoutComponents.tsx`.
- [ ] Thêm state `categoryQuery` và logic `filteredCategories` vào `CatalogLayout`.
- [ ] Cập nhật khối render danh mục trong `CatalogLayout` (desktop sidebar & mobile drawer) có ô tìm kiếm và khung cuộn.
- [ ] Thêm state `categoryQuery` và logic `filteredCategories` vào `ListLayout`.
- [ ] Cập nhật khối render danh mục trong `ListLayout` (desktop sidebar & mobile drawer) có ô tìm kiếm và khung cuộn.
- [ ] Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* **Đạt**: 
  * Nút danh mục bo góc tròn mềm mại, không có viền cứng thô.
  * Khi số lượng danh mục > 8, xuất hiện ô tìm kiếm danh mục và danh sách nút được giới hạn chiều cao tối đa (`max-h-72`), cho phép cuộn chuột mượt mà.
  * Tìm lọc danh mục hoạt động chính xác theo thời gian thực.
* **Không đạt**: Lộ viền cứng bao quanh các nút danh mục, hoặc danh mục dài làm vỡ bố cục sidebar storefront mà không giới hạn chiều cao.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Hoàn tác**: Sử dụng `git checkout app/(site)/_components/products/LayoutComponents.tsx` để khôi phục nhanh giao diện cũ.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại giao diện trang Admin hoặc thay đổi schema danh mục sản phẩm trong Convex.

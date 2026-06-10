# I. Primer

## 1. TL;DR kiểu Feynman
Khi admin tạo hoặc sửa sản phẩm, phần chọn "Danh mục" chỉ hiển thị tối đa 8 danh mục chưa chọn. Nếu hệ thống có nhiều danh mục hơn (ví dụ 20-30 danh mục), admin lăn xuống cuối sẽ không thấy thêm và dễ hiểu lầm là hệ thống chỉ có bấy nhiêu. 
Để giải quyết điều này, chúng ta sẽ thêm một nút "Xem thêm (còn X danh mục khác)" ở cuối danh sách. Khi click vào nút này, danh sách sẽ hiển thị thêm các danh mục tiếp theo một cách mượt mà và trực quan, giúp admin biết rõ tổng số lượng danh mục hiện có.

## 2. Elaboration & Self-Explanation
Hiện tại trong component `CategoryTagsInput`, danh sách danh mục lọc được giới hạn bằng `.slice(0, 8)`. Việc giới hạn cứng này tối ưu hóa không gian hiển thị ban đầu của dropdown, nhưng lại vô tình che giấu các danh mục còn lại nếu danh sách thực tế dài hơn.
Chúng ta sẽ thay thế việc giới hạn cứng này bằng cách sử dụng một state `limit` động (mặc định là 8). Chúng ta sẽ tính toán toàn bộ danh mục khớp với điều kiện tìm kiếm. Nếu số danh mục khớp nhiều hơn `limit` hiện tại, một nút "Xem thêm" dạng nét đứt thanh lịch sẽ xuất hiện ở cuối danh sách cuộn, hiển thị rõ số lượng danh mục chưa được tải (ví dụ: `Xem thêm (còn 12 danh mục khác)`). Khi admin click vào nút này, `limit` sẽ tăng lên thêm 12 phần tử, tải thêm các danh mục tiếp theo vào view. Đồng thời, khi admin nhập từ khóa tìm kiếm (`query` thay đổi), state `limit` sẽ tự động reset về 8 để tối ưu hóa diện tích hiển thị và tìm kiếm nhanh.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Hệ thống có 25 danh mục. Khi admin mở dropdown chọn danh mục mà chưa tìm kiếm gì, dropdown chỉ hiển thị 8 danh mục đầu tiên và một nút ở dưới cùng ghi: "Xem thêm (còn 17 danh mục khác)". Khi admin bấm nút này, danh sách mở rộng hiển thị thêm 12 danh mục nữa (tổng cộng 20 danh mục hiển thị), nút bên dưới cập nhật thành: "Xem thêm (còn 5 danh mục khác)". Admin tiếp tục bấm thì hiển thị hết 25 danh mục và nút "Xem thêm" biến mất.
- **Trực quan đời thực**: Nó giống như việc bạn đi mua sách ở một cửa hàng. Thay vì nhân viên chỉ bày ra đúng 8 cuốn sách trên kệ và cất hết số còn lại trong kho làm bạn tưởng cửa hàng chỉ có bấy nhiêu sách, nhân viên sẽ bày 8 cuốn ra và để thêm một tấm bảng ghi "Còn 17 cuốn khác trong kho, hãy nhấn chuông nếu muốn xem thêm".

# II. Audit Summary (Tóm tắt kiểm tra)
- Tệp tin chính chịu trách nhiệm hiển thị dropdown danh mục là [AdditionalCategoriesSelect.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AdditionalCategoriesSelect.tsx).
- Component `CategoryTagsInput` thực hiện lọc danh mục ở dòng 34-37 và cắt mảng cứng ở `.slice(0, 8)`.
- Component này được tái sử dụng ở 6 trang quản trị khác nhau bao gồm: tạo/sửa sản phẩm, tạo/sửa bài viết, tạo/sửa dịch vụ. Sửa đổi ở đây sẽ tự động cải thiện trải nghiệm ở tất cả các khu vực này mà không cần sửa lặp lại nhiều nơi.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng quan sát được**: Cuộn dropdown danh mục chỉ hiển thị tối đa 8 mục, không có chỉ báo cho thấy vẫn còn danh mục khác, gây hiểu lầm cho admin.
- **Nguyên nhân gốc (Root Cause)**: Do dòng code `.slice(0, 8)` cắt cứng kết quả hiển thị của mảng danh mục đã lọc mà không kèm theo cơ chế phân trang hoặc nút xem thêm.
- **Giả thuyết đối chứng (Counter-Hypothesis)**: Nếu chúng ta tăng giới hạn hiển thị cứng lên (ví dụ hiển thị toàn bộ danh mục), menu dropdown sẽ trở nên cực kỳ dài và gây giật lag hoặc xấu giao diện khi có hàng trăm danh mục. Do đó, cơ chế tăng giới hạn động (Load More) kết hợp reset khi tìm kiếm là giải pháp cân bằng hoàn hảo giữa hiệu năng và trải nghiệm người dùng (UX).

# IV. Proposal (Đề xuất)
1. Thêm state `limit` động vào component `CategoryTagsInput`:
   ```typescript
   const [limit, setLimit] = useState(8);
   ```
2. Reset `limit` về 8 khi `query` (từ khóa tìm kiếm) thay đổi bằng `useEffect`:
   ```typescript
   useEffect(() => {
     setLimit(8);
   }, [query]);
   ```
3. Lọc danh sách danh mục thành hai bước:
   - `allFilteredCategories`: Chứa tất cả danh mục chưa chọn và khớp từ khóa.
   - `filteredCategories`: Cắt theo `limit` động hiện tại.
4. Render thêm nút "Xem thêm" ở dưới cùng danh sách cuộn nếu `allFilteredCategories.length > limit`. Nút này sẽ hiển thị số lượng danh mục còn lại và tăng `limit` thêm 12 khi click.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [AdditionalCategoriesSelect.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AdditionalCategoriesSelect.tsx)
  - Vai trò hiện tại: Cung cấp input tag select chọn nhiều danh mục cho các thực thể sản phẩm, bài viết, dịch vụ.
  - Thay đổi: Cập nhật logic lọc danh mục với `limit` động và render nút "Xem thêm" ở cuối dropdown.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ lại tệp tin [AdditionalCategoriesSelect.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/AdditionalCategoriesSelect.tsx).
2. Viết code thay đổi sử dụng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Kiểm tra TypeScript typecheck để đảm bảo không phát sinh lỗi biên dịch.
4. Xác minh giao diện và logic vận hành tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Typecheck tĩnh**: Chạy lệnh `bunx tsc --noEmit` để xác nhận toàn bộ project không có lỗi TypeScript liên quan đến thay đổi này.
- **Kiểm chứng thủ công**: Admin sẽ kiểm tra trực quan khi chạy dev server.

# VIII. Todo
- [ ] Khai báo state `limit` và `useEffect` reset limit trong `CategoryTagsInput`.
- [ ] Tính toán `allFilteredCategories` và `filteredCategories` dựa trên `limit`.
- [ ] Thêm nút "Xem thêm" vào cuối danh sách button danh mục trong dropdown.
- [ ] Thực hiện chạy typecheck để đảm bảo an toàn biên dịch.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Giao diện ban đầu hiển thị tối đa 8 danh mục (hoặc ít hơn nếu tổng số danh mục thực tế nhỏ hơn 8).
- Nếu tổng số danh mục khớp bộ lọc lớn hơn 8, xuất hiện nút "Xem thêm (còn X danh mục khác)" ở cuối danh sách cuộn.
- Bấm vào nút "Xem thêm" sẽ mở rộng danh sách thêm 12 danh mục và cập nhật số lượng còn lại chính xác.
- Khi nhập từ khóa tìm kiếm, danh sách tự động reset giới hạn về 8 và lọc đúng theo từ khóa.
- Không phát sinh lỗi TypeScript compile.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Không có rủi ro về mặt logic dữ liệu vì đây thuần túy là cải tiến giao diện hiển thị (UI/UX) ở phía client.
- **Hoàn tác**: Hoàn tác dễ dàng bằng cách khôi phục lại phiên bản cũ từ Git.

# XI. Out of Scope (Ngoài phạm vi)
- Không canทีệp vào các API lấy danh sách danh mục từ backend.
- Không sửa đổi schema hay cấu trúc dữ liệu của danh mục.

# XII. Open Questions (Câu hỏi mở)
- *Không có câu hỏi mở*. Cơ chế loadmore dạng button kèm số lượng còn lại là phương án tối ưu và an toàn nhất cho UX của trang admin.

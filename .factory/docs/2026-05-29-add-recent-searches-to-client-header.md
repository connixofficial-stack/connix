# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn vào trang chủ Than Shoes (giao diện bán hàng thực tế cho khách hàng) và click vào ô tìm kiếm ở trên cùng, hệ thống sẽ tự động hiện ra danh sách tối đa 5 từ khóa bạn đã từng gõ tìm kiếm gần đây (ví dụ: "giày nike", "converse", "sneaker"). Mỗi từ khóa sẽ đi kèm một icon đồng hồ lịch sử xoay ngược và một nút X nhỏ bên phải để xóa nhanh. Nếu bạn click vào từ khóa đó, trang web sẽ tự động tìm kiếm ngay lập tức cho bạn mà không cần gõ lại.

## 2. Elaboration & Self-Explanation
Hiện tại, ô tìm kiếm trên giao diện khách hàng được xử lý bởi component `HeaderSearchAutocomplete.tsx`. Hiện trạng hoạt động là: ô tìm kiếm chỉ mở dropdown gợi ý khi người dùng gõ từ khóa từ 1 ký tự trở lên. Khi người dùng click vào ô tìm kiếm mà chưa gõ gì (query rỗng), dropdown hoàn toàn không hiển thị.

Để nâng cấp trải nghiệm tìm kiếm của khách hàng giống như Microsoft Search/Bing Search:
- **Lưu trữ từ khóa**: Khi khách hàng gõ từ khóa và bấm nút tìm kiếm hoặc nhấn Enter để đi đến trang kết quả tìm kiếm, từ khóa đó sẽ được lưu vào `localStorage` ở trình duyệt khách (dưới key: `site_recent_queries`). Danh sách lưu tối đa 5 từ khóa tìm kiếm gần nhất, được sắp xếp giảm dần theo thời gian và lọc bỏ trùng lặp.
- **Hiển thị lịch sử**: Khi khách hàng nhấp chuột vào ô tìm kiếm (focus) lúc ô tìm kiếm đang trống, một dropdown lịch sử tìm kiếm sẽ hiện ra ngay lập tức dưới chân ô tìm kiếm, hiển thị danh sách 5 từ khóa tìm kiếm gần đây kèm icon đồng hồ lịch sử.
- **Tương tác nhanh**: Click vào từ khóa lịch sử sẽ tự động thiết lập từ khóa đó vào ô tìm kiếm và thực hiện chuyển hướng đến trang tìm kiếm kết quả (`/search?q=...`). Click vào nút `X` nhỏ bên phải dòng lịch sử sẽ xóa từ khóa đó khỏi bộ nhớ mà không gây chuyển hướng trang.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn thường xuyên đi siêu thị mua sắm. Mỗi lần bạn đến quầy thông tin để hỏi vị trí của các món đồ, nhân viên siêu thị sẽ ghi nhớ sẵn những thứ bạn hay hỏi gần đây (ví dụ: "giày chạy bộ", "giày sneaker"). Lần tới khi bạn vừa đi đến quầy thông tin và chưa kịp mở lời, nhân viên đã nhanh tay đưa ra một bảng ghi chú nhỏ ghi sẵn các món đồ bạn vừa tìm gần đây để bạn chỉ cần chỉ tay vào là được hướng dẫn ngay, không mất công hỏi lại.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã kiểm tra cấu trúc của thanh tìm kiếm ở Header của site khách hàng:
- Component đích: [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
- Đóng mở dropdown hiện tại:
  ```typescript
  onFocus={() => { if (!disabled && query.trim()) { setIsOpen(true); } }}
  onChange={(event) => {
    const value = event.target.value;
    setQuery(value);
    if (!disabled) {
      setIsOpen(Boolean(value.trim()));
    }
  }}
  ```
  Dropdown chỉ được mở khi `query.trim()` có giá trị!
- Cách gửi tìm kiếm:
  ```typescript
  const handleSubmit = () => {
    const value = query.trim();
    if (!value) {
      return;
    }
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };
  ```
- Nút xóa từ khóa hiện tại chỉ là nút xóa nội dung trong input khi đang gõ (`query.trim().length > 0`).
- Chúng ta cần import thêm icon `History` và `X` từ `lucide-react`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Vấn đề**: Người dùng click vào ô tìm kiếm ở site thực nhưng không hiển thị kết quả tìm kiếm gần đây nhất.
- **Root Cause**: Component `HeaderSearchAutocomplete` chưa hỗ trợ ghi nhận lịch sử từ khóa tìm kiếm khi người dùng nhấn Enter/Tìm kiếm, chưa cho phép mở dropdown khi input rỗng (`query === ''`), và chưa có phần render danh sách lịch sử tìm kiếm gần đây.
- **Độ tin cậy nguyên nhân gốc**: **High (Cao)** - Vì mọi logic render dropdown search và input focus của site thực đều nằm trọn vẹn trong file `HeaderSearchAutocomplete.tsx`.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ nâng cấp component `HeaderSearchAutocomplete` theo các bước:
1. **Quản lý Lịch sử (Recent Queries) qua LocalStorage**:
   - Thêm state `recentQueries` kiểu `string[]`.
   - Sử dụng `useEffect` chỉ chạy khi component mount để đọc mảng lịch sử từ `localStorage` (key: `site_recent_queries`), bảo vệ an toàn cho quá trình Hydration.
2. **Ghi nhận lịch sử khi submit**:
   - Cập nhật hàm `handleSubmit` để lưu từ khóa hợp lệ vào đầu mảng lịch sử, lọc trùng và cắt độ dài tối đa 5 phần tử trước khi lưu vào `localStorage`.
3. **Mở rộng logic mở dropdown (`isOpen`)**:
   - Cho phép mở dropdown khi focus vào input kể cả khi `query` đang rỗng, miễn là có từ khóa lịch sử tồn tại.
   - Hàm `onFocus` sẽ set `setIsOpen(true)`.
   - Hàm `onChange` sẽ giữ `setIsOpen(true)`.
4. **Render Giao diện Lịch sử**:
   - Khi `query === ''` and `recentQueries.length > 0` and `isOpen` đang bật:
     - Hiển thị dropdown chứa danh sách lịch sử phẳng.
     - Mỗi từ khóa lịch sử đi kèm icon `History` (đồng hồ xoay ngược) màu xám nhạt ở bên trái.
     - Hiệu ứng hover dòng đổi màu nền mượt mà sử dụng màu token của header (`hover:bg-[var(--menu-search-hover-bg)] hover:text-[var(--menu-search-hover-text)]`).
     - Tích hợp nút `X` ở bên phải để xóa từ khóa lịch sử tương ứng bằng cách gọi hàm `removeFromRecentQueries(query)` kèm `e.stopPropagation()`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
   - *Vai trò hiện tại*: Xử lý ô tìm kiếm autocomplete gợi ý sản phẩm, bài viết, dịch vụ ở Header của site khách hàng thực tế.
   - *Thay đổi*: Bổ sung state `recentQueries` để theo dõi từ khóa tìm kiếm gần đây, mở rộng hàm `handleSubmit`, `onFocus`, `onChange`, và triển khai giao diện hiển thị danh sách từ khóa lịch sử phẳng với icon đồng hồ lịch sử và nút xóa nhanh khi hover.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Imports**: Bổ sung import `History` từ `lucide-react`.
2. **State & Helpers**:
   - Tạo state `recentQueries`.
   - Viết hàm `addToRecentQueries(q)` đẩy từ khóa lên đầu mảng, cắt mảng tối đa 5 phần tử và lưu vào `localStorage`.
   - Viết hàm `removeFromRecentQueries(q)` để loại bỏ từ khóa cụ thể.
3. **Cập nhật Logic Đóng Mở**:
   - Sửa `onFocus` để luôn set `setIsOpen(true)` bất kể query có rỗng hay không.
   - Sửa `onChange` để luôn set `setIsOpen(true)` giúp hiển thị kết quả autocomplete hoặc lịch sử tùy thuộc vào độ dài query.
4. **Cập nhật `handleSubmit`**: Gọi `addToRecentQueries(value)` trước khi chuyển hướng.
5. **Cập nhật Render Dropdown**:
   - Sửa đổi điều kiện hiển thị dropdown: `showDropdown` sẽ bật khi `isOpen && !disabled && (shouldSearch || recentQueries.length > 0)`.
   - Nếu `query === ''` và `recentQueries.length > 0`: hiển thị danh sách phẳng chứa các từ khóa lịch sử với thiết kế micro-interaction tuyệt đẹp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra thủ công:
1. Mở trang chủ của site bán hàng thực tế `http://localhost:3000/`.
2. Click vào ô search ở Header (khi input đang trống):
   - Đảm bảo chưa có dropdown nào hiện ra (vì chưa có lịch sử tìm kiếm).
3. Nhập từ khóa đầu tiên (ví dụ: "giày nike") và bấm nút tìm kiếm hoặc nhấn Enter. Trang web chuyển sang trang kết quả tìm kiếm.
4. Nhấp chọn quay lại trang chủ.
5. Click lại vào ô tìm kiếm:
   - dropdown "Tìm kiếm gần đây" phải hiện ra ngay lập tức dưới chân input.
   - Từ khóa "giày nike" xuất hiện ở vị trí đầu tiên kèm icon đồng hồ quay ngược.
6. Thử tìm kiếm tiếp 5 từ khóa khác nhau:
   - Danh sách lịch sử chỉ giữ tối đa 5 từ khóa gần nhất.
   - Không chứa các từ khóa trùng lặp.
   - Từ khóa vừa tìm kiếm mới nhất luôn nằm ở đầu danh sách.
7. Di chuột vào một mục lịch sử, nút `X` hiện ra ở bên phải. Click vào nút `X`:
   - Từ khóa lịch sử biến mất ngay lập tức khỏi danh sách.
   - Không có hiện tượng chuyển trang hay tự động submit tìm kiếm.
8. Click vào một từ khóa lịch sử còn lại:
   - Ô tìm kiếm tự động điền từ khóa đó và chuyển sang trang tìm kiếm kết quả ngay tức khắc.

---

# VIII. Todo

- [ ] Import icon `History` và `X` từ `lucide-react` trong `HeaderSearchAutocomplete.tsx`.
- [ ] Thêm state `recentQueries` và `useEffect` đồng bộ dữ liệu với `localStorage` phía client.
- [ ] Viết hàm `addToRecentQueries` và `removeFromRecentQueries`.
- [ ] Cập nhật hàm `handleSubmit` tích hợp `addToRecentQueries` để lưu từ khóa khi thực hiện tìm kiếm.
- [ ] Sửa đổi các sự kiện `onFocus` và `onChange` của ô input để cho phép hiển thị dropdown khi query rỗng.
- [ ] Cập nhật render dropdown để hiển thị mục "Tìm kiếm gần đây" phẳng cực kỳ premium khi `query === ''` và có lịch sử.
- [ ] Tích hợp nút xóa nhanh (icon `X` nhỏ bên phải) cho từng từ khóa lịch sử.
- [ ] Kiểm tra tĩnh toàn bộ component, đảm bảo các styles và classes Tailwind hoạt động chuẩn chỉnh.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] dropdown lịch sử tự động mở ra ngay khi focus chuột vào ô tìm kiếm trống nếu có lịch sử tìm kiếm.
- [x] Hiển thị tối đa 5 từ khóa tìm kiếm gần đây nhất sắp xếp theo thời gian mới nhất lên đầu.
- [x] Mỗi từ khóa lịch sử đi kèm icon đồng hồ quay ngược `History` và hiệu ứng hover mượt mà đồng bộ với màu sắc thiết kế của header.
- [x] Có nút xóa nhanh cho từng từ khóa lịch sử khi di chuột qua. Click vào nút này sẽ loại bỏ từ khóa khỏi lịch sử ngay lập tức và giữ nguyên trạng thái input, không gây chuyển hướng trang.
- [x] Click vào từ khóa lịch sử sẽ tự động thực hiện tìm kiếm từ khóa đó ngay lập tức.
- [x] Code chạy an toàn trên Next.js, không gây lỗi Hydration Mismatch và đáp ứng tốt tiêu chuẩn linting.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi Hydration Mismatch khi khởi tạo state với `localStorage` ở Next.js client component.
  - *Giải pháp*: Khởi tạo state bằng mảng rỗng `[]` và chỉ nạp dữ liệu từ `localStorage` bên trong `useEffect` sau khi component mount thành công.
- **Hoàn tác**: Sử dụng `git checkout components/site/HeaderSearchAutocomplete.tsx` để khôi phục trạng thái ban đầu của file.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi trang kết quả tìm kiếm `/search`.
- Không thay đổi logic gợi ý tự động autocomplete của backend Convex.

---

# XII. Open Questions (Câu hỏi mở)

- Không có câu hỏi nào thêm, yêu cầu của khách hàng đã được phân tích và làm rõ 100%.

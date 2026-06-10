# I. Primer

## 1. TL;DR kiểu Feynman
Giống như khi bạn mở ứng dụng bản đồ hay thanh tìm kiếm của Microsoft, những thứ bạn vừa tìm xong thường là những thứ bạn muốn mở lại nhất. Thay vì bắt bạn phải gõ lại từ đầu mỗi lần muốn truy cập một trang cấu hình quen thuộc, hệ thống sẽ tự động "nhớ" 5 trang bạn vừa click vào gần đây nhất. Khi bạn click vào ô tìm kiếm mà chưa gõ gì, 5 trang này sẽ hiện ra ngay lập tức kèm theo biểu tượng lịch sử (đồng hồ xoay ngược) và nút xóa nhanh nếu bạn muốn dọn dẹp lịch sử của mình.

## 2. Elaboration & Self-Explanation
Hiện tại, thanh tìm kiếm toàn cầu của hệ thống quản trị (`SystemGlobalSearch`) hoạt động theo cơ chế: khi người dùng nhấp vào ô tìm kiếm hoặc nhấn `Ctrl+K`, một bảng tìm kiếm (modal/overlay) sẽ hiện ra. Nếu người dùng chưa gõ từ khóa nào (query rỗng), hệ thống sẽ hiển thị mặc định toàn bộ danh sách các module và trang trải nghiệm (lên đến 20 kết quả). Điều này làm giao diện bị rối, không tập trung vào nhu cầu thực tế của người dùng (họ thường xuyên qua lại giữa một số trang cấu hình nhất định).

Để giải quyết vấn đề này, chúng ta sẽ triển khai tính năng **Lịch sử tìm kiếm gần đây (Recent Searches)**:
- **Lưu trữ**: Mỗi khi người dùng click chọn một trang kết quả từ thanh tìm kiếm, hệ thống sẽ lưu thông tin trang đó (tiêu đề, đường dẫn, loại trang) vào `localStorage` ở trình duyệt dưới dạng một danh sách có tối đa 5 phần tử. Nếu trang đã tồn tại trong danh sách, nó sẽ được đẩy lên đầu để đảm bảo tính cập nhật.
- **Trình diễn**: Khi mở ô tìm kiếm lên và chưa gõ từ khóa nào, nếu có lịch sử tìm kiếm, hệ thống sẽ hiển thị danh sách 5 trang gần đây này trước tiên, kèm theo icon đồng hồ lịch sử (`History` từ Lucide) và hiệu ứng hover mượt mà.
- **Quản lý**: Bên cạnh mỗi dòng lịch sử sẽ có một nút xóa nhanh (icon `X` nhỏ). Click vào nút này sẽ loại bỏ trang đó khỏi lịch sử mà không kích hoạt việc chuyển trang.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang nấu ăn trong bếp. Bạn có rất nhiều gia vị (tương ứng với tất cả các module trong hệ thống). Nhưng trong suốt quá trình nấu món hôm nay, bạn liên tục dùng đến muối, tiêu và hạt nêm (đây là các trang truy cập gần đây). Thay vì mỗi lần cần muối bạn lại phải lục lọi cả tủ gia vị sâu hoắm, bạn để sẵn 3 lọ muối, tiêu, hạt nêm ngay trên mặt bàn bếp để với tay là lấy được ngay. Khi bạn nấu xong món khác và không cần hạt nêm nữa, bạn cất lọ hạt nêm đi (nút xóa lịch sử).

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra cấu trúc của thanh tìm kiếm hệ thống:
- Component đích: [SystemGlobalSearch.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/components/SystemGlobalSearch.tsx)
- Cách hiển thị hiện tại khi query rỗng:
  ```typescript
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, MAX_RESULTS); // Trả về tất cả items (tối đa 20)
    }
  ```
- Nơi xử lý click kết quả:
  ```typescript
  const handleSelect = (item: SearchItem) => {
    setOpen(false);
    setQuery('');
    router.push(item.href);
  };
  ```
- Thư viện icon Lucide-react đã được import sẵn trong file. Chúng ta chỉ cần import thêm `History` và `X` từ `lucide-react`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Vấn đề**: Người dùng muốn áp dụng tính năng hiển thị kết quả tìm kiếm gần đây của Microsoft vào ô search ở header của trang quản trị `/system/experiences/menu`.
- **Root Cause**: Giao diện tìm kiếm hiện tại chưa hỗ trợ ghi nhận hành vi truy cập của người dùng qua ô search và chưa có khu vực hiển thị lịch sử truy cập gần đây (Recent Searches) khi query rỗng.
- **Độ tin cậy nguyên nhân gốc**: **High (Cao)** - Vì hành vi hiển thị danh sách tìm kiếm khi chưa gõ query hoàn toàn được quyết định ở phía frontend tại component `SystemGlobalSearch.tsx` mà chúng ta vừa phân tích.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ nâng cấp component `SystemGlobalSearch` với các tính năng sau:
1. **Quản lý State & Đồng bộ LocalStorage**:
   - Khởi tạo một state `recentSearches` kiểu `SearchItem[]`.
   - Sử dụng `useEffect` chạy một lần khi component mount để đọc dữ liệu an toàn từ `localStorage` (tránh lỗi Hydration mismatch của Next.js).
2. **Cập nhật Lịch sử khi Click**:
   - Cập nhật hàm `handleSelect`: Trước khi chuyển hướng trang, gọi một hàm trợ giúp `addToRecentSearches(item)` để cập nhật mảng lịch sử, giới hạn tối đa 5 phần tử và lưu lại vào `localStorage`.
3. **Xóa Lịch sử**:
   - Thêm hàm `removeFromRecentSearches(href)` để cho phép người dùng xóa từng mục lịch sử.
4. **Thiết kế Giao diện Premium**:
   - Khi `query === ''` và `recentSearches.length > 0`:
     - Hiển thị một phân mục tinh tế: `TÌM KIẾM GẦN ĐÂY` (hoặc `RECENT SEARCHES` dựa trên đa ngôn ngữ).
     - Hiển thị danh sách các mục lịch sử phẳng.
     - Mỗi mục có icon `History` (màu xám nhạt) ở bên trái.
     - Hover hiệu ứng đổi màu nền sang xanh cyan nhẹ (`bg-cyan-500/10`) hoặc xám nhẹ (`bg-slate-100 dark:bg-slate-800`).
     - Có nút `X` nhỏ ở góc phải của dòng, chỉ hiển thị hoặc làm rõ hơn khi hover vào dòng đó, giúp giao diện gọn gàng.
     - Phím tắt bàn phím (ArrowUp, ArrowDown, Enter) vẫn hoạt động mượt mà với danh sách này.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
1. [SystemGlobalSearch.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/components/SystemGlobalSearch.tsx)
   - *Vai trò hiện tại*: Cung cấp nút tìm kiếm toàn cầu ở header và modal overlay hiển thị kết quả tìm kiếm.
   - *Thay đổi*: Thêm state và logic `recentSearches`, cập nhật UI hiển thị lịch sử tìm kiếm gần đây với icon `History` và nút xóa nhanh, sửa logic điều hướng phím tắt tương ứng khi danh sách thay đổi.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và Chuẩn bị**: Xác nhận các imports cần thiết (`History`, `X` từ `lucide-react`, thêm bản dịch nếu cần thiết hoặc dùng trực tiếp).
2. **Cập nhật Logic State & Helpers**:
   - Định nghĩa mảng lưu trữ lịch sử tối đa 5 phần tử.
   - Tạo hàm `addToRecentSearches` thực hiện đẩy item lên đầu mảng, lọc trùng lặp và lưu trữ.
   - Tạo hàm `removeFromRecentSearches` xóa item theo `href`.
3. **Cập nhật hàm `handleSelect`**: Nhúng `addToRecentSearches(item)` vào trước khi đổi route.
4. **Cập nhật Render UI**:
   - Sửa phần render danh sách khi `query === ''`.
   - Nếu có lịch sử, render khu vực "Tìm kiếm gần đây" trước.
   - Nếu không có lịch sử, có thể hiển thị danh sách gợi ý như cũ để tránh trống trải hoặc ẩn bớt để gọn gàng.
5. **Kiểm tra tương tác phím**: Đảm bảo phím mũi tên lên/xuống và Enter vẫn điều hướng chính xác trên danh sách lịch sử này.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra thủ công:
1. Mở modal tìm kiếm bằng phím tắt `Ctrl + K` hoặc click chuột vào ô search ở header.
2. Kiểm tra khi chưa tìm gì: Modal hiển thị danh sách bình thường (chưa có lịch sử).
3. Gõ từ khóa tìm kiếm (ví dụ: "Hero" hoặc tên một module/trải nghiệm) và click chọn một kết quả. Trình duyệt sẽ chuyển hướng trang.
4. Mở lại modal tìm kiếm: Kiểm tra xem có xuất hiện mục "Tìm kiếm gần đây" chứa trang vừa click không, có kèm icon đồng hồ lịch sử xoay ngược không.
5. Thực hiện click tiếp 5-6 trang khác nhau để đảm bảo:
   - Danh sách lịch sử chỉ giữ tối đa 5 trang gần nhất.
   - Trang vừa click mới nhất luôn nằm ở đầu danh sách.
   - Không có trang nào bị lặp lại trong danh sách lịch sử.
6. Hover vào một dòng lịch sử, click vào nút `X` ở bên phải: Xác nhận mục lịch sử đó biến mất ngay lập tức và trang không bị chuyển hướng.
7. Dùng phím mũi tên lên/xuống và nhấn Enter trên danh sách lịch sử: Đảm bảo chuyển hướng trang hoạt động chính xác.

---

# VIII. Todo

- [ ] Import thêm icon `History` và `X` từ `lucide-react` trong `SystemGlobalSearch.tsx`.
- [ ] Định nghĩa state `recentSearches` và `useEffect` đồng bộ dữ liệu với `localStorage`.
- [ ] Viết hàm `addToRecentSearches` và `removeFromRecentSearches`.
- [ ] Cập nhật hàm `handleSelect` để lưu lịch sử khi người dùng chọn kết quả.
- [ ] Sửa đổi logic `filteredItems` và render UI để hiển thị "Tìm kiếm gần đây" khi `query` rỗng và có lịch sử.
- [ ] Tích hợp nút xóa nhanh (icon `X`) cho từng mục lịch sử.
- [ ] Đảm bảo phím tắt bàn phím (ArrowUp, ArrowDown, Enter) hoạt động chuẩn xác với danh sách lịch sử.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [x] Hiển thị tối đa 5 mục tìm kiếm gần nhất khi nhấp vào ô tìm kiếm mà chưa gõ từ khóa (`query` rỗng).
- [x] Các mục tìm kiếm gần đây có biểu tượng lịch sử (đồng hồ xoay ngược `History`).
- [x] Click vào một mục tìm kiếm gần đây sẽ chuyển hướng người dùng đến trang đó ngay lập tức.
- [x] Có nút xóa nhanh cho từng mục lịch sử và khi click xóa thì mục đó biến mất khỏi danh sách lịch sử ngay lập tức, không gây chuyển hướng trang.
- [x] Sắp xếp danh sách lịch sử theo thứ tự thời gian giảm dần (mới nhất ở trên cùng), không trùng lặp phần tử.
- [x] Giao diện sạch sẽ, premium, có hiệu ứng hover tinh tế và đồng bộ với giao diện chung của hệ thống.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi Hydration Mismatch nếu đọc `localStorage` trực tiếp ở pha render đầu tiên của React trên Next.js.
  - *Giải pháp*: Chỉ đọc `localStorage` bên trong `useEffect` sau khi component đã mount hoàn toàn trên client.
- **Hoàn tác**: Sử dụng `git checkout app/system/components/SystemGlobalSearch.tsx` để khôi phục trạng thái ban đầu của file nếu xảy ra lỗi không mong muốn.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi cơ chế tìm kiếm ở backend hoặc cơ sở dữ liệu Convex.
- Không thay đổi giao diện tìm kiếm của trang khách hàng (Client-facing site), chỉ áp dụng cho thanh search hệ thống quản trị (System Global Search).

---

# XII. Open Questions (Câu hỏi mở)

- Không có câu hỏi nào cần làm rõ thêm, yêu cầu của người dùng đã rất rõ ràng và đầy đủ.

# I. Primer

## 1. TL;DR kiểu Feynman
* Lỗi xảy ra khi thanh tìm kiếm trong giao diện quản trị bị sập lúc người dùng gõ từ khóa.
* Lý do: Code frontend nghĩ backend trả về danh sách trực tiếp (dạng mảng `[]`), nhưng thực tế backend Convex trả về một gói bọc bên ngoài gồm `{ items: [], total: 0 }` (một đối tượng).
* Khi gọi hàm `.map()` trên đối tượng (Object) thay vì mảng (Array), JavaScript không hiểu và báo lỗi `map is not a function`.
* Cách sửa: Cập nhật code frontend để lấy đúng mảng bên trong thông qua `results.posts.items`, tương tự cho `products` và `services`.

## 2. Elaboration & Self-Explanation
Thanh tìm kiếm nhanh ở header quản trị (`AdminHeaderSearchAutocomplete`) cho phép người dùng tìm kiếm bài viết, sản phẩm, dịch vụ và người dùng. 
Khi người dùng gõ từ khóa, component gọi một query Convex là `api.search.autocomplete`.
Query này trả về kết quả được cấu trúc theo định dạng:
```json
{
  "posts": { "items": [...], "total": 0 },
  "products": { "items": [...], "total": 0 },
  "services": { "items": [...], "total": 0 }
}
```
Tuy nhiên, trong tệp `app/admin/components/AdminHeaderSearchAutocomplete.tsx`, lập trình viên trước đó đã ép kiểu thủ công kết quả trả về (`contentResults`) thành:
```typescript
{
  posts?: Array<...>;
  products?: Array<...>;
  services?: Array<...>;
}
```
Và viết code duyệt mảng như sau: `results?.posts ?? []`. Vì `results.posts` là một đối tượng `{ items: [...], total: ... }` chứ không phải là `undefined` hay `null`, phép toán fallback `?? []` bị bỏ qua, và hệ thống cố gắng gọi `.map()` lên đối tượng này. Do đối tượng không có phương thức `.map()`, ứng dụng bị crash ngay lập tức ở runtime.

Để khắc phục, chúng ta cần:
1. Định nghĩa lại kiểu dữ liệu chính xác cho biến `results` trong hook `useMemo` của `dataSections` khớp với schema của Convex.
2. Truy xuất vào thuộc tính `.items` của từng phân mục (`posts?.items`, `products?.items`, `services?.items`) trước khi thực hiện `.map()`.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế trong code:**
  * Sai: `results?.posts` -> trả về `{ items: [...], total: 5 }`. Gọi `{ items: [...], total: 5 }.map(...)` => Lỗi.
  * Đúng: `results?.posts?.items` -> trả về `[...]`. Gọi `[...].map(...)` => Hoạt động tốt.
* **Hình ảnh ẩn dụ đời thường:** 
  Bạn đặt mua một lốc sữa (mảng các hộp sữa) nhưng người bán lại giao cho bạn một thùng giấy đóng kín, bên trong chứa lốc sữa và một tờ hóa đơn (đối tượng chứa `items` và `total`). Bạn không thể cắm ống hút trực tiếp vào cái thùng giấy to đùng đó để uống (gọi `.map` lên đối tượng), mà bạn phải mở thùng ra, lấy vỉ sữa ở bên trong ra rồi mới uống được (truy cập `.items` rồi mới `.map`).

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tệp kiểm tra:** `app/admin/components/AdminHeaderSearchAutocomplete.tsx`
* **Vấn đề phát hiện:** Lỗi ép kiểu sai kiểu dữ liệu trả về từ Convex query `api.search.autocomplete`.
* **Trạng thái:** Crash runtime khi gõ tìm kiếm trong Admin Header.
* **Mức độ phức tạp:** Thấp, sửa đổi cục bộ trong 1 file component.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## Câu hỏi Audit & Root Cause (Tối thiểu 5/8 câu):
1. **Triệu chứng quan sát được là gì (expected vs actual)?**
   * *Actual:* Khi gõ từ khóa vào ô tìm kiếm ở trang quản trị, trang web bị crash toàn bộ và hiển thị lỗi: `TypeError: (intermediate value)(intermediate value)(intermediate value).map is not a function` tại dòng 193 của `AdminHeaderSearchAutocomplete.tsx`.
   * *Expected:* Hiển thị danh sách gợi ý tìm kiếm gồm bài viết, sản phẩm, dịch vụ và người dùng mà không bị crash.
3. **Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?**
   * Có, tái hiện 100% khi người dùng gõ bất kỳ ký tự nào vào thanh tìm kiếm ở Header của Admin Layout làm kích hoạt query tìm kiếm.
6. **Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?**
   * *Giả thuyết thay thế:* Phía Convex API trả về sai format hoặc bị lỗi.
   * *Loại trừ:* Kiểm tra `convex/search.ts` cho thấy schema `searchResult` và giá trị trả về thực tế được định nghĩa tường minh với `items` và `total`. Kiểu dữ liệu phía Convex hoàn toàn đúng thiết kế ban đầu để hỗ trợ phân trang hoặc hiển thị tổng số kết quả tìm thấy (`total`). Lỗi hoàn toàn nằm ở phần ép kiểu cưỡng ép sai ở frontend.
8. **Tiêu chí pass/fail sau khi sửa?**
   * *Pass:* Khi gõ từ khóa tìm kiếm, autocomplete hiển thị chính xác kết quả mà không gây sập trang, các mục bài viết, sản phẩm, dịch vụ được liệt kê đầy đủ. Hệ thống TypeScript biên dịch thành công mà không có lỗi typecheck.
   * *Fail:* Trang web tiếp tục crash hoặc TypeScript báo lỗi đỏ khi build.

**Độ tin cậy nguyên nhân gốc:** High (Cực kỳ cao) vì cấu trúc dữ liệu trả về từ file Convex backend và lỗi map ở frontend khớp nhau hoàn hảo.

# IV. Proposal (Đề xuất)
Sửa đổi kiểu dữ liệu ép cho `results` trong `dataSections` ở `app/admin/components/AdminHeaderSearchAutocomplete.tsx`.
Thay vì ép về dạng mảng, ép về đúng dạng Object chứa `items` và `total`.
Cập nhật các dòng code map danh sách để duyệt qua `results?.posts?.items ?? []`, `results?.products?.items ?? []`, và `results?.services?.items ?? []`.

# V. Files Impacted (Tệp bị ảnh hưởng)
### [MODIFY] [AdminHeaderSearchAutocomplete.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/components/AdminHeaderSearchAutocomplete.tsx)
* **Vai trò hiện tại:** Hiển thị ô tìm kiếm autocomplete trên header trang admin để tìm kiếm nhanh các liên kết và dữ liệu bài viết, sản phẩm, dịch vụ, người dùng.
* **Thay đổi:** Sửa lại kiểu dữ liệu của biến `results` trong hàm `useMemo` của `dataSections` từ mảng thành đối tượng chứa `items` và `total`, đồng thời sửa logic gọi `.map()` cho chính xác.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1 (Đọc/Chỉnh):** Mở file `app/admin/components/AdminHeaderSearchAutocomplete.tsx`.
2. **Bước 2 (Cập nhật logic):**
   * Sửa kiểu ép của `results` thành:
     ```typescript
     const results = contentResults as {
       posts?: { items: Array<{ id: string; title: string }>; total: number };
       products?: { items: Array<{ id: string; title: string }>; total: number };
       services?: { items: Array<{ id: string; title: string }>; total: number };
     } | undefined;
     ```
   * Thay đổi `results?.posts ?? []` thành `results?.posts?.items ?? []`.
   * Thay đổi `results?.products ?? []` thành `results?.products?.items ?? []`.
   * Thay đổi `results?.services ?? []` thành `results?.services?.items ?? []`.
3. **Bước 3 (Review tĩnh):** Kiểm tra xem tất cả các biến đã được gán đúng kiểu và không còn cảnh báo lỗi từ IDE.

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. **Typecheck tĩnh:** Chạy lệnh `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi biên dịch TypeScript trong component.
2. **Manual Verification:** (Phía người dùng) Deploy/chạy thử môi trường phát triển local và gõ từ khóa bất kỳ trên thanh tìm kiếm của Admin Header để xác nhận autocomplete hoạt động mượt mà và không còn crash.

# VIII. Todo
- [x] Chỉnh sửa file `app/admin/components/AdminHeaderSearchAutocomplete.tsx` theo thiết kế đề xuất.
- [x] Tiến hành chạy typecheck tĩnh bằng `bunx tsc --noEmit` thủ công để verify type-safety.
- [x] Thực hiện commit code sạch sẽ cùng với file spec này.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Ô tìm kiếm Admin Autocomplete không crash khi gõ ký tự.
- TypeScript compiler biên dịch thành công không có lỗi type liên quan tới component này.
- Giữ vững các quy chuẩn thiết kế premium hiện có của component.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Cực kỳ thấp. Sửa đổi chỉ mang tính chất sửa lỗi cú pháp và ép kiểu dữ liệu khớp với backend.
* **Rollback:** Dùng Git để revert lại commit gần nhất nếu cần thiết.

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi thiết kế giao diện (UI) hay các tính năng khác của component autocomplete.
* Không chỉnh sửa gì ở phía Convex backend.

# I. Primer

## 1. TL;DR kiểu Feynman
* Khi vào trang cấu hình trải nghiệm (`/system/experiences`), người dùng thấy rất nhiều thẻ (card) khác nhau và muốn tìm nhanh.
* Yêu cầu là thêm nút lọc nhanh: "Danh sách" (List) và "Chi tiết" (Detail) để thu hẹp phạm vi tìm kiếm.
* Giải pháp: Thêm một thanh bộ lọc phụ (sub-filter) ở client bên dưới thanh chọn nhóm (Group tabs). Khi bấm nút "Danh sách", chỉ giữ lại những trải nghiệm có tiêu đề chứa chữ "Danh sách". Khi bấm "Chi tiết", chỉ giữ lại những trải nghiệm chứa chữ "Chi tiết". Bấm "Tất cả" để khôi phục trạng thái ban đầu.

## 2. Elaboration & Self-Explanation
* Hiện tại trang `/system/experiences` cho phép lọc theo các nhóm chính như "Nội dung", "Thương mại", "Người dùng", "Giao diện" và ô tìm kiếm tự do.
* Tuy nhiên, trong mỗi nhóm (đặc biệt là nhóm "Nội dung" với 11 trải nghiệm), các trải nghiệm thường chia làm hai dạng giao diện chính: Giao diện dạng danh sách (List) và Giao diện dạng chi tiết (Detail).
* Việc thêm hai nút lọc "Danh sách" và "Chi tiết" giúp người dùng chỉ cần một cú click chuột là lọc ra ngay loại layout mình cần thiết kế/cấu hình, thay vì phải gõ từ khóa vào ô tìm kiếm hoặc cuộn tìm thủ công.
* Bộ lọc này sẽ hoạt động ở phía client (sau khi nhận kết quả từ Convex) để đảm bảo tốc độ phản hồi tức thì và không cần sửa API ở server.

## 3. Concrete Examples & Analogies
* Ví dụ cụ thể:
  * Khi đang ở tab "Nội dung" (đang hiện 11 thẻ bao gồm "Danh sách bài viết", "Chi tiết bài viết", "Danh sách dịch vụ", "Chi tiết dịch vụ"...), nếu người dùng bấm nút lọc "Danh sách", hệ thống sẽ lập tức ẩn các thẻ "Chi tiết" đi và chỉ hiện 5 thẻ: "Danh sách bài viết", "Danh sách dịch vụ", "Danh sách dự án", "Danh sách khóa học", "Danh sách tài nguyên".
  * Điều này giống như khi bạn đi siêu thị mua sữa, thay vì tìm từng kệ, bạn nhấn nút chọn "Sữa tươi" hoặc "Sữa bột" để nhân viên chỉ ra đúng những hộp sữa thuộc loại đó.

# II. Audit Summary (Tóm tắt kiểm tra)
* File `app/system/experiences/page.tsx` hiện tại định nghĩa trang chính sử dụng hook `useQuery(api.experiences.search, ...)` để lấy dữ liệu.
* Dữ liệu trả về có cấu trúc chứa `title` (Ví dụ: "Danh sách bài viết", "Chi tiết bài viết").
* Giao diện hiện có một hàng nút chọn nhóm (`GROUPS` chứa: Tất cả, Nội dung, Thương mại, Người dùng, Giao diện).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* Triệu chứng: Người dùng mất nhiều thời gian hơn để tìm đúng layout (List hoặc Detail) khi cấu hình trải nghiệm vì không có nút lọc nhanh theo loại layout này.
* Giả thuyết đối chứng: Có cần phân loại ở mức database/schema Convex không? Không cần thiết vì tiêu đề (`title`) của các trải nghiệm đã tuân thủ chặt xe quy ước đặt tên (chứa từ "Danh sách" hoặc "Chi tiết"). Việc lọc ở client dựa trên `title` là giải pháp gọn gàng nhất (KISS), không làm thay đổi cấu trúc dữ liệu cũ (Data Contract).

# IV. Proposal (Đề xuất)
* Thêm trạng thái `subFilter` (kiểu `'all' | 'list' | 'detail'`) trong client component `ExperiencesPage`.
* Render một hàng nút lọc phụ bên dưới Group tabs với các tùy chọn:
  * "Tất cả loại" (All)
  * "Dạng danh sách" (List)
  * "Dạng chi tiết" (Detail)
* Sử dụng styling đồng bộ với UI hiện tại, thêm icon tương ứng để tăng tính trực quan (ví dụ: `List` icon cho Danh sách, `FileText` hoặc `Eye` cho Chi tiết).
* Lọc danh sách `experiences` thu được từ Convex ở client trước khi map ra các Card component.
* Khi thay đổi Group tab hoặc gõ ô tìm kiếm, ta sẽ reset `subFilter` về 'all' để tránh bối rối.

# V. Files Impacted (Tệp bị ảnh hưởng)
* Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx)
  * Thêm state `subFilter` và các nút lọc phụ trong giao diện.
  * Thực hiện lọc client-side cho danh sách experiences trả về từ query.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích kỹ vị trí chèn UI trong `app/system/experiences/page.tsx`.
2. Thêm state `subFilter` (`'all' | 'list' | 'detail'`) vào component.
3. Cập nhật logic filter client-side:
   ```typescript
   const filteredExperiences = React.useMemo(() => {
     if (!experiences) return [];
     return experiences.filter(exp => {
       if (subFilter === 'list') {
         return exp.title.toLowerCase().includes('danh sách');
       }
       if (subFilter === 'detail') {
         return exp.title.toLowerCase().includes('chi tiết');
       }
       return true;
     });
   }, [experiences, subFilter]);
   ```
4. Thêm UI cho sub-filter ngay dưới phần Group tabs, sử dụng style Tailwind sang xịn mịn, hỗ trợ cả dark mode.
5. Review lại kiểu dữ liệu và kiểm tra xem có lỗi cú pháp hoặc TypeScript không.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* Manual Verification:
  * Mở trang web local `http://localhost:3000/system/experiences`.
  * Nhấp chọn tab "Nội dung" (11).
  * Nhấp nút lọc "Danh sách" -> Xác nhận chỉ hiển thị các trải nghiệm có tiêu đề chứa "Danh sách" (5 thẻ).
  * Nhấp nút lọc "Chi tiết" -> Xác nhận chỉ hiển thị các trải nghiệm có tiêu đề chứa "Chi tiết" (6 thẻ).
  * Nhấp nút lọc "Tất cả" -> Xác nhận hiển thị lại toàn bộ 11 thẻ.
  * Kiểm tra ở các nhóm khác (như Thương mại) xem bộ lọc hoạt động tương tự không.
  * Xác nhận đếm số lượng hiển thị ở footer khớp với số lượng thẻ thực tế sau khi lọc.

# VIII. Todo
- [ ] Khai báo state `subFilter` trong `ExperiencesPage` của [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/page.tsx).
- [ ] Thêm logic lọc client-side `filteredExperiences` bằng `useMemo`.
- [ ] Tích hợp `subFilter` reset khi thay đổi nhóm chính trong `handleGroupChange`.
- [ ] Cập nhật render UI: thay thế `experiences.map` bằng `filteredExperiences.map` và cập nhật footer hiển thị số lượng.
- [ ] Thêm component giao diện bộ lọc phụ (Sub-filter bar) đẹp mắt, responsive, sử dụng các icon của Lucide (`ListFilter`, `LayoutList`, `FileSearch`).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Xuất hiện thanh bộ lọc phụ gồm 3 tùy chọn: "Tất cả", "Dạng danh sách", "Dạng chi tiết" dưới thanh Group tabs.
* Giao diện thanh lọc phụ hài hòa, responsive, các nút có hiệu ứng hover và active rõ ràng.
* Khi bấm nút lọc tương ứng, danh sách thẻ thay đổi ngay lập tức ở client mà không bị trễ hay reload trang.
* Footer đếm số lượng thẻ hiển thị chính xác theo kết quả đã lọc.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Rủi ro thấp vì thay đổi hoàn toàn nằm ở client component và không ảnh hưởng đến bất kỳ API hay database schema nào.
* Nếu muốn rollback, chỉ cần khôi phục file `app/system/experiences/page.tsx` về trạng thái ban đầu qua git.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi schema database của Convex hoặc thêm trường dữ liệu phân loại mới.
* Thay đổi giao diện các trang con bên trong (như `/system/experiences/posts-list`...).

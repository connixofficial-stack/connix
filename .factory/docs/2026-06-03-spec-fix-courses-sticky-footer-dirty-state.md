# I. Primer

## 1. TL;DR kiểu Feynman
- Khi truy cập trang Chỉnh sửa khóa học (Course Edit), thanh công cụ lưu ở dưới cùng (Sticky Footer) hiển thị nút "Lưu thay đổi" luôn ở trạng thái sẵn sàng bấm được (active) và có chữ "Lưu thay đổi", dù ta chưa chỉnh sửa gì (dirty state bị nhận diện sai).
- Nguyên nhân: Trang `CourseEditPage` chưa có cơ chế chụp ảnh chụp (snapshot) dữ liệu ban đầu từ cơ sở dữ liệu và so sánh với trạng thái hiện tại trên form.
- Cách sửa: Chúng ta sẽ tạo một snapshot dữ liệu gốc bằng `useRef` khi lấy dữ liệu thành công. Sau đó dùng `useMemo` so sánh dữ liệu form hiện tại với snapshot đó để tính toán xem form thực sự có thay đổi không (`hasChanges`).
- Cuối cùng, truyền `hasChanges` vào sticky footer và vô hiệu hóa (disable) nút Lưu, chuyển tên nút sang "Đã lưu" khi không có thay đổi nào.

## 2. Elaboration & Self-Explanation
Khi vừa vào trang chỉnh sửa, Next.js sẽ load thông tin khóa học từ Convex thông qua `useQuery`. Khi dữ liệu sẵn sàng, `useEffect` đầu tiên sẽ gán các giá trị từ database vào các state của form (như `title`, `slug`, `content`, v.v.).
Tuy nhiên, trang web lại không có cách nào để biết được các giá trị hiện tại trên form có khác gì so với các giá trị ban đầu vừa load từ database hay không. Điều này khiến cho form luôn nghĩ rằng có thay đổi và Sticky Footer luôn hiện nút "Lưu thay đổi" và cho phép submit.
Hướng xử lý là:
- Dùng `useRef` để giữ một snapshot của tất cả dữ liệu khóa học ngay sau khi chúng được điền vào form lần đầu tiên.
- Dùng một `useMemo` để tính toán trạng thái hiện tại của form thành một snapshot mới (`currentSnapshot`).
- So sánh `initialSnapshot` và `currentSnapshot` bằng `JSON.stringify()`. Nếu hai chuỗi JSON này giống nhau hoàn toàn, tức là form chưa bị thay đổi (`hasChanges = false`).
- Khi người dùng bấm lưu và Convex cập nhật thành công, ta chụp lại snapshot mới từ form để cập nhật `initialSnapshotRef.current`, đưa form trở về trạng thái "Đã lưu" (`hasChanges = false`).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Khi vừa load trang, tiêu đề khóa học là "Khóa học NextJS". Người dùng chưa gõ gì thêm. Nếu không có snapshot lưu lại chữ "Khóa học NextJS" ban đầu, hệ thống không thể biết giá trị hiện tại `title === "Khóa học NextJS"` là mới hay cũ, nên nút "Lưu thay đổi" luôn nổi bật lên. Với snapshot, hệ thống biết `"Khóa học NextJS"` (hiện tại) giống hệt `"Khóa học NextJS"` (ban đầu), nút sẽ đổi thành "Đã lưu" và bị mờ đi không cho click.
- **Hình ảnh ví dụ**: Giống như việc bạn chụp ảnh căn phòng trước khi đi ra ngoài. Khi quay lại, bạn đối chiếu căn phòng thực tế với bức ảnh chụp. Nếu mọi thứ nằm đúng vị trí trong ảnh, tức là căn phòng không có gì thay đổi (không có ai vào vẽ bậy). Nếu có một cái ghế bị dịch chuyển (thay đổi state), bạn mới nhận ra sự khác biệt và cần sắp xếp lại (bấm Lưu).

# II. Audit Summary (Tóm tắt kiểm tra)
- **Triệu chứng quan sát được**: Truy cập `/admin/courses/[id]/edit`, Sticky Footer hiển thị nút "Lưu thay đổi" màu xanh nổi bật và click được, mặc dù chưa chỉnh sửa bất kỳ thông tin nào của khóa học.
- **Tệp tin liên quan**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx) chịu trách nhiệm quản lý state form và render Sticky Footer cho module Courses.
- **Pattern đối chứng**: Trang [categories/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/categories/%5Bid%5D/edit/page.tsx) đã xử lý thành công tính năng này bằng cách sử dụng `initialSnapshotRef`, `currentSnapshot` và `hasChanges`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Trang `app/admin/courses/[id]/edit/page.tsx` hoàn toàn thiếu logic phát hiện thay đổi dữ liệu (dirty state detection). Form không theo dõi trạng thái thay đổi của các trường nhập liệu so với dữ liệu gốc ban đầu tải từ Convex. Đồng thời nút Submit bên trong Sticky Footer children luôn được cấu hình hiển thị text "Lưu thay đổi" tĩnh.
- **Giả thuyết đối chứng**: Nếu thêm cơ chế snapshot dữ liệu ban đầu (`initialSnapshotRef`) và snapshot hiện tại (`currentSnapshot`) để xác định biến `hasChanges`, đồng thời cập nhật UI của nút submit trong footer dựa trên `hasChanges`, form sẽ khởi đầu với trạng thái "Đã lưu" (disabled) và chỉ chuyển sang "Lưu thay đổi" (enabled) khi người dùng thực hiện chỉnh sửa thực tế.

# IV. Proposal (Đề xuất)
- Bổ sung `initialSnapshotRef` sử dụng `useRef` lưu trữ giá trị ban đầu của toàn bộ 25 trường thông tin của khóa học.
- Bổ sung `snapshotVersion` (state số nguyên) để trigger re-evaluation cho `hasChanges` khi snapshot ban đầu thay đổi.
- Thêm `currentSnapshot` sử dụng `useMemo` đóng gói toàn bộ state hiện tại của form (đã trim khoảng trắng đầu cuối để tránh dirty giả do dấu cách thừa).
- Thêm `hasChanges` so sánh JSON giữa snapshot ban đầu và hiện tại.
- Cập nhật `useEffect` load dữ liệu: chụp snapshot ban đầu ngay khi dữ liệu được map vào state lần đầu.
- Cập nhật hàm `handleSubmit`: sau khi gọi Convex mutation thành công, cập nhật snapshot ban đầu bằng snapshot hiện tại của form và tăng `snapshotVersion` để UI chuyển về "Đã lưu".
- Cập nhật Sticky Footer: truyền prop `hasChanges={hasChanges}`.
- Cập nhật nút Submit trong footer: dùng `cn` từ `../../../components/ui` để đổi style sang màu xám khi `!hasChanges` và vô hiệu hóa nút (`disabled`), đồng thời hiển thị text linh động: "Đang lưu..." (khi `isSubmitting`), "Đã lưu" (khi `!hasChanges`), "Lưu thay đổi" (khi `hasChanges`).

# V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx)
- Quản lý form chỉnh sửa khóa học.
- Thêm logic snapshot để tính toán `hasChanges`, cập nhật logic submit thành công để reset snapshot, và cập nhật UI của Sticky Footer cùng nút submit bên trong nó.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx).
2. Định nghĩa kiểu dữ liệu cho Snapshot và khai báo `initialSnapshotRef`, `snapshotVersion`, `currentSnapshot`, `hasChanges`.
3. Chèn logic gán `initialSnapshotRef.current` vào `useEffect` khởi tạo dữ liệu ban đầu.
4. Chèn logic cập nhật `initialSnapshotRef.current` vào khối `try` của hàm `handleSubmit` sau khi mutation cập nhật thành công.
5. Import hàm class merger `cn` từ `../../../components/ui`.
6. Cập nhật JSX của Sticky Footer và nút lưu.
7. Đánh giá tĩnh (static review) kiểm tra kiểu dữ liệu và cú pháp.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy lệnh typecheck thủ công để đảm bảo không lỗi kiểu dữ liệu:
  `bunx tsc --noEmit` (hoặc kiểm tra thông qua IDE/harness engine).

### Manual Verification
- Người dùng truy cập trang chỉnh sửa khóa học `/admin/courses/[id]/edit`.
- **Mong đợi khi vừa tải xong**: Sticky footer hiển thị nút lưu ở dạng "Đã lưu", màu xám, không click được.
- **Mong đợi khi gõ thêm chữ vào tiêu đề**: Nút lưu chuyển ngay sang "Lưu thay đổi", màu xanh indigo, click được.
- **Mong đợi khi xóa ký tự vừa thêm để trở lại nguyên bản**: Nút lưu lập tức quay về "Đã lưu", màu xám.
- **Mong đợi khi bấm "Lưu thay đổi" thành công**: Xu hiện toast thông báo cập nhật thành công, nút lưu lập tức đổi thành "Đã lưu", màu xám.

# VIII. Todo
- [ ] Khai báo snapshot refs và states trong `CourseEditPage`.
- [ ] Thiết lập snapshot ban đầu trong `useEffect` mapping dữ liệu.
- [ ] Cập nhật snapshot sau khi submit mutation thành công trong `handleSubmit`.
- [ ] Import `cn` từ `../../../components/ui`.
- [ ] Cập nhật props `hasChanges={hasChanges}` cho `HomeComponentStickyFooter`.
- [ ] Cập nhật nút submit ở footer dùng `cn`, `disabled` và text linh động theo `hasChanges`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- **Pass**: Nút lưu ở footer hiển thị màu xám "Đã lưu" và bị disabled ngay khi vào trang. Chuyển sang màu xanh "Lưu thay đổi" và click được chỉ khi có thay đổi trên bất kỳ trường nhập liệu nào của khóa học. Sau khi bấm lưu thành công, nút quay lại trạng thái màu xám "Đã lưu".
- **Fail**: Nút lưu hiển thị màu xanh "Lưu thay đổi" ngay từ lúc vừa tải trang mà chưa có hành động sửa đổi nào của user. Hoặc sau khi lưu thành công nút vẫn ở trạng thái màu xanh active.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Nếu so sánh thiếu trường dữ liệu hoặc kiểu dữ liệu không chuẩn (ví dụ mảng `additionalCategoryIds` bị so sánh tham chiếu thay vì so sánh giá trị), form có thể bị rơi vào trạng thái luôn "dirty" hoặc ngược lại.
- **Giải quyết**: Sử dụng deep stringify `JSON.stringify` và chuẩn hóa giá trị (sắp xếp mảng, trim chuỗi, fallback null/undefined đồng bộ).
- **Rollback**: Khôi phục file `app/admin/courses/[id]/edit/page.tsx` về phiên bản cũ thông qua git checkout.

# XI. Out of Scope (Ngoài phạm vi)
- Việc thêm/sửa/xóa bài học hoặc chương học trực tiếp trong Curriculum (Lộ trình học) không thuộc phạm vi dirty state của form khóa học lớn vì các thao tác đó gửi mutation trực tiếp lưu ngay vào database riêng lẻ, không chờ submit form lớn.

# XII. Open Questions (Câu hỏi mở)
- Không có câu hỏi mở nào. Giải pháp đã rõ ràng và nhất quán với pattern hiện tại trong codebase.

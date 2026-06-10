# I. Primer

## 1. TL;DR kiểu Feynman
* Trình duyệt không cho phép một thẻ `<form>` nằm bên trong một thẻ `<form>` khác.
* Trang Edit và Create khóa học đã được bao bọc bởi một thẻ `<form>` lớn ở ngoài cùng để quản lý việc lưu dữ liệu khóa học.
* Bên trong đó, Tab Lộ trình học nhúng component `CourseCurriculumEditor` và component này lại chứa một thẻ `<form>` con để Thêm chương mới. Điều này gây ra lỗi của Next.js (lỗi Hydration).
* Ta sẽ thay thế thẻ `<form>` con bằng thẻ `<div>` thông thường, đổi nút Thêm chương thành `type="button"` và bắt sự kiện phím Enter trên ô nhập liệu để tạo chương học.

## 2. Elaboration & Self-Explanation
* **Vấn đề**:
  * Khi người dùng truy cập trang chỉnh sửa hoặc tạo khóa học, component ngoài cùng render thẻ `<form onSubmit={handleSubmit}>`.
  * Khi tab Lộ trình học được kích hoạt, component `<CourseCurriculumEditor />` được render trực tiếp bên trong thẻ `<form>` cha đó.
  * Trong `CourseCurriculumEditor.tsx`, ở phần Thêm chương học mới, ta dùng `<form onSubmit={handleAddChapter}>`. Đây chính là thẻ `<form>` lồng nhau vi phạm chuẩn HTML.
* **Giải pháp**:
  * Chuyển đổi `<form onSubmit={(e) => void handleAddChapter(e)} className="space-y-3">` thành `<div className="space-y-3">`.
  * Cập nhật hàm `handleAddChapter` để tham số `e` là tùy chọn (`e?: React.FormEvent`).
  * Đổi nút submit trong form này từ `<Button type="submit">` thành `<Button type="button" onClick={() => void handleAddChapter()}>`.
  * Để giữ trải nghiệm gõ Enter để tạo chương, ta thêm handler `onKeyDown` vào Input nhập tên chương để tự động gọi `handleAddChapter()` khi ấn phím Enter.

## 3. Concrete Examples & Analogies
* **Ví dụ**:
  * Giống như việc đặt một phong bì thư nhỏ bên trong một phong bì thư lớn nhưng lại dán cả hai nắp cùng lúc. Khi người dùng cố gắng gửi phong bì ngoài, hành động nhấn nút gửi ở phong bì trong sẽ gây xung đột và làm hỏng cả hai.
  * Bằng cách chuyển phong bì trong thành một khay đựng tài liệu mở (thẻ `<div>`), người dùng vẫn có thể thao tác với tài liệu bên trong dễ dàng mà không làm ảnh hưởng đến phong bì thư lớn bên ngoài.

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra lỗi console từ Next.js:
  * Lỗi: `In HTML, <form> cannot be a descendant of <form>.`
  * Vị trí lỗi: Thẻ `<form>` con tại [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx#L826) (hoặc dòng 830+ tùy thay đổi trước đó) nằm trong thẻ `<form>` cha tại [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/%5Bid%5D/edit/page.tsx#L400) và [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx#L200).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Do sử dụng thẻ `<form>` lồng nhau trong kiến trúc component của React. Khi nhúng component con có chứa form vào trong một trang đã được bao quanh bởi form lớn, cấu trúc DOM HTML sẽ bị vi phạm chuẩn, gây ra lỗi Hydration lúc render trên Client.
* **Độ tin cậy nguyên nhân gốc**: High (Đây là lỗi cấu trúc HTML chuẩn và được chỉ rõ bởi log lỗi của React/Next.js).

# IV. Proposal (Đề xuất)

* **Bước 1**: Cập nhật `handleAddChapter` trong `CourseCurriculumEditor.tsx` để tham số `e` là tùy chọn:
  ```typescript
  const handleAddChapter = async (e?: React.FormEvent) => {
    if (e) {e.preventDefault();}
    if (!newChapterTitle.trim()) {return;}
    ...
  ```
* **Bước 2**: Thay thế thẻ `<form>` ở phần Thêm chương học mới bằng thẻ `<div>`:
  ```tsx
  <div className="space-y-3">
  ```
  Và thay thế thẻ đóng `</form>` tương ứng bằng `</div>`.
* **Bước 3**: Thêm handler `onKeyDown` vào Input `newChapterTitle` để hỗ trợ submit bằng phím Enter:
  ```tsx
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAddChapter();
    }
  }}
  ```
* **Bước 4**: Thay thế nút thêm chương thành `type="button"` và gán `onClick`:
  ```tsx
  <Button
    type="button"
    variant="default"
    disabled={isChapterAdding || !newChapterTitle.trim()}
    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
    onClick={() => void handleAddChapter()}
  >
  ```

# V. Files Impacted (Tệp bị ảnh hưởng)

* [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx)
  * *Vai trò hiện tại*: Component quản lý lộ trình học.
  * *Thay đổi*: Thay đổi thẻ form Thêm chương học thành thẻ div, bắt phím Enter trên ô nhập và đổi nút submit thành click handler.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa file `CourseCurriculumEditor.tsx` để cập nhật signature của `handleAddChapter` nhận `e?: React.FormEvent`.
2. Thay `<form>` thành `<div>`, thêm `onKeyDown` vào Input và đổi `type="submit"` của nút thêm chương thành `type="button"` với `onClick`.
3. Chạy TypeScript compiler biên dịch dự án để xác minh an toàn.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo code biên dịch thành công.

### Manual Verification
* Mở trang edit/create khóa học trên trình duyệt, mở tab Lộ trình học.
* Mở Chrome DevTools (Console), xác nhận không còn lỗi đỏ `In HTML, <form> cannot be a descendant of <form>` hay lỗi hydration nào liên quan.
* Gõ tên chương học mới, nhấn phím Enter -> Xác nhận chương mới được tạo thành công và Accordion mở ra.
* Gõ tên chương khác, click nút "Thêm chương" -> Xác nhận chương mới được tạo thành công.

# VIII. Todo

- [ ] Sửa hàm `handleAddChapter` và thay thế form Thêm chương học mới bằng div trong [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx)
- [ ] Chạy check TypeScript compiler đảm bảo code build thành công

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Không còn lỗi lồng form `<form> cannot be a descendant of <form>` trên Console.
2. Việc tạo chương mới bằng phím Enter hoặc nút click vẫn hoạt động bình thường, ổn định.
3. Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Không có rủi ro đáng kể vì đây chỉ là thay đổi thẻ HTML và bắt sự kiện Click thay cho Submit.
* **Hoàn tác**: Sử dụng `git checkout` để rollback code nếu gặp lỗi nghiêm trọng.

# XI. Out of Scope (Ngoài phạm vi)

* Thay đổi cấu trúc form cha của trang Edit / Create khóa học.

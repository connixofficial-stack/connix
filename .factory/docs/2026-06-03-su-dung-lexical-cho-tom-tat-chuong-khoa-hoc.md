# I. Primer

## 1. TL;DR kiểu Feynman
* Tóm tắt chương học hiện tại là một ô nhập chữ thường (plaintext), không cho phép định dạng in đậm, gạch đầu dòng, danh sách, link...
* Ta sẽ đổi ô nhập tóm tắt chương học thành **Rich Text Editor (Lexical)** ở cả trang Tạo và Sửa chương học.
* Để hiển thị gọn gàng trong danh sách Admin, ta sẽ lọc bỏ các tag HTML (strip HTML) và cắt ngắn chuỗi để không bị vỡ giao diện.
* Trên trang site thực (Public Course Detail), ta sẽ dùng component `RichContent` để render HTML của tóm tắt chương học hiển thị đúng định dạng.

## 2. Elaboration & Self-Explanation
* **Vấn đề**:
  * Hiện tại trường `summary` của `courseChapters` trên Convex được định nghĩa là một chuỗi (string). Trong Admin, nó được nhập liệu thông qua thẻ `<Input>` thô sơ.
  * Khi nâng cấp lên Lexical Editor, dữ liệu sẽ được lưu dưới dạng chuỗi HTML.
  * Nếu giữ nguyên cách render trực tiếp chuỗi này trong danh sách Admin (dạng `{chapter.summary}`), nó sẽ in ra mã nguồn HTML thô có các thẻ như `<p>`, `<strong>` gây mất thẩm mỹ.
  * Ở site thực (`CourseDetailPage.tsx`), nếu render dạng chuỗi thô `{chapter.summary}`, lỗi hiển thị tag HTML cũng sẽ xảy ra tương tự.
* **Giải pháp**:
  * Trong trang Admin `CourseCurriculumEditor.tsx`:
    * Di chuyển form sửa chương học từ inline thành một Modal/Dialog chuyên dụng mang tên **Edit Chapter Modal Dialog**. Điều này giúp Lexical Editor có đủ không gian rộng rãi để render đầy đủ thanh công cụ.
    * Ở form tạo chương học mới và Dialog sửa chương học, thay thế `<Input>` tóm tắt chương bằng component `<LexicalEditor>`.
    * Trên giao diện danh sách chương trong Admin, dùng hàm `stripHtml` để chuyển mã HTML thành text thô, sau đó hiển thị dạng rút gọn (truncate) trên Accordion header.
  * Trên site thực `CourseDetailPage.tsx`:
    * Dùng component `<RichContent content={withFormatMarker('richtext', chapter.summary)} />` để hiển thị tóm tắt chương học đã được định dạng HTML đúng chuẩn.

## 3. Concrete Examples & Analogies
* **Ví dụ**:
  * Admin soạn thảo tóm tắt chương 1 có định dạng:
    * **Mục tiêu**: Nắm vững cú pháp cơ bản.
    * *Thời lượng*: 3 giờ.
  * Lưu vào DB dưới dạng: `"<p><strong>Mục tiêu</strong>: Nắm vững cú pháp cơ bản.</p><p><em>Thời lượng</em>: 3 giờ.</p>"`.
  * Trên danh sách Admin hiển thị rút gọn: `"Mục tiêu: Nắm vững cú pháp cơ bản. Thời lượng: 3 giờ."` (đã strip HTML để tránh lỗi vỡ dòng).
  * Trên site thực hiển thị đúng định dạng:
    * **Mục tiêu**: Nắm vững cú pháp cơ bản.
    * *Thời lượng*: 3 giờ.

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx):
  * Dòng 542 và 841 đang dùng `<Input>` cho `summary`.
  * Dòng 573 đang render `{chapter.summary}` trực tiếp dạng text thô.
* Đã kiểm tra file [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx):
  * Dòng 240 đang render `{chapter.summary}` trực tiếp dạng text thô, sẽ lỗi hiển thị tag HTML nếu `summary` lưu HTML.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Hệ thống lộ trình học ban đầu được xây dựng tối giản, sử dụng chuỗi văn bản thuần (plaintext) cho phần tóm tắt chương học để tiện cho việc soạn thảo nhanh (inline edit). Khi nghiệp vụ yêu cầu định dạng văn bản nâng cao (Rich Text), hệ thống cần chuyển sang Lexical Editor nhưng phải đảm bảo xử lý làm sạch HTML (strip HTML) ở nơi hiển thị rút gọn và parse HTML thành UI ở nơi hiển thị đầy đủ.
* **Độ tin cậy nguyên nhân gốc**: High (Do phân tích logic và code hiện tại).

# IV. Proposal (Đề xuất)

* **Bước 1**: Cập nhật `CourseCurriculumEditor.tsx`:
  * Import `LexicalEditor` từ `../../components/LexicalEditor`.
  * Import `stripHtml` từ `@/lib/seo`.
  * Bổ sung state `isChapterSaving` để theo dõi quá trình lưu chương.
  * Bổ sung state `newChapterResetKey` (number) để reset Lexical Editor của form Thêm chương.
  * Thay thế inline edit của chương học thành một Dialog **Edit Chapter Modal** chứa tên chương (Input) và tóm tắt chương (LexicalEditor).
  * Ở Accordion Header, nút sửa chương sẽ mở Dialog này.
  * Ở form tạo chương học mới, thay `<Input>` tóm tắt chương bằng `<LexicalEditor>`.
  * Thay `{chapter.summary}` hiển thị trên Accordion Header thành `{stripHtml(chapter.summary)}`.
* **Bước 2**: Cập nhật `CourseDetailPage.tsx`:
  * Tìm vị trí render `{chapter.summary}` (dòng 240).
  * Thay thế bằng:
    ```tsx
    <div className="mt-1 text-sm text-slate-500 prose-sm prose dark:prose-invert max-w-none">
      <RichContent content={withFormatMarker('richtext', chapter.summary)} />
    </div>
    ```

# V. Files Impacted (Tệp bị ảnh hưởng)

* [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx)
  * *Vai trò hiện tại*: Component quản lý lộ trình học.
  * *Thay đổi*: Đổi ô nhập tóm tắt chương học sang Lexical Editor, tạo Dialog Sửa chương riêng, và strip HTML tóm tắt chương hiển thị trên danh sách.
* [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
  * *Vai trò hiện tại*: Trang hiển thị chi tiết khóa học site công khai.
  * *Thay đổi*: Dùng `<RichContent>` để render mã HTML tóm tắt chương.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa `CourseCurriculumEditor.tsx` để import `LexicalEditor` và `stripHtml`, chuyển sang dùng Dialog Edit và Lexical Editor, đồng thời strip HTML ở Accordion Header.
2. Sửa `CourseDetailPage.tsx` để render tóm tắt chương học qua `RichContent` và `withFormatMarker`.
3. Biên dịch dự án bằng TypeScript compiler để đảm bảo các thay đổi không có lỗi Typescript.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo code biên dịch thành công.

### Manual Verification
* Vào trang edit khóa học -> Tab Lộ trình học:
  * Tạo chương mới bằng Lexical Editor (thử định dạng in đậm, in nghiêng...).
  * Nhấn Sửa chương học, kiểm tra Dialog Sửa chương mở lên có Lexical Editor chứa nội dung cũ. Sửa và bấm Lưu.
  * Kiểm tra trên danh sách chương học Admin xem tóm tắt hiển thị text thô đẹp đẽ, không bị lẫn tag HTML.
* Vào trang chi tiết khóa học ở site công khai (`/khoa-hoc/[slug]`):
  * Kiểm tra phần lộ trình học xem tóm tắt chương học hiển thị định dạng Rich Text đầy đủ (in đậm, in nghiêng, màu sắc...).

# VIII. Todo

- [ ] Import `LexicalEditor` và `stripHtml`, thay thế ô nhập summary bằng Lexical Editor và tạo Edit Chapter Dialog trong [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx)
- [ ] Render tóm tắt chương qua `RichContent` ở trang site thực [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
- [ ] Chạy check TypeScript compiler đảm bảo không có lỗi biên dịch

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Soạn thảo tóm tắt chương học trong Admin hiển thị đầy đủ thanh công cụ Lexical.
2. Edit Chapter Dialog hoạt động ổn định, lưu chính xác tóm tắt chương định dạng HTML.
3. Tóm tắt chương học trên site thực hiển thị đúng định dạng Rich Text (không bị lộ mã HTML).
4. Code không có lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi cú pháp khi thay thế LexicalEditor.
* **Hoàn tác**: Sử dụng `git checkout` để rollback code nếu gặp lỗi nghiêm trọng.

# XI. Out of Scope (Ngoài phạm vi)

* Thay đổi schema backend của Convex.
* Hỗ trợ markdown cho tóm tắt chương (chỉ dùng Lexical HTML mặc định).

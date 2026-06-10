# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**:
  - Trang học bài chưa hiển thị phần "Tóm tắt chương" (mô tả ngắn của từng chương) giống như trang chi tiết khóa học.
  - Trang chi tiết khóa học lại ẩn "Tóm tắt chương" nếu nó chứa từ khóa "Buổi 1", "Bài 1"... (do cơ chế lọc dữ liệu cũ quá nghiêm ngặt).
  - Khung giao diện trang học bài trên máy tính (desktop) bị chật, tiêu đề bài học dài bị xuống dòng nhiều.
  - Trên điện thoại (mobile), danh sách bài học (sidebar) lại nằm đè lên trên video học, bắt người dùng phải cuộn qua danh sách dài mới thấy video.
- **Giải pháp**:
  - Thêm phần hiển thị "Tóm tắt chương" bằng Rich Text (`RichContent`) vào sidebar trang học bài khi người dùng mở rộng chương.
  - Nới lỏng hoặc loại bỏ bộ lọc dữ liệu cũ (`isLegacySummary`) để hiển thị tóm tắt chương đầy đủ trên trang chi tiết khóa học.
  - Tăng độ rộng trang học bài trên desktop từ `max-w-7xl` (1280px) lên `max-w-[1600px]` và tăng độ rộng sidebar lên `lg:w-[380px]` để tiêu đề hiển thị thoải mái.
  - Đảo thứ tự hiển thị trên mobile bằng cách dùng `flex-col lg:flex-row-reverse` và đảo vị trí thẻ HTML, giúp video luôn ở trên cùng trên điện thoại, còn danh sách bài học nằm ở dưới.

## 2. Elaboration & Self-Explanation
Hệ thống học tập trực tuyến cần mang lại trải nghiệm mượt mà và tập trung nhất cho học viên. Hiện tại, trang học bài đang gặp 3 điểm nghẽn lớn về mặt trải nghiệm người dùng (UX):
1. **Thiếu thông tin bổ trợ (Tóm tắt chương)**: Mỗi chương học thường có một phần mô tả ngắn gọn (tóm tắt chương) để định hướng kiến thức. Admin đã soạn thảo phần này trong trang quản trị nhưng nó chưa được hiển thị ở trang học bài, và đôi khi bị ẩn oan ở trang chi tiết khóa học vì chứa chữ "Buổi 1", "Bài 1". Ta cần đưa component `RichContent` vào sidebar trang học để render phần tóm tắt chương này khi mở accordion chương.
2. **Không gian hiển thị chật hẹp**: Sidebar danh sách bài học trên desktop hiện tại cố định ở mức 320px trong một container hẹp 1280px. Với các bài học có tiêu đề dài, chữ sẽ bị ngắt dòng liên tục gây khó đọc. Bằng cách nâng chiều rộng tối đa của trang lên 1600px và sidebar lên 380px, ta giúp bố cục cân đối và dễ nhìn hơn rất nhiều.
3. **Responsive Mobile bị ngược**: Trên mobile, do cấu trúc HTML đặt Sidebar trước nội dung chính nên trình duyệt render danh sách bài học trước rồi mới tới Video và mô tả bài học. Học viên vào học bài muốn xem video ngay chứ không muốn xem danh sách bài học trước. Giải pháp là đảo thứ tự HTML (đưa Video lên trước) và sử dụng flex direction ngược lại trên desktop (`lg:flex-row-reverse`) để đảm bảo trên desktop sidebar vẫn nằm bên trái, còn trên mobile video vẫn ở trên cùng.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Với chương "AUTOCAD KIẾN TRÚC (Buổi 1 - 8)" có tóm tắt chương là một danh sách các công cụ vẽ cơ bản.
  - Trước đây: Vào trang học bài sẽ không thấy tóm tắt này đâu. Ở trang chi tiết khóa học thì tóm tắt này bị ẩn vì chứa chữ "Buổi 1".
  - Sau khi sửa: Tóm tắt chương hiển thị dưới dạng một khung ghi chú màu xám/vàng tinh tế ngay dưới tiêu đề chương khi accordion được mở ra, giúp học viên nắm nhanh kiến thức cốt lõi.
- **Phép so sánh (Analogy)**:
  - Giống như việc bạn đọc một cuốn sách giáo khoa. Mỗi chương đều có phần tóm tắt chương ở đầu. Việc ẩn phần tóm tắt này đi giống như xé bỏ trang giới thiệu chương đó.
  - Việc xếp danh sách bài học lên trên video trên mobile giống như việc đặt mục lục của cuốn sách đè lên trên trang sách bạn đang đọc dở mỗi khi bạn mở sách ra; bạn phải lật qua mục lục đó mới đọc tiếp được. Việc đưa video lên trên giúp bạn mở đúng trang đang học ngay lập tức.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã tiến hành kiểm tra mã nguồn tại các file liên quan:
1. `app/(site)/khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx`:
   - Hiện tại container chính sử dụng class `max-w-7xl` (dòng 148).
   - Sidebar `<aside>` sử dụng class `w-full lg:w-80 shrink-0` (dòng 150).
   - Sidebar nằm trước `<section>` (cột chính) trong bố cục HTML dẫn đến việc trên mobile sidebar xếp trên video.
   - Trong Accordion của từng chương trong sidebar (dòng 172-200), chưa có logic hiển thị `chapter.summary`.
2. `app/(site)/_components/courses/CourseDetailPage.tsx`:
   - Logic `isLegacySummary` lọc bỏ summary nếu chứa các từ khóa như "Buổi 1", "Bài 1" (dòng 211-216), khiến tóm tắt chương hợp lệ của người dùng bị ẩn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**:
  - Bố cục HTML của trang học bài đặt `<aside>` (sidebar) trước `<section>` (nội dung chính), kết hợp với `flex-col lg:flex-row` khiến thứ tự hiển thị trên mobile bị sai lệch (sidebar đè lên video).
  - Code trang học bài chưa được lập trình để truy vấn và render trường `chapter.summary`.
  - Quy tắc ẩn dữ liệu rác (`isLegacySummary`) trên trang chi tiết khóa học quá cứng nhắc, chỉ dựa vào sự xuất hiện của các từ khóa thông dụng như "Buổi 1" hay "Bài 1" thay vì kiểm tra cấu trúc dữ liệu thực tế.

# IV. Proposal (Đề xuất)
- **Giải pháp**:
  1. **Đảo thứ tự layout trang bài học**:
     - Thay đổi class của container chính thành `max-w-[1600px] lg:flex-row-reverse`.
     - Đảo vị trí trong HTML: Đưa `<section>` (cột chính chứa video) lên trước `<aside>` (sidebar). Như vậy trên mobile video sẽ xuất hiện trước, còn trên desktop nhờ `flex-row-reverse` nên sidebar vẫn nằm bên trái và video nằm bên phải.
     - Tăng chiều rộng sidebar từ `lg:w-80` (320px) thành `lg:w-[380px]` (380px).
  2. **Hiển thị tóm tắt chương ở trang bài học**:
     - Trong sidebar trang bài học, khi mở Accordion chương (`isOpen === true`), nếu chương đó có `chapter.summary`, ta sẽ hiển thị nó ngay trước danh sách bài học dưới dạng một khung Note Box nhỏ gọn:
       ```typescript
       {chapter.summary && (
         <div className="mx-4 mb-3 text-[11px] leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100/80">
           <RichContent content={withFormatMarker('richtext', chapter.summary)} />
         </div>
       )}
       ```
  3. **Tối ưu hóa bộ lọc tóm tắt chương ở trang chi tiết khóa học**:
     - Trong `CourseDetailPage.tsx`, loại bỏ điều kiện `isLegacySummary` hoặc tinh chỉnh lại để luôn hiển thị tóm tắt chương của người dùng nếu họ đã chủ động cấu hình nó, tránh việc ẩn nhầm. Vì bây giờ admin đã dùng Rich Text Editor (Lexical) nên dữ liệu nhập vào chuẩn chỉnh hơn nhiều.

# V. Files Impacted (Tệp bị ảnh hưởng)

- ### [MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx)
  - *Vai trò hiện tại*: Trang học bài hiển thị video bài học và danh sách bài học bên cạnh.
  - *Thay đổi*: Đảo thứ tự HTML của `<section>` và `<aside>`, tăng kích thước container lên `max-w-[1600px]` và sidebar lên `lg:w-[380px]`, hiển thị `chapter.summary` trong Accordion khi mở.
- ### [MODIFY] [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
  - *Vai trò hiện tại*: Trang chi tiết khóa học hiển thị tổng quan lộ trình và thông tin học tập.
  - *Thay đổi*: Bỏ logic lọc `isLegacySummary` để luôn hiển thị tóm tắt chương khi có dữ liệu.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ hai file đích để xác định chính xác các dòng cần sửa đổi.
2. Cập nhật `app/(site)/khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx`:
   - Import `withFormatMarker` từ `@/components/common/RichContent` nếu chưa có.
   - Sửa container chính và đảo thẻ `<section>` lên trước `<aside>`. Sửa `lg:w-80` thành `lg:w-[380px]`.
   - Thêm phần render `chapter.summary` bằng `RichContent` vào vùng mở rộng của accordion chương.
3. Cập nhật `app/(site)/_components/courses/CourseDetailPage.tsx`:
   - Đơn giản hóa biến `shouldShowSummary` thành `!!chapter.summary`.
4. Xem xét kỹ các thay đổi tĩnh, đảm bảo TypeScript biên dịch thành công.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng thủ công**:
  - Truy cập trang bài học trên trình duyệt (desktop), kiểm tra xem sidebar đã rộng rãi hơn chưa, tiêu đề bài học hiển thị đẹp mắt, và tóm tắt chương có xuất hiện khi mở accordion không.
  - Thu nhỏ trình duyệt về kích thước mobile (hoặc dùng DevTools F12 giả lập mobile), kiểm tra xem video bài học đã nhảy lên trên cùng chưa, danh sách bài học nằm dưới video và mô tả.
  - Truy cập trang chi tiết khóa học, kiểm tra xem tóm tắt chương đã hiển thị đầy đủ hay chưa.

# VIII. Todo
- [ ] Cập nhật layout và hiển thị tóm tắt chương ở trang bài học [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/khoa-hoc/[slug]/bai-hoc/[lessonSlugAndId]/page.tsx).
- [ ] Cập nhật hiển thị tóm tắt chương ở trang chi tiết khóa học [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Tóm tắt chương hiển thị chuẩn Rich Text khi mở Accordion chương ở cả 2 trang.
- Trên desktop, trang bài học có chiều rộng tối đa lên tới 1600px, sidebar rộng 380px.
- Trên mobile, video bài học và thông tin bài học hiển thị trước danh sách bài học.
- Dự án build thành công không lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp, chỉ thay đổi vị trí layout bằng CSS Flexbox và hiển thị thêm một trường thông tin đã có sẵn trong database.
- **Hoàn tác**: Sử dụng `git checkout` để khôi phục trạng thái ban đầu của 2 file đã chỉnh sửa nếu xảy ra lỗi ngoài ý muốn.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi cấu trúc database hoặc các API endpoints của Convex.
- Không thay đổi logic phân quyền học thử / đăng nhập / mua khóa học.

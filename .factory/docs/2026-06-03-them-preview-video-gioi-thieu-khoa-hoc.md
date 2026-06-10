# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**:
  - Khi tạo hoặc sửa khóa học trong trang quản trị (Admin), người quản trị nhập link video giới thiệu (YouTube, Google Drive) nhưng không thể xem trước (preview) xem link đó có hoạt động đúng hay không.
  - Trên trang chi tiết khóa học ngoài đời thực, dù khóa học có video giới thiệu nhưng trang web chỉ hiển thị ảnh đại diện tĩnh, học viên không thể xem được video giới thiệu của khóa học.
- **Giải pháp**:
  - **Trong Admin**: Thêm khung phát video xem trước (video preview iframe) ngay dưới ô nhập URL video khi link hợp lệ.
  - **Ngoài site thực**: Trên ảnh đại diện khóa học (thumbnail), nếu có video giới thiệu, hiển thị thêm nút Play lớn và dòng chữ "Video giới thiệu". Khi học viên bấm vào, một hộp thoại (Modal/Lightbox) tràn màn hình sẽ mở ra để phát video giới thiệu một cách mượt mà và trực quan.

## 2. Elaboration & Self-Explanation
Việc bổ sung video giới thiệu khóa học giúp tăng đáng kể tỷ lệ đăng ký học (Conversion Rate). Giao diện hiện tại thiếu đi sự tương tác này ở cả hai phía:
1. **Trải nghiệm của Quản trị viên (Admin UX)**: Việc cho phép admin dán link video và nhìn thấy ngay iframe phát video hoạt động giúp giảm thiểu sai sót (ví dụ dán sai định dạng link, dán link chết).
2. **Trải nghiệm của Học viên (Student UX)**: Khi học viên vào trang chi tiết khóa học, ảnh đại diện tĩnh không đủ hấp dẫn. Thiết kế nút Play tròn bóng bẩy đè lên ảnh đại diện tạo cảm giác tò mò. Khi click vào, Modal mờ tối màu bao quanh sẽ bật lên và tự động phát video giới thiệu, mang lại trải nghiệm xem phim rạp cực kỳ cao cấp (premium).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Admin dán URL YouTube: `https://www.youtube.com/watch?v=N3AY7j5...` vào ô URL video giới thiệu. Ngay dưới ô nhập hiện ra một khung video 16:9 phát thử đúng video đó.
  - Học viên vào trang AutoCAD. Trên góc phải, ảnh đại diện khóa học có một nút Play tròn lớn ở trung tâm. Học viên click vào, màn hình tối lại, một trình phát video kích thước lớn xuất hiện phát video giới thiệu khóa học AutoCAD dài 2 phút. Bấm ra ngoài hoặc bấm "Đóng" để tắt video.
- **Phép so sánh (Analogy)**:
  - Việc không có preview trong admin giống như gửi một bức ảnh đi in mà không được xem bản in thử (proof) trước; bạn chỉ biết nó lỗi khi nó đã được in xong. Khung preview là bản in thử tức thì.
  - Việc hiển thị nút Play và click mở Modal giống như nút bấm thử chuông trên một món đồ chơi trong hộp kính ở cửa hàng. Thay vì bắt người dùng mua mới được bóc hộp nghe thử, cửa hàng cho phép họ nhấn nút để nghe thử âm thanh ngay tại chỗ, giúp họ dễ dàng quyết định mua hơn.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã rà soát mã nguồn ở các file liên quan:
1. `app/admin/courses/[id]/edit/page.tsx`:
   - Ô nhập video giới thiệu ở dòng 655-674, chỉ có `<Input>` thô cho `introVideoUrl`.
2. `app/admin/courses/create/page.tsx`:
   - Ô nhập video giới thiệu ở dòng 408-427, chỉ có `<Input>` cho `introVideoUrl`.
3. `app/(site)/_components/courses/CourseDetailPage.tsx`:
   - CtaCard ở dòng 122-151 hiển thị thumbnail tĩnh bằng thẻ `<img>` không có tương tác phát video.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**:
  - Hệ thống ban đầu chưa lập trình logic phân tích cú pháp (parse) video URL của YouTube/Drive cho trường `introVideoUrl` của Course để hiển thị ra iframe preview hoặc Modal phát video.

# IV. Proposal (Đề xuất)
- **Giải pháp**:
  1. **Tạo hàm tiện ích phân tích URL video giới thiệu (`getEmbedUrl`)**:
     - Hàm này sẽ nhận vào loại video (`introVideoType`) và URL (`introVideoUrl`), trích xuất video ID và trả về embed URL chuẩn cho iframe (YouTube/Google Drive).
  2. **Tích hợp Preview trong Admin**:
     - Thêm `getEmbedUrl` vào `CourseEditPage` và `CourseCreatePage`.
     - Render khung `<iframe>` tỉ lệ `aspect-video` ngay dưới ô nhập URL khi hàm trả về kết quả hợp lệ.
  3. **Tích hợp Lightbox phát video ngoài Site thực**:
     - Trong `CourseDetailPage.tsx`, sử dụng `useMemo` tính toán `promoVideoEmbedUrl` từ `course.introVideoType` và `course.introVideoUrl`.
     - Thiết lập state `showPromoVideo` điều khiển việc mở/đóng Modal phát video.
     - Cải tiến giao diện Thumbnail: Thêm lớp overlay màu đen mờ, nút Play tròn sang trọng và nhãn "Video giới thiệu" ở góc.
     - Thêm cấu trúc Modal tối màu chứa `<iframe>` phát video tự động (`autoplay=1`) bật lên khi học viên click vào Thumbnail.

# V. Files Impacted (Tệp bị ảnh hưởng)

- ### [MODIFY] [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx)
  - *Vai trò*: Trang chỉnh sửa khóa học trong Admin.
  - *Thay đổi*: Thêm hàm `getEmbedUrl` và phần hiển thị iframe preview ngay dưới ô nhập URL video giới thiệu.
- ### [MODIFY] [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx)
  - *Vai trò*: Trang tạo mới khóa học trong Admin.
  - *Thay đổi*: Đồng bộ thêm hàm `getEmbedUrl` và phần hiển thị iframe preview tương tự trang edit.
- ### [MODIFY] [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx)
  - *Vai trò*: Trang chi tiết khóa học ở frontend.
  - *Thay đổi*: Tính toán URL embed video giới thiệu, thêm nút Play cùng overlay trên Thumbnail, tạo Modal overlay phát video giới thiệu khi click.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm `getEmbedUrl` ở mức file scope cho `edit/page.tsx` và `create/page.tsx`.
2. Sửa khối UI Video giới thiệu trong hai file Admin để render iframe.
3. Ở frontend, thêm state `showPromoVideo` và memoized URL `promoVideoEmbedUrl` trong `CourseDetailPage.tsx`.
4. Cập nhật `CtaCard` của `CourseDetailPage.tsx` để có giao diện click-to-play.
5. Thêm mã HTML cho Modal phát video ở cuối file `CourseDetailPage.tsx`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng thủ công**:
  - Vào trang edit khóa học của admin, điền link YouTube hợp lệ và xem iframe preview hoạt động. Thay đổi loại video sang Google Drive hoặc External để kiểm tra tính tương thích.
  - Lưu lại khóa học, truy cập trang chi tiết khóa học ngoài web, di chuột vào thumbnail xem hiệu ứng zoom và nút Play, click vào để xem Modal phát video giới thiệu bật lên mượt mà và tự động phát. Bấm nút "Đóng" hoặc ra ngoài để tắt.

# VIII. Todo
- [ ] Thêm preview video giới thiệu ở trang tạo khóa học [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/create/page.tsx).
- [ ] Thêm preview video giới thiệu ở trang sửa khóa học [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/[id]/edit/page.tsx).
- [ ] Cập nhật giao diện phát video giới thiệu (Modal Lightbox) trên trang chi tiết khóa học [CourseDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CourseDetailPage.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Admin hiển thị chính xác video preview tỉ lệ 16:9 khi dán link.
- Frontend hiển thị nút Play trên thumbnail và phát video dạng Lightbox khi click.
- Không gây ra lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Không có, hoàn toàn là thay đổi UI.
- **Hoàn tác**: Sử dụng `git checkout` để khôi phục các file về trạng thái ban đầu.

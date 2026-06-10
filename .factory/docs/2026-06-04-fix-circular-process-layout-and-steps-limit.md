# I. Primer

## 1. TL;DR kiểu Feynman
Khi xem sơ đồ các bước công việc hình tròn (Circular Process Layout) trên máy tính xách tay cỡ vừa (màn hình `lg`), vòng tròn này bị to quá và tràn ra ngoài lề (bị lồi ra ngoài nền tối). Lý do là vì màn hình lúc đó được chia đôi thành hai cột (chữ bên trái, vòng tròn bên phải), nhưng chúng ta lại ép kích thước vòng tròn luôn là 610 pixel (quá to so với một nửa màn hình). Chúng ta sẽ giải quyết bằng cách:
* Thu nhỏ vòng tròn xuống khoảng 80% (rộng 490 pixel) khi ở màn hình vừa `lg`.
* Chỉ cho phép vòng tròn đạt kích thước đầy đủ 610 pixel (100%) khi màn hình đủ rộng `xl` (từ 1280 pixel trở lên).
* Giữ nguyên cấu hình không hardcode văn bản và tự động lấy chữ từ trang quản trị.

## 2. Elaboration & Self-Explanation
Bố cục vòng tròn Circular sử dụng hệ tọa độ tuyệt đối dựa trên một vòng tròn cơ sở có đường kính 500px, xung quanh là các nút bước công việc nhô ra thêm 55px ở mỗi bên, tạo thành một khối đồ họa có tổng kích thước thực tế là 610px x 610px. 
Ở các kích thước màn hình như di động (`mobile`), máy tính bảng (`tablet`), hay máy tính để bàn nhỏ (`md`), giao diện hiển thị theo dạng 1 cột (chữ ở trên, vòng tròn ở dưới), và vòng tròn được co nhỏ lại thông qua thuộc tính `scale` của CSS (ví dụ `scale-[0.52]` hoặc `scale-[0.79]`), nên không bị tràn.
Tuy nhiên, khi màn hình đạt kích thước `lg` (từ 1024px trở lên), giao diện chuyển sang dạng lưới 2 cột (`lg:grid-cols-2`). Tại thời điểm này, mỗi cột chỉ được phân chia khoảng 500px chiều rộng. Nhưng lớp wrapper của vòng tròn lại ngay lập tức áp dụng `lg:w-[610px]` và `lg:scale-100`, dẫn đến việc đồ họa vòng tròn lớn hơn cột chứa nó, tràn ra đè lên cột chữ bên trái hoặc trồi ra ngoài mép phải màn hình.
Hướng xử lý là điều chỉnh lại tỉ lệ scale tại breakpoint `lg` xuống mức `0.8` (tương ứng với chiều rộng wrapper là `490px`) để khớp hoàn toàn với độ rộng của cột chia đôi. Khi màn hình đạt breakpoint `xl` (từ 1280px trở lên), cột chứa đã đủ rộng (~640px), ta mới nâng tỉ lệ scale lên `1.0` (wrapper `610px`).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Hãy tưởng tượng bạn có một cái hộp quà hình vuông cạnh 61cm. Bạn muốn đặt nó vào một ngăn tủ rộng 50cm. Dù ngăn tủ đó có để trống và không có nắp (overflow-visible), chiếc hộp vẫn sẽ thò ra ngoài ngăn tủ 11cm và gây vướng víu cho các ngăn bên cạnh. Giải pháp là ở những ngăn tủ nhỏ 50cm, chúng ta đổi sang dùng hộp quà thu nhỏ kích thước còn 49cm. Chỉ khi nào gặp ngăn tủ lớn 64cm, chúng ta mới dùng hộp quà cỡ gốc 61cm.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Trạng thái steps:** Admin Form đã nâng lên tối đa 8 bước, AI import đã được cấu hình nhận diện tối đa 8 bước.
* **Trạng thái Hook Order:** Lỗi đổi thứ tự Hook React trong `ProcessSectionContent` đã được khắc phục hoàn toàn bằng cách đóng gói helper render thành component độc lập (`RenderCircular`, `RenderStepper`).
* **Trạng thái hiển thị Circular:** Vòng tròn bị lồi (tràn ra khỏi background) tại màn hình `lg` (1024px đến 1279px) do ép kích thước 610px khi cột chứa chỉ rộng dưới 500px.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc (Root Cause):** Việc gán cứng tỷ lệ hiển thị `lg:scale-100` và chiều rộng `lg:w-[610px]` cho wrapper vòng tròn Circular trong khi màn hình `lg` chia 2 cột (`lg:grid-cols-2`) làm cho phần tử đồ họa vượt quá không gian khả dụng của cột chứa (chỉ rộng khoảng 450px - 500px).
* **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu ta không chia cột ở màn hình `lg` mà giữ 1 cột, vòng tròn sẽ không bị tràn, nhưng điều này sẽ phá hỏng bố cục thiết kế 2 cột mong muốn trên desktop của người dùng. Do đó, giải pháp tối ưu là giữ nguyên lưới 2 cột và điều chỉnh tỷ lệ scale của vòng tròn tương ứng với không gian cột chứa tại mỗi breakpoint (`lg` vs `xl`).

---

# IV. Proposal (Đề xuất)
* Thay đổi CSS responsive classes của wrapper ngoài và wrapper trong của component `RenderCircular` trong tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx):
  * **Wrapper ngoài:** Thay `lg:w-[610px] lg:h-[610px]` thành `lg:w-[490px] lg:h-[490px] xl:w-[610px] xl:h-[610px]`.
  * **Wrapper trong:** Thay `lg:scale-100` thành `lg:scale-[0.80] xl:scale-100`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  * Vai trò: Chứa logic hiển thị giao diện dùng chung của cấu phần Process (bao gồm layout Circular).
  * Thay đổi: Điều chỉnh tỷ lệ scale và kích thước wrapper của `RenderCircular` tại breakpoint `lg` và `xl`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
2. Tìm khối mã định nghĩa `RenderCircular` tại dòng 1313-1316.
3. Thay thế các thuộc tính chiều rộng, chiều cao và scale của wrapper ngoài và trong để tối ưu hóa hiển thị trên màn hình `lg`.
4. Lưu tệp và tiến hành kiểm tra biên dịch kiểu tĩnh (static typecheck) thông qua `bunx tsc --noEmit`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra kiểu tĩnh (Static Typecheck):** Chạy lệnh `bunx tsc --noEmit` để đảm bảo không phát sinh bất kỳ lỗi TypeScript nào sau khi cập nhật CSS class.
* **Xác minh trực quan (Visual Verification):** Người dùng kiểm tra trực tiếp trên trình duyệt ở kích thước màn hình cỡ vừa (laptop `lg`, ví dụ chiều rộng 1024px) để đảm bảo vòng tròn nằm gọn trong nền tối và không đè lên phần chữ.

---

# VIII. Todo
* [ ] Cập nhật CSS classes cho wrapper ngoài của `RenderCircular` trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Cập nhật CSS classes cho wrapper trong của `RenderCircular` trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
* [ ] Chạy `bunx tsc --noEmit` để kiểm tra lỗi type compile.
* [ ] Phát âm thanh thông báo hoàn thành tác vụ (`Done, Sir.`).

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Vòng tròn Circular hiển thị cân đối, vừa vặn bên trong cột bên phải ở breakpoint `lg` (1024px) và đạt kích thước tối đa ở breakpoint `xl` (1280px).
* Không xuất hiện thanh cuộn ngang (horizontal scrollbar) do phần tử vòng tròn bị tràn mép màn hình.
* Biên dịch TypeScript thành công không có lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Các thay đổi chỉ liên quan đến class CSS Tailwind (`scale`, `w-`, `h-`) nên rủi ro cực kỳ thấp và không ảnh hưởng đến logic chức năng hay dữ liệu.
* **Hoàn tác:** Dễ dàng rollback bằng cách sử dụng `git checkout` tệp [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc dữ liệu lưu trữ các bước (steps) trong Convex.
* Refactor các layout khác ngoài `circular`.

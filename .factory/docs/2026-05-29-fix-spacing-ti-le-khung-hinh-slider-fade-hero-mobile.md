# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi người dùng tải lên ảnh banner có tỷ lệ siêu rộng $21:9$ (rộng và dẹt), trên máy tính (desktop) ảnh hiển thị rất đẹp. Nhưng trên điện thoại (mobile), khung ảnh lại bị ép vào khuôn tỷ lệ $16:9$ (cao hơn). Vì ảnh dẹt hơn khuôn, nó phải co lại để vừa chiều ngang, để thừa ra hai khoảng trống mờ mịt ở trên và dưới.
* **Giải pháp**: Chúng ta sẽ thay đổi khuôn chứa ảnh trên mobile từ tỷ lệ $16:9$ thành $21:9$ cho cả 2 kiểu trình chiếu là **Slider** và **Fade**. Lúc này khuôn và ảnh đều là $21:9$, ảnh sẽ lấp đầy 100% khuôn mà không tạo ra khoảng trống thừa nào nữa.
* **Phạm vi sửa đổi**: Cần chỉnh ở cả trang hiển thị chính cho khách hàng (`HeroRuntimeSection.tsx`) và trang xem trước (preview) dành cho admin lúc tạo/sửa (`HeroPreview.tsx`).

## 2. Elaboration & Self-Explanation
Hiện tại, trong mã nguồn của chúng ta đang cấu hình tỷ lệ khung hình (aspect ratio) của hai layout **Slider** và **Fade** của Hero component như sau:
* Trên Desktop: Sử dụng lớp CSS `md:aspect-[21/9]` (tỷ lệ $21:9$, rất rộng).
* Trên Mobile: Sử dụng lớp CSS mặc định `aspect-[16/9]` (tỷ lệ $16:9$, tiêu chuẩn).

Hình ảnh của người dùng cung cấp có tỷ lệ thực tế là $21:9$. Do container trên mobile dùng tỷ lệ $16:9$, chiều cao của container ($9/16 \approx 56.25\%$ chiều rộng) lớn hơn chiều cao của hình ảnh khi scale theo chiều ngang ($9/21 \approx 42.85\%$ chiều rộng). 
Vì hình ảnh sử dụng thuộc tính CSS `object-contain` để không bị méo hay mất chi tiết, trình duyệt bắt buộc phải thu nhỏ ảnh theo chiều ngang để vừa khít container, dẫn tới việc dư thừa khoảng trống có kích thước bằng:
$$\Delta H = 56.25\% - 42.85\% = 13.4\% \text{ chiều rộng}$$
Khoảng trống này được lấp bởi một lớp hình ảnh nền bị làm mờ (blur 30px) để tránh khoảng trắng thô thiển, nhưng vô tình tạo ra hai dải spacing mờ ở trên và dưới như hình khoanh đỏ của người dùng.

Để khắc phục triệt để, chúng ta sẽ cấu hình đồng bộ tỷ lệ aspect ratio của cả hai layout trên thành `aspect-[21/9]` trên cả thiết bị di động và máy tính. Điều này đảm bảo container luôn có tỷ lệ khớp hoàn hảo với ảnh của người dùng, loại bỏ hoàn toàn phần dư thừa $\Delta H$ trên.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như bạn có một bức tranh phong cảnh panorama rất dài và dẹt (tỷ lệ $21:9$). 
  * Nếu bạn đặt nó vào một chiếc khung tranh panorama tương ứng (khung $21:9$), bức tranh sẽ vừa khít, hoàn hảo.
  * Nếu bạn cố tình đặt nó vào một chiếc khung tranh vuông vắn hơn (khung $16:9$), để bức tranh không bị cắt xén hay bóp méo, bạn bắt buộc phải chừa ra hai khoảng trống lớn ở cạnh trên và cạnh dưới của khung tranh.
* **Giải pháp của chúng ta**: Đổi chiếc khung tranh trên điện thoại di động thành khung panorama ($21:9$) giống hệt như trên máy tính.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Chúng tôi đã rà soát toàn bộ các tệp liên quan đến `Hero` component trong dự án bao gồm cả runtime component hiển thị phía Client và preview component hiển thị phía Admin.
* Phát hiện hai tệp chính chịu trách nhiệm render cấu trúc layout `slider` và `fade` có chứa cấu hình aspect ratio tĩnh trên mobile là `aspect-[16/9]`:
  1. **Runtime (Trang chủ phía Site)**: [HeroRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/home/sections/HeroRuntimeSection.tsx)
  2. **Preview (Trang tạo/sửa phía Admin)**: [HeroPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/hero/_components/HeroPreview.tsx)
* Việc sửa đổi hai tệp này là phương án tối giản, an toàn và trực tiếp nhất để giải quyết triệt để yêu cầu của người dùng mà không làm phát sinh lỗi hệ thống hay phá vỡ cấu trúc CSS hiện tại.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Độ tin cậy nguyên nhân gốc: High (Cao)
* **Lý do**: Triệu chứng khoảng trống thừa trên dưới xuất hiện đồng bộ do sự chênh lệch tỷ lệ khung hình được code cứng trong CSS Class của Tailwind (`aspect-[16/9]` vs `md:aspect-[21/9]`). Ảnh người dùng có tỷ lệ $21:9$ khớp với desktop nhưng lệch với mobile. Việc chuyển đổi tỷ lệ mobile sang `aspect-[21/9]` chắc chắn sẽ xử lý triệt để lỗi này.

### Giả thuyết đối chứng (Counter-Hypothesis):
* *Giả thuyết*: Khoảng trống xuất hiện do padding hoặc margin ngoài của container?
* *Đối chứng*: Đã kiểm tra code chi tiết trong `HeroRuntimeSection.tsx` và `HeroPreview.tsx`. Không có padding/margin tĩnh nào gây ra khoảng trống lớn như vậy. Khoảng trống này chỉ xuất hiện bao quanh ảnh `object-contain`, chứng tỏ nó sinh ra do sự lệch tỷ lệ khung hình (Aspect Ratio Mismatch).

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất cập nhật tỷ lệ khung hình của layout `Slider` và `Fade` của Hero component trên thiết bị di động từ `aspect-[16/9]` thành `aspect-[21/9]` đồng bộ với Desktop.

1. **Ở phía Site (Runtime)**:
   * **Slider layout**: Sửa từ `aspect-[16/9] md:aspect-[21/9]` thành `aspect-[21/9]`.
   * **Fade layout**: Sửa từ `aspect-[16/9] md:aspect-[21/9]` thành `aspect-[21/9]`.
2. **Ở phía Admin (Preview)**:
   * **Slider layout preview**: Cập nhật logic tính aspect ratio khi thiết bị là mobile/tablet để sử dụng `aspect-[21/9]`.
   * **Fade layout preview**: Tương tự, cập nhật logic tính aspect ratio khi thiết bị là mobile/tablet thành `aspect-[21/9]`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
1. **[HeroRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/home/sections/HeroRuntimeSection.tsx)**
   * *Vai trò hiện tại*: Chịu trách nhiệm hiển thị Hero component cho khách hàng trên website thực tế.
   * *Thay đổi*: Cập nhật class aspect ratio cho layout `slider` (dòng 250) và layout `fade` (dòng 288) từ `aspect-[16/9] md:aspect-[21/9]` thành `aspect-[21/9]`.

2. **[HeroPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/hero/_components/HeroPreview.tsx)**
   * *Vai trò hiện tại*: Hiển thị phần xem trước (Preview) trực quan của Hero component trong trang tạo và chỉnh sửa của Admin.
   * *Thay đổi*: Cập nhật dòng 289 (Slider Preview aspect ratio) và dòng 374 (Fade Preview aspect ratio) để ép tỷ lệ `aspect-[21/9]` cho mọi chế độ xem (Desktop, Tablet, Mobile) thay vì dùng `aspect-[16/9]` cho Mobile/Tablet.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Đọc lại kỹ lượng vùng code xung quanh dòng 245-312 của `HeroRuntimeSection.tsx` để thực hiện thay đổi chính xác.
2. **Bước 2**: Thực hiện thay đổi tỷ lệ trong `HeroRuntimeSection.tsx`.
3. **Bước 3**: Đọc lại vùng code xung quanh dòng 285-380 của `HeroPreview.tsx`.
4. **Bước 4**: Thực hiện thay đổi tỷ lệ trong `HeroPreview.tsx` cho cả hai layout Slider và Fade.
5. **Bước 5**: Tự review tĩnh (Static Code Review) để đảm bảo không lỗi cú pháp hoặc thẻ JSX chưa đóng.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra thủ công:
1. Mở trang Admin edit của Hero tại link: `http://localhost:3000/admin/home-components/hero/js7fp8jcdwwwpj0c94jj1rhgbh87kp9p/edit`
2. Chọn layout **Slider** và **Fade**.
3. Chuyển đổi giữa các chế độ xem giả lập: Desktop, Tablet, Mobile.
4. Đảm bảo phần preview của cả hai layout trên Mobile hiển thị cực kỳ mượt mà, ảnh lấp đầy khung hình tỷ lệ $21:9$, không còn dải mờ trên dưới.
5. Truy cập trang chủ Client trên thiết bị di động (hoặc thu nhỏ trình duyệt về kích thước mobile), kiểm tra xem banner Slider/Fade đã hiển thị hoàn hảo tỉ lệ $21:9$ không dư spacing chưa.

---

# VIII. Todo

- [x] Cập nhật aspect ratio của layout `slider` và `fade` trong [HeroRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/home/sections/HeroRuntimeSection.tsx) thành `aspect-[21/9]` cho cả mobile và desktop.
- [x] Cập nhật aspect ratio trong [HeroPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/hero/_components/HeroPreview.tsx) ở dòng 289 (Slider) và dòng 374 (Fade) thành `aspect-[21/9]` cho mọi chế độ thiết bị.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Điều kiện Đạt (Pass)**:
  * Trên mọi thiết bị (đặc biệt là Mobile), container của layout Slider và Fade hiển thị đúng tỷ lệ khung hình $21:9$.
  * Hình ảnh banner có tỷ lệ $21:9$ của khách hàng lấp đầy 100% container, loại bỏ hoàn toàn dải mờ trên dưới (spacing dư thừa).
  * Trong trang Admin Create và Edit của Hero component, phần Preview của cả hai layout trên Mobile và Tablet hiển thị chuẩn xác tỷ lệ $21:9$, đồng bộ với site thực tế.
  * Không làm ảnh hưởng đến các layout khác như Bento, Triple, Fullscreen...
* **Điều kiện Không Đạt (Fail)**:
  * Layout Slider hoặc Fade trên Mobile vẫn hiển thị tỷ lệ $16:9$, dẫn đến ảnh $21:9$ bị dư dải màu blur ở trên dưới.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Hầu như không có rủi ro nào vì đây chỉ là thay đổi lớp CSS aspect ratio của Tailwind và cập nhật chuỗi class tương ứng trong preview.
* **Hoàn tác**: Sử dụng lệnh `git checkout` các file đã chỉnh sửa để đưa dự án về trạng thái ban đầu một cách nhanh chóng và an toàn.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi hành vi hiển thị của các layout khác của Hero component như Bento, Triple, Fullscreen...
* Không thay đổi cấu trúc dữ liệu lưu trữ hay API backend của Convex.
* Không can thiệp vào các component khác ngoài Hero.

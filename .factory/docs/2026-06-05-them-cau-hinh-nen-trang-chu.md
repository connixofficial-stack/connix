# I. Primer

## 1. TL;DR kiểu Feynman
Trang chủ của chúng ta hiện nay luôn có màu nền mặc định là màu trắng. Để người dùng có thể linh hoạt thay đổi màu nền này theo sở thích hoặc theo bộ nhận diện thương hiệu, chúng ta sẽ tạo thêm một phần cấu hình tại trang quản lý hệ thống (`/system/home-components`). Người dùng có thể chọn một trong các chế độ nền: Trắng, Đen, Màu chính (Primary) của thương hiệu, Màu phụ (Secondary), hoặc nhập một Màu tùy ý (Custom Hex Color). Cấu hình này sau đó sẽ được lưu vào cơ sở dữ liệu Convex và tự động áp dụng lên trang chủ thực tế.

## 2. Elaboration & Self-Explanation
Chúng ta có một hệ thống quản lý các component trang chủ tại `/system/home-components` với cơ chế lưu các thiết lập chung (như font chữ mặc định, ẩn/hiện loại component) vào bảng `settings` trong cơ sở dữ liệu Convex dưới dạng key-value. 
Mục tiêu là thêm cấu hình cho màu nền của toàn trang chủ. Kế hoạch cụ thể gồm:
- Mở rộng Convex schema và API tại `convex/homeComponentSystemConfig.ts` để lưu trữ và tải cấu hình mới với key `home_page_background`.
- Thiết kế giao diện quản trị trực quan tại `/system/home-components` cho phép chọn loại màu nền và chọn màu custom (sử dụng HTML color picker và input hex).
- Tích hợp cấu hình này vào trang chủ ở phía client (`app/(site)/_components/HomePageClient.tsx`) để bọc toàn bộ trang chủ trong một thẻ container có màu nền tương ứng.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng trang chủ giống như một bức tranh ghép từ nhiều mảnh (các component như Hero, About, Gallery, Product List). Hiện tại, khung nền của bức tranh luôn được sơn màu trắng mặc định. Thay đổi này sẽ cung cấp cho người quản trị một bảng điều khiển để sơn lại khung nền đó sang màu đen, màu chủ đạo của thương hiệu (ví dụ màu xanh dương), màu phụ của thương hiệu (ví dụ màu vàng), hoặc bất kỳ màu nào họ chọn từ bảng màu.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp API backend**: `convex/homeComponentSystemConfig.ts` chịu trách nhiệm lưu trữ các cài đặt chung cho home-components vào bảng `settings` dưới group `home_components`.
- **Tệp giao diện quản lý**: `app/system/home-components/page.tsx` là nơi hiển thị trang cấu hình hệ thống.
- **Tệp hiển thị trang chủ**: `app/(site)/_components/HomePageClient.tsx` render toàn bộ các components của trang chủ ở phía người dùng.
- **Cơ chế lấy màu thương hiệu**: Sử dụng hook `useBrandColors` trong `components/site/hooks.ts` để có được màu chính (`primary`) và màu phụ (`secondary`) hiện tại của hệ thống.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng quan sát được**: Trang chủ hiện tại (`HomePageClient.tsx`) chỉ trả về một fragment `<>...</>` chứa danh sách các component con. Không có thẻ bao bọc ngoài thiết lập màu nền cho trang chủ, dẫn đến trình duyệt tự động render theo màu nền mặc định của thẻ body (thường là màu trắng).
- **Giải pháp**: Bọc toàn bộ các components trong một thẻ `<div className="min-h-screen">` và gán style `backgroundColor` động được lấy từ cấu hình hệ thống.

---

# IV. Proposal (Đề xuất)
1. **Mở rộng API Convex (`convex/homeComponentSystemConfig.ts`)**:
   - Khai báo kiểu dữ liệu cho `homePageBackground` gồm:
     - `type`: `"white" | "black" | "primary" | "secondary" | "custom"`
     - `customColor`: chuỗi màu hex (ví dụ `#ffffff`)
   - Cập nhật hàm `getConfig` để lấy cài đặt từ database với key `"home_page_background"` (nếu chưa có sẽ fallback về màu trắng).
   - Viết mutation `setHomePageBackground` để lưu lại cấu hình mới.

2. **Cập nhật Giao diện Quản trị (`app/system/home-components/page.tsx`)**:
   - Thêm một Card cấu hình mới bên dưới phần "Font mặc định" mang tên "Màu nền trang chủ".
   - Cung cấp Radio hoặc Select dropdown để chọn các chế độ nền.
   - Nếu chọn "Tự chọn (Custom)", hiển thị một Color Picker (`<input type="color">`) kết hợp một text input để người dùng nhập mã hex chính xác.
   - Thực hiện lưu tự động khi thay đổi giá trị hoặc có nút Lưu thủ công để tối ưu UX.

3. **Cập nhật Giao diện Trang chủ (`app/(site)/_components/HomePageClient.tsx`)**:
   - Đọc cấu hình `homePageBackground` bằng `useQuery(api.homeComponentSystemConfig.getConfig)`.
   - Kết hợp với màu thương hiệu từ `useBrandColors()`.
   - Bọc nội dung trang chủ trong một thẻ `div` với `backgroundColor` tính toán được.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Backend / Database
- **Sửa:** [homeComponentSystemConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/homeComponentSystemConfig.ts)
  - Thêm cấu hình nền trang chủ vào `getConfig` query.
  - Viết mutation `setHomePageBackground` để lưu cấu hình.

### Admin Interface
- **Sửa:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/home-components/page.tsx)
  - Thêm phần UI quản lý cấu hình màu nền trang chủ và gọi mutation khi người dùng cập nhật.

### Site Frontend
- **Sửa:** [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/HomePageClient.tsx)
  - Lấy cấu hình màu nền từ Convex và áp dụng inline style `backgroundColor` cho container chính của trang chủ.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật file `convex/homeComponentSystemConfig.ts` với schema và API mutation mới.
2. Thêm form chọn màu nền vào `app/system/home-components/page.tsx`.
3. Bọc container cho trang chủ trong `app/(site)/_components/HomePageClient.tsx` bằng mã màu động.
4. Chạy kiểm tra type để đảm bảo không bị lỗi biên dịch TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tự động (Static Check)
- Chạy kiểm tra TypeScript dự án bằng lệnh:
  `bunx tsc --noEmit` (giới hạn output qua Select-Object).

### Kiểm chứng thủ công
- Truy cập `http://localhost:3000/system/home-components`.
- Thay đổi cấu hình nền thành "Đen", bấm lưu và quay lại Trang chủ xem nền đã chuyển sang màu đen chưa.
- Chọn màu chính (Primary) và màu phụ (Secondary) xem màu nền trang chủ có khớp với màu thương hiệu đã được cấu hình trong hệ thống không.
- Chọn chế độ "Tự chọn (Custom)", chỉnh màu thành `#f3f4f6` hoặc một mã màu hex ngẫu nhiên, xem trang chủ có đổi màu tương ứng không.

---

# VIII. Todo
- [ ] Cập nhật file API Convex `convex/homeComponentSystemConfig.ts`.
- [ ] Cập nhật trang giao diện quản trị `app/system/home-components/page.tsx`.
- [ ] Cập nhật trang client trang chủ `app/(site)/_components/HomePageClient.tsx`.
- [ ] Chạy check tĩnh bằng TypeScript compiler để đảm bảo code sạch lỗi type.
- [ ] Gọi âm báo phát âm "Done, Sir." khi hoàn tất mọi tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang quản trị `/system/home-components` hiển thị đầy đủ 5 tùy chọn nền: Trắng, Đen, Màu chính, Màu phụ, Tự do.
- Khi chọn "Tự do", cho phép người dùng chọn màu qua bảng màu hoặc nhập mã màu Hex.
- Khi bấm Lưu (hoặc lưu tự động), cấu hình được đồng bộ thành công vào cơ sở dữ liệu Convex.
- Trang chủ ở client-side (`/`) hiển thị màu nền chính xác theo lựa chọn cấu hình mà không làm lỗi hiển thị các component có sẵn.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Nếu người dùng cấu hình nền màu tối (ví dụ Đen), một số component có chữ màu tối mặc định sẽ khó đọc.
- **Biện pháp giảm thiểu**: Do cấu hình này nằm ở trang quản trị hệ thống (`/system/`), người dùng có quyền tự do phối hợp màu nền thương hiệu và điều chỉnh thiết kế của các components tương ứng. Chúng ta sẽ áp dụng thuộc tính `transition-colors duration-300` để màu nền chuyển tiếp mượt mà khi đổi cấu hình.
- **Rollback**: Có thể dễ dàng khôi phục các file đã chỉnh sửa bằng lệnh `git checkout`.

---

# XI. Out of Scope (Ngoài phạm vi)
- Việc thay đổi sâu vào CSS hoặc thiết kế màu sắc của từng component con (như tự động đảo ngược màu text của tất cả các phần tử con bên trong component khi chọn nền tối) không thuộc phạm vi của task này vì mỗi component đều đã có style màu sắc riêng.

---

# XII. Open Questions (Câu hỏi mở)
- *Không có câu hỏi mở.* Kế hoạch đã rõ ràng và giải quyết đúng theo yêu cầu của người dùng.

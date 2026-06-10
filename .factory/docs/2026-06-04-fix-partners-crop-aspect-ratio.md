# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Mặc dù đã đổi tỷ lệ crop và uploader sang Tự do/16:9, logo đối tác hiển thị ở Preview Badge/Logo Cloud vẫn bị bé tí và lọt thỏm. Nguyên nhân là do component `AdminImage` sử dụng Next.js `<Image>` với các thuộc tính `width/height` chỉ định sẵn. Next.js tự động áp đặt style inline `width: 100%; height: auto;` làm ghi đè các class CSS co giãn tự động (`h-full w-auto`) của chúng ta, bóp nghẹt chiều cao của logo ngang và tạo ra khoảng trống trắng khổng lồ.
- **Giải pháp:** Chuyển đổi component `AdminImage` sử dụng thẻ `<img>` chuẩn của HTML thay vì Next.js `<Image>`. Vì trang quản trị (Admin) mặc định load ảnh ở chế độ không tối ưu hóa (`unoptimized`), việc dùng thẻ `<img>` chuẩn vừa nhẹ nhàng, vừa giúp trình duyệt áp dụng chính xác các class CSS co giãn, giúp logo to rõ và vừa khít 100% chiều cao của card.
- **Cách làm:**
  - Sửa `AdminImage.tsx` thay thế Next.js `<Image>` bằng thẻ `<img>` chuẩn.

## 2. Elaboration & Self-Explanation
Component `<Image>` của Next.js được thiết kế để tự động tối ưu và co giãn ảnh responsive ở trang người dùng (frontend). Để làm được điều này, Next.js tự động chèn các inline style mạnh (như `width: 100%; height: auto;`) lên thẻ ảnh dựa vào props `width/height` truyền vào (ở đây là 1200x800).
Tuy nhiên, trong các layout đối tác ở trang Admin Preview, các logo cần co giãn theo chiều cao cố định của card (`h-full` của logo box) và tự động tính chiều rộng (`w-auto`). Khi Next.js ép `width: 100%; height: auto;`, chiều rộng logo bị kéo giãn ra tối đa và chiều cao bị co nhỏ lại theo tỷ lệ ảnh gốc, làm hỏng hoàn toàn thiết kế của card.
Chuyển sang thẻ `<img>` chuẩn giúp loại bỏ các inline style áp đặt của Next.js. Trình duyệt sẽ đọc trực tiếp class CSS của chúng ta: chiều cao bằng 100% logo box (`h-full`) và chiều rộng tự động co theo tỷ lệ logo (`w-auto`). Kết quả là logo sẽ hiển thị to tối đa và vừa khít card.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Logo `TPHome PLUS` dẹt ngang.
  - Khi dùng Next.js `<Image>`: Bị ép style `width: 100%; height: auto;`. Ảnh bị ép rộng 100px (width khả dụng), và chiều cao tự động co lại chỉ còn 40px (trong khi logo box cao 56px). Trông logo rất dẹt và lọt thỏm giữa card.
  - Khi dùng `<img>` chuẩn: Nhận đúng style `height: 100%; width: auto;`. Chiều cao ảnh đạt đúng 56px, chiều rộng tự co thành 100px. Logo chiếm trọn vẹn 100% diện tích khả dụng của card (to gấp rưỡi so với trước).
- **Trực giác đời thường:** Nó giống như việc bạn mặc một chiếc áo khoác đồng phục Next.js có dây đai tự động siết chặt eo của bạn. Cho dù bạn cố gắng nới lỏng áo bằng thắt lưng bên ngoài (class CSS), chiếc dây đai bên trong vẫn siết chặt. Bỏ chiếc áo đồng phục đó ra và mặc một chiếc áo khoác thông thường (`<img>` chuẩn) sẽ giúp bạn tự do điều chỉnh kích thước áo theo ý muốn.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát:** Logo trong các card Preview vẫn bị nhỏ và lọt thỏm cho dù đã crop sát và tỷ lệ ảnh đúng.
- **Khả năng tái hiện:** 100% ở trang Preview Partners trong Admin.
- **Tiêu chí Pass/Fail:**
  - *Pass:* Logo hiển thị to rõ, chạm sát mép padding của card ở layout Badge/Logo Cloud.
  - *Fail:* Logo vẫn nhỏ xíu ở giữa card trắng lớn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Style inline mặc định của Next.js `<Image>` ghi đè class CSS `h-full w-auto` trong Admin Preview.
- **Giải pháp:** Thay thế Next.js `<Image>` bằng thẻ `<img>` chuẩn trong `AdminImage.tsx`.

# IV. Proposal (Đề xuất)

- **Giải pháp kỹ thuật:**
  Cập nhật [AdminImage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/AdminImage.tsx) sử dụng thẻ `<img>` chuẩn của HTML thay vì Next.js `Image`.

# V. Files Impacted (Tệp bị ảnh hưởng)

- `Sửa:` [AdminImage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/AdminImage.tsx)
  - Thay đổi: Thay thế import Next.js `Image` và các thẻ `<Image>` bằng thẻ `<img>` chuẩn của HTML.

# VI. Execution Preview (Xem trước thực thi)

1. Sửa đổi [AdminImage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/AdminImage.tsx).
2. Chạy `bunx tsc --noEmit` để kiểm tra lỗi TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh `bunx tsc --noEmit` trong workspace.

### Manual Verification
- Xem Preview Partners trong Admin, kiểm tra xem các logo đã hiển thị to rõ và vừa khít card hơn chưa.

# VIII. Todo

- [ ] Sửa đổi `AdminImage.tsx` sử dụng thẻ `<img>` chuẩn.
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Giao diện Preview hiển thị logo đối tác to rõ, không bị bóp nghẹt kích thước.
- Build thành công không có lỗi TypeScript.

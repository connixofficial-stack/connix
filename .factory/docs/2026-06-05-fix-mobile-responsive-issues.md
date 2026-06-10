# I. Primer

## 1. TL;DR kiểu Feynman
Khi xem trang web trên điện thoại (mobile):
- **Header (Thanh menu đầu trang):** Đang giống như một chiếc mũ quá to, che mất nhiều phần nội dung quan trọng bên dưới và làm màn hình chật chội. Chúng ta sẽ "thu nhỏ" chiều cao của nó và giới hạn kích thước logo tối đa là 36px trên điện thoại để mọi thứ gọn gàng hơn.
- **Đối tác (Partners):** Các logo đối tác đang bị bóp nhỏ xíu như hạt cát vì khoảng đệm (padding) hai bên quá rộng (những 64px trong một ô nhỏ). Chúng ta sẽ nới rộng không gian bằng cách giảm khoảng đệm này xuống và điều chỉnh hiển thị 2 cột thay vì 3 cột trên màn hình siêu nhỏ để logo hiện rõ hơn.
- **Quy trình làm việc (Process):** Chữ và nút giới thiệu thì lệch về bên trái, còn vòng tròn quy trình thì nằm ngay chính giữa. Nhìn rất lệch lạc. Chúng ta sẽ căn giữa toàn bộ phần chữ và nút này trên điện thoại để tạo sự cân đối, hài hòa.

## 2. Elaboration & Self-Explanation
- **Vấn đề Header (Dark Glass style):** Khi cuộn trang, thanh menu được cố định dạng viên thuốc (Sticky Pill) với chiều cao cố định là 76px trên mobile. Đối với màn hình điện thoại vốn ngắn, 76px cộng với khoảng cách mép trên 16px (tổng cộng 92px) là quá lớn. Ngoài ra, kích thước logo lớn cũng làm căng giãn chiều cao. Giải pháp là giảm chiều cao của Sticky Pill xuống còn 60px trên mobile (70px trên tablet, 88px trên desktop) và áp dụng CSS Variables để kiểm soát kích thước logo tối đa 36px trên mobile mà không gây ra hiện tượng giật giật (Layout Shift) khi tải trang.
- **Vấn đề Partners (Glass Logo Cloud style):** Logo đối tác hiển thị trong một danh sách trượt. Khoảng đệm ngang của mỗi logo hiện tại là `px-8` (tương đương 64px padding tổng cộng). Trên màn hình mobile (rộng khoảng 360px) chia làm 3 cột (mỗi cột ~100px), logo chỉ còn lại vỏn vẹn ~36px không gian để hiển thị hình ảnh. Bằng cách giảm padding ngang xuống `px-3` trên mobile và nâng lên dần ở tablet/desktop (`md:px-6 lg:px-8`), ta sẽ trả lại diện tích hiển thị cho logo ảnh. Đồng thời, cấu hình lại tỷ lệ chia cột (`basis-1/2` cho màn hình siêu nhỏ và `xs:basis-1/3` cho mobile bình thường) sẽ giúp bố cục cân đối hơn.
- **Vấn đề Process (Circular style):** Cấu trúc grid chia làm 2 cột trên desktop (trái là text, phải là vòng tròn). Trên mobile, grid chuyển thành 1 cột xếp chồng. Nhưng do phần text giữ nguyên thuộc tính căn trái (`text-left`) còn vòng tròn căn giữa (`justify-center`), dẫn đến bố cục lệch. Ta sẽ điều chỉnh thuộc tính căn lề thành `text-center lg:text-left` cho phần text và căn giữa nút bấm CTA trên mobile để giải quyết triệt để.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể (Partners):** Hãy tưởng tượng bạn có một chiếc khung ảnh rộng 10cm (chiều rộng cột trên mobile), nhưng bạn lại dùng một cái bo viền giấy rộng tới 3.2cm ở mỗi bên trái và phải (tương đương `px-8` = 32px mỗi bên). Bức ảnh thật của bạn chỉ còn đúng 3.6cm ở giữa để hiển thị. Nếu chúng ta giảm viền giấy xuống còn 1.2cm mỗi bên (`px-3` = 12px), bức ảnh sẽ lập tức rộng ra thành 7.6cm, to rõ gấp đôi mà không cần đổi kích thước khung!
- **Sự tương đồng đời thường (Header):** Giống như việc bạn lái xe ô tô nhưng kính chắn gió phía trước bị dán một tấm decal che nắng quá dày ở phía trên. Tầm nhìn của bạn bị thu hẹp lại và rất khó chịu. Thu nhỏ chiều cao của header cũng giống như việc thu gọn tấm decal đó để trả lại tầm nhìn thoáng đãng cho tài xế.

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã tiến hành kiểm tra cấu trúc dữ liệu và mã nguồn hiện tại trong hệ thống:
1. **Convex Database Settings:**
   - Cấu hình `header_style` hiện tại đang là `"darkglass"`.
   - Cấu hình nền trang chủ `home_page_background` là màu tối `#0d1323`.
2. **Header Component (`components/site/Header.tsx`):**
   - Chứa logic của cả 4 loại style header, file có kích thước lớn (136KB).
   - Chiều cao sticky header cố định cứng `h-[76px]` trên mobile.
   - Logo size được áp dụng trực tiếp qua inline style bằng giá trị pixel tĩnh (`size`) trên mọi thiết bị.
3. **Partners Component (`app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx`):**
   - Logo item dùng class `px-8` cố định cho mọi breakpoint.
   - Tỷ lệ co giãn của carousel items trên mobile đang dùng `basis-1/3` cố định.
4. **Process Component (`app/admin/home-components/process/_components/ProcessSectionShared.tsx`):**
   - Style `circular` render phần text giới thiệu với class `text-left` cố định.
   - Nút bấm CTA trong Process circular được bọc trong `<div className="pt-2">` không có căn chỉnh responsive.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Độ tin cậy nguyên nhân gốc:** High (Độ tin cậy cao).
- **Phân tích nguyên nhân gốc:**
  - **Header:** Do thiết kế CSS chưa tối ưu cho responsive di động đối với Header dạng Dark Glass, sử dụng chiều cao cố định quá lớn (`h-[76px]`) và không có cơ chế giới hạn kích thước logo trên mobile khi người dùng cấu hình logo size lớn trong trang quản trị.
  - **Partners:** Khoảng cách đệm (`px-8` = 64px ngang) quá lớn so với chiều rộng cột của thiết bị di động (thường dưới 120px cho mỗi cột trong bố cục 3 cột), làm bóp nghẹt phần hiển thị thực tế của ảnh logo.
  - **Process:** Thiếu các class responsive của Tailwind CSS (như `text-center lg:text-left` và `justify-center lg:justify-start`) trong phần render văn bản giới thiệu của layout `circular`.

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất thực hiện các thay đổi cụ thể sau để tối ưu hóa responsive di động:

1. **Tối ưu hóa Header (`components/site/Header.tsx`):**
   - Định nghĩa các CSS variables cho logo size responsive:
     - `--logo-wrap-width-desktop`: kích thước logo gốc.
     - `--logo-wrap-width-mobile`: giới hạn tối đa `Math.min(36, logoSize)`.
   - Cập nhật JSX của logo wrap và logo inner để sử dụng class Tailwind: `w-[var(--logo-wrap-width-mobile)] lg:w-[var(--logo-wrap-width-desktop)] h-auto` thay vì gán cứng pixel width qua style.
   - Giảm chiều cao của Sticky Pill Header trên mobile xuống `h-[60px]`, tablet `sm:h-[70px]`, desktop giữ nguyên `lg:h-[88px]`. Giảm padding ngang trên mobile từ `px-6` xuống `px-4`.

2. **Tối ưu hóa Partners Carousel (`app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx`):**
   - Đổi class padding ngang của logo item từ `px-8` thành `px-3 md:px-6 lg:px-8` để giải phóng không gian hiển thị trên mobile.
   - Cập nhật class chia cột di động từ `basis-1/3 pl-4 sm:basis-1/3` thành `basis-1/2 pl-3 xs:basis-1/3 sm:basis-1/3` để hỗ trợ hiển thị đẹp hơn trên các màn hình di động nhỏ.

3. **Căn giữa Process Circular (`app/admin/home-components/process/_components/ProcessSectionShared.tsx`):**
   - Đổi `className="text-left space-y-6"` thành `className="text-center lg:text-left space-y-6"`.
   - Đổi `<div className="pt-2">` bọc nút CTA thành `<div className="pt-2 flex justify-center lg:justify-start">` để căn giữa nút bấm trên di động.

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx)
  - Vai trò hiện tại: Render toàn bộ cấu trúc và logic của thanh Header phía người dùng.
  - Thay đổi: Giảm chiều cao sticky mobile, tích hợp CSS variables để scale logo tự động trên mobile.
- **Sửa:** [PartnersGlassLogoCloudShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx)
  - Vai trò hiện tại: Render danh sách logo đối tác dạng kính mờ (glassmorphism).
  - Thay đổi: Giảm padding ngang của item trên mobile, cấu hình chia cột linh hoạt hơn.
- **Sửa:** [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx)
  - Vai trò hiện tại: Render các kiểu quy trình làm việc (Process) dùng chung cho trang admin và site.
  - Thay đổi: Căn giữa tiêu đề, mô tả và nút CTA của style `circular` trên màn hình di động.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ lại các dòng code cụ thể trong các file bị ảnh hưởng để định vị chính xác vị trí cần sửa.
2. Thực hiện thay đổi file [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Thực hiện thay đổi file [PartnersGlassLogoCloudShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx).
4. Thực hiện thay đổi file [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
5. Thực hiện review tĩnh lại toàn bộ thay đổi, đảm bảo tính null-safety, không bị lỗi cú pháp TypeScript hoặc import lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Chạy lệnh `bunx tsc --noEmit` trên dự án để đảm bảo không phát sinh lỗi kiểu dữ liệu (Type error).
- Người dùng có thể kiểm tra trực tiếp giao diện trên mobile sau khi deploy hoặc chạy local để đối chứng kết quả:
  - Header: Chiều cao gọn gàng, không đè lên icon giỏ hàng/menu. Logo thu nhỏ cân đối.
  - Partners: Logo đối tác to rõ, căn giữa đẹp mắt.
  - Process: Phần giới thiệu quy trình được căn giữa hoàn hảo trên mobile.

# VIII. Todo

- [ ] Sửa đổi layout Header di động và responsive logo size trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx).
- [ ] Tối ưu hóa padding và tỷ lệ cột logo đối tác di động trong [PartnersGlassLogoCloudShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersGlassLogoCloudShared.tsx).
- [ ] Căn giữa phần giới thiệu và nút CTA di động cho quy trình làm việc trong [ProcessSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/process/_components/ProcessSectionShared.tsx).
- [ ] Chạy kiểm tra tĩnh TypeScript compiler.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Chiều cao sticky header trên mobile giảm xuống dưới `65px` (đề xuất `60px`).
- Logo đối tác hiển thị trên màn hình di động có không gian hiển thị rộng hơn 60px (thay vì bị bóp nghẹt còn ~36px như trước).
- Giao diện quy trình làm việc căn giữa toàn bộ (bao gồm tiêu đề, mô tả và nút bấm hành động) khi ở kích thước màn hình di động (dưới breakpoint `lg`).
- Không phát sinh bất kỳ lỗi biên dịch nào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp vì các thay đổi chỉ tập trung vào responsive class CSS của Tailwind CSS và inline style cấu trúc của React.
- Cách hoàn tác: Sử dụng `git checkout` để khôi phục lại trạng thái ban đầu của các file bị sửa đổi.

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi hành vi nghiệp vụ (business logic) của hệ thống đặt hàng, giỏ hàng, menu hoặc quy trình quản trị.
- Không cấu hình thêm style header mới hay đổi style mặc định trong database.

# XII. Phân tích các khoản Nợ kỹ thuật & Thiết kế (Debt Audit Report)

Dựa trên phân tích mã nguồn và hình ảnh thực tế, chúng tôi ghi nhận các vấn đề nợ kỹ thuật sau để hỗ trợ đội ngũ định hướng tái cấu trúc trong tương lai:

## 1. Technical Debt (Nợ kỹ thuật)
- **"God Files" khổng lồ:** File [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) (136KB) và `ComponentRenderer.tsx` (323KB) quá lớn. Điều này vi phạm nguyên tắc Single Responsibility (Đơn nhiệm). Nên chia tách thành các sub-components độc lập theo từng kiểu giao diện để dễ bảo trì và tối ưu tốc độ load JS ban đầu.
- **Tính toán responsive bằng JavaScript:** Một số tính toán menu ẩn/hiện hoặc kích thước đang phụ thuộc vào việc đo đạc client-side (`ResizeObserver`) thay vì sử dụng CSS Media Queries thuần túy, có thể gây ra hiện tượng giật giao diện nhẹ (Layout Shift - CLS) khi vừa tải trang.

## 2. Design Debt (Nợ thiết kế)
- **Thiếu nhất quán trong Spacing Scale:** Khoảng đệm (padding) và khoảng cách (margin) trên mobile chưa được thiết kế đồng bộ với hệ thống. Việc áp dụng cứng nhắc các giá trị padding của desktop (như `px-8` cho logo đối tác) lên màn hình hẹp di động gây vỡ bố cục.
- **Trực tiếp ghi đè inline styles từ database:** Gán các màu sắc và cấu hình trực tiếp vào thuộc tính `style={...}` của React làm giảm khả năng kiểm soát tập trung qua TailwindCSS config hoặc CSS Variables, gây khó khăn cho việc triển khai chế độ Dark/Light Mode tự động.

## 3. UX Debt (Nợ UX)
- **Chiếm dụng màn hình (Obtrusive Sticky UI):** Việc thiết kế sticky header dạng pill lơ lửng quá dày trên mobile chiếm tới 12% - 15% diện tích hiển thị hữu ích, khiến trải nghiệm đọc nội dung của người dùng trở nên ngột ngạt và bí bách.
- **Đứt gãy liên kết thị giác (Visual Disconnect):** Việc kết hợp phần text căn trái với vòng tròn căn giữa trong Process circular trên mobile làm người dùng phải đảo mắt liên tục, làm giảm trải nghiệm liền mạch khi cuộn trang.

## 4. Usability Issues (Vấn đề khả dụng)
- **Mục tiêu chạm quá nhỏ (Touch Target Size):** Các nút bước trong vòng tròn quy trình bị scale xuống `0.52` lần (chỉ còn khoảng ~57px đường kính bao gồm cả viền) và xếp quá sát nhau, vi phạm tiêu chuẩn WCAG 2.2 AA (khuyến nghị vùng chạm tối thiểu 44x44px và có khoảng cách an toàn), dẫn đến việc người dùng dễ bấm nhầm (Fat-finger).
- **Tranh chấp cử chỉ cuộn (Gesture Conflict):** Việc đặt carousel đối tác tự động trượt (Embla carousel) trên mobile có thể gây xung đột với hành động vuốt cuộn dọc trang của người dùng, tạo cảm giác giật lag nhẹ khi lướt qua khu vực này.

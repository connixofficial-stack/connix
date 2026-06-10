# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Khi cấu hình Footer trong trang admin (đường dẫn `/admin/home-components/footer/[id]/edit`), danh sách các nền tảng mạng xã hội và kênh liên hệ có thể lựa chọn (Facebook, Instagram, v.v.) bị thiếu nhiều tùy chọn so với nút hành động nổi (Speed Dial) như Shopee, Lazada, Tiki, Telegram, Messenger hay số điện thoại, email, địa chỉ.
- **Tại sao xảy ra**: File code định nghĩa danh sách mạng xã hội của Footer (`FooterForm.tsx`) chỉ khai báo cứng 7 mạng xã hội cơ bản, trong khi Speed Dial (`SpeedDialForm.tsx`) hỗ trợ tới 19 platform phong phú hơn. Việc load dữ liệu từ Settings hệ thống của Footer cũng thiếu các key liên hệ và Messenger. Bản preview (`FooterPreview.tsx`) và site thực (`DynamicFooter.tsx`) cũng không render được các icon mở rộng này.
- **Giải pháp**:
  - Mở rộng danh sách `SOCIAL_PLATFORMS` trong `FooterForm.tsx` tương tự như Speed Dial.
  - Cập nhật hàm `loadFromSettings` của Footer để load cả số điện thoại, email, địa chỉ, Messenger từ Settings hệ thống.
  - Export hàm `getIconNode` từ `SpeedDialSectionShared.tsx` để dùng chung cho cả trang thực (`DynamicFooter.tsx`) và trang xem trước (`FooterPreview.tsx`), tránh trùng lặp code và đảm bảo hiển thị đồng nhất tất cả MXH/kênh bán hàng.

## 2. Elaboration & Self-Explanation
Hiện tại trong hệ thống có hai thành phần chính hiển thị thông tin mạng xã hội và liên hệ của shop:
1. **Footer (Chân trang)**: Nằm cố định ở cuối mỗi trang.
2. **Speed Dial (Nút hành động nhanh)**: Nút nổi tròn ở góc màn hình.

Khi quản trị viên vào trang chỉnh sửa Footer, hệ thống chỉ cho phép cấu hình 7 nền tảng: Facebook, Instagram, Youtube, TikTok, Zalo, X, Pinterest. Trong khi đó, nút Speed Dial lại hỗ trợ rất nhiều nền tảng mua sắm (Shopee, Lazada, Tiki) và liên hệ khác (Phone, Email, Địa chỉ, Messenger, Telegram). Việc này gây ra sự bất nhất về mặt trải nghiệm và tính năng, khiến quản trị viên không thể đồng bộ thông tin liên hệ chân trang với nút liên hệ nổi.

Để khắc phục, chúng ta đồng bộ danh sách nền tảng hỗ trợ từ Speed Dial sang Footer. Để tối ưu hóa code và tránh định nghĩa lại hàng chục SVG icon thủ công, chúng ta export hàm `getIconNode` có sẵn của Speed Dial sang dùng chung cho Footer. Cả trang hiển thị Footer thực tế ngoài Client (`DynamicFooter.tsx`) và trang xem trước của quản trị viên (`FooterPreview.tsx`) đều gọi qua hàm dùng chung này.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Shop có link Shopee là `https://shopee.vn/thanshoes`. Khi chỉnh sửa Footer, admin chọn "Shopee", điền link và lưu lại. Tại khung "Preview Footer" bên trên, biểu tượng Shopee màu cam hiện lên ngay lập tức. Ngoài trang chủ thực tế của khách hàng, biểu tượng Shopee này cũng hiển thị chuẩn xác nhờ sử dụng chung hàm render icon.
- **Analogy (Ẩn dụ đời thường)**: Thay vì mỗi nhân viên trong tiệm (trang preview, trang thực tế) phải tự vẽ lại một logo biển hiệu Shopee bằng tay (vừa tốn công vừa lệch màu), tiệm thiết kế một khuôn in logo bằng gỗ dùng chung (`getIconNode`). Bất cứ khi nào cần vẽ logo trên biển quảng cáo ngoài cửa hay trên tập giấy nháp trong phòng, nhân viên chỉ việc lấy khuôn in đó đập vào là xong, đảm bảo 100% giống nhau.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file định nghĩa Admin Form của Footer tại `app/admin/home-components/footer/_components/FooterForm.tsx`.
- Đã đối chiếu với file định nghĩa Admin Form của Speed Dial tại `app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx`.
- Đã xác nhận các key cấu hình settings của hệ thống trong `convex/seeders/settings.seeder.ts` bao gồm cả `contact_phone`, `contact_email`, `contact_address`, `contact_messenger`.
- Đã kiểm tra file hiển thị Footer thực tế ngoài client tại `components/site/DynamicFooter.tsx` và phát hiện thiếu các cases render biểu tượng cho các platform mới.
- Đã kiểm tra file `FooterPreview.tsx` và phát hiện lỗi không hiển thị đúng icon (bị fallback về Globe) do thiếu code render.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**: Mảng tĩnh `SOCIAL_PLATFORMS` trong `FooterForm.tsx` chỉ chứa 7 phần tử. Đồng thời, hàm `loadFromSettings` chỉ truy vấn và map các keys mạng xã hội cơ bản, bỏ qua các keys liên hệ (`contact_phone`, `contact_email`, `contact_address`, `contact_messenger`). Thành phần client `DynamicFooter.tsx` và preview `FooterPreview.tsx` cũng chưa có logic xử lý ảnh/icon cho các nền tảng mở rộng này do code render icon bị trùng lặp và thiếu.
- **Root Cause Confidence**: High (Độ tin cậy cao). Việc bổ dung đầy đủ khai báo mảng tĩnh, logic load settings và chia sẻ hàm render icon `getIconNode` của Speed Dial cho cả Client và Preview sẽ giải quyết triệt để vấn đề này mà không gây trùng lặp code (DRY).

# IV. Proposal (Đề xuất)
1. **Admin Form (`FooterForm.tsx`)**:
   - Khai báo thêm các platform trong mảng `SOCIAL_PLATFORMS`: `messenger`, `telegram`, `shopee`, `lazada`, `tiki`, `linkedin`, `github`, `phone`, `mail`, `map-pin`.
   - Bổ sung helper `normalizePhoneUrl`, `normalizeEmailUrl`, `normalizeMapUrl` để đồng bộ định dạng link liên hệ giống Speed Dial.
   - Cập nhật `footerSettings` query để lấy thêm các settings liên hệ từ database.
   - Nâng cấp `loadFromSettings` để tự động load và đồng hóa các thông tin liên hệ này vào danh sách mạng xã hội của Footer.
   - Thêm helper `getSocialPlaceholder(platform)` để gợi ý định dạng nhập link phù hợp với từng nền tảng.
2. **Speed Dial Shared Component (`SpeedDialSectionShared.tsx`)**:
   - Export hàm `getIconNode(name, size)` làm API dùng chung.
3. **Client Render (`DynamicFooter.tsx`) & Preview Render (`FooterPreview.tsx`)**:
   - Loại bỏ các khai báo SVG icons tự định nghĩa trùng lặp.
   - Import `getIconNode` từ `@/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared`.
   - Cập nhật `SocialIcon` để gọi trực tiếp `getIconNode`.
   - Cập nhật mảng màu gốc `SOCIAL_ORIGINAL_COLORS` cho các platform mới để hiển thị đúng màu thương hiệu khi bật chế độ "Dùng màu icon gốc".

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [FooterForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/footer/_components/FooterForm.tsx)
  - *Vai trò hiện tại*: Form quản trị cấu hình Footer.
  - *Thay đổi*: Mở rộng danh sách MXH, cập nhật query & logic load settings, thêm helper định dạng và gợi ý placeholder.
- **Sửa**: [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx)
  - *Vai trò hiện tại*: Component chứa logic hiển thị Speed Dial dùng chung.
  - *Thay đổi*: Export hàm `getIconNode` làm thư viện dùng chung.
- **Sửa**: [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/DynamicFooter.tsx)
  - *Vai trò hiện tại*: Thành phần hiển thị chân trang ngoài Client.
  - *Thay đổi*: Import `getIconNode` từ speed-dial, loại bỏ SVG dư thừa, cập nhật switch-case render icon.
- **Sửa**: [FooterPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/footer/_components/FooterPreview.tsx)
  - *Vai trò hiện tại*: Khung hiển thị xem trước Footer trong admin.
  - *Thay đổi*: Import `getIconNode` từ speed-dial, loại bỏ SVG dư thừa, đồng bộ `SOCIAL_ORIGINAL_COLORS`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và lưu trữ chi tiết các dòng code của các file liên quan.
2. Thực hiện cập nhật logic Admin Form và export hàm Speed Dial.
3. Đồng hóa logic hiển thị cho Client và Preview bằng cách dùng chung hàm render.
4. Kiểm tra biên dịch tĩnh (`bunx tsc --noEmit`).
5. commit thay đổi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Automated Tests / Static Code Analysis**:
  - Chạy TypeScript compiler kiểm tra không có lỗi cú pháp hoặc import sai.
- **Manual Verification (Kiểm chứng thủ công)**:
  - Khởi động ứng dụng, truy cập trang chỉnh sửa Footer, xác nhận dropdown mạng xã hội có đầy đủ các lựa chọn (Shopee, Lazada, Tiki, Phone, Mail, v.v.).
  - Bấm nút "Load từ Settings", xác nhận các link liên hệ tự động được điền và chuẩn hóa đúng.
  - Kiểm tra xem trước biểu tượng trên khung "Preview Footer" và ngoài trang chủ Client thực tế để xác nhận hiển thị chính xác logo thương hiệu màu cam/xanh của Shopee/Lazada/Tiki/Messenger.

# VIII. Todo
- [x] Cập nhật [FooterForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/footer/_components/FooterForm.tsx) để mở rộng platform MXH và cải thiện logic load từ settings.
- [x] Cập nhật [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/DynamicFooter.tsx) để hỗ trợ render tất cả icon MXH mới qua getIconNode.
- [x] Export `getIconNode` từ [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx).
- [x] Cập nhật [FooterPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/footer/_components/FooterPreview.tsx) dùng chung `getIconNode`.
- [x] Thực hiện static review và typecheck dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Dropdown lựa chọn mạng xã hội trong trình chỉnh sửa Footer hiển thị đầy đủ các tùy chọn như Speed Dial.
- Nút "Load từ Settings" của Footer tự động lấy và định dạng đúng các thông tin từ Settings hệ thống bao gồm: Điện thoại, Email, Địa chỉ, Messenger và Zalo.
- Footer hiển thị ngoài trang chủ (Client) và trên khung xem trước (Preview) render đầy đủ các icon/logo chính xác tương ứng với liên kết mạng xã hội được thêm.
- Dự án biên dịch không phát sinh lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi hiển thị biểu tượng nếu file ảnh logo Lazada/Tiki không tồn tại trên máy chủ.
- **Cách giảm thiểu**: Kiểm tra đường dẫn ảnh `/icons/lazada-logo.png` and `/icons/tiki-logo.png`. Nếu chưa có, đảm bảo fallback an toàn sang biểu tượng `Globe` mặc định để tránh lỗi vỡ layout.
- **Rollback**: Sử dụng `git checkout` để khôi phục trạng thái ban đầu của các file bị ảnh hưởng.

# XI. Out of Scope (Ngoài phạm vi)
- Việc thay đổi giao diện hoặc cấu hình tính năng của nút nổi Speed Dial.
- Việc can thiệp trực tiếp thay đổi cơ sở dữ liệu (schema) Convex.

# Spec: Đồng bộ tích hợp Chatbot với Speed Dial & Nâng cấp Icon Chatbot Premium

# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề 1:** Khi bật Chatbot ở trang tích hợp, nó tự động hiển thị một bong bóng chat (Speed Dial giả lập) dưới client mà không cần cấu hình trong quản trị Speed Dial. Ta cần sửa lại để chatbot chỉ hiện khi người dùng thực sự thêm và bật nút "Chat AI" trong phần quản lý Speed Dial ở Admin.
- **Vấn đề 2:** Icon của "Chat AI" hiện tại là hình tin nhắn tròn (`message-circle`) đơn điệu và không mang dáng vẻ AI. Ta cần thay bằng một icon vẽ SVG tùy chỉnh đẹp mắt: sự kết hợp giữa bong bóng chat mềm mại và các ngôi sao lấp lánh (Sparkles) mang đậm phong cách Gemini AI hiện đại, kèm màu tím Violet đầy tính công nghệ.

## 2. Elaboration & Self-Explanation
Hiện tại, hệ thống đang có sự chồng chéo khi tích hợp Chatbot và Speed Dial. Khi admin bật Chatbot AI tại trang tích hợp hệ thống, client sẽ tự động chèn một nút Speed Dial chứa Chatbot nếu trên trang không có Speed Dial nào được kích hoạt. Nếu có Speed Dial, hệ thống lại tự động chèn thêm nút Chatbot vào cuối danh sách hành động của Speed Dial đó. Điều này làm mất đi tính chủ động kiểm soát giao diện của admin.
Giải pháp là loại bỏ cơ chế tự động chèn (auto-inject). Chatbot sẽ chỉ hiển thị khi admin cấu hình rõ ràng nút "Chat AI" trong trang quản trị Speed Dial. Đồng thời, nếu Chatbot AI bị tắt ở phần tích hợp hệ thống, nút "Chat AI" trong Speed Dial cũng sẽ tự động được ẩn đi ở client để tránh lỗi khi người dùng click vào.
Về phần giao diện, icon tin nhắn tròn mặc định trông rất "lỏ" và dễ nhầm với các kênh liên hệ truyền thống. Bằng cách thiết kế lại SVG hiển thị, kết hợp bong bóng chat với biểu tượng lấp lánh (Sparkles) của Gemini, nút Chat AI sẽ trông hiện đại, cao cấp và chuyên nghiệp hơn rất nhiều.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** 
  - Trước đây: Admin bật chatbot ở trang `system/integrations` -> trang chủ tự hiện một nút Speed Dial màu xanh chứa chatbot dù admin chưa hề tạo Speed Dial nào.
  - Sau khi sửa: Admin bật chatbot ở `system/integrations` -> trang chủ vẫn không có gì thay đổi. Admin vào trang quản lý Speed Dial, thêm hành động "Chat AI" vào Speed Dial hiện tại và lưu lại -> trang chủ xuất hiện Speed Dial có nút Chat AI với icon lấp lánh cao cấp. Nếu admin tắt chatbot ở `system/integrations`, nút Chat AI đó tự động biến mất khỏi Speed Dial.
- **Analogy đời thường:** Việc tự động hiện nút chatbot giống như việc một nhà hàng tự ý mang món tráng miệng ra bàn khi khách chưa gọi, chỉ vì trong bếp đang sẵn nguyên liệu. Việc sửa lại tương đương với việc đưa món tráng miệng vào thực đơn (Speed Dial), khách muốn ăn thì tự chọn gọi món, và nếu nhà bếp hết nguyên liệu (tắt chatbot) thì món đó sẽ tạm thời gạch khỏi thực đơn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra `components/site/SiteShell.tsx`: Chứa cả `<GlobalSpeedDial />` và `<AiChatbotWidget />`.
- Đã kiểm tra `components/site/GlobalSpeedDial.tsx`: Chèn tự động `CHATBOT_ACTION` qua hàm `withChatbotAction` và tự sinh ra Speed Dial giả lập nếu `speedDialComponent` null nhưng chatbot bật.
- Đã kiểm tra `app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx`: Icon `message-circle` có nhãn mặc định là "Chat AI", màu thương hiệu `#3b82f6` (xanh dương).
- Đã kiểm tra `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`: Render icon `message-circle` bằng Lucide `MessageCircle`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc 1:** Logic của `GlobalSpeedDial.tsx` tự động chèn hành động chatbot và tự tạo cấu hình Speed Dial giả lập khi không có component Speed Dial nào được lưu từ Admin.
- **Nguyên nhân gốc 2:** Icon của Chat AI đang map trực tiếp với icon tin nhắn mặc định `message-circle` của Lucide, thiếu đi bản sắc công nghệ của AI và màu sắc chưa đủ ấn tượng.

# IV. Proposal (Đề xuất)
1. **Lược bỏ auto-inject trong `GlobalSpeedDial.tsx`:**
   - Xóa hàm `withChatbotAction`.
   - Lọc bỏ hành động có URL `#ai-chatbot` ra khỏi cấu hình Speed Dial nếu Chatbot bị tắt ở Integrations.
   - Nếu không có `speedDialComponent` được lưu và active từ Admin, trả về `null` (không tự tạo Speed Dial giả lập nữa).
2. **Nâng cấp Icon Chat AI:**
   - Tạo SVG `AiChatIcon` custom: Bong bóng chat tinh tế kết hợp các ngôi sao lấp lánh (Sparkles) ở góc trên bên phải.
   - Thay đổi màu sắc mặc định của Chat AI trong `ICON_DEFS` sang màu Violet công nghệ `#8b5cf6`.
   - Cập nhật hàm `renderIcon` trong `SpeedDialForm.tsx` và `getIconNode` trong `SpeedDialSectionShared.tsx` để render SVG `AiChatIcon` mới này khi gặp key `message-circle`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [GlobalSpeedDial.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/components/site/GlobalSpeedDial.tsx)
  - Loại bỏ logic tự động chèn chatbot action và tự tạo Speed Dial giả lập.
  - Thêm logic lọc bỏ hành động chatbot nếu chatbot ở Integrations bị tắt.
- **Sửa:** [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx)
  - Thêm component SVG `AiChatIcon` custom.
  - Cập nhật `getIconNode` để trả về `AiChatIcon` khi icon là `message-circle`.
- **Sửa:** [SpeedDialForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx)
  - Thêm component SVG `AiChatIcon` custom.
  - Cập nhật `ICON_DEFS` đổi màu thương hiệu của `message-circle` thành `#8b5cf6`.
  - Cập nhật `renderIcon` để trả về `AiChatIcon` khi icon là `message-circle`.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `GlobalSpeedDial.tsx` để tối giản hóa logic tích hợp chatbot.
2. Định nghĩa SVG `AiChatIcon` mới và tích hợp vào `SpeedDialSectionShared.tsx`.
3. Tích hợp SVG `AiChatIcon` mới và cập nhật màu sắc thương hiệu của Chat AI trong `SpeedDialForm.tsx`.
4. Rà soát các lỗi kiểu dữ liệu (nếu có) thông qua kiểm tra tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không phát sinh lỗi biên dịch TypeScript.

### Manual Verification
- Truy cập trang Admin Home Components -> Speed Dial. Kiểm tra icon "Chat AI" trong danh sách picker và màu sắc mặc định của nó đã chuyển sang màu tím ánh xanh công nghệ.
- Bật/tắt Chatbot ở Integrations và kiểm tra nút Chat AI trên site có xuất hiện/biến mất tương ứng hay không (khi Speed Dial được cấu hình).
- Đảm bảo khi tắt Speed Dial hoàn toàn trong Admin, client không tự động tạo ra Speed Dial giả lập nào.

# VIII. Todo
- [ ] Cập nhật file `components/site/GlobalSpeedDial.tsx` để chỉnh sửa luồng hiển thị.
- [ ] Sửa file `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx` để nâng cấp icon.
- [ ] Sửa file `app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx` để đồng bộ icon picker và màu sắc.
- [ ] Xác nhận biên dịch TypeScript thành công.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi chatbot tắt ở Integrations, nút "Chat AI" trong Speed Dial ở client sẽ tự động ẩn đi.
- Khi không cấu hình Speed Dial ở Admin, client không hiển thị bất kỳ Speed Dial hay nút chatbot nổi nào.
- Icon của hành động "Chat AI" trên Speed Dial client và trong Admin Form được thay đổi từ icon tin nhắn đơn giản thành icon robot/lấp lánh custom kèm màu tím đặc trưng của AI.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một số Speed Dial cũ của người dùng đang dùng `message-circle` cho mục đích khác ngoài Chat AI sẽ bị chuyển thành icon AI Chat. Tuy nhiên, xem xét cấu hình `ICON_DEFS` hiện tại, `message-circle` được gán cứng duy nhất cho "Chat AI", nên rủi ro này là bằng không.
- **Hoàn tác:** Khôi phục các file về phiên bản commit trước đó thông qua Git.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa logic xử lý tin nhắn hay kết nối API của Chatbot trong `app/api/ai-chat/route.ts` hay `convex/aiChat.ts`.
- Không thay đổi thiết kế của khung chat window `AiChatbotWidget`.

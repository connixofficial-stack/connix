# Spec: Tích hợp Provider J2TEAM ChatJPT Free cho Chatbot AI

# I. Primer

## 1. TL;DR kiểu Feynman
- **Mục tiêu:** Thay vì bắt buộc dùng Google AI Studio (Gemini) cần API key phức tạp, ta tích hợp thêm provider J2TEAM ChatJPT (miễn phí, không cần tài khoản, không cần API key) để tiện lợi hơn khi tích hợp chatbot.
- **Cách làm:**
  1. Mở rộng cấu hình AI ở backend hỗ trợ cả hai nhà cung cấp: `"gemini"` và `"chatjpt"`.
  2. Sửa frontend quản trị Integrations hỗ trợ chọn Provider và tự động thay đổi danh sách Model tương ứng. Nếu chọn ChatJPT, ẩn hoặc không bắt buộc nhập API key.
  3. Sửa Convex action gọi API J2TEAM ChatJPT (`https://chatjpt.rina.work/api/chat`) khi người dùng chọn provider ChatJPT.

## 2. Elaboration & Self-Explanation
J2TEAM ChatJPT là một giao diện AI chat trung gian cung cấp các model open-source và cả các model thương mại lớn hoàn toàn miễn phí. Việc tích hợp ChatJPT giúp chủ sở hữu trang web kích hoạt chatbot ngay lập tức mà không cần đăng ký Google AI Studio để lấy API key.
Chúng ta sẽ bổ sung trường cấu hình `ai_provider` vào bảng settings (nếu chưa có thì mặc định là `"gemini"`). 
Khi gọi API chat, Convex action `sendMessage` sẽ kiểm tra nhà cung cấp hiện tại. Nếu là `"chatjpt"`, Convex sẽ đóng gói system prompt cùng dữ liệu site liên quan và gửi tới endpoint `https://chatjpt.rina.work/api/chat`.
Tại frontend quản trị Integrations, giao diện sẽ có dropdown chọn giữa "Gemini Free" và "ChatJPT Free". Danh sách model sẽ thay đổi tương ứng (Gemini dùng các model `gemini-*`, ChatJPT dùng danh sách model `@cf/*` của Cloudflare/OpenAI/Mistral).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:**
  - Admin vào `system/integrations` -> AI Chatbot.
  - Chọn Provider: "ChatJPT Free". Dropdown Model hiển thị danh sách các model như `GPT-OSS 120B`, `Llama 3.3 70B FP8 Fast`, `DeepSeek R1 Distill Qwen 32B`.
  - Ô nhập API key hiển thị "Không cần thiết cho provider ChatJPT".
  - Admin bấm lưu cấu hình và test chatbot. Chatbot hoạt động ngay lập tức qua API của ChatJPT mà không cần điền API key.
- **Analogy đời thường:** Việc này giống như việc nâng cấp hệ thống tưới nước tự động của sân vườn. Trước đây vườn chỉ chạy bằng nước máy (Gemini) và bạn phải trả tiền nước (API key). Bây giờ, ta tích hợp thêm hệ thống lọc nước mưa tự nhiên (ChatJPT) miễn phí để bạn dùng thay thế, giúp tiết kiệm chi phí và cài đặt dễ dàng hơn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra `convex/aiChat.ts`: Xử lý logic gọi API Gemini trong `generateGeminiAnswer`.
- Đã kiểm tra `convex/systemIntegrations.ts`: Định nghĩa schema cấu hình AI và API lưu cấu hình.
- Đã kiểm tra `app/system/integrations/page.tsx`: Giao diện cấu hình AI Tab.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Hệ thống hiện tại chỉ được thiết kế cứng (hardcode) cho một nhà cung cấp duy nhất là Gemini (mã hóa cứng `AI_PROVIDER = "gemini"`). Ta cần chuyển đổi cấu trúc sang dynamic để hỗ trợ đa nhà cung cấp.

# IV. Proposal (Đề xuất)
1. **Mở rộng schema trong `convex/systemIntegrations.ts`:**
   - Thay đổi `provider` validator từ `v.literal("gemini")` thành `v.union(v.literal("gemini"), v.literal("chatjpt"))`.
   - Cập nhật hàm `normalizeConfig` để đọc `ai_provider` từ settings.
   - Cho phép `enabled` trả về true cho `"chatjpt"` mà không cần API key.
2. **Cập nhật Convex action `convex/aiChat.ts`:**
   - Cập nhật validator và helper functions.
   - Thêm hàm `generateChatjptAnswer` để gửi request đến `https://chatjpt.rina.work/api/chat` và parse dữ liệu JSON/Stream trả về.
   - Nhánh điều kiện trong `sendMessage` để gọi provider tương ứng.
3. **Cập nhật trang cấu hình `app/system/integrations/page.tsx`:**
   - Thêm dropdown select "Provider" có 2 lựa chọn: "Gemini Free" và "ChatJPT Free".
   - Tự động thay đổi danh sách Model theo Provider.
   - Ẩn/hiển thị trường nhập API Key hoặc đổi nhãn phù hợp nếu chọn ChatJPT.
   - Cập nhật payload gửi lên `saveAiConfig` với `provider` tương ứng.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [systemIntegrations.ts](file:///e:/NextJS/job/job_from_system_vietadmin/connix/convex/systemIntegrations.ts)
  - Mở rộng schema validator hỗ trợ `"chatjpt"`.
  - Cập nhật logic `getAiConfig` và `getPublicAiConfig`.
- **Sửa:** [aiChat.ts](file:///e:/NextJS/job/job_from_system_vietadmin/connix/convex/aiChat.ts)
  - Cập nhật `getRuntimeConfig` và `sendMessage` validator.
  - Thêm logic gọi API ChatJPT và parse response.
- **Sửa:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/system/integrations/page.tsx)
  - Cập nhật interface `AiForm` hỗ trợ `provider` động.
  - Cập nhật giao diện form cấu hình AI, dropdown Provider và Model.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa file `convex/systemIntegrations.ts` để cập nhật schema & query.
2. Sửa file `convex/aiChat.ts` để tích hợp API chat của ChatJPT.
3. Sửa file `app/system/integrations/page.tsx` để đổi mới giao diện admin chọn provider.
4. Chạy `bunx tsc --noEmit` kiểm tra tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo không lỗi kiểu TypeScript.

### Manual Verification
- Vào tab AI Chatbot trên trang tích hợp hệ thống.
- Chọn Provider là ChatJPT Free. Đảm bảo danh sách Model đổi sang các model ChatJPT.
- Bấm lưu (không cần nhập API key) -> Thử gửi tin nhắn test. Đảm bảo AI phản hồi thành công từ model ChatJPT đã chọn.

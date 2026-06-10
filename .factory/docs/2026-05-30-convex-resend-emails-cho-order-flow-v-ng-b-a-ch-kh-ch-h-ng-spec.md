# I. Primer

## 1. TL;DR kiểu Feynman

- **Email Service mỏng:** Tạo ra một bộ điều phối email duy nhất trong Convex. Code tạo đơn hay cập nhật trạng thái chỉ cần gọi `sendOrderEmail(...)`, còn việc gửi qua SMTP hay Resend sẽ do dịch vụ này tự động quyết định dựa trên cấu hình.
- **Quản lý nhiều tài khoản Resend:** Trong trang `/system/integrations`, dev có thể cấu hình một danh sách các tài khoản Resend. Khi gửi, hệ thống sẽ chọn tài khoản còn quota (giới hạn ngày/tháng) để gửi, tránh lỗi vượt ngưỡng của gói miễn phí.
- **Giao tiếp an toàn trang Thank-you:** Sửa đổi để không truyền `passwordHash` ra frontend. Thay vào đó, dùng một query an toàn `getCustomerClaimStateByOrder` để kiểm tra xem khách vãng lai đã kích hoạt tài khoản chưa và hiển thị hướng dẫn tương ứng.
- **Hủy đơn an toàn:** Thay thế việc gọi trực tiếp `api.orders.cancel` từ client bằng mutation `cancelOwnOrder` có kiểm tra quyền sở hữu (ownership) của khách hàng qua session token và kiểm tra quyền hủy đơn theo trạng thái cấu hình.
- **Đồng bộ địa chỉ:** Cập nhật schema của khách hàng để lưu địa chỉ cấu trúc (Tỉnh, Quận, Phường, Chi tiết) giống như Checkout. Cập nhật trang sửa khách hàng của admin để dùng chung kiểu UI chọn địa chỉ này.

## 2. Elaboration & Self-Explanation

Hiện tại, hệ thống gửi email OTP đang sử dụng SMTP (N nodemailer) cấu hình trực tiếp từ database. Đối với luồng đơn hàng, chúng ta cần một giải pháp gửi email chuyên nghiệp hơn như Resend để đảm bảo tỷ lệ vào inbox cao và có khả năng retry, giới hạn băng thông.

Tuy nhiên, gói Resend miễn phí có giới hạn khắt khe (100 email/ngày, 3000 email/tháng). Để giải quyết bài toán này mà không phát sinh chi phí lớn, hệ thống sẽ cho phép cấu hình **nhiều tài khoản Resend** và tự động điều phối tải (routing) dựa trên lịch sử gửi thực tế được ghi nhận trong database.

Ngoài ra, còn một số nợ kỹ thuật cần giải quyết để đảm bảo tính nhất quán dữ liệu và bảo mật:
- Địa chỉ của khách hàng khi checkout là địa chỉ có cấu trúc 2 cấp/3 cấp (được ghép lại thành chuỗi string) nhưng trong trang sửa khách hàng của admin lại chỉ là một ô nhập text tự do. Điều này dễ dẫn đến lệch dữ liệu khi đồng bộ lại thông tin.
- Luồng hủy đơn ở client gọi trực tiếp mutation hủy mà không xác thực xem đơn đó có phải của tài khoản đang đăng nhập hay không, tạo ra lỗ hổng bảo mật nghiêm trọng.
- Trang Thank-you đang lấy `passwordHash` của khách hàng từ query public để kiểm tra xem tài khoản đã được claim chưa. Cần che giấu thông tin này và chỉ trả về trạng thái boolean đơn giản.

## 3. Concrete Examples & Analogies

- **Ví dụ điều phối email:** Giả sử cửa hàng cấu hình 2 tài khoản Resend: Tài khoản A (100 email/ngày) và Tài khoản B (100 email/ngày). Hôm nay, hệ thống đã gửi 100 email qua tài khoản A. Khi có đơn hàng thứ 101, hệ thống kiểm tra thấy tài khoản A đã hết quota, nên tự động chuyển qua tài khoản B để gửi. Nếu cả hai tài khoản đều hết quota, hệ thống sẽ không làm gián đoạn việc đặt hàng của khách mà chỉ ghi log email ở trạng thái `skipped_quota_exhausted` và bắn thông báo nội bộ cho admin biết để cấu hình thêm tài khoản hoặc nâng cấp gói.
- **Ví dụ địa chỉ đồng bộ:** Nếu cấu hình địa chỉ của cửa hàng là 3 cấp (Tỉnh -> Quận -> Phường), khi admin vào sửa thông tin khách hàng, thay vì gõ tay "123 Nguyễn Trãi, Thanh Xuân, Hà Nội" vào một ô duy nhất, hệ thống sẽ hiển thị 3 hộp chọn Tỉnh (Hà Nội), Quận (Thanh Xuân), Phường (Thượng Đình) và một ô nhập số nhà để đảm bảo thông tin chuẩn hóa 100% với checkout.
- **Analogy:** Hệ thống email giống như một bưu tá có nhiều túi tiền lẻ để trả phí gửi thư. Mỗi túi tiền chỉ có giới hạn chi tiêu trong ngày. Khi gửi một lá thư, bưu tá sẽ xem túi nào còn tiền để trả phí. Nếu tất cả các túi đều hết tiền, bưu tá sẽ xếp thư vào giỏ "chờ xử lý" và báo cho chủ nhà biết, chứ không vứt đơn hàng của khách đi.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Documentation evidence

- Convex Resend Component chính thức (`@convex-dev/resend`): Hỗ trợ gửi email hàng đợi qua `sendEmail`.
- Quota gói miễn phí của Resend: 100 email/ngày, 3000 email/tháng. Giới hạn tốc độ là 5 requests/giây cho mỗi team.
- Cách cài đặt: `npm install @convex-dev/resend`, thêm `app.use(resend)` trong `convex/convex.config.ts`.

## 2. Repo evidence

- `convex/email.ts` hiện tại chỉ có `sendOtpEmail` gọi trực tiếp `nodemailer` thông qua các cấu hình SMTP từ DB.
- Bảng `customers` trong `convex/schema.ts` chỉ có `address` và `city` dạng string đơn giản, thiếu các trường mã tỉnh/quận/phường cấu trúc.
- `app/(site)/checkout/page.tsx` ghép địa chỉ cấu trúc thành chuỗi `resolvedAddress` rồi truyền vào `placeOrder` làm `shippingAddress`.
- `app/(site)/checkout/thank-you/page.tsx` query `api.customers.getById` để lấy `passwordHash` của khách hàng nhằm kiểm tra xem tài khoản đã được claim chưa.
- `app/(site)/account/orders/page.tsx` gọi trực tiếp mutation `api.orders.cancel` chỉ bằng `orderId` mà không xác thực token của khách hàng.
- `convex/orders.ts` có mutation `cancel` cho admin và `cancelByCustomer` dùng SĐT (không dùng session token để kiểm tra ownership).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High (Cao).** 
- Chưa có email service điều hướng trong Convex dẫn đến việc gửi email phụ thuộc hoàn toàn vào SMTP.
- Chưa lưu thông tin địa chỉ cấu trúc của khách hàng khiến dữ liệu bị lệch khi đồng bộ từ checkout sang profile/admin edit.
- Thiếu các query/mutation an toàn cho khách hàng dẫn đến việc expose `passwordHash` ra client và lỗ hổng bảo mật khi hủy đơn hàng.

## 2. Counter-Hypothesis

- **Giả thuyết đối chứng 1:** *"Chỉ cần gọi trực tiếp API Resend trong mutation đặt hàng."* -> Không được, vì mutation trong Convex không được phép thực hiện gọi mạng (network call) trực tiếp (phải là action). Hơn nữa, nếu API Resend chậm hoặc lỗi sẽ làm rollback toàn bộ giao dịch đặt hàng, gây trải nghiệm tệ cho khách hàng. Việc gửi email phải được tách thành action chạy bất đồng bộ (async).
- **Giả thuyết đối chứng 2:** *"Không cần lưu địa chỉ cấu trúc cho khách hàng, chỉ cần so sánh chuỗi string địa chỉ."* -> Không khả thi vì định dạng chuỗi do con người gõ rất đa dạng (ví dụ: "Q.Thanh Xuân" và "Quận Thanh Xuân"). Chuỗi không thể parse ngược lại thành các cấp hành chính một cách chính xác để hiển thị lại trên các combobox.

# IV. Proposal (Đề xuất)

## 1. Convex Resend Component & Email Router

### a) Thêm bảng cấu hình và log vào `convex/schema.ts`
- Thêm bảng `emailProviderUsageDaily`:
  - `accountId`: string
  - `dateKey`: string (định dạng "YYYY-MM-DD")
  - `recipientCount`: number
  - index `by_account_date` trên `["accountId", "dateKey"]`
- Thêm bảng `emailProviderUsageMonthly`:
  - `accountId`: string
  - `monthKey`: string (định dạng "YYYY-MM")
  - `recipientCount`: number
  - index `by_account_month` trên `["accountId", "monthKey"]`
- Thêm bảng `emailDispatchLogs`:
  - `eventType`: string ("order_placed" | "order_delivered" | "order_cancelled" | "otp")
  - `orderId`: optional id("orders")
  - `recipient`: string
  - `provider`: string ("smtp" | "resend")
  - `accountId`: string (id của Resend account hoặc "smtp")
  - `status`: string ("pending" | "success" | "failed" | "skipped_quota_exhausted")
  - `emailId`: optional string
  - `idempotencyKey`: optional string
  - `createdAt`: number
  - index `by_idempotencyKey` trên `["idempotencyKey"]`

### b) Mở rộng Settings
Thêm các key settings mới vào group `mail`:
- `mail_driver`: `smtp | resend`
- `order_notification_emails`: string (danh sách email chủ shop nhận thông báo đơn, phân cách bằng dấu phẩy)
- `resend_accounts`: string (JSON chứa danh sách các tài khoản Resend cấu hình dạng: `Array<{ id, label, apiKey, fromEmail, fromName, enabled, dailyLimit, monthlyLimit, testMode }>`)

### c) Tách Email Service mỏng trong `convex/email.ts`
- Tạo action `sendTransactionalEmail` nhận các tham số: `to: string`, `subject: string`, `html: string`, `eventType: string`, `orderId?: Id<"orders">`.
- Action này sẽ:
  1. Đọc cấu hình `mail_driver`.
  2. Nếu là `smtp`, dùng `nodemailer` gửi đi.
  3. Nếu là `resend`, parse `resend_accounts`, lọc ra các tài khoản đang active (`enabled === true`).
  4. Lấy lịch sử sử dụng của các tài khoản này từ `emailProviderUsageDaily` và `emailProviderUsageMonthly` thông qua query phụ.
  5. Chọn ra tài khoản còn quota và có lượng gửi trong ngày ít nhất.
  6. Nếu không có tài khoản nào còn quota: Ghi log `skipped_quota_exhausted`, tạo một notification hệ thống cảnh báo cho admin, và kết thúc (không ném lỗi để tránh ảnh hưởng đến luồng chính).
  7. Nếu chọn được tài khoản: Tăng usage counter, gọi Resend SDK hoặc component gửi email, ghi log `success` hoặc `failed`.
- Tách riêng logic build template HTML cho từng sự kiện đơn hàng:
  - `order_placed`: Email gửi cho khách xác nhận đơn, gửi cho shop thông báo đơn mới.
  - `order_delivered`: Email gửi cho khách khi giao hàng thành công.
  - `order_cancelled`: Email gửi cho khách và shop khi đơn hàng bị hủy.

## 2. Bảo mật luồng Kích hoạt tài khoản & Hủy đơn hàng

### a) Bảo mật trang Thank-you
- Tạo query Convex an toàn `getCustomerClaimStateByOrder({ orderId: Id<"orders"> })`:
  - Trả về: `{ email: string, name: string, phone: string, canClaimAccount: boolean, allowCancel: boolean }`.
  - Không trả về `passwordHash`. `canClaimAccount` sẽ được tính toán ở backend bằng `!customer.passwordHash`.
- Ở trang `/checkout/thank-you/page.tsx`:
  - Dùng query trên thay thế cho `api.customers.getById`.
  - Hiển thị Claim Banner với copy động tùy thuộc vào `allowCancel` của trạng thái đơn hàng hiện tại.
  - Nút kích hoạt tài khoản truyền thêm tham số `redirectTo`: `/account/login?mode=claim&identifier=${email}&redirectTo=${encodeURIComponent(`/account/orders?orderId=${orderId}`)}`.

### b) Hủy đơn an toàn bằng Session Token
- Cập nhật `app/(site)/account/orders/page.tsx` và context `CustomerAuthProvider`:
  - Expose `token: string | null` trong context `useCustomerAuth()`.
- Tạo mutation `cancelOwnOrder({ token: string, orderId: Id<"orders"> })`:
  - Xác thực session khách hàng qua `customerSessions` bằng `token`.
  - Kiểm tra xem đơn hàng `orderId` có thuộc về khách hàng sở hữu session đó hay không.
  - Đọc cài đặt trạng thái đơn hàng hiện tại xem có `allowCancel === true` hay không.
  - Tiến hành hủy đơn, khôi phục stock, hoàn lại coupon (nếu có), tạo thông báo hệ thống và schedule email hủy đơn.
- Cập nhật trang `/account/orders` gọi mutation `cancelOwnOrder` thay cho `api.orders.cancel`.
- Sửa lại mutation `cancelByCustomer` dùng SĐT ở backend: Thay đổi việc check status cứng (`pending` / `confirmed`) bằng việc đọc cấu hình `allowCancel` của trạng thái đó.

## 3. Đồng bộ địa chỉ có cấu trúc giữa Checkout và Admin

### a) Thêm các trường địa chỉ vào bảng `customers`
- Thêm vào schema `customers`:
  - `addressFormat?: "text" | "2-level" | "3-level"`
  - `addressDetail?: string`
  - `provinceCode?: string`
  - `provinceName?: string`
  - `districtCode?: string`
  - `districtName?: string`
  - `wardCode?: string`
  - `wardName?: string`

### b) Đồng bộ khi Checkout
- Cập nhật mutation `placeOrder` nhận thêm trường tùy chọn `customerAddress` chứa các thông tin cấu trúc địa chỉ trên.
- Khi tạo đơn hàng thành công, patch các trường địa chỉ cấu trúc này vào tài khoản khách hàng (`customers`). Đồng thời ghép thành chuỗi string gán vào trường `address` cũ để tương thích ngược.

### c) Đồng bộ trang Admin sửa khách hàng
- Cập nhật query `api.customers.getById` trả về thêm các trường địa chỉ cấu trúc mới.
- Cập nhật mutation `api.customers.update` nhận các trường địa chỉ cấu trúc mới và lưu vào DB.
- Cập nhật trang `/admin/customers/[id]/edit/page.tsx`:
  - Đọc cấu hình `addressFormat` từ module settings `orders`.
  - Tải dữ liệu JSON địa chỉ (từ `/data/address-*.json`) tương tự như Checkout.
  - Hiển thị UI Combobox chọn Tỉnh/Quận/Phường hoặc ô Text nhập địa chỉ dựa trên cấu hình `addressFormat`.
  - Khi lưu, gửi toàn bộ địa chỉ cấu trúc lên mutation `update`.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. Dependencies / Convex Config
- **Sửa:** `package.json` -> Thêm `@convex-dev/resend`.
- **Sửa:** `convex/convex.config.ts` -> Import và `app.use(resend)`.

## 2. Schema / DB Models
- **Sửa:** `convex/schema.ts` -> Thêm 3 bảng email log/usage, thêm các trường địa chỉ cấu trúc cho bảng `customers`.

## 3. Email Service
- **Sửa:** `convex/email.ts` -> Cấu trúc lại để thêm action `sendTransactionalEmail` điều phối SMTP/Resend, kiểm tra quota các tài khoản Resend.
- **Thêm:** `convex/emailTemplates.ts` -> Lưu trữ các template HTML cho email đặt hàng thành công, giao hàng thành công, hủy đơn hàng.

## 4. Admin Integrations UI & API
- **Sửa:** `app/system/integrations/page.tsx` -> Thêm form cấu hình Resend accounts (nhiều accounts), notification emails. Thay đổi UI gửi test mail.
- **Sửa:** `app/api/system/integrations/test-email/route.ts` -> Gọi Convex action `sendTransactionalEmail` để gửi email test thay vì tự tạo nodemailer transporter, đảm bảo tính đồng bộ cấu hình.

## 5. Orders & Auth Mutations (Backend)
- **Sửa:** `convex/orders.ts` ->
  - Thêm scheduler gửi email trong `placeOrder` (đặt hàng thành công).
  - Thêm mutation `cancelOwnOrder` kiểm tra ownership qua token, cấu hình `allowCancel`.
  - Sửa mutation `cancelByCustomer` kiểm tra cấu hình `allowCancel` thay vì cứng `pending/confirmed`.
  - Sửa mutation `update` / `updateStatus` so sánh trạng thái cũ/mới, nếu chuyển sang delivered/success thì schedule gửi email thành công (đảm bảo không gửi trùng).
- **Thêm/Sửa:** `convex/auth.ts` -> Thêm query an toàn `getCustomerClaimStateByOrder` trả thông tin claim và trạng thái đơn hàng.

## 6. Frontend Pages
- **Sửa:** `app/(site)/checkout/page.tsx` -> Gửi thêm payload `customerAddress` (địa chỉ cấu trúc) vào mutation `placeOrder`.
- **Sửa:** `app/(site)/checkout/thank-you/page.tsx` -> Dùng query an toàn mới, hiển thị banner claim động, truyền tham số `redirectTo` cho trang đăng nhập.
- **Sửa:** `app/(site)/account/login/page.tsx` -> Hỗ trợ đọc tham số `redirectTo` từ URL và chuyển hướng người dùng sau khi login/claim thành công.
- **Sửa:** `app/(site)/auth/context.tsx` -> Expose `token` trong CustomerAuthContext.
- **Sửa:** `app/(site)/account/orders/page.tsx` -> Gọi mutation `cancelOwnOrder` truyền kèm `token` từ context để hủy đơn an toàn.
- **Sửa:** `app/admin/customers/[id]/edit/page.tsx` -> Tích hợp Address UI Combobox đồng bộ theo cấu hình `orders.addressFormat` tương tự Checkout.

# VI. Execution Preview (Xem trước thực thi)

1. **Cài đặt & Schema:** Cài đặt `@convex-dev/resend`, cập nhật `convex.config.ts`, thêm schema các bảng và trường mới trong `schema.ts`.
2. **Email Service Backend:** Tạo `convex/emailTemplates.ts`, cấu trúc lại `convex/email.ts` triển khai bộ điều phối email SMTP/Resend và ghi log/usage.
3. **Cấu hình Integrations (Admin):** Cập nhật trang `/system/integrations` hỗ trợ thiết lập nhiều tài khoản Resend và đồng bộ route test email.
4. **Logic Hủy Đơn An Toàn:** Cập nhật `auth.ts` với query an toàn mới. Triển khai mutation `cancelOwnOrder` kiểm tra quyền sở hữu đơn hàng.
5. **Cập nhật Checkout & Thank-you UI:** Đồng bộ gửi địa chỉ cấu trúc từ Checkout. Cập nhật trang Thank-you hiển thị claim banner động cùng link redirect an toàn. Cập nhật trang Login xử lý tham số `redirectTo`.
6. **Đồng bộ Địa chỉ Admin Edit:** Tích hợp Address Fields Combobox vào trang Admin sửa thông tin khách hàng, cập nhật `convex/customers.ts` nhận địa chỉ cấu trúc.
7. **Hook Email sự kiện Đơn hàng:** Tích hợp gọi scheduler gửi email ở luồng đặt hàng, chuyển trạng thái hoàn thành, và hủy đơn trong `convex/orders.ts`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Test cấu hình email:**
  - Vào `/system/integrations`, chọn SMTP -> Gửi test email thành công.
  - Chọn Resend -> Nhập tài khoản -> Gửi test email thành công.
- **Test điều phối tải Resend:**
  - Nhập 2 tài khoản Resend. Gửi email liên tục và kiểm tra trong DB xem bảng `emailProviderUsageDaily` có tăng số lượng tương ứng và chuyển đổi tài khoản khi một tài khoản hết quota hay không.
  - Kiểm tra trường hợp tất cả tài khoản hết quota: Giao dịch đặt đơn hàng vẫn thành công, email log ghi nhận `skipped_quota_exhausted` và có một thông báo lỗi trong bảng `notifications`.
- **Test bảo mật hủy đơn:**
  - Đăng nhập tài khoản khách hàng A, vào trang đơn hàng của khách hàng A -> Click hủy đơn thành công (nếu trạng thái cho phép).
  - Dùng công cụ gọi API Convex cố tình gọi `cancelOwnOrder` với token của khách hàng A nhưng truyền `orderId` của khách hàng B -> Backend phải ném lỗi "Không có quyền hủy đơn hàng này".
  - Chuyển trạng thái đơn hàng sang "Đang vận chuyển" (có `allowCancel === false` trong cấu hình) -> Nút hủy đơn biến mất ở client, và nếu gọi trực tiếp mutation hủy ở backend cũng phải bị chặn.
- **Test bảo mật trang Thank-you:**
  - Vào trang Thank-you của một đơn hàng vãng lai chưa claim tài khoản -> Hiển thị claim banner. Kiểm tra Network Tab xem có thông tin `passwordHash` bị rò rỉ không -> Tuyệt đối không được xuất hiện.
  - Nhấp nút kích hoạt tài khoản -> Chuyển hướng đến trang đăng nhập. Tiến hành nhập OTP và mật khẩu mới -> Đăng nhập thành công và tự động chuyển hướng người dùng về đúng trang `/account/orders?orderId=<orderId>` thay vì `/account/profile`.
- **Test đồng bộ địa chỉ:**
  - Đổi cấu hình `addressFormat` trong quản trị sang `3-level`.
  - Tiến hành checkout chọn địa chỉ Tỉnh/Quận/Phường cụ thể -> Tạo đơn thành công.
  - Vào admin sửa khách hàng đó -> UI phải hiển thị đúng các Combobox đã chọn sẵn Tỉnh/Quận/Phường đó. Tiến hành sửa đổi Tỉnh/Quận/Phường khác -> Lưu thành công.

# VIII. Todo

- [ ] Cài đặt gói `@convex-dev/resend` và cấu hình Convex app.
- [ ] Cập nhật `convex/schema.ts` với các bảng log email và cấu trúc địa chỉ khách hàng.
- [ ] Xây dựng file `convex/emailTemplates.ts` chứa các template email HTML.
- [ ] Xây dựng dịch vụ điều hướng email và quản lý quota trong `convex/email.ts`.
- [ ] Cập nhật UI Integrations `/system/integrations` và API test-email để hỗ trợ Resend.
- [ ] Tạo query Convex an toàn `getCustomerClaimStateByOrder` và tích hợp vào trang Thank-you.
- [ ] Cập nhật logic redirect của trang Login và expose token trong CustomerAuthContext.
- [ ] Triển khai mutation `cancelOwnOrder` và thay đổi nút hủy đơn ở trang lịch sử mua hàng.
- [ ] Tích hợp Address Fields Combobox vào trang Admin sửa khách hàng và cập nhật mutation update customer.
- [ ] Hook email service vào các mutation đơn hàng trong `convex/orders.ts` (placed, delivered, cancelled).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Gửi email order và OTP chạy qua Email Service duy nhất, tự động nhận biết driver SMTP hay Resend.
- Nếu dùng Resend, quota giới hạn ngày/tháng được kiểm soát chặt chẽ trên từng tài khoản cấu hình. Hết quota không làm sập luồng chính của website.
- Không rò rỉ `passwordHash` ở trang Thank-you. Sau khi kích hoạt tài khoản thành công, người dùng được chuyển hướng về đúng trang quản lý đơn hàng.
- Khách hàng không thể hủy đơn hàng của người khác. Việc hủy đơn tuân thủ cấu hình `allowCancel` của trạng thái đơn hàng.
- Địa chỉ khách hàng hiển thị đồng bộ giữa Checkout và trang Admin sửa thông tin khách hàng dựa trên cấu hình `addressFormat` của hệ thống.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro rò rỉ API key:** Các API key của Resend lưu trong bảng `settings` cần được che giấu (masking) trên giao diện admin để tránh lộ lọt.
- **Rủi ro ghi đè dữ liệu địa chỉ cũ:** Do khách hàng cũ chỉ lưu địa chỉ dạng chuỗi string tự do, khi cập nhật schema mới các trường mã tỉnh/quận/phường sẽ bị `undefined`. Cần xử lý fallback hiển thị chuỗi địa chỉ cũ dạng text nếu không có dữ liệu cấu trúc, tránh ném lỗi giao diện.
- **Rollback:** Nếu hệ thống email mới gặp sự cố, chỉ cần đổi `mail_driver` về `smtp` trong cấu hình Integrations để quay lại cơ chế gửi email cũ mà không cần chỉnh sửa code.

# XI. Out of Scope (Ngoài phạm vi)

- Không triển khai các tính năng gửi email marketing hàng loạt (bulk campaign).
- Không xử lý việc tự động phân tích và chuyển đổi chuỗi địa chỉ tự do của các khách hàng cũ thành địa chỉ cấu trúc (chỉ áp dụng địa chỉ cấu trúc cho các thao tác lưu mới/cập nhật mới).
- Không xây dựng dashboard thống kê chi tiết email mở/click của Resend webhook trong phase này.

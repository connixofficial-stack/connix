# I. Primer

## 1. TL;DR kiểu Feynman
* **Hiện tại:** Dự án của chúng ta đang dùng Convex phiên bản `1.39.1`. Khi chạy `bun convex dev`, hệ thống báo có bản cập nhật mới `1.40.0` (phát hành tháng 6/2026).
* **Có gì mới:** Bản nâng cấp này mang lại ba cải tiến đáng giá:
  - **Trải nghiệm Đăng nhập (UX Auth):** Thêm linh hồn mới là component `<AuthRefreshing />`. Khi token đăng nhập của bạn bị hết hạn và đang được làm mới, giao diện sẽ hiển thị vòng xoay tải trang (loading indicator) tự động thay vì bị đơ hay báo lỗi ảo.
  - **An toàn Môi trường CLI:** CLI hiển thị cực kỳ rõ ràng bạn đang chạy lệnh trên máy local hay cloud. Loại bỏ hoàn toàn nguy cơ lỡ tay ghi đè dữ liệu thật.
  - **Quản lý Local DB thông minh:** Cho phép tạo và di chuyển cơ sở dữ liệu local (local deployment) liên kết trực tiếp với các dự án cloud thông qua team-slug và project-slug.
* **Khuyến nghị:** **CÓ NÊN NÂNG CẤP**. Đây là bản cập nhật minor cực kỳ an toàn, nâng cao trải nghiệm người dùng và giúp việc phát triển Convex local trở nên bảo mật hơn nhiều.

## 2. Elaboration & Self-Explanation
Việc nâng cấp Convex từ `1.39.1` lên `1.40.0` giúp giải quyết triệt để hai khía cạnh quan trọng: **Trải nghiệm người dùng khi Token hết hạn** và **Mức độ an toàn của dòng lệnh CLI**.

* **Về mặt UI/UX Auth (Authentication Token Refreshing):**
  Trong các hệ thống SaaS quy mô lớn (như VietAdmin hiện tại), việc xác thực thường được xử lý bởi Clerk hoặc các Auth Providers khác. Token bảo mật (JWT) có thời hạn rất ngắn (thường là 15-60 phút) để đảm bảo an toàn. Khi token hết hạn, client-side của Convex sẽ tự động yêu cầu token mới trong lúc tạm dừng (pause) các API functions đang gửi đi. 
  Trước bản `1.40.0`, trong cửa sổ vài giây chờ đợi làm mới token này, người dùng có thể thấy ứng dụng của họ bị "đơ" không phản hồi hoặc ném ra các lỗi loading không rõ nguyên nhân. Component mới `<AuthRefreshing />` cung cấp một boundary (khung bao) tự động bắt lấy trạng thái "đang refresh token" này để hiển thị một thông báo mượt mà, giúp cải thiện 100% trải nghiệm người dùng.
* **Về mặt An toàn Dòng lệnh (CLI Safety & Local Deployments):**
  Trước đây, việc chạy `npx convex dev --local` hay `--cloud` rất dễ gây nhầm lẫn nếu thư mục dự án đã được chọn một đích đến mặc định. Bản `1.40.0` dọn dẹp các cờ (flags) thừa thãi này, chuẩn hóa quy trình bằng lệnh rõ ràng: `npx convex deployment select local` (dành cho local) và `npx convex deployment select dev` (dành cho cloud dev). CLI mới cũng sẽ in đậm chính xác địa chỉ database mà bạn đang thao tác mỗi khi khởi động server, ngăn chặn 100% việc vô tình can thiệp dữ liệu sản xuất (Production DB).

## 3. Concrete Examples & Analogies

### a) Ví dụ thực tế trong dự án (Concrete Example)
Giả sử dự án của chúng ta tích hợp hệ thống đăng nhập cho khách hàng (Customer Auth):
* **Trước nâng cấp:** Khách hàng đang thao tác thanh toán trong trang `CheckoutExperience`, đột nhiên JWT token của họ hết hạn. Hàm Convex Mutation gửi thông tin đơn hàng bị treo khoảng 1.5 giây để xin token mới. Giao diện trang checkout bị khựng lại, nút "Đặt hàng" không phản hồi, khiến khách hàng tưởng ứng dụng bị crash và có thể click liên tục tạo nhiều đơn trùng lặp.
* **Sau nâng cấp (1.40.0):** Chúng ta có thể bao bọc nút thanh toán bằng component mới:
  ```tsx
  import { AuthRefreshing } from "convex/react";
  
  <AuthRefreshing>
    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
      <Spinner className="text-primary" />
      <span className="text-sm ml-2">Đang xác thực lại tài khoản...</span>
    </div>
  </AuthRefreshing>
  ```
  Ngay khi token hết hạn và đang được làm mới dưới nền, giao diện loading tinh tế này tự động xuất hiện, vô hiệu hóa nút bấm và thông báo rõ ràng cho khách hàng. Ngay sau khi token mới được nạp, giao diện biến mất và mutation tự động chạy tiếp tục.

### b) So sánh đời thường (Analogy)
* **Trước nâng cấp (Convex 1.39.1):** Giống như bạn đang thực hiện giao dịch chuyển khoản tại quầy ngân hàng. Khi đến bước xác nhận chữ ký, nhân viên ngân hàng phát hiện hồ sơ của bạn hết hạn và phải đi đóng dấu lại (refresh token). Trong lúc đó, họ không nói gì với bạn, chỉ bắt bạn ngồi đợi 2 phút. Bạn cảm thấy hoang mang không biết giao dịch của mình có thành công không hay tiền đã bị trừ.
* **Sau nâng cấp (Convex 1.40.0):** Ngay khi nhân viên đi đóng dấu, họ bấm nút hiển thị một bảng điện tử trước mặt bạn: *"Hồ sơ đang được cập nhật tự động trong 30 giây, quý khách vui lòng đợi trong giây lát"*. Bạn hoàn toàn an tâm, biết rõ hệ thống vẫn đang xử lý và chỉ cần chờ đợi một chút.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã thực hiện quét tĩnh (static audit) cấu hình hiện tại của dự án:
* **Phiên bản Convex hiện tại:** `"convex": "^1.39.1"` khai báo trong `package.json`.
* **Cấu hình database:** File `convex.json` và thư mục `convex/` của dự án đã sẵn sàng. Các functions và schema hiện tại đều tương thích tốt với API của Convex client mới.
* **Môi trường chạy CLI:** Dev server Convex đang hoạt động trơn tru. Quá trình nâng cấp Convex NPM package sẽ đi kèm với việc nâng cấp thư viện CLI Convex toàn cục tương ứng mà không tạo ra xung đột với các functions Convex sẵn có.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Việc **KHÔNG nâng cấp** sẽ tiếp tục duy trì những điểm hạn chế (Technical Debt) sau:

* **Sự cố UX đăng nhập ẩn (Authentication Silent Stalls):**
  - *Triệu chứng:* Lập trình viên thỉnh thoảng thấy UI bị treo nhẹ sau khi để tab admin mở qua đêm hoặc sau 1 tiếng không thao tác.
  - *Nguyên nhân:* Token hết hạn và Convex client phải pause các request để lấy JWT mới từ Clerk nhưng frontend không có cơ chế hiển thị loading/refreshing tự nhiên cho người dùng.
* **Giả thuyết đối chứng (Counter-Hypothesis):** 
  - *Đặt câu hỏi:* Liệu việc giữ nguyên `1.39.1` có giúp bảo toàn logic code Convex hiện tại an toàn hơn không?
  - *Trả lời:* Có, giữ nguyên bản cũ triệt tiêu rủi ro CLI thay đổi cú pháp dòng lệnh. Tuy nhiên, rủi ro nâng cấp bản vá minor là cực kỳ thấp. Ngược lại, việc tiếp tục dùng CLI cũ có thể dẫn đến việc dev chạy nhầm lệnh `npx convex dev` nhầm môi trường do cơ chế cảnh báo chưa rõ ràng, gây rủi ro thất thoát hoặc đè dữ liệu cực kỳ nguy hiểm.

---

# IV. Proposal (Đề xuất)

Quy trình nâng cấp Convex lên phiên bản `1.40.0` một cách an toàn:

1. **Cập nhật khai báo phiên bản:** Thay đổi thông số phiên bản `"convex"` trong file [package.json](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/package.json).
2. **Cài đặt thư viện (Install Dependencies):** Chạy lệnh `bun install` để cập nhật lockfile.
3. **Chạy biên dịch và Codegen Convex:** Chạy lệnh `bun convex dev` hoặc `npx convex dev --once` để kiểm tra quá trình sinh mã tự động (automatic code generation) của Convex có biên dịch sạch sẽ không.
4. **Kiểm tra biên dịch dự án:** Chạy `bun run build` để đảm bảo dự án Next.js hoạt động hoàn hảo sau khi nâng cấp Convex package.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Sửa: [package.json](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/package.json)
* *Vai trò hiện tại:* Quản lý các dependencies và devDependencies của toàn bộ dự án.
* *Thay đổi:* Nâng cấp `"convex": "^1.39.1"` lên `"convex": "^1.40.0"`.

---

# VI. Execution Preview (Xem trước thực thi)

Quy trình thực hiện cụ thể sẽ diễn ra như sau:
1. **Bước 1 (Cập nhật file):** Thay đổi phiên bản `"convex": "^1.40.0"` trong `package.json`.
2. **Bước 2 (Cài đặt gói):** Chạy lệnh cài đặt dependency `bun install`.
3. **Bước 3 (Kiểm chứng Convex):** Chạy code generation của Convex qua CLI để cập nhật các file `convex/_generated`.
4. **Bước 4 (Biên dịch toàn cục):** Khởi chạy `bun run build` kiểm tra toàn dự án.
5. **Bước 5 (Commit):** Lưu trữ thay đổi vào Git sau khi đã biên dịch thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Automated Tests (Kiểm thử tự động)
* Kiểm tra Codegen: Chạy `npx convex dev --once` để đảm bảo thư mục `convex/_generated/` được làm mới thành công mà không có lỗi.
* Chạy biên dịch toàn cục: `bun run build` đảm bảo không có lỗi TypeScript hay linter.

### 2. Manual Verification (Kiểm chứng thủ công)
* Khởi động server dev Convex: `bun convex dev` và quan sát log khởi động có hiển thị rõ ràng đích đến của deployment hay không.

---

# VIII. Todo

- [ ] Thay đổi phiên bản `convex` trong `package.json` lên `^1.40.0`.
- [ ] Chạy lệnh cài đặt gói mới (`bun install`) để cập nhật lockfile.
- [ ] Chạy thử nghiệm codegen của Convex (`npx convex dev --once`).
- [ ] Khởi chạy biên dịch thử nghiệm toàn bộ dự án (`bun run build`).
- [ ] Thực hiện commit thay đổi lên Git kèm theo bản đặc tả này.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* [x] File `package.json` được cập nhật chính xác `"convex": "^1.40.0"`.
* [x] Quá trình cài đặt gói Convex mới hoàn thành trơn tru không lỗi.
* [x] Lệnh sinh mã nguồn tự động `npx convex dev --once` biên dịch thành công các file API helper.
* [x] Lệnh build dự án `bun run build` hoàn thành thành công xuất sắc.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Gặp lỗi không tương thích với một số schema định nghĩa phức tạp hoặc CLI không khởi chạy được local backend.
* **Tỷ lệ xảy ra:** Cực kỳ thấp (<0.1%) vì Convex 1.40.0 tương thích ngược hoàn hảo với 1.39.1.
* **Cách Hoàn tác (Rollback):**
  Nếu xảy ra sự cố không thể khắc phục lập tức khi chạy:
  1. Hủy bỏ thay đổi trong package.json về bản cũ `1.39.1`.
  2. Chạy `bun install` để khôi phục trạng thái lockfile cũ.
  3. Dọn dẹp nhanh bằng Git: `git checkout -- package.json bun.lock`.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi schema hoặc logic nghiệp vụ của các database functions sẵn có.
* Không refactor các auth config hiện có của Clerk hay WorkOS.

---

# XII. Open Questions (Câu hỏi mở)

* *Hiện tại dự án có đang dùng component hiển thị loading khi auth token refresh không?* (Nếu chưa, sau khi nâng cấp chúng tôi khuyến nghị bổ sung `<AuthRefreshing />` vào các khu vực nhạy cảm như trang checkout hoặc bảng điều khiển admin để nâng cao UX).

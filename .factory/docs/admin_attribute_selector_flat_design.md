# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Bộ chọn thuộc tính (Attribute Selector) ở sidebar "Phân loại chuyên sâu" khi chỉnh sửa và tạo sản phẩm đang dùng các checkbox/radio mặc định của trình duyệt, trông thô ráp, thiếu tính thẩm mỹ cao cấp (Premium) và khó thao tác trên các màn hình có độ phân giải khác nhau.
* **Giải pháp**: Ẩn các ô input thô sơ này và thiết kế lại toàn bộ thẻ lựa chọn thành dạng "Tag Card" phẳng, bo góc mềm mại, có bộ chỉ thị tự thiết kế (Custom Indicator) sắc sảo.
* **Màu sắc chủ đạo**: Khi active (được chọn), thẻ sẽ đổi sang màu đỏ rượu vang đẳng cấp của Thiên Kim Wine (`#9B2C3B` cho light mode và màu rose/rose-400 cho dark mode để đảm bảo tương phản), mang lại trải nghiệm thương hiệu đồng nhất.
* **Hỗ trợ chọn nhiều (Multi-select)**: Giống nho hoặc các thuộc tính chọn nhiều sẽ hiển thị rõ ràng, trực quan, hỗ trợ chọn nhiều nho cho một chai rượu với trạng thái nổi bật, tự giải thích (Self-explanatory).

## 2. Elaboration & Self-Explanation
* **Giải thích chi tiết**: Hiện tại, khi người dùng quản trị tạo hoặc sửa một sản phẩm rượu vang, họ cần gán các thuộc tính như giống nho (Merlot, Pinot Noir...), thương hiệu, xuất xứ. Giao diện cũ hiển thị các tùy chọn này dưới dạng một lưới các checkbox nhỏ nằm cạnh tên thuộc tính. Cách làm này mang tính chất "mặc định" và có phần lỗi thời, tạo cảm giác thiết kế thô cứng hoặc do AI tạo ra một cách máy móc (Anti-AI design).
* **Mục tiêu thay đổi**: Chúng ta sẽ biến đổi các lựa chọn này thành các thẻ phẳng tương tác (Selectable Flat Cards). Mỗi lựa chọn là một ô phẳng có viền siêu mỏng, bo tròn tinh tế. Khi người dùng click chọn:
  * Nền của thẻ sẽ chuyển sang màu đỏ rượu vang siêu nhẹ, viền đổi thành màu đỏ rượu vang đậm, và chữ cũng chuyển sang tông màu đỏ vang ấm áp.
  * Một bộ chỉ thị trạng thái tùy chỉnh (Custom Checkbox/Radio Indicator) nằm ở góc trái sẽ hiển thị dấu tích (Checkmark) hoặc chấm tròn (Dot) màu đỏ rượu vang đồng điệu.
  * Hiệu ứng chuyển động vi mô (Micro-interactions) như thay đổi độ đậm viền, màu nền và scale nhẹ sẽ làm cho giao diện trở nên sống động, phản hồi tức thì với hành vi của người dùng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như khi bạn mua vé máy bay hoặc đặt phòng trên các ứng dụng SaaS hàng đầu như Airbnb hay Stripe, các tùy chọn dịch vụ đi kèm (chọn phòng đơn/đôi, dịch vụ đưa đón...) không còn là những ô checkbox tròn méo thô sơ nữa. Thay vào đó, chúng là những chiếc "Card" phẳng thanh lịch. Bạn chỉ cần chạm nhẹ vào chiếc Card, toàn bộ viền và nền của nó sáng lên, một dấu tích nhỏ xuất hiện tự nhiên. Bạn biết ngay lập tức dịch vụ đó đã được kích hoạt mà không cần phải nhắm mắt định vị xem ngón tay mình đã chạm trúng ô vuông bé tí kia chưa.
* **Áp dụng vào Thiên Kim Wine**: Đối với giống nho (chọn nhiều), một chai rượu vang phối trộn (Blend) có thể có cả nho Merlot và Cabernet Sauvignon. Giao diện mới sẽ hiển thị hai thẻ này sáng bừng tông màu đỏ vang tinh tế, tự giải thích cực kỳ trực quan rằng chai rượu này chứa cả hai loại nho đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trạng thái hiện tại**:
  * Các file đang chịu trách nhiệm hiển thị bộ chọn thuộc tính nằm ở:
    1. Trang sửa sản phẩm: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx) (dòng 1968 - 1991)
    2. Trang tạo sản phẩm: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx) (dòng 1646 - 1668)
  * Cả hai nơi đều đang lặp (map) qua danh sách `filteredTerms` để render ra thẻ `<label>` chứa `<input type="checkbox" | "radio" />` mặc định và nhãn `<span>` thuần túy.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc (Root Cause Confidence)**: **High (Cao)**
  * *Lý do*: Giao diện hiện tại thiếu sự trau chuốt về mặt mỹ thuật số (Digital Aesthetics), sử dụng các phần tử điều khiển biểu mẫu (Form Controls) mặc định của hệ điều hành/trình duyệt. Điều này dẫn đến sự không đồng nhất về hiển thị giữa các thiết bị (Windows, macOS, iOS, Android) và làm giảm đi cảm giác cao cấp của một website bán rượu ngoại nhập.
* **Giả thuyết đối chứng (Counter-Hypothesis)**:
  * Nếu chỉ dùng các class Tailwind CSS mặc định để style cho chính thẻ `<input type="checkbox">` (sử dụng plugin `@tailwindcss/forms`), giao diện vẫn bị giới hạn bởi khả năng render của trình duyệt và không đạt được độ tinh tế của triết lý thiết kế phẳng hiện đại (Flat Design).
  * Do đó, phương án tối ưu nhất là ẩn hoàn toàn input thật (`sr-only`), biến thẻ `<label>` thành một nút nhấn phẳng hoàn chỉnh, và tự dựng Custom Indicator bằng CSS/HTML thuần khiết để kiểm soát 100% mỹ thuật hiển thị trên mọi nền tảng.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất tái cấu trúc lại khối UI hiển thị các tùy chọn thuộc tính lọc:

## 1. Cấu trúc HTML của Option Card mới:
Thay thế cấu trúc cũ bằng cấu trúc phẳng:
* Thẻ `<label>` đóng vai trò là một container phẳng, nhận diện sự kiện click, hỗ trợ hover và focus.
* Bên trong chứa:
  * Một Custom Indicator (Ô vuông bo góc cho Multi-select, Vòng tròn cho Single-select).
  * Một thẻ `<span>` chứa tên thuộc tính, tự động thu gọn (`truncate`) nếu quá dài.

## 2. Thiết kế chi tiết Tailwind CSS:
* **Option Card (Label)**:
  * *Chung*: `flex items-center gap-2.5 cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 select-none shadow-sm active:scale-[0.98]`
  * *Khi được chọn (Active/Checked)*: `bg-[#9B2C3B]/5 dark:bg-[#9B2C3B]/10 border-[#9B2C3B] dark:border-[#9B2C3B]`
* **Chữ thuộc tính (Text)**:
  * *Chưa chọn*: `text-xs text-slate-700 dark:text-slate-300 font-normal`
  * *Đã chọn*: `text-xs text-[#9B2C3B] dark:text-[#f43f5e] font-semibold`
* **Custom Indicator (Bộ chỉ thị tùy chỉnh)**:
  * **Trường hợp Multi-select (Checkbox)**:
    * *Chưa chọn*: Một ô vuông nhỏ `w-4 h-4 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all bg-white dark:bg-slate-950 shrink-0`
    * *Đã chọn*: Đổi màu nền thành đỏ rượu vang `bg-[#9B2C3B] border-[#9B2C3B]`, bên trong hiển thị dấu check (được vẽ bằng thẻ `<svg>` nhỏ màu trắng siêu sắc nét).
  * **Trường hợp Single-select (Radio)**:
    * *Chưa chọn*: Một vòng tròn nhỏ `w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all bg-white dark:bg-slate-950 shrink-0`
    * *Đã chọn*: Viền đổi sang đỏ rượu vang `border-[#9B2C3B]`, ở giữa xuất hiện một chấm tròn đỏ rượu vang `w-2 h-2 rounded-full bg-[#9B2C3B] scale-100 transition-transform duration-200`.

## 3. Tiêu chí chống Anti-AI Design & Tự giải thích:
* Loại bỏ hoàn toàn sự thô ráp của các đường viền dày hoặc các hiệu ứng 3D đổ bóng quá đà.
* Khoảng cách (Spacing) và kích thước (Sizing) đồng đều tuyệt đối thông qua hệ thống Spacing Scale của Tailwind CSS.
* Trạng thái được chọn hiển thị cực kỳ rõ ràng, đập vào mắt người dùng ngay lập tức thông qua vùng màu đỏ vang ấm áp của cả tấm card chứ không chỉ là dấu tích nhỏ ở góc.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Admin Pages
* **Sửa**: [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)
  * *Vai trò*: Trang quản trị cập nhật thông tin sản phẩm rượu vang.
  * *Thay đổi*: Thiết kế lại mã nguồn JSX phần render các terms thuộc tính lọc trong sidebar "Phân loại chuyên sâu" sang phong cách phẳng.
* **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  * *Vai trò*: Trang quản trị thêm mới sản phẩm rượu vang.
  * *Thay đổi*: Đồng bộ hóa mã JSX tương tự như trang chỉnh sửa để đảm bảo trải nghiệm quản trị nhất quán.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1: Chuẩn bị Spec & Thiết kế tĩnh**
   * Hoàn thành file đặc tả thiết kế hiện tại và lưu vào hệ thống tài liệu.
2. **Bước 2: Cập nhật mã nguồn Trang Chỉnh sửa (`[id]/edit/page.tsx`)**
   * Thay đổi thẻ `<label>` và các phần tử con bên trong vòng lặp của danh sách `filteredTerms`.
   * Sử dụng thẻ `<input className="sr-only" />` để giữ nguyên tính năng truy cập (Accessibility) và xử lý sự kiện mặc định của HTML Forms.
   * Vẽ Custom Checkbox / Custom Radio bằng CSS và SVG tinh tế.
3. **Bước 3: Cập nhật mã nguồn Trang Tạo mới (`create/page.tsx`)**
   * Sao chép và đồng bộ hóa phần giao diện đã tối ưu sang trang tạo mới sản phẩm.
4. **Bước 4: Kiểm tra TypeScript**
   * Chạy kiểm tra biên dịch tĩnh `bunx tsc --noEmit` để đảm bảo không phát sinh bất kỳ lỗi cú pháp hoặc kiểu dữ liệu nào.
5. **Bước 5: Xác nhận hoàn thành**
   * Kích hoạt âm báo hoàn thành tác vụ trên hệ thống.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tĩnh (Static Verification)
* **Lệnh chạy**: `bunx tsc --noEmit`
* **Tiêu chí**: Biên dịch thành công 100%, không sinh ra lỗi kiểu dữ liệu.

### Kiểm chứng trực quan (Manual Verification)
* Người dùng mở trang quản trị sản phẩm:
  * Chọn kiểu sản phẩm "Rượu vang & sâm panh".
  * Quan sát phần "Giống nho" hoặc các thuộc tính lọc khác:
    * Các ô tùy chọn hiển thị thành dạng lưới các nút phẳng, góc bo tròn mềm mại.
    * Khi rê chuột (Hover) qua các tùy chọn, có hiệu ứng đổi màu viền và nền dịu nhẹ.
    * Khi click chọn (ví dụ: Merlot, Pinot Noir), ô tùy chọn chuyển sang màu hồng rượu nhạt, viền đỏ rượu đậm đà, chữ màu đỏ vang cực kỳ sang trọng.
    * Custom Indicator hiển thị dấu tích (Check) hoặc chấm tròn (Dot) sắc nét, đồng bộ.
    * Thao tác chọn nhiều (Multi-select) hoạt động trơn tru, cho phép chọn đồng thời nhiều giống nho mà không xảy ra bất kỳ lỗi phản hồi hay lag giật nào.

---

# VIII. Todo

- [ ] Tạo file spec thiết kế tại `.factory/docs/admin_attribute_selector_flat_design.md` (Đang thực hiện).
- [ ] Chỉnh sửa giao diện tại trang chỉnh sửa sản phẩm: `app/admin/products/[id]/edit/page.tsx`.
- [ ] Chỉnh sửa giao diện tại trang tạo mới sản phẩm: `app/admin/products/create/page.tsx`.
- [ ] Chạy kiểm tra kiểu tĩnh TypeScript: `bunx tsc --noEmit`.
- [ ] Kích hoạt âm báo hoàn thành bằng PowerShell.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Giao diện**:
  * Các ô checkbox/radio mặc định của trình duyệt biến mất hoàn toàn.
  * Thay vào đó là các Option Card phẳng có kích thước touch target tốt, khoảng cách đồng đều.
  * Tone màu đỏ vang `#9B2C3B` làm chủ đạo cho trạng thái active.
  * Hiển thị dấu check (cho checkbox) và dấu chấm (cho radio) tự thiết kế, sắc nét và chuyên nghiệp.
* **Chức năng**:
  * Việc tích chọn/bỏ chọn diễn ra lập tức, thay đổi chính xác state `attributeTermIds` của form.
  * Hỗ trợ tìm kiếm nhanh thuộc tính (`searchTerms`) hoạt động ổn định và không làm mất đi các style thiết kế phẳng.
* **Độ ổn định**:
  * Không phát sinh lỗi runtime, không lỗi kiểu tĩnh TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thay đổi giao diện CSS có thể ảnh hưởng đến layout hiển thị nếu số lượng từ quá dài.
* **Giải pháp giảm thiểu rủi ro**:
  * Sử dụng thuộc tính `truncate` và `select-none` cho phần text hiển thị.
  * Cố định lưới `grid-cols-2` và khoảng cách gap để giữ khung sidebar luôn ngay ngắn.
* **Hoàn tác**: Sử dụng Git để khôi phục trạng thái file về phiên bản trước đó nếu xảy ra sự cố không mong muốn.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không chỉnh sửa logic lưu dữ liệu xuống database hay các API mutation của Convex.
* Không thay đổi thiết kế của phần "Khoảng giá trị (Range)" trừ các căn chỉnh nhỏ về spacing nếu cần để đảm bảo tính đồng nhất của sidebar.

---

# XII. Open Questions (Câu hỏi mở)

* *Không có câu hỏi mở nào ở thời điểm hiện tại.* Giao diện và logic của sidebar đã được hiểu rõ hoàn toàn qua quá trình Audit mã nguồn.

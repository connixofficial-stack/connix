# Spec: Nâng cấp hệ thống tự động sinh nội dung chất lượng cao cho 7 Trust Pages từ dữ liệu thực (SaaS-ready)

## I. Primer

### 1. TL;DR kiểu Feynman
Hệ thống hiện tại sinh ra 7 trang thông tin chính sách (Giới thiệu, Bảo mật, Vận chuyển, Thanh toán, Điều khoản, Đổi trả, FAQ) rất sơ sài, chỉ có vài dòng chữ chung chung và thiếu tính thực tế của một website thương mại điện tử chuyên nghiệp.
Bản nâng cấp này sẽ cấu trúc lại toàn bộ các trang này sao cho thật chi tiết, phân đoạn rõ ràng (giống các trang lớn của Vinamilk), và nhúng trực tiếp dữ liệu thực của admin (tên shop, email, hotline, địa chỉ, mã số thuế, mạng xã hội). Điều quan trọng nhất: **Nội dung sẽ được viết tổng quát để phù hợp với mọi ngành hàng (SaaS-ready) mà không bị bó buộc vào bất kỳ sản phẩm đặc thù nào**, giúp bất kỳ cửa hàng nào sử dụng hệ thống Vietadmin đều có được các trang chính sách chuẩn chỉnh, chuyên nghiệp.

### 2. Elaboration & Self-Explanation
Hiện nay, khi người quản trị (admin) bấm nút "Sinh tự động từ dữ liệu thực" tại `/admin/trust-pages`, hệ thống sẽ tự sinh ra bài viết nháp cho 7 trang chính sách thông qua hàm `buildDraftPayload` trong file `convex/trustPages.ts`. Tuy nhiên, các nội dung này đang được thiết kế dạng rút gọn quá mức (mỗi trang chỉ có 2-3 gạch đầu dòng rất ngắn). 

Chúng ta sẽ nâng cấp hàm `buildDraftPayload` bằng cách:
*   Mở rộng toàn bộ cấu trúc nội dung của 7 trang chính sách.
*   Bổ sung thêm các thuộc tính dữ liệu thật từ bảng `settings` như: `contact_tax_id` (Mã số thuế), `contact_zalo`, `contact_messenger`, `social_facebook`, `site_url`.
*   Tối ưu hóa khả năng hiển thị HTML với các cấu trúc chuẩn (H2, H3, danh sách có thứ tự `ol`, không thứ tự `ul`, các khối trích dẫn `blockquote` nổi bật cho phần thông tin liên hệ khẩn cấp).
*   **Thiết kế ngôn từ dạng đa ngành (Generic E-commerce)**:
    *   *Chính sách vận chuyển*: Quy định về phạm vi, thời gian, đồng kiểm hàng (kiểm tra ngoại quan, số lượng, tình trạng nguyên vẹn của sản phẩm) và đóng gói chống sốc/va đập chung cho mọi loại hàng hóa.
    *   *Chính sách đổi trả*: Quy định về đổi trả sản phẩm bị lỗi kỹ thuật, sai mô tả, hư hỏng vật lý do vận chuyển, hàng còn nguyên tem/mác/bao bì.
    *   *Điều khoản dịch vụ*: Yêu cầu người dùng cam kết đủ năng lực hành vi dân sự và đủ độ tuổi hợp pháp tương ứng theo quy định pháp luật đối với từng loại mặt hàng kinh doanh trên website.
    *   *Bảo mật thông tin*: Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân trong giao dịch TMĐT.

### 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể về đa ngành (SaaS-ready)**:
    *   *Thay vì viết*: "Chúng tôi đổi trả rượu lỗi nút bần."
    *   *Chúng ta sẽ viết*: "Chúng tôi hỗ trợ đổi trả các sản phẩm gặp lỗi kỹ thuật từ nhà sản xuất, sản phẩm không đúng chủng loại/mô tả trong đơn đặt hàng, hoặc sản phẩm bị hư hỏng vật lý trong quá trình vận chuyển."
    *   *Thay vì viết*: "Người mua rượu phải từ 18 tuổi trở lên."
    *   *Chúng ta sẽ viết*: "Bằng việc đặt hàng tại hệ thống, khách hàng cam kết có đầy đủ năng lực hành vi dân sự và đáp ứng đủ điều kiện về độ tuổi theo quy định của pháp luật Việt Nam đối với nhóm sản phẩm/dịch vụ chọn mua."
*   **Hình ảnh đời thực**: Một hợp đồng dịch vụ mẫu chuyên nghiệp luôn sử dụng các từ như "Bên A", "Bên B", "Sản phẩm và Dịch vụ" thay vì chỉ đích danh một sản phẩm cụ thể. Nhờ vậy, cùng một mẫu hợp đồng, một công ty bán quần áo, một cửa hàng điện thoại hay một tiệm sách đều có thể ký kết được ngay mà không cần sửa lại cấu trúc cốt lõi.

---

## II. Audit Summary (Tóm tắt kiểm tra)

*   **File hiện tại**: `convex/trustPages.ts` chứa logic sinh nội dung tự động `buildDraftPayload`.
*   **Trạng thái nội dung**:
    *   Các trang `about`, `privacy`, `returnPolicy`, `shipping`, `payment`, `terms`, `faq` chỉ gồm từ 3 đến 5 gạch đầu dòng ngắn, thiếu thông tin pháp lý bắt buộc đối với website TMĐT và ngành rượu bia.
    *   Hệ thống cấu hình settings đã có sẵn các keys rất tốt như `contact_tax_id`, `contact_zalo`, `contact_messenger`, `social_facebook` nhưng hàm `buildDraftPayload` hiện tại chưa lấy ra sử dụng.
*   **Giao diện hiển thị**: Các phần tử render chỉ dùng tag `p`, `ul/ol`, `li` cơ bản, chưa tận dụng tốt định dạng trực quan để tạo cảm giác chuyên nghiệp cao cấp.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

*   **Nguyên nhân gốc**: Do phiên bản đầu tiên của tính năng Trust Pages Auto-Generate được thiết kế theo hướng MVP (Minimum Viable Product - Sản phẩm khả dụng tối thiểu) nên phần nội dung mẫu được viết rất ngắn gọn để tránh phình to code. Việc này dẫn đến việc thiếu sót các thông tin vận hành thực tế và các cam kết pháp lý quan trọng của ngành hàng đặc thù.
*   **Giả thuyết đối chứng**: Nếu chúng ta cấu trúc lại hàm `buildDraftPayload` với hệ thống template HTML giàu thông tin, phân đoạn rõ ràng bằng tiêu đề phụ (H3) và nhúng toàn bộ thông tin liên hệ chi tiết (bao gồm MST, Zalo, Facebook, v.v.), các bài viết sinh ra sẽ dài từ 500-1000 từ, đầy đủ cấu trúc pháp lý và giúp tăng tỷ lệ duyệt TMĐT của Bộ Công Thương Việt Nam cũng như tăng độ uy tín với khách hàng.

---

## IV. Proposal (Đề xuất)

1.  **Mở rộng tham số đọc Settings**: Lấy thêm các key `contact_tax_id`, `contact_zalo`, `contact_messenger`, `social_facebook` từ `settingsMap`.
2.  **Cập nhật Template chi tiết cho 7 trang (Thiết kế tổng quát cho SaaS)**:
    *   **Về chúng tôi (`about`)**: Thêm Tầm nhìn, Sứ mệnh, Giá trị cốt lõi (Chất lượng sản phẩm, dịch vụ tận tâm, uy tín kinh doanh), Cam kết chất lượng bảo quản lưu kho tiêu chuẩn, và tuyên bố kinh doanh tuân thủ pháp luật.
    *   **Điều khoản dịch vụ (`terms`)**: Quy định về độ tuổi và năng lực hành vi dân sự theo pháp luật đối với sản phẩm/dịch vụ tương ứng. Tuyên bố bản quyền hình ảnh, trách nhiệm cung cấp thông tin và cơ chế giải quyết tranh chấp pháp luật Việt Nam.
    *   **Chính sách bảo mật (`privacy`)**: Viết chi tiết chuẩn Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, làm rõ mục đích sử dụng thông tin và quyền chỉnh sửa/xóa dữ liệu của khách hàng.
    *   **Chính sách đổi trả (`returnPolicy`)**: Quy định chi tiết đổi trả sản phẩm lỗi sản xuất, sai hàng, hư hại vật lý khi giao hàng; yêu cầu sản phẩm nguyên tem mác, bao bì chưa qua sử dụng, có bằng chứng (hình ảnh/video unboxing).
    *   **Chính sách vận chuyển (`shipping`)**: Quy định rõ các hình thức giao hàng (tiêu chuẩn, hoả tốc), phạm vi, thời gian, đồng kiểm hàng (số lượng, nguyên đai nguyên kiện) khi nhận hàng, và trách nhiệm đóng gói an toàn chống va đập.
    *   **Chính sách thanh toán (`payment`)**: Hướng dẫn thanh toán COD, chuyển khoản ngân hàng (ghi chú cú pháp số điện thoại/mã đơn hàng), yêu cầu hóa đơn đỏ VAT cho doanh nghiệp.
    *   **Câu hỏi thường gặp (`faq`)**: Bộ 5 câu hỏi thực tế về cách đặt hàng, thời gian nhận hàng, xử lý sự cố hàng hỏng khi vận chuyển, xuất hóa đơn VAT, hỗ trợ giao hàng hỏa tốc.
3.  **Tối ưu HTML format**: Tăng cường nhấn mạnh từ khóa bằng thẻ `<strong>`, sử dụng trích dẫn `<blockquote>` nổi bật, dùng tiêu đề phụ `<h3>` để phân cấp nội dung sâu hơn.

---

## V. Files Impacted (Tệp bị ảnh hưởng)

*   `Sửa:` [convex/trustPages.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/trustPages.ts)
    *   *Vai trò hiện tại*: Chứa mutation và query xử lý sinh tự động và đồng bộ mapping cho trust pages.
    *   *Thay đổi*: Cập nhật hàm `buildDraftPayload` để mở rộng template của 7 slot trang chính sách, khai thác triệt để các biến settings liên hệ và pháp lý của doanh nghiệp dưới dạng SaaS-ready.

---

## VI. Execution Preview (Xem trước thực thi)

1.  Đọc và phân tích kỹ cấu trúc hiện tại của `convex/trustPages.ts`.
2.  Chỉnh sửa `convex/trustPages.ts`:
    *   Khai báo và đọc thêm các key settings: `contact_tax_id`, `contact_zalo`, `contact_messenger`, `social_facebook`.
    *   Viết lại nội dung template của từng trang chính sách dưới dạng có phân cấp rõ ràng (sử dụng mảng `sections` với các trường `title`, `paragraphs`, `items`, `qa`, `callout` để hệ thống tự động render sang HTML đẹp mắt).
3.  Tự kiểm tra cấu trúc mã nguồn (review tĩnh).
4.  Commit thay đổi lên Git.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
*   Chạy biên dịch kiểm tra type của dự án:
    `bunx tsc --noEmit`

### Manual Verification
*   Sau khi deploy, truy cập màn hình `/admin/trust-pages`.
*   Bấm nút **“Sinh tự động từ dữ liệu thực”**, chọn **“Ghi đè”** hoặc xem trước nội dung nháp được sinh ra.
*   Kiểm tra bài viết được tạo ra trong danh sách Bài viết, xem nội dung hiển thị ở các trang `/shipping`, `/about`... có chi tiết, định dạng đẹp mắt và đầy đủ thông tin hay không.

---

## VIII. Todo

- [ ] Trích xuất các trường cấu hình bổ sung (`contact_tax_id`, `contact_zalo`, `contact_messenger`, `social_facebook`) trong `buildDraftPayload`.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Giới thiệu (`about`) - chuẩn đa ngành, mang tính SaaS-ready.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Điều khoản (`terms`) - quy định độ tuổi tương ứng theo quy định pháp luật với sản phẩm kinh doanh.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Bảo mật (`privacy`) - chuẩn Nghị định 13/2023/NĐ-CP.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Đổi trả (`returnPolicy`) - đổi trả sản phẩm lỗi sản xuất, sai mẫu mã, hư hỏng vật lý khi giao hàng.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Vận chuyển (`shipping`) - đồng kiểm sản phẩm nguyên vẹn, số lượng, hỗ trợ vận chuyển an toàn.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang Thanh toán (`payment`) - hướng dẫn chuyển khoản ngân hàng và xuất hóa đơn VAT.
- [ ] Soạn thảo lại template nội dung chi tiết cho trang FAQ (`faq`) - giải đáp thắc mắc dịch vụ mua sắm TMĐT chung.
- [ ] Cập nhật định dạng HTML render cuối cùng để đảm bảo hiển thị sinh động và tối ưu SEO.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

1.  Hàm `buildDraftPayload` biên dịch không lỗi và hoạt động trơn tru.
2.  Nội dung của từng trang trong 7 trang chính sách có độ dài, chi tiết vượt trội so với phiên bản cũ (mỗi trang có tối thiểu 4-6 mục lớn rõ ràng).
3.  Thông tin liên hệ như Email, Hotline, Địa chỉ, Mã số thuế (nếu có), Zalo, Facebook phải được nhúng tự động một cách chính xác vào bài viết sinh ra dựa trên settings thật.
4.  Không chứa bất kỳ từ khóa đặc thù nào gắn cứng với một ngành hàng duy nhất (ví dụ: rượu vang, quần áo, v.v.), đảm bảo mọi shop TMĐT đều sử dụng được.
5.  Trang Vận chuyển và Đổi trả có các điều khoản đồng kiểm hàng và đổi trả lỗi sản phẩm nguyên bao bì hợp lý.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)

*   **Rủi ro**: Khi admin bấm nút "Ghi đè" bài viết tự động, nội dung cũ của các trang chính sách đã chỉnh sửa trước đó có thể bị thay thế hoàn toàn.
*   **Giảm thiểu**: Hệ thống đã có popup cảnh báo xác nhận trước khi ghi đè bài viết.
*   **Hoàn tác**: Revert commit sửa đổi file `convex/trustPages.ts`.

---

## XI. Out of Scope (Ngoài phạm vi)

*   Không thay đổi giao diện quản trị của màn hình `/admin/trust-pages` hay các route hiển thị chính sách ở frontend, chỉ tập trung nâng cấp chất lượng của nội dung văn bản được sinh ra.

---

## XII. Open Questions (Câu hỏi mở)

*   *Hiện tại, có nên thêm một danh mục tài khoản ngân hàng cụ thể của shop vào nội dung Thanh toán không?* -> Giải pháp: Chúng tôi sẽ tự động lấy thông tin từ các settings hiện có. Nếu admin chưa cấu hình thông tin ngân hàng cụ thể, chúng tôi sẽ sinh ra một phần ghi chú hướng dẫn khách hàng kiểm tra thông tin số tài khoản chính thức hiển thị tại trang checkout hoặc liên hệ trực tiếp hotline để đảm bảo an toàn giao dịch.

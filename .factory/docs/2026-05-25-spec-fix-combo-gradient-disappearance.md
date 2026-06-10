# I. Primer

## 1. TL;DR kiểu Feynman
Khi thẻ cha có nền dải màu và cắt chữ (`background-clip: text`), nếu các chữ cái bên trong là các thẻ con độc lập (`inline-block` để phục vụ nhảy chữ), trình duyệt Chrome sẽ bối rối và không biết vẽ dải màu lên đâu, khiến chữ bị biến mất hoàn toàn.
Giải pháp là ta gán dải màu trực tiếp lên từng chữ cái con. Nhưng để dải màu không bị co rúm trên từng chữ, ta phóng to dải màu ra gấp $N$ lần (với $N$ là tổng số chữ cái) và dịch chuyển vị trí dải màu của từng chữ cái theo vị trí của nó (chữ thứ $i$ sẽ dịch đi một khoảng tương ứng). Bằng cách này, khi xếp cạnh nhau, các chữ cái sẽ tự ghép lại thành một dải màu lớn trải dài liên tục và chuyển động nhảy mượt mà.

## 2. Elaboration & Self-Explanation
Cơ chế vẽ của trình duyệt (Browser Paint) xử lý `background-clip: text` ở cấp độ phần tử trực tiếp chứa văn bản (Direct Text Node). 
- Khi ta đặt `background-clip: text` trên thẻ cha nhưng văn bản lại nằm trong các thẻ con `inline-block`, trình duyệt coi thẻ cha không có text trực tiếp để clip nền, dẫn đến nền của cha bị ẩn đi và các con (nhận màu transparent kế thừa) cũng biến mất theo.
- Để khắc phục, ta bắt buộc phải gán `backgroundImage` và `backgroundClip` trực tiếp lên từng thẻ con `span`.
- Để tránh hiện tượng dải màu bị co rúm (lặp lại hoàn toàn trên mỗi chữ cái), ta áp dụng thuật toán phân đoạn nền:
  1. Đặt `backgroundSize = (N * 100)% 100%` (với $N$ là tổng số ký tự của từ).
  2. Đặt `backgroundPosition = (i / (N - 1 || 1)) * 100% 0` (với $i$ là vị trí index 0-indexed của ký tự đó).
- Thuật toán này giúp ký tự thứ $i$ chỉ hiển thị phân đoạn thứ $i$ của dải màu gradient lớn, khi xếp liền kề nhau sẽ tạo ra dải màu chuyển tiếp liên tục hoàn hảo trên cả từ.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể**:
    Giả sử chuỗi là `"Vui"` (3 ký tự: V, u, i). Ta muốn áp dụng dải màu Đỏ $\rightarrow$ Vàng $\rightarrow$ Xanh.
    - Ký tự `V` (index 0): `background-size: 300% 100%`, `background-position: 0% 0` (Hiển thị màu Đỏ).
    - Ký tự `u` (index 1): `background-size: 300% 100%`, `background-position: 50% 0` (Hiển thị màu Vàng).
    - Ký tự `i` (index 2): `background-size: 300% 100%`, `background-position: 100% 0` (Hiển thị màu Xanh).
    Kết quả: Từ "Vui" chuyển sắc từ Đỏ sang Vàng sang Xanh liên tục, và mỗi chữ cái đều tự render an toàn.
*   **Hình ảnh ẩn dụ**: Hãy tưởng tượng một bức tranh Panorama dài. Thay vì bắt mỗi người thợ cầm một phiên bản thu nhỏ của bức tranh (gây lặp hình), ta cắt bức tranh lớn đó ra thành $N$ mảnh. Người thợ thứ nhất cầm mảnh đầu, người thứ hai cầm mảnh giữa, người cuối cùng cầm mảnh cuối. Khi họ đứng xếp hàng cạnh nhau, người xem vẫn nhìn thấy bức tranh Panorama trọn vẹn và liền mạch.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Triệu chứng**: Chữ "Combo trọn bộ" (kiểu wave) bị biến mất hoàn toàn ngoài site thực tế và preview sau khi chuyển background-clip lên thẻ cha.
*   **Phạm vi**: 
    - [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc**: Chrome không render được `background-clip: text` trên container cha khi các con là các node inline-block độc lập.
*   **Giả thuyết đối chứng**: Việc tính toán phân đoạn `background-size`/`background-position` trực tiếp trên các thẻ con sẽ hiển thị chính xác dải màu trải đều mà không bị biến mất chữ.

# IV. Proposal (Đề xuất)
Cập nhật hàm `renderEffectText` ở cả hai tệp `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`:
1. Nhận diện trạng thái `isGradient` và các màu sắc từ `applyEffectColor`.
2. Duyệt qua mảng ký tự `Array.from(text).map((char, index, arr) => { ... })`.
3. Tính toán động `backgroundSize` và `backgroundPosition` cho từng ký tự dựa trên tổng số ký tự.
4. Gán trực tiếp style dải màu và clip lên từng ký tự con.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - Cập nhật biến trạng thái `applyEffectColor` trả về cấu hình màu sắc.
    - Cập nhật hàm `renderEffectText` áp dụng thuật toán phân đoạn gradient.
*   **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
    - Đồng bộ logic tương tự.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc vùng mã chứa `applyEffectColor` và `renderEffectText` ở cả hai file.
2. Thực hiện sửa đổi.
3. Chạy lệnh kiểm tra TypeScript `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit`.
*   **Kiểm tra thủ công**: Người dùng kiểm tra trang chi tiết sản phẩm và preview để xác nhận chữ "Combo trọn bộ" xuất hiện trở lại với dải màu gradient mượt mà trải đều.

# VIII. Todo
- [ ] Chỉnh sửa hàm `applyEffectColor` và `renderEffectText` trong `ProductDetailPage.tsx`.
- [ ] Chỉnh sửa hàm `applyEffectColor` và `renderEffectText` trong `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm thử biên dịch TypeScript tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Chữ combo trọn bộ hiển thị sắc nét, không bị biến mất.
- Dải màu gradient của chữ chuyển dịch mịn màng từ đầu đến cuối từ.
- Biên dịch thành công.

# I. Primer

## 1. TL;DR kiểu Feynman
Khi viết chữ nhảy có dải màu gradient, nếu ta gán dải màu lên từng chữ cái riêng biệt (ví dụ chữ "C", "o", "m"...), mỗi chữ cái sẽ tự bóp méo dải màu đó trong không gian cực nhỏ của nó, làm cho cả từ trông loang lổ và rối rắm.
Giải pháp là ta gán dải màu gradient lên **thẻ cha** bao quanh toàn bộ từ. Các chữ cái con bên trong chỉ thực hiện nhiệm vụ nhảy lên nhảy xuống và kế thừa màu nền trong suốt từ cha. Bằng cách này, cả từ sẽ tạo thành một dải màu mịn màng trải dài từ đầu đến cuối, chuyển động đồng bộ và cực kỳ sang trọng. Đồng thời, các dải màu gradient 1, 2, 3 cũ sẽ được nâng cấp thành các phối màu hiện đại giống phong cách của Apple và Stripe.

## 2. Elaboration & Self-Explanation
Hiện tượng chữ loang lổ khi dùng hiệu ứng "Chữ nhảy tuần tự" (`letter-wave`) xuất phát từ việc gán đè `...titleEffectStyle` vào từng thẻ `span` con:
- `titleEffectStyle` chứa dải màu nền `linear-gradient(90deg, ...)` và thuộc tính cắt văn bản `backgroundClip: 'text'`.
- Khi gán style này vào từng thẻ con bọc chữ cái đơn lẻ, trình duyệt sẽ vẽ một dải màu gradient 90 độ riêng cho từng chữ cái đó thay vì trải dọc toàn bộ từ.
- Để khắc phục, ta chỉ áp dụng `titleEffectStyle` lên thẻ cha làm nhiệm vụ định hình màu sắc nền và cắt chữ. Các thẻ con chỉ cần thuộc tính `animationDelay` để tạo độ trễ nhảy và đặt thuộc tính hiển thị `display: 'inline-block'` để có thể áp dụng chuyển dịch `transform` trong CSS keyframes.

Các dải màu gradient cũng được tinh chỉnh lại theo các best practices:
- **Gradient 1 (Mặc định)**: Chuyển màu từ Hồng Neon sang Tím Hoàng gia và Xanh ngọc để tạo hiệu ứng cực quang hiện đại.
- **Gradient 2**: Chuyển màu từ Vàng đồng metallic sang Vàng kem sang trọng, thích hợp cho các sản phẩm luxury.
- **Gradient 3**: Chuyển màu từ Xanh ngọc lam sang Xanh đại dương và Tím mịn để mang lại cảm giác công nghệ sạch sẽ.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể**:
    - *Sai*:
      ```tsx
      <span className="inline-flex">
        {['C', 'o', 'm', 'b', 'o'].map(char => (
          <span style={{ backgroundImage: 'linear-gradient(...)', backgroundClip: 'text' }}>{char}</span>
        ))}
      </span>
      ```
    - *Đúng*:
      ```tsx
      <span style={{ backgroundImage: 'linear-gradient(...)', backgroundClip: 'text', color: 'transparent' }} className="inline-flex">
        {['C', 'o', 'm', 'b', 'o'].map(char => (
          <span style={{ display: 'inline-block' }}>{char}</span>
        ))}
      </span>
      ```
*   **Hình ảnh ẩn dụ**: Hãy tưởng tượng một bức tranh lớn vẽ cầu vồng. Nếu bạn cắt bức tranh ra thành từng mảnh nhỏ rồi bắt mỗi mảnh nhỏ tự vẽ lại một cầu vồng thu nhỏ bên trong nó, tổng thể sẽ cực kỳ rối rắm. Ngược lại, nếu bạn giữ nguyên bức tranh cầu vồng lớn ở phía sau (thẻ cha) và chỉ dùng các ô cửa sổ nhỏ chuyển động (thẻ con) để hé lộ bức tranh đó, bạn sẽ thấy màu sắc chuyển tiếp liên tục và hài hòa.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Triệu chứng**: Chữ trong hiệu ứng "Chữ nhảy tuần tự" bị loang lổ nhiều màu trên từng ký tự đơn lẻ. Các mã màu gradient cũ có độ tương phản gắt, tạo cảm giác rẻ tiền.
*   **Phạm vi**: 
    - [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc**: Loop `Array.from(text).map` gán đè `...titleEffectStyle` chứa thông tin background gradient lên từng chữ cái đơn lẻ.
*   **Giả thuyết đối chứng**: Việc chuyển `titleEffectStyle` lên thẻ cha và chỉ giữ lại `animationDelay` trên thẻ con sẽ tạo ra một dải màu liền mạch.

# IV. Proposal (Đề xuất)
1.  **Cải tiến Gradient 1, 2, 3**:
    - **Gradient 1 (Cyberpunk Aurora)**: `#ff007a` $\rightarrow$ `#7928ca` $\rightarrow$ `#00dfd8`.
    - **Gradient 2 (Luxury Gold)**: `#bf953f` $\rightarrow$ `#fcf6ba` $\rightarrow$ `#b38728` $\rightarrow$ `#fbf5b7` $\rightarrow$ `#aa771c`.
    - **Gradient 3 (Deep Sea Cyan)**: `#00c6ff` $\rightarrow$ `#0072ff` $\rightarrow$ `#7928ca`.
2.  **Sắp xếp cấu trúc thẻ trong renderEffectText**:
    - Gán `style={titleEffectStyle}` lên thẻ cha.
    - Thẻ con chỉ nhận `animationDelay` và `display: 'inline-block'`.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa**: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
    - Cập nhật hàm `applyEffectColor` và hàm `renderEffectText`.
*   **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
    - Thực hiện cập nhật tương tự cho preview.

# VI. Execution Preview (Xem trước thực thi)
1. Thực hiện chỉnh sửa mã nguồn cho cả hai tệp.
2. Kiểm tra biên dịch tĩnh `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit`.
*   **Kiểm tra thủ công**: Quan sát chữ combo trọn bộ ngoài site thực xem dải màu có trải đều toàn bộ chữ và chuyển động nhảy mượt mà hay không.

# VIII. Todo
- [ ] Cập nhật phối màu gradient mới và cấu trúc CSS chữ nhảy trong `ProductDetailPage.tsx`.
- [ ] Cập nhật phối màu gradient mới và cấu trúc CSS chữ nhảy trong `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm tra TypeScript tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Chữ nhảy tuần tự hiển thị dải màu chuyển tiếp mịn màng trải dài từ ký tự đầu tiên đến ký tự cuối cùng của chuỗi văn bản.
- Màu sắc gradient 1, 2, 3 trông hiện đại, tinh tế.
- Biên dịch TypeScript thành công.

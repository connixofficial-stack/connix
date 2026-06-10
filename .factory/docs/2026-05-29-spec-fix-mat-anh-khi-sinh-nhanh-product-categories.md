# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn nhấn nút "sinh nhanh" danh mục sản phẩm, hệ thống sẽ tự động quét các sản phẩm thật trong cơ sở dữ liệu để tìm ra một sản phẩm tiêu biểu có ảnh cho mỗi danh mục, sau đó gắn ID sản phẩm đó làm ảnh đại diện cho danh mục.
Tuy nhiên, khi hiển thị (ở cả trang quản trị và trang chủ), hệ thống chỉ tải danh sách 100 sản phẩm mới nhất để tìm ảnh. Nếu danh mục của bạn sử dụng một sản phẩm cũ hơn (nằm ngoài danh sách 100 sản phẩm mới nhất này), hệ thống sẽ không tìm thấy ảnh của sản phẩm đó và đành phải hiển thị một chiếc hộp rỗng.
Để sửa lỗi này, chúng ta sẽ viết thêm một đoạn logic: gom tất cả các ID sản phẩm được dùng làm ảnh đại diện lại, và gửi một yêu cầu riêng đến cơ sở dữ liệu để lấy chính xác ảnh của các sản phẩm này. Bằng cách đó, dù sản phẩm có cũ thế nào đi nữa, chúng ta vẫn luôn lấy được ảnh của nó.

## 2. Elaboration & Self-Explanation
Chức năng "Sinh nhanh" (`Quick Generate`) hoạt động bằng cách gọi Convex query `api.productCategories.listActiveAutoFillCandidates` lấy ra các danh mục hợp lệ cùng một sản phẩm tiêu biểu có ảnh (`representativeProductId`). Chức năng này tạo cấu hình danh mục với `imageMode: 'product-image'` và `customImage: 'product:<productId>'`.
Tuy nhiên, cả màn hình xem trước (`ProductCategoriesPreview.tsx`) và trang chủ thực tế (`ComponentRenderer.tsx` - hàm `ProductCategoriesSection`) đều lấy ảnh sản phẩm thông qua việc map từ `productsData` được tải bởi query `api.products.listPublicResolved` (vốn có giới hạn mặc định là 100 sản phẩm mới nhất).
Khi số lượng danh mục lớn (như trường hợp 45 danh mục của người dùng) hoặc khi các sản phẩm tiêu biểu là sản phẩm cũ hơn, chúng nằm ngoài danh sách 100 sản phẩm Active mới nhất này. Dẫn đến `productImageMap[productId]` trả về `undefined`, ảnh danh mục không tải được và hiển thị icon mặc định (hộp quà trống).

Giải pháp xử lý tận gốc vấn đề này là:
1. Thu thập tất cả các ID sản phẩm (`productId`) được chọn làm ảnh đại diện từ cấu hình danh mục.
2. Sử dụng query có sẵn `api.products.listByIds` để tải chính xác thông tin (bao gồm ảnh) của những sản phẩm này từ database.
3. Cập nhật `productImageMap` để bổ sung hoặc thay thế bằng bản đồ ảnh từ các sản phẩm được tải theo ID này. Điều này đảm bảo 100% các sản phẩm được cấu hình làm ảnh đại diện sẽ có ảnh hiển thị đúng, bất kể giới hạn của danh sách sản phẩm Active mới nhất.

## 3. Concrete Examples & Analogies
*Ví dụ cụ thể:*
Giả sử bạn có danh mục "Air Force 1" có sản phẩm tiêu biểu là giày "Air Force 1 All White" (ID: `prod_abc123`).
Nhưng cửa hàng của bạn có tới 150 sản phẩm mới được đăng sau đôi giày này.
Khi trang chủ tải, nó chỉ lấy 100 sản phẩm mới nhất. Vì đôi giày "Air Force 1 All White" đứng thứ 151 nên nó không được tải lên.
Hệ thống tìm trong danh sách 100 đôi giày được tải lên xem có đôi nào có ID là `prod_abc123` không. Kết quả là không thấy, và danh mục "Air Force 1" bị mất ảnh đại diện.
*Giải pháp của chúng ta:* Chúng ta nhìn thẳng vào ID `prod_abc123` và gửi một yêu cầu: "Hãy cho tôi thông tin của riêng sản phẩm `prod_abc123`". Database trả về ảnh của đôi giày đó ngay lập tức, và danh mục hiển thị ảnh chuẩn xác.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra mã nguồn tại các tệp tin sau:
1. **`app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`**:
   - Dòng 59: Gọi `useQuery(api.products.listPublicResolved, { limit: 100 })`.
   - Dòng 67: Khởi tạo `productImageMap` chỉ dựa vào 100 sản phẩm tải về này.
   - Dòng 108: `displayImage = productImageMap[productId]?.image ?? cat.image` -> Dẫn đến lỗi mất ảnh nếu sản phẩm nằm ngoài top 100.
2. **`components/site/ComponentRenderer.tsx`**:
   - Dòng 3571: Gọi `useQuery(api.products.listPublicResolved, {})` (mặc định lấy 100 sản phẩm).
   - Dòng 3592: Khởi tạo `productImageMap` chỉ từ 100 sản phẩm này.
   - Dòng 3636: `displayImage = productImageMap[productId] ?? cat.image` -> Gặp lỗi tương tự trang preview khi chạy trên site thật.

**Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High.**
Nguyên nhân gốc đã được xác định rõ ràng qua phân tích logic mã nguồn và hoàn toàn khớp với triệu chứng người dùng mô tả (sinh số lượng lớn danh mục thì bị lỗi mất ảnh đại diện).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Sự phụ thuộc của logic hiển thị ảnh danh mục (`imageMode === 'product-image'`) vào query danh sách sản phẩm Active bị giới hạn số lượng (`limit: 100`).
- **Giả thuyết đối chứng:** Nếu do lỗi từ phía API Sinh nhanh không lấy được sản phẩm tiêu biểu, thì khi tạo danh mục, trường `customImage` sẽ trống hoặc không có dạng `product:<productId>`. Tuy nhiên, người dùng xác nhận đã chọn ảnh thumbnail một sản phẩm trong danh mục rồi, và trong API `listActiveAutoFillCandidates` cũng bắt buộc phải có `representativeProductId` mới tạo candidate. Vì vậy giả thuyết đối chứng này bị loại trừ. Lỗi chắc chắn nằm ở khâu hiển thị (Preview và Site Render) không tìm thấy ảnh của ID sản phẩm đó do giới hạn tải sản phẩm.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ sửa đổi logic hiển thị ở cả trang Preview và Site thật để lấy ảnh sản phẩm một cách thông minh và tối ưu hơn:
1. Trích xuất danh sách tất cả các ID sản phẩm từ cấu hình danh mục.
2. Gọi Convex query `api.products.listByIds` để lấy thông tin các sản phẩm này.
3. Hợp nhất ảnh của các sản phẩm lấy theo ID này vào `productImageMap` để luôn có đầy đủ ảnh.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Quản trị (Admin Interface)
#### [MODIFY] [ProductCategoriesPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx)
- Sửa đổi logic tạo `productImageMap` bằng cách thu thập ID sản phẩm và query trực tiếp thông qua `api.products.listByIds`.

### Site hiển thị (Site Interface)
#### [MODIFY] [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
- Thực hiện sửa đổi tương tự trong hàm `ProductCategoriesSection` để đảm bảo trang chủ hiển thị chính xác ảnh danh mục sản phẩm sau khi lưu.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và phân tích kỹ lưỡng cấu trúc dữ liệu:** Đã hoàn thành.
2. **Chỉnh sửa `ProductCategoriesPreview.tsx`**:
   - Gom các `productId` từ `uniqueCategories`.
   - Gọi `useQuery(api.products.listByIds, { ids: targetProductIds })`.
   - Cập nhật `productImageMap` để map ID sản phẩm sang ảnh lấy từ kết quả query `listByIds`.
3. **Chỉnh sửa `ComponentRenderer.tsx`**:
   - Thực hiện tương tự cho hàm `ProductCategoriesSection`.
4. **Đánh giá tĩnh (Static Review)**: Đảm bảo không lỗi kiểu dữ liệu (TypeScript) và không gây crash UI khi dữ liệu query chưa sẵn sàng (loading state).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests / Type Check
- Chạy kiểm tra kiểu dữ liệu TypeScript thủ công (nếu cần thiết) bằng cách rà soát kỹ lưỡng các tham số truyền vào query.

### Manual Verification
- Hướng dẫn người dùng hoặc kiểm thử viên:
  1. Truy cập trang `/admin/home-components/create/product-categories`.
  2. Click nút "Sinh nhanh" danh mục sản phẩm.
  3. Kiểm tra xem các danh mục được tạo ra có hiển thị đầy đủ ảnh đại diện từ các sản phẩm tiêu biểu tương ứng hay không (không còn bị hiện icon hộp quà rỗng).
  4. Lưu component lại và truy cập trang chủ để xác minh ngoài trang chủ cũng hiển thị đầy đủ ảnh danh mục sản phẩm.

---

# VIII. Todo

- [ ] Thu thập ID sản phẩm tiêu biểu trong `ProductCategoriesPreview.tsx`.
- [ ] Gọi query `api.products.listByIds` và cập nhật `productImageMap` trong `ProductCategoriesPreview.tsx`.
- [ ] Thu thập ID sản phẩm tiêu biểu trong `ComponentRenderer.tsx` (`ProductCategoriesSection`).
- [ ] Gọi query `api.products.listByIds` và cập nhật `productImageMap` trong `ComponentRenderer.tsx`.
- [ ] Đánh giá tĩnh toàn bộ thay đổi để đảm bảo tính an toàn.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả danh mục được tạo qua chức năng "Sinh nhanh" hoặc chọn thủ công "Ảnh từ sản phẩm" đều phải hiển thị đúng ảnh của sản phẩm tiêu biểu đó.
- Không còn hiện tượng các danh mục bị hiển thị icon hộp quà mặc định do sản phẩm tiêu biểu không nằm trong top 100 sản phẩm mới nhất.
- Giao diện Admin Preview và ngoài Site thật hoạt động đồng bộ và chính xác.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Khi Convex đang tải (`loading`), query `listByIds` có thể trả về `undefined`. Chúng ta đã xử lý an toàn bằng cách sử dụng fallback sang ảnh gốc của danh mục `cat.image` hoặc hiển thị ảnh khi dữ liệu đã tải xong (`data !== undefined`).
- **Hoàn tác:** Khôi phục các tệp tin `ProductCategoriesPreview.tsx` và `ComponentRenderer.tsx` về phiên bản cũ thông qua Git.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi logic đếm số lượng sản phẩm của danh mục (`productCountMap`), vì số lượng này chỉ mang tính tham khảo nhanh ở preview/site và không gây ảnh hưởng nghiêm trọng đến trải nghiệm người dùng như việc mất ảnh đại diện.
- Không thay đổi cách thức lưu trữ hay cấu hình cơ sở dữ liệu của Convex.

# I. Primer
## 1. TL;DR kiểu Feynman
- **Vấn đề:** Cần mang hệ thống phân loại sản phẩm (Product Types & Attribute Groups) từ một dự án Laravel cũ sang hệ thống Next.js + Convex hiện tại.
- **Giải pháp:** Tạo 5 bảng mới trong Convex tương đương với Laravel (Types, Groups, Terms và 2 bảng pivot). Thêm một toggle "Bật hệ thống Phân loại & Thuộc tính" trong cấu hình module sản phẩm.
- **Giới hạn MVP:** Chỉ tập trung vào hiển thị và bộ lọc (filter), tách biệt hoàn toàn với hệ thống "Phiên bản (Variants)", hoạt động tốt trong chế độ "Mua qua liên hệ".

## 2. Elaboration & Self-Explanation
Hệ thống Laravel cũ (`wincellarClone`) sử dụng một mô hình E-commerce nâng cao để phân loại hàng hóa:
- **Product Type (Loại Sản Phẩm):** Xác định "loại hình" sản phẩm (VD: Rượu Vang, Phụ kiện).
- **Attribute Group (Nhóm Thuộc Tính):** Các nhóm thuộc tính dùng để lọc (VD: Quốc gia, Giống Nho).
- **Term (Thuật Ngữ/Giá Trị):** Các giá trị cụ thể (VD: Pháp, Merlot).

Sự liên kết linh hoạt giúp một loại sản phẩm chỉ hiển thị các bộ lọc phù hợp với nó. Việc mang logic này sang Convex đòi hỏi chúng ta tạo cấu trúc schema tương đồng để giữ nguyên sức mạnh của bộ lọc động, đồng thời thêm cơ chế Feature Flag ở module config để bật/tắt toàn bộ tính năng này. Vì yêu cầu MVP tập trung vào chế độ "không dùng phiên bản", ta sẽ không đụng chạm tới hệ thống Variant phức tạp mà chỉ gắn thẳng Term vào Product.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế:** Một cửa hàng bán cả "Rượu Vang" và "Xì Gà". Khi khách chọn danh mục Rượu Vang, bộ lọc bên trái hiện "Giống nho", "Niên vụ". Khi khách chọn Xì Gà, bộ lọc hiện "Độ nặng", "Kích thước". Hệ thống mới này sẽ đáp ứng chính xác trải nghiệm đó.
- **Analogy (Phép loại suy):** Hãy tưởng tượng `Product Type` là một "Hộp công cụ" rỗng, `Attribute Group` là các "Ngăn kéo", và `Term` là các "Dụng cụ" bên trong. Bạn tự do quyết định Hộp nào có Ngăn kéo nào, và gán dụng cụ tương ứng cho từng sản phẩm.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Schema Convex hiện tại:** Đang có bảng `products`, `productCategories`, `productOptions` (dành cho variants). Chưa có khái niệm Product Types hay Global Attributes độc lập với Variants.
- **Toggle Module:** Cấu trúc bật/tắt feature đã hoàn thiện trong `products.config.ts` (như `enableCombos`). Thêm toggle mới rất dễ.
- **Codebase Laravel:** Được thiết kế chuẩn với 3 model chính (`ProductType`, `CatalogAttributeGroup`, `CatalogTerm`) và 2 bảng pivot (`catalog_attribute_group_product_type`, `product_term_assignments`).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Độ tin cậy: High (Cao).** 
- **Lý do:** Do yêu cầu là bổ sung feature mới dựa trên spec có sẵn từ dự án khác, không phải sửa bug, nên hướng đi hoàn toàn rõ ràng. Convex hỗ trợ tốt NoSQL relations qua việc dùng bảng trung gian (pivot) tương tự SQL.

# IV. Proposal (Đề xuất)
Để triển khai hệ thống phân loại này, có 2 lựa chọn (Option) về mặt Schema trong Convex:

**Option 1 (Recommend) — Confidence 95%**
- **Mô tả:** Giữ nguyên thiết kế 5 bảng như Laravel. (1) `productTypes`, (2) `attributeGroups`, (3) `attributeTerms`, (4) `productTypeAttributeGroups` (pivot), (5) `productAttributeTerms` (pivot). Thêm field `productTypeId` vào bảng `products`.
- **Ưu điểm:** Khớp 100% với logic cũ, cực kỳ dễ scale, các tính năng lọc nhiều chiều (faceted search) dễ thực hiện bằng cách index trên bảng pivot.
- **Nhược điểm:** Tốn thêm 5 bảng trong tổng quota bảng của dự án Convex.

**Option 2 — Confidence 75%**
- **Mô tả:** Gom các mảng liên kết thẳng vào trong Document thay vì tạo bảng Pivot. Bảng `products` sẽ có field `termIds: v.array(v.id("attributeTerms"))`. Bảng `productTypes` sẽ có `attributeGroupIds: v.array(v.id("attributeGroups"))`.
- **Ưu điểm:** Giảm số lượng bảng, query nhanh hơn cho một số thao tác đọc đơn giản.
- **Nhược điểm:** Khi cần query ngược (tìm tất cả sản phẩm có `termId = X`), Convex index mảng `v.array` chưa được tối ưu bằng index trên một bảng join cụ thể. Khó scale nếu metadata trên liên kết phức tạp.

**Quyết định:** Chờ User chọn Option.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `convex/schema.ts`: **Sửa:** Bổ sung bảng mới cho hệ thống Attribute & Type. Thêm `productTypeId` vào bảng `products`.
- `lib/modules/configs/products.config.ts`: **Sửa:** Bổ sung tính năng `enableProductTypes` vào cấu hình Module Sản phẩm.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật file `schema.ts` với các bảng mới.
2. Sửa cấu trúc dữ liệu bảng `products` trong `schema.ts` để link với `productTypes`.
3. Mở `products.config.ts`, khai báo config toggle `enableProductTypes`.
4. Chạy `bunx tsc --noEmit` để verify TypeScript không bị lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy lệnh `bunx tsc --noEmit` để đảm bảo file schema và config hợp lệ theo chuẩn TypeScript.
- Dùng `npx convex dev` kiểm tra Convex có apply schema thành công hay không.

# VIII. Todo
- [ ] Chờ User chọn Option (1 hoặc 2).
- [ ] Cập nhật file schema `convex/schema.ts`.
- [ ] Thêm toggle config `enableProductTypes` vào `products.config.ts`.
- [ ] Xác minh kết quả typecheck.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Schema Convex chứa đủ bảng và trường phục vụ tính năng Phân loại (Product Types & Attributes).
- Module config tại `system_thanshoes` cho phép bật tắt tính năng này mà không crash hệ thống.
- Các tính năng MVP không phá vỡ cấu trúc "Phiên bản" (Variants) có sẵn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Các truy vấn liên quan đến sản phẩm hiện tại có thể bị thiếu dữ liệu hoặc cần điều chỉnh UI (front-end) để tương thích. Nếu ẩn phía sau toggle (enabled: false), rủi ro ở runtime là 0%.
- **Hoàn tác:** Xóa các bảng mới khỏi `schema.ts` và gỡ cấu hình toggle.

# XI. Out of Scope (Ngoài phạm vi)
- UI/UX phần Admin: Không làm màn hình CRUD cho các bảng này trong phạm vi task MVP này.
- Logic giỏ hàng / Variants nâng cao: Phù hợp tiêu chí "bán qua liên hệ" MVP.

# XII. Open Questions (Câu hỏi mở)
- Chờ User quyết định Option 1 hay Option 2.
- Có cần tạo query/mutation CRUD ngay bây giờ không?

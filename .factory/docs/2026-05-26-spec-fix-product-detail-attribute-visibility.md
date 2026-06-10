# Spec: Sửa lỗi hiển thị thuộc tính ở trang chi tiết sản phẩm khi tắt hệ thống Phân loại & Thuộc tính

# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Khi bạn tắt công tắc "Bật hệ thống Phân loại & Thuộc tính" ở trang quản lý module, khách hàng vẫn nhìn thấy các thuộc tính (ví dụ: Yamazaki, Thùng gỗ sồi...) ở trang chi tiết sản phẩm và card sản phẩm.
- **Nguyên nhân:** Component hiển thị nhãn thuộc tính (`ProductAttributesBadges`) chưa kiểm tra giá trị của công tắc này trước khi vẽ ra giao diện. Thêm vào đó, trang chi tiết sản phẩm vẫn tải dữ liệu thuộc tính từ cơ sở dữ liệu (Database) kể cả khi tính năng này bị tắt.
- **Cách sửa:**
  - Cập nhật component `ProductAttributesBadges` để ẩn đi ngay lập tức (trả về `null`) nếu công tắc tắt.
  - Cập nhật trang chi tiết sản phẩm để bỏ qua (skip) việc tải dữ liệu thuộc tính khi công tắc tắt để đỡ tốn tài nguyên hệ thống.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại có một cấu hình tắt/bật toàn cục cho tính năng Phân loại & Thuộc tính sản phẩm (`enableProductTypes`). Khi admin tắt cấu hình này, mong muốn là toàn bộ hệ thống storefront sẽ hoạt động như một trang bán hàng truyền thống (chỉ có danh mục sản phẩm đơn giản, không có các tag thuộc tính như quốc gia, hương vị, nấc giá...).
Tuy nhiên, trong code hiện tại:
- `ProductAttributesBadges` (nằm ở `app/(site)/_components/products/ProductsPage.tsx`) chỉ kiểm tra xem danh sách thuộc tính truyền vào có rỗng không chứ chưa kiểm tra xem toggle cấu hình `enableProductTypes` đang tắt hay bật để ẩn bản thân nó đi.
- `ProductDetailPage` (nằm ở `app/(site)/_components/details/ProductDetailPage.tsx`) vẫn thực hiện truy vấn `api.attributeTerms.getTermsForProducts` lấy thuộc tính về và truyền vào layout rendering mặc dù tính năng này đã bị tắt ở cấu hình module.

Giải pháp là chúng ta sẽ can thiệp vào cả 2 tệp trên để đồng bộ hóa hoạt động hiển thị theo trạng thái cấu hình của hệ thống.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi tắt toggle "Bật hệ thống Phân loại & Thuộc tính" tại `/system/modules/products`, truy cập trang chi tiết sản phẩm rượu `/single-mall/ruou-yamazaki-12-year-old-single-malt-whisky-nhat-ban-700ml` sẽ không còn thấy các thẻ nhãn `Yamazaki`, `Thùng gỗ sồi...`, `Vani...` dưới giá tiền nữa.
- **Phép so sánh đời thực:** Nó giống như việc bạn tắt cầu dao tổng của hệ thống đèn trang trí trong nhà, nhưng các bóng đèn nhỏ ở góc phòng vẫn sáng vì dây điện của chúng được đấu nối trực tiếp mà không đi qua cầu dao tổng. Chúng ta cần nối lại dây điện của các bóng đèn đó đi qua cầu dao tổng để khi tắt cầu dao tổng, toàn bộ đèn trang trí đều tắt.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Các file đã kiểm tra:**
  - [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx): Định nghĩa component `ProductAttributesBadges` đang vẽ các nhãn thuộc tính cho cả trang danh sách sản phẩm và chi tiết sản phẩm. Phát hiện thiếu điều kiện chặn render khi `enableProductTypes === false`.
  - [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx): Quản lý luồng tải dữ liệu thuộc tính của sản phẩm hiện tại. Chưa tối ưu hóa việc bỏ qua query tải dữ liệu khi tính năng bị tắt.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc (Root Cause):**
  - Component `ProductAttributesBadges` trong [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx#L1640) thiếu điều kiện kiểm tra `enableProductTypes` trước khi hiển thị.
  - Tệp [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx#L622) thiếu kiểm tra cấu hình toggle khi gọi query `api.attributeTerms.getTermsForProducts`, dẫn đến việc dữ liệu thuộc tính luôn được tải và lưu vào `productAttributesMap`, làm cho component con render ra các thuộc tính này bất chấp cấu hình tắt.
- **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu chỉ ẩn ở UI mà không tối ưu skip query ở `ProductDetailPage`, giao diện vẫn sẽ hoạt động đúng (không hiển thị thuộc tính), nhưng hệ thống sẽ lãng phí tài nguyên mạng và băng thông Convex khi vẫn tải dữ liệu thuộc tính không dùng tới. Do đó, việc sửa đổi cả hai mặt (UI & DB query) là giải pháp tối ưu và triệt để nhất.
- **Độ tin cậy nguyên nhân gốc:** High (Vì code hiển thị và code truy vấn hiển thị rõ ràng sự thiếu sót điều kiện logic này).

# IV. Proposal (Đề xuất)

Chúng ta sẽ thực hiện 2 thay đổi chính sau:
- **Thay đổi 1 (Tối ưu truy vấn ở trang chi tiết sản phẩm):**
  - Trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx):
    - Đọc cấu hình toggle `enableProductTypes` bằng `useQuery(api.admin.modules.getModuleSetting, ...)`.
    - Sử dụng giá trị cấu hình này để quyết định có chạy query `api.attributeTerms.getTermsForProducts` hay không. Nếu toggle tắt, dùng `'skip'`.
- **Thay đổi 2 (Ẩn UI thuộc tính ở component Badge chung):**
  - Trong [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx):
    - Trong component `ProductAttributesBadges`, thêm kiểm tra: `if (!enableProductTypes || !productAttributesMap) return null;` để ẩn toàn bộ badge thuộc tính khi tính năng bị tắt.

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI & Core logic
- [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
  - *Sửa:* Thêm query lấy cấu hình toggle `enableProductTypes` và cập nhật điều kiện skip cho query `getTermsForProducts`.
- [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  - *Sửa:* Thêm kiểm tra điều kiện `enableProductTypes` ở đầu component `ProductAttributesBadges` để chặn việc hiển thị thuộc tính khi tắt tính năng.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx):
   - Thêm câu lệnh useQuery lấy setting `enableProductTypes` từ module `products`.
   - Cập nhật tham số query của `api.attributeTerms.getTermsForProducts` để sử dụng biến `enableProductTypes` mới lấy được.
2. Đọc và chỉnh sửa [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx):
   - Chèn điều kiện chặn render trong component `ProductAttributesBadges` ngay sau khi lấy được trạng thái của `enableProductTypes` từ Convex.
3. Chạy kiểm tra kiểu tĩnh (Static analysis) bằng lệnh `bunx tsc --noEmit` để đảm bảo code không có lỗi TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tự động (TypeScript Check)
- Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để verify TypeScript biên dịch thành công mà không có lỗi.

### Kiểm chứng thủ công (Tester hoặc User thực hiện trên môi trường chạy thử)
- Bước 1: Truy cập trang quản lý module `http://localhost:3000/system/modules/products`.
- Bước 2: Tắt cấu hình "Bật hệ thống Phân loại & Thuộc tính" rồi lưu lại.
- Bước 3: Truy cập một trang chi tiết sản phẩm cụ thể (ví dụ: `/single-mall/ruou-yamazaki-12-year-old-single-malt-whisky-nhat-ban-700ml`).
- Bước 4: Kiểm tra phần dưới tên và giá sản phẩm: Các nhãn thuộc tính (Yamazaki, Thùng gỗ sồi...) phải biến mất hoàn toàn.
- Bước 5: Truy cập trang danh sách sản phẩm `/products` và kiểm tra xem các nhãn thuộc tính trên các card sản phẩm có bị ẩn hoàn toàn hay không.
- Bước 6: Bật lại cấu hình "Bật hệ thống Phân loại & Thuộc tính" và kiểm tra xem thuộc tính có hiển thị lại bình thường ở cả trang danh sách sản phẩm và chi tiết sản phẩm hay không.

# VIII. Todo

- [ ] Lấy giá trị toggle `enableProductTypes` trong `ProductDetailPage.tsx`.
- [ ] Cập nhật skip query `getTermsForProducts` trong `ProductDetailPage.tsx` nếu toggle tắt.
- [ ] Thêm điều kiện chặn render thuộc tính trong component `ProductAttributesBadges` của `ProductsPage.tsx` khi toggle tắt.
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- **Khi tắt toggle "Bật hệ thống Phân loại & Thuộc tính":**
  - Trang chi tiết sản phẩm không hiển thị bất kỳ nhãn thuộc tính nào.
  - Các card sản phẩm ở trang danh sách cũng không hiển thị bất kỳ nhãn thuộc tính nào.
  - Không có request/query dữ liệu thuộc tính thừa gửi lên Convex backend từ trang chi tiết sản phẩm.
- **Khi bật toggle "Bật hệ thống Phân loại & Thuộc tính":**
  - Mọi thuộc tính hiển thị chính xác như trước, không bị lỗi hiển thị hay định tuyến.
- **TypeScript compile:** Pass (không lỗi type).

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Rất thấp vì đây là thay đổi logic giao diện và tối ưu hóa câu truy vấn hiển thị ở storefront, không đụng tới schema database hay dữ liệu sản phẩm.
- **Cách rollback:** Sử dụng `git checkout -- <file>` để đưa 2 tệp tin bị ảnh hưởng về trạng thái ban đầu.

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi bất kỳ logic lọc sản phẩm nào ở trang danh sách.
- Không sửa đổi cấu hình UI/UX của module Admin hay thay đổi schema Convex.

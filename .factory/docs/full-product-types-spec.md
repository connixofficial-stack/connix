# I. Primer
## 1. TL;DR kiểu Feynman
- **Mục tiêu:** Xây dựng giao diện (UI) và logic hoàn chỉnh cho hệ thống Phân loại (Product Types & Attributes) từ Admin đến Storefront.
- **Giải pháp:** (1) Xây dựng API (CRUD) trên Convex. (2) Tạo 2 màn hình quản lý `/admin/product-types` và `/admin/attribute-groups`. (3) Gắn logic chọn Thuộc tính vào Form Tạo/Sửa Sản phẩm. (4) Render bộ lọc động (Dynamic Filters) ngoài trang danh sách sản phẩm.
- **Giới hạn MVP:** Tách rời với hệ thống Phiên bản (Variants), tính năng này chỉ ảnh hưởng đến việc phân nhóm và lọc tìm kiếm sản phẩm gốc.

## 2. Elaboration & Self-Explanation
Việc có schema database chỉ là bước móng. Để "hệ thống phân mục có thể áp dụng được toàn bộ", chúng ta cần:
- **Tầng Backend:** Các hàm Query (lấy dữ liệu) và Mutation (thêm/sửa/xóa) cho 5 bảng đã tạo.
- **Tầng Admin UI:** Người quản trị cần giao diện để định nghĩa "Loại: Rượu vang", "Nhóm: Quốc gia", "Giá trị: Pháp, Ý". Quan trọng nhất, trong trang Cập nhật Sản phẩm, khi admin chọn loại "Rượu Vang", hệ thống phải lập tức hiển thị bảng check chọn "Quốc gia" cho sản phẩm đó.
- **Tầng Storefront (Client):** Khách hàng cần thấy bộ lọc tương ứng bên trái màn hình trang danh mục và URL tự động cập nhật khi họ tick chọn.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế:** Một cửa hàng bán cả "Rượu Vang" và "Xì Gà". Khi khách chọn danh mục Rượu Vang, bộ lọc bên trái hiện "Giống nho", "Niên vụ". Khi khách chọn Xì Gà, bộ lọc hiện "Độ nặng", "Kích thước". Hệ thống mới này sẽ đáp ứng chính xác trải nghiệm đó.
- **Analogy (Phép loại suy):** Hãy tưởng tượng `Product Type` là một "Hộp công cụ" rỗng, `Attribute Group` là các "Ngăn kéo", và `Term` là các "Dụng cụ" bên trong. Bạn tự do quyết định Hộp nào có Ngăn kéo nào, và gán dụng cụ tương ứng cho từng sản phẩm.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Database:** Đã sẵn sàng 5 bảng ở bước trước. Toggle `enableProductTypes` đã được cài đặt.
- **Kiến trúc thư mục:** Admin hiện có `/admin/product-categories` và `/admin/products`. Sẽ phù hợp nếu đặt `/admin/product-types` và `/admin/attribute-groups` tương đương.
- **Storefront:** Cần kiểm tra logic lọc sản phẩm hiện tại (`categoryId`, `status`, `price`) để "cài cắm" thêm mảng `termIds` vào truy vấn Convex.

# III. Root Cause & Counter-Hypothesis
- **Độ tin cậy: High (Cao).** 
- **Lý do:** Hệ thống Next.js hiện tại sử dụng cấu trúc App Router và UI components khá chuẩn mực. Việc bổ sung module phân loại là một quy trình mở rộng (additive process), không đập đi xây lại logic cốt lõi nào nên rủi ro thấp.

# IV. Proposal (Đề xuất)
Đề xuất triển khai toàn bộ hệ thống qua **3 Phase** liền mạch:

**Phase 1: Convex Backend & Admin CRUD (Quản lý Master Data)**
- Tạo `convex/productTypes.ts` và `convex/attributeGroups.ts`.
- Dựng giao diện `/admin/product-types` và `/admin/attribute-groups` (gồm danh sách và form Tạo/Sửa).
- Tính năng: Cho phép kéo thả, gán Nhóm vào Loại, và tạo các Giá trị (Terms) cho Nhóm.

**Phase 2: Product Form Integration (Gắn vào Form Sản Phẩm)**
- Sửa `app/admin/products/[id]/page.tsx` và `app/admin/products/create/page.tsx`.
- Nếu Toggle bật: Thêm ô dropdown "Loại Sản Phẩm". Khi chọn xong, load động các Attribute Groups để người dùng tick chọn Terms (lưu vào bảng pivot `productAttributeTerms`).

**Phase 3: Storefront Filter & Display (Bộ lọc khách hàng)**
- Tại giao diện ngoài site (`/products` hoặc `/[categorySlug]`), load các Group có cờ `isFilterable = true`.
- Hiển thị dạng Checkbox/Radio.
- Cập nhật URL Query params (VD: `?brand=apple&ram=16gb`) để filter Convex query hoạt động chính xác.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Backend:** Tạo mới `convex/productTypes.ts`, `convex/attributeGroups.ts`. Cập nhật `convex/products.ts` (query lấy sản phẩm kèm bộ lọc).
- **Admin UI:** Tạo mới thư mục `app/admin/product-types` và `app/admin/attribute-groups`. Sửa `app/admin/products/[id]/*`.
- **Client UI:** Sửa `app/(site)/products/page.tsx` và sidebar filter component hiện hành.

# VI. Execution Preview (Xem trước thực thi)
1. Code Convex APIs (Mutations/Queries).
2. Code Admin Pages (List & Form).
3. Tích hợp UI Form sửa Sản phẩm.
4. Xử lý Logic lọc ngoài Storefront.
5. Kiểm thử toàn luồng từ Admin ra Storefront.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng Master Data:** Tạo được Type, Group, Term mà không lỗi.
- **Kiểm chứng Form Sản Phẩm:** Gán 2 term khác nhau cho 1 sản phẩm lưu thành công.
- **Kiểm chứng Lọc:** Tick vào ô "Merlot" trên trang web, chỉ có sản phẩm chứa Merlot hiện ra. Tắt Toggle đi thì toàn bộ UI biến mất.

# VIII. Todo
- [ ] Nhận xác nhận Spec và câu trả lời cho Câu hỏi Mở.
- [ ] Thực hiện Phase 1 (CRUD).
- [ ] Thực hiện Phase 2 (Product Form).
- [ ] Thực hiện Phase 3 (Storefront Filter).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Chức năng Admin quản lý Types & Attributes trơn tru, lưu đúng vào bảng.
- Form sản phẩm trực quan, tự động hiển thị Group theo Type đã chọn.
- URL bộ lọc ngoài site phản hồi đúng (Deep-linking URL).
- Nếu tắt toggle trong `products.config.ts`, toàn bộ tính năng ẩn đi an toàn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Sửa form sản phẩm có thể ảnh hưởng đến logic lưu sản phẩm hiện hành. Cần cẩn thận bọc logic mới trong luồng riêng.
- **Hoàn tác:** Revert các file frontend bị sửa và rollback các thay đổi trong hàm mutation của `products.ts`.

# XI. Out of Scope (Ngoài phạm vi)
- Không áp dụng hệ thống thuộc tính này cho các Module khác ngoài Product.
- Không tái thiết kế UI trang chi tiết sản phẩm nếu không cần thiết, chỉ hiển thị đơn giản danh sách thông số nếu có yêu cầu.

# XII. Open Questions (Câu hỏi mở)
1. **Vị trí Menu Admin:** Bạn muốn 2 menu "Loại sản phẩm" và "Thuộc tính lọc" nằm ngang hàng với "Danh mục" (ở sidebar trái), hay giấu chúng trong màn hình "Settings" / Tab riêng biệt?
2. **Kiểu URL Storefront:** Khi khách hàng lọc, bạn thích URL hiển thị theo tên chuẩn SEO như `?quoc-gia=phap&giong-nho=merlot` hay dùng ID kiểu `?terms=id1,id2`?
3. **Phạm vi Phase:** Bạn muốn tôi bắt đầu code ngay Phase 1 và Phase 2 (phần Admin), hay làm gộp luôn cả 3 Phase trong một lượt?

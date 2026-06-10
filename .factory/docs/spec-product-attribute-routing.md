# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi người dùng bật hệ thống Phân loại & Thuộc tính (Product Types & Attributes) và nhấp vào các huy hiệu thuộc tính (ví dụ: giống nho `Chateau Margaux`, quốc gia `Scotland`) trên ô sản phẩm, hệ thống chỉ lọc tại chỗ bằng query params truyền thống thay vì dẫn tới các đường dẫn (route) bộ lọc đẹp mắt và chuẩn SEO.
* **Nguyên nhân**: Huy hiệu thuộc tính (`ProductAttributesBadges`) chưa nhận biết được sản phẩm thuộc loại sản phẩm nào (`productTypeId`) và chưa có cơ chế điều hướng trực tiếp bằng URL đẹp dạng `/${productTypeSlug}/${attributeGroupSlug}/${termSlug}`.
* **Giải pháp**: 
  1. Thêm trường `productTypeId` vào kiểu dữ liệu sản phẩm của ô thẻ.
  2. Cải tiến `ProductAttributesBadges` tự động tải danh sách nhóm sản phẩm (`productTypes`) bằng Convex query và map tự động `productTypeId` sang `productTypeSlug` tương ứng.
  3. Khi click vào huy hiệu thuộc tính, nếu hệ thống Phân loại được bật, tự động chuyển hướng người dùng đến route đẹp chuẩn SEO: `/${productTypeSlug}/${groupSlug}/${termSlug}`. Nếu không, fallback về bộ lọc query params cũ.

## 2. Elaboration & Self-Explanation
Hệ thống Phân loại & Thuộc tính hỗ trợ cấu trúc định tuyến (routing) rất thông minh cho SEO:
`/${productTypeSlug}/${attributeGroupSlug}/${termSlugs}` (Ví dụ: `/ruou-vang/giong-nho/chateau-margaux`).
Khi hiển thị sản phẩm trên giao diện, mỗi sản phẩm đều chứa sẵn trường dữ liệu `productTypeId` đại diện cho nhóm của nó (ví dụ: Rượu vang, Bia, Phụ kiện).
Bằng cách truyền `productTypeId={product.productTypeId}` vào component hiển thị huy hiệu `ProductAttributesBadges`, chúng ta có thể tra cứu mã slug của nhóm sản phẩm đó (ví dụ: `ruou-vang`). Khi người dùng click vào một thuộc tính (giống nho, hương vị, xuất xứ), chúng ta sẽ sử dụng `useRouter` của Next.js để điều hướng thẳng tới route bộ lọc đẹp mắt tương ứng của nhóm sản phẩm đó. Điều này giúp nâng cao trải nghiệm người dùng lên chuẩn thương mại điện tử premium 2026.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: 
  * Người dùng đang xem sản phẩm "Rượu The Macallan 12" (có `productTypeId` thuộc nhóm Rượu Vang với slug là `ruou-vang`).
  * Trên card sản phẩm có badge Xuất xứ: `Scotland` (slug của group là `xuat-xu`, slug của term là `scotland`).
  * **Trước khi sửa**: Click vào `Scotland` sẽ lọc query param tại chỗ dạng `/products?attr_xuat-xu=scotland` (URL truyền thống, không đẹp).
  * **Sau khi sửa**: Click vào `Scotland` sẽ lập tức chuyển hướng người dùng tới route chuẩn SEO siêu đẹp: `/ruou-vang/xuat-xu/scotland`.
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng bạn đang ở trong một thư viện lớn. Thay vì thủ thư chỉ cho bạn xem một cuốn sách và bạn phải tự tìm các cuốn sách cùng chủ đề xung quanh (query param), thủ thư lập tức đưa bạn đến đúng kệ sách chuyên biệt về chủ đề đó (route đẹp SEO), giúp bạn dễ dàng chọn lựa và tìm kiếm tất cả các cuốn sách liên quan một cách nhanh nhất.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã xác nhận trường `productTypeId` tồn tại trong schema bảng `products` của database Convex (`convex/schema.ts`).
* Đã xác nhận Convex queries `listPublishedPaginated` và `listPublishedWithOffset` đều trả về đầy đủ đối tượng `product` có chứa `productTypeId`.
* Đã kiểm tra component `ProductAttributesBadges` (dòng 1652): Cần bổ sung prop `productTypeId?: string` và tích hợp `useQuery` tra cứu danh mục nhóm sản phẩm để tự động chuyển hướng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân chính**: Huy hiệu thuộc tính trước đây chỉ phục vụ tính năng lọc tĩnh trên trang hiện tại bằng cách gọi prop callback `onAttributeChange`, không được thiết kế để tự động nhận biết ngữ cảnh định tuyến động và SEO URLs của sản phẩm.
* **Giả thuyết đối chứng**: Nếu chỉ dùng `onAttributeChange` cập nhật query params thì URL sẽ không thể chuyển thành dạng SEO URL đẹp `/${productTypeSlug}/${groupSlug}/${termSlug}` khi người dùng chưa chủ động chọn Product Type ở bộ lọc chung. Vì thế, việc chuyển hướng trực tiếp bằng `useRouter` bên trong click handler của badge thuộc tính là giải pháp duy nhất chuẩn xác.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ nâng cấp đồng bộ `ProductAttributesBadges` trong file `ProductsPage.tsx`:

### 1. Bổ sung trường `productTypeId` vào kiểu dữ liệu:
* Thêm `productTypeId?: string;` vào interface `ProductCardProps['product']`.
* Thêm prop `productTypeId?: string;` vào component `ProductAttributesBadges`.

### 2. Tự động tra cứu Product Type Slug trong `ProductAttributesBadges`:
* Sử dụng `useRouter` từ `next/navigation`.
* Gọi các query Convex trực tiếp bên trong component:
  ```tsx
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const enableProductTypes = enableProductTypesSetting?.value === true;
  const productTypesData = useQuery(api.productTypes.listAll, enableProductTypes ? {} : 'skip');
  ```
* Tạo bản đồ map `productTypeId` sang `slug` bằng `useMemo`.

### 3. Xử lý click chuyển hướng chuẩn SEO:
* Trong onClick của term thuộc tính:
  * Nếu Phân loại được bật, có `productTypeId` và tìm thấy slug tương ứng, gọi `router.push` chuyển hướng tới route đẹp.
  * Nếu không, fallback về hành vi cập nhật state lọc tại chỗ (`onAttributeChange`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
* #### [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Vai trò hiện tại: Quản lý toàn bộ giao diện, các ô sản phẩm và bộ lọc thuộc tính.
  * Thay đổi: Nâng cấp kiểu dữ liệu `ProductCardProps`, tích hợp định tuyến thông minh vào component `ProductAttributesBadges`, truyền `productTypeId` từ các card sản phẩm cha xuống component con.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Bổ sung `productTypeId` vào interface `ProductCardProps['product']`** (dòng 1580).
2. **Cập nhật component `ProductAttributesBadges`** (dòng 1652) với các hooks query Convex, map slug và logic điều hướng `router.push`.
3. **Nối dây `productTypeId` vào các nơi gọi `<ProductAttributesBadges>`** trong `ProductGrid`, `ProductList` và Catalog Layout products map.
4. **Tự kiểm tra tĩnh TypeScript** để đảm bảo kiểu dữ liệu an toàn tuyệt đối.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static Verification):
* Chạy `bunx tsc --noEmit` để đảm bảo kiểu dữ liệu compile thành công không lỗi.

### Kiểm tra trực quan (Manual Verification):
* Bật hệ thống Phân loại & Thuộc tính tại trang quản trị sản phẩm.
* Vào `http://localhost:3000/products`, di chuột vào ô sản phẩm bất kỳ (ví dụ: Rượu vang Macallan).
* Bấm vào giống nho `Chateau Margaux` hay quốc gia `Scotland` trên card sản phẩm đó.
* **Kết quả mong đợi**: Trình duyệt chuyển hướng mượt mà đến URL đẹp dạng `/ruou-vang/giong-nho/chateau-margaux` hoặc `/ruou-vang/xuat-xu/scotland` và hiển thị danh sách sản phẩm đã được lọc chính xác theo thuộc tính đó.

---

# VIII. Todo
- [ ] Bổ sung `productTypeId` vào interface `ProductCardProps`
- [ ] Nâng cấp component `ProductAttributesBadges` với logic tra cứu slug và `router.push`
- [ ] Truyền `productTypeId` vào các nơi gọi `ProductAttributesBadges` trong `ProductGrid`
- [ ] Truyền `productTypeId` vào các nơi gọi `ProductAttributesBadges` trong `ProductList`
- [ ] Truyền `productTypeId` vào các nơi gọi `ProductAttributesBadges` trong Catalog Layout
- [ ] Chạy tsc biên dịch kiểm tra

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* [x] **Định tuyến SEO đẹp**: Khi click badge thuộc tính trên card sản phẩm, URL lập tức chuyển thành dạng `/productTypeSlug/groupSlug/termSlug`.
* [x] **Lọc chính xác**: Trang bộ lọc hiển thị chính xác các sản phẩm tương ứng với thuộc tính đã chọn.
* [x] **Tương thích ngược**: Nếu hệ thống Phân loại & Thuộc tính tắt, click badge thuộc tính vẫn hoạt động lọc query param truyền thống ổn định.
* [x] **TypeScript an toàn**: Chạy tsc không báo bất kỳ lỗi kiểu dữ liệu nào.

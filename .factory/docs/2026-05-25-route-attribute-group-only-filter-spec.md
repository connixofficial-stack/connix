# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng truy cập trang lọc chuyên biệt cho nhóm thuộc tính (ví dụ: `/products/giong-nho`), việc hiển thị tất cả các bộ lọc khác (như Danh mục, Xuất xứ, Khoảng giá...) sẽ làm họ bị phân tâm.
Để giải quyết điều này, khi hệ thống nhận dạng đây là trang nhóm thuộc tính trực tiếp:
1. Giao diện sẽ tự động khóa và chuyển đổi về dạng **Catalog Layout** (có sidebar bên trái) để hiển thị bộ lọc.
2. Sidebar và Mobile Filters sẽ **ẩn đi toàn bộ các bộ lọc khác** (Tìm kiếm, Danh mục, Nhóm sản phẩm, Khoảng giá, Sắp xếp).
3. **Chỉ giữ lại duy nhất bộ lọc thuộc tính hiện tại** (ví dụ: "Giống nho" với Merlot, Pinot Noir...) để khách hàng tập trung tuyệt đối vào việc lọc.

## 2. Elaboration & Self-Explanation
Trong component `ProductsPage.tsx`, danh sách các nhóm thuộc tính có khả năng lọc (`filterableGroups`) được tải thông qua Convex query `api.attributeGroups.listFilterable`.
Khi `props.attributeFilter` (chứa `groupId` của nhóm thuộc tính hiện tại) được truyền vào:
- Chúng ta sẽ tự động lọc `filterableGroups` thông qua `useMemo` để chỉ giữ lại nhóm thuộc tính có `_id` khớp với `props.attributeFilter.groupId`. Điều này giúp cô lập hoàn toàn bộ lọc thuộc tính hiện tại.
- Ép buộc biến định dạng hiển thị `layout` thành `'catalog'` bất kể thiết lập trong admin. Điều này đảm bảo trang luôn có sidebar bên trái để hiển thị bộ lọc một cách trực quan trên Desktop.
- Cập nhật định nghĩa props của các layout component (`CatalogLayout`, `ListLayout`, `MobileProductsFilters`) để truyền nhận tham số `attributeFilter`.
- Tại các component này, nếu `attributeFilter` tồn tại, chúng ta sử dụng biểu thức điều kiện `{!attributeFilter && ...}` để ẩn đi toàn bộ các panel bộ lọc không liên quan (Tìm kiếm, Danh mục, Nhóm sản phẩm, Khoảng giá, Sắp xếp).

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đi siêu thị để mua rượu vang và yêu cầu nhân viên hướng dẫn: "Hãy chỉ cho tôi các giống nho!" (`/products/giong-nho`).
Nếu người nhân viên đưa bạn một bảng danh mục khổng lồ chứa hàng ngàn thông tin hỗn độn bao gồm cả xuất xứ Ý/Pháp, khoảng giá từ rẻ đến đắt, các thương hiệu lớn nhỏ... Bạn sẽ cảm thấy vô cùng bối rối.
Thay vào đó, người nhân viên thông minh sẽ dẫn bạn tới kệ trưng bày chuyên biệt về Giống nho, trên đó chỉ gắn duy nhất các nhãn phân loại: "Merlot", "Pinot Noir", "Chardonnay"... và cất hết các bảng phân loại không liên quan đi.
Đó chính là trải nghiệm premium tập trung mà chúng ta đang xây dựng cho website Thiên Kim Wine.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tình trạng hiện tại:** Khi truy cập `/products/giong-nho`, sidebar vẫn hiển thị toàn bộ các bộ lọc như trang `/products` thông thường, làm giảm tính chuyên biệt của trang SEO Landing.
- **Tác động:** Trải nghiệm khách hàng bị loãng, không thấy sự khác biệt trực quan giữa trang lọc chuyên sâu và trang danh mục chung.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Chưa có cơ chế ẩn/lọc các panel bộ lọc theo ngữ cảnh khi `props.attributeFilter` được truyền vào.
- **Giả thuyết đối chứng:** Nếu lọc `filterableGroups` theo `groupId` hiện tại và ẩn các bộ lọc khác trong sidebar khi có `attributeFilter`, giao diện sẽ lập tức trở nên gọn gàng, tinh tế và tập trung đúng vào nhóm thuộc tính đó.

---

# IV. Proposal (Đề xuất)
1. **Ép buộc Catalog Layout:** Cập nhật định nghĩa `layout` tại `ProductsPage` để tự động chọn `'catalog'` nếu có `props.attributeFilter`.
2. **Cô lập nhóm thuộc tính:** Sử dụng `useMemo` lọc trực tiếp `filterableGroups` theo `props.attributeFilter.groupId`.
3. **Ẩn các panel bộ lọc không liên quan:**
   - Cập nhật `LayoutProps` và `MobileProductsFiltersProps` bổ sung prop `attributeFilter`.
   - Sử dụng `{!attributeFilter && ( ... )}` để ẩn các bộ lọc khác trong `CatalogLayout` và `MobileProductsFilters`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  - Vai trò hiện tại: Component chính kết xuất trang danh sách và bộ lọc sản phẩm.
  - Thay đổi: Tái cấu trúc logic định nghĩa layout, lọc attribute groups và bổ sung điều kiện ẩn các panel lọc không liên quan.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `ProductsPage.tsx` tích hợp logic ẩn bộ lọc và ép layout.
2. Chạy biên dịch TypeScript để kiểm tra tính toàn vẹn.
3. Kiểm tra kết quả hiển thị.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo typecheck 100% thành công.

### Manual Verification
- Truy cập `/products/giong-nho`:
  - Sidebar bên trái chỉ hiển thị duy nhất bộ lọc giống nho (Merlot, Chardonnay...).
  - Tất cả bộ lọc khác (Danh mục, Giá, Tìm kiếm, v.v...) đều bị ẩn.
  - Giao diện hiển thị Catalog Layout đẹp mắt.

---

# VIII. Todo
- [ ] Tích hợp logic ẩn bộ lọc và ép layout vào `ProductsPage.tsx`.
- [ ] Chạy kiểm tra TypeScript typecheck.
- [ ] Git commit các thay đổi.
- [ ] Chạy âm báo hoàn thành "Done, Sir." qua SAPI.SpVoice.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/products/giong-nho` chỉ hiển thị bộ lọc Giống nho ở sidebar.
- Không có lỗi typecheck TypeScript.
- Giữ nguyên hiển thị đầy đủ bộ lọc cho các trang `/products` thông thường.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Rất thấp do logic sử dụng điều kiện `props.attributeFilter` rõ ràng để cô lập hành vi, các trang danh sách sản phẩm thông thường không bị ảnh hưởng.
- **Hoàn tác:** `git checkout` khôi phục file `ProductsPage.tsx`.

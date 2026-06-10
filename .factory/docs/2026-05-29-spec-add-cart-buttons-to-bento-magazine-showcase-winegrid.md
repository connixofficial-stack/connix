# Spec: Thêm nút giỏ hàng và đồng bộ các layout Bento, Magazine, Showcase, Wine Grid

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các layout Bento, Magazine, Showcase, và Wine Grid của thành phần "Sản phẩm theo danh mục" (Category Products) chưa hỗ trợ hiển thị các nút hành động "Thêm vào giỏ" và "Mua ngay" theo cấu hình trong Admin. Đồng thời, có một số điểm không đồng bộ về giao diện hiển thị giữa Preview (Admin) và Site thật (Frontend).
* **Giải pháp**: 
  1. Tích hợp component `ProductCardActions` vào cả 4 layout ở cả file Preview và file Render của Site thật.
  2. Đồng bộ cấu trúc hiển thị của layout Showcase (đưa tên/giá ra ngoài ảnh giống Site thật).
  3. Sử dụng hover overlay cho các ô sản phẩm phụ (`others`) trong Bento để đảm bảo tính thẩm mỹ của Bento lưới.
  4. Thay thế nút "Xem" trong Wine Grid bằng các nút giỏ hàng khi cấu hình được bật.
* **Mục tiêu**: Đảm bảo tất cả layout của thành phần đều phản ánh chính xác cấu hình giỏ hàng và đồng bộ 100% giữa Admin và Site khách hàng.

## 2. Elaboration & Self-Explanation
Thành phần Category Products hiển thị sản phẩm theo danh mục với 7 layout phong phú. Khi quản trị viên bật tính năng giỏ hàng, họ muốn khách hàng có thể mua nhanh ở bất cứ layout nào.
Hiện tại, chỉ có layout Grid, Carousel và Cards là hoạt động đúng. Các layout nâng cao hơn (Bento, Magazine, Showcase, Wine Grid) do có cấu trúc HTML phức tạp hoặc viết dạng inline nên đã bị bỏ sót việc render các nút hành động.
Để giải quyết điều này mà vẫn giữ được tính thẩm mỹ cao (Premium Designs):
- Với **Bento**: các ô phụ nhỏ (180x180px) sẽ hiển thị nút hành động thông qua một overlay chuyển động trượt lên khi hover, tránh làm chật lưới Bento tĩnh. Ô lớn nổi bật (Featured) sẽ hiển thị nút trực tiếp dưới giá.
- Với **Magazine**: các ô phụ có cấu trúc card thông thường nên ta hiển thị nút trực tiếp phía dưới giá sản phẩm.
- Với **Showcase**: Đồng bộ lại Preview của Admin (đưa tên và giá xuống dưới ảnh giống như ngoài Site thật), sau đó thêm cụm nút mua xuống dưới giá.
- Với **Wine Grid**: Khi có nút mua, ta thay thế nút "Xem" mặc định bằng cụm nút mua nhanh.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như việc bạn nâng cấp hệ thống thanh toán tự động cho một chuỗi cửa hàng. Bạn không thể chỉ lắp máy quét mã vạch ở quầy thanh toán thường (Grid/Carousel) mà bỏ quên các quầy tự phục vụ (Bento) hay quầy bán đồ uống nhanh (Wine Grid). Tất cả các điểm chạm mua sắm đều cần được đồng bộ tính năng thanh toán nhanh.
* **Ví dụ trong code (Wine Grid)**:
  * *Trước khi sửa*:
    ```tsx
    <div className="mt-auto flex justify-between">
      <span>{priceDisplay.label}</span>
      <button>Xem</button>
    </div>
    ```
  * *Sau khi sửa*:
    ```tsx
    <div className="mt-auto flex justify-between">
      <span>{priceDisplay.label}</span>
      {showAddToCartButton || showBuyNowButton ? (
        <ProductCardActions ... />
      ) : (
        <button>Xem</button>
      )}
    </div>
    ```

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng quan sát**: Bật nút "Thêm vào giỏ" và "Mua ngay" trong Admin nhưng khi chuyển sang các layout Bento, Magazine, Showcase, Wine Grid thì các nút này hoàn toàn biến mất trong khung Preview lẫn ngoài Site thật.
* **Phạm vi ảnh hưởng**: Trang chỉnh sửa thành phần trong Admin và trang hiển thị thành phần này ngoài trang chủ khách hàng.
* **Tần suất tái hiện**: 100%.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Do thiếu logic render component `ProductCardActions` tại các hàm `renderBentoStyle`, `renderMagazineStyle`, `renderShowcaseStyle`, `renderWineGridStyle` trong cả hai file:
  1. [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)
  2. [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
* **Độ tin cậy nguyên nhân gốc**: High (Chắc chắn 100%).

# IV. Proposal (Đề xuất)
1. **Trong Bento**:
   * Với sản phẩm nổi bật (`featured`): Thêm `ProductCardActions` ở phần text dưới cùng trên nền tối. Thêm `onClick={(e) => e.preventDefault()}` ở thẻ bọc để tránh click trúng link chuyển trang.
   * Với sản phẩm phụ (`others`): Khi hover, hiển thị một overlay mờ trượt lên chứa Tên, Giá, và `ProductCardActions`.
2. **Trong Magazine**:
   * Với sản phẩm nổi bật (`featured`): Thêm `ProductCardActions` tương tự Bento featured.
   * Với sản phẩm phụ (`gridItems`): Thêm `ProductCardActions` trực tiếp phía dưới giá sản phẩm (ngoài ảnh).
3. **Trong Showcase**:
   * Đồng bộ giao diện Preview của Admin giống với Site thật (đưa tên và giá ra ngoài ảnh, phía dưới ảnh).
   * Thêm `ProductCardActions` trực tiếp phía dưới giá sản phẩm.
4. **Trong Wine Grid**:
   * Kiểm tra điều kiện: Nếu `showAddToCartButton || showBuyNowButton` bật, render `ProductCardActions` thay thế cho nút "Xem" (ở cả Preview và Site thật).

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)
  * Vai trò: Hiển thị Preview Admin.
  * Thay đổi: Cập nhật các hàm `renderBentoStyle`, `renderMagazineStyle`, `renderShowcaseStyle`, `renderWineGridStyle` để hiển thị nút mua. Đồng bộ Showcase layout.
* **Sửa**: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
  * Vai trò: Hiển thị giao diện Site thật của khách hàng.
  * Thay đổi: Cập nhật các khối render tương ứng của 4 layout để hiển thị các nút mua và thực hiện chức năng mua thực tế (`handleAddToCart`, `handleBuyNow`).

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ cấu trúc và biến sử dụng trong các layout của [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).
2. Áp dụng sửa đổi cho Preview trước.
3. Đọc kỹ cấu trúc và biến (như `handleAddToCart`, `handleBuyNow`, `tokens`) trong `CategoryProductsSection` của [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx).
4. Áp dụng sửa đổi cho Site thật.
5. Đảm bảo sử dụng `onClick={(e) => e.preventDefault()}` ở các cụm nút mua nằm bên trong thẻ `<a>` để tránh lỗi điều hướng ngoài ý muốn.
6. Rà soát lỗi cú pháp tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Tự kiểm tra cấu trúc JSX đóng/mở thẻ và các biến truyền vào `ProductCardActions`.
* **Xác nhận thủ công**: Người dùng kiểm tra trên trình duyệt cả giao diện Admin Preview và Site thật ở các layout Bento, Magazine, Showcase, Wine Grid khi bật/tắt các cấu hình nút mua để đảm bảo hiển thị đồng bộ và hoạt động tốt.

# VIII. Todo
* [ ] Cập nhật [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).
* [ ] Cập nhật [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx).
* [ ] Rà soát tĩnh toàn bộ thay đổi.
* [ ] Phát âm thông báo hoàn thành task `Done, Sir.` qua SAPI.SpVoice.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Bento, Magazine, Showcase, Wine Grid hiển thị đúng cụm nút Thêm vào giỏ/Mua ngay theo cấu hình.
* Không có hiện tượng click nút mua bị nhảy trang (do thẻ `<a>` bọc ngoài).
* Giao diện Showcase trong Admin Preview đồng bộ với Site thật (tên và giá nằm dưới ảnh).
* Wine Grid thay thế nút "Xem" bằng cụm nút mua khi cấu hình bật, giữ nguyên nút "Xem" khi cấu hình tắt.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Khi bọc các nút hành động trong thẻ `<a>`, nếu quên `preventDefault` trên click event thì click nút sẽ dẫn đến hành động chuyển sang trang chi tiết sản phẩm thay vì thêm vào giỏ. Ta sẽ đảm bảo bọc cụm nút trong một thẻ `div` có `onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}`.
* **Hoàn tác**: Sử dụng `git checkout` để hoàn tác các tệp đã sửa.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic giỏ hàng hoặc cổng thanh toán của trang Checkout.

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện nay, khi người dùng đang ở trang Danh sách Sản phẩm, nếu họ muốn xem các sản phẩm khác có cùng giống nho, xuất xứ hay thương hiệu với sản phẩm đang xem, họ phải mở bộ lọc ở sidebar và tìm kiếm thủ công. Trải nghiệm này mất nhiều bước và giảm tính tương tác liền mạch của trang web (Catalog/Shop Page).
* **Giải pháp**: Biến các giá trị thuộc tính trên Card sản phẩm thành các "nút bấm mini tương tác" (Interactive Badges). 
  * Khi người dùng click vào xuất xứ `Ý` hoặc giống nho `Merlot` ngay trên chiếc Card, hệ thống sẽ **tự động kích hoạt bộ lọc tương ứng** và tải lại danh sách sản phẩm tức thì bằng AJAX mà không cần chuyển hướng đi vào trang chi tiết sản phẩm.
  * Tối ưu hóa UI/UX: Sử dụng cơ chế gộp thuộc tính thông minh, mỗi thuộc tính con là một phần tử có khả năng phản hồi hover (hover:underline, đổi màu theo brand color động).
  * Đồng bộ hóa hoàn toàn với hệ thống màu động **Dual Brand Color** (`tokens`) của web.

## 2. Elaboration & Self-Explanation
* **Giải thích chi tiết**: Chúng ta sẽ nâng cấp chiếc Card sản phẩm ở trang public danh sách bằng cách truyền thêm các props điều khiển bộ lọc (`onAttributeChange` và `selectedAttributes`) vào component hiển thị badge `ProductAttributesBadges`.
* Thay vì chỉ render tên thuộc tính dưới dạng text tĩnh phẳng, chúng ta sẽ render mỗi thuộc tính con (ví dụ: các giống nho `Merlot`, `Primitivo` trong cùng một badge `giống nho`) thành các thẻ `<span>` riêng biệt. 
* Khi click vào một thẻ giống nho:
  * Ngăn chặn sự kiện click lan truyền lên thẻ `<Link>` cha bằng `e.preventDefault()` và `e.stopPropagation()`.
  * Xác định xem thuộc tính này đã được chọn trong bộ lọc hiện tại chưa (tra cứu trong `selectedAttributes`).
  * Gọi trực tiếp hàm callback `onAttributeChange(groupSlug, termSlug, !isChecked)` để toggle trạng thái lọc ngay tại chỗ.
  * Nếu thuộc tính đó đang hoạt động trong bộ lọc, chữ của nó trên tất cả các Card sản phẩm sẽ được làm nổi bật (sáng tông màu động của brand), giúp người dùng biết ngay sản phẩm nào đang khớp với tiêu chí lọc nào.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như khi bạn xem một bài viết trên blog công nghệ, dưới bài viết có các hashtag tĩnh như `#NextJS`, `#TailwindCSS`. Nếu các hashtag đó chỉ là chữ tĩnh, bạn sẽ thấy rất bất tiện. Nhưng nếu chúng là các hashtag tương tác: bạn click vào `#NextJS`, trang web lập tức tải danh sách toàn bộ các bài viết về NextJS ngay trước mắt bạn. 
* **Áp dụng vào Thiên Kim Wine**: Người dùng đang cuộn danh sách rượu vang và nhìn thấy một chai rượu ngon có giống nho `Pinot Noir` hiển thị trên Card. Họ tò mò muốn xem shop còn những chai rượu Pinot Noir nào khác. Thay vì phải rê chuột sang sidebar bên trái, kéo tìm nhóm "Giống nho" và tích vào ô Pinot Noir, họ chỉ cần chạm nhẹ vào chữ `Pinot Noir` ngay trên tấm ảnh Card. Toàn bộ danh sách lập tức tự động lọc và chỉ hiện ra các chai rượu Pinot Noir. Đây chính là đỉnh cao của sự tiện lợi và tốc độ tương tác.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trạng thái hiện tại**:
  * Các file đang chịu trách nhiệm hiển thị và điều khiển bộ lọc là:
    * Component danh sách sản phẩm: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/products/ProductsPage.tsx)
  * Logic render Card sản phẩm nằm trong `ProductGrid` và `ProductList` có nhận `tokens: ProductsListColors` nhưng chưa truyền `onAttributeChange` và `selectedAttributes` vào component con `ProductAttributesBadges`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc (Root Cause Confidence)**: **High (Cao)**
  * *Lý do*: Thiết kế ban đầu chỉ coi các badge thuộc tính là các chip hiển thị thông tin thuần túy (Static Metadata), chưa tích hợp sâu vào hệ thống định tuyến bộ lọc URL (Filter Router) của Next.js thông qua query parameters.
* **Giả thuyết đối chứng (Counter-Hypothesis)**:
  * Nếu click vào badge mà vẫn để kích hoạt link chi tiết sản phẩm, người dùng sẽ bị điều hướng sang trang khác (`/product/slug`), làm đứt gãy mạch mua sắm (Shopping Flow). Do đó, việc chặn hành vi mặc định của thẻ Link (`event.stopPropagation()`) là điều kiện bắt buộc để thực hiện tương tác lọc tại chỗ (In-place filtering).

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất nâng cấp toàn diện component hiển thị badge và wiring (nối dây dữ liệu) như sau:

## 1. Nâng cấp Signature của Component `ProductAttributesBadges`:
```typescript
function ProductAttributesBadges({
  productId,
  productAttributesMap,
  tokens,
  className = "flex flex-wrap gap-1.5 mt-1.5 mb-1 max-w-full",
  onAttributeChange,
  selectedAttributes
}: {
  productId: string;
  productAttributesMap?: Map<string, any[]>;
  tokens: ProductsListColors;
  className?: string;
  onAttributeChange?: (groupSlug: string, termSlug: any, checked: boolean) => void;
  selectedAttributes?: Record<string, string[]>;
})
```

## 2. Đồng bộ màu sắc biểu tượng động:
* Sử dụng `tokens.primary` làm màu cho biểu tượng thuộc tính lọc thay vì set cứng `#9B2C3B`.

## 3. Render các thuộc tính con có khả năng tương tác (Interactive Child Terms):
* Duyệt qua từng nhóm đã gộp (Merged Groups). Với mỗi group, hiển thị danh sách các term con dưới dạng các thẻ `<span>` có sự kiện click riêng biệt.
* Kiểm tra trạng thái đang được lọc:
  ```typescript
  const isTermChecked = (groupId: string, termSlug: string) => {
    return selectedAttributes?.[groupId]?.includes(termSlug) ?? false;
  };
  ```
* Thiết kế CSS động:
  * *Chưa active*: `text-slate-600 dark:text-slate-400 hover:underline hover:text-[tokens.primary]`
  * *Đã active (đang chạy bộ lọc)*: Chữ đậm `font-semibold` và sáng màu thương hiệu `color: tokens.primary` (hoặc `tokens.secondary`).

## 4. Ngăn chặn sự kiện click lan truyền:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onAttributeChange?.(groupItem.group.slug, termSlug, !isChecked);
}}
```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Site Components
* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/products/ProductsPage.tsx)
  * *Vai trò*: Quản lý toàn bộ giao diện và tương tác trang danh sách sản phẩm.
  * *Thay đổi*:
    1. Nối dây (`onAttributeChange` và `selectedAttributes`) từ `CatalogLayout` -> `ProductGrid`/`ProductList` -> `ProductAttributesBadges`.
    2. Viết lại component `ProductAttributesBadges` để hỗ trợ tương tác lọc nhanh trực tiếp trên từng term thuộc tính.
    3. Tối ưu Spacing và Typography cho Card sản phẩm theo góp ý thẩm mỹ (tăng lề nút CTA, ký hiệu tệ thanh lịch).

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1: Cập nhật component `ProductAttributesBadges` trong `ProductsPage.tsx`**
   * Sửa đổi cấu trúc render để hiển thị các term con riêng biệt có khả năng click.
   * Đồng bộ màu sắc biểu tượng `icon` từ `tokens.primary`.
2. **Bước 2: Cập nhật wiring (truyền prop) trong `ProductGrid` và `ProductList`**
   * Truyền `onAttributeChange`, `selectedAttributes` từ props cha vào component `ProductAttributesBadges`.
3. **Bước 3: Tối ưu Spacing & Spacing Scale**
   * Tăng lề trên nút CTA trong `ProductCardActions` lên `mt-4.5`.
   * Cập nhật hiển thị tiền tệ thanh mảnh không gạch chân.
4. **Bước 4: Kiểm tra TypeScript & Chạy type check**
   * Chạy `bunx tsc --noEmit` để đảm bảo hệ thống biên dịch trơn tru.
5. **Bước 5: Kích hoạt âm báo**
   * Chạy âm báo PowerShell hoàn thành tác vụ.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tĩnh (Static Verification)
* **Lệnh chạy**: `bunx tsc --noEmit`
* **Tiêu chí**: Biên dịch thành công 100%.

### Kiểm chứng trực quan (Manual Verification)
* Người dùng mở trang bán hàng public:
  * Di chuột qua các chữ giống nho (ví dụ `Merlot`, `Primitivo`) trên Card sản phẩm: các chữ này tự động gạch chân tinh tế và đổi sang tông màu của brand.
  * **Thử nghiệm click**: Nhấn trực tiếp vào chữ `Merlot` trên Card sản phẩm.
    * Trang web KHÔNG được chuyển hướng đi vào trang chi tiết sản phẩm.
    * Danh sách sản phẩm tự động lọc lại tức thì, chỉ hiển thị các chai rượu vang có giống nho Merlot.
    * Sidebar bên trái tự động hiển thị ô "Merlot" được tích chọn.
    * Chữ `Merlot` trên badge của tất cả các Card sản phẩm sáng lên màu highlight động để báo hiệu bộ lọc đang hoạt động.
  * Bố cục nút bấm, giá bán và badges hiển thị thoáng đãng, sang trọng, tuyệt đối không có lỗi chồng lấp chữ hay vỡ layout.

---

# VIII. Todo

- [ ] Tạo file spec thiết kế tại `.factory/docs/premium_product_item_ux_filter.md` (Đang thực hiện).
- [ ] Thực hiện wiring truyền prop `onAttributeChange` và `selectedAttributes` vào `ProductGrid` và `ProductList` trong `app/(site)/_components/products/ProductsPage.tsx`.
- [ ] Chỉnh sửa component `ProductAttributesBadges` để hỗ trợ tương tác click lọc nhanh và style active/inactive.
- [ ] Tinh chỉnh Spacing nút CTA và định dạng ký hiệu tiền tệ thanh lịch.
- [ ] Chạy kiểm tra kiểu tĩnh TypeScript: `bunx tsc --noEmit`.
- [ ] Kích hoạt âm báo hoàn thành bằng PowerShell.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Click vào từng tên thuộc tính trên Card sẽ thực hiện toggle bộ lọc đó trên URL và danh sách mà không chuyển hướng trang.
* Trạng thái thuộc tính đang hoạt động bộ lọc được làm nổi bật (sáng màu) ngay trên Card sản phẩm.
* Sử dụng 100% dynamic colors từ hệ thống `tokens` thay vì set cứng màu sắc.
* Biên dịch TypeScript thành công 100%.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Việc ngăn chặn lan truyền sự kiện click (`stopPropagation`) có thể ảnh hưởng đến các vùng tương tác khác của Card.
* **Giải pháp**: Khoanh vùng `stopPropagation` chính xác và chỉ áp dụng riêng cho thẻ `<span>` chứa tên thuộc tính cụ thể, đảm bảo click vào các vùng trống khác trên Card vẫn dẫn vào trang chi tiết sản phẩm bình thường.
* **Hoàn tác**: Sử dụng Git hoàn tác về trạng thái trước đó nếu phát sinh lỗi cấu trúc.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi cấu trúc database Convex hay các API schema.

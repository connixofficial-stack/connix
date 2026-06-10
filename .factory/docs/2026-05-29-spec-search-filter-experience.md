# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta sẽ xây dựng một trang quản trị Trải nghiệm (Experience) hoàn toàn mới cho trang Tìm kiếm tại `/system/experiences/search-filter` trong trang quản trị Admin.
- Trang này cho phép quản trị viên cấu hình mọi thứ về trang Tìm kiếm: chọn kiểu bố cục (chỉ tìm kiếm, có bộ lọc, nâng cao), ẩn/hiện bộ lọc, ẩn/hiện nút Sắp xếp, v.v.
- Đồng thời, chúng ta sẽ áp dụng tính năng cấu hình **"Bố cục nút"** giống hệt như trang Danh sách sản phẩm: cho phép bật/tắt nút Thêm giỏ hàng, Mua ngay, Wishlist, cấu hình Bo góc của thẻ sản phẩm, và chọn bố cục xếp các nút này theo chiều dọc (Stack) hoặc chiều ngang (Grid 2) để đảm bảo toàn bộ website đồng bộ và nhất quán 100% về mặt trải nghiệm mua sắm.

## 2. Elaboration & Self-Explanation
Nhiệm vụ này bao gồm 4 phần chính:
1. **Đăng ký Trải nghiệm mới:**
   Thêm cấu hình `search-filter` vào danh sách `systemExperiences` trong tệp [app/system/experiences/_constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/_constants.ts) để nó xuất hiện trên trang tổng quan quản trị.
2. **Cấu trúc lại Config Schema:**
   Cập nhật `SearchFilterConfig` trong [lib/experiences/useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts) để hỗ trợ đầy đủ các tham số cấu hình hiển thị thẻ sản phẩm trên trang search (học tập từ `products_list_ui`): `showWishlistButton`, `showAddToCartButton`, `showBuyNowButton`, `showPromotionBadge`, `cornerRadius`, `cartButtonsLayout`.
3. **Xây dựng Trang Quản Trị Trực Quan:**
   Tạo tệp mới [app/system/experiences/search-filter/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/search-filter/page.tsx) làm trang cấu hình trải nghiệm cho Search & Filter. Trang này cho phép bật/tắt trực quan các tuỳ chọn layout tìm kiếm và tính năng nút mua hàng của sản phẩm.
4. **Đồng bộ hóa Giao Diện Client:**
   Cập nhật trang tìm kiếm [app/(site)/search/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/search/page.tsx) để đọc cấu hình từ hook `useSearchFilterConfig()` và render responsive các nút hành động (Add to cart, Buy now, Wishlist), bo góc và áp dụng bố cục xếp dọc/xếp ngang (stack/grid-2) cho sản phẩm một cách hoàn toàn nhất quán.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng trang web của bạn giống như một chuỗi cửa hàng giày. Khi khách hàng xem kệ giày ở khu vực "Hàng mới về" (Products List), họ thấy mỗi đôi giày có đầy đủ nút: Thêm vào giỏ, Mua ngay, và được xếp nằm ngang rất đẹp. Nhưng khi họ đi sang khu vực "Tìm kiếm" (Search Page), họ lại thấy đôi giày chỉ có mỗi nút Thêm vào giỏ xếp dọc thô sơ.
Việc đồng bộ Bố cục nút và các tuỳ chọn mua sắm trên trang Search sẽ giúp khách hàng cảm thấy cửa hàng vô cùng nhất quán, chuyên nghiệp và mua sắm dễ dàng ở mọi góc của website.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp constants:** [app/system/experiences/_constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/_constants.ts) định nghĩa danh sách routes quản trị.
- **Tệp config hooks:** [lib/experiences/useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts) định nghĩa types và hook `useSearchFilterConfig()`.
- **Tệp trang search client:** [app/(site)/search/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/search/page.tsx) hiển thị danh sách sản phẩm tìm kiếm.
- **Thư viện/Component dùng chung:** Dự án có sẵn các component editor như `ControlCard`, `ToggleRow`, `SelectRow`, `ColorConfigCard` tại `@/components/experiences/editor`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:**
  1. Thiếu trang quản trị trực quan cho `search_filter_ui` tại `/system/experiences/`.
  2. Giao diện hiển thị sản phẩm trên trang Tìm kiếm `/search` đang render nút mua hàng dạng tĩnh (hardcode), không tuân thủ các cấu hình site config toàn hệ thống (bật/tắt nút mua hàng, wishlist, bố cục nút xếp ngang/dọc, bo góc).
- **Giả thuyết đối chứng:** Có nên dùng chung component `ProductCard` có sẵn ở site không?
  - *Đánh giá:* Trang `/search` hiện tại đang viết cụm render sản phẩm trực tiếp trong JSX để tối ưu hoá hiệu năng hiển thị danh sách dạng Grid/List linh hoạt. Việc tích hợp đọc cấu hình và render nút mua hàng động theo responsive layout ngay trong trang `/search` là giải pháp an toàn, bảo trì cao và giữ vững logic hiện có mà không gây xáo trộn component khác.

---

# IV. Proposal (Đề xuất)
1. **Đăng ký route quản trị:**
   Thêm entry `search-filter` vào `systemExperiences` tại `app/system/experiences/_constants.ts`:
   ```typescript
   {
     description: 'Cấu hình bố cục tìm kiếm, bộ lọc danh mục và hiển thị sản phẩm.',
     href: '/system/experiences/search-filter',
     icon: Search,
     title: 'Tìm kiếm & Bộ lọc',
   }
   ```
2. **Nâng cấp `lib/experiences/useSiteConfig.ts`:**
   - Mở rộng type `SearchFilterConfig` và bổ sung các trường cấu hình sản phẩm mặc định:
     ```typescript
     type SearchFilterConfig = {
       layoutStyle: SearchLayoutStyle;
       resultsDisplayStyle: ResultsDisplayStyle;
       showFilters: boolean;
       showSorting: boolean;
       showResultCount: boolean;
       showWishlistButton: boolean;
       showAddToCartButton: boolean;
       showBuyNowButton: boolean;
       showPromotionBadge: boolean;
       enableQuickAddVariant: boolean;
       cornerRadius: 'none' | 'sm' | 'lg';
       cartButtonsLayout?: 'stack' | 'grid-2';
     };
     ```
   - Cập nhật hàm `useSearchFilterConfig()` để trả về các giá trị default đồng bộ:
     ```typescript
     cornerRadius: raw?.cornerRadius ?? 'lg',
     showWishlistButton: raw?.showWishlistButton ?? true,
     showAddToCartButton: raw?.showAddToCartButton ?? true,
     showBuyNowButton: raw?.showBuyNowButton ?? true,
     showPromotionBadge: raw?.showPromotionBadge ?? true,
     enableQuickAddVariant: raw?.enableQuickAddVariant ?? true,
     cartButtonsLayout: raw?.cartButtonsLayout ?? 'stack',
     ```
3. **Xây dựng trang quản trị `app/system/experiences/search-filter/page.tsx`:**
   - Sử dụng các primitive editor để cho phép tuỳ biến `search_filter_ui` trực quan.
   - Thêm phần cấu hình "Tính năng sản phẩm" giống hệt `products-list/page.tsx` để điều khiển hiển thị nút Wishlist, Add to cart, Buy now, Bo góc và Bố cục nút.
4. **Cập nhật trang search client `app/(site)/search/page.tsx`:**
   - Sử dụng hook `useSearchFilterConfig()` để lấy cấu hình trang search động.
   - Bo góc sản phẩm theo cấu hình `cornerRadius`.
   - Render động các nút Add to cart, Buy now, Wishlist dựa trên trạng thái bật/tắt.
   - Áp dụng bố cục nút (`cartButtonsLayout`) xếp dọc (Stack) hoặc xếp ngang (Grid-2) đồng bộ nhất quán.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa đổi:** [app/system/experiences/_constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/_constants.ts)
  - *Thay đổi:* Đăng ký trải nghiệm `search-filter` vào menu quản trị.
- **Sửa đổi:** [lib/experiences/useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/lib/experiences/useSiteConfig.ts)
  - *Thay đổi:* Bổ sung các trường cấu hình sản phẩm vào `useSearchFilterConfig()`.
- **Thêm mới:** [app/system/experiences/search-filter/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/search-filter/page.tsx)
  - *Thay đổi:* Trang editor quản trị trải nghiệm Tìm kiếm & Bộ lọc trực quan.
- **Sửa đổi:** [app/(site)/search/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/search/page.tsx)
  - *Thay đổi:* Đọc cấu hình trải nghiệm động, áp dụng bo góc sản phẩm và kết xuất các nút mua hàng/wishlist theo bố cục dọc/ngang (Stack/Grid-2) đồng bộ.

---

# VI. Execution Preview (Xem trước thực thi)
1. Thêm route trải nghiệm vào `_constants.ts`.
2. Bổ sung các tham số cấu hình vào `useSiteConfig.ts`.
3. Tạo trang quản trị `search-filter/page.tsx` kế thừa đầy đủ logic editor từ `products-list`.
4. Cập nhật mã nguồn trang `/search` client để vẽ giao diện thẻ sản phẩm động theo cấu hình (bo góc, nút add to cart, buy now, wishlist, xếp dọc/ngang).
5. Kiểm tra kiểu tĩnh TypeScript (`bunx tsc --noEmit`).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Verification
- Chạy typecheck tĩnh: `bunx tsc --noEmit`.

### Manual Verification
- Truy cập `/system/experiences` xem có thẻ "Tìm kiếm & Bộ lọc" không. Click vào để mở editor.
- Thử thay đổi cấu hình: bật/tắt nút "Thêm giỏ hàng", "Mua ngay", chọn Bố cục nút là "Xếp ngang (Grid 2)" và Bo góc là "Không bo góc". Nhấn Lưu.
- Truy cập `http://localhost:3000/search?tab=product`:
  - Kiểm tra xem thẻ sản phẩm có bị mất bo góc không.
  - Các nút "Thêm giỏ hàng" và "Mua ngay" có hiển thị song song nằm ngang (Grid 2) cân đối không.
  - Thử click nút mua ngay và thêm giỏ hàng để xác nhận hoạt động nghiệp vụ hoàn hảo.

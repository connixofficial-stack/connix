# Spec nâng cấp trình dựng menu admin và hộp thoại chọn URL nhanh

# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề là gì?** Khi quản trị viên tạo menu, họ không thể tìm thấy nút chọn nhanh các trang cực kỳ phổ biến như "Tất cả sản phẩm" (`/products`), "Tất cả bài viết" (`/posts`), hoặc "Tất cả dịch vụ" (`/services`). Đồng thời, khi bấm nút "Gợi ý menu", hệ thống gợi ý ra một đống danh mục sản phẩm và danh mục bài viết bị gộp chung dưới cùng một menu cha một cách lộn xộn. Giao diện thiết kế menu dạng danh sách phẳng kéo thụt lề cũng chưa rõ ràng, khiến người dùng khó hình dung quan hệ cha-con.
*   **Giải pháp thế nào?**
    1.  Cập nhật danh mục route mẫu của hệ thống để bổ sung các trang tổng này vào module tương ứng.
    2.  Đổi URL của các menu chính trong gợi ý tự động từ `#` thành `/products`, `/posts`, `/services`. Điều này giúp hệ thống phân biệt được đâu là cha của sản phẩm, đâu là bài viết, từ đó phân nhóm danh mục con vào đúng cha của nó.
    3.  Thêm đường dẫn hướng (tree-guides) bằng nét vẽ góc vuông thanh mảnh ở bên trái của từng mục menu để biểu diễn rõ ràng cấu trúc cây thư mục. Thêm thẻ nhãn cấp độ (Cấp 1, Cấp 2, Cấp 3...) và đổi màu nền nhạt dần theo độ sâu để tăng tính trực quan.

## 2. Elaboration & Self-Explanation
Hiện tại, khi quản trị viên mở hộp thoại "Chọn URL - Bước 1/3" rồi vào "Module", các danh mục `posts`, `products`, `services` đều có mảng rỗng trong cấu hình `MODULE_SITE_ROUTE_CATALOG`. Điều này khiến trang chọn nhanh không hiển thị các link xem tất cả của các module này.
Hơn thế nữa, trong thuật toán gợi ý tự động `smartMenuPlan`, khi tạo ra các đầu mục lớn như "Sản phẩm", "Bài viết", "Dịch vụ", hệ thống đặt URL tạm thời là `#`. Vì tất cả các đầu mục này đều có chung URL là `#`, thuật toán nhóm con (`childrenByRoot`) sử dụng chính URL làm khóa nhận diện đã vô tình gộp chung tất cả các danh mục sản phẩm, danh mục dịch vụ, và danh mục bài viết vào một nhóm duy nhất dưới khóa `#`. Điều này tạo ra kết quả gợi ý menu rất lộn xộn, các danh mục bài viết (như Tin tức, Kiến thức) bị xếp chung cấp và nằm dưới menu Sản phẩm.
Về mặt giao diện của builder, việc chỉ dùng `marginLeft` để dịch chuyển lề của menu item khiến các item bị trôi nổi mà không có sự liên kết trực quan. Chúng tôi sẽ thêm một khung vẽ tuyệt đối (absolute) các đường nét đứt và các góc vuông dẫn hướng cây ở khoảng trống thụt lề, giúp mắt người dùng dễ dàng theo dõi từ một mục con ngược lên mục cha của nó.

## 3. Concrete Examples & Analogies
*   **Analogy (Ví dụ ẩn dụ):** Tưởng tượng bạn có 3 chiếc hộp dán nhãn khác nhau nhưng đều sơn màu đen và không có tên bên ngoài. Khi người giúp việc dọn dẹp, họ gom tất cả đồ chơi (sản phẩm), sách vở (bài viết), và dụng cụ (dịch vụ) bỏ chung vào một đống vì họ tưởng cả 3 cái hộp này là một. Bằng cách ghi rõ tên cụ thể lên từng hộp (thay `#` bằng `/products`, `/posts`, `/services`), người dọn dẹp sẽ phân loại đồ chơi vào đúng hộp đồ chơi, sách vào đúng hộp sách.
*   **Concrete Example (Ví dụ thực tế):**
    *   *Trước đây:* Gợi ý sinh ra Menu Sản phẩm (`#`), dưới đó có: Cơm văn phòng, Tin tức tuyển dụng, Sửa tủ lạnh (lộn xộn).
    *   *Sau khi sửa:*
        *   Sản phẩm (`/products`)
            *   Giày nam (`/products/giay-nam`)
            *   Giày nữ (`/products/giay-nu`)
        *   Bài viết (`/posts`)
            *   Tin tức (`/posts/tin-tuc`)
            *   Kiến thức (`/posts/kien-thuc`)

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra các tệp tin cấu hình menu của hệ thống và phát hiện các điểm sau:
1.  `app/admin/components/QuickRoutePickerModal.tsx`:
    *   `MODULE_SITE_ROUTE_CATALOG` thiếu các phần tử cho `posts`, `products`, `services` dẫn đến người dùng không thể chọn nhanh các trang này.
2.  `app/admin/menus/page.tsx`:
    *   `MODULE_SITE_ROUTE_CATALOG` cũng thiếu các phần tử tương ứng.
    *   Hàm `smartMenuPlan` cấu hình `url: '#'` cho sản phẩm, bài viết và dịch vụ.
    *   Logic gom nhóm children `childrenByRoot` gom các item có cùng `root.url` làm khóa, khiến các item có `url: '#'` bị gộp chung vào một nhóm duy nhất.
    *   Giao diện render danh sách menu items chỉ dùng `marginLeft` mà không vẽ tree-guides.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

*   **Triệu chứng:**
    1.  Không tìm thấy các link `/products`, `/posts`, `/services` trong hộp thoại chọn link nhanh.
    2.  Menu gợi ý tự động sắp xếp lẫn lộn danh mục sản phẩm, dịch vụ và bài viết với nhau.
    3.  Trình dựng menu thiếu trực quan phân cấp.
*   **Root Cause (Nguyên nhân gốc):**
    1.  Mảng cấu hình route mẫu `MODULE_SITE_ROUTE_CATALOG` cho 3 module này đang để rỗng.
    2.  Thuật toán nhóm menu con của gợi ý tự động sử dụng `url` làm khóa định danh nhóm, nhưng cả 3 menu cha (`Sản phẩm`, `Dịch vụ`, `Bài viết`) đều dùng chung `url: '#'`.
    3.  Thiết kế UI chỉ sử dụng thuộc tính CSS `marginLeft` tĩnh, thiếu các thành phần đồ họa liên kết phân cấp dạng cây.
*   **Counter-Hypothesis (Giả thuyết đối chứng):** Nếu chúng ta thay đổi khóa nhóm từ `url` thành một tổ hợp duy nhất hoặc gán URL thực tế cho các menu cha (`/products`, `/posts`, `/services`), và thêm các route mẫu vào catalog, đồng thời bọc ngoài menu item để vẽ các tree-guides, các vấn đề trên sẽ được giải quyết triệt để mà không ảnh hưởng tới bất kỳ logic lưu trữ database nào.

---

# IV. Proposal (Đề xuất)

### a) Cấu hình URL nhanh
Cập nhật `MODULE_SITE_ROUTE_CATALOG` trong cả `QuickRoutePickerModal.tsx` và `app/admin/menus/page.tsx`:
```typescript
  posts: [
    { label: 'Tất cả bài viết', url: '/posts' },
  ],
  products: [
    { label: 'Tất cả sản phẩm', url: '/products' },
  ],
  services: [
    { label: 'Tất cả dịch vụ', url: '/services' },
  ],
```

### b) Sửa logic gợi ý tự động (Smart Menu Builder)
Trong hàm `smartMenuPlan` của `app/admin/menus/page.tsx`:
Thay đổi:
```typescript
    if (enabledKeys.has('products')) {
      add({
        depth: 0,
        label: 'Sản phẩm',
        reasons: [
          'Khu vực sản phẩm đang bật',
          `${productCategories?.length ?? 0} danh mục sản phẩm có thể làm menu con`,
        ],
        score: 96 + Math.min(12, productCategories?.length ?? 0),
        url: '/products', // Thay vì '#'
      });
      appendCategories(productCategories, 'products', 88);
    }
```
Thực hiện tương tự cho `services` (thay `#` bằng `/services`) và `posts` (thay `#` bằng `/posts`).

### c) Nâng cấp giao diện Trình dựng menu (UX/UI Builder)
1.  Bọc phần render menu item bằng một `div` tương đối (`relative`) có `paddingLeft` tương ứng với cấp độ (`depth * 24px`), thay vì dùng trực tiếp `marginLeft` trên menu item.
2.  Thêm một phần tử con vẽ tuyệt đối (`absolute`) để kết nối cây:
    *   Với mỗi cấp bậc `i` từ 0 đến `depth - 1`: vẽ một vạch kẻ dọc `border-l-2 border-slate-200 dark:border-slate-700` rộng `24px` ở vị trí cách lề trái `i * 24px`.
    *   Ở cấp cuối cùng (`i === depth - 1`): vẽ góc vuông L-shape gồm một vạch dọc chỉ dài 50% chiều cao (`h-1/2`) và một vạch ngang ngắn từ vạch dọc sang phải chỉ vào menu item.
3.  Cải thiện hiển thị trực quan của chính menu item:
    *   Thêm nhãn tag hiển thị cấp độ một cách tinh tế:
        *   Cấp 0 (Tầng 1): hiển thị Badge màu xanh/xám nhạt "Cấp 1".
        *   Cấp 1 (Tầng 2): hiển thị Badge màu xám nhạt "Cấp 2".
        *   Cấp 2 (Tầng 3): hiển thị Badge màu xám nhạt "Cấp 3".
    *   Đổi màu nền của menu item nhẹ nhàng theo độ sâu để dễ nhận diện:
        *   Cấp 0: màu nền trắng (`bg-white dark:bg-slate-900`) chuẩn.
        *   Cấp 1: màu nền xám nhẹ (`bg-slate-50/70 dark:bg-slate-900/60`).
        *   Cấp 2: màu nền xám đậm hơn một chút (`bg-slate-100/40 dark:bg-slate-950/40`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

*   `Sửa:` [QuickRoutePickerModal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/components/QuickRoutePickerModal.tsx)
    *   *Vai trò:* Hộp thoại chọn URL nhanh trên toàn hệ thống admin.
    *   *Thay đổi:* Bổ sung các route `/products`, `/posts`, `/services` vào cấu hình mẫu `MODULE_SITE_ROUTE_CATALOG`.
*   `Sửa:` [page.tsx (admin menus)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/menus/page.tsx)
    *   *Vai trò:* Trang quản trị và thiết kế Header Menu chính.
    *   *Thay đổi:*
        1. Bổ sung các route mẫu vào `MODULE_SITE_ROUTE_CATALOG`.
        2. Cập nhật `smartMenuPlan` đổi url của các module chính từ `#` thành `/products`, `/posts`, `/services`.
        3. Cải tiến giao diện thiết kế menu: Thêm các đường dẫn hướng dạng cây (tree-guides), thẻ nhãn cấp độ (Badge level), và style màu nền phân cấp.

---

# VI. Execution Preview (Xem trước thực thi)

1.  **Đọc và chuẩn bị:** Xem lại cấu trúc của các component `Button`, `Label`, `Input` có sẵn để đảm bảo đồng bộ phong cách thiết kế Tailwind CSS + Shadcn.
2.  **Cập nhật QuickRoutePickerModal.tsx:** Thêm các option route của 3 module.
3.  **Cập nhật page.tsx:**
    *   Thêm các option route của 3 module vào catalog.
    *   Chỉnh sửa logic gợi ý menu.
    *   Thay đổi mã nguồn phần render menu items để tích hợp Tree-Guides và nhãn cấp độ.
4.  **Kiểm tra tĩnh:** Rà soát lại lỗi cú pháp, tính tương thích kiểu dữ liệu (TypeScript).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
*   Chạy typecheck để xác nhận không lỗi TypeScript:
    `bunx tsc --noEmit`

### Manual Verification
*   Mở admin menu builder tại `/admin/menus` và kiểm tra các điểm sau:
    1.  Bấm vào nút "Gợi ý" của một ô URL -> Kiểm tra xem trong tab "Module" có hiển thị: "Tất cả sản phẩm" (`/products`), "Tất cả bài viết" (`/posts`), và "Tất cả dịch vụ" (`/services`) không.
    2.  Bấm nút "Gợi ý menu" (Smart Menu Builder) -> Xem bản nháp gợi ý: Kiểm tra xem các danh mục sản phẩm có nằm thụt lề dưới "Sản phẩm", các danh mục bài viết nằm dưới "Bài viết" không (không bị gộp chung hay xếp lẫn lộn nữa).
    3.  Xem giao diện danh sách menu items: Xác nhận các đường kẻ dọc và góc vuông nối phân cấp dạng cây hiển thị đẹp mắt, rõ ràng.
    4.  Kiểm tra các badge cấp độ và màu nền phân cấp của từng item.

---

# VIII. Todo

- [ ] Cập nhật `MODULE_SITE_ROUTE_CATALOG` trong `QuickRoutePickerModal.tsx` để bổ sung các trang tổng.
- [ ] Cập nhật `MODULE_SITE_ROUTE_CATALOG` trong `app/admin/menus/page.tsx`.
- [ ] Sửa URL các root module từ `#` thành `/products`, `/posts`, `/services` trong hàm `smartMenuPlan` ở `app/admin/menus/page.tsx`.
- [ ] Tích hợp tính năng vẽ đường dẫn hướng cây (tree-guides) vào UI hiển thị danh sách menu items ở `app/admin/menus/page.tsx`.
- [ ] Thêm các nhãn hiển thị cấp độ (Badge level) và điều chỉnh màu nền theo cấp độ trong `app/admin/menus/page.tsx`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1.  Hộp thoại chọn link nhanh hiển thị đầy đủ link tổng cho 3 module Sản phẩm, Dịch vụ, Bài viết.
2.  Gợi ý menu thông minh phân nhóm chính xác danh mục theo từng module cha tương ứng, không còn tình trạng danh mục bài viết nằm chung nhóm với danh mục sản phẩm dưới menu cha Sản phẩm.
3.  Giao diện thiết kế hiển thị đường kẻ cây thư mục rõ ràng từ cha đến con, các cấp bậc có thẻ nhãn hỗ trợ phân biệt và màu sắc trực quan.
4.  Không có lỗi biên dịch TypeScript hay oxlint.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

*   **Rủi ro:** Các nét vẽ tuyệt đối có thể bị lệch hoặc tràn khung nếu chiều rộng màn hình nhỏ (responsive).
*   **Giải pháp giảm thiểu:** Sử dụng `pointer-events-none` và giới hạn lề vẽ tương đối theo đúng kích thước thụt lề (`depth * 24px`), ẩn đi ở các màn hình quá nhỏ nếu cần, hoặc đảm bảo khung thiết kế co giãn linh hoạt.
*   **Hoàn tác:** Dùng lệnh `git checkout` các file đã chỉnh sửa nếu phát hiện lỗi nghiêm trọng.

---

# XI. Out of Scope (Ngoài phạm vi)

*   Không xây dựng tính năng kéo thả thay đổi depth động bằng kéo thả ngang (drag left/right to indent), do tính năng này yêu cầu các thư viện kéo thả phức tạp như `@hello-pangea/dnd` hoặc `react-sortable-tree` và có thể gây mất ổn định cho code kéo thả phẳng hiện tại của hệ thống. Chúng tôi giữ nguyên cơ chế kéo thả dọc để đổi vị trí, và dùng nút bấm thụt lề (đã được tối ưu hóa trực quan bằng tree-guides) để đổi depth.

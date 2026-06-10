# Spec: Tích Hợp Cấu Hình Shop Nâng Cao Vào Cài Đặt Admin

# I. Primer

## 1. TL;DR kiểu Feynman
- **Mục tiêu:** Cho phép người quản trị (Admin) tự cấu hình các chi tiết liên quan đến cửa hàng (trạng thái đơn hàng, vận chuyển, thanh toán, địa chỉ) tại trang quản trị của họ (`/admin/settings/advanced`).
- **Cách hoạt động:** 
  1. Thêm một công tắc bật/tắt (feature toggle) tên là `enableShopConfigAdvanced` trong cài đặt hệ thống (`/system/modules/settings`).
  2. Nếu công tắc này được BẬT, một tab mới mang tên "Cấu hình cửa hàng" sẽ xuất hiện trong trang Cài đặt nâng cao của Admin (`/admin/settings/advanced?tab=shop-config`).
  3. Tại trang cấu hình module của hệ thống (`/system/modules/orders`), thêm một nút liên kết nổi bật hướng dẫn Admin đi đến trang quản trị của họ để chỉnh sửa chi tiết.
- **Tiết kiệm mã nguồn (KISS/DRY):** Sử dụng trực tiếp component `OrdersConfigTab` cùng hook `useModuleConfig` của module `orders` ngay tại trang cài đặt Admin thay vì viết lại toàn bộ giao diện lưu trữ mới.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại có các mô-đun (như `orders`, `settings`, `products`...) được thiết kế để Dev/Superadmin cấu hình ở cấp độ hệ thống (`/system/modules/*`). Tuy nhiên, các cài đặt chi tiết của cửa hàng như phương thức thanh toán ngân hàng, phí vận chuyển và định dạng địa chỉ là những thông tin thay đổi thường xuyên bởi chủ sở hữu shop (Admin). Do đó, việc đưa các cài đặt này vào trang Admin Settings (`/admin/settings/advanced`) là rất cần thiết.
Để kiểm soát quyền hiển thị của tab cấu hình này đối với Admin, ta thêm một tính năng tùy chọn `enableShopConfigAdvanced` vào cấu hình module `settings` (`/system/modules/settings`). Khi trang cấu hình Admin nâng cao được tải, nó sẽ kiểm tra xem tính năng này có được bật trong database của module `settings` hay không để quyết định hiển thị tab "Cấu hình cửa hàng".

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi Superadmin truy cập trang cấu hình hệ thống `/system/modules/settings`, họ sẽ thấy một toggle mới là "Cấu hình Shop nâng cao". Khi bật toggle này và lưu lại, Admin của cửa hàng khi đăng nhập vào `/admin/settings/advanced` sẽ thấy xuất hiện thêm tab "Cấu hình cửa hàng" bên cạnh các tab cũ như "Ảnh sản phẩm", "Khung viền sản phẩm", "Watermark"... Admin có thể cấu hình tài khoản ngân hàng VietQR hoặc phí vận chuyển ngay tại đây.
- **Phép so sánh đời thường:** Hãy tưởng tượng hệ thống quản trị giống như một căn hộ chung cư. Superadmin là chủ tòa nhà (người có quyền bật/tắt các tiện ích hệ thống như lắp đặt đường truyền internet nâng cao), còn Admin là người thuê căn hộ. Khi chủ tòa nhà kích hoạt quyền tự quản lý mạng (toggle được bật), người thuê sẽ thấy hộp cáp internet xuất hiện trong phòng mình (tab cấu hình hiển thị) và có thể tự đổi mật khẩu wifi (cấu hình chi tiết thanh toán/vận chuyển).

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file `lib/modules/configs/settings.config.ts`: chứa định nghĩa `settingsModule`, trong đó có danh sách `features`. Toggle `enableHeaderMenuAdvanced` được đặt tại đây và đóng vai trò là pattern tham chiếu.
- Đã kiểm tra file `app/admin/settings/_components/SettingsPageShell.tsx`: chứa logic hiển thị các tab nâng cao. Tab "Header" được điều khiển bởi tính năng `enableHeaderMenuAdvanced`.
- Đã kiểm tra file `lib/modules/configs/orders.config.ts` và `components/modules/orders/OrdersConfigTab.tsx`: định nghĩa cấu trúc cấu hình và UI của module `orders` (bao gồm các tab chung, vận chuyển, thanh toán, địa chỉ, trạng thái đơn hàng).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề:** Hiện tại chưa có nút dẫn từ trang cấu hình hệ thống đơn hàng sang trang Admin và chưa có tab cấu hình chi tiết shop (OrdersConfigTab) trong trang Admin Settings nâng cao, cũng như chưa có toggle điều khiển quyền hiển thị của tab này trong Module Settings.
- **Giải pháp:** Bổ sung cấu hình tính năng mới, tạo liên kết UI và nhúng component cấu hình vào trang quản trị nâng cao.

# IV. Proposal (Đề xuất)
1. Thêm feature `enableShopConfigAdvanced` vào `settingsModule` trong `lib/modules/configs/settings.config.ts`.
2. Sửa `components/modules/orders/OrdersConfigTab.tsx`:
   - Thêm prop `hideModuleStatus` để ẩn phần bật/tắt module khi nhúng trong trang Admin.
   - Thêm nút liên kết đi đến `/admin/settings/advanced?tab=shop-config` khi hiển thị trên trang cấu hình hệ thống (khi `hideModuleStatus` là false).
3. Sửa `app/admin/settings/_components/SettingsPageShell.tsx`:
   - Định nghĩa tính năng `enableShopConfigAdvanced`.
   - Khởi tạo hook `useModuleConfig` cho `ordersModule`.
   - Tích hợp trạng thái `hasChanges`, `isSaving` và hàm `handleSave` của module orders khi admin chuyển sang tab `shop-config`.
   - Hiển thị tab "Cấu hình cửa hàng" nếu tính năng được bật.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa: lib/modules/configs/settings.config.ts`
  - Thêm import `ShoppingBag` từ `lucide-react`.
  - Bổ sung đối tượng feature `enableShopConfigAdvanced` vào mảng `features`.
- `Sửa: components/modules/orders/OrdersConfigTab.tsx`
  - Bổ sung prop `hideModuleStatus` vào component `OrdersConfigTab`.
  - Hiển thị nút điều hướng sang Admin Settings nếu `hideModuleStatus` là `false` (hoặc `undefined`).
  - Ẩn component `ModuleStatus` nếu `hideModuleStatus` là `true`.
- `Sửa: app/admin/settings/_components/SettingsPageShell.tsx`
  - Import `ordersModule` từ `@/lib/modules/configs/orders.config` và `OrdersConfigTab` từ `@/components/modules/orders/OrdersConfigTab`.
  - Khởi tạo hook `useModuleConfig` với `ordersModule`.
  - Cập nhật kiểu `AdvancedTab` để chứa giá trị `'shop-config'`.
  - Tích hợp logic kiểm tra thay đổi và xử lý sự kiện lưu của tab `shop-config` vào `hasChanges`, `handleSave` và `isSaving`.
  - Bổ sung giao diện tab button và nội dung hiển thị cho tab "Cấu hình cửa hàng".

# VI. Execution Preview (Xem trước thực thi)
1. **Chỉnh sửa config:** Thêm feature mới vào `settings.config.ts`.
2. **Cập nhật OrdersConfigTab:** Bổ sung prop ẩn trạng thái module và render panel dẫn link sang Admin.
3. **Cập nhật SettingsPageShell:** Gọi hook `useModuleConfig(ordersModule)` và liên kết các state/handler, render giao diện tab mới khi `advancedTab === 'shop-config'`.
4. **Đồng bộ và Kiểm tra:** Người dùng/Tester sẽ đồng bộ cài đặt từ định nghĩa và tiến hành kiểm tra trên giao diện thực tế.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra kiểu dữ liệu:** Sử dụng oxlint (chạy tự động trước khi commit) để đảm bảo không lỗi TypeScript.
- **Xác minh thủ công:**
  1. Vào `/system/modules/settings`, bấm nút "Đồng bộ từ định nghĩa" để nạp toggle mới vào database, sau đó thử bật/tắt toggle "Cấu hình Shop nâng cao".
  2. Vào `/system/modules/orders`, kiểm tra xem nút đi đến "Cấu hình Admin" có hiển thị chính xác và dẫn link chuẩn không.
  3. Vào `/admin/settings/advanced`, kiểm tra sự xuất hiện của tab "Cấu hình cửa hàng" (chỉ xuất hiện khi toggle được bật).
  4. Thực hiện chỉnh sửa thử tài khoản ngân hàng hoặc phí vận chuyển ở tab này và bấm "Lưu thay đổi", đảm bảo dữ liệu được lưu thành công vào DB và hiển thị chính xác sau khi reload trang.

# VIII. Todo
- [ ] Thêm feature `enableShopConfigAdvanced` vào `lib/modules/configs/settings.config.ts`.
- [ ] Bổ sung prop `hideModuleStatus` và nút điều hướng sang Admin vào `components/modules/orders/OrdersConfigTab.tsx`.
- [ ] Tích hợp `useModuleConfig` của module `orders` và render tab `shop-config` trong `app/admin/settings/_components/SettingsPageShell.tsx`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Toggle "Cấu hình Shop nâng cao" xuất hiện ở `/system/modules/settings`.
- Tab "Cấu hình cửa hàng" hiển thị tại `/admin/settings/advanced` khi toggle bật, ẩn đi khi toggle tắt.
- Có nút điều hướng nổi bật từ `/system/modules/orders` sang `/admin/settings/advanced?tab=shop-config`.
- Mọi thay đổi cấu hình cửa hàng trong tab này được lưu chính xác vào dữ liệu module `orders` mà không làm thay đổi các cấu hình hệ thống khác.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Xung đột khi gọi song song nhiều truy vấn hoặc đột ngột thay đổi schema. Tuy nhiên, do chúng ta sử dụng lại hook chuẩn `useModuleConfig` của Convex đã được tối ưu nên rủi ro xung đột dữ liệu là cực thấp.
- **Hoàn tác:** `git checkout -- <file_paths>` để khôi phục trạng thái ban đầu của 3 file bị ảnh hưởng.

# XI. Out of Scope (Ngoài phạm vi)
- Việc thay đổi schema của bảng `settings` hay `modules` là ngoài phạm vi.
- Sửa đổi các module khác như `products`, `posts` không thuộc phạm vi yêu cầu.

# I. Primer
## 1. TL;DR kiểu Feynman
- Tính năng **Khung viền sản phẩm** hiện đang chỉ hỗ trợ 1 ảnh khung hình duy nhất (`product_frame_overlay_url`). Điều này dẫn tới việc khi ảnh sản phẩm có các tỷ lệ khác nhau (như `16:9`, `3:4`, `9:16`), khung viền sẽ bị méo hoặc lệch, không vừa vặn.
- Giải pháp là nâng cấp lên **5 ảnh khung viền tương ứng với 5 tỷ lệ khung hình (Aspect Ratio - AR)** cố định phổ biến: `1:1` (Vuông), `16:9` (Rộng), `9:16` (Dọc dài), `3:4` (Dọc ngắn), và `4:3` (Ngang).
- Thay vì một màn hình quản lý phức tạp hay cơ chế tự động co dãn, admin chỉ cần chuẩn bị sẵn các file khung hình trong suốt (.png/.webp) theo đúng các tỷ lệ trên rồi upload lên tab **Khung viền sản phẩm** trong trang Cấu hình nâng cao (`/admin/settings/advanced`).
- Hệ thống storefront sẽ tự động so khớp tỷ lệ của ảnh sản phẩm đang render để đè đúng ảnh khung hình tương ứng lên trên, giúp giao diện hiển thị vừa khít và chuyên nghiệp mà không gây nợ kỹ thuật hay overhead.

## 2. Elaboration & Self-Explanation
Hiện nay, việc hiển thị khung viền sản phẩm theo mùa hoặc theo chiến dịch tiếp thị rất phổ biến ở các trang e-commerce. Tuy nhiên, mỗi phần hiển thị (như danh sách sản phẩm trên trang chủ, chi tiết sản phẩm, banner tiếp thị) lại thường sử dụng các tỷ lệ ảnh khác nhau. Một ảnh khung viền duy nhất (thường là tỷ lệ `1:1`) khi áp dụng lên ảnh `16:9` hay `9:16` sẽ bị kéo giãn (stretch) làm biến dạng họa tiết hoặc để lộ khoảng trống xấu xí.

Để xử lý triệt để mà vẫn giữ tính đơn giản (KISS/YAGNI), chúng ta sẽ khai báo 5 key cấu hình mới trong bảng `settings` đại diện cho 5 tỷ lệ ảnh chuẩn:
- `product_frame_overlay_square_url` (1:1)
- `product_frame_overlay_wide169_url` (16:9)
- `product_frame_overlay_portrait916_url` (9:16)
- `product_frame_overlay_portrait34_url` (3:4)
- `product_frame_overlay_landscape43_url` (4:3)

Khi render, hook `useProductFrameConfig(aspectRatio)` sẽ hoạt động như một bộ định tuyến tỷ lệ (ratio router). Nó sẽ nhận diện aspect ratio cụ thể của bức ảnh (nếu nơi gọi truyền vào) hoặc tự động lấy aspect ratio mặc định của hệ thống (`defaultImageAspectRatio` của module `products`) làm fallback. Từ đó, nó truy xuất đúng URL ảnh khung tương ứng từ Convex settings để đè lên ảnh sản phẩm bằng CSS absolute overlay (`pointer-events-none`).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Cửa hàng chạy sự kiện Tết, designer thiết kế 2 khung viền có hoa đào xung quanh: một khung vuông `1:1` cho danh sách sản phẩm và một khung dọc `3:4` cho trang chi tiết sản phẩm. Admin upload cả 2 ảnh này lên hệ thống. Khi khách hàng lướt trang chủ (nơi dùng ảnh vuông), ảnh sản phẩm sẽ tự động được ghép khung vuông `1:1`. Khi khách hàng click vào xem chi tiết sản phẩm (nơi hiển thị ảnh dọc `3:4`), trang chi tiết sẽ tự động tải và hiển thị khung dọc `3:4`. Khung viền luôn khớp khít, không bị méo.
- **Analogy:** Giống như bạn có các bức ảnh cỡ khác nhau (cỡ hộ chiếu, cỡ 10x15, cỡ siêu lớn). Thay vì cố nhét tất cả vào một chiếc khung duy nhất rồi cắt xén hay bóp méo bức ảnh, bạn chuẩn bị sẵn 5 chiếc khung gỗ có kích thước tương ứng. Khi cần trưng bày bức ảnh nào, bạn chỉ việc đặt chiếc khung có kích cỡ vừa vặn nhất lên trên bức ảnh đó.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Hệ thống hiện tại:** Đang dùng cấu hình `enable_product_frames` (bật/tắt) và `product_frame_overlay_url` (đường dẫn 1 ảnh khung hình duy nhất) trong bảng `settings`.
- **Mã nguồn storefront:** Toàn bộ các trang danh sách sản phẩm (`ProductsPage.tsx`, `ProductGridSection.tsx`, `ProductListSection.tsx`, `ComponentRenderer.tsx`) và trang chi tiết (`ProductDetailPage.tsx`) đều sử dụng hook `useProductFrameConfig` và component `ProductImageFrameOverlay` từ `@/components/shared/ProductImageFrameBox.tsx`.
- **Dữ liệu settings:** Dữ liệu settings được quản lý tập trung và lưu trữ thông qua `SettingsPageShell.tsx` gọi mutation `setMultiple` của Convex `settings.ts`.
- **Hạn chế:** Chưa có cơ chế phân tách và hiển thị khung viền theo từng tỷ lệ khung hình (Aspect Ratio), dẫn tới biến dạng UI khi hiển thị các tỷ lệ ảnh không phải `1:1`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause Confidence:** **High.** Việc thiếu cơ chế ánh xạ giữa tỷ lệ ảnh sản phẩm hiện tại và ảnh khung viền tương ứng chính là lý do trực tiếp gây ra việc hiển thị lệch khung. Việc lưu trữ cấu hình dưới dạng các settings key riêng biệt là giải pháp tối giản và an toàn nhất, tận dụng được hạ tầng lưu trữ và quản lý file của Convex mà không cần thêm table hay mutation mới.
- **Counter-Hypothesis:** Có nên tạo một bảng riêng biệt trong database để quản lý các file khung hình không?
  - *Đánh giá:* Không cần thiết và vi phạm nguyên tắc YAGNI. Số lượng tỷ lệ ảnh sản phẩm được hỗ trợ là cố định (5 tỷ lệ). Việc dùng 5 key cố định trong bảng `settings` giúp ta tái sử dụng toàn bộ luồng lưu dữ liệu, kiểm soát file lifecycle và UI uploader hiện có mà không sinh thêm bảng, mutation hay nợ kỹ thuật.

# IV. Proposal (Đề xuất)
- **Cấu trúc dữ liệu mới:** Lưu 5 ảnh khung viền và 5 storage ID tương ứng trong bảng `settings`:
  - `product_frame_overlay_square_url` & `product_frame_overlay_square_url__storageId` (1:1)
  - `product_frame_overlay_portrait916_url` & `product_frame_overlay_portrait916_url__storageId` (9:16)
  - `product_frame_overlay_portrait34_url` & `product_frame_overlay_portrait34_url__storageId` (3:4)
  - `product_frame_overlay_landscape43_url` & `product_frame_overlay_landscape43_url__storageId` (4:3)
  - `product_frame_overlay_wide169_url` & `product_frame_overlay_wide169_url__storageId` (16:9)
- **UI quản trị nâng cấp:**
  - Ở `/admin/settings/advanced` (tab **Khung viền sản phẩm**): Thay thế uploader đơn lẻ cũ bằng 5 uploader tương ứng với 5 tỷ lệ khung hình.
  - Hiển thị tỷ lệ ảnh mặc định hiện tại của hệ thống (lấy từ `products.defaultImageAspectRatio`) dạng: `Tỷ lệ ảnh mặc định: Vuông (1:1)` và hiển thị badge `Đang dùng mặc định` trên uploader tương ứng để admin dễ nhận biết.
- **Logic storefront thông minh:**
  - Hook `useProductFrameConfig` sẽ nhận tham số optional `aspectRatio?: string`.
  - Nếu `aspectRatio` được truyền vào, hook sẽ trả về URL tương ứng với tỷ lệ đó.
  - Nếu không truyền, hook sẽ fallback về `defaultImageAspectRatio` của hệ thống, và cuối cùng fallback về `square` (1:1).
  - Tương thích ngược: Nếu ảnh khung cho tỷ lệ cụ thể trống, hệ thống sẽ kiểm tra và sử dụng `product_frame_overlay_url` cũ làm fallback cuối cùng trước khi ẩn khung.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [ProductImageFrameBox.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/shared/ProductImageFrameBox.tsx)
  - Vai trò hiện tại: Cung cấp hook `useProductFrameConfig` và component `ProductImageFrameOverlay` cho storefront.
  - Thay đổi: Cập nhật hook `useProductFrameConfig` nhận tham số `aspectRatio?: string`. Query 5 setting key mới và resolve đúng key dựa trên `aspectRatio` (hoặc `defaultImageAspectRatio` mặc định). Giữ tương thích ngược với key `product_frame_overlay_url` cũ.
- **Sửa:** [SettingsPageShell.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/settings/_components/SettingsPageShell.tsx)
  - Vai trò hiện tại: Giao diện quản lý các thiết lập hệ thống ở admin dashboard.
  - Thay đổi: Thêm khởi tạo và lưu trữ cho 5 key cài đặt mới. Thiết kế lại tab "Khung viền sản phẩm" hiển thị 5 card uploader tương ứng 5 tỷ lệ khung hình, hiển thị tỷ lệ mặc định và badge gợi ý.
- **Sửa:** [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
  - Vai trò hiện tại: Giao diện chi tiết sản phẩm.
  - Thay đổi: Truyền thêm `imageAspectRatio` vào hook `useProductFrameConfig(imageAspectRatio)` để hiển thị đúng khung cho ảnh chi tiết.
- **Sửa:** [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/_components/ProductsPage.tsx)
  - Vai trò hiện tại: Giao diện danh sách sản phẩm theo danh mục.
  - Thay đổi: Truyền thêm `imageAspectRatio` vào hook `useProductFrameConfig(imageAspectRatio)`.
- **Sửa:** [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ComponentRenderer.tsx)
  - Vai trò hiện tại: Render các components trên trang chủ.
  - Thay đổi: Cập nhật `CategoryProductsSection` truyền thêm `imageAspectRatio` vào `useProductFrameConfig`.
- **Sửa:** [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
  - Vai trò hiện tại: Section lưới sản phẩm trang chủ.
  - Thay đổi: Truyền thêm `imageAspectRatio` vào `useProductFrameConfig`.
- **Sửa:** [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx)
  - Vai trò hiện tại: Section danh sách sản phẩm trang chủ.
  - Thay đổi: Truyền thêm `imageAspectRatio` vào `useProductFrameConfig`.

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc & Phân tích:** Kiểm tra chi tiết cấu trúc code của `SettingsPageShell.tsx` và `ProductImageFrameBox.tsx` để khớp các tham số và state.
2. **Cập nhật Logic Shared:** Sửa `ProductImageFrameBox.tsx` để bổ sung hook hỗ trợ 5 tỷ lệ ảnh kèm fallback tương thích ngược.
3. **Cập nhật UI Admin:** Sửa `SettingsPageShell.tsx` khởi tạo, hiển thị uploader và lưu 5 key mới cùng storageId tương ứng lên Convex.
4. **Tích hợp Storefront:** Truyền aspect ratio tương ứng vào hook `useProductFrameConfig` tại các file storefront chính (`ProductDetailPage.tsx`, `ProductsPage.tsx`, `ComponentRenderer.tsx`, `ProductGridSection.tsx`, `ProductListSection.tsx`).
5. **Kiểm tra biên:** Chạy typecheck và kiểm tra giao diện admin/storefront.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Static Verification (Kiểm chứng tĩnh)
- Đảm bảo dự án không gặp lỗi TypeScript sau khi thay đổi kiểu dữ liệu của hook `useProductFrameConfig`.
- Chạy lệnh kiểm tra kiểu dữ liệu:
  ```powershell
  bunx tsc --noEmit 2>&1 | Select-Object -First 10
  ```

## 2. Manual Verification (Kiểm chứng thủ công)
- **Trang Admin:**
  - Truy cập `/admin/settings/advanced`, mở tab **Khung viền sản phẩm**.
  - Kiểm tra xem 5 uploader tương ứng với các tỷ lệ (`1:1`, `16:9`, `9:16`, `3:4`, `4:3`) đã hiển thị đầy đủ và có ghi chú rõ ràng chưa.
  - Thay đổi tỷ lệ ảnh sản phẩm mặc định trong cấu hình module `products` thành `portrait34` và quay lại tab **Khung viền sản phẩm** để kiểm tra xem badge `Đang dùng mặc định` có nhảy sang card `Dọc (3:4)` hay không.
  - Upload thử ảnh khung cho từng tỷ lệ, lưu lại và refresh trang để xác nhận ảnh vẫn hiển thị chính xác.
- **Trang Storefront:**
  - Bật tính năng khung viền sản phẩm và kiểm tra trên trang chủ, trang danh sách sản phẩm, trang chi tiết sản phẩm.
  - Đảm bảo khi ảnh sản phẩm là ảnh vuông (`1:1`), khung vuông `1:1` được hiển thị; khi ảnh là dọc (`3:4`), khung dọc `3:4` được hiển thị.
  - Đảm bảo nếu chưa upload khung hình cụ thể cho một tỷ lệ, hệ thống sẽ ẩn khung hình (hoặc fallback về khung hình đơn lẻ cũ nếu có thiết lập) mà không hiển thị khung lệch tỷ lệ gây méo mó.

# VIII. Todo
- [ ] Cập nhật `components/shared/ProductImageFrameBox.tsx` bổ sung logic router tỷ lệ ảnh khung cho hook `useProductFrameConfig`.
- [ ] Cập nhật `app/admin/settings/_components/SettingsPageShell.tsx` để khởi tạo, hiển thị và lưu trữ 5 key cài đặt mới.
- [ ] Cập nhật trang chi tiết `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` truyền thêm aspect ratio vào hook.
- [ ] Cập nhật trang danh sách `app/(site)/[categorySlug]/_components/ProductsPage.tsx` truyền thêm aspect ratio vào hook.
- [ ] Cập nhật component trang chủ `components/site/ComponentRenderer.tsx` truyền thêm aspect ratio vào hook.
- [ ] Cập nhật component trang chủ `components/site/ProductGridSection.tsx` truyền thêm aspect ratio vào hook.
- [ ] Cập nhật component trang chủ `components/site/ProductListSection.tsx` truyền thêm aspect ratio vào hook.
- [ ] Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để kiểm tra lỗi biên dịch TypeScript.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Tab **Khung viền sản phẩm** hiển thị đầy đủ uploader cho 5 tỷ lệ khung hình: `Vuông (1:1)`, `Rộng (16:9)`, `Dọc (9:16)`, `Dọc (3:4)`, `Ngang (4:3)`.
- badge `Đang dùng mặc định` được gắn đúng vào uploader có tỷ lệ trùng với `defaultImageAspectRatio` của module products.
- Storefront hiển thị đúng ảnh khung viền tương thích với tỷ lệ của ảnh sản phẩm đang render.
- CSS của ảnh khung viền luôn là `absolute inset-0 h-full w-full object-contain pointer-events-none select-none` để đảm bảo vừa khít và không cản trở tương tác chuột của khách hàng.
- Lệnh biên dịch `bunx tsc --noEmit` hoàn thành không lỗi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một số file storefront cũ hoặc tự thiết kế (nếu có) có thể không nhận diện được aspect ratio và hiển thị không đồng nhất.
- **Giảm thiểu:** Đã bổ sung fallback tự động về `defaultImageAspectRatio` của hệ thống và fallback cuối cùng về `square` (1:1), cùng fallback tương thích ngược về `product_frame_overlay_url` cũ nên rủi ro hiển thị lỗi là cực kỳ thấp.
- **Rollback:** Thực hiện `git checkout -- .` để khôi phục lại toàn bộ trạng thái code trước khi chỉnh sửa.

# XI. Out of Scope (Ngoài phạm vi)
- Không hỗ trợ tự động căn chỉnh, cắt cúp (crop) ảnh khung hình ngay trên trình duyệt của admin.
- Không tự động xóa nền cho ảnh khung hình của admin upload lên.
- Không bao gồm việc sửa đổi cách hoạt động của thư viện lưu trữ Convex.

# XII. Open Questions (Câu hỏi mở)
*(Không có)*

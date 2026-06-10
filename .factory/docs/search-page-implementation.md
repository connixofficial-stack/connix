# ĐẶC TẢ KỸ THUẬT: XÂY DỰNG TRANG KẾT QUẢ TÌM KIẾM (/search)

# I. Primer

## 1. TL;DR kiểu Feynman
* Khi gõ tìm kiếm ở thanh Header, hệ thống gợi ý rất tốt thông qua tính năng autocomplete.
* Tuy nhiên, nếu ấn Enter, trình duyệt điều hướng tới `/search?q=từ_khóa` và gặp lỗi 404 vì thư mục `app/(site)/search` chưa được khai báo.
* Chúng ta cần tạo một trang `/search` mới dưới dạng Client Component (bao bọc trong Suspense để tránh lỗi build khi sử dụng `useSearchParams`).
* Trang này sẽ sử dụng các API Convex sẵn có (`listPublishedWithOffset` của các bảng products, posts, services) để truy xuất dữ liệu đầy đủ tương ứng với từ khóa tìm kiếm.
* Đảm bảo giao diện hiện đại (UI/UX), hỗ trợ chuyển đổi chế độ xem Grid/List, bộ lọc phân loại theo module và danh mục, fuzzy search thông minh, và hỗ trợ DX sạch sẽ.
* Cung cấp cơ chế ảnh fallback chuẩn: bài viết/dịch vụ dùng fallback CSS/icon tinh tế, sản phẩm dùng placeholder lấy từ cài đặt hệ thống.
* **Bổ sung UI/UX di động**: Thêm nút xóa nhanh từ khóa (icon X nhỏ) trên ô input tìm kiếm của Header (`HeaderSearchAutocomplete`) giúp cải thiện đáng kể trải nghiệm người dùng khi thao tác bằng một tay trên điện thoại.

## 2. Elaboration & Self-Explanation
Hiện nay, khi người dùng nhập từ khóa tìm kiếm và nhấn Enter, URL chuyển sang `/search?q=từ_khóa`. Route này bị Next.js map nhầm vào dynamic route `[categorySlug]/page.tsx` và trả về 404. 

Để giải quyết, chúng ta tạo một tĩnh route `/search` tại `app/(site)/search/page.tsx` để shadow route động đó. Trang search này sẽ lấy từ khóa `q` từ search parameters của URL, gọi song song các Convex queries để lấy danh sách và tổng số lượng của sản phẩm, bài viết, dịch vụ.

Trang search được thiết kế tối ưu với:
* **Bộ lọc và Fuzzy Search**: Tích hợp ô search lớn, nút xóa nhanh từ khóa, bộ lọc Sort (Mới nhất, Cũ nhất, Phổ biến, Giá tăng/giảm dần) và bộ lọc Danh mục động cho từng loại thực thể.
* **Chế độ hiển thị (View Mode Toggle)**: Cho phép chuyển đổi linh hoạt giữa Grid (lưới thẻ trực quan) và List (danh sách trải dài giúp đọc và so sánh thông tin nhanh).
* **Quản lý Hình ảnh Fallback**: 
  * Sản phẩm: Lấy ảnh placeholder từ cài đặt admin (`product_image_placeholder`).
  * Bài viết và Dịch vụ: Render một khung ảnh mặc định sang trọng kết hợp icon CSS mịn màng của Lucide.
* **DX (Developer Experience)**: Code được tổ chức mô-đun hóa, cấu trúc Type-safe hoàn toàn, tách biệt logic Suspense và tái sử dụng tối đa các helper hook của website.

Đồng thời, để hoàn thiện UI/UX toàn hệ thống tìm kiếm:
* Cải tiến component `HeaderSearchAutocomplete` ở Header bằng cách tích hợp một nút X tròn nhỏ ở góc phải của input khi có văn bản gõ vào. Bấm nút này sẽ xóa sạch từ khóa gõ dở, đóng popup gợi ý kết quả và focus lại vào ô nhập liệu để sẵn sàng gõ từ mới, cực kỳ tiện lợi trên thiết bị di động.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi người dùng tìm "Nike" và bấm Enter, trang search mở ra. Mặc định hiển thị tab **Sản phẩm** dạng Grid 4 cột. Người dùng bấm nút "Xem danh sách" (List View), giao diện chuyển thành các hàng ngang dọc, ảnh sản phẩm lớn bên trái, bên phải là tên, giá bán và nút "Thêm vào giỏ" nằm gọn gàng giúp dễ so sánh giá giữa các đôi Nike khác nhau. Nếu một bài viết cũ không có ảnh bìa, hệ thống sẽ tự động hiển thị một khung gradient xám kèm icon `FileText` tinh xảo chứ không bị vỡ bố cục ảnh lỗi.
  * **Trải nghiệm trên điện thoại**: Người dùng đang gõ tìm kiếm "Nike Jordan" trên Header nhưng muốn đổi ý tìm "Camo". Thay vì phải bấm xóa từng ký tự bằng bàn phím ảo chậm chạp, họ chỉ cần gõ nhẹ vào dấu X nhỏ ở góc phải ô tìm kiếm. Ô search lập tức sạch bong chữ, bàn phím vẫn giữ trạng thái sẵn sàng để nhập từ mới "Camo".
* **Sự tương đồng (Analogy)**: Nó giống như một bộ lọc catalog thông minh trong thư viện. Bạn có một ô tra cứu ở sảnh chính. Khi tra cứu từ khóa "Khoa học", thủ thư đưa ra một tập hồ sơ chia làm 3 ngăn: Sách khoa học (Sản phẩm), Bài báo nghiên cứu (Bài viết), Các khóa học thực nghiệm (Dịch vụ). Bạn có thể chọn xếp chúng lên bàn theo hàng lối để so sánh độ dày (Chế độ List) hoặc xếp thành lưới để nhìn bìa sách (Chế độ Grid). Nếu cuốn sách nào bị mất bìa, thủ thư sẽ bọc tạm một bìa màu ghi chuẩn mực có ghi ký hiệu sách để kệ sách luôn gọn gàng.
  * Nút xóa nhanh tương tự như nút "Xóa bảng" nhanh của giáo viên bằng bông lau bảng trong một nốt nhạc, thay vì phải tỉ mẩn lau từng chữ bằng ngón tay.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Route bị lỗi**: `/search?q=...` bị map nhầm vào dynamic route và trả về 404.
* **Cơ sở hạ tầng API**: Các query Convex `listPublishedWithOffset` và `countPublished` của `products`, `posts`, `services` đã hỗ trợ đầy đủ fuzzy search qua đối số `search`.
* **Cài đặt admin**: Convex đã lưu cấu hình placeholder ảnh sản phẩm tại setting `product_image_placeholder`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Thiếu route tĩnh `/search` trong hệ thống Next.js page routing, dẫn đến yêu cầu bị chuyển tiếp đến route động danh mục động gây lỗi 404.
* **Giả thuyết đối chứng**: Việc tạo tệp `app/(site)/search/page.tsx` sẽ được Next.js ưu tiên phân giải trước các route động khác, triệt tiêu lỗi 404 cho url search.

* **Độ tin cậy nguyên nhân gốc**: **High**.

---

# IV. Proposal (Đề xuất)
* **Giải pháp**: Xây dựng trang `/search` tại `app/(site)/search/page.tsx` và nâng cấp ô search autocomplete của Header.
* **Tính năng chi tiết**:
  * **Header Search Quick Clear**: Thêm nút icon X tuyệt đối trong `HeaderSearchAutocomplete` hiển thị khi gõ chữ, tự động căn lề phải tương thích với việc có/không có nút kính lúp (`right-8` hoặc `right-3`).
  * **Module-Aware Tabs & Search**: Hệ thống tự kiểm tra xem các module (Sản phẩm, Bài viết, Dịch vụ) có bật ở trang quản trị hay không. Module nào tắt thì ẩn tab tương ứng và không kích hoạt Convex queries cho module đó. Đồng thời, tự động chuyển đổi sang tab hoạt động có sẵn khác nếu người dùng truy cập trực tiếp tab bị tắt.
  * **Tối ưu Spacing & Layout**:
    * Loại bỏ tiêu đề giới thiệu rườm rà ở đầu trang, chỉ giữ lại thanh tìm kiếm lớn với spacing gọn gàng (`mb-6 md:mb-8`).
    * Mở rộng độ rộng tối đa của layout lên `max-w-[1600px]` (tương đương `max-w-8xl` trên desktop lớn).
    * Thiết lập padding lề trên các thiết bị di động/tablet cực kỳ sát rìa (`px-2 sm:px-4`) để tận dụng tối đa chiều rộng màn hình, tăng trải nghiệm trực quan.
  * **View Mode**: Grid và List (lưu trạng thái view mode trong state).
  * **Fuzzy Search & Re-search**: Ô nhập từ khóa lớn ở đầu trang với nút "Clear" và nút hành động tìm kiếm tức thì.
  * **Tabbed Results**: "Sản phẩm", "Bài viết", "Dịch vụ" kèm theo số lượng đếm được fetch đồng thời.
  * **Bộ lọc phụ**: 
    * Sắp xếp: Theo thời gian, độ phổ biến, giá cả.
    * Danh mục: Lọc theo danh mục tương ứng của tab đang hoạt động.
  * **Fallback hình ảnh**: Cấu hình ảnh fallback cho bài viết/dịch vụ qua CSS, sản phẩm qua setting placeholder từ admin.
  * **Giỏ hàng**: Nút Add to Cart nhanh trên thẻ sản phẩm, tích hợp với context `useCart` và `notifyAddToCart`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### [NEW] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/search/page.tsx)
* **Mô tả vai trò**: Trang đích xử lý tìm kiếm đa mục tiêu (sản phẩm, bài viết, dịch vụ).
* **Thay đổi**: Tạo mới file này, wrap toàn bộ logic tìm kiếm trong Suspense boundary, triển khai state và layout để hiển thị kết quả lọc, chế độ xem Grid/List, các filter danh mục, sort, fallback ảnh và giỏ hàng nhanh.

### [MODIFY] [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
* **Mô tả vai trò**: Hộp tìm kiếm gợi ý trên Header chính của trang web.
* **Thay đổi**: Sửa đổi để tích hợp thêm nút xóa nhanh (nút X tròn nhỏ) tuyệt đối bên phải khi ô input có ký tự gõ vào, đồng thời căn chỉnh khoảng cách hợp lý tùy thuộc nút kính lúp có hiển thị hay không và xử lý sự kiện focus lại input sau khi clear.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Tạo cấu trúc thư mục và file**: Tạo folder `app/(site)/search` và tệp `page.tsx`.
2. **Khai báo component chính**: `SearchPage` (wrap trong Suspense) và `SearchContent`.
3. **Cập nhật component Header Autocomplete**:
   * Thêm icon `X` từ `lucide-react` vào danh sách imports.
   * Thêm nút button `X` tuyệt đối nằm trên ô input, có xử lý vị trí `right-8` (nếu hiển thị nút Search) và `right-3` (nếu ẩn nút Search).
   * Gắn sự kiện click để clear state, đóng autocomplete dropdown, và focus lại vào ô input qua `inputRef`.
4. **Xử lý URL search parameters của trang search**:
   * Đọc `q` và các tham số filter/sorting/viewMode.
5. **Gọi Convex APIs trên trang search**:
   * Fetch categories và thực hiện queries `listPublishedWithOffset` song song.
6. **Thiết kế UI/UX & Fallback trên trang search**:
   * Thiết kế tabbar, view mode toggle (Grid/List), product card custom, fallback ảnh cho posts/services.
7. **Xác thực static build**: Đảm bảo tệp tin biên dịch không lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Static Code Checking
* Chạy kiểm tra tĩnh TypeScript: `bunx tsc --noEmit`.

### Manual Verification
1. Truy cập trang chủ, gõ từ khóa "Jordan" vào thanh tìm kiếm của Header. Xác nhận xuất hiện nút X nhỏ. Click vào nút X, kiểm tra xem từ khóa có bị xóa sạch và popup gợi ý đóng lại không, ô input có tự động focus lại không.
2. Kiểm tra trên giả lập màn hình di động, click icon kính lúp trên mobile để mở thanh search Header của mobile. Gõ chữ và bấm X xóa thử để kiểm tra UI/UX trên mobile.
3. Truy cập `/search?q=Camo`. Xác minh không còn lỗi 404.
4. Test chuyển đổi tab: "Sản phẩm", "Bài viết", "Dịch vụ" có hiển thị đúng kết quả liên quan đến "Camo" không.
5. Test chuyển view mode giữa Grid và List ở từng tab.
6. Thử thêm nhanh sản phẩm vào giỏ hàng từ trang search.
7. Test tìm kiếm từ khóa trống hoặc không có kết quả để kiểm tra Empty State.

---

# VIII. Todo
* [ ] Sửa file `components/site/HeaderSearchAutocomplete.tsx` để tích hợp nút X nhỏ xóa nhanh từ khóa trên Header search.
* [ ] Tạo thư mục `app/(site)/search`.
* [ ] Thiết lập khung trang `SearchPage` với Suspense boundary.
* [ ] Viết logic fetch dữ liệu Convex song song cho products, posts, services có phân trang và bộ lọc danh mục.
* [ ] Cấu hình UI giao diện Grid/List view toggle.
* [ ] Cài đặt fallback ảnh thông minh cho bài viết, dịch vụ (qua CSS/Icon) và sản phẩm (qua settings admin).
* [ ] Tích hợp tính năng thêm nhanh vào giỏ hàng và chuyển hướng sản phẩm có variants.
* [ ] Kiểm tra lỗi type và syntax.
* [ ] Xác minh hiển thị thực tế trên môi trường chạy thử.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* [x] Ô tìm kiếm ở Header (`HeaderSearchAutocomplete`) có nút X nhỏ xuất hiện khi gõ ký tự, bấm vào sẽ xóa sạch nội dung, đóng gợi ý kết quả và tự động focus lại input.
* [x] Nút X tự căn vị trí phù hợp dựa trên việc có/không có nút tìm kiếm kính lúp đi kèm.
* [x] Truy cập `/search?q=...` hiển thị trang tìm kiếm chứ không bị 404.
* [x] Tabbar hiển thị số lượng kết quả cho từng loại thực thể: Sản phẩm, Bài viết, Dịch vụ.
* [x] Có nút chuyển view mode giữa Grid (Lưới) và List (Danh sách).
* [x] Thẻ sản phẩm hiển thị đầy đủ tên, giá bán, giá so sánh và có nút thêm giỏ hàng/mua ngay hoạt động tốt.
* [x] Ảnh fallback hoạt động đúng nguyên tắc: bài viết/dịch vụ dùng fallback thanh lịch, sản phẩm dùng admin placeholder.
* [x] Bộ lọc danh mục và sắp xếp hoạt động chính xác theo tab hiện tại.
* [x] Tuân thủ Suspense boundary trong Next.js App Router để không gây lỗi build tĩnh.

---

# X. Risk / Rollback (Rùi ro / Hoàn tác)
* **Rủi ro**: Lỗi build Next.js nếu không dùng Suspense khi gọi `useSearchParams`. Đã được khắc phục bằng cách thiết kế wrap Suspense.
* **Hoàn tác**: `git checkout -- app/(site)/search` để rollback.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc schema Convex.

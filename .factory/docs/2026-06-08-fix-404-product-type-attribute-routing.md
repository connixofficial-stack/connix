# I. Primer

## 1. TL;DR kiểu Feynman
Khi ta gõ một địa chỉ web có 2 phần như `thienkimwine.com/ruou-vang/vang-do`, máy tính sẽ bối rối không biết bạn đang muốn xem "danh sách rượu vang được lọc màu đỏ" hay xem "chi tiết một chai rượu vang cụ thể có tên là vang-do".
Trong mã nguồn, có một file chuyên xử lý "trang chi tiết sản phẩm cụ thể" và một file catch-all (ôm đồm hết mọi thứ) để phân tích xem địa chỉ đó là gì rồi hiển thị cho đúng. 
Lỗi xảy ra vì file xử lý "trang chi tiết" chen ngang và giành quyền xử lý trước. Nó kiểm tra xem có chai rượu nào tên là "vang-do" (Vang đỏ) hay không. Vì không có chai rượu nào tên như vậy (nó chỉ là thuộc tính lọc màu sắc), file này liền báo lỗi 404 (Không tìm thấy trang).
Để sửa, ta chỉ cần dọn dẹp (xóa) file chen ngang này đi, để file catch-all thông minh tự động phân tích và hiển thị trang danh sách sản phẩm kèm bộ lọc "Vang đỏ" chính xác.

## 2. Elaboration & Self-Explanation
Hệ thống định tuyến (Routing) của Next.js App Router hoạt động theo độ ưu tiên từ cụ thể đến khái quát.
Thư mục `[categorySlug]/[recordSlug]` đại diện cho các URL có cấu trúc định dạng `/[danh-muc]/[san-pham]`.
Thư mục `[...slugs]` là catch-all route, đại diện cho bất kỳ URL nào có độ dài tùy ý.
Khi người dùng truy cập một URL có 2 segments (phần địa chỉ) như `/ruou-vang-sam-panh/vang-trang`, Next.js sẽ ưu tiên khớp với route cụ thể hơn là `[categorySlug]/[recordSlug]` thay vì `[...slugs]`.
Tuy nhiên, trong dự án Thien Kim Wine, khi bật chế độ Product Types và thuộc tính lọc, URL của bộ lọc cũng được thiết kế dưới dạng 2 segments: `/[danh-muc-san-pham]/[thuoc-tinh]`.
Do khớp với route `[categorySlug]/[recordSlug]`, file `page.tsx` và `layout.tsx` tại đó cố gắng phân giải `recordSlug` (`vang-trang`) thành một thực thể chi tiết (như sản phẩm, dịch vụ, bài viết) thông qua API `resolveUnifiedDetail`.
Vì `vang-trang` là một thuộc tính (`attributeTerm`), API trả về `null` dẫn đến trang hiển thị lỗi 404.
Thực chất, catch-all route `[...slugs]` đã có đầy đủ logic thông minh gọi `resolveProductLandingContext` để phân biệt và render đúng giao diện: trang danh sách lọc nếu là thuộc tính, trang chi tiết nếu là sản phẩm thật.
Do đó, việc xóa bỏ thư mục `[categorySlug]` là giải pháp triệt để và đúng đắn nhất, đưa toàn bộ quyền xử lý về cho catch-all `[...slugs]`.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế**:
  - Địa chỉ `/ruou-vang-sam-panh/passion-classic`: `passion-classic` là một sản phẩm thực tế -> Hiển thị trang chi tiết sản phẩm Passion Classic.
  - Địa chỉ `/ruou-vang-sam-panh/vang-do`: `vang-do` là thuộc tính lọc -> Hiển thị trang danh sách rượu vang sâm panh lọc theo màu đỏ.
- **Sự tương đồng đời thường**:
  - Hãy tưởng tượng bạn gửi thư đến địa chỉ "Số 12 Đường Hoa, Màu Đỏ".
  - Người đưa thư thứ nhất chuyên phát thư cho "tên người cụ thể" xem địa chỉ này và bảo: "Không có ai tên là Màu Đỏ sống ở số 12 cả!" nên vứt thư đi (Lỗi 404).
  - Trong khi đó, người đưa thư thứ hai thông minh hơn, biết rằng "Màu Đỏ" là một chỉ dẫn bộ lọc để chuyển gói hàng đến đúng phòng ban trưng bày các sản phẩm màu đỏ. 
  - Giải pháp là sa thải người đưa thư thứ nhất (xóa route tĩnh bị lỗi) để người đưa thư thứ hai làm toàn bộ công việc.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Triệu chứng**: Truy cập `/ruou-vang-sam-panh/vang-trang` (hoặc `/ruou-vang-sam-panh/vang-do`) bị lỗi 404.
- **Độ tin cậy nguyên nhân gốc**: High (100% chính xác dựa trên lịch sử commit `856aa9748` và cấu trúc định tuyến Next.js).
- **Phạm vi ảnh hưởng**: Tất cả các đường dẫn bộ lọc danh mục kết hợp thuộc tính/loại sản phẩm (2 segments) bị lỗi 404 khi bật chế độ product types.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**:
  - File `app/(site)/[categorySlug]/[recordSlug]/page.tsx` và các file liên quan được khôi phục ngoài ý muốn trong quá trình squash merge đồng bộ với core Viet Admin (`c4b4b5830`).
  - Next.js ưu tiên route `[categorySlug]/[recordSlug]` cho URL 2 segments.
  - Route này xử lý lỗi bộ lọc thuộc tính vì nó giả định phần segment thứ hai luôn là sản phẩm/bài viết chi tiết.
- **Giả thuyết đối chứng**: 
  - *Tại sao không giữ lại folder `[categorySlug]` và chỉnh sửa logic của nó để tương thích?*
  - Không khả thi vì:
    1. Vi phạm nguyên tắc DRY (Don't Repeat Yourself), làm tăng Tech Debt khi phải sao chép toàn bộ logic phức tạp của `[...slugs]/page.tsx` sang `[categorySlug]/[recordSlug]/page.tsx`.
    2. Layout của trang chi tiết (`[categorySlug]/[recordSlug]/layout.tsx`) chứa các thẻ JSON-LD cấu trúc Schema của Product Detail, Breadcrumb chi tiết, nếu dùng chung cho trang lọc danh sách sản phẩm sẽ gây lỗi hiển thị và ảnh hưởng xấu đến SEO của website.

# IV. Proposal (Đề xuất)
- Tiến hành xóa bỏ hoàn toàn thư mục `app/(site)/[categorySlug]` cùng các tệp tin con để trả quyền xử lý định tuyến 1 segment và 2 segments về cho catch-all route `app/(site)/[...slugs]`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `[DELETE]` `app/(site)/[categorySlug]/page.tsx`: Xóa route tĩnh xử lý danh mục đơn lẻ.
- `[DELETE]` `app/(site)/[categorySlug]/_components/PostsPage.tsx`: Xóa component danh sách posts cục bộ của route cũ.
- `[DELETE]` `app/(site)/[categorySlug]/_components/ServicesPage.tsx`: Xóa component danh sách services cục bộ của route cũ.
- `[DELETE]` `app/(site)/[categorySlug]/[recordSlug]/page.tsx`: Xóa route tĩnh xử lý chi tiết thực thể.
- `[DELETE]` `app/(site)/[categorySlug]/[recordSlug]/layout.tsx`: Xóa layout SEO chi tiết của route cũ.
- `[DELETE]` `app/(site)/[categorySlug]/[recordSlug]/_components/PostDetailPage.tsx`: Xóa component post detail cục bộ của route cũ.
- `[DELETE]` `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`: Xóa component product detail cục bộ của route cũ.
- `[DELETE]` `app/(site)/[categorySlug]/[recordSlug]/_components/ServiceDetailPage.tsx`: Xóa component service detail cục bộ của route cũ.

# VI. Execution Preview (Xem trước thực thi)
1. Thực hiện lệnh xóa thư mục `app/(site)/[categorySlug]`.
2. Kiểm tra lại trạng thái git của các file để đảm bảo không xóa nhầm thư mục khác.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra static type check bằng lệnh `bunx tsc --noEmit`. (Hệ thống commit hook sẽ chạy oxlint và tsc).
- Nhờ người dùng test trực tiếp trên môi trường local/dev server bằng cách click vào bộ lọc thuộc tính rượu vang đỏ/trắng tại trang `/products`.

# VIII. Todo
- [ ] Xóa thư mục `app/(site)/[categorySlug]`
- [ ] Chạy static review dự án
- [ ] Thực hiện commit các thay đổi và thông báo kết quả.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- URL bộ lọc `http://localhost:3000/ruou-vang-sam-panh/vang-trang` hoạt động bình thường, hiển thị danh sách sản phẩm thuộc danh mục Rượu vang sâm panh đã lọc theo thuộc tính Vang trắng.
- URL chi tiết sản phẩm dạng `/[categorySlug]/[productSlug]` (ví dụ `/ruou-vang-sam-panh/ruou-vang-passion-classic`) hoạt động bình thường, hiển thị đúng trang chi tiết sản phẩm.
- Không phát sinh lỗi biên dịch hoặc lỗi static type.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây là quá trình dọn dẹp các route trùng lặp và đưa về catch-all route vốn đã chạy ổn định.
- Nếu cần khôi phục, chỉ cần chạy lệnh git checkout hoặc git restore cho thư mục `app/(site)/[categorySlug]`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp sửa đổi các logic query/mutation trong cơ sở dữ liệu Convex.
- Không thay đổi thiết kế giao diện của ProductsPage hay DetailPage.

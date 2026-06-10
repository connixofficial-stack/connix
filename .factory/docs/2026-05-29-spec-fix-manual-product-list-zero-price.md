# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn cấu hình hiển thị sản phẩm bằng cách "chọn thủ công" ngoài trang chủ, hệ thống cần biết chính xác thông tin của những sản phẩm bạn đã chọn để hiển thị. 
Hiện tại, cả trang danh sách sản phẩm (`ProductListSection`) và lưới sản phẩm (`ProductGridSection`) ngoài trang chủ đều mắc lỗi: Tải về danh sách 100 sản phẩm mới nhất từ database rồi lọc thủ công ở trình duyệt để tìm các sản phẩm bạn đã chọn. 
Điều này dẫn đến 2 lỗi nghiêm trọng:
1. Nếu sản phẩm bạn chọn cũ hơn hoặc nằm ngoài danh sách 100 sản phẩm mới nhất, nó sẽ bị biến mất và hiển thị thông báo "Chưa có sản phẩm nào".
2. Hệ thống tải dữ liệu thừa thãi không cần thiết (N+1 và lọc client-side), vi phạm nguyên tắc tối ưu cơ sở dữ liệu.

Đồng thời, đối với hình ảnh sản phẩm do bạn tự tải lên trực tiếp (lưu trữ trên máy chủ Convex Storage có tên miền kết thúc bằng `*.convex.site`), hệ thống Next.js Image Optimizer ngoài site thực đã chặn hiển thị do tên miền này chưa được khai báo bảo mật trong cấu hình của trang web (`next.config.ts`).

Giải pháp:
- Thay thế việc tải 100 sản phẩm ngẫu nhiên bằng một truy vấn trực tiếp chỉ lấy đúng thông tin của những sản phẩm bạn đã chọn qua mã định danh (ID) của chúng.
- Thêm tên miền `*.convex.site` vào danh sách tên miền được phép hiển thị hình ảnh trong tệp cấu hình của trang web (`next.config.ts`).

## 2. Elaboration & Self-Explanation
Ngoài trang chủ (Client-side rendering), khi cấu phần `ProductListSection` hoặc `ProductGridSection` được tải ở chế độ chọn thủ công (`selectionMode === "manual"`), hệ thống cần lấy danh sách sản phẩm thực tế từ cơ sở dữ liệu Convex.

Cách làm hiện tại của hệ thống:
1. Gọi query `api.products.listPublicResolved` với limit cố định là 100.
2. Dùng JavaScript để ánh xạ (map) từ danh sách 100 sản phẩm này sang danh sách `selectedProductIds` được cấu hình.
3. Nếu sản phẩm được chọn nằm ngoài top 100 sản phẩm hoạt động mới nhất được trả về, hàm tìm kiếm trả về `undefined`, kết quả là giao diện không hiển thị sản phẩm nào ("Chưa có sản phẩm nào.").

Cách xử lý tối ưu và đúng đắn:
1. Khi `selectionMode === "manual"`, chúng ta bỏ qua truy vấn `listPublicResolved`.
2. Thay vào đó, gọi query `api.products.listByIds` và truyền vào danh sách `ids` chính là `selectedProductIds`.
3. Query `listByIds` sẽ trả về chính xác thông tin các sản phẩm đã được chọn (đã được backend xử lý giá biến thể thông qua cập nhật ở Spec trước).
4. Áp dụng sửa đổi này cho cả hai cấu phần hiển thị sản phẩm ngoài trang chủ là `ProductListSection.tsx` và `ProductGridSection.tsx`.

Về vấn đề lỗi ảnh:
Next.js có cơ chế bảo mật hình ảnh rất nghiêm ngặt. Mọi tên miền hình ảnh bên ngoài (External Image Hostnames) muốn hiển thị thông qua component `<Image />` (kể cả khi bật chế độ `unoptimized`) đều bắt buộc phải được khai báo trong thuộc tính `images.remotePatterns` của file cấu hình `next.config.ts`.
Hiện tại, file cấu hình của dự án chỉ cho phép hiển thị ảnh từ `*.convex.cloud` và các nguồn như `unsplash.com`. Nhưng các hình ảnh do người dùng upload thủ công lên database lại được lưu trữ trên tên miền site thực của Convex là `*.convex.site` (ví dụ: `https://agile-anteater-871.convex.site`).
Vì thiếu cấu hình này, Next.js Image chặn hoàn toàn việc hiển thị hình ảnh từ Convex Storage ngoài site thực. Chúng ta sẽ bổ sung `*.convex.site` vào danh sách tên miền được cho phép trong `next.config.ts`.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Bạn có cửa hàng giày với 500 đôi. Bạn chọn thủ công 4 đôi Jordan cũ hơn (đôi thứ 120, 121, 122, 123 trong kho) để làm cấu phần "Top giày đang hot".
  - *Trước khi sửa*: Trang chủ tải về 100 đôi giày mới nhập gần nhất, sau đó tìm xem 4 đôi Jordan kia có trong 100 đôi này không. Vì 4 đôi này cũ hơn (nằm ngoài top 100), hệ thống không tìm thấy và báo "Chưa có sản phẩm nào.". Đồng thời, Next.js Image Optimizer chặn không cho hiện ảnh vì ảnh được tải lên từ máy chủ lạ (`*.convex.site`).
  - *Sau khi sửa*: Trang chủ gửi trực tiếp mã vạch (ID) của 4 đôi giày Jordan đó vào kho và lấy ra chính xác 4 đôi này để bày lên kệ, không cần quan tâm chúng có nằm trong top 100 mới nhập hay không. Đồng thời, tệp cấu hình cho phép hiển thị hình ảnh từ máy chủ `*.convex.site` nên ảnh chiếc giày hiện lên đầy đủ.
- **Analogy**: Giống như bạn đi thư viện mượn 4 cuốn sách cụ thể bằng cách đưa thẻ mã số sách cho thủ thư. Thủ thư thay vì đi lấy đúng 4 cuốn sách đó theo mã số, thì lại bê nguyên một chồng 100 cuốn sách mới nhất của thư viện ra bàn, rồi bảo bạn tự tìm xem 4 cuốn sách của bạn có ở đó không. Nếu không có, thủ thư báo luôn là "Không có sách!". Đồng thời, bảo vệ thư viện chặn không cho bạn mở sách ra đọc vì sách này được dán nhãn từ nhà xuất bản lạ (`*.convex.site`) chưa đăng ký với bảo vệ.

# II. Audit Summary (Tóm tắt kiểm tra)
- Kiểm tra file [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx):
  - Dòng 274 gọi `api.products.listPublicResolved` với limit 100 khi không ở chế độ demo hay auto.
  - Dòng 321-326 map `selectedProductIds` từ kết quả của `productsData`.
- Kiểm tra file [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx):
  - Dòng 116 gọi `api.products.listPublicResolved` với limit 100 tương tự.
  - Dòng 163-169 map `selectedProductIds` từ `productsData` tương tự.
- Kiểm tra file [next.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/next.config.ts):
  - Trong `images.remotePatterns` chỉ cho phép `*.convex.cloud` mà không cho phép `*.convex.site`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause**: 
  1. Giao diện client-side ngoài trang chủ lấy thông tin sản phẩm chọn thủ công bằng cách lọc cục bộ trên danh sách 100 sản phẩm hoạt động mới nhất được trả về từ `listPublicResolved`. Nếu sản phẩm đã chọn nằm ngoài giới hạn 100 bản ghi này, chúng sẽ bị lọc bỏ hoàn toàn ở client, dẫn đến hiển thị "Chưa có sản phẩm nào.".
  2. Next.js Image Optimizer ngoài site thực chặn không cho hiển thị ảnh do thiếu khai báo tên miền lưu trữ file Convex Storage (`*.convex.site`) trong `images.remotePatterns` của file cấu hình `next.config.ts`.
- **Độ tin cậy nguyên nhân gốc**: High (Cao) vì triệu chứng hiển thị rỗng ngoài site thực và mất ảnh chiếc giày (trong khi admin preview vẫn hiện bình thường do dùng unoptimized không bị ràng buộc host) khớp hoàn toàn với lỗi thiết kế lọc client-side và cấu hình bảo mật ảnh của Next.js.

# IV. Proposal (Đề xuất)
1. Cập nhật [ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx) để gọi `api.products.listByIds` khi ở chế độ `manual` thay vì `api.products.listPublicResolved`.
2. Cập nhật [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx) tương tự.
3. Thêm cấu hình hostname `*.convex.site` vào `images.remotePatterns` trong [next.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/next.config.ts).

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [components/site/ProductListSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductListSection.tsx)
  - Vai trò hiện tại: Render cấu phần hiển thị danh sách sản phẩm ngoài trang chủ.
  - Thay đổi: Tải sản phẩm bằng `api.products.listByIds` khi chọn thủ công.
- `Sửa:` [components/site/ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
  - Vai trò hiện tại: Render cấu phần hiển thị lưới sản phẩm ngoài trang chủ.
  - Thay đổi: Tải sản phẩm bằng `api.products.listByIds` khi chọn thủ công.
- `Sửa:` [next.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/next.config.ts)
  - Vai trò hiện tại: Tệp cấu hình của ứng dụng Next.js.
  - Thay đổi: Thêm cấu hình tên miền `*.convex.site` vào `remotePatterns` để cho phép Next.js hiển thị ảnh tải lên Convex.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa logic load dữ liệu tại `components/site/ProductListSection.tsx`.
2. Đọc và chỉnh sửa logic load dữ liệu tại `components/site/ProductGridSection.tsx`.
3. Thêm cấu hình bảo mật ảnh trong `next.config.ts`.
4. Kiểm tra tính toàn vẹn của kiểu dữ liệu TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra tĩnh: So sánh kỹ lưỡng logic import, tham số query và kiểu dữ liệu trả về của các query trong Convex.
- Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo hệ thống không phát sinh lỗi biên dịch TypeScript.

# VIII. Todo
- [x] Cập nhật query và logic map sản phẩm trong `components/site/ProductListSection.tsx` cho chế độ chọn thủ công.
- [x] Cập nhật query và logic map sản phẩm trong `components/site/ProductGridSection.tsx` cho chế độ chọn thủ công.
- [ ] Bổ sung cấu hình `*.convex.site` trong `next.config.ts`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Site thực hiển thị chính xác các sản phẩm được chọn thủ công bất kể vị trí của chúng trong cơ sở dữ liệu.
- Giữ nguyên thứ tự sắp xếp các sản phẩm đã được chọn thủ công theo thứ tự lưu trữ trong config.
- Hình ảnh của các sản phẩm được hiển thị đầy đủ ngoài site thực (không bị trống ảnh, không bị lỗi Next.js Image Optimizer).
- Không phát sinh lỗi TypeScript hay màn hình trắng ngoài site thực.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Hầu như không có rủi ro vì thay đổi này giúp giảm lưu lượng tải dữ liệu (chỉ tải đúng số lượng ID được cấu hình thay vì luôn tải 100 sản phẩm).
- **Hoàn tác**: Sử dụng Git hoàn tác các thay đổi trên 3 file components/site và config nếu có bất kỳ lỗi hiển thị nào xảy ra.

# XI. Out of Scope (Ngoài phạm vi)
- Không sửa đổi cấu phần hiển thị của Blog hay ServiceList.
- Không tối ưu hóa giao diện CSS/UI của các component.

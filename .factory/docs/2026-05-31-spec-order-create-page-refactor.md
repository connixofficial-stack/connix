# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề là gì?**: Trang tạo đơn hàng hiện tại của admin giống như một cái xe đẩy siêu thị không có thanh tìm kiếm và không có thông tin chi tiết về sản phẩm. Khi admin muốn chọn khách hàng hay sản phẩm, họ phải cuộn một danh sách dài dằng dặc (chỉ tối đa 100 dòng, ai ngoài danh sách này là không thể chọn được). Ngoài ra, cửa hàng bán giày nhưng giao diện không cho chọn Size hay Màu sắc (Biến thể sản phẩm - Variant), làm cho admin tạo đơn xong cũng không biết khách lấy size nào để soạn hàng, và kho cũng không thể trừ số lượng giày chính xác.
- **Cách sửa thế nào?**:
  1. Thay thế dropdown chọn khách hàng & sản phẩm thô sơ bằng ô tìm kiếm thông minh (Combobox) tự động gửi từ khóa lên server (Server-side search) để tìm kiếm nhanh gọn.
  2. Khi admin chọn một đôi giày, nếu đôi giày đó có nhiều size, hệ thống sẽ hiện ra danh sách các size và số lượng tồn kho tương ứng để chọn trực quan.
  3. Thêm nút tạo nhanh khách hàng mới ngay tại chỗ để admin không cần chuyển trang.
  4. Thêm ô nhập mã giảm giá (Promotion code) để tính toán trừ tiền tự động.
  5. Thêm tính năng chặn rời trang nếu lỡ tay bấm nút Back để không bị mất thông tin đơn hàng đang nhập dở.

## 2. Elaboration & Self-Explanation
Trang tạo đơn hàng trong Admin (`app/admin/orders/create/page.tsx`) hiện tại là một "đống nợ" (Technical Debt & UX Debt). Vấn đề nghiêm trọng nhất nằm ở thiết kế lưu trữ và tương tác dữ liệu:
- **Nợ Kỹ thuật (Technical Debt)**: Sử dụng các hàm `customers.listAll` và `products.listAll` với `limit: 100` để nhét toàn bộ dữ liệu vào thẻ `<select>` mặc định của HTML. Điều này vi phạm nghiêm trọng nguyên tắc tối ưu hóa băng thông DB. Nếu hệ thống có hơn 100 khách hàng hoặc sản phẩm, các bản ghi thứ 101 trở đi sẽ hoàn toàn "tàng hình" và không thể tạo đơn hàng. Hơn nữa, việc tải 100 sản phẩm và khách hàng đầy đủ thông tin cùng lúc lúc khởi chạy trang gây tốn tài nguyên và tăng thời gian tải trang không cần thiết.
- **Nợ UX & Chức năng (UX & Functional Debt)**: 
  - Khách hàng không thể chọn size hoặc màu (Product Variant). Đối với một cửa hàng giày dép (Thanshoes), size giày là thông tin sống còn. Mã nguồn backend của `orders` hỗ trợ lưu `variantId` và `variantTitle` nhưng giao diện bỏ quên hoàn toàn tính năng này.
  - Không có tính năng tạo nhanh khách hàng. Khi có khách mua trực tiếp, admin buộc phải rời khỏi trang tạo đơn hàng, truy cập mục quản lý khách hàng, bấm tạo mới, sau đó quay lại trang tạo đơn và điền lại từ đầu.
  - Thiếu bộ lọc áp dụng Khuyến mại (Promotions/Coupons). Admin phải tính nhẩm số tiền giảm rồi chỉnh sửa bằng tay hoặc bỏ qua tính năng này.
  - Thiếu cơ chế bảo vệ trạng thái nhập liệu (Dirty state guard), người dùng lỡ bấm "Hủy" hoặc Back trên trình duyệt sẽ làm mất toàn bộ đơn hàng đang build.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Admin muốn tạo đơn hàng cho khách tên "Nguyễn Văn A" số điện thoại "0901234567" mua một đôi "Giày Thể Thao Nike Air Force 1" size 40.
  - *Hiện tại*: Admin click vào dropdown Khách hàng, dùng tay cuộn mắt tìm kiếm giữa 100 người. Nếu Nguyễn Văn A nằm ở vị trí thứ 105 trong DB, anh ấy không xuất hiện, admin chịu chết không tạo được đơn. Sau đó, admin chọn sản phẩm "Giày Thể Thao Nike Air Force 1", nhưng không có tùy chọn size 40. Đơn hàng lưu thành công nhưng Nike Air Force 1 không có thông tin size, kho hàng Nike Air Force 1 size 40 không bị trừ tồn kho.
  - *Sau khi Refactor*: Admin chỉ cần gõ "Văn A" hoặc "0901" vào ô tìm kiếm, Combobox sẽ gọi API tìm kiếm trực tiếp trên DB và hiển thị ngay Nguyễn Văn A để chọn. Tiếp theo, admin gõ "Air Force" vào ô sản phẩm, chọn Nike Air Force 1. Giao diện lập tức hiện ra các size có sẵn: "Size 39 (Tồn: 2)", "Size 40 (Tồn: 5)", "Size 41 (Tồn: 0 - Hết hàng)". Admin chọn size 40, nhập số lượng 1 (hệ thống chặn không cho nhập > 5). Bấm tạo đơn, Nike Air Force 1 size 40 được lưu chính xác trong đơn hàng và kho giảm đi 1 đôi.
- **Hình ảnh đời thực**: Thẻ `<select>` cũ giống như việc người bán hàng phải lật từng trang của cuốn sổ dày 1000 trang để tìm tên khách hàng. Còn ô Combobox mới giống như thanh tìm kiếm danh bạ trên smartphone, chỉ cần gõ 2-3 chữ cái đầu tiên là tên khách hàng hiện ra ngay lập tức.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Sau khi rà soát tệp [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/orders/create/page.tsx), chúng tôi phát hiện các vấn đề cụ thể sau:
1. **Dropdown Khách hàng & Sản phẩm**:
   - Sử dụng thẻ `<select>` HTML thô sơ (Dòng 175 và 194).
   - Tải cố định dữ liệu giới hạn 100 bản ghi qua `listAll` (Dòng 35-36).
2. **Thiếu hỗ trợ Biến thể (Variants)**:
   - Form chọn sản phẩm ở dòng 193-206 chỉ cho phép chọn `productId` thô, không truy vấn danh sách variants của sản phẩm được chọn và không hiển thị thông tin variant.
   - Trạng thái `OrderItem` ở dòng 15-20 chỉ chứa `productId`, `productName`, `quantity`, `price`, thiếu `variantId` và `variantTitle`.
3. **Thiếu tính năng tạo nhanh khách hàng (Quick Customer)**:
   - Không có giao diện modal/dialog để tạo khách hàng mới khi khách hàng chưa tồn tại trong DB.
4. **Không có hệ thống áp dụng mã giảm giá (Promotions)**:
   - Thiếu input nhập mã giảm giá và logic tính toán discount dựa trên cấu hình voucher trả về từ API backend `api.promotions.getByCode`.
5. **Thiếu chặn rời trang khi có thay đổi chưa lưu**:
   - Chưa tích hợp hook chặn rời trang `useUnsavedGuard` mặc dù dự án đã phát triển hook này tại `e:\NextJS\job\job_from_system_vietadmin\system_thanshoes\app\admin\home-components\_shared\hooks\useUnsavedGuard.ts`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc (Root Cause)**:
  - Trang tạo đơn hàng `app/admin/orders/create/page.tsx` ban đầu chỉ được xây dựng như một bản MVP (Minimum Viable Product) đơn giản để đảm bảo luồng chạy kỹ thuật, bỏ qua các nghiệp vụ thực tế như quản lý biến thể (vốn rất quan trọng với ngành hàng giày dép), tối ưu hóa tải trọng DB khi quy mô dữ liệu tăng lên, và các tiện ích UX cần thiết khác của admin.
- **Giả thuyết đối chứng (Counter-Hypothesis)**:
  - *Giả thuyết*: Liệu có thể giải quyết vấn đề tìm kiếm bằng cách tải toàn bộ danh sách khách hàng/sản phẩm về client rồi thực hiện filter bằng JS hay không?
  - *Phản biện*: Không thể. Khi quy mô shop đạt hàng nghìn sản phẩm và hàng chục nghìn khách hàng, việc fetch toàn bộ dữ liệu qua mạng sẽ gây sập trình duyệt của admin, lãng phí băng thông DB nghiêm trọng (vi phạm 7 Nguyên tắc DB Bandwidth Optimization) và gây ra độ trễ khởi động trang cực kỳ lớn. Do đó, tìm kiếm server-side động thông qua debounce là giải pháp duy nhất khả thi và bền vững.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất tái cấu trúc toàn diện trang tạo đơn hàng admin với các cải tiến kỹ thuật sau:

### 1. Server-side Search Combobox cho Khách hàng & Sản phẩm
- Xây dựng component `SearchAutocomplete` dùng chung hoặc tích hợp trực tiếp Popover + Command search để tìm kiếm động:
  - Đối với Khách hàng: Gọi query `api.customers.listAdminWithOffset` với param `search` (gõ tối thiểu 2 ký tự, debounce 300ms).
  - Đối với Sản phẩm: Gọi query `api.products.listAdminWithOffset` với param `search` (chỉ lấy sản phẩm Active, debounce 300ms).

### 2. Tích hợp form chọn biến thể (Size/Màu sắc) và Kiểm tra tồn kho
- Khi chọn sản phẩm chính:
  - Kiểm tra xem sản phẩm đó có biến thể hay không (`product.hasVariants === true`).
  - Nếu có, gọi query `api.productVariants.listByProductActive` theo `productId` để lấy danh sách biến thể đang hoạt động.
  - Hiển thị dropdown/danh sách các biến thể có sẵn kèm giá trị thuộc tính (ví dụ: "Size 40 - Tồn: 10 - Giá: 450.000đ").
  - Khi thêm vào danh sách `items`, truyền đúng `variantId` và `variantTitle` (được sinh tự động từ các thuộc tính variant).
  - Ràng buộc ô nhập số lượng sản phẩm: Không cho phép nhập số lượng vượt quá số lượng tồn kho (`stock`) của variant/product và thông báo lỗi trực quan ngay lập tức.

### 3. Modal tạo nhanh Khách hàng mới (Quick Customer Dialog)
- Thêm một nút "+" nhỏ bên cạnh ô chọn khách hàng. Khi click, hiển thị một Modal Dialog chứa:
  - Form điền nhanh: Tên khách hàng (bắt buộc), Số điện thoại (bắt buộc), Email (không bắt buộc), Địa chỉ (không bắt buộc).
  - Gọi mutation `api.customers.create`. Sau khi tạo thành công, thông báo sonner toast, tự động chọn khách hàng vừa tạo và điền địa chỉ giao hàng mặc định của họ vào form.

### 4. Áp dụng mã giảm giá (Promotions / Coupons)
- Thêm phần nhập mã giảm giá tại khu vực tóm tắt đơn hàng (Sidebar).
- Khi admin click "Áp dụng":
  - Gọi query `api.promotions.getByCode` với code đã nhập (tự động chuyển thành chữ in hoa).
  - Thực hiện các bước kiểm chứng phía client:
    - Trạng thái khuyến mãi có phải là `Active` không?
    - Tổng tiền đơn hàng (`subtotal`) có đạt điều kiện tối thiểu `minOrderAmount` không?
    - Ngày hiện tại có nằm trong khoảng `startDate` và `endDate` của khuyến mãi không?
  - Nếu hợp lệ, tự động tính toán số tiền giảm (`discountAmount`):
    - Dạng `percent`: `discountAmount = Math.min((subtotal * discountValue) / 100, maxDiscountAmount ?? Infinity)`.
    - Dạng `fixed`: `discountAmount = discountValue`.
  - Cập nhật tổng tiền đơn hàng: `totalAmount = subtotal + shippingFee - discountAmount`.
  - Gửi kèm `promotionId`, `promotionCode`, và `discountAmount` lên API tạo đơn hàng.

### 5. Tích hợp chặn rời trang khi có thay đổi chưa lưu (Unsaved Changes Guard)
- Import hook chặn rời trang `useUnsavedGuard` có sẵn.
- Xác định trạng thái thay đổi `hasChanges = items.length > 0 || customerId !== '' || shippingAddress !== '' || note !== ''`.
- Truyền `useUnsavedGuard(hasChanges)` để trình duyệt tự động chặn chuyển trang khi admin lỡ bấm nút Back hoặc link khác trên sidebar.

### 6. Undo/Redo cho danh sách sản phẩm đã chọn
- Tích hợp hook `useUndoRedo` có sẵn để quản lý trạng thái `items` của đơn hàng.
- Cho phép admin bấm Undo/Redo (hoặc phím tắt Ctrl+Z / Ctrl+Y) khi lỡ tay xóa sản phẩm hoặc thay đổi số lượng sản phẩm trong giỏ hàng tạm thời.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components & Pages
- #### [MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/orders/create/page.tsx)
  - *Vai trò hiện tại*: Trang tạo đơn hàng mới của admin, hiển thị form chọn khách hàng, chọn sản phẩm, phí vận chuyển và ghi chú đơn hàng.
  - *Thay đổi*: Thay thế select thô bằng Combobox search khách hàng và sản phẩm động; Thêm form chọn biến thể (size/màu) khi chọn sản phẩm có variant; Thêm input nhập mã giảm giá và tính toán tự động; Tích hợp Dialog tạo nhanh khách hàng; Tích hợp các hooks `useUnsavedGuard` và `useUndoRedo`.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và Chuẩn bị**: Kiểm tra các component và hooks liên quan (`ui.tsx`, `useUnsavedGuard.ts`, `useUndoRedo.ts`).
2. **Cập nhật State & Types**: Thay đổi định dạng state `OrderItem` hỗ trợ `variantId` và `variantTitle`. Tích hợp hook `useUndoRedo` quản lý state `items`.
3. **Triển khai Combobox Search động**:
   - Tạo bộ chọn khách hàng sử dụng API `api.customers.listAdminWithOffset` kèm search và debounce.
   - Tạo bộ chọn sản phẩm sử dụng API `api.products.listAdminWithOffset` kèm search và debounce.
4. **Triển khai Variant Selection**:
   - Khi sản phẩm được chọn có variants, fetch danh sách variants bằng `api.productVariants.listByProductActive` và render danh sách để chọn size.
   - Hiển thị stock thực tế của variant đã chọn và validate số lượng thêm vào giỏ hàng.
5. **Triển khai Dialog tạo nhanh khách hàng**:
   - Tạo Dialog form tạo nhanh khách hàng, gọi mutation `api.customers.create`.
6. **Triển khai Promotion Engine**:
   - Thêm trường nhập voucher code, gọi query `api.promotions.getByCode` và áp dụng logic chiết khấu tiền đơn hàng.
7. **Tích hợp Guard & Hoàn thiện UX**:
   - Gọi `useUnsavedGuard` để bảo vệ form.
   - Tinh chỉnh CSS Tailwind đồng bộ hệ thống Shadcn premium.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests / Typecheck
- Chạy lệnh `bunx tsc --noEmit` để đảm bảo không có lỗi TypeScript liên quan đến kiểu dữ liệu của items đơn hàng, variantId, promotionId.

### Manual Verification
1. **Tìm kiếm Khách hàng & Sản phẩm**:
   - Gõ tên khách hàng hoặc số điện thoại vào Combobox, kiểm tra xem kết quả có lọc đúng theo thời gian thực không.
2. **Chọn biến thể (Size giày)**:
   - Chọn một sản phẩm giày có nhiều size (ví dụ: giày Nike Air Force 1).
   - Kiểm tra xem dropdown chọn size có hiện ra không.
   - Chọn size 40, kiểm tra xem giá bán và số tồn kho của size 40 có cập nhật đúng không.
   - Nhập số lượng vượt quá tồn kho của size 40, kiểm tra xem hệ thống có báo lỗi/disable nút thêm hay không.
3. **Tạo nhanh khách hàng**:
   - Bấm nút "+" bên cạnh ô chọn khách hàng, điền thông tin và bấm lưu.
   - Đảm bảo khách hàng được tạo thành công và được tự động chọn làm khách mua của đơn hàng hiện tại.
4. **Nhập mã giảm giá**:
   - Nhập mã giảm giá đang hoạt động (ví dụ mã giảm 10% tối đa 50k).
   - Kiểm tra xem phần Tổng tiền có hiển thị đúng số tiền giảm giá và tổng thanh toán mới không.
   - Thay đổi số lượng sản phẩm làm tổng tiền thay đổi, kiểm tra xem số tiền giảm giá có tự động cập nhật lại không.
5. **Bảo vệ dữ liệu chưa lưu**:
   - Nhập thông tin đơn hàng, bấm nút Back trên sidebar hoặc F5 trình duyệt.
   - Đảm bảo trình duyệt hiển thị popup xác nhận chặn chuyển trang.

---

# VIII. Todo

- [ ] Import các hooks và components cần thiết (`useUnsavedGuard`, `useUndoRedo`, `Dialog`, `Popover`, `Command`, `Badge`, v.v.).
- [ ] Tái cấu trúc kiểu dữ liệu `OrderItem` và state `items` của đơn hàng thông qua `useUndoRedo`.
- [ ] Xây dựng Combobox tìm kiếm khách hàng server-side động sử dụng `api.customers.listAdminWithOffset` và debounce.
- [ ] Xây dựng Combobox tìm kiếm sản phẩm server-side động sử dụng `api.products.listAdminWithOffset` và debounce.
- [ ] Triển khai luồng chọn biến thể sản phẩm (size/màu sắc) lấy dữ liệu qua `api.productVariants.listByProductActive` kèm hiển thị giá và số tồn kho của từng biến thể.
- [ ] Cài đặt logic kiểm tra giới hạn tồn kho khi admin thay đổi số lượng của sản phẩm trong đơn hàng.
- [ ] Thêm Dialog tạo nhanh khách hàng mới với form Tên, SĐT, Địa chỉ, Email và liên kết tự động sau khi tạo thành công.
- [ ] Xây dựng hộp nhập mã giảm giá, gọi API `api.promotions.getByCode`, tự động tính toán chiết khấu (`discountAmount`) theo percent hoặc fixed.
- [ ] Tích hợp `useUnsavedGuard` bảo vệ trạng thái nhập liệu của trang tạo đơn hàng.
- [ ] Cải thiện giao diện UI/UX theo tiêu chí Clarity > Decoration đồng bộ với thiết kế Shadcn và hệ thống màu sắc hiện tại của admin.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [ ] Admin tìm kiếm được khách hàng bằng tên hoặc SĐT ngoài danh sách 100 khách hàng đầu tiên.
- [ ] Khi tạo đơn hàng với sản phẩm có variants, thông tin `variantId` và `variantTitle` phải được truyền chính xác lên mutation `createOrder`.
- [ ] Kho hàng phải trừ chính xác số lượng của variant (size giày) đã chọn sau khi tạo đơn hàng thành công.
- [ ] Tạo nhanh khách hàng hoạt động ổn định, không làm reload trang hoặc mất dữ liệu đơn hàng đang nhập dở.
- [ ] Áp dụng đúng mã giảm giá, hiển thị chi tiết số tiền được giảm giá và cập nhật chính xác Tổng tiền thanh toán.
- [ ] Cảnh báo chặn rời trang xuất hiện khi cố gắng chuyển hướng nếu đơn hàng có ít nhất một sản phẩm hoặc khách hàng đã được chọn.
- [ ] Trang không có bất kỳ lỗi TypeScript nào khi build.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi logic khi tính toán mã giảm giá đối với các loại khuyến mãi phức tạp (như mua X tặng Y hoặc miễn phí vận chuyển) dẫn đến sai lệch số tiền của đơn hàng.
- **Biện pháp giảm thiểu**: Phía client sẽ ưu tiên tính toán các dạng khuyến mãi phổ biến nhất (percent, fixed). Đối với các khuyến mãi phức tạp, hiển thị cảnh báo và cho phép admin nhập tay số tiền giảm giá nếu cần thiết để đảm bảo tính linh hoạt.
- **Kế hoạch hoàn tác (Rollback)**: Trong trường hợp xảy ra lỗi nghiêm trọng sau khi triển khai, thực hiện lệnh `git checkout -- app/admin/orders/create/page.tsx` để khôi phục lại mã nguồn cũ ngay lập tức.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không chỉnh sửa hay refactor mã nguồn của API tạo đơn hàng `api.orders.create` ở phía backend Convex. Mọi thay đổi logic tính toán khuyến mãi và kiểm tra tồn kho sẽ được thực hiện trước ở phía client và tận dụng tính năng kiểm tra tồn kho hiện có của backend.
- Không thay đổi giao diện hiển thị danh sách đơn hàng (`app/admin/orders/page.tsx`) hoặc chi tiết đơn hàng (`app/admin/orders/[id]/page.tsx`).

---

# XII. Open Questions (Câu hỏi mở)

- Hiện tại mutation `api.orders.create` ở backend Convex đã tự động chạy hàm `decrementVariantStock` và `decrementProductStock` để trừ kho hàng chưa?
  - *Trả lời dựa trên phân tích code backend*: Rồi. Trong `convex/orders.ts` dòng 725-731 đã tự động kiểm tra `stockCheckEnabled` và gọi `decrementVariantStock` hoặc `decrementProductStock` để giảm tồn kho khi đơn hàng được tạo thành công. Chúng ta hoàn toàn yên tâm truyền variantId lên server.

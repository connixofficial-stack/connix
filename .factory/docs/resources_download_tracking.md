# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng có thể nhấn tải trực tiếp tài nguyên ở trang danh sách public mà không cần login, dẫn đến việc chúng ta không có thông tin của họ để lưu trữ và hiển thị trong trang quản trị admin.
* **Cách giải quyết**:
  1. Loại bỏ nút "Xem & tải" gây hiểu lầm ở trang danh sách tài nguyên và thay bằng "Xem chi tiết →".
  2. Bắt buộc đăng nhập trước khi tải tài nguyên (cho cả tài nguyên miễn phí). Nếu chưa đăng nhập, nút tải sẽ hiển thị "Đăng nhập để tải" kèm icon ổ khóa.
  3. Xây dựng một trang "Người mua và tải" trong trang quản lý tài nguyên của Admin để xem danh sách tất cả những người đã tải/mua tài nguyên (giao diện tương tự như danh sách "Học viên" của Khóa học).
  4. Tích hợp menu này vào Sidebar admin dưới group "Tài nguyên".

## 2. Elaboration & Self-Explanation
Hiện tại, trang danh sách tài nguyên hiển thị một link giả "Xem & tải" ở mỗi card sản phẩm, khiến người dùng nghĩ rằng họ có thể tải ngay từ bên ngoài. Khi click vào card, họ đi vào trang chi tiết. Tại trang chi tiết, nếu là tài nguyên miễn phí, nút CTA vẫn hiển thị "Tải tài nguyên" ngay cả khi chưa đăng nhập. Khi người dùng click, hệ thống mới bắt login.
Chúng ta muốn cải thiện trải nghiệm và quy trình dữ liệu này bằng cách:
* Đổi text "Xem & tải" bên ngoài thành "Xem chi tiết" để khuyến khích người dùng vào đọc nội dung chi tiết.
* Trên trang chi tiết, nếu người dùng chưa đăng nhập, hệ thống sẽ hiển thị trạng thái nút là "Đăng nhập để tải" (đối với tài nguyên Free). Điều này giúp làm rõ yêu cầu ngay từ giao diện.
* Hệ thống Convex đã có mutation `requestDownload` ghi nhận lịch sử tải vào bảng `resourceCustomers` (lưu liên kết khách hàng - tài nguyên) khi người dùng tải tài nguyên. Khi người dùng đã đăng nhập và nhấn tải tài nguyên miễn phí, hệ thống sẽ tự động đăng ký quyền tải và lưu thông tin vào DB.
* Ở Admin, chúng ta cần một giao diện tổng quát để xem toàn bộ danh sách khách hàng đã mua hoặc tải tài nguyên (hiển thị thông tin tên khách hàng, email, phone, tên tài nguyên, nguồn gốc tải, số lượt tải, ngày cấp quyền, trạng thái, và các hành động thu hồi/cấp lại/xóa quyền truy cập tương tự như trang danh sách học viên).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Khách hàng A truy cập vào trang web, thấy tài nguyên miễn phí "Thư viện AutoCAD 2D".
  * Ngoài trang list: Card hiển thị nút "Xem chi tiết →" thay vì "Xem & tải".
  * Khách hàng A click vào xem chi tiết: Nút CTA hiển thị "Đăng nhập để tải" kèm icon khóa 🔒 (vì Khách hàng A chưa đăng nhập).
  * Khách hàng A click vào nút: Hệ thống mở popup đăng nhập. Sau khi đăng nhập thành công, nút chuyển thành "Tải tài nguyên" với icon 📥.
  * Khách hàng A nhấn tải: Server Convex ghi nhận một dòng mới trong bảng `resourceCustomers` với `sourceType: "free"`, `downloadCount: 1`, `lastDownloadAt: [thời gian hiện tại]`.
  * Trong trang Admin: Danh sách "Người mua và tải" sẽ hiển thị: Khách hàng A | Thư viện AutoCAD 2D | Nguồn: Tải miễn phí | Lượt tải: 1 | Trạng thái: Đang có quyền.
* **Hình ảnh tương tự**: Giống như việc một thư viện cộng đồng mở cửa cho đọc sách miễn phí, nhưng để mượn sách mang về (tải tài nguyên), bạn bắt buộc phải làm thẻ thư viện (đăng nhập). Điều này giúp thư viện kiểm soát được cuốn sách nào đang được ai mượn và mượn bao nhiêu lần, từ đó có số liệu thống kê trong sổ quản lý của thủ thư (trang quản trị admin).

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra `app/(site)/_components/resources/ResourcesPage.tsx`:
  * Dòng 511-513 render nút "Xem & tải" có icon download. Cần đổi thành "Xem chi tiết →".
* Đã kiểm tra `app/(site)/_components/resources/ResourceDetailPage.tsx`:
  * Có logic kiểm tra `token` trong `handleDownload`.
  * Có nút CTA render text "Tải tài nguyên" ngay cả khi chưa login nếu `pricingType === 'free'`. Cần sửa logic hiển thị text/icon dựa trên trạng thái `token` và `pricingType`.
* Đã kiểm tra `convex/resources.ts`:
  * Có query `listResourceCustomers` trả về danh sách khách hàng cho một `resourceId` cụ thể nhưng không hỗ trợ phân trang, tìm kiếm và thống kê cho toàn hệ thống.
  * Cần bổ sung query `listResourceCustomersAdmin` tương tự `listCourseStudentsAdmin` trong `convex/courses.ts` để phục vụ trang danh sách tổng hợp.
* Đã kiểm tra `app/admin/components/Sidebar.tsx`:
  * Menu Tài nguyên nằm ở dòng 401-422. Cần thêm subitem "Người mua và tải".

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Giao diện trang danh sách tài nguyên và nút CTA trang chi tiết chưa hiển thị rõ ràng yêu cầu đăng nhập đối với tài nguyên miễn phí; đồng thời trang Admin chưa có menu tổng hợp danh sách khách hàng tải/mua tài nguyên trên toàn hệ thống (mới chỉ có ở cấp độ xem chi tiết từng tài nguyên cụ thể).
* **Giả thuyết đối chứng**: Nếu chỉ sửa ở client mà không xây dựng query Convex hỗ trợ phân trang và tìm kiếm, trang Admin hiển thị danh sách người tải sẽ bị chậm khi số lượng bản ghi lớn và không thể tìm kiếm nhanh. Việc xây dựng query phân trang chuyên biệt `listResourceCustomersAdmin` là bắt buộc.

# IV. Proposal (Đề xuất)
1. **Chỉnh sửa UI trang list tài nguyên**: Đổi text "Xem & tải" thành "Xem chi tiết →" trên card tài nguyên.
2. **Cải tiến UI/UX nút tải trang chi tiết**: Hiển thị nút dạng "Đăng nhập để tải" kèm icon Lock nếu chưa đăng nhập đối với tài nguyên miễn phí.
3. **Thêm API Convex**: Tạo query `listResourceCustomersAdmin` trong `convex/resources.ts` với đầy đủ các bộ lọc (resourceId, status), tìm kiếm (search), phân trang (limit, offset) và trả về stats (tổng số khách hàng, tổng lượt tải, lượt tải trung bình).
4. **Cấu hình Sidebar**: Thêm subitem "Người mua và tải" trỏ tới `/admin/resources/customers`.
5. **Xây dựng trang Admin quản lý**: Tạo trang `/admin/resources/customers/page.tsx` and panel `/admin/resources/components/ResourceCustomersPanel.tsx` để xem, tìm kiếm, lọc và quản lý quyền tải của khách hàng.

# V. Files Impacted (Tệp bị ảnh hưởng)
### UI / Client
* **Sửa**: [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
  * Đổi text/icon download ở ngoài list thành "Xem chi tiết →".
* **Sửa**: [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx)
  * Sửa logic hiển thị `ctaLabel` và icon của nút CTA đối với tài nguyên miễn phí khi chưa login.
* **Sửa**: [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/Sidebar.tsx)
  * Thêm subitem "Người mua và tải" vào menu Tài nguyên.
* **Thêm**: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/customers/page.tsx)
  * Tạo trang danh sách khách hàng mua/tải tài nguyên được bọc bởi `ModuleGuard`.
* **Thêm**: [ResourceCustomersPanel.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/components/ResourceCustomersPanel.tsx)
  * Tạo component quản lý, hiển thị bảng, thống kê, tìm kiếm, phân trang và các dialog thao tác (thu hồi/cấp lại/xóa quyền truy cập).

### Server / Backend
* **Sửa**: [resources.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resources.ts)
  * Bổ sung query `listResourceCustomersAdmin` trả về danh sách phân trang và stats.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Thêm query `listResourceCustomersAdmin` vào `convex/resources.ts`.
2. **Bước 2**: Cập nhật file `app/(site)/_components/resources/ResourcesPage.tsx` để thay đổi text/icon nút tải ở ngoài list.
3. **Bước 3**: Cập nhật file `app/(site)/_components/resources/ResourceDetailPage.tsx` để tối ưu hóa hiển thị nút CTA.
4. **Bước 4**: Thêm menu item "Người mua và tải" vào `app/admin/components/Sidebar.tsx`.
5. **Bước 5**: Tạo component `ResourceCustomersPanel.tsx` trong `app/admin/resources/components/` chứa logic danh sách và tương tác.
6. **Bước 6**: Tạo file `app/admin/resources/customers/page.tsx` để render panel.
7. **Bước 7**: Kiểm tra tĩnh (Static Review) và bàn giao.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
* Codebase sử dụng Oxford/Rust-based Linter và TypeScript Compiler.
* Sau khi thực hiện, chạy:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
  để verify compile typescript không bị lỗi cú pháp/kiểu dữ liệu.

### Manual Verification
* Deploy và chạy local `npm run dev`.
* Truy cập `http://localhost:3000/resources` và xác nhận card không còn nút "Xem & tải".
* Truy cập trang chi tiết tài nguyên miễn phí:
  * Khi chưa login: Hiển thị "Đăng nhập để tải" kèm icon Lock. Click vào mở login modal.
  * Khi đã login: Hiển thị "Tải tài nguyên" kèm icon Download. Click tải bình thường.
* Truy cập trang Admin sidebar và kiểm tra menu "Người mua và tải".
* Vào trang `http://localhost:3000/admin/resources/customers`:
  * Đảm bảo hiển thị 3 khối thống kê (Tổng số khách, Tổng số lượt tải, Lượt tải trung bình).
  * Tìm kiếm theo tên/email/phone hoạt động chính xác.
  * Lọc theo tài nguyên hoạt động chính xác.
  * Các nút "Thu hồi", "Cấp lại", "Xóa" hoạt động chuẩn xác và cập nhật giao diện lập tức.

# VIII. Todo
- [ ] Bổ sung query `listResourceCustomersAdmin` vào `convex/resources.ts`
- [ ] Chỉnh sửa text và icon hiển thị trên card ở `ResourcesPage.tsx`
- [ ] Cập nhật logic hiển thị CTA cho tài nguyên miễn phí ở `ResourceDetailPage.tsx` (cả phần PC và phần Mobile Sticky)
- [ ] Thêm subitem vào sidebar trong `Sidebar.tsx`
- [ ] Tạo file component `ResourceCustomersPanel.tsx`
- [ ] Tạo file page `app/admin/resources/customers/page.tsx`
- [ ] Chạy kiểm tra TypeScript và verify tĩnh

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang list `/resources` không còn chữ hay icon liên quan đến "tải trực tiếp" trên card tài nguyên.
* Tài nguyên miễn phí hiển thị "Đăng nhập để tải" khi chưa đăng nhập và chỉ cho tải sau khi đã đăng nhập thành công.
* Có menu "Người mua và tải" trong sidebar admin Tài nguyên.
* Trang quản trị `/admin/resources/customers` hoạt động đầy đủ tính năng: phân trang, tìm kiếm mờ khách hàng, bộ lọc theo tài nguyên/trạng thái, hiển thị thống kê chính xác và có thể thao tác bật/tắt/xóa quyền truy cập.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi kiểu dữ liệu trong query Convex mới hoặc import sai component UI trong admin.
* **Hoàn tác**: Sử dụng `git checkout` để rollback các file sửa đổi và xóa các file mới tạo nếu gặp lỗi nghiêm trọng.

# XI. Out of Scope (Ngoài phạm vi)
* Thiết kế lại luồng đăng nhập của người dùng.
* Thay đổi logic phân quyền hay phương thức thanh toán của đơn hàng.

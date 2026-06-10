# Spec: Sửa lỗi Popup không hiển thị khi tải trang chủ

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi vào trang web, popup quảng cáo/thông báo không hiện lên dù đã bật trạng thái hoạt động và cài đặt hiển thị ngay lập tức.
* **Nguyên nhân:** Popup bị coi như một phần tử bình thường trên trang (như Blog, Sản phẩm). Khi trang chủ tải, hệ thống chỉ vẽ nhanh 3 phần tử đầu tiên để tối ưu tốc độ, còn các phần tử phía dưới (bao gồm cả Popup do xếp ở cuối) bị trì hoãn (lazy load/deferred render) cho đến khi người dùng cuộn chuột hoặc click. Vì popup là thành phần nổi bao phủ màn hình (overlay), việc bắt người dùng cuộn trang thì nó mới hiện là không hợp lý.
* **Giải pháp:** Tách Popup ra khỏi danh sách các phần tử cuộn lazy, cho phép render Popup ngay lập tức khi trang web vừa tải xong mà không cần chờ tương tác từ người dùng.

### 2. Elaboration & Self-Explanation
Hệ thống hiển thị trang chủ (`HomePageClient`) sử dụng một cơ chế tối ưu hóa layout: phân tách các phần tử thành hai nhóm: `criticalComponents` (vẽ ngay lập tức, mặc định là 3 phần tử đầu) và `deferredComponents` (trì hoãn vẽ thông qua `contentVisibility: 'auto'` và chỉ kích hoạt khi người dùng scroll/tương tác).
Popup do có thứ tự sắp xếp (`order`) lớn hơn 3 nên bị đẩy xuống nhóm `deferredComponents`. Vì nhóm này ban đầu có trạng thái hiển thị là ẩn (`showDeferred = false`) và được bọc bởi thuộc tính tối ưu hóa hiển thị của trình duyệt, component `Popup` thực chất chưa từng được khởi tạo (mount) khi người dùng vừa truy cập trang. 
Để giải quyết triệt để, chúng ta loại bỏ `Popup` khỏi bộ lọc sắp xếp thông thường của trang chủ và render nó độc lập ở cấp độ gốc của trang chủ ngay khi dữ liệu sẵn sàng.

### 3. Concrete Examples & Analogies
* **Ví dụ:** Trang chủ có 4 phần tử: 1-Hero Banner, 2-Danh mục, 3-Sản phẩm nổi bật, 4-Popup xác thực tuổi. Do giới hạn hiển thị ngay lập tức là 3 phần tử đầu, nên Popup (thứ 4) sẽ không được render cho đến khi người dùng cuộn chuột xuống dưới. Nhưng người dùng mới vào trang, chưa kịp cuộn chuột thì không thấy popup xác thực tuổi đâu cả.
* **Đời thường:** Giống như việc bạn thuê một bảo vệ đứng ở cửa để kiểm tra vé (Popup), nhưng bạn lại xếp người bảo vệ này đứng ở cuối hàng ghế khán giả (Deferred section). Khách vào cửa không thấy ai soát vé nên đi thẳng vào trong, chỉ khi họ đi xuống cuối phòng thì mới gặp người soát vé. Giải pháp là đưa người bảo vệ ra đứng ngay ở cửa ra vào (render độc lập ngay lập tức).

## II. Audit Summary (Tóm tắt kiểm tra)
* **Lĩnh vực ảnh hưởng:** Hiển thị Popup ở trang chủ phía Client.
* **Tình trạng:** Khách truy cập trang chủ không thấy hiển thị Popup mặc dù cấu hình trong Admin là đang bật và tần suất hiển thị là "Hiện mỗi lần vào trang" (`always`).
* **File liên quan:** 
  * `app/(site)/_components/HomePageClient.tsx`: Chứa logic phân loại và render tuần tự/trì hoãn các cấu phần trang chủ.
  * `components/site/home/HomeComponentRenderer.tsx`: Wrapper chịu trách nhiệm hiển thị cấu phần và áp dụng các thuộc tính spacing/font.

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):** Trong [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx#L179-L190), danh sách `sortedComponents` chứa tất cả các cấu phần hoạt động, bao gồm cả `Popup`. Sau đó danh sách này bị phân tách thành `criticalComponents` (chỉ lấy số lượng giới hạn `criticalCount` là 1-3 cấu phần đầu) và `deferredComponents` (các cấu phần còn lại bị lazy render). Vì `Popup` thường nằm ở cuối danh sách (chỉ số lớn hơn `criticalCount`), nó bị đưa vào `deferredComponents` và bị trì hoãn render cho tới khi có tương tác (scroll/click) và vùng bao quanh đi vào viewport.
* **Độ tin cậy nguyên nhân gốc:** High (100% chính xác vì kiểm tra logic code cho thấy `showDeferred` ban đầu là `false`, ngăn chặn hoàn toàn việc mount `PopupSectionShared` khi tải trang).

## IV. Proposal (Đề xuất)
* **Bước 1:** Thay đổi bộ lọc cấu phần trang chủ trong [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx#L179-L187) để loại bỏ kiểu component `Popup` ra khỏi luồng render tuần tự (tương tự như `Footer` đã được loại bỏ).
* **Bước 2:** Lọc riêng các component `Popup` đang hoạt động từ danh sách `resolvedComponents`.
* **Bước 3:** Render danh sách popup này trực tiếp ở cuối file [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx) mà không sử dụng bọc div tối ưu `contentVisibility` hay bị ảnh hưởng bởi biến trạng thái trì hoãn `showDeferred`.

## V. Files Impacted (Tệp bị ảnh hưởng)
### Sửa: [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx)
* **Vai trò hiện tại:** Phân tách và hiển thị các cấu phần trên trang chủ phía client theo cơ chế tải chậm (lazy render).
* **Thay đổi:** Lọc loại bỏ `Popup` khỏi danh sách cấu phần sắp xếp thông thường, lấy danh sách popup riêng và render trực tiếp ở ngoài để nó xuất hiện ngay lập tức khi tải trang.

## VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx).
2. Chỉnh sửa logic lọc của `sortedComponents` để thêm `if (componentItem.type === 'Popup') { return false; }`.
3. Khai báo `popupComponents = resolvedComponents.filter((componentItem) => componentItem.type === 'Popup')`.
4. Render `popupComponents` ở cuối khối JSX trả về của component `HomePageClient`.

## VII. Verification Plan (Kế hoạch kiểm chứng)
### Manual Verification
* Truy cập trang chủ phía client: `http://localhost:3000/`.
* Xác minh: Popup quảng cáo xuất hiện ngay lập tức sau khi tải trang (hoặc sau số giây delay cấu hình) mà không yêu cầu bất kỳ thao tác cuộn chuột hoặc click nào từ người dùng.

## VIII. Todo
* [ ] Sửa file [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx) theo đề xuất.
* [ ] Kiểm tra lỗi build tĩnh bằng `bunx tsc --noEmit`.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Popup hoạt động bình thường, hiển thị ngay lập tức (immediate) hoặc sau khoảng thời gian trễ (delay) được thiết lập mà không cần bất kỳ tương tác cuộn/click nào từ phía người dùng.
* Không làm ảnh hưởng đến các cấu phần thông thường khác trên trang chủ.
* Biên dịch TypeScript thành công mà không có lỗi.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro lớn vì chỉ thay đổi vị trí render của component `Popup` từ danh sách trì hoãn ra render trực tiếp.
* **Hoàn tác:** Khôi phục file [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx) về trạng thái cũ thông qua git checkout.

## XI. Out of Scope (Ngoài phạm vi)
* Các cấu hình về tần suất hiển thị (chỉ hiển thị 1 lần mỗi thiết bị/phiên) vẫn hoạt động dựa trên logic có sẵn trong `PopupRuntime`, không thay đổi logic này.

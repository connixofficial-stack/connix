# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Module "Khách hàng" (`customers`) hiện đang được đánh dấu là module hệ thống (`isCore: true`). Điều này khiến hệ thống khóa cứng nút bật/tắt (toggle) của nó trên giao diện quản trị, không cho người dùng tắt đi khi họ không cần dùng đến.
* **Giải pháp**: 
  * Thay đổi thuộc tính của module `customers` từ `isCore: true` thành `isCore: false` ở các tệp seed (khởi tạo dữ liệu).
  * Viết thêm cơ chế tự động sửa đổi (repair/normalize) trong API của Convex để khi chạy trên môi trường thực tế, thuộc tính `isCore` của module `customers` sẽ tự động chuyển về `false`.
  * Đảm bảo các module phụ thuộc như `orders` (Đơn hàng) và `wishlist` (Sản phẩm yêu thích) sẽ tự động tắt theo (cascade) khi module `customers` bị tắt.
* **Bảo vệ toàn diện**: Hệ thống đã có sẵn cơ chế bảo vệ thông minh (`Sidebar` lọc động và `ModuleGuard` chặn route). Khi module `customers` bị tắt, menu "Khách hàng" trên Sidebar sẽ lập tức biến mất, và nếu cố tình truy cập trực tiếp bằng URL `/admin/customers`, màn hình sẽ bị chặn lại và hiển thị thông báo an toàn.

## 2. Elaboration & Self-Explanation
Hệ thống quản lý module (Modules Management) cho phép Admin bật hoặc tắt các tính năng của website. Tuy nhiên, có những module được coi là "nền tảng" (Core Modules) như Cài đặt hệ thống (`settings`), Người dùng Admin (`users`) và Khách hàng (`customers`) được thiết lập `isCore: true` để tránh vô tình tắt đi làm hỏng hệ thống.

Hiện tại, khách hàng mong muốn module "Khách hàng" (`customers`) phải tắt được để tối giản hệ thống nếu họ không có nhu cầu quản lý khách hàng. 

Để làm được việc này một cách an toàn và triệt để:
1. **Thay đổi thuộc tính core**: Ta cần hạ cấp module `customers` xuống thành module thông thường bằng cách đổi `isCore: false`.
2. **Cập nhật database hiện tại**: Do dữ liệu hiện tại trong database của môi trường đang chạy đã được seed từ trước với giá trị `isCore: true`, ta phải can thiệp vào tầng API của Convex để tự động cập nhật (patch) giá trị này về `false` mà không cần chạy lại seed (tránh mất mát dữ liệu thật). Việc này được thực hiện thông qua hàm chuẩn hóa `normalizeRolesModule` và hàm sửa lỗi tự động `repairRolesCoreFlag` hiện có, ta sẽ mở rộng chúng để hỗ trợ thêm cả module `customers`.
3. **Cơ chế ẩn menu động (Sidebar)**: [Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/Sidebar.tsx) đã được lập trình sẵn để kiểm tra trạng thái bật/tắt của module thông qua hàm `isModuleEnabled`. Khi `customers` bị tắt, menu liên kết đến `/admin/customers` và toàn bộ các sub-items liên quan sẽ tự động ẩn đi hoàn toàn khỏi thanh điều hướng bên trái của admin mà không cần sửa code giao diện.
4. **Cơ chế chặn truy cập trực tiếp (ModuleGuard)**: Trang quản lý khách hàng [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/customers/page.tsx) được bọc bởi component `<ModuleGuard moduleKey="customers">`. Nếu người dùng cố tình truy cập trực tiếp bằng cách gõ URL `/admin/customers` khi module bị tắt, `ModuleGuard` sẽ chặn render trang và hiển thị giao diện thông báo "Module Khách hàng hiện đang bị tắt" một cách chuyên nghiệp.
5. **Cơ chế Cascade tự động cho các module liên đới**: Vì các module như "Đơn hàng" (`orders`) và "Sản phẩm yêu thích" (`wishlist`) phụ thuộc vào `customers`, cơ chế cascade khi toggle tắt `customers` sẽ tự động tắt cả `orders` và `wishlist` đi. Tương ứng, các menu và route của `orders` và `wishlist` cũng sẽ tự động ẩn đi và bị chặn truy cập giống hệt như `customers`.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như việc một chiếc điện thoại thông minh cài sẵn ứng dụng "Bản đồ" của hệ thống và mặc định không cho phép bạn gỡ cài đặt hay tắt nó đi (vì nó là core app). Bây giờ, nhà sản xuất phát hành một bản cập nhật phần mềm, chuyển ứng dụng "Bản đồ" này thành ứng dụng thông thường, cho phép bạn tắt/vô hiệu hóa nó nếu bạn không dùng đến để tiết kiệm bộ nhớ.
* **Tương tác cascade và bảo vệ**: Khi bạn tắt module "Bản đồ", các widget hiển thị thời tiết trên màn hình chính (vốn lấy dữ liệu vị trí từ Bản đồ) cũng sẽ tự động biến mất và nút bấm mở Bản đồ trong app drawer cũng sẽ ẩn đi. Nếu bạn bấm vào một đường link mở bản đồ từ ứng dụng khác, điện thoại sẽ báo lỗi ứng dụng đã bị vô hiệu hóa thay vì bị crash.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã dùng công cụ `grep` tìm kiếm kỹ lưỡng trong toàn bộ codebase và phát hiện các vị trí liên quan sau:
1. **Dữ liệu khởi tạo (Seeders)**:
   * [convex/seeders/adminModules.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/seeders/adminModules.seeder.ts#L43): Định nghĩa module `customers` có `isCore: true`.
   * [convex/seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/seed.ts#L31): Định nghĩa module `customers` có `isCore: true` trong hàm `seedModules`.
   * [convex/seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/seed.ts#L412): Định nghĩa tương tự trong hàm `seedAll`.
2. **Logic kiểm soát tại Backend**:
   * [convex/admin/modules.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/admin/modules.ts#L49-L86): Có các hàm `normalizeRolesModule`, `normalizeRolesModuleWithPatch`, và `repairRolesCoreFlag` dùng để loại bỏ thuộc tính core của module `roles`. Cần áp dụng tương tự cho `customers`.
   * [convex/admin/modules.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/admin/modules.ts#L400-L406): Chặn việc tắt module core (`isCore && key !== 'roles'`).
3. **Logic kiểm soát hiển thị và bảo vệ tại Frontend**:
   * [app/admin/components/Sidebar.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/Sidebar.tsx#L411): Khai báo menu "Khách hàng" gắn liền với cờ `moduleKey: 'customers'`. Menu này tự động ẩn khi module bị tắt.
   * [app/admin/customers/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/customers/page.tsx#L21): Bọc toàn bộ trang bằng `<ModuleGuard moduleKey={MODULE_KEY}>`.
   * [app/admin/components/ModuleGuard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/components/ModuleGuard.tsx#L55): Chặn render và hiển thị màn hình thông báo tắt module chuyên nghiệp nếu cờ module đó là `false`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc (Root Cause)**: Module `customers` bị khóa cứng không cho toggle tắt là do thuộc tính `isCore` được thiết lập bằng `true` trong cơ sở dữ liệu (từ lúc chạy seed) và frontend cũng như API backend chặn toggle đối với các module có `isCore: true` (ngoại trừ module `roles`).
* **Độ tin cậy nguyên nhân gốc**: **High (Cao)** - Vì bằng chứng từ mã nguồn cho thấy cả frontend và backend đều ràng buộc chặt chẽ thuộc tính `isCore`. Chỉ cần chuyển thuộc tính này thành `false` cho module `customers` ở cả DB thực tế và mã nguồn seed thì nút toggle sẽ lập tức hoạt động bình thường và kích hoạt toàn bộ cơ chế ẩn/chặn tự động ở frontend.
* **Giả thuyết đối chứng**: Liệu có cơ chế cứng nào khác chặn việc hiển thị hay toggle riêng biệt cho `customers` không?
  * Kết quả phân tích tệp `Sidebar.tsx` và `ModuleGuard.tsx` cho thấy toàn bộ logic ẩn menu và chặn route đều được xây dựng tổng quát hóa dựa trên API `isModuleEnabled`. Không có bất kỳ dòng code hardcode nào chặn thủ công menu hay route của `customers`. Do đó, chỉ cần backend cập nhật trạng thái bật/tắt, frontend sẽ tự động phản hồi đồng bộ hoàn hảo.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất các thay đổi cụ thể sau để giải quyết triệt để yêu cầu:

1. **Cập nhật dữ liệu khởi tạo (Seeders)**:
   * Thay đổi `isCore: true` thành `isCore: false` cho module `customers` trong `convex/seed.ts` và `convex/seeders/adminModules.seeder.ts`.

2. **Cập nhật Logic chuẩn hóa tại Backend (API)**:
   * Mở rộng hàm `normalizeRolesModule` và `normalizeRolesModuleWithPatch` trong `convex/admin/modules.ts` để nó tự động nhận diện và xử lý module `customers` giống như cách nó đang xử lý module `roles`.
   * Gộp và cập nhật hàm `repairRolesCoreFlag` thành `repairSystemCoreFlags` để tự động kiểm tra và patch cơ sở dữ liệu thật của các môi trường đang chạy, tự động chuyển `isCore` của `customers` về `false` khi admin truy cập trang quản lý module hoặc thực hiện toggle.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm Backend & Seeders (Convex)

#### [MODIFY] [adminModules.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/seeders/adminModules.seeder.ts)
* **Vai trò hiện tại**: Seed danh sách các module quản trị hệ thống khi khởi tạo DB.
* **Thay đổi**: Đổi `isCore: true` thành `isCore: false` tại dòng định nghĩa module `customers` (dòng 43).

#### [MODIFY] [seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/seed.ts)
* **Vai trò hiện tại**: Cung cấp các hàm seed dữ liệu hệ thống toàn cục và cấu hình preset.
* **Thay đổi**: Đổi `isCore: true` thành `isCore: false` cho module `customers` tại các hàm `seedModules` (dòng 31) và `seedAll` (dòng 412).

#### [MODIFY] [modules.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/admin/modules.ts)
* **Vai trò hiện tại**: Xử lý API liên quan đến quản lý module (list, toggle, update).
* **Thay đổi**:
  * Cập nhật `normalizeRolesModule` và `normalizeRolesModuleWithPatch` để chuyển đổi động `isCore` của `customers` về `false`.
  * Cập nhật `repairRolesCoreFlag` (đổi tên thành `repairSystemCoreFlags`) để tự động patch `isCore` thành `false` cho cả `roles` và `customers` trong DB thật.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Sửa đổi `convex/seeders/adminModules.seeder.ts` để chuyển `isCore` của `customers` thành `false`.
2. **Bước 2**: Sửa đổi `convex/seed.ts` tại hai vị trí định nghĩa module `customers` để chuyển `isCore` thành `false`.
3. **Bước 3**: Sửa đổi `convex/admin/modules.ts` để cập nhật logic chuẩn hóa động và tự động patch DB hiện tại khi gọi các hàm toggle.
4. **Bước 4**: Tiến hành tự kiểm tra bằng mắt (static review) mã nguồn để đảm bảo không lỗi cú pháp hoặc kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* **Không thực hiện**: Tuyệt đối tuân thủ quy tắc cấm tự chạy unit test hoặc lint trên môi trường phát triển. Việc kiểm thử runtime và tích hợp sẽ do tester phụ trách.
* Tuy nhiên, có thể chạy `bunx tsc --noEmit` sau khi sửa code để đảm bảo TypeScript không báo lỗi kiểu dữ liệu.

### Manual Verification
* **Các bước kiểm thử dành cho Tester**:
  1. Truy cập trang quản lý module: `http://localhost:3000/system/modules`.
  2. Quan sát module "Khách hàng" (`customers`). Xác nhận nút toggle hiển thị bình thường (không bị khóa hay ghi chữ "Hệ thống" màu xám).
  3. Bật module "Khách hàng", sau đó bật các module phụ thuộc là "Đơn hàng" và "Sản phẩm yêu thích".
  4. Thực hiện tắt (toggle off) module "Khách hàng". Xác nhận hệ thống hiển thị cảnh báo cascade (yêu cầu tắt các module phụ thuộc) và khi xác nhận, tất cả các module phụ thuộc (`orders`, `wishlist`) đều được tự động tắt thành công.
  5. Sau khi tắt module "Khách hàng", kiểm tra Sidebar bên trái: Xác nhận menu "Khách hàng", menu "Đơn hàng", menu "Sản phẩm yêu thích" và "Giỏ hàng" đều đã tự động ẩn đi hoàn toàn khỏi thanh điều hướng.
  6. Gõ trực tiếp URL `http://localhost:3000/admin/customers` trên thanh địa chỉ trình duyệt. Xác nhận trang bị chặn và hiển thị màn hình thông báo "Module Khách hàng hiện đang bị tắt" một cách an toàn.

---

# VIII. Todo
- [ ] Chỉnh sửa file seed `convex/seeders/adminModules.seeder.ts` dòng 43: Đổi `isCore: true` thành `isCore: false` cho module `customers`.
- [ ] Chỉnh sửa file seed `convex/seed.ts` dòng 31 và 412: Đổi `isCore: true` thành `isCore: false` cho module `customers`.
- [ ] Cập nhật file logic `convex/admin/modules.ts`:
  - [ ] Mở rộng hàm `normalizeRolesModule` để hỗ trợ `customers`.
  - [ ] Mở rộng hàm `normalizeRolesModuleWithPatch` để hỗ trợ `customers`.
  - [ ] Cập nhật hàm `repairRolesCoreFlag` (đổi tên thành `repairSystemCoreFlags`) để tự động sửa flag `isCore` của cả `roles` và `customers`.
- [ ] Thực hiện kiểm tra tĩnh TypeScript bằng `bunx tsc --noEmit` giới hạn 10 dòng đầu.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Điều kiện Đạt (Pass)**:
  * Trang `http://localhost:3000/system/modules` cho phép bật/tắt module "Khách hàng" (`customers`) một cách bình thường.
  * Tắt module "Khách hàng" sẽ tự động tắt các module phụ thuộc (`orders`, `wishlist`) theo cơ chế cascade an toàn.
  * Khi module "Khách hàng" tắt, menu điều hướng admin tự động ẩn liên kết `/admin/customers` và các module phụ thuộc liên đới.
  * Truy cập URL `/admin/customers` trực tiếp bằng trình duyệt khi module đang tắt sẽ hiển thị giao diện báo tắt module an toàn.
  * Khởi tạo hệ thống mới hoặc chạy seed sẽ tạo module `customers` có `isCore` là `false`.
* **Điều kiện Không Đạt (Fail)**:
  * Module "Khách hàng" vẫn bị khóa, hiển thị trạng thái hệ thống.
  * Bật/tắt gây lỗi crash API hoặc xung đột dữ liệu.
  * Menu điều hướng admin không ẩn đi hoặc truy cập trực tiếp URL vẫn vào được trang quản lý bình thường khi module đang tắt.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: 
  * Rủi ro cực kỳ thấp vì cơ chế dependency và cascade của hệ thống module đã được thiết kế sẵn và hoạt động rất tốt (đã kiểm chứng qua các module khác).
* **Hoàn tác**: 
  * Nếu muốn rollback, chỉ cần sử dụng git để hủy các thay đổi (`git checkout`) trong các file đã sửa.

---

# XI. Out of Scope (Ngoài phạm vi)
* Việc thay đổi giao diện, màu sắc hay bố cục của trang quản lý module.
* Việc thay đổi các tính năng nội bộ bên trong của module `customers`.

---

# XII. Open Questions (Câu hỏi mở)
* *Hiện tại không có câu hỏi mở nào vì yêu cầu đã rõ ràng và logic hệ thống hoàn toàn tương thích.*

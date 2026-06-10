# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta cần làm cho các bộ lọc tài nguyên (như AutoCAD 2D, Blender...) trở nên sinh động và trực quan hơn bằng cách hiển thị hình ảnh nhỏ (icon) đại diện của chúng ở khắp mọi nơi: trong danh sách lựa chọn, trên thẻ tài nguyên ở trang danh sách và trang chi tiết. Đồng thời, chúng ta cũng bổ sung nút bật/tắt hiển thị bộ lọc này trong trang cài đặt giao diện (Experiences) để quản trị viên có thể ẩn hoặc hiện bộ lọc theo ý muốn, miễn là tính năng bộ lọc tài nguyên của hệ thống đang được kích hoạt.

## 2. Elaboration & Self-Explanation
Yêu cầu mới bổ sung các tính năng sau:
- **Hiển thị Icon đại diện:** Mỗi giá trị bộ lọc (ví dụ: Blender có logo Blender, AutoCAD có logo chữ A màu đỏ) từ DB đều đi kèm một icon. Chúng ta sẽ hiển thị các icon này ở:
  1. Dropdown bộ lọc ở trang danh sách tài nguyên thực tế (`ResourcesPage.tsx`) và trang xem trước (`ResourcePreview.tsx`).
  2. Các thẻ tài nguyên nhỏ ở trang danh sách tài nguyên.
  3. Phần hiển thị bộ lọc ở đầu trang chi tiết tài nguyên (`ResourceDetailPage.tsx`) và preview chi tiết (`ResourcePreview.tsx`).
- **Thêm cấu hình bật/tắt Bộ lọc (Show/Hide Filter on UI):** 
  - Trong trang cấu hình giao diện danh sách tài nguyên (`app/system/experiences/resources-list/page.tsx`) và chi tiết tài nguyên (`app/system/experiences/resources-detail/page.tsx`), bổ sung thêm một dòng tùy chọn Toggle bật/tắt có nhãn `"Bộ lọc tài nguyên"`.
  - Tùy chọn Toggle này chỉ xuất hiện khi tính năng bộ lọc của module tài nguyên được bật (`enableResourceFilters === true`).
  - Giao diện thực tế ngoài client sẽ dựa vào cấu hình `showResourceFilters` này để ẩn hoặc hiện bộ lọc cho tương ứng.

## 3. Concrete Examples & Analogies
Tưởng tượng các nhãn phần mềm giống như quốc kỳ của các nước:
- Việc thêm **Icon đại diện** giống như việc thay vì chỉ viết chữ "Việt Nam", "Nhật Bản", "Hàn Quốc" khô khan trên bảng thông tin và hộ chiếu, chúng ta in thêm lá cờ nhỏ màu đỏ sao vàng, cờ mặt trời đỏ bên cạnh chữ. Người dùng chỉ cần liếc mắt 0.1 giây là nhận ra phần mềm họ cần mà không cần đọc hết chữ.
- Việc thêm nút **Bật/Tắt bộ lọc** giống như việc siêu thị có một bảng menu điện tử ở sảnh. Khi siêu thị hết sạch các gia vị lẩu nướng (hoặc khi quản lý tắt tính năng lọc món ăn đi), quản lý có một công tắc để ẩn phân loại này khỏi bảng menu sảnh để khách đỡ thắc mắc. Nhưng công tắc này chỉ bấm được nếu hệ thống điện tử của siêu thị có cắm dây nguồn cho module Lọc món ăn đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Trang hiển thị chính thức (`ResourcesPage.tsx`):**
  - Dropdown hiển thị các giá trị bộ lọc chưa hiển thị thẻ `img` cho `option.icon`.
  - Các thẻ card tài nguyên hiển thị tag filter chỉ có text chứ chưa hiển thị thẻ `img` cho `value.icon`.
- **Trang chi tiết tài nguyên (`ResourceDetailPage.tsx`):**
  - Dòng 230: Khối vẽ `assignedFilters` hiển thị text của các bộ lọc được gắn nhưng không vẽ icon của chúng. Chưa kiểm tra cấu hình UI `config.showResourceFilters` cũng như trạng thái tính năng `resourceFiltersFeature?.enabled`.
- **Trang cấu hình Experiences (`resources-list/page.tsx` và `resources-detail/page.tsx`):**
  - Chưa định nghĩa trường `showResourceFilters` trong config mặc định và trên giao diện cài đặt (thiếu dòng ToggleRow tương ứng).
  - Chưa lấy/truy vấn module feature `enableResourceFilters` để kiểm soát sự xuất hiện của ToggleRow này.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc (Root Cause):**
  - Trước đây, cấu hình giao diện chỉ tập trung vào việc bật/tắt Search, Category và layout chung. Bộ lọc tài nguyên được mặc định hiển thị nếu tính năng module bật, không cho phép admin điều khiển hiển thị riêng biệt trên UI (thiếu show/hide toggles).
  - Các icon của bộ lọc đã được hỗ trợ lưu trữ trong DB và Convex schema nhưng chưa được viết code hiển thị thẻ `<img />` trên các giao diện tương ứng ở Frontend.
- **Giả thuyết đối chứng (Counter-Hypothesis):**
  - Nếu chỉ render icon ở dropdown mà không render ở card và trang chi tiết, trải nghiệm thị giác sẽ bị đứt gãy. Khi người dùng chọn Blender có logo quả cam rất đẹp ở dropdown, nhưng khi nhìn vào card tài nguyên bên dưới lại chỉ thấy chữ "Blender" xám xịt thì sẽ thiếu nhất quán. Do đó, việc render đồng bộ icon là bắt buộc.

---

# IV. Proposal (Đề xuất)

- **Sửa 1: Cấu hình chung (`lib/experiences/useSiteConfig.ts`)**
  - Bổ sung trường `showResourceFilters` kiểu `boolean` vào `ResourcesListConfig` và `ResourcesDetailConfig` (mặc định là `true`).
- **Sửa 2: Dropdown & Card (`ResourcesPage.tsx`):**
  - Truyền thêm `icon: val.icon` vào `options` của dropdown bộ lọc.
  - Sửa `CustomDropdown` để nếu option có `icon`, sẽ render thẻ `img` bên cạnh text (cả ở danh sách chọn và ở nút hiển thị khi đã chọn).
  - Sửa phần render thẻ card tài nguyên: hiển thị thêm icon nhỏ sát cạnh tên bộ lọc nếu `value.icon` tồn tại. Chỉ hiển thị bộ lọc trên card nếu cấu hình giao diện `config.showResourceFilters` được bật.
- **Sửa 3: Trang chi tiết tài nguyên (`ResourceDetailPage.tsx`):**
  - Query `resourceFiltersFeature` từ Convex.
  - Kiểm tra `resourceFiltersFeature?.enabled && config.showResourceFilters` trước khi render khối `assignedFilters`.
  - Hiển thị thêm icon nhỏ của filter value trong thẻ tag bộ lọc chi tiết.
- **Sửa 4: Giao diện quản trị trải nghiệm (`system/experiences/resources-list/page.tsx` và `system/experiences/resources-detail/page.tsx`):**
  - Query module feature `enableResourceFilters`.
  - Nếu tính năng này bật ở module, vẽ thêm một `ToggleRow` có nhãn `"Hiển thị bộ lọc"` để admin bật/tắt.
- **Sửa 5: Đồng bộ Preview (`ResourcePreview.tsx`):**
  - Bổ sung mock icon cho các filter giả lập (ví dụ SVG hoặc màu sắc) để hiển thị trong preview của card và chi tiết tài nguyên khi Toggle bật.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Shared / Configuration
- **Sửa:** [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts)
  - *Vai trò hiện tại:* Cung cấp hook lấy cấu hình hiển thị cho toàn site.
  - *Thay đổi:* Thêm trường `showResourceFilters` vào config của trang danh sách tài nguyên và trang chi tiết tài nguyên.

### Client UI / Public pages
- **Sửa:** [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx)
  - *Vai trò hiện tại:* Danh sách tài nguyên công khai ngoài site.
  - *Thay đổi:* Đưa icon vào dropdown bộ lọc và card tài nguyên; ẩn/hiện bộ lọc theo cấu hình `showResourceFilters`.
- **Sửa:** [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourceDetailPage.tsx)
  - *Vai trò hiện tại:* Trang chi tiết tài nguyên công khai ngoài site.
  - *Thay đổi:* Đưa icon vào tag bộ lọc chi tiết; ẩn/hiện bộ lọc theo cấu hình `showResourceFilters` và trạng thái module.

### Admin Experiences Editor
- **Sửa:** [page.tsx (list)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-list/page.tsx)
  - *Vai trò hiện tại:* Trang cấu hình giao diện danh sách tài nguyên của quản trị.
  - *Thay đổi:* Thêm ToggleRow "Hiển thị bộ lọc" có kiểm soát theo trạng thái module.
- **Sửa:** [page.tsx (detail)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-detail/page.tsx)
  - *Vai trò hiện tại:* Trang cấu hình giao diện chi tiết tài nguyên của quản trị.
  - *Thay đổi:* Thêm ToggleRow "Hiển thị bộ lọc" có kiểm soát theo trạng thái module.
- **Sửa:** [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx)
  - *Vai trò hiện tại:* Vẽ giao diện xem trước (preview) của tài nguyên.
  - *Thay đổi:* Đồng bộ hóa render dropdown/tags có icon giả lập và ẩn/hiện theo props.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa `useSiteConfig.ts` để cập nhật kiểu dữ liệu và giá trị mặc định cho `showResourceFilters`.
2. Sửa `ResourcesPage.tsx` để tích hợp hiển thị icon trong dropdown, card và kiểm tra `showResourceFilters`.
3. Sửa `ResourceDetailPage.tsx` để tích hợp hiển thị icon và kiểm tra `showResourceFilters`.
4. Sửa `resources-list/page.tsx` và `resources-detail/page.tsx` để thêm Toggles trong trang quản trị.
5. Sửa `ResourcePreview.tsx` để vẽ mock icons trong Preview list và detail.
6. Chạy `tsc` test kiểu và commit code.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- `bunx tsc --noEmit` để đảm bảo code biên dịch thành công 100%.

### Manual Verification
- Tại admin: Truy cập `/system/experiences/resources-list` và `/system/experiences/resources-detail`. Kiểm tra xem dòng Toggle `"Bộ lọc tài nguyên"` có xuất hiện ở cột Khối hiển thị hay không (nếu module tài nguyên đang bật bộ lọc).
- Thử bật/tắt Toggle này, xác nhận Preview thay đổi realtime (hiện/ẩn dropdown bộ lọc hoặc các tag bộ lọc).
- Tại client: Truy cập `/resources` và `/autocad-2d/thu-vien-autocad-2dg`. Xác nhận các bộ lọc hiển thị đầy đủ icon đi kèm và thay đổi tương ứng theo cấu hình Toggle ở quản trị.

---

# VIII. Todo

- [ ] Sửa [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts) để khai báo trường config mới.
- [ ] Sửa [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourcesPage.tsx) hiển thị icon bộ lọc ở dropdown/card và theo config.
- [ ] Sửa [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/%28site%29/_components/resources/ResourceDetailPage.tsx) hiển thị icon ở tag chi tiết và theo config.
- [ ] Sửa [resources-list/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-list/page.tsx) thêm toggle bộ lọc ở admin list.
- [ ] Sửa [resources-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-detail/page.tsx) thêm toggle bộ lọc ở admin detail.
- [ ] Sửa [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx) cập nhật preview tương ứng.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Giao diện có icon hiển thị đầy đủ ở dropdown, card tài nguyên và đầu trang chi tiết tài nguyên.
- Các trang quản trị experiences có ToggleRow "Hiển thị bộ lọc" hoạt động bình thường, lưu cấu hình thành công.
- Ẩn/hiện bộ lọc ở ngoài site chạy đồng bộ với cấu hình Toggle.
- Biên dịch không có lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro lỗi type do thiếu trường trong config settings cũ. Đã xử lý fallback mặc định là `true` để giữ tương thích ngược an toàn.
- Hoàn tác: `git checkout` các file tương ứng.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi logic Convex DB.
- Không sửa giao diện bài viết, sản phẩm khác ngoài Tài nguyên.

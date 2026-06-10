# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Việc chỉ có một checkbox "Tạo bản sao tương tự" khi tạo mới bộ lọc chưa đáp ứng tốt nhu cầu liên kết. Nếu bên Khóa học đã có bộ lọc `"Phần mềm"` với 10 giá trị lọc con, khi sang bên Tài nguyên, quản trị viên muốn có thể chọn "liên kết" với bộ lọc đó và tự động copy toàn bộ 10 giá trị con sang, chứ không muốn tạo mới hoàn toàn rồi nhập lại từ đầu.
* **Giải pháp**: Xây dựng UI/UX nâng cao tại trang Tạo bộ lọc mới:
  * Cho phép chọn 2 phương thức: `"Tạo mới hoàn toàn"` hoặc `"Sao chép & Liên kết từ bộ lọc đối tác"`.
  * Nếu chọn "Sao chép & Liên kết", hệ thống hiển thị Dropdown danh sách các bộ lọc bên Khóa học (hoặc Tài nguyên) chưa có ở bên này.
  * Khi chọn một bộ lọc đối tác, hệ thống tự động điền Tên, khóa cứng Slug (để đồng nhất liên kết mềm) và tự động sao chép toàn bộ các giá trị lọc con sang sau khi tạo thành công.
* **Lợi ích**: UI/UX vô cùng thông minh, tự động phát hiện dữ liệu chéo, giúp admin thiết lập bộ lọc chéo chỉ với 2 click chuột mà không lo bị lệch dữ liệu.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ triển khai cơ chế **"Nhập dữ liệu từ đối tác (Partner Import on Creation)"** song song với chế độ tạo mới thông thường:

* **Tầng Backend (Convex)**:
  * Viết query `listUnmappedPartnerFilters` ở cả hai file API. Query này sẽ lấy toàn bộ danh sách bộ lọc của bảng đối diện, sau đó lọc bỏ những bộ lọc đã có slug trùng khớp ở bảng hiện tại. Kết quả trả về là danh sách các bộ lọc "chưa được đồng nhất".
  * Cập nhật mutation `create` để nhận tham số `copyValuesFromPartnerSlug?: string`. Khi tham số này được gửi lên, backend sau khi insert bộ lọc mới sẽ truy vấn toàn bộ các giá trị lọc (`FilterValues`) thuộc bộ lọc đối tác có slug tương ứng, rồi insert bản sao của chúng vào bảng giá trị lọc hiện tại.
* **Tầng Giao diện (UI Admin)**:
  * Tại trang `create/page.tsx` ở cả 2 module:
    * Thêm state `creationMode` (`'new'` | `'copy'`) hiển thị dưới dạng Radio tabs hoặc Select.
    * Mặc định là `'new'` (Tạo mới hoàn toàn).
    * Khi chọn `'copy'` (Sao chép & Liên kết từ bộ lọc đối tác có sẵn):
      * Gọi query `listUnmappedPartnerFilters` để hiển thị trong một `<select>` dropdown.
      * Khi admin chọn một bộ lọc từ dropdown, ta tự động set state `name` thành tên bộ lọc đó, set state `slug` thành slug bộ lọc đó và set input slug thành `disabled={true}` để khóa cứng slug, đảm bảo liên kết chéo qua slug hoạt động hoàn hảo.
      * Tự động gửi cờ `copyValuesFromPartnerSlug` lên mutation tạo khi submit.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Bên Khóa học đã có bộ lọc `"Ngôn ngữ lập trình"` (slug: `ngon-ngu-lap-trinh`) chứa các giá trị: `Javascript`, `Python`, `Go`.
  * Admin sang bên Tài nguyên tạo bộ lọc, chọn `"Sao chép & Liên kết từ Khóa học"`. Dropdown hiển thị `"Ngôn ngữ lập trình"`. Admin click chọn.
  * Input Tên tự động điền `"Ngôn ngữ lập trình"`, Input Slug điền `"ngon-ngu-lap-trinh"` và bị khóa không cho sửa.
  * Admin nhấn "Tạo bộ lọc". Bộ lọc mới được tạo bên Tài nguyên và tự động có sẵn 3 giá trị con: `Javascript`, `Python`, `Go` mà không cần nhập thủ công.
* **Hình ảnh tương đồng**: Giống như việc bạn có 2 phòng trưng bày (Phòng Khóa học và Phòng Tài nguyên). Ở phòng Khóa học đã có một kệ sách chứa đầy sách Figma, Photoshop. Khi bạn muốn làm một kệ tương tự ở phòng Tài nguyên, thay vì mua kệ trống rồi đi nhặt từng cuốn sách xếp vào, bạn gọi thợ đóng một chiếc kệ giống hệt và bê nguyên bộ sách mẫu Figma, Photoshop ở phòng bên kia đặt sang.

# II. Audit Summary (Tóm tắt kiểm tra)

* Các bảng `courseFilters` và `resourceFilters` có cấu trúc tương thích 100%.
* Chúng ta đã có sẵn mutation `copyValuesToPartner` viết ở bước trước để copy values cho bộ lọc đã có sẵn. Ý tưởng mở rộng mutation `create` để copy values ngay khi tạo mới là hoàn toàn khả thi và nhất quán về mặt kiến trúc.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Hạn chế của UI cũ**: Checkbox "Tạo đúp" chỉ giúp ích khi tạo mới đồng thời cả 2 bên. Trong trường hợp một bên đã có dữ liệu trước (ví dụ Khóa học đã chạy lâu năm có sẵn rất nhiều bộ lọc), khi admin muốn tạo bộ lọc tương tự cho Tài nguyên, UI cũ không hỗ trợ nhập lại nhanh dữ liệu có sẵn, bắt buộc admin phải gõ tay hoặc chạy tool copy đồng loạt rất thiếu linh hoạt.
* **Giải pháp Dropdown liên kết**: Giải quyết triệt để vấn đề này, tăng tốc độ thiết lập dữ liệu và đảm bảo slug của hai bên trùng khớp tuyệt đối.

# IV. Proposal (Đề xuất)

## 1. Tầng Database & API (Convex)
a) **Thêm Query `listUnmappedPartnerFilters`**:
   * Trong `convex/resourceFilters.ts`: Trả về danh sách `courseFilters` có slug chưa tồn tại ở `resourceFilters`.
   * Trong `convex/courseFilters.ts`: Trả về danh sách `resourceFilters` có slug chưa tồn tại ở `courseFilters`.

b) **Cập nhật mutation `create`**:
   * Nhận thêm tham số `copyValuesFromPartnerSlug?: v.optional(v.string())`.
   * Nếu có tham số này, sau khi insert bộ lọc mới, truy vấn toàn bộ các giá trị lọc (`FilterValues`) thuộc bộ lọc đối tác có slug đó và insert bản sao sang bảng giá trị của module hiện tại.

## 2. Giao diện Admin (UI)
a) **Trang tạo mới bộ lọc (`create/page.tsx`)**:
   * Thêm lựa chọn "Phương thức tạo bộ lọc":
     * `[o] Tạo mới hoàn toàn`
     * `[o] Sao chép & Liên kết từ bộ lọc Khóa học (Tài nguyên) có sẵn`
   * Khi chọn "Sao chép & Liên kết":
     * Hiển thị Dropdown danh sách các bộ lọc chưa liên kết từ query `listUnmappedPartnerFilters`.
     * Khi thay đổi Select: Cập nhật Tên, Slug từ bộ lọc đối tác được chọn và khóa cứng trường Slug (`disabled`).
     * Khi nhấn submit, gọi mutation `create` với cờ `copyValuesFromPartnerSlug`.
   * Khi chọn "Tạo mới hoàn toàn":
     * Giao diện hoạt động như cũ (cho phép gõ Tên, Slug, Trạng thái và có checkbox tạo đúp sang đối tác).

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. Nhóm Backend & API (Convex)
* `Sửa:` [convex/resourceFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resourceFilters.ts): Bổ sung query `listUnmappedPartnerFilters` và cập nhật mutation `create` hỗ trợ `copyValuesFromPartnerSlug`.
* `Sửa:` [convex/courseFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courseFilters.ts): Bổ sung tương tự để hỗ trợ đồng bộ ngược lại.

## 2. Nhóm Giao diện (UI Admin)
* `Sửa:` [app/admin/resources/filters/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/filters/create/page.tsx): Thiết kế lại giao diện Form để hỗ trợ chế độ Sao chép & Liên kết kèm theo Dropdown chọn bộ lọc Khóa học.
* `Sửa:` [app/admin/courses/filters/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/create/page.tsx): Thiết kế lại tương tự để hỗ trợ Dropdown chọn bộ lọc Tài nguyên.

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Thêm query `listUnmappedPartnerFilters` và nâng cấp mutation `create` ở cả 2 tệp API Convex.
2. **Bước 2**: Thiết kế lại giao diện trang `create/page.tsx` ở cả 2 module để tích hợp Dropdown lựa chọn bộ lọc đối tác và logic khóa cứng Slug.
3. **Bước 3**: Kiểm tra kiểu dữ liệu TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.

### Manual Verification
1. **Liên kết bộ lọc**:
   * Bên Khóa học đã có sẵn bộ lọc `"Độ khó"` (slug: `do-kho`) chứa 3 giá trị `Dễ`, `Trung bình`, `Khó`.
   * Vào trang tạo mới bộ lọc Tài nguyên, chọn phương thức `"Sao chép & Liên kết"`. Chọn bộ lọc `"Độ khó"` trong dropdown.
   * Xác nhận Tên và Slug tự động được điền và Slug bị disable.
   * Nhấn "Tạo bộ lọc", sau đó vào trang edit bộ lọc vừa tạo, xác nhận 3 giá trị `Dễ`, `Trung bình`, `Khó` đã tự động được import thành công.

# VIII. Todo

- [ ] Cập nhật API Convex `convex/resourceFilters.ts` (thêm query `listUnmappedPartnerFilters`, cập nhật `create`)
- [ ] Cập nhật API Convex `convex/courseFilters.ts` (thêm query `listUnmappedPartnerFilters`, cập nhật `create`)
- [ ] Thiết kế lại giao diện Tạo bộ lọc tài nguyên `app/admin/resources/filters/create/page.tsx` bổ sung Dropdown liên kết bộ lọc Khóa học.
- [ ] Thiết kế lại giao diện Tạo bộ lọc khóa học `app/admin/courses/filters/create/page.tsx` bổ sung Dropdown liên kết bộ lọc Tài nguyên.
- [ ] Chạy lệnh `bunx tsc --noEmit` xác minh kiểu dữ liệu.
- [ ] Commit code thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Trang tạo bộ lọc có giao diện trực quan cho phép admin chọn giữa tạo mới hoàn toàn hoặc sao chép từ bộ lọc đối tác có sẵn.
* Khi sao chép bộ lọc đối tác, toàn bộ giá trị lọc con phải được nhân bản thành công sang bảng đối diện tương ứng.
* Slug của bộ lọc được sao chép phải trùng khớp tuyệt đối và bị khóa không cho sửa trên giao diện tạo để giữ tính liên kết.
* `tsc --noEmit` hoàn thành không lỗi.

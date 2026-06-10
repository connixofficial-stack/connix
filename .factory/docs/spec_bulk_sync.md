# Spec: Bulk Action Đồng Bộ Module Từ Định Nghĩa

## I. Primer

### 1. TL;DR kiểu Feynman
Khi thay đổi mã nguồn của các module (như thêm thuộc tính mới hay trường dữ liệu mới), chúng ta cần cập nhật cơ sở dữ liệu để hệ thống nhận diện được. Trước đây, lập trình viên phải bấm nút đồng bộ thủ công trên từng trang cấu hình của từng module riêng lẻ. Bản cập nhật này sẽ thêm một hộp kiểm (checkbox) bên cạnh mỗi module tại trang quản lý chung và một thanh công cụ nổi (Floating Action Bar) hiện ra khi có module được chọn, cho phép nhấn một nút duy nhất để tự động cập nhật hàng loạt các module đã chọn cùng một lúc.

### 2. Elaboration & Self-Explanation
Mỗi chức năng (module) trong hệ thống như "Sản phẩm", "Đơn hàng", "Cấu hình" đều có một file định nghĩa cấu trúc trong code (schema cục bộ). Khi code thay đổi (ví dụ: thêm trường mới vào module Sản phẩm), cơ sở dữ liệu Convex cần được đồng bộ hóa. Hiện tại, muốn đồng bộ thì admin phải đi vào chi tiết cấu hình của từng module đó, click nút "Đồng bộ từ định nghĩa".

Để cải thiện trải nghiệm người dùng, chúng ta sẽ:
1. Thêm trạng thái chọn (selection state) vào trang Quản lý Module (`/system/modules`).
2. Cập nhật `ModuleCard` để hiển thị một ô chọn (Checkbox) tinh tế ở góc trên bên phải khi module đó đã được kích hoạt (`enabled === true`) và có định nghĩa cấu hình tương ứng trong code (`hasModuleRuntimeDefinition`).
3. Khi người dùng tích chọn một hoặc nhiều module, một thanh công cụ nổi (Glassmorphism Floating Action Bar) ở phía dưới màn hình sẽ trượt lên. Thanh này hiển thị số lượng module đang chọn và cung cấp nút "Đồng bộ từ định nghĩa" (Bulk Sync) và nút "Hủy chọn".
4. Khi nhấn "Đồng bộ từ định nghĩa", trang web sẽ gọi đồng thời (qua `Promise.all`) mutation `syncModuleConfigFromDefinition` của Convex cho tất cả các module được chọn, sau đó thông báo kết quả tổng hợp bằng Toast (tổng số trường, tính năng, cấu hình đã thêm mới hoặc cập nhật).

### 3. Concrete Examples & Analogies
Tưởng tượng bạn có 5 chiếc điện thoại cần cập nhật hệ điều hành mới. Thay vì phải cầm từng chiếc điện thoại lên, mở cài đặt và nhấn nút cập nhật trên từng chiếc một (mất 5 lần thao tác), bạn đặt cả 5 chiếc lên bàn, chọn chúng và nhấn một chiếc điều khiển từ xa để ra lệnh cho cả 5 chiếc cùng tải và cài đặt bản cập nhật cùng lúc.

---

## II. Audit Summary (Tóm tắt kiểm tra)
- **Trang Quản lý Module (`app/system/modules/page.tsx`)**: Đã có đầy đủ danh sách các module lấy từ Convex `api.admin.modules.listModules`, có sẵn mutation `syncModuleConfigFromDefinition` (nhưng chưa được import sử dụng tại trang list này).
- **Component `ModuleCard` (`app/system/modules/_components/ModuleCard.tsx`)**: Hiển thị thông tin module, có nút bật/tắt nhưng chưa hỗ trợ chọn (checkbox).
- **Helper `hasModuleRuntimeDefinition` (`lib/modules/runtime-config/index.ts`)**: Cung cấp cách kiểm tra xem một module có định nghĩa cấu hình động để đồng bộ hay không.
- **Hệ thống dịch thuật (`app/system/i18n/translations.ts`)**: Cần thêm các chuỗi thông báo tiếng Việt/tiếng Anh cho bulk sync.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Yêu cầu**: Thêm nút bulk action đồng bộ định nghĩa module thay vì làm từng cái.
- **Độ tin cậy giải pháp (Root Cause Confidence)**: **High**. Cơ chế đồng bộ từ định nghĩa của mỗi module (`syncModuleConfigFromDefinition`) hoàn toàn độc lập và stateless ở tầng client/server, có thể gọi song song cho nhiều module mà không gây xung đột dữ liệu.

---

## IV. Proposal (Đề xuất)
1. **Dịch thuật (`app/system/i18n/translations.ts`)**: Thêm các nhãn dịch liên quan đến bulk sync cho cả 2 ngôn ngữ `vi` và `en`.
2. **Component `ModuleCard` (`app/system/modules/_components/ModuleCard.tsx`)**:
   - Thêm checkbox ở góc trên bên phải khi module đang bật (`enabled`) và hỗ trợ sync (`hasModuleRuntimeDefinition`).
   - Prop `selected?: boolean`, `onSelectChange?: (selected: boolean) => void` để component cha quản lý.
3. **Trang `app/system/modules/page.tsx`**:
   - Quản lý state `selectedKeys` dạng `Set<string>`.
   - Hiển thị Floating Action Bar khi `selectedKeys.size > 0` sử dụng glassmorphism, flex layout và animation mượt.
   - Thêm tính năng "Chọn tất cả có thể sync" (Select All Syncable) và "Bỏ chọn tất cả" để bulk actions tối ưu.
   - Khi kích hoạt bulk sync, sử dụng `Promise.all` gọi `syncModuleConfigFromDefinition` đồng thời, hiển thị loader spinner và toast thông báo tổng hợp kết quả (added/updated).

---

## V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [translations.ts](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/i18n/translations.ts)
Thêm các từ khóa dịch thuật cho bulk actions trong cả 2 đối tượng `vi` và `en`.

### Sửa: [ModuleCard.tsx](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/modules/_components/ModuleCard.tsx)
Thêm checkbox chọn module ở góc card, liên kết với prop `selected` và `onSelectChange`.

### Sửa: [page.tsx](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/system/modules/page.tsx)
Quản lý trạng thái chọn các module, hiển thị Floating Action Bar cho bulk actions và xử lý gọi mutation đồng bộ song song.

---

## VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Chỉnh sửa file `translations.ts` để cập nhật các câu dịch.
2. **Bước 2**: Chỉnh sửa `ModuleCard.tsx` để tích hợp checkbox chọn module.
3. **Bước 3**: Chỉnh sửa `page.tsx` để tích hợp logic chọn module, hiển thị floating action bar và thực thi bulk sync mutation.
4. **Bước 4**: Tự review tĩnh (static review) kiểm tra kiểu dữ liệu, các import và logic xử lý lỗi.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo không lỗi TypeScript.

### Manual Verification
- Truy cập `http://localhost:3000/system/modules`.
- Bật/tắt module và kiểm tra xem checkbox chỉ hiển thị trên các module đang bật và hỗ trợ sync.
- Tích chọn một vài module, kiểm tra xem Floating Action Bar ở bottom có xuất hiện mượt mà không.
- Nhấn "Đồng bộ từ định nghĩa" trên Floating Action Bar, xác nhận Toast hiển thị thành công với tổng số thay đổi, và các checkbox tự động reset về trạng thái trống.

---

## VIII. Todo
- [ ] Cập nhật file `translations.ts` với các nhãn dịch bulk sync.
- [ ] Cập nhật file `ModuleCard.tsx` với checkbox và prop chọn.
- [ ] Cập nhật file `page.tsx` với logic quản lý chọn nhiều và Floating Action Bar.
- [ ] Chạy kiểm tra kiểu tĩnh TypeScript.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hiển thị checkbox trên `ModuleCard` khi module `enabled` và `hasModuleRuntimeDefinition(key)` là `true`.
- Chọn nhiều module sẽ hiển thị Floating Action Bar ở cạnh dưới màn hình với thiết kế glassmorphism sang trọng.
- Nút "Đồng bộ từ định nghĩa" trong Floating Action Bar hoạt động chính xác, đồng bộ tất cả module đã chọn, hiển thị toast thông báo tổng hợp kết quả (ví dụ: "Đã đồng bộ 2 modules thành công") và đóng thanh action bar sau khi hoàn thành.
- Không phát sinh lỗi biên dịch TypeScript hay lỗi runtime.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Nếu gọi sync nhiều module cùng lúc có thể gây quá tải database tạm thời nếu lượng dữ liệu cấu hình cực lớn. Tuy nhiên, dữ liệu cấu hình của mỗi module rất nhỏ (chỉ vài trường/setting), nên việc gọi song song qua `Promise.all` hoàn toàn an toàn và nằm trong hạn mức Convex.
- **Hoàn tác**: Sử dụng `git checkout` các file đã chỉnh sửa.

---

## XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào logic đồng bộ nội bộ của Convex mutation `syncModuleConfigFromDefinition`.
- Không xử lý đồng bộ các module đang tắt (`enabled === false`).

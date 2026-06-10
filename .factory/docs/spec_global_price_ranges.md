# I. Primer

## 1. TL;DR kiểu Feynman
Hãy tưởng tượng bạn đang quản lý một cửa hàng rượu. Mỗi loại rượu (Vang đỏ, Vang trắng, Whisky...) lại có các mức khoảng giá để khách hàng lọc (ví dụ: "Dưới 500k", "Từ 500k - 1 triệu"). 
Hiện tại, mỗi khi tạo một loại rượu mới, bạn lại phải tự gõ tay lại từng mức giá này từ đầu, rất mất thời gian và dễ gõ sai lệch.
Giải pháp là: chúng ta tạo ra một "Khuôn mẫu nấc giá dùng chung" ở trung tâm. Khi tạo hoặc sửa bất kỳ loại rượu nào, bạn chỉ cần tích chọn các nấc giá từ danh sách có sẵn. Nếu thiếu nấc giá nào, bạn tạo mới ngay tại đó, nấc giá mới này lập tức được đưa vào khuôn mẫu chung để các loại rượu khác cũng có thể sử dụng.

## 2. Elaboration & Self-Explanation
Hiện tại, trường `priceRanges` (dải giá bán) đang được lưu trữ cục bộ cho từng bản ghi trong bảng `productTypes` của Convex database. UI Admin cho phép thêm/xóa nấc giá bằng cách nhập trực tiếp tên, slug, minPrice, maxPrice trên form. Điều này dẫn đến sự trùng lặp và không tái sử dụng được dữ liệu.

Để giải quyết vấn đề này mà không phá vỡ cấu trúc cơ sở dữ liệu hiện có (giúp hệ thống frontend lọc sản phẩm vẫn hoạt động bình thường), chúng ta sẽ:
- Lưu danh sách nấc giá Master (dùng chung) vào bảng `settings` với key là `global_price_ranges`.
- Trong trang Tạo mới (`create`) và Chỉnh sửa (`edit`) của Product Types, load danh sách nấc giá Master này về.
- Hiển thị danh sách Master dưới dạng các checkbox. Admin chỉ cần tích chọn để áp dụng dải giá đó cho Product Type đang làm việc.
- Cho phép Admin thêm trực tiếp nấc giá mới vào danh sách Master ngay tại form này. Nấc giá mới thêm sẽ tự động được lưu vào `settings` và tự động tích chọn cho Product Type hiện tại.
- Cho phép xóa nấc giá khỏi danh sách Master (lưu lại vào Settings).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  - Danh sách nấc giá dùng chung (Master) trong Settings:
    1. Dưới 500k (`duoi-500k`, max: 500,000)
    2. Từ 500k đến 1M (`500k-1m`, min: 500,000, max: 1,000,000)
    3. Trên 1M (`tren-1m`, min: 1,000,000)
  - Khi Admin sửa kiểu sản phẩm "Rượu Vang", họ chỉ cần tích chọn checkbox [x] Dưới 500k và [x] Trên 1M. Hệ thống sẽ lưu đúng 2 nấc giá này vào trường `priceRanges` của Rượu Vang.
  - Khi tạo kiểu sản phẩm "Bia Nhập Khẩu", Admin thấy ngay danh sách 3 nấc giá trên để tích chọn mà không cần gõ lại.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- Các file form Product Types nằm tại:
  - `app/admin/product-types/create/page.tsx`
  - `app/admin/product-types/[id]/edit/page.tsx`
- Mutation và Query của Settings nằm tại `convex/settings.ts` với các hàm `getValue` và `set` đã có sẵn.
- Schema của `productTypes` trong `convex/schema.ts` có trường `priceRanges` kiểu `v.optional(v.array(v.object(...)))`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng quan sát được**: Admin phải nhập thủ công từng nấc giá bán ở mỗi Product Type. Không có tính năng chọn lại các dải giá đã từng tạo ở Product Type khác.
- **Nguyên nhân gốc**: Cơ chế thiết kế UI hiện tại lưu trữ `priceRanges` trực tiếp trong từng document `productTypes` và UI chỉ hỗ trợ nhập liệu bằng tay (CRUD cục bộ trên component state).
- **Độ tin cậy nguyên nhân gốc**: High
  - Lý do: Đã kiểm tra trực tiếp code file `create/page.tsx` và `edit/page.tsx` cho thấy mảng `priceRanges` được sinh và quản lý cục bộ bằng component state thông thường, không lấy từ một danh sách Master dùng chung nào trong DB.
- **Giải pháp tối ưu**: Sử dụng cài đặt dùng chung hệ thống `settings` làm Master List lưu các nấc giá bán, liên kết UI để tích chọn dải giá từ Master List và hỗ trợ lưu/sửa Master List ngay tại form.

---

# IV. Proposal (Đề xuất)
- Đọc danh sách nấc giá dùng chung từ Settings `global_price_ranges` thông qua query `api.settings.getValue`.
- Tích hợp giao diện quản lý nấc giá dùng chung và checkbox tích chọn vào `app/admin/product-types/create/page.tsx` và `app/admin/product-types/[id]/edit/page.tsx`.
- Khi người dùng thêm nấc giá mới ở Form, gọi mutation `api.settings.set` để cập nhật danh sách Master, đồng thời thêm nấc giá đó vào state `priceRanges` (được tích chọn).
- Khi người dùng xóa nấc giá khỏi danh sách Master, gọi mutation `api.settings.set` để cập nhật danh sách Master, đồng thời lọc bỏ khỏi state `priceRanges` nếu đang được tích chọn.
- Đảm bảo merge danh sách nấc giá Master với nấc giá hiện tại của Product Type (nếu có nấc giá cũ chưa nằm trong Master) để tránh mất dữ liệu cũ của Product Type.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/create/page.tsx)
  - Thay đổi giao diện nhập nấc giá bán bằng giao diện tích chọn checkbox từ Master List.
  - Tích hợp logic mutation lưu nấc giá mới vào Settings và cập nhật state local.
- `Sửa:` [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/[id]/edit/page.tsx)
  - Thay đổi giao diện nhập nấc giá tương tự trang create.
  - Tích hợp logic merge dải giá cũ của Product Type với Master List để hiển thị an toàn.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và lấy dữ liệu danh sách Master `global_price_ranges` thông qua `useQuery(api.settings.getValue, { key: "global_price_ranges", defaultValue: [] })`.
2. Tạo mutation cập nhật Master List qua `useMutation(api.settings.set)`.
3. Sửa hàm `handleAddPriceRange` và `handleRemovePriceRange` ở cả hai file UI để thao tác đồng bộ với Settings Master List.
4. Cập nhật giao diện Render danh sách nấc giá thành Checkbox list + Form thêm mới nấc giá vào Master List.
5. Kiểm tra compile TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**: Chuyển sang execution mode, sửa code, chạy compile TypeScript bằng `bunx tsc --noEmit` để đảm bảo không lỗi type.
- **Thực tế**: Sau khi hoàn thành, tester sẽ kiểm tra tại http://localhost:3000/admin/product-types/create và edit xem danh sách nấc giá đã được đồng bộ hóa và lưu trữ dùng chung chưa.

---

# VIII. Todo
- [ ] Sửa file `app/admin/product-types/create/page.tsx`
- [ ] Sửa file `app/admin/product-types/[id]/edit/page.tsx`
- [ ] Compile kiểm tra lỗi cú pháp TypeScript
- [ ] Chạy âm báo hoàn thành task `Done, Sir.`

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang tạo và sửa Product Type hiển thị danh sách các nấc giá dùng chung dưới dạng Checkbox.
- Khi tích chọn checkbox, nấc giá đó được áp dụng cho Product Type hiện tại.
- Khi nhập thêm nấc giá mới ở form phụ bên dưới và bấm nút thêm, nấc giá này lập tức được lưu vào Cài đặt chung hệ thống (Settings) và tự động tích chọn cho Product Type hiện tại.
- Khi lưu Product Type, dữ liệu dải giá đã chọn được lưu chính xác vào DB.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Không có rủi ro về di trú dữ liệu vì cấu trúc trường `priceRanges` trong bảng `productTypes` được giữ nguyên.
- Dễ dàng rollback bằng cách revert file UI về phiên bản cũ nếu gặp vấn đề về UI/UX.

---

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc schema của bảng `productTypes`.
- Di chuyển logic lọc sản phẩm ngoài frontend.

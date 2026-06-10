# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Các menu bay ra (Flyout menu) cấp 3, cấp 4 hoặc dropdown classic khi danh sách quá dài sẽ bị tràn ra ngoài màn hình (viewport), che khuất nội dung và không thể cuộn xuống để xem được.
- **Giải pháp**: Giới hạn chiều cao tối đa cho toàn bộ các dropdown và flyout menu dạng dọc, đồng thời kích hoạt cuộn dọc (`overflow-y-auto`) và tạo một thanh cuộn mỏng, mờ ảo, tinh tế (`scrollbar-menu-thin`) để giữ giao diện cao cấp (premium).
- **Cách làm**:
  - Thêm style CSS `.scrollbar-menu-thin` trong `globals.css` để định hình scrollbar mỏng 4px tinh tế.
  - Sửa `Header.tsx` và `HeaderMenuPreview.tsx` ở tất cả các vị trí render dropdown/flyout: bổ sung giới hạn `max-h-[min(70vh,480px)]`, `overflow-y-auto`, và class `.scrollbar-menu-thin`.

## 2. Elaboration & Self-Explanation
Khi menu có quá nhiều danh mục con (ví dụ danh sách xuất xứ rượu vang: Pháp, Mỹ, Ý, Tây Ban Nha, Úc, Chile, Đức, Hungary,...), chiều cao của menu dọc vượt quá chiều cao hiển thị của trình duyệt. 
Nếu không giới hạn chiều cao tối đa, menu sẽ kéo dài xuống dưới vô tận và biến mất khỏi cạnh dưới màn hình.
Bằng cách thiết lập chiều cao tối đa của menu phụ thuộc vào chiều cao màn hình (ví dụ `70vh` hoặc tối đa `480px`), menu sẽ tự động dừng lại khi quá dài và cho phép người dùng cuộn chuột để xem các mục phía dưới.
Sử dụng custom scrollbar mỏng (`scrollbar-menu-thin`) giúp thanh cuộn không bị thô, giữ vững thiết kế tối giản và cao cấp cho Thiên Kim Wine.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Menu "Sản phẩm" -> "Rượu vang & sâm panh" -> "Xuất xứ" có 15 nước khác nhau. Trước đây, menu này tràn xuống dưới chân trang. Sau khi sửa, menu này chỉ cao tối đa bằng 70% chiều cao màn hình trình duyệt (ví dụ 450px trên màn hình nhỏ), xuất hiện thanh cuộn mỏng 4px màu vàng/xanh mờ bên phải để cuộn danh sách nước.
- **Analogy đời thường**: Giống như việc bạn cầm một danh sách thực đơn dài 2 mét. Thay vì để nó buông thõng xuống đất, bạn cuộn nó lại thành một trục cuốn nhỏ gọn chỉ dài 30cm, và xoay trục cuốn đó để đọc từng dòng.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra `Header.tsx` và phát hiện:
  - Một số flyout trong Mega Menu đã được cấu hình `maxHeight: 'min(60vh, 480px)'` và `overflow-y-auto` nhưng dùng scrollbar mặc định hoặc thiếu class scrollbar mỏng.
  - Classic Dropdown menu (khi tắt Mega menu hoặc các cấp sâu) hoàn toàn chưa có `max-h` hay `overflow-y-auto`.
- Đã kiểm tra `HeaderMenuPreview.tsx` (trang Admin preview) và phát hiện:
  - Các flyout menu chưa có giới hạn chiều cao và cơ chế cuộn.
- Đã kiểm tra `globals.css` và thấy có định nghĩa `.scrollbar-thin` (6px) nhưng chưa tối ưu cho menu nhỏ gọn, cần định nghĩa `.scrollbar-menu-thin` (4px).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Thiếu giới hạn chiều cao tối đa (`max-height`) kết hợp với tính năng cuộn dọc trên các container của menu dọc (dropdown và flyout) ở cả cấu hình Mega Menu và Classic Menu, và chưa có CSS scrollbar mỏng chuyên biệt cho menu.
- **Độ tin cậy nguyên nhân gốc**: High (100% đúng vì code hiện tại thiếu các class này trên các phần tử tương ứng).

# IV. Proposal (Đề xuất)
- **Bước 1**: Bổ sung class CSS `.scrollbar-menu-thin` vào `app/globals.css` với độ rộng scrollbar là `4px`, bo góc tối đa, màu nhạt mờ và chỉ rõ hơn khi hover để giữ tính premium.
- **Bước 2**: Sửa `components/site/Header.tsx` để:
  - Thêm class `scrollbar-menu-thin` vào các vị trí đã có `overflow-y-auto`.
  - Bổ sung `max-h-[min(70vh,480px)] overflow-y-auto scrollbar-menu-thin` vào các classic dropdown/flyout (cấp 2, cấp 3, cấp 4).
- **Bước 3**: Sửa `components/experiences/previews/HeaderMenuPreview.tsx` để đồng bộ hóa giao diện preview trong Admin tương tự như client Header.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [globals.css](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/globals.css) - Thêm định nghĩa `.scrollbar-menu-thin`.
- **Sửa**: [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/Header.tsx) - Thêm class scrollbar mỏng và giới hạn chiều cao cho toàn bộ flyout menu.
- **Sửa**: [HeaderMenuPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/HeaderMenuPreview.tsx) - Thêm class scrollbar mỏng và giới hạn chiều cao cho các node preview.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `app/globals.css` để thêm style scrollbar mỏng.
2. Đọc và chỉnh sửa `components/site/Header.tsx`.
3. Đọc và chỉnh sửa `components/experiences/previews/HeaderMenuPreview.tsx`.
4. Chạy check typecheck (`bunx tsc --noEmit`).
5. Commit thay đổi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**:
  - Chạy `bunx tsc --noEmit` để đảm bảo không lỗi TypeScript.
- **Động**:
  - Kiểm tra menu trực quan trên trình duyệt (Admin preview và Client website) xem flyout menu dài có xuất hiện scrollbar mỏng 4px đẹp mắt không, có cuộn được không và không bị tràn ra ngoài màn hình.

# VIII. Todo
- [ ] Thêm CSS `.scrollbar-menu-thin` trong `app/globals.css`
- [ ] Thêm `scrollbar-menu-thin` và các thuộc tính giới hạn chiều cao vào `components/site/Header.tsx`
- [ ] Thêm `scrollbar-menu-thin` và các thuộc tính giới hạn chiều cao vào `components/experiences/previews/HeaderMenuPreview.tsx`
- [ ] Chạy typecheck `bunx tsc --noEmit`
- [ ] Thực hiện commit code

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Tất cả các Flyout menu/Dropdown menu dài quá chiều cao hiển thị sẽ tự động kích hoạt thanh cuộn dọc.
- Thanh cuộn dọc phải mỏng tinh tế (4px), bo tròn đầu, màu đồng bộ với thương hiệu, không thô thiển.
- Không có lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Thay đổi nhỏ trong CSS và ClassName của menu, rủi ro cực thấp.
- **Hoàn tác**: Sử dụng `git checkout` để rollback các file đã sửa.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào cấu trúc lưu trữ database hoặc API lấy menu.
- Không sửa logic mobile menu (mobile menu đã có cơ chế accordion riêng).

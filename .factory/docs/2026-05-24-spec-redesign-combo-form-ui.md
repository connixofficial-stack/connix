# I. Primer

## 1. TL;DR kiểu Feynman
Giao diện cấu hình combo hiện tại trong trang chỉnh sửa sản phẩm đang bị lệch lạc: nút xóa nằm chen ngang hàng, checkbox đồng bộ nằm lơ lửng không thẳng dòng với ô nhập số lượng bên cạnh. 
Chúng ta sẽ sắp xếp lại form này vào các ô lưới (Grid) đối xứng chiều cao, đưa nút xóa combo lên góc trên cùng của thẻ để giải phóng diện tích, và căn lề checkbox thẳng hàng với ô nhập liệu bằng cách tạo nhãn tiêu đề đồng bộ. Đồng thời, ta sẽ áp dụng các hiệu ứng chuyển động mượt mà bằng thư viện `framer-motion` (sử dụng gói `motion/react` có sẵn) để khi thêm hoặc xóa combo, giao diện co giãn nhẹ nhàng thay vì biến mất đột ngột.

## 2. Elaboration & Self-Explanation
Hiện tượng lệch hàng trong form combo xảy ra do:
- Cột bên trái là ô nhập số lượng sản phẩm có kèm `<Label>` tiêu đề ở trên, trong khi cột bên phải chỉ chứa ô checkbox và chữ mô tả mà không có tiêu đề tương đương. Điều này khiến chiều cao của cột phải bị hụt so với cột trái, dẫn đến checkbox bị kéo lệch lên trên.
- Nút xóa combo được xếp chung hàng ngang với các trường nhập liệu lớn và có thuộc tính `mt-6`, gây tốn diện tích hiển thị và làm lệch bố cục khi giao diện co lại trên màn hình nhỏ.

Giải pháp:
- **Tái cấu trúc lưới (Grid)**: Chia form thành các nhóm grid `grid-cols-1 md:grid-cols-2 gap-4`.
- **Cân bằng chiều cao**: Cột chứa checkbox đồng bộ sẽ được bọc trong một container có cấu trúc chiều cao đối xứng với ô nhập số lượng (thêm một nhãn giả hoặc nhãn ẩn ở trên) và sử dụng flexbox để đẩy checkbox xuống thẳng hàng ngang với ô input.
- **Tối ưu hóa vị trí nút xóa**: Đưa nút xóa combo lên góc trên cùng bên phải của thẻ Combo (ngang hàng với Badge phân loại loại combo).
- **Tích hợp Framer Motion**: Sử dụng `<AnimatePresence>` và `<motion.div>` từ `motion/react` để bọc các phần tử combo và phần tử sản phẩm kèm mua. Thiết lập các hiệu ứng chuyển động nhẹ như `initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}` để tạo trải nghiệm tự nhiên và cao cấp.

## 3. Concrete Examples & Analogies
*   **Ví dụ căn lề checkbox đối xứng**:
    ```tsx
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cột trái: Có label */}
      <div className="space-y-1">
        <Label className="text-xs">Số lượng của sản phẩm này trong combo *</Label>
        <Input type="number" ... />
      </div>
      {/* Cột phải: Thêm label ẩn/phụ để căn chỉnh chiều cao */}
      <div className="space-y-1 flex flex-col justify-end pb-2">
        <Label className="text-xs text-slate-400 dark:text-slate-500">Đồng bộ Backend</Label>
        <div className="flex items-center gap-2 h-10">
          <input type="checkbox" ... />
          <Label className="cursor-pointer text-xs">Đồng bộ Combo sang các sản phẩm kèm</Label>
        </div>
      </div>
    </div>
    ```
*   **Hình ảnh ẩn dụ**: Hãy tưởng tượng bạn treo hai bức tranh cạnh nhau. Bức tranh bên trái có khung gỗ dày (Label + Input), bức tranh bên phải chỉ là tờ giấy mỏng dán tường (Checkbox). Nhìn từ xa sẽ bị lệch trục ngang. Để đẹp mắt, ta cần lồng bức tranh bên phải vào một khung gỗ có cùng kích thước (Label trống hoặc bổ trợ + Container checkbox) để tạo sự cân xứng hoàn hảo.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Vấn đề quan sát được**: 
    - Nút xóa Combo nằm lệch cạnh ô nhập giá combo.
    - Checkbox "Đồng bộ Combo sang các sản phẩm kèm" bị đặt lệch dòng so với ô nhập "Số lượng sản phẩm trong combo".
    - Các ô chọn sản phẩm mua kèm thêm xếp liền sát nhau, thiếu sự bao bọc tinh tế.
    - Việc thêm mới hoặc xóa bỏ combo diễn ra tức thời (giật cục), không có chuyển động chuyển cảnh mượt mà.
*   **Phạm vi ảnh hưởng**: Trang quản trị chỉnh sửa chi tiết sản phẩm: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/[id]/edit/page.tsx).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc**: 
    - Thiếu cấu trúc cân bằng chiều cao giữa các cột trong Grid.
    - Nút xóa được đặt tùy ý cạnh Input thay vì đặt ở cấp độ thẻ bọc (Card).
    - Chưa áp dụng thư viện animation cho các thao tác mảng động (`combos`).
*   **Giả thuyết đối chứng**: Việc thiết kế lại Grid kết hợp bọc container đối xứng và áp dụng `motion.div` từ `motion/react` sẽ lập tức sửa lỗi căn chỉnh và mang lại hiệu ứng động mượt mà.

# IV. Proposal (Đề xuất)
Tối ưu hóa UI/UX form combo trong tệp `app/admin/products/[id]/edit/page.tsx`:
1.  **Sử dụng Framer Motion**:
    - Import `motion` và `AnimatePresence` từ `motion/react`.
    - Bọc danh sách combo bằng `<AnimatePresence initial={false}>`.
    - Đổi thẻ bọc mỗi item combo thành `<motion.div>` có hỗ trợ `layout` để các item tự động trượt khi co dãn.
2.  **Thiết kế lại Layout Combo Card**:
    - Đưa tiêu đề, badge loại combo, và nút xóa (Trash2) vào một hàng Header chung ở góc trên cùng.
    - Đưa các trường input vào hệ thống lưới `grid grid-cols-1 md:grid-cols-2 gap-4`.
    - Căn lề checkbox đồng bộ của combo mix bằng cách tạo cột đối xứng có Label tiêu đề phụ.
    - Định hình phần danh sách sản phẩm kèm tinh tế bằng viền nhẹ và padding gọn gàng.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa**: [page.tsx (edit)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/[id]/edit/page.tsx)
    - Nhập thư viện `motion` và `AnimatePresence`.
    - Thay thế khối render combo list bằng cấu trúc component mới có grid chỉn chu và hiệu ứng động.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ khối code từ dòng 1033 đến 1438 trong [page.tsx (edit)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/products/[id]/edit/page.tsx).
2. Thực hiện sửa đổi bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Kiểm tra TypeScript tĩnh `bunx tsc --noEmit` để đảm bảo code sạch lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để kiểm tra lỗi cú pháp React và Framer Motion.
*   **Kiểm tra thủ công**: Người dùng kiểm tra trang edit sản phẩm trên trình duyệt. Khi nhấn thêm/xóa combo và thêm/xóa sản phẩm kèm, kiểm tra xem giao diện có chuyển động mượt mà không và các ô nhập liệu có thẳng hàng thẳng lối không.

# VIII. Todo
- [ ] Tích hợp `AnimatePresence` và `motion` vào phần render combo list trong `app/admin/products/[id]/edit/page.tsx`.
- [ ] Thiết kế lại cấu trúc Grid cho từng khối combo (Thường và Mix) và cân chỉnh chiều cao các trường input/checkbox.
- [ ] Chạy kiểm thử biên dịch TypeScript tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Giao diện form cấu hình combo hiển thị thẳng hàng thẳng lối, cân đối.
- Có hiệu ứng trượt xuất hiện/xóa mượt mà cho các khối combo và danh sách sản phẩm mua kèm.
- Biên dịch thành công không phát sinh lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro**: Thấp, không ảnh hưởng đến logic lưu trữ dữ liệu database của Convex backend.
*   **Hoàn tác**: Hoàn tác qua `git checkout`.

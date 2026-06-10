# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Người dùng thấy dải thuộc tính trên Mobile vẫn hơi bự, thô (do khoảng cách viền trên/dưới quá rộng). Ngoài ra, nếu có chữ thuộc tính nào quá dài, nó có thể làm vỡ hàng hoặc giãn cột làm xấu giao diện.
- **Giải pháp**:
  1. Giảm khoảng cách viền (padding) trên/dưới trên Mobile của khung thuộc tính từ `p-4` xuống **`py-3 px-2`** để dải ngang trở nên thon gọn, thanh mảnh và cực kỳ cao cấp.
  2. Áp dụng giới hạn tối đa hiển thị 2 dòng chữ (**`line-clamp-2`**) cho các giá trị thuộc tính. Nếu chữ quá dài, nó tự hiện dấu ba chấm `...` để bảo vệ layout.
  3. Thêm tương tác chạm/click thông minh: Biến mỗi ô thuộc tính thành nút bấm (`cursor-pointer`), khi người dùng chạm vào sẽ mở ra một cửa sổ popup mờ ảo sang trọng (**Glassmorphism Modal**) để xem đầy đủ thông tin chữ mà không sợ bị thiếu.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ thực hiện tinh chỉnh responsive chi tiết cho dải thuộc tính Premium trên cả preview và real site:
- **Tối ưu hóa Padding bọc ngoài (Container Padding)**:
  - Trước đây: `rounded-2xl p-4 md:p-5 relative border`
  - Hiện tại: `rounded-2xl py-3 px-2 md:p-5 relative border`
  - Trên Mobile, khoảng đệm trên/dưới chỉ còn `12px` (py-3) và khoảng đệm trái/phải chỉ còn `8px` (px-2), giúp chiều cao tổng thể của dải thuộc tính co lại cực kỳ gọn gàng, thon mảnh.
- **Bảo vệ Layout với `line-clamp-2`**:
  - Chúng ta sử dụng lớp `line-clamp-2` thay cho `break-words` thuần túy. Nếu giá trị thuộc tính quá dài (ví dụ: danh sách hương vị rượu vang gồm 6-7 từ dài), giao diện chỉ hiển thị tối đa 2 dòng và kết thúc bằng dấu ba chấm `...`, giữ cho chiều cao dải ngang luôn bằng phẳng, cân đối.
- **Hệ thống Modal xem thông tin chi tiết (Show Full Text)**:
  - Khai báo một React state:
    `const [activeAttrModal, setActiveAttrModal] = useState<{ title: string; value: string } | null>(null);`
  - Khi click vào một ô thuộc tính, chúng ta cập nhật state này và mở một modal overlay phủ lên màn hình.
  - Modal được thiết kế theo phong cách Glassmorphism cao cấp: nền bán trong suốt blur nhẹ (`bg-black/60 backdrop-blur-sm`), khung thông tin bo tròn `rounded-2xl`, màu sắc đồng bộ theo `tokens` và có nút đóng `✕` tinh tế.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Một thuộc tính rượu vang có tên "HƯƠNG VỊ" và giá trị rất dài: "Gỗ sồi, Tiêu đen, Vani, Trái chín đỏ, Khói, Da thuộc".
  - Trên giao diện Mobile (rộng 375px), ô thuộc tính này chỉ hiển thị:
    ```
    HƯƠNG VỊ
    Gỗ sồi, Tiêu đen,
    Vani, Trái chín...
    ```
  - Khi người dùng chạm ngón tay vào ô này (con trỏ chuột đổi thành pointer, có hiệu ứng hover mờ nhẹ), một modal popup tuyệt đẹp sẽ hiện lên giữa màn hình hiển thị:
    ```
    HƯƠNG VỊ
    Gỗ sồi, Tiêu đen, Vani, Trái chín đỏ, Khói, Da thuộc
    ```
  - Việc này giúp giao diện tổng thể luôn phẳng phiu, thanh mảnh mà thông tin chi tiết vẫn được truyền tải trọn vẹn và thông minh.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp bị ảnh hưởng**:
  1. `app/(site)/_components/details/ProductDetailPage.tsx`
  2. `components/experiences/previews/ProductDetailPreview.tsx`
- **Mục tiêu**: Làm mỏng dải thuộc tính trên Mobile, áp dụng line-clamp-2 giữ layout, và thiết lập tương tác click xem full text qua modal.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Padding bọc ngoài `p-4` làm dải thuộc tính quá dầy trên di động. Việc hiển thị tràn lan text làm vỡ hàng hoặc rớt dòng quá nhiều.
- **Giả thuyết đối chứng**: Giảm padding về `py-3 px-2`, sử dụng `line-clamp-2` cho chữ, và làm modal Dialog click xem full sẽ mang lại trải nghiệm UI siêu tinh tế và giải quyết triệt để bài toán thông tin.

# IV. Proposal (Đề xuất)
1. **Khai báo State Modal**:
   Thêm state `activeAttrModal` vào đầu component trong cả `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
2. **Sửa file `ProductDetailPage.tsx`**:
   - Đổi padding container cha thành `py-3 px-2 md:p-5`.
   - Đổi viewport Embla thành `overflow-hidden mx-6 md:mx-10`.
   - Thêm `cursor-pointer hover:opacity-80 active:opacity-60 transition-all` và sự kiện `onClick` mở modal cho mỗi slide item và grid item.
   - Thêm class `line-clamp-2` vào thẻ `<p>` hiển thị giá trị.
   - Render Glassmorphism Modal ở cuối component.
3. **Sửa file `ProductDetailPreview.tsx`**:
   - Áp dụng các thay đổi state, padding, line-clamp-2, event click và render modal đồng bộ 100%.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)
  - Thay đổi: Co nhỏ padding, cấu hình line-clamp-2, thêm state và render modal click full.
- `Sửa`: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
  - Thay đổi: Co nhỏ padding, cấu hình line-clamp-2, thêm state và render modal click full.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật state `activeAttrModal` và logic render modal trong `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
2. Cập nhật JSX padding, line-clamp-2 và click event.
3. Chạy `bunx tsc --noEmit` để typecheck toàn dự án.
4. Commit code và bàn giao.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh (Static Check)**: Chạy `bunx tsc --noEmit`.
- **Visual Check**:
  - Xác minh dải thuộc tính mỏng nhẹ, thanh mảnh trên Mobile.
  - Xác minh chữ quá dài được line-clamp-2 tự động hiện dấu ba chấm.
  - Chạm vào thuộc tính để mở modal xem đầy đủ text.

# VIII. Todo
- [ ] Cập nhật file `ProductDetailPage.tsx` (Real Site).
- [ ] Cập nhật file `ProductDetailPreview.tsx` (Preview).
- [ ] Chạy kiểm tra TypeScript compile check.
- [ ] Commit code và phát âm báo hoàn thành `Done, Sir.`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Dải thuộc tính thon gọn hơn trên Mobile (padding py-3 px-2).
- Chữ thuộc tính dài tự động line-clamp-2 có dấu ba chấm `...`.
- Chạm vào thuộc tính mở modal glassmorphism hiển thị đầy đủ thông tin chi tiết.
- Không có lỗi compile TypeScript.

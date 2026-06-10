# I. Primer

## 1. TL;DR kiểu Feynman
Hiện tại, trang xem trước (preview) của hai giao diện Classic và Modern đang xếp phần "Mô tả sản phẩm" bó hẹp trong cột thông tin bên phải (cột hẹp). Nhưng ngoài trang thực tế (site thực), phần mô tả này lại nằm ở phía dưới và kéo dài hết chiều rộng màn hình (Full Width) để người đọc dễ xem.
Chúng ta sẽ di chuyển khối mô tả sản phẩm và phần bình luận ra ngoài khung chia cột (Grid) trong trang xem trước, đưa chúng xuống dưới cùng và căn chỉnh khoảng cách, độ bo góc cùng padding giống hệt trang thực tế.

## 2. Elaboration & Self-Explanation
- **Bất đồng bộ giao diện**: Trang thực tế render phần mô tả dưới dạng một khối full-width độc lập sau grid 2 cột. Việc trang preview nhét nó vào cột phải làm sai lệch tỷ lệ hiển thị, đặc biệt là khi mô tả sản phẩm chứa nhiều ảnh lớn hoặc bảng biểu chi tiết.
- **Giải pháp**:
  - **Layout Classic**: Di chuyển khối `<div className="border-t pt-6">` (chứa Mô tả sản phẩm) từ bên trong thẻ bọc cột phải ra ngoài thẻ đóng `</div>` của grid 2 cột Classic, ngay phía trên `<CommentsPreview>`.
  - **Layout Modern**: Di chuyển khối bọc mô tả sản phẩm và `<CommentsPreview>` ra ngoài thẻ đóng `</div>` của grid 2 cột Modern. Tăng padding của khung mô tả từ `p-4` lên `p-6` và đặt margin top `mt-8 md:mt-12` để khớp hoàn toàn với cấu trúc CSS ngoài site thực.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể**:
    - *Cũ (Classic Preview)*:
      ```tsx
      <div className="grid grid-cols-2">
        <div className="left">Gallery</div>
        <div className="right">
          Info + Buttons + Highlights
          <div>Mô tả sản phẩm (Bị bó hẹp ở đây)</div>
        </div>
      </div>
      ```
    - *Mới (Classic Preview)*:
      ```tsx
      <div className="grid grid-cols-2">
        <div className="left">Gallery</div>
        <div className="right">Info + Buttons + Highlights</div>
      </div>
      <div>Mô tả sản phẩm (Chiếm trọn 100% chiều rộng ở dưới)</div>
      ```
*   **Hình ảnh ẩn dụ**: Hãy tưởng tượng một tờ báo giấy. Phần tin tức chính và ảnh đại diện được chia làm 2 cột trang nhất (cột trái và cột phải). Nhưng một bài phân tích dài (mô tả sản phẩm) thường được dàn ngang kéo dài toàn bộ chiều rộng của trang dưới để người đọc dễ theo dõi, thay vì cố nhét vào một cột tin nhỏ bên lề.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Triệu chứng**: Giao diện preview của Classic và Modern hiển thị phần mô tả sản phẩm ở cột phải, trong khi site thực tế mô tả chiếm full ở dưới.
*   **Phạm vi**: 
    - [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc**: Code React trong `ProductDetailPreview.tsx` lồng thẻ render mô tả sản phẩm vào trong thẻ bọc cột thông tin bên phải của grid.
*   **Giả thuyết đối chứng**: Việc di chuyển các thẻ này xuống dưới thẻ đóng của grid 2 cột sẽ lập tức đưa giao diện xem trước về trạng thái đồng bộ 100% với site thực tế.

# IV. Proposal (Đề xuất)
Cấu trúc lại tệp `ProductDetailPreview.tsx`:
1.  **Classic Layout**:
    - Xóa khối render mô tả sản phẩm ở dòng 903-911.
    - Chèn khối này vào dòng 914 (ngay dưới thẻ đóng grid ở dòng 913, trên `CommentsPreview`).
2.  **Modern Layout**:
    - Xóa khối mô tả sản phẩm (dòng 1180-1187) và `CommentsPreview` (dòng 1189-1194).
    - Chèn khối này vào dòng 1196 (dưới thẻ đóng grid ở dòng 1196, trên thẻ đóng Modern container ở dòng 1197).
    - Thay thế class bọc mô tả Modern `border rounded-2xl p-4` thành `mt-8 md:mt-12 border rounded-2xl p-6` để đồng bộ site thực.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa**: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
    - Tái cấu trúc layout Classic và Modern trong các khối render điều kiện tương ứng.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và xác định ranh giới các block trong tệp `ProductDetailPreview.tsx`.
2. Thực hiện sửa đổi.
3. Chạy compiler tĩnh `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit`.
*   **Kiểm tra thủ công**: Quan sát giao diện preview của Classic và Modern trong admin xem khối mô tả sản phẩm đã trượt xuống dưới chiếm full width giống layout Minimal chưa.

# VIII. Todo
- [ ] Di chuyển khối mô tả sản phẩm trong phần Classic của `ProductDetailPreview.tsx`.
- [ ] Di chuyển khối mô tả sản phẩm và comments trong phần Modern của `ProductDetailPreview.tsx`.
- [ ] Chạy kiểm thử TypeScript.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout Classic Preview và Modern Preview hiển thị khối mô tả chiếm full width ở dưới grid 2 cột.
- Biên dịch thành công không có lỗi.

Mình đã đọc đúng route `/admin/home-components/product-categories/[id]/edit` và xác nhận hiện tại `columnsDesktop/columnsMobile` mới được dùng rõ ràng cho `grid`; 5 layout còn lại chưa dùng đầy đủ nên hành vi chưa đồng nhất.

### Mục tiêu đã chốt theo lựa chọn của bạn
- Áp dụng cho **Preview + Site render**.
- Dùng rule **map trực tiếp theo số cột**.
- **Giới hạn số item theo viewport/cột** (không hiển thị tràn vô hạn).

### Kế hoạch implement chi tiết
1. **Chuẩn hóa rule tính số item hiển thị theo viewport** trong Preview
   - File: `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
   - Thêm helper dùng chung, ví dụ `getVisibleCountByDevice(config, device)`:
     - Mobile: theo `columnsMobile` (2/3)
     - Tablet: theo `columnsDesktop` nhưng clamp hợp lý (vd 3–4) để không vỡ layout
     - Desktop: theo `columnsDesktop` (3/4/5/6)
   - Dùng helper này cho cả 5 layout: `carousel/cards/minimal/marquee/circular`.

2. **Map `columnsDesktop/columnsMobile` vào bố cục từng layout ở Preview**
   - `carousel`: width item và số item visible/scroll-page dựa vào cột đã chọn.
   - `cards`: đổi từ grid cứng `1/2/3` sang grid class động theo config + device.
   - `minimal`: chia theo hàng/cột (thay vì wrap tự do hoàn toàn) để số pill mỗi hàng phản ánh config.
   - `marquee`: giới hạn tập item nguồn theo visible count trước khi nhân đôi marquee track.
   - `circular`: số item mỗi page + pagination dot tính từ visible count theo config.

3. **Áp dụng cùng rule sang Site render để parity 1:1**
   - File: `components/site/ComponentRenderer.tsx` (khối `ProductCategoriesSection`)
   - Tạo helper tương đương (hoặc cùng công thức inline nhất quán) và thay logic hardcode hiện tại cho 5 layout.
   - Đảm bảo `showProductCount` tiếp tục hoạt động như cũ, chỉ đổi phần bố cục/visible count theo cột.

4. **Giữ backward compatibility dữ liệu cũ**
   - Không đổi schema: vẫn dùng `columnsDesktop`, `columnsMobile`, `showProductCount` đang có.
   - Có clamp/fallback an toàn khi config thiếu (mặc định desktop=4, mobile=2).

5. **Tự kiểm tra trước khi bàn giao**
   - Chạy `bunx tsc --noEmit` theo rule repo.
   - Soát tay nhanh 6 style trong preview: đổi cột desktop/mobile phải thấy tác động ngay, không chỉ grid.
   - Soát parity với site renderer (không lệch layout giữa admin preview và trang thật).

6. **Sau khi implement xong**
   - Commit đầy đủ thay đổi code.
   - Nếu có `.factory/docs` mới/phát sinh thì add kèm vào commit theo quy định repo.

### Kết quả mong đợi
- "Cấu hình hiển thị" (cột Desktop/Mobile + show count) sẽ tác động đồng bộ cho **toàn bộ 6 layout** thay vì chỉ Grid.
- Preview và Site render hiển thị nhất quán, không còn lệch khi publish.
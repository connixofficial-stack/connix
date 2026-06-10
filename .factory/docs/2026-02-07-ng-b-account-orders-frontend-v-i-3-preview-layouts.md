## Vấn đề
Frontend `/account/orders` hiện chỉ có **1 layout dạng accordion** trong khi preview có **3 layouts riêng biệt**: cards, compact, timeline.

## Kế hoạch cập nhật

### File cần sửa
`app/(site)/account/orders/page.tsx`

### Thay đổi chính

1. **Đọc `layoutStyle` từ config** (hiện chưa sử dụng)
   ```tsx
   const config = useAccountOrdersConfig();
   // config.layoutStyle: 'cards' | 'compact' | 'timeline'
   ```

2. **Tách render theo layout:**

   **Cards Layout:**
   - Card có expand/collapse với border-t separator
   - Thêm nút "Xem chi tiết" bên cạnh "Hủy đơn"
   - Stats chỉ hiển thị khi layoutStyle='cards'

   **Compact Layout:**
   - Desktop: Table với columns (Mã đơn, Ngày, Số SP, Tổng, Trạng thái, Thao tác)
   - Mobile: Cards nhỏ gọn không expand (1 dòng thông tin chính)
   - Nút "Chi tiết" dạng link với icon ArrowUpRight

   **Timeline Layout:**
   - Timeline vertical với dot indicator bên trái
   - Vertical line nối các đơn hàng
   - Hiện TimelineProgress (step dots + lines) giống preview
   - Ẩn stats grid

3. **Thêm component `TimelineProgress`:**
   ```tsx
   function TimelineProgress({ status }: { status: string }) {
     const STEPS = ['Đặt hàng', 'Xác nhận', 'Vận chuyển', 'Hoàn thành'];
     // Render dots + connecting lines giống preview
   }
   ```

4. **Responsive cho Compact layout:**
   - Sử dụng `useMediaQuery` hoặc CSS breakpoints
   - Desktop (md+): render table
   - Mobile: render cards nhỏ gọn

### Ước tính
- **Độ phức tạp**: Trung bình
- **LOC thay đổi**: ~200 dòng (tách 3 render functions)
- **Risk**: Thấp (không ảnh hưởng logic business)

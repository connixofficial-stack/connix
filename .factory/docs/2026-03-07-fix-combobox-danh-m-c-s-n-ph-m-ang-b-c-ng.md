## Problem Graph
1. [Fix combobox danh mục sản phẩm không mở/chọn được] <- depends on 1.1, 1.2
   1.1 [Xác định root cause thực tế] <- solved
   1.2 [Chọn phạm vi sửa an toàn] <- solved

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Cần đọc đúng component vừa thêm và primitive UI liên quan.
   - Action: Đọc `app/admin/products/components/ProductCategoryCombobox.tsx` và `app/admin/components/ui.tsx`.
   - Observation: `ProductCategoryCombobox` đang truyền `open/onOpenChange` vào `Popover`, nhưng `Popover` hiện tại chỉ `return <div className="relative">{children}</div>` và bỏ qua hoàn toàn state; `PopoverTrigger` cũng chỉ là wrapper div, không tự toggle gì cả. Kết quả: `open` không bao giờ đổi sang `true`, dropdown không mở, field nhìn như bị khóa.
   - Reflection: ✓ Valid, đúng với triệu chứng user mô tả.

2. Solving 1.2...
   - Thought: User đã chọn hướng an toàn, không sửa primitive toàn admin để tránh side effect dây chuyền.
   - Action: Chốt phương án chỉ sửa `ProductCategoryCombobox` để tự quản lý open/close bằng state local và render panel tuyệt đối ngay trong component.
   - Reflection: ✓ Valid, phạm vi nhỏ, dễ verify.

## Kế hoạch implement chi tiết
1. Sửa `app/admin/products/components/ProductCategoryCombobox.tsx`
   - Bỏ phụ thuộc hành vi vào `Popover`, `PopoverTrigger`, `PopoverContent` của `app/admin/components/ui.tsx`.
   - Chuyển sang cấu trúc local đơn giản:
     - wrapper `div.relative`
     - nút trigger `button` có `onClick={() => setOpen(prev => !prev)}`
     - panel dropdown render bằng `{open && <div className="absolute ...">...</div>}`
   - Vẫn giữ `Input` và `Button` sẵn có để đồng bộ style.

2. Hoàn thiện hành vi combobox
   - Khi bấm trigger: mở/đóng danh sách.
   - Khi mở: focus vào input tìm kiếm.
   - Khi chọn category:
     - gọi `onChange(category._id)`
     - đóng dropdown
     - reset `query`
   - Khi click ra ngoài: đóng dropdown để tránh cảm giác “kẹt cứng”.
     - thêm `containerRef`
     - gắn `mousedown` listener trong `useEffect` để detect click outside.
   - Khi bấm `Escape`: đóng dropdown.

3. Giữ nguyên các flow đã đúng
   - Không đổi `QuickCreateCategoryModal`.
   - Không đổi submit logic ở create/edit.
   - Không sửa `ui.tsx` global Popover primitive trong fix này.

4. Kiểm tra cần pass
   - `/admin/products/create`
     - bấm vào field danh mục mở danh sách được
     - gõ lọc được
     - chọn category đổi giá trị được
     - click ngoài đóng dropdown được
     - nút `+` vẫn mở modal tạo nhanh được
   - `/admin/products/[id]/edit`
     - toàn bộ hành vi trên hoạt động tương tự
     - đổi category làm nút lưu bật lại như trước

5. Verify sau khi code
   - Chạy `bunx tsc --noEmit` theo rule repo.
   - Review git diff để chắc chỉ chạm file cần thiết.
   - Commit kèm `.factory/docs` theo rule repo.

6. Commit message dự kiến
   - `fix(products): repair category combobox toggle`

## Checklist
- [x] Root cause đã xác định rõ
- [x] Chỉ fix `ProductCategoryCombobox` theo scope an toàn user chọn
- [x] Không đụng primitive Popover toàn admin
- [x] Có xử lý click outside + toggle open/close
- [x] Sẽ verify bằng `bunx tsc --noEmit`
- [x] Sẽ commit, không push

## Best practice áp dụng
- Fix đúng root cause gần nhất thay vì sửa rộng toàn hệ thống.
- Không phụ thuộc vào primitive chưa hoàn chỉnh cho interaction quan trọng.
- Tự chứa logic open/close trong component feature để tránh side effect chéo.
- Thêm click-outside/Escape để UX không còn cảm giác bị cứng.

Nếu bạn duyệt spec này, mình sẽ fix ngay theo đúng scope an toàn trên.
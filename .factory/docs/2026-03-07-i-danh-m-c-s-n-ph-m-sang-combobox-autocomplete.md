## Problem Graph
1. [Đổi field Danh mục ở create/edit sản phẩm từ select sang combobox autocomplete] <- depends on 1.1, 1.2, 1.3
   1.1 [Xác định UI hiện tại ở /admin/products/create và /admin/products/[id]/edit] <- solved
   1.2 [Tìm pattern combobox phù hợp trong codebase để tái dùng] <- solved
   1.3 [Lên kế hoạch sửa đồng bộ create/edit + giữ quick create category] <- execute next

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Cần đọc đúng route localhost mà user nói để không hỏi lại.
   - Action: Đọc `app/admin/products/create/page.tsx` và `app/admin/products/[id]/edit/page.tsx`.
   - Observation: Cả 2 trang đang dùng `<select>` cho `categoryId`; trang create có thêm nút `+` mở modal tạo danh mục nhanh, trang edit thì chưa có.
   - Reflection: ✓ Valid

2. Solving 1.2...
   - Thought: Nên ưu tiên pattern sẵn có thay vì thêm lib mới.
   - Action: Tìm `Combobox`, `Popover`, `Command` trong codebase; đọc `components/modules/orders/AddressPreview.tsx`, `components/modules/SeedQuantitySelector.tsx`, `app/admin/components/ui.tsx`.
   - Observation: Dự án đã có `Input`, `Button`, `Popover`, `PopoverContent`, `PopoverTrigger` dùng được; chưa có command palette hoàn chỉnh nhưng đã có combobox custom đơn giản ở AddressPreview.
   - Reflection: ✓ Valid

3. Solving 1.3...
   - Thought: Cách an toàn nhất là tách 1 component dùng chung cho chọn danh mục sản phẩm, hỗ trợ gõ để lọc, click để chọn, và tái dùng cho cả create/edit.
   - Action: Đề xuất implement component autocomplete local-state, không thêm dependency mới, không đổi API backend.
   - Reflection: ✓ Valid

## Kế hoạch implement chi tiết
1. Tạo component dùng chung `ProductCategoryCombobox`
   - File mới: `app/admin/products/components/ProductCategoryCombobox.tsx` hoặc `components/products/ProductCategoryCombobox.tsx`.
   - Props đề xuất:
     - `categories: Array<{ _id: string; name: string }>`
     - `value: string`
     - `onChange: (id: string) => void`
     - `placeholder?: string`
     - `required?: boolean`
     - `onQuickCreate?: () => void` (để giữ nút `+` ở create, có thể tái dùng cho edit nếu muốn đồng bộ)
   - Logic bên trong:
     - `open` state để mở/đóng popover.
     - `query` state để lọc theo `name` bằng `toLowerCase().includes(...)`.
     - Tìm `selectedCategory` từ `value` để hiển thị label hiện tại.
     - Khi chọn option: gọi `onChange(id)`, reset `query`, đóng popover.
     - Khi mở lại popover: focus input tìm kiếm.
     - Hiển thị empty state: `Không tìm thấy danh mục phù hợp`.
   - UI:
     - Nút trigger nhìn giống input/select hiện tại: full width, text trái, caret bên phải.
     - Bên trong popover có ô input tìm kiếm ở trên, danh sách scroll ở dưới.
     - Highlight option đang chọn bằng dấu check hoặc background.
     - Nếu có `onQuickCreate`, render nút icon `Plus` cạnh trigger như create page hiện tại.

2. Sửa trang `app/admin/products/create/page.tsx`
   - Thay block `<select>` danh mục bằng `ProductCategoryCombobox`.
   - Giữ nguyên state `categoryId`, `categoriesData`, `showCategoryModal`, `setShowCategoryModal`.
   - Sau khi tạo danh mục nhanh thành công:
     - vẫn `setCategoryId(id)` như hiện tại;
     - component combobox phải tự hiển thị ngay category vừa chọn khi `categoriesData` refetch xong.
   - Không đổi validation submit hiện tại (`!categoryId` vẫn giữ nguyên).

3. Sửa trang `app/admin/products/[id]/edit/page.tsx`
   - Thay `<select>` danh mục bằng `ProductCategoryCombobox` dùng chung.
   - Nối với `categoryId`/`setCategoryId` hiện có.
   - Giữ nguyên snapshot logic `hasChanges`; vì snapshot đang so sánh `categoryId` string nên không cần đổi business logic.
   - Khuyến nghị đồng bộ UX với create: thêm nút quick create category ngay tại edit nếu muốn nhất quán. Nếu giữ scope đúng yêu cầu tối thiểu, vẫn chỉ cần combobox cho edit.

4. Giữ tương thích style/convention của dự án
   - Chỉ dùng các primitive sẵn có từ `@/app/admin/components/ui`.
   - Không thêm package mới.
   - Không đụng backend Convex vì data `listActive` đã đủ cho autocomplete local.
   - KISS/YAGNI: không làm async remote search vì user chỉ cần gõ lọc trong danh sách hiện có.

5. Kiểm tra hành vi cần pass
   - `/admin/products/create`
     - mở danh sách danh mục được;
     - gõ vài ký tự lọc đúng;
     - chọn category cập nhật `categoryId`;
     - tạo nhanh category mới vẫn chọn được category vừa tạo.
   - `/admin/products/[id]/edit`
     - category hiện tại được hiển thị đúng khi load dữ liệu;
     - đổi category bằng tìm kiếm được;
     - `hasChanges` chuyển đúng trạng thái để bật nút lưu.

6. Verify sau khi code
   - Chạy duy nhất `bunx tsc --noEmit` theo rule repo.
   - Nếu pass thì chuẩn bị commit.
   - Commit kèm `.factory/docs` nếu thư mục này có thay đổi/liên quan.

7. Commit dự kiến
   - Commit message ngắn gọn theo style repo, ví dụ: `feat(products): use category combobox on create and edit`

## Checklist cho user review
- [x] Danh mục ở create sẽ đổi từ dropdown sang combobox autocomplete
- [x] Danh mục ở edit cũng đổi tương tự
- [x] Không thêm dependency mới
- [x] Không đổi backend/API
- [x] Giữ validation submit hiện tại
- [x] Giữ flow tạo danh mục nhanh ở create
- [x] Verify bằng `bunx tsc --noEmit`
- [x] Sau khi xong sẽ commit, không push

## Best practice áp dụng
- Tái dùng 1 component cho create/edit để tránh lệch hành vi.
- Lọc local trên danh sách đã query sẵn để đơn giản, nhanh, ít rủi ro.
- Không sửa business logic submit/snapshot nếu không cần.
- Ưu tiên parity UX giữa create và edit để người dùng không phải học 2 cách chọn danh mục khác nhau.

Nếu bạn duyệt spec này, mình sẽ implement đúng phạm vi trên.
## Problem Graph
1. [Main] UX quản trị menu chưa tối ưu + render Classic dễ vỡ khi menu dài
   1.1 [Sub] /admin/menus đang lưu từng item, thiếu thao tác thêm nhanh/copy
      1.1.1 [ROOT CAUSE] State hiện tại phụ thuộc mutation tức thời theo từng thao tác, chưa có draft state + bulk save
   1.2 [Sub] Preview Classic và Header Classic chưa có cơ chế chống tràn khi nhiều item
      1.2.1 [ROOT CAUSE] Layout ngang chưa ràng buộc vùng nav/action rõ ràng, thiếu overflow strategy cho menu dài

## Execution (with reflection)
1. Solving 1.1.1 — thêm cơ chế draft + lưu toàn trang ở `/admin/menus`
   - Thought: Chuyển editor từ “save từng dòng” sang “edit local + Save All” để đúng yêu cầu UX.
   - Action:
     - File `app/admin/menus/page.tsx`:
       - Tạo `draftItems` (array local), `originalItems`, `hasChanges`, `isSavingAll`.
       - Đồng bộ từ `menuItemsData` vào local state khi load lần đầu / khi không có dirty local.
       - Bỏ nút Save từng item, chuyển toàn bộ edit label/url/reorder/depth/active/delete/add thành thao tác local state.
       - Thêm nút **Lưu tất cả** ở trang (top hoặc sticky bottom), disabled + xám khi `!hasChanges`.
       - Giữ pagination nhưng phân trang theo `draftItems` để thấy ngay state mới.
   - Reflection: ✓ Đúng yêu cầu “lưu hết”, đồng thời vẫn phản hồi UI tức thì.

2. Bổ sung thao tác “thêm ngay bên dưới” + “copy 1 menu item”
   - Thought: Bạn chọn “thêm cùng cấp ngay dưới item” và “copy 1 item ngay dưới”, nên thao tác phải nằm ngay trên từng row.
   - Action:
     - File `app/admin/menus/page.tsx`:
       - Thêm action row:
         - **Thêm bên dưới**: chèn item mới sau item hiện tại, cùng `depth`, mặc định `label='Liên kết mới'`, `url='/'`, `active=true`.
         - **Copy**: nhân bản item hiện tại (label gợi ý `"{label} (copy)"`) chèn ngay dưới, cùng depth/url/flags.
       - Sau mỗi thao tác chèn/xóa/sắp xếp: normalize lại `order` tuần tự trong local state.
   - Reflection: ✓ Loại bỏ thao tác “tạo rồi kéo lên” như bạn yêu cầu.

3. Tạo mutation lưu bulk một lần
   - Thought: Nếu chỉ gọi `updateMenuItem` từng dòng thì vẫn là save rời rạc; cần mutation đồng bộ snapshot.
   - Action:
     - File `convex/menus.ts`:
       - Thêm mutation mới (vd `saveMenuItemsBulk`) nhận `{ menuId, items }`.
       - `items` gồm snapshot cuối: `{ id?: Id<'menuItems'>, label, url, depth, active, openInNewTab?, icon?, parentId? }`.
       - Logic:
         1) Lấy toàn bộ items hiện tại theo `menuId`.
         2) Patch item có `id` tồn tại (kèm `order` theo index snapshot).
         3) Insert item mới (không có `id`) với `order` theo index.
         4) Delete item cũ không còn trong snapshot.
         5) Validate URL như rule hiện tại (`/`, `#`, `http`).
     - File `app/admin/menus/page.tsx`:
       - Nút **Lưu tất cả** gọi mutation bulk; thành công thì reset dirty state + toast.
   - Reflection: ✓ Atomic theo 1 lần bấm lưu, đúng UX “lưu hết”.

4. Tối ưu UI/UX render Classic khi nhiều menu (preview + trang chủ)
   - Thought: Bạn nói không phải bug logic mà là “đùn/rớt dòng” khi nhiều item => ưu tiên layout resilient.
   - Action:
     - File `components/experiences/previews/HeaderMenuPreview.tsx` (nhánh `renderClassicStyle`, desktop):
       - Chuyển hàng header thành cấu trúc 3 vùng rõ ràng (brand / nav / actions).
       - Vùng nav: `min-w-0 + overflow-x-auto + whitespace-nowrap` để không đẩy vỡ actions.
       - Item nav: giới hạn width + truncate label khi quá dài.
       - Giữ dropdown hoạt động bình thường.
     - File `components/site/Header.tsx` (nhánh `headerStyle === 'classic'`, desktop):
       - Áp dụng cùng layout strategy như preview để parity với trang chủ thật.
       - Giữ search/cart/cta không bị rớt dòng khi menu nhiều.
   - Reflection: ✓ Tập trung đúng pain-point UI/UX của bạn, không thay đổi behavior ngoài scope.

5. Kiểm tra & hoàn tất theo convention repo
   - Thought: Repo rule yêu cầu kiểm tra TypeScript trước commit.
   - Action (khi implement):
     - Chạy `bunx tsc --noEmit`.
     - Commit toàn bộ thay đổi liên quan, và add `.factory/docs` nếu có file phát sinh.
   - Reflection: ✓ Tuân thủ đúng quy ước dự án.

## Checklist xác nhận phạm vi
- [x] /admin/menus có “Thêm bên dưới” (cùng cấp)
- [x] /admin/menus có “Copy 1 menu item” ngay dưới item gốc
- [x] Có nút “Lưu tất cả” toàn trang, tự xám khi không có thay đổi
- [x] Không còn bắt user lưu từng item riêng lẻ
- [x] Classic ở `/system/experiences/menu` tối ưu chống đùn/rớt khi menu nhiều
- [x] Classic ở trang chủ thật đồng bộ UX render với preview

## Best-practice áp dụng
- KISS/YAGNI: chỉ mở rộng đúng 4 yêu cầu, không thêm workflow dư thừa.
- DRY: dùng chung chiến lược layout classic giữa preview và site header để tránh lệch hành vi.
- Safety: validate URL tại backend bulk mutation như mutation hiện hữu để không làm bẩn dữ liệu.
- UX: save-state rõ ràng (`hasChanges`), disabled-state trực quan, thao tác “thêm/copy” tại chỗ giảm drag thủ công.
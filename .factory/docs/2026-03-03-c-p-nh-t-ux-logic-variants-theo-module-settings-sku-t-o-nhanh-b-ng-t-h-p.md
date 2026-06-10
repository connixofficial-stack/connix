## Problem Graph
1. [Fix UX/logic trang variants theo module products] <- depends on 1.1, 1.2
   1.1 [Ẩn SKU tuyệt đối khi feature SKU tắt] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Trang `admin/products/[id]/variants` đang hardcode cột SKU + search SKU + SKU prefix dù chưa đọc enabled field `sku`
   1.2 [Viết lại hoàn toàn popup Tạo nhanh dạng bảng tổ hợp tiện dụng] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Popup hiện tại chỉ generate hàng loạt tuần tự, không có bảng tổ hợp, không có exclude row, không có overwrite
      1.2.2 [ROOT CAUSE] Backend chưa có API bulk upsert theo tổ hợp optionValues để hỗ trợ skip/overwrite rõ ràng

## Execution (with reflection)
1. Chuẩn hóa nguồn setting/feature cho variants page
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Query thêm `api.admin.modules.listEnabledModuleFields` với `moduleKey: 'products'`.
  - Tạo `enabledFields` set và `skuEnabled = enabledFields.has('sku')`.
  - Cột table:
    - Chỉ thêm column `sku` khi `skuEnabled=true`.
    - Nếu localStorage còn key `sku` cũ mà hiện đã tắt => tự lọc khi init `visibleColumns` + khi render `ColumnToggle`.
  - Search:
    - Placeholder đổi theo state: `skuEnabled ? "Tìm theo SKU..." : "Tìm phiên bản..."`.
    - Khi `skuEnabled=false`, filter search theo `optionSummary` thay vì `variant.sku`.
  - Row render:
    - Không render `TableCell sku` khi `skuEnabled=false`.
- Reflection: ✓ đảm bảo “tắt SKU thì tuyệt đối không show cột SKU”.

2. Viết lại popup “Tạo nhanh” thành popup bảng tổ hợp (UI/UX mới)
- File: `app/admin/products/[id]/variants/page.tsx` (tách component nội bộ để giữ scope nhỏ) 
- Thay đổi UI/logic chính:
  - Popup 2 phần:
    - Header cấu hình chung: 
      - SKU prefix chỉ hiện khi `skuEnabled=true`; nếu tắt SKU thì ẩn hoàn toàn trường SKU prefix + không có dấu `*`.
      - Đổi label: `Giá mặc định` -> `Giá bán`, `Giá khuyến mãi` -> `Giá trước giảm`.
      - Có input mặc định cho `Giá bán`, `Giá trước giảm`, `Tồn kho`, `Trạng thái`, `Cho phép đặt hàng khi hết` (theo setting variantPricing/variantStock hiện có).
      - Toggle `Ghi đè phiên bản đã có` (default OFF).
      - Action nhanh: `Chọn tất cả`, `Bỏ chọn tất cả`, `Chỉ chọn phiên bản mới`.
    - Bảng tổ hợp:
      - Sinh full cartesian product từ options/value active (ví dụ màu×size).
      - Mỗi dòng có checkbox chọn tạo/update (default chọn tất cả theo quyết định của bạn).
      - Mỗi dòng hiển thị:
        - Tên tổ hợp (Màu: X / Size: Y)
        - Trạng thái tồn tại (`Đã có`/`Mới`)
        - Input theo dòng: `Giá bán`, `Giá trước giảm`, `Tồn kho`, `Trạng thái`, `Cho backorder`
      - Hỗ trợ bỏ tick dòng không muốn tạo (ví dụ xanh-nhỏ).
      - Khi dòng là `Đã có` và overwrite OFF: disabled + ghi chú “sẽ bỏ qua”.
      - Khi overwrite ON: dòng `Đã có` cho phép sửa và sẽ update.
  - Tối ưu UX:
    - Sticky header bảng, scroll nội dung popup.
    - Counter realtime: `Tổng tổ hợp / Đã chọn / Mới sẽ tạo / Đã có sẽ ghi đè / Bỏ qua`.
    - Validate nhẹ: salePrice <= price (nếu cả hai có).
- Reflection: ✓ đáp ứng đúng yêu cầu “viết lại hoàn toàn, tiện thao tác dạng bảng tổ hợp”.

3. Bổ sung API backend cho bulk tạo/ghi đè theo tổ hợp
- File: `convex/productVariants.ts`
- Thay đổi:
  - Thêm mutation mới, ví dụ `bulkUpsertFromCombinations`:
    - Input:
      - `productId`
      - `rows[]` (mỗi row: `optionValues`, `selected`, `price?`, `salePrice?`, `stock?`, `status`, `allowBackorder?`, `sku?`)
      - `overwriteExisting: boolean`
      - `skuEnabled: boolean`
      - `skuPrefix?`
    - Luồng:
      - Build map variant existing theo key tổ hợp chuẩn hóa (sort by optionId + valueId + customValue).
      - Với mỗi row selected:
        - Nếu chưa có: create.
        - Nếu đã có:
          - overwrite OFF => skip.
          - overwrite ON => patch variant cũ (không tạo bản ghi mới).
      - SKU:
        - Nếu `skuEnabled=true`: dùng sku từ row hoặc auto từ prefix + counter (unique).
        - Nếu `skuEnabled=false`: tự sinh ngầm `VAR-<timestamp>-<counter>` (đúng quyết định bạn đã chọn).
      - Trả về summary: `{created, updated, skipped, errors[]}`.
  - Giữ validation hiện có: option value phải khớp optionId, SKU unique.
- Reflection: ✓ tách business logic khỏi UI, đảm bảo đúng chế độ skip/overwrite.

4. Dùng API mới ở trang variants + cập nhật submit flow popup
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Bỏ loop `createVariant` tuần tự hiện tại.
  - Dùng mutation bulk mới với payload bảng.
  - Toast kết quả chi tiết theo summary:
    - `Tạo mới X, Ghi đè Y, Bỏ qua Z`.
  - Sau thành công: đóng popup + reset state liên quan + rely on query refresh.
- Reflection: ✓ nhanh hơn, rõ kết quả cho admin.

5. Đồng bộ text/copy theo yêu cầu
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi copy:
  - `Giá mặc định` -> `Giá bán`
  - `Giá khuyến mãi` -> `Giá trước giảm`
  - SKU prefix không hiện dấu `*` khi SKU disabled (vì cả field bị ẩn).
- Reflection: ✓ đúng wording yêu cầu.

6. Kiểm thử bắt buộc trước khi code xong
- Typecheck theo rule repo: `bunx tsc --noEmit`.
- Test tay các case:
  - Case A: `/system/modules/products` tắt SKU -> vào `/admin/products/:id/variants`:
    - Không thấy cột SKU
    - Không thấy SKU prefix trong popup
    - Search không còn phụ thuộc SKU
  - Case B: popup tổ hợp 3x3:
    - Sinh đúng 9 dòng
    - Bỏ tick 1 dòng (xanh-nhỏ) => không tạo dòng đó
  - Case C: đã có sẵn 1 tổ hợp:
    - overwrite OFF => skip
    - overwrite ON => update đúng dòng cũ
  - Case D: giá mặc định + sửa theo dòng hoạt động đúng
  - Case E: SKU disabled vẫn tạo/update thành công (SKU ngầm backend)

7. Commit sau implement (theo rule repo)
- Chạy `git status` + `git diff --cached` kiểm tra secrets.
- Commit message đề xuất: `feat(products): revamp variant quick-create matrix and respect SKU feature toggle`
- Add cả `.factory/docs` nếu có thay đổi thư mục này.

## Checklist chốt nhanh
- [ ] SKU tắt => không còn cột SKU ở variants list
- [ ] SKU tắt => popup tạo nhanh không hiển thị SKU prefix
- [ ] Popup mới hiển thị bảng full tổ hợp + tick bỏ từng dòng
- [ ] Có hiển thị dòng đã tồn tại + toggle Ghi đè
- [ ] Mặc định bỏ qua dòng đã có, bật Ghi đè thì update
- [ ] Label đổi đúng: Giá bán / Giá trước giảm
- [ ] Typecheck pass (`bunx tsc --noEmit`)
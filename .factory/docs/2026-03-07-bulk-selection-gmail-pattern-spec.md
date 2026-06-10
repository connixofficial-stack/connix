## Audit Summary

### Pre-Audit
- Đã audit UI hiện tại của bulk selection trong admin table.
- Evidence code chính ở `app/admin/components/TableUtilities.tsx:101-122`:
  - text hiện tại: `Đã chọn {selectedCount} mục`
  - action hiện tại: `Bỏ chọn`
- Pattern này đang được reuse ở rất nhiều trang admin như products, users, orders, customers, wishlist...
- Đã WebSearch best practice và đối chiếu các pattern phổ biến:
  - PatternFly bulk selection: ưu tiên hiển thị rõ trạng thái chọn, count, và tùy chọn `select page / select all / select none`.
  - Gmail pattern: chọn trang trước, sau đó mới hiện CTA “chọn toàn bộ kết quả phù hợp”.
  - Các guideline bulk actions đều khuyên dùng label rõ đối tượng, không dùng động từ mơ hồ.
- Bạn đã chốt hướng mong muốn:
  - Pattern: Gmail 2 bước chọn trang rồi chọn toàn bộ kết quả
  - Label: `Bỏ chọn tất cả`

### Evidence hiện trạng
1. `BulkActionBar` hiện chỉ có 2 tín hiệu:
   - `Đã chọn N mục`
   - `Bỏ chọn`
2. Vấn đề UX của copy hiện tại:
   - `mục` là generic, không nói rõ phạm vi gì đang được chọn.
   - `Bỏ chọn` là động từ quá ngắn, người mới có thể không chắc là bỏ dòng hiện tại, bỏ trang hiện tại hay bỏ toàn bộ selection.
3. Vấn đề interaction hiện tại ở products page:
   - Sau khi có selection, bên dưới mới hiện:
     - `Chọn trang này`
     - `Chọn tất cả kết quả`
   - Nhưng hệ thống chưa diễn đạt rõ 3 state quan trọng:
     - chưa chọn gì
     - đang chọn một phần/trang hiện tại
     - đã chọn toàn bộ kết quả theo filter
4. Vì `BulkActionBar` là shared component, nếu sửa đúng pattern thì UX sẽ tốt lên đồng bộ ở nhiều màn admin, không chỉ products.

## Root Cause Confidence
- High
- Lý do:
  1. Gốc vấn đề không phải thiếu chức năng, mà là thiếu semantic clarity trong text và state communication.
  2. Người dùng không khó vì logic chọn, mà khó vì không biết “phạm vi lựa chọn” hiện tại là gì.
  3. `Bỏ chọn` là copy quá ngắn, không đạt nguyên tắc “action label should describe outcome”.

## Audit Questions
1. Triệu chứng observed?
   - Expected: người dùng nhìn là hiểu đang chọn bao nhiêu, chọn trong phạm vi nào, và bấm bỏ chọn sẽ bỏ cái gì.
   - Actual: chỉ thấy `Đã chọn N mục` + `Bỏ chọn`, nên scope không đủ rõ.
2. Phạm vi ảnh hưởng?
   - Nhiều màn admin đang dùng `BulkActionBar`, không chỉ products.
3. Có tái hiện ổn định không?
   - Có, vì component shared đang render cùng một pattern.
4. Mốc thay đổi gần nhất?
   - Chưa cần truy commit để kết luận UX issue vì evidence đã đủ trong code hiện tại.
5. Dữ liệu còn thiếu?
   - Chưa có user test thực địa, nhưng heuristic + best practice đã đủ mạnh cho spec UX.
6. Có giả thuyết thay thế nào?
   - Có: chỉ đổi chữ `Bỏ chọn` là đủ. Bị loại vì vấn đề lớn hơn là thiếu diễn đạt state 2 bước chọn.
7. Rủi ro nếu fix sai nguyên nhân?
   - Nếu chỉ đổi text mà không đổi state messaging, user vẫn không hiểu lúc nào là chọn trang vs chọn toàn bộ kết quả.
8. Tiêu chí pass/fail?
   - Pass khi user/AI đọc là hiểu rõ count, phạm vi chọn, và tác dụng của CTA bỏ chọn.

## Problem Graph
1. [Bulk selection hiện chưa thật dễ hiểu] <- depends on 1.1, 1.2
   1.1 [Copy chưa mô tả rõ phạm vi] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `Đã chọn N mục` và `Bỏ chọn` quá generic
   1.2 [State chọn nhiều bước chưa được diễn đạt] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Chưa phân tách rõ chọn trang hiện tại vs chọn toàn bộ kết quả theo filter

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: label phải mô tả outcome và object rõ ràng.
   - Action: đổi `Bỏ chọn` thành `Bỏ chọn tất cả`.
   - Reflection: ✓ Đúng best practice, dễ hiểu hơn ngay cả khi không đọc ngữ cảnh.
2. Solving 1.2.1...
   - Thought: pattern Gmail 2 bước là dễ hiểu nhất cho dữ liệu có filter/pagination.
   - Action: đề xuất hiển thị message theo từng state thay vì chỉ count tĩnh.
   - Reflection: ✓ Phù hợp admin tables, scalable, ai cũng quen.

## Proposal

### Pattern UX recommend: Gmail-style 2-step selection
Thay vì chỉ hiển thị:
- `Đã chọn 12 mục`
- `Bỏ chọn`

Nên chuyển thành 3 state rõ ràng.

### State 1 — Chọn trên trang hiện tại
Khi user tick header checkbox hoặc chọn nhiều dòng trên page hiện tại:
- Message chính:
  - `Đã chọn 12 sản phẩm trên trang này`
- CTA phụ:
  - `Chọn tất cả 248 sản phẩm phù hợp`
- CTA clear:
  - `Bỏ chọn tất cả`

Ý nghĩa:
- User hiểu ngay: hiện mới chọn trên page, chưa phải toàn bộ kết quả.
- Đây là đúng pattern Gmail: first select current page, then offer expand selection.

### State 2 — Đã chọn toàn bộ kết quả theo filter
Khi user bấm “Chọn tất cả ... phù hợp”:
- Message chính:
  - `Đã chọn toàn bộ 248 sản phẩm phù hợp`
- Subtext nhỏ:
  - `Bao gồm tất cả kết quả theo bộ lọc hiện tại`
- CTA clear:
  - `Bỏ chọn tất cả`

Ý nghĩa:
- Phân biệt rất rõ với state chọn trên page.
- Tránh hiểu nhầm giữa 12 item visible và 248 item matching filter.

### State 3 — Partial selection thủ công
Khi user chọn vài dòng lẻ tẻ, không phải full page:
- Message chính:
  - `Đã chọn 3 sản phẩm`
- Nếu phù hợp vẫn có CTA:
  - `Chọn toàn bộ 12 sản phẩm trên trang này`
- CTA clear:
  - `Bỏ chọn tất cả`

Ý nghĩa:
- Không ép message “trang này” khi thực ra chỉ mới tick vài dòng.

## Copy recommend
### Không nên
- `Đã chọn 12 mục`
- `Bỏ chọn`

### Nên
- `Đã chọn 12 sản phẩm`
- `Đã chọn 12 sản phẩm trên trang này`
- `Đã chọn toàn bộ 248 sản phẩm phù hợp`
- `Bỏ chọn tất cả`

### Lý do
- Dùng noun cụ thể như `sản phẩm`, `đơn hàng`, `người dùng` thay cho `mục`.
- Dùng scope cụ thể như `trên trang này`, `phù hợp` để diễn đạt selection scope.
- `Bỏ chọn tất cả` rõ outcome hơn `Bỏ chọn`.

## Best Practices tổng hợp từ research
1. Selection count phải luôn visible khi có bulk mode.
2. Action clear phải mô tả rõ nó clear toàn bộ selection.
3. Với pagination/filter, nên dùng 2-step selection thay vì auto-select-all ngay.
4. Phải nói rõ scope selection:
   - current page
   - all matching results
5. Với dataset lớn, nên tránh để user hiểu nhầm rằng checkbox header = toàn bộ database.
6. Nên giữ destructive actions tách biệt, còn “Bỏ chọn tất cả” là secondary text action.

## Kế hoạch implement step-by-step
Nếu bạn duyệt, mình recommend implement như sau:

1. `app/admin/components/TableUtilities.tsx`
- Refactor `BulkActionBar` để nhận thêm props semantic:
  - `entityLabel` ví dụ: `sản phẩm`, `đơn hàng`
  - `selectionScope`: `'partial' | 'page' | 'all_results'`
  - `totalMatchingCount` optional
  - `onSelectPage` optional
  - `onSelectAllResults` optional
- Đổi copy `Bỏ chọn` -> `Bỏ chọn tất cả`.
- Render message theo state thay vì hardcode `Đã chọn N mục`.

2. Các page dùng `BulkActionBar` như:
- `app/admin/products/page.tsx`
- `app/admin/users/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/customers/page.tsx`
- và các page admin khác đang reuse component

- Truyền `entityLabel` đúng ngữ cảnh.
- Truyền `selectionScope` đúng state local hiện có.
- Với các page đã có logic `selectionMode === 'all'`, map sang `all_results`.
- Với page có full-page selection, map sang `page`.

3. Với `products/page.tsx`
- Hợp nhất UX hiện có:
  - thay block dưới `BulkActionBar` bằng action ngay trong bar hoặc ngay sát bar
  - tránh tách rời message và action selection expansion ở 2 chỗ khác nhau
- Nên để flow như sau:
  - tick page -> bar hiện `Đã chọn 12 sản phẩm trên trang này` + link `Chọn tất cả 248 sản phẩm phù hợp`
  - sau khi chọn all results -> bar đổi thành `Đã chọn toàn bộ 248 sản phẩm phù hợp`

4. Accessibility/UI details
- Link-like secondary actions nên đủ contrast.
- Count nên là text đậm nhất trong bar.
- CTA destructive như `Xóa (12)` đặt bên phải, giữ tách biệt với nhóm selection state.

## Counter-Hypothesis Check
- Giả thuyết đối chứng 1: chỉ đổi `Bỏ chọn` thành `Bỏ chọn tất cả` là đủ.
  - Bị loại vì vẫn không giải quyết ambiguity giữa chọn trang và chọn toàn bộ kết quả.
- Giả thuyết đối chứng 2: giữ chữ `mục` để tái sử dụng cho mọi module.
  - Bị loại vì generic quá mức; có thể tái sử dụng bằng `entityLabel` prop tốt hơn.

## Post-Audit
- Blast radius: trung bình, vì `BulkActionBar` là shared component dùng ở nhiều admin pages.
- Regression risk: trung bình, chủ yếu ở prop wiring giữa các page.
- Complexity: vừa phải, nhưng đáng vì đây là shared UX improvement.
- Theo KISS/YAGNI: nên bắt đầu từ products trước nếu bạn muốn rollout an toàn, hoặc sửa shared component nếu muốn đồng bộ toàn admin.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Manual checks:
  1. Chưa chọn gì -> bar không hiện.
  2. Chọn vài dòng -> message đúng partial.
  3. Chọn hết page -> message đúng `trên trang này`.
  4. Chọn toàn bộ kết quả -> message đúng `toàn bộ ... phù hợp`.
  5. Bấm `Bỏ chọn tất cả` -> clear đúng toàn bộ selection.
  6. Delete button luôn phản ánh đúng count thực tế.
- Pass khi người mới nhìn vào hiểu ngay 2 bước chọn và phạm vi tác động.

## Chốt dễ hiểu
Nếu mục tiêu là “ai cũng hiểu”, thì UX tốt nhất không phải chỉ đổi chữ `Bỏ chọn`, mà là:
- nói rõ đang chọn bao nhiêu
- nói rõ đang chọn trong phạm vi nào
- dùng pattern Gmail 2 bước để tránh hiểu nhầm
- đổi label thành `Bỏ chọn tất cả`

Checklist:
- [ ] Không dùng chữ generic `mục` nếu biết entity cụ thể
- [ ] Không dùng label mơ hồ `Bỏ chọn`
- [ ] Có state rõ: partial / page / all results
- [ ] Có CTA `Chọn tất cả ... phù hợp` khi mới chỉ chọn page
- [ ] Có message rõ khi đã chọn toàn bộ kết quả

Nếu bạn muốn, mình sẽ chốt tiếp 2 hướng implement:
- Option A: chỉ sửa products page trước
- Option B: refactor shared `BulkActionBar` cho toàn bộ admin
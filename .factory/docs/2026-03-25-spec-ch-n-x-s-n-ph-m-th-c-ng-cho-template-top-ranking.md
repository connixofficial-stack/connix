## TL;DR kiểu Feynman
- Với template top/ranking, thay vì nhập số X rồi hệ thống tự lấy, form sẽ hiện đúng **X dropdown sản phẩm** để anh chọn tay.
- Mỗi dropdown sẽ **lọc bỏ sản phẩm đã chọn ở dropdown khác** để tránh trùng.
- Khi đổi X, danh sách chọn sẽ **giữ theo thứ tự và cắt bớt từ cuối**.
- Backend sẽ ưu tiên danh sách sản phẩm được chọn tay; chỉ lỗi nếu chưa chọn đủ hoặc bị trùng.

## Audit Summary
### Observation
1. UI hiện tại ở `app/admin/posts/create/page.tsx` chỉ có field `Số sản phẩm` cho các template top/ranking; chưa có cơ chế chọn danh sách sản phẩm cụ thể.
2. UI compare đã có pattern gần đúng: 2 dropdown A/B và lọc tránh trùng.
3. Backend `convex/posts.ts` hiện chỉ hỗ trợ `compareSlugs` cho strategy compare; các strategy top/ranking vẫn lấy tự động theo query bán chạy/search/category.
4. `GeneratorRequest` hiện chưa có field riêng cho “danh sách sản phẩm được chọn tay” dùng chung cho top/ranking.

### Inference
- Root issue là contract request mới chỉ đủ cho compare, chưa đủ cho “manual curated list” của top/ranking.

### Decision
- Mở rộng request để hỗ trợ `selectedProductSlugs` dùng cho top/ranking; UI render đúng X dropdown thủ công và server ưu tiên danh sách này trước khi fallback logic strategy.

## Root Cause Confidence
**High** — vì bằng chứng cho thấy UI + payload hiện tại không có chỗ biểu diễn danh sách X sản phẩm chọn tay cho top/ranking.

## Files Impacted
### UI
- **Sửa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: với top/ranking chỉ nhập số lượng sản phẩm.  
  Thay đổi: render đúng X dropdown chọn sản phẩm theo thứ tự 1..X, chống trùng, đồng bộ khi tăng/giảm X.

### Shared
- **Sửa:** `lib/posts/generator/macro-templates.ts`  
  Vai trò hiện tại: định nghĩa field spec theo strategy.  
  Thay đổi: tách rõ field cho top/ranking từ `productLimit` sang `manualProductSelection` (hoặc tương đương) để UI biết phải hiện danh sách dropdown.

- **Sửa nhẹ:** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: định nghĩa `GeneratorRequest`.  
  Thay đổi: thêm field `selectedProductSlugs?: string[]` (hoặc tương đương) cho danh sách sản phẩm curated.

### Server
- **Sửa:** `convex/posts.ts`  
  Vai trò hiện tại: top/ranking query sản phẩm tự động theo strategy.  
  Thay đổi: nếu request có `selectedProductSlugs` thì validate đủ X, không trùng, load đúng danh sách này trước; nếu không hợp lệ thì báo lỗi rõ ràng.

## Hành vi chi tiết theo yêu cầu mới
1. **Template top/ranking/best_sellers/value_popular/beginner/premium/seasonal/...**
   - Hiện field `Số sản phẩm (X)`.
   - Ngay bên dưới hiện đúng **X dropdown**: Sản phẩm 1, Sản phẩm 2, ... Sản phẩm X.
   - Mỗi dropdown loại trừ các sản phẩm đã chọn ở dropdown khác.
   - Bắt buộc chọn đủ X sản phẩm mới cho Preview.
2. **Khi đổi X:**
   - Nếu tăng X: thêm dropdown mới ở cuối, giữ nguyên các chọn cũ.
   - Nếu giảm X: giữ theo thứ tự, cắt bớt từ cuối.
3. **Template compare_two:**
   - Giữ nguyên UX 2 dropdown A/B hiện tại.
4. **Template budget/category/use_case:**
   - Không đổi trong scope này, trừ khi template đó cũng thuộc nhóm top/ranking cần curated list theo mapping mới.
5. **Preview request:**
   - Top/ranking gửi `selectedProductSlugs` theo đúng thứ tự dropdown.
   - Không gửi field rác khi template không dùng curated list.

## Counter-Hypothesis
- Có thể chỉ cần giữ số X và cho hệ thống tự lấy bán chạy là đủ.  
  Bác bỏ: yêu cầu mới nói rõ muốn “x dropdown để chọn” giống compare và tránh trùng, tức cần curated input chứ không chỉ limit.

## Execution Preview
1. Cập nhật type request + template field spec để hỗ trợ curated product list.
2. Refactor UI top/ranking từ 1 input số lượng thành `X + danh sách X dropdown`.
3. Thêm helper state để giữ thứ tự chọn, cắt đuôi khi giảm X, chống trùng option.
4. Cập nhật request builder để map IDs -> slugs theo thứ tự.
5. Cập nhật server query: ưu tiên `selectedProductSlugs`, validate đủ số lượng/không trùng/tồn tại.
6. Static review typing + null-safety + state reset khi đổi template.

## Acceptance Criteria
1. Chọn template top/ranking sẽ hiện `Số sản phẩm` và đúng X dropdown sản phẩm.
2. Không thể chọn trùng cùng một sản phẩm ở 2 dropdown khác nhau.
3. Giảm X sẽ giữ các sản phẩm đầu và cắt các sản phẩm cuối.
4. Preview bị chặn nếu chưa chọn đủ X sản phẩm.
5. Server dùng đúng danh sách sản phẩm được chọn tay thay vì tự lấy top mặc định.
6. Compare 2 sản phẩm vẫn hoạt động như cũ.

## Verification Plan
- Không chạy lint/test/build ngoài `bunx tsc --noEmit` khi implement vì repo guideline cấm lint/unit/build.
- Verify tĩnh:
  - type của `selectedProductSlugs`,
  - logic resize mảng selected products khi đổi X,
  - filter option chống trùng,
  - guard server cho thiếu/trùng/slug không tồn tại.
- Checklist cho tester:
  - top 4 sản phẩm: hiện 4 dropdown;
  - chọn trùng bị chặn;
  - đổi từ 6 xuống 4: giữ 4 cái đầu;
  - bấm Preview khi thiếu 1 dropdown: báo lỗi.

## Out of Scope
- Không đổi engine sinh nội dung.
- Không thêm drag-and-drop sắp xếp sản phẩm.
- Không đổi UX compare ngoài việc giữ tương thích.

## Risk / Rollback
- Risk: nhiều dropdown khi X lớn có thể dài form.
- Mitigation: giới hạn X hiện có (3–12), layout 2 cột, label rõ thứ tự.
- Rollback: quay về mode nhập số lượng như hiện tại mà không ảnh hưởng dữ liệu posts đã tạo.
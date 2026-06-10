## TL;DR kiểu Feynman
- Mỗi template sẽ có **field bắt buộc riêng**; form chỉ hiện đúng field cần cho template đó.
- Vẫn có mục **Nâng cao** (thu gọn) để giữ linh hoạt mà không làm rối UI.
- `So sánh 2 sản phẩm` sẽ dùng **2 dropdown A/B** và **chặn chọn trùng**.
- `Top/ranking` chỉ cho chọn **số lượng X**, không hỏi giá/keyword nếu template không cần.
- Budget/keyword/category chỉ hiện với template có strategy tương ứng.

## Audit Summary
### Observation
1. UI hiện tại ở `app/admin/posts/create/page.tsx` luôn render gần như toàn bộ field generator (productLimit, keyword, compareSlugs, budgetMin, budgetMax, tone), chưa theo template.
2. Request `GeneratorRequest` cho phép nhiều field optional (`lib/posts/generator/types.ts`), nên frontend có thể gửi thừa field.
3. Backend `fetchProductsForRequest` trong `convex/posts.ts` đã có strategy rõ (`compare`, `budget_under`, `budget_between`, `category`, `use_case`, `best_sellers/value_popular`) nhưng UI chưa map CoC theo strategy.

### Inference
- Root issue là thiếu “template-aware form contract” ở frontend, không phải do backend query.

### Decision
- Bổ sung schema hiển thị field theo `productStrategy` + mode `required/basic/advanced`, để UI tự động đổi khi chọn template.

## Root Cause Confidence
**High** — vì evidence cho thấy backend đã tách logic theo strategy nhưng frontend vẫn form tĩnh, gây cảm giác “bắt nhập thừa”.

## Files Impacted
### UI
- **Sửa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: render form generator cố định cho mọi template.  
  Thay đổi: render động theo template; chỉ hiện field bắt buộc, thêm khối “Nâng cao” thu gọn.

### Shared
- **Sửa:** `lib/posts/generator/macro-templates.ts`  
  Vai trò hiện tại: mô tả template + strategy.  
  Thay đổi: bổ sung metadata UI (field requirements) hoặc derive map theo strategy để frontend dùng nhất quán.

- **Sửa nhẹ (nếu cần):** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: định nghĩa `GeneratorRequest`.  
  Thay đổi: thêm type helper cho `GeneratorFieldKey`/`TemplateFieldSpec` (chỉ phục vụ typing UI, không đổi payload runtime).

### Server
- **Sửa nhẹ:** `convex/posts.ts`  
  Vai trò hiện tại: nhận request và query theo strategy.  
  Thay đổi: tăng guard validation mềm theo strategy (vd compare cần 2 slug khác nhau; budget_between cần min/max hợp lệ), bỏ qua field thừa an toàn.

## Hành vi chi tiết theo lựa chọn của anh
1. **Mức CoC:** hiện field bắt buộc + mục **Nâng cao** thu gọn.
2. **Template compare_two:**
   - Hiện 2 dropdown: `Sản phẩm A`, `Sản phẩm B`.
   - Option B loại trừ item A đã chọn.
   - Nếu trùng do state cũ => reset B + cảnh báo ngắn.
3. **Template top/ranking/best_sellers/value_popular:**
   - Chỉ hiện `Số sản phẩm (X)` là bắt buộc.
   - Không hiện budget/keyword/category ở basic.
4. **Template use_case / choose_by_audience / goal_focused:**
   - Hiện `Keyword/Nhu cầu` (bắt buộc).
   - `Số sản phẩm (X)` basic.
5. **Template budget_under / budget_between / compare_three_budget:**
   - Hiện field budget bắt buộc tương ứng (under: max; between: min+max).
   - `Số sản phẩm (X)` basic.
6. **Template top_category:**
   - Hiện `Danh mục` bắt buộc + `Số sản phẩm` basic.
7. **Nâng cao (thu gọn):** giữ `Tone` và các tinh chỉnh không bắt buộc khác.

## Execution Preview
1. Tạo map `templateKey -> field spec` (hoặc `strategy -> field spec`) trong generator metadata.
2. Refactor block UI generator ở `create/page.tsx` thành render theo spec.
3. Đổi `compareSlugs` text input thành 2 dropdown A/B + logic chống trùng.
4. Chuẩn hóa `buildGeneratorRequest`: chỉ gửi field có giá trị và phù hợp template.
5. Bổ sung guard server cho các case invalid theo strategy.
6. Static review: typing, null-safety, state reset khi đổi template.

## Acceptance Criteria
1. Đổi template thì form generator đổi ngay, chỉ hiện field hợp ngữ cảnh.
2. `compare_two` luôn có 2 dropdown A/B, không thể chọn trùng sản phẩm.
3. `top_best_sellers` chỉ cần chọn X, không bị hỏi budget/keyword/category.
4. Template cần budget/keyword/category thì chỉ template đó mới hiện đúng field bắt buộc.
5. Payload gửi lên không chứa field rác không liên quan template (hoặc server ignore an toàn).
6. Preview vẫn hoạt động bình thường cho mọi template sau refactor.

## Verification Plan
- Không chạy lint/test/build theo guideline repo.
- Verify tĩnh:
  - check typing cho field map + request builder,
  - check guard compare A/B và budget min/max,
  - check reset state khi đổi template để tránh dữ liệu cũ “lọt” sang template mới.
- Checklist tay cho tester:
  - `compare_two`: chọn A => B không còn A;
  - `top_best_sellers`: chỉ thấy X;
  - `top_between_budget`: bắt buộc min/max;
  - đổi qua lại template nhiều lần không bị state rác.

## Out of Scope
- Không thay đổi engine sinh nội dung/slot/variant.
- Không thêm template mới.

## Risk / Rollback
- Risk: map field sai template có thể ẩn nhầm input cần thiết.
- Mitigation: fallback `basic default spec` + server guard.
- Rollback: trả lại form cũ (1 block UI) mà không ảnh hưởng dữ liệu posts hiện có.
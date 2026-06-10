Xin lỗi, đúng là logic hiện tại đang lệch yêu cầu anh đã chốt trước đó.

## TL;DR kiểu Feynman
- Code hiện tại đang “đoán” hơi nhiều theo score và fallback nên sinh ra cấu trúc lộn xộn.
- Rule đúng phải là rule cứng theo tầng, không phải heuristic mập mờ.
- Tôi sẽ bỏ kiểu sinh hiện tại và viết lại generator theo đúng flow anh đã mô tả: tầng 0 → tầng 1 → tầng 2 → nếu hết thì mới fallback sản phẩm.
- Chỉ giữ scoring cho việc sắp thứ tự trong cùng một tầng, không được phép làm đổi cấu trúc tầng.
- Mục tiêu là sinh ra menu nhìn phát hiểu ngay, không còn kiểu “tào lao” do generator tự bẻ rule.

## Audit Summary
### Observation
- Generator hiện tại vẫn sort root/group/item bằng `scoreStats(...)` rồi mới cắt `slice(...)`. Evidence: `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`.
- Khi `hierarchyEnabled = true`, code đang lấy root → level 1; nếu level 2 có thì render level 2, nếu không có thì fallback sang product. Nhưng vì toàn bộ flow bị score chi phối nên thứ tự/nhóm có thể lệch logic người dùng mong muốn. Evidence: cùng file, đoạn `sortedTop`, `sortedLevelOne`, `scoredItems`.
- Code còn có `seen` để dedupe category level 2 toàn cục giữa các root/group. Điều này có thể làm mất item hợp lệ hoặc khiến cấu trúc bị “thiếu” khó hiểu với user. Evidence: `const seen = new Set<string>()` và `seen.add(item._id)`.
- Root không có level 1 thì hiện tại fallback bằng group title = chính root name. Rule này có thể đúng ở một số case, nhưng nếu hierarchy on thì cần xác nhận rõ fallback ở root hay bỏ root nếu không có nhánh hợp lệ.
- Với `hierarchyEnabled = false`, generator hiện coi mọi category là root rồi fallback sản phẩm luôn. Phần này gần ý cũ, nhưng vẫn bị score-driven nên kết quả có thể không “thẳng rule”.

### Root cause answers (theo protocol)
1. Triệu chứng: kết quả sinh danh mục không bám rule tầng rõ ràng, nhìn sai ý đồ business.
2. Phạm vi: admin generate, preview, runtime auto mode vì đều đi qua generator hiện tại.
3. Tái hiện tối thiểu: bật auto-generate với cây category có nhiều nhánh; kết quả sẽ bị chi phối bởi score/slice thay vì bám flow cố định.
4. Mốc thay đổi gần nhất: generator mới thêm hierarchy + product fallback nhưng chưa khóa rule cứng theo tầng.
5. Dữ liệu còn thiếu: chưa có ví dụ input/output cụ thể từ anh trong tin nhắn này, nhưng rule tổng thể đã đủ rõ để sửa generator.
6. Giả thuyết thay thế: có thể dữ liệu category bẩn làm output xấu; tuy nhiên evidence cho thấy chính thuật toán hiện tại đang trộn ranking với structure nên đây vẫn là root cause chính.
7. Rủi ro nếu fix sai: tiếp tục sinh menu sai ý business, user phải sửa tay, mất niềm tin vào nút “sinh danh mục”.
8. Tiêu chí pass/fail: output phải bám đúng flow tầng, đọc ra được ngay vì sao item đó xuất hiện ở đó.

## Root Cause Confidence
**High** — Vấn đề không nằm ở một bug nhỏ mà ở chính cách generator đang dùng scoring để quyết định cấu trúc. Rule business là deterministic, còn code hiện tại vẫn mang tính heuristic.

## Counter-Hypothesis
- **Medium**: Có thể chỉ cần chỉnh score formula. Tôi không recommend vì score chỉ nên dùng để sắp thứ tự trong một tập ứng viên hợp lệ, không nên quyết định cấu trúc cây.
- **Low**: Có thể chỉ cần sửa UI preview. Không đúng vì source sinh dữ liệu đã sai thì preview/site chỉ đang hiển thị cái sai đó.

## Proposal
### Option A (Recommend) — Confidence 94%
Viết lại generator theo **rule cứng, deterministic**, bỏ các quyết định làm méo cấu trúc:
1. Xác định root candidates đúng theo hierarchy on/off.
2. Với mỗi root, sinh groups đúng theo tầng 1.
3. Với mỗi group, items chỉ có 2 khả năng:
   - level 2 categories nếu tồn tại;
   - nếu không tồn tại thì fallback sang products của chính tầng 1 đó.
4. Chỉ dùng score để sort trong cùng một danh sách ứng viên hợp lệ, không được vượt tầng, không dedupe toàn cục gây mất item.
5. Nếu root không có level 1:
   - hierarchy on: fallback product của root hoặc loại root nếu hide-empty và không có gì.
   - hierarchy off: root luôn fallback product của chính nó.

### Option B — Confidence 61%
Giữ generator hiện tại, chỉ vá vài nhánh sai và tinh chỉnh score/slice.

**Khi nào phù hợp:** chỉ nếu muốn sửa cực ít code và chấp nhận behavior tiếp tục khó đoán. Tôi không recommend.

## Files Impacted
### Generator / shared
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: generator đang trộn structure + scoring.
  - Thay đổi: tách hẳn thành flow deterministic theo tầng; score chỉ còn dùng để sort trong cùng tầng.

### Hook / admin
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`
  - Vai trò hiện tại: gọi generator và trả kết quả generate.
  - Thay đổi: giữ wiring nhưng dùng generator mới; nếu cần thì update summary để phản ánh rõ root/group/item theo rule mới.

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render auto-generated output.
  - Thay đổi: không đổi lớn về render; chỉ đảm bảo output mới được dùng đồng nhất ở runtime.

## Execution Preview
1. Đọc lại generator hiện tại và xác định chính xác các đoạn heuristic làm lệch rule.
2. Viết helper tách rõ 3 bước: chọn root, chọn groups tầng 1, chọn items tầng 2 hoặc fallback product.
3. Loại bỏ dedupe toàn cục nếu nó không thuộc rule business.
4. Giới hạn `maxRootCategories`, `maxGroupsPerCategory`, `maxItemsPerGroup` sau khi đã xác định đúng tầng, không cắt trước làm méo cấu trúc.
5. Giữ `hideEmptyCategories` theo aggregate như đã thống nhất.
6. Rà preview/runtime để chắc auto mode dùng output mới.
7. Chạy `bunx tsc --noEmit` và commit local kèm spec doc.

## Rule logic sẽ implement lại
### 1) Khi hierarchy bật
- Bước 1: lấy danh mục tầng 0 (`parentId = undefined`).
- Bước 2: với mỗi tầng 0, lấy toàn bộ con trực tiếp tầng 1.
- Bước 3: với mỗi tầng 1:
  - nếu có con tầng 2 hợp lệ -> group items = các danh mục tầng 2.
  - nếu không có con tầng 2 -> group items = các sản phẩm của chính tầng 1.
- Bước 4: nếu tầng 0 không có tầng 1 nào:
  - fallback group duy nhất bằng sản phẩm của chính tầng 0.
- Bước 5: `hideEmptyCategories=true` thì tầng nào không sinh được item hợp lệ sẽ bị bỏ.

### 2) Khi hierarchy tắt
- Mỗi category active là một root.
- Mỗi root tạo 1 group fallback bằng sản phẩm của chính category đó.
- Không giả lập tầng 1/tầng 2 khi dữ liệu không có.

### 3) Sorting đúng chỗ
- Root candidates có thể sort theo score/sales như cũ.
- Trong một root, level 1 có thể sort theo aggregate.
- Trong một group, level 2 categories hoặc products có thể sort theo score.
- Nhưng score không được phép biến một product thành item thay cho level 2 nếu level 2 còn tồn tại.

### 4) Bỏ hành vi gây sai
- Bỏ dedupe toàn cục `seen` nếu không có rule business yêu cầu một category chỉ xuất hiện một lần trong toàn menu.
- Không fallback product sớm khi vẫn còn nhánh category hợp lệ.
- Không cắt `slice` quá sớm trước khi xác định đúng tập ứng viên của từng tầng.

## Acceptance Criteria
- Khi hierarchy bật, root chỉ chứa group của tầng 1; mỗi group chỉ chứa tầng 2 hoặc product fallback của chính group đó.
- Không có case level 2 còn tồn tại mà generator lại nhảy xuống product.
- Không có item bị mất chỉ vì dedupe toàn cục không đúng rule.
- Khi hierarchy tắt, mỗi category active sinh đúng 1 group sản phẩm của chính nó.
- `hideEmptyCategories` tiếp tục hoạt động đúng theo aggregate.
- Preview/site/admin generate cho cùng một output logic.

## Out of Scope
- Thiết kế lại UI editor.
- Thay đổi schema lớn ngoài phạm vi generator nếu không cần.
- Tự suy diễn thêm business rule mới ngoài logic tầng đã chốt.

## Risk / Rollback
- Risk trung bình: rewrite generator có thể làm output thay đổi nhiều, nhưng đó là thay đổi mong muốn để về đúng rule.
- Rollback: revert riêng generator/hook/runtime wiring nếu cần.

## Verification Plan
- Static review:
  - kiểm tra từng branch hierarchy on/off;
  - kiểm tra case có level 2 và case không có level 2;
  - kiểm tra root không có child;
  - kiểm tra hide-empty.
- Typecheck:
  - chạy `bunx tsc --noEmit` sau khi implement.
- Repro plan:
  1. root có child1 và child1 có child2 -> chỉ ra child2.
  2. root có child1 nhưng child1 không có child2 -> fallback product của child1.
  3. root không có child1 -> fallback product của root.
  4. hierarchy off -> mỗi category thành một root có 1 group sản phẩm.
  5. bật hide-empty -> mục không có aggregate product biến mất.

Nếu anh confirm spec này, tôi sẽ sửa lại generator đúng rule cứng, không đoán mò nữa.
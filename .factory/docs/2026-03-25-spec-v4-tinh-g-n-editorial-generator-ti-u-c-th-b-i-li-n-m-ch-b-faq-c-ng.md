## TL;DR kiểu Feynman
- Bài hiện tại vẫn dở ở chỗ “đẹp hơn chút” nhưng chưa thật sự có giá trị biên tập: title còn chung, section bị cắt khúc, mục lục ngang ngu, còn nhét giá/doanh số vô ích.
- Em sẽ đổi từ kiểu `section cards rời` sang **editorial article flow**: 1 bài đọc liền mạch, có đề mục đánh số `1) 2) 3)` rõ ràng, bullet đúng chỗ.
- Title sẽ không còn generic; nó sẽ ghép từ **danh mục + điểm khác biệt + ngữ cảnh** thay vì title template chung chung.
- Bỏ hẳn giá, doanh số và FAQ hard-code vì đó là dữ liệu thay đổi nhanh hoặc ít giá trị đọc.
- Mục lục nhanh sẽ đổi sang **sidebar dọc đánh số**, nhìn như outline thật của bài viết.

## Audit Summary
### Observation
1. `macro-templates.ts`
   - Nhiều `titlePatterns` đang chung chung kiểu `Top X sản phẩm nổi bật...`, `Danh sách X sản phẩm...`.
   - Với yêu cầu mới của anh, pattern này chưa đủ cụ thể vì không gắn danh mục + điểm khác biệt.
2. `assembler.ts`
   - `SECTION_BASE_CLASS` đang bọc mọi section thành card rời (`rounded-2xl border ... shadow-sm`), làm bài bị chia mảnh.
   - `buildTocHtml` hiện là pills ngang; scan được nhưng không ra cảm giác outline dọc rõ đề mục.
   - `buildComparisonHtml` vẫn đang render hàng `Giá`, `Doanh số`.
   - `buildFaqHtml` vẫn dùng FAQ random từ bank cứng.
3. `renderProductCard()`
   - Card đang chèn giá khá nổi, khiến bài bị lệch sang listing thay vì content hữu ích.
4. Ảnh preview user gửi cho thấy:
   - Hero/title chưa sắc.
   - Các block nhìn như nhiều widget xếp dọc, chưa ra 1 bài viết liền mạch.
   - TOC và đề mục thiếu hierarchy biên tập.

### Inference
- Root cause mới không còn là “HTML xấu” đơn thuần mà là **editorial structure sai mode**: đang render như landing blocks/listing blocks, không như một bài viết có luận điểm và nhịp đọc.

### Decision
- Chuyển sang **editorial flow compact**:
  - mở bài;
  - mục lục dọc đánh số;
  - các phần `1) 2) 3)` nối mượt;
  - bullet/mini-checklist bên trong;
  - CTA chỉ giữ nơi cần thiết.

## Root Cause Confidence
**High** — vì evidence trực tiếp trong `assembler.ts` và `macro-templates.ts` cho thấy title generic, card-wrapper dày, TOC ngang, FAQ random, bảng vẫn chứa giá/doanh số.

## Counter-Hypothesis
- Chỉ cần tinh chỉnh CSS là đủ.  
  **Bác bỏ:** vấn đề không chỉ là style; title logic, section semantics, bảng dữ liệu và FAQ generator đều đang sai hướng giá trị nội dung.

## Inputs đã chốt từ anh
- Tiêu đề: **Gắn danh mục và điểm khác biệt**.
- Bố cục: **Một dòng đọc liền mạch**.
- Mục lục: **Sidebar dọc đánh số**.
- FAQ: **Bỏ hẳn**.

## Tự chê bản thân 100%
- Em đã over-focus vào “HTML component đẹp” nhưng lại chưa đủ focus vào **giá trị biên tập**.
- Em đang làm bài giống tập hợp block UI hơn là một bài viết có nhịp đọc, có luận điểm, có hierarchy nội dung.
- Việc giữ giá/doanh số/FAQ hard-code làm bài nhìn nhiều dữ liệu nhưng ít giá trị thực.
- Nếu đứng ở góc độ người đọc thật, bản hiện tại vẫn chưa “muốn đọc tiếp”; chỉ là “thấy có nhiều thứ”.
- Kết luận: lần sửa này phải ưu tiên **editorial usefulness > UI decoration**.

## Files Impacted
### Generator logic
- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: render article theo nhiều section wrappers kiểu card.  
  Thay đổi: bỏ bớt card-wrapper nặng, chuyển sang article flow liền mạch; render heading kiểu `1)`, `2)`, `3)`; TOC thành sidebar/outline dọc; bỏ FAQ block; loại giá/doanh số khỏi compare/list cards; nối spacing mềm hơn như một bài editorial.

- **Sửa vừa:** `lib/posts/generator/macro-templates.ts`  
  Vai trò hiện tại: title patterns generic.  
  Thay đổi: bổ sung title composer logic/patterns bám `category + differentiator`, ví dụ kiểu “Động cơ giảm tốc nào phù hợp cho tải nặng, chạy bền và dễ bảo trì?”. Không còn title chung kiểu “Top sản phẩm nổi bật”.

- **Sửa vừa:** `lib/posts/generator/variant-synthesizer.ts`  
  Vai trò hiện tại: paragraphs + FAQ phrases.  
  Thay đổi: loại dependency FAQ hard-coded; bổ sung subheading/lead sentence bớt generic; sinh bullet insights hoặc checklist ngắn có giá trị hơn.

- **Sửa nhẹ:** `lib/posts/generator/phrase-banks.ts`  
  Vai trò hiện tại: còn nhiều cụm CTA/FAQ chung.  
  Thay đổi: thêm bank cho differentiators, decision cues, editorial section labels; giảm phrase vô nghĩa.

### Types / preview
- **Sửa nhẹ:** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: có `layoutMeta` nhưng chưa phản ánh flow mới.  
  Thay đổi: update metadata như `articleVariant: compact-editorial`, `tocStyle: sidebar-numbered`.

- **Sửa nhẹ:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: preview render raw article shell.  
  Thay đổi: preview shell hỗ trợ TOC dọc đẹp hơn và article spacing liền mạch để phản ánh output mới.

## Hành vi mới đề xuất
1. **Title cụ thể hơn**
   - Ưu tiên ghép từ:
     - danh mục thật (`categoryName`),
     - khác biệt nổi bật lấy từ description/tone/useCase,
     - bối cảnh sử dụng.
   - Ví dụ logic: `[{Danh mục}] nào nổi bật về [{điểm khác biệt}] cho [{ngữ cảnh}]?`
   - Tránh title kiểu “Top X sản phẩm...” trừ khi thật sự cần.

2. **Bài đọc liền mạch**
   - Không render mỗi block như một cái card nặng.
   - Chỉ giữ visual emphasis ở hero, compare và CTA nếu cần.
   - Các đoạn nội dung nối nhau bằng spacing editorial, không như dashboard widgets.

3. **Đề mục rõ ràng**
   - Heading kiểu:
     - `1) Cần nhìn vào tiêu chí gì trước?`
     - `2) Nhóm lựa chọn đáng chú ý`
     - `3) Khi nào nên ưu tiên phương án A hay B?`
   - Trong từng mục mới dùng bullet nếu phù hợp.

4. **Mục lục dọc đánh số**
   - Không còn pills ngang.
   - Render thành outline/sidebar dọc với số thứ tự + anchor rõ ràng.
   - Nhìn như table of contents thật của một bài dài.

5. **Bỏ giá và doanh số**
   - Không render trong compare table/card list.
   - Nếu cần nhấn mạnh chỉ dùng nhận định định tính, không dùng số liệu dễ lỗi thời.

6. **Bỏ hẳn FAQ hard-code**
   - Không render block FAQ random nữa.
   - Thay bằng đoạn `Lưu ý khi chọn` hoặc `Checklist quyết định` khi cần, nhưng không giả FAQ.

7. **Cô đọng và giá trị hơn**
   - Giảm các đoạn filler.
   - Tăng đoạn chỉ ra khác biệt, tiêu chí chọn, ngữ cảnh dùng, sai lầm cần tránh.

## Execution Preview
1. Refactor title generation để ưu tiên category + differentiator.
2. Bỏ FAQ path khỏi article flow.
3. Xoá giá/doanh số khỏi compare/list renderer.
4. Đổi TOC ngang sang sidebar dọc đánh số.
5. Đổi wrappers từ card-heavy sang editorial-flow spacing.
6. Đánh số heading section rõ ràng `1) 2) 3)`.
7. Static review + `bunx tsc --noEmit`.

## Acceptance Criteria
1. Tiêu đề bài không còn chung chung; phải gắn được danh mục và điểm khác biệt.
2. Bài nhìn như 1 bài viết liền mạch, không như nhiều section card rời.
3. Mục lục nhanh là UI dọc đánh số, đề mục rõ ràng.
4. Các phần nội dung có heading kiểu `1) 2) 3)` hoặc bullet rõ nghĩa.
5. Không còn render giá, doanh số, FAQ hard-code.
6. Nội dung đọc cô đọng hơn và hữu ích hơn, bớt generic rõ rệt.

## Verification Plan
- Không chạy lint/unit/build theo guideline repo.
- Chạy `bunx tsc --noEmit`.
- Manual review checklist:
  - title của 3 template khác nhau;
  - bài category + compare;
  - mobile/desktop với TOC dọc;
  - confirm không còn giá/doanh số/FAQ.

## Out of Scope
- Không thay đổi backend fetch schema lớn.
- Không biến generator thành long-form technical article writer chuyên sâu domain-specific hoàn toàn.

## Risk / Rollback
- Risk: nếu bỏ quá nhiều visual separators, bài có thể hơi phẳng.
- Mitigation: chỉ giữ emphasis ở hero/compare/CTA, còn lại dùng typography hierarchy.
- Rollback: vẫn có thể giữ 1 mức wrapper nhẹ nếu flow quá phẳng sau review.
## TL;DR kiểu Feynman
- Mẫu HTML này **chưa tốt cho SEO rank Google** dù layout đã ổn hơn trước.
- Điểm yếu lớn nhất không nằm ở CSS, mà ở **chất lượng nội dung và semantic signal**: title/heading vô nghĩa, intent lẫn lộn, text bị lẫn HTML rác.
- Nếu giữ kiểu `1) Mở bài ngắn gọn`, `2) Nhóm lựa chọn nổi bật` thì Google vẫn đọc được, nhưng bài khó cạnh tranh vì thiếu ngôn ngữ tự nhiên và thiếu chiều sâu truy vấn.
- Có thể giữ ảnh trong nội dung, nhưng phải chặn việc ảnh/HTML editor bị chui vào đoạn tóm tắt, ô table và heading.
- Em đề xuất sửa generator theo hướng **editorial SEO**: heading tự nhiên hơn, narrative cuốn hơn, text sạch hơn, hashtag sinh động từ dữ liệu thật thay vì spam bán hàng.

## Audit Summary
### Observation
1. **Title/H1 hiện tại chưa ổn cho SEO**
   - `So sánh Bộ Trao Đổi Nhiệt Dạng Ống và Van / Control Vavle: khác biệt ở hiệu suất ổn định trong dài hạn`
   - Có lỗi chính tả/chuẩn hóa entity (`Vavle`), dấu `/` gây cảm giác dữ liệu thô, phrasing chưa tự nhiên.
   - Intent đang lẫn giữa so sánh kỹ thuật và bài shortlist bán hàng.
2. **H2/section title quá generic, thiếu search value**
   - Các heading như `Mở bài ngắn gọn`, `Nhóm lựa chọn nổi bật`, `Hành động đề xuất` không mang keyword phụ, không giống cách người dùng tìm kiếm.
   - Đây là heading “khung hệ thống”, không phải heading “nội dung SEO”.
3. **Có HTML bẩn lọt vào text**
   - Trong card summary, section text, comparison table đang có `<img ...>` hoặc `<p><br></p>` bị render thành nội dung văn bản/tóm tắt.
   - Đây là tín hiệu xấu cho chất lượng nội dung và readability.
4. **Compare table chưa sạch semantic**
   - Dù policy mong muốn là text-only, dữ liệu mô tả sản phẩm vẫn có HTML ảnh lọt vào cell table.
   - Root cause là summary source chưa được sanitize theo ngữ cảnh render.
5. **Hashtag đang sai intent SEO B2B/B2B-ish**
   - Bộ hashtag kiểu `#giatot #khuyemai #dangmua` không ăn nhập với query kỹ thuật như bộ trao đổi nhiệt / control valve.
   - Nếu giữ hashtag, nên sinh từ category, use case, entity, application, problem statements.
6. **Narrative hiện tại hơi cơ khí**
   - Nhiều đoạn như template bot: “lọc nhanh”, “đáng cân nhắc”, “thực dụng, dễ triển khai”.
   - Chưa tạo cảm giác bài thật sự giải quyết câu hỏi người dùng.

### Inference
- Root cause chính không phải giao diện, mà là **content contract của generator đang ưu tiên slot machine structure hơn search intent + editorial semantics**.
- Hệ thống hiện sinh “slot title” để dễ ráp layout, nhưng chưa map slot đó thành **SEO headings tự nhiên** theo template type và keyword context.
- Product description/source text chưa có tầng normalize riêng cho các ngữ cảnh: plain summary, table cell, intro sentence, CTA label, hashtag seed.

### Decision
- Sửa generator theo 3 trục:
  1. **Semantic SEO**: title/H2/H3 tự nhiên, đúng intent truy vấn.
  2. **Content hygiene**: lọc HTML rác theo từng ngữ cảnh render, vẫn cho phép ảnh ở block riêng.
  3. **Editorial quality**: copy cuốn hút hơn, bớt máy móc, hashtag sinh từ dữ liệu động có nghĩa.

## Root Cause Confidence
**High** — evidence trực tiếp nằm ở:
- `lib/posts/generator/variant-synthesizer.ts`: mapping heading generic (`Mở bài ngắn gọn`, `Nhóm lựa chọn nổi bật`...).
- `lib/posts/generator/assembler.ts`: summary/table đang lấy từ `description` rồi truncate mà chưa sanitize theo context.
- `lib/posts/generator/phrase-banks.ts`: hashtag set tĩnh thiên sale, không theo entity/category/use-case.

## Counter-Hypothesis
- Chỉ cần sửa CSS/UI là bài sẽ ổn SEO.  
  **Bác bỏ:** Google rank chủ yếu theo intent, semantic coverage, content quality, clarity, internal relevance. CSS đẹp hơn không chữa được heading vô nghĩa, title sai entity, hay `<img>` rơi vào summary/table.

## Đánh giá nhanh: nội dung hiện tại tốt cho SEO không?
**Kết luận ngắn: Chưa tốt để rank mạnh.**

### Điểm ổn
- Có 1 `h1`, có cấu trúc section rõ.
- Có TOC và nhiều khối nội dung, giúp bài nhìn “đủ dài”.
- Có internal link sang trang sản phẩm.
- Có compare intent, đây là một search intent có giá trị.

### Điểm chưa ổn
- H1 chưa tự nhiên, còn lỗi entity/chính tả.
- H2/H3 quá generic, không thêm topical relevance.
- Nội dung lặp phrase công thức, thiếu thông tin quyết định mua/chọn.
- HTML rác lọt vào text và table.
- Hashtag đang làm loãng intent chuyên ngành.
- CTA lặp lại nhiều nhưng chưa tạo thêm semantic value.

### Confidence
**High** — vì các lỗi đều nhìn thấy trực tiếp trong HTML anh gửi, không cần suy đoán thêm.

## Files Impacted
### Shared / Generator
- **Sửa lớn:** `lib/posts/generator/variant-synthesizer.ts`  
  Vai trò hiện tại: sinh title theo slot và đoạn nội dung cơ bản.  
  Thay đổi: thay các heading generic bằng heading tự nhiên theo search intent, category, compare mode, use case, budget context.

- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: ráp HTML, lấy summary từ description, render compare/table/hashtags.  
  Thay đổi:
  - thêm helper sanitize text theo từng context (`plain`, `table`, `card-summary`, `heading-source`);
  - chặn `<img>`, empty paragraph, block thừa khỏi summary/table;
  - chỉ cho ảnh xuất hiện ở image/gallery block, không lẫn vào cell text;
  - tinh chỉnh intro/CTA copy để đỡ template-bot.

- **Sửa vừa:** `lib/posts/generator/phrase-banks.ts`  
  Vai trò hiện tại: phrase banks + hashtag sets tĩnh.  
  Thay đổi: thay hashtag sale-spam bằng logic seed hashtag động từ category/use-case/entity/application/problem.

- **Sửa vừa:** `lib/posts/generator/macro-templates.ts`  
  Vai trò hiện tại: giữ title patterns/description templates.  
  Thay đổi: chỉnh pattern để title/H1 nghe tự nhiên hơn với bài compare và technical product pages.

### Optional shared utils
- **Có thể thêm nhẹ:** helper sanitize riêng trong `lib/posts/generator/*` hoặc tận dụng utils sẵn có nếu đủ.  
  Vai trò hiện tại: chưa có tầng normalize theo ngữ cảnh nội dung.  
  Thay đổi: gom logic strip/normalize HTML để dùng nhất quán.

## Proposal chi tiết
### 1. Heading phải nghe như bài thật, không như khung CMS
Ví dụ thay:
- `Mở bài ngắn gọn` → `Nên chọn bộ trao đổi nhiệt dạng ống hay van điều khiển?`
- `Nhóm lựa chọn nổi bật` → `Các lựa chọn đáng cân nhắc trong cùng bài toán vận hành`
- `Hành động đề xuất` → `Khi nào nên xem chi tiết từng phương án`
- `Gợi ý theo ngân sách` → `Chọn theo chi phí đầu tư và chi phí vận hành`
- `Tiêu chí chọn nhanh` → `5 tiêu chí quan trọng trước khi quyết định`

Nguyên tắc:
- Heading phải chứa entity/category/use case khi phù hợp.
- Không dùng heading rỗng chức năng nội bộ.
- So sánh vs shortlist vs budget phải có voice riêng.

### 2. Làm sạch text theo ngữ cảnh, không cấm ảnh toàn cục
User đã chốt: ảnh vẫn OK. Vậy em sẽ:
- **Giữ ảnh** ở hero/gallery/spotlight blocks.
- **Bỏ ảnh khỏi**:
  - table cell,
  - card summary,
  - intro sentence,
  - bullet text,
  - excerpt/meta description.
- Loại bỏ các rác kiểu `<p><br></p>`, HTML editor trống, inline image blob trong text summary.

### 3. Viết bài “cuốn hút” hơn nhưng vẫn SEO-first
Thay vì văn phong bot như:
- “lọc nhanh”, “đáng cân nhắc”, “thực dụng, dễ triển khai” lặp đi lặp lại

Sẽ chuyển sang pattern editorial:
- mở đầu nêu tình huống chọn sai / bài toán thực tế,
- sau đó giải thích điểm khác nhau quan trọng,
- rồi mới shortlist / compare / CTA,
- kết bài chốt ai nên chọn phương án nào.

### 4. Hashtag động đúng dữ liệu
Không dùng bộ hashtag sale-spam random nữa.
Sinh hashtag từ:
- categoryName
- keyword / useCase
- product entities chính
- ngành / ứng dụng / problem phrase nếu có

Ví dụ logic:
- `#botraodoinhiet`
- `#vandieukhien`
- `#hethongnhiet`
- `#toiuuvanhanh`
- `#thietbitraodoinhiet`

Có normalize bỏ dấu/ký tự lỗi nhưng vẫn ưu tiên readable slug-style.

### 5. Tối ưu compare intent để rank tốt hơn
Bài compare nên có minimum semantic pack:
- khác nhau ở đâu,
- khi nào chọn A,
- khi nào chọn B,
- tiêu chí kỹ thuật chính,
- chi phí vận hành/bảo trì nếu có,
- kết luận theo use case.

Generator nên ép bài compare sinh đúng các block này, thay vì block generic như bài top-list.

## Execution Preview
1. Đọc lại `variant-synthesizer.ts` để thay slot heading contract từ generic sang SEO-natural.
2. Đọc `assembler.ts` để thêm text sanitization theo context trước khi render summary/table/excerpt.
3. Chỉnh `phrase-banks.ts` để bỏ hashtag sale-spam, chuyển sang seed động theo dữ liệu thật.
4. Chỉnh `macro-templates.ts` để title/H1 compare nghe tự nhiên hơn và đúng entity.
5. Static review toàn flow generator để tránh ảnh/HTML rác chui lại vào text blocks.
6. Chạy `bunx tsc --noEmit`.
7. Commit kèm spec v7.

## Acceptance Criteria
1. H1/H2 không còn kiểu generic như `Mở bài ngắn gọn`, `Nhóm lựa chọn nổi bật`, `Hành động đề xuất`.
2. Compare article có heading tự nhiên, bám search intent hơn.
3. Không còn `<img>` hoặc HTML editor rác trong:
   - card summary,
   - table cell,
   - intro text,
   - excerpt/meta description.
4. Ảnh vẫn xuất hiện bình thường ở hero/gallery/spotlight blocks.
5. Hashtag được sinh từ dữ liệu động, không còn bộ hashtag sale-spam tĩnh.
6. Nội dung đọc tự nhiên hơn, bớt template-bot và tăng khả năng rank Google.

## Verification Plan
- Chạy `bunx tsc --noEmit`.
- Manual check 3 loại bài:
  - compare,
  - top list,
  - budget/category.
- Kiểm tra HTML output không còn `Mở bài ngắn gọn`, `Nhóm lựa chọn nổi bật`.
- Kiểm tra không có `<img>` trong table cells / summary paragraphs.
- Kiểm tra hashtag cuối bài đổi theo category/use-case thực tế.

## Out of Scope
- Không làm lại toàn bộ keyword research engine.
- Không thay đổi UI preview lớn.
- Không thêm AI rewrite service mới.

## Risk / Rollback
- Risk: sanitize quá mạnh có thể làm summary quá ngắn nếu nguồn description toàn HTML editor.
- Mitigation: fallback sang plain summary mặc định có ý nghĩa khi text sạch quá ít.
- Rollback: có thể giữ sanitize cho table/card trước, rồi mở rộng dần sang intro/excerpt nếu cần.
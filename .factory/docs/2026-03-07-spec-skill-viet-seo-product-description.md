## Problem Graph
1. [Tạo skill mới viết mô tả sản phẩm chuẩn SEO cho web] <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Chốt scope skill và trigger activation] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Skill phải đủ hẹp để auto-activate đúng ngữ cảnh “viết mô tả sản phẩm SEO” nhưng vẫn bao phủ đặc thù ecommerce Việt
   1.2 [Tổng hợp best practice từ docs-seeker + web research] <- depends on 1.2.1, 1.2.2
      1.2.1 [Google/ecommerce SEO principles]
      1.2.2 [Marketplace/Shopy-like listing heuristics]
   1.3 [Thiết kế cấu trúc SKILL.md và workflow viết nội dung]
   1.4 [Chuẩn bị ví dụ, checklist, và tiêu chí output tiếng Việt]

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Skill này không nên quá rộng kiểu “SEO content”, mà phải tập trung đúng 1 capability: viết mô tả sản phẩm ecommerce chuẩn SEO bằng tiếng Việt.
   - Action: Tạo project skill mới trong `.factory/skills/` với scope Website SEO-first, output mặc định là “chỉ mô tả sản phẩm”, ngôn ngữ chính là tiếng Việt.
   - Reflection: ✓ Valid — đúng yêu cầu user, tránh conflict với các skill content khác.

2. Solving 1.2.1...
   - Thought: Best practice cốt lõi phải bám nguồn đáng tin cho SEO product page.
   - Action: Skill sẽ nhúng các nguyên tắc đã research: viết unique content, ưu tiên transactional intent, dùng từ khóa tự nhiên, làm rõ benefit + specification, tránh thin/duplicate content, và nếu có context web thì align với Product structured data/merchant data của Google (title, description, brand, variant, specs, availability logic ở mức nội dung).
   - Reflection: ✓ Valid — phù hợp xu hướng Google 2026: helpful content, semantic relevance, structured product information.

3. Solving 1.2.2...
   - Thought: User muốn kiểu “mô tả shopee chuẩn chỉ”, nên skill cần hấp thụ tư duy marketplace dù ưu tiên website SEO-first.
   - Action: Thêm guideline phụ trong skill: dùng từ khóa high-intent, ưu tiên cụm danh từ người mua thật sự search, đặt thuộc tính quan trọng sớm, nêu rõ công dụng/đối tượng dùng/chất liệu-kích thước-cách dùng, tránh keyword stuffing, tránh claim mơ hồ/vi phạm, và giữ câu văn scan-friendly.
   - Reflection: ✓ Valid — đủ học từ marketplace nhưng không biến skill thành Shopee-only.

4. Solving 1.3...
   - Thought: Nên tái dùng pattern của `skill-writer`: frontmatter rõ trigger + nội dung step-by-step + examples/checklists.
   - Action: Tạo skill mới, đề xuất tên: `viet-seo-product-description`.
     Nội dung SKILL.md sẽ gồm:
     - Frontmatter:
       - `name: viet-seo-product-description`
       - `description:` nêu rõ skill viết mô tả sản phẩm chuẩn SEO cho website ecommerce bằng tiếng Việt; dùng khi user nhờ viết mô tả sản phẩm, mô tả chuẩn SEO, mô tả bán hàng, mô tả Shopee/Lazada/TikTok Shop nhưng muốn câu chữ vẫn dùng tốt cho web.
     - Sections chính:
       1. Overview
       2. When to use this skill
       3. Inputs required
       4. Workflow viết mô tả
       5. Keyword & search intent rules
       6. Writing formula
       7. SEO + conversion checklist
       8. Compliance / things to avoid
       9. Output template
       10. Examples
   - Reflection: ✓ Valid — đúng pattern skill-writer, dễ discover, dễ maintain.

5. Solving 1.4...
   - Thought: Skill mạnh hay không nằm ở quy trình viết cụ thể, không chỉ slogan.
   - Action: Trong SKILL.md, mình sẽ chỉ định workflow thực thi rõ ràng như sau:
     - Bước 1: Thu thập input tối thiểu
       - Tên sản phẩm
       - Ngành hàng/danh mục
       - Đối tượng mua
       - Chất liệu/thành phần/thông số
       - Điểm khác biệt
       - Từ khóa chính
       - Từ khóa phụ/biến thể
       - Giọng văn thương hiệu
       - Kênh dùng (web, Shopee, both)
     - Bước 2: Nếu thiếu input quan trọng, Claude phải hỏi bù ngắn gọn trước khi viết.
     - Bước 3: Phân tích intent keyword theo 3 lớp:
       - Head term: danh mục chính
       - Modifier: chất liệu/công dụng/đối tượng/kích thước
       - Conversion terms: chính hãng, cao cấp, bền, tiện lợi... nhưng chỉ dùng khi có căn cứ
     - Bước 4: Lập outline mô tả:
       - Hook mở đầu ngắn
       - Đoạn benefit chính
       - Đoạn feature/spec
       - Đoạn usage / fit / use case
       - Đoạn trust / lưu ý / bảo quản nếu phù hợp
     - Bước 5: Viết mô tả theo nguyên tắc:
       - Human-first, scan-friendly
       - 1 keyword chính xuất hiện tự nhiên ở đầu hoặc sớm trong đoạn
       - Từ khóa phụ phân bố tự nhiên, không nhồi nhét
       - Ưu tiên lợi ích trước, thông số sau
       - Cụ thể hóa bằng facts thay vì tính từ rỗng
       - Không copy pattern máy móc giữa các sản phẩm
     - Bước 6: Tự kiểm tra trước khi trả kết quả:
       - Có đúng intent mua hàng?
       - Có nêu rõ sản phẩm là gì, dành cho ai, vì sao nên mua?
       - Có điểm khác biệt và thông tin ra quyết định?
       - Có câu nào spam keyword / quá quảng cáo / claim không chứng minh được?

6. Best practices sẽ được đóng gói trực tiếp vào skill
   - SEO/content principles:
     - Unique description, không generic/thin content
     - Match search intent giao dịch
     - Semantic coverage: đồng nghĩa gần, biến thể thuộc tính, ngữ cảnh sử dụng
     - Readability cao: câu ngắn, cụm ý rõ, dễ scan trên mobile
     - Benefit > feature, nhưng vẫn đủ specs để quyết định mua
   - E-commerce conversion principles:
     - Chạm pain point hoặc nhu cầu sử dụng thật
     - Làm rõ đối tượng phù hợp/không phù hợp
     - Giảm do dự bằng thông tin cụ thể: chất liệu, size, công dụng, cách dùng, bảo quản, combo/đóng gói nếu có
   - Marketplace-informed principles:
     - Từ khóa gần hành vi search thực
     - Thuộc tính quan trọng xuất hiện sớm
     - Không spam dấu câu, viết hoa, superlatives vô căn cứ

7. Những file sẽ tạo khi implement
   - `.factory/skills/viet-seo-product-description/SKILL.md`
   - Có thể thêm 1 file phụ nếu cần progressive disclosure:
     - `.factory/skills/viet-seo-product-description/examples.md`
     Hoặc giữ single-file nếu nội dung vừa đủ, ưu tiên KISS.
   - Vì repo có rule plan/spec đặt ở `.factory/docs`, khi implement mình cũng sẽ tạo spec note tương ứng tại:
     - `.factory/docs/spec-skill-viet-seo-product-description.md`
     để lưu lại blueprint đã duyệt.

8. Nội dung output mặc định mà skill sẽ ép Claude trả về
   - Vì bạn chọn “chỉ mô tả sản phẩm”, default output sẽ là:
     - 1 phiên bản mô tả hoàn chỉnh tiếng Việt
     - không bắt buộc title/meta/FAQ
   - Nhưng skill sẽ có nhánh mở rộng: nếu user yêu cầu thì mới sinh thêm short description, bullet benefits, keyword cluster, hoặc marketplace adaptation.

9. Ví dụ activation phrases sẽ được nhúng vào description để skill dễ được gọi
   - “viết mô tả sản phẩm chuẩn SEO”
   - “viết content sản phẩm cho web”
   - “viết mô tả bán hàng”
   - “viết mô tả sản phẩm kiểu shopee nhưng chuẩn web”
   - “tối ưu mô tả sản phẩm theo từ khóa”

10. Verification plan sau khi implement
   - Đọc lại SKILL.md để kiểm tra frontmatter, trigger words, naming rule
   - Chạy `bunx tsc --noEmit` chỉ nếu có đụng file TS/code khác; nếu chỉ thêm markdown skill/spec thì không chạy theo rule repo
   - Test activation bằng 2-3 prompt mẫu để xác nhận skill discover đúng intent
   - Sau đó commit local kèm `.factory/docs` theo rule repo

## Checklist chốt cho user
- [x] Skill mới sẽ là project skill
- [x] Ưu tiên Website SEO-first
- [x] Ngôn ngữ chính: Tiếng Việt
- [x] Output mặc định: chỉ mô tả sản phẩm
- [x] Vẫn hấp thụ tư duy marketplace/Shopee về keyword, intent, conversion
- [x] Có workflow rõ để hỏi input thiếu, phân tích keyword, viết mô tả, tự QA
- [x] Bám best practice từ Google/ecommerce + heuristic marketplace 2026

## Best-practice synthesis mình sẽ áp dụng vào skill
- Viết cho người mua trước, máy tìm kiếm sau
- Unique description, không lặp mô típ rỗng
- Ưu tiên transactional intent và modifier có ý định mua
- Dùng từ khóa tự nhiên, semantic chứ không nhồi exact match
- Nêu lợi ích, use case, thông số, và điểm khác biệt thật
- Tránh claim tuyệt đối/khó chứng minh như “số 1”, “tốt nhất”, “100% hiệu quả” nếu không có bằng chứng
- Tối ưu cho mobile readability vì hành vi đọc sản phẩm chủ yếu scan nhanh

Nếu bạn duyệt spec này, bước implement tiếp theo mình sẽ tạo skill mới theo đúng cấu trúc trên, thêm ví dụ kích hoạt, rồi commit local theo rule của repo.
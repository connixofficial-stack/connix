# I. Primer
## 1. TL;DR kiểu Feynman
- UI chi tiết sản phẩm hiện đang bị “cắt khúc”: text đầu, mô tả chính, text cuối, FAQ và ảnh đang tách thành nhiều khối nên nhìn rời rạc.
- Có thêm chữ hardcode như `Mô tả sản phẩm`, `Toàn bộ ảnh sản phẩm`, `Lăn xuống để xem đầy đủ bộ ảnh sản phẩm.` làm giao diện bị thô và không đúng ý content-driven.
- FAQ admin hiện cho nhập bằng rich editor dù dữ liệu thực tế chỉ cần text thường; ở site thì FAQ render dạng card tĩnh, chưa đẹp.
- Mình sẽ đổi sang flow mới: `text đầu + mô tả chính + text cuối + toàn bộ ảnh` nằm chung một khối mô tả; FAQ tách riêng nhưng render accordion gọn đẹp theo pattern tham chiếu từ `wincellarClone`; admin FAQ đổi về input text thường.

## 2. Elaboration & Self-Explanation
Qua audit, code trang site product detail ở `app/(site)/products/[slug]/page.tsx` hiện có một helper `ProductSupplementalContentSection()` đang render `preContent`, `faqItems`, `postContent` thành các card riêng. Đồng thời trong cả 3 style (classic / modern / minimal), `preContent` được render trước block mô tả, còn `postContent` + `faqItems` render sau block mô tả.

Điều này tạo ra đúng cảm giác bạn nói: nội dung bị chia cụm, không liền mạch với description. Ngoài ra block mô tả hiện còn hardcode heading/subheading cho mô tả và ảnh sản phẩm.

Hướng sửa hợp lý nhất là tách trách nhiệm rõ hơn:
1. Tạo một render path cho **main description block** gồm `preContent -> product description -> postContent -> all product images`.
2. Tạo một render path riêng cho **FAQ accordion**.
3. Đổi admin FAQ editor từ `LexicalEditor` sang text inputs đơn giản vì answer chỉ là plain text.

Điểm quan trọng: theo yêu cầu của bạn, phần `toàn bộ hình ảnh` vẫn nằm sau cùng trong khối mô tả; mình chỉ bỏ hardcode label, không đụng logic ảnh và không đổi vị trí tương đối của ảnh trong flow đó.

## 3. Concrete Examples & Analogies
- Trước sửa, luồng render đang là:
  - card `preContent`
  - block `Mô tả sản phẩm`
  - card `FAQ + postContent`
- Sau sửa, luồng render sẽ là:
  - một block duy nhất chứa `preContent + description + postContent + images`
  - dưới đó là `FAQ accordion` nếu có

Ví dụ thực tế theo yêu cầu của bạn:
- `Chào mừng bạn đến với Thần Shoes!` (text đầu)
- mô tả sản phẩm gốc
- `Kết thúc với ...` (text cuối)
- toàn bộ ảnh sản phẩm
=> tất cả nằm trong cùng một khối expand/collapse, không bị ngắt quãng.

Analogy đời thường: thay vì một bài viết bị cắt thành 3 tờ giấy rời rồi dán ảnh ở chỗ khác, mình ghép lại thành 1 bài hoàn chỉnh; FAQ thì chuyển sang kiểu “hỏi gì mở nấy” giống accordion nên gọn mắt hơn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Site thật hardcode các label `Mô tả sản phẩm`, `Toàn bộ ảnh sản phẩm`, `Lăn xuống để xem đầy đủ bộ ảnh sản phẩm.` trong `app/(site)/products/[slug]/page.tsx`.
  - `preContent` và `postContent` đang được render qua `ProductSupplementalContentSection()` ở ngoài block mô tả, nên bị tách rời.
  - FAQ trong site đang render thành card tĩnh trong cùng helper trên.
  - FAQ trong admin settings đang dùng `LexicalEditor` cho answer.
- Evidence:
  - `ProductDescriptionImages()` chứa hardcode heading/subtext cho phần ảnh.
  - `ClassicStyle`, `ModernStyle`, `MinimalStyle` đều render `preContent` trước block mô tả và `faq/post` sau block mô tả.
  - `ProductSupplementalContentSection()` render `preContent`, `faqItems`, `postContent` dưới dạng các block độc lập.
  - `ProductSupplementalContentManager.tsx` đang dùng `LexicalEditor` cho `faq.answer`.
- Inference:
  - Vấn đề không nằm ở dữ liệu supplemental content, mà ở cách composition UI đang chia nội dung sai tầng.
- Decision:
  - Refactor composition ở site page và đơn giản hóa input FAQ ở admin.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root cause (High): `preContent/postContent/faq/images` đang bị render bởi các helper riêng, ở các vị trí khác nhau trong layout, làm mất tính liên tục của mô tả sản phẩm.
- Root cause (High): FAQ answer bị model như rich text trong admin dù use case thực chỉ cần plain text, dẫn tới editor nặng và UX nhập liệu không phù hợp.
- Counter-hypothesis 1: Vấn đề chỉ do CSS spacing.
  - Loại trừ: ngay cả khi giảm spacing, nội dung vẫn đang nằm ở các block/section khác nhau.
- Counter-hypothesis 2: Chỉ cần bỏ heading hardcode là đủ.
  - Loại trừ: nếu không đổi composition, `text đầu` và `text cuối` vẫn còn tách khỏi mô tả.
- Counter-hypothesis 3: FAQ xấu chỉ do màu sắc.
  - Loại trừ: pattern card tĩnh hiện tại khác hẳn accordion reference trong repo tham chiếu.

# IV. Proposal (Đề xuất)
- Option A (Recommend) — Confidence 93%
  - Refactor site page để gộp `preContent + description + postContent + images` vào cùng description block cho cả 3 style; FAQ render bằng accordion riêng; admin FAQ đổi sang question/answer text input thường.
  - Evidence: đúng với scope bạn đã chốt, sửa trúng root cause composition, ít đụng backend/schema.
  - Tradeoff: phải chạm vài điểm render trong `page.tsx` thay vì chỉ sửa 1 helper.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/(site)/products/[slug]/page.tsx`
  - Vai trò hiện tại: render toàn bộ UI product detail cho các style classic/modern/minimal.
  - Thay đổi: bỏ hardcode label mô tả/ảnh; gộp `preContent` và `postContent` vào main description block; tách FAQ sang accordion UI mới; cập nhật các helper liên quan.

- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`
  - Vai trò hiện tại: quản lý CRUD template supplemental content trong admin settings.
  - Thay đổi: đổi FAQ answer từ `LexicalEditor` sang input text thường; giữ question là input text thường; update save/reset flow tương thích dữ liệu string hiện có.

- Sửa: `lib/products/product-supplemental-content.ts`
  - Vai trò hiện tại: helper chuẩn hóa rich text + sort FAQ items.
  - Thay đổi: có thể giản lược helper rich text FAQ nếu sau refactor không còn dùng cho answer FAQ; giữ sort logic nếu vẫn cần.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại các điểm render supplemental content trong `app/(site)/products/[slug]/page.tsx` cho cả 3 style.
2. Tạo helper/UI path mới cho main description block: `preContent -> description -> postContent -> images`.
3. Bỏ hardcode heading/subtext của block mô tả và ảnh theo scope đã chốt.
4. Thay `FAQ` card list bằng accordion sạch, tham chiếu pattern từ `wincellarClone` nhưng bám token/style hiện tại của repo.
5. Đổi admin FAQ input từ `LexicalEditor` sang `Input` text thường.
6. Rà static lại imports, type usage và chỗ nào còn assume FAQ answer là rich text.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Verification tĩnh (theo repo rule, không tự chạy lint/build/test):
  - Check không còn hardcode `Mô tả sản phẩm`, `Toàn bộ ảnh sản phẩm`, `Lăn xuống để xem đầy đủ bộ ảnh sản phẩm.` ở site product page cho flow mô tả/ảnh liên quan scope này.
  - Check `preContent` và `postContent` không còn render qua section riêng tách khỏi block mô tả.
  - Check FAQ site dùng accordion state thay vì card tĩnh.
  - Check admin FAQ không còn dùng `LexicalEditor`.
- Repro thủ công cho tester:
  1. Vào product detail có supplemental content.
  2. Xác nhận text đầu + mô tả + text cuối + toàn bộ ảnh nằm trong cùng 1 block.
  3. Xác nhận không còn heading/phụ đề hardcode của mô tả/ảnh.
  4. Xác nhận FAQ hiển thị dạng accordion, click mở/đóng được.
  5. Vào `/admin/settings/product-supplemental-content`, xác nhận FAQ answer là input text thường.

# VIII. Todo
- [ ] Refactor render supplemental content trong site product detail.
- [ ] Bỏ hardcode label mô tả/ảnh theo scope.
- [ ] Đổi FAQ site sang accordion UI.
- [ ] Đổi FAQ admin sang input text thường.
- [ ] Static review imports/types/usages liên quan.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `preContent`, mô tả sản phẩm gốc, `postContent`, và toàn bộ ảnh sản phẩm nằm trong cùng một block mô tả.
- Không còn các label hardcode `Mô tả sản phẩm`, `Toàn bộ ảnh sản phẩm`, `Lăn xuống để xem đầy đủ bộ ảnh sản phẩm.` trong flow đã nêu.
- FAQ ở site hiển thị dạng accordion gọn đẹp, không còn card list thô hiện tại.
- FAQ ở admin settings dùng input text thường, không còn rich editor cho answer.
- Không thay đổi backend/schema và không ảnh hưởng logic chọn template theo product/category.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro trung bình-thấp: thay đổi chạm 3 style render trong cùng file lớn, dễ sót 1 style nếu không rà kỹ.
- Rủi ro dữ liệu thấp: answer FAQ vẫn là string nên không cần migration schema.
- Rollback: revert commit là quay về UI cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Không redesign toàn bộ product detail page ngoài các vùng supplemental content/FAQ liên quan.
- Không thay đổi logic ảnh, lightbox, gallery hay vị trí business của related products/comments.
- Không đổi Convex schema hoặc mutation/query backend.

# XII. Open Questions (Câu hỏi mở)
- Không còn câu hỏi mở quan trọng; scope đã đủ rõ để implement.
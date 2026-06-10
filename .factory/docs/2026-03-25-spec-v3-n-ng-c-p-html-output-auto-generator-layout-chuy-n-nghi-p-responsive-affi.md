## TL;DR kiểu Feynman
- Bản HTML hiện tại đúng là còn rất tệ: ảnh thả tự do, list/menu xấu, thiếu layout system, thiếu responsive thật sự.
- Root cause không nằm ở “thiếu vài class” mà ở việc generator đang nhả ra **HTML thô kiểu text-first**, không có component contract cho card/table/carousel/badge/button.
- Em sẽ refactor sang kiểu **section-based design system**: mỗi section sinh ra block có layout rõ (hero, cards, compare table, affiliate cards, FAQ, CTA, hashtag chips).
- Ảnh sẽ không còn “từa lưa”: thay bằng rule layout học từ product-list/home-component, có random có kiểm soát giữa hero/card/carousel/bento chứ không random bừa.
- Affiliate mode sẽ có nút `Mua ngay` nổi trên ảnh + nút phụ `Xem chi tiết`, màu sắc và hierarchy rõ.

## Audit Summary
### Observation
1. `lib/posts/generator/assembler.ts`
   - Đang ghép HTML trực tiếp bằng chuỗi `<figure><img/></figure><p>...</p>`.
   - Không có wrapper layout classes cho section, không có grid/card/table chuẩn, không có responsive strategy.
   - TOC/menu hiện chỉ là `<nav><ul><li>` thô nên nhìn như bullet list mặc định của browser.
2. `buildProductListHtml()`
   - Render `<ul><li>` đơn giản, chưa phải product card chuyên nghiệp.
   - CTA affiliate chỉ là text link xanh, chưa phải button hierarchy.
3. `buildComparisonHtml()`
   - Có bảng nhưng chưa có style/table wrapper/responsive overflow/proper emphasis.
4. `media-plan.ts`
   - Mới dedupe ảnh, nhưng chưa có semantic layout cho ảnh (hero/thumbnail/gallery/carousel rail).
5. `app/admin/posts/create/page.tsx`
   - Preview đang render HTML raw trong container text-sm chung, nên dù HTML có khá hơn vẫn khó nhìn nếu không có class system rõ.
6. Evidence từ repo:
   - `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx` có pattern tốt hơn: featured card, carousel rail, aspect ratio ổn, CTA overlay, hierarchy rõ.
7. Web research 2026:
   - SaaS/article design best practices đang nghiêng về: clarity-first, modular sections, limited carousel use, strong card hierarchy, responsive comparison tables, consistent chip/badge/button system.
   - Carousel chỉ hiệu quả khi là rail rõ ràng có snap/controls; không nên biến toàn bài thành ảnh cuộn linh tinh.

### Inference
- Lỗi chính: generator đang sinh “nội dung HTML” chứ chưa sinh “UI-ready article sections”.
- Nói thẳng: output hiện tại vẫn mang cảm giác rác vì thiếu design contract, thiếu visual grammar, thiếu block semantics.

### Tự chê bản thân 100%
- Em đã fix logic dữ liệu và HTML-first nhưng **đánh giá quá thấp phần presentation layer**.
- Em đang sinh HTML kiểu dev utility, không phải editorial/product marketing quality.
- Em có học được từ data nhưng **chưa học từ chính pattern tốt sẵn có trong repo** như anh nhắc.
- Nếu nhìn theo tiêu chuẩn SaaS/editorial 2026 thì bản output hiện tại **không pass** ở hierarchy, CTA, scanability, image system, responsive table, visual polish.
- Kết luận thẳng: cần một vòng refactor nữa, lần này lấy **layout system làm trung tâm**, không tiếp tục vá lẻ.

## Root Cause Confidence
**High** — vì evidence trực tiếp trong `assembler.ts` cho thấy đang render primitive HTML tags không có layout primitives/card system/table system/button system.

## Counter-Hypothesis
- Chỉ cần thêm CSS nhẹ vào HTML hiện tại là đủ.  
  **Bác bỏ:** CSS nhẹ không cứu được semantic structure yếu. Nếu DOM vẫn là `ul/li + img + p` rời rạc thì chỉ “trang điểm cho rác”, không thành editorial layout chuyên nghiệp.

## Decision
- Chuyển từ `string fragments` sang **HTML section renderer có preset layout**.
- Random sẽ là **controlled random**: chọn giữa vài layout đẹp đã định nghĩa, không random tự do.

## Files Impacted
### Generator core
- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: ghép HTML thô theo slot.  
  Thay đổi: tách render helpers theo section type (`renderHeroSection`, `renderProductCardsSection`, `renderComparisonSection`, `renderFaqSection`, `renderAffiliateRail`, `renderHashtagChips`). Mỗi helper output class contract chuẩn, responsive, đẹp hơn.

- **Sửa vừa:** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: payload chỉ giữ html + warnings.  
  Thay đổi: thêm `layoutMeta`/`sectionVariant` để biết section đang dùng preset nào, giúp preview/debug rõ hơn.

- **Sửa vừa:** `lib/posts/generator/media-plan.ts`  
  Vai trò hiện tại: chỉ chọn ảnh nào dùng.  
  Thay đổi: chọn cả `presentation role` cho ảnh: hero / card / gallery / carousel. Random có kiểm soát, học từ pattern home-component.

- **Sửa nhẹ:** `lib/posts/generator/link-plan.ts`  
  Vai trò hiện tại: trả danh sách link đơn giản.  
  Thay đổi: enrich CTA metadata cho affiliate/non-affiliate (`primaryLabel`, `secondaryLabel`, `kind`).

- **Sửa nhẹ:** `lib/posts/generator/variant-synthesizer.ts`  
  Vai trò hiện tại: sinh đoạn text cho slot.  
  Thay đổi: bổ sung heading/subheading ngắn hơn, bullet highlights đẹp hơn cho table/cards.

### UI preview
- **Sửa vừa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: preview HTML trong container text thường.  
  Thay đổi: bọc preview bằng article preview shell có class scope riêng (`generated-article-preview`), thêm CSS utility hook nếu cần để render đúng spacing/table/button/chips.

### Shared styling
- **Thêm mới hoặc sửa nhẹ:** một file style/article-preview helper phù hợp pattern repo  
  Vai trò: gom class tokens/layout classes cho generated article để không hard-code loạn trong assembler.  
  Ghi chú: sẽ ưu tiên cách ít xâm lấn nhất, có thể là helper map class strings thay vì mở rộng CSS toàn cục nếu repo không có pattern CSS module phù hợp.

## Hành vi mới đề xuất
1. **Hero section chuyên nghiệp**
   - 1 hero card lớn với ảnh chính theo ratio cố định.
   - Overlay nhẹ, badge danh mục, CTA rõ, excerpt ngắn dễ scan.

2. **Product blocks không còn list thô**
   - Top list sẽ render theo 1 trong các preset đẹp:
     - Featured + stacked cards
     - Responsive card grid
     - Horizontal affiliate rail
   - Random có kiểm soát, không phá UX.

3. **Ảnh có system rõ ràng**
   - Ảnh chuẩn ratio theo role.
   - Cho phép mix hero/card/carousel nhưng có guardrail để không loạn.
   - Học từ `product-list` home-component: aspect-square, featured card, snap carousel, overlay CTA.

4. **Comparison section chuyên nghiệp**
   - Table wrapper có overflow-x cho mobile.
   - Header nổi bật, zebra rows nhẹ, badge trạng thái, bullet notes dưới bảng.

5. **TOC/menu đẹp hơn**
   - Không còn bullet list mặc định.
   - Render thành chip/menu cards/anchor pills rõ hierarchy.

6. **Affiliate mode chuẩn bán hàng**
   - Nút `Mua ngay` nổi trên ảnh hoặc góc card.
   - Nút phụ `Xem chi tiết` ở footer card.
   - Nếu thiếu affiliateLink thì degrade graceful sang CTA phụ.

7. **Hashtag chips màu xanh**
   - Render dạng chip/badge, màu xanh, spacing đều, không plain text.

8. **Responsive-first thực sự**
   - Mobile: stack 1 cột, table scrollable, carousel snap.
   - Tablet/Desktop: bento/featured/grid tùy preset.

## Execution Preview
1. Audit lại pattern tốt từ `product-list` home-component để mượn layout primitives.
2. Tạo render helpers/preset map cho generated article sections.
3. Refactor top list / compare / CTA / hashtag / TOC sang HTML có structure chuẩn.
4. Bổ sung affiliate CTA hierarchy.
5. Cập nhật preview shell để render article giống giao diện thật hơn.
6. Static review responsive/null cases + `bunx tsc --noEmit`.

## Acceptance Criteria
1. Không còn ảnh thả rời rạc; mỗi section có layout rõ ràng, nhìn như bài editorial/product roundup chuyên nghiệp.
2. TOC/menu không còn bullet mặc định xấu; phải có format đẹp và scan nhanh.
3. Compare table có wrapper chuyên nghiệp, mobile không vỡ layout.
4. Affiliate mode có `Mua ngay` nổi bật + `Xem chi tiết` phụ ở từng sản phẩm.
5. Hashtag render dạng chip xanh, không phải plain text.
6. Có controlled-random layout đủ đa dạng nhưng vẫn ổn định, không loạn.
7. Preview trong `/admin/posts/create` nhìn gần với output mong muốn, không còn cảm giác “HTML rác”.

## Verification Plan
- Không chạy lint/unit/build theo guideline repo.
- Chạy `bunx tsc --noEmit`.
- Manual review checklist:
  - top list với 3–6 sản phẩm;
  - affiliate vs non-affiliate;
  - mobile width hẹp;
  - compare table;
  - hashtag chips xanh;
  - ảnh nguồn dọc/ngang/lẫn lộn.

## Out of Scope
- Không biến generator thành visual page builder full drag-drop.
- Không thêm thư viện carousel/UI mới nếu repo đã có pattern đủ dùng.

## Risk / Rollback
- Risk: HTML classes quá nhiều làm assembler khó bảo trì.
- Mitigation: gom class presets/helper constants thay vì nối chuỗi tùy hứng.
- Rollback: giữ fallback renderer cũ trong nội bộ nếu preset mới lỗi.

## Option đề xuất
- **Option A (Recommend) — Controlled editorial presets**: 3–4 preset layout đẹp, random có kiểm soát, bám pattern home-component. Confidence 90% vì cân bằng giữa đẹp, ổn định, dễ maintain.
- **Option B — Carousel-heavy article**: đẩy mạnh rail/carousel ở nhiều section. Confidence 55% vì sinh động nhưng dễ lạm dụng, UX/mobile và scanability kém hơn nếu dùng quá tay.
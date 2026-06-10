## TL;DR kiểu Feynman
- Ta xây “máy lắp ráp bài” trong Posts: mỗi bài ghép từ **7–10 cụm nội dung**, mỗi cụm có **100 biến thể khả dụng** (tạo bằng phrase-bank + rules, không phải viết tay 1000 câu/cụm).
- Bài sinh ra luôn kéo **ảnh thật của sản phẩm**, có phân phối ảnh theo cụm, có internal link, có chữ nhỏ/disclaimer, có thumbnail hợp lý.
- Tại `/system/modules/posts`: bật là dùng được toàn bộ engine; tắt là ẩn chức năng và quay về flow viết tay như cũ.
- Ở `/admin/posts/create`: có **Preview** + **Sinh lại mạnh** (regenerate với seed khác, thay đổi cấu trúc và câu chữ đáng kể).

## Audit Summary
### Observation
1. Posts module hiện chưa có setting cho auto-generator và chỉ có config/appearance (`lib/modules/configs/posts.config.ts`, `app/system/modules/posts/page.tsx`).
2. Create post hiện là form thủ công, chưa có preview/regenerate tự động (`app/admin/posts/create/page.tsx`).
3. Products đã có dữ liệu đủ để dựng nội dung + CTA + ảnh (`convex/schema.ts`, `convex/products.ts`).
4. Sale mode affiliate/internal đã có pattern xử lý ở frontend products, có thể tái sử dụng rule cho bài auto.

### Inference
- Cần một “composition engine” độc lập để bảo đảm đa dạng cao, có kiểm soát anti-spam, và có khả năng regenerate mạnh mà vẫn bám dữ liệu thật.

### Decision
- Dùng kiến trúc **Macro template (20 mẫu intent) + Slot engine (7–10 cụm) + Variant synthesizer (100 biến thể/cụm)**.

## Root Cause Confidence
**High** — vì thiếu hẳn lớp generator + settings + UI preview/regenerate; không phải bug đơn lẻ.

## Kiến trúc nội dung (đúng yêu cầu “100 loại mỗi cụm”)
### 1) 20 macro templates (intent-level)
Giữ full mix: transactional + informational + comparison (20 mẫu như spec trước).

### 2) 10 cụm chuẩn (slot families)
Mỗi bài chọn 7–10 slot trong 10 slot sau:
1. Hero hook
2. Pain/problem framing
3. Selection criteria
4. Top list block
5. Product spotlight card
6. Comparison matrix
7. Budget/value analysis
8. FAQ/objection handling
9. CTA + internal links
10. Tiny-note/disclaimer

### 3) “100 biến thể/cụm” theo cách scalable
- Không viết tay 100 đoạn hoàn chỉnh/cụm (khó maintain), mà dùng:
  - `core templates` (10–20 skeleton/cụm)
  - `phrase banks` (hook verbs, proof phrases, trust cues, urgency tones...)
  - `style transformers` (ngắn gọn/chuyên gia/thân thiện/bán hàng)
  - `data injectors` (tên SP, giá, sales, category, benefit)
- Engine tổ hợp có kiểm soát sẽ đảm bảo **>=100 biến thể hợp lệ/cụm**.
- Có `novelty score` + `similarity threshold` để reject bản sinh quá giống lần trước.

## Files Impacted
### Shared
- **Thêm:** `lib/posts/generator/types.ts` — kiểu dữ liệu cho macro/slot/variant/preview payload.
- **Thêm:** `lib/posts/generator/macro-templates.ts` — 20 intent templates.
- **Thêm:** `lib/posts/generator/slot-families.ts` — định nghĩa 10 slot + rules bắt buộc/tùy chọn.
- **Thêm:** `lib/posts/generator/variant-synthesizer.ts` — tạo >=100 biến thể/cụm từ phrase bank + style.
- **Thêm:** `lib/posts/generator/phrase-banks.ts` — kho cụm từ theo ngữ cảnh bán hàng/helpful.
- **Thêm:** `lib/posts/generator/assembler.ts` — lắp bài 7–10 cụm + anti-repeat + scoring.
- **Thêm:** `lib/posts/generator/media-plan.ts` — phân phối ảnh sản phẩm theo vị trí đoạn.
- **Thêm:** `lib/posts/generator/link-plan.ts` — internal links (/products/[slug], category pages, posts liên quan).
- **Thêm:** `lib/posts/generator/thumbnail.ts` — chọn thumbnail từ sản phẩm nổi bật + fallback.
- **Thêm:** `lib/posts/generator/disclaimer.ts` — chữ nhỏ (affiliate/minor note) theo mode.

### Server (Convex)
- **Sửa:** `convex/posts.ts`
  - thêm `generateFromProductsPreview` (trả payload preview đầy đủ)
  - thêm `regenerateFromDraftSeed` (sinh lại mạnh: đổi seed + đổi slot layout)
  - thêm `createFromGeneratedPayload` (lưu bài)
- **Sửa:** `convex/products.ts` (nhẹ)
  - query phụ trợ cho top sales / budget filter / use-case slice với limit cứng
  - chỉ lấy projection cần thiết để tối ưu bandwidth

### UI
- **Sửa:** `app/admin/posts/create/page.tsx`
  - thêm panel “Sinh tự động”
  - chọn template + params + số sản phẩm + tone
  - nút `Preview` và `Sinh lại mạnh`
  - hiển thị preview: title/excerpt/content/thumbnail/disclaimer/internal-links
  - nút `Áp dụng vào form`
- **Sửa:** `lib/modules/configs/posts.config.ts`
  - thêm settings:
    - `enableAutoPostGenerator` (toggle)
    - `generatorMaxSlots` (default 10)
    - `generatorMinSlots` (default 7)
    - `generatorDiversityLevel`
    - `generatorRegenerateStrength`
    - `generatorDefaultTone`
    - `generatorInternalLinkDensity`
- **Sửa:** `app/system/modules/posts/page.tsx`
  - thêm config tab custom cho generator
  - bật/tắt toàn bộ tính năng tại route này đúng yêu cầu

## Hành vi bắt buộc theo yêu cầu mới
1. **Bật/tắt module-level:**
   - OFF: ẩn UI generate/preview/regenerate ở admin posts create; không cho gọi mutation generate.
   - ON: full chức năng hoạt động.
2. **Ảnh sản phẩm phân phối:**
   - mỗi bài có media plan (hero image, inline images theo block, fallback ảnh đại diện).
3. **Internal links:**
   - tự cắm link nội bộ liên quan (SP chính, category, bài liên quan) với mật độ cấu hình được.
4. **Chữ nhỏ/disclaimer:**
   - luôn có block tiny-text cuối bài, đặc biệt khi affiliate mode.
5. **Thumbnail hợp lý:**
   - ưu tiên sản phẩm có score cao nhất; fallback sản phẩm đầu danh sách.
6. **Regenerate mạnh mẽ:**
   - đổi seed + đổi slot composition + đổi variant path + đổi phrasing profile.

## Acceptance Criteria
1. `/system/modules/posts` có toggle bật/tắt generator; OFF thì tính năng dừng đúng toàn bộ.
2. Mỗi preview sinh ra bài gồm 7–10 cụm và chứng minh được mỗi cụm có không gian >=100 biến thể khả dụng.
3. Bấm “Sinh lại mạnh” liên tiếp cho cùng input tạo ra output khác đáng kể (title/flow/phrasings/media distribution).
4. Bài có ảnh từ sản phẩm thật + thumbnail + internal links + tiny disclaimer.
5. Affiliate mode: CTA mua ngay chỉ render khi có `affiliateLink`; thiếu link thì omit CTA đúng rule.
6. Lưu bài từ payload generate thành công như flow tạo bài hiện tại.

## Execution Preview
1. Tạo generator core (types + templates + slot families + synthesizer + assemble).
2. Bổ sung convex preview/regenerate/create APIs.
3. Gắn UI create post cho preview + regenerate + apply.
4. Mở rộng settings posts module + wiring bật/tắt runtime.
5. Static self-review (typing/null-safety/fallback/limits).

## Verification Plan
- Không chạy lint/test/build theo guideline repo.
- Verify tĩnh: typing, null-safe, guard toggle OFF, limit query, anti-repeat threshold.
- Manual checklist cho tester:
  - Case ON/OFF toggle
  - Case regenerate 5 lần liên tiếp
  - Case affiliate link thiếu/đủ
  - Case budget + comparison + use-case

## Out of Scope
- Chưa làm bulk generate ở list page (phase sau).
- Chưa dùng external LLM (phase này deterministic-composition để kiểm soát chất lượng/rollback).

## Risk / Rollback
- Risk: output quá đa dạng nhưng lệch tone.
  - Mitigation: tone constraints + quality score gate.
- Rollback: tắt `enableAutoPostGenerator` tại `/system/modules/posts`, hệ thống quay về manual post creation.

Nếu bạn duyệt spec này, tôi sẽ triển khai đúng phạm vi trên.
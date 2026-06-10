## Audit Summary
- Observation: Codebase đã có nền SEO khá tốt: `app/layout.tsx` có `metadataBase` + verification, `app/sitemap.ts` và `app/robots.ts` đã hoạt động, nhiều route public đã dùng `buildSeoMetadata`, và page-level JSON-LD đã có cho `Article/Product/Breadcrumb/ItemList`.
- Observation: 4 gap còn lại là:
  1. Thiếu `hreflang`/`alternates.languages` nhất quán cho public pages.
  2. Có builder cho `WebSite/Organization/LocalBusiness` nhưng chưa render site-wide ổn định.
  3. Nhiều landing/list pages còn dùng `<img>` raw thay vì `next/image`.
  4. Một số private routes `noindex` nhưng vẫn có canonical.
- Decision: Implement theo hướng centralized, thay đổi nhỏ, ít chạm file logic business, ưu tiên helper dùng chung để tránh conflict và giữ rollback dễ.

## Root Cause Confidence
**High** — vì evidence nằm trực tiếp trong code:
- `app/(site)/*` chưa có `alternates.languages` cho public routes.
- `lib/seo/schema-policy.ts` có builder site-wide schema nhưng usage chưa được gắn vào root/site layout.
- `app/(site)/features/page.tsx` và nhiều landing/list page còn dùng `<img>` raw.
- `app/(site)/cart/layout.tsx`, `checkout/layout.tsx`, `wishlist/layout.tsx` vừa `noindex` vừa set canonical.
Counter-hypothesis đã xét: có thể runtime đang inject thêm metadata/schema từ nơi khác, nhưng grep usage hiện không cho thấy evidence đủ mạnh.

## Proposal
### Mục tiêu
Full implement 4 fix trên theo scope đã chốt:
- Hreflang: **chỉ vi-VN**
- Noindex pages: **bỏ canonical khi noindex**
- Site-wide schema: **WebSite + Organization + LocalBusiness**
- Giữ thay đổi **không gây conflict**, tối ưu và ít rủi ro nhất.

### Thiết kế triển khai
#### 1) Centralize metadata alternates để thêm hreflang an toàn
**Files chính:**
- `lib/seo/metadata.ts`
- Có thể thêm helper mới trong `lib/seo/` nếu cần, ví dụ `lib/seo/alternates.ts`

**Thay đổi cụ thể:**
- Mở rộng `buildMetadata` và `buildSeoMetadata` để tự sinh:
  - `alternates.canonical`
  - `alternates.languages = { 'vi-VN': canonical }` cho các route indexable có canonical
- Không hardcode ở từng page để tránh sửa hàng loạt và tránh conflict.
- Chỉ apply cho public/indexable pages; private/noindex pages không gắn hreflang.

**Guardrails:**
- Không thay URL structure.
- Không thêm multi-locale routing giả; chỉ khai báo `vi-VN` đúng theo scope.
- Không override metadata thủ công nếu page truyền custom alternates hợp lệ.

#### 2) Fix policy private routes: noindex thì không canonical
**Files chính:**
- `app/(site)/cart/layout.tsx`
- `app/(site)/checkout/layout.tsx`
- `app/(site)/wishlist/layout.tsx`
- Có thể thêm `app/(site)/account/layout.tsx` nếu pattern hiện tại cũng tương tự

**Thay đổi cụ thể:**
- Xóa `alternates.canonical` khỏi các route đang `robots: { index: false, follow: false }`.
- Nếu thấy route private khác đang cùng pattern, normalize luôn trong cùng pass.

**Guardrails:**
- Giữ nguyên `title`, `description`, `robots`.
- Chỉ sửa metadata, không đụng UI/business logic.

#### 3) Render site-wide JSON-LD ở root/site layout theo cách không duplicate
**Files chính:**
- `app/layout.tsx` hoặc `app/(site)/layout.tsx` (ưu tiên `app/(site)/layout.tsx` nếu muốn chỉ áp dụng public site, tránh admin/system)
- `components/seo/JsonLd.tsx`
- `lib/seo/schema-policy.ts`
- Có thể thêm helper mới: `lib/seo/site-schema.ts`

**Thay đổi cụ thể:**
- Tạo resolver/helper build 3 schema từ settings hiện có:
  - `WebSite`
  - `Organization`
  - `LocalBusiness`
- Inject 1 lần ở public layout bằng `<JsonLd />`, tránh render lặp ở từng page.
- Dùng dữ liệu từ `site/contact/seo settings`; fallback an toàn khi thiếu field.

**Guardrails chống conflict/duplicate:**
- Chỉ render ở layout public, không render ở admin/system.
- LocalBusiness chỉ output khi có tối thiểu dữ liệu hợp lệ cần thiết; nếu thiếu thì fallback về Organization/WebSite, không xuất schema rỗng.
- Không thay schema page-level hiện tại (Article/Product/Breadcrumb/ItemList vẫn giữ nguyên).

#### 4) Chuẩn hóa image SEO/perf cho landing/list pages
**Files mục tiêu trước mắt:**
- `app/(site)/features/page.tsx`
- `app/(site)/solutions/page.tsx`
- `app/(site)/templates/page.tsx`
- `app/(site)/guides/page.tsx`
- `app/(site)/integrations/page.tsx`
- `app/(site)/use-cases/page.tsx`
- Các `...[slug]/page.tsx` tương ứng đang dùng `<img>` hero image
- Có thể thêm `compare/*` nếu cùng pattern

**Thay đổi cụ thể:**
- Thay `<img>` bằng `next/image` theo pattern hiện có trong repo.
- Giữ `alt={title}` hoặc alt mô tả tương đương.
- Khai báo `width/height` hoặc `fill + sizes` chuẩn theo layout thực tế để tránh CLS.
- Nếu ảnh remote đang dùng, bám cấu hình domain hiện có; nếu chưa đủ evidence thì chỉ refactor component usage, không tự ý đổi `next.config.ts` trong spec này.

**Guardrails:**
- Không refactor lan sang home-components hay product pages nếu không cần.
- Ưu tiên thay đúng các file đang có raw `<img>` public-facing để đạt hiệu quả cao với scope nhỏ.
- Không thay semantics hoặc bố cục UI.

### Trình tự thực hiện an toàn
1. Audit lại `app/(site)/layout.tsx` để chọn điểm inject schema site-wide ít conflict nhất.
2. Refactor `lib/seo/metadata.ts` để hỗ trợ `alternates.languages` tập trung.
3. Cập nhật private route metadata để bỏ canonical khi `noindex`.
4. Inject `WebSite + Organization + LocalBusiness` JSON-LD tại public layout.
5. Chuẩn hóa `<img>` -> `next/image` ở nhóm landing/list/detail pages public đang dùng raw `<img>`.
6. Static review toàn bộ để chắc không duplicate metadata/schema, không null-safety issue.
7. Chạy `bunx tsc --noEmit` trước commit theo repo rule vì có đổi TS/code.
8. Commit local, không push.

### File-level impact dự kiến
- Sửa:
  - `lib/seo/metadata.ts`
  - `app/(site)/cart/layout.tsx`
  - `app/(site)/checkout/layout.tsx`
  - `app/(site)/wishlist/layout.tsx`
  - `app/(site)/features/page.tsx`
  - `app/(site)/features/[slug]/page.tsx`
  - `app/(site)/solutions/page.tsx`
  - `app/(site)/solutions/[slug]/page.tsx`
  - `app/(site)/templates/page.tsx`
  - `app/(site)/templates/[slug]/page.tsx`
  - `app/(site)/guides/page.tsx`
  - `app/(site)/guides/[slug]/page.tsx`
  - `app/(site)/integrations/page.tsx`
  - `app/(site)/integrations/[slug]/page.tsx`
  - `app/(site)/use-cases/page.tsx`
  - `app/(site)/use-cases/[slug]/page.tsx`
  - có thể `app/(site)/compare/page.tsx`, `app/(site)/compare/[slug]/page.tsx` nếu cùng pattern raw `<img>`
  - `app/(site)/layout.tsx` hoặc `app/layout.tsx` (sau khi chốt điểm inject)
- Có thể tạo mới helper nhỏ:
  - `lib/seo/site-schema.ts`
  - hoặc `lib/seo/alternates.ts`

### Rủi ro và cách chặn
- **Duplicate schema**: chặn bằng cách chỉ inject site-wide tại 1 layout public.
- **Conflict metadata page-level**: chặn bằng central helper, không sửa rải rác hàng chục `generateMetadata` nếu không cần.
- **Image layout shift**: chặn bằng `sizes` + dimension/fill đúng pattern hiện có.
- **Runtime config ảnh remote**: nếu thiếu whitelist domain, sẽ audit trước khi đổi từng file; nếu domain chưa support thì giữ nguyên file đó và tách fix config thành bước riêng để không gây lỗi.

## Verification Plan
- **Typecheck:** chạy `bunx tsc --noEmit` sau khi sửa code TS/TSX.
- **Static verify:** review diff để xác nhận:
  - Public pages có `alternates.languages['vi-VN']` khi indexable.
  - Private `noindex` pages không còn canonical.
  - Chỉ có 1 lớp site-wide schema ở public layout.
  - Không còn raw `<img>` trong nhóm public landing/list/detail đã target.
- **Repro checklist:**
  1. Inspect metadata của homepage và 1 landing page: có canonical + `vi-VN` hreflang.
  2. Inspect metadata của `/cart`, `/checkout`, `/wishlist`: có noindex, không canonical.
  3. Inspect HTML source/layout: có `WebSite`, `Organization`, `LocalBusiness` JSON-LD.
  4. Inspect UI các landing pages: ảnh render đúng, không vỡ layout, alt giữ nguyên.

Nếu anh/chị duyệt spec này, tôi sẽ implement đúng theo hướng centralize để giảm conflict tối đa và commit local sau khi xong.
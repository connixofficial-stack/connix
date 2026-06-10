# I. Primer

## 1. TL;DR kiểu Feynman
- FAQ đang có 2 lớp header: header chung của home-component và title riêng nằm trong `FaqSectionShared`.
- Preview trong create/edit render header chung bằng `SectionHeader`, nên nhìn thấy badge/subtitle/title theo cấu hình.
- Site thật cũng có gọi `SectionHeader`, nhưng phần FAQ card bên dưới lại tự render title bên trong, tạo cảm giác “section header” không giống preview và không đi theo contract chung.
- Fix đúng hướng là đưa FAQ site về cùng contract với preview: render header chung một lần, rồi cho `FaqSectionShared` không tự lặp title khi đã có section header chung.
- Không đổi data model; chỉ chỉnh mapping/render để preview ↔ site đồng bộ.

## 2. Elaboration & Self-Explanation
User đang thấy ở `/admin/home-components/faq/.../edit` và create: preview có section header phía trên FAQ. Screenshot site thật tại `localhost:3000` chỉ thấy khối FAQ với tiêu đề “Câu hỏi thường gặp” nằm trong card, không thấy cụm header chung giống preview.

Audit code cho thấy `FaqPreview.tsx` render `SectionHeader` trước `FaqSectionShared`. Trong site runtime, `ComponentRenderer.tsx` cũng render `SectionHeader` trước `FaqSectionShared`, nhưng `FaqSectionShared` style `accordion` lại luôn tự render title bên trong card bằng `sectionTitle`. Vì vậy FAQ có nguy cơ lệch contract: header chung và header nội bộ cùng tồn tại hoặc bị hiểu nhầm là một.

Hướng xử lý tối thiểu là thêm contract rõ ràng cho `FaqSectionShared`: khi parent đã render shared header, FAQ content không tự render section title nữa; khi không có shared header hoặc trong empty state thì vẫn giữ fallback hợp lý. Đồng thời đảm bảo create/edit truyền cùng header props vào preview và lưu vào config như hiện tại.

## 3. Concrete Examples & Analogies
- Ví dụ trong repo: `app/admin/home-components/faq/_components/FaqPreview.tsx` đang gọi `SectionHeader` rồi mới gọi `FaqSectionShared`. Site tại `components/site/ComponentRenderer.tsx` cũng nên cho kết quả nhìn tương tự: header chung nằm ngoài, nội dung FAQ nằm trong card/list.
- Analogy: hiện tại giống như biển tên cửa hàng được treo ở cả ngoài cửa và trong quầy; người xem tưởng không thấy biển ngoài vì biển trong quầy quá nổi. Fix là thống nhất: biển ngoài là section header, trong quầy chỉ còn nội dung FAQ.

# II. Audit Summary (Tóm tắt kiểm tra)
- Screenshot preview `Screenshot 2026-04-29 160134.png`: trong BrowserFrame có badge `FGHFGHGHF`, text `fghgfh`, rồi mới đến FAQ card.
- Screenshot site `Screenshot 2026-04-29 160144.png`: site chỉ thấy FAQ card có tiêu đề lớn `Câu hỏi thường gặp`; không thấy badge/subtitle/header chung phía trên card.
- `app/admin/home-components/faq/_components/FaqPreview.tsx`: render `SectionHeader` trước `FaqSectionShared`.
- `components/site/ComponentRenderer.tsx`: `FAQSection` render `SectionHeader` trước `FaqSectionShared`, nhưng `FaqSectionShared` vẫn tự render title nội bộ cho style `accordion`.
- `app/admin/home-components/faq/[id]/edit/page.tsx` và `app/admin/home-components/create/faq/page.tsx`: header fields đã được load/save/truyền preview, không thấy cần đổi schema.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): Medium-High.

- Triệu chứng quan sát được: preview có header chung; site thật không thể hiện rõ header chung theo cùng vị trí/hình thái.
- Phạm vi ảnh hưởng: FAQ home-component ở create/edit preview và site renderer; chủ yếu style `accordion`, có thể ảnh hưởng các style khác nếu tự render title nội bộ.
- Tái hiện tối thiểu: tạo/sửa FAQ có `showBadge/showSubtitle/showTitle`, rồi xem site thật ở `localhost:3000`.
- Mốc thay đổi gần nhất liên quan: các commit gần đây đang chuẩn hóa header cho Contact; FAQ có dấu hiệu đã thêm header fields nhưng shared section chưa có contract tránh trùng/lệch.
- Dữ liệu thiếu: chưa đọc trực tiếp Convex record `js7f2fqyfmawnqwb2t7m9v89cn85shrd`, nên chưa xác nhận config runtime exact; tuy nhiên screenshot và code path đủ chỉ ra vùng lỗi.
- Giả thuyết thay thế chưa loại trừ: record site có `hideHeader: true` hoặc badge/subtitle chưa lưu; CSS spacing khiến header nằm ngoài viewport/sát top; homepage đang render component khác hoặc cache cũ.
- Rủi ro nếu fix sai nguyên nhân: FAQ mất title nội bộ ở trường hợp chưa có shared header hoặc legacy config trống.
- Tiêu chí pass/fail sau sửa: cùng config header thì preview create/edit và site thật đều thấy/ẩn badge-title-subtitle giống nhau; FAQ card không tự lặp title khi header chung đang bật.

# IV. Proposal (Đề xuất)

Sửa theo hướng contract nhỏ, không đổi schema:

1. Chuẩn hóa `FaqSectionShared` để biết parent đã render shared header hay chưa.
   - Thêm prop tùy chọn kiểu `suppressInternalHeader?: boolean` hoặc `renderInternalHeader?: boolean`.
   - Default giữ behavior cũ để tránh phá chỗ gọi khác.

2. Ở `FaqPreview.tsx`, tính `hasSharedHeader` từ props header:
   - `!hideHeader && ((showTitle && title.trim()) || (showSubtitle && subtitle.trim()) || (showBadge && badgeText.trim()))`.
   - Truyền `suppressInternalHeader={hasSharedHeader}` vào `FaqSectionShared`.

3. Ở `components/site/ComponentRenderer.tsx` trong `FAQSection`, tính cùng `hasSharedHeader` từ `headerConfig` và `title`.
   - Truyền `suppressInternalHeader={hasSharedHeader}` vào `FaqSectionShared`.
   - Nếu cần, đưa header fields vào `sectionConfig` để shared section có đủ context fallback nhưng không bắt buộc đổi data.

4. Giữ create/edit save logic hiện tại.
   - `create/page.tsx` và `edit/page.tsx` đã lưu `hideHeader/showTitle/showSubtitle/subtitle/headerAlign/titleColorPrimary/subtitleAboveTitle/uppercaseText/showBadge/badgeText` vào config.
   - Chỉ review tĩnh để đảm bảo không mất field.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Sửa: `app/admin/home-components/faq/_components/FaqSectionShared.tsx` — hiện render FAQ UI chung cho preview/site; thêm contract để không render header nội bộ khi parent đã render shared header.
- Sửa: `app/admin/home-components/faq/_components/FaqPreview.tsx` — hiện render preview header chung; truyền trạng thái suppress internal header vào shared FAQ UI.
- Sửa: `components/site/ComponentRenderer.tsx` — hiện render FAQ runtime; truyền cùng contract suppress internal header để site thật giống preview.
- Có thể không sửa: `app/admin/home-components/faq/[id]/edit/page.tsx` — hiện load/save header config; chỉ kiểm tra tĩnh.
- Có thể không sửa: `app/admin/home-components/create/faq/page.tsx` — hiện create lưu header config; chỉ kiểm tra tĩnh.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại `FaqSectionShared.tsx` các style có render section title/header nội bộ.
2. Thêm prop contract nhỏ để kiểm soát internal header.
3. Áp dụng prop cho style `accordion` trước; nếu các style khác cũng tự render title theo cùng pattern thì áp dụng nhất quán.
4. Cập nhật `FaqPreview.tsx` và `ComponentRenderer.tsx` để tính `hasSharedHeader` cùng điều kiện.
5. Tự review tĩnh: TypeScript props, fallback title, empty state, legacy config.
6. Commit thay đổi theo rule repo sau khi chạy `bunx tsc --noEmit` nếu user duyệt triển khai.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review (bắt buộc theo AGENTS): kiểm tra props mới optional, không phá caller cũ, không đổi schema.
- Type check theo repo rule trước commit: chạy `bunx tsc --noEmit` vì có thay đổi TS/TSX.
- Visual/manual do tester phụ trách:
  - Create FAQ: bật/tắt badge, subtitle, title; preview phản ánh đúng.
  - Edit FAQ `js7f2fqyfmawnqwb2t7m9v89cn85shrd`: lưu header rồi xem site thật.
  - Site thật: header chung xuất hiện giống preview; card FAQ không lặp title khi header chung bật.
  - Tắt header: site/preview không hiện shared header; FAQ content vẫn có fallback hợp lý nếu cần.

# VIII. Todo

- [ ] Sửa `FaqSectionShared.tsx` thêm contract suppress internal header.
- [ ] Cập nhật `FaqPreview.tsx` để truyền contract theo header props.
- [ ] Cập nhật `ComponentRenderer.tsx` để site runtime truyền contract tương tự.
- [ ] Review tĩnh create/edit save/load header config.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- FAQ preview create/edit và site thật dùng cùng logic hiển thị section header.
- Khi `hideHeader=false`, `showBadge/showSubtitle/showTitle` bật và có text, site thật hiển thị header chung như preview.
- FAQ card không còn tự tạo cảm giác thay thế section header khi shared header đang bật.
- Khi header bị tắt hoặc text trống, không xuất hiện khoảng trắng/header rỗng.
- Không đổi schema Convex, không migrate data.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp-trung bình: thay đổi render FAQ có thể làm layout bớt title nội bộ ở một số style.
- Mitigation: prop optional default giữ behavior cũ; chỉ caller preview/site FAQ truyền khi có shared header.
- Rollback: revert 3 file TSX liên quan; dữ liệu không bị ảnh hưởng.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor toàn bộ home-component header system.
- Không chỉnh Convex schema/data thật nếu không cần.
- Không đổi UI/UX style FAQ ngoài việc đồng bộ header preview/site.
- Không chạy runtime/integration test theo rule repo; tester kiểm chứng giao diện thực tế.
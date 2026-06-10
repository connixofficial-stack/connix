# I. Primer

## 1. TL;DR kiểu Feynman
- Timeline hiện là fallback cuối trong `ServicesSectionCore.tsx`, không có branch riêng `style === 'timeline'`.
- UI hiện tại đang là card navy lớn, bo tròn, padding dày, chữ/icon to hơn ảnh mẫu.
- Ảnh bạn gửi là một benefit bar rất mỏng: nền navy, item ngang, icon line nhỏ, title/subtitle nhỏ, chiều cao thấp.
- Cần sửa fallback Timeline để học behavior chuẩn của 5 layout còn lại: `desktopColumns`, `mediaPlacement`, `mediaAlign`, header/subtitle.
- Chỉ sửa Timeline fallback, không đụng các layout đã ổn.

## 2. Elaboration & Self-Explanation
Hiện Timeline đang render qua `return (...)` cuối file, tức mọi style không match 5 branch trước sẽ rơi vào đó. Vì `ServicesStyle` có `timeline`, nên đây chính là layout Timeline. Nó đang dùng `cardsGridClassName`, background `colors.bodyText`, icon surface 56px, padding `px-6 py-6`, title uppercase tracking rộng và description `text-sm` line-height 6. Kết quả là dày và lớn.

Target mới giống thanh logistics trong ảnh: mỗi item là một ô rất thấp, nền navy đậm, icon outline nhỏ bên trái hoặc phía trên tùy setting, title khoảng 12px, subtitle khoảng 12px, padding thấp, border/spacing nhẹ. Vẫn phải giữ các control chung: số cột desktop, căn icon/ảnh, căn ngang khi icon nằm trên.

## 3. Concrete Examples & Analogies
- Ví dụ: với `4 cột`, Timeline phải ra 4 ô ngang mỏng như ảnh: “Vận chuyển MIỄN PHÍ”, “Đổi trả MIỄN PHÍ”, “Tiến hành THANH TOÁN”, “100% HOÀN TIỀN”.
- Nếu user chọn icon `Trên` + căn `Giữa`, icon và text trong từng ô sẽ dọc/giữa; nếu chọn `Trái`, icon nằm trái, text nằm phải như ảnh.
- Analogy: layout này giống thanh “cam kết nhanh” ở đầu trang ecommerce, không phải card dịch vụ dày.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation: `ServicesSectionCore.tsx` không có `if (style === 'timeline')`; Timeline là fallback `return` cuối.
- Observation: fallback hiện dùng `cardsGridClassName`, nên đã tôn trọng `desktopColumns` ở mức grid.
- Observation: fallback hiện dùng `renderAlignedMedia(...)`, nên đã có đường tôn trọng `mediaPlacement`/`mediaAlign`, nhưng class/padding đang làm layout quá dày.
- Observation: current UI dùng `rounded-[30px] px-6 py-6`, icon `h-14 w-14`, title `text-sm uppercase tracking-[0.18em]`, description `mt-3 text-sm leading-6`.
- Inference: cần giữ wiring hiện có nhưng giảm kích thước và đổi sang bar mỏng giống ảnh.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Triệu chứng: Timeline chưa giống ảnh vì quá dày, card-like, icon/text lớn.
- Phạm vi: chỉ layout Timeline/fallback trong Services.
- Tái hiện: chọn Timeline trong preview/edit, thấy card navy bo lớn thay vì benefit bar mỏng.
- Dữ liệu thiếu: không thiếu; ảnh đã mô tả rõ target visual.
- Giả thuyết thay thế: có thể cần đổi labels/data; không cần, renderer chỉ cần làm nhỏ và mỏng hơn.
- Rủi ro nếu fix sai: quá mỏng có thể cắt text dài; sẽ dùng `min-h` thấp nhưng vẫn cho text wrap 2 dòng.
- Tiêu chí pass/fail: item mỏng nhất có thể, icon nhỏ, text nhỏ rõ, vẫn tôn trọng placement/alignment.

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High — code hiện tại có kích thước/padding/icon quá lớn so với ảnh.

# IV. Proposal (Đề xuất)
Sửa fallback Timeline trong `components/site/ServicesSectionCore.tsx`:

1. Layout container
   - Giữ `{renderSectionHeader()}`.
   - Dùng `cardsGridClassName` hoặc `stripGridClassName` tùy mục tiêu:
     - Recommend: `cardsGridClassName` để mỗi item có khoảng cách nhỏ giống ảnh có gap giữa các ô.
   - Giữ `desktopColumns` đã có.

2. Article style
   - Đổi từ `rounded-[30px] px-6 py-6` sang mỏng hơn: ví dụ `rounded px-4 py-2.5` hoặc `px-4 py-3`.
   - Nền navy dùng `colors.bodyText` như hiện tại hoặc shade tối của màu chính nếu cần; ảnh giống navy nên giữ `colors.bodyText` ổn.
   - `min-h` thấp khoảng `56px`–`64px`.

3. Icon/media
   - Icon size giảm từ `22` xuống khoảng `15`–`16`.
   - Surface giảm từ `h-14 w-14` xuống `h-8 w-8` hoặc `h-9 w-9`.
   - Image class giảm tương ứng `h-7 w-7`.
   - Vẫn dùng `renderAlignedMedia(...)` để giữ behavior `Trên/Trái` và `Trái/Giữa/Phải`.

4. Text
   - Title giảm từ `text-sm uppercase tracking` sang `text-xs font-semibold` hoặc `text-[12px]`.
   - Description giảm `text-xs`, `leading-4`, `mt-0.5`.
   - Nếu `mediaPlacement === 'left'`: layout ngang, icon trái, text phải.
   - Nếu `mediaPlacement === 'top'`: layout dọc, align theo `mediaAlign`.

5. Remaining runtime tile
   - Làm cùng visual mỏng, không dùng `renderVariantCountTile` hiện tại vì nó min-h 140px quá dày.
   - Tạo inline plus item mỏng giống các item khác.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — chỉ fallback Timeline cuối file.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại fallback Timeline mới nhất để tránh ghi đè external changes.
2. Sửa class article/icon/text cho mỏng hơn.
3. Giữ `renderAlignedMedia(...)`, `mediaPlacement`, `mediaAlign`, `cardsGridClassName`.
4. Thay remaining tile bằng tile mỏng cùng style.
5. Chạy `bunx tsc --noEmit`.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static: Timeline fallback vẫn dùng `renderSectionHeader()`.
- Static: Timeline fallback vẫn dùng `cardsGridClassName` hoặc helper dựa trên `desktopColumns`.
- Static: Timeline fallback vẫn dùng `renderAlignedMedia(...)` với `mediaPlacement`/`mediaAlign`.
- Static: không còn `h-14`, `rounded-[30px]`, `py-6` cho Timeline item.
- Typecheck: `bunx tsc --noEmit` pass.
- Visual tester: chọn Timeline, item mỏng, icon nhỏ, text nhỏ, giống benefit bar trong ảnh.

# VIII. Todo
- [ ] Sửa Timeline fallback thành benefit bar mỏng.
- [ ] Giữ behavior chuẩn của Icon Cards cho icon/grid/header.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Timeline mỏng hơn rõ rệt so với các layout khác.
- Icon nhỏ hơn rõ rệt, không chiếm nhiều chiều cao.
- Text nhỏ hơn nhiều layout khác nhưng vẫn đọc được.
- `desktopColumns`, `mediaPlacement`, `mediaAlign` vẫn hoạt động.
- Preview và site runtime đồng bộ.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Risk: quá mỏng có thể khiến mô tả dài wrap nhiều dòng; sẽ dùng min-height thấp nhưng không cố fixed height cứng.
- Risk: ảnh media thật có thể nhỏ; sẽ dùng `object-contain`/kích thước nhỏ đồng bộ.
- Rollback: revert/amend commit nếu visual chưa đúng.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh Carousel/Elegant/Modern/BigNumber/IconCards.
- Không đổi edit page hoặc schema/config.
- Không xử lý file dirty ngoài scope `product-list`.

# XII. Open Questions (Câu hỏi mở)
Không có; yêu cầu đã rõ: Timeline học logic/behavior chuẩn nhưng UI như ảnh, mỏng nhất có thể với chữ/icon nhỏ.
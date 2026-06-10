# I. Primer

## 1. TL;DR kiểu Feynman
- Carousel hiện sai vì đang dùng một nền `colors.primary` chung cho cả strip.
- Ảnh mẫu bạn gửi có từng item là một ô riêng, màu nhạt → đậm dần từ trái sang phải dựa trên màu chính.
- Cần giữ logic behavior của Icon Cards: `desktopColumns`, `mediaPlacement`, `mediaAlign`, header settings.
- Chỉ sửa branch `style === 'carousel'` trong `ServicesSectionCore.tsx`.
- Không khôi phục carousel scroll cũ; tên style là Carousel nhưng UI theo ảnh mẫu/feature strip như yêu cầu hiện tại.

## 2. Elaboration & Self-Explanation
Hiện Carousel đang render một wrapper nền xanh chung, nên các item không có sắc độ riêng. Ảnh mẫu lại là 4 ô đặt cạnh nhau, mỗi ô có background khác nhau: item 1 xanh nhạt hơn, item 2 đậm hơn, item 3 đậm hơn nữa, item 4 tối nhất. Divider giữa ô cũng rất rõ, và icon/text đều trắng.

Cách sửa đúng là tính `backgroundColor` riêng cho từng item theo index. Màu nền sẽ bắt đầu từ phiên bản tint/shade nhẹ của màu chính và tăng độ tối dần theo vị trí item. Màu chữ/icon phải lấy theo `getAPCATextColor(itemBackground)` để vẫn đảm bảo tương phản, nhưng với màu chính đủ đậm sẽ ra trắng giống ảnh.

## 3. Concrete Examples & Analogies
- Ví dụ: nếu màu chính là xanh lá, item 1 dùng xanh lá sáng/xám hơn, item 2 xanh lá trung bình, item 3 xanh lá đậm, item 4 xanh lá rất đậm.
- Analogy: không phải trải một tấm thảm xanh rồi đặt 4 cục lên; mà là 4 viên gạch cùng họ màu, viên sau đậm hơn viên trước.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation: `components/site/ServicesSectionCore.tsx` branch `style === 'carousel'` hiện dùng `<div style={{ backgroundColor: colors.primary }}>` cho toàn bộ strip.
- Observation: mỗi `<article>` Carousel hiện không có `backgroundColor` riêng, nên không thể tạo hiệu ứng nhạt → đậm.
- Observation: Carousel hiện đã dùng `stripGridClassName`, `mediaPlacement`, `mediaAlign`, tức behavior cơ bản đã theo Icon Cards.
- Inference: chỉ cần sửa color distribution + divider ở item, không cần đổi edit page.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Triệu chứng: UI không giống ảnh vì các ô không có sắc độ riêng.
- Phạm vi: chỉ layout `Carousel` của Services.
- Tái hiện: chọn style `Carousel`, thấy một background chung thay vì 4 background nhạt→đậm.
- Dữ liệu thiếu: không thiếu; ảnh user mô tả rõ logic màu.
- Giả thuyết thay thế: có thể cần đổi màu phụ; loại trừ vì user nói rõ “màu chính” và “từng item nhạt tới đậm dần”.
- Rủi ro nếu fix sai: nếu màu chính quá sáng, text trắng có thể thiếu tương phản; sẽ dùng APCA để chọn text theo từng background.
- Tiêu chí pass/fail: item background khác nhau rõ ràng theo index, cùng họ màu chính, nhạt tới đậm.

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High — code hiện tại dùng một background chung cho Carousel.

# IV. Proposal (Đề xuất)
Sửa branch `style === 'carousel'` trong `components/site/ServicesSectionCore.tsx`:

1. Thêm helper nhỏ trong file hoặc trong branch:
   - parse màu chính sang OKLCH bằng `culori` nếu đã available trong project qua `colors.ts`, hoặc dùng helper local đơn giản nếu import được.
   - tạo danh sách shade theo index: ví dụ item 0 sáng hơn, item cuối đậm hơn.
   - nếu không muốn thêm import mới, dùng CSS `color-mix(in srgb, colors.primary X%, black Y%)` theo index để tạo shade trực tiếp.

2. Với mỗi item Carousel:
   - `const itemBackground = getCarouselItemBackground(idx, displayCount)`.
   - `const itemText = getAPCATextColor(itemBackground, 16, 600)` nếu itemBackground là hex; nếu dùng `color-mix`, fallback text trắng như ảnh.
   - article dùng `style={{ backgroundColor: itemBackground }}`.
   - wrapper ngoài bỏ background chung hoặc để transparent.

3. Giữ behavior hiện có:
   - `stripGridClassName` vẫn dùng `desktopColumns`.
   - `renderAlignedMedia(...)` vẫn dùng `mediaPlacement`/`mediaAlign`.
   - title/subtitle vẫn dùng `renderSectionHeader()`.

4. UI tinh chỉnh theo ảnh:
   - article không bo góc riêng; wrapper `overflow-hidden` để strip liền mạch.
   - divider dùng line trắng mờ giữa các item.
   - icon và title center khi `mediaPlacement='top'`, left khi `mediaPlacement='left'`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — chỉ branch Carousel và helper màu nếu cần.

# VI. Execution Preview (Xem trước thực thi)
1. Kiểm tra import hiện có trong `ServicesSectionCore.tsx`.
2. Chọn hướng tạo màu shade ít rủi ro nhất.
3. Sửa Carousel để mỗi `article` có background riêng theo index.
4. Giữ media/grid/header behavior không đổi.
5. Chạy `bunx tsc --noEmit`.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static: Carousel không còn dùng một `backgroundColor: colors.primary` chung cho toàn strip.
- Static: mỗi article có background tính theo index.
- Static: vẫn dùng `stripGridClassName`, `mediaPlacement`, `mediaAlign`.
- Typecheck: `bunx tsc --noEmit` pass.
- Visual tester: 4 item hiển thị như ảnh, màu chính nhạt → đậm dần từ trái sang phải.

# VIII. Todo
- [ ] Sửa màu nền từng item Carousel nhạt → đậm.
- [ ] Giữ behavior Icon Cards cho grid/icon alignment.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Carousel có các ô màu khác nhau theo thứ tự nhạt → đậm.
- Màu các ô xuất phát từ màu chính, không dùng màu phụ.
- Icon/text vẫn đủ tương phản.
- `Số cột desktop`, `Căn icon/ảnh`, `Căn ngang khi icon nằm trên` vẫn hoạt động.
- Preview và site runtime đồng bộ.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Risk: `color-mix()` phụ thuộc browser hiện đại; nếu muốn an toàn tuyệt đối thì dùng culori/OKLCH để xuất hex.
- Recommend: dùng OKLCH/culori vì project đã có `culori` trong `_lib/colors.ts`, đảm bảo màu là hex để APCA tính được.
- Rollback: revert/amend commit nếu màu không đúng.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh các layout khác.
- Không đổi edit page.
- Không đổi schema/config.
- Không xử lý file product-list ngoài scope.

# XII. Open Questions (Câu hỏi mở)
Không có; yêu cầu đã rõ: Carousel dùng màu chính và từng item nhạt → đậm dần như ảnh.
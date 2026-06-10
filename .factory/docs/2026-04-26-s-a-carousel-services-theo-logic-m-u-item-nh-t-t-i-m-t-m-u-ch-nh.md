# I. Primer

## 1. TL;DR kiểu Feynman
- Bạn đúng: Carousel hiện vẫn sai vì đang tô một nền `colors.primary` chung cho cả strip.
- Ảnh mẫu cần 4 item riêng, mỗi item là một shade khác nhau của màu chính: nhạt → đậm dần.
- Behavior của `Icon Cards` vẫn phải giữ nguyên: `desktopColumns`, `mediaPlacement`, `mediaAlign`, header/subtitle.
- Cần sửa branch `style === 'carousel'` để mỗi item tự tính background từ màu chính theo index.
- Nên dùng OKLCH/Culori để sinh hex thật, vì repo đã có sẵn trong `_lib/colors.ts` và APCA sẽ tính tương phản chuẩn hơn.

## 2. Elaboration & Self-Explanation
Hiện code Carousel lấy `colors.primary` làm nền cho toàn bộ wrapper, rồi tất cả item nằm chung trên nền đó. Vì vậy nhìn nó thành một khối xanh duy nhất. Ảnh bạn gửi thì khác hẳn: mỗi ô là một "tile" độc lập, cùng họ màu nhưng ô bên trái sáng hơn, càng về phải càng đậm hơn.

Cách sửa đúng là không tô màu wrapper chính nữa, mà tô màu ở từng `article`. Mỗi `article` sẽ được cấp một màu riêng dựa trên index (`idx`) và tổng số item đang hiển thị. Sau đó text/icon của item đó phải được tính theo `getAPCATextColor(itemBackground)` để nền sáng thì chữ tối, nền đậm thì chữ sáng, tránh lệch tương phản.

## 3. Concrete Examples & Analogies
- Ví dụ: nếu `colors.primary` là xanh lá đậm, item 1 có thể là xanh lá pha trắng nhiều, item 2 ít trắng hơn, item 3 gần màu gốc, item 4 pha thêm shade đậm hơn.
- Analogy: không phải một cái bảng sơn 1 màu rồi chia cột, mà là 4 viên gạch cùng tông, viên nào sau thì đậm hơn viên trước.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation: `components/site/ServicesSectionCore.tsx` branch `carousel` đang dùng `<div style={{ backgroundColor: colors.primary }}>` cho toàn strip.
- Observation: mỗi `article` của Carousel hiện chưa có `backgroundColor` riêng theo index.
- Observation: branch Carousel đã tôn trọng `mediaPlacement`/`mediaAlign` qua `renderAlignedMedia(...)` và `stripGridClassName` cho `desktopColumns`.
- Observation: repo đã có `culori` + helper `getAPCATextColor` trong `app/admin/home-components/services/_lib/colors.ts`.
- Inference: chỉ cần đổi strategy phân phối màu, không cần đụng edit page.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Triệu chứng: UI Carousel không giống ảnh vì không có dải màu item nhạt → đậm.
- Phạm vi: chỉ layout `Carousel` trong `ServicesSectionCore.tsx`.
- Tái hiện: chọn style Carousel, thấy background xanh đồng nhất cho cả cụm.
- Mốc code: branch `style === 'carousel'` đang tô `colors.primary` vào wrapper.
- Dữ liệu thiếu: không thiếu; ảnh user đã chỉ rõ logic màu.
- Giả thuyết thay thế: dùng màu phụ hoặc gradient toàn cụm; loại trừ vì user nói rõ "logic màu cho từng item" và "màu chính".
- Rủi ro nếu fix sai: shade quá nhạt hoặc quá đậm làm text/icon thiếu contrast; sẽ dùng APCA per-item.
- Tiêu chí pass/fail: mỗi item có màu riêng theo thứ tự nhạt → đậm, vẫn giữ đúng behavior của Icon Cards.

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High — nguyên nhân trực tiếp nằm ở việc wrapper Carousel dùng 1 background chung.

# IV. Proposal (Đề xuất)
Sửa `components/site/ServicesSectionCore.tsx` như sau:

1. Thêm import nhẹ từ `culori` trong file này hoặc dùng helper local:
   - `formatHex`, `oklch` để parse `colors.primary`.
   - Tạo helper local `getCarouselItemBackground(baseColor, index, total)`.

2. Công thức shade đề xuất:
   - Parse `colors.primary` sang OKLCH.
   - Với item đầu: tăng lightness lên một chút.
   - Với item cuối: giảm lightness xuống một chút.
   - Nội suy tuyến tính theo `index / (total - 1)`.
   - Ví dụ hướng lightness: `+0.18 → -0.08` quanh màu gốc.

3. Trong branch Carousel:
   - wrapper ngoài bỏ `backgroundColor: colors.primary`, chỉ giữ `overflow-hidden rounded-sm`.
   - mỗi `article` tính:
     - `const itemBackground = getCarouselItemBackground(colors.primary, idx, displayFeaturedItems.length)`
     - `const itemText = getAPCATextColor(itemBackground, 16, 600)`
     - `const itemSubtext`, `itemMediaSurface`, `itemBorder`, `itemDivider` suy từ `itemText`.
   - `article` dùng `style={{ backgroundColor: itemBackground }}`.

4. Giữ nguyên behavior hiện có:
   - `stripGridClassName` vẫn quyết định 3/4 cột.
   - `renderAlignedMedia(...)` vẫn dùng `mediaPlacement`/`mediaAlign`.
   - `renderSectionHeader()` giữ nguyên.
   - runtime `remainingForRuntime` tile cũng phải dùng shade cuối hoặc shade đậm nhất để không lệch hệ.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — chỉ branch `carousel` và helper màu local.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại branch Carousel hiện tại trong `ServicesSectionCore.tsx`.
2. Thêm helper shade từ màu chính bằng OKLCH.
3. Chuyển nền chung thành nền riêng từng item.
4. Tính text/icon contrast per-item bằng APCA.
5. Giữ nguyên logic `mediaPlacement`, `mediaAlign`, `desktopColumns`.
6. Chạy `bunx tsc --noEmit`.
7. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static: wrapper Carousel không còn `backgroundColor: colors.primary` chung.
- Static: mỗi item có `itemBackground` riêng theo `idx`.
- Static: `mediaPlacement`, `mediaAlign`, `desktopColumns` vẫn đi qua branch Carousel.
- Typecheck: `bunx tsc --noEmit` pass.
- Visual tester: item 1 nhạt hơn item 2, item 2 nhạt hơn item 3, item cuối đậm nhất; tất cả cùng họ màu chính.

# VIII. Todo
- [ ] Thêm helper sinh shade Carousel từ màu chính.
- [ ] Áp background riêng cho từng item Carousel.
- [ ] Giữ behavior Icon Cards cho grid/icon alignment.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Carousel có từng item màu riêng theo thứ tự nhạt → đậm.
- Tất cả item dùng cùng họ màu chính, không nhảy sang màu phụ.
- Text/icon vẫn đủ tương phản trên từng item.
- `desktopColumns`, `mediaPlacement`, `mediaAlign` vẫn hoạt động đúng.
- Preview và site runtime đồng bộ.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Risk: shade range mạnh quá có thể làm item đầu quá nhạt hoặc item cuối quá tối; sẽ chọn range vừa phải.
- Risk: nếu chỉ có 1 item thì phải fallback về màu chính gốc.
- Rollback: revert/amend commit nếu chưa đúng cảm giác ảnh mẫu.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh layout khác ngoài Carousel.
- Không đổi edit page.
- Không đổi schema/config.
- Không xử lý file dirty ngoài scope `product-list`.

# XII. Open Questions (Câu hỏi mở)
Không có; yêu cầu đã rõ là Carousel phải phân phối màu theo từng item từ nhạt tới đậm của màu chính.
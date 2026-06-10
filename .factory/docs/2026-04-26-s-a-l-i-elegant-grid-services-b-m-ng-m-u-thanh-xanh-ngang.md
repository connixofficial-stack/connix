# I. Primer

## 1. TL;DR kiểu Feynman
- Đúng: ảnh mẫu là một thanh ngang xanh/cyan dạng chữ nhật, không phải card bo tròn lớn.
- Đúng: header/subheader không nằm trong nền xanh của layout; nó phải render bên ngoài như các layout khác.
- Sai hiện tại: `Elegant Grid` đang bọc cả header vào background xanh đậm và bo góc lớn, nên nhìn thành một card khác hẳn ảnh mẫu.
- Cần sửa lại riêng `Elegant Grid`: giữ header thường, bên dưới là strip ngang 3 cột, icon vuông viền trắng mảnh, title/subtitle nhỏ gọn.
- Không đụng 5 layout còn lại trong lượt này.

## 2. Elaboration & Self-Explanation
Vấn đề hiện tại là đã hiểu đúng “học theo ảnh” ở mức icon + text ngang, nhưng sai ở phần cấu trúc: ảnh mẫu có section header độc lập nếu có, còn bản hiện tại lại nhét header vào cùng nền xanh và dùng bo góc rất lớn. Vì vậy layout bị nặng, không còn giống thanh dịch vụ mỏng như ảnh.

Hướng sửa đúng là đưa `renderSectionHeader()` trở lại ngoài block nền xanh, rồi block `Elegant Grid` chỉ render danh sách item. Mỗi item là một ô ngang trong strip: icon vuông nhỏ bên trái, title trắng cỡ vừa, description trắng nhạt nhỏ hơn; các ô chia bằng nền hơi khác/hoặc divider rất nhẹ.

## 3. Concrete Examples & Analogies
- Ví dụ bám hình: `Các bác sĩ hàng đầu` là title khoảng 18px, subtitle khoảng 12px, icon nằm trong khung vuông 46px; toàn bộ nằm trong thanh xanh cao khoảng 90px, không có heading lớn phía trên bên trong thanh.
- Analogy: ảnh mẫu giống “thanh thông tin nhanh” ở đầu website, còn bản hiện tại giống “khối banner/card lớn”. Cần kéo nó về dạng thanh thông tin nhanh.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation: lỗi nằm ở branch `style === 'elegantGrid'` trong `components/site/ServicesSectionCore.tsx`.
- Observation: preview admin và site runtime đều dùng `ServicesSectionCore`, nên sửa ở đây sẽ đồng bộ preview/site.
- Observation: bản hiện tại đã bọc header/subheader vào div nền xanh (`backgroundColor: colors.primary`) và thêm `rounded-[34px]`.
- Inference: cần bỏ wrapper nền xanh khỏi header và giảm visual weight của strip.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Triệu chứng: layout thực tế giống hình 2, không giống hình 1: bo tròn lớn, nền xanh đậm, header nằm trong nền, chữ quá lớn.
- Phạm vi: chỉ `Elegant Grid` của Services home-component.
- Tái hiện: chọn style `Elegant Grid` trong trang edit Services sẽ thấy header dính background và block thành card lớn.
- Dữ liệu thiếu: không thiếu thêm requirement; ảnh user gửi đã chỉ rõ target.
- Giả thuyết thay thế: có thể cần chỉnh global color token; không cần, vì lỗi chính là structure/classes trong branch `elegantGrid`.
- Rủi ro nếu sửa sai: làm thanh quá thấp gây vỡ text dài; cần dùng responsive stack mobile và giữ line-height an toàn.
- Tiêu chí pass/fail: header nằm ngoài nền; strip ngang xanh/cyan thấp hơn, ít bo góc hoặc không bo; item giống hình 1.

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High — nguyên nhân trực tiếp là cấu trúc JSX của `elegantGrid` đang bọc header trong background và dùng card styling không khớp ảnh.

# IV. Proposal (Đề xuất)
Sửa duy nhất branch `style === 'elegantGrid'` trong `components/site/ServicesSectionCore.tsx`:

- Đưa `{renderSectionHeader()}` ra ngoài strip nền xanh, giống pattern các layout khác.
- Đổi wrapper strip từ `rounded-[34px]` sang hình chữ nhật hoặc bo rất nhẹ (`rounded-none`/`rounded-sm` tùy container hiện có), ưu tiên giống ảnh nhất.
- Strip dùng `grid grid-cols-1 md:grid-cols-3`; mobile stack 1 cột, desktop 3 cột ngang.
- Mỗi item:
  - `min-h` khoảng 90px, padding ngang vừa phải.
  - icon box khoảng `h-11 w-11`, border trắng mảnh, icon trắng.
  - title `text-lg`/`text-xl`, font-semibold, không uppercase.
  - subtitle `text-xs`/`text-sm`, white opacity, compact.
- Bỏ font size quá lớn `text-[1.75rem]` và bỏ header trắng trong strip.
- Không sửa `Icon Cards`, `Modern List`, `Big Number`, `Carousel`, `Timeline` trong lượt này.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — chỉ chỉnh JSX/classes của `Elegant Grid` để giống thanh xanh ngang trong ảnh.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc block `style === 'elegantGrid'` hiện tại.
2. Thay wrapper hiện tại bằng cấu trúc: section → max-width container → header ngoài → strip nền xanh.
3. Chỉnh item typography/icon box theo ảnh mẫu.
4. Review static: `cards` branch không đổi, fallback không đổi, preview/site vẫn dùng chung core.
5. Chạy `bunx tsc --noEmit` theo rule repo vì có đổi TSX.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static review: header/subheader không nằm trong div có `backgroundColor: colors.primary`.
- Static review: `Elegant Grid` vẫn render `displayFeaturedItems`, vẫn có remaining count runtime nếu >6.
- Static review: không đổi style key/config/schema.
- Typecheck: chạy `bunx tsc --noEmit`.
- Visual check cho tester: mở style `Elegant Grid`, so với ảnh 1: thanh ngang xanh, item 3 cột, icon vuông, chữ nhỏ gọn, header không dính nền.

# VIII. Todo
- [ ] Sửa riêng `Elegant Grid` trong `ServicesSectionCore.tsx`.
- [ ] Review static diff.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Header/subheader của section nằm ngoài background xanh của strip.
- Strip `Elegant Grid` giống hình chữ nhật ngang như ảnh mẫu, không còn card bo tròn lớn.
- Title/subtitle trong từng item nhỏ, gọn, không uppercase.
- Icon nằm trong khung vuông viền trắng mảnh bên trái.
- Preview admin và site runtime đồng bộ vì vẫn dùng `ServicesSectionCore`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Risk: text title quá dài có thể xuống dòng; sẽ giữ line-height compact để vẫn ổn.
- Rollback: revert commit hoặc khôi phục block `elegantGrid` trước đó.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh 5 layout còn lại trong lượt này.
- Không đổi dữ liệu thật Convex.
- Không đổi form admin, style labels, schema hay renderer wiring.

# XII. Open Questions (Câu hỏi mở)
Không có câu hỏi mở; yêu cầu đã rõ là sửa `Elegant Grid` bám ảnh 1, đặc biệt tách header khỏi nền và làm thanh chữ nhật nhỏ gọn hơn.
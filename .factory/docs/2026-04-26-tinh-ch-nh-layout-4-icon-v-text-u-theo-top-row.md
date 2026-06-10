# I. Primer

## 1. TL;DR kiểu Feynman
- Layout 4 vẫn lệch vì icon box cao `44px`, còn title bắt đầu ở mép trên của text block; hai thứ không có cùng “đường chuẩn” rõ ràng.
- Chỉnh `items-start` chỉ làm icon bám trên, nhưng icon vẫn thấp hơn vì surface 44px được căn giữa icon bên trong.
- Cách đúng là giảm surface/icon của Layout 4 khi ở chế độ trái và thêm `pt` rất nhỏ cho text hoặc icon để đường title và icon nhìn cân bằng.
- Chỉ chỉnh Layout 4, không động Layout 1/2/3/5/6.

## 2. Elaboration & Self-Explanation
Trong ảnh mới, Layout 4 đang là `Icon Cards`: card có icon bên trái và text bên phải. Code hiện tại:

```tsx
<div className="flex items-start gap-3">
  {renderAlignedMedia({ surfaceClassName: 'flex h-11 w-11 ...' })}
  <div className="min-w-0 flex-1">
    <h3 className="text-base font-semibold">...</h3>
```

Khi icon surface cao `h-11` (44px), icon nằm giữa surface. Title bắt đầu ngay từ đầu text block. Mắt người thấy icon thấp/không đều với title line, nhất là khi title dài 1–2 dòng khác nhau giữa các card.

## 3. Concrete Examples & Analogies
Ví dụ: title ở card 1 có 2 dòng, card 2 có 1 dòng. Nếu icon box cao 44px và title không có line-height/padding đồng bộ, card 1 nhìn như icon nằm lệch với dòng đầu, card 2 lại nhìn hơi cao/thấp khác.

Analogy: giống căn ảnh đại diện với tên người trong danh sách chat. Nếu avatar quá to và tên bắt đầu sát đỉnh, avatar sẽ nhìn như không cùng hàng với tên. Cần hoặc giảm avatar, hoặc thêm khoảng đệm nhỏ để hàng đầu cân hơn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã đọc lại `components/site/ServicesSectionCore.tsx` mới nhất.
- Layout 4 branch `cards` đang dùng `items-start gap-3`.
- Media surface Layout 4 left vẫn `h-11 w-11`, icon `20`, text `text-base font-semibold` + mô tả `text-sm`.
- Root visual mismatch còn lại là optical alignment (căn thị giác), không còn là double spacing `mr-3`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Độ tin cậy nguyên nhân gốc: Medium-High.
- Root cause: Layout 4 dùng icon surface lớn hơn tỷ lệ text, làm icon center trong surface nhìn lệch so với dòng title đầu.
- Counter-hypothesis 1: Grid/card width làm title wrap khác nhau. Có đúng một phần, nhưng không giải quyết bằng grid vì card width là behavior mong muốn.
- Counter-hypothesis 2: `items-center` tốt hơn `items-start`. Đã thử trước đó và user vẫn thấy lệch; chuyển về center không xử lý title wrap.
- Counter-hypothesis 3: Do data/title quá dài. Có góp phần, nhưng component cần chống lệch với title dài.

# IV. Proposal (Đề xuất)
- Chỉ chỉnh branch `style === 'cards' && mediaPlacement === 'left'`.
- Giảm media surface từ `h-11 w-11` xuống `h-10 w-10` để tỷ lệ gần text hơn.
- Giảm image class tương ứng từ `h-11 w-11` xuống `h-10 w-10`.
- Giữ `items-start gap-3`.
- Thêm `leading-tight` cho title và `leading-5` cho description để text block ổn định hơn.
- Có thể thêm `pt-0.5` cho text block nếu sau khi giảm surface vẫn cần cân thị giác.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — chỉ thay đổi class trong Layout 4 branch left để căn icon/text đều hơn.

# VI. Execution Preview (Xem trước thực thi)
1. Sửa `surfaceClassName` của Layout 4 left: `h-11 w-11` → `h-10 w-10`.
2. Sửa `imageClassName` của Layout 4 left: `h-11 w-11` → `h-10 w-10`.
3. Sửa title/description Layout 4 left: thêm `leading-tight` và `leading-5`.
4. Nếu cần, thêm `pt-0.5` vào text wrapper để cân optical alignment.
5. Chạy `bunx tsc --noEmit`.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Typecheck: `bunx tsc --noEmit`.
- Static check:
  - Chỉ Layout 4 branch left thay đổi.
  - Không đổi controls, colors, fonts, style labels.
- Visual check:
  - Layout 4 với icon/ảnh trái: icon không còn nhìn trôi thấp/cao so với title.
  - Title 1 dòng và 2 dòng vẫn có cảm giác cùng nhịp.

# VIII. Todo
- [ ] Chỉnh size media surface Layout 4 left.
- [ ] Chỉnh line-height text Layout 4 left.
- [ ] Typecheck.
- [ ] Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 4 nhìn đều hơn ở 3 card có độ dài title khác nhau.
- Icon/ảnh bám cạnh trái đều, không trôi thấp/cao so với dòng title đầu.
- Không ảnh hưởng Layout 1/2/3/5/6.
- Typecheck pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: icon Layout 4 nhỏ hơn một chút so với trước.
- Nếu user muốn icon lớn lại, rollback chỉ 2–4 class trong branch Layout 4 left.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi layout tổng thể.
- Không đổi dữ liệu, schema, admin controls, màu, font.
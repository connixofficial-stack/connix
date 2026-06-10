# I. Primer

## 1. TL;DR kiểu Feynman
- Vấn đề còn lại của Layout 4 không phải do `gap` hay size icon nữa, mà do wrapper media vẫn bị `self-center` từ helper chung.
- Parent của Layout 4 đang `items-start`, nhưng child media tự ép `self-center`, nên icon/ảnh mỗi card bị kéo vào giữa theo chiều cao text.
- Card nào text dài hơn thì icon tụt thấp hơn; card nào text ngắn thì icon cao hơn, nhìn thành “không đều”.
- Cách sửa đúng: cho Layout 4 có wrapper media riêng kiểu `self-start` và lane cố định, không dùng `self-center` của helper chung.
- Chỉ cần sửa shared renderer `ServicesSectionCore.tsx`, preview và site sẽ cùng đúng vì dùng chung source of truth.

## 2. Elaboration & Self-Explanation
Audit hiện tại trong `components/site/ServicesSectionCore.tsx`:

```tsx
const getMediaWrapperClassName = (...) => {
  if (placement === 'left') {
    return 'mb-0 flex shrink-0 items-center justify-center self-center';
  }
}
```

Layout 4 left đang là:

```tsx
<div className="flex items-start gap-3">
  {renderAlignedMedia({ placement: mediaPlacement, ... })}
  <div className="min-w-0 flex-1 pt-0.5">...</div>
</div>
```

Nhìn bề ngoài parent đã `items-start`, nhưng child media wrapper có `self-center`, nên icon lane vẫn không bám top. Đây là lý do dù đã giảm size icon/surface, cảm giác lệch vẫn còn.

## 3. Concrete Examples & Analogies
Ví dụ:
- Card A: title 2 dòng + description dài → text block cao hơn.
- Card B: title 1 dòng → text block thấp hơn.
- Nếu icon wrapper là `self-center`, card A sẽ kéo icon xuống thấp hơn card B.

Analogy: giống avatar trong danh sách chat. Nếu avatar căn giữa theo cả đoạn tin nhắn, người nhắn 3 dòng sẽ có avatar tụt xuống; muốn đều thì avatar phải bám top theo dòng tên.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã đọc lại `components/site/ServicesSectionCore.tsx` mới nhất sau external modification.
- Source of truth: cả preview và site đều render qua `components/site/ServicesSectionCore.tsx`.
- Layout 4 left hiện có:
  - parent row: `flex items-start gap-3`
  - media surface: `h-10 w-10`
  - text block: `pt-0.5`
- Nhưng helper `getMediaWrapperClassName()` vẫn áp `self-center` cho toàn bộ `placement='left'`.
- Kết luận: root cause hiện tại là alignment contract ở wrapper media, không phải spacing ngang.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High.
- Root cause: `self-center` trong helper chung override ý đồ `items-start` của Layout 4 left.
- Counter-hypothesis 1: icon còn hơi to. Đã giảm `20 -> 18`, `44px -> 40px` nhưng user vẫn thấy lệch, nên đây không phải nguyên nhân chính.
- Counter-hypothesis 2: `gap-3` chưa đúng. Gap chỉ xử lý khoảng cách ngang, không sửa lệch dọc giữa các card.
- Counter-hypothesis 3: do title dài/ngắn khác nhau. Đây là điều kiện làm lộ bug; root cause vẫn là `self-center` khiến card cao thấp khác nhau thì icon đổi vị trí.

# IV. Proposal (Đề xuất)
- Thêm `wrapperClassName?: string` vào `renderAlignedMedia()`.
- Giữ helper chung như hiện tại cho các layout khác để tránh side-effect.
- Riêng Layout 4 left truyền wrapper override:
  - `wrapperClassName: 'mt-0.5 flex shrink-0 self-start items-start justify-center'`
- Giữ lại các chỉnh đã đúng trước đó của Layout 4:
  - `iconSize: 18`
  - `surfaceClassName: 'flex h-10 w-10 items-center justify-center rounded-lg'`
  - `text block: pt-0.5`
  - `title: leading-tight`, `description: leading-5`
- Nếu sau khi bỏ `self-center` vẫn còn lệch rất nhẹ, chỉ fine-tune `mt-0.5 -> mt-1` tại riêng Layout 4, không động helper chung.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx`
  - Vai trò hiện tại: shared site/preview renderer cho Services.
  - Thay đổi: thêm wrapper override cho media và áp dụng riêng ở Layout 4 left để icon lane bám top ổn định.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc/chỉnh signature `renderAlignedMedia()` để nhận `wrapperClassName` optional.
2. Đổi wrapper div dùng `wrapperClassName ?? getMediaWrapperClassName(...)`.
3. Trong branch `style === 'cards'` + `mediaPlacement === 'left'`, truyền class override `self-start`.
4. Review tĩnh xem Layout 1/2/3/5/6 không bị đổi behavior.
5. Chạy `bunx tsc --noEmit`.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Typecheck: `bunx tsc --noEmit`.
- Static verification:
  - Layout 4 left không còn phụ thuộc `self-center` từ helper mặc định.
  - Các layout khác vẫn giữ rendering cũ.
- Visual repro:
  - Chọn Layout 4.
  - Chọn icon/ảnh bên trái.
  - So 3 card có tiêu đề ngắn/dài khác nhau.
  - Pass khi mép trên icon/ảnh bám cùng nhịp với dòng title đầu, không card nào tụt xuống rõ rệt.

# VIII. Todo
- [ ] Thêm `wrapperClassName` vào `renderAlignedMedia`.
- [ ] Override wrapper riêng cho Layout 4 left.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 4 khi căn trái icon/ảnh nhìn đều giữa các card như ảnh user mong muốn.
- Icon/ảnh không bị căn giữa theo chiều cao text block.
- Không làm lệch Layout 1/2/3/5/6.
- Typecheck pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: thay đổi chỉ thêm 1 optional prop và dùng riêng cho Layout 4 left.
- Rollback đơn giản: bỏ `wrapperClassName` ở Layout 4 hoặc revert helper optional.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi màu, font, controls, desktopColumns, title/subtitle, schema.
- Không refactor tổng thể các layout còn lại.

# XII. Open Questions (Câu hỏi mở)
- Không có ambiguity lớn; chỉ còn bước fine-tune nhỏ `mt-0.5` nếu sau fix root cause mà optical alignment vẫn cần chỉnh thêm.
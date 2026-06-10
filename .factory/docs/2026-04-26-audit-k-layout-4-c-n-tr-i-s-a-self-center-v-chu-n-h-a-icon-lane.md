# I. Primer

## 1. TL;DR kiểu Feynman
- Lần trước sửa size icon nhưng chưa chạm đúng nguyên nhân: `renderAlignedMedia()` vẫn bọc icon bằng class `self-center` khi `mediaPlacement='left'`.
- Trong Layout 4, wrapper ngoài là `items-start`, nhưng `self-center` ở icon thắng, nên icon tự căn giữa theo chiều cao của cả khối text.
- Vì mỗi card có title/description dài ngắn khác nhau, chiều cao text khác nhau → icon ở mỗi card bị “rơi” vào vị trí khác nhau.
- Cách sửa đúng: Layout 4 cần một “icon lane” riêng, `self-start`, không dùng `self-center` của helper chung.
- Đồng thời giữ một chiều rộng cố định cho icon lane để text của các card bắt đầu đều.

## 2. Elaboration & Self-Explanation
Audit code hiện tại trong `components/site/ServicesSectionCore.tsx`:

```tsx
const getMediaWrapperClassName = (...) => {
  if (placement === 'left') {
    return 'mb-0 flex shrink-0 items-center justify-center self-center';
  }
}
```

Layout 4 left hiện tại:

```tsx
<div className="flex items-start gap-3">
  {renderAlignedMedia({ placement: mediaPlacement, ... })}
  <div className="min-w-0 flex-1 pt-0.5">...</div>
</div>
```

Dù parent là `items-start`, media wrapper tự có `self-center`, nên icon không bám top row. Nó căn giữa theo chiều cao row. Nếu card 1 có title 2 dòng, row cao hơn; icon bị kéo xuống khác với card title 1 dòng. Đây là lý do ảnh user gửi vẫn thấy 3 card không đều.

## 3. Concrete Examples & Analogies
Ví dụ:
- Card A title 2 dòng → text block cao hơn → icon bị `self-center` kéo xuống giữa khối cao.
- Card B title 1 dòng → text block thấp hơn → icon nằm cao hơn tương đối.

Analogy: giống danh sách chat có avatar. Nếu avatar luôn căn giữa theo toàn bộ đoạn tin nhắn, người có tin nhắn 3 dòng sẽ làm avatar tụt xuống; muốn đều với tên người dùng thì avatar phải bám top của dòng tên, không căn giữa toàn đoạn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã đọc lại `ServicesSectionCore.tsx` bản mới nhất sau cảnh báo external modification.
- Layout 4 left đã có `items-start gap-3`, icon `18`, surface `h-10 w-10`, text có `pt-0.5`.
- Nhưng `renderAlignedMedia()` vẫn dùng `getMediaWrapperClassName()` và helper này vẫn trả `self-center` cho mọi `placement='left'`.
- Root mismatch hiện tại không còn là size icon chính, mà là alignment contract của media wrapper.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Độ tin cậy nguyên nhân gốc: High.
- Root cause: `self-center` trong media wrapper override `items-start` của Layout 4, làm icon căn giữa theo chiều cao text block thay vì bám top row.
- Counter-hypothesis 1: icon quá to. Đã giảm từ `20/44px` xuống `18/40px` nhưng user vẫn thấy lệch, nên size không phải nguyên nhân chính.
- Counter-hypothesis 2: gap chưa đúng. Gap ảnh hưởng khoảng cách ngang, không giải quyết lệch dọc.
- Counter-hypothesis 3: text dài ngắn khác nhau. Đây là điều kiện làm lỗi lộ rõ, nhưng component phải xử lý bằng top-alignment ổn định.

# IV. Proposal (Đề xuất)
- Thêm optional param `wrapperClassName?: string` cho `renderAlignedMedia()`.
- Default vẫn dùng `getMediaWrapperClassName()` để không phá Layout 1/2/3/5/6.
- Riêng Layout 4 left truyền wrapper override:
  - `wrapperClassName: 'mt-0.5 flex shrink-0 items-start justify-center'`
- Giữ media surface Layout 4 left ở `h-10 w-10`, icon `18`.
- Giữ text block `pt-0.5`, `leading-tight`, `leading-5`.
- Nếu sau override vẫn lệch nhẹ do nét icon SVG khác nhau, bước dự phòng là đổi `mt-0.5` thành `mt-1` hoặc bỏ `pt-0.5`; nhưng trước tiên chỉ sửa đúng root cause `self-center`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — thêm `wrapperClassName` optional cho helper render media và áp dụng duy nhất cho Layout 4 left.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật signature `renderAlignedMedia()` thêm `wrapperClassName?: string`.
2. Đổi wrapper div trong helper thành:
   ```tsx
   <div className={wrapperClassName ?? getMediaWrapperClassName(placement, align)}>
   ```
3. Trong Layout 4 left, truyền `wrapperClassName: 'mt-0.5 flex shrink-0 items-start justify-center'`.
4. Không đổi layout khác.
5. Chạy `bunx tsc --noEmit`.
6. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static check:
  - Layout 4 left không còn dùng `self-center` media wrapper.
  - Layout 1/2/3/5/6 vẫn dùng default helper.
  - Không đổi controls, colors, labels, schema.
- Typecheck: chạy `bunx tsc --noEmit`.
- Visual check:
  - Layout 4, media trái: icon của 3 card bám cùng top row với title.
  - Card title 1 dòng và 2 dòng không kéo icon xuống khác nhau.

# VIII. Todo
- [ ] Thêm `wrapperClassName` cho `renderAlignedMedia`.
- [ ] Override wrapper chỉ ở Layout 4 left.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 4 khi căn trái nhìn đều giữa các card trong ảnh user gửi.
- Icon/ảnh không bị căn giữa theo chiều cao text block.
- Các layout 1/2/3/5/6 không đổi behavior.
- Typecheck pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: chỉ thêm optional helper param và dùng riêng Layout 4.
- Nếu icon hơi cao/thấp sau khi bỏ `self-center`, rollback/tune chỉ class `mt-0.5` ở Layout 4.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi thiết kế card tổng thể.
- Không đổi màu, font, desktopColumns, title/subtitle, icon placement controls.
- Không đổi data/schema.
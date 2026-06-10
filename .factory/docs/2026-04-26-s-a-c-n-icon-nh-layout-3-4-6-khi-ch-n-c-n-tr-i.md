# I. Primer

## 1. TL;DR kiểu Feynman
- Vấn đề không phải chỉ là `items-center`; icon/ảnh vẫn lệch vì `renderAlignedMedia()` tự thêm `mr-3` khi `placement='left'`, trong khi layout 3/4/6 lại thêm `gap-*` ở wrapper ngoài.
- Kết quả là layout 3/4/6 bị “2 lần khoảng cách” hoặc lệch nhịp so với layout 1/2/5.
- Cách sửa đúng: tách class media cho case `left` theo từng layout, tránh cộng dồn `mr-3 + gap`.
- Đồng thời layout 3 nên bỏ cấu trúc card dọc khi chọn `left` và đi theo strip-row giống layout 1/2/5.
- Layout 4 và 6 cũng cần dùng cùng nhịp hàng ngang: media fixed-width, text flex-1, align center.

## 2. Elaboration & Self-Explanation
Hiện tại `components/site/ServicesSectionCore.tsx` đã có sửa `Layout 3` sang `flex items-center gap-4`, `Layout 4` sang `flex items-center gap-4`, và `Layout 6` sang `items-center`. Nhưng helper chung `getMediaWrapperClassName()` vẫn trả về `mr-3` cho tất cả media `left`:

```tsx
if (placement === 'left') {
  return 'mb-0 mr-3 flex items-center justify-center self-center';
}
```

Vì vậy wrapper ngoài có `gap-4`, wrapper media lại có `mr-3`; icon bị đẩy không đều. Với ảnh chụp của user, Layout 3 vẫn nhìn giống icon/ảnh đang nằm giữa các cột và không cùng nhịp với text vì mỗi item có chiều rộng/cấu trúc khác nhau.

## 3. Concrete Examples & Analogies
Ví dụ cụ thể: ở Layout 3 hiện tại, một item có:

```tsx
<article className="flex items-center gap-4 ...">
  <div className="mb-0 mr-3 flex ...">icon</div>
  <div>text</div>
</article>
```

Khoảng cách thực tế không còn là `gap-4`, mà là `gap-4 + mr-3`. Giống như đã chèn spacer giữa 2 cột rồi lại thêm margin vào icon, nên hàng ngang bị lệch.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã đọc lại `components/site/ServicesSectionCore.tsx` bản mới nhất theo cảnh báo external modification.
- `Layout 3` (`bigNumber`) hiện có `flex items-center gap-4` khi `mediaPlacement='left'`, nhưng media helper vẫn inject `mr-3`.
- `Layout 4` (`cards`) cũng có `gap-4` ngoài + `mr-3` trong media helper.
- `Layout 6` (`timeline`) có `gap-2.5` ngoài + `mr-3` trong media helper.
- `Layout 1/2/5` nhìn ổn hơn vì row strip của chúng dùng cấu trúc nhất quán hơn, nhưng vẫn chịu rủi ro nếu tiếp tục dùng helper có margin ẩn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Độ tin cậy nguyên nhân gốc: High.
- Root cause: helper `getMediaWrapperClassName()` đang hardcode `mr-3` cho mọi `placement='left'`, gây double spacing khi parent layout đã dùng `gap-*`.
- Counter-hypothesis 1: do `items-start` vs `items-center`. Đã sửa trước đó nhưng ảnh vẫn lệch, nên không đủ.
- Counter-hypothesis 2: do text quá dài. Có thể góp phần, nhưng không giải thích được khoảng icon/ảnh lệch nhịp đều giữa các layout.
- Counter-hypothesis 3: do grid column width. Có ảnh hưởng, nhưng Layout 1/2/5 cũng dùng grid mà vẫn ổn hơn; vấn đề chính nằm ở contract media-left.

# IV. Proposal (Đề xuất)
- Sửa helper `getMediaWrapperClassName()` để khi `placement='left'` không tự thêm `mr-3` nữa.
- Giữ spacing của layout bằng `gap-*` ở parent row; đây là nguồn spacing rõ ràng hơn.
- Với `Layout 3`, đảm bảo branch left là:
  - `article`: `flex items-center gap-4 ...`
  - media wrapper: không margin ẩn, fixed-size surface.
  - text: `min-w-0 flex-1 text-left`.
- Với `Layout 4`, giữ `div.flex.items-center.gap-4`, media wrapper bỏ margin ẩn.
- Với `Layout 6`, giữ `div.flex.items-center.gap-2.5`, media wrapper bỏ margin ẩn.
- Không đụng Layout 1/2/5 nếu không cần, nhưng việc bỏ `mr-3` ở helper cũng sẽ làm chúng sạch hơn vì parent của 1/2/5 đã có `gap-*`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — renderer shared cho preview và site Services; thay đổi contract spacing của media khi `mediaPlacement='left'` để layout 3/4/6 căn đều.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại đoạn helper `getMediaWrapperClassName()` và các branch Layout 3/4/6.
2. Đổi left media wrapper từ `mb-0 mr-3 flex items-center justify-center self-center` thành `mb-0 flex shrink-0 items-center justify-center self-center` hoặc tương đương không margin.
3. Rà Layout 3/4/6 để parent row là nơi kiểm soát spacing bằng `gap-*`.
4. Chạy typecheck theo quy định vì có sửa TS/TSX.
5. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy `bunx tsc --noEmit`.
- Kiểm tra tĩnh:
  - Không còn `mr-3` trong media-left helper.
  - Layout 3/4/6 left branch đều có `gap-*` ở parent.
  - Preview và site dùng cùng `ServicesSectionCore.tsx`, nên parity giữ nguyên.
- Kiểm tra trực quan sau khi user/tester reload preview:
  - Chọn `Layout 3`, `Layout 4`, `Layout 6`.
  - Đặt icon/ảnh = trái.
  - Icon/ảnh nằm sát trái ổn định trong mỗi item, spacing tới text đều, không bị trôi vào giữa.

# VIII. Todo
- [ ] Sửa left media helper bỏ margin ẩn.
- [ ] Review lại Layout 3/4/6 branch left.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 3/4/6 khi chọn icon/ảnh bên trái có khoảng cách icon-text đều như Layout 1/2/5.
- Không còn double spacing từ `gap + mr-3`.
- Không đổi style labels, color logic, desktopColumns, title/subtitle controls.
- Typecheck pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: thay đổi helper chung có thể làm Layout 1/2/5 hơi sát hơn nếu chúng đang dựa vào `mr-3` ẩn.
- Giảm rủi ro bằng cách parent layout của 1/2/5 đã có `gap-*`, nên bỏ margin ẩn là đúng contract.
- Rollback: revert một dòng helper hoặc revert commit local.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi thiết kế tổng thể layout.
- Không đổi màu, font, số cột, schema, create/edit form.
- Không thêm control mới.
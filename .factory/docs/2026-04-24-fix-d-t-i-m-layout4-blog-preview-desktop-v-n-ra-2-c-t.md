# I. Primer

## 1. TL;DR kiểu Feynman
- `layout4` khác 5 layout còn lại vì nó dùng `container query`, không dùng breakpoint kiểu thường.
- Preview admin hiện đang nới sai chỗ: nới width ở wrapper ngoài và node con, nhưng `layout4` lại đo theo `@container` ở outer shell riêng của nó.
- Vì thế dù có tăng `max-w` hoặc `min-w`, grid vẫn có thể giữ 2 cột nếu container mà nó thực sự đo không đổi đúng điểm.
- Site thật đúng vì context site không đi qua preview shell này.
- Fix đúng là override breakpoint riêng cho `layout4` trong `preview context`, không cố “đẩy rộng” preview bằng wrapper nữa.

## 2. Elaboration & Self-Explanation
Audit kỹ hơn cho thấy mình đã bám sai trực giác ở các lần trước: cứ nghĩ preview chưa đủ rộng nên tăng width là đủ. Nhưng `layout4` không đơn giản đo theo viewport ngoài cùng.

Trong `BlogSectionShared.tsx`:
- `layout4` outer shell luôn có `@container`
- grid của nó dùng `@[600px]:grid-cols-2 @[900px]:grid-cols-3`

Điểm quan trọng là: breakpoint 3 cột đang phụ thuộc vào **container query của chính outer shell layout4**, chứ không phải chỉ phụ thuộc vào width card preview nhìn bằng mắt.

Trong `BlogPreview.tsx`, các lần sửa trước đã:
- nới `deviceWidthClass` lên `max-w-[1440px]`
- thêm `min-w-[960px]` cho viewport của `layout4`

Nhưng nếu node đang được nới không phải node mà `@[900px]` thật sự đo, hoặc layout vẫn bị khống chế bởi contract `outerShellClassName = max-w-7xl px-4 sm:px-6 lg:px-8 @container`, thì nhìn vẫn sẽ là 2 cột.

Nói ngắn gọn:
- bug không còn là “preview quá nhỏ” một cách chung chung,
- mà là “preview đang dùng sai loại breakpoint cho layout4”.

Nếu site thật OK còn preview sai, thì cách an toàn nhất là tách rule preview của `layout4` ra khỏi rule runtime site.

## 3. Concrete Examples & Analogies
### Ví dụ bám repo
Trong `BlogSectionShared.tsx`:
- `getOuterShellClassName()` trả về cho `layout4`: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 @container`
- grid: `@[600px]:grid-cols-2 @[900px]:grid-cols-3`

=> 3 cột chỉ xuất hiện khi **container của outer shell** vượt ngưỡng đó.

### Analogy đời thường
Giống như bạn tăng diện tích phòng khách, nhưng cái quy tắc xếp 3 ghế lại đang đo chiều rộng của tấm thảm ở giữa phòng. Nếu tấm thảm không đổi, số ghế vẫn không đổi.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `layout4` preview desktop vẫn là 2 cột dù đã tăng `max-w` và `min-w`.
  - 5 layout khác không bị.
  - Site thật vẫn 3 cột đúng.
- Evidence:
  - `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
    - `layout4` outer shell có `@container`
    - grid dùng `@[900px]:grid-cols-3`
  - `app/admin/home-components/blog/_components/BlogPreview.tsx`
    - đã có các lần thử nới `max-w-[1440px]` và `min-w-[960px]`
    - nhưng user xác nhận UI vẫn không đổi
  - `components/site/BlogSection.tsx`
    - site runtime tái dùng cùng shared section và đang OK
- Expected vs actual:
  - Expected: preview desktop `layout4` hiển thị 3 cột như site
  - Actual: preview desktop vẫn 2 cột

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High
Vì evidence cho thấy các thay đổi về width shell ngoài không tạo thay đổi hành vi; nghĩa là điểm đo breakpoint không nằm ở nơi đã nới width.

## Nguyên nhân gốc
Root cause là `layout4` đang dùng **container-query breakpoint runtime-oriented** ngay trong preview. Container này không map ổn định với desktop preview shell của admin. Vì vậy preview desktop không đạt 3 cột như site, dù shell ngoài đã được nới.

Nói kỹ hơn:
- fix trước đó tác động vào `PreviewWrapper` và preview viewport
- nhưng rule quyết định 2/3 cột lại nằm ở `BlogSectionShared layout4` qua `@container`
- preview là một môi trường khác site, nên dùng đúng runtime breakpoint ở preview không còn đáng tin cho layout4

## Counter-Hypothesis (Giả thuyết đối chứng)
### a) Site thật cũng đang sai nhưng chưa nhìn ra
- Confidence: Low
- Lý do: user xác nhận site thật OK.

### b) Chỉ cần tăng width hơn nữa là đủ
- Confidence: Low
- Lý do: đã tăng mà UI không đổi; chứng tỏ không phải chỉ thiếu width wrapper ngoài.

### c) Dữ liệu preview làm grid nhìn như 2 cột
- Confidence: Low
- Lý do: layout4 vẫn slice 3 item, bug nằm ở rule chia cột.

```mermaid
flowchart TD
  A[BlogPreview shell] --> B[Viewport wrapper]
  B --> C[layout4 outer shell @container]
  C --> D[@900px query]
  D --> E[2 hoặc 3 cột]
  F[Preview shell width tweaks] -. không chạm đúng điểm đo .-> D
  G[Preview-specific grid rule] --> E
```

# IV. Proposal (Đề xuất)
## Hướng đề xuất (Recommend) — Confidence 96%
Sửa trực tiếp trong `BlogSectionShared.tsx` nhưng **chỉ cho `layout4` + `context === "preview"` + `device === "desktop"`**, để preview desktop dùng grid 3 cột cố định thay vì phụ thuộc `@[900px]` runtime query.

## Cách làm cụ thể
1. Giữ site runtime nguyên trạng.
2. Trong nhánh `layout4` của `BlogSectionShared.tsx`, tách class grid:
   - nếu `context === 'preview' && device === 'desktop'` -> dùng `grid-cols-3`
   - ngược lại -> giữ `grid-cols-1 @[600px]:grid-cols-2 @[900px]:grid-cols-3`
3. Không đụng các layout khác.
4. Có thể giữ hoặc rollback các width tweak trước đó trong `BlogPreview.tsx` nếu sau audit thấy không còn cần; nhưng trọng tâm fix là override grid trong preview context.

## Vì sao đây là hướng tốt nhất
- Fix đúng nơi quyết định 2/3 cột.
- Không phụ thuộc vào width budgeting phức tạp của shell preview.
- Không ảnh hưởng site runtime vì condition bó hẹp trong preview desktop.
- Dễ verify và rollback.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
  - Vai trò hiện tại: render layout blog dùng chung cho site và preview.
  - Thay đổi: thêm rule grid riêng cho `layout4` ở `preview desktop` để luôn hiển thị 3 cột.

- Có thể sửa gọn lại: `app/admin/home-components/blog/_components/BlogPreview.tsx`
  - Vai trò hiện tại: shell preview blog.
  - Thay đổi dự kiến: chỉ cleanup các width tweak thừa nếu xác nhận không còn cần sau khi fix grid ở shared component.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại nhánh `layout4` trong `BlogSectionShared.tsx`.
2. Tạo biến/class grid riêng cho `preview desktop`.
3. Giữ nguyên rule runtime cho site và các device khác.
4. Review tĩnh `BlogPreview.tsx` xem width tweak nào còn cần.
5. Sau khi bạn duyệt spec thì implement.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở `/admin/home-components/blog/[id]/edit`
- Chọn `layout4`, device desktop
- Pass nếu:
  1. Preview desktop hiển thị đúng 3 cột
  2. Tablet/mobile không bị regress rõ ràng
  3. 5 layout khác không đổi
  4. Site thật vẫn giữ hành vi cũ

# VIII. Todo
1. Override grid class cho `layout4` trong `preview desktop`
2. Giữ nguyên runtime/site rule
3. Rà lại các tweak width cũ ở `BlogPreview.tsx`
4. Commit local sau khi verify trực quan

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `layout4` preview desktop luôn là 3 cột
- Site thật không bị ảnh hưởng
- 5 layout khác không regress
- Không cần tiếp tục phụ thuộc vào width hack ở wrapper ngoài

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính: preview desktop 3 cột nhưng spacing hơi khác site nếu shell quá hẹp
- Rollback dễ vì thay đổi chỉ là condition nhỏ trong nhánh `layout4`

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor lại toàn bộ preview system
- Không đổi breakpoint runtime của site
- Không chỉnh các layout khác nếu không có evidence

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn. Nếu bạn duyệt spec này thì bước tiếp theo là fix ngay tại `BlogSectionShared.tsx` cho `layout4` ở `preview desktop`, thay vì tiếp tục nới width shell ngoài.
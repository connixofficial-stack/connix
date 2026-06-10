# I. Primer

## 1. TL;DR kiểu Feynman
- `layout4` bị 2 cột trong preview desktop vì nó đo breakpoint theo `container query`, không đo theo viewport như cảm giác nhìn ngoài.
- Site thật vẫn đúng 3 cột, nên lỗi không nằm ở `BlogSectionShared` runtime mà nằm ở khung preview admin.
- Preview desktop hiện bị giới hạn bởi `PreviewWrapper max-w-7xl` cộng thêm `BrowserFrame`, padding section và padding shell, nên container thực mà `layout4` đo bị hẹp hơn tưởng tượng.
- Việc thêm `min-w-[960px]` ở node con trước đó không giúp nhiều vì parent shell vẫn bị cap chiều rộng.
- Fix đúng là nới riêng desktop preview width cho `layout4` ở `BlogPreview`, không đụng site runtime và không chạm 5 layout còn lại.

## 2. Elaboration & Self-Explanation
Triệu chứng hiện tại rất đặc trưng:
- chỉ `layout4` lỗi,
- 5 layout còn lại bình thường,
- site thật bình thường.

Điều đó cho thấy đây không phải lỗi dữ liệu, cũng không phải lỗi chung của mọi preview blog. Nó là lỗi của **cơ chế breakpoint riêng** mà `layout4` đang dùng.

`layout4` khác các layout còn lại ở chỗ nó có `@container` riêng trên outer shell và grid của nó dùng:
- `@[600px]:grid-cols-2`
- `@[900px]:grid-cols-3`

Nghĩa là muốn lên 3 cột, cái container gần nhất phải thật sự vượt ngưỡng 900px. Trong admin preview, nhìn bằng mắt có vẻ “đủ rộng”, nhưng bề rộng thực đã bị trừ bởi nhiều lớp:
- `PreviewWrapper` desktop max width
- `BrowserFrame` border + browser chrome
- `section px-4`
- `baseSiteShell px-4 sm:px-6 lg:px-8`

Vì vậy container query của `layout4` trong preview dễ rơi về vùng chỉ đủ 2 cột. Trong khi site thật không đi qua shell preview này nên vẫn đủ rộng và lên 3 cột.

## 3. Concrete Examples & Analogies
### Ví dụ bám repo
- `BlogSectionShared.tsx` layout4:
  - outer shell có `@container`
  - grid có `@[900px]:grid-cols-3`
- `BlogPreview.tsx` hiện tại:
  - desktop preview vẫn bị giới hạn bởi `deviceWidths.desktop = w-full max-w-7xl`

=> Nhìn ngoài là desktop lớn, nhưng container mà `layout4` đo không hẳn lớn như vậy.

### Analogy đời thường
Giống như bạn nhìn một căn phòng lớn, nhưng quy tắc xếp 3 ghế lại chỉ đo phần bục sân khấu bên trong phòng. Phòng rộng không có nghĩa bục đủ rộng.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `layout4` preview desktop vẫn render 2 cột.
  - 5 layout còn lại không gặp lỗi này.
  - Site runtime của blog vẫn đúng 3 cột.
- Evidence:
  - `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
    - outer shell của `layout4` có `@container`
    - grid dùng `@[900px]:grid-cols-3`
  - `app/admin/home-components/blog/_components/BlogPreview.tsx`
    - nhánh desktop của `layout4` hiện chỉ tăng `min-w` ở viewport node con
  - `app/admin/home-components/_shared/hooks/usePreviewDevice.tsx`
    - desktop preview đang bị cap ở `w-full max-w-7xl`
  - `app/admin/home-components/_shared/components/BrowserFrame.tsx`
    - thêm border/browser shell và `overflow-hidden`
  - `components/site/BlogSection.tsx`
    - site thật reuse `BlogSectionShared`, nên runtime logic không sai.
- Expected vs actual:
  - Expected: preview desktop `layout4` lên 3 cột như site.
  - Actual: preview desktop `layout4` vẫn ở 2 cột.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High
Lý do: chỉ `layout4` dùng contract `@container` đặc thù, và evidence width budgeting ở shell preview khớp trực tiếp với triệu chứng.

## Nguyên nhân gốc
Root cause là **preview shell desktop hiện không cấp đủ width thực tế cho container query của `layout4`**, dù nhìn bên ngoài có vẻ rộng. `min-w` được đặt ở node con không mở rộng được parent shell đang bị giới hạn bởi `PreviewWrapper max-w-7xl` và `BrowserFrame`, nên breakpoint `@[900px]` không được kích hoạt ổn định trong preview.

## Giả thuyết đối chứng
### a) `BlogSectionShared` viết sai breakpoint
- Confidence: Low
- Lý do: site thật đang OK với đúng cùng code.

### b) Dữ liệu preview thiếu item nên nhìn như 2 cột
- Confidence: Low
- Lý do: preview vẫn có 3 item; lỗi là grid width, không phải item count.

### c) Toàn bộ BlogPreview shell đều sai cho mọi layout
- Confidence: Medium
- Lý do: shell có ảnh hưởng, nhưng chỉ `layout4` lỗi vì chỉ nó dùng container-query đặc thù.

```mermaid
flowchart TD
  A[PreviewWrapper max-w-7xl] --> B[BrowserFrame]
  B --> C[Preview viewport]
  C --> D[layout4 outer shell @container]
  D --> E{@900px reached?}
  E -- No --> F[grid 2 cột]
  E -- Yes --> G[grid 3 cột]
```

# IV. Proposal (Đề xuất)
## Hướng đề xuất (Recommend) — Confidence 95%
Sửa riêng width contract của desktop preview cho `layout4` trong `BlogPreview.tsx` bằng cách **nới parent shell cho chính preview này**, thay vì chỉ tăng `min-width` ở node con.

## Cách làm cụ thể
1. Giữ nguyên `BlogSectionShared.tsx` và `components/site/BlogSection.tsx`.
2. Trong `BlogPreview.tsx`, tạo width contract riêng cho trường hợp:
   - `device === 'desktop' && selectedStyle === 'layout4'`
3. Nới shell ngoài bằng một trong hai cách tương đương:
   - truyền `deviceWidthClass` riêng lớn hơn `max-w-7xl`, ví dụ `w-full max-w-[1440px]`; hoặc
   - cho `layout4` desktop preview dùng `w-full` / custom wider wrapper ngay ở tầng `PreviewWrapper` input.
4. Không giữ logic “chỉ min-w ở div con” làm fix chính nữa.
5. Sau đó giữ `getPreviewViewportClassName()` của layout4 ở mức đơn giản, vì width đã được giải quyết ở parent shell.

## Vì sao đây là hướng tốt nhất
- Fix đúng root cause: parent shell width, không phải child min-width.
- Không ảnh hưởng site runtime.
- Không động tới 5 layout còn lại.
- Thay đổi nhỏ, dễ rollback.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogPreview.tsx`
  - Vai trò hiện tại: quyết định preview shell và viewport contract của blog trong admin.
  - Thay đổi: cấp width desktop rộng hơn chỉ cho `layout4` preview để container query vượt ngưỡng 900px.

- Không sửa: `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
  - Vai trò hiện tại: render layout blog cho site và preview.
  - Giữ nguyên vì site thật đã đúng.

- Không sửa: `components/site/BlogSection.tsx`
  - Vai trò hiện tại: runtime wrapper cho site thật.
  - Giữ nguyên vì user xác nhận site OK.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại `BlogPreview.tsx` để tách riêng desktop width class cho `layout4`.
2. Gắn custom desktop width contract ở parent shell/`PreviewWrapper` input.
3. Giữ nguyên 5 layout khác.
4. Review tĩnh lại chuỗi width: `PreviewWrapper -> BrowserFrame -> BlogPreview viewport -> BlogSectionShared layout4 @container`.
5. Sau khi bạn duyệt spec thì mới implement.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở `/admin/home-components/blog/[id]/edit`.
- Chuyển sang `layout4`, device desktop.
- Pass nếu:
  1. `layout4` lên đúng 3 cột trong preview.
  2. Không phát sinh crop/scroll ngang mới.
  3. 5 layout còn lại giữ nguyên.
  4. Site runtime không đổi.

# VIII. Todo
1. Tạo desktop width contract riêng cho `layout4` ở `BlogPreview`.
2. Bỏ phụ thuộc vào fix `min-w` ở child node như cơ chế chính.
3. Review tĩnh ảnh hưởng tới 5 layout còn lại.
4. Commit local sau khi verify trực quan.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `layout4` blog preview desktop hiển thị 3 cột.
- 5 layout còn lại không regress.
- Không thay đổi site runtime.
- Không có crop/scroll ngang mới trong preview.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính: nới width quá mức làm preview card nhìn lệch hoặc gây overflow.
- Rollback dễ vì chỉ đụng một nhánh nhỏ trong `BlogPreview.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor lại toàn bộ hệ preview blog.
- Không đổi breakpoint trong `BlogSectionShared` cho site runtime.
- Không chỉnh các layout khác nếu không có evidence regress.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng. Nếu bạn duyệt spec này thì bước tiếp theo là sửa width contract ở parent shell của preview desktop `layout4`, thay vì tiếp tục tăng `min-width` ở node con.
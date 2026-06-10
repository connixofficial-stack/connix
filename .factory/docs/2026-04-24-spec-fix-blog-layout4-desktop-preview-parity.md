# I. Primer
## 1. TL;DR kiểu Feynman
- Tablet và mobile đã đúng; drift chỉ còn ở desktop preview.
- Root cause không còn nằm ở runtime layout nữa, mà nằm ở desktop preview đang thiếu đúng `container query context` cho `layout4`.
- Hiện tại mình đã bỏ `@container` ở desktop preview cho layout4 để tránh co sai, nhưng lại bỏ quá tay, làm grid desktop của layout4 không còn nhận đúng breakpoint context như demo/runtime.
- Cần sửa rất nhỏ nhưng đúng chỗ: desktop preview của layout4 vẫn phải có `@container`, chỉ bỏ phần `max-w-[1400px] mx-auto` gây drift.
- Đây là fix desktop-only cho preview; site runtime và mobile/tablet không nên bị đụng.

## 2. Elaboration & Self-Explanation
Preview parity drift hiện giờ đã thu hẹp còn một lỗi rất cụ thể: desktop preview của `layout4` đang không giống runtime, trong khi tablet/mobile đã ổn.

Audit code cho thấy nguyên nhân là do preview shell và shared layout có quan hệ hơi tinh tế:
- `BlogSectionShared.tsx` cho `layout4` dùng các class `@[600px]`, `@[900px]`, tức là phụ thuộc vào container query.
- Để các breakpoint này hoạt động đúng, phần wrapper của preview phải có `@container`.
- Nhưng ở lần sửa trước, desktop `layout4` trong `BlogPreview.tsx` đã bị đổi thành `w-full flex-1`, tức là mất luôn `@container`.
- Kết quả: desktop preview không còn cùng breakpoint context với runtime/demo, nên bố cục vẫn sai.

Điểm quan trọng là drift desktop hiện tại không phải do thiếu width nữa, mà là do **mất container query root**. Sửa đúng là:
- giữ `@container` cho layout4 desktop preview,
- nhưng không bọc thêm `max-w-[1400px] mx-auto` ở desktop preview cho layout4.

Nói ngắn gọn: trước đó bỏ “cả khung lẫn container”; lần này chỉ cần bỏ phần khung phụ gây drift, còn container root phải giữ lại.

## 3. Concrete Examples & Analogies
### Ví dụ cụ thể bám task
- `BlogSectionShared.tsx` layout4 đang dùng `@[600px]:grid-cols-2 @[900px]:grid-cols-3`.
- Nếu wrapper preview không có `@container`, các mốc này không kích hoạt đúng ngữ cảnh desktop preview.
- Khi đó dù layout code đúng, grid desktop vẫn không ra như runtime.

### Analogy đời thường
- Layout4 giống một thiết bị đo nhiệt độ cần nguồn điện đúng chuẩn.
- `@container` là nguồn điện; `max-w-[1400px] mx-auto` là cái vỏ ngoài làm chật không gian.
- Lần trước đã tháo luôn cả vỏ lẫn dây điện; lần này cần cắm lại dây điện (`@container`) nhưng bỏ cái vỏ gây bó (`max-w`).

# II. Audit Summary (Tóm tắt kiểm tra)
## 1. Observation (Quan sát)
- User xác nhận:
  - site thực đúng,
  - preview tablet/mobile đúng,
  - preview desktop vẫn sai.
- Đây cho thấy bug hiện tại là desktop-preview-specific.

## 2. Evidence (Bằng chứng)
### a) File preview shell
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogPreview.tsx`
- Hàm hiện tại:
  - `getPreviewViewportClassName(device, style)`
  - đang trả `w-full flex-1` cho `device === 'desktop' && style === 'layout4'`
- Điều này làm desktop preview layout4 **không còn `@container`**.

### b) File shared layout
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogSectionShared.tsx`
- `layout4` đang dùng:
  - `@[600px]:grid-cols-2`
  - `@[900px]:grid-cols-3`
- Đây là bằng chứng trực tiếp rằng layout4 cần container root hoạt động đúng.

### c) Runtime path
- Site runtime vẫn đúng nên không cần sửa `components/site/BlogSection.tsx`.
- Lỗi chỉ còn ở preview desktop context.

## 3. Phạm vi ảnh hưởng
- Affected:
  - desktop preview của layout4 trong edit/create
- Không affected nếu sửa đúng:
  - runtime site
  - tablet/mobile preview
  - các layout khác

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
### a) Triệu chứng quan sát được là gì?
- Expected: desktop preview layout4 giống runtime.
- Actual: desktop preview layout4 vẫn lệch, dù mobile/tablet và runtime đã đúng.

### b) Phạm vi ảnh hưởng?
- Chỉ desktop preview của layout4.

### c) Có tái hiện ổn định không?
- Có, ổn định vì `getPreviewViewportClassName()` luôn trả class sai cho case này.

### d) Mốc thay đổi gần nhất?
- Commit trước đã bỏ `max-w-[1400px] mx-auto` bằng cách đổi hẳn class desktop layout4 preview thành `w-full flex-1`.
- Sửa này giải quyết một phần drift nhưng làm mất luôn `@container` root.

### e) Dữ liệu nào đang thiếu?
- Không thiếu. Evidence từ code đủ rõ.

### f) Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
- Giả thuyết runtime layout còn sai: đã loại trừ vì site đúng.
- Giả thuyết data preview khác runtime: confidence thấp.
- Giả thuyết desktop preview thiếu `@container` root: confidence rất cao.

### g) Rủi ro nếu fix sai nguyên nhân?
- Nếu tiếp tục chỉnh shared layout/runtime thì desktop preview vẫn có thể sai, lại dễ làm regress site.

### h) Tiêu chí pass/fail sau khi sửa?
- Desktop preview layout4 giống runtime.
- Tablet/mobile preview vẫn giữ đúng.
- Site runtime không đổi.

## 2. Root Cause Confidence
- High
- Reason: code path hiện tại cho thấy desktop preview layout4 bị mất `@container`, trong khi shared layout4 phụ thuộc trực tiếp vào container query breakpoints.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)
Nếu root cause là shared layout4, thì site/runtime hoặc tablet/mobile cũng phải lệch. Nhưng user xác nhận chỉ desktop preview sai. Do đó nguyên nhân hợp lý nhất là desktop preview context, cụ thể là class wrapper trong `BlogPreview.tsx`.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa đề xuất
Option A (Recommend) — Confidence 98%
- Sửa riêng `getPreviewViewportClassName()` trong `BlogPreview.tsx` cho case `desktop + layout4`.
- Class đúng dự kiến nên là dạng giữ `@container` nhưng bỏ `max-w-[1400px] mx-auto`.

## 2. Cách thực hiện cụ thể
### a) Fix desktop layout4 preview viewport
- Đổi return từ:
  - `w-full flex-1`
- thành một class giữ:
  - `w-full flex-1 @container`
- nhưng không thêm:
  - `max-w-[1400px] mx-auto`

### b) Không đổi shared/runtime
- Không sửa `BlogSectionShared.tsx` trừ khi phát hiện thêm drift ngoài dự kiến.
- Không sửa `components/site/BlogSection.tsx`.

## 3. Mermaid diagram
```mermaid
flowchart TD
  A[Desktop preview wrapper] --> B[@container missing]
  B --> C[layout4 breakpoints drift]
  D[Shared layout4 uses @[600]/@[900]] --> C
  E[Fix: restore @container only] --> F[Desktop preview parity]
```

# V. Files Impacted (Tệp bị ảnh hưởng)
## 1. Preview shell
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogPreview.tsx`
  - Vai trò hiện tại: tạo viewport context cho preview.
  - Thay đổi dự kiến: fix riêng class desktop của `layout4` để giữ `@container` mà không bị `max-w` drift.

## 2. Shared layout
- Không dự kiến sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogSectionShared.tsx`
  - Lý do: shared/runtime hiện đã đúng cho scope này.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh `getPreviewViewportClassName()` cho `desktop + layout4`.
2. Rà create/edit vì cùng dùng `BlogPreview`.
3. Chạy `bunx tsc --noEmit`.
4. Review diff, commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Static verification
- Kiểm tra case `desktop + layout4` có `@container` nhưng không có `max-w-[1400px] mx-auto`.
- Kiểm tra các case khác không đổi.

## 2. Typecheck
- Chạy `bunx tsc --noEmit`.
- Không chạy lint/build/test theo AGENTS.md.

## 3. Visual pass checklist
- Edit preview desktop layout4 giống runtime.
- Create preview desktop layout4 giống runtime.
- Tablet/mobile vẫn đúng.
- Site runtime không đổi.

# VIII. Todo
- [pending] Fix riêng class desktop preview cho layout4 trong `BlogPreview.tsx`.
- [pending] Rà create/edit cùng dùng chung preview.
- [pending] Chạy `bunx tsc --noEmit`.
- [pending] Review diff + commit local, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Desktop preview layout4 giống runtime site.
- Tablet/mobile preview không regress.
- Runtime site không đổi.
- Chỉ sửa preview desktop context, không mở rộng scope.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
## 1. Rủi ro
- Rủi ro thấp vì chỉ chạm một nhánh class của preview shell.

## 2. Rollback
- Revert 1 hunk trong `BlogPreview.tsx` là đủ.

# XI. Out of Scope (Ngoài phạm vi)
- Sửa runtime/site.
- Sửa shared layout4 thêm lần nữa.
- Chỉnh các layout khác.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn; root cause desktop-only đã rõ.
# I. Primer
## 1. TL;DR kiểu Feynman
- Lỗi không nằm riêng ở `layout1`, mà ở cơ chế preview responsive chung cho cả 6 layout.
- Source `C:\Users\VTOS\Downloads\blog-homecomponent\app\page.tsx` đang preview bằng một “khung thiết bị” riêng: desktop/tablet/mobile có padding, rounded, border, ring, min-width và container rules khác nhau.
- Repo hiện tại chỉ đổi `max-width` trong `BlogPreview.tsx`, nên layout bên trong không nhận đủ điều kiện responsive giống source.
- Vì vậy site đúng nhưng preview tablet/mobile sai là hợp logic: site đang render thật theo viewport/site container, còn preview admin đang giả lập thiếu khung.
- Cách sửa đúng là chuẩn hóa lại preview shell cho toàn bộ 6 layout, không vá từng layout riêng lẻ.

## 2. Elaboration & Self-Explanation
- Mình đã đối chiếu source demo và code hiện tại của repo.
- Ở source demo, responsive preview không chỉ là “đổi chiều rộng”. Nó còn đổi cả lớp vỏ bao ngoài: desktop có `min-w-[1024px]`, tablet có width cố định + padding khác, mobile có khung máy + vùng cuộn + status bar giả + home indicator giả. Bên trong còn có `@container` để layout thích ứng theo container thực tế.
- Trong repo hiện tại, `BlogPreview.tsx` chỉ bọc `BlogSectionShared` bằng `max-w-6xl / 768px / 375px`. Cách này thiếu khá nhiều điều kiện layout mà source dựa vào, nên khi render mobile/tablet, tất cả layout đều có thể bị co, vỡ, hoặc hiển thị khác source.
- Nói ngắn gọn: preview đang giả lập “chiều ngang”, nhưng chưa giả lập “môi trường hiển thị”. Vì vậy lỗi xuất hiện diện rộng ở cả 6 layout.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể:
  - Source preview mobile có khối:
    - `w-[390px] h-[844px] rounded-[3rem] ring-[14px] ring-gray-900 overflow-y-auto ...`
  - Repo hiện tại chỉ có:
    - `max-w-[375px]`
- Hai cái này rất khác nhau. Một bên là mô phỏng thiết bị hoàn chỉnh, một bên chỉ là bó chiều rộng.
- Analogy đời thường:
  - Giống như thử một chiếc sofa trong showroom. Source đang dựng cả căn phòng đúng kích thước. Repo hiện tại chỉ đổi chiều ngang bức tường, còn sàn, khoảng lùi, cửa ra vào đều thiếu. Nên nhìn sofa sẽ khác.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/home-components/blog/_components/BlogPreview.tsx` hiện dùng `deviceWidthClass` và chỉ đổi `max-w-*` theo device.
  - Source `C:\Users\VTOS\Downloads\blog-homecomponent\app\page.tsx` có preview shell đầy đủ cho desktop/tablet/mobile, gồm width, min-width, rounded, padding, border top, ring, overflow, fake status bar, fake home indicator, `@container`.
  - `BlogSectionShared.tsx` đang chứa 6 layout theo contract `layout1..layout6`, nên lỗi responsive preview hiện tại ảnh hưởng đồng thời toàn bộ 6 layout.
- Inference:
  - Root cause là preview shell không parity với source, không phải chỉ 1 layout viết sai.
- Decision:
  - Sửa preview shell chung trước; chỉ chỉnh riêng từng layout nếu còn sai sau khi shell đã parity.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause Confidence
- High.
- Lý do: evidence rất rõ giữa `BlogPreview.tsx` và source `app/page.tsx`; khác biệt nằm ở preview container, không chỉ ở markup layout.

## 2. Root Cause
1. Triệu chứng quan sát được là gì (expected vs actual)?
   - Expected: preview mobile/tablet của cả 6 layout nhìn như source demo.
   - Actual: preview admin sai responsive ở mobile/tablet trên nhiều layout.
2. Phạm vi ảnh hưởng?
   - Tất cả 6 layout blog trong admin preview create/edit.
3. Có tái hiện ổn định không?
   - Có, vì shell preview hiện tại dùng chung cho mọi layout.
4. Mốc thay đổi gần nhất?
   - Đợt trước đã port 6 layout và đổi style contract sang `layout1..layout6`, nhưng preview shell vẫn giữ bản giản lược.
5. Dữ liệu nào đang thiếu?
   - Chưa có vòng so ảnh sau khi sửa, nhưng code evidence đủ để chốt plan.
6. Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
   - Có thể vài layout còn sai class riêng. Nhưng kể cả vậy, preview shell vẫn chắc chắn đang sai và phải sửa trước.
7. Rủi ro nếu fix sai nguyên nhân?
   - Nếu đi vá từng layout mà không sửa shell, lỗi responsive sẽ tiếp tục lặp ở layout khác.
8. Tiêu chí pass/fail sau khi sửa?
   - Chuyển device desktop/tablet/mobile trong admin preview cho cả 6 layout không còn lệch lớn so source demo.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)
- Giả thuyết A: Chỉ `layout1` lỗi.
  - Bị loại vì bạn đã kiểm tra và thấy layout nào cũng lỗi ở mobile/tablet; hơn nữa shell preview đang dùng chung.
- Giả thuyết B: `BlogSectionShared.tsx` sai hoàn toàn ở từng layout.
  - Chưa loại trừ 100%, nhưng không phải nguyên nhân đầu tiên cần xử lý. Phải sửa preview shell trước để loại nhiễu.

# IV. Proposal (Đề xuất)
## 1. Hướng thực hiện đề xuất
- Option A (Recommend) — Confidence 92%
  - Port lại preview shell trong `BlogPreview.tsx` gần như 1:1 từ source `app/page.tsx` cho desktop/tablet/mobile.
  - Sau đó nối `BlogSectionShared` vào đúng vùng `@container` của shell mới.
  - Chỉ chỉnh thêm từng layout nếu còn lệch sau khi shell đã đúng.
- Option B — Confidence 58%
  - Giữ shell hiện tại, vá riêng class responsive trong từng layout.
  - Tradeoff: chậm, dễ sót, và có khả năng vá 6 lần cùng một lỗi nền.

## 2. Implementation concept
- `BlogPreview.tsx`
  - Bỏ `deviceWidthClass` đơn giản hiện tại.
  - Thay bằng preview shell parity với source:
    - desktop: `w-full min-w-[1024px] max-w-7xl rounded-2xl ...`
    - tablet: `w-[768px] rounded-[2rem] ...`
    - mobile: `w-[390px] h-[844px] rounded-[3rem] ring-[14px] ... overflow-y-auto ...`
  - Thêm fake status bar + home indicator cho mobile như source.
  - Đặt `BlogSectionShared` vào wrapper `w-full flex-1 @container` giống source.
- `BlogSectionShared.tsx`
  - Giữ logic 6 layout hiện có.
  - Chỉ tinh chỉnh nếu sau khi preview shell đúng mà một số layout vẫn lệch source rõ rệt ở tablet/mobile.

## 3. Mermaid diagram
```mermaid
flowchart TD
  A[Device Toggle] --> B[BlogPreview Shell]
  B --> C[@container Wrapper]
  C --> D[BlogSectionShared]
  D --> E[layout1..layout6]
```

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogPreview.tsx`
  - Vai trò hiện tại: card preview + toggle style/device + wrapper preview giản lược.
  - Thay đổi: thay shell responsive để parity với source cho desktop/tablet/mobile.
- Có thể sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogSectionShared.tsx`
  - Vai trò hiện tại: render 6 layout.
  - Thay đổi: chỉ chỉnh những class nào còn lệch sau khi shell preview đã đúng.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ phần preview shell trong source `app/page.tsx`.
2. Refactor `BlogPreview.tsx` để mô phỏng shell desktop/tablet/mobile giống source.
3. Giữ `BlogSectionShared` bên trong vùng `@container` mới.
4. Soát nhanh 6 layout trong `BlogSectionShared` và chỉnh điểm lệch còn lại nếu shell fix chưa đủ.
5. Static self-review.
6. Chạy `bunx tsc --noEmit`.
7. Commit local, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static verification:
  - `bunx tsc --noEmit`
- Repro checklist:
  - Vào create/edit blog.
  - Chuyển qua đủ `Layout 1` → `Layout 6`.
  - Test 3 device: desktop, tablet, mobile.
  - So từng preview với source `C:\Users\VTOS\Downloads\blog-homecomponent` ở cùng layout/device.
- Pass/fail:
  - Không còn hiện tượng card bị co quá mức, spacing sai nặng, grid vỡ hoặc typography lệch bất thường ở tablet/mobile.
  - 6 layout preview phản ứng theo device tương tự source.

# VIII. Todo
1. Port preview shell responsive từ source vào `BlogPreview.tsx`.
2. Đặt `BlogSectionShared` vào đúng container preview mới.
3. Rà 6 layout và sửa các điểm lệch còn lại nếu có.
4. Chạy `bunx tsc --noEmit`.
5. Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cả 6 layout blog preview trong admin không còn lỗi responsive ở tablet/mobile.
- Preview shell desktop/tablet/mobile gần parity với source demo.
- Không đổi behavior site render; chỉ sửa bề mặt preview admin trừ khi phát hiện bug liên đới thật sự.
- `bunx tsc --noEmit` pass.
- Có commit local, không push.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính: preview shell phình to hơn hiện tại, có thể cần chỉnh spacing card preview admin.
- Rollback đơn giản vì thay đổi chủ yếu tập trung ở `BlogPreview.tsx` và có thể revert commit.

# XI. Out of Scope (Ngoài phạm vi)
- Không sửa site render nếu site hiện đã đúng.
- Không động vào FAQ hoặc home-component khác.
- Không đổi data/config ngoài vấn đề preview responsive.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity lớn cho hướng sửa: scope hiện rõ là fix toàn bộ responsive preview mobile/tablet cho cả 6 layout.
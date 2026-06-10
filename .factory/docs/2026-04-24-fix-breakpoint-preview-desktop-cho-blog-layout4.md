# I. Primer

## 1. TL;DR kiểu Feynman
- Chỉ `layout4` bị rớt từ 3 cột xuống 2 cột vì nó dùng `container query` theo cách khác 5 layout còn lại.
- Site thật vẫn đúng, nên lỗi nằm ở `preview` wrapper, không nằm ở runtime section.
- Nút thắt là `layout4` tự tạo `@container` ở outer shell, nên breakpoint `@[900px]:grid-cols-3` đang đo theo một khung hẹp hơn trong preview desktop.
- Cần sửa riêng contract width của `layout4` trong `BlogPreview.tsx` để container đó luôn đủ rộng ở desktop preview.
- Không đụng `BlogSection` site thật; chỉ chỉnh preview breakpoint path.

## 2. Elaboration & Self-Explanation
Hiện tượng “5 layout còn lại OK, chỉ layout4 bị 2 cột” là dấu hiệu rất mạnh cho thấy đây không phải bug chung của preview card nữa, mà là bug riêng của cơ chế breakpoint của `layout4`.

Điểm khác biệt quan trọng:
- `layout4` trong `BlogSectionShared.tsx` có outer shell riêng gắn `@container`.
- Grid của nó dùng `@[600px]:grid-cols-2 @[900px]:grid-cols-3`.
- Nghĩa là số cột không dựa vào viewport chung, mà dựa vào **độ rộng của container gần nhất**.

Trong preview desktop hiện tại, `BlogPreview.tsx` đã được làm gọn theo pattern chung. Điều đó tốt cho tổng thể UI, nhưng với `layout4`, khung preview hiện tại làm container mà `layout4` đang đo bị nhỏ hơn ngưỡng 900px sau khi trừ các lớp bọc/padding/browser shell. Kết quả là nó chỉ kích hoạt mức 2 cột.

Vì site thật vẫn lên 3 cột, nên `BlogSectionShared` không sai ở runtime. Sai ở chỗ preview đang cho `layout4` một container contract khác site thật.

## 3. Concrete Examples & Analogies
### Ví dụ bám repo
- `BlogPreview.tsx`:
  - desktop `layout4` đang dùng `w-full flex-1 @container`
- `BlogSectionShared.tsx`:
  - `layout4` outer shell có `@container`
  - grid dùng `@[900px]:grid-cols-3`

=> Với `layout4`, breakpoint 3 cột không đo theo browser frame ngoài, mà đo theo outer shell riêng của chính nó. Outer shell đó trong preview desktop hiện không đủ rộng, nên rơi xuống 2 cột.

### Analogy đời thường
Giống như bạn có rule: “nếu bàn rộng trên 90cm thì đặt 3 món; nhỏ hơn thì đặt 2 món”. Với 5 layout khác, người đo bàn là cái bàn lớn ngoài cùng. Nhưng với `layout4`, người đo lại đo cái khay đặt trên bàn. Khay hẹp hơn nên nó chỉ bày 2 món.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Chỉ `layout4` blog preview desktop bị 2 cột thay vì 3 cột.
  - User xác nhận site thật OK, lỗi chỉ nằm ở preview.
  - 5 layout còn lại không bị cùng triệu chứng.
- Evidence:
  - `app/admin/home-components/blog/_components/BlogPreview.tsx`
    - `getPreviewViewportClassName()` có nhánh riêng cho `layout4`.
  - `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
    - `layout4` outer shell dùng `@container`.
    - grid dùng `@[900px]:grid-cols-3`.
  - `components/site/BlogSection.tsx`
    - site runtime chỉ gọi `BlogSectionShared` với `context="site"`; không có vấn đề runtime theo user report.
- Expected vs actual:
  - Expected: desktop preview `layout4` lên 3 cột như site.
  - Actual: preview desktop `layout4` chỉ lên 2 cột.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High
Lý do: triệu chứng chỉ xuất hiện ở `layout4`, và `layout4` là layout duy nhất trong nhánh này có contract `@container` đặc thù ở outer shell khiến breakpoint đo theo container khác.

## Nguyên nhân gốc
`layout4` dùng `container query` theo outer shell riêng của nó, nên trong preview desktop hiện tại, breakpoint `@[900px]:grid-cols-3` đang đo theo một container hẹp hơn site thật. Do đó preview không chạm ngưỡng 900px và chỉ render 2 cột.

## Giả thuyết đối chứng
### a) Grid class của `layout4` bị viết sai
- Confidence: Low
- Lý do: site thật đang OK với cùng class `@[900px]:grid-cols-3`.

### b) Dữ liệu preview hoặc số item khiến nó chỉ ra 2 cột
- Confidence: Low
- Lý do: preview vẫn slice 3 item; số item không phải nguyên nhân làm grid xuống 2 cột.

### c) Lỗi ở toàn bộ BlogPreview shell chung
- Confidence: Medium
- Lý do: shell chung ảnh hưởng width, nhưng biểu hiện chỉ xảy ra với `layout4`, nên bản chất là do nhánh breakpoint/container riêng của `layout4` trong shell đó.

```mermaid
flowchart TD
  A[Preview desktop width] --> B[BlogPreview viewport]
  B --> C[layout4 outer shell @container]
  C --> D[@900px threshold]
  D -->|< 900| E[grid 2 cột]
  D -->|>= 900| F[grid 3 cột]
```

# IV. Proposal (Đề xuất)
## Hướng đề xuất (Recommend) — Confidence 93%
Sửa riêng contract width của `layout4` trong `BlogPreview.tsx` để desktop preview cấp đủ width cho container mà `layout4` đang đo, nhưng không đụng site runtime.

## Cách làm cụ thể
1. Giữ `BlogSectionShared.tsx` nguyên trạng.
2. Trong `BlogPreview.tsx`, chỉnh nhánh `getPreviewViewportClassName()` cho `device === 'desktop' && style === 'layout4'`.
3. Cấp thêm width/min-width hợp lý chỉ cho preview desktop của `layout4`, ví dụ theo một trong các kiểu sau:
   - `min-w-[960px]` hoặc rộng hơn ở viewport wrapper; hoặc
   - `max-w-[1400px] mx-auto @container` nhưng kèm width contract để outer shell thực sự vượt ngưỡng 900; hoặc
   - một desktop-only wrapper riêng cho `layout4` preview nếu evidence cho thấy cần explicit width.
4. Mục tiêu của thay đổi là: container gần nhất mà `layout4` đo phải vượt qua ngưỡng `900px` trong preview desktop.
5. Không áp thay đổi này cho 5 layout còn lại.

## Vì sao đây là hướng tốt nhất
- Surgical, đúng scope user yêu cầu.
- Không phá pattern preview chung vừa chuẩn hóa.
- Không đụng runtime/site vì bug chỉ ở preview.
- Giải thích được rõ vì sao chỉ `layout4` cần treatment riêng.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogPreview.tsx`
  - Vai trò hiện tại: quyết định contract viewport/device shell cho preview blog.
  - Thay đổi: tăng/ổn định width contract của riêng `layout4` ở desktop preview để breakpoint 3 cột kích hoạt đúng.

- Không sửa: `app/admin/home-components/blog/_components/BlogSectionShared.tsx`
  - Vai trò hiện tại: render layout thật cho cả site và preview.
  - Giữ nguyên vì site runtime đã đúng; đổi file này dễ ảnh hưởng site thật.

- Không sửa: `components/site/BlogSection.tsx`
  - Vai trò hiện tại: runtime wrapper cho site thật.
  - Giữ nguyên vì user xác nhận site đang OK.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại nhánh `layout4` trong `BlogPreview.tsx`.
2. Chỉnh width contract desktop preview riêng cho `layout4`.
3. Giữ nguyên 5 layout khác.
4. Review tĩnh lại chuỗi container: `BrowserFrame -> viewport wrapper -> layout4 outer shell @container -> grid`.
5. Chuẩn bị commit sau khi verify trực quan.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở `/admin/home-components/blog/[id]/edit`.
- Chuyển sang `layout4` và `desktop`.
- Pass nếu:
  1. `layout4` preview desktop lên đúng 3 cột.
  2. 5 layout còn lại không regress.
  3. Không tạo crop/scroll ngang mới.
  4. Site runtime vẫn không đổi.

# VIII. Todo
1. Chỉnh breakpoint contract preview cho `layout4` desktop.
2. Review tĩnh container width path.
3. Xác nhận không ảnh hưởng 5 layout còn lại.
4. Commit local sau khi verify trực quan.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `layout4` blog preview desktop hiển thị 3 cột.
- 5 layout còn lại giữ nguyên hành vi hiện tại.
- Không đổi logic site thật.
- Không xuất hiện crop/scroll ngang mới trong preview.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính: tăng width quá tay làm preview crop hoặc lệch căn giữa.
- Rollback đơn giản vì thay đổi chỉ tập trung ở một nhánh nhỏ trong `BlogPreview.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor toàn bộ blog preview lần nữa.
- Không đổi breakpoint runtime của site.
- Không chỉnh các layout khác nếu không có evidence regress.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng. Nếu bạn duyệt spec này thì bước tiếp theo là sửa riêng nhánh preview desktop của `layout4` trong `BlogPreview.tsx`.
# I. Primer

## 1. TL;DR kiểu Feynman
- Đã tìm ra nguyên nhân rõ ràng vì sao header layout 4 mobile lại văng sang phải sau lần khôi phục card UI.
- Không phải do wrapper site khác, không phải do button group, cũng không phải do outer shell.
- Root cause là commit khôi phục card UI đã vô tình gỡ luôn `w-full text-left` của **header text wrapper**.
- Hướng sửa tối thiểu và đúng nhất: chỉ restore lại đúng dòng `className="w-full text-left"` cho wrapper text header.
- Cách này giữ được cả 2 mục tiêu: card UI có thumbnail bình thường, header mobile bám trái như preview.

## 2. Elaboration & Self-Explanation
Lần này audit theo chuỗi commit thay vì đoán bằng mắt. Kết quả cho thấy:

- `d701eeec` đã sửa header container mobile sang `flex-col items-start` và nút sang `self-start`.
- `caf74b31` đã sửa outer shell của layout 4 từ `items-center` sang `items-start`.
- `cfc2cc97` thêm một thay đổi rất quan trọng: bọc text header bằng `w-full text-left` để khóa nó bám trái ổn định.
- Sau đó `0e06c383` khôi phục card UI, nhưng đã revert luôn dòng `w-full text-left` này.

Tức là regression không đến từ bug mới bí ẩn nào. Nó đến từ việc một commit rollback card UI đã lỡ kéo theo cả fix header text wrapper.

Nói đơn giản: cái card được cứu lại, nhưng cái “neo” giữ header bám trái bị tháo ra. Vì vậy header lại trôi sang phải.

## 3. Concrete Examples & Analogies
### a) Ví dụ cụ thể bám repo
Trong `BlogSectionRuntime.tsx`, nhánh `layout4` hiện tại đang là:

```tsx
<div>
  <h4>...</h4>
  <h2>...</h2>
  <p>...</p>
</div>
```

Nhưng trạng thái đã từng ổn định là:

```tsx
<div className="w-full text-left">
  <h4>...</h4>
  <h2>...</h2>
  <p>...</p>
</div>
```

Khác biệt chỉ một dòng, nhưng đây là đúng node quyết định sự ổn định alignment của text header trên mobile.

### b) Analogy đời thường
Giống như bảng hiệu treo bằng 2 móc. Các lần trước đã chỉnh được vị trí móc bên ngoài, nhưng lần rollback vừa rồi lại tháo mất cái móc ngay sau bảng. Bảng không rớt, nhưng nó bị nghiêng lệch. Muốn hết lệch thì chỉ cần gắn lại đúng cái móc đó, không cần tháo cả hệ khung lần nữa.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Sau commit khôi phục card UI, thumbnail/card đã trở lại bình thường.
  - Nhưng header layout 4 mobile lại văng sang phải.
- Evidence:
  - `d701eeec` giữ fix header container + button group.
  - `caf74b31` giữ fix outer shell `items-start`.
  - `cfc2cc97` từng thêm `w-full text-left` cho header text wrapper.
  - `0e06c383` đã revert đúng dòng đó khi rollback card UI.
- Inference:
  - Header regress không phải do card wrapper hiện tại, mà do mất class khóa width/alignment ở wrapper text header.
- Decision:
  - Chỉ restore lại header text wrapper `w-full text-left`, không đụng card wrapper.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
- Triệu chứng quan sát được:
  - Expected: header mobile bám trái, card UI giữ nguyên.
  - Actual: card UI đúng nhưng header lại lệch/phồng sang phải.
- Phạm vi ảnh hưởng:
  - Chỉ layout 4 mobile ở `BlogSectionRuntime.tsx`.
- Mốc thay đổi gần nhất liên quan:
  - `d701eeec`
  - `caf74b31`
  - `cfc2cc97`
  - `0e06c383`
- Dữ liệu còn thiếu:
  - Không có browser computed-style, nhưng diff commit đủ mạnh để kết luận.
- Giả thuyết thay thế đã bị loại trừ:
  - wrapper site khác: không có evidence
  - button group: class `self-start` vẫn còn
  - outer shell: `items-start` vẫn còn
- Rủi ro nếu fix sai nguyên nhân:
  - Churn thêm vào card UI hoặc wrapper khác dù lỗi thật chỉ nằm ở 1 dòng class.
- Tiêu chí pass/fail sau khi sửa:
  - Header bám trái trở lại mà không làm mất thumbnail/card UI.

**Nguyên nhân gốc:** `0e06c383` đã vô tình gỡ `w-full text-left` khỏi wrapper text header của layout 4 mobile. Confidence: High.

## 2. Counter-Hypothesis
### a) Outer shell chưa đủ mạnh
- Confidence: Low.
- `items-start` ở outer shell vẫn còn sau rollback.

### b) Button group kéo header lệch phải
- Confidence: Low.
- `self-start` vẫn còn, không bị revert.

### c) Card wrapper/text content hiện tại lại đang gây hiệu ứng phụ lên header
- Confidence: Low-Medium.
- Không khớp chuỗi diff commit bằng giả thuyết “mất class ở header text wrapper”.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa được chọn
- Chỉ thêm lại `className="w-full text-left"` cho wrapper text header trong nhánh `layout4`.
- Không sửa card wrapper, article, content wrapper.

## 2. Cách làm cụ thể
- Mở `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`.
- Tìm block header text trong nhánh `style === 'layout4'`.
- Đổi:
  - từ `<div>`
  - thành `<div className="w-full text-left">`
- Giữ nguyên toàn bộ các class card UI hiện tại để không lặp lại regression thumbnail.

## 3. Vì sao đây là hướng tốt nhất
- Minimal diff: đúng 1 node, đúng 1 vấn đề.
- Giữ nguyên card UI vừa khôi phục.
- Bám sát evidence commit history, không đoán mò nữa.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`
  - Vai trò hiện tại: source of truth cho layout 4 preview/site.
  - Thay đổi: restore `w-full text-left` cho wrapper text header, không chạm card UI.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc đúng block header text trong nhánh `layout4`.
2. Restore `w-full text-left` cho wrapper text header.
3. Review diff để chắc không chạm card/item/content wrapper.
4. Commit local với message phản ánh fix regression header.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Audit Summary
- Xác nhận diff chỉ 1 node trong `BlogSectionRuntime.tsx`.
- Xác nhận không đụng card wrapper/content classes.

## 2. Root Cause Confidence
- High, vì regression map trực tiếp theo chuỗi commit và một dòng class bị revert.

## 3. Verification Plan
- Static review diff:
  - chỉ thêm lại `w-full text-left` cho wrapper text header
  - card UI vẫn giữ nguyên trạng thái sau `0e06c383`
- Kỳ vọng sau sửa:
  - header layout 4 mobile bám trái lại
  - thumbnail/card không bị mất nữa
  - không ảnh hưởng layout blog khác

# VIII. Todo
1. Restore `w-full text-left` cho header text wrapper của layout 4.
2. Review diff để chắc card UI không đổi.
3. Commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Header layout 4 mobile bám trái như preview.
- Card UI/thumbnails vẫn giữ bình thường, không regression.
- Chỉ thay đổi trong `BlogSectionRuntime.tsx`.
- Không ảnh hưởng layout 1/2/3/5/6.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro rất thấp:
  - chỉ chạm 1 dòng class ở wrapper header.
- Rollback:
  - revert đúng commit này là đủ.

# XI. Out of Scope (Ngoài phạm vi)
- Refactor lại responsive contract toàn bộ layout 4.
- Đụng card wrapper/article/content wrapper.
- Sửa các drift khác không liên quan header text wrapper.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng; root cause đã đủ rõ và fix tối thiểu đã xác định.
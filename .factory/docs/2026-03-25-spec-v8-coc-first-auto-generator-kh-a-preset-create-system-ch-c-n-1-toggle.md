## TL;DR kiểu Feynman
- Em sẽ chuyển Auto Generator sang **CoC-first**: admin không cấu hình bừa nữa, chỉ chọn **mục tiêu bài**.
- `/system/modules/posts` chỉ còn đúng **1 toggle bật/tắt** Auto Generator.
- `/admin/posts/create` sẽ khóa gần hết tùy chọn kỹ thuật (template/tone/knob), dùng preset chuẩn theo mục tiêu.
- Bỏ toàn bộ nhãn/section vô nghĩa (`Auto Generator`, disclaimer filler).
- Compare yếu dữ liệu: **không render table**, fallback thành **2 đoạn văn A vs B**.

## Audit Summary
### Observation
1. Hiện vẫn còn dấu vết “engine nội bộ” trong output (label/section filler), làm bài kém tự nhiên.
2. Hệ thống config đang phân quyền sai chỗ: `/system/modules/posts` có quá nhiều generator settings.
3. `/admin/posts/create` còn hiển thị thông tin kỹ thuật (ví dụ metric cụm), không đúng tinh thần CoC.
4. Compare section chưa nhất quán khi dữ liệu yếu, dẫn đến trải nghiệm lệch.

### Inference
- Root cause chính: kiến trúc hiện tại thiên “tự do cấu hình” hơn “khung chuẩn”, trái với yêu cầu CoC.

### Decision
- Áp dụng CoC mạnh:
  - System: chỉ enable/disable.
  - Admin create: chỉ chọn mục tiêu bài.
  - Generator tự quyết phần còn lại theo best-practice preset.

## Root Cause Confidence
**High** — evidence trực tiếp ở:
- `lib/modules/configs/posts.config.ts` (nhiều setting generator trong system),
- `convex/posts.ts` (đọc nhiều knob từ module settings),
- `app/admin/posts/create/page.tsx` (UI generator còn thiên kỹ thuật),
- `lib/posts/generator/assembler.ts` + `slot-families.ts` (output còn filler/internal markers).

## Files Impacted
### UI / Admin
- **Sửa lớn:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: form generator có nhiều control kỹ thuật.  
  Thay đổi: khóa gần hết theo CoC; chỉ giữ selector “mục tiêu bài” + input cốt lõi dữ liệu; bỏ metric kỹ thuật như “Độ đa dạng từng cụm”.

### System Config
- **Sửa lớn:** `lib/modules/configs/posts.config.ts`  
  Vai trò hiện tại: khai báo nhiều setting generator.  
  Thay đổi: chỉ giữ `enableAutoPostGenerator` (toggle duy nhất), loại các setting tuning generator khỏi system UI.

- **Sửa vừa:** `convex/posts.ts`  
  Vai trò hiện tại: map nhiều setting generator từ DB.  
  Thay đổi: dùng preset defaults nội bộ (code constant), không phụ thuộc các setting tuning đã bỏ.

### Generator Core
- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Thay đổi:
  - bỏ label `Auto Generator` trong output;
  - bỏ disclaimer filler/section rỗng;
  - nếu compare yếu dữ liệu thì không render table;
  - fallback compare thành 2 đoạn văn A vs B.

- **Sửa vừa:** `lib/posts/generator/slot-families.ts`  
  Thay đổi: bỏ `disclaimer` khỏi required slots (không ép render section vô nghĩa).

- **Sửa vừa:** `lib/posts/generator/variant-synthesizer.ts`  
  Thay đổi: tăng giọng văn how-to/decision-friendly, tránh câu khuôn mẫu máy móc.

- **Sửa nhẹ:** `lib/posts/generator/types.ts` (nếu cần)  
  Thay đổi: dọn metadata kỹ thuật không còn dùng ở UI preview.

## CoC Contract mới
### 1) /system/modules/posts
- Chỉ còn: `Bật sinh bài tự động` (toggle).
- Không còn min/max slots, tone, diversity, regenerate strength, internal link density.

### 2) /admin/posts/create
- Khóa gần hết tuning.
- Chỉ cho chọn **mục tiêu bài** (ví dụ: So sánh / Top gợi ý / Theo ngân sách).
- Engine tự chọn template/tone/flow theo preset tốt nhất.

### 3) Output content
- Không có nhãn nội bộ (`Auto Generator`).
- Không có section filler (`Lưu ý...`) nếu không có thông tin mới.
- Compare yếu dữ liệu => 2 đoạn văn A vs B (không bảng).

## Best-practice định hướng (CoC)
- “Guardrails > Freedom”: giới hạn lựa chọn để giảm output tệ.
- “Information gain only”: section nào không tăng giá trị thì bỏ.
- “Decision-first writing”: giúp đọc để chọn, không phải đọc để thấy template.
- “Consistent fallback”: thiếu dữ liệu thì fallback có chủ đích, không để trống lệch.

## Execution Preview
1. Cắt settings generator ở `posts.config.ts` về 1 toggle.
2. Cập nhật `convex/posts.ts` dùng defaults nội bộ.
3. Refactor UI generator ở `/admin/posts/create` theo CoC (chỉ mục tiêu bài).
4. Chỉnh `assembler.ts` bỏ marker/filler và thêm compare fallback 2 đoạn văn.
5. Chỉnh `slot-families.ts` bỏ required disclaimer.
6. Rà `variant-synthesizer.ts` để giữ văn phong how-to rõ ràng.
7. Static review + `bunx tsc --noEmit`.
8. Commit kèm spec v8.

## Acceptance Criteria
1. `/system/modules/posts` chỉ còn 1 toggle Auto Generator.
2. `/admin/posts/create` không còn các knob kỹ thuật gây cấu hình bậy.
3. Admin chỉ chọn “mục tiêu bài”, còn lại theo preset CoC.
4. Output không còn `Auto Generator` và disclaimer filler.
5. Compare dữ liệu yếu không render table; thay bằng 2 đoạn văn A vs B.
6. Bài viết đọc tự nhiên, how-to hơn, không còn cảm giác template máy móc.

## Verification Plan
- Chạy `bunx tsc --noEmit`.
- Manual check:
  1) `/system/modules/posts` chỉ còn toggle,
  2) `/admin/posts/create` chỉ còn control CoC cần thiết,
  3) generate compare đủ dữ liệu (có table),
  4) generate compare yếu dữ liệu (fallback 2 đoạn văn, không table),
  5) output không có label/section filler.

## Out of Scope
- Không xây hệ “crawl toàn bộ repo open-source triệu đô” trong vòng này.
- Không thêm AI planner mới ngoài generator hiện có.

## Risk / Rollback
- Risk: khóa quá mạnh có thể thiếu linh hoạt cho một số use-case hiếm.
- Mitigation: giữ 1 lớp preset mục tiêu bài đủ rộng, không mở lại knob kỹ thuật.
- Rollback: có thể mở lại 1–2 tùy chọn an toàn ở admin create (không đưa về system config).
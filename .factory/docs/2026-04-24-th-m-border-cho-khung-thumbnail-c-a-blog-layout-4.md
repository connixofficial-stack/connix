# I. Primer

## 1. TL;DR kiểu Feynman
- Layout 4 đang có vùng ảnh quá “trơn”, nên khi thiếu thumbnail nhìn như bị rỗng.
- Nguyên nhân chính không nằm ở dữ liệu, mà ở khung media của layout 4 chưa có border/background rõ như pattern dễ nhìn hơn.
- Hướng sửa nhỏ nhất là chỉnh đúng wrapper ảnh của layout 4 trong `BlogSectionRuntime.tsx`.
- Theo quyết định của anh, border sẽ luôn hiện cho mọi thumbnail của layout 4, không chỉ khi thiếu ảnh.
- Cách này giữ scope hẹp: không đụng `ImageView`, không lan sang layout 1/2/3/5/6.

## 2. Elaboration & Self-Explanation
Hiện tại layout 4 dùng cùng `ImageView` fallback chung với các layout khác. Khi bài viết không có ảnh, `ImageView` chỉ hiện icon tài liệu ở giữa. Bản thân wrapper ảnh của layout 4 lại chưa có border hoặc nền nhấn đủ rõ, nên trên nền sáng nhìn khá khó nhận ra đây là một khung media.

Layout 1 nhìn ổn hơn không phải vì nó có logic fallback riêng cho ảnh, mà vì card và cấu trúc quanh ảnh có cảm giác “được đóng khung” tốt hơn. Vì anh muốn “học hỏi layout 1”, cách đúng và ít rủi ro nhất là thêm border ngay tại media wrapper của layout 4.

Vì anh đã chốt muốn **luôn có border cho mọi thumbnail**, nên mình sẽ không làm logic điều kiện theo `item.thumbnail`. Thay vào đó, khung ảnh layout 4 sẽ luôn có viền nhất quán, giúp cả trạng thái có ảnh và không có ảnh đều dễ nhìn hơn.

## 3. Concrete Examples & Analogies
### a) Ví dụ cụ thể bám repo
Hiện tại trong `BlogSectionRuntime.tsx`, nhánh `style === 'layout4'` có wrapper ảnh dạng:
- `relative`
- `aspect-[4/3]`
- `overflow-hidden`
- `rounded-[2rem]`

Đề xuất là giữ nguyên các thuộc tính này, nhưng thêm:
- `border`
- `bg-slate-100` hoặc nền fallback nhẹ
- `borderColor: tokens.cardBorder`

Kết quả:
- Có ảnh: ảnh vẫn fill đầy, nhưng khung bo góc có viền rõ hơn.
- Không ảnh: icon fallback nằm trong một vùng có ranh giới rõ, dễ nhìn hơn nhiều.

### b) Analogy đời thường
Giống như treo ảnh trong khung. Nếu có ảnh đẹp thì khung vẫn giúp ảnh gọn và sang hơn. Nếu chưa có ảnh, ít nhất người xem vẫn biết đó là chỗ dành cho ảnh, chứ không bị lẫn vào bức tường trắng.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` đang render fallback ảnh qua `ImageView`.
  - `ImageView` khi không có thumbnail chỉ trả về icon `FileText`, không có border/background riêng.
  - Ở layout 4, wrapper ảnh hiện chưa có border, nên fallback bị chìm vào nền.
- Evidence:
  - `ImageView` nằm trong `BlogSectionRuntime.tsx` và dùng chung cho nhiều layout.
  - Nhánh `layout4` có media wrapper bo góc lớn nhưng thiếu border.
  - `BlogPreview.tsx` đi qua `BlogSectionRuntime`, nên thay đổi tại đây sẽ đồng bộ preview/site cho đúng layout này.
- Inference:
  - Root cause là presentation của wrapper layout 4, không phải dữ liệu thumbnail và cũng không phải bug query/runtime data.
- Decision:
  - Sửa đúng media wrapper của layout 4, không sửa global fallback của `ImageView`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause
- Nguyên nhân gốc: wrapper thumbnail của `layout4` chưa có border/visual boundary rõ ràng.
- Khi `item.thumbnail` rỗng, fallback icon generic hiển thị trong một vùng gần như “trắng trơn”, nên người dùng khó nhận ra đây là khung ảnh.
- Confidence: High.

## 2. Counter-Hypothesis
### a) Giả thuyết: lỗi nằm ở `ImageView`
- Không phải hướng tối ưu.
- Nếu sửa `ImageView`, thay đổi sẽ lan sang mọi layout đang dùng chung fallback.
- Điều này trái với yêu cầu chỉ chỉnh layout 4.

### b) Giả thuyết: chỉ cần đổi icon fallback là đủ
- Confidence: Low.
- Icon khác có thể giúp đôi chút, nhưng không giải quyết vấn đề ranh giới khung ảnh bị mờ.
- Border mới là tín hiệu thị giác chính cần bổ sung.

## 3. Tiêu chí pass/fail sau khi sửa
- Pass:
  - Layout 4 luôn có khung ảnh với border rõ ràng.
  - Item không có thumbnail vẫn nhìn rõ là một media card.
  - Layout 1/2/3/5/6 không đổi.
- Fail:
  - Border bị áp vào các layout khác.
  - Border làm vỡ bo góc hoặc gây lệch preview/site.

# IV. Proposal (Đề xuất)
## 1. Hướng sửa được chọn
- Thêm border cố định cho media wrapper của `layout4` trong `BlogSectionRuntime.tsx`.
- Giữ nguyên `ImageView` và toàn bộ flow dữ liệu hiện tại.
- Có thể thêm nền fallback nhẹ cho wrapper để trạng thái không ảnh vẫn dễ nhìn hơn, nhưng vẫn ưu tiên minimal diff.

## 2. Cách làm cụ thể
- Tại branch `if (style === 'layout4')`, tìm wrapper đang bọc `ImageView`.
- Bổ sung class/style theo pattern nhẹ:
  - `border`
  - nền nhẹ nếu cần
  - `borderColor: tokens.cardBorder`
- Không đổi sizing, aspect ratio, rounded, date badge, content spacing.

## 3. Vì sao đây là hướng tốt nhất
- Bám đúng yêu cầu “học hỏi layout 1” ở mức visual boundary.
- Scope nhỏ, dễ rollback.
- Không tạo side effect cho layout khác.
- Preview/site cùng đi qua một runtime nên parity sẽ tự giữ.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx`
  - Vai trò hiện tại: render runtime UI cho toàn bộ blog layouts và fallback media dùng chung.
  - Thay đổi: thêm border cố định cho media wrapper của riêng `layout4`, giữ nguyên các layout khác.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại branch `layout4` trong `BlogSectionRuntime.tsx`.
2. Chỉnh media wrapper của `layout4` để luôn có border.
3. Tự review tĩnh để chắc không lan sang layout khác và không làm sai bo góc/spacing.
4. Commit local theo rule repo.

# VII. Verification Plan (Kế hoạch kiểm chứng)
## 1. Audit Summary
- Xác nhận diff chỉ nằm ở wrapper thumbnail của `layout4`.
- Xác nhận không chỉnh `ImageView` global.

## 2. Root Cause Confidence
- High, vì evidence nằm trực tiếp ở markup branch `layout4` và behavior fallback hiện tại.

## 3. Verification Plan
- Static review diff:
  - chỉ 1 file bị sửa
  - chỉ branch `layout4` đổi
  - class/style không ảnh hưởng layout khác
- Visual expectation cần đạt sau implement:
  - item có thumbnail: ảnh vẫn đẹp, khung rõ hơn
  - item không có thumbnail: vùng ảnh có viền, dễ nhìn
  - preview/site parity vẫn giữ vì dùng chung runtime

# VIII. Todo
1. Thêm border cố định cho media wrapper của Blog layout 4.
2. Giữ nguyên logic `ImageView` để không lan sang layout khác.
3. Tự review diff và commit local.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 4 luôn có border quanh khung thumbnail.
- Trạng thái không có thumbnail nhìn rõ ràng hơn trên nền sáng.
- Không thay đổi UI của layout 1/2/3/5/6.
- Không đổi API props, không đổi dữ liệu config, không đổi behavior save/edit.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp:
  - border có thể nhìn hơi nặng nếu màu `tokens.cardBorder` quá đậm với một số brand color.
- Rollback đơn giản:
  - revert đúng phần class/style thêm ở media wrapper `layout4`.

# XI. Out of Scope (Ngoài phạm vi)
- Đổi icon fallback của `ImageView`.
- Refactor toàn bộ system fallback thumbnail cho các layout khác.
- Sửa date badge hardcode của layout 4.
- Chỉnh typography, spacing, hover state ngoài media wrapper.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng; yêu cầu về việc border luôn hiện cho mọi thumbnail đã được chốt.
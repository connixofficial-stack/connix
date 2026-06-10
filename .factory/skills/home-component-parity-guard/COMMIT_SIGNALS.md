# Commit Signals — Vì sao skill này tồn tại

Skill này được rút ra từ chuỗi commit local chưa push cho thấy cùng một nhóm lỗi lặp đi lặp lại khi làm home-component.

## 1. Blog parity drift kéo dài nhiều vòng

Các commit:
- `9c7b14c2 feat(blog): align admin and site layouts from source`
- `afb10183 fix(blog): use exact layout1-layout6 mapping`
- `0e77277d fix(blog): reduce preview parity drift`
- `9f70d58b fix(blog): align responsive preview with demo shell`
- `a1d901bb fix(blog): restore layout4 parity`
- `594cf7c8 fix(blog): complete layout4 parity`
- `ee121b27 fix(blog): restore layout4 preview width`
- `013d24b1 fix(blog): reimplement layout4 wrapper parity`
- `923cf1bc fix(blog): align layout4 preview context`
- `9cfc324f fix(blog): restore layout4 desktop preview container`
- `47a4085e fix(blog): unify layout4 preview shell parity`

### Signal
- preview/site không cùng source-of-truth
- layout mapping không khóa 1-1
- breakpoint/container query bị fix sai tầng
- preview shell drift khỏi runtime contract

## 2. Testimonials cũng dính cùng pattern

Các commit:
- `d4a88ac1 feat(testimonials): upgrade showcase layouts`
- `061e31ca fix(testimonials): tighten layout containers`
- `5352b322 fix(testimonials): improve preview spacing`
- `5a6f9545 fix(testimonials): match desktop preview grid`
- `e9782232 fix(testimonials): unblock custom color toggle`

### Signal
- layout container / spacing / preview grid rất dễ lệch
- color override state cũng là một contract dễ vỡ

## 3. FAQ cũng phải align preview parity

Các commit:
- `ac7d3ede feat(faq): refresh admin layouts from showcase patterns`
- `8e276c06 fix(faq): align preview layouts with showcase parity`

### Signal
- FAQ cho thấy “refresh từ showcase” nhưng vẫn cần vòng align parity sau đó
- nghĩa là tạo layout xong chưa đủ, cần guard parity bắt buộc

## 4. Home-component state/config guard cũng từng vỡ

Các commit:
- `16d8c032 fix(home-components): use button for color toggle`
- `bb521932 fix(home-components): preserve local color override state`

### Signal
- button type / interaction trong form preview
- state local override dễ mất nếu không map contract từ đầu

## Bài học rút ra

### A. Source-of-truth parity phải khóa ngay từ đầu
Nếu preview không học từ source thật hoặc shared section, drift gần như chắc chắn xảy ra.

### B. Breakpoint bugs không nên fix bằng width hack mù
Phải xác định:
- viewport breakpoint hay container query,
- node nào là điểm đo thật,
- preview shell có đang đổi contract runtime không.

### C. Một home-component không chỉ là preview
Phải coi nó là 4 mặt:
- create
- edit
- preview
- site renderer

### D. Fallback/config/state là nhóm lỗi âm thầm nhưng rất tốn vòng fix
Nếu không guard:
- style fallback sai thứ tự,
- color override state mất,
- config save/load lệch,
- button preview submit form ngoài ý muốn.

## Kết luận

Skill `home-component-parity-guard` tồn tại để:
- chặn các lỗi trên trước khi merge,
- buộc agent đi qua checklist parity,
- biến bài học từ commit history thành guardrails tái sử dụng được.

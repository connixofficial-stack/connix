# I. Primer

## 1. TL;DR kiểu Feynman

- Layout 5 cũ: grid đều + ảnh minh họa lớn bên phải (giống layout 4 quá)
- Layout 5 mới: **Bento Grid asymmetric** - card highlight lớn hơn, tạo visual hierarchy tự nhiên
- Icon đặt top-left corner thay vì center, số thứ tự dạng badge tròn góc phải
- Highlight card: span 2 cols × 2 rows (desktop), có CTA "Tìm hiểu thêm" + decorative circles
- Non-highlight cards: gradient bottom bar khi hover, kích thước đồng đều
- Responsive: mobile stack vertical, tablet 2 cols, desktop 3 cols bento grid
- Loại bỏ ảnh minh họa lớn để tập trung vào content asymmetric layout

## 2. Elaboration & Self-Explanation

Layout 5 ban đầu có thiết kế grid 2×2 bên trái + ảnh minh họa lớn bên phải. Vấn đề là layout 4 đã có visual image lớn rồi, nên layout 5 trở nên dư thừa và không có điểm nhấn riêng.

Bento Grid là xu hướng UI/UX 2026 - lấy cảm hứng từ hộp cơm Nhật Bento với các ngăn kích thước khác nhau. Thay vì grid đều đặn, Bento Grid tạo visual hierarchy tự nhiên bằng cách cho phép một số card "quan trọng hơn" chiếm nhiều không gian hơn.

Trong thiết kế mới:
- Card được highlight (theo `config.highlightIndex`) sẽ span 2 cột × 2 hàng, tạo focal point mạnh
- Card này có decorative circles (background blur), CTA "Tìm hiểu thêm" với arrow animation
- Các card còn lại kích thước đồng đều, có gradient bar dưới cùng khi hover
- Icon + số thứ tự đặt ở top corners tạo không gian thoáng cho content
- Color-mix blend icon background với neutralBackground thay vì trắng cứng

Responsive strategy:
- Mobile: stack vertical (1 col) - highlight card không span vì không đủ không gian
- Tablet: 2 cols - highlight card span 2×2
- Desktop: 3 cols - highlight card span 2×2, card thứ 2 (nếu không phải highlight) span 2 cols ngang

## 3. Concrete Examples & Analogies

**Analogy đời thường:**
Tưởng tượng bạn đang xếp sách trên kệ. Thay vì xếp tất cả sách đứng đều nhau (grid truyền thống), bạn đặt cuốn sách quan trọng nhất nằm ngang chiếm 2 ngăn, các cuốn khác xếp đứng xung quanh. Người nhìn sẽ ngay lập tức biết cuốn nào quan trọng nhất mà không cần đọc.

**Ví dụ cụ thể trong repo:**

Giả sử có 5 benefits, highlight index = 0:

```
Desktop (3 cols):
┌─────────────┬──────┬──────┐
│             │  2   │  3   │
│      1      ├──────┼──────┤
│ (highlight) │  4   │  5   │
│             │      │      │
└─────────────┴──────┴──────┘
```

Nếu highlight index = 1:
```
Desktop (3 cols):
┌──────┬─────────────┬──────┐
│  1   │             │  3   │
├──────┤      2      ├──────┤
│  4   │ (highlight) │  5   │
│      │             │      │
└──────┴─────────────┴──────┘
```

Mobile: tất cả stack vertical, không có span.

# II. Audit Summary (Tóm tắt kiểm tra)

**Vấn đề hiện tại:**
- Layout 5 cũ: grid 2×2 + ảnh minh họa lớn bên phải
- Trùng lặp concept với layout 4 (cũng có visual image lớn)
- Không có điểm nhấn visual hierarchy rõ ràng
- Highlight chỉ thể hiện qua màu, không thể hiện qua kích thước

**Yêu cầu user:**
- Thiết kế lại layout 5 khác biệt với 5 layout còn lại
- Vẫn đẹp mắt, dễ dùng, đa dụng
- Tham khảo xu hướng thiết kế 2026

**Research findings:**
- Bento Grid là xu hướng UI/UX 2026 (67% top 100 SaaS dùng theo saasframe.io)
- Asymmetric layout giảm cognitive load, tăng retention
- Compartmentalization tạo predictable rhythm cho user
- Icon position top-left + content center-left là pattern phổ biến

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

**Root Cause Confidence: High (90%)**

Layout 5 ban đầu được thiết kế theo pattern "grid + visual" giống nhiều template thông thường, nhưng không có unique selling point riêng khi layout 4 đã có visual image lớn.

**Counter-Hypothesis:**
- Có thể giữ visual image nhưng đổi vị trí? → Không, vì vẫn trùng concept với layout 4
- Có thể dùng carousel thay vì bento grid? → Không, layout 6 đã là carousel/timeline
- Có thể dùng masonry layout? → Bento grid có structure rõ hơn, dễ maintain hơn masonry

# IV. Proposal (Đề xuất)

**Thiết kế Bento Grid asymmetric cho Layout 5:**

1. **Grid system:**
   - Desktop: 3 cols, gridAutoRows: 200px
   - Tablet: 2 cols, gridAutoRows: 200px
   - Mobile: 1 col, gridAutoRows: auto

2. **Highlight card logic:**
   - Card tại `config.highlightIndex` span 2 cols × 2 rows (desktop/tablet)
   - Mobile: không span, giữ 1 col
   - Background: `tokens.primary` với decorative circles opacity 10%
   - Có CTA "Tìm hiểu thêm" + ArrowRight animation

3. **Non-highlight cards:**
   - Kích thước đồng đều (1 col × 1 row)
   - Background: `tokens.neutralSurface`
   - Gradient bar dưới cùng khi hover (primary → secondary)

4. **Icon & number layout:**
   - Icon: top-left, rounded-2xl, color-mix blend với background
   - Number: top-right, badge tròn
   - Hover: icon scale 110%

5. **Responsive behavior:**
   - Mobile: stack vertical, highlight không có CTA
   - Tablet: 2 cols bento, highlight span 2×2
   - Desktop: 3 cols bento, highlight span 2×2

6. **Button CTA:**
   - Nếu có `config.buttonText`, hiển thị ở bottom center
   - Style: rounded-full, primary background, shadow với color-mix
   - Hover: gap tăng từ 2 → 3

# V. Files Impacted (Tệp bị ảnh hưởng)

**app/admin/home-components/benefits/_components/BenefitsSectionShared.tsx**
- Vai trò: Render logic cho tất cả 6 layouts của Benefits
- Thay đổi: Viết lại toàn bộ `if (style === '5')` block
- Sửa: Loại bỏ grid 2 cols + visual image, thay bằng bento grid asymmetric
- Thêm: `getBentoGridSpan()` function để tính col/row span theo device và highlightIndex
- Thêm: Decorative circles cho highlight card
- Thêm: Gradient bottom bar cho non-highlight cards
- Thêm: CTA "Tìm hiểu thêm" cho highlight card (desktop/tablet only)

# VI. Execution Preview (Xem trước thực thi)

1. Đọc layout 5 hiện tại để hiểu structure cũ
2. Research xu hướng Bento Grid 2026 qua web search
3. Viết lại `if (style === '5')` block với logic mới:
   - `getBentoGridSpan()`: tính span theo device + highlightIndex
   - `bentoGridClass`: responsive grid class
   - Render cards với conditional styling (highlight vs non-highlight)
   - Icon top-left + number top-right
   - Decorative elements conditional
   - CTA conditional (highlight + !mobile)
4. TypeScript check
5. Commit với message mô tả rõ thay đổi

# VII. Verification Plan (Kế hoạch kiểm chứng)

**TypeScript:**
- ✅ `bunx tsc --noEmit` pass

**Visual QA (cần tester):**
- Preview desktop: highlight card span 2×2, các card khác 1×1
- Preview tablet: highlight card span 2×2, grid 2 cols
- Preview mobile: stack vertical, không có span
- Hover effects: icon scale, gradient bar xuất hiện, CTA arrow translate
- Color blend: icon background hòa với neutralBackground
- Decorative circles chỉ xuất hiện ở highlight card
- CTA "Tìm hiểu thêm" chỉ xuất hiện ở highlight card desktop/tablet

**Site parity:**
- Render đúng trên site với context='site'
- Responsive breakpoints khớp với preview

**Edge cases:**
- highlightIndex = 0, 1, 2, 3, 4: layout thay đổi đúng
- Không có items: fallback empty state (đã có sẵn)
- showItemNumbers = false: không hiển thị badge số
- showDecorativeVisuals = false: không có circles và gradient bar
- buttonText empty: không hiển thị CTA button

# VIII. Todo

- [x] Research Bento Grid xu hướng 2026
- [x] Thiết kế logic `getBentoGridSpan()`
- [x] Viết lại layout 5 với bento grid asymmetric
- [x] Icon top-left + number top-right
- [x] Highlight card decorative circles
- [x] Non-highlight gradient bottom bar
- [x] CTA "Tìm hiểu thêm" cho highlight card
- [x] Responsive mobile/tablet/desktop
- [x] TypeScript check pass
- [x] Commit code

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

**Pass:**
- Layout 5 hiển thị bento grid asymmetric, khác biệt hoàn toàn với 4 layout còn lại
- Highlight card span 2×2 trên desktop/tablet, có decorative circles + CTA
- Non-highlight cards có gradient bar khi hover
- Icon blend với background, không còn trắng cứng
- Responsive: mobile 1 col, tablet 2 cols, desktop 3 cols
- TypeScript compile không lỗi
- Preview device switching hoạt động đúng

**Fail:**
- Layout 5 vẫn giống layout cũ (grid + visual image)
- Highlight card không span hoặc span sai
- Icon background vẫn trắng cứng
- Responsive bị vỡ layout
- TypeScript lỗi

# X. Risk / Rollback (Rủi ro / Hoàn tác)

**Rủi ro:**
- User đã quen với layout 5 cũ có visual image → Thấp, vì layout 4 đã có visual image tương tự
- Bento grid phức tạp hơn grid đều → Thấp, logic span đã được tính toán kỹ
- Responsive có thể vỡ ở breakpoint edge case → Trung bình, cần QA kỹ

**Rollback:**
- Git revert commit này là đủ
- Không ảnh hưởng đến 5 layout khác
- Không thay đổi schema hoặc API

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi 5 layout còn lại (1, 2, 3, 4, 6)
- Không thêm animation phức tạp (chỉ hover scale/translate đơn giản)
- Không thay đổi color system hoặc tokens
- Không thêm config mới (dùng lại highlightIndex, showItemNumbers, showDecorativeVisuals)
- Không refactor shared logic (chỉ sửa layout 5)

# XII. Open Questions (Câu hỏi mở)

Không có - thiết kế đã rõ ràng dựa trên research và pattern sẵn có.

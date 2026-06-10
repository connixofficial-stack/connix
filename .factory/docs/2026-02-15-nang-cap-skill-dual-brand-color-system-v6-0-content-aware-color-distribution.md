## Phan tich van de

### ROOT CAUSE: Placeholder chiếm "phần trăm ảo" trong phân phối màu

Skill hiện tại (v5.0) có quy tắc 60-30-10 + placeholder/content section, nhưng **chưa đủ mạnh** ở điểm quan trọng nhất: **khi dữ liệu đầy đủ, primary/secondary phải có vai trò rõ ràng và hiện diện đủ mạnh**.

**Vấn đề cụ thể:**
1. **Primary color dùng nhiều cho placeholder** (background tint nhẹ khi chưa có ảnh) → khi có ảnh thật, placeholder biến mất → primary chỉ còn ở CTA button (rất nhỏ)
2. **Secondary color dùng cho badge/border/nav icon** → những element này quá nhỏ (< 3% diện tích) → user không cảm nhận được dual-brand khi có data đầy đủ
3. Skill nói "30% primary, 10% secondary" nhưng **không phân tách placeholder state vs content state** → agent tính cả placeholder vào 30% và tưởng đã đủ
4. **Thiếu "Content-Aware Distribution Map"** → agent không biết primary/secondary nên xuất hiện ở element nào khi data đầy đủ

### Dẫn chứng từ code Hero:
- `placeholderBg` dùng `primaryPalette.surface` → mất khi có ảnh
- `badgeBg` dùng `secondaryTint(0.3)` → chỉ chiếm ~2% diện tích
- `navButtonIconColor` dùng `secondaryPalette.solid` → icon 16px, không đáng kể
- **Kết quả**: Khi slides có ảnh đầy đủ, primary chỉ còn ở CTA button + dot active, secondary chỉ còn ở badge text + nav icon → dual-brand gần như vô nghĩa

---

## Đề xuất cải thiện Skill v6.0

### 1. Thêm section "Content-Aware Color Distribution" (TRỌNG TÂM)

Thay thế section "Placeholder vs Content Colors" hiện tại bằng mô hình rõ ràng hơn:

```md
## Content-Aware Color Distribution

### Nguyên tắc: Đo màu ở trạng thái DATA ĐẦY ĐỦ

Tỷ lệ 60-30-10 phải đo tại trạng thái có data thật (ảnh, text, link đầy đủ), 
KHÔNG tính placeholder vào tỷ lệ này.

### 2 Layer phân phối:

**Layer 1: Content State (data đầy đủ) - ĐO TẠI ĐÂY**
- 60% Neutral: background page, card surface, text body
- 30% Primary: CTA buttons, headings có accent, price tags, 
  overlay gradient tint, section accent border/line, hover state
- 10% Secondary: badges, tag labels, secondary buttons/links, 
  active state indicators, decorative accents, hover accent

**Layer 2: Placeholder State (data trống) - KHÔNG tính vào tỷ lệ**
- Background: neutral tint (slate-100/200), KHÔNG dùng primary tint
- Icon: primary solid (hint cho user biết component thuộc brand nào)
- Text: neutral (slate-500)
```

### 2. Thêm "Dual-Brand Visibility Checklist" mới

```md
## Dual-Brand Visibility Checklist (khi mode=dual)

Khi data đầy đủ, kiểm tra:

### Primary phải hiện ở ít nhất 3 element types:
- [ ] CTA button (fill hoặc border)
- [ ] Heading accent (underline, highlight, hoặc text color)
- [ ] Active indicator (dot, progress bar, tab underline)
- [ ] Price/important number styling
- [ ] Gradient contribution (ít nhất 1 gradient có primary)
- [ ] Section border/line accent

### Secondary phải hiện ở ít nhất 2 element types CÓ DIỆN TÍCH ĐỦ LỚN:
- [ ] Badge/tag (với background tint ĐỦ RỘNG, không chỉ text)
- [ ] Overlay/gradient accent (ít nhất 20% diện tích gradient)
- [ ] Card border/ring khi selected/active
- [ ] Secondary button (outline hoặc tonal)
- [ ] Image overlay tint
- [ ] Decorative element (divider, pattern, border strip)

### Minimum visibility rule:
- Primary: phải chiếm >= 15% diện tích element có màu (không tính neutral)
- Secondary: phải chiếm >= 5% diện tích element có màu (không tính neutral)
- Nếu secondary chỉ dùng cho icon < 20px → FAIL → cần thêm element lớn hơn
```

### 3. Thêm "Color Role Matrix" template cho mỗi component

```md
## Color Role Matrix (template)

Mỗi component khi tạo/review phải điền bảng này:

| Element | Trạng thái | Primary | Secondary | Neutral | Ghi chú |
|---------|-----------|---------|-----------|---------|---------|
| CTA button | content | fill | - | - | Always visible |
| Badge | content | dot | bg+text | - | Secondary phải tint đủ rộng |
| Heading | content | accent line | - | text | - |
| Card bg | content | - | - | fill | 60% rule |
| Nav icon | content | - | solid | - | Quá nhỏ, không đủ |
| Placeholder bg | empty | - | - | fill | KHÔNG dùng primary tint |
| Placeholder icon | empty | solid | - | - | Hint only |
| Overlay gradient | content | from-color | to-color | - | Dual-brand gradient |
```

### 4. Sửa đổi "Core Rules" - tách riêng placeholder

Sửa rule #4 (60-30-10) và rule #5 (Placeholder):

```md
### 4) 60-30-10 (đo tại Content State)
- 60% Neutral: background/surface/text body
- 30% Primary: CTA, accent heading, price, gradient, active state
- 10% Secondary: badge, tag, secondary action, decorative accent
- **QUAN TRỌNG**: Tỷ lệ trên đo khi component có DATA ĐẦY ĐỦ
- Placeholder state KHÔNG tính vào tỷ lệ này

### 5) Placeholder dùng Neutral, không phải Primary
- Background placeholder: neutral (slate-100/200), KHÔNG dùng primary tint
- Icon placeholder: primary solid (chỉ icon, không phải background)
- Text placeholder: neutral (slate-400/500)
- Lý do: Nếu dùng primary tint cho placeholder background, khi có data thật 
  phần primary "biến mất" → tỷ lệ bị lệch

### 6) Secondary phải "nhìn thấy được" khi có data
- Không chỉ dùng secondary cho icon < 20px
- Secondary phải xuất hiện ở ít nhất 1 element có diện tích >= 5% component
- Ví dụ tốt: badge background, gradient accent, card ring, overlay tint
- Ví dụ xấu: chỉ dùng cho nav arrow icon 16px
```

### 5. Cập nhật `examples/color-utils.ts`

Thay đổi `getPlaceholderColors`:
```ts
// BEFORE: dùng primary tint cho background
export const getPlaceholderColors = (primary: string, mode: 'single' | 'dual'): PlaceholderColors => {
  const color = oklch(primary);
  const background = formatHex(oklch({...color, l: Math.min(color.l + 0.4, 0.98)}));
  ...
};

// AFTER: dùng neutral cho background, primary chỉ cho icon
export const getPlaceholderColors = (primary: string): PlaceholderColors => ({
  background: '#f1f5f9', // slate-100, neutral
  icon: primary,         // primary chỉ cho icon hint
  text: '#64748b',       // slate-500, neutral
});
```

### 6. Thêm `checklists/dual-visibility-checklist.md`

File mới chứa checklist ở mục 2 ở trên, dùng khi review/tạo component mode dual.

### 7. Cập nhật `checklists/review-checklist.md`

Thêm section 6:
```md
## 6. Content-Aware Distribution
- [ ] Tỷ lệ 60-30-10 đo tại trạng thái DATA ĐẦY ĐỦ
- [ ] Placeholder dùng neutral background (không primary tint)
- [ ] Primary hiện ở >= 3 element types khi có data
- [ ] Secondary hiện ở >= 2 element types có diện tích đủ lớn
- [ ] Color Role Matrix đã điền đầy đủ
```

### 8. Cập nhật `checklists/create-checklist.md`

Thêm section 5:
```md
## 5. Content-Aware Distribution
- [ ] Đã điền Color Role Matrix cho component
- [ ] Primary có >= 3 content-state elements
- [ ] Secondary có >= 2 visible elements (không chỉ icon nhỏ)
- [ ] Placeholder dùng neutral, không dùng primary tint cho bg
```

---

## Tóm tắt thay đổi

| File | Hành động |
|------|-----------|
| `SKILL.md` | Update v6.0: thêm Content-Aware Distribution, sửa Core Rules #4/#5/#6, thêm Color Role Matrix, thêm Dual-Brand Visibility section |
| `examples/color-utils.ts` | Sửa `getPlaceholderColors` dùng neutral thay primary tint |
| `checklists/review-checklist.md` | Thêm section 6: Content-Aware Distribution |
| `checklists/create-checklist.md` | Thêm section 5: Content-Aware Distribution |
| `checklists/dual-visibility-checklist.md` | **File mới** - checklist kiểm tra dual-brand visibility khi data đầy đủ |

**Tham khảo từ research:**
- Material Design 3: Primary roles cho "most prominent components" (CTA, FAB, active states), Secondary cho "less prominent" (filter chips, tonal buttons) - cả hai đều phải visible khi có content
- 60-30-10 Rule: Mọi nguồn đều nhấn mạnh đo trên **real content**, không phải placeholder
- Carbon Design System: Color tokens tách riêng theo state (content/empty/loading), mỗi state có allocation riêng

# Universal Checklist (Create/Review)

## A. Core

- [ ] OKLCH only (không HSL/getTint/getShade)
- [ ] APCA cho text/icon/UI, không hard-code #fff/#000
- [ ] Palette đủ: solid/surface/hover/active/border/disabled
- [ ] Single mode auto-suggest secondary (harmony)
- [ ] Dual mode có similarity check (ΔE >= 20)
- [ ] Harmony validator (getHarmonyStatus) không báo too-similar
- [ ] Accessibility score (getAccessibilityScore) không fail
- [ ] APCA threshold: fontWeight >= 600 → threshold = 45 (bold)
- [ ] Badge token contract: mỗi state có đủ bg/border/text; text được tính đúng trên chính badge bg
- [ ] Cấm dùng text token cross-context cho badge (vd interactiveText trên surface khác)
- [ ] Badge text trên nền solid phải chọn bằng luminance/contrast (white vs `#111`), lấy màu có contrast cao hơn
- [ ] Kết quả chọn bằng luminance phải đi qua APCA guard (`ensureAPCATextColor`) theo fontSize/fontWeight
- [ ] Icon trên nền solid (badge/shield/cards) phải dùng token đã qua APCA guard, không dùng màu brand trực tiếp nếu chưa check LC
- [ ] `apca-w3`: tính LC bằng `APCAcontrast(sRGBtoY(textRgb), sRGBtoY(bgRgb))`, không truyền hex trực tiếp
- [ ] Cấm mọi callsite `APCAcontrast(textHex, bgHex)` dạng string trực tiếp
- [ ] `ensureAPCATextColor(...)` phải check LC của preferred theo threshold rồi mới fallback `getAPCATextColor(...)`
- [ ] Cấm `ensureAPCATextColor(...)` no-op (`void background; return preferred`)
- [ ] Không dùng `-webkit-text-stroke`/`text-shadow` để chữa contrast cho badge text mặc định

## B. Distribution (content state)

- [ ] 60-30-10 đo tại data-đầy-đủ, placeholder không tính
- [ ] Neutral chiếm nền + body text
- [ ] Primary cho CTA/heading/icon/active
- [ ] Secondary cho subtitle/label/badge/hover/accents
- [ ] Heading (h2) dùng brandColor, KHÔNG dùng secondary
- [ ] Primary chiếm >= 25% visual weight (heading + CTA + icon)
- [ ] Accent balance calculator: primary >= 25%, secondary >= 5%
- [ ] Placeholder bg luôn neutral (grid/bento cũng neutral)

## B1. Color Adjacency

- [ ] Primary solid không nằm trên primary tint/shade (nền phải neutral)
- [ ] Secondary solid không nằm trên secondary tint/shade (nền phải neutral)
- [ ] Border quanh brand-solid ưu tiên neutralBorder; tránh same-family tint/shade pairing
- [ ] Icon container dùng neutral surface/background khi icon là brand solid
- [ ] Hover/active accent không tạo cặp "brand solid + brand tint cùng family" trong cùng cụm nhỏ

## C. Accent Prominence

- [ ] Secondary có element đủ lớn (không chỉ icon < 20px)
- [ ] Áp rule Lone/Dual/Triple/Standard theo accent count
- [ ] Tier S có APCA >= 60

## D. Single Source of Truth

- [ ] Site + Preview dùng cùng helper trong `_lib/colors.ts`
- [ ] Không hardcode màu ở site nếu preview dùng helper

## D1. Text Config (Convention over Configuration)

- [ ] KHÔNG hardcode text trong component render (heading, subtitle, labels, hints)
- [ ] Có `texts` config trong type interface (Record<string, string> cho mỗi layout/style)
- [ ] Có default texts trong constants với fallback values
- [ ] Edit page có form UI để config texts (dynamic fields dựa vào layout/style)
- [ ] Preview và site render dùng texts từ config, không dùng hardcoded strings
- [ ] Mỗi layout/style có TEXT_FIELDS mapping để biết field nào cần config

**Pattern chuẩn (Clients component):**
```typescript
// Type
interface Config {
  texts?: Record<StyleType, Record<string, string>>;
}

// Constants
const DEFAULT_TEXTS = {
  layoutA: { heading: 'Default Heading', subtitle: 'Default Subtitle' },
  layoutB: { heading: 'Default', label: 'items' },
};

// Form component
const TextsForm = ({ style, texts, onUpdate }) => {
  const fields = TEXT_FIELDS[style]; // dynamic fields
  return fields.map(field => <Input key={field.key} ... />);
};

// Render
const heading = texts.heading || DEFAULT_TEXTS[style].heading;
<h2 style={{ color: tokens.heading }}>{heading}</h2>
```

**Anti-pattern:**
```typescript
// ❌ Hardcoded text
<h2>Khách hàng tin tưởng</h2>
<p>Được tin tưởng bởi</p>

// ❌ Không có config UI
// User không thể thay đổi text từ admin
```

**Lợi ích:**
- User có thể customize text cho từng layout mà không cần sửa code
- Multi-language ready (dễ extend thêm locale)
- A/B testing friendly (đổi text để test conversion)
- Brand consistency (text được quản lý tập trung)

---

## E. Anti AI-Styling

- [ ] Không gradient decorative (chỉ gradient style mới dùng)
- [ ] Không hover effects phức tạp (mobile-first)
- [ ] Không dùng hover-only reveal cho nội dung/chức năng quan trọng
- [ ] Nội dung quan trọng hiển thị sẵn ở mobile/tablet
- [ ] CTA/price/meta chính trong card phải always-visible (không ẩn sau hover)
- [ ] Cảnh báo validation hiển thị inline trong form, không dùng toast cho warning
- [ ] Không blur/shadow nhiều lớp
- [ ] Không animate decorative (pulse, scale)
- [ ] Không opacity cho decorative elements (badge bg, borders)
- [ ] Không box-shadow cho card depth (chỉ border 1px)
- [ ] Badge bg phải solid color (không opacity)
- [ ] Card depth dùng border 1px solid (slate-200 hoặc brand tint)
- [ ] Flat design + border + whitespace
- [ ] Touch targets >= 44px

## F. State & Runtime Safety

- [ ] Single mode với `secondary=''` không crash.
- [ ] Helper màu có fallback parse hợp lệ (không đọc `.l` từ `undefined`).
- [ ] Có `resolveSecondaryForMode(...)` trước mọi build palette/tint/gradient.
- [ ] Edit form: Save button disabled khi pristine.
- [ ] Sau save thành công: reset về pristine (`hasChanges=false`).

## F2. Single Mode Monochromatic (CRITICAL)

- [ ] `resolveSecondary(primary, secondary, 'single', harmony)` PHẢI return `primary`
- [ ] KHÔNG tạo harmony color (analogous/complementary/triadic) trong single mode
- [ ] Preview info trong single mode: "SINGLE" (không hiển thị harmony)
- [ ] Color box label trong single mode: "Primary (mono)" (không "Accent (analogous)")
- [ ] Accent balance trong single mode: P=S (cùng màu)
- [ ] Single mode UI: không hiển thị secondary color info
- [ ] Single mode UI: không hiển thị accent balance
- [ ] Single mode UI: không hiển thị Harmony/Accessibility warning
- [ ] Dual mode UI: có ColorInfoPanel (Màu chính/Màu phụ) ngay dưới PreviewWrapper (outside wrapper, đồng bộ Hero pattern)
- [ ] [v11.4] Validation SKIP harmony check (deltaE) khi mode = 'single'
- [ ] [v11.4] Validation CHỈ check harmony khi mode = 'dual'

**Pattern chuẩn (Stats, Hero):**
```typescript
if (mode === 'single') {
  return primary;  // ✅
}
```

**Anti-pattern (FAQ bug):**
```typescript
if (mode === 'single') {
  return getAnalogous(primary)[0];  // ❌
}
```

**Harmony Validation Pattern (v11.4 - NEW):**
```typescript
const handleSubmit = async (e) => {
  const { harmonyStatus, accessibility } = getValidationResult(...);

  const warnings = [];

  if (mode === 'dual' && harmonyStatus.isTooSimilar) {
    warnings.push(`deltaE < 20...`);
  }

  if (accessibility.failing.length > 0) {
    warnings.push(`minLc thấp...`);
  }

  setWarningMessages(warnings); // inline warning
  await updateMutation(...);
};
```

---

# Accent Analysis Template

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Reason |
|---|---------|------|-----------|-------------|----------------|--------|
| 1 | | | | | | |
| 2 | | | | | | |
| Total accent points: X | | | | | | Apply Rule: Lone/Dual/Triple/Standard |

## Ví dụ (Hero Fade)

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Reason |
|---|---------|------|-----------|-------------|----------------|--------|
| 1 | thumbnail border active | M | ~3% | yes | primary | Lone accent |
| Total accent points: 1 | | | | | | Apply Rule: Lone |

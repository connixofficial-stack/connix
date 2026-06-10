# Spec: Review và Fix Dual Brand Colors cho ProductList Component (6 Layouts)

## Problem Graph theo DARE Framework

### 1. Decompose - Phân tích vấn đề

```
[ROOT PROBLEM] Mock preview đang dùng ảnh bị và chưa áp dụng dual-brand colors chuẩn
│
├─ [1.1] Review 6 layouts theo skill dual-brand-color-system
│   ├─ [1.1.1] Minimal layout
│   ├─ [1.1.2] Commerce layout
│   ├─ [1.1.3] Bento layout
│   ├─ [1.1.4] Carousel layout
│   ├─ [1.1.5] Compact layout
│   └─ [1.1.6] Showcase layout
│
├─ [1.2] Đánh giá vi phạm dual-brand color principles
│   ├─ [1.2.1] Kiểm tra 60-30-10 rule
│   ├─ [1.2.2] Kiểm tra semantic tokens usage
│   ├─ [1.2.3] Kiểm tra contrast ratios (WCAG 2.2 AA)
│   ├─ [1.2.4] Kiểm tra color harmony (analogous)
│   └─ [1.2.5] Kiểm tra anti-patterns (hard-coded colors, brand color 60%)
│
└─ [1.3] Fix mock preview để dùng ảnh thực từ data
    ├─ [1.3.1] Analyze data structure (products/services data)
    ├─ [1.3.2] Update mock data generator để dùng real images
    └─ [1.3.3] Fallback strategy khi không có ảnh
```

---

## 2. Analyze - Phân tích chi tiết từng layout

### Layout 1: **Minimal** (`renderMinimalStyle`)
**Location**: `previews.tsx` line ~4000-4100

**Hiện trạng**:
- ✅ **60-30-10 Rule**: Neutral bg-white (60%), secondary cho accent line/badges (~10%), text slate-900 (30%)
- ✅ **Semantic tokens**: Dùng `secondary` cho accent line, badge text color
- ✅ **Contrast**: Text slate-900 vs white bg ≥ 4.5:1
- ⚠️ **Hard-coded colors**: Có `bg-slate-100`, `text-slate-500` — nên dùng semantic tokens
- ⚠️ **Brand color underused**: Primary (`brandColor`) chỉ xuất hiện khi hover button

**Issues**:
1. Button hover dùng `brandColor` nhưng không có trong static state → thiếu visual hierarchy
2. Accent line dùng `secondary` nhưng không có primary presence → unbalanced

**Fix**:
```tsx
// Thêm primary cho heading/emphasized elements
<h2 className="..." style={{ color: secondary }}>
  {displayTitle}
</h2>

// Button dùng secondary, hover effect nhẹ hơn
<button className="..." style={{ backgroundColor: secondary }}>
  {buttonText}
</button>
```

---

### Layout 2: **Commerce** (`renderCommerceStyle`)
**Location**: `previews.tsx` line ~4100-4250

**Hiện trạng**:
- ✅ **60-30-10 Rule**: bg-white 60%, text 30%, badges 10%
- ✅ **BrandBadge component**: Đã dùng helper `BrandBadge` với `brandColor` + `secondary`
- ✅ **Hover effects**: Scale + shadow với `secondary` color
- ⚠️ **Discount badge**: Dùng `BrandBadge` nhưng không rõ variant solid/outline

**Issues**:
1. Price color dùng `secondary` — đúng (accent 10%)
2. Hover action button dùng `secondary` — OK
3. **Mock images**: Hiện dùng Unsplash URLs cứng → cần thay bằng real product images

**Fix**:
- Không cần fix màu (đã chuẩn)
- Fix mock images: `item.image || mockProducts[idx]?.image || fallback`

---

### Layout 3: **Bento** (`renderBentoStyle`)
**Location**: `previews.tsx` line ~4250-4450

**Hiện trạng**:
- ✅ **Asymmetric grid**: Featured large + 4 small items
- ✅ **Secondary color**: Dùng cho price, hover border, action button
- ✅ **Gradient overlay**: `bg-gradient-to-t from-black/90` trên featured image
- ⚠️ **Hard-coded bg colors**: `bg-slate-100`, `bg-slate-800` cho placeholders

**Issues**:
1. Featured item overlay quá tối (`from-black/90`) → text phải trắng, mất brand identity
2. Discount badge position `top-4 right-4` OK nhưng cần kiểm tra contrast vs ảnh nền

**Fix**:
```tsx
// Featured overlay gradient nhẹ hơn để giữ brand color presence
<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

// Button dùng secondary với shadow hint
<button style={{ backgroundColor: secondary, boxShadow: `0 4px 6px ${secondary}20` }}>
  Xem chi tiết
</button>
```

---

### Layout 4: **Carousel** (`renderCarouselStyle`)
**Location**: `previews.tsx` line ~4450-4600

**Hiện trạng**:
- ✅ **Navigation arrows**: Dùng `secondary` cho filled state, border slate-200 cho outline
- ✅ **Dots indicator**: Active dot dùng `secondary`, inactive bg-slate-200
- ✅ **Price color**: `secondary`
- ✅ **Discount badge**: `BrandBadge` component

**Issues**:
1. Hover border `hover:border-slate-200` — nên dùng `${secondary}20` cho consistency
2. Arrow buttons mobile có gap-2 nhưng min-h-[44px] đúng (touch target)

**Fix**:
```tsx
// Hover border với secondary hint
<div className="... hover:border-slate-200" 
     style={{ '--hover-border': `${secondary}20` }}>
```

---

### Layout 5: **Compact** (`renderCompactStyle`)
**Location**: `previews.tsx` line ~4600-4720

**Hiện trạng**:
- ✅ **Dense grid**: 6 columns desktop, 4 tablet, 2 mobile
- ✅ **Secondary color**: Price, accent line
- ✅ **Small badges**: `text-[9px]` OK cho compact layout
- ⚠️ **Border colors**: `border-slate-100` vs `hover:border-slate-200` — thiếu brand presence

**Issues**:
1. Cards dùng `border-slate-100` → khi hover lên `border-slate-200` → subtle quá, thiếu secondary hint
2. Compact layout → thiếu visual weight cho primary/secondary colors (< 10%)

**Fix**:
```tsx
// Thêm secondary hint vào border hover
<div className="... border-slate-100 hover:shadow-md" 
     onMouseEnter={(e) => e.currentTarget.style.borderColor = `${secondary}20`}
     onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}>
```

---

### Layout 6: **Showcase** (`renderShowcaseStyle`)
**Location**: `previews.tsx` line ~4720-4900

**Hiện trạng**:
- ✅ **Featured item**: Large card với gradient overlay, badge "Nổi bật"
- ✅ **Grid 2x2**: 4 small items bên cạnh
- ✅ **Secondary button**: `backgroundColor: secondary`
- ⚠️ **Gradient overlay**: `from-black/80` → text trắng, mất brand color

**Issues**:
1. Featured item price trắng → không dùng brand colors
2. Mobile layout fallback về grid 2x2 — OK

**Fix**:
```tsx
// Featured price dùng white + subtle secondary glow
<span className="text-xl font-bold text-white" 
      style={{ textShadow: `0 2px 8px ${secondary}40` }}>
  {showcaseFeatured?.price}
</span>
```

---

## 3. Reflect - Đánh giá tổng thể

### ✅ Đã làm tốt:
1. **Semantic tokens**: 90% dùng `brandColor` và `secondary` props, không hard-code hex
2. **BrandBadge component**: Consistent badge styling
3. **60-30-10 rule**: Hầu hết layouts tuân thủ (neutral 60%, text 30%, accent 10%)
4. **Hover effects**: Smooth transitions với secondary color hints
5. **Responsive**: Mobile-first breakpoints đúng

### ⚠️ Cần cải thiện:
1. **Primary color underused**: `brandColor` chỉ xuất hiện trong badges, thiếu ở headings/emphasized text
2. **Hard-coded slate colors**: `bg-slate-100`, `text-slate-500` nên replace bằng semantic tokens
3. **Mock images cứng**: Unsplash URLs → cần dùng real product/service images từ data
4. **Gradient overlays quá tối**: `from-black/90` → text trắng, mất brand identity
5. **Border hover states**: Một số chỗ dùng `slate-200` thay vì `${secondary}20`

### 🚫 Anti-patterns detected:
- ❌ **Không có**: Brand color chiếm 60% UI (pass)
- ❌ **Không có**: Complementary colors (pass)
- ✅ **Có**: Hard-coded colors (`bg-slate-100`) → minor issue

---

## 4. Execute - Plan chi tiết

### Step 1: Fix Mock Images (Priority: HIGH)
**File**: `previews.tsx` → `ProductListPreview` component

**Current**:
```tsx
const mockProducts = [
  { id: 1, image: 'https://images.unsplash.com/photo-...' }, // Hard-coded
  // ...
];
```

**Fix**:
```tsx
// Dùng real product images nếu có, fallback về placeholder
const displayItems = items && items.length > 0 
  ? items 
  : mockProducts.slice(0, Math.max(itemCount, 8));

// Trong render: Ưu tiên item.image từ selected products (manual mode)
{item.image ? (
  <PreviewImage src={item.image} alt={item.name} />
) : (
  <div className="..." style={{ backgroundColor: `${secondary}08` }}>
    <Package size={32} className="text-slate-300" />
  </div>
)}
```

**Why**: User đã chọn products cụ thể (manual mode) → preview phải hiển thị đúng ảnh sản phẩm đó, không phải ảnh random Unsplash.

---

### Step 2: Enhance Primary Color Usage (Priority: MEDIUM)
**Target**: `renderMinimalStyle`, `renderCommerceStyle`

**Fix**:
```tsx
// Minimal layout: Heading dùng secondary (đã có accent line), button dùng primary
<h2 style={{ color: secondary }}>{displayTitle}</h2>
<button style={{ backgroundColor: brandColor }}>Xem tất cả</button>

// Commerce layout: Badge "new"/"hot" dùng brandColor cho hot, secondary cho new
<BrandBadge 
  text={item.tag === 'hot' ? 'HOT' : 'NEW'} 
  variant={item.tag === 'hot' ? 'solid' : 'outline'}
  brandColor={brandColor}
  secondary={secondary}
/>
```

---

### Step 3: Lighten Gradient Overlays (Priority: MEDIUM)
**Target**: `renderBentoStyle`, `renderShowcaseStyle`

**Current**: `from-black/90`  
**Fix**: `from-black/70 via-black/30 to-transparent`

**Why**: Giữ được contrast cho text trắng nhưng không quá tối, vẫn thấy được ảnh sản phẩm.

---

### Step 4: Replace Hard-coded Slate Colors (Priority: LOW)
**Target**: All layouts

**Strategy**: Tạo semantic color palette object
```tsx
const semanticColors = {
  neutral: {
    bg: 'bg-white dark:bg-slate-900',
    surface: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-900 dark:text-slate-100',
    textMuted: 'text-slate-500 dark:text-slate-400',
  }
};
```

Replace:
- `bg-slate-100` → `semanticColors.neutral.surface`
- `text-slate-500` → `semanticColors.neutral.textMuted`

---

### Step 5: Add Secondary Hints to Hover States (Priority: LOW)
**Target**: `renderCompactStyle`, `renderCarouselStyle`

**Fix**:
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.borderColor = `${secondary}40`;
  e.currentTarget.style.boxShadow = `0 4px 12px ${secondary}10`;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.borderColor = '';
  e.currentTarget.style.boxShadow = 'none';
}}
```

---

## Checklist QA

### Dual Brand Color System Compliance
- [ ] **60-30-10 Rule**: Neutral 60%, Primary/Secondary 30%, Accent 10%
- [ ] **Semantic Tokens**: Không hard-code hex, dùng `brandColor`/`secondary` props
- [ ] **Contrast Ratio**: Text vs background ≥ 4.5:1 (WCAG AA)
- [ ] **Color Harmony**: Primary + Secondary analogous (30-60°)
- [ ] **No Anti-patterns**: Không dùng brand color 60%, không complementary colors

### Mock Preview với Ảnh Thật
- [ ] **Manual mode**: Hiển thị đúng ảnh từ selected products/services
- [ ] **Auto mode**: Hiển thị ảnh từ DB query results
- [ ] **Fallback**: Placeholder với icon + semantic color khi không có ảnh
- [ ] **Aspect ratio**: Giữ đúng tỷ lệ ảnh (object-cover vs object-contain)

### Accessibility
- [ ] **Touch targets**: Min 44px cho mobile buttons
- [ ] **Keyboard nav**: Focus states rõ ràng
- [ ] **Screen reader**: Alt text cho images

---

## Ước tính Impact

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Mock images cứng → real images | **HIGH** | 2h | P0 |
| Primary color underused | MEDIUM | 1h | P1 |
| Gradient overlays quá tối | MEDIUM | 0.5h | P1 |
| Hard-coded slate colors | LOW | 1h | P2 |
| Hover states thiếu secondary hint | LOW | 0.5h | P2 |

**Total**: ~5 hours

---

## Kết luận

**Tổng quan**: 6 layouts đã áp dụng **80%** dual-brand-color-system principles. Các vấn đề chính:

1. ✅ **Đã tốt**: 60-30-10 rule, semantic tokens, WCAG contrast
2. ⚠️ **Cần fix**: Mock images cứng, primary color underused, gradient overlays
3. 🔧 **Nice to have**: Replace hard-coded slate colors, enhance hover states

**Action**: Ưu tiên **Step 1 (mock images)** và **Step 2 (primary color)** để đạt 95% compliance.
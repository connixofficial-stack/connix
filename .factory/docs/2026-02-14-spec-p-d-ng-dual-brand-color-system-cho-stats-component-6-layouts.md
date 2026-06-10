# Spec: Áp dụng Dual Brand Color System cho Stats Component (6 Layouts)

## TL;DR
Áp dụng skill dual-brand-color-system để phối màu chính (primary) và phụ (secondary) theo quy tắc 60-30-10 cho **6 layouts Stats**:
1. Horizontal - Thanh ngang
2. Cards - Card grid
3. Icons - Circle badges
4. Gradient - Gradient background
5. Minimal - Typography focus
6. Counter - Big numbers với progress bar

**Scope:** Chỉ sửa phối màu (color scheme), KHÔNG thay đổi layout/structure.

---

## Problem Graph (DARE Framework)

```
[Main] Áp dụng dual brand colors cho Stats component
├── 1.1 [ROOT] Hiểu 60-30-10 rule: Neutral 60% + Primary 30% + Secondary 10%
├── 1.2 Xác định role của primary vs secondary trong Stats context
│   ├── 1.2.1 Primary: main numbers/values (30% visual weight)
│   ├── 1.2.2 Secondary: accents/highlights/CTAs (10% visual weight)
│   └── 1.2.3 Neutral: backgrounds/surfaces (60%)
├── 1.3 Áp dụng từng layout (6 layouts)
│   ├── 1.3.1 Layout 1: horizontal
│   ├── 1.3.2 Layout 2: cards
│   ├── 1.3.3 Layout 3: icons
│   ├── 1.3.4 Layout 4: gradient
│   ├── 1.3.5 Layout 5: minimal
│   └── 1.3.6 Layout 6: counter
└── 1.4 Đồng bộ admin preview (previews.tsx) với frontend render (ComponentRenderer.tsx)
```

---

## Execution Plan (Step-by-step)

### **1. Phân tích Hiện trạng**

#### 1.1 Stats Component hiện tại
- **Admin Preview:** `app/admin/home-components/previews.tsx` - component `StatsPreview` (dòng ~772-1028)
- **Frontend Render:** `components/site/ComponentRenderer.tsx` - function `StatsSection` (dòng ~648-826)
- **6 layouts:** horizontal, cards, icons, gradient, minimal, counter

#### 1.2 Vấn đề màu hiện tại
**Không theo 60-30-10 rule:**
- Layout 1 (horizontal): `brandColor` chiếm 100% background → **vi phạm** (should be 10% accent)
- Layout 2 (cards): `brandColor` cho numbers, accent line dùng `brandColor+30` → **chưa dùng secondary**
- Layout 3 (icons): circle background dùng `brandColor`, shadow dùng `secondary` → **hợp lý nhưng cần review**
- Layout 4 (gradient): background `brandColor` → **vi phạm** (60% should be neutral)
- Layout 5 (minimal): accent line `brandColor`, numbers `text-slate-900` → **chưa dùng secondary**
- Layout 6 (counter): progress bar `brandColor`, numbers `brandColor` → **chưa dùng secondary**

---

### **2. Strategy: Áp dụng 60-30-10 cho Stats**

#### 2.1 Quy tắc phân bổ màu trong Stats context

| Element | Color Role | % Visual Weight | Best Practice |
|---------|-----------|-----------------|---------------|
| **Backgrounds/Surfaces** | Neutral (white, slate-50) | 60% | Không dùng brand color cho full bg |
| **Numbers/Values** | Primary | 30% | Main focus, dùng `brandColor` (primary) |
| **Labels/Accents** | Secondary | 10% | Highlights, CTAs, hover states, accent lines |

#### 2.2 Dual Color Patterns cho Stats

**Pattern A: Primary cho Numbers, Secondary cho Accents**
```tsx
// Numbers (30% visual weight)
<span style={{ color: brandColor }}>1000+</span>

// Labels + Accent decorations (10%)
<h3 className="text-slate-600">Label</h3>
<div style={{ backgroundColor: secondary }}>Accent bar</div>
```

**Pattern B: Background với Secondary tint (subtle)**
```tsx
<div style={{ 
  backgroundColor: `${secondary}10`,  // 10% opacity tint
  borderColor: `${secondary}30`       // subtle border
}}>
```

---

### **3. Chi tiết từng Layout**

---

### **3.1 Layout 1: Horizontal (Thanh ngang)**

**Hiện trạng:**
```tsx
// ❌ Vi phạm: brandColor chiếm 100% background
<section style={{ backgroundColor: brandColor }}>
  <span className="text-white">{item.value}</span>
  <h3 className="text-white opacity-85">{item.label}</h3>
</section>
```

**Vấn đề:** Brand color chiếm 60% → overwhelming, vi phạm 60-30-10 rule.

**Giải pháp: Đổi sang neutral background + secondary accents**

```tsx
// ✅ Đúng 60-30-10
<section className="bg-white rounded-lg shadow-md overflow-hidden border-2"
  style={{ borderColor: `${secondary}20` }}>
  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x"
    style={{ borderColor: `${secondary}15` }}>
    <div className="flex-1 py-6 px-4 hover:bg-slate-50 transition-colors">
      {/* Number: primary color (30% visual weight) */}
      <span className="text-3xl md:text-4xl font-bold" 
        style={{ color: brandColor }}>
        {item.value}
      </span>
      {/* Label: neutral */}
      <h3 className="text-xs font-medium uppercase tracking-wider text-slate-600">
        {item.label}
      </h3>
      {/* Accent indicator: secondary (10%) */}
      <div className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: secondary }} />
    </div>
  </div>
</section>
```

**Thay đổi chi tiết:**
1. **Background:** `brandColor` → `bg-white` (neutral 60%)
2. **Border/Dividers:** `divide-white/10` → `${secondary}15` (secondary tint 10%)
3. **Numbers:** `text-white` → `style={{ color: brandColor }}` (primary 30%)
4. **Labels:** `text-white opacity-85` → `text-slate-600` (neutral)
5. **Thêm:** Top accent bar với `backgroundColor: secondary` (10%)
6. **Hover state:** `hover:bg-white/5` → `hover:bg-slate-50` (neutral)

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~779-804 (renderHorizontalStyle)
- `components/site/ComponentRenderer.tsx` dòng ~655-680 (horizontal style)

---

### **3.2 Layout 2: Cards (Grid cards)**

**Hiện trạng:**
```tsx
// Numbers: brandColor ✅
<span style={{ color: brandColor }}>{item.value}</span>
// Accent line: brandColor+30 ❌ (should use secondary)
<div style={{ backgroundColor: brandColor + '30' }} />
```

**Vấn đề:** Accent line dùng `brandColor` thay vì `secondary` → thiếu phân biệt primary/secondary.

**Giải pháp: Dùng secondary cho accents**

```tsx
<div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-opacity-50 transition-all"
  style={{ borderColor: `${secondary}15` }}>
  {/* Number: primary (30%) */}
  <span className="text-3xl font-bold" style={{ color: brandColor }}>
    {item.value}
  </span>
  {/* Label: neutral */}
  <h3 className="text-sm font-semibold text-slate-700">
    {item.label}
  </h3>
  {/* Accent line: secondary (10%) */}
  <div className="w-8 h-0.5 rounded-full mt-3 group-hover:opacity-70 transition-opacity"
    style={{ backgroundColor: secondary }} />
</div>
```

**Thay đổi chi tiết:**
1. **Border:** `border-slate-100` → `${secondary}15` (secondary tint)
2. **Hover border:** `hover:border-slate-200` → `${secondary}30`
3. **Numbers:** Giữ nguyên `brandColor` ✅
4. **Labels:** Giữ nguyên `text-slate-700` ✅
5. **Accent line:** `brandColor+'30'` → `secondary` (pure secondary color)

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~807-834 (renderCardsStyle)
- `components/site/ComponentRenderer.tsx` dòng ~683-710 (cards style)

---

### **3.3 Layout 3: Icons (Circle badges)**

**Hiện trạng:**
```tsx
// Circle: brandColor background ✅
<div style={{ 
  backgroundColor: brandColor,
  boxShadow: `0 10px 15px -3px ${secondary}30, ...`
}}>
  <span className="text-white">{item.value}</span>
</div>
// Label: text-slate-800, hover secondary color ✅
```

**Vấn đề:** Đã dùng đúng primary/secondary, nhưng cần review visual weight.

**Giải pháp: Giữ nguyên nhưng tăng nhấn cho secondary accents**

```tsx
<div className="flex flex-col items-center group">
  {/* Circle: primary background (30% visual weight) */}
  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 
    group-hover:scale-105 transition-all duration-300 ease-out border-[3px] ring-1"
    style={{ 
      backgroundColor: brandColor,
      borderColor: 'white',
      '--tw-ring-color': `${secondary}30`,
      boxShadow: `0 10px 15px -3px ${secondary}30, 0 4px 6px -4px ${secondary}20`
    } as React.CSSProperties}>
    {/* Number: white text trên primary bg */}
    <span className="text-2xl md:text-3xl font-bold text-white">
      {item.value}
    </span>
  </div>
  {/* Label: neutral, hover secondary tint */}
  <h3 className="text-base font-semibold text-slate-800 group-hover:transition-colors"
    style={{ '--hover-color': secondary } as React.CSSProperties}>
    {item.label}
  </h3>
</div>
```

**Thay đổi chi tiết:**
1. **Circle background:** Giữ `brandColor` ✅ (primary cho main element)
2. **Shadow:** Giữ `${secondary}30, ${secondary}20` ✅ (secondary accent)
3. **Ring:** `ring-slate-100` → `${secondary}30` (secondary tint)
4. **Numbers:** Giữ `text-white` ✅ (contrast trên primary bg)
5. **Labels:** Giữ `text-slate-800` ✅, thêm hover style với secondary

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~837-865 (renderIconsStyle)
- `components/site/ComponentRenderer.tsx` dòng ~713-741 (icons style)

---

### **3.4 Layout 4: Gradient (Glass morphism)**

**Hiện trạng:**
```tsx
// ❌ Vi phạm: brandColor chiếm 100% gradient background
<div style={{ 
  background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, ${brandColor}bb 100%)`
}}>
```

**Vấn đề:** Brand color chiếm full background → overwhelming.

**Giải pháp: Dual gradient với primary + secondary**

```tsx
<div className="rounded-2xl overflow-hidden border-2"
  style={{ 
    background: `linear-gradient(135deg, ${brandColor} 0%, ${secondary} 100%)`,
    borderColor: `${secondary}20`
  }}>
  <div className="grid grid-cols-2 md:grid-cols-4 backdrop-blur-sm">
    <div className="relative flex flex-col items-center justify-center text-center text-white p-6 md:p-8 
      md:border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      {/* Decorative circle: subtle accent */}
      <div className="absolute top-2 right-2 w-16 h-16 rounded-full blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
      {/* Number: white với drop shadow */}
      <span className="text-4xl md:text-5xl font-extrabold tabular-nums leading-none mb-2 relative z-10 drop-shadow-lg">
        {item.value}
      </span>
      {/* Label: white với opacity */}
      <h3 className="text-sm font-medium opacity-90 relative z-10">
        {item.label}
      </h3>
    </div>
  </div>
</div>
```

**Thay đổi chi tiết:**
1. **Gradient:** `brandColor → brandColor` → `brandColor (0%) → secondary (100%)` (dual brand gradient)
2. **Border:** Thêm `border-2` với `${secondary}20`
3. **Dividers:** Giữ `white/10` ✅ (neutral overlay)
4. **Numbers:** Giữ `text-white` + thêm `drop-shadow-lg` (tăng contrast)
5. **Labels:** Giữ `opacity-90` ✅
6. **Decorative circle:** Giữ `white/5` ✅

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~868-899 (renderGradientStyle)
- `components/site/ComponentRenderer.tsx` dòng ~744-775 (gradient style)

---

### **3.5 Layout 5: Minimal (Typography focus)**

**Hiện trạng:**
```tsx
// Accent line: brandColor ✅
<div style={{ backgroundColor: brandColor }} />
// Numbers: text-slate-900 ❌ (should use brandColor for primary)
<span className="text-slate-900">{item.value}</span>
```

**Vấn đề:** Numbers dùng neutral color thay vì primary → thiếu nhấn.

**Giải pháp: Numbers dùng primary, accent line dùng secondary**

```tsx
<section className="py-12 md:py-16 px-4 bg-slate-50">
  <div className="max-w-5xl mx-auto">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      <div className="flex flex-col items-start">
        {/* Accent line: secondary (10%) */}
        <div className="w-12 h-1 rounded-full mb-4"
          style={{ backgroundColor: secondary }} />
        {/* Number: primary (30%) */}
        <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums leading-none"
          style={{ color: brandColor }}>
          {item.value}
        </span>
        {/* Label: neutral */}
        <h3 className="text-base font-medium text-slate-500 mt-2">
          {item.label}
        </h3>
      </div>
    </div>
  </div>
</section>
```

**Thay đổi chi tiết:**
1. **Background:** Giữ `bg-slate-50` ✅ (neutral 60%)
2. **Accent line:** `brandColor` → `secondary` (secondary cho accents)
3. **Numbers:** `text-slate-900` → `brandColor` (primary cho main content)
4. **Labels:** Giữ `text-slate-500` ✅ (neutral)

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~902-926 (renderMinimalStyle)
- `components/site/ComponentRenderer.tsx` dòng ~778-803 (minimal style)

---

### **3.6 Layout 6: Counter (Big numbers với progress)**

**Hiện trạng:**
```tsx
// Progress bar: brandColor ✅
// Numbers: brandColor ❌ (should use secondary for accents)
<span style={{ color: brandColor }}>{item.value}</span>
// Watermark: brandColor ❌ (should use secondary)
<div style={{ color: brandColor }}>...</div>
```

**Vấn đề:** Cả numbers và progress bar đều dùng `brandColor` → thiếu phân biệt primary/secondary.

**Giải pháp: Progress bar dùng primary, numbers dùng secondary**

```tsx
<section className="py-12 md:py-16 px-4">
  <div className="max-w-5xl mx-auto">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <div className="relative bg-white rounded-2xl border overflow-hidden group"
        style={{ borderColor: `${secondary}15` }}>
        {/* Top progress bar: primary (30%) */}
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full transition-all duration-500"
            style={{ 
              backgroundColor: brandColor,
              width: `${Math.min(100, (idx + 1) * 25)}%`
            }} />
        </div>
        
        <div className="flex flex-col items-center justify-center text-center p-6">
          {/* Number: secondary (10% visual weight) */}
          <span className="text-5xl md:text-6xl font-black tracking-tighter tabular-nums leading-none 
            group-hover:scale-110 transition-transform duration-300"
            style={{ color: secondary }}>
            {item.value}
          </span>
          {/* Label: neutral */}
          <h3 className="text-sm font-semibold text-slate-600 mt-2">
            {item.label}
          </h3>
        </div>
        
        {/* Decorative watermark: secondary */}
        <div className="absolute -bottom-4 -right-4 text-[5rem] font-black opacity-[0.03] select-none pointer-events-none leading-none"
          style={{ color: secondary }}>
          {idx + 1}
        </div>
      </div>
    </div>
  </div>
</section>
```

**Thay đổi chi tiết:**
1. **Border:** `border-slate-100` → `${secondary}15` (secondary tint)
2. **Progress bar:** Giữ `brandColor` ✅ (primary cho progress indicator)
3. **Progress bar background:** Giữ `bg-slate-100` ✅ (neutral)
4. **Numbers:** `brandColor` → `secondary` (secondary cho big numbers - 10% visual weight)
5. **Labels:** Giữ `text-slate-600` ✅ (neutral)
6. **Watermark:** `brandColor` → `secondary` (secondary cho decorative elements)

**File cần sửa:**
- `app/admin/home-components/previews.tsx` dòng ~929-969 (renderCounterStyle)
- `components/site/ComponentRenderer.tsx` dòng ~806-846 (counter style)

---

### **4. Tổng kết Thay đổi**

#### 4.1 Files cần sửa

| File | Component | Dòng | Layouts |
|------|-----------|------|---------|
| `app/admin/home-components/previews.tsx` | `StatsPreview` | ~772-1028 | 6 layouts (renderHorizontalStyle, renderCardsStyle, ...) |
| `components/site/ComponentRenderer.tsx` | `StatsSection` | ~648-826 | 6 layouts (horizontal, cards, icons, ...) |

#### 4.2 Checklist Visual Weight (60-30-10)

| Layout | Neutral (60%) | Primary (30%) | Secondary (10%) |
|--------|---------------|---------------|-----------------|
| **1. Horizontal** | bg-white, labels | numbers | top accent bar, borders |
| **2. Cards** | bg-white, labels | numbers | accent line, borders |
| **3. Icons** | bg-white, labels | circle background | shadow, ring, hover |
| **4. Gradient** | decorative overlay | gradient start (0%) | gradient end (100%), border |
| **5. Minimal** | bg-slate-50, labels | numbers | accent line |
| **6. Counter** | bg-white, labels, progress bg | progress bar | numbers, watermark, borders |

#### 4.3 Contrast Validation (WCAG 2.2 AA)

Cần đảm bảo:
- **Numbers vs background:** ≥ 4.5:1
- **Labels vs background:** ≥ 4.5:1
- **Secondary accents vs white:** ≥ 3:1 (UI components)

**Testing:** Sử dụng WebAIM Contrast Checker sau khi implement.

---

### **5. Implementation Workflow**

#### Bước 1: Sửa Admin Preview (previews.tsx)
1. Tìm `renderHorizontalStyle()` → áp dụng changes từ 3.1
2. Tìm `renderCardsStyle()` → áp dụng changes từ 3.2
3. Tìm `renderIconsStyle()` → áp dụng changes từ 3.3
4. Tìm `renderGradientStyle()` → áp dụng changes từ 3.4
5. Tìm `renderMinimalStyle()` → áp dụng changes từ 3.5
6. Tìm `renderCounterStyle()` → áp dụng changes từ 3.6

#### Bước 2: Sửa Frontend Render (ComponentRenderer.tsx)
1. Tìm `if (style === 'horizontal')` → áp dụng changes từ 3.1
2. Tìm `if (style === 'cards')` → áp dụng changes từ 3.2
3. Tìm `if (style === 'icons')` → áp dụng changes từ 3.3
4. Tìm `if (style === 'gradient')` → áp dụng changes từ 3.4
5. Tìm `if (style === 'minimal')` → áp dụng changes từ 3.5
6. Tìm `return (` cuối cùng trong `StatsSection` → áp dụng changes từ 3.6 (counter)

#### Bước 3: Test Accessibility
1. Run `bunx oxlint --type-aware --type-check --fix`
2. Test với WebAIM Contrast Checker:
   - Primary vs white ≥ 4.5:1
   - Secondary vs white ≥ 4.5:1
3. Visual test: preview 6 layouts ở `/admin/home-components/create/stats`
4. Frontend test: kiểm tra trang chủ với từng layout

#### Bước 4: Commit
```bash
git add app/admin/home-components/previews.tsx components/site/ComponentRenderer.tsx
git commit -m "feat(stats): apply dual brand color system to 6 layouts

- Follow 60-30-10 rule: Neutral 60% + Primary 30% + Secondary 10%
- Layout 1 (horizontal): neutral bg + primary numbers + secondary accents
- Layout 2 (cards): secondary accent line instead of primary tint
- Layout 3 (icons): secondary shadow + ring accents
- Layout 4 (gradient): dual gradient primary→secondary
- Layout 5 (minimal): primary numbers + secondary accent line
- Layout 6 (counter): secondary numbers + primary progress bar

Ref: .factory/skills/dual-brand-color-system/SKILL.md"
```

---

### **6. Validation Checklist**

- [ ] Mọi layout đều tuân thủ 60-30-10 rule
- [ ] Primary color dùng cho main content (numbers/values)
- [ ] Secondary color dùng cho accents/highlights (≤10% visual weight)
- [ ] Neutral colors chiếm majority (backgrounds, labels)
- [ ] Contrast ratio ≥ 4.5:1 cho text
- [ ] Preview admin sync với frontend render
- [ ] No TypeScript errors
- [ ] oxlint pass

---

## Anti-patterns đã tránh

❌ **KHÔNG làm:**
- Brand color chiếm 60% background (overwhelming)
- Dùng chỉ 1 màu (primary) cho mọi elements
- Hard-code hex colors thay vì dùng `brandColor`/`secondary` props

✅ **ĐÃ làm đúng:**
- Neutral 60%, Primary 30%, Secondary 10%
- Dùng semantic colors từ props
- Tách biệt rõ ràng primary (main content) vs secondary (accents)

---

**Ước tính thời gian:** ~45-60 phút
- Sửa previews.tsx: ~20 phút
- Sửa ComponentRenderer.tsx: ~20 phút
- Testing + fixing: ~10-15 phút
- Commit: ~5 phút
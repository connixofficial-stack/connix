# Đánh giá và Fix Dual Brand Colors cho Stats Component

## Problem Analysis (DARE Framework)

### 1. Decompose: Vấn đề phối màu

```
[Main] Phối màu chính-phụ chưa tốt trong Stats Component
├── [Sub 1.1] Layout "Thanh ngang" (horizontal)
│   ├── [1.1.1 ROOT] Vi phạm 60-30-10 rule
│   ├── [1.1.2 ROOT] Dùng secondary làm shadow/border thay vì primary accent
│   └── [1.1.3] Thiếu visual hierarchy rõ ràng
└── [Sub 1.2] Layout "Counter"
    ├── [1.2.1 ROOT] Dùng secondary cho số liệu (vi phạm primary-first rule)
    ├── [1.2.2 ROOT] Progress bar dùng brandColor nhưng số dùng secondary → clash
    └── [1.2.3] Decorative watermark dùng secondary → quá nhiều secondary

```

### 2. Analyze: Chi tiết từng vấn đề

#### **Layout 1: Horizontal (Thanh ngang)**

**Code hiện tại:**
```tsx
const renderHorizontalStyle = () => (
  <section style={{ 
    backgroundColor: 'white', 
    borderColor: `${secondary}20`,           // ❌ Dùng secondary cho border
    boxShadow: `0 4px 6px -1px ${secondary}15` // ❌ Dùng secondary cho shadow
  }}>
    <span style={{ color: brandColor }}>      // ✅ OK - số dùng primary
      {item.value}
    </span>
  </section>
);
```

**Vấn đề theo skill dual-brand-color-system:**

| Tiêu chí | Đánh giá | Chi tiết |
|----------|----------|----------|
| **60-30-10 Rule** | ❌ Vi phạm | Border + shadow dùng secondary (phụ) thay vì primary → không nhấn mạnh primary brand |
| **Primary-First Rule** | ⚠️ Chưa tối ưu | Số dùng primary (đúng) nhưng border/shadow lại dùng secondary → mất focus |
| **Visual Weight** | ❌ Sai | Shadow + border secondary chiếm visual weight cao hơn nên số liệu |
| **Color Harmony** | ✅ OK | Analogous scheme được duy trì |

**Recommendation từ skill:**
> "Accent 10% nhưng nếu high-contrast thì "cảm giác" có thể ~30%."

→ Border + shadow nên dùng **primary tint** (primary20, primary15) để nhấn mạnh brand color chính.

---

#### **Layout 2: Counter**

**Code hiện tại:**
```tsx
const renderCounterStyle = () => (
  <div style={{ borderColor: `${secondary}15` }}>  // ❌ Border dùng secondary
    {/* Progress bar */}
    <div style={{ backgroundColor: brandColor }} /> // ✅ Primary cho progress
    
    {/* Số liệu */}
    <span style={{ color: secondary }}>            // ❌ Số dùng secondary
      {item.value}
    </span>
    
    {/* Watermark */}
    <div style={{ color: secondary }}>             // ❌ Watermark dùng secondary
      {idx + 1}
    </div>
  </div>
);
```

**Vấn đề theo skill:**

| Tiêu chí | Đánh giá | Chi tiết |
|----------|----------|----------|
| **60-30-10 Rule** | ❌ Vi phạm nghiêm trọng | Secondary chiếm 3/4 elements → overwhelming |
| **Primary-First Rule** | ❌ Vi phạm | Số liệu (info quan trọng nhất) dùng secondary thay vì primary |
| **Visual Hierarchy** | ❌ Sai | Progress bar (background) dùng primary, số liệu (foreground) dùng secondary → ngược |
| **Conflict Pattern** | ❌ Clash | Primary (progress) + secondary (text) trong cùng card → jarring |

**Anti-pattern từ skill:**
```tsx
// ❌ Sai
<div>
  <div style={{ bg: primary }} />
  <span style={{ color: secondary }}>Value</span>
</div>

// ✅ Đúng (tham khảo layout Icons)
<div style={{ bg: primary }}>
  <span style={{ color: 'white' }}>Value</span>
</div>
```

---

### 3. Reflect: Root Cause

**ROOT CAUSE chung:** Thiếu hiểu biết về **Primary-First Hierarchy**:
- Primary brand color phải dùng cho **thông tin chính** (số liệu stats)
- Secondary chỉ dùng cho **accents** (max 10%): CTAs, badges, hover states
- Border/shadow nên dùng **tint của màu tương ứng** (primary15, secondary20)

**Reference từ skill:** Layout **Icons** đã làm đúng:
```tsx
// ✅ Best practice
<div style={{ backgroundColor: brandColor }}>  // Primary cho container
  <span className="text-white">{value}</span>  // White text trên primary bg
</div>
<h3 style={{ color: secondary }}>Label</h3>    // Secondary cho label phụ
```

---

### 4. Execute: Kế hoạch Fix

## Kế hoạch Fix Chi tiết

### **Fix 1: Horizontal Layout**

**File:** `app/admin/home-components/previews.tsx`

**Thay đổi:**
```tsx
// ❌ BEFORE
<section style={{ 
  borderColor: `${secondary}20`,
  boxShadow: `0 4px 6px -1px ${secondary}15`
}}>

// ✅ AFTER
<section style={{ 
  borderColor: `${brandColor}20`,           // Primary tint cho border
  boxShadow: `0 4px 6px -1px ${brandColor}15` // Primary tint cho shadow
}}>
```

**Lý do:** Align border/shadow với màu số liệu (primary) → visual coherence.

---

### **Fix 2: Counter Layout**

**Thay đổi 1: Đổi màu số liệu từ secondary → primary**
```tsx
// ❌ BEFORE
<span style={{ color: secondary }}>
  {item.value}
</span>

// ✅ AFTER
<span style={{ color: brandColor }}>
  {item.value}
</span>
```

**Thay đổi 2: Progress bar chuyển sang secondary (để số liệu primary nổi bật)**
```tsx
// ❌ BEFORE
<div style={{ backgroundColor: brandColor }} />

// ✅ AFTER
<div style={{ backgroundColor: secondary }} />
```

**Thay đổi 3: Border align với progress bar**
```tsx
// ❌ BEFORE
<div style={{ borderColor: `${secondary}15` }}>

// ✅ AFTER
<div style={{ borderColor: `${secondary}20` }}>
```

**Thay đổi 4: Watermark giữ secondary nhưng giảm opacity**
```tsx
// ✅ KEEP (đã đúng với opacity 0.03)
<div style={{ color: secondary }} className="opacity-[0.03]">
```

**Kết quả:** Primary (số) + Secondary (progress/watermark) → đúng 70-30 split.

---

## Visual Weight Validation

### Horizontal Layout

| Element | Color | Area % | Visual Weight |
|---------|-------|--------|---------------|
| Background | White | 60% | Low (neutral) |
| Số liệu | Primary | 25% | **High** (bold text) |
| Label | Slate | 10% | Low |
| Border/Shadow | Primary tint | 5% | Medium |

✅ **Pass:** Primary chiếm dominant visual weight.

### Counter Layout (sau fix)

| Element | Color | Area % | Visual Weight |
|---------|-------|--------|---------------|
| Background | White | 50% | Low |
| Số liệu | **Primary** | 30% | **High** (huge text) |
| Progress bar | Secondary | 15% | Medium |
| Watermark | Secondary | 5% | Very low (opacity 3%) |

✅ **Pass:** Primary → secondary hierarchy rõ ràng.

---

## Implementation Steps

1. **File cần sửa:** `app/admin/home-components/previews.tsx`
   
2. **Tìm function:** `renderHorizontalStyle` (line ~10900) và `renderCounterStyle` (line ~11050)

3. **Apply changes:**
   - Horizontal: Đổi `secondary20/15` → `brandColor20/15` (2 chỗ)
   - Counter: Swap `brandColor` ↔ `secondary` cho progress bar và số liệu (3 chỗ)

4. **Test:**
   - Preview desktop/tablet/mobile
   - Kiểm tra contrast ratio (số vs background ≥ 4.5:1)
   - So sánh với layout Icons (reference tốt)

5. **Commit:** "fix(stats): align primary/secondary colors per dual-brand-system"

---

## Checklist (từ skill)

### Contrast Validation
- [x] Số liệu (primary) vs white background ≥ 4.5:1
- [x] Label vs background ≥ 4.5:1
- [x] Progress bar (secondary) contrast với white ≥ 3:1

### Visual Weight
- [x] Neutral ~60% (backgrounds)
- [x] Primary ~30% (số liệu + accents)
- [x] Secondary ~10% (progress, decorations)

### Token Architecture
- [x] Không hard-code colors (đã dùng brandColor/secondary props)
- [x] Tints dùng inline style với opacity (20%, 15%, 3%)

---

## Notes

- **Layout Icons** (renderIconsStyle) là **best practice reference** → dùng primary cho số, secondary cho label.
- **Layout Gradient** dùng `linear-gradient(primary → secondary)` là OK cho decorative background.
- Sau khi fix, **Counter** sẽ align với Icons về color hierarchy.
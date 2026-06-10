# Spec: Fix Dual-Brand Colors cho 6 ProductList Layouts

## 📋 Tổng quan
Refactor 6 layouts của ProductListPreview để tuân thủ **dual-brand-color-system** với tỷ lệ **60-30-10 rule**:
- **60%**: Neutral backgrounds (white/slate) ✅ đã OK
- **30%**: **PRIMARY color** (price + CTA + heading) ← FIX
- **10%**: **SECONDARY color** (hover + subtle accents) ← FIX

## 🎯 Mục tiêu
1. **Tăng Primary visual weight** từ ~5% lên **30%**
2. **Giảm Secondary** từ ~25% xuống **10%**
3. **Badges**: Alternate colors (NEW=secondary, HOT/SALE=primary)
4. **Bento/Showcase**: Special handling cho hero cards

---

## 🛠️ Chi tiết thay đổi từng Layout

### **Layout 1: Minimal** (`renderMinimalStyle`)

#### **File**: `app/admin/home-components/previews.tsx`

#### **Changes**:

**1. Section Header** (giữ nguyên ✅):
```typescript
// subTitle badge: SECONDARY ✅
<span style={{ backgroundColor: secondary }}>
// sectionTitle: PRIMARY ✅  
<h2 style={{ color: brandColor }}>
// "Xem tất cả" button: PRIMARY ✅
<button style={{ color: brandColor }}>
```

**2. Product Cards - Badges**:
```typescript
// BEFORE:
{discount && <BrandBadge text={discount} variant="solid" brandColor={brandColor} />}
{item.tag === 'new' && <BrandBadge text="NEW" variant="outline" brandColor={brandColor} />}
{item.tag === 'hot' && <BrandBadge text="HOT" variant="solid" brandColor={brandColor} />}

// AFTER (alternate colors):
{discount && <BrandBadge text={discount} variant="solid" brandColor={brandColor} secondary={secondary} />}
{item.tag === 'new' && <BrandBadge text="NEW" variant="outline" brandColor={secondary} secondary={secondary} />}
{item.tag === 'hot' && <BrandBadge text="HOT" variant="solid" brandColor={brandColor} secondary={secondary} />}
```

**3. "Xem chi tiết" Button (hover)**:
```typescript
// BEFORE:
<button className="..." style={{ color: secondary }}>

// AFTER (PRIMARY for CTA):
<button className="..." style={{ color: brandColor }}>
```

**4. Price**:
```typescript
// BEFORE:
<span className="font-bold" style={{ color: secondary }}>{item.price}</span>

// AFTER (PRIMARY - commerce context):
<span className="font-bold" style={{ color: brandColor }}>{item.price}</span>
```

**5. Card Border Hover (SECONDARY subtle accent)**:
```typescript
// BEFORE:
<div className="..." style={{ '--hover-border': `${secondary}20` }}>

// AFTER (giữ nguyên - đúng rồi ✅):
// Không đổi, secondary cho hover là đúng
```

---

### **Layout 2: Commerce** (`renderCommerceStyle`)

#### **Changes**:

**1. Badges** (giống Minimal - alternate):
```typescript
// NEW → secondary, HOT/SALE → primary
```

**2. Price**:
```typescript
// BEFORE:
<span style={{ color: secondary }}>{item.price}</span>

// AFTER:
<span style={{ color: brandColor }}>{item.price}</span>
```

**3. "Xem chi tiết" Button**:
```typescript
// BEFORE:
<button 
  style={{ borderColor: `${secondary}20`, color: secondary }}
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = secondary; 
    e.currentTarget.style.backgroundColor = `${secondary}08`; 
  }}
>

// AFTER (PRIMARY for CTA):
<button 
  style={{ borderColor: `${brandColor}20`, color: brandColor }}
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = brandColor; 
    e.currentTarget.style.backgroundColor = `${brandColor}08`; 
  }}
  onMouseLeave={(e) => { 
    e.currentTarget.style.borderColor = `${brandColor}20`; 
    e.currentTarget.style.backgroundColor = 'transparent'; 
  }}
>
```

**4. Card Border Hover (SECONDARY)**:
```typescript
// BEFORE:
style={{ '--hover-border': `${secondary}30` }}

// AFTER (giữ secondary cho hover - subtle):
// Không đổi ✅
```

---

### **Layout 3: Bento** (`renderBentoStyle`)

#### **Special handling**: Hero card dùng PRIMARY CTA, small cards dùng SECONDARY hover

#### **Changes**:

**1. Hero Card (2x2)**:

```typescript
// Featured item price (giữ WHITE - đúng rồi):
<span className="text-2xl font-bold text-white">{featured?.price}</span>

// CTA button:
// BEFORE:
<button style={{ backgroundColor: secondary }}>

// AFTER (PRIMARY cho hero CTA):
<button style={{ backgroundColor: brandColor }}>
  Xem chi tiết
</button>
```

**2. Hero Card - Badge**:
```typescript
// BEFORE:
{discount && <BrandBadge text={discount} variant="solid" brandColor={brandColor} />}

// AFTER (giữ primary - đúng):
// Không đổi ✅
```

**3. Small Cards (4 cards)**:

```typescript
// Background tint:
// BEFORE:
style={{ backgroundColor: `${secondary}08` }}

// AFTER (SECONDARY subtle - giữ nguyên ✅):
// Không đổi

// Price:
// BEFORE:
<span style={{ color: secondary }}>{item.price}</span>

// AFTER (PRIMARY):
<span style={{ color: brandColor }}>{item.price}</span>

// Hover arrow icon:
// BEFORE:
<div style={{ backgroundColor: secondary }}>
  <ArrowRight />
</div>

// AFTER (SECONDARY subtle - giữ nguyên ✅):
// Không đổi

// Badges (alternate):
{itemDiscount && <BrandBadge text={itemDiscount} variant="solid" brandColor={brandColor} />}
{item.tag === 'new' && <BrandBadge text="NEW" variant="outline" brandColor={secondary} />}
{item.tag === 'hot' && <BrandBadge text="HOT" variant="solid" brandColor={brandColor} />}
```

---

### **Layout 4: Carousel** (`renderCarouselStyle`)

#### **Changes**:

**1. Navigation Controls (swap sang PRIMARY)**:
```typescript
// BEFORE:
<ChevronLeft size={16} style={{ color: secondary }} />
<ChevronRight size={18} />
<button style={{ backgroundColor: secondary }}>

// AFTER (PRIMARY - controls quan trọng):
<ChevronLeft size={16} style={{ color: brandColor }} />
<ChevronRight size={18} className="text-white" />
<button style={{ backgroundColor: brandColor }}>
  <ChevronRight size={18} />
</button>
```

**2. Dots Indicator**:
```typescript
// BEFORE:
style={i === 0 ? { backgroundColor: secondary } : {}}

// AFTER (PRIMARY):
style={i === 0 ? { backgroundColor: brandColor } : {}}
```

**3. Price**:
```typescript
// BEFORE:
<span style={{ color: secondary }}>{item.price}</span>

// AFTER:
<span style={{ color: brandColor }}>{item.price}</span>
```

**4. Border Hover (SECONDARY subtle - giữ)**:
```typescript
// BEFORE:
onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${secondary}20`; }}

// AFTER:
// Không đổi ✅ (secondary cho hover là đúng)
```

**5. Badges** (alternate):
```typescript
// NEW → secondary, HOT/SALE → primary
```

---

### **Layout 5: Compact** (`renderCompactStyle`)

#### **Changes**:

**1. Price**:
```typescript
// BEFORE:
<span style={{ color: secondary }}>{item.price}</span>

// AFTER:
<span style={{ color: brandColor }}>{item.price}</span>
```

**2. Border Hover (SECONDARY)**:
```typescript
// BEFORE:
onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${secondary}20`; }}

// AFTER:
// Không đổi ✅
```

**3. Badges** (alternate):
```typescript
// NEW → secondary, HOT/SALE → primary
```

---

### **Layout 6: Showcase** (`renderShowcaseStyle`)

#### **Special handling**: Featured card PRIMARY dominant, grid cards SECONDARY subtle

#### **Changes**:

**1. Featured Card**:

```typescript
// "Nổi bật" badge:
// BEFORE:
<BrandBadge text="Nổi bật" variant="solid" brandColor={brandColor} />

// AFTER (giữ PRIMARY - đúng):
// Không đổi ✅

// Price (WHITE - giữ):
<span className="text-xl font-bold text-white">{showcaseFeatured?.price}</span>

// CTA button:
// BEFORE:
<button style={{ backgroundColor: secondary }}>

// AFTER (PRIMARY cho featured CTA):
<button style={{ backgroundColor: brandColor }}>
  Xem chi tiết
</button>
```

**2. Small Grid Cards (2x2)**:

```typescript
// Price:
// BEFORE:
<span style={{ color: secondary }}>{item.price}</span>

// AFTER (PRIMARY):
<span style={{ color: brandColor }}>{item.price}</span>

// Border Hover (SECONDARY subtle - giữ):
// Không đổi ✅
```

**3. Badges** (alternate):
```typescript
// NEW → secondary, HOT/SALE → primary
```

---

## 📊 Summary Table: Before vs After

| Element | Before | After | Rationale |
|---------|--------|-------|-----------|
| **Price** | Secondary ❌ | **Primary** ✅ | Commerce context - quan trọng nhất |
| **CTA Buttons** | Secondary ❌ | **Primary** ✅ | Action quan trọng |
| **Heading** | Primary ✅ | Primary ✅ | Giữ nguyên |
| **Navigation** | Secondary ❌ | **Primary** ✅ | Controls quan trọng |
| **Hover Border** | Secondary ✅ | Secondary ✅ | Subtle accent - giữ nguyên |
| **Hover BG** | Secondary ✅ | Secondary ✅ | Subtle - giữ nguyên |
| **NEW Badge** | Primary ❌ | **Secondary** ✅ | Alternate for variety |
| **HOT/SALE Badge** | Primary ✅ | Primary ✅ | Giữ nguyên |
| **Discount Badge** | Primary ✅ | Primary ✅ | Giữ nguyên |

---

## ✅ Validation Checklist

Sau khi implement, verify:

- [ ] **Minimal**: Price + CTA = primary, hover = secondary
- [ ] **Commerce**: Price + CTA = primary, hover = secondary
- [ ] **Bento**: Hero CTA = primary, small cards price = primary, hover arrow = secondary
- [ ] **Carousel**: Navigation + dots + price = primary, hover = secondary
- [ ] **Compact**: Price = primary, hover = secondary
- [ ] **Showcase**: Featured CTA + grid price = primary, hover = secondary
- [ ] **All layouts**: NEW badge = secondary, HOT/SALE = primary
- [ ] **Visual weight**: Primary ~30%, Secondary ~10%, Neutral 60%

---

## 🎨 60-30-10 Final Breakdown

**60% Neutral**: Backgrounds (white, slate-50, slate-100) ✅

**30% Primary** (brandColor):
- Headings (section titles)
- **Prices** (all layouts)
- **CTA buttons** (all layouts)
- **Navigation controls** (Carousel)
- **Dots indicators** (Carousel)
- **HOT/SALE badges**
- **Discount badges**

**10% Secondary**:
- **SubTitle badges** (header)
- **Hover borders** (subtle `${secondary}20`)
- **Hover backgrounds** (`${secondary}08`)
- **NEW badges** (alternate)
- **Small accents** (Bento arrow icon, bg tints)

---

## 🔧 Implementation Steps

1. **Tìm và thay thế tất cả `style={{ color: secondary }}` cho Price**:
   - Search: `price.*style={{ color: secondary }}`
   - Replace: `style={{ color: brandColor }}`

2. **Fix CTA buttons**:
   - Search: `Xem chi tiết.*secondary`
   - Update border/text/hover colors → `brandColor`

3. **Fix Navigation (Carousel)**:
   - Arrows + dots → `brandColor`

4. **Fix Badges**:
   - `item.tag === 'new'` → `brandColor={secondary}`
   - `item.tag === 'hot'` và discount → `brandColor={brandColor}`

5. **Verify visually**: Mở preview, check tất cả 6 layouts

---

## 📝 Files to Change

- `app/admin/home-components/previews.tsx`
  - `renderMinimalStyle()` (lines ~3600-3680)
  - `renderCommerceStyle()` (lines ~3682-3800)
  - `renderBentoStyle()` (lines ~3802-4020)
  - `renderCarouselStyle()` (lines ~4022-4100)
  - `renderCompactStyle()` (lines ~4102-4180)
  - `renderShowcaseStyle()` (lines ~4182-4320)

**Estimated changes**: ~30-40 lines across 6 functions

---

## ⚠️ Notes

- **BrandBadge component**: Cần verify nó có prop `brandColor` và `secondary` không? Nếu không thì phải pass qua `className` hoặc `style`
- **Hover handlers**: Một số dùng inline `onMouseEnter/Leave`, cần update cả 2 handlers
- **TypeScript**: Không có type changes, chỉ đổi colors

---

**End of Spec** ✅
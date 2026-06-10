# Spec: Fix Dual-Brand Colors cho CTA Component (3/6 Layouts)

## 📋 Tổng quan

Refactor **3 layouts CTA** (Banner, Centered, Gradient) để tuân thủ 100% skill dual-brand-color-system. Hiện tại các layout này vi phạm quy tắc 60-30-10: Primary/Secondary chiếm quá nhiều visual weight (40-60% thay vì 30%/10%).

**Files ảnh hưởng**:
- `app/admin/home-components/previews.tsx` (lines 5740-6050 ước tính)

**Layouts cần fix**: Banner, Centered, Gradient (3/6)  
**Layouts đã đúng**: Split, Floating, Minimal (3/6) → **KHÔNG ĐỔI**

**Estimate**: ~20 phút (3 layouts × 5-8 phút/layout)

---

## 🎯 Mục tiêu

1. **Banner**: Giảm Primary từ 60% → 30% (đổi bg từ brandColor → neutral)
2. **Centered**: Giảm Secondary từ ~40% → 10% (heading từ secondary → primary)
3. **Gradient**: Giảm intensity từ solid gradient → tint gradient (chiếm <30%)
4. Đảm bảo **không ảnh hưởng** 3 layouts đã đúng (Split, Floating, Minimal)

---

## 📊 Summary Table: Before vs After

| Element | Before | After | Rationale |
|---------|--------|-------|-----------|
| **Banner - Background** | `brandColor` (60%) ❌ | `slate-50` neutral (60%) ✅ | Primary chỉ nên 30% |
| **Banner - Button** | Secondary text/shadow ✅ | `brandColor` bg ✅ | CTA = primary action |
| **Centered - Heading** | `secondary` ❌ | `brandColor` ✅ | Heading = 30% visual weight → primary |
| **Centered - Background** | `${secondary}10` tint ✅ | Giữ nguyên ✅ | Subtle tint = OK |
| **Gradient - Background** | Solid gradient (60%) ❌ | Tint gradient (~20%) ✅ | Giảm overwhelming |
| **Gradient - Button** | White bg + secondary text ✅ | Giữ nguyên ✅ | Contrast tốt |

---

## 🛠️ Chi tiết thay đổi từng Layout

### **Layout 1: Banner** (`renderBannerStyle`)

#### **File**: `app/admin/home-components/previews.tsx`
#### **Lines**: ~5742-5790 (ước tính)

#### **Changes**:

**1. Background: Primary → Neutral**
```typescript
// BEFORE (line ~5743):
<section 
  className={cn("w-full", device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6')} 
  style={{ backgroundColor: brandColor }}
>

// AFTER (60% neutral):
<section 
  className={cn(
    "w-full bg-slate-50 dark:bg-slate-900", 
    device === 'mobile' ? 'py-8 px-4' : 'py-12 px-6'
  )}
>
```

**2. Button (Primary): Secondary text → Primary bg**
```typescript
// BEFORE (line ~5769):
<button 
  className={cn(
    "bg-white rounded-lg font-medium whitespace-nowrap transition-all hover:shadow-lg hover:scale-105",
    device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
  )} 
  style={{ boxShadow: `0 4px 12px ${secondary}40`, color: secondary }}
>

// AFTER (PRIMARY for CTA):
<button 
  className={cn(
    "rounded-lg font-medium text-white whitespace-nowrap transition-all hover:shadow-lg hover:scale-105",
    device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
  )} 
  style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}
>
```

**3. Heading: White text → Primary color**
```typescript
// BEFORE (line ~5760):
<h3 className={cn(
  "font-bold text-white line-clamp-2",
  device === 'mobile' ? 'text-xl' : 'text-2xl'
)}>

// AFTER (PRIMARY for heading):
<h3 className={cn(
  "font-bold text-slate-900 dark:text-white line-clamp-2",
  device === 'mobile' ? 'text-xl' : 'text-2xl'
)}>
```

**4. Description: White/80 → Slate**
```typescript
// BEFORE (line ~5764):
<p className={cn(
  "text-white/80 mt-2 line-clamp-2",
  device === 'mobile' ? 'text-sm' : 'text-base'
)}>

// AFTER:
<p className={cn(
  "text-slate-600 dark:text-slate-400 mt-2 line-clamp-2",
  device === 'mobile' ? 'text-sm' : 'text-base'
)}>
```

**5. Secondary Button: White border → Secondary border**
```typescript
// BEFORE (line ~5777):
<button className={cn(
  "border-2 border-white/50 text-white rounded-lg font-medium whitespace-nowrap hover:bg-white/10 transition-all",
  device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
)}>

// AFTER (SECONDARY for secondary action):
<button className={cn(
  "border-2 rounded-lg font-medium whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
  device === 'mobile' ? 'px-5 py-3 min-h-[44px] text-sm' : 'px-6 py-3'
)} style={{ borderColor: `${secondary}30`, color: secondary }}>
```

---

### **Layout 2: Centered** (`renderCenteredStyle`)

#### **File**: `app/admin/home-components/previews.tsx`
#### **Lines**: ~5793-5840 (ước tính)

#### **Changes**:

**1. Heading: Secondary → Primary**
```typescript
// BEFORE (line ~5804):
<h3 
  className={cn("font-bold line-clamp-2", device === 'mobile' ? 'text-xl' : 'text-3xl')} 
  style={{ color: secondary }}
>

// AFTER (PRIMARY for heading = 30%):
<h3 
  className={cn("font-bold line-clamp-2", device === 'mobile' ? 'text-xl' : 'text-3xl')} 
  style={{ color: brandColor }}
>
```

**2. Secondary Button Border: brandColor → secondary**
```typescript
// BEFORE (line ~5825):
<button 
  className={cn(
    "border-2 rounded-lg font-medium whitespace-nowrap hover:bg-opacity-10 transition-all",
    device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-3'
  )} 
  style={{ borderColor: brandColor, color: secondary }}
>

// AFTER (SECONDARY border cho secondary action):
<button 
  className={cn(
    "border-2 rounded-lg font-medium whitespace-nowrap hover:bg-opacity-10 transition-all",
    device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-3'
  )} 
  style={{ borderColor: `${secondary}30`, color: secondary }}
>
```

**Lưu ý**: Background `${secondary}10` tint GIỮ NGUYÊN (subtle = OK theo skill)

---

### **Layout 5: Gradient** (`renderGradientStyle`)

#### **File**: `app/admin/home-components/previews.tsx`
#### **Lines**: ~5950-6020 (ước tính)

#### **Changes**:

**1. Gradient Background: Solid → Tint**
```typescript
// BEFORE (line ~5953):
<section 
  className={cn("w-full relative overflow-hidden", device === 'mobile' ? 'py-10 px-4' : 'py-16 px-6')}
  style={{ 
    background: `linear-gradient(135deg, ${brandColor} 0%, ${secondary} 50%, ${brandColor} 100%)`
  }}
>

// AFTER (TINT gradient ~20% visual weight):
<section 
  className={cn("w-full relative overflow-hidden", device === 'mobile' ? 'py-10 px-4' : 'py-16 px-6')}
  style={{ 
    background: `linear-gradient(135deg, ${brandColor}15 0%, ${secondary}10 50%, ${brandColor}15 100%)`
  }}
>
```

**2. Heading Text: White → Primary**
```typescript
// BEFORE (line ~5973):
<h3 className={cn(
  "font-bold text-white line-clamp-2",
  device === 'mobile' ? 'text-2xl' : 'text-4xl'
)}>

// AFTER:
<h3 className={cn(
  "font-bold text-slate-900 dark:text-white line-clamp-2",
  device === 'mobile' ? 'text-2xl' : 'text-4xl'
)}>
```

**3. Description Text: White/90 → Slate**
```typescript
// BEFORE (line ~5977):
<p className={cn(
  "text-white/90 mt-4 max-w-xl mx-auto line-clamp-3",
  device === 'mobile' ? 'text-sm' : 'text-lg'
)}>

// AFTER:
<p className={cn(
  "text-slate-600 dark:text-slate-400 mt-4 max-w-xl mx-auto line-clamp-3",
  device === 'mobile' ? 'text-sm' : 'text-lg'
)}>
```

**4. Button (Primary): White bg + secondary text → brandColor bg**
```typescript
// BEFORE (line ~5982):
<button 
  className={cn(
    "bg-white rounded-full font-semibold whitespace-nowrap transition-all hover:scale-105 hover:shadow-xl",
    device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
  )} 
  style={{ boxShadow: `0 8px 24px rgba(0,0,0,0.2)`, color: secondary }}
>

// AFTER (PRIMARY for CTA):
<button 
  className={cn(
    "rounded-full font-semibold text-white whitespace-nowrap transition-all hover:scale-105 hover:shadow-xl",
    device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
  )} 
  style={{ backgroundColor: brandColor, boxShadow: `0 8px 24px ${brandColor}40` }}
>
```

**5. Secondary Button: White border → Secondary border + text**
```typescript
// BEFORE (line ~5990):
<button className={cn(
  "border-2 border-white text-white rounded-full font-semibold whitespace-nowrap hover:bg-white/10 transition-all",
  device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
)}>

// AFTER (SECONDARY for secondary action):
<button className={cn(
  "border-2 rounded-full font-semibold whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
  device === 'mobile' ? 'px-6 py-3 min-h-[44px] text-sm' : 'px-8 py-4'
)} style={{ borderColor: `${secondary}30`, color: secondary }}>
```

**6. Decorative Circles: White → Tint primary/secondary**
```typescript
// BEFORE (line ~5961-5967):
<div 
  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
  style={{ backgroundColor: 'white' }}
/>
<div 
  className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
  style={{ backgroundColor: 'white' }}
/>

// AFTER (subtle brand accent):
<div 
  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
  style={{ backgroundColor: brandColor }}
/>
<div 
  className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
  style={{ backgroundColor: secondary }}
/>
```

---

## ✅ Validation Checklist

Sau khi implement, verify:

- [ ] **Banner**: Background = neutral (slate-50), Button = primary (brandColor bg)
- [ ] **Centered**: Heading = primary (brandColor), Button = primary
- [ ] **Gradient**: Gradient tint (~20%), Button = primary (brandColor bg)
- [ ] **Split, Floating, Minimal**: KHÔNG ĐỔI (đã đúng)
- [ ] **Visual weight**: Primary ~30%, Secondary ~10%, Neutral 60% (manual check)
- [ ] **TypeScript compile**: `bunx oxlint --type-aware --type-check --fix` passes
- [ ] **No hard-coded colors**: `grep -n "color: ['\"]#" previews.tsx` = ZERO

---

## 🔧 Implementation Steps

1. **Mở file**: `app/admin/home-components/previews.tsx`

2. **Tìm function `renderBannerStyle`** (~line 5742):
   - Thay background: `backgroundColor: brandColor` → `className="bg-slate-50 dark:bg-slate-900"`
   - Thay button: `color: secondary` → `backgroundColor: brandColor, text-white`
   - Thay heading/description: `text-white` → `text-slate-900/600`

3. **Tìm function `renderCenteredStyle`** (~line 5793):
   - Thay heading: `color: secondary` → `color: brandColor`
   - Thay secondary button border: `borderColor: brandColor` → `borderColor: ${secondary}30`

4. **Tìm function `renderGradientStyle`** (~line 5950):
   - Thay gradient: solid colors → tint (`${brandColor}15`, `${secondary}10`)
   - Thay text: `text-white` → `text-slate-900/600`
   - Thay button: `bg-white, color: secondary` → `backgroundColor: brandColor, text-white`

5. **Verify visually**: Mở preview `http://localhost:3000/admin/home-components/create/cta`, check 6 layouts

6. **Run lint**: `bunx oxlint --type-aware --type-check --fix`

7. **Commit**:
   ```bash
   git add app/admin/home-components/previews.tsx
   git commit -m "fix(cta): rebalance primary and secondary colors in 3 layouts

   - Banner: background brandColor → neutral (60%), button → primary
   - Centered: heading secondary → primary (30%)
   - Gradient: solid gradient → tint gradient (~20%), button → primary
   - Apply 60-30-10 rule: Primary ~30%, Secondary ~10%, Neutral 60%
   
   Changed: 3 layouts × ~8 changes/layout = ~25 lines"
   ```

---

## 🎯 Expected Results

### Before (Issues):
- Banner: Primary chiếm 60% UI (overwhelming)
- Centered: Secondary chiếm ~40% (heading + bg tint)
- Gradient: Brand colors chiếm 60% (solid gradient)

### After (Fixed):
- Banner: Neutral 60%, Primary button ~30%, layout cân bằng
- Centered: Primary heading ~30%, Secondary tint ~10%
- Gradient: Neutral/tint 60%, Primary button ~30%

**All 6 layouts tuân thủ 100% skill dual-brand-color-system ✅**
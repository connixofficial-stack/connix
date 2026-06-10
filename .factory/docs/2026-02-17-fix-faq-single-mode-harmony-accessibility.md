# Fix FAQ Single Mode - Harmony Warning + Accessibility Warning

## ROOT CAUSE

### 1. Harmony Warning (deltaE = 0)
**Hiện tại**: `resolveFaqSecondary()` trong single mode trả về `primary` → primary = secondary → deltaE = 0.

**Theo skill v11.2.0 - Principle 5**:
- Single mode PHẢI auto-suggest secondary từ primary theo harmony
- Mặc định: Analogous (+30°)
- Options: Complementary/Triadic

### 2. Accessibility Warning (minLc: 53.2 < 60)
**Hiện tại**: `tabActiveText` dùng `secondaryPalette.textOnSolid` (được tính cho 14/700)

**Vấn đề**: Tab text thực tế dùng 14/500 → threshold = 60 (không phải 45) → fail APCA

---

## IMPLEMENTATION PLAN

### File: `app/admin/home-components/faq/_lib/colors.ts`

#### **Step 1**: Fix `resolveFaqSecondary()` - line 229
```ts
// BEFORE (SAI)
export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
  harmony: FaqHarmony = 'analogous',
) => {
  if (mode === 'single') {return primary;} // ❌ deltaE = 0
  ...
}

// AFTER (ĐÚNG)
export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
  harmony: FaqHarmony = 'analogous',
) => {
  // Single mode: auto-suggest secondary từ primary theo harmony
  if (mode === 'single') {
    return getFaqHarmonyFallback(primary, normalizeHarmony(harmony));
  }
  
  // Dual mode: dùng secondary nếu valid, fallback harmony
  const trimmedSecondary = secondary.trim();
  if (trimmedSecondary && isValidHexColor(trimmedSecondary)) {
    return trimmedSecondary;
  }
  return getFaqHarmonyFallback(primary, normalizeHarmony(harmony));
}
```

**Logic mới**:
- `mode='single'` → luôn dùng `getFaqHarmonyFallback(primary, harmony)`
- `mode='dual'` → dùng secondary nếu valid, fallback harmony

---

#### **Step 2**: Fix `tabActiveText` accessibility - line 315
```ts
// BEFORE (SAI - fontSize/weight không khớp)
tabActiveText: secondaryPalette.textOnSolid, // tính cho 14/700

// AFTER (ĐÚNG - tính đúng cho 14/500)
tabActiveText: getAPCATextColor(secondaryPalette.solid, 14, 500),
```

**Lý do**: Tab text dùng 14/500 → threshold = 60, phải tính lại APCA.

---

#### **Step 3**: Fix `tabbed` style - line 348 (tương tự)
```ts
// Style 'tabbed' cũng có tabActiveText
if (style === 'tabbed') {
  return {
    ...base,
    // ... other properties
    tabActiveText: getAPCATextColor(secondaryPalette.solid, 14, 500), // ← FIX
  };
}
```

---

## VERIFICATION

### 1. Type check
```bash
bunx tsc --noEmit
```

### 2. Test cases
- Mở `http://localhost:3000/admin/home-components/faq/{id}/edit`
- Chuyển site brand mode = `single`
- Test với 6 layouts (accordion, cards, two-column, minimal, timeline, tabbed)
- Test với 3 harmony options (analogous, complementary, triadic)

**Expected**:
- ✅ Harmony warning biến mất (deltaE > 20)
- ✅ Accessibility warning biến mất (minLc >= 60 cho tab text)
- ✅ Preview render đúng màu theo harmony

### 3. Edge cases
- Primary = `#3b82f6` (blue), harmony = analogous → secondary ≈ `#6366f1` (indigo)
- Primary = `#ef4444` (red), harmony = complementary → secondary ≈ `#22d3ee` (cyan)
- Primary = `#10b981` (green), harmony = triadic → secondary ≈ `#f59e0b` (amber)

---

## COMMIT MESSAGE
```
fix(faq): single mode harmony + tab text accessibility

- resolveFaqSecondary() single mode auto-suggest từ primary
- tabActiveText dùng getAPCATextColor(14/500) thay vì textOnSolid
- Tuân thủ skill dual-brand-color-system v11.2 Principle 5
```

---

## FILES CHANGED
1. `app/admin/home-components/faq/_lib/colors.ts` (3 changes)

## ESTIMATED TIME
~2 phút (chỉ sửa 1 file, 3 dòng code)
# Spec: Fix FAQ Component theo Dual Brand Color System v11.2

## Vấn đề tìm thấy

### 1. Anti-Opacity/Shadow Rules (CRITICAL)
- ❌ **Opacity cho borders**: `panelBorder` ('26'), `panelBorderStrong` ('52'), `timelineLine` ('33')
- ❌ **Box-shadow decorative**: `ctaShadow` cho CTA button
- ❌ **Badge bg không solid**: dùng `panelBgMuted` thay vì solid tint

### 2. Accent Balance
- ⚠️ **Primary < 25%**: accordion=20%, cards=21% (skill yêu cầu >= 25%)

### 3. Component Color Map cần update
- FAQ hiện: `Needs Review` → phải update `Last Updated: 2026-02-17` + `Status: OK` sau fix

---

## Plan Fix (Step-by-Step)

### **Bước 1: Fix opacity borders → solid colors**

**File:** `app/admin/home-components/faq/_lib/colors.ts`

**Thay đổi `generatePalette`:**

```typescript
// BEFORE
const generatePalette = (hex: string): FaqPalette => ({
  // ... other properties
  border: oklchShift(hex, { l: 0.26, c: -0.02 }),
  panelBorder: applyAlpha(secondaryPalette.solid, '26'),        // ❌ opacity
  panelBorderStrong: applyAlpha(secondaryPalette.solid, '52'),  // ❌ opacity
  timelineLine: applyAlpha(secondaryPalette.solid, '33'),       // ❌ opacity
});

// AFTER
const generatePalette = (hex: string): FaqPalette => ({
  // ... other properties
  border: oklchShift(hex, { l: 0.45 }),              // ✅ solid tint
  // Bỏ alpha, dùng solid OKLCH shift
});
```

**Thêm border tokens vào `FaqStyleTokens`:**
```typescript
export interface FaqStyleTokens {
  // ... existing
  panelBorder: string;          // solid border (l+0.45)
  panelBorderStrong: string;    // solid border darker (l+0.35)
  timelineLine: string;         // solid line (l+0.42)
  badgeBg: string;              // ✅ NEW: solid badge bg (l+0.42)
}
```

**Update `getFaqColors` base:**
```typescript
const base: FaqStyleTokens = {
  // ... existing
  panelBorder: oklchShift(resolvedSecondary, { l: 0.45 }),       // ✅ solid
  panelBorderStrong: oklchShift(resolvedSecondary, { l: 0.35 }), // ✅ solid darker
  timelineLine: oklchShift(resolvedSecondary, { l: 0.42 }),      // ✅ solid
  badgeBg: oklchShift(resolvedSecondary, { l: 0.42 }),           // ✅ NEW
  ctaShadow: 'none',  // ✅ Bỏ shadow decorative
};
```

---

### **Bước 2: Bỏ box-shadow decorative**

**File:** `app/admin/home-components/faq/_lib/colors.ts`

**Trong `getFaqColors` - style `two-column`:**
```typescript
// BEFORE
if (style === 'two-column') {
  return {
    ...base,
    ctaShadow: `0 4px 12px ${applyAlpha(primaryPalette.active, '42')}`,  // ❌
  };
}

// AFTER
if (style === 'two-column') {
  return {
    ...base,
    ctaShadow: 'none',  // ✅ Flat design, không shadow
  };
}
```

**Trong base tokens:**
```typescript
ctaShadow: 'none',  // ✅ Mặc định không shadow
```

---

### **Bước 3: Fix badge background → solid tint**

**File:** `app/admin/home-components/faq/_components/FaqSectionShared.tsx`

**Trong `renderRemainingBadge()`:**
```typescript
// BEFORE
style={{ backgroundColor: tokens.panelBgMuted, color: tokens.number }}

// AFTER
style={{ backgroundColor: tokens.badgeBg, color: tokens.number }}  // ✅ Dùng token mới
```

---

### **Bước 4: Re-calculate Accent Balance (nếu cần)**

**File:** `app/admin/home-components/faq/_lib/colors.ts`

**Điều chỉnh `FAQ_ACCENT_BALANCE_BY_STYLE`:**
```typescript
// BEFORE
const FAQ_ACCENT_BALANCE_BY_STYLE: Record<FaqStyle, { primary: number; secondary: number; neutral: number }> = {
  accordion: { primary: 20, secondary: 12, neutral: 68 },  // ❌ Primary < 25%
  cards: { primary: 21, secondary: 11, neutral: 68 },      // ❌ Primary < 25%
  // ...
};

// AFTER
const FAQ_ACCENT_BALANCE_BY_STYLE: Record<FaqStyle, { primary: number; secondary: number; neutral: number }> = {
  accordion: { primary: 25, secondary: 12, neutral: 63 },  // ✅ Primary >= 25%
  cards: { primary: 26, secondary: 11, neutral: 63 },      // ✅ Primary >= 25%
  'two-column': { primary: 28, secondary: 10, neutral: 62 },
  minimal: { primary: 22, secondary: 12, neutral: 66 },    // ⚠️ Cần review visual
  timeline: { primary: 24, secondary: 13, neutral: 63 },
  tabbed: { primary: 26, secondary: 14, neutral: 60 },
};
```

**NOTE:** Minimal style có heading nhỏ hơn → nếu không đủ 25% thì cần tăng size heading hoặc thêm icon primary.

---

### **Bước 5: Update Component Color Map**

**File:** `.factory/skills/dual-brand-color-system/SKILL.md`

**Tìm dòng:**
```markdown
| FAQ | 40 | 60 | secondary: expanded border/icon | N/A | Needs Review |
```

**Update thành:**
```markdown
| FAQ | 25 | 12 | secondary: borders/chevron/numbers/tabs; primary: heading/CTA/iconBg | 2026-02-17 | OK |
```

---

### **Bước 6: Verify accessibility score**

**Test plan:**
1. Mở preview 6 layouts
2. Check warning accessibility (phải không có fail)
3. Check harmony warning (deltaE >= 20)
4. Check accent balance footer (Primary >= 25%)

**Command:**
```bash
bunx tsc --noEmit
```

---

### **Bước 7: Commit changes**

**Files changed:**
- `app/admin/home-components/faq/_lib/colors.ts` (fix opacity → solid)
- `app/admin/home-components/faq/_components/FaqSectionShared.tsx` (badge bg)
- `.factory/skills/dual-brand-color-system/SKILL.md` (component map)

**Commit message:**
```
fix(faq): tuân thủ dual-brand-color-system v11.2

- Bỏ opacity cho borders (panelBorder, panelBorderStrong, timelineLine) → dùng solid OKLCH shift
- Bỏ box-shadow decorative cho CTA button
- Fix badge bg dùng solid tint (l+0.42)
- Điều chỉnh accent balance: primary >= 25% cho accordion/cards/two-column/tabbed
- Update Component Color Map: FAQ status OK
```

---

## Validation Checklist

- [ ] Không còn `applyAlpha` cho borders
- [ ] `ctaShadow: 'none'` trong tất cả styles
- [ ] Badge dùng `tokens.badgeBg` (solid)
- [ ] Accent balance: all layouts primary >= 25% (trừ minimal cần review)
- [ ] `bunx tsc --noEmit` pass
- [ ] Preview 6 layouts không có accessibility warning
- [ ] Harmony warning chỉ hiện khi deltaE < 20 (đúng logic)

---

## Estimated Impact

- **Files changed:** 3 files
- **Breaking changes:** Không (chỉ visual tweak)
- **Risk:** LOW (chỉ thay đổi màu sắc, logic không đổi)
- **Test coverage:** Manual test 6 layouts preview + site render

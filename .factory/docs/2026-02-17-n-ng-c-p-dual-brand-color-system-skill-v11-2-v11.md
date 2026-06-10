# Nâng cấp Dual Brand Color System Skill v11.2 → v11.3

## Problem

Skill hiện tại **THIẾU enforcement rõ ràng** cho Single Mode logic:
- Principle 5 chỉ nói "auto-suggest" nhưng không nói rõ màu thực tế phải là primary
- Reference có canonical snippet đúng nhưng không bắt buộc
- Checklist F chỉ đề cập crash, không đề cập logic sai
- → Dẫn đến FAQ implement sai: tạo harmony color trong single mode

## Evidence: FAQ vs Stats

### Stats (✅ ĐÚNG)
```typescript
const resolveStatsSecondary = (primary, secondary, mode) => {
  if (mode === 'single') {
    return primary;  // Monochromatic
  }
  return isNonEmptyColor(secondary) ? secondary : primary;
};
```

### FAQ (❌ SAI)
```typescript
export const resolveFaqSecondary = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {
    if (harmony === 'complementary') {return getComplementary(primary);}
    if (harmony === 'triadic') {return getTriadic(primary)[0];}
    return getAnalogous(primary)[0];  // ← Tạo màu mới thay vì dùng primary
  }
  // ...
};
```

### Kết quả
- Stats single mode: 1 màu (`#00b315` → `#00b315`)
- FAQ single mode: 2 màu (`#00b315` → `#00bb87` analogous)
- Preview info: Stats = "SINGLE", FAQ = "SINGLE • analogous" (misleading)

---

## Implementation Plan

### 1. Nâng cấp Principle 5 (SKILL.md)

**Location:** Section "6 Principles" → Principle 5

**Before:**
```markdown
### 5) Harmony Auto-suggest

- Single mode: auto secondary từ primary
- Default: Analogous (+30°), options: Complementary/Triadic
```

**After:**
```markdown
### 5) Single Mode = Monochromatic (STRICT)

**BẮT BUỘC:**
- Single mode: `resolveSecondary()` PHẢI return `primary` (monochromatic)
- Dual mode: `resolveSecondary()` return `secondary` nếu hợp lệ, fallback harmony color

**Harmony chỉ cho UI suggestion:**
- UI form có thể hiển thị harmony preview (analogous/complementary/triadic)
- Nhưng màu thực tế dùng render PHẢI là primary trong single mode

**Ví dụ đúng (Stats pattern):**
```typescript
const resolveSecondary = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {
    return primary;  // ✅ Monochromatic
  }
  
  // Dual mode
  if (secondary.trim() && isValidHexColor(secondary)) {
    return secondary;
  }
  
  // Dual mode fallback: dùng harmony
  return getHarmonyColor(primary, harmony);
};
```

**Anti-pattern (FAQ bug):**
```typescript
// ❌ CẤM: Tạo harmony color trong single mode
if (mode === 'single') {
  return getAnalogous(primary)[0];  // SAI
}
```
```

---

### 2. Nâng cấp Checklist F - Section F2 mới (checklist.md)

**Location:** Section F - State & Runtime Safety

**Thêm F2 sau F:**
```markdown
## F2. Single Mode Monochromatic (CRITICAL)

- [ ] `resolveSecondary(primary, secondary, 'single', harmony)` PHẢI return `primary`
- [ ] KHÔNG tạo harmony color (analogous/complementary/triadic) trong single mode
- [ ] Preview info trong single mode: "SINGLE" (không hiển thị harmony)
- [ ] Color box label trong single mode: "Primary (mono)" (không "Accent (analogous)")
- [ ] Accent balance trong single mode: P=S (cùng màu)

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
```

---

### 3. Update Reference - Canonical Snippet (reference.md)

**Location:** Section "Canonical Safety Snippets"

**Before:**
```ts
const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
) => (mode === 'single' ? primary : (secondary.trim() ? secondary : primary));
```

**After:**
```ts
// CRITICAL: Single mode MUST return primary (monochromatic)
const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
  harmony?: 'analogous' | 'complementary' | 'triadic',
) => {
  if (mode === 'single') {
    return primary;  // ✅ Monochromatic - harmony ignored
  }
  
  // Dual mode: use secondary if valid
  if (secondary.trim() && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(secondary)) {
    return secondary;
  }
  
  // Dual mode fallback: use harmony (default analogous)
  return getHarmonyColor(primary, harmony ?? 'analogous');
};

// Helper: Get harmony color (chỉ dùng cho dual mode fallback)
const getHarmonyColor = (
  primary: string,
  harmony: 'analogous' | 'complementary' | 'triadic',
) => {
  const color = safeParseOklch(primary, '#3b82f6');
  
  if (harmony === 'complementary') {
    return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
  }
  
  if (harmony === 'triadic') {
    return formatHex(oklch({ ...color, h: (color.h + 120) % 360 }));
  }
  
  // Analogous (default)
  return formatHex(oklch({ ...color, h: (color.h + 30) % 360 }));
};
```

---

### 4. Add Example: FAQ Before/After (examples/faq-single-mode-fix.md - NEW FILE)

**Content:**
```markdown
# Example: FAQ Single Mode Bug Fix

## Problem
FAQ tạo harmony color trong single mode thay vì dùng primary monochromatic.

## Before (Bug)

### Code
\`\`\`typescript
// faq/_lib/colors.ts
export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
  harmony: FaqHarmony = 'analogous',
) => {
  if (mode === 'single') {
    // ❌ Tạo harmony color
    if (harmony === 'complementary') {return getComplementary(primary);}
    if (harmony === 'triadic') {return getTriadic(primary)[0];}
    return getAnalogous(primary)[0];
  }
  // ...
};
\`\`\`

### Visual Result
- Primary: `#00b315` (green)
- Secondary resolved: `#00bb87` (analogous, teal)
- Preview info: "6 câu hỏi • SINGLE • analogous"
- Color label: "Accent (analogous)"
- → **2 màu thay vì 1 màu**

## After (Fixed)

### Code
\`\`\`typescript
// faq/_lib/colors.ts
export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
  harmony: FaqHarmony = 'analogous',
) => {
  if (mode === 'single') {
    return primary;  // ✅ Monochromatic
  }

  // Dual mode: check secondary valid
  const trimmedSecondary = secondary.trim();
  if (trimmedSecondary && isValidHexColor(trimmedSecondary)) {
    return trimmedSecondary;
  }

  // Dual mode fallback: harmony
  return getFaqHarmonyFallback(primary, normalizeHarmony(harmony));
};
\`\`\`

### Preview Updates
\`\`\`typescript
// faq/_components/FaqPreview.tsx

// Info string
info={\`\${items.length} câu hỏi • \${mode.toUpperCase()}\${mode === 'dual' ? \` • \${harmony}\` : ''}\`}

// Color label
<span className="text-slate-500">
  {mode === 'single' ? 'Primary (mono)' : 'Secondary'}
</span>
\`\`\`

### Visual Result
- Primary: `#00b315` (green)
- Secondary resolved: `#00b315` (same)
- Preview info: "6 câu hỏi • SINGLE"
- Color label: "Primary (mono)"
- → **1 màu monochromatic ✅**

## Alignment với Stats, Hero

| Component | Single Mode Logic | Status |
|-----------|-------------------|--------|
| Stats | `return primary` | ✅ OK |
| Hero | `return primary` | ✅ OK |
| FAQ (before) | `return getAnalogous(primary)[0]` | ❌ Bug |
| FAQ (after) | `return primary` | ✅ Fixed |
```

---

### 5. Update Component Color Map - FAQ Status (SKILL.md)

**Location:** Section "Component Color Map" → Nhóm B → FAQ row

**Before:**
```
| FAQ | 40 | 60 | secondary: expanded border/icon | N/A | Needs Review |
```

**After:**
```
| FAQ | 40 | 60 | secondary: expanded border/icon | 2026-02-17 | Fixed v11.3 (single mode) |
```

---

### 6. Update version (SKILL.md frontmatter)

**Before:**
```yaml
version: 11.2.0
```

**After:**
```yaml
version: 11.3.0
```

---

## Files Changed

1. `.factory/skills/dual-brand-color-system/SKILL.md`
   - Principle 5: Thêm STRICT enforcement
   - Component Color Map: Update FAQ status
   - version: 11.2.0 → 11.3.0

2. `.factory/skills/dual-brand-color-system/checklist.md`
   - Thêm section F2 - Single Mode Monochromatic

3. `.factory/skills/dual-brand-color-system/reference.md`
   - Update canonical snippet với harmony parameter
   - Thêm `getHarmonyColor()` helper

4. `.factory/skills/dual-brand-color-system/examples/faq-single-mode-fix.md` (NEW)
   - Example FAQ before/after với visual comparison

---

## Validation

### Checklist sau khi nâng cấp skill

- ✅ Principle 5 bắt buộc single mode = monochromatic
- ✅ Checklist F2 kiểm tra `resolveSecondary()` logic
- ✅ Reference có canonical snippet đầy đủ với harmony
- ✅ Example FAQ làm rõ bug pattern
- ✅ Component Color Map track FAQ status

### Test khi apply skill

1. Review FAQ code → detect `getAnalogous()` trong single mode → fail checklist F2
2. Follow canonical snippet → fix `resolveFaqSecondary()`
3. Update preview info & label → align với Stats
4. Test visual: single mode = 1 màu, dual mode = 2 màu
5. Commit với message: "fix(faq): align single mode with v11.3 monochromatic pattern"

---

## Expected Result

Sau khi nâng cấp skill v11.3:
- **AI sẽ detect** FAQ-style bug trong checklist F2
- **Canonical snippet** rõ ràng hơn với harmony parameter
- **Example** cụ thể giúp developer hiểu ngay bug pattern
- **Future components** sẽ follow đúng pattern từ đầu (không lặp lại lỗi)

---

## Bonus: Fix FAQ ngay sau khi nâng cấp skill

Sau khi approve spec này, tôi sẽ:
1. Apply skill v11.3 để fix FAQ
2. Verify alignment với Stats, Hero
3. Commit skill upgrade + FAQ fix cùng lúc
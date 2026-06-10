# Example: FAQ Single Mode Bug Fix

## Problem
FAQ tạo harmony color trong single mode thay vì dùng primary monochromatic.

## Before (Bug)

### Code
```typescript
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
```

### Visual Result
- Primary: `#00b315` (green)
- Secondary resolved: `#00bb87` (analogous, teal)
- Preview info: "6 câu hỏi • SINGLE • analogous"
- Color label: "Accent (analogous)"
- → **2 màu thay vì 1 màu**

## After (Fixed)

### Code
```typescript
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
```

### Preview Updates
```typescript
// faq/_components/FaqPreview.tsx

// Info string
info={`${items.length} câu hỏi • ${mode.toUpperCase()}${mode === 'dual' ? ` • ${harmony}` : ''}`}

// Color label
<span className="text-slate-500">
  {mode === 'single' ? 'Primary (mono)' : 'Secondary'}
</span>
```

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

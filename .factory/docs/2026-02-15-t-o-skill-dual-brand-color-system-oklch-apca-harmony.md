# Spec: Tạo Skill "dual-brand-color-system"

## Mục Tiêu

Tạo **project skill** để review/refactor hệ thống màu của home components theo chuẩn 2026:
- ✅ Auto-refactor code sang OKLCH color space
- ✅ Apply APCA contrast algorithm (WCAG 3.0)
- ✅ Implement color harmony algorithms (complementary/analogous/triadic)
- ✅ Suggest Theme Engine UI components
- ✅ Review existing components và detect issues

---

## Cấu Trúc Skill

```
.factory/skills/dual-brand-color-system/
├── SKILL.md                    (Main skill - 800 dòng)
├── reference-oklch.md          (OKLCH deep dive)
├── reference-apca.md           (APCA implementation guide)
├── reference-harmony.md        (Color harmony algorithms)
├── examples/
│   ├── hero-before-after.md   (Hero component refactor example)
│   ├── theme-engine-ui.tsx    (UI component template)
│   └── color-utils.ts         (Utility functions template)
└── checklists/
    ├── review-checklist.md    (Review existing components)
    └── create-checklist.md    (Create new components)
```

---

## SKILL.md Frontmatter

```yaml
---
name: dual-brand-color-system
description: Review và refactor home components theo dual brand color system chuẩn 2026 (OKLCH + APCA + Color Harmony). Dùng khi: (1) Tạo home component mới, (2) Review/fix màu components hiện tại, (3) Implement theme engine UI, (4) Optimize color accessibility. Hỗ trợ auto-refactor HSL → OKLCH, WCAG 2.0 → APCA, suggest color harmony (complementary/analogous/triadic).
---
```

---

## SKILL.md Outline (Chi Tiết)

### Section 1: Overview (100 dòng)

```markdown
# Dual Brand Color System

Hệ thống màu chuẩn 2026 cho VietAdmin home components, đảm bảo:
- **Perceptual uniformity**: OKLCH thay HSL
- **Accurate contrast**: APCA (WCAG 3.0) thay WCAG 2.0
- **Smart harmony**: Auto-generate secondary từ primary
- **60-30-10 rule**: Documented distribution

## Khi Nào Dùng Skill Này

✅ **Tạo home component mới**: Gallery, Testimonials, Pricing, v.v.
✅ **Review components hiện tại**: Hero, CTA, Stats, Partners, v.v.
✅ **Fix accessibility issues**: Contrast không đạt WCAG
✅ **Optimize color palettes**: Màu không đẹp hoặc quá giống nhau
✅ **Implement theme engine**: Color picker + preview UI

## Không Dùng Skill Này Khi

❌ **UI components** (Button, Card, Input) → dùng design system tokens
❌ **Admin pages** → follow admin theme, không custom màu
❌ **Icon colors** → dùng currentColor
```

### Section 2: Quick Start (50 dòng)

```markdown
## Quick Start

### Review Existing Component

\`\`\`bash
# User nói: "Review màu Hero component"
1. Read app/admin/home-components/hero/_lib/colors.ts
2. Check nếu dùng HSL → recommend OKLCH
3. Check nếu dùng getTint/getShade → validate opacity values
4. Check contrast với APCA
5. Generate report với issues + fixes
\`\`\`

### Create New Component

\`\`\`bash
# User nói: "Tạo Testimonials component"
1. Copy template từ examples/color-utils.ts
2. Generate palette với OKLCH
3. Apply APCA cho text colors
4. Suggest color harmony nếu dual mode
5. Create Theme Engine UI section
\`\`\`
```

### Section 3: Core Concepts (200 dòng)

```markdown
## Core Concepts

### 1️⃣ OKLCH vs HSL

**Problem với HSL:**
- `hsl(240, 100%, 50%)` (blue) ≠ `hsl(60, 100%, 50%)` (yellow) về brightness
- Gradient có "gray zones"
- Contrast không predictable

**Solution với OKLCH:**
- `oklch(0.6 0.15 250)` (blue) = `oklch(0.6 0.15 60)` (yellow) về lightness
- Smooth gradients
- Predictable contrast

**Browser Support 2026:** Chrome 111+, Firefox 113+, Safari 15.4+ (100% coverage)

**Migration Pattern:**

\`\`\`typescript
// ❌ Old HSL
const tint = getTint(primary, 0.15); // → hsla(...)

// ✅ New OKLCH
import { oklch, formatHex } from 'culori';
const color = oklch(primary);
const tint = formatHex(oklch({ ...color, l: color.l + 0.4 }));
\`\`\`

---

### 2️⃣ APCA vs WCAG 2.0

**Problem với WCAG 2.0:**
- Fixed ratio 4.5:1 không xét context
- Orange button (#ff6600) + white text fail nhưng readable
- False negatives nhiều

**Solution với APCA:**
- Lightness Contrast (Lc) values: 45-90
- Xét font-size, font-weight, polarity
- Accurate hơn 30%

**Implementation:**

\`\`\`typescript
import { apcaContrast } from 'apca-w3';

// ❌ Old WCAG 2.0
const ratio = getWCAG2Ratio(fg, bg);
const pass = ratio >= 4.5;

// ✅ New APCA
const lc = Math.abs(apcaContrast(fg, bg));
const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
const pass = lc >= threshold;
\`\`\`

---

### 3️⃣ Color Harmony Algorithms

**Single Mode:**
- User chọn primary → auto-generate secondary
- Default: Analogous (+30°)
- Options: Complementary (180°), Triadic (120°)

**Dual Mode:**
- User chọn cả primary + secondary
- Validate similarity (ΔE \u003c 10 → warning)

**Implementation:**

\`\`\`typescript
import { oklch, formatHex } from 'culori';

export function getComplementary(hex: string): string {
  const color = oklch(hex);
  return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
}

export function getAnalogous(hex: string): [string, string] {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 }))
  ];
}
\`\`\`

---

### 4️⃣ 60-30-10 Rule

**Distribution:**
- 60% Neutral: White (#fff), Slate-50 (#f8fafc), Slate-900 (#0f172a)
- 30% Primary: Buttons, links, headers, active states
- 10% Secondary: Badges, accents, highlights, decorative

**Palette Structure:**

\`\`\`typescript
interface EnhancedPalette {
  solid: string;              // Base color
  surface: string;            // L+40% for backgrounds
  hover: string;              // L-10% for hover states
  active: string;             // L-15% for active states
  border: string;             // L+30% for borders
  focus: string;              // Same as solid + ring
  disabled: string;           // L+20%, C*0.5
  textOnSolid: string;        // Auto APCA compliant
  textInteractive: string;    // For links/outline buttons
}
\`\`\`
```

### Section 4: Review Workflow (150 dòng)

```markdown
## Review Workflow

### Step 1: Identify Component

\`\`\`bash
# User: "Review Hero component colors"
# User: "Check CTA màu có accessible không"
# User: "Fix Stats component dual brand colors"
\`\`\`

**Actions:**
1. Grep tìm component path: `app/admin/home-components/{component-name}/_lib/colors.ts`
2. Read file content
3. Parse color logic (getTint, getShade, hex values)

---

### Step 2: Run Checklist

**[See checklists/review-checklist.md]**

#### ✅ Color Space Check

- [ ] Dùng OKLCH? (Good) / HSL? (Needs refactor)
- [ ] Có `culori` import? (Yes → OK, No → Add)

#### ✅ Contrast Algorithm Check

- [ ] Dùng APCA? (Good) / WCAG 2.0 Luminance? (Upgrade)
- [ ] Có `apca-w3` import? (Yes → OK, No → Add)

#### ✅ Palette Completeness Check

- [ ] Có đủ variants: solid, surface, hover, border, textOnSolid?
- [ ] Thiếu gì: active, focus, disabled?

#### ✅ Color Harmony Check (Dual Mode)

- [ ] Secondary từ đâu: User chọn? Auto-generate? Hardcoded?
- [ ] Có validate similarity? (ΔE check)

#### ✅ 60-30-10 Distribution Check

- [ ] Primary chiếm ~30% UI?
- [ ] Secondary chiếm ~10% UI?
- [ ] Có comment giải thích?

---

### Step 3: Generate Report

**Format:**

\`\`\`markdown
## Color Review: {Component Name}

### Issues Found: {X}

1. ❌ **[CRITICAL] Using HSL instead of OKLCH**
   - File: \`_lib/colors.ts\`
   - Line: 15-20
   - Current: \`getTint(primary, 0.15)\` → \`hsla(...)\`
   - Fix: Use \`culori.oklch\` conversion

2. ⚠️ **[WARNING] Missing APCA contrast check**
   - File: \`_lib/colors.ts\`
   - Line: 35
   - Current: Hardcoded \`#ffffff\` text
   - Fix: Calculate with \`apcaContrast()\`

3. 💡 **[SUGGESTION] Add missing palette variants**
   - Missing: \`hover\`, \`active\`, \`disabled\`
   - Add: See template in \`examples/color-utils.ts\`

### Refactor Plan

1. Install dependencies: \`npm install culori apca-w3\`
2. Update \`lib/utils/colors.ts\` with OKLCH utilities
3. Refactor \`{component}/_lib/colors.ts\`
4. Test preview với 6 styles
5. Commit: "refactor({component}): migrate to OKLCH + APCA"

### Estimated Time: 1.5 hours
\`\`\`

---

### Step 4: Auto-Refactor (If Approved)

**Pattern Replacements:**

\`\`\`typescript
// Pattern 1: getTint() → OKLCH
// Before
const tint = getTint(primary, 0.15);

// After
import { oklch, formatHex } from 'culori';
const color = oklch(primary);
const tint = formatHex(oklch({ ...color, l: color.l + 0.15 }));

// Pattern 2: getShade() → OKLCH
// Before
const shade = getShade(primary, 10);

// After
const shade = formatHex(oklch({ ...color, l: color.l - 0.1 }));

// Pattern 3: Hardcoded text color → APCA
// Before
textOnSolid: '#ffffff'

// After
import { apcaContrast } from 'apca-w3';
textOnSolid: getAPCATextColor(solid, 16, 400)
\`\`\`
```

### Section 5: Create Workflow (150 dòng)

```markdown
## Create Workflow

### Step 1: Setup Files

\`\`\`bash
# User: "Tạo Testimonials component với dual brand colors"
\`\`\`

**Actions:**
1. Create \`app/admin/home-components/testimonials/_lib/colors.ts\`
2. Copy template từ \`examples/color-utils.ts\`
3. Customize cho Testimonials use case

---

### Step 2: Generate Color Utilities

**[Copy từ examples/color-utils.ts]**

\`\`\`typescript
import { oklch, formatHex, differenceEuclidean } from 'culori';
import { apcaContrast } from 'apca-w3';

export interface TestimonialsColorScheme {
  // Primary (30%)
  primarySolid: string;
  primarySurface: string;
  primaryHover: string;
  primaryBorder: string;
  primaryTextOnSolid: string;
  
  // Secondary (10%)
  secondarySolid: string;
  secondarySurface: string;
  secondaryTextOnSolid: string;
  
  // Helpers
  cardGradient: string;
  quoteAccent: string;
}

export function getTestimonialsColors(
  primary: string,
  secondary: string,
  useDualBrand: boolean
): TestimonialsColorScheme {
  const primaryColor = oklch(primary);
  const secondaryColor = oklch(useDualBrand ? secondary : primary);
  
  // Generate primary palette
  const primarySolid = primary;
  const primarySurface = formatHex(oklch({ ...primaryColor, l: primaryColor.l + 0.4 }));
  const primaryHover = formatHex(oklch({ ...primaryColor, l: primaryColor.l - 0.1 }));
  const primaryBorder = formatHex(oklch({ ...primaryColor, l: primaryColor.l + 0.3 }));
  
  // APCA text color
  const primaryTextOnSolid = getAPCATextColor(primarySolid, 16, 500);
  
  // Generate secondary palette
  const secondarySolid = useDualBrand ? secondary : getAnalogous(primary)[0];
  const secondarySurface = formatHex(oklch({ ...secondaryColor, l: secondaryColor.l + 0.4 }));
  const secondaryTextOnSolid = getAPCATextColor(secondarySolid, 16, 500);
  
  return {
    primarySolid,
    primarySurface,
    primaryHover,
    primaryBorder,
    primaryTextOnSolid,
    
    secondarySolid,
    secondarySurface,
    secondaryTextOnSolid,
    
    cardGradient: \`linear-gradient(in oklch 135deg, \${primarySurface}, \${secondarySurface})\`,
    quoteAccent: secondarySolid,
  };
}

// Helper: APCA text color
function getAPCATextColor(bg: string, fontSize: number, fontWeight: number): string {
  const blackLc = Math.abs(apcaContrast('#000000', bg));
  const whiteLc = Math.abs(apcaContrast('#ffffff', bg));
  const threshold = (fontSize >= 18 || fontWeight >= 700) ? 45 : 60;
  
  if (whiteLc >= threshold) return '#ffffff';
  if (blackLc >= threshold) return '#0f172a';
  return whiteLc > blackLc ? '#ffffff' : '#0f172a';
}

// Helper: Analogous harmony
function getAnalogous(hex: string): [string, string] {
  const color = oklch(hex);
  return [
    formatHex(oklch({ ...color, h: (color.h + 30) % 360 })),
    formatHex(oklch({ ...color, h: (color.h - 30 + 360) % 360 }))
  ];
}
\`\`\`

---

### Step 3: Implement Preview

**[Reference examples/theme-engine-ui.tsx]**

\`\`\`tsx
import { ColorThemeControls } from '../../_shared/components/ColorThemeControls';

export function TestimonialsPreview({ ... }) {
  const brandColors = getBrandColors({ primary, secondary, mode });
  const colors = getTestimonialsColors(
    brandColors.primary, 
    brandColors.secondary, 
    brandColors.useDualBrand
  );
  
  return (
    \u003c\u003e
      {/* Theme Engine UI */}
      \u003cColorThemeControls 
        primary={primary}
        secondary={secondary}
        mode={mode}
        onPrimaryChange={setPrimary}
        onSecondaryChange={setSecondary}
        onModeChange={setMode}
      /\u003e
      
      {/* Preview */}
      \u003cdiv style={{ backgroundColor: colors.primarySurface }}\u003e
        \u003cblockquote style={{ color: colors.primarySolid }}\u003e
          "Great product!"
        \u003c/blockquote\u003e
        \u003cspan style={{ color: colors.secondarySolid }}\u003e
          — John Doe
        \u003c/span\u003e
      \u003c/div\u003e
    \u003c/\u003e
  );
}
\`\`\`

---

### Step 4: Validate

**[See checklists/create-checklist.md]**

- [ ] OKLCH conversion works?
- [ ] APCA text colors pass threshold?
- [ ] Color harmony looks good (single mode)?
- [ ] Similarity check works (dual mode)?
- [ ] Preview renders correctly?
- [ ] 60-30-10 distribution correct?
```

### Section 6: Theme Engine UI (100 dòng)

```markdown
## Theme Engine UI

### Component: ColorThemeControls

**Location:** \`app/admin/home-components/_shared/components/ColorThemeControls.tsx\`

**Features:**
1. ✅ Single/Dual mode toggle
2. ✅ Primary color picker + palette preview
3. ✅ Secondary color picker/harmony selector
4. ✅ Similarity warning (ΔE \u003c 10)
5. ✅ APCA compliance badges
6. ✅ 60-30-10 distribution info

**[See examples/theme-engine-ui.tsx for full code]**

**Usage:**

\`\`\`tsx
import { ColorThemeControls } from '../../_shared/components/ColorThemeControls';

\u003cColorThemeControls
  primary={primary}
  secondary={secondary}
  mode={mode}
  onPrimaryChange={setPrimary}
  onSecondaryChange={setSecondary}
  onModeChange={setMode}
/\u003e
\`\`\`

---

### Palette Preview Strip

\`\`\`tsx
\u003cdiv className="flex h-12 rounded-xl overflow-hidden"\u003e
  \u003cdiv 
    className="flex-1 flex items-center justify-center text-xs font-medium"
    style={{ backgroundColor: palette.surface, color: palette.textInteractive }}
  \u003e
    Surface
  \u003c/div\u003e
  \u003cdiv 
    className="flex-1"
    style={{ backgroundColor: palette.solid, color: palette.textOnSolid }}
  \u003e
    Solid
  \u003c/div\u003e
  \u003cdiv 
    className="flex-1"
    style={{ backgroundColor: palette.hover, color: palette.textOnSolid }}
  \u003e
    Hover
  \u003c/div\u003e
\u003c/div\u003e
\`\`\`
```

### Section 7: Best Practices (50 dòng)

```markdown
## Best Practices

### ✅ DO

1. **Always use OKLCH** cho color calculations
2. **Always use APCA** cho text contrast validation
3. **Always validate similarity** khi dual mode (ΔE \u003c 10 → warning)
4. **Always comment** 60-30-10 distribution
5. **Always export** CSS custom properties cho reusability
6. **Always test** với 6 device widths (mobile/tablet/desktop)

### ❌ DON'T

1. **Don't hardcode** text colors (#fff, #000) → use APCA calculation
2. **Don't use HSL** cho tint/shade → use OKLCH
3. **Don't skip** harmony algorithms ở single mode
4. **Don't ignore** similarity warnings
5. **Don't forget** interactive states (hover, active, focus, disabled)

### 🎯 Performance Tips

1. **Debounce** color picker onChange (300ms)
2. **Memoize** palette calculations với useMemo
3. **Cache** APCA results (same fg+bg = same Lc)
```

### Section 8: Troubleshooting (50 dòng)

```markdown
## Troubleshooting

### Issue: "culori not found"

\`\`\`bash
npm install culori
# or
bun add culori
\`\`\`

### Issue: "APCA contrast negative values"

APCA returns negative for dark-on-light, positive for light-on-dark.
→ Always use \`Math.abs(apcaContrast(...))\`

### Issue: "OKLCH colors look wrong"

Check browser support: Chrome 111+, Firefox 113+, Safari 15.4+
→ Add fallback:

\`\`\`css
background: #3b82f6; /* fallback */
background: oklch(0.6 0.15 250);
\`\`\`

### Issue: "Gradient có gray zones dù dùng OKLCH"

Ensure CSS gradient interpolation:

\`\`\`css
background: linear-gradient(in oklch to right, ...);
\`\`\`

### Issue: "Similarity warning sai"

ΔE calculation cần oklch input:

\`\`\`typescript
import { differenceEuclidean } from 'culori';
const diff = differenceEuclidean('oklch')(hex1, hex2);
\`\`\`
```

---

## Reference Files

### reference-oklch.md (300 dòng)

**Outline:**
1. What is OKLCH? (Oklab → cylindrical coordinates)
2. Why perceptual uniformity matters
3. L (Lightness): 0-1 scale, linear perception
4. C (Chroma): 0-0.4 typical, P3 gamut support
5. H (Hue): 0-360 degrees
6. Conversion formulas (Hex ↔ OKLCH)
7. Browser fallbacks
8. Wide-gamut P3 colors
9. CSS color-mix() in oklch
10. Comparison charts (HSL vs OKLCH)

### reference-apca.md (250 dòng)

**Outline:**
1. What is APCA? (S-Luv model)
2. Lightness Contrast (Lc) values explained
3. Font-size/weight thresholds
4. Polarity (light-on-dark vs dark-on-light)
5. APCA vs WCAG 2.0 comparison table
6. Implementation guide (apca-w3 package)
7. Edge cases (very light/dark backgrounds)
8. Future WCAG 3.0 integration

### reference-harmony.md (200 dòng)

**Outline:**
1. Color wheel fundamentals
2. Complementary (180°) - High contrast
3. Analogous (±30°) - Harmonious
4. Triadic (120°) - Balanced
5. Tetradic (90°) - Rich
6. Split-complementary
7. When to use each harmony
8. Delta E similarity metric (CIEDE2000)
9. Auto-select best harmony for brand

---

## Examples

### examples/hero-before-after.md (150 dòng)

**Before (HSL):**
\`\`\`typescript
const tint = getTint(primary, 0.15); // hsla(220, 90%, 50%, 0.15)
\`\`\`

**After (OKLCH):**
\`\`\`typescript
const color = oklch(primary);
const tint = formatHex(oklch({ ...color, l: color.l + 0.15 }));
\`\`\`

**Before (WCAG 2.0):**
\`\`\`typescript
textOnSolid: getContrastColor(solid) // threshold 0.5
\`\`\`

**After (APCA):**
\`\`\`typescript
textOnSolid: getAPCATextColor(solid, 16, 400) // Lc threshold 60
\`\`\`

### examples/theme-engine-ui.tsx (400 dòng)

Full ColorThemeControls component code

### examples/color-utils.ts (300 dòng)

Complete utility functions với TypeScript types

---

## Checklists

### checklists/review-checklist.md (100 dòng)

\`\`\`markdown
# Review Checklist

## 1. Color Space
- [ ] Using OKLCH? (culori import)
- [ ] No HSL conversion? (getTint/getShade removed)

## 2. Contrast
- [ ] Using APCA? (apca-w3 import)
- [ ] No hardcoded #fff/#000?
- [ ] Font-size/weight considered?

## 3. Palette
- [ ] Has solid, surface, hover, border, textOnSolid?
- [ ] Has active, focus, disabled?
- [ ] Semantic naming?

## 4. Harmony (Dual Mode)
- [ ] Similarity check (ΔE)?
- [ ] Warning if too similar?

## 5. Distribution
- [ ] 60% neutral?
- [ ] 30% primary?
- [ ] 10% secondary?
- [ ] Commented?

## 6. UI
- [ ] Theme Engine UI integrated?
- [ ] Palette preview strip?
- [ ] Device switcher?
\`\`\`

### checklists/create-checklist.md (80 dòng)

Similar structure for new components

---

## Dependencies

\`\`\`json
{
  "dependencies": {
    "culori": "^4.0.1",
    "apca-w3": "^0.1.9"
  }
}
\`\`\`

---

## Testing

### Test Cases

1. **OKLCH Conversion**
   - Input: \`#3b82f6\` (blue)
   - Output: \`oklch(0.598 0.149 262)\`
   - Verify: \`formatHex()\` → \`#3b82f6\`

2. **APCA Contrast**
   - Fg: \`#ffffff\`, Bg: \`#3b82f6\`, Font: 16px/400
   - Expected Lc: ~68 (pass threshold 60)

3. **Color Harmony**
   - Input: \`#3b82f6\` (blue)
   - Complementary: \`#f6823b\` (orange, 180°)
   - Analogous: \`#7c3bf6\` (purple, +30°)

4. **Similarity Warning**
   - Primary: \`#3b82f6\`
   - Secondary: \`#3b85f6\`
   - ΔE: ~0.02 → Warning

---

## Success Criteria

✅ **Review**: Detect 90% of color issues trong existing components
✅ **Refactor**: Auto-refactor HSL → OKLCH với 95% accuracy
✅ **Create**: Generate compliant color system trong \u003c 5 phút
✅ **UI**: Theme Engine UI tích hợp cho tất cả components
✅ **Accessibility**: 100% components pass APCA thresholds

---

## Timeline

- **Write SKILL.md**: 2 giờ
- **Write reference files**: 2 giờ
- **Create examples**: 1.5 giờ
- **Create checklists**: 0.5 giờ
- **Test với Hero component**: 1 giờ

**Total: ~7 giờ**
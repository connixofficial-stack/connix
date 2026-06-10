# Spec: Nâng cấp Dual Brand Color System Skill v3.0

## Mục tiêu
Biến skill từ "hướng dẫn lý thuyết" thành "actionable playbook" với workflows cụ thể, validation checklist, code examples đầy đủ context, và anti-patterns gallery.

## Changes Overview

### 1. **Actionable Workflow Section** (NEW)
Thay thế workflow hiện tại bằng step-by-step playbook:

**Step 1: Brand Color Selection**
```typescript
// ✅ Validation Checklist
const validatePrimaryColor = (hex: string) => {
  const checks = {
    contrastVsWhite: getContrast(hex, '#ffffff') >= 4.5,
    contrastVsBlack: getContrast(hex, '#000000') >= 4.5,
    notTooSaturated: getSaturation(hex) <= 80,
  };
  return Object.values(checks).every(Boolean);
};

// Example với full context
const brandColors = {
  primary: '#2563eb', // Blue 600 - passes all checks
  secondary: '#8b5cf6', // Violet 500 - analogous, 60° apart
};
```

**Decision Tree:**
```
Start → Industry? 
  ├─ Tech/SaaS → Blue/Indigo (trust, reliability)
  ├─ Creative → Orange/Purple (energy, creativity)  
  ├─ Finance → Blue/Green (stability, growth)
  └─ Health → Green/Teal (health, calm)
```

### 2. **APCA/WCAG 3.0 Practical Guide** (ENHANCED)

**Quick Reference Table:**
| Font Size | Font Weight | Min Lc (APCA) | WCAG 2.2 Equiv |
|-----------|-------------|---------------|----------------|
| 12-14px   | 400-500     | Lc 90         | ~7:1           |
| 14-16px   | 400-500     | Lc 75         | ~4.5:1         |
| 16-18px   | 400-500     | Lc 60         | ~3:1           |
| 18+px     | 400-500     | Lc 60         | ~3:1           |
| Any size  | 700+        | Lc 60         | ~3:1           |

**JavaScript Calculator:**
```typescript
// APCA Lc calculator (simplified)
function calculateAPCA(fgColor: string, bgColor: string): number {
  const fgY = sRGBtoY(hexToRgb(fgColor));
  const bgY = sRGBtoY(hexToRgb(bgColor));
  const Lc = (bgY > fgY) 
    ? (bgY ** 0.56 - fgY ** 0.57) * 1.14 
    : (bgY ** 0.65 - fgY ** 0.62) * 1.14;
  return Math.abs(Lc * 100);
}

// Usage
const score = calculateAPCA('#2563eb', '#ffffff'); // ~75 Lc
const pass = score >= 75; // ✅ for 14-16px normal text
```

### 3. **3-Tier Token Architecture Deep Dive** (ENHANCED)

**Naming Conventions:**
```typescript
// Tier 1: Primitive (raw values)
const primitive = {
  'primitive-color-blue-50': '#eff6ff',
  'primitive-color-blue-500': '#3b82f6',
  'primitive-spacing-2': '0.5rem',
};

// Tier 2: Semantic (purpose-based)
const semantic = {
  'semantic-color-action-primary': primitive['primitive-color-blue-500'],
  'semantic-color-text-heading': primitive['primitive-color-slate-900'],
  'semantic-spacing-component-gap': primitive['primitive-spacing-2'],
};

// Tier 3: Component (component-specific)
const component = {
  'component-button-bg': semantic['semantic-color-action-primary'],
  'component-button-padding': semantic['semantic-spacing-component-gap'],
};
```

**Tailwind Integration:**
```typescript
// tailwind.config.ts
import { semantic } from './tokens';

export default {
  theme: {
    extend: {
      colors: {
        action: {
          primary: semantic['semantic-color-action-primary'],
          secondary: semantic['semantic-color-action-secondary'],
        },
      },
    },
  },
};
```

**Migration Checklist:**
- [ ] Audit codebase: tìm hard-coded colors (`#[0-9a-f]{6}`)
- [ ] Tạo primitive tokens từ unique colors
- [ ] Map semantic meanings (action, text, border, surface)
- [ ] Replace hard-coded → semantic tokens
- [ ] Setup ESLint rule để prevent future hard-coding

### 4. **Visual Weight Formula** (NEW)

```typescript
// Formula: Visual Weight = Area × Saturation × Brightness
function calculateVisualWeight(
  areaPercent: number,
  saturation: number, // 0-100
  brightness: number  // 0-100
): number {
  return (areaPercent / 100) * (saturation / 100) * (brightness / 100);
}

// Example: validate 60-30-10 rule
const weights = {
  neutral: calculateVisualWeight(60, 0, 95),   // 0.57 (low)
  primary: calculateVisualWeight(30, 70, 60),  // 0.126 (medium)
  accent: calculateVisualWeight(10, 90, 70),   // 0.063 (high punch)
};

// ✅ Good: accent có visual weight cao dù diện tích nhỏ
```

### 5. **Conflict Resolution Patterns** (NEW)

**Pattern 1: Complementary Colors Clash**
```tsx
// ❌ Problem: Blue + Orange clash
<div className="bg-blue-500">
  <button className="bg-orange-500">CTA</button>
</div>

// ✅ Solution 1: Neutral buffer
<div className="bg-blue-50">
  <button className="bg-orange-500">CTA</button>
</div>

// ✅ Solution 2: Tint/shade adjustment
<div className="bg-blue-500">
  <button className="bg-orange-600 border-2 border-white">CTA</button>
</div>
```

**Decision Matrix:**
| Context | Primary Use | Secondary Use |
|---------|-------------|---------------|
| Headings | 70% primary | 30% secondary |
| CTAs | 30% primary | 70% secondary (focal) |
| Badges | 50/50 split | Contextual |
| Backgrounds | Tints only | Avoid saturated |

### 6. **Anti-patterns Gallery** (NEW)

```tsx
// ❌ Anti-pattern 1: Brand color cho 60% UI
<section className="bg-primary-600 min-h-screen">
  {/* Overwhelming, eye strain */}
</section>

// ✅ Fix:
<section className="bg-slate-50">
  <h1 className="text-primary-600">Heading</h1>
</section>

// ❌ Anti-pattern 2: Hard-coded colors
<button style={{ backgroundColor: '#3b82f6' }}>Click</button>

// ✅ Fix:
<button className="bg-action-primary">Click</button>

// ❌ Anti-pattern 3: Không có tonal palette
const colors = { primary: '#3b82f6' }; // Chỉ 1 shade

// ✅ Fix:
const colors = {
  primary: {
    50: '#eff6ff', 100: '#dbeafe', /* ... */, 900: '#1e3a8a'
  }
};
```

### 7. **Tools Integration Pipeline** (NEW)

**Figma → Code Workflow:**
```bash
# 1. Export từ Figma (Tokens Studio plugin)
figma-tokens export --format json

# 2. Transform sang CSS variables
tokens-transformer tokens.json --output styles/tokens.css

# 3. Generate TypeScript types
tokens-types tokens.json --output types/tokens.ts

# 4. Validate contrast
npm run validate:contrast
```

**GitHub Actions Example:**
```yaml
name: Validate Design Tokens
on: [pull_request]
jobs:
  contrast-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run validate:contrast
      - run: npm run lint:no-hardcoded-colors
```

### 8. **Testing Checklist Template** (NEW)

```markdown
## Pre-launch Checklist

### Contrast Validation
- [ ] All text vs backgrounds >= 4.5:1 (WCAG 2.2 AA)
- [ ] Large text >= 3:1
- [ ] APCA: body text >= Lc 75, headings >= Lc 60
- [ ] UI components >= 3:1

### Color Blindness
- [ ] Tested với Deuteranopia simulator
- [ ] Tested với Protanopia simulator  
- [ ] Tested với Tritanopia simulator
- [ ] Không rely solely on color (có icons/text)

### Visual Weight
- [ ] Neutral ~60%, primary ~30%, accent ~10%
- [ ] Visual weight formula validated
- [ ] Không có overwhelming brand color

### Token Architecture
- [ ] Không có hard-coded colors trong components
- [ ] 3-tier structure implemented (primitive/semantic/component)
- [ ] Tailwind config references semantic tokens
- [ ] Dark mode variants defined
```

## Implementation Steps

1. **Thêm section "Actionable Workflow"** sau "Overview"
2. **Enhance "APCA/WCAG 3.0"** với table + calculator
3. **Expand "Semantic Tokens"** với naming conventions + migration
4. **Thêm "Visual Weight Formula"** sau "60-30-10 Rule"
5. **Thêm "Conflict Resolution"** sau "Color Harmony"
6. **Thêm "Anti-patterns Gallery"** trước "Common Mistakes"
7. **Thêm "Tools Integration"** sau "Tools Reference"
8. **Thêm "Testing Checklist"** ở cuối skill

## Expected Outcome

Skill v3.0 sẽ:
- ✅ Có copy-paste code examples cho mọi concept
- ✅ Có validation checklist cho từng bước
- ✅ Có công cụ/scripts để automate validation
- ✅ Có anti-patterns với visual examples
- ✅ Có migration path rõ ràng từ cũ sang mới
- ✅ Thực chiến hơn 3x so với v2.0
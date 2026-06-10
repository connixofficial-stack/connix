# Spec: Nâng cấp Skill Dual Brand Color System v2.0

## Tổng quan

Nâng cấp skill từ v1.0 (theoretical) sang v2.0 (practical + actionable) với:
- ✅ Best practices 2026: adaptive colors, semantic tokens, APCA/WCAG 3.0
- ✅ Tools cụ thể với URLs và hướng dẫn sử dụng
- ✅ Code examples thực tế (Tailwind, CSS variables, JSON)
- ✅ Workflow step-by-step chi tiết hơn
- ✅ Real-world brand examples
- ✅ Checklists validation rõ ràng

---

## Các thay đổi chính

### 1. **Thêm section "2026 Trends"** (TRƯỚC Core Principles)

Nội dung:
- **Adaptive Color Systems**: context-aware palettes (outdoor/indoor, light/dark behavior)
  - Example: Spotify/Notion flexible brand identity
  - Implementation: CSS `prefers-color-scheme`, `prefers-contrast`
- **Elevated Neutrals**: soft whites (#FAFAFA) thay vì harsh white (#FFFFFF)
- **Semantic Token Architecture**: 3-tier system
  - Primitive tokens: raw values (`blue-500: #3b82f6`)
  - Semantic tokens: role-based (`color-action-primary: {blue-500}`)
  - Component tokens: component-specific (`button-bg: {color-action-primary}`)

### 2. **Refactor "60-30-10 Rule"** - thêm visual weight examples

Thêm:
- **Visual weight vs surface area**: 10% accent có thể là 30% visual weight nếu high contrast
- **Real-world examples**:
  ```tsx
  // ❌ Sai: brand color chiếm 60%
  <div className="bg-blue-600 min-h-screen"> // overwhelming
  
  // ✅ Đúng: neutral 60%, primary 30%, accent 10%
  <div className="bg-slate-50 min-h-screen"> // comfortable
    <h1 className="text-blue-600">Title</h1> // primary 30%
    <button className="bg-violet-500">CTA</button> // accent 10%
  </div>
  ```
- **Brand examples**:
  - Facebook: white 60% + blue 30% + blue-dark 10%
  - Coca-Cola: white 60% + red 30% + black 10%

### 3. **Thêm "Semantic Tokens Implementation"** (sau Material Design 3)

Nội dung:
- **3-tier architecture** với code examples:
  ```typescript
  // Tier 1: Primitive tokens
  const primitive = {
    blue: { 500: '#3b82f6', 600: '#2563eb' },
    violet: { 500: '#8b5cf6', 600: '#7c3aed' },
  };
  
  // Tier 2: Semantic tokens
  const semantic = {
    color: {
      action: { primary: primitive.blue[600] },
      text: { heading: primitive.blue[600] },
    },
  };
  
  // Tier 3: Component tokens
  const component = {
    button: { bg: semantic.color.action.primary },
  };
  ```
- **Naming conventions**:
  - ✅ `text-primary`, `action-primary`, `border-subtle`
  - ❌ `blue-500`, `color-1`, `main-color`

### 4. **Refactor "WCAG Accessibility"** - thêm APCA (WCAG 3.0)

Thêm:
- **WCAG 2.2 vs 3.0 comparison**:
  | Standard | Method | Pros | Cons |
  |----------|--------|------|------|
  | WCAG 2.2 | Contrast ratio (4.5:1, 7:1) | Widely adopted | Không perceptually uniform |
  | WCAG 3.0 | APCA (Lc 60, Lc 75) | Chính xác hơn | Still evolving |

- **Tools mới**:
  - APCA Contrast Calculator: https://www.myndex.com/APCA/
  - Accessibility.build: https://accessibility.build/tools/contrast-checker
  - OKLCH Palette: https://oklch.com

### 5. **Refactor "Implementation Workflow"** - chi tiết hơn với tools

**Step 1: Chọn Primary Color**
- Tool: Adobe Color (https://color.adobe.com) - extract từ logo
- Checklist:
  - [ ] Contrast vs white >= 4.5:1
  - [ ] Reflects brand identity
  - [ ] Competitor analysis

**Step 2: Generate Secondary Color**
- Tool: Realtime Colors (https://realtimecolors.com) - preview live UI
- Decision tree (giữ nguyên)

**Step 3: Create Tonal Palettes**
- Tool: Material Theme Builder (https://m3.material.io/theme-builder)
- Export: Tailwind config, CSS variables, JSON

**Step 4: Generate Semantic Tokens**
- Tool: Figma Design Token Generator plugin
- Architecture: 3-tier (primitive → semantic → component)

**Step 5: Apply 60-30-10 Rule**
- Code examples (Tailwind):
  ```tsx
  // Hero section
  <section className="bg-white"> // 60% neutral
    <h1 className="text-primary-600">Headline</h1> // 30%
    <button className="bg-secondary-500">CTA</button> // 10%
  </section>
  ```

**Step 6: Validate Accessibility**
- Tools:
  - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
  - Chrome DevTools > Lighthouse
  - Color blindness: Chrome DevTools > Rendering > Emulate vision deficiencies

### 6. **Thêm "Real-World Examples"** section

Nội dung:
- **Facebook**: Blue primary (#1877F2) + white neutral → Professional, trust
- **Coca-Cola**: Red primary (#F40009) + white neutral → Energy, excitement
- **Spotify**: Green primary (#1DB954) + black neutral → Modern, music
- **Stripe**: Purple primary (#635BFF) + slate neutral → Tech, reliable

Mỗi example có:
- Color breakdown (60-30-10)
- Harmony scheme used
- WCAG compliance
- Code snippet

### 7. **Thêm "Common Mistakes & Solutions"** section

| Mistake | Problem | Solution |
|---------|---------|----------|
| Using brand color 60% | Overwhelming, eye strain | Use neutral 60%, brand 30% |
| Complementary colors | Vibrant clashing | Use analogous (30-60°) |
| Hard-coding hex values | Không scalable | Use semantic tokens |
| No contrast validation | Accessibility fail | Use WCAG checkers early |
| Tonal palette = 3 shades | Limited flexibility | Generate 10 shades (50-950) |

### 8. **Thêm "Tools Reference"** section cuối skill

Grouped by purpose:

**Color Palette Generators**:
- Realtime Colors: https://realtimecolors.com (live UI preview)
- Coolors: https://coolors.co (quick palettes)
- Adobe Color: https://color.adobe.com (harmony schemes)

**Semantic Token Tools**:
- Material Theme Builder: https://m3.material.io/theme-builder
- Figma Design Token Generator: (plugin link)
- UX Palette Generator: https://palettegenerator.com

**Accessibility Validators**:
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- APCA Calculator: https://www.myndex.com/APCA/
- Accessibility.build: https://accessibility.build/tools/contrast-checker
- Color Palette Checker: https://color-contrast-checker.deque.com/

**Color Space Tools**:
- OKLCH Picker: https://oklch.com
- AccessibleColor.design: https://accessiblecolor.design/

### 9. **Thêm "Quick Start Template"** đầu skill

Cho user cần action nhanh:

```typescript
// 1. Install Tailwind (nếu chưa có)
// 2. Paste config này vào tailwind.config.ts

const config = {
  theme: {
    extend: {
      colors: {
        // Primary brand (analogous scheme: Blue → Violet)
        primary: {
          50: '#eff6ff',
          // ... (full palette)
          600: '#2563eb', // Main brand color
        },
        secondary: {
          50: '#f5f3ff',
          // ... 
          600: '#7c3aed', // Accent
        },
        // Semantic tokens
        action: {
          primary: '#2563eb',
          secondary: '#7c3aed',
        },
        text: {
          primary: '#0f172a',
          secondary: '#64748b',
        },
      },
    },
  },
};

// 3. Áp dụng 60-30-10:
// bg-white (60%) + text-primary-600 (30%) + bg-secondary-500 (10%)
```

---

## Cấu trúc skill mới (outline)

```markdown
# Dual Brand Color System Best Practices v2.0

## Quick Start Template (NEW)
- Tailwind config ready-to-use
- 60-30-10 cheat sheet

## Overview (giữ nguyên)

## When to Use (giữ nguyên)

## 2026 Trends & Best Practices (NEW)
- Adaptive color systems
- Elevated neutrals
- Semantic token architecture

## Core Principles
### 1) 60-30-10 Rule (REFACTOR)
- Visual weight vs surface area
- Real-world examples (Facebook, Coca-Cola)
- Code examples (Tailwind)

### 2) Color Harmony Schemes (giữ nguyên)

### 3) Material Design 3 (giữ nguyên)

### 4) Semantic Tokens Implementation (NEW)
- 3-tier architecture
- Naming conventions
- Code examples

### 5) WCAG Accessibility (REFACTOR)
- WCAG 2.2 vs 3.0
- APCA introduction
- Tools mới

## Implementation Workflow (REFACTOR)
- Step-by-step với tools cụ thể
- Code examples mỗi step
- Validation checklist

## Real-World Examples (NEW)
- Facebook, Coca-Cola, Spotify, Stripe
- Color breakdown + code

## Common Mistakes & Solutions (NEW)
- Table format

## Tools Reference (NEW)
- Grouped by purpose
- With URLs

## Advanced Topics (giữ nguyên + refactor)
- Dark mode
- OKLCH vs HSL (thêm examples)
- Multi-brand systems
```

---

## Tổng kết

**Changes summary**:
- ✅ 4 sections mới: 2026 Trends, Semantic Tokens, Real-World Examples, Common Mistakes
- ✅ Refactor 3 sections: 60-30-10 Rule, WCAG, Implementation Workflow
- ✅ Thêm 15+ code examples (Tailwind, TypeScript, CSS)
- ✅ Thêm 12+ tools với URLs
- ✅ Thêm Quick Start Template
- ✅ Skill tăng từ ~400 lines → ~700 lines (practical content)

**Impact**:
- User có thể action ngay với Quick Start Template
- Mỗi step có tool + code example cụ thể
- Best practices 2026 (adaptive, semantic tokens, APCA)
- Real-world validation (Facebook, Stripe patterns)

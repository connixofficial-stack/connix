---
name: experience-preview-extractor
description: Trích "xương" (layout/structure/state chính) từ code UI thật để tạo preview giống giao diện tương ứng. Dùng khi cần đồng bộ UI preview với UI thật, hoặc khi user nói "preview phải giống giao diện thực", "tạo preview từ code thật", "trích xương giao diện".
allowed-tools: Read, Grep, Glob, Execute, Edit
---

# Experience Preview Extractor

Skill này áp dụng **Visual Regression Best Practices 2026** để trích xuất UI skeleton từ code thật và tạo preview component có **structural similarity** cao với UI production.

## Core Principles (từ Web Search Research)

### 1. Structural Similarity Principle
> "Skeleton screens should closely resemble the final content layout" - Frontend Best Practices 2026

Preview phải match:
- **DOM hierarchy** (thứ tự các khối)
- **Visual spacing** (padding, gap, margin)
- **Layout patterns** (flex, grid, absolute positioning)
- **Responsive breakpoints** (sm:, md:, lg:, xl:)
- **Component states** (empty, loading, error)

### 2. Component Isolation Principle
> "Test components in isolation to maintain UI consistency" - Vitest Component Testing Guide

Preview component phải:
- Tách biệt khỏi business logic
- Không phụ thuộc API/database
- Render được standalone
- Mock data đơn giản, predictable
- Không có side effects

### 3. Visual Regression Coverage
> "Capture baseline screenshots for pixel-perfect comparison" - Chromatic Best Practices

Preview phải cover:
- **All breakpoints**: desktop (1920px), tablet (768px), mobile (375px)
- **All layout variants**: fullwidth, sidebar, magazine, etc.
- **Interactive states**: default, hover, active, disabled
- **Edge cases**: empty state, long text, missing images

## Quy trình chuẩn (8 bước)

### Bước 1: Discovery & Mapping
```bash
# Tìm UI thật
Glob: app/**/[feature]/page.tsx
Glob: components/site/[feature]/**/*.tsx

# Đọc toàn bộ file liên quan
Read: page.tsx (container logic)
Read: layouts/*.tsx (layout components)
Read: Filter.tsx (filter bar)
```

**Output**: Component dependency graph

### Bước 2: Extract DOM Structure
Phân tích JSX và ghi lại:
```
1. Container: py-6 md:py-10 px-4
   └─ max-w-7xl mx-auto
      ├─ Header: text-center mb-3
      │  └─ h1: text-2xl md:text-3xl font-bold
      ├─ Filter Bar: mb-5 (conditional: showSearch || showCategories)
      │  ├─ Search: flex-1 max-w-xs (desktop)
      │  ├─ Category: hidden lg:block (dropdown)
      │  ├─ Spacer: flex-1 (desktop only)
      │  ├─ Sort: hidden lg:block (right aligned)
      │  └─ Mobile Toggle: lg:hidden (mobile/tablet)
      ├─ Applied Filters Row: flex justify-between
      └─ Grid: grid sm:grid-cols-2 lg:grid-cols-3 gap-3
```

**CRITICAL**: Copy exact:
- Class names (including responsive variants)
- HTML structure order
- Conditional rendering logic

### Bước 3: Extract Responsive Rules
Map breakpoints theo device preview:

| Class | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `hidden lg:block` | ✅ Show | ❌ Hide | ❌ Hide |
| `lg:hidden` | ❌ Hide | ✅ Show | ✅ Show |
| `sm:grid-cols-2` | ✅ 2 cols | ✅ 2 cols | ❌ 1 col |
| `lg:grid-cols-3` | ✅ 3 cols | ❌ 2 cols | ❌ 1 col |
| `max-w-xs` (search) | ✅ Limited | ❌ Flex-1 | ❌ Flex-1 |

**Rule**: Device preview KHÔNG dùng `@media` CSS. Dùng `device` prop để render conditional JSX:

```tsx
// ❌ WRONG: Tailwind breakpoints sẽ responsive theo window size
<div className="hidden lg:block">...</div>

// ✅ CORRECT: Explicit device prop
{device === 'desktop' && <div>...</div>}
{device !== 'desktop' && <div>...</div>}
```

### Bước 4: Extract Interactive Elements
Identify form controls và UI state:

| Element | UI Thật | Preview |
|---------|---------|---------|
| Search input | Controlled state | `<input disabled />` |
| Category dropdown | Dynamic options | `<select disabled>{mockOptions}</select>` |
| Sort dropdown | Event handler | `<select disabled>{mockSorts}</select>` |
| Mobile filter toggle | State + panel | Static panel (always open) hoặc button disabled |
| Category chips (mobile) | Click handler | Static spans với active state |

**Best Practice**: Preview KHÔNG có event handlers. Chỉ visual representation.

### Bước 4.5: Extract Image Fallback (CRITICAL)

**Image Fallback Principle**: UI thật PHẢI có fallback khi ảnh bị lỗi/không load được.

#### Tìm fallback pattern trong UI thật:

```tsx
// Pattern 1: Conditional rendering với state tracking
const [brokenThumbnails, setBrokenThumbnails] = React.useState<Set<string>>(new Set());

const markThumbnailBroken = React.useCallback((id: Id<"services">) => {
  setBrokenThumbnails((prev) => {
    const key = String(id);
    if (prev.has(key)) {return prev;}
    const next = new Set(prev);
    next.add(key);
    return next;
  });
}, []);

const showImage = Boolean(service.thumbnail) && !brokenThumbnails.has(String(service._id));

{showImage ? (
  <Image 
    src={service.thumbnail as string} 
    alt={service.title} 
    fill 
    ref={(img) => {
      if (img?.complete && img.naturalWidth === 0) {
        markThumbnailBroken(service._id);
      }
    }}
    onError={() => markThumbnailBroken(service._id)}
  />
) : (
  <div className="w-full h-full flex items-center justify-center">
    <Briefcase size={32} className="text-slate-300" />
  </div>
)}

// Pattern 2: Simpler conditional (cho related items)
{thumbnail ? (
  <Image src={thumbnail} alt={title} fill />
) : (
  <div className="w-full h-full flex items-center justify-center">
    <Briefcase size={32} className="text-slate-300" />  // ← Icon fallback
  </div>
)}
```

#### Checklist trích xuất fallback:

1. **Xác định icon fallback**: 
   - Posts → `FileText` 
   - Services → `Briefcase`
   - Products → `Package` hoặc `ShoppingBag`
   - Users → `User`
   
2. **Copy exact styling**:
   ```tsx
   // Container
   className="w-full h-full flex items-center justify-center"
   
   // Icon
   size={32}            // hoặc 40, 48 tùy layout
   className="text-slate-300"  // màu icon
   ```

3. **Import icon từ Lucide React**:
   ```tsx
   import { FileText, Briefcase, Package, User } from 'lucide-react';
   ```

4. **Kiểm tra xem UI thật có dùng state tracking không**:
   ```tsx
   // Tìm pattern này trong code UI thật
   const [brokenThumbnails, setBrokenThumbnails] = ...
   const markThumbnailBroken = React.useCallback(...)
   
   // Và check pattern:
   ref={(img) => { if (img?.complete && img.naturalWidth === 0) ... }}
   onError={() => markThumbnailBroken(...)}
   ```
   
5. **Preview có thể đơn giản hóa**:
   ```tsx
   // ✅ CORRECT: Preview dùng conditional đơn giản
   <div className="aspect-video bg-slate-100 overflow-hidden relative">
     {mockItem.thumbnail ? (
       <Image src={mockItem.thumbnail} alt={title} fill />
     ) : (
       <div className="w-full h-full flex items-center justify-center">
         <FileText size={32} className="text-slate-300" />
       </div>
     )}
   </div>
   
   // ❌ WRONG: Preview không có fallback
   <div className="aspect-video bg-slate-100">
     <Image src={mockImage} alt={title} fill />
   </div>
   ```

6. **Mock data nên có mix thumbnail/no-thumbnail**:
   ```tsx
   const mockPosts = [
     { id: 1, title: '...', thumbnail: 'https://...' },  // có ảnh
     { id: 2, title: '...', thumbnail: undefined },      // không có ảnh
     { id: 3, title: '...' },                            // không có field
     { id: 4, title: '...', thumbnail: 'https://...' },  // có ảnh
   ];
   ```

#### Fallback validation:

- [ ] Icon type match (FileText, Briefcase, Package, etc.)
- [ ] Icon size match (32, 40, 48)
- [ ] Icon color match (text-slate-300, text-slate-400)
- [ ] Container classes match (flex, items-center, justify-center)
- [ ] Background color match khi không có ảnh (bg-slate-100, bg-muted)
- [ ] Mock data có items với thumbnail undefined/null để test fallback visual
- [ ] UI thật có state tracking (`brokenThumbnails`) thì ghi chú trong comment preview

### Bước 5: Extract Spacing & Sizing
Copy exact values:

```tsx
// Container
py-6 md:py-10 px-4
max-w-7xl mx-auto

// Filter bar
mb-5 space-y-2.5
p-3 gap-2

// Grid
gap-3
sm:grid-cols-2 lg:grid-cols-3

// Card
p-3
mb-1.5, mt-1.5, mt-2.5, pt-2.5
```

**CRITICAL**: Không làm tròn hoặc "tối ưu" spacing. Copy y hệt.

### Bước 6: Create Preview Component
Template structure:

```tsx
export function [Feature]ListPreview({
  layoutStyle,
  showSearch = true,
  showCategories = true,
  showPagination = true,
  brandColor = '#3b82f6',
  device = 'desktop',
}: PreviewProps) {
  // Device helpers
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';
  const isCompact = device !== 'desktop';
  
  // Mock data (simple, predictable)
  const mockItems = [
    { id: 1, title: '...', category: '...' },
    // ...
  ];
  
  // Conditional rendering based on device
  const showDesktopDropdowns = isDesktop;
  const showMobilePanel = isCompact;
  const visibleItems = isMobile ? 2 : 4;
  const gridClass = isMobile ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3';
  
  return (
    {/* Copy exact structure from UI thật */}
  );
}
```

### Bước 7: Implement Responsive Variants
Với mỗi breakpoint, tạo explicit conditions:

```tsx
{/* Desktop: Full filter bar */}
{showDesktopDropdowns && (
  <div className="relative">
    <select disabled>...</select>
  </div>
)}

{/* Desktop: Spacer */}
{isDesktop && <div className="flex-1" />}

{/* Mobile/Tablet: Compact panel */}
{showMobilePanel && (
  <div className="mt-3 pt-3 border-t">
    {/* Mobile filter UI */}
  </div>
)}

{/* Grid columns by device */}
<div className={`grid ${gridClass} gap-3`}>
  {mockItems.slice(0, visibleItems).map(...)}
</div>
```

### Bước 8: Validate & Test
```bash
# 1. Typecheck
npm run typecheck

# 2. Lint
bunx oxlint --type-aware --type-check --fix

# 3. Visual comparison (manual)
# Mở side-by-side:
# - http://localhost:3000/[feature] (UI thật)
# - http://localhost:3000/system/experiences/[feature]-list (Preview)

# 4. Check responsive
# Toggle device preview: desktop → tablet → mobile
# So sánh với resize browser window trên UI thật
```

## Checklist chi tiết

### Structure Matching
- [ ] Container classes match (py, px, max-w)
- [ ] Header structure match (h1, position, margin)
- [ ] Filter bar structure match (search, category, sort order)
- [ ] Grid structure match (cols, gap, aspect ratio)
- [ ] Card structure match (image, content, footer sections)
- [ ] Pagination/Load more match (position, styling)

### Responsive Matching (Desktop)
- [ ] Category dropdown visible
- [ ] Sort dropdown visible và right-aligned
- [ ] Spacer `flex-1` between category và sort
- [ ] Search input có `max-w-xs` constraint
- [ ] Mobile filter toggle ẩn
- [ ] Applied filters row visible với full layout
- [ ] Grid: 3 columns (`lg:grid-cols-3`)

### Responsive Matching (Tablet)
- [ ] Category dropdown ẩn
- [ ] Sort dropdown ẩn
- [ ] Mobile filter toggle hiện
- [ ] Mobile filter panel always visible hoặc expandable
- [ ] Search input full width (không có max-w constraint)
- [ ] Grid: 2 columns (`sm:grid-cols-2`)

### Responsive Matching (Mobile)
- [ ] Tương tự tablet nhưng:
- [ ] Grid: 1 column
- [ ] Visible items reduced (2 thay vì 4)
- [ ] Applied filters row simplified hoặc chỉ show count

### Spacing & Sizing
- [ ] All py, px, my, mx values match
- [ ] Gap values match (gap-2, gap-3, etc.)
- [ ] Border radius match (rounded-lg, rounded-xl)
- [ ] Font sizes match (text-xs, text-sm, text-2xl)
- [ ] Aspect ratios match (aspect-video)

### Interactive Elements
- [ ] All inputs/selects disabled
- [ ] No event handlers attached
- [ ] Static mock data used
- [ ] Active states shown visually (selected category, etc.)

### Edge Cases
- [ ] Empty state shown when `mockItems.length === 0`
- [ ] Long text truncated (line-clamp-2)
- [ ] Missing images handled (placeholder icon)
- [ ] Image fallback icon type match UI thật
- [ ] Image fallback icon size và color match
- [ ] Image fallback container styling match

## Common Mistakes (TRÁNH)

### ❌ WRONG: Missing image fallback
```tsx
// Preview không có fallback khi ảnh lỗi
<div className="aspect-video bg-slate-100">
  <Image src={mockImage} alt={title} fill />
</div>
```

### ✅ CORRECT: Image fallback như UI thật
```tsx
// Preview có fallback icon giống y UI thật
// Note: UI thật dùng state tracking với brokenThumbnails Set + ref + onError,
// nhưng preview đơn giản hóa thành conditional rendering
{service.thumbnail ? (
  <Image src={service.thumbnail} alt={service.title} fill />
) : (
  <div className="w-full h-full flex items-center justify-center">
    <Briefcase size={32} className="text-slate-300" />
  </div>
)}

// Mock data có mix để test fallback visual
const mockServices = [
  { id: 1, title: 'Service A', thumbnail: 'https://...' },
  { id: 2, title: 'Service B' }, // không có thumbnail
  { id: 3, title: 'Service C', thumbnail: undefined },
];
```

### ❌ WRONG: Dùng Tailwind breakpoints trong preview
```tsx
// Preview sẽ responsive theo window size, không theo device prop
<div className="hidden lg:block">...</div>
```

### ✅ CORRECT: Explicit device conditions
```tsx
{device === 'desktop' && <div>...</div>}
{device !== 'desktop' && <div>...</div>}
```

### ❌ WRONG: Simplified layout "cho gọn"
```tsx
// Thiếu spacer => Sort không right-aligned
<div className="flex gap-2">
  <input />
  <select /> {/* Category */}
  <select /> {/* Sort - sẽ sát category, không về bên phải */}
</div>
```

### ✅ CORRECT: Preserve spacer
```tsx
<div className="flex gap-2">
  <input />
  <select /> {/* Category */}
  <div className="flex-1" /> {/* Spacer */}
  <select /> {/* Sort - về bên phải */}
</div>
```

### ❌ WRONG: Hardcode visible items
```tsx
// Luôn show 4 items, kể cả mobile
{mockPosts.map(...)}
```

### ✅ CORRECT: Responsive item count
```tsx
const visibleItems = device === 'mobile' ? 2 : 4;
{mockPosts.slice(0, visibleItems).map(...)}
```

## Debug Process

Khi preview không match UI thật:

1. **Open DevTools side-by-side**
   - Tab 1: `http://localhost:3000/[feature]` (UI thật)
   - Tab 2: `http://localhost:3000/system/experiences/[feature]-list` (Preview)

2. **Inspect DOM structure**
   - Right-click element → Inspect
   - So sánh tree structure
   - Check class names

3. **Toggle device preview**
   - Desktop → Tablet → Mobile
   - Resize UI thật window để compare

4. **Check specific issues**
   - **Sort không về phải**: Missing spacer `flex-1`
   - **Dropdown không ẩn**: Missing `device === 'desktop'` condition
   - **Search quá rộng**: Missing `max-w-xs` trên desktop
   - **Mobile panel không hiện**: Missing `device !== 'desktop'` condition
   - **Grid columns sai**: Sai `gridClass` logic
   - **Image không có fallback**: Missing fallback icon khi thumbnail null/undefined
   - **Fallback icon sai loại**: Dùng FileText cho services thay vì Briefcase
   - **Fallback icon sai size/color**: Size 40 trong preview nhưng UI thật dùng 32

5. **Validate spacing**
   - Copy class từ UI thật: `py-6 md:py-10 px-4`
   - Paste vào preview: exact same

## Khi KHÔNG dùng skill

- Preview chỉ cần minh hoạ chung (không cần pixel-perfect)
- UI thật chưa có code rõ ràng
- Feature đang trong giai đoạn prototype

## Performance Tips

- Mock data tối đa 10 items
- Không fetch API trong preview
- Không include analytics/tracking
- Disable all event handlers

## Validation Checklist

Trước khi hoàn thành:
- [ ] `npm run typecheck` passes
- [ ] `bunx oxlint --type-aware --type-check --fix` passes  
- [ ] Visual comparison OK cho cả 3 devices
- [ ] No console errors
- [ ] Preview renders trong < 100ms
- [ ] Image fallback icons imported và render đúng
- [ ] Fallback styling match UI thật (size, color, container)

---
name: create-home-component
description: Tạo Home Component mới cho hệ thống VietAdmin với trang /create, /edit và preview responsive. Sử dụng khi user muốn thêm loại component mới cho homepage như Banner, Pricing, Newsletter, Map, v.v. Skill này hướng dẫn tạo đầy đủ form config, 6 styles preview và tích hợp vào ComponentRenderer.
---

# Create Home Component

## Tổng quan

Skill này hướng dẫn tạo Home Component mới, bao gồm:
- Trang `/admin/home-components/create/[component-name]/page.tsx`
- Preview component trong `previews.tsx`
- Tích hợp vào `ComponentRenderer.tsx`
- Cập nhật trang edit `[id]/edit/page.tsx`

## Cấu trúc Files

```
app/admin/home-components/
├── previews.tsx                       # TẤT CẢ preview components
├── create/
│   ├── shared.tsx                     # Shared utilities, hooks
│   └── [component-name]/page.tsx      # Create page
└── [id]/edit/page.tsx                 # Edit page

components/site/
└── ComponentRenderer.tsx              # Render trên site
```

## Conventions

| Type | Format | Ví dụ |
|------|--------|-------|
| Component Type | PascalCase | `Newsletter`, `MapLocation` |
| Route | kebab-case | `/create/newsletter` |
| Style Types | camelCase | `fullWidth`, `minimal` |

---

## Conflict Resolution

Nếu có xung đột với `system-extension-guideline`, luôn ưu tiên master playbook.

## File Lifecycle Service (FLS) bắt buộc nếu component có upload

Nếu home-component có upload ảnh/video/file, phải kích hoạt và làm theo `.factory/skills/file-lifecycle-service/SKILL.md`.

Checklist tối thiểu:
- **Upload mới phải persist `storageId`**: Toàn bộ các upload media mới bắt buộc phải lưu trữ và truyền `storageId` trong config; cơ chế backend resolve legacy URL-only chỉ là fallback bổ trợ cho dữ liệu cũ, không được phép lạm dụng cho component mới.
- Draft upload chưa save phải được register qua `fileDraftUploads` và cleanup khi rời trang/cron.
- Create/update/delete phải đi qua `homeComponents` mutation để sync `fileReferences`.
- UI business record đã lưu không xóa storage trực tiếp; dùng defer/server cleanup.
- Delete/bulk delete `/admin/home-components` phải gọi `api.homeComponents.remove`.
- Verify các case: upload chưa save, chỉ save một phần, đổi ảnh, xóa ảnh, xóa record.
- **Bắt buộc Acceptance**: Load -> Edit -> Save thành công không làm rơi `storageId` trong config.

## WebSearch Best Practices (Khi cần)

**CRITICAL**: Chỉ bắt buộc WebSearch khi component domain mới/thiếu pattern nội bộ. Nếu repo đã có component tương tự, ưu tiên dùng reference nội bộ trước.

### Cách Search

```
// Search query pattern
"[component-name] UI UX best practices 2024"
"[component-name] section design patterns"
"[component-name] component accessibility guidelines"
"[component-name] responsive design examples"
```

### Checklist Search theo Component Type

Dùng WebSearch tool với các query sau để lấy best practices cụ thể:

#### Hero Banner / Slider
- `"hero banner best practices ecommerce"`
- `"image slider UX accessibility"`
- `"hero section CTA placement"`
- **Key points cần tìm**: CTA visibility, image focal point, text contrast, animation speed, mobile touch gestures

#### FAQ / Accordion
- `"FAQ section UX best practices"`
- `"accordion accessibility ARIA"`
- `"FAQ schema SEO structured data"`
- **Key points cần tìm**: Expand/collapse behavior, keyboard navigation, search/filter, schema markup, anchor links

#### Testimonials / Reviews
- `"testimonials section best practices"`
- `"social proof UX design"`
- `"customer reviews display patterns"`
- **Key points cần tìm**: Credibility indicators (photo, company, role), star ratings, verification badges, video testimonials

#### Pricing Table
- `"pricing table UX best practices"`
- `"SaaS pricing page conversion"`
- `"pricing comparison accessibility"`
- **Key points cần tìm**: Feature comparison, highlight recommended plan, annual/monthly toggle, CTA hierarchy, mobile stacking

#### Gallery / Portfolio
- `"image gallery UX patterns"`
- `"portfolio grid best practices"`
- `"lightbox accessibility guidelines"`
- **Key points cần tìm**: Lazy loading, lightbox navigation, thumbnail sizing, masonry vs grid, keyboard navigation

#### Partners / Logos
- `"logo carousel best practices"`
- `"partner logos display UX"`
- `"trust badges placement"`
- **Key points cần tìm**: Logo sizing consistency, grayscale vs color, animation speed, hover effects, link behavior

#### Stats / Counters
- `"statistics section design"`
- `"number counter animation UX"`
- `"data visualization best practices"`
- **Key points cần tìm**: Number formatting, animation timing, context/comparison, icon usage, mobile layout

#### Services / Features
- `"features section best practices"`
- `"service cards UX design"`
- `"benefits section layout"`
- **Key points cần tìm**: Icon consistency, description length, CTA placement, grid vs list, feature prioritization

#### Newsletter / Subscribe
- `"newsletter signup best practices"`
- `"email subscription UX"`
- `"form conversion optimization"`
- **Key points cần tìm**: Single field vs multi-field, privacy notice, success feedback, inline validation, incentive copy

#### Contact / Map
- `"contact section UX design"`
- `"Google Maps embed best practices"`
- `"contact form accessibility"`
- **Key points cần tìm**: Map interactivity, address formatting, multiple contact methods, form fields, response time expectation

#### CTA / Banner
- `"call to action best practices"`
- `"CTA button design conversion"`
- `"promotional banner UX"`
- **Key points cần tìm**: Button color/contrast, urgency indicators, value proposition, dismissible banners, A/B testing

#### Timeline / Process
- `"timeline component UX"`
- `"process steps design"`
- `"stepper component accessibility"`
- **Key points cần tìm**: Vertical vs horizontal, mobile adaptation, progress indication, content length, connector lines

### Output Format sau WebSearch

Sau khi search, tổng hợp thành checklist cụ thể:

```markdown
## [ComponentName] Best Practices Checklist

### UX Requirements
- [ ] Point 1 từ search results
- [ ] Point 2 từ search results
- [ ] ...

### Accessibility (a11y)
- [ ] ARIA labels cụ thể
- [ ] Keyboard navigation
- [ ] Screen reader support

### Performance
- [ ] Lazy loading strategy
- [ ] Animation performance
- [ ] Mobile optimization

### SEO (nếu relevant)
- [ ] Schema markup
- [ ] Semantic HTML
- [ ] Alt texts
```

---

## 6 Styles Requirement (BẮT BUỘC)

**Mỗi component PHẢI có đúng 6 styles khác nhau**. Các styles phải:
- Responsive trên cả 3 devices (desktop/tablet/mobile)
- Đa dạng về layout và visual approach
- Sử dụng Monochromatic color system (1 brandColor + tints/shades)

### Gợi ý 6 styles pattern cho các loại component:

| Component Type | 6 Styles gợi ý |
|----------------|----------------|
| Cards/Grid | grid, list, masonry, carousel, compact, showcase |
| Text Content | accordion, cards, two-column, minimal, timeline, tabbed |
| Media/Gallery | spotlight, explore, stories, grid, marquee, masonry |
| Pricing/Plans | cards, horizontal, minimal, comparison, featured, compact |
| Testimonials | cards, slider, masonry, quote, carousel, minimal |
| CTA/Banner | fullWidth, split, floating, minimal, gradient, parallax |

### Thiết kế 6 styles - Best Practices:

1. **Đa dạng layout**: Grid vs List vs Carousel vs Masonry
2. **Đa dạng density**: Compact vs Spacious vs Featured
3. **Đa dạng interaction**: Static vs Animated vs Interactive
4. **Mobile-first**: Tất cả styles PHẢI hoạt động tốt trên mobile
5. **Consistent brandColor**: Tất cả styles dùng cùng opacity scale

---

## 5 Steps tạo Component

### Step 1: Thêm vào COMPONENT_TYPES (shared.tsx)

```tsx
{ value: 'ComponentName', label: 'Tên hiển thị', icon: Icon, description: 'Mô tả', route: 'component-name' }
```

### Step 2: Tạo Create Page

```tsx
'use client';
import { useState } from 'react';
import { ComponentFormWrapper, useComponentForm, useBrandColor } from '../shared';
import { ComponentPreview, type ComponentStyle } from '../../previews';

export default function ComponentCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Default Title', 'ComponentName');
  const brandColor = useBrandColor();
  const [items, setItems] = useState([{ id: 1, field1: '', field2: '' }]);
  const [style, setStyle] = useState<ComponentStyle>('style1');

  return (
    <ComponentFormWrapper {...{ type: 'ComponentName', title, setTitle, active, setActive, isSubmitting }}
      onSubmit={(e) => handleSubmit(e, { items, style })}
    >
      {/* Config Card với items */}
      <ComponentPreview items={items} brandColor={brandColor} selectedStyle={style} onStyleChange={setStyle} />
    </ComponentFormWrapper>
  );
}
```

### Step 3: Tạo Preview (previews.tsx)

```tsx
// BẮT BUỘC: 6 styles
export type ComponentStyle = 'style1' | 'style2' | 'style3' | 'style4' | 'style5' | 'style6';

export const ComponentPreview = ({ items, brandColor, selectedStyle, onStyleChange }: Props) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  
  // BẮT BUỘC: 6 styles với labels mô tả rõ ràng
  const styles = [
    { id: 'style1', label: 'Grid' }, 
    { id: 'style2', label: 'List' }, 
    { id: 'style3', label: 'Cards' },
    { id: 'style4', label: 'Carousel' },
    { id: 'style5', label: 'Minimal' },
    { id: 'style6', label: 'Showcase' }
  ];

  return (
    <PreviewWrapper title="Preview" device={device} setDevice={setDevice} 
      previewStyle={selectedStyle || 'style1'} setPreviewStyle={(s) => onStyleChange?.(s as ComponentStyle)} styles={styles}>
      <BrowserFrame>
        {/* Render theo style - tất cả 6 styles */}
      </BrowserFrame>
    </PreviewWrapper>
  );
};
```

### Step 4: Thêm vào ComponentRenderer.tsx

```tsx
case 'ComponentName':
  return <ComponentSection config={config} brandColor={brandColor} title={title} />;
```

#### ⚠️ CRITICAL: Style Fallback Order trong ComponentSection

**BUG THƯỜNG GẶP**: Default return (fallback style) đặt **TRƯỚC** các `if (style === '...')` → các styles sau không bao giờ được render!

```tsx
// ❌ SAI - Bug: minimal và centered KHÔNG BAO GIỜ được render
function ComponentSection({ config, brandColor }) {
  const style = config.style || 'modern';

  if (style === 'modern') { return <ModernLayout />; }
  if (style === 'grid') { return <GridLayout />; }
  
  // Default fallback - return VÔ ĐIỀU KIỆN
  return <ElegantLayout />;  // ← Function exits here!
  
  // ⚠️ Code dưới đây KHÔNG BAO GIỜ chạy
  if (style === 'minimal') { return <MinimalLayout />; }
  if (style === 'centered') { return <CenteredLayout />; }
}

// ✅ ĐÚNG - Tất cả if statements TRƯỚC default return
function ComponentSection({ config, brandColor }) {
  const style = config.style || 'modern';

  if (style === 'modern') { return <ModernLayout />; }
  if (style === 'grid') { return <GridLayout />; }
  if (style === 'minimal') { return <MinimalLayout />; }
  if (style === 'centered') { return <CenteredLayout />; }
  
  // Default fallback - CUỐI CÙNG
  return <ElegantLayout />;
}
```

**Checklist tránh bug fallback:**
- [ ] Tất cả `if (style === '...')` statements đặt TRƯỚC default return
- [ ] Default return là statement CUỐI CÙNG trong function
- [ ] Test TẤT CẢ 6 styles trên trang chủ, không chỉ trong preview
- [ ] Đặt comment `// Default fallback` trước return cuối để dễ nhận biết

### Step 5: Cập nhật Edit Page

1. Import: `import { ComponentPreview, ComponentStyle } from '../../previews';`
2. States: `const [items, setItems] = useState([]); const [style, setStyle] = useState('style1');`
3. useEffect case: Load data từ config
4. buildConfig case: Return config object
5. JSX: Form + Preview component

---

## Spacing & Density Best Practices

**CRITICAL**: Spacing ảnh hưởng trực tiếp đến readability và visual hierarchy. Giảm spacing hợp lý giúp UI gọn gàng, chuyên nghiệp hơn.

### Spacing Scale (Tailwind)

| Size | Class | Pixels | Dùng cho |
|------|-------|--------|----------|
| xs | `gap-1`, `p-1` | 4px | Icon-text gap, badge padding |
| sm | `gap-2`, `p-2` | 8px | Tight cards, compact items |
| md | `gap-3`, `p-3` | 12px | Default card padding |
| base | `gap-4`, `p-4` | 16px | Standard section padding |
| lg | `gap-6`, `p-6` | 24px | Section gaps, spacious cards |
| xl | `gap-8`, `py-8` | 32px | Section vertical padding |

### Responsive Spacing Pattern

```tsx
// Section padding - giảm trên mobile
<section className={cn(
  "w-full",
  device === 'mobile' ? 'py-6 px-3' : 'py-10 px-6'
)}>

// Grid gap - giảm trên mobile
<div className={cn(
  "grid",
  device === 'mobile' ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-6'
)}>

// Card padding - giảm trên mobile
<div className={cn(
  "rounded-xl border",
  device === 'mobile' ? 'p-3' : 'p-5'
)}>
```

### Density Levels cho 6 Styles

| Style Type | Density | Spacing Pattern |
|------------|---------|-----------------|
| Compact | High | `gap-2`, `p-2`, nhiều items/row |
| Grid | Medium | `gap-4`, `p-4`, 3-4 items/row |
| Cards | Medium | `gap-4`, `p-5`, 2-3 items/row |
| List | Low-Medium | `gap-3`, `py-3`, 1 item/row |
| Showcase | Low | `gap-6`, `p-6`, featured item lớn |
| Carousel | Medium | `gap-4`, scroll horizontal |

### Anti-Cramped UI Techniques

```tsx
// 1. Tránh padding quá nhỏ trên card
// BAD: p-1 hoặc p-2 cho card lớn
// GOOD: p-3 minimum cho card có nhiều content

// 2. Gap giữa icon và text
<div className="flex items-center gap-2"> {/* Minimum gap-2 */}
  <Icon size={16} />
  <span>Label</span>
</div>

// 3. Line-height cho readability
<p className="leading-relaxed"> {/* hoặc leading-6 */}

// 4. Margin between sections
<div className="space-y-2"> {/* Tight: headings */}
<div className="space-y-4"> {/* Normal: content blocks */}
<div className="space-y-6"> {/* Spacious: sections */}

// 5. Button padding - đừng quá tight
<button className="px-4 py-2"> {/* Minimum cho touch target */}
<button className="px-6 py-2.5"> {/* Comfortable */}
```

### Touch Target Guidelines (Mobile)

```tsx
// Minimum touch target: 44x44px (Apple HIG) / 48x48px (Material)
<button className={cn(
  "rounded-lg font-medium",
  device === 'mobile' 
    ? 'min-h-[44px] px-4 py-2.5 text-sm'  // Touch-friendly
    : 'px-6 py-2 text-base'                // Desktop
)}>

// Clickable cards - đủ padding để tap
<div className={cn(
  "cursor-pointer",
  device === 'mobile' ? 'p-4' : 'p-3'  // Lớn hơn trên mobile!
)}>
```

### Whitespace Balance

```tsx
// Section với breathing room
<section className="py-12 md:py-16"> {/* Vertical breathing */}
  <div className="max-w-6xl mx-auto px-4 md:px-6"> {/* Horizontal containment */}
    <header className="mb-8 md:mb-12"> {/* Header-content gap */}
      <h2>Title</h2>
      <p className="mt-2">Subtitle</p> {/* Tight title-subtitle */}
    </header>
    <div className="grid gap-6"> {/* Content grid */}
      {/* items */}
    </div>
  </div>
</section>

// Card internal spacing
<article className="p-5">
  <header className="mb-3">  {/* Header section */}
    <h3>Title</h3>
    <span className="mt-1">Subtitle</span>
  </header>
  <p className="mb-4">Description</p>  {/* Body */}
  <footer className="pt-3 border-t">  {/* Footer với separator */}
    <button>Action</button>
  </footer>
</article>
```

### Equal Height Cards (CRITICAL)

**Vấn đề**: Cards cao thấp khác nhau vì có/không có excerpt, description dài/ngắn → Grid không đều, xấu UI.

```tsx
// PROBLEM: Cards không đều chiều cao
<div className="grid grid-cols-3 gap-4">
  <Card>Short title</Card>           {/* Thấp */}
  <Card>Title + long description</Card>  {/* Cao */}
  <Card>Title only</Card>            {/* Thấp */}
</div>

// SOLUTION 1: Flex + min-height cho description area
<article className="flex flex-col h-full">
  <img className="aspect-[4/3] object-cover" />
  <div className="flex-1 flex flex-col p-4">
    <h3 className="font-bold line-clamp-2">{title}</h3>
    
    {/* Description area với min-height cố định */}
    <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mt-2">
      {description || ''} {/* Empty string nếu không có */}
    </p>
    
    {/* Footer luôn ở bottom */}
    <div className="mt-auto pt-3">
      <span className="font-bold">{price}</span>
    </div>
  </div>
</article>

// SOLUTION 2: CSS Grid với subgrid (modern browsers)
<div className="grid grid-cols-3 gap-4">
  {items.map(item => (
    <article className="grid grid-rows-[auto_1fr_auto] h-full">
      <img />           {/* Row 1: Image */}
      <div>             {/* Row 2: Content - stretches */}
        <h3>{title}</h3>
        <p className="line-clamp-2">{description}</p>
      </div>
      <footer>          {/* Row 3: Footer - bottom aligned */}
        <button>Action</button>
      </footer>
    </article>
  ))}
</div>

// SOLUTION 3: Fixed content height với truncation
<article className="h-[320px] flex flex-col"> {/* Fixed total height */}
  <img className="h-[160px] object-cover" />   {/* Fixed image height */}
  <div className="flex-1 p-4 flex flex-col">
    <h3 className="line-clamp-1">{title}</h3>  {/* Max 1 line */}
    <p className="line-clamp-2 flex-1">{desc}</p> {/* Max 2 lines */}
    <span>{price}</span>
  </div>
</article>
```

### Line Clamp Cheat Sheet

| Content Type | Lines | Class | Min-height gợi ý |
|--------------|-------|-------|------------------|
| Title | 1-2 | `line-clamp-1` / `line-clamp-2` | `min-h-[1.5rem]` / `min-h-[3rem]` |
| Description | 2-3 | `line-clamp-2` / `line-clamp-3` | `min-h-[2.5rem]` / `min-h-[4rem]` |
| Excerpt | 3-4 | `line-clamp-3` / `line-clamp-4` | `min-h-[4rem]` / `min-h-[5.5rem]` |

```tsx
// Pattern: line-clamp + min-height để giữ đều
<p className="line-clamp-2 min-h-[2.5rem] text-sm">
  {description || <span className="invisible">placeholder</span>}
</p>

// Hoặc dùng empty string + min-height
<p className="line-clamp-2 min-h-[2.5rem] text-sm">
  {description || ''}
</p>
```

---

## Monochromatic Brand Color System

**CRITICAL**: Triết lý Monochromatic - 1 main color + tints/shades

### Opacity Scale (Tints/Shades)

| Opacity | Hex | Dùng cho | Ví dụ |
|---------|-----|----------|-------|
| 5% | `05` | Hover background nhẹ | `${brandColor}05` |
| 8-10% | `08`/`10` | Card background subtle, shadow nhẹ | `${brandColor}10` |
| 15% | `15` | Border default | `${brandColor}15` |
| 20% | `20` | Shadow medium | `${brandColor}20` |
| 30-40% | `30`/`40` | Border hover, shadow đậm | `${brandColor}40` |
| 50-60% | `50`/`60` | Text secondary muted | `${brandColor}60` |
| 80% | `80`/`cc` | Text secondary, accent labels | `${brandColor}cc` |
| 100% | (none) | Primary: price, icons, buttons, CTA | `${brandColor}` |

### Standard Pattern - Cards với Hover

```tsx
// Card với brandColor monochromatic hover
<div 
  className="border rounded-lg p-3 transition-all"
  style={{ borderColor: `${brandColor}15` }}
  onMouseEnter={(e) => { 
    e.currentTarget.style.borderColor = `${brandColor}40`; 
    e.currentTarget.style.boxShadow = `0 4px 12px ${brandColor}10`; 
  }}
  onMouseLeave={(e) => { 
    e.currentTarget.style.borderColor = `${brandColor}15`; 
    e.currentTarget.style.boxShadow = 'none'; 
  }}
>
  <span style={{ color: brandColor }}>Price</span>
  <ArrowUpRight style={{ color: brandColor }} />
</div>

// Featured item với shadow đậm
<article style={{ boxShadow: `0 8px 30px ${brandColor}20` }}>
  <span style={{ color: `${brandColor}cc` }}>Nổi bật</span>
  <button style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` }}>
    Xem chi tiết
  </button>
</article>

// Accent line / progress bar
<div className="w-8 h-1 rounded-full" style={{ backgroundColor: brandColor }} />

// Badge / Tag
<span className="px-2 py-1 text-xs font-bold rounded" 
  style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
  NEW
</span>
```

---

## Typography & Text Overflow Prevention

**CRITICAL**: Tránh chữ rớt dòng không chủ đích, chen chúc UI

### Anti-Overflow Techniques

```tsx
// 1. Truncate single line
<h3 className="truncate">{title}</h3>

// 2. Line clamp cho multi-line
<p className="line-clamp-2">{description}</p>
<p className="line-clamp-3">{longText}</p>

// 3. Min-width cho button text
<button className="whitespace-nowrap min-w-max">Xem chi tiết</button>

// 4. Flex với min-w-0 để truncate flex children
<div className="flex items-center gap-2 min-w-0">
  <span className="truncate flex-1">{text}</span>
  <Icon className="flex-shrink-0" />
</div>

// 5. Grid với fixed columns
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Items với width cố định */}
</div>
```

### Responsive Typography Scale

```tsx
// Heading responsive
<h2 className={cn(
  "font-bold tracking-tight",
  device === 'mobile' ? 'text-xl' : 'text-2xl md:text-3xl'
)}>

// Body text responsive  
<p className={cn(
  "text-slate-600",
  device === 'mobile' ? 'text-sm' : 'text-base'
)}>

// Price/numbers
<span className={cn(
  "font-bold tabular-nums",
  device === 'mobile' ? 'text-lg' : 'text-xl'
)}>
```

---

## Edge Cases & UI/UX Techniques

### Quá nhiều items - "+N" Pattern

```tsx
const MAX_VISIBLE = device === 'mobile' ? 4 : 6;
const visibleItems = items.slice(0, MAX_VISIBLE);
const remainingCount = items.length - MAX_VISIBLE;

<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {visibleItems.map(item => (
    <ItemCard key={item.id} {...item} />
  ))}
  
  {/* Item cuối có dấu + nếu còn nhiều */}
  {remainingCount > 0 && (
    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl aspect-square">
      <div className="text-center">
        <Plus size={32} className="mx-auto mb-2 text-slate-400" />
        <span className="text-lg font-bold text-slate-600">+{remainingCount}</span>
        <p className="text-xs text-slate-400">mục khác</p>
      </div>
    </div>
  )}
</div>
```

### Ít items - Centered Layout

```tsx
// 1 item: centered max-w-md
{items.length === 1 && (
  <div className="max-w-md mx-auto">
    <ItemCard {...items[0]} />
  </div>
)}

// 2 items: centered max-w-2xl
{items.length === 2 && (
  <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
    {items.map(item => <ItemCard key={item.id} {...item} />)}
  </div>
)}

// 3+ items: normal grid
{items.length >= 3 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {items.map(item => <ItemCard key={item.id} {...item} />)}
  </div>
)}
```

### Empty State

```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" 
      style={{ backgroundColor: `${brandColor}10` }}>
      <Package size={32} style={{ color: brandColor }} />
    </div>
    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
      Chưa có mục nào
    </h3>
    <p className="text-sm text-slate-500">
      Thêm mục đầu tiên để bắt đầu
    </p>
  </div>
)}
```

### Missing Data Fallbacks

```tsx
// Text fallback
<h3>{item.title || 'Tiêu đề mặc định'}</h3>
<p>{item.description || 'Mô tả sẽ hiển thị ở đây'}</p>

// Image placeholder
{item.image ? (
  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
) : (
  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
    <ImageIcon size={32} className="text-slate-300" />
  </div>
)}

// Price fallback
<span style={{ color: brandColor }}>{item.price || 'Liên hệ'}</span>
```

---

## Image Guidelines (Component có ảnh)

### Image Upload Form UX

Component có ảnh PHẢI dùng `MultiImageUploader` hoặc form tương đương với các tính năng:

```tsx
import { MultiImageUploader } from '../../../components/MultiImageUploader';

<MultiImageUploader<ItemType>
  items={items}
  onChange={handleItemsChange}
  folder="component-name"           // Folder lưu trữ
  imageKey="url"                     // Key chứa URL ảnh
  extraFields={[                     // Fields bổ sung
    { key: 'link', placeholder: 'URL liên kết', type: 'url' },
    { key: 'title', placeholder: 'Tiêu đề', type: 'text' }
  ]}
  minItems={1}
  maxItems={10}
  aspectRatio="banner"              // Gợi ý tỉ lệ
  columns={1}                        // Layout form
  showReorder={true}                 // Cho phép kéo thả sắp xếp
  addButtonText="Thêm ảnh"
  emptyText="Chưa có ảnh nào"
/>
```

### Image Processing Requirements

Tất cả ảnh upload PHẢI được xử lý:
- **Format**: WebP với quality 85%
- **Sharp processing**: Resize + optimize
- **Cleanup Observer**: Tự động xóa ảnh không dùng

```tsx
// Convex mutation example
const processedUrl = await sharp(imageBuffer)
  .webp({ quality: 85 })
  .resize(maxWidth, maxHeight, { fit: 'inside' })
  .toBuffer();
```

### Tỉ lệ ảnh theo Style (Tham khảo Hero Banner)

**Mỗi style có ảnh PHẢI có hướng dẫn tỉ lệ cụ thể** dưới preview:

```tsx
{/* Hướng dẫn kích thước ảnh tối ưu - BẮT BUỘC cho component có ảnh */}
<div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
  <div className="flex items-start gap-2">
    <ImageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
    <div className="text-xs text-slate-600 dark:text-slate-400">
      {selectedStyle === 'style1' && (
        <p><strong>1920×600px</strong> (16:5) • Banner ngang, nhiều ảnh auto slide</p>
      )}
      {selectedStyle === 'style2' && (
        <p><strong>1920×1080px</strong> (16:9) • Fullscreen, subject đặt bên phải</p>
      )}
      {selectedStyle === 'style3' && (
        <p><strong>Slot 1:</strong> 800×500 • <strong>Slot 2:</strong> 800×250 • Grid bento</p>
      )}
      {selectedStyle === 'style4' && (
        <p><strong>800×800px</strong> (1:1) • Cards vuông, carousel horizontal</p>
      )}
      {selectedStyle === 'style5' && (
        <p><strong>600×400px</strong> (3:2) • Compact cards, nhiều items</p>
      )}
      {selectedStyle === 'style6' && (
        <p><strong>1200×800px</strong> (3:2) • Showcase lớn, featured item</p>
      )}
    </div>
  </div>
</div>
```

### Common Image Ratios

| Ratio | Size | Dùng cho |
|-------|------|----------|
| 16:5 | 1920×600 | Banner slider, wide hero |
| 16:9 | 1920×1080 | Fullscreen, video cover |
| 3:2 | 1200×800 | Product showcase, cards |
| 4:3 | 800×600 | Thumbnails, gallery |
| 1:1 | 800×800 | Square cards, avatar, logo |
| 2:3 | 600×900 | Portrait cards, stories |

### Dynamic Image Size Info trong Preview Info Bar (BẮT BUỘC)

**CRITICAL**: Thay vì chỉ hiển thị "4 ảnh" trong info bar của PreviewWrapper, PHẢI hiển thị kích thước ảnh tối ưu cụ thể cho từng style.

#### Implementation Pattern

```tsx
// Tạo function để generate info dựa trên style và số lượng items
const getImageSizeInfo = () => {
  const count = items.length;
  switch (previewStyle) {
    case 'spotlight':
      if (count === 0) return 'Chưa có ảnh';
      if (count === 1) return 'Ảnh 1: 1200×800px (3:2)';
      if (count <= 4) return `Ảnh 1: 1200×800px • Ảnh 2-${count}: 600×600px`;
      return `Ảnh 1: 1200×800px • Ảnh 2-4: 600×600px (+${count - 4} ảnh)`;
    case 'grid':
      return `${count} ảnh • Tất cả: 800×800px (1:1)`;
    case 'masonry':
      return `${count} ảnh • Ngang: 600×400px • Dọc: 600×900px • Vuông: 600×600px`;
    // ... các styles khác
    default:
      return `${count} ảnh`;
  }
};

// Sử dụng trong PreviewWrapper
<PreviewWrapper 
  title="Preview Gallery"
  device={device}
  setDevice={setDevice}
  previewStyle={previewStyle}
  setPreviewStyle={setPreviewStyle}
  styles={styles}
  info={getImageSizeInfo()}  // Dynamic info thay vì `${items.length} ảnh`
>
```

#### Ví dụ Output trong Info Bar

| Style | Số ảnh | Info Bar hiển thị |
|-------|--------|-------------------|
| Spotlight | 4 | `Ảnh 1: 1200×800px • Ảnh 2-4: 600×600px` |
| Spotlight | 6 | `Ảnh 1: 1200×800px • Ảnh 2-4: 600×600px (+2 ảnh)` |
| Grid | 8 | `8 ảnh • Tất cả: 800×800px (1:1)` |
| Masonry | 10 | `10 ảnh • Ngang: 600×400px • Dọc: 600×900px • Vuông: 600×600px` |
| Carousel | 5 | `5 ảnh • Tất cả: 800×600px (4:3)` |

#### Lợi ích

1. **User biết ngay** kích thước ảnh cần chuẩn bị
2. **Không cần cuộn xuống** để xem hướng dẫn
3. **Dynamic theo số ảnh** - ví dụ Spotlight chỉ cần 4 ảnh, nếu có 6 thì hiện "(+2 ảnh)"
4. **Phân biệt vị trí ảnh** - Ảnh 1 vs Ảnh 2-4 cho styles có featured image

---

## Contained Marquee / Carousel (CRITICAL)

**BUG THƯỜNG GẶP**: Marquee hoặc carousel với `width: max-content` bị tràn ra ngoài viewport, gây ugly horizontal scrollbar.

### Problem

```tsx
// ❌ SAI - Marquee tràn ra ngoài container
<section className="py-16">
  <div className="relative"> {/* Không có overflow-hidden! */}
    <div style={{ width: 'max-content', animation: 'marquee 20s linear infinite' }}>
      {items.map(...)} {/* Tràn ra ngoài viewport */}
    </div>
  </div>
</section>
```

### Solution: Contained Marquee Pattern

```tsx
// ✅ ĐÚNG - Marquee được contain trong max-w-7xl + overflow-hidden
<section className="py-16 overflow-hidden"> {/* overflow-hidden trên section nếu cần */}
  {/* Outer container với max-width */}
  <div className="max-w-7xl mx-auto px-4 mb-12">
    {/* Inner container với overflow-hidden + rounded */}
    <div className="relative overflow-hidden rounded-xl">
      {/* Gradient fade edges - NẰM TRONG container */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling content */}
      <div 
        className="flex gap-5 py-4"
        style={{ 
          width: 'max-content',
          animation: items.length > 3 ? 'marquee 25s linear infinite' : 'none'
        }}
      >
        {/* Duplicate items for infinite loop */}
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="flex-shrink-0" style={{ width: 160 }}>
            {/* Card content */}
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

### Key Points

| Vấn đề | Giải pháp |
|--------|-----------|
| Marquee tràn viewport | Wrap trong `max-w-7xl mx-auto px-4` |
| Nội dung bị cắt xấu | Thêm `overflow-hidden rounded-xl` cho inner container |
| Gradient fade không đẹp | Gradient nằm TRONG container overflow-hidden |
| Animation giật | Duplicate items `[...items, ...items]` để infinite smooth |

### Carousel Horizontal Scroll (COMPLETE PATTERN)

**Carousel chuẩn cần có:**
1. Navigation buttons (< >) 
2. Mouse drag scroll trên desktop
3. Touch scroll trên mobile
4. Hidden scrollbar
5. Fade edges
6. Snap-to-card

```tsx
// Carousel scroll hoàn chỉnh với navigation + mouse drag
const MyCarousel = ({ items, brandColor }: Props) => {
  const carouselId = `carousel-${Math.random().toString(36).substr(2, 9)}`;
  const cardWidth = 300;
  const gap = 20;

  return (
    <section className="py-12">
      {/* Header với Navigation Buttons */}
      <div className="flex items-center justify-between mb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Tiêu đề</h2>
          <p className="text-sm text-slate-500 mt-1">Vuốt để xem thêm →</p>
        </div>
        {/* Navigation arrows - chỉ hiện khi có > 2 items */}
        {items.length > 2 && (
          <div className="flex gap-2">
            <button 
              type="button"  {/* ⚠️ CRITICAL: ngăn trigger form submission */}
              onClick={() => {
                const container = document.getElementById(carouselId);
                if (container) container.scrollBy({ left: -cardWidth - gap, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md hover:shadow-lg text-slate-700 transition-all border border-slate-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button"  {/* ⚠️ CRITICAL: ngăn trigger form submission */}
              onClick={() => {
                const container = document.getElementById(carouselId);
                if (container) container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: brandColor }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
      
      {/* Carousel Container - Contained */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden rounded-xl">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable area với Mouse Drag */}
          <div 
            id={carouselId}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:gap-5 py-4 px-2 cursor-grab active:cursor-grabbing select-none"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
            // Mouse Drag Handlers
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.dataset.isDown = 'true';
              el.dataset.startX = String(e.pageX - el.offsetLeft);
              el.dataset.scrollLeft = String(el.scrollLeft);
              el.style.scrollBehavior = 'auto';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onMouseUp={(e) => {
              e.currentTarget.dataset.isDown = 'false';
              e.currentTarget.style.scrollBehavior = 'smooth';
            }}
            onMouseMove={(e) => {
              const el = e.currentTarget;
              if (el.dataset.isDown !== 'true') return;
              e.preventDefault();
              const x = e.pageX - el.offsetLeft;
              const walk = (x - Number(el.dataset.startX)) * 1.5; // 1.5x multiplier
              el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
            }}
          >
            {items.map(item => (
              <div key={item.id} className="flex-shrink-0 snap-start w-[280px] md:w-[300px]">
                {/* Card content */}
              </div>
            ))}
            {/* End spacer for partial peek */}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>

      {/* CSS để ẩn scrollbar trên webkit browsers */}
      <style>{`
        #${carouselId}::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
```

### Mouse Drag Scroll Pattern

**Tại sao cần?** Native scroll chỉ work với touch/trackpad, mouse wheel. Cần thêm mouse drag cho desktop UX tốt hơn.

```tsx
// Mouse Drag Handlers - thêm vào scrollable container
onMouseDown={(e) => {
  const el = e.currentTarget;
  el.dataset.isDown = 'true';
  el.dataset.startX = String(e.pageX - el.offsetLeft);
  el.dataset.scrollLeft = String(el.scrollLeft);
  el.style.scrollBehavior = 'auto'; // Tắt smooth để drag mượt
}}
onMouseLeave={(e) => {
  e.currentTarget.dataset.isDown = 'false';
  e.currentTarget.style.scrollBehavior = 'smooth';
}}
onMouseUp={(e) => {
  e.currentTarget.dataset.isDown = 'false';
  e.currentTarget.style.scrollBehavior = 'smooth';
}}
onMouseMove={(e) => {
  const el = e.currentTarget;
  if (el.dataset.isDown !== 'true') return;
  e.preventDefault();
  const x = e.pageX - el.offsetLeft;
  const walk = (x - Number(el.dataset.startX)) * 1.5; // Multiplier cho feel tốt
  el.scrollLeft = Number(el.dataset.scrollLeft) - walk;
}}

// CSS classes cần thêm
className="cursor-grab active:cursor-grabbing select-none"
```

### Button type="button" trong Preview (CRITICAL)

**Problem:** Buttons trong popup preview không có `type="button"` sẽ **trigger form submission** khi click, gây submit form không mong muốn.

**Nguyên nhân:** Default type của `<button>` trong HTML là `type="submit"`. Khi button nằm trong `<form>`, click sẽ submit form.

```tsx
// ❌ SAI - Button trigger form submission
<button onClick={handleClick}>
  <ChevronLeft size={18} />
</button>

// ✅ ĐÚNG - Button KHÔNG trigger form submission
<button type="button" onClick={handleClick}>
  <ChevronLeft size={18} />
</button>
```

**Quy tắc:** TẤT CẢ buttons trong Preview components (navigation arrows, play/pause, close modal, style selector, device toggle...) PHẢI có `type="button"`.

**Checklist Buttons trong Preview:**
- [ ] Navigation buttons (< >) có `type="button"`
- [ ] Play/Pause buttons có `type="button"`
- [ ] Close/dismiss buttons có `type="button"`
- [ ] Style selector buttons có `type="button"`
- [ ] Device toggle buttons có `type="button"`
- [ ] Any button trong popup/modal có `type="button"`

**Ví dụ đầy đủ:**
```tsx
// Navigation buttons trong carousel
<button 
  type="button"  // ← CRITICAL
  onClick={() => {
    const container = document.getElementById(carouselId);
    if (container) container.scrollBy({ left: -cardWidth - gap, behavior: 'smooth' });
  }}
  className="w-10 h-10 rounded-full flex items-center justify-center"
>
  <ChevronLeft size={18} />
</button>

// Play/Pause button
<button 
  type="button"  // ← CRITICAL
  onClick={() => setIsPlaying(!isPlaying)}
  className="absolute bottom-4 right-4 p-2 rounded-full bg-white/80"
>
  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
</button>

// Style selector button
<button
  type="button"  // ← CRITICAL
  onClick={() => onStyleChange?.('grid')}
  className={cn("px-3 py-1 rounded", selectedStyle === 'grid' && "bg-blue-500 text-white")}
>
  Grid
</button>
```

---

### Hidden Scrollbar CSS (CRITICAL)

**Problem:** `scrollbarWidth: 'none'` không work cho webkit browsers (Chrome, Safari, Edge)

```tsx
// ❌ KHÔNG ĐỦ - chỉ work cho Firefox
style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}

// ✅ ĐÚNG - thêm CSS cho webkit
<style>{`
  .my-carousel::-webkit-scrollbar {
    display: none;
  }
`}</style>

// Hoặc dùng class + global CSS
// globals.css
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

### CSS Animation (Marquee)

```tsx
// Keyframes cho marquee - translateX(-50%) vì items duplicate
<style>{`
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`}</style>
```

### Checklist Carousel/Marquee Hoàn Chỉnh

**Container & Layout:**
- [ ] Outer container có `max-w-7xl mx-auto px-4` (hoặc tương đương)
- [ ] Inner container có `overflow-hidden rounded-xl`
- [ ] Gradient fade edges nằm TRONG overflow-hidden container
- [ ] Section có `overflow-hidden` nếu animation có thể tràn

**Navigation:**
- [ ] Navigation buttons < > cho desktop
- [ ] Buttons chỉ hiện khi items.length > 2
- [ ] Buttons dùng `scrollBy()` với `behavior: 'smooth'`
- [ ] **⚠️ CRITICAL: Buttons phải có `type="button"`** (xem section bên dưới)

**Scrolling:**
- [ ] Mouse drag scroll với onMouseDown/Move/Up/Leave
- [ ] `cursor-grab active:cursor-grabbing select-none`
- [ ] Touch scroll native (không cần code thêm)
- [ ] Snap scroll với `snap-x snap-mandatory` và `snap-start`

**Hidden Scrollbar:**
- [ ] `scrollbarWidth: 'none'` cho Firefox
- [ ] `msOverflowStyle: 'none'` cho IE/Edge cũ
- [ ] CSS `::-webkit-scrollbar { display: none }` cho Chrome/Safari/Edge mới

**Animation (nếu marquee):**
- [ ] Items được duplicate `[...items, ...items]`
- [ ] `translateX(-50%)` khớp với duplicate ratio
- [ ] `animation: marquee Xs linear infinite`

**Testing:**
- [ ] Test trên mobile - không có horizontal scrollbar
- [ ] Test mouse drag trên desktop
- [ ] Test navigation buttons
- [ ] Test touch scroll trên mobile/tablet

---

## Drag & Drop (nếu có items)

### Recommended: useDragReorder Hook

```tsx
const [draggedId, setDraggedId] = useState<number | null>(null);
const [dragOverId, setDragOverId] = useState<number | null>(null);

const dragProps = (id: number) => ({
  draggable: true,
  onDragStart: () => setDraggedId(id),
  onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
  onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) setDragOverId(id); },
  onDrop: (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;
    const newItems = [...items];
    const [moved] = newItems.splice(items.findIndex(i => i.id === draggedId), 1);
    newItems.splice(items.findIndex(i => i.id === id), 0, moved);
    setItems(newItems);
    setDraggedId(null); setDragOverId(null);
  }
});

// Usage
<div {...dragProps(item.id)} className={cn(
  "cursor-grab",
  draggedId === item.id && "opacity-50",
  dragOverId === item.id && "ring-2 ring-blue-500"
)}>
  <GripVertical className="flex-shrink-0" /> {/* content */}
</div>
```

---

## Dependent Fields (Style-specific Config)

**CRITICAL**: Tránh hardcode text/links trong styles. Nếu một style có nội dung đặc thù (CTA button, description, links...), PHẢI tạo config fields và chỉ hiển thị khi chọn style đó.

### Khi nào cần Dependent Fields?

| Style có... | Cần config |
|-------------|------------|
| CTA Button | `buttonText`, `buttonLink` |
| Description riêng | `description` |
| Secondary Button | `secondaryButtonText`, `secondaryButtonLink` |
| Badge/Label | `badge` |
| Custom heading | `subHeading` |

### Pattern Implementation

#### 1. Định nghĩa Config Type (previews.tsx)

```tsx
export type ComponentConfig = { 
  description?: string; 
  buttonText?: string; 
  buttonLink?: string;
};

export const ComponentPreview = ({ 
  items, brandColor, selectedStyle, onStyleChange, config 
}: { 
  items: Item[]; 
  brandColor: string; 
  selectedStyle?: ComponentStyle; 
  onStyleChange?: (style: ComponentStyle) => void;
  config?: ComponentConfig;  // Thêm config prop
}) => {
```

#### 2. Sử dụng trong Preview

```tsx
// Style có CTA - dùng config thay vì hardcode
const renderTwoColumnStyle = () => (
  <div>
    <p>{config?.description || 'Mô tả mặc định'}</p>
    
    {/* Chỉ render button nếu có buttonText */}
    {config?.buttonText && (
      <a href={config?.buttonLink || '#'}>
        {config.buttonText}
      </a>
    )}
  </div>
);
```

#### 3. Create Page - Conditional Form

```tsx
// State cho config
const [componentConfig, setComponentConfig] = useState<ComponentConfig>({
  description: 'Mô tả mặc định',
  buttonText: 'Liên hệ',
  buttonLink: '/lien-he'
});

// Form CHỈ hiển thị khi chọn style cần config
{style === 'two-column' && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Cấu hình style 2 Cột</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Mô tả ngắn</Label>
        <Input 
          value={componentConfig.description || ''} 
          onChange={(e) => setComponentConfig({...componentConfig, description: e.target.value})} 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nút CTA - Text</Label>
          <Input 
            value={componentConfig.buttonText || ''} 
            onChange={(e) => setComponentConfig({...componentConfig, buttonText: e.target.value})} 
          />
        </div>
        <div>
          <Label>Nút CTA - Link</Label>
          <Input 
            value={componentConfig.buttonLink || ''} 
            onChange={(e) => setComponentConfig({...componentConfig, buttonLink: e.target.value})} 
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">Để trống nếu không muốn hiển thị nút</p>
    </CardContent>
  </Card>
)}

// Submit với config
const onSubmit = (e: React.FormEvent) => {
  handleSubmit(e, { 
    items: items.map(i => ({...})), 
    style,
    ...componentConfig  // Spread config vào payload
  });
};

// Preview với config
<ComponentPreview 
  items={items} 
  brandColor={brandColor} 
  selectedStyle={style} 
  onStyleChange={setStyle}
  config={componentConfig}  // Pass config
/>
```

#### 4. Edit Page - Load & Save Config

```tsx
// State
const [componentConfig, setComponentConfig] = useState<ComponentConfig>({});

// useEffect - load config
case 'ComponentName':
  setItems(config.items?.map(...) || []);
  setStyle((config.style as ComponentStyle) || 'default');
  setComponentConfig({
    description: config.description || '',
    buttonText: config.buttonText || '',
    buttonLink: config.buttonLink || ''
  });
  break;

// buildConfig - save config
case 'ComponentName':
  return { 
    items: items.map(...), 
    style, 
    ...componentConfig  // Include config in save
  };
```

#### 5. ComponentRenderer - Use Config

```tsx
function ComponentSection({ config, brandColor, title }) {
  const items = (config.items as Array<...>) || [];
  const style = (config.style as ComponentStyle) || 'default';
  
  // Extract config fields
  const description = (config.description as string) || '';
  const buttonText = (config.buttonText as string) || '';
  const buttonLink = (config.buttonLink as string) || '';

  if (style === 'two-column') {
    return (
      <section>
        <p>{description || 'Default description'}</p>
        {buttonText && (
          <a href={buttonLink || '#'}>{buttonText}</a>
        )}
      </section>
    );
  }
  // ...
}
```

### Ví dụ thực tế: FAQ Two-Column Style

**Trước (hardcode - BAD):**
```tsx
<p>Tìm câu trả lời cho các thắc mắc phổ biến của bạn</p>
<button>Liên hệ hỗ trợ</button>
```

**Sau (config - GOOD):**
```tsx
<p>{config?.description || 'Tìm câu trả lời...'}</p>
{config?.buttonText && (
  <a href={config?.buttonLink || '#'}>{config.buttonText}</a>
)}
```

### Checklist Dependent Fields

- [ ] Xác định styles nào có nội dung đặc thù
- [ ] Định nghĩa `Config` type với optional fields
- [ ] Thêm `config` prop vào Preview component
- [ ] Form config chỉ show khi `style === 'specific-style'`
- [ ] Submit spread `...config` vào payload
- [ ] Edit page load config từ DB
- [ ] ComponentRenderer extract và sử dụng config
- [ ] Fallback cho missing config values

---

## Existing Components Status

### Đã đủ 6 styles ✅
- Hero Banner: slider, fade, bento, fullscreen, split, parallax
- Stats: horizontal, cards, icons, gradient, minimal, counter
- ProductList/ServiceList: commerce, minimal, bento, carousel, compact, showcase
- Gallery: spotlight, explore, stories, grid, marquee, masonry ✅
- Partners: grid, marquee, mono, badge, carousel, featured ✅
- Services/Benefits: elegantGrid, modernList, bigNumber, cards, carousel, timeline ✅

### Cần bổ sung thêm styles ❌
- FAQ: 6 styles (accordion, cards, two-column, minimal, timeline, tabbed) ✅
- Testimonials: 6 styles (cards, slider, masonry, quote, carousel, minimal) ✅
- Pricing: 3 styles → cần thêm 3 (comparison, featured, compact)

---

## Testing Checklist

### Functionality
- [ ] Create page render đúng
- [ ] **6 styles preview**, responsive (desktop/tablet/mobile)
- [ ] Edit page load/save đúng
- [ ] ComponentRenderer render đúng **tất cả 6 styles**
- [ ] **⚠️ Fallback order**: Tất cả `if (style === '...')` đặt TRƯỚC default return
- [ ] **⚠️ Test mỗi style trên trang chủ thật** (không chỉ preview) - chọn style trong edit → verify trên homepage
- [ ] Drag & drop hoạt động (nếu có)
- [ ] **⚠️ Buttons trong preview có `type="button"`** - click không trigger form submission

### Brand Color Sync (CRITICAL)
- [ ] **Preview = Frontend** về visual output
- [ ] Monochromatic: chỉ dùng 1 brandColor + opacity
- [ ] Border: `15` default, `40` hover
- [ ] Shadow: `10` default, `20` hover
- [ ] Price/icons/CTA dùng brandColor 100%
- [ ] Test với nhiều màu khác nhau

### Typography & Overflow
- [ ] Không có text rớt dòng không chủ đích
- [ ] Long text được truncate/line-clamp
- [ ] Button text có whitespace-nowrap
- [ ] Mobile không bị overflow horizontal

### Edge Cases
- [ ] Empty state hiển thị đẹp
- [ ] Missing image có placeholder
- [ ] Missing text có fallback
- [ ] 1-2 items: centered layout
- [ ] Quá nhiều items: "+N mục khác"

### Image (nếu có)
- [ ] Form upload hỗ trợ: paste link, upload file, drag & drop
- [ ] Mỗi style có hướng dẫn tỉ lệ ảnh cụ thể
- [ ] **Info bar hiển thị kích thước ảnh tối ưu** (không chỉ "N ảnh")
- [ ] Image được process: WebP 85%, sharp resize
- [ ] Cleanup observer xóa ảnh không dùng

---

## Lưu ý quan trọng

1. **Tất cả previews trong `previews.tsx`** - không tạo file riêng
2. **Export Style type** - dùng ở cả create và edit
3. **useBrandColor()** - không hardcode màu
4. **BẮT BUỘC 6 styles** - không ít hơn
5. **Monochromatic only** - 1 brandColor + tints/shades
6. **Responsive first** - test cả 3 devices
7. **Commit sau mỗi step**

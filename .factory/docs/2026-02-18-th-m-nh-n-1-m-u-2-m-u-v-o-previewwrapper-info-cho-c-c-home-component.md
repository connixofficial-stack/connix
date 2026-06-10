
## Vấn đề

Commit `d1e2f72` đã Việt hóa nhãn mode (single/dual) thành `1 màu`/`2 màu` trong `CTAPreview` và `FaqPreview`. Cần làm tương tự cho 7 component còn lại có `mode` prop.

## Scope - 7 file cần sửa

| File | `info` hiện tại | `info` sau khi sửa |
|---|---|---|
| `hero/_components/HeroPreview.tsx` | `Slide X / Y` hoặc `undefined` | `Slide X / Y • 1 màu` / `Slide X / Y • 2 màu` |
| `stats/_components/StatsPreview.tsx` | `${n} số liệu` | `${n} số liệu • 1 màu` / `${n} số liệu • 2 màu` |
| `partners/_components/PartnersPreview.tsx` | `${n} logo` | `${n} logo • 1 màu` / `${n} logo • 2 màu` |
| `footer/_components/FooterPreview.tsx` | không có | `1 màu` / `2 màu` |
| `gallery/_components/GalleryPreview.tsx` | image size info | `{imageInfo} • 1 màu` / `{imageInfo} • 2 màu` |
| `gallery/_components/TrustBadgesPreview.tsx` | `${n} chứng nhận` | `${n} chứng nhận • 1 màu` / `${n} chứng nhận • 2 màu` |
| `product-categories/_components/ProductCategoriesPreview.tsx` | `${n} danh mục • Ảnh: ...` | `${n} danh mục • ... • 1 màu` / `... • 2 màu` |

## Chi tiết thay đổi từng file

### 1. `HeroPreview.tsx` (dòng ~46)
```tsx
// Cũ:
const info = previewStyle !== 'bento' ? `Slide ${currentSlide + 1} / ${slides.length || 1}` : undefined;

// Mới:
const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
const info = previewStyle !== 'bento' ? `Slide ${currentSlide + 1} / ${slides.length || 1} • ${modeLabel}` : modeLabel;
```

### 2. `StatsPreview.tsx` (dòng ~37)
```tsx
// Cũ:
const info = `${items.filter((item) => item.value || item.label).length} số liệu`;

// Mới:
const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
const info = `${items.filter((item) => item.value || item.label).length} số liệu • ${modeLabel}`;
```

### 3. `PartnersPreview.tsx` (dòng ~184 - `info` prop trên PreviewWrapper)
```tsx
// Cũ:
info={`${items.length} logo`}

// Mới:
info={`${items.length} logo • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
```

### 4. `FooterPreview.tsx` (dòng ~359 - PreviewWrapper không có `info` prop)
```tsx
// Thêm vào PreviewWrapper:
info={mode === 'dual' ? '2 màu' : '1 màu'}
```

### 5. `GalleryPreview.tsx` (dòng ~504 - `info` prop)
```tsx
// Cũ:
info={getGalleryImageSizeInfo()}

// Mới (update getGalleryImageSizeInfo hoặc thay trực tiếp):
info={`${getGalleryImageSizeInfo()} • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
```

### 6. `TrustBadgesPreview.tsx` (dòng ~498 - `info` prop)
```tsx
// Cũ:
info={`${items.length} chứng nhận`}

// Mới:
info={`${items.length} chứng nhận • ${mode === 'dual' ? '2 màu' : '1 màu'}`}
```

### 7. `ProductCategoriesPreview.tsx` - update `getPreviewInfo()` (dòng ~645)
```tsx
const getPreviewInfo = () => {
  const count = resolvedCategories.length;
  const modeLabel = mode === 'dual' ? '2 màu' : '1 màu';
  if (count === 0) { return `Chưa có danh mục • ${modeLabel}`; }
  
  const sizeRecommendations: Record<string, string> = {
    cards: `${count} danh mục • Ảnh: 200×200px (1:1) • ${modeLabel}`,
    carousel: `${count} danh mục • Ảnh: 300×300px (1:1) • ${modeLabel}`,
    ...
  };
  return sizeRecommendations[previewStyle] || `${count} danh mục • ${modeLabel}`;
};
```

## Không thay đổi
- Logic màu sắc, validation, color panels
- `ProductListPreview` (không có `mode`)
- `ServiceListPreview`, `BlogPreview`, `CaseStudyPreview`... (không có `mode`)

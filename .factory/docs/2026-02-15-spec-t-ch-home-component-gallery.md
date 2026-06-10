# Spec: Tách Home Component Gallery

## Tổng quan
Tách Gallery component từ file monolithic (`previews.tsx` + `[id]/edit/page.tsx`) thành module feature-based theo pattern Hero đã chuẩn hóa.

**Gallery hỗ trợ 3 component types:**
- `Gallery` (Thư viện ảnh) - 6 styles: spotlight, explore, stories, grid, marquee, masonry
- `Partners` (Đối tác/Logos) - 6 styles: grid, marquee, mono, badge, carousel, featured  
- `TrustBadges` (Chứng nhận) - riêng preview (TrustBadgesPreview)

## Implementation Plan (10 bước)

### 1. Khảo sát code hiện tại
**Files cần đọc:**
- `app/admin/home-components/previews.tsx` → `GalleryPreview`, `TrustBadgesPreview`, types `GalleryStyle`, `TrustBadgesStyle`, interface `GalleryItem`
- `app/admin/home-components/[id]/edit/page.tsx` → logic render Gallery/Partners/TrustBadges form + state
- `app/admin/home-components/create/gallery/page.tsx` → form create logic, MultiImageUploader config

**Logic cần ghi lại:**
- Types: `GalleryStyle`, `GalleryItem` (có `id`, `url`, `link`, `name?`)
- Constants: style lists cho Gallery (6 styles) và TrustBadges
- Preview render: `GalleryPreview` với `componentType` prop phân biệt Gallery/Partners
- Form: MultiImageUploader với extraFields khác nhau theo type (Partners có link, TrustBadges có name)
- Conditional rendering theo `componentType` (`Gallery` | `Partners` | `TrustBadges`)

### 2. Tạo structure module
```
app/admin/home-components/gallery/
├── [id]/edit/page.tsx
├── _types/index.ts
├── _lib/constants.ts
└── _components/
    ├── GalleryPreview.tsx
    ├── TrustBadgesPreview.tsx
    └── GalleryForm.tsx
```

### 3. Tách types → `_types/index.ts`
```ts
'use client';

import type { ImageItem } from '../../../components/MultiImageUploader';

export type GalleryStyle = 'spotlight' | 'explore' | 'stories' | 'grid' | 'marquee' | 'masonry';
export type TrustBadgesStyle = 'cards' | 'grid' | 'minimal'; // từ TrustBadgesPreview

export interface GalleryItem extends ImageItem {
  id: string | number;
  url: string;
  link: string;
  name?: string; // chỉ dùng cho TrustBadges
}
```

### 4. Tách constants → `_lib/constants.ts`
```ts
'use client';

export const GALLERY_STYLES = [
  { id: 'spotlight' as const, label: 'Tiêu điểm' },
  { id: 'explore' as const, label: 'Khám phá' },
  { id: 'stories' as const, label: 'Câu chuyện' },
  { id: 'grid' as const, label: 'Grid' },
  { id: 'marquee' as const, label: 'Marquee' },
  { id: 'masonry' as const, label: 'Masonry' },
];

export const TRUST_BADGES_STYLES = [
  { id: 'cards' as const, label: 'Cards' },
  { id: 'grid' as const, label: 'Grid' },
  { id: 'minimal' as const, label: 'Minimal' },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  { id: 'item-1', link: '', name: '', url: '' },
  { id: 'item-2', link: '', name: '', url: '' },
];
```

### 5. Tách Preview component

**File 1: `_components/GalleryPreview.tsx`**
- Copy toàn bộ logic `GalleryPreview` từ `previews.tsx`
- Import `PreviewWrapper`, `BrowserFrame`, `PreviewImage` từ `_shared/components`
- Import `usePreviewDevice` từ `_shared/hooks`
- Giữ nguyên props: `{ items, brandColor, secondary, selectedStyle, onStyleChange, componentType }`
- Áp dụng dual brand colors (primary brandColor, secondary)
- Giữ nguyên 6 render functions cho 6 styles

**File 2: `_components/TrustBadgesPreview.tsx`**
- Copy toàn bộ logic `TrustBadgesPreview` từ `previews.tsx`
- Import shared components
- Giữ nguyên props: `{ items, brandColor, secondary, selectedStyle, onStyleChange }`

**Lưu ý:** Không thay đổi behaviour, chỉ move code sang file mới

### 6. Tách Form component → `_components/GalleryForm.tsx`

**Props:**
```ts
{
  galleryItems: GalleryItem[];
  setGalleryItems: (items: GalleryItem[]) => void;
  componentType: 'Gallery' | 'Partners' | 'TrustBadges';
}
```

**Logic:**
- Sử dụng `MultiImageUploader` với config khác nhau theo `componentType`:
  - **Gallery**: folder `'gallery'`, aspectRatio `'video'`, columns `2`, không có extraFields
  - **Partners**: folder `'partners'`, aspectRatio `'video'`, columns `2`, extraFields `[{ key: 'link', placeholder: 'Link website đối tác (tùy chọn)', type: 'url' }]`
  - **TrustBadges**: folder `'trust-badges'`, aspectRatio `'square'`, columns `3`, extraFields `[{ key: 'name', placeholder: 'Tên chứng nhận/bằng cấp', type: 'text' }]`
- Conditional title theo `componentType`
- Giữ nguyên Image Guidelines section cho Gallery và Partners (đoạn code dài với style guidelines)

### 7. Tạo route edit mới → `gallery/[id]/edit/page.tsx`

**Cấu trúc:**
```tsx
'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../components/ui';
import { useBrandColors } from '../../../create/shared';
import { GalleryPreview } from '../_components/GalleryPreview';
import { TrustBadgesPreview } from '../_components/TrustBadgesPreview';
import { GalleryForm } from '../_components/GalleryForm';
import type { GalleryItem, GalleryStyle, TrustBadgesStyle } from '../_types';
import { GALLERY_STYLES, TRUST_BADGES_STYLES, DEFAULT_GALLERY_ITEMS } from '../_lib/constants';

export default function GalleryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { primary, secondary } = useBrandColors();
  
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateComponent = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [galleryStyle, setGalleryStyle] = useState<GalleryStyle>('spotlight');
  const [trustBadgesStyle, setTrustBadgesStyle] = useState<TrustBadgesStyle>('cards');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data từ component
  useEffect(() => {
    if (!component) return;
    setTitle(component.title || '');
    setActive(component.active ?? true);
    
    const content = component.content as { items?: GalleryItem[]; style?: GalleryStyle | TrustBadgesStyle };
    if (content?.items) {
      setGalleryItems(content.items.map((item, idx) => ({ 
        ...item, 
        id: item.id || `item-${idx + 1}` 
      })));
    }
    if (content?.style) {
      if (component.type === 'TrustBadges') {
        setTrustBadgesStyle(content.style as TrustBadgesStyle);
      } else {
        setGalleryStyle(content.style as GalleryStyle);
      }
    }
  }, [component]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const finalStyle = component?.type === 'TrustBadges' ? trustBadgesStyle : galleryStyle;
      await updateComponent({
        id: id as Id<'homeComponents'>,
        title,
        active,
        content: {
          items: galleryItems.map(g => ({ link: g.link, name: g.name, url: g.url })),
          style: finalStyle,
        },
      });
      toast.success('Đã lưu thay đổi!');
    } catch (error) {
      toast.error('Lỗi khi lưu: ' + String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const componentType = component?.type as 'Gallery' | 'Partners' | 'TrustBadges' | undefined;

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chỉnh sửa {componentType === 'Gallery' ? 'Thư viện ảnh' : componentType === 'Partners' ? 'Đối tác' : 'Chứng nhận'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <Label>Hiển thị trên website</Label>
          </div>
        </CardContent>
      </Card>

      {/* Layout 2 cột: Form + Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {componentType && (
            <GalleryForm 
              galleryItems={galleryItems}
              setGalleryItems={setGalleryItems}
              componentType={componentType}
            />
          )}
        </div>

        {/* Preview (sticky) */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          {componentType === 'TrustBadges' ? (
            <TrustBadgesPreview 
              items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, name: item.name, url: item.url }))}
              brandColor={primary}
              secondary={secondary}
              selectedStyle={trustBadgesStyle}
              onStyleChange={setTrustBadgesStyle}
            />
          ) : (
            <GalleryPreview 
              items={galleryItems.map((item, idx) => ({ id: idx + 1, link: item.link, url: item.url }))}
              brandColor={primary}
              secondary={secondary}
              componentType={componentType}
              selectedStyle={galleryStyle}
              onStyleChange={setGalleryStyle}
            />
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  );
}
```

### 8. Redirect từ route cũ → `[id]/edit/page.tsx`

Thêm vào đầu component function (sau khi parse `params`):
```tsx
// Redirect Gallery/Partners/TrustBadges to dedicated route
useEffect(() => {
  if (!component) return;
  if (['Gallery', 'Partners', 'TrustBadges'].includes(component.type)) {
    router.replace(`/admin/home-components/gallery/${id}/edit`);
  }
}, [component, id, router]);
```

### 9. Cleanup code cũ

**File `previews.tsx`:**
- Xóa: `interface GalleryItem`, `export type GalleryStyle`, `export type TrustBadgesStyle`
- Xóa: `GalleryLightbox` component (nếu chỉ dùng cho Gallery)
- Xóa: `export const GalleryPreview = ...` (toàn bộ function)
- Xóa: `export const TrustBadgesPreview = ...` (toàn bộ function)

**File `[id]/edit/page.tsx`:**
- Xóa import: `GalleryPreview`, `TrustBadgesPreview`, `GalleryStyle`, `TrustBadgesStyle`
- Xóa: interface `GalleryItem` (line ~100)
- Xóa: state `galleryItems`, `galleryStyle` trong main component
- Xóa: phần render `GalleryPreview` và `TrustBadgesPreview` trong conditional blocks
- Xóa: phần form Gallery/Partners/TrustBadges (MultiImageUploader + Image Guidelines)

### 10. Test & Commit

**Checklist test:**
- [ ] `/admin/home-components/gallery/[id]/edit` load đúng data
- [ ] Form hiển thị đúng fields theo componentType (Gallery/Partners/TrustBadges)
- [ ] Preview render đúng 6 styles cho Gallery/Partners
- [ ] Preview render đúng cho TrustBadges
- [ ] Lưu thành công, data update đúng vào Convex
- [ ] Responsive: Desktop/Tablet/Mobile preview hoạt động
- [ ] Route cũ redirect sang route mới khi type là Gallery/Partners/TrustBadges
- [ ] Không còn Gallery code trong `previews.tsx` và `[id]/edit/page.tsx`

**Commit message:**
```
refactor(home-components): split gallery module

- Tạo gallery/[id]/edit route riêng
- Tách GalleryPreview, TrustBadgesPreview, GalleryForm
- Support 3 types: Gallery, Partners, TrustBadges
- Cleanup code trong previews.tsx và edit page
```

**LƯU Ý QUAN TRỌNG:**
- KHÔNG chạy `bunx oxlint`, `bun run lint`, `bunx tsc --noEmit`
- KHÔNG commit (tránh xung đột khi chạy song song)

## Files sẽ tạo mới (5 files)
1. `app/admin/home-components/gallery/_types/index.ts`
2. `app/admin/home-components/gallery/_lib/constants.ts`
3. `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
4. `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx`
5. `app/admin/home-components/gallery/_components/GalleryForm.tsx`
6. `app/admin/home-components/gallery/[id]/edit/page.tsx`

## Files sẽ chỉnh sửa (2 files)
1. `app/admin/home-components/previews.tsx` - xóa Gallery/TrustBadges code
2. `app/admin/home-components/[id]/edit/page.tsx` - thêm redirect + xóa Gallery/TrustBadges code
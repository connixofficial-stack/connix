# Plan: Tách Hero Component Ra Khỏi File Monolithic

## 🎯 Mục tiêu
Tách Hero component từ file 4014 dòng (`edit/page.tsx`) và 13864 dòng (`previews.tsx`) thành cấu trúc module riêng biệt, dễ bảo trì, theo **Feature-Based Architecture** + **Colocation Pattern** (best practice hiện đại).

## 📊 Phân tích hiện tại
- **File edit/page.tsx**: 4014 dòng - chứa logic edit cho 31 component types
- **File previews.tsx**: 13864 dòng - chứa 27 preview components
- **Hero component** bao gồm:
  - Types: `HeroStyle`, `HeroContent`, `HeroSlide`
  - Preview: `HeroBannerPreview` (6 styles: slider, fade, bento, fullscreen, split, parallax)
  - Form logic: heroSlides state, heroStyle state, heroContent state, initialization, save logic

## 🏗️ Kiến trúc mới (Best Practice)

### Pattern: **Feature-Based + Colocation**
```
app/admin/home-components/
├── _shared/                          # Shared utilities
│   ├── components/
│   │   ├── PreviewWrapper.tsx        # Device toggle + browser frame
│   │   ├── PreviewImage.tsx          # Image helper
│   │   └── BrowserFrame.tsx
│   └── hooks/
│       └── usePreviewDevice.tsx
├── hero/
│   ├── [id]/
│   │   └── edit/
│   │       └── page.tsx              # Hero edit route
│   ├── _components/
│   │   ├── HeroPreview.tsx           # 6 preview styles
│   │   ├── HeroForm.tsx              # Form fields
│   │   └── HeroSlideEditor.tsx       # Slide management UI
│   ├── _types/
│   │   └── index.ts                  # HeroStyle, HeroContent, HeroSlide
│   └── _lib/
│       ├── constants.ts              # Default values, style configs
│       └── helpers.ts                # Validation, normalization
└── [id]/edit/page.tsx                # Route cũ (sau này refactor 30 components còn lại)
```

### Lợi ích:
✅ **Separation of Concerns**: Mỗi component type có folder riêng  
✅ **Colocation**: Code liên quan gần nhau (form, preview, types, helpers cùng folder)  
✅ **Reusability**: Shared components dùng chung cho tất cả component types  
✅ **Scalability**: Dễ dàng tách 30 components còn lại theo cùng pattern  
✅ **Type Safety**: Types tách riêng, dễ import/maintain  
✅ **Code Splitting**: Next.js tự động code-split theo route  

## 📝 Chi tiết từng bước

### **Bước 1: Tạo shared components** (Foundation)
**File**: `app/admin/home-components/_shared/components/PreviewWrapper.tsx`
```tsx
// Extract từ previews.tsx (lines 77-104)
// Bao gồm: device toggle, style selector, browser frame wrapper
export const PreviewWrapper = ({ title, children, device, setDevice, ... }) => { ... }
```

**File**: `app/admin/home-components/_shared/components/PreviewImage.tsx`
```tsx
// Extract từ previews.tsx (lines 27-42)
export const PreviewImage = ({ src, alt, width, height, ...rest }: PreviewImageProps) => { ... }
```

**File**: `app/admin/home-components/_shared/components/BrowserFrame.tsx`
```tsx
// Extract từ previews.tsx (lines 56-70)
export const BrowserFrame = ({ children, url }: { children: ReactNode; url?: string }) => { ... }
```

**File**: `app/admin/home-components/_shared/hooks/usePreviewDevice.tsx`
```tsx
export const usePreviewDevice = () => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  return { device, setDevice };
};
```

---

### **Bước 2: Tạo Hero types & constants**
**File**: `app/admin/home-components/hero/_types/index.ts`
```tsx
// Extract từ previews.tsx (lines 139-147)
export type HeroStyle = 'slider' | 'fade' | 'bento' | 'fullscreen' | 'split' | 'parallax';
export interface HeroContent { badge?: string; heading?: string; ... }

// Extract từ edit/page.tsx (lines 105-109)
export interface HeroSlide extends ImageItem {
  id: string | number;
  url: string;
  link: string;
}
```

**File**: `app/admin/home-components/hero/_lib/constants.ts`
```tsx
export const HERO_STYLES = [
  { id: 'slider' as const, label: 'Slider' },
  { id: 'fade' as const, label: 'Fade' },
  ...
];

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge: 'Nổi bật',
  heading: 'Khám phá bộ sưu tập mới nhất',
  description: 'Sản phẩm chất lượng cao với giá thành hợp lý',
  primaryButtonText: 'Khám phá ngay',
  secondaryButtonText: 'Tìm hiểu thêm',
  countdownText: 'Còn 3 ngày',
};
```

---

### **Bước 3: Tạo HeroPreview component**
**File**: `app/admin/home-components/hero/_components/HeroPreview.tsx`
```tsx
// Extract TOÀN BỘ HeroBannerPreview từ previews.tsx (lines 150-707)
// ~560 dòng code preview cho 6 styles
import { PreviewWrapper, PreviewImage, BrowserFrame } from '../../_shared/components';
import { usePreviewDevice } from '../../_shared/hooks';
import type { HeroStyle, HeroContent, HeroSlide } from '../_types';
import { HERO_STYLES } from '../_lib/constants';

export const HeroPreview = ({ slides, brandColor, secondary, selectedStyle, onStyleChange, content }) => {
  const { device, setDevice } = usePreviewDevice();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const renderSliderStyle = () => { ... };
  const renderFadeStyle = () => { ... };
  const renderBentoStyle = () => { ... };
  const renderFullscreenStyle = () => { ... };
  const renderSplitStyle = () => { ... };
  const renderParallaxStyle = () => { ... };

  return (
    <PreviewWrapper
      title="Preview Hero Banner"
      device={device}
      setDevice={setDevice}
      previewStyle={selectedStyle}
      setPreviewStyle={onStyleChange}
      styles={HERO_STYLES}
    >
      <BrowserFrame>
        {selectedStyle === 'slider' && renderSliderStyle()}
        {selectedStyle === 'fade' && renderFadeStyle()}
        {/* ... các styles khác */}
      </BrowserFrame>
    </PreviewWrapper>
  );
};
```

---

### **Bước 4: Tạo HeroForm component**
**File**: `app/admin/home-components/hero/_components/HeroForm.tsx`
```tsx
// Extract form UI từ edit/page.tsx (phần render Hero form)
import { HeroSlideEditor } from './HeroSlideEditor';
import type { HeroStyle, HeroContent, HeroSlide } from '../_types';
import { HERO_STYLES, DEFAULT_HERO_CONTENT } from '../_lib/constants';

export const HeroForm = ({
  heroSlides,
  setHeroSlides,
  heroStyle,
  setHeroStyle,
  heroContent,
  setHeroContent,
}: HeroFormProps) => {
  const needsContent = ['fullscreen', 'split', 'parallax'].includes(heroStyle);
  
  return (
    <>
      {/* Style selector */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kiểu hiển thị</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={heroStyle} onValueChange={setHeroStyle}>
            {HERO_STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
          </Select>
        </CardContent>
      </Card>

      {/* Slide editor */}
      <HeroSlideEditor slides={heroSlides} onChange={setHeroSlides} />

      {/* Content editor (conditional) */}
      {needsContent && (
        <Card>
          <CardHeader><CardTitle>Nội dung Hero</CardTitle></CardHeader>
          <CardContent>
            {/* Form fields cho badge, heading, description, buttons */}
          </CardContent>
        </Card>
      )}
    </>
  );
};
```

**File**: `app/admin/home-components/hero/_components/HeroSlideEditor.tsx`
```tsx
// Component quản lý danh sách slides (add, remove, reorder, upload)
import { MultiImageUploader } from '@/components/MultiImageUploader';
import type { HeroSlide } from '../_types';

export const HeroSlideEditor = ({ slides, onChange }: { slides: HeroSlide[]; onChange: (slides: HeroSlide[]) => void }) => {
  const addSlide = () => { ... };
  const removeSlide = (id: string) => { ... };
  const updateSlide = (id: string, updates: Partial<HeroSlide>) => { ... };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Slides</CardTitle>
      </CardHeader>
      <CardContent>
        {slides.map(slide => (
          <div key={slide.id}>
            <ImageFieldWithUpload value={slide.url} onChange={(url) => updateSlide(slide.id, { url })} />
            <Input placeholder="Link" value={slide.link} onChange={(e) => updateSlide(slide.id, { link: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => removeSlide(slide.id)}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        <Button onClick={addSlide}><Plus /> Thêm slide</Button>
      </CardContent>
    </Card>
  );
};
```

---

### **Bước 5: Tạo Hero edit page (route mới)**
**File**: `app/admin/home-components/hero/[id]/edit/page.tsx`
```tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { useBrandColors } from '../../../create/shared';
import { HeroForm } from '../../_components/HeroForm';
import { HeroPreview } from '../../_components/HeroPreview';
import type { HeroStyle, HeroContent, HeroSlide } from '../../_types';
import { DEFAULT_HERO_CONTENT } from '../../_lib/constants';

export default function HeroEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { primary, secondary } = useBrandColors();
  
  const component = useQuery(api.homeComponents.getById, { id: id as Id<"homeComponents"> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  useEffect(() => {
    if (component) {
      setTitle(component.title);
      setActive(component.active);
      const config = component.config ?? {};
      setHeroSlides(config.slides?.map((s, i) => ({ id: `slide-${i}`, url: s.image, link: s.link })) ?? []);
      setHeroStyle(config.style || 'slider');
      if (config.content) setHeroContent(config.content);
    }
  }, [component]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const needsContent = ['fullscreen', 'split', 'parallax'].includes(heroStyle);
      await updateMutation({
        id: id as Id<"homeComponents">,
        title,
        active,
        config: {
          style: heroStyle,
          slides: heroSlides.map(s => ({ image: s.url, link: s.link })),
          content: needsContent ? heroContent : undefined,
        },
      });
      toast.success('Đã lưu Hero Banner');
      router.push('/admin/home-components');
    } catch (error) {
      toast.error('Lỗi khi lưu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!component) return <div>Loading...</div>;
  if (component === null) return <div>Không tìm thấy component</div>;

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa Hero Banner</CardTitle>
            </CardHeader>
            <CardContent>
              <Input label="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Switch label="Kích hoạt" checked={active} onCheckedChange={setActive} />
            </CardContent>
          </Card>

          <HeroForm
            heroSlides={heroSlides}
            setHeroSlides={setHeroSlides}
            heroStyle={heroStyle}
            setHeroStyle={setHeroStyle}
            heroContent={heroContent}
            setHeroContent={setHeroContent}
          />

          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <HeroPreview
            slides={heroSlides}
            brandColor={primary}
            secondary={secondary}
            selectedStyle={heroStyle}
            onStyleChange={setHeroStyle}
            content={heroContent}
          />
        </div>
      </div>
    </div>
  );
}
```

---

### **Bước 6: Update route cũ để redirect Hero sang route mới**
**File**: `app/admin/home-components/[id]/edit/page.tsx`
```tsx
// Thêm logic redirect cho Hero type
export default function HomeComponentEditPage({ params, searchParams }: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = use(params);
  const { type } = use(searchParams);
  const router = useRouter();
  
  // Redirect Hero to new route
  useEffect(() => {
    if (type === 'hero') {
      router.replace(`/admin/home-components/hero/${id}/edit`);
    }
  }, [type, id, router]);

  // ... rest of code (30 components còn lại)
}
```

---

### **Bước 7: Cleanup - Xóa Hero code khỏi file cũ**
- **previews.tsx**: Xóa lines 139-707 (HeroBannerPreview + types)
- **edit/page.tsx**: 
  - Xóa Hero case trong switch statements (lines 325-332, 599-606)
  - Xóa Hero imports từ previews
  - Xóa heroSlides, heroStyle, heroContent state declarations

---

## 🧪 Testing checklist
- [ ] Route `/admin/home-components/hero/[id]/edit` hoạt động
- [ ] Form lưu config đúng vào Convex
- [ ] Preview hiển thị 6 styles chính xác
- [ ] Device toggle (desktop/tablet/mobile) hoạt động
- [ ] Upload ảnh slide hoạt động
- [ ] Conditional content form (fullscreen/split/parallax) hoạt động
- [ ] Redirect từ route cũ sang route mới
- [ ] Dual brand colors áp dụng đúng (primary + secondary)

---

## 🎯 Kết quả
- **Giảm 560 dòng** từ previews.tsx (13864 → 13304 dòng)
- **Giảm ~200 dòng** từ edit/page.tsx (4014 → 3814 dòng)
- **Tạo structure mới**:
  - 7 files mới trong `/hero` module
  - 4 shared components tái sử dụng
  - Foundation cho việc tách 30 components còn lại

---

## 🔮 Tương lai (Optional - không làm ngay)
Sau khi Hero hoạt động tốt, áp dụng pattern này cho:
- Stats, ProductList, ServiceList, Blog, CTA, FAQ, About, Footer, ...
- Mỗi component 1 folder riêng theo cùng cấu trúc
- Cuối cùng: Xóa hoàn toàn file `[id]/edit/page.tsx` cũ
# Spec: FULL IMPLEMENT - Cleanup + Migrate + Refactor 18 Components

## 🎯 Mục tiêu

Thực hiện **TOÀN BỘ** công việc trong 1 lần:
1. Cleanup `[id]/edit/page.tsx` - xóa logic Banner/Hero
2. Migrate utils từ `previews.tsx` → `_shared/`
3. Refactor **18 components còn lại** theo pattern `refactor-home-component`
4. Tạo tracking document
5. Cleanup final `previews.tsx` và `[id]/edit/page.tsx`

**Kết quả cuối:** Chỉ còn redirect logic trong `[id]/edit/page.tsx`, xóa hoàn toàn `previews.tsx`.

---

## 📋 STEP 1: Tạo Tracking Document

**File:** `.factory/docs/remaining-components-to-refactor.md`

```markdown
# Remaining Home Components to Refactor

## Tổng quan
18 components cần refactor theo pattern `refactor-home-component`.

## Danh sách Components

| # | Component | Type | Priority | Status |
|---|-----------|------|----------|--------|
| 1 | CTA | CTAPreview | High | ✅ Completed |
| 2 | FAQ | FaqPreview | High | ✅ Completed |
| 3 | Footer | FooterPreview | High | ✅ Completed |
| 4 | Testimonials | TestimonialsPreview | High | ✅ Completed |
| 5 | Pricing | PricingPreview | High | ✅ Completed |
| 6 | About | AboutPreview | Medium | ✅ Completed |
| 7 | Services | ServicesPreview | Medium | ✅ Completed |
| 8 | Benefits | BenefitsPreview | Medium | ✅ Completed |
| 9 | Contact | ContactPreview | Medium | ✅ Completed |
| 10 | Team | TeamPreview | Medium | ✅ Completed |
| 11 | Features | FeaturesPreview | Medium | ✅ Completed |
| 12 | Process | ProcessPreview | Medium | ✅ Completed |
| 13 | VoucherPromotions | VoucherPromotionsPreview | Medium | ✅ Completed |
| 14 | Career | CareerPreview | Low | ✅ Completed |
| 15 | SpeedDial | SpeedDialPreview | Low | ✅ Completed |
| 16 | Clients | ClientsPreview | Low | ✅ Completed |
| 17 | Video | VideoPreview | Low | ✅ Completed |
| 18 | Countdown | CountdownPreview | Low | ✅ Completed |

## Metrics
- **Total:** 18 components
- **Completed:** 18 (100%)

## Pattern Reference
Skill: `.factory/skills/refactor-home-component/SKILL.md`
```

---

## 📋 STEP 2: Migrate Utils → `_shared/`

### 2.1 Kiểm tra & Update `_shared/types/preview.ts`

**Tạo file mới** (nếu chưa có):

```tsx
import { Monitor, Smartphone, Tablet } from 'lucide-react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const deviceWidths = {
  desktop: 'w-full max-w-7xl',
  mobile: 'w-[375px] max-w-full',
  tablet: 'w-[768px] max-w-full'
} as const;

export const devices = [
  { id: 'desktop' as const, label: 'Desktop (max-w-7xl)', icon: Monitor },
  { id: 'tablet' as const, label: 'Tablet (768px)', icon: Tablet },
  { id: 'mobile' as const, label: 'Mobile (375px)', icon: Smartphone }
] as const;
```

### 2.2 Kiểm tra `_shared/components/PreviewImage.tsx`

Đọc file hiện tại và so sánh với code trong `previews.tsx` (lines 23-42). Nếu khác nhau → cập nhật. Nếu giống → skip.

### 2.3 Kiểm tra `_shared/components/BrowserFrame.tsx`

Đọc file hiện tại và so sánh với `previews.tsx` (lines 51-64). Cập nhật nếu cần.

### 2.4 Kiểm tra `_shared/components/PreviewWrapper.tsx`

Đọc file hiện tại và so sánh với `previews.tsx` (lines 66-98). Cập nhật nếu cần.

---

## 📋 STEP 3: Refactor 18 Components

Thực hiện **TUẦN TỰ** cho 18 components theo thứ tự priority:

### Batch 1: High Priority

#### 3.1 CTA Component

**Tạo structure:**
```
app/admin/home-components/cta/
├── [id]/edit/page.tsx
├── _types/index.ts
├── _lib/constants.ts
└── _components/
    ├── CTAPreview.tsx
    └── CTAForm.tsx
```

**Chi tiết:**

**File: `_types/index.ts`**
```tsx
export type CTAStyle = 'banner' | 'centered' | 'gradient' | 'split';

export interface CTAConfig {
  badge?: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}
```

**File: `_lib/constants.ts`**
```tsx
import type { CTAConfig, CTAStyle } from '../_types';

export const CTA_STYLES: { id: CTAStyle; label: string }[] = [
  { id: 'banner', label: 'Banner ngang' },
  { id: 'centered', label: 'Căn giữa' },
  { id: 'gradient', label: 'Gradient background' },
  { id: 'split', label: 'Chia đôi (hình + text)' }
];

export const DEFAULT_CTA_CONFIG: CTAConfig = {
  badge: '',
  title: 'Sẵn sàng bắt đầu?',
  description: 'Đăng ký ngay hôm nay và nhận ưu đãi đặc biệt.',
  buttonText: 'Bắt đầu ngay',
  buttonLink: '/contact',
  secondaryButtonText: '',
  secondaryButtonLink: ''
};
```

**File: `_components/CTAPreview.tsx`**

Di chuyển code từ `previews.tsx` (lines 2228-2607) → file mới. Cập nhật:
- Import từ `_shared/components/`: `PreviewWrapper`, `BrowserFrame`
- Import từ `_shared/hooks/`: `usePreviewDevice`
- Nhận props: `config`, `brandColor`, `secondary`, `selectedStyle`, `onStyleChange`
- Render preview cho 4 styles

**File: `_components/CTAForm.tsx`**

Di chuyển form logic từ `[id]/edit/page.tsx` → file mới. Bao gồm:
- Input: badge, title, description
- Input: buttonText, buttonLink
- Input: secondaryButtonText, secondaryButtonLink (conditional)

**File: `[id]/edit/page.tsx`**

Template chuẩn:
```tsx
'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { MousePointerClick, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, cn } from '../../../../components/ui';
import { useBrandColors } from '../../../create/shared';
import { CTAForm } from '../../_components/CTAForm';
import { CTAPreview } from '../../_components/CTAPreview';
import { DEFAULT_CTA_CONFIG } from '../../_lib/constants';
import type { CTAConfig, CTAStyle } from '../../_types';

export default function CTAEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { primary, secondary } = useBrandColors();
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });
  const updateMutation = useMutation(api.homeComponents.update);

  const [title, setTitle] = useState('');
  const [active, setActive] = useState(true);
  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(DEFAULT_CTA_CONFIG);
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('banner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (component) {
      if (component.type !== 'CTA') {
        router.replace(`/admin/home-components/${id}/edit?type=${component.type.toLowerCase()}`);
        return;
      }

      setTitle(component.title);
      setActive(component.active);

      const config = component.config ?? {};
      setCtaConfig({
        badge: config.badge ?? DEFAULT_CTA_CONFIG.badge,
        title: config.title ?? DEFAULT_CTA_CONFIG.title,
        description: config.description ?? DEFAULT_CTA_CONFIG.description,
        buttonText: config.buttonText ?? DEFAULT_CTA_CONFIG.buttonText,
        buttonLink: config.buttonLink ?? DEFAULT_CTA_CONFIG.buttonLink,
        secondaryButtonText: config.secondaryButtonText ?? DEFAULT_CTA_CONFIG.secondaryButtonText,
        secondaryButtonLink: config.secondaryButtonLink ?? DEFAULT_CTA_CONFIG.secondaryButtonLink,
      });
      setCtaStyle((config.style as CTAStyle) || 'banner');
    }
  }, [component, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateMutation({
        id: id as Id<'homeComponents'>,
        title,
        active,
        config: {
          ...ctaConfig,
          style: ctaStyle,
        },
      });
      toast.success('Đã cập nhật CTA');
      router.push('/admin/home-components');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy component</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa CTA</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointerClick size={20} />
              CTA (Call to Action)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề hiển thị <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nhập tiêu đề component..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Trạng thái:</Label>
              <div
                className={cn(
                  "cursor-pointer inline-flex items-center justify-center rounded-full w-12 h-6 transition-colors",
                  active ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                )}
                onClick={() => setActive(!active)}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  active ? "translate-x-2.5" : "-translate-x-2.5"
                )}></div>
              </div>
              <span className="text-sm text-slate-500">{active ? 'Bật' : 'Tắt'}</span>
            </div>
          </CardContent>
        </Card>

        <CTAForm config={ctaConfig} onChange={setCtaConfig} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6">
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <CTAPreview
              config={ctaConfig}
              brandColor={primary}
              secondary={secondary}
              selectedStyle={ctaStyle}
              onStyleChange={setCtaStyle}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
```

---

#### 3.2 FAQ Component

**Tạo structure tương tự CTA:**
```
app/admin/home-components/faq/
├── [id]/edit/page.tsx
├── _types/index.ts (FaqStyle, FaqItem, FaqConfig)
├── _lib/constants.ts (FAQ_STYLES, DEFAULT_FAQ_ITEMS, DEFAULT_FAQ_CONFIG)
└── _components/
    ├── FaqPreview.tsx (từ previews.tsx lines 137-487)
    └── FaqForm.tsx (từ [id]/edit/page.tsx)
```

**Types:**
```tsx
export type FaqStyle = 'accordion' | 'grid' | 'tabs';

export interface FaqItem {
  id: string | number;
  question: string;
  answer: string;
}

export interface FaqConfig {
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}
```

---

#### 3.3 Footer Component

**Structure:**
```
app/admin/home-components/footer/
├── [id]/edit/page.tsx
├── _types/index.ts (FooterStyle, FooterConfig, FooterColumn, SocialLink)
├── _lib/constants.ts (FOOTER_STYLES, DEFAULT_FOOTER_CONFIG)
└── _components/
    ├── FooterPreview.tsx (từ previews.tsx lines 1695-2227)
    └── FooterForm.tsx
```

**Types:**
```tsx
export type FooterStyle = 'classic' | 'minimal' | 'modern';

export interface FooterColumn {
  id: number;
  title: string;
  links: { label: string; url: string }[];
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon: string;
}

export interface FooterConfig {
  logo: string;
  description: string;
  columns: FooterColumn[];
  copyright: string;
  showSocialLinks: boolean;
  socialLinks: SocialLink[];
}
```

---

#### 3.4 Testimonials Component

**Structure:**
```
app/admin/home-components/testimonials/
├── [id]/edit/page.tsx
├── _types/index.ts (TestimonialsStyle, TestimonialItem)
├── _lib/constants.ts
└── _components/
    ├── TestimonialsPreview.tsx (từ previews.tsx lines 488-812)
    └── TestimonialsForm.tsx
```

**Types:**
```tsx
export type TestimonialsStyle = 'cards' | 'carousel' | 'masonry' | 'grid';

export interface TestimonialItem {
  id: string | number;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}
```

---

#### 3.5 Pricing Component

**Structure:**
```
app/admin/home-components/pricing/
├── [id]/edit/page.tsx
├── _types/index.ts (PricingStyle, PricingPlan, PricingConfig)
├── _lib/constants.ts
└── _components/
    ├── PricingPreview.tsx (từ previews.tsx lines 813-1328)
    └── PricingForm.tsx
```

**Types:**
```tsx
export type PricingStyle = 'cards' | 'table' | 'toggle';

export interface PricingPlan {
  id: number;
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  isPopular: boolean;
  buttonText: string;
  buttonLink: string;
}

export interface PricingConfig {
  subtitle: string;
  showBillingToggle: boolean;
  monthlyLabel: string;
  yearlyLabel: string;
  yearlySavingText: string;
}
```

---

### Batch 2: Medium Priority (8 components)

**Áp dụng pattern tương tự** cho:

#### 3.6 About
- Lines trong previews.tsx: 2608-3111
- Types: `AboutStyle`, `AboutConfig`, `AboutStat`

#### 3.7 Services
- Lines: 1329-1694
- Types: `ServicesStyle`, `ServiceItem`

#### 3.8 Benefits
- Lines: 3112-3429
- Types: `BenefitsStyle`, `BenefitItem`, `BenefitsConfig`

#### 3.9 Contact
- Lines: 3973-4348
- Types: `ContactStyle`, `ContactConfig`

#### 3.10 Team
- Lines: 4565-5301
- Types: `TeamStyle`, `TeamMember`

#### 3.11 Features
- Lines: 5302-5541
- Types: `FeaturesStyle`, `FeatureItem`

#### 3.12 Process
- Lines: 5542-5967
- Types: `ProcessStyle`, `ProcessStep`

#### 3.13 VoucherPromotions
- Lines: 7482-7784
- Types: `VoucherPromotionsStyle`, `VoucherConfig`

---

### Batch 3: Low Priority (5 components)

#### 3.14 Career
- Lines: 3430-3972
- Types: `CareerStyle`, `JobPosition`

#### 3.15 SpeedDial
- Lines: 4349-4564
- Types: `SpeedDialStyle`, `SpeedDialConfig`

#### 3.16 Clients
- Lines: 5968-6360
- Types: `ClientsStyle`, `ClientsConfig`

#### 3.17 Video
- Lines: 6361-6894
- Types: `VideoStyle`, `VideoConfig`

#### 3.18 Countdown
- Lines: 6895-7481
- Types: `CountdownStyle`, `CountdownConfig`

---

## 📋 STEP 4: Update Redirect Map trong `[id]/edit/page.tsx`

**Sau khi refactor xong 18 components**, cập nhật redirectMap:

```tsx
useEffect(() => {
  if (!component) return;
  
  // Redirect map cho 29 components (11 cũ + 18 mới)
  const redirectMap: Record<string, string> = {
    // 11 components đã refactor
    'Hero': 'hero',
    'Stats': 'stats',
    'CaseStudy': 'case-study',
    'ServiceList': 'service-list',
    'ProductGrid': 'product-grid',
    'ProductList': 'product-list',
    'Blog': 'blog',
    'Partners': 'partners',
    'CategoryProducts': 'category-products',
    'ProductCategories': 'product-categories',
    'Gallery': 'gallery',
    'TrustBadges': 'gallery',
    
    // 18 components mới refactor
    'CTA': 'cta',
    'FAQ': 'faq',
    'Footer': 'footer',
    'Testimonials': 'testimonials',
    'Pricing': 'pricing',
    'About': 'about',
    'Services': 'services',
    'Benefits': 'benefits',
    'Contact': 'contact',
    'Team': 'team',
    'Features': 'features',
    'Process': 'process',
    'VoucherPromotions': 'voucher-promotions',
    'Career': 'career',
    'SpeedDial': 'speed-dial',
    'Clients': 'clients',
    'Video': 'video',
    'Countdown': 'countdown',
  };
  
  const slug = redirectMap[component.type];
  if (slug) {
    router.replace(`/admin/home-components/${slug}/${component._id}/edit`);
  } else {
    // Fallback: component type không tồn tại
    toast.error(`Component type "${component.type}" không được hỗ trợ`);
    router.push('/admin/home-components');
  }
}, [component, router]);
```

---

## 📋 STEP 5: Cleanup Final

### 5.1 Xóa hoàn toàn `previews.tsx`

**Lý do:** Tất cả 18 Preview components đã được di chuyển vào module riêng.

**Action:**
```bash
rm app/admin/home-components/previews.tsx
```

### 5.2 Đơn giản hóa `[id]/edit/page.tsx`

**Sau khi xóa hết logic 29 components**, file này chỉ còn:

```tsx
'use client';

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HomeComponentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const component = useQuery(api.homeComponents.getById, { id: id as Id<'homeComponents'> });

  useEffect(() => {
    if (!component) return;
    
    const redirectMap: Record<string, string> = {
      // 29 components đã refactor
      'Hero': 'hero',
      'Stats': 'stats',
      'CaseStudy': 'case-study',
      'ServiceList': 'service-list',
      'ProductGrid': 'product-grid',
      'ProductList': 'product-list',
      'Blog': 'blog',
      'Partners': 'partners',
      'CategoryProducts': 'category-products',
      'ProductCategories': 'product-categories',
      'Gallery': 'gallery',
      'TrustBadges': 'gallery',
      'CTA': 'cta',
      'FAQ': 'faq',
      'Footer': 'footer',
      'Testimonials': 'testimonials',
      'Pricing': 'pricing',
      'About': 'about',
      'Services': 'services',
      'Benefits': 'benefits',
      'Contact': 'contact',
      'Team': 'team',
      'Features': 'features',
      'Process': 'process',
      'VoucherPromotions': 'voucher-promotions',
      'Career': 'career',
      'SpeedDial': 'speed-dial',
      'Clients': 'clients',
      'Video': 'video',
      'Countdown': 'countdown',
    };
    
    const slug = redirectMap[component.type];
    if (slug) {
      router.replace(`/admin/home-components/${slug}/${component._id}/edit`);
    } else {
      toast.error(`Component type "${component.type}" không được hỗ trợ`);
      router.push('/admin/home-components');
    }
  }, [component, router, id]);

  if (component === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (component === null) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không tìm thấy component
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      <span className="ml-3 text-slate-500">Đang chuyển hướng...</span>
    </div>
  );
}
```

**Kết quả:** File giảm từ **2758 lines** → **~70 lines** (giảm 97.5%)

---

## 📝 Checklist Tổng thể

### Setup
- [ ] Tạo tracking doc `.factory/docs/remaining-components-to-refactor.md`
- [ ] Tạo `_shared/types/preview.ts` với `PreviewDevice`, `deviceWidths`, `devices`
- [ ] Kiểm tra & cập nhật `_shared/components/` (PreviewImage, BrowserFrame, PreviewWrapper)

### Refactor 18 Components (High → Medium → Low)

**High Priority:**
- [ ] 1. CTA: Tạo module + di chuyển code + test
- [ ] 2. FAQ: Tạo module + di chuyển code + test
- [ ] 3. Footer: Tạo module + di chuyển code + test
- [ ] 4. Testimonials: Tạo module + di chuyển code + test
- [ ] 5. Pricing: Tạo module + di chuyển code + test

**Medium Priority:**
- [ ] 6. About
- [ ] 7. Services
- [ ] 8. Benefits
- [ ] 9. Contact
- [ ] 10. Team
- [ ] 11. Features
- [ ] 12. Process
- [ ] 13. VoucherPromotions

**Low Priority:**
- [ ] 14. Career
- [ ] 15. SpeedDial
- [ ] 16. Clients
- [ ] 17. Video
- [ ] 18. Countdown

### Cleanup Final
- [ ] Update redirectMap trong `[id]/edit/page.tsx` (29 components)
- [ ] Xóa file `previews.tsx`
- [ ] Đơn giản hóa `[id]/edit/page.tsx` thành redirect-only (70 lines)
- [ ] Test redirect cho tất cả 29 components
- [ ] Chạy `bunx oxlint --type-aware --type-check --fix`

### Commit
- [ ] Commit 1: `docs: add tracking doc for 18 remaining components`
- [ ] Commit 2: `refactor(home-components): migrate utils to _shared/types`
- [ ] Commit 3-7: `refactor(home-components): batch 1 - high priority (CTA, FAQ, Footer, Testimonials, Pricing)`
- [ ] Commit 8-15: `refactor(home-components): batch 2 - medium priority (8 components)`
- [ ] Commit 16-20: `refactor(home-components): batch 3 - low priority (5 components)`
- [ ] Commit 21: `refactor(home-components): finalize - delete previews.tsx and simplify [id]/edit`

---

## 🎯 Kết quả cuối cùng

### Before:
- `[id]/edit/page.tsx`: **2758 lines** (logic 29 components)
- `previews.tsx`: **7784 lines** (18 Preview components)
- **Total:** 10,542 lines

### After:
- `[id]/edit/page.tsx`: **~70 lines** (chỉ redirect)
- `previews.tsx`: **XÓA HOÀN TOÀN**
- 29 modules: `app/admin/home-components/[component]/`
- **Total monolithic code:** 70 lines (giảm **99.3%**)

### Lợi ích:
✅ **Modular:** Mỗi component là 1 module độc lập  
✅ **Maintainable:** Dễ tìm, dễ sửa, dễ test  
✅ **Scalable:** Thêm component mới chỉ cần tạo module mới  
✅ **DRY:** Tái sử dụng utils từ `_shared/`  
✅ **Type-safe:** Mỗi component có types riêng  
✅ **Clean:** Xóa 10,472 lines code monolithic  

---

## ⏱️ Timeline ước tính

- **Setup (Step 1-2):** 1-2 giờ
- **Refactor Batch 1 (5 components High):** 2-3 ngày
- **Refactor Batch 2 (8 components Medium):** 4-5 ngày
- **Refactor Batch 3 (5 components Low):** 2-3 ngày
- **Cleanup Final (Step 4-5):** 1-2 giờ

**Tổng:** **8-11 ngày** (làm tuần tự 1 component/ngày)

---

## 💡 Lưu ý khi implement

1. **Mỗi component:** Test kỹ redirect, form, preview, save trước khi commit
2. **Dual brand colors:** Đảm bảo tất cả Preview dùng `primary` + `secondary`
3. **Shared components:** Luôn import từ `_shared/` (không duplicate code)
4. **Naming convention:** `[Component]Preview.tsx`, `[Component]Form.tsx`, `[Component]Style`
5. **Không thay đổi behaviour:** Chỉ refactor structure, không sửa logic
6. **Commit nhỏ:** Mỗi component 1 commit riêng để dễ review/rollback
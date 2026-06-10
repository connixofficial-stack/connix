# Experiences System - Developer Guide

## 📝 Tổng quan

Hệ thống Experiences cho phép quản lý giao diện người dùng theo từng trải nghiệm cụ thể, với preview realtime và links ví dụ để dev dễ dàng test.

## 🎯 Các trang Experiences hiện có

### Content Pages
1. **Posts List** (`/system/experiences/posts-list`) - Danh sách bài viết
2. **Posts Detail** (`/system/experiences/posts-detail`) - Chi tiết bài viết  
3. **Services List** (`/system/experiences/services-list`) - Danh sách dịch vụ
4. **Services Detail** (`/system/experiences/services-detail`) - Chi tiết dịch vụ
5. **Products List** (`/system/experiences/products-list`) - Danh sách sản phẩm
6. **Product Detail** (`/system/experiences/product-detail`) - Chi tiết sản phẩm

### E-commerce Pages
7. **Wishlist** (`/system/experiences/wishlist`) - Sản phẩm yêu thích
8. **Cart** (`/system/experiences/cart`) - Giỏ hàng
9. **Checkout** (`/system/experiences/checkout`) - Thanh toán & Đặt hàng

### Other Pages
10. **Comments & Rating** (`/system/experiences/comments-rating`) - Bình luận & Đánh giá
11. **Contact** (`/system/experiences/contact`) - Trang liên hệ
12. **Search/Filter** (`/system/experiences/search`) - Tìm kiếm & Lọc

## 🔧 Components chính

### LivePreview
Component nhúng iframe hiển thị trang thực với responsive controls.

```tsx
<LivePreview
  url="/posts"
  title="Danh sách bài viết"
  defaultDevice="desktop" // optional: 'desktop' | 'tablet' | 'mobile'
/>
```

**Features:**
- Responsive preview (Desktop/Tablet/Mobile)
- Loading state
- Iframe sandbox security
- Real UI từ production routes

### ExampleLinks
Component hiển thị danh sách links ví dụ để dev dễ mở và test.

```tsx
<ExampleLinks
  title="Xem ví dụ thực tế" // optional
  links={[
    { 
      label: 'Trang danh sách bài viết',
      url: '/posts',
      description: 'Xem tất cả bài viết' // optional
    },
    { 
      label: 'Lọc theo category',
      url: '/posts?catpost=tech',
      description: 'Ví dụ filter'
    },
  ]}
  color="#3b82f6" // optional, default: '#0ea5e9'
/>
```

**Features:**
- Link opens in new tab
- Shows full URL
- Optional description
- Custom color scheme

## 🎣 Hooks hữu ích

### useExampleSlugs
Lấy slug/URL mẫu từ database để tạo preview links.

```tsx
import { useExamplePostSlug, useExampleProductSlug } from '@/lib/experiences';

function MyExperiencePage() {
  const examplePostSlug = useExamplePostSlug();
  const exampleProductSlug = useExampleProductSlug();
  
  return (
    <ExampleLinks
      links={[
        examplePostSlug && {
          label: 'Bài viết mẫu',
          url: `/posts/${examplePostSlug}`
        },
        exampleProductSlug && {
          label: 'Sản phẩm mẫu', 
          url: `/products/${exampleProductSlug}`
        },
      ].filter(Boolean)}
    />
  );
}
```

Available hooks:
- `useExamplePostSlug()` - Lấy post slug đầu tiên
- `useExampleProductSlug()` - Lấy product slug đầu tiên
- `useExampleServiceSlug()` - Lấy service slug đầu tiên
- `useExamplePostCategorySlug()` - Lấy post category slug đầu tiên

## 📁 Cấu trúc thư mục

```
app/system/experiences/
├── page.tsx                    # Hub page - danh sách tất cả experiences
├── posts-list/page.tsx        # Experiences cho từng trang
├── posts-detail/page.tsx
├── products-list/page.tsx
├── product-detail/page.tsx
├── services-list/page.tsx
├── services-detail/page.tsx
├── wishlist/page.tsx
├── cart/page.tsx
├── checkout/page.tsx
├── comments-rating/page.tsx
├── contact/page.tsx
└── search/page.tsx

components/experiences/
├── index.ts                    # Exports
├── LivePreview.tsx            # Live preview component
├── ExampleLinks.tsx           # Example links component
├── ExperiencePreview.tsx      # Legacy preview wrapper
├── ExperienceModuleLink.tsx   # Module link card
├── ExperienceSummaryGrid.tsx  # Summary grid
├── ExperienceBlockToggle.tsx  # Toggle switch
├── ExperienceHintCard.tsx     # Hints card
└── previews/                   # Legacy static previews (deprecated)
    ├── ProductDetailPreview.tsx
    ├── WishlistPreview.tsx
    ├── CartPreview.tsx
    └── ...

lib/experiences/
├── index.ts
├── constants.ts               # Experience keys, colors, names
├── useExperienceConfig.ts     # Config state management
├── useExperienceSave.ts       # Save mutation
└── useExampleSlugs.ts        # Get example slugs from DB
```

## 🚀 Tạo Experience Page mới

### 1. Tạo page file

```tsx
// app/system/experiences/my-page/page.tsx
'use client';

import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LayoutTemplate } from 'lucide-react';
import { ModuleHeader, SettingsCard, SettingSelect } from '@/components/modules/shared';
import { 
  ExperienceSummaryGrid, 
  ExperienceBlockToggle,
  ExperienceHintCard,
  LivePreview,
  ExampleLinks,
  type SummaryItem 
} from '@/components/experiences';
import { 
  useExperienceConfig, 
  useExperienceSave, 
  useExamplePostSlug,
  EXPERIENCE_NAMES, 
  MESSAGES 
} from '@/lib/experiences';

type MyPageConfig = {
  layoutStyle: 'style1' | 'style2';
  showFeature: boolean;
};

const EXPERIENCE_KEY = 'my_page_ui';

const DEFAULT_CONFIG: MyPageConfig = {
  layoutStyle: 'style1',
  showFeature: true,
};

export default function MyPageExperiencePage() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: EXPERIENCE_KEY });
  const exampleSlug = useExamplePostSlug();

  const serverConfig = useMemo<MyPageConfig>(() => {
    const raw = experienceSetting?.value as Partial<MyPageConfig> | undefined;
    return {
      layoutStyle: raw?.layoutStyle ?? 'style1',
      showFeature: raw?.showFeature ?? true,
    };
  }, [experienceSetting?.value]);

  const isLoading = experienceSetting === undefined;

  const { config, setConfig, hasChanges } = useExperienceConfig(serverConfig, DEFAULT_CONFIG, isLoading);
  const { handleSave, isSaving } = useExperienceSave(EXPERIENCE_KEY, config, MESSAGES.saveSuccess(EXPERIENCE_NAMES[EXPERIENCE_KEY]));

  const summaryItems: SummaryItem[] = [
    { label: 'Layout', value: config.layoutStyle, format: 'capitalize' },
    { label: 'Feature', value: config.showFeature },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ModuleHeader
        icon={LayoutTemplate}
        title="Trải nghiệm: My Page"
        description="Mô tả ngắn gọn về page này."
        iconBgClass="bg-blue-500/10"
        iconTextClass="text-blue-600 dark:text-blue-400"
        buttonClass="bg-blue-600 hover:bg-blue-500"
        onSave={handleSave}
        hasChanges={hasChanges}
        isSaving={isSaving}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4 lg:col-span-2">
          {exampleSlug && (
            <LivePreview
              url={`/my-page/${exampleSlug}`}
              title="My Page"
            />
          )}

          <SettingsCard>
            <SettingSelect
              label="Layout style"
              value={config.layoutStyle}
              onChange={(value) => setConfig(prev => ({ ...prev, layoutStyle: value as 'style1' | 'style2' }))}
              options={[
                { label: 'Style 1', value: 'style1' },
                { label: 'Style 2', value: 'style2' },
              ]}
              focusColor="focus:border-blue-500"
            />
          </SettingsCard>

          <SettingsCard>
            <ExperienceBlockToggle
              label="Feature toggle"
              description="Mô tả feature"
              enabled={config.showFeature}
              onChange={() => setConfig(prev => ({ ...prev, showFeature: !prev.showFeature }))}
              color="bg-blue-500"
            />
          </SettingsCard>

          <ExperienceSummaryGrid items={summaryItems} />
        </div>

        <div className="space-y-4">
          {exampleSlug && (
            <ExampleLinks
              links={[
                { label: 'Xem trang mẫu', url: `/my-page/${exampleSlug}`, description: 'Open để test' },
              ]}
              color="#3b82f6"
            />
          )}

          <ExperienceHintCard hints={[
            'Hint 1',
            'Hint 2',
          ]} />
        </div>
      </div>
    </div>
  );
}
```

### 2. Add to constants.ts

```tsx
// lib/experiences/constants.ts
export type ExperienceKey = 
  | '...'
  | 'my_page_ui'; // Add new key

export const EXPERIENCE_COLORS: Record<ExperienceKey, ColorScheme> = {
  // ...
  my_page_ui: 'blue',
};

export const EXPERIENCE_NAMES: Record<ExperienceKey, string> = {
  // ...
  my_page_ui: 'My Page',
};
```

### 3. Add to hub page

```tsx
// app/system/experiences/page.tsx
const experiences = [
  // ...
  {
    title: 'My Page',
    description: 'Mô tả ngắn',
    href: '/system/experiences/my-page',
    icon: MyIcon,
  },
];
```

## ⚡ Best Practices

### 1. Luôn dùng LivePreview cho trang có UI thực
```tsx
// ✅ Good - Shows real UI
<LivePreview url="/posts" title="Posts List" />

// ❌ Bad - Custom mock preview
<div className="fake-preview">Mock UI</div>
```

### 2. Luôn có ExampleLinks
```tsx
// ✅ Good
<ExampleLinks
  links={[
    { label: 'Example 1', url: '/posts/example-slug' },
    { label: 'Example 2', url: '/posts?category=tech' },
  ]}
/>

// ❌ Bad - No examples
// User không biết mở link nào để test
```

### 3. Sử dụng hooks để lấy slug thật
```tsx
// ✅ Good - Real data
const exampleSlug = useExamplePostSlug();
if (exampleSlug) {
  return <ExampleLinks links=[{ url: `/posts/${exampleSlug}` }] />;
}

// ❌ Bad - Hardcoded
<ExampleLinks links=[{ url: '/posts/fake-slug' }] />
```

### 4. Responsive preview
```tsx
// ✅ Good - Desktop default cho admin
<LivePreview url="/..." defaultDevice="desktop" />

// Mobile/tablet nếu cần test responsive
<LivePreview url="/..." defaultDevice="mobile" />
```

## 🐛 Troubleshooting

### Preview không load

**Nguyên nhân:** Trang thực chưa có data hoặc slug sai

**Giải pháp:**
1. Kiểm tra `/posts` có data không
2. Check useExamplePostSlug() return gì
3. Verify URL trong ExampleLinks mở được không

### Preview hiển thị sai

**Nguyên nhân:** Config chưa được apply vào trang thực

**Giải pháp:**
1. Check trang thực có đọc config từ `api.settings.getByKey` không
2. Verify experience key đúng chưa
3. Save config và refresh preview

### Iframe blocked

**Nguyên nhân:** CSP hoặc X-Frame-Options

**Giải pháp:**
- Trang same-origin nên không bị block
- Nếu vẫn block, check `next.config.ts` headers

## 📚 Resources

- [Convex Settings API](https://docs.convex.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Iframe Security](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)

---

**Note:** System này replace các static preview components cũ (ProductDetailPreview, CartPreview, v.v.) bằng LivePreview để đảm bảo preview giống 100% UI thực.

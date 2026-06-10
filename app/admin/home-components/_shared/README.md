# Shared Header System for Home Components

## Overview

Hệ thống shared components chuẩn hóa header (title/subtitle/badge) cho tất cả home components, dựa trên implementation hoàn chỉnh từ Stats component.

## Features

✅ Toggle ẩn toàn bộ header (nằm ngoài dropdown)
✅ Title/subtitle với show/hide toggles  
✅ Badge với text config
✅ Alignment (left/center/right)
✅ Title color primary (brand color)
✅ Subtitle above title
✅ Uppercase text
✅ InputWithClear cho text inputs
✅ Collapsible section

## Components

### 1. Types (`types/sectionHeader.ts`)

```typescript
import type { SectionHeaderConfig } from '../_shared/types/sectionHeader';

interface MyComponentConfig extends SectionHeaderConfig {
  // ... other config fields
}
```

### 2. Admin Form (`components/HeaderConfigSection.tsx`)

```tsx
import { HeaderConfigSection } from '../_shared/components/HeaderConfigSection';

// In your edit page:
<HeaderConfigSection
  hideHeader={hideHeader}
  title={title}
  showTitle={showTitle}
  subtitle={subtitle}
  showSubtitle={showSubtitle}
  headerAlign={headerAlign}
  titleColorPrimary={titleColorPrimary}
  subtitleAboveTitle={subtitleAboveTitle}
  uppercaseText={uppercaseText}
  showBadge={showBadge}
  badgeText={badgeText}
  onHideHeaderChange={setHideHeader}
  onTitleChange={setTitle}
  onShowTitleChange={setShowTitle}
  onSubtitleChange={setSubtitle}
  onShowSubtitleChange={setShowSubtitle}
  onHeaderAlignChange={setHeaderAlign}
  onTitleColorPrimaryChange={setTitleColorPrimary}
  onSubtitleAboveTitleChange={setSubtitleAboveTitle}
  onUppercaseTextChange={setUppercaseText}
  onShowBadgeChange={setShowBadge}
  onBadgeTextChange={setBadgeText}
  expanded={expandedSections.header}
  onExpandedChange={(value) => setExpandedSections(prev => ({ ...prev, header: value }))}
  titleRequired={true}
  titleLabel="Tiêu đề hiển thị"
  titlePlaceholder="Nhập tiêu đề component..."
/>
```

### 3. Runtime Component (`components/SectionHeader.tsx`)

```tsx
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';

// In your runtime section:
<SectionHeader
  title={title}
  subtitle={subtitle}
  badgeText={badgeText}
  hideHeader={hideHeader}
  showTitle={showTitle}
  showSubtitle={showSubtitle}
  showBadge={showBadge}
  headerAlign={headerAlign}
  titleColorPrimary={titleColorPrimary}
  subtitleAboveTitle={subtitleAboveTitle}
  uppercaseText={uppercaseText}
  brandColor={brandColor}
/>
```

### 4. Hooks (`hooks/useSectionHeaderState.ts`)

```typescript
import { useSectionHeaderState, extractSectionHeaderConfig } from '../_shared/hooks/useSectionHeaderState';

// In your edit page:
const headerState = useSectionHeaderState(initialConfig);

// Extract from config:
const headerConfig = extractSectionHeaderConfig(config);
```

## Migration Guide

### Step 1: Update Constants

```typescript
// _lib/constants.ts
export const DEFAULT_MY_COMPONENT_CONFIG = {
  // ... existing fields
  
  // Add shared header config (mặc định hideHeader: false)
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: 'Default subtitle',
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
};
```

### Step 2: Update Create Page

```typescript
// create/[component]/page.tsx
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { DEFAULT_MY_COMPONENT_CONFIG } from '../../[component]/_lib/constants';

export default function MyComponentCreatePage() {
  // ... existing setup
  
  // Add header state (mặc định từ constants)
  const [expandedSections, setExpandedSections] = useState({ header: false });
  const [hideHeader, setHideHeader] = useState(DEFAULT_MY_COMPONENT_CONFIG.hideHeader ?? false);
  const [showTitle, setShowTitle] = useState(DEFAULT_MY_COMPONENT_CONFIG.showTitle ?? true);
  const [showSubtitle, setShowSubtitle] = useState(DEFAULT_MY_COMPONENT_CONFIG.showSubtitle ?? true);
  const [subtitle, setSubtitle] = useState(DEFAULT_MY_COMPONENT_CONFIG.subtitle ?? '');
  const [headerAlign, setHeaderAlign] = useState(DEFAULT_MY_COMPONENT_CONFIG.headerAlign ?? 'left');
  const [titleColorPrimary, setTitleColorPrimary] = useState(DEFAULT_MY_COMPONENT_CONFIG.titleColorPrimary ?? false);
  const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(DEFAULT_MY_COMPONENT_CONFIG.subtitleAboveTitle ?? false);
  const [uppercaseText, setUppercaseText] = useState(DEFAULT_MY_COMPONENT_CONFIG.uppercaseText ?? false);
  const [showBadge, setShowBadge] = useState(DEFAULT_MY_COMPONENT_CONFIG.showBadge ?? true);
  const [badgeText, setBadgeText] = useState(DEFAULT_MY_COMPONENT_CONFIG.badgeText ?? '');

  // Save to config
  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      // ... other fields
      hideHeader,
      showTitle,
      showSubtitle,
      subtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
    });
  };

  // Render
  return (
    <ComponentFormWrapper {...props}>
      <HeaderConfigSection
        hideHeader={hideHeader}
        title={title}
        showTitle={showTitle}
        subtitle={subtitle}
        showSubtitle={showSubtitle}
        headerAlign={headerAlign}
        titleColorPrimary={titleColorPrimary}
        subtitleAboveTitle={subtitleAboveTitle}
        uppercaseText={uppercaseText}
        showBadge={showBadge}
        badgeText={badgeText}
        onHideHeaderChange={setHideHeader}
        onTitleChange={setTitle}
        onShowTitleChange={setShowTitle}
        onSubtitleChange={setSubtitle}
        onShowSubtitleChange={setShowSubtitle}
        onHeaderAlignChange={setHeaderAlign}
        onTitleColorPrimaryChange={setTitleColorPrimary}
        onSubtitleAboveTitleChange={setSubtitleAboveTitle}
        onUppercaseTextChange={setUppercaseText}
        onShowBadgeChange={setShowBadge}
        onBadgeTextChange={setBadgeText}
        expanded={expandedSections.header}
        onExpandedChange={(value) => setExpandedSections({ header: value })}
      />
      
      {/* Other form sections */}
    </ComponentFormWrapper>
  );
}
```

### Step 3: Update Edit Page

```typescript
// [id]/edit/page.tsx
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { extractSectionHeaderConfig } from '../../_shared/hooks/useSectionHeaderState';

// Add state
const [hideHeader, setHideHeader] = useState(false);
const [showTitle, setShowTitle] = useState(true);
const [showSubtitle, setShowSubtitle] = useState(true);
const [subtitle, setSubtitle] = useState('');
const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>('left');
const [titleColorPrimary, setTitleColorPrimary] = useState(false);
const [subtitleAboveTitle, setSubtitleAboveTitle] = useState(false);
const [uppercaseText, setUppercaseText] = useState(false);
const [showBadge, setShowBadge] = useState(true);
const [badgeText, setBadgeText] = useState('');

// Load from config
useEffect(() => {
  if (component) {
    const headerConfig = extractSectionHeaderConfig(component.config ?? {});
    setHideHeader(headerConfig.hideHeader ?? false);
    setShowTitle(headerConfig.showTitle ?? true);
    setShowSubtitle(headerConfig.showSubtitle ?? true);
    setSubtitle(headerConfig.subtitle ?? '');
    setHeaderAlign(headerConfig.headerAlign ?? 'left');
    setTitleColorPrimary(headerConfig.titleColorPrimary ?? false);
    setSubtitleAboveTitle(headerConfig.subtitleAboveTitle ?? false);
    setUppercaseText(headerConfig.uppercaseText ?? false);
    setShowBadge(headerConfig.showBadge ?? true);
    setBadgeText(headerConfig.badgeText ?? '');
  }
}, [component]);

// Save to config
const handleSubmit = async () => {
  await updateMutation({
    config: {
      // ... other fields
      hideHeader,
      showTitle,
      showSubtitle,
      subtitle,
      headerAlign,
      titleColorPrimary,
      subtitleAboveTitle,
      uppercaseText,
      showBadge,
      badgeText,
    },
  });
};

// Render
<HeaderConfigSection
  hideHeader={hideHeader}
  title={title}
  showTitle={showTitle}
  subtitle={subtitle}
  showSubtitle={showSubtitle}
  headerAlign={headerAlign}
  titleColorPrimary={titleColorPrimary}
  subtitleAboveTitle={subtitleAboveTitle}
  uppercaseText={uppercaseText}
  showBadge={showBadge}
  badgeText={badgeText}
  onHideHeaderChange={setHideHeader}
  onTitleChange={setTitle}
  onShowTitleChange={setShowTitle}
  onSubtitleChange={setSubtitle}
  onShowSubtitleChange={setShowSubtitle}
  onHeaderAlignChange={setHeaderAlign}
  onTitleColorPrimaryChange={setTitleColorPrimary}
  onSubtitleAboveTitleChange={setSubtitleAboveTitle}
  onUppercaseTextChange={setUppercaseText}
  onShowBadgeChange={setShowBadge}
  onBadgeTextChange={setBadgeText}
  expanded={expandedSections.header}
  onExpandedChange={(value) => setExpandedSections(prev => ({ ...prev, header: value }))}
/>
```

### Step 3: Update Runtime Component

```tsx
// components/site/home/sections/MyComponentRuntimeSection.tsx
import { SectionHeader } from '@/app/admin/home-components/_shared/components/SectionHeader';
import { extractSectionHeaderConfig } from '@/app/admin/home-components/_shared/hooks/useSectionHeaderState';

export function MyComponentRuntimeSection({ config, brandColor, title }: HomeComponentSectionProps) {
  const headerConfig = extractSectionHeaderConfig(config);
  
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          title={title}
          subtitle={headerConfig.subtitle}
          badgeText={headerConfig.badgeText}
          hideHeader={headerConfig.hideHeader}
          showTitle={headerConfig.showTitle}
          showSubtitle={headerConfig.showSubtitle}
          showBadge={headerConfig.showBadge}
          headerAlign={headerConfig.headerAlign}
          titleColorPrimary={headerConfig.titleColorPrimary}
          subtitleAboveTitle={headerConfig.subtitleAboveTitle}
          uppercaseText={headerConfig.uppercaseText}
          brandColor={brandColor}
        />
        
        {/* Component content */}
      </div>
    </section>
  );
}
```

## Backward Compatibility

`extractSectionHeaderConfig` hỗ trợ mapping từ naming conventions cũ:

```typescript
// Old naming (Benefits, Clients, Video, etc.)
heading → title (from component.title)
subHeading → subtitle

// New naming (Services, Stats)
title → title (from component.title)
subtitle → subtitle
```

## Default Behavior

Khi create new component:
- `hideHeader: false` - Header luôn hiển thị mặc định
- `showTitle: true`
- `showSubtitle: true`
- `showBadge: true`

## Components Status

### ✅ Implemented (cả create và edit):
- Stats

### 🔄 Ready to migrate:
- Benefits
- Services  
- Pricing
- Team
- Features
- Testimonials
- FAQ
- Gallery
- Partners
- Video
- Contact
- About

## Example: Stats Component

Xem implementation hoàn chỉnh tại:
- Create page: `app/admin/home-components/create/stats/page.tsx`
- Edit page: `app/admin/home-components/stats/[id]/edit/page.tsx`
- Runtime: `components/site/home/sections/StatsRuntimeSection.tsx`
- Preview: `app/admin/home-components/stats/_components/StatsPreview.tsx`

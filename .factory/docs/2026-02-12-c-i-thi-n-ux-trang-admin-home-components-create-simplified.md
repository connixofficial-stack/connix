# Spec: Cải thiện UX trang /admin/home-components/create

## DARE Analysis Summary

**Vấn đề:** 
- Grid 29 components flat → cognitive overload
- Không CoC → không gợi ý thứ tự tự nhiên
- Helper text rối mắt
- Không cảnh báo singleton (Hero, Footer)

**Research findings (2026):**
- Progressive Disclosure: Tier structure (essential → all)
- Tooltip vs Inline: Tooltip cho supplemental info, không show mặc định
- Convention over Configuration: Recommended patterns guide users

**Review spec cũ:**
- ✅ Hướng đúng (tier, visual feedback)
- ❌ Tooltip component KHÔNG TỒN TẠI trong `ui.tsx`
- ❌ Query `listAll` fetch 100 items → lãng phí bandwidth
- ❌ Complexity cao (TooltipProvider wrap mỗi card)

---

## 3 Options Implementation

### Option A - Simple (title attribute) ⭐ RECOMMENDED

**Ưu điểm:**
- KISS: Dùng native HTML `title`
- YAGNI: Không thêm dependency
- Query optimization: Dùng `getStats` (1 query thay 100 items)
- Code đơn giản, maintain dễ

**Nhược điểm:**
- `title` không custom style
- Mobile không hover

**Use case:** Admin dashboard (chủ yếu desktop)

---

### Option B - CSS-only Tooltip

**Ưu điểm:**
- Custom style được
- Không cần library
- Tailwind `group` pattern đơn giản

**Nhược điểm:**
- Phức tạp hơn `title`
- Mobile vẫn không hover
- A11y cần handle thủ công

---

### Option C - Radix UI Tooltip

**Ưu điểm:**
- Accessibility tốt nhất
- Mobile support (click to show)
- Custom style đầy đủ

**Nhược điểm:**
- Thêm dependency `@radix-ui/react-tooltip`
- Code complexity cao
- Wrap TooltipProvider cho mỗi card

---

## Implementation Steps (Option A)

### 1. Sửa `shared.tsx` - Sắp xếp + Metadata

**File:** `app/admin/home-components/create/shared.tsx`

**Thay đổi:**

```ts
export const COMPONENT_TYPES = [
  // 1. Above the fold
  { value: 'Hero', label: 'Hero Banner', description: 'Banner chính đầu trang', icon: LayoutTemplate, route: 'hero', singleton: true, recommended: true, position: 1 },
  
  // 2. Trust & Stats
  { value: 'Stats', label: 'Thống kê', description: 'Số liệu nổi bật', icon: AlertCircle, route: 'stats', recommended: true, position: 2 },
  { value: 'Partners', label: 'Đối tác / Logos', description: 'Logo đối tác, khách hàng', icon: Users, route: 'gallery?type=Partners', recommended: false, position: 3 },
  { value: 'TrustBadges', label: 'Chứng nhận', description: 'Giải thưởng, chứng chỉ', icon: Award, route: 'gallery?type=TrustBadges', recommended: false, position: 4 },
  
  // 3. Core Content
  { value: 'ProductCategories', label: 'Danh mục sản phẩm', description: 'Hiển thị danh mục SP', icon: FolderTree, route: 'product-categories', recommended: true, position: 5 },
  { value: 'ProductList', label: 'Danh sách Sản phẩm', description: 'Sản phẩm theo danh mục', icon: Package, route: 'product-list?type=ProductList', recommended: true, position: 6 },
  { value: 'CategoryProducts', label: 'Sản phẩm theo danh mục', description: 'SP trong từng danh mục', icon: ShoppingBag, route: 'category-products', recommended: false, position: 7 },
  { value: 'ServiceList', label: 'Danh sách Dịch vụ', description: 'Các dịch vụ cung cấp', icon: Briefcase, route: 'product-list?type=ServiceList', recommended: false, position: 8 },
  { value: 'Blog', label: 'Tin tức / Blog', description: 'Bài viết mới nhất', icon: FileText, route: 'product-list?type=Blog', recommended: false, position: 9 },
  
  // 4. Value Props
  { value: 'Benefits', label: 'Lợi ích', description: 'Tại sao chọn chúng tôi', icon: Check, route: 'benefits', recommended: false, position: 10 },
  { value: 'Features', label: 'Tính năng', description: 'Tính năng nổi bật với icon grid', icon: Zap, route: 'features', recommended: false, position: 11 },
  { value: 'Services', label: 'Dịch vụ chi tiết', description: 'Mô tả dịch vụ', icon: Briefcase, route: 'services', recommended: false, position: 12 },
  { value: 'Process', label: 'Quy trình', description: 'Các bước quy trình/timeline cho dịch vụ', icon: LayoutTemplate, route: 'process', recommended: false, position: 13 },
  
  // 5. Social Proof
  { value: 'Testimonials', label: 'Đánh giá / Review', description: 'Ý kiến khách hàng', icon: Star, route: 'testimonials', recommended: false, position: 14 },
  { value: 'CaseStudy', label: 'Dự án thực tế', description: 'Case study tiêu biểu', icon: FileText, route: 'case-study', recommended: false, position: 15 },
  { value: 'Gallery', label: 'Thư viện ảnh', description: 'Hình ảnh hoạt động', icon: ImageIcon, route: 'gallery?type=Gallery', recommended: false, position: 16 },
  { value: 'Clients', label: 'Khách hàng (Marquee)', description: 'Logo khách hàng chạy auto-scroll', icon: Users, route: 'clients', recommended: false, position: 17 },
  
  // 6. Conversion
  { value: 'CTA', label: 'Kêu gọi hành động (CTA)', description: 'Nút đăng ký, mua ngay', icon: MousePointerClick, route: 'cta', recommended: true, position: 18 },
  { value: 'Pricing', label: 'Bảng giá', description: 'Các gói dịch vụ', icon: Tag, route: 'pricing', recommended: false, position: 19 },
  { value: 'VoucherPromotions', label: 'Voucher khuyến mãi', description: 'Voucher khuyến mãi với CTA dẫn tới ưu đãi', icon: Tag, route: 'voucher-promotions', recommended: false, position: 20 },
  { value: 'Countdown', label: 'Khuyến mãi / Countdown', description: 'Banner khuyến mãi với đếm ngược thời gian', icon: AlertCircle, route: 'countdown', recommended: false, position: 21 },
  
  // 7. Engagement
  { value: 'FAQ', label: 'Câu hỏi thường gặp', description: 'Hỏi đáp', icon: HelpCircle, route: 'faq', recommended: true, position: 22 },
  { value: 'About', label: 'Về chúng tôi', description: 'Giới thiệu ngắn gọn', icon: UserIcon, route: 'about', recommended: false, position: 23 },
  { value: 'Team', label: 'Đội ngũ', description: 'Giới thiệu đội ngũ với ảnh, chức vụ, social links', icon: UserCircle, route: 'team', recommended: false, position: 24 },
  { value: 'Video', label: 'Video / Media', description: 'Video giới thiệu hoặc demo sản phẩm', icon: LayoutTemplate, route: 'video', recommended: false, position: 25 },
  
  // 8. Bottom
  { value: 'Contact', label: 'Liên hệ', description: 'Form liên hệ, bản đồ', icon: Phone, route: 'contact', recommended: false, position: 26 },
  { value: 'Career', label: 'Tuyển dụng', description: 'Vị trí đang tuyển', icon: Users, route: 'career', recommended: false, position: 27 },
  { value: 'Footer', label: 'Footer', description: 'Chân trang', icon: LayoutTemplate, route: 'footer', singleton: true, recommended: true, position: 28 },
  { value: 'SpeedDial', label: 'Speed Dial', description: 'Nút liên hệ nhanh (FAB)', icon: Zap, route: 'speed-dial', recommended: false, position: 29 },
];
```

**Logic:**
- Đổi `order` → `position` (tránh nhầm với DB field)
- Sắp xếp theo homepage flow (Hero → Stats → Products → CTA → FAQ → Footer)
- `recommended`: 7 components (Hero, Stats, ProductCategories, ProductList, CTA, FAQ, Footer)
- `singleton`: Hero, Footer

---

### 2. Sửa `page.tsx` - Query + UI

**File:** `app/admin/home-components/create/page.tsx`

**Code đầy đủ:**

```tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../../components/ui';
import { COMPONENT_TYPES } from './shared';
import { Star, Check } from 'lucide-react';

export default function HomeComponentCreatePage() {
  const stats = useQuery(api.homeComponents.getStats);
  
  // Map: { Hero: 1, Stats: 2, ... }
  const typeCounts = useMemo(() => {
    if (!stats) return {};
    return Object.fromEntries(
      stats.typeBreakdown.map(t => [t.type, t.count])
    );
  }, [stats]);

  const recommended = COMPONENT_TYPES.filter(t => t.recommended);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm Component mới</h1>
        <Link href="/admin/home-components" className="text-sm text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>

      {/* Recommended Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="text-yellow-500" size={18} />
            Gợi ý cho bạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommended.map(type => (
              <ComponentCard key={type.value} type={type} count={typeCounts[type.value] || 0} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Components */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tất cả Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {COMPONENT_TYPES.map(type => (
              <ComponentCard key={type.value} type={type} count={typeCounts[type.value] || 0} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ComponentCardProps {
  type: typeof COMPONENT_TYPES[0];
  count: number;
}

function ComponentCard({ type, count }: ComponentCardProps) {
  const Icon = type.icon;
  const exists = count > 0;
  const shouldWarn = type.singleton && exists;

  // Tooltip text
  const tooltipText = shouldWarn
    ? `${type.label} đã được thêm (${count}). Thông thường chỉ nên có 1 ${type.label.toLowerCase()} trên trang.`
    : type.description;

  return (
    <Link
      href={`/admin/home-components/create/${type.route}`}
      title={tooltipText}
      className={cn(
        "relative cursor-pointer border-2 rounded-xl p-4 transition-all",
        "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10",
        "border-slate-200 dark:border-slate-700",
        shouldWarn && "opacity-60 hover:opacity-70"
      )}
    >
      {/* Badge góc trên phải */}
      {type.recommended && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs font-medium text-yellow-700 dark:text-yellow-400">
          Gợi ý
        </div>
      )}

      {/* Icon + Count */}
      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 relative">
        <Icon size={24} className="text-slate-600 dark:text-slate-400" />
        {exists && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{count}</span>
          </div>
        )}
      </div>

      {/* Label */}
      <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
        {type.label}
        {exists && <Check size={14} className="text-green-600" />}
      </h3>
    </Link>
  );
}
```

**Thay đổi:**
- Query `getStats` thay `listAll` → reduce bandwidth
- Dùng `title` attribute cho tooltip → không cần component
- Badge "Gợi ý" cho recommended
- Count badge + check icon cho existing
- Opacity 60% nếu singleton đã tồn tại

---

## Kết quả mong đợi

✅ **Smart UX ngầm:**
- Section "Gợi ý cho bạn" (7 components)
- Thứ tự theo homepage flow (Hero → Stats → Products → CTA → FAQ → Footer)
- Không helper text mặc định, chỉ tooltip on hover

✅ **Convention over Configuration:**
- Visual feedback: badge count, check icon, opacity
- Warning ngầm cho singleton: opacity + tooltip

✅ **Progressive Disclosure:**
- Tier 1: "Gợi ý cho bạn" (7)
- Tier 2: "Tất cả Components" (29)

✅ **Performance:**
- 1 query `getStats` thay vì fetch 100 items
- KISS: không thêm dependency

---

## Files cần sửa

1. `app/admin/home-components/create/shared.tsx`:
   - Sắp xếp lại `COMPONENT_TYPES`
   - Thêm `singleton`, `recommended`, `position`

2. `app/admin/home-components/create/page.tsx`:
   - Query `getStats`
   - 2 sections: Recommended + All
   - ComponentCard với `title` tooltip
   - Visual feedback (badge, count, opacity)

---

## Tuân thủ AGENTS.md

- ✅ KISS: Dùng `title` thay Tooltip component
- ✅ YAGNI: Không thêm dependency không cần thiết
- ✅ DRY: Tái dụng `getStats` query có sẵn
- ✅ CoC: Recommended defaults guide users
- ✅ DB Bandwidth Optimization: 1 query thay 100 items
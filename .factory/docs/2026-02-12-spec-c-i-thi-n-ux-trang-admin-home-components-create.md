# Spec: Cải thiện UX trang /admin/home-components/create

## Vấn đề hiện tại
- Grid 29 components flat, khó chọn cho admin
- Không có Convention over Configuration (CoC): không gợi ý thứ tự tự nhiên, không cảnh báo singleton
- Thiếu Progressive Disclosure: show quá nhiều helper text và components cùng lúc
- Không có guided workflow: không biết component nào nên thêm trước/sau

## Giải pháp (theo DARE Framework)

### 1. Smart Ordering - Sắp xếp theo thứ tự Homepage tự nhiên

**File: `app/admin/home-components/create/shared.tsx`**

Sắp xếp lại `COMPONENT_TYPES` theo homepage flow:
1. **Above the fold:** Hero
2. **Trust & Stats:** Stats, Partners/Clients
3. **Core Content:** ProductList, ServiceList, ProductCategories, CategoryProducts
4. **Value Props:** Benefits, Features, Services
5. **Social Proof:** Testimonials, TrustBadges, CaseStudy, Gallery
6. **Conversion:** CTA, Pricing, VoucherPromotions, Countdown
7. **Engagement:** FAQ, About, Team, Process, Video
8. **Bottom:** Contact, Career, Footer, SpeedDial, Blog

**Thêm metadata:**
```typescript
export const COMPONENT_TYPES = [
  { 
    value: 'Hero', 
    label: 'Hero Banner', 
    description: 'Banner chính đầu trang',
    icon: LayoutTemplate, 
    route: 'hero',
    category: 'essential', // 'essential' | 'content' | 'social-proof' | 'conversion' | 'footer'
    singleton: true, // Chỉ nên có 1
    recommended: true, // Hiển thị badge "Recommended"
    order: 1
  },
  // ... sắp xếp lại theo order
];
```

---

### 2. Visual Indicators - Convention over Configuration

**File: `app/admin/home-components/create/page.tsx`**

**Thay đổi logic:**
1. Query `api.homeComponents.listAll` để lấy existing components
2. Map existing components theo type để check đã thêm chưa
3. Hiển thị visual feedback:
   - Badge "✓ Đã thêm (2)" nếu đã có
   - Opacity 60% + cursor-not-allowed nếu singleton đã tồn tại
   - Tooltip: "Hero Banner đã được thêm. Chỉ nên có 1 hero trên trang."

**Code structure:**
```typescript
'use client';

export default function HomeComponentCreatePage() {
  const existingComponents = useQuery(api.homeComponents.listAll);
  
  // Map: { Hero: 1, Stats: 2, ProductList: 3, ... }
  const componentCounts = useMemo(() => {
    if (!existingComponents) return {};
    return existingComponents.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [existingComponents]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thêm Component mới</h1>
        <Link href="/admin/home-components">← Quay lại danh sách</Link>
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
            {COMPONENT_TYPES
              .filter(t => t.recommended)
              .map(type => (
                <ComponentCard 
                  key={type.value} 
                  type={type} 
                  count={componentCounts[type.value] || 0}
                />
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
              <ComponentCard 
                key={type.value} 
                type={type} 
                count={componentCounts[type.value] || 0}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 3. ComponentCard - Smart UI với Tooltip

**File: `app/admin/home-components/create/page.tsx`**

**Tạo component mới:**
```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui';

interface ComponentCardProps {
  type: typeof COMPONENT_TYPES[0];
  count: number;
}

function ComponentCard({ type, count }: ComponentCardProps) {
  const Icon = type.icon;
  const exists = count > 0;
  const shouldWarn = type.singleton && exists;

  const card = (
    <Link 
      href={`/admin/home-components/create/${type.route}`}
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

  // Nếu singleton đã tồn tại → wrap tooltip
  if (shouldWarn) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{card}</TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {type.label} đã được thêm ({count}). <br />
              Thông thường chỉ nên có 1 {type.label.toLowerCase()} trên trang.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Nếu có description → wrap tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{type.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### 4. Loại bỏ Helper Text trực quan

**Hiện tại:**
```tsx
<p className="text-xs text-slate-500 mt-1">{type.description}</p>
```

**Sau khi sửa:**
- Loại bỏ hoàn toàn text description hiển thị mặc định
- Chỉ show trong tooltip on hover
- UI gọn gàng, tập trung vào Icon + Label

---

## Tóm tắt thay đổi

### File cần sửa:

1. **`app/admin/home-components/create/shared.tsx`**
   - Sắp xếp lại `COMPONENT_TYPES` theo thứ tự homepage flow (order 1-29)
   - Thêm metadata: `category`, `singleton`, `recommended`, `order`

2. **`app/admin/home-components/create/page.tsx`**
   - Query `api.homeComponents.listAll` để lấy existing components
   - Tạo `componentCounts` map để track số lượng từng type
   - Tách UI thành 2 sections: "Gợi ý cho bạn" (recommended) + "Tất cả Components"
   - Tạo component `ComponentCard` với:
     - Badge "Gợi ý" cho recommended
     - Count badge (số lượng đã thêm)
     - Check icon nếu đã thêm
     - Opacity 60% + tooltip warning nếu singleton đã tồn tại
     - Tooltip hiển thị description thay vì text mặc định

3. **`app/admin/home-components/create/page.tsx` imports**
   - Import Tooltip components từ `../../components/ui`

---

## Kết quả mong đợi

✅ **Smart UX ngầm:**
- Admin mới vào thấy section "Gợi ý cho bạn" với Hero, Stats, ProductList, CTA, FAQ, Footer
- Thứ tự components theo flow tự nhiên của homepage
- Không có helper text rối mắt, chỉ có tooltip on hover

✅ **Convention over Configuration:**
- Visual feedback rõ ràng: badge count, check icon, opacity
- Warning tooltip cho singleton: "Hero đã được thêm (1). Chỉ nên có 1 hero."
- Vẫn cho phép thêm (không hard block), nhưng admin hiểu không nên

✅ **Progressive Disclosure:**
- Tier 1: "Gợi ý cho bạn" (7-8 components phổ biến)
- Tier 2: "Tất cả Components" (29 components, scroll xuống)
- Description ẩn trong tooltip, không show mặc định

✅ **Guided Workflow tự nhiên:**
- Admin tự hiểu nên thêm Hero trước (vì ở đầu + badge "Gợi ý")
- Sau đó Stats, Products, CTA, FAQ, Footer (theo visual order)
- Không cần wizard phức tạp, UX tự dẫn dắt

---

## Notes
- Không cần thay đổi logic backend (Convex)
- Không breaking change: admin quen thuộc vẫn scroll tìm được component
- Tuân thủ KISS, YAGNI: chỉ implement cái cần thiết, không over-engineering

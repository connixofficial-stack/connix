# Design Document: Gallery Configurable Title

## Overview

Feature này cho phép Gallery component hiển thị tiêu đề có thể config trong cả preview (admin) và runtime (site). Design tập trung vào việc:
1. Xóa hardcoded text không cần thiết
2. Thêm title rendering vào GalleryPreview
3. Thêm title rendering vào GallerySection runtime
4. Đảm bảo consistency với các component khác (BlogSection, ServiceListSection)

## Architecture

### Component Hierarchy

```
Admin Flow:
- Create/Edit Page
  └─ GalleryPreview (nhận title prop)
      └─ Render title element (nếu title không empty)
      └─ Render gallery content

Runtime Flow:
- ComponentRenderer
  └─ GallerySection (nhận title prop)
      └─ Render title element (nếu title không empty)
      └─ Render gallery content
```

### Data Flow

1. **Create Page**: `title` state → GalleryPreview prop
2. **Edit Page**: `title` state → GalleryPreview prop
3. **Runtime**: `component.title` → GallerySection prop → Render

## Components and Interfaces

### 1. GalleryForm Component

**File**: `app/admin/home-components/gallery/_components/GalleryForm.tsx`

**Changes**:
- Xóa hardcoded "Những hình ảnh" trong CardTitle
- Giữ logic hiển thị text dựa trên componentType

**Current Code**:
```tsx
<CardTitle className="text-base">
  {componentType === 'Partners' ? 'Logo đối tác' : (componentType === 'TrustBadges' ? 'Chứng nhận' : 'Thư viện ảnh')}
</CardTitle>
```

**No changes needed** - Code đã đúng, chỉ cần verify không có hardcode "Những hình ảnh" ở nơi khác.

### 2. GalleryPreview Component

**File**: `app/admin/home-components/gallery/_components/GalleryPreview.tsx`

**Interface Update**:
```typescript
interface GalleryPreviewProps {
  items: GalleryItem[];
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  harmony?: GalleryHarmony;
  selectedStyle?: GalleryStyle;
  onStyleChange?: (style: GalleryStyle) => void;
  title?: string; // Đã có trong interface
}
```

**Implementation**:
- Thêm title rendering trước các style render functions
- Chỉ hiển thị khi title có giá trị (truthy)
- Sử dụng colors.primary cho màu text
- Style: `text-2xl md:text-3xl font-bold tracking-tighter mb-4`

**Vị trí render**: Trong mỗi style render function, thêm title element ở đầu return statement.

### 3. Create Page

**File**: `app/admin/home-components/create/gallery/page.tsx`

**Current Code**:
```tsx
<GalleryPreview
  items={...}
  brandColor={primary}
  secondary={secondary}
  mode={mode}
  harmony={harmony}
  selectedStyle={galleryStyle}
  onStyleChange={setGalleryStyle}
  title={title}  // Đã có comment "Thêm dòng này"
/>
```

**Changes**: Uncomment hoặc thêm `title={title}` prop.

### 4. Edit Page

**File**: `app/admin/home-components/gallery/[id]/edit/page.tsx`

**Current Code**:
```tsx
<GalleryPreview
  items={...}
  brandColor={primary}
  secondary={secondary}
  mode={mode}
  harmony={harmony}
  selectedStyle={galleryStyle}
  onStyleChange={setGalleryStyle}
  title={title}  // Đã có comment "Thêm dòng này"
/>
```

**Changes**: Uncomment hoặc thêm `title={title}` prop.

### 5. GallerySection Runtime

**File**: `components/site/ComponentRenderer.tsx`

**Current Code Analysis**:
- Function `GallerySection` đã nhận `title` prop
- Có đoạn code comment:
```tsx
{title && (
  <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: colors.primary }}>
    {title}
  </h2>
)}
```
- Code này nằm GIỮA `renderGalleryContent()` và phần Partners styles

**Problem**: Title element đang ở vị trí sai - nằm giữa Gallery và Partners logic.

**Solution**: Di chuyển title rendering vào TRONG `renderGalleryContent()` function.

**Implementation**:
```tsx
const renderGalleryContent = () => (
  <section className="w-full" style={{ backgroundColor: colors.neutralSurface }}>
    <div className={cn(
      'container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12',
      style === 'marquee' ? 'max-w-7xl' : 'max-w-[1600px]',
    )}>
      {/* Thêm title ở đây */}
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-4" style={{ color: colors.primary }}>
          {title}
        </h2>
      )}
      
      <div className="mx-auto mb-6 h-1 w-12 rounded-full" style={{ backgroundColor: layoutAccent }} />
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
        {/* Existing style renders */}
      </div>
    </div>
    <GalleryLightbox ... />
  </section>
);
```

## Data Models

Không có thay đổi data model. Title đã tồn tại trong:
- Component state (Create/Edit pages)
- Database schema (homeComponents.title)
- Component props (GalleryPreview, GallerySection)

## Error Handling

### Edge Cases

1. **Empty Title**: Không hiển thị title element khi `title` là empty string hoặc falsy
2. **Long Title**: CSS responsive đã handle (text-2xl md:text-3xl)
3. **Special Characters**: React tự động escape, không cần xử lý thêm

### Validation

- Title validation đã có ở form level (required field)
- Không cần validation thêm ở component level

## Testing Strategy

### Unit Tests

1. **GalleryPreview Title Rendering**
   - Test: Render title khi title prop có giá trị
   - Test: Không render title khi title prop empty
   - Test: Title có đúng style classes
   - Test: Title sử dụng đúng màu từ colors.primary

2. **GallerySection Title Rendering**
   - Test: Render title trong Gallery type
   - Test: Không render title khi title empty
   - Test: Title có đúng vị trí (trước accent bar)

3. **Create/Edit Page Integration**
   - Test: Title prop được truyền vào GalleryPreview
   - Test: Title update khi user thay đổi input

### Property-Based Tests

Không cần property-based tests cho feature này vì:
- Đây là UI rendering logic đơn giản
- Không có complex business logic
- Không có data transformation cần validate

### Manual Testing Checklist

1. Tạo Gallery mới với title "Test Gallery"
2. Verify title hiển thị trong preview
3. Save và verify title hiển thị trên site
4. Edit Gallery và thay đổi title
5. Verify title update trong preview và site
6. Test với title rất dài
7. Test với title có ký tự đặc biệt
8. Test với empty title (không hiển thị)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Analysis

Sau khi phân tích các acceptance criteria, feature này chủ yếu là UI rendering logic đơn giản với các specific examples và edge cases. Không có universal properties phức tạp cần property-based testing.

Lý do:
- Đây là feature thêm UI element (title) vào existing components
- Logic chỉ là conditional rendering: `{title && <h2>...</h2>}`
- Không có data transformation, business logic, hoặc complex state management
- Tất cả requirements đều là specific UI behaviors (render với class X, màu Y, vị trí Z)

### Testing Approach

Feature này phù hợp với **unit tests** hơn là property-based tests:

1. **Component Rendering Tests**:
   - Render GalleryPreview với title → verify h2 exists
   - Render GalleryPreview với empty title → verify h2 không exists
   - Render GallerySection với title → verify h2 exists
   - Verify style classes và colors

2. **Integration Tests**:
   - Create/Edit pages truyền title prop đúng
   - Title update khi user thay đổi input

3. **Consistency Tests**:
   - So sánh title style với BlogSection và ServiceListSection

### No Property-Based Tests Required

Feature này không cần property-based tests vì:
- Không có "for all" behaviors cần validate
- Không có data generators có ý nghĩa (title chỉ là string display)
- Không có invariants cần maintain
- Không có round-trip operations
- Không có metamorphic properties

Tất cả requirements đều là concrete examples có thể test bằng unit tests thông thường.

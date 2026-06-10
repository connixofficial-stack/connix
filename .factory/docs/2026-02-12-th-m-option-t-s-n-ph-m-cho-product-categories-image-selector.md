# Spec: Thêm option "Từ sản phẩm" cho Product Categories Image Selector

## Tổng quan
Thêm mode thứ 5 "Từ sản phẩm" cho CategoryImageSelector, cho phép admin chọn ảnh từ 1 sản phẩm cụ thể của danh mục đó.

## Chi tiết thay đổi

### 1. Cập nhật Type Definition
**File:** `app/admin/components/CategoryImageSelector.tsx`

**Thay đổi:**
```typescript
// Line ~120: Thêm 'product-image' vào type
type ImageMode = 'product-image' | 'default' | 'icon' | 'upload' | 'url';

// Line ~122: Cập nhật resolveImageMode để nhận diện format product:productId
const resolveImageMode = (value: string): ImageMode => {
  if (!value) return 'default';
  if (value.startsWith('product:')) return 'product-image';
  if (value.startsWith('icon:')) return 'icon';
  if (value.startsWith('http') || value.startsWith('/')) return 'url';
  if (value.startsWith('data:') || value.includes('convex')) return 'upload';
  return 'default';
};
```

### 2. Thêm Props cho CategoryImageSelector
**File:** `app/admin/components/CategoryImageSelector.tsx`

**Thay đổi:**
```typescript
// Line ~132: Thêm 2 props mới
interface CategoryImageSelectorProps {
  value: string;
  onChange: (value: string, mode: ImageMode) => void;
  categoryImage?: string;
  brandColor?: string;
  className?: string;
  categoryId?: string; // NEW: để fetch products
  productsData?: Array<{ _id: string; name: string; image?: string }>; // NEW: danh sách sản phẩm
}
```

### 3. Cập nhật State và Logic trong CategoryImageSelector
**File:** `app/admin/components/CategoryImageSelector.tsx`

**Thay đổi:**
```typescript
// Sau line ~147, thêm state mới:
const [selectedProductId, setSelectedProductId] = useState<string>(
  initialMode === 'product-image' ? value.replace('product:', '') : ''
);

// Cập nhật useEffect để sync với value prop (line ~158):
useEffect(() => {
  const newMode = resolveImageMode(value);
  setMode(newMode);
  if (newMode === 'product-image') {
    setSelectedProductId(value.replace('product:', ''));
  } else if (newMode === 'icon') {
    setSelectedIcon(value.replace('icon:', ''));
  } else if (newMode === 'url') {
    setUrlInput(value);
  } else if (newMode === 'upload') {
    setUploadedUrl(value);
  }
}, [value]);

// Cập nhật handleModeChange (line ~171):
const handleModeChange = (newMode: ImageMode) => {
  setMode(newMode);
  setShowIconPicker(false);
  if (newMode === 'default') {
    onChange('', 'default');
  } else if (newMode === 'product-image' && selectedProductId) {
    onChange(`product:${selectedProductId}`, 'product-image');
  } else if (newMode === 'icon' && selectedIcon) {
    onChange(`icon:${selectedIcon}`, 'icon');
  } else if (newMode === 'url' && urlInput) {
    onChange(urlInput, 'url');
  } else if (newMode === 'upload' && uploadedUrl) {
    onChange(uploadedUrl, 'upload');
  }
};

// Thêm handler mới cho product selection:
const handleProductSelect = (productId: string) => {
  setSelectedProductId(productId);
  onChange(`product:${productId}`, 'product-image');
};
```

### 4. Cập nhật UI Tabs Order
**File:** `app/admin/components/CategoryImageSelector.tsx`

**Thay đổi (line ~254):**
```tsx
{/* Mode tabs - Đổi thứ tự: Product-image, Default, Icon, Upload, URL */}
<div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
  <button /* "Từ sản phẩm" - ĐẦU TIÊN */
    type="button"
    onClick={() => handleModeChange('product-image')}
    className={cn(
      "flex-1 min-w-[90px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
      mode === 'product-image' 
        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
        : "text-slate-500 hover:text-slate-700"
    )}
  >
    Từ sản phẩm
  </button>
  <button /* "Mặc định" - THỨ 2 */
    type="button"
    onClick={() => handleModeChange('default')}
    className={cn(
      "flex-1 min-w-[70px] px-2 py-1.5 text-xs font-medium rounded-md transition-all",
      mode === 'default' 
        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
        : "text-slate-500 hover:text-slate-700"
    )}
  >
    Mặc định
  </button>
  {/* Icon, Upload, URL giữ nguyên */}
  {/* ... existing buttons ... */}
</div>
```

### 5. Thêm UI Render cho Mode Product-Image
**File:** `app/admin/components/CategoryImageSelector.tsx`

**Thêm sau Mode: URL (line ~370):**
```tsx
{/* Mode: Product Image - Chọn sản phẩm từ dropdown */}
{mode === 'product-image' && (
  <div className="space-y-3">
    {/* Selected product preview */}
    {selectedProductId && productsData && (() => {
      const product = productsData.find(p => p._id === selectedProductId);
      return product ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            {product.image ? (
              <Image src={product.image} width={48} height={48} alt="" className="object-cover" />
            ) : (
              <ImageIcon size={20} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-slate-500">Ảnh từ sản phẩm</p>
          </div>
        </div>
      ) : null;
    })()}

    {/* Product dropdown */}
    <div className="space-y-2">
      <Label className="text-xs text-slate-500">Chọn sản phẩm</Label>
      {productsData && productsData.length > 0 ? (
        <select
          value={selectedProductId}
          onChange={(e) => handleProductSelect(e.target.value)}
          className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
        >
          <option value="">-- Chọn sản phẩm --</option>
          {productsData.map(product => (
            <option key={product._id} value={product._id}>{product.name}</option>
          ))}
        </select>
      ) : (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Danh mục chưa có sản phẩm. Sẽ fallback về ảnh mặc định.
          </p>
        </div>
      )}
    </div>
  </div>
)}
```

### 6. Fetch Products Data trong Parent Component
**File:** `app/admin/home-components/create/product-categories/page.tsx`

**Thay đổi:**
```typescript
// Thêm query products theo category (sau line ~20):
const [categoryProducts, setCategoryProducts] = useState<Record<string, Array<{_id: string; name: string; image?: string}>>>({});

// Thêm useEffect để fetch products khi categoryId thay đổi:
useEffect(() => {
  const fetchProductsForCategories = async () => {
    const uniqueCategoryIds = [...new Set(selectedCategories.map(c => c.categoryId).filter(Boolean))];
    const productsMap: Record<string, any[]> = {};
    
    for (const catId of uniqueCategoryIds) {
      if (!catId || categoryProducts[catId]) continue;
      // Fetch products for this category
      const products = await convexQuery(api.products.listByCategory, {
        categoryId: catId as Id<"productCategories">,
        paginationOpts: { numItems: 20, cursor: null },
        status: "Active"
      });
      productsMap[catId] = products.page.map(p => ({
        _id: p._id,
        name: p.name,
        image: p.image
      }));
    }
    
    if (Object.keys(productsMap).length > 0) {
      setCategoryProducts(prev => ({ ...prev, ...productsMap }));
    }
  };
  
  void fetchProductsForCategories();
}, [selectedCategories]);

// Cập nhật CategoryImageSelector props (line ~235):
<CategoryImageSelector
  value={item.customImage ?? ''}
  onChange={(value, mode) => updateCategory(item.id, { customImage: value, imageMode: mode })}
  categoryImage={getCategoryImage(item.categoryId)}
  brandColor={brandColor}
  categoryId={item.categoryId}
  productsData={categoryProducts[item.categoryId] || []}
/>
```

### 7. Cập nhật Preview Component
**File:** `app/admin/home-components/previews.tsx`

**Thay đổi trong ProductCategoriesPreview (tìm hàm getCategoryDisplayImage):**
```typescript
// Tìm phần render category image (khoảng line ~2500-2600), thêm logic xử lý product-image:
const getCategoryDisplayImage = (item: CategoryConfigItem, category: CategoryData | undefined) => {
  if (!item.imageMode || item.imageMode === 'default') {
    return category?.image;
  }
  
  if (item.imageMode === 'product-image' && item.customImage?.startsWith('product:')) {
    const productId = item.customImage.replace('product:', '');
    // Fetch product image từ productsData hoặc fallback
    const product = categoriesData?.find(c => c._id === item.categoryId)?.products?.find(p => p._id === productId);
    return product?.image || category?.image; // Fallback về category image
  }
  
  if (item.imageMode === 'icon') {
    return null; // Will render icon
  }
  
  return item.customImage;
};
```

**Lưu ý:** Preview cần nhận thêm `productsData` hoặc fetch products trong component, nhưng để tránh phức tạp, có thể implement fallback logic: nếu không tìm thấy product image thì dùng category image.

### 8. Update Interface/Type
**File:** `app/admin/home-components/create/product-categories/page.tsx`

**Thay đổi (line ~12):**
```typescript
interface CategoryItem {
  id: number;
  categoryId: string;
  customImage?: string;
  imageMode?: 'product-image' | 'default' | 'icon' | 'upload' | 'url'; // Thêm product-image
}
```

## Validation & Edge Cases

1. ✅ Nếu danh mục chưa có sản phẩm → hiển thị thông báo amber, fallback về ảnh mặc định
2. ✅ Nếu chọn product nhưng product bị xóa sau → fallback về ảnh mặc định
3. ✅ Mode tabs: "Từ sản phẩm" đầu tiên, "Mặc định" thứ 2
4. ✅ Format lưu: `product:${productId}` giống pattern hiện tại (`icon:`, `url:`)

## Testing Checklist

- [ ] Chọn mode "Từ sản phẩm" → dropdown hiển thị danh sách sản phẩm của category
- [ ] Chọn sản phẩm → preview hiển thị ảnh sản phẩm đó
- [ ] Danh mục chưa có sản phẩm → hiển thị warning amber, fallback về ảnh mặc định
- [ ] Switch qua mode khác (Icon, Upload, URL) → logic vẫn hoạt động bình thường
- [ ] Save và reload → imageMode và customImage được restore đúng
- [ ] Preview component render đúng ảnh sản phẩm hoặc fallback

## Commit Message
```
feat(home-components): add product image option for category selector

- Add 'product-image' mode to CategoryImageSelector (5th option, placed first)
- Allow selecting specific product image for category display
- Fetch products by category for dropdown selection
- Fallback to default category image if no products available
- Update ProductCategoriesPreview to handle product image mode
- Format: product:productId (similar to icon: and url: patterns)
```
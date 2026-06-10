# Spec: Tối ưu hóa seed posts & gallery - Tránh seed thủ công

## 🎯 Mục tiêu
Giảm công seed thủ công cho **posts** và **gallery** bằng cách tái sử dụng ảnh từ **hero** và **products** đã có.

---

## 📊 Problem Analysis

### Hiện trạng logic seed_mau
✅ **Đã có ảnh:**
- `hero/` - 5-30 ảnh (1920x1080)
- `logos/` - 8-30 ảnh (600x300)
- `products/` - 30 ảnh (1000x1000)

⚠️ **Cần seed thêm:**
- `posts/` - 12 ảnh (1200x800)
- `gallery/` - 16 ảnh (1200x900)

❌ **Vấn đề:**
- Phải download thêm ~1,232 ảnh (44 ngành × 28 ảnh)
- Tốn bandwidth, storage, thời gian

---

## 💡 Giải pháp tối ưu

### Option 1: Smart Reuse Strategy (Recommended)
**Tái sử dụng ảnh có sẵn với logic thông minh**

#### A. Posts Images
```typescript
// posts.seeder.ts - Line 65-70
const thumbnail = template?.assets.posts?.length
  ? pickRandom(template.assets.posts, randomFn)
  : // FALLBACK: Reuse hero/products
    template?.assets.hero?.length 
      ? pickRandom(template.assets.hero, randomFn)
      : template?.assets.products?.length
        ? pickRandom(template.assets.products, randomFn)
        : `https://picsum.photos/seed/${slug}/800/600`;
```

**Ưu điểm:**
- Không cần seed `posts/` riêng
- Ảnh hero phù hợp cho bài viết (đẹp, wide format)
- Ảnh sản phẩm dùng cho bài review/giới thiệu

**Logic:**
1. Nếu có `posts/` → dùng
2. Fallback `hero/` (70% - ưu tiên banner đẹp)
3. Fallback `products/` (30% - bài review sản phẩm)

#### B. Gallery (Homepage/About sections)
**Không cần table riêng - dùng virtual gallery từ hero + products**

```typescript
// homepage.seeder.ts - Gallery component
function getGalleryImages(template: IndustryTemplate, count: number) {
  const pool = [
    ...(template.assets.hero || []),
    ...(template.assets.products || []).slice(0, 10) // Top 10 products
  ];
  return shuffleArray(pool).slice(0, count);
}
```

**Ưu điểm:**
- Không cần folder `gallery/`
- Tự động đa dạng (mix hero + products)
- Linh hoạt số lượng theo component config

---

### Option 2: Unified Image Pool
**Gộp tất cả ảnh vào 1 pool chung**

#### Cấu trúc mới
```
public/seed_mau/{industry}/
  ├── images/           # Gộp tất cả
  │   ├── 1.webp
  │   ├── 2.webp
  │   └── ...
  └── logos/            # Giữ riêng vì format khác
```

#### Template config
```typescript
// industry-template.ts
export const template = {
  assets: {
    images: [ /* tất cả ảnh */ ],
    logos: [ /* logo riêng */ ]
  },
  imageRoles: {
    hero: [1, 5, 12, ...],      // index của ảnh hero
    products: [2, 6, 13, ...],  // index của ảnh products
    // Auto-generate posts/gallery từ remaining
  }
}
```

**Ưu điểm:**
- Đơn giản nhất
- Dễ maintain
- Tránh duplicate ảnh

**Nhược điểm:**
- Phá vỡ cấu trúc folder hiện tại
- Khó phân biệt mục đích ảnh

---

## 🎨 Recommendation: **Option 1 (Smart Reuse)**

### Implementation Plan

#### Step 1: Update Posts Seeder
**File:** `convex/seeders/posts.seeder.ts`

```typescript
// Line 65-70: Update thumbnail generation
const thumbnail = this.getPostThumbnail(template, slug);

// Add new method:
private getPostThumbnail(template: IndustryTemplate | null, slug: string): string {
  const randomFn = () => this.faker.number.float({ max: 1, min: 0 });
  
  // Priority 1: Dedicated posts images
  if (template?.assets.posts?.length) {
    return pickRandom(template.assets.posts, randomFn);
  }
  
  // Priority 2: Hero images (70% chance, wider format suits blog posts)
  if (template?.assets.hero?.length && this.randomBoolean(0.7)) {
    return pickRandom(template.assets.hero, randomFn);
  }
  
  // Priority 3: Products images (30%, for product reviews)
  if (template?.assets.products?.length) {
    return pickRandom(template.assets.products, randomFn);
  }
  
  // Fallback: Placeholder
  return `https://picsum.photos/seed/${slug}/800/600`;
}
```

#### Step 2: Add Virtual Gallery Helper
**File:** `lib/seed-templates/utils.ts` (new)

```typescript
export function getGalleryImages(
  template: IndustryTemplate | null,
  count: number = 16,
  options?: {
    heroWeight?: number;    // 0-1, default 0.6
    productWeight?: number; // 0-1, default 0.4
  }
): string[] {
  if (!template) return [];
  
  const { heroWeight = 0.6, productWeight = 0.4 } = options || {};
  
  const heroCount = Math.floor(count * heroWeight);
  const productCount = count - heroCount;
  
  const heroImages = shuffleArray(template.assets.hero || []).slice(0, heroCount);
  const productImages = shuffleArray(template.assets.products || []).slice(0, productCount);
  
  return shuffleArray([...heroImages, ...productImages]);
}
```

#### Step 3: Update Homepage Seeder (if needed)
**File:** `convex/seeders/homepage.seeder.ts`

```typescript
// For gallery components:
import { getGalleryImages } from '../../lib/seed-templates/utils';

// When seeding gallery component:
const galleryImages = getGalleryImages(template, 16, {
  heroWeight: 0.5,
  productWeight: 0.5
});
```

#### Step 4: Update Scripts
**File:** `scripts/verify_seed_images.py`

```python
# Remove posts/gallery requirements
REQUIRED_COUNTS = {
    "hero": 5,
    "products": 24,
    "logos": 8,
    # "posts": 12,    # REMOVED - optional now
    # "gallery": 16,  # REMOVED - virtual
}
```

#### Step 5: Update Documentation
**File:** `README.md`

```markdown
## Seed Images Structure

Required folders per industry:
- ✅ `hero/` - 5+ images (1920x1080, for hero banners)
- ✅ `products/` - 24+ images (1000x1000, square)
- ✅ `logos/` - 8+ images (600x300, partner logos)

Optional (will fallback to hero/products):
- ⚪ `posts/` - Custom blog post thumbnails
- ⚪ `gallery/` - Not needed (auto-generated from hero+products)
```

#### Step 6: Cleanup Empty Folders
**Script:** `scripts/cleanup_empty_seed_folders.py` (new)

```python
# Remove all empty .gitkeep posts/ and gallery/ folders
import shutil
from pathlib import Path

seed_root = Path("public/seed_mau")
for industry in seed_root.iterdir():
    for folder in ["posts", "gallery"]:
        folder_path = industry / folder
        if folder_path.exists():
            files = [f for f in folder_path.iterdir() if f.name != ".gitkeep"]
            if len(files) == 0:
                shutil.rmtree(folder_path)
                print(f"Removed empty {industry.name}/{folder}/")
```

---

## 📋 Validation

### Before Implementation
```bash
# Current structure
public/seed_mau/tech/
  ├── hero/        # 30 ảnh ✅
  ├── logos/       # 30 ảnh ✅
  ├── products/    # 30 ảnh ✅
  ├── posts/       # .gitkeep only ❌
  └── gallery/     # .gitkeep only ❌
```

### After Implementation
```bash
# Optimized structure
public/seed_mau/tech/
  ├── hero/        # 30 ảnh ✅
  ├── logos/       # 30 ảnh ✅
  ├── products/    # 30 ảnh ✅
  # posts/ và gallery/ đã xóa hoặc để trống
```

### Test Cases
1. **Seed posts WITHOUT posts folder** → Should use hero fallback
2. **Seed posts WITH posts folder** → Should use dedicated images first
3. **Gallery component** → Should mix hero (60%) + products (40%)
4. **Industry without hero** → Should fallback to products only

---

## 🎯 Benefits

### Storage Savings
- ❌ Before: ~1,232 ảnh cần download (44 × 28)
- ✅ After: 0 ảnh cần download thêm

### Time Savings
- ❌ Before: ~4-6 giờ download + convert WebP
- ✅ After: 0 phút

### Flexibility
- User vẫn có thể thêm `posts/` riêng nếu muốn
- Hệ thống tự động fallback thông minh
- Gallery luôn đa dạng (mix hero + products)

### Code Quality
- Giảm duplicate ảnh
- Logic seed rõ ràng hơn
- Dễ maintain

---

## ⚠️ Trade-offs

### Pros
- ✅ Không phải seed thủ công posts/gallery
- ✅ Tận dụng tối đa ảnh có sẵn
- ✅ Linh hoạt (có thể override)
- ✅ Giảm storage/bandwidth

### Cons
- ⚠️ Posts thumbnail có thể trùng hero (nhưng ít user để ý)
- ⚠️ Gallery không có ảnh riêng biệt (nhưng vẫn đa dạng nhờ shuffle)
- ⚠️ Cần update docs để user biết logic mới

---

## 🚀 Migration Path

1. Implement code changes (Steps 1-3)
2. Update scripts (Step 4)
3. Update docs (Step 5)
4. Test với 2-3 industries
5. Cleanup empty folders (Step 6)
6. Commit với message rõ ràng

**Estimate:** ~30-45 phút implementation + 15 phút testing

---

## 📝 Conclusion

**Recommended:** Option 1 - Smart Reuse Strategy

**Lý do:**
- Giữ nguyên cấu trúc folder (backward compatible)
- Logic fallback tự nhiên và linh hoạt
- Tiết kiệm tối đa công sức seed
- User vẫn có thể customize nếu cần

**Next Action:** User approve spec → Implement code changes
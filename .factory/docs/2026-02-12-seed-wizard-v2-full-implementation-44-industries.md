# Spec: Hệ thống Seed Wizard v2 với 44+ Industry Templates - FULL IMPLEMENTATION

## 🎯 Mục tiêu

Implement đầy đủ hệ thống Seed Wizard v2 với 44+ ngành hàng, bao gồm:
- Cấu trúc thư mục hoàn chỉnh trong dự án
- TypeScript configs cho TẤT CẢ 44+ ngành
- Faker templates chi tiết cho mỗi ngành
- Color schemes research-based
- Home-components templates
- UI Integration vào Seed Wizard
- Convex seeders enhancement
- Documentation đầy đủ

**KHÔNG chia phase** - làm xong tất cả một lần!

---

## 📁 FULL Directory Structure

```
E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/

├── public/
│   └── seed_mau/                          # Ảnh mẫu (user tự upload sau)
│       ├── .gitkeep
│       ├── fashion/
│       │   ├── banners/                   # 1.jpg -> 5.jpg
│       │   ├── products/                  # 1.jpg -> 15.jpg
│       │   ├── posts/                     # 1.jpg -> 5.jpg
│       │   ├── avatars/                   # 1.jpg -> 3.jpg
│       │   └── categories/                # 1.jpg -> 5.jpg
│       ├── beauty/
│       │   └── ... (same structure)
│       └── ... (42 ngành khác, same structure)
│
├── lib/
│   └── seed-templates/
│       ├── README.md                      # Hướng dẫn chi tiết
│       ├── INDUSTRY_LIST.md               # Bảng 44 ngành
│       ├── types.ts                       # TypeScript types
│       ├── index.ts                       # Export tất cả
│       ├── utils.ts                       # Helper functions
│       │
│       ├── fashion/
│       │   ├── index.ts                   # Export fashionTemplate
│       │   ├── config.ts                  # IndustryConfig
│       │   ├── faker-templates.ts         # FakerTemplates
│       │   ├── colors.ts                  # ColorConfig
│       │   ├── home-components.ts         # HomeComponentsTemplate
│       │   └── metadata.ts                # IndustryMetadata
│       │
│       ├── beauty/
│       │   └── ... (6 files, same structure)
│       │
│       ├── cosmetics/
│       │   └── ... (6 files)
│       │
│       ├── jewelry/
│       │   └── ... (6 files)
│       │
│       ├── perfume/
│       │   └── ... (6 files)
│       │
│       ├── lingerie/
│       │   └── ... (6 files)
│       │
│       ├── tech/
│       │   └── ... (6 files)
│       │
│       ├── electronics/
│       │   └── ... (6 files)
│       │
│       ├── ai-accounts/
│       │   └── ... (6 files)
│       │
│       ├── gaming-accounts/
│       │   └── ... (6 files)
│       │
│       ├── restaurant/
│       │   └── ... (6 files)
│       │
│       ├── cafe/
│       │   └── ... (6 files)
│       │
│       ├── food/
│       │   └── ... (6 files)
│       │
│       ├── seafood/
│       │   └── ... (6 files)
│       │
│       ├── bakery/
│       │   └── ... (6 files)
│       │
│       ├── healthcare/
│       │   └── ... (6 files)
│       │
│       ├── pharmacy/
│       │   └── ... (6 files)
│       │
│       ├── beauty-spa/
│       │   └── ... (6 files)
│       │
│       ├── spa/
│       │   └── ... (6 files)
│       │
│       ├── massage/
│       │   └── ... (6 files)
│       │
│       ├── hair-salon/
│       │   └── ... (6 files)
│       │
│       ├── fitness/
│       │   └── ... (6 files)
│       │
│       ├── gym/
│       │   └── ... (6 files)
│       │
│       ├── yoga/
│       │   └── ... (6 files)
│       │
│       ├── vet/
│       │   └── ... (6 files)
│       │
│       ├── home-furniture/
│       │   └── ... (6 files)
│       │
│       ├── baby-care/
│       │   └── ... (6 files)
│       │
│       ├── books/
│       │   └── ... (6 files)
│       │
│       ├── stationery/
│       │   └── ... (6 files)
│       │
│       ├── multi-category/
│       │   └── ... (6 files)
│       │
│       ├── gifts/
│       │   └── ... (6 files)
│       │
│       ├── handicraft/
│       │   └── ... (6 files)
│       │
│       ├── auto-parts/
│       │   └── ... (6 files)
│       │
│       ├── auto/
│       │   └── ... (6 files)
│       │
│       ├── appliances/
│       │   └── ... (6 files)
│       │
│       ├── music-instruments/
│       │   └── ... (6 files)
│       │
│       ├── travel/
│       │   └── ... (6 files)
│       │
│       ├── hotel/
│       │   └── ... (6 files)
│       │
│       ├── business/
│       │   └── ... (6 files)
│       │
│       ├── manufacturing/
│       │   └── ... (6 files)
│       │
│       ├── construction/
│       │   └── ... (6 files)
│       │
│       ├── real-estate/
│       │   └── ... (6 files)
│       │
│       ├── design-services/
│       │   └── ... (6 files)
│       │
│       ├── courses/
│       │   └── ... (6 files)
│       │
│       ├── affiliate-shop/
│       │   └── ... (6 files)
│       │
│       └── environment/
│           └── ... (6 files)
│
├── components/data/
│   ├── SeedWizardDialog.tsx               # UPDATE: Add industry step
│   └── seed-wizard/
│       ├── types.ts                       # UPDATE: Add industryKey
│       └── steps/
│           └── IndustrySelectionStep.tsx  # NEW
│
├── convex/
│   ├── seedManager.ts                     # UPDATE: Add industryKey param
│   ├── homepage.ts                        # UPDATE: Add seedFromIndustryTemplate
│   └── seeders/
│       ├── products.seeder.ts             # UPDATE: Support industry templates
│       ├── posts.seeder.ts                # UPDATE: Support industry templates
│       └── productCategories.seeder.ts    # UPDATE: Use industry categories
│
└── .gitignore                             # UPDATE: Add seed_mau exclusions

TOTAL FILES TO CREATE/UPDATE:
- NEW: 44 industries × 6 files = 264 files
- NEW: 4 base files (types.ts, index.ts, utils.ts, README.md, INDUSTRY_LIST.md) = 5 files
- NEW: 1 UI component (IndustrySelectionStep.tsx)
- NEW: 44 × 5 image folders = 220 folders in public/seed_mau/
- UPDATE: 7 existing files
TOTAL: 270+ new files, 7 updates
```

---

## 📦 FULL TypeScript Schemas

### File: `lib/seed-templates/types.ts`

```typescript
export type WebsiteType = 'landing' | 'blog' | 'catalog' | 'ecommerce' | 'services';
export type SaleMode = 'cart' | 'contact' | 'affiliate';
export type ProductType = 'physical' | 'digital' | 'both';
export type DataScale = 'low' | 'medium' | 'high';
export type IndustryCategory = 
  | 'fashion-beauty' 
  | 'food-beverage' 
  | 'health-wellness' 
  | 'technology' 
  | 'business' 
  | 'retail' 
  | 'services' 
  | 'environment';

export type IndustryConfig = {
  industryKey: string;
  industryName: string;
  websiteTypes: WebsiteType[];
  saleMode: SaleMode;
  productType: ProductType;
  defaultBusinessInfo: {
    siteName: string;
    tagline: string;
    businessType: string; // Schema.org type
  };
  dataScale: DataScale;
};

export type FakerTemplates = {
  products: {
    namePatterns: string[];
    descriptionTemplate: string;
    customFields: Record<string, string[]>;
  };
  posts: {
    titlePatterns: string[];
    contentTemplate?: string;
  };
  categories: {
    productCategories?: string[];
    postCategories?: string[];
  };
};

export type ColorConfig = {
  brandColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  palette: {
    name: string;
    colors: string[]; // 5 colors từ light -> dark
  };
};

export type HomeComponentConfig = {
  type: 'hero-banner' | 'product-categories' | 'featured-products' | 'about' | 'voucher-promotions' | 'posts-list' | 'services-list' | 'stats' | 'partners';
  style: number;
  config: Record<string, any>;
};

export type HomeComponentsTemplate = {
  components: HomeComponentConfig[];
};

export type IndustryMetadata = {
  version: string;
  author: string;
  tags: string[];
  category: IndustryCategory;
  icon: string; // Emoji
  description?: string;
};

export type IndustryTemplate = {
  config: IndustryConfig;
  faker: FakerTemplates;
  colors: ColorConfig;
  homeComponents: HomeComponentsTemplate;
  metadata: IndustryMetadata;
};

export type IndustryListItem = {
  key: string;
  name: string;
  icon: string;
  category: IndustryCategory;
  description?: string;
};
```

### File: `lib/seed-templates/utils.ts`

```typescript
import type { IndustryTemplate } from './types';

/**
 * Get image paths for an industry
 */
export function getIndustryImagePaths(industryKey: string) {
  const base = `/seed_mau/${industryKey}`;
  return {
    banners: `${base}/banners`,
    products: `${base}/products`,
    posts: `${base}/posts`,
    avatars: `${base}/avatars`,
    categories: `${base}/categories`,
  };
}

/**
 * Get random image from industry folder
 * @param industryKey - Industry key
 * @param category - Image category (banners, products, etc.)
 * @param max - Max number of images in that category
 */
export function getRandomIndustryImage(
  industryKey: string, 
  category: 'banners' | 'products' | 'posts' | 'avatars' | 'categories',
  max: number = 10
): string {
  const randomNum = Math.floor(Math.random() * max) + 1;
  return `/seed_mau/${industryKey}/${category}/${randomNum}.jpg`;
}

/**
 * Interpolate Faker pattern with custom fields
 * Example: "{{clothing}} {{color}}" -> "Áo thun Đen"
 */
export function interpolateFakerPattern(
  pattern: string,
  customFields: Record<string, string[]>
): string {
  let result = pattern;
  const regex = /{{(\w+)}}/g;
  
  result = result.replace(regex, (match, fieldName) => {
    if (customFields[fieldName]) {
      const values = customFields[fieldName];
      const randomValue = values[Math.floor(Math.random() * values.length)];
      return randomValue;
    }
    
    // Fallback for common patterns
    if (fieldName === 'number') {
      return String(Math.floor(Math.random() * 16) + 5);
    }
    if (fieldName === 'year') {
      return '2026';
    }
    
    return match; // Keep original if not found
  });
  
  return result;
}

/**
 * Get category label in Vietnamese
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'fashion-beauty': 'Thời trang & Làm đẹp',
    'food-beverage': 'Ẩm thực',
    'health-wellness': 'Sức khỏe & Wellness',
    'technology': 'Công nghệ',
    'business': 'Kinh doanh',
    'retail': 'Bán lẻ',
    'services': 'Dịch vụ',
    'environment': 'Môi trường',
  };
  return labels[category] || category;
}
```

---

## 🎨 FULL COLOR SCHEMES (44 Industries)

Dựa trên research về color psychology cho từng ngành:

```typescript
// Color mapping cho TẤT CẢ 44 ngành
const INDUSTRY_COLORS = {
  fashion: { brand: '#e91e63', primary: '#f06292', secondary: '#ad1457', name: 'Fashion Pink' },
  beauty: { brand: '#f06292', primary: '#ec407a', secondary: '#d81b60', name: 'Rose Gold' },
  cosmetics: { brand: '#ff69b4', primary: '#ff85c0', secondary: '#ff1493', name: 'Cosmetic Pink' },
  jewelry: { brand: '#ffc107', primary: '#ffca28', secondary: '#ffa000', name: 'Luxury Gold' },
  perfume: { brand: '#9c27b0', primary: '#ab47bc', secondary: '#7b1fa2', name: 'Perfume Purple' },
  lingerie: { brand: '#e91e63', primary: '#f06292', secondary: '#c2185b', name: 'Lingerie Pink' },
  
  tech: { brand: '#2196f3', primary: '#42a5f5', secondary: '#1976d2', name: 'Tech Blue' },
  electronics: { brand: '#3f51b5', primary: '#5c6bc0', secondary: '#303f9f', name: 'Electric Indigo' },
  'ai-accounts': { brand: '#00bcd4', primary: '#26c6da', secondary: '#0097a7', name: 'AI Cyan' },
  'gaming-accounts': { brand: '#9c27b0', primary: '#ba68c8', secondary: '#7b1fa2', name: 'Gaming Purple' },
  
  restaurant: { brand: '#ff5722', primary: '#ff7043', secondary: '#e64a19', name: 'Restaurant Orange' },
  cafe: { brand: '#795548', primary: '#8d6e63', secondary: '#5d4037', name: 'Coffee Brown' },
  food: { brand: '#ff9800', primary: '#ffa726', secondary: '#f57c00', name: 'Food Orange' },
  seafood: { brand: '#00bcd4', primary: '#26c6da', secondary: '#0097a7', name: 'Ocean Cyan' },
  bakery: { brand: '#ffeb3b', primary: '#fff176', secondary: '#fbc02d', name: 'Bakery Yellow' },
  
  healthcare: { brand: '#4caf50', primary: '#66bb6a', secondary: '#388e3c', name: 'Health Green' },
  pharmacy: { brand: '#00bcd4', primary: '#26c6da', secondary: '#0097a7', name: 'Pharmacy Cyan' },
  'beauty-spa': { brand: '#9c27b0', primary: '#ab47bc', secondary: '#7b1fa2', name: 'Spa Purple' },
  spa: { brand: '#9c27b0', primary: '#ba68c8', secondary: '#8e24aa', name: 'Spa Lavender' },
  massage: { brand: '#673ab7', primary: '#9575cd', secondary: '#512da8', name: 'Massage Purple' },
  'hair-salon': { brand: '#e91e63', primary: '#f06292', secondary: '#c2185b', name: 'Salon Pink' },
  fitness: { brand: '#f44336', primary: '#ef5350', secondary: '#c62828', name: 'Fitness Red' },
  gym: { brand: '#ff5722', primary: '#ff7043', secondary: '#e64a19', name: 'Gym Orange' },
  yoga: { brand: '#9c27b0', primary: '#ab47bc', secondary: '#7b1fa2', name: 'Yoga Purple' },
  vet: { brand: '#4caf50', primary: '#66bb6a', secondary: '#388e3c', name: 'Vet Green' },
  
  'home-furniture': { brand: '#795548', primary: '#8d6e63', secondary: '#5d4037', name: 'Wood Brown' },
  'baby-care': { brand: '#ffb3d9', primary: '#ffc0cb', secondary: '#ff69b4', name: 'Baby Pink' },
  books: { brand: '#3f51b5', primary: '#5c6bc0', secondary: '#303f9f', name: 'Book Blue' },
  stationery: { brand: '#2196f3', primary: '#42a5f5', secondary: '#1976d2', name: 'Stationery Blue' },
  'multi-category': { brand: '#ff9800', primary: '#ffa726', secondary: '#f57c00', name: 'Multi Orange' },
  gifts: { brand: '#e91e63', primary: '#f06292', secondary: '#ad1457', name: 'Gift Pink' },
  handicraft: { brand: '#795548', primary: '#a1887f', secondary: '#6d4c41', name: 'Craft Brown' },
  'auto-parts': { brand: '#607d8b', primary: '#78909c', secondary: '#455a64', name: 'Auto Gray' },
  auto: { brand: '#212121', primary: '#424242', secondary: '#000000', name: 'Auto Black' },
  appliances: { brand: '#607d8b', primary: '#78909c', secondary: '#546e7a', name: 'Appliance Gray' },
  'music-instruments': { brand: '#ff5722', primary: '#ff7043', secondary: '#e64a19', name: 'Music Orange' },
  
  travel: { brand: '#00bcd4', primary: '#26c6da', secondary: '#00acc1', name: 'Travel Cyan' },
  hotel: { brand: '#3f51b5', primary: '#5c6bc0', secondary: '#303f9f', name: 'Hotel Blue' },
  
  business: { brand: '#2196f3', primary: '#42a5f5', secondary: '#1976d2', name: 'Business Blue' },
  manufacturing: { brand: '#607d8b', primary: '#78909c', secondary: '#546e7a', name: 'Industry Gray' },
  construction: { brand: '#ff9800', primary: '#ffa726', secondary: '#f57c00', name: 'Construction Orange' },
  'real-estate': { brand: '#3f51b5', primary: '#5c6bc0', secondary: '#303f9f', name: 'Real Estate Blue' },
  'design-services': { brand: '#9c27b0', primary: '#ab47bc', secondary: '#7b1fa2', name: 'Design Purple' },
  courses: { brand: '#4caf50', primary: '#66bb6a', secondary: '#388e3c', name: 'Education Green' },
  'affiliate-shop': { brand: '#ff5722', primary: '#ff7043', secondary: '#e64a19', name: 'Affiliate Orange' },
  
  environment: { brand: '#4caf50', primary: '#66bb6a', secondary: '#2e7d32', name: 'Eco Green' },
};
```

---

## 📝 SAMPLE INDUSTRY CONFIG (Sẽ nhân bản cho 44 ngành)

### Example: Fashion (sẽ làm tương tự cho 43 ngành còn lại)

**File: `lib/seed-templates/fashion/config.ts`**

```typescript
import type { IndustryConfig } from '../types';

export const fashionConfig: IndustryConfig = {
  industryKey: 'fashion',
  industryName: 'Thời trang',
  websiteTypes: ['catalog', 'ecommerce'],
  saleMode: 'cart',
  productType: 'physical',
  defaultBusinessInfo: {
    siteName: 'Fashion Store',
    tagline: 'Phong cách là tất cả',
    businessType: 'ClothingStore',
  },
  dataScale: 'medium',
};
```

**File: `lib/seed-templates/fashion/faker-templates.ts`**

```typescript
import type { FakerTemplates } from '../types';

export const fashionFakerTemplates: FakerTemplates = {
  products: {
    namePatterns: [
      '{{clothing}} {{color}}',
      '{{material}} {{clothing}}',
      '{{clothing}} {{style}}',
      '{{brand}} {{clothing}}',
      '{{clothing}} {{season}}',
    ],
    descriptionTemplate: '{{description}} Chất liệu {{material}} cao cấp. Phù hợp cho {{occasion}}. {{style}}.',
    customFields: {
      clothing: ['Áo thun', 'Quần jean', 'Váy dạ hội', 'Áo khoác', 'Đầm công sở', 'Áo sơ mi', 'Quần tây', 'Áo len', 'Váy midi', 'Jumpsuit'],
      color: ['Đen', 'Trắng', 'Xanh navy', 'Đỏ', 'Hồng pastel', 'Be', 'Xám', 'Xanh denim', 'Cam đất', 'Xanh lá'],
      material: ['cotton', 'lụa', 'polyester', 'denim', 'kaki', 'vải thun', 'da', 'len', 'voan', 'nhung'],
      style: ['Vintage', 'Modern', 'Classic', 'Street Style', 'Minimalist', 'Bohemian', 'Korean Style', 'Retro', 'Elegant'],
      brand: ['Local Brand', 'Premium', 'Designer', 'Limited Edition'],
      season: ['mùa hè', 'mùa đông', 'mùa thu', 'mùa xuân', '4 mùa'],
      occasion: ['dạo phố', 'công sở', 'dự tiệc', 'đi chơi', 'du lịch', 'thể thao', 'hẹn hò'],
      description: [
        'Thiết kế hiện đại, năng động.',
        'Phong cách thanh lịch, sang trọng.',
        'Xu hướng thời trang 2026.',
        'Form dáng chuẩn, tôn dáng.',
        'Dễ phối đồ, dễ mặc.',
        'Chất lượng cao, giá tốt.',
      ],
    },
  },
  posts: {
    titlePatterns: [
      '{{number}} xu hướng thời trang {{year}}',
      'Cách phối đồ với {{clothing}}',
      'Bí quyết chọn {{clothing}} phù hợp vóc dáng',
      'Mix & Match: {{clothing}} cho mọi dịp',
      'Top {{number}} {{clothing}} hot nhất {{season}}',
    ],
  },
  categories: {
    productCategories: ['Áo', 'Quần', 'Váy', 'Đầm', 'Phụ kiện', 'Giày dép', 'Túi xách', 'Trang sức'],
    postCategories: ['Xu hướng', 'Phối đồ', 'Mẹo thời trang', 'Review', 'Lookbook'],
  },
};
```

**File: `lib/seed-templates/fashion/colors.ts`**

```typescript
import type { ColorConfig } from '../types';

export const fashionColors: ColorConfig = {
  brandColor: '#e91e63',
  primaryColor: '#f06292',
  secondaryColor: '#ad1457',
  accentColor: '#f8bbd0',
  palette: {
    name: 'Fashion Pink Elegance',
    colors: ['#fce4ec', '#f8bbd0', '#f06292', '#e91e63', '#ad1457'],
  },
};
```

**File: `lib/seed-templates/fashion/home-components.ts`**

```typescript
import type { HomeComponentsTemplate } from '../types';

export const fashionHomeComponents: HomeComponentsTemplate = {
  components: [
    {
      type: 'hero-banner',
      style: 1,
      config: {
        title: 'Summer Collection 2026',
        subtitle: 'Khám phá xu hướng thời trang mới nhất',
        ctaText: 'Xem ngay',
        ctaLink: '/products',
        imageUrl: '/seed_mau/fashion/banners/1.jpg',
      },
    },
    {
      type: 'product-categories',
      style: 3,
      config: {
        title: 'Danh mục sản phẩm',
        layout: 'grid',
        displayCount: 6,
        showImages: true,
      },
    },
    {
      type: 'featured-products',
      style: 2,
      config: {
        title: 'Sản phẩm nổi bật',
        subtitle: 'Bộ sưu tập hot nhất tháng này',
        displayCount: 8,
        sortBy: 'newest',
      },
    },
    {
      type: 'about',
      style: 1,
      config: {
        title: 'Về thương hiệu',
        content: 'Chúng tôi mang đến những sản phẩm thời trang chất lượng cao với thiết kế hiện đại, phù hợp với phong cách Việt Nam.',
        imageUrl: '/seed_mau/fashion/posts/1.jpg',
      },
    },
  ],
};
```

**File: `lib/seed-templates/fashion/metadata.ts`**

```typescript
import type { IndustryMetadata } from '../types';

export const fashionMetadata: IndustryMetadata = {
  version: '1.0.0',
  author: 'VietAdmin',
  tags: ['fashion', 'clothing', 'ecommerce', 'apparel'],
  category: 'fashion-beauty',
  icon: '👗',
  description: 'Template cho website thời trang, quần áo',
};
```

**File: `lib/seed-templates/fashion/index.ts`**

```typescript
import type { IndustryTemplate } from '../types';
import { fashionConfig } from './config';
import { fashionFakerTemplates } from './faker-templates';
import { fashionColors } from './colors';
import { fashionHomeComponents } from './home-components';
import { fashionMetadata } from './metadata';

export const fashionTemplate: IndustryTemplate = {
  config: fashionConfig,
  faker: fashionFakerTemplates,
  colors: fashionColors,
  homeComponents: fashionHomeComponents,
  metadata: fashionMetadata,
};
```

---

## 🔧 CONVEX UPDATES

### File: `convex/seedManager.ts`

```typescript
// ADD industryKey to mutation args
export const seedModule = mutation({
  args: {
    module: v.string(),
    quantity: v.number(),
    dependencies: v.optional(v.boolean()),
    force: v.optional(v.boolean()),
    locale: v.optional(v.string()),
    industryKey: v.optional(v.string()), // NEW
    variantPresetKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Pass to seeder constructor
    const SeederClass = SEEDERS[args.module];
    if (!SeederClass) {
      throw new Error(`Seeder not found: ${args.module}`);
    }
    
    const seeder = new SeederClass(ctx, {
      industryKey: args.industryKey,
      variantPresetKey: args.variantPresetKey,
    });
    
    // ... rest of logic
  },
});

// UPDATE seedBulk to pass industryKey
export const seedBulk = mutation({
  args: {
    configs: v.array(
      v.object({
        module: v.string(),
        quantity: v.number(),
        force: v.optional(v.boolean()),
        industryKey: v.optional(v.string()), // NEW
        variantPresetKey: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const config of args.configs) {
      await seedModule(ctx, {
        ...config,
        dependencies: true,
        locale: 'vi',
      });
    }
  },
});
```

### File: `convex/seeders/products.seeder.ts`

```typescript
import { interpolateFakerPattern, getRandomIndustryImage } from '@/lib/seed-templates/utils';
import { getIndustryTemplate } from '@/lib/seed-templates';

export class ProductSeeder extends BaseSeeder<ProductData> {
  private industryKey?: string;
  
  constructor(ctx: any, options?: { industryKey?: string; variantPresetKey?: string }) {
    super(ctx);
    this.industryKey = options?.industryKey;
    // ... existing constructor logic
  }
  
  generateFake(): ProductData {
    if (this.industryKey) {
      const template = getIndustryTemplate(this.industryKey);
      if (template) {
        return this.generateFromIndustryTemplate(template);
      }
    }
    return this.generateDefault();
  }
  
  private generateFromIndustryTemplate(template: IndustryTemplate): ProductData {
    const { faker: fakerTemplates } = template;
    const { customFields, namePatterns, descriptionTemplate } = fakerTemplates.products;
    
    // Generate name
    const namePattern = this.faker.helpers.arrayElement(namePatterns);
    const name = interpolateFakerPattern(namePattern, customFields);
    
    // Generate description
    const description = interpolateFakerPattern(descriptionTemplate, customFields);
    
    // Get random image
    const imageUrl = getRandomIndustryImage(this.industryKey!, 'products', 15);
    
    return {
      name,
      slug: this.faker.helpers.slugify(name.toLowerCase()),
      description,
      price: this.faker.number.int({ min: 100000, max: 5000000 }),
      compareAtPrice: undefined,
      cost: this.faker.number.int({ min: 50000, max: 3000000 }),
      sku: this.faker.string.alphanumeric(8).toUpperCase(),
      barcode: this.faker.string.numeric(13),
      imageUrl,
      images: [imageUrl],
      status: 'Active',
      stock: this.faker.number.int({ min: 10, max: 100 }),
      lowStockThreshold: 10,
      weight: this.faker.number.float({ min: 0.1, max: 2, fractionDigits: 2 }),
      dimensions: {
        length: this.faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
        width: this.faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
        height: this.faker.number.float({ min: 5, max: 30, fractionDigits: 1 }),
      },
      tags: this.faker.helpers.arrayElements(template.metadata.tags, { min: 1, max: 3 }),
      featured: this.faker.datatype.boolean({ probability: 0.2 }),
      trending: this.faker.datatype.boolean({ probability: 0.15 }),
      productType: template.config.productType === 'both' 
        ? this.faker.helpers.arrayElement(['physical', 'digital'])
        : template.config.productType,
    };
  }
  
  private generateDefault(): ProductData {
    // Existing fallback logic
    return {
      name: this.viFaker.productName(),
      slug: this.faker.helpers.slugify(this.viFaker.productName().toLowerCase()),
      // ... rest
    };
  }
}
```

### File: `convex/seeders/posts.seeder.ts`

```typescript
// Similar update cho PostSeeder
import { interpolateFakerPattern, getRandomIndustryImage } from '@/lib/seed-templates/utils';
import { getIndustryTemplate } from '@/lib/seed-templates';

export class PostSeeder extends BaseSeeder<PostData> {
  private industryKey?: string;
  
  constructor(ctx: any, options?: { industryKey?: string }) {
    super(ctx);
    this.industryKey = options?.industryKey;
  }
  
  generateFake(): PostData {
    if (this.industryKey) {
      const template = getIndustryTemplate(this.industryKey);
      if (template) {
        return this.generateFromIndustryTemplate(template);
      }
    }
    return this.generateDefault();
  }
  
  private generateFromIndustryTemplate(template: IndustryTemplate): PostData {
    const { faker: fakerTemplates } = template;
    const { titlePatterns } = fakerTemplates.posts;
    const { customFields } = fakerTemplates.products; // Reuse
    
    const titlePattern = this.faker.helpers.arrayElement(titlePatterns);
    const title = interpolateFakerPattern(titlePattern, customFields);
    
    const imageUrl = getRandomIndustryImage(this.industryKey!, 'posts', 5);
    
    return {
      title,
      slug: this.faker.helpers.slugify(title.toLowerCase()),
      excerpt: this.faker.lorem.sentences(2),
      content: this.faker.lorem.paragraphs(5),
      imageUrl,
      status: 'published',
      featured: this.faker.datatype.boolean({ probability: 0.3 }),
      tags: this.faker.helpers.arrayElements(template.metadata.tags, { min: 1, max: 3 }),
      publishedAt: this.faker.date.past({ years: 1 }).toISOString(),
    };
  }
}
```

### File: `convex/seeders/productCategories.seeder.ts`

```typescript
import { getIndustryTemplate } from '@/lib/seed-templates';
import { getRandomIndustryImage } from '@/lib/seed-templates/utils';

export class ProductCategorySeeder extends BaseSeeder<ProductCategoryData> {
  private industryKey?: string;
  
  constructor(ctx: any, options?: { industryKey?: string }) {
    super(ctx);
    this.industryKey = options?.industryKey;
  }
  
  generateFake(): ProductCategoryData {
    if (this.industryKey) {
      const template = getIndustryTemplate(this.industryKey);
      if (template?.faker.categories.productCategories) {
        return this.generateFromIndustryTemplate(template);
      }
    }
    return this.generateDefault();
  }
  
  private generateFromIndustryTemplate(template: IndustryTemplate): ProductCategoryData {
    const categories = template.faker.categories.productCategories!;
    const name = this.faker.helpers.arrayElement(categories);
    const imageUrl = getRandomIndustryImage(this.industryKey!, 'categories', 5);
    
    return {
      name,
      slug: this.faker.helpers.slugify(name.toLowerCase()),
      description: `Danh mục ${name.toLowerCase()}`,
      imageUrl,
      parentId: undefined,
      position: 0,
    };
  }
}
```

### File: `convex/homepage.ts`

```typescript
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getIndustryTemplate } from '@/lib/seed-templates';

export const seedFromIndustryTemplate = mutation({
  args: {
    industryKey: v.string(),
  },
  handler: async (ctx, args) => {
    const template = getIndustryTemplate(args.industryKey);
    
    if (!template) {
      throw new Error(`Industry template not found: ${args.industryKey}`);
    }
    
    // Clear existing home components
    const existing = await ctx.db.query('homepage').collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }
    
    // Insert components from template
    const components = template.homeComponents.components;
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      await ctx.db.insert('homepage', {
        type: component.type,
        style: component.style,
        config: component.config,
        position: i,
        enabled: true,
      });
    }
    
    return { 
      success: true, 
      count: components.length,
      industryKey: args.industryKey,
    };
  },
});
```

---

## 🎨 UI COMPONENTS

### File: `components/data/seed-wizard/steps/IndustrySelectionStep.tsx`

```tsx
'use client';

import React from 'react';
import { Card } from '@/app/admin/components/ui';
import { listIndustries, getCategoryLabel } from '@/lib/seed-templates';
import { Check } from 'lucide-react';

type IndustrySelectionStepProps = {
  value?: string;
  onChange: (key: string) => void;
};

export function IndustrySelectionStep({ value, onChange }: IndustrySelectionStepProps) {
  const industries = listIndustries();
  
  // Group by category
  const grouped = industries.reduce((acc, industry) => {
    if (!acc[industry.category]) {
      acc[industry.category] = [];
    }
    acc[industry.category].push(industry);
    return acc;
  }, {} as Record<string, typeof industries>);
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Chọn ngành hàng</h3>
        <p className="text-sm text-muted-foreground">
          Hệ thống sẽ tự động áp dụng màu sắc, ảnh mẫu và cấu hình phù hợp với ngành của bạn
        </p>
      </div>
      
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              {getCategoryLabel(category)}
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {items.map((industry) => (
                <Card
                  key={industry.key}
                  className={`
                    relative p-4 cursor-pointer transition-all hover:shadow-md
                    ${value === industry.key 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'hover:border-primary/50'
                    }
                  `}
                  onClick={() => onChange(industry.key)}
                >
                  {value === industry.key && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                  <div className="text-3xl mb-2 text-center">{industry.icon}</div>
                  <div className="font-medium text-sm text-center">{industry.name}</div>
                  {industry.description && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      {industry.description}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {!value && (
        <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          💡 Chọn một ngành hàng để tiếp tục. Bạn có thể thay đổi màu sắc sau.
        </div>
      )}
    </div>
  );
}
```

### File: `components/data/seed-wizard/types.ts` (UPDATE)

```typescript
// ADD to existing WizardState type
export type WizardState = {
  // ... existing fields
  industryKey?: string; // NEW
};
```

### File: `components/data/SeedWizardDialog.tsx` (UPDATE)

```typescript
import { getIndustryTemplate } from '@/lib/seed-templates';
import { IndustrySelectionStep } from './seed-wizard/steps/IndustrySelectionStep';

// ... existing imports

export function SeedWizardDialog({ open, onOpenChange, onComplete }: SeedWizardDialogProps) {
  // ... existing state
  
  // ADD industry step
  const steps = useMemo(() => {
    const list = ['website', 'industry', 'extras']; // NEW: 'industry' step
    if (hasProducts) {
      list.push('saleMode', 'productType', 'variants');
    }
    list.push('business', 'experience');
    if (hasProducts || hasOrders || hasPosts || hasComments) {
      list.push('quickConfig');
    }
    list.push('dataScale', 'review');
    return list;
  }, [hasComments, hasOrders, hasPosts, hasProducts]);
  
  // ADD handler for industry selection
  const handleIndustrySelect = (industryKey: string) => {
    const template = getIndustryTemplate(industryKey);
    
    if (!template) {
      console.warn(`Industry template not found: ${industryKey}`);
      return;
    }
    
    setState((prev) => ({
      ...prev,
      industryKey,
      businessInfo: {
        ...prev.businessInfo,
        siteName: template.config.defaultBusinessInfo.siteName,
        tagline: template.config.defaultBusinessInfo.tagline,
        businessType: template.config.defaultBusinessInfo.businessType,
        brandColor: template.colors.brandColor,
      },
      saleMode: template.config.saleMode,
      productType: template.config.productType,
      dataScale: template.config.dataScale,
    }));
  };
  
  // ... existing handlers
  
  // UPDATE handleSeed to use industry template
  const handleSeed = async () => {
    if (isSeeding) return;
    
    setIsSeeding(true);
    const toastId = toast.loading('Đang seed theo wizard...');
    
    try {
      // ... existing clear logic
      
      await syncModules(selectedModules);
      
      const seedConfigs = buildSeedConfigs(selectedModules, state.dataScale).map((config) => ({
        ...config,
        force: false,
        industryKey: state.industryKey, // NEW: Pass industryKey
        variantPresetKey: config.module === 'products' && state.variantEnabled
          ? state.variantPresetKey
          : undefined,
      }));
      
      await seedBulk({ configs: seedConfigs });
      
      // NEW: Seed home-components from template
      if (state.industryKey) {
        await seedHomeComponents({ industryKey: state.industryKey });
      }
      
      // ... rest of existing logic (settings, module configs, etc.)
      
      toast.success('Seed wizard hoàn tất!', { id: toastId });
      onComplete?.();
      onOpenChange(false);
      setState(DEFAULT_STATE);
      setCurrentStep(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại', { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };
  
  // ... existing JSX
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        {/* ... existing header */}
        
        <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-6">
          {stepKey === 'website' && (
            <WebsiteTypeStep
              value={state.websiteType}
              onChange={(websiteType) => setState((prev) => ({ ...prev, websiteType }))}
            />
          )}
          
          {/* NEW STEP */}
          {stepKey === 'industry' && (
            <IndustrySelectionStep
              value={state.industryKey}
              onChange={handleIndustrySelect}
            />
          )}
          
          {/* ... existing steps */}
        </div>
        
        {/* ... existing footer */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📄 DOCUMENTATION FILES

### File: `lib/seed-templates/README.md`

```markdown
# Industry Seed Templates

Hệ thống template cho 44+ ngành hàng, hỗ trợ seed data thông minh với:
- Faker patterns phù hợp với từng ngành
- Color schemes dựa trên research
- Home-components templates
- Ảnh mẫu cho từng ngành

## Cấu trúc

Mỗi ngành có 6 files:
- `config.ts` - Cấu hình cơ bản
- `faker-templates.ts` - Patterns cho Faker
- `colors.ts` - Brand colors + palette
- `home-components.ts` - Template cho trang chủ
- `metadata.ts` - Metadata (icon, tags, category)
- `index.ts` - Export tất cả

## Sử dụng

```typescript
import { getIndustryTemplate } from '@/lib/seed-templates';

const template = getIndustryTemplate('fashion');
console.log(template.colors.brandColor); // #e91e63
```

## Thêm ngành mới

1. Tạo folder `lib/seed-templates/{industry-key}/`
2. Copy 6 files từ ngành tương tự
3. Customize configs
4. Add vào `lib/seed-templates/index.ts`
5. Tạo folder `public/seed_mau/{industry-key}/` với 5 subfolders
6. Upload ảnh mẫu

## Ảnh mẫu

Ảnh nằm trong `public/seed_mau/{industry}/`:
- `banners/` - 5 ảnh hero (1.jpg -> 5.jpg)
- `products/` - 15 ảnh sản phẩm (1.jpg -> 15.jpg)
- `posts/` - 5 ảnh bài viết (1.jpg -> 5.jpg)
- `avatars/` - 3 ảnh đại diện (1.jpg -> 3.jpg)
- `categories/` - 5 ảnh danh mục (1.jpg -> 5.jpg)

Tất cả ảnh format: JPG, tên số thứ tự.
```

### File: `lib/seed-templates/INDUSTRY_LIST.md`

```markdown
# Danh sách 44 ngành hàng

## Thời trang & Làm đẹp (6)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| fashion | Thời trang | 👗 | #e91e63 |
| beauty | Mỹ phẩm | 💄 | #f06292 |
| cosmetics | Cosmetics | 🧴 | #ff69b4 |
| jewelry | Trang sức | 💍 | #ffc107 |
| perfume | Nước hoa | 🌸 | #9c27b0 |
| lingerie | Nội y | 👙 | #e91e63 |

## Công nghệ (4)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| tech | Công nghệ | 💻 | #2196f3 |
| electronics | Điện tử | 📱 | #3f51b5 |
| ai-accounts | Tài khoản AI | 🤖 | #00bcd4 |
| gaming-accounts | Tài khoản Game | 🎮 | #9c27b0 |

## Ẩm thực (5)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| restaurant | Nhà hàng | 🍽️ | #ff5722 |
| cafe | Cafe | ☕ | #795548 |
| food | Ẩm thực | 🍔 | #ff9800 |
| seafood | Hải sản | 🦞 | #00bcd4 |
| bakery | Bánh ngọt | 🍰 | #ffeb3b |

## Sức khỏe & Wellness (10)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| healthcare | Chăm sóc sức khỏe | 🏥 | #4caf50 |
| pharmacy | Nhà thuốc | 💊 | #00bcd4 |
| beauty-spa | Beauty Spa | 💆 | #9c27b0 |
| spa | Spa | 🧖 | #9c27b0 |
| massage | Massage | 💆‍♀️ | #673ab7 |
| hair-salon | Hair Salon | 💇 | #e91e63 |
| fitness | Fitness | 💪 | #f44336 |
| gym | Gym | 🏋️ | #ff5722 |
| yoga | Yoga | 🧘 | #9c27b0 |
| vet | Thú y | 🐾 | #4caf50 |

## Bán lẻ (11)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| home-furniture | Nội thất | 🛋️ | #795548 |
| baby-care | Mẹ và bé | 👶 | #ffb3d9 |
| books | Sách | 📚 | #3f51b5 |
| stationery | Văn phòng phẩm | 📝 | #2196f3 |
| multi-category | Tạp hóa | 🏪 | #ff9800 |
| gifts | Quà tặng | 🎁 | #e91e63 |
| handicraft | Thủ công mỹ nghệ | 🎨 | #795548 |
| auto-parts | Phụ tùng xe | 🚗 | #607d8b |
| auto | Ô tô xe máy | 🏍️ | #212121 |
| appliances | Thiết bị điện | 🔌 | #607d8b |
| music-instruments | Nhạc cụ | 🎸 | #ff5722 |
| affiliate-shop | Affiliate | 🔗 | #ff5722 |

## Dịch vụ (4)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| travel | Du lịch | ✈️ | #00bcd4 |
| hotel | Khách sạn | 🏨 | #3f51b5 |
| design-services | Thiết kế | 🎨 | #9c27b0 |
| courses | Khóa học | 📖 | #4caf50 |

## Kinh doanh (4)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| business | Doanh nghiệp | 🏢 | #2196f3 |
| manufacturing | Sản xuất | 🏭 | #607d8b |
| construction | Xây dựng | 🏗️ | #ff9800 |
| real-estate | Bất động sản | 🏘️ | #3f51b5 |

## Môi trường (1)
| Key | Tên | Icon | Brand Color |
|-----|-----|------|-------------|
| environment | Môi trường | 🌱 | #4caf50 |

**TỔNG: 44 ngành**
```

---

## 📊 IMPLEMENTATION CHECKLIST (Full)

### ✅ Step 1: Base Structure (10 files)
- [ ] `lib/seed-templates/types.ts`
- [ ] `lib/seed-templates/utils.ts`
- [ ] `lib/seed-templates/index.ts`
- [ ] `lib/seed-templates/README.md`
- [ ] `lib/seed-templates/INDUSTRY_LIST.md`
- [ ] `public/seed_mau/.gitkeep`
- [ ] `.gitignore` (add seed_mau exclusions)

### ✅ Step 2: 44 Industries × 6 files = 264 files
- [ ] fashion (6 files)
- [ ] beauty (6 files)
- [ ] cosmetics (6 files)
- [ ] jewelry (6 files)
- [ ] perfume (6 files)
- [ ] lingerie (6 files)
- [ ] tech (6 files)
- [ ] electronics (6 files)
- [ ] ai-accounts (6 files)
- [ ] gaming-accounts (6 files)
- [ ] restaurant (6 files)
- [ ] cafe (6 files)
- [ ] food (6 files)
- [ ] seafood (6 files)
- [ ] bakery (6 files)
- [ ] healthcare (6 files)
- [ ] pharmacy (6 files)
- [ ] beauty-spa (6 files)
- [ ] spa (6 files)
- [ ] massage (6 files)
- [ ] hair-salon (6 files)
- [ ] fitness (6 files)
- [ ] gym (6 files)
- [ ] yoga (6 files)
- [ ] vet (6 files)
- [ ] home-furniture (6 files)
- [ ] baby-care (6 files)
- [ ] books (6 files)
- [ ] stationery (6 files)
- [ ] multi-category (6 files)
- [ ] gifts (6 files)
- [ ] handicraft (6 files)
- [ ] auto-parts (6 files)
- [ ] auto (6 files)
- [ ] appliances (6 files)
- [ ] music-instruments (6 files)
- [ ] travel (6 files)
- [ ] hotel (6 files)
- [ ] business (6 files)
- [ ] manufacturing (6 files)
- [ ] construction (6 files)
- [ ] real-estate (6 files)
- [ ] design-services (6 files)
- [ ] courses (6 files)
- [ ] affiliate-shop (6 files)
- [ ] environment (6 files)

### ✅ Step 3: UI Components (2 files)
- [ ] `components/data/seed-wizard/steps/IndustrySelectionStep.tsx`
- [ ] `components/data/seed-wizard/types.ts` (update)

### ✅ Step 4: Convex Updates (5 files)
- [ ] `convex/seedManager.ts` (update)
- [ ] `convex/seeders/products.seeder.ts` (update)
- [ ] `convex/seeders/posts.seeder.ts` (update)
- [ ] `convex/seeders/productCategories.seeder.ts` (update)
- [ ] `convex/homepage.ts` (update)

### ✅ Step 5: Seed Wizard Integration (1 file)
- [ ] `components/data/SeedWizardDialog.tsx` (update)

### ✅ Step 6: Public Folders (44 × 5 = 220 folders)
- [ ] Create `public/seed_mau/{44-industries}/{banners,products,posts,avatars,categories}/`

### ✅ Step 7: Testing & QA
- [ ] Import all templates in `index.ts`
- [ ] Verify TypeScript compilation
- [ ] Test UI rendering
- [ ] Test seed flow với 1 ngành
- [ ] Verify colors apply
- [ ] Verify home-components populate

### ✅ Step 8: Git Commit
- [ ] Run `bunx oxlint --type-aware --type-check --fix`
- [ ] Commit with message: "feat(seed): add 44 industry templates for Seed Wizard v2"

---

## 🎯 FINAL DELIVERABLES

**Total files to create:** 282 new files
**Total files to update:** 7 existing files
**Total folders to create:** 220 image folders

**File breakdown:**
1. Base structure: 5 files
2. Industry templates: 44 × 6 = 264 files
3. UI components: 1 new + 1 update
4. Convex: 5 updates
5. Seed Wizard: 1 update
6. Public folders: 44 × 5 = 220 folders (empty, user uploads later)

**After implementation:**
- ✅ User chọn ngành → Auto-apply colors, business info
- ✅ Seed data realistic cho 44 ngành
- ✅ Home-components auto-populate từ template
- ✅ Type-safe với TypeScript
- ✅ Dễ mở rộng thêm ngành mới

**User chỉ cần:** Upload ảnh vào `public/seed_mau/{industry}/` folders sau khi implement xong!
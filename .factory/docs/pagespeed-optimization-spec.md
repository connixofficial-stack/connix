# Spec: Tối ưu PageSpeed — Full Implementation

> Mobile 62 → ≥90 · Desktop 79 → ≥90 · Lighthouse 13.0.1

---

# I. Primer

## 1. TL;DR kiểu Feynman
- LCP Mobile = 7.7s vì chain: JS → Convex WS → Query → Image. Cần preload Hero image + SSR Hero.
- CLS Desktop = 0.222 vì font `Be Vietnam Pro` swap. Cần `adjustFontFallback`.
- 11 Google Fonts trong root layout → 7+ woff2 render-blocking. Font chỉ cần ở site khi admin chọn qua `typeFontOverrides` → giữ tất cả nhưng tối ưu load.
- 147 KiB unused JS. Cần browserslist + lazy load sections.
- Ảnh chưa serve AVIF/WebP qua Next.js Image Optimization.

## 2. Elaboration
Homepage dùng `HomePageClient` (client component) → `useQuery(api.homeComponents.listActive)` → render qua `HomeComponentRenderer` → tất cả sections đều `ssr: false` trong `registry.tsx`. Ảnh Hero chỉ xuất hiện sau khi Convex trả data → LCP rất chậm trên mobile.

Font system: 10 font trong `FONT_REGISTRY` (`lib/fonts/registry.ts`), admin có thể chọn bất kỳ font nào cho từng component type qua `typeFontOverrides`. Do đó KHÔNG thể xóa font khỏi root layout — nhưng CÓ THỂ đảm bảo tất cả đều `preload: false` (đã đúng cho 9/11 font, chỉ `Be Vietnam Pro` + `Geist` preload).

## 3. Concrete Examples
User mở trang trên 4G → trắng 5s → Hero hiện sau 7.7s. Sau fix: HTML đã chứa Hero image URL → browser preload ngay → LCP ~2s.

---

# II. Audit Summary

| Metric | Mobile | Desktop | Target |
|--------|--------|---------|--------|
| Performance | 🔴 62 | 🟡 79 | ≥ 90 |
| FCP | 🟢 1.1s | 🟢 0.3s | ≤ 1.8s |
| LCP | 🔴 7.7s | 🟡 1.7s | ≤ 2.5s |
| TBT | 🟡 300ms | 🟢 130ms | ≤ 200ms |
| CLS | 🟢 0.083 | 🟡 0.222 | ≤ 0.1 |
| SI | 🔴 6.4s | 🟡 1.4s | ≤ 3.4s |

**Issues**: Improve image delivery (578 KiB), Legacy JS (14 KiB), Render blocking (150ms), Layout shift culprits, LCP request discovery, Unused JS (147 KiB), 5 long tasks, Cache lifetimes (96 KiB OSM tiles).

---

# III. Root Cause — Confidence: High

1. **RC-1 LCP chain** (Impact: rất cao): `HTML → JS → Convex WS → Query → Hero Image`. Registry `ssr: false` + client-side fetch.
2. **RC-2 CLS font swap** (Impact: cao): `Be Vietnam Pro` không có `adjustFontFallback` → Header/Footer reflow.
3. **RC-3 Image format** (Impact: cao): `next.config.ts` thiếu `formats: ['image/avif', 'image/webp']`.
4. **RC-4 Unused JS** (Impact: trung bình): 4 chunks ~147 KiB unused + legacy polyfills 14 KiB.

---

# IV. Proposal — Full Implementation

## Task 1: `next.config.ts` — Thêm image formats + optimizePackageImports

```ts
// Sửa images config
images: {
  formats: ['image/avif', 'image/webp'],  // THÊM
  deviceSizes: [320, 640, 768, 1024, 1280, 1536],
  // ...giữ nguyên
},
```

## Task 2: `app/layout.tsx` — adjustFontFallback + giảm Geist Mono preload

**Sửa Be Vietnam Pro**: thêm `adjustFontFallback: 'Arial'`

```tsx
const vietnameseSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: 'Arial',  // THÊM — giảm CLS
});
```

**Sửa Geist Mono**: thêm `preload: false` (chỉ dùng trong admin code block)

```tsx
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  preload: false,  // THÊM
});
```

## Task 3: `app/(site)/page.tsx` — Preload Hero LCP image

```tsx
import HomePageClient from './_components/HomePageClient';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

// Helper: extract first Hero slide image URL for LCP preload
function extractHeroImageUrl(
  components: { type: string; config: Record<string, unknown> }[]
): string | null {
  const hero = components.find((c) => c.type === 'Hero');
  if (!hero) return null;
  const slides = hero.config.slides as { image?: string }[] | undefined;
  return slides?.[0]?.image || null;
}

export default async function HomePage(): Promise<React.ReactElement> {
  const client = getConvexClient();
  const initialComponents = await client.query(api.homeComponents.listActive);

  const heroImageUrl = extractHeroImageUrl(
    initialComponents.map((c) => ({
      type: c.type,
      config: c.config as Record<string, unknown>,
    }))
  );

  return (
    <>
      {heroImageUrl && (
        <link
          rel="preload"
          as="image"
          href={heroImageUrl}
          fetchPriority="high"
        />
      )}
      <HomePageClient initialComponents={initialComponents} />
    </>
  );
}
```

## Task 4: `package.json` — browserslist loại legacy polyfills

Thêm field `browserslist` vào `package.json`:

```json
"browserslist": [
  "last 2 Chrome versions",
  "last 2 Firefox versions",
  "last 2 Safari versions",
  "last 2 Edge versions"
]
```

Loại bỏ polyfills: `Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn`, `String.prototype.trimEnd/trimStart` → tiết kiệm ~14 KiB.

## Task 5: `HeroRuntimeSection.tsx` — Loại bỏ inline background-image (LCP blocker)

Hiện tại Hero dùng `style={{ backgroundImage: \`url(...)\` }}` cho blur effect → browser phải download ảnh 2 lần (1 cho bg, 1 cho `<Image>`). Đây là anti-pattern cho LCP.

**Sửa `renderSlideWithBlur`** — dùng CSS blur trên `<Image>` thay vì inline backgroundImage:

```tsx
const renderSlideWithBlur = (
  slide: { image: string; link: string },
  options?: { priority?: boolean; loading?: 'eager' | 'lazy' }
) => (
  <a href={slide.link || '#'} className="block w-full h-full relative">
    {/* Blur layer: dùng same <img> với blur, tránh double download */}
    <SiteImage
      src={slide.image}
      alt=""
      className="absolute inset-0 w-full h-full object-cover scale-110 blur-[30px]"
      loading="lazy"
      sizes="100vw"
      aria-hidden
    />
    <div className="absolute inset-0 bg-black/20" />
    <SiteImage
      src={slide.image}
      alt=""
      className="relative w-full h-full object-contain z-10"
      priority={options?.priority}
      loading={options?.loading}
      sizes="100vw"
    />
  </a>
);
```

**Tương tự sửa `renderHeroSlideContain`** và các Bento slide — thay `style={{ backgroundImage }}` bằng `<SiteImage>` với `blur` class.

> **Lưu ý**: Pattern tương tự cần sửa ở `ComponentRenderer.tsx` (legacy renderer).

## Task 6: `OpenStreetMapDisplay.tsx` — Lazy load khi scroll tới

Hiện tại map load CSS từ unpkg + tiles ngay khi mount. Sửa: chỉ load khi user scroll tới.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

type Location = { lat: number; lng: number; address: string };

type OpenStreetMapDisplayProps = {
  location: Location;
  height?: string;
  zoom?: number;
};

export default function OpenStreetMapDisplay({
  location,
  height = '300px',
  zoom = 15,
}: OpenStreetMapDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver: chỉ load khi scroll gần tới
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      void import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, [isVisible]);

  // Placeholder khi chưa visible hoặc chưa client
  if (!isVisible || !isClient) {
    return (
      <div
        ref={containerRef}
        className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" />
          <span className="text-sm">{location.address || 'Bản đồ'}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height }} className="relative z-0 rounded-xl overflow-hidden border">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]}>
          <Popup>{location.address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
```

## Task 7: `ComponentRenderer.tsx` — Sửa inline backgroundImage tương tự Task 5

Pattern tương tự HeroRuntimeSection: thay `style={{ backgroundImage: \`url(...)\` }}` bằng `<SiteImage>` + CSS blur. Áp dụng cho:
- `renderSlideWithBlur` (line ~430)
- Bento slides (line ~550–571)
- `renderHeroSlideContain` (line ~610)

## Task 8: `HomePageClient.tsx` — Giảm criticalCount mobile xuống 1 (đã đúng), đảm bảo deferred logic

Hiện tại đã đúng: mobile `criticalCount = 1`, desktop `= 3`. Giữ nguyên.

**Kiểm tra**: `LOADING_DELAY_MS = 120` và `LOADING_MIN_DISPLAY_MS = 320` — giá trị OK, không cần sửa.

---

# V. Files Impacted

| File | Thay đổi |
|------|----------|
| `next.config.ts` | **Sửa:** Thêm `formats: ['image/avif', 'image/webp']` |
| `app/layout.tsx` | **Sửa:** `adjustFontFallback: 'Arial'` cho Be Vietnam Pro, `preload: false` cho Geist Mono |
| `app/(site)/page.tsx` | **Sửa:** Extract Hero image → `<link rel="preload">` |
| `package.json` | **Sửa:** Thêm `browserslist` |
| `components/site/home/sections/HeroRuntimeSection.tsx` | **Sửa:** Thay inline `backgroundImage` bằng `<SiteImage>` blur |
| `components/site/ComponentRenderer.tsx` | **Sửa:** Tương tự — loại inline `backgroundImage` |
| `components/maps/OpenStreetMapDisplay.tsx` | **Sửa:** Lazy load với IntersectionObserver |

---

# VI. Execution Preview

1. Sửa `next.config.ts` → thêm image formats
2. Sửa `app/layout.tsx` → font fallback + giảm preload
3. Sửa `app/(site)/page.tsx` → preload Hero image
4. Sửa `package.json` → browserslist
5. Sửa `HeroRuntimeSection.tsx` → loại backgroundImage inline
6. Sửa `ComponentRenderer.tsx` → tương tự task 5
7. Sửa `OpenStreetMapDisplay.tsx` → lazy load
8. Review tĩnh: typing, null-safety, edge cases
9. `bunx tsc --noEmit`

---

# VII. Verification Plan

| Bước | Công cụ | Tiêu chí |
|------|---------|----------|
| 1 | `bunx tsc --noEmit` | Không lỗi |
| 2 | Manual | Homepage hiển thị đúng |
| 3 | Deploy Vercel → PageSpeed | Mobile ≥ 90, Desktop ≥ 90 |
| 4 | PageSpeed | CLS ≤ 0.1, LCP ≤ 2.5s |

---

# VIII. Todo

- [ ] Task 1: `next.config.ts` — image formats
- [ ] Task 2: `app/layout.tsx` — adjustFontFallback + Geist Mono preload:false
- [ ] Task 3: `app/(site)/page.tsx` — preload Hero LCP image
- [ ] Task 4: `package.json` — browserslist
- [ ] Task 5: `HeroRuntimeSection.tsx` — loại inline backgroundImage
- [ ] Task 6: `OpenStreetMapDisplay.tsx` — lazy load
- [ ] Task 7: `ComponentRenderer.tsx` — loại inline backgroundImage
- [ ] Review tĩnh + `bunx tsc --noEmit`

---

# IX. Acceptance Criteria

1. Performance Mobile ≥ 90 trên PageSpeed Insights
2. Performance Desktop ≥ 90
3. CLS ≤ 0.1 cả hai
4. LCP ≤ 2.5s cả hai
5. Homepage hiển thị đúng, không regression
6. `bunx tsc --noEmit` clean

---

# X. Risk / Rollback

| Rủi ro | Mức độ | Mitigation |
|--------|--------|------------|
| `<link rel="preload">` trong JSX Fragment | Low | Next.js 16 hỗ trợ `<link>` trong `<head>` tự động qua Metadata API, nếu không thì dùng `generateMetadata` |
| Blur effect khác khi dùng `<SiteImage>` thay backgroundImage | Low | CSS `blur-[30px]` + `scale-110` tạo hiệu ứng tương đương |
| browserslist strict quá → lỗi browser cũ | Low | Target "last 2 versions" covers 95%+ users |
| AVIF encode chậm trên Vercel Free | Low | Vercel cache sau lần đầu, chỉ chậm request đầu tiên |

**Rollback**: Mỗi task commit riêng.

---

# XI. Out of Scope

- Accessibility audit (81→90) — cần spec riêng
- Full SSR homepage (Phase 3 từ spec cũ) — architecture change lớn
- Admin panel performance
- Bundle analyzer deep-dive

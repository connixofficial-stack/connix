# Ví dụ code SEO Next.js (App Router)

## 1) Metadata cơ bản (layout.tsx)
```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Example Blog",
    template: "%s | Example Blog",
  },
  description: "Blog tối ưu SEO với Next.js",
  openGraph: {
    type: "website",
    title: "Example Blog",
    description: "Blog tối ưu SEO với Next.js",
    url: "https://example.com",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Example Blog",
    description: "Blog tối ưu SEO với Next.js",
    images: ["/og-default.png"],
  },
};
```

## 2) Dynamic metadata cho bài viết (page.tsx)
```ts
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: post.canonicalUrl ?? `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      images: [post.ogImage ?? "/og-default.png"],
    },
  };
}
```

## 3) sitemap.ts
```ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  return [
    { url: "https://example.com", lastModified: new Date() },
    ...posts.map((post) => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: post.updatedAt ?? post.publishedAt,
    })),
  ];
}
```

## 4) robots.ts
```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://example.com/sitemap.xml",
  };
}
```

## 5) JSON-LD Article
```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  datePublished: post.publishedAt,
  dateModified: post.updatedAt ?? post.publishedAt,
  author: { "@type": "Person", name: post.author },
  image: post.ogImage,
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <ArticleContent />
  </>
);
```

## 6) OG image route (opengraph-image.tsx)
```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "white",
          fontSize: 60,
        }}
      >
        Example Blog
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

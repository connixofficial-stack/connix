/**
 * Internal Linking Engine
 * Tự động lấy related pages theo slug refs và landingType cùng nhóm
 */

import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { buildDetailPath } from '@/lib/ia/route-mode';

export type RelatedPageItem = {
  title: string;
  slug: string;
  summary: string;
  href: string;
  type: 'landing' | 'post' | 'product' | 'service';
};

const LANDING_TYPE_ROUTES: Record<string, string> = {
  'feature': '/features',
  'use-case': '/use-cases',
  'solution': '/solutions',
  'compare': '/compare',
  'integration': '/integrations',
  'template': '/templates',
  'guide': '/guides',
};

/**
 * Lấy related landing pages theo relatedSlugs + cùng landingType (max 6)
 */
export const getRelatedLandingPages = async (params: {
  currentSlug: string;
  landingType: string;
  relatedSlugs?: string[];
  limit?: number;
}): Promise<RelatedPageItem[]> => {
  const { currentSlug, landingType, relatedSlugs = [], limit = 6 } = params;
  const client = getConvexClient();
  const basePath = LANDING_TYPE_ROUTES[landingType] || '/features';

  // 1. Lấy explicitly linked pages trước
  const explicitItems: RelatedPageItem[] = [];
  if (relatedSlugs.length > 0) {
    const explicitPages = await Promise.all(
      relatedSlugs.slice(0, limit).map((slug) =>
        client.query(api.landingPages.getBySlug, { slug })
      )
    );
    for (const page of explicitPages) {
      if (page && page.slug !== currentSlug) {
        const pagePath = LANDING_TYPE_ROUTES[page.landingType] || basePath;
        explicitItems.push({
          href: `${pagePath}/${page.slug}`,
          slug: page.slug,
          summary: page.summary,
          title: page.title,
          type: 'landing',
        });
      }
    }
  }

  // 2. Nếu chưa đủ, fill bằng same-type pages
  const remaining = limit - explicitItems.length;
  if (remaining > 0) {
    const sameTypeResult = await client.query(api.landingPages.listPublishedByType, {
      landingType: landingType as any,
      paginationOpts: { cursor: null, numItems: limit + 5 },
    });

    const existingSlugs = new Set([currentSlug, ...explicitItems.map((i) => i.slug)]);
    for (const page of sameTypeResult.page) {
      if (explicitItems.length + (sameTypeResult.page.indexOf(page) + 1) > limit) break;
      if (!existingSlugs.has(page.slug)) {
        existingSlugs.add(page.slug);
        explicitItems.push({
          href: `${basePath}/${page.slug}`,
          slug: page.slug,
          summary: page.summary,
          title: page.title,
          type: 'landing',
        });
        if (explicitItems.length >= limit) break;
      }
    }
  }

  return explicitItems;
};

/**
 * Lấy related posts theo productSlugs + recent posts (for cross-linking)
 */
export const getRelatedPosts = async (params: {
  limit?: number;
}): Promise<RelatedPageItem[]> => {
  const { limit = 3 } = params;
  const client = getConvexClient();

  const [result, categories] = await Promise.all([
    client.query(api.posts.listPublished, {
      paginationOpts: { cursor: null, numItems: limit },
    }),
    client.query(api.postCategories.listActive, { limit: 200 }),
  ]);

  const categorySlugMap = new Map(categories.map((category) => [category._id, category.slug]));

  return result.page.map((post) => ({
    href: buildDetailPath({
      categorySlug: categorySlugMap.get(post.categoryId),
      mode: 'unified',
      moduleKey: 'posts',
      recordSlug: post.slug,
    }),
    slug: post.slug,
    summary: post.excerpt || '',
    title: post.title,
    type: 'post' as const,
  }));
};

export type HubKey =
  | 'features'
  | 'use-cases'
  | 'solutions'
  | 'compare'
  | 'integrations'
  | 'templates'
  | 'guides';

export type FunnelKey = HubKey | 'posts';

export type InternalLinkItem = {
  description?: string;
  href: string;
  title: string;
};

const HUB_LINKS: Record<HubKey, InternalLinkItem[]> = {
  compare: [
    { href: '/features', title: 'Tính năng', description: 'Xem toàn bộ năng lực hệ thống.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp theo nhu cầu.' },
    { href: '/use-cases', title: 'Use cases', description: 'Kịch bản ứng dụng phổ biến.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Kết nối hệ sinh thái.' },
    { href: '/contact', title: 'Tư vấn nhanh', description: 'Nhận tư vấn lựa chọn phù hợp.' },
  ],
  features: [
    { href: '/use-cases', title: 'Use cases', description: 'Cách dùng theo từng nhóm khách hàng.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp theo mục tiêu.' },
    { href: '/compare', title: 'So sánh', description: 'Đối chiếu lựa chọn phù hợp.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Kết nối hệ thống hiện tại.' },
    { href: '/contact', title: 'Đặt lịch demo', description: 'Nhận tư vấn triển khai phù hợp.' },
  ],
  guides: [
    { href: '/features', title: 'Tính năng', description: 'Xem tính năng liên quan.' },
    { href: '/use-cases', title: 'Use cases', description: 'Ứng dụng thực tế theo ngành.' },
    { href: '/templates', title: 'Templates', description: 'Mẫu triển khai nhanh.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Lộ trình triển khai theo mục tiêu.' },
    { href: '/contact', title: 'Tư vấn áp dụng', description: 'Nhận gợi ý triển khai nhanh.' },
  ],
  integrations: [
    { href: '/features', title: 'Tính năng', description: 'Xem các tính năng hỗ trợ tích hợp.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp đi kèm hệ sinh thái.' },
    { href: '/compare', title: 'So sánh', description: 'So sánh với lựa chọn khác.' },
    { href: '/templates', title: 'Templates', description: 'Mẫu tích hợp nhanh.' },
    { href: '/contact', title: 'Liên hệ kỹ thuật', description: 'Trao đổi yêu cầu tích hợp.' },
  ],
  solutions: [
    { href: '/features', title: 'Tính năng', description: 'Năng lực cốt lõi đi kèm.' },
    { href: '/use-cases', title: 'Use cases', description: 'Bài toán thực tế theo ngành.' },
    { href: '/compare', title: 'So sánh', description: 'Đối chiếu giải pháp phù hợp.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Kết nối với hạ tầng hiện tại.' },
    { href: '/contact', title: 'Tư vấn giải pháp', description: 'Nhận lộ trình phù hợp.' },
  ],
  templates: [
    { href: '/guides', title: 'Guides', description: 'Hướng dẫn triển khai chi tiết.' },
    { href: '/features', title: 'Tính năng', description: 'Xem tính năng hỗ trợ.' },
    { href: '/use-cases', title: 'Use cases', description: 'Kịch bản áp dụng tương ứng.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Kết nối công cụ liên quan.' },
    { href: '/contact', title: 'Tư vấn cấu hình', description: 'Nhận cấu hình nhanh.' },
  ],
  'use-cases': [
    { href: '/features', title: 'Tính năng', description: 'Tính năng cho từng use case.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp triển khai nhanh.' },
    { href: '/templates', title: 'Templates', description: 'Mẫu cấu hình tối ưu.' },
    { href: '/guides', title: 'Guides', description: 'Tài liệu hướng dẫn chi tiết.' },
    { href: '/contact', title: 'Tư vấn use case', description: 'Nhận đề xuất phù hợp.' },
  ],
};

export const getHubInternalLinks = (hub: HubKey): InternalLinkItem[] => HUB_LINKS[hub];

const FUNNEL_LINKS: Record<FunnelKey, InternalLinkItem[]> = {
  compare: [
    { href: '/contact', title: 'Tư vấn so sánh', description: 'Nhận tư vấn chọn phương án phù hợp.' },
    { href: '/features', title: 'Tính năng nổi bật', description: 'Xem rõ năng lực cốt lõi.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Xem hệ sinh thái kết nối.' },
  ],
  features: [
    { href: '/solutions', title: 'Giải pháp', description: 'Lộ trình triển khai theo mục tiêu.' },
    { href: '/use-cases', title: 'Use cases', description: 'Ứng dụng thực tế theo ngành.' },
    { href: '/contact', title: 'Đặt lịch demo', description: 'Trao đổi nhu cầu cụ thể.' },
  ],
  guides: [
    { href: '/templates', title: 'Templates', description: 'Mẫu triển khai nhanh.' },
    { href: '/features', title: 'Tính năng', description: 'Tính năng liên quan.' },
    { href: '/contact', title: 'Tư vấn triển khai', description: 'Nhận đề xuất theo nhu cầu.' },
  ],
  integrations: [
    { href: '/templates', title: 'Templates', description: 'Mẫu cấu hình tích hợp.' },
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp theo hệ sinh thái.' },
    { href: '/contact', title: 'Liên hệ kỹ thuật', description: 'Trao đổi yêu cầu tích hợp.' },
  ],
  posts: [
    { href: '/templates', title: 'Templates', description: 'Mẫu triển khai nhanh theo bài viết.' },
    { href: '/features', title: 'Tính năng', description: 'Xem tính năng liên quan.' },
    { href: '/contact', title: 'Tư vấn', description: 'Trao đổi nhu cầu cụ thể.' },
  ],
  solutions: [
    { href: '/compare', title: 'So sánh', description: 'Đối chiếu lựa chọn phù hợp.' },
    { href: '/integrations', title: 'Tích hợp', description: 'Hệ sinh thái đi kèm.' },
    { href: '/contact', title: 'Đặt lịch demo', description: 'Nhận tư vấn triển khai.' },
  ],
  templates: [
    { href: '/guides', title: 'Guides', description: 'Hướng dẫn triển khai chi tiết.' },
    { href: '/use-cases', title: 'Use cases', description: 'Bài toán tương ứng.' },
    { href: '/contact', title: 'Tư vấn cấu hình', description: 'Nhận cấu hình phù hợp.' },
  ],
  'use-cases': [
    { href: '/solutions', title: 'Giải pháp', description: 'Giải pháp triển khai nhanh.' },
    { href: '/templates', title: 'Templates', description: 'Mẫu tối ưu theo use case.' },
    { href: '/contact', title: 'Tư vấn', description: 'Trao đổi nhu cầu thực tế.' },
  ],
};

export const getFunnelInternalLinks = (key: FunnelKey): InternalLinkItem[] => FUNNEL_LINKS[key];

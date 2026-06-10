import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Hook to get example post slug for preview links
 */
export function useExamplePostSlug(): string | null {
  const posts = useQuery(api.posts.searchPublished, { limit: 1, sortBy: 'newest' });
  return posts?.[0]?.slug ?? null;
}

/**
 * Hook to get example product slug for preview links
 */
export function useExampleProductSlug(): string | null {
  const products = useQuery(api.products.searchPublished, { limit: 1 });
  return products?.[0]?.slug ?? null;
}

export function useExampleProduct() {
  const products = useQuery(api.products.searchPublished, { limit: 1 });
  return products?.[0] ?? null;
}

/**
 * Hook to get example service slug for preview links
 */
export function useExampleServiceSlug(): string | null {
  const services = useQuery(api.services.searchPublished, { limit: 1 });
  return services?.[0]?.slug ?? null;
}

export function useExampleProjectSlug(): string | null {
  const projects = useQuery(api.projects.searchPublished, { limit: 1 });
  return projects?.[0]?.slug ?? null;
}

/**
 * Hook to get example course slug for preview links
 */
export function useExampleCourseSlug(): string | null {
  const courses = useQuery(api.courses.searchPublished, { limit: 1 });
  return courses?.[0]?.slug ?? null;
}

export function useExampleResourceSlug(): string | null {
  const resources = useQuery(api.resources.searchPublished, { limit: 1 });
  return resources?.[0]?.slug ?? null;
}

/**
 * Hook to get example post category slug for preview links
 */
export function useExamplePostCategorySlug(): string | null {
  const categories = useQuery(api.postCategories.listActive, { limit: 1 });
  return categories?.[0]?.slug ?? null;
}

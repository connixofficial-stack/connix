import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { ThemeGalleryClient } from './ThemeGalleryClient';
import type { Metadata } from 'next';

export const revalidate = 0; // Always fetch fresh data on each request

export const metadata: Metadata = {
  title: 'Kho giao diện | Mẫu website chuyên nghiệp',
  description: 'Khám phá bộ sưu tập giao diện website chuyên nghiệp. Xem thử trực tiếp và chọn mẫu phù hợp cho doanh nghiệp của bạn.',
  robots: { index: true, follow: true },
};

export default async function ThemeGalleryPage() {
  const client = getConvexClient();
  const snapshots = await client.query(api.homepageSnapshots.listPublicSnapshots);

  return <ThemeGalleryClient initialSnapshots={snapshots} />;
}

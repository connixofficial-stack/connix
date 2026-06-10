import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSiteSettings } from '@/lib/get-settings';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const cartModule = await client.query(api.admin.modules.getModuleByKey, { key: 'cart' });
  if (cartModule?.enabled === false) {
    return {
      title: 'Giỏ hàng',
      description: 'Trang giỏ hàng hiện không khả dụng.',
      robots: { index: false, follow: false },
    };
  }
  const site = await getSiteSettings();

  return {
    title: 'Giỏ hàng',
    description: `Giỏ hàng của bạn tại ${site.site_name}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CartLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const cartModule = await client.query(api.admin.modules.getModuleByKey, { key: 'cart' });
  if (cartModule?.enabled === false) {
    notFound();
  }
  return children;
}

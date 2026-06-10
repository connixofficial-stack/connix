import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getSiteSettings } from '@/lib/get-settings';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const [cartModule, ordersModule] = await Promise.all([
    client.query(api.admin.modules.getModuleByKey, { key: 'cart' }),
    client.query(api.admin.modules.getModuleByKey, { key: 'orders' }),
  ]);

  if (cartModule?.enabled === false || ordersModule?.enabled === false) {
    return {
      title: 'Thanh toán',
      description: 'Trang thanh toán hiện không khả dụng.',
      robots: { index: false, follow: false },
    };
  }
  const site = await getSiteSettings();

  return {
    title: 'Thanh toán',
    description: `Hoàn tất đơn hàng tại ${site.site_name}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const [cartModule, ordersModule] = await Promise.all([
    client.query(api.admin.modules.getModuleByKey, { key: 'cart' }),
    client.query(api.admin.modules.getModuleByKey, { key: 'orders' }),
  ]);

  if (cartModule?.enabled === false || ordersModule?.enabled === false) {
    notFound();
  }
  return children;
}

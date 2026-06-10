import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';

export default async function AccountOrdersLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const ordersModule = await client.query(api.admin.modules.getModuleByKey, { key: 'orders' });
  if (ordersModule?.enabled === false) {
    notFound();
  }
  return children;
}

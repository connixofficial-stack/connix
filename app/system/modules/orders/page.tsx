'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { ordersModule } from '@/lib/modules/configs/orders.config';
import { OrdersConfigTab } from '@/components/modules/orders/OrdersConfigTab';

export default function OrdersModuleConfigPage() {
  return (
    <ModuleConfigPage 
      config={ordersModule}
      renderConfigTab={(props) => <OrdersConfigTab {...props} />}
    />
  );
}

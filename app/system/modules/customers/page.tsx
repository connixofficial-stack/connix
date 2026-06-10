'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { customersModule } from '@/lib/modules/configs/customers.config';

export default function CustomersModuleConfigPage() {
  return (
    <ModuleConfigPage config={customersModule} />
  );
}

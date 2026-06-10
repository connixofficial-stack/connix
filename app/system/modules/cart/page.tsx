'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { cartModule } from '@/lib/modules/configs/cart.config';

export default function CartModuleConfigPage() {
  return (
    <ModuleConfigPage config={cartModule} />
  );
}

'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { promotionsModule } from '@/lib/modules/configs/promotions.config';

export default function PromotionsModuleConfigPage() {
  return (
    <ModuleConfigPage config={promotionsModule} />
  );
}

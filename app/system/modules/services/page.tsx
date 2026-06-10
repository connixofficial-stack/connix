'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { servicesModule } from '@/lib/modules/configs/services.config';

export default function ServicesModuleConfigPage() {
  return (
    <ModuleConfigPage config={servicesModule} />
  );
}

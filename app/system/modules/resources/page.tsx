'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { resourcesModule } from '@/lib/modules/configs/resources.config';

export default function ResourcesModuleConfigPage() {
  return <ModuleConfigPage config={resourcesModule} />;
}

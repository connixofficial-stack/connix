'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { rolesModule } from '@/lib/modules/configs/roles.config';

export default function RolesModuleConfigPage() {
  return (
    <ModuleConfigPage config={rolesModule} />
  );
}

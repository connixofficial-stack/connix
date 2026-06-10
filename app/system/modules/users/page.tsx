'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { usersModule } from '@/lib/modules/configs/users.config';

export default function UsersModuleConfigPage() {
  return (
    <ModuleConfigPage config={usersModule} />
  );
}

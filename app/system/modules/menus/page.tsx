'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { menusModule } from '@/lib/modules/configs/menus.config';

export default function MenusModuleConfigPage() {
  return (
    <ModuleConfigPage config={menusModule} />
  );
}

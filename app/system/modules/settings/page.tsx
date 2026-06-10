'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { settingsModule } from '@/lib/modules/configs/settings.config';

export default function SettingsModuleConfigPage() {
  return (
    <ModuleConfigPage config={settingsModule} />
  );
}

'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { notificationsModule } from '@/lib/modules/configs/notifications.config';

export default function NotificationsModuleConfigPage() {
  return (
    <ModuleConfigPage config={notificationsModule} />
  );
}

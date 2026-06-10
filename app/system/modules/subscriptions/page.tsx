'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { subscriptionsModule } from '@/lib/modules/configs/subscriptions.config';

export default function SubscriptionsModuleConfigPage() {
  return (
    <ModuleConfigPage config={subscriptionsModule} />
  );
}

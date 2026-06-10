'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { analyticsModule } from '@/lib/modules/configs/analytics.config';

export default function AnalyticsModuleConfigPage() {
  return (
    <ModuleConfigPage config={analyticsModule} />
  );
}

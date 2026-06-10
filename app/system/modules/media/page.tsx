'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { mediaModule } from '@/lib/modules/configs/media.config';

export default function MediaModuleConfigPage() {
  return (
    <ModuleConfigPage config={mediaModule} />
  );
}

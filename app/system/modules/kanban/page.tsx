'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { kanbanModule } from '@/lib/modules/configs/kanban.config';

export default function KanbanModuleConfigPage() {
  return (
    <ModuleConfigPage config={kanbanModule} />
  );
}

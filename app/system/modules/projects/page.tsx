'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { projectsModule } from '@/lib/modules/configs/projects.config';

export default function ProjectsModuleConfigPage() {
  return (
    <ModuleConfigPage config={projectsModule} />
  );
}

'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { coursesModule } from '@/lib/modules/configs/courses.config';

export default function CoursesModuleConfigPage() {
  return <ModuleConfigPage config={coursesModule} />;
}

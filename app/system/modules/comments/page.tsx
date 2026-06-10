'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { commentsModule } from '@/lib/modules/configs/comments.config';

export default function CommentsModuleConfigPage() {
  return (
    <ModuleConfigPage config={commentsModule} />
  );
}

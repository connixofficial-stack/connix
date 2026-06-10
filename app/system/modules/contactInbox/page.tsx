'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { contactInboxModule } from '@/lib/modules/configs/contact-inbox.config';

export default function ContactInboxModuleConfigPage() {
  return (
    <ModuleConfigPage config={contactInboxModule} />
  );
}

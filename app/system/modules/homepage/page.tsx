'use client';

import React from 'react';
import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { homepageModule } from '@/lib/modules/configs/homepage.config';

export default function HomepageModuleConfigPage() {
  return (
    <ModuleConfigPage config={homepageModule} />
  );
}

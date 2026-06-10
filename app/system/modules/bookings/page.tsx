'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { bookingsModule } from '@/lib/modules/configs/bookings.config';

export default function BookingsModuleConfigPage() {
  return (
    <ModuleConfigPage config={bookingsModule} />
  );
}

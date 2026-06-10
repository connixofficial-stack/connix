'use client';

import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
import { wishlistModule } from '@/lib/modules/configs/wishlist.config';

export default function WishlistModuleConfigPage() {
  return (
    <ModuleConfigPage config={wishlistModule} />
  );
}

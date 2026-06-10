'use client';
 
 import React, { useRef, useState, useCallback } from 'react';
 import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
 import { postsModule } from '@/lib/modules/configs/posts.config';
import { PostsAppearanceTab } from '@/components/modules/posts/PostsAppearanceTab';

export default function PostsModuleConfigPage() {
  const [appearanceHasChanges, setAppearanceHasChanges] = useState(false);
  const appearanceSaveRef = useRef<(() => Promise<void>) | null>(null);
  
  const handleAppearanceSave = useCallback(async () => {
    if (appearanceSaveRef.current) {
      await appearanceSaveRef.current();
    }
  }, []);
  
  return (
    <ModuleConfigPage 
      config={postsModule}
      renderAppearanceTab={() => (
        <PostsAppearanceTab 
          onHasChanges={setAppearanceHasChanges}
          onSaveRef={appearanceSaveRef}
        />
      )}
      onAppearanceSave={handleAppearanceSave}
      appearanceHasChanges={appearanceHasChanges}
    />
  );
}

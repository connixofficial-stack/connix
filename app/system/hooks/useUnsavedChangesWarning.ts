'use client';

import { useCallback, useEffect } from 'react';

// SYS-012: Hook để cảnh báo khi có unsaved changes
export function useUnsavedChangesWarning(hasChanges: boolean, message?: string) {
  const defaultMessage = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?';

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = message ?? defaultMessage;
      return message ?? defaultMessage;
    }
  }, [hasChanges, message]);

  useEffect(() => {
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, handleBeforeUnload]);

  // Return function to manually trigger confirm
  const confirmLeave = useCallback(() => {
    if (hasChanges) {
      return window.confirm(message ?? defaultMessage);
    }
    return true;
  }, [hasChanges, message]);

  return { confirmLeave };
}

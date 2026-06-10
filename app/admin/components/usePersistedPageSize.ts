import { useEffect, useState } from 'react';

export function usePersistedPageSize(storageKey: string, defaultValue: number) {
  const [pageSize, setPageSize] = useState<number | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(storageKey);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (pageSize === null) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, String(pageSize));
  }, [pageSize, storageKey]);

  return [pageSize ?? defaultValue, setPageSize] as const;
}

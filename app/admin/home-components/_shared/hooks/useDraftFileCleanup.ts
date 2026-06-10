'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function useDraftFileCleanup(ownerKey: string) {
  const uploadedRef = useRef(new Set<Id<'_storage'>>());
  const committedRef = useRef(false);
  const registerDraftUpload = useMutation(api.fileLifecycle.registerDraftUpload);
  const commitDraftUploads = useMutation(api.fileLifecycle.commitDraftUploads);
  const cleanupDraftUploads = useMutation(api.fileLifecycle.cleanupDraftUploads);

  const trackUpload = useCallback(async (storageId?: Id<'_storage'>, folder?: string) => {
    if (!storageId) {
      return;
    }
    committedRef.current = false;
    uploadedRef.current.add(storageId);
    await registerDraftUpload({ folder, ownerKey, storageId });
  }, [ownerKey, registerDraftUpload]);

  const commitUploads = useCallback(async (committedStorageIds?: Id<'_storage'>[]) => {
    const trackedStorageIds = Array.from(uploadedRef.current);
    const storageIds = committedStorageIds
      ? trackedStorageIds.filter(storageId => committedStorageIds.includes(storageId))
      : trackedStorageIds;
    const orphanStorageIds = committedStorageIds
      ? trackedStorageIds.filter(storageId => !committedStorageIds.includes(storageId))
      : [];

    if (storageIds.length === 0 && orphanStorageIds.length === 0) {
      committedRef.current = true;
      return;
    }
    if (storageIds.length > 0) {
      await commitDraftUploads({ storageIds });
    }
    if (orphanStorageIds.length > 0) {
      await cleanupDraftUploads({ storageIds: orphanStorageIds });
    }
    committedRef.current = true;
    uploadedRef.current.clear();
  }, [cleanupDraftUploads, commitDraftUploads]);

  const cleanupUploads = useCallback(() => {
    const storageIds = Array.from(uploadedRef.current);
    if (committedRef.current || storageIds.length === 0) {
      return;
    }
    uploadedRef.current.clear();
    void cleanupDraftUploads({ storageIds });
  }, [cleanupDraftUploads]);

  useEffect(() => () => {
    cleanupUploads();
  }, [cleanupUploads]);

  return { cleanupUploads, commitUploads, trackUpload };
}

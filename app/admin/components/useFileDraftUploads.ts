'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function useFileDraftUploads(ownerKey: string) {
  const uploadedRef = useRef(new Set<Id<'_storage'>>());
  const registerDraftUpload = useMutation(api.fileLifecycle.registerDraftUpload);
  const commitDraftUploads = useMutation(api.fileLifecycle.commitDraftUploads);
  const cleanupDraftUploads = useMutation(api.fileLifecycle.cleanupDraftUploads);

  const trackDraftUpload = useCallback(async (storageId: Id<'_storage'>, folder?: string) => {
    uploadedRef.current.add(storageId);
    try {
      await registerDraftUpload({ folder, ownerKey, storageId });
    } catch (error) {
      console.warn('Failed to register draft upload', error);
    }
  }, [ownerKey, registerDraftUpload]);

  const commitTrackedDrafts = useCallback(async (storageIds?: Array<Id<'_storage'> | null | undefined>) => {
    const committedStorageIds = Array.from(new Set((storageIds ?? Array.from(uploadedRef.current)).filter(Boolean))) as Id<'_storage'>[];
    if (committedStorageIds.length === 0) {
      return;
    }
    await commitDraftUploads({ storageIds: committedStorageIds });
    committedStorageIds.forEach(storageId => uploadedRef.current.delete(storageId));
  }, [commitDraftUploads]);

  const cleanupTrackedDrafts = useCallback(() => {
    const storageIds = Array.from(uploadedRef.current);
    if (storageIds.length === 0) {
      return;
    }
    uploadedRef.current.clear();
    void cleanupDraftUploads({ storageIds });
  }, [cleanupDraftUploads]);

  useEffect(() => cleanupTrackedDrafts, [cleanupTrackedDrafts]);

  return { cleanupTrackedDrafts, commitTrackedDrafts, trackDraftUpload };
}

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

export function useSettingsCleanup() {
  const cleanupMutation = useMutation(api.storage.cleanupSettingsImages);

  const cleanupUnusedImages = useCallback(async (usedUrls: string[]) => {
    try {
      const result = await cleanupMutation({ usedUrls });

      if (result.deleted > 0) {
        toast.success(`Đã xóa ${result.deleted} ảnh không sử dụng`);
      } else {
        toast.info('Không có ảnh nào cần xóa');
      }

      return result;
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Không thể dọn dẹp ảnh');
      return null;
    }
  }, [cleanupMutation]);

  return { cleanupUnusedImages };
}

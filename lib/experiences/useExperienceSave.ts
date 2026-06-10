import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { EXPERIENCE_GROUP, MESSAGES } from './constants';

interface UseExperienceSaveResult {
  handleSave: () => Promise<void>;
  isSaving: boolean;
}

type ExperienceSaveTransform = (config: unknown) => unknown;

/**
 * Hook để handle save experience config
 * @param experienceKey - Key của experience (vd: 'product_detail_ui')
 * @param config - Current config object
 * @param successMessage - Success toast message
 * @param additionalSettings - Additional settings to save (optional)
 */
export function useExperienceSave(
  experienceKey: string,
  config: unknown,
  successMessage: string,
  additionalSettings?: Array<{ group: string; key: string; value: unknown }>,
  beforeSaveTransform?: ExperienceSaveTransform
): UseExperienceSaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const setMultipleSettings = useMutation(api.settings.setMultiple);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalizedConfig = beforeSaveTransform ? beforeSaveTransform(config) : config;
      const settingsToSave: Array<{ group: string; key: string; value: unknown }> = [
        { group: EXPERIENCE_GROUP, key: experienceKey, value: normalizedConfig }
      ];

      if (additionalSettings) {
        settingsToSave.push(...additionalSettings);
      }

      await setMultipleSettings({ settings: settingsToSave });
      toast.success(successMessage);
    } catch {
      toast.error(MESSAGES.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleSave,
    isSaving,
  };
}

'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { revalidateSeoPaths } from '@/app/actions/seo-revalidate';
import type { ModuleDefinition } from '../define-module';
import type { FieldConfig, FieldType } from '@/types/module-config';

type FeaturesState = Record<string, boolean>;
type SettingsState = Record<string, string | number | boolean>;

export function useModuleConfig(config: ModuleDefinition) {
  const moduleKey = config.key;
  const categoryKey = config.categoryModuleKey;
   
   // ============ QUERIES ============
   const moduleData = useQuery(api.admin.modules.getModuleByKey, { key: moduleKey });
   const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey });
   const fieldsData = useQuery(api.admin.modules.listModuleFields, { moduleKey });
   const categoryFieldsData = useQuery(
     api.admin.modules.listModuleFields,
     categoryKey ? { moduleKey: categoryKey } : 'skip'
   );
   const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey });
   
   // ============ MUTATIONS ============
  const toggleFeature = useMutation(api.admin.modules.toggleModuleFeature);
  const updateField = useMutation(api.admin.modules.updateModuleField);
  const setSetting = useMutation(api.admin.modules.setModuleSetting);
  const resetModuleConfig = useMutation(api.admin.modules.resetModuleConfig);
  const seedAllModulesConfig = useAction(api.seed.seedAllModulesConfig);
   
   // ============ LOCAL STATE ============
   const [localFeatures, setLocalFeatures] = useState<FeaturesState>({});
   const [localFields, setLocalFields] = useState<FieldConfig[]>([]);
   const [localCategoryFields, setLocalCategoryFields] = useState<FieldConfig[]>([]);
   const [localSettings, setLocalSettings] = useState<SettingsState>({});
  const [isSaving, setIsSaving] = useState(false);
  const hasMigratedOrphanRef = useRef(false);
  const hasTriggeredAutoHealRef = useRef(false);
   
   const isLoading = moduleData === undefined || 
                     featuresData === undefined || 
                     fieldsData === undefined || 
                     settingsData === undefined;
  const isModuleDisabled = moduleData?.enabled === false;

  useEffect(() => {
    if (hasTriggeredAutoHealRef.current) {
      return;
    }
    if (moduleData === undefined || featuresData === undefined || fieldsData === undefined || settingsData === undefined) {
      return;
    }
    if (isModuleDisabled) {
      return;
    }
    if (featuresData.length > 0 && fieldsData.length > 0) {
      return;
    }
    hasTriggeredAutoHealRef.current = true;
    const run = async () => {
      try {
        await seedAllModulesConfig({});
      } catch (error) {
        hasTriggeredAutoHealRef.current = false;
        console.error('[ModuleConfig] Auto-heal preset thất bại', error);
      }
    };
    void run();
  }, [featuresData, fieldsData, isModuleDisabled, moduleData, seedAllModulesConfig, settingsData]);
   
   // ============ SYNC EFFECTS ============
   useEffect(() => {
     if (featuresData) {
       const state: FeaturesState = {};
       if (config.features) {
         for (const feature of config.features) {
           state[feature.key] = feature.enabled ?? false;
         }
       }
       for (const f of featuresData) {
         state[f.featureKey] = f.enabled;
       }
      if (moduleKey === 'products' && state.enableCategoryHierarchy === undefined) {
        state.enableCategoryHierarchy = false;
      }
       setLocalFeatures(state);
     }
  }, [featuresData, moduleKey, config.features]);
   
   useEffect(() => {
     if (fieldsData) {
       setLocalFields(fieldsData.map(f => ({
         id: f._id,
         name: f.name,
         key: f.fieldKey,
        type: f.type as FieldType,
         required: f.required,
         enabled: f.enabled,
         isSystem: f.isSystem,
         linkedFeature: f.linkedFeature,
       })));
     }
   }, [fieldsData]);

  useEffect(() => {
    if (moduleKey !== 'subscriptions' || !fieldsData || hasMigratedOrphanRef.current) {
      return;
    }
    if (isModuleDisabled) {
      return;
    }
    const validFields = new Set(['title', 'status', 'dueDate', 'customerId', 'productId']);
    const hasOrphan = fieldsData.some(field => !validFields.has(field.fieldKey));
    if (!hasOrphan) {
      return;
    }
    hasMigratedOrphanRef.current = true;
    const run = async () => {
      try {
        await resetModuleConfig({ moduleKey: 'subscriptions' });
        hasMigratedOrphanRef.current = false;
      } catch (error) {
        hasMigratedOrphanRef.current = false;
        console.error('[ModuleConfig] Auto-heal subscriptions orphan thất bại', error);
      }
    };
    void run();
  }, [moduleKey, fieldsData, isModuleDisabled, resetModuleConfig]);

   
   useEffect(() => {
     if (categoryFieldsData) {
       setLocalCategoryFields(categoryFieldsData.map(f => ({
         id: f._id,
         name: f.name,
         key: f.fieldKey,
        type: f.type as FieldType,
         required: f.required,
         enabled: f.enabled,
         isSystem: f.isSystem,
         linkedFeature: f.linkedFeature,
       })));
     }
   }, [categoryFieldsData]);
   
   useEffect(() => {
     if (settingsData) {
       const state: SettingsState = {};
       // Initialize from defaults
       if (config.settings) {
        for (const s of config.settings) {
          if (s.type === 'number') {
            state[s.key] = s.default ?? 0;
          } else if (s.type === 'toggle') {
            state[s.key] = s.default ?? false;
          } else {
            state[s.key] = s.default ?? '';
          }
        }
       }
       // Override with DB values
       for (const s of settingsData) {
         state[s.settingKey] = s.value as string | number | boolean;
       }
       setLocalSettings(state);
     }
   }, [settingsData, config.settings]);

  useEffect(() => {
    if (moduleKey !== 'settings') {return;}
    const mode = localSettings.site_brand_mode;
    if (!mode) {return;}
    const shouldEnable = mode !== 'single';
    setLocalFields(prev => {
      let changed = false;
      const next = prev.map(field => {
        if (field.key !== 'site_brand_secondary') {return field;}
        if (field.enabled === shouldEnable) {return field;}
        changed = true;
        return { ...field, enabled: shouldEnable };
      });
      return changed ? next : prev;
    });
  }, [moduleKey, localSettings.site_brand_mode]);
   
   // ============ SERVER STATE FOR COMPARISON ============
   const serverFeatures = useMemo<FeaturesState>(() => {
     const state: FeaturesState = {};
     if (config.features) {
       for (const feature of config.features) {
         state[feature.key] = feature.enabled ?? false;
       }
     }
     if (featuresData) {
       for (const f of featuresData) {
         state[f.featureKey] = f.enabled;
       }
     }
     return state;
   }, [featuresData, config.features]);
   
   const serverSettings = useMemo<SettingsState>(() => {
     const state: SettingsState = {};
     if (config.settings) {
      for (const s of config.settings) {
        if (s.type === 'number') {
          state[s.key] = s.default ?? 0;
        } else if (s.type === 'toggle') {
          state[s.key] = s.default ?? false;
        } else {
          state[s.key] = s.default ?? '';
        }
      }
     }
     if (settingsData) {
       for (const s of settingsData) {
         state[s.settingKey] = s.value as string | number | boolean;
       }
     }
     return state;
   }, [settingsData, config.settings]);
   
   // ============ CHANGE DETECTION ============
   const hasChanges = useMemo(() => {
     const featuresChanged = Object.keys(localFeatures).some(
       key => localFeatures[key] !== serverFeatures[key]
     );
     
     const fieldsChanged = localFields.some((f, i) => {
       const serverField = fieldsData?.[i];
       return serverField && f.enabled !== serverField.enabled;
     });
     
     const categoryFieldsChanged = localCategoryFields.some((f, i) => {
       const serverField = categoryFieldsData?.[i];
       return serverField && f.enabled !== serverField.enabled;
     });
     
     const settingsChanged = Object.keys(localSettings).some(
       key => localSettings[key] !== serverSettings[key]
     );
     
     return featuresChanged || fieldsChanged || categoryFieldsChanged || settingsChanged;
   }, [localFeatures, serverFeatures, localFields, fieldsData, localCategoryFields, categoryFieldsData, localSettings, serverSettings]);
   
   // ============ HANDLERS ============
   const handleToggleFeature = useCallback((key: string) => {
     const feature = config.features?.find(f => f.key === key);
     const currentState = localFeatures[key] ?? feature?.enabled ?? false;
     const newState = !currentState;
     setLocalFeatures(prev => ({ ...prev, [key]: newState }));
     
     // Auto-update linked fields
     if (feature?.linkedField) {
       setLocalFields(prev => prev.map(f => {
        if (f.linkedFeature !== key) {return f;}
        if (f.isSystem && !newState) {return f;}
        return { ...f, enabled: newState };
      }));
     }

    if (moduleKey === 'subscriptions' && key === 'enablePriority') {
      setLocalFields(prev => prev.map(field => (
        field.key === 'priority' ? { ...field, enabled: newState } : field
      )));
    }
  }, [config.features, localFeatures, moduleKey]);
   
   const handleToggleField = useCallback((fieldKey: string) => {
     setLocalFields(prev => prev.map(f => 
       f.key === fieldKey ? { ...f, enabled: !f.enabled } : f
     ));
   }, []);
   
    const handleToggleCategoryField = useCallback((fieldKey: string) => {
      setLocalCategoryFields(prev => {
        const nextFields = prev.map(f => 
          f.key === fieldKey ? { ...f, enabled: !f.enabled } : f
        );
        const targetField = nextFields.find(f => f.key === fieldKey);
        const isNowEnabled = targetField?.enabled ?? false;

        if (!isNowEnabled && moduleKey === 'products') {
          setLocalSettings(prevSettings => {
            const nextSettings = { ...prevSettings };
            if (fieldKey === 'description') {
              nextSettings.showCategorySubtitle = false;
            } else if (fieldKey === 'filterFooterContent') {
              nextSettings.enableCategoryFilterFooterContent = false;
            } else if (fieldKey === 'productDetailSuffixContent') {
              nextSettings.enableCategoryProductDetailSuffix = false;
            } else if (fieldKey === 'productDetailFaqItems') {
              nextSettings.enableCategoryProductDetailFaq = false;
            }
            return nextSettings;
          });
        }
        return nextFields;
      });
    }, [moduleKey]);
    
    const handleSettingChange = useCallback((key: string, value: string | number | boolean) => {
      setLocalSettings(prev => {
        const next = { ...prev, [key]: value };
        if (moduleKey === 'homepage' && key === 'enableSmartWizard' && value === false) {
          next.enableLegacySnapshotQuickCreate = false;
        }
        return next;
      });

      if (moduleKey === 'products') {
        if (key === 'showCategorySubtitle') {
          if (value === true) {
            setLocalCategoryFields(prev => prev.map(f => f.key === 'description' ? { ...f, enabled: true } : f));
          }
        } else if (key === 'enableCategoryFilterFooterContent') {
          setLocalCategoryFields(prev => prev.map(f => f.key === 'filterFooterContent' ? { ...f, enabled: value === true } : f));
        } else if (key === 'enableCategoryProductDetailSuffix') {
          setLocalCategoryFields(prev => prev.map(f => f.key === 'productDetailSuffixContent' ? { ...f, enabled: value === true } : f));
        } else if (key === 'enableCategoryProductDetailFaq') {
          setLocalCategoryFields(prev => prev.map(f => f.key === 'productDetailFaqItems' ? { ...f, enabled: value === true } : f));
        }
      }

      if (moduleKey === 'posts' && key === 'enableAutoPostGenerator' && value === true) {
        setLocalFeatures(prev => ({ ...prev, enableHtmlRender: true }));
        setLocalFields(prev => prev.map(field => (
          field.linkedFeature === 'enableHtmlRender' ? { ...field, enabled: true } : field
        )));
      }
    }, [moduleKey]);
   
   // ============ BATCH SAVE ============
   const handleSave = useCallback(async () => {
    if (isModuleDisabled) {
      toast.error('Module đang tắt, không thể lưu cấu hình.');
      return;
    }
     setIsSaving(true);
     try {
      const hasSiteUrlChanged = moduleKey === 'settings' && localSettings.site_url !== serverSettings.site_url;
       const promises: Promise<unknown>[] = [];
       
       // Collect feature updates
       for (const key of Object.keys(localFeatures)) {
         if (localFeatures[key] !== serverFeatures[key]) {
           promises.push(toggleFeature({ 
             moduleKey, 
             featureKey: key, 
             enabled: localFeatures[key] 
           }));
         }
       }
       
       // Collect field updates
       for (let i = 0; i < localFields.length; i++) {
         const f = localFields[i];
         const serverField = fieldsData?.[i];
         if (serverField && f.enabled !== serverField.enabled) {
           promises.push(updateField({ 
             id: serverField._id, 
             enabled: f.enabled 
           }));
         }
       }
       
       // Collect category field updates
       for (let i = 0; i < localCategoryFields.length; i++) {
         const f = localCategoryFields[i];
         const serverField = categoryFieldsData?.[i];
         if (serverField && f.enabled !== serverField.enabled) {
           promises.push(updateField({ 
             id: serverField._id, 
             enabled: f.enabled 
           }));
         }
       }
       
       // Collect settings updates
       for (const key of Object.keys(localSettings)) {
         if (localSettings[key] !== serverSettings[key]) {
           promises.push(setSetting({ 
             moduleKey, 
             settingKey: key, 
             value: localSettings[key] 
           }));
         }
       }
       
       await Promise.all(promises);
      if (hasSiteUrlChanged) {
        void revalidateSeoPaths().catch(() => {
          toast.warning('Đã lưu, đồng bộ SEO đang chậm.');
        });
      }
       toast.success('Đã lưu cấu hình!');
     } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
     } finally {
       setIsSaving(false);
     }
  }, [
    moduleKey,
    localFeatures, serverFeatures, toggleFeature,
    localFields, fieldsData, updateField,
    localCategoryFields, categoryFieldsData,
    localSettings, serverSettings, setSetting,
    isModuleDisabled,
  ]);
   
   return {
     // Data
     moduleData,
     featuresData,
     fieldsData,
     categoryFieldsData,
     settingsData,
     localFeatures,
     localFields,
     localCategoryFields,
     localSettings,
     
     // Status
     isLoading,
     isSaving,
     hasChanges,
     
     // Handlers
     handleToggleFeature,
     handleToggleField,
     handleToggleCategoryField,
     handleSettingChange,
     handleSave,
   };
 }

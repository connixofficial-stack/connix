 ---
 name: coc-module-system
 description: "Hệ thống Convention over Configuration cho Module System. Sử dụng khi: (1) Tạo/refactor system config page tại /system/modules/*, (2) Giảm boilerplate code cho module config, (3) Áp dụng CoC pattern cho admin modules. Giảm 80% code từ 400-900 dòng xuống còn ~25 dòng/module."
 version: 1.0.0
 ---
 
 # CoC Module System - Convention over Configuration
 
 ## Overview
 
 Skill này hướng dẫn triển khai **Convention over Configuration (CoC)** cho hệ thống Module Config tại `/system/modules/*`.
 
 ### Vấn đề hiện tại
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │  posts/page.tsx (600 dòng)  │  products/page.tsx (900 dòng)    │
 │  comments/page.tsx (400 dòng) │  ... và sẽ còn nhiều modules   │
 ├─────────────────────────────────────────────────────────────────┤
 │                    95% CODE GIỐNG NHAU!                         │
 │  - useQuery để fetch features, fields, settings                 │
 │  - useState để local state                                      │
 │  - useMemo để so sánh changes                                   │
 │  - handleToggleFeature, handleToggleField                       │
 │  - handleSave với Promise.all                                   │
 │  - Tab switching, seed/clear data                               │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### Giải pháp CoC
 
 | Tiêu chí | Hiện tại | CoC |
 |----------|----------|-----|
 | **Số dòng/module** | 400-900 | **~25** |
 | **Thời gian thêm module** | 2-4 giờ | **10 phút** |
 | **Fix bug** | Sửa N chỗ | **1 chỗ** |
 | **Dependencies mới** | 0 | **0** |
 
 ## Khi nào sử dụng
 
 - Tạo system config page mới tại `/system/modules/[module-name]/`
 - Refactor module config page hiện tại để giảm boilerplate
 - Thêm tính năng mới cho tất cả modules cùng lúc
 - Apply CoC pattern cho existing modules
 
 ## Kiến trúc
 
 ```
 lib/
 └── modules/
     ├── define-module.ts         # Factory function tạo config
     ├── hooks/
     │   └── useModuleConfig.ts   # Hook quản lý state + save
     └── conventions.ts           # Auto-link rules
 
 components/
 └── modules/
     ├── shared/                  # Đã có sẵn
     │   ├── ModuleHeader.tsx
     │   ├── FieldsCard.tsx
     │   ├── FeaturesCard.tsx
     │   └── SettingsCard.tsx
     └── ModuleConfigPage.tsx     # Generic component (TẠO MỚI)
 
 app/system/modules/
 └── [module-name]/
     └── page.tsx                 # CHỈ 3 DÒNG!
 ```
 
 ## Instructions
 
 ### Step 1: Tạo Module Config Definition
 
 Tạo file config tại `lib/modules/configs/[module-name].config.ts`:
 
 ```typescript
 import { FileText, Tag, Star, Clock, FolderTree } from 'lucide-react';
 import { defineModule } from '../define-module';
 
 export const postsModule = defineModule({
   // ⚠️ REQUIRED: Key phải match với moduleKey trong DB
   key: 'posts',
   
   // ⚠️ REQUIRED: Display info
   name: 'Bài viết',
   description: 'Quản lý bài viết',
   icon: FileText,
   
   // ⚠️ REQUIRED: Color theme (tailwind color name)
   color: 'cyan',
   
   // ⚠️ OPTIONAL: Related module (categories)
   categoryModuleKey: 'postCategories',
   
   // ⚠️ OPTIONAL: Features với convention auto-link
   features: [
     // Convention: 'enableXxx' → auto link field 'xxx' hoặc 'xxxCount'
     { key: 'enableTags', label: 'Tags', icon: Tag },
     { key: 'enableFeatured', label: 'Nổi bật', icon: Star },
     { key: 'enableScheduling', label: 'Hẹn giờ', icon: Clock },
   ],
   
   // ⚠️ OPTIONAL: Settings với types
   settings: [
     { key: 'postsPerPage', label: 'Số bài/trang', type: 'number', default: 10 },
     { 
       key: 'defaultStatus', 
       label: 'Trạng thái mặc định', 
       type: 'select',
       default: 'draft',
       options: [
         { value: 'draft', label: 'Bản nháp' },
         { value: 'published', label: 'Xuất bản' },
       ],
     },
   ],
   
   // ⚠️ OPTIONAL: Convention note hiển thị ở footer
   conventionNote: 'Slug tự động từ tiêu đề. Trường order và active bắt buộc.',
 });
 ```
 
 ### Step 2: Tạo Factory Function
 
 Tạo file `lib/modules/define-module.ts`:
 
 ```typescript
 import { LucideIcon } from 'lucide-react';
 
 export interface ModuleFeature {
   key: string;           // VD: 'enableTags'
   label: string;         // VD: 'Tags'
   icon?: LucideIcon;     // VD: Tag
   linkedField?: string;  // Override auto-link, VD: 'tagsArray'
 }
 
 export interface ModuleSetting {
   key: string;
   label: string;
   type: 'number' | 'select' | 'toggle';
   default?: string | number | boolean;
   options?: { value: string; label: string }[];
 }
 
 export interface ModuleDefinition {
   key: string;
   name: string;
   description: string;
   icon: LucideIcon;
   color: string;
   categoryModuleKey?: string;
   features?: ModuleFeature[];
   settings?: ModuleSetting[];
   conventionNote?: string;
   tabs?: ('config' | 'data' | 'appearance')[];
 }
 
 // Convention: enableXxx → field 'xxx' hoặc 'xxxCount'
 function getLinkedField(featureKey: string): string {
   // enableTags → tags
   // enableLikes → likesCount
   // enableFeatured → featured
   const fieldName = featureKey.replace(/^enable/, '');
   const lowercaseFirst = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
   
   // Convention: nếu là count-based feature, thêm suffix 'Count'
   const countFeatures = ['likes', 'views', 'shares', 'comments'];
   if (countFeatures.includes(lowercaseFirst.toLowerCase())) {
     return lowercaseFirst + 'Count';
   }
   
   return lowercaseFirst;
 }
 
 export function defineModule(config: ModuleDefinition): ModuleDefinition {
   // Apply conventions
   const features = config.features?.map(f => ({
     ...f,
     linkedField: f.linkedField ?? getLinkedField(f.key),
   }));
   
   return {
     ...config,
     features,
     tabs: config.tabs ?? ['config', 'data'], // Default tabs
   };
 }
 ```
 
 ### Step 3: Tạo useModuleConfig Hook
 
 Tạo file `lib/modules/hooks/useModuleConfig.ts`:
 
 ```typescript
 import { useState, useEffect, useMemo, useCallback } from 'react';
 import { useQuery, useMutation, usePaginatedQuery } from 'convex/react';
 import { api } from '@/convex/_generated/api';
 import { toast } from 'sonner';
 import { ModuleDefinition } from '../define-module';
 import { FieldConfig } from '@/types/module-config';
 
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
   
   // ============ LOCAL STATE ============
   const [localFeatures, setLocalFeatures] = useState<FeaturesState>({});
   const [localFields, setLocalFields] = useState<FieldConfig[]>([]);
   const [localCategoryFields, setLocalCategoryFields] = useState<FieldConfig[]>([]);
   const [localSettings, setLocalSettings] = useState<SettingsState>({});
   const [isSaving, setIsSaving] = useState(false);
   
   const isLoading = moduleData === undefined || 
                     featuresData === undefined || 
                     fieldsData === undefined || 
                     settingsData === undefined;
   
   // ============ SYNC EFFECTS ============
   useEffect(() => {
     if (featuresData) {
       const state: FeaturesState = {};
       featuresData.forEach(f => { state[f.featureKey] = f.enabled; });
       setLocalFeatures(state);
     }
   }, [featuresData]);
   
   useEffect(() => {
     if (fieldsData) {
       setLocalFields(fieldsData.map(f => ({
         id: f._id,
         name: f.name,
         key: f.fieldKey,
         type: f.type,
         required: f.required,
         enabled: f.enabled,
         isSystem: f.isSystem,
         linkedFeature: f.linkedFeature,
       })));
     }
   }, [fieldsData]);
   
   useEffect(() => {
     if (categoryFieldsData) {
       setLocalCategoryFields(categoryFieldsData.map(f => ({
         id: f._id,
         name: f.name,
         key: f.fieldKey,
         type: f.type,
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
       config.settings?.forEach(s => {
         state[s.key] = s.default ?? (s.type === 'number' ? 0 : '');
       });
       // Override with DB values
       settingsData.forEach(s => {
         state[s.settingKey] = s.value as string | number | boolean;
       });
       setLocalSettings(state);
     }
   }, [settingsData, config.settings]);
   
   // ============ SERVER STATE FOR COMPARISON ============
   const serverFeatures = useMemo<FeaturesState>(() => {
     const state: FeaturesState = {};
     featuresData?.forEach(f => { state[f.featureKey] = f.enabled; });
     return state;
   }, [featuresData]);
   
   const serverSettings = useMemo<SettingsState>(() => {
     const state: SettingsState = {};
     config.settings?.forEach(s => {
       state[s.key] = s.default ?? (s.type === 'number' ? 0 : '');
     });
     settingsData?.forEach(s => {
       state[s.settingKey] = s.value as string | number | boolean;
     });
     return state;
   }, [settingsData, config.settings]);
   
   // ============ CHANGE DETECTION ============
   const hasChanges = useMemo(() => {
     // Check features
     const featuresChanged = Object.keys(localFeatures).some(
       key => localFeatures[key] !== serverFeatures[key]
     );
     
     // Check fields
     const fieldsChanged = localFields.some((f, i) => {
       const serverField = fieldsData?.[i];
       return serverField && f.enabled !== serverField.enabled;
     });
     
     // Check category fields
     const categoryFieldsChanged = localCategoryFields.some((f, i) => {
       const serverField = categoryFieldsData?.[i];
       return serverField && f.enabled !== serverField.enabled;
     });
     
     // Check settings
     const settingsChanged = Object.keys(localSettings).some(
       key => localSettings[key] !== serverSettings[key]
     );
     
     return featuresChanged || fieldsChanged || categoryFieldsChanged || settingsChanged;
   }, [localFeatures, serverFeatures, localFields, fieldsData, localCategoryFields, categoryFieldsData, localSettings, serverSettings]);
   
   // ============ HANDLERS ============
   const handleToggleFeature = useCallback((key: string) => {
     const newState = !localFeatures[key];
     setLocalFeatures(prev => ({ ...prev, [key]: newState }));
     
     // Auto-update linked fields
     const feature = config.features?.find(f => f.key === key);
     if (feature?.linkedField) {
       setLocalFields(prev => prev.map(f => 
         f.linkedFeature === key ? { ...f, enabled: newState } : f
       ));
     }
   }, [localFeatures, config.features]);
   
   const handleToggleField = useCallback((fieldKey: string) => {
     setLocalFields(prev => prev.map(f => 
       f.key === fieldKey ? { ...f, enabled: !f.enabled } : f
     ));
   }, []);
   
   const handleToggleCategoryField = useCallback((fieldKey: string) => {
     setLocalCategoryFields(prev => prev.map(f => 
       f.key === fieldKey ? { ...f, enabled: !f.enabled } : f
     ));
   }, []);
   
   const handleSettingChange = useCallback(<K extends keyof SettingsState>(
     key: K, 
     value: SettingsState[K]
   ) => {
     setLocalSettings(prev => ({ ...prev, [key]: value }));
   }, []);
   
   // ============ BATCH SAVE ============
   const handleSave = useCallback(async () => {
     setIsSaving(true);
     try {
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
       localFields.forEach((f, i) => {
         const serverField = fieldsData?.[i];
         if (serverField && f.enabled !== serverField.enabled) {
           promises.push(updateField({ 
             id: serverField._id, 
             enabled: f.enabled 
           }));
         }
       });
       
       // Collect category field updates
       localCategoryFields.forEach((f, i) => {
         const serverField = categoryFieldsData?.[i];
         if (serverField && f.enabled !== serverField.enabled) {
           promises.push(updateField({ 
             id: serverField._id, 
             enabled: f.enabled 
           }));
         }
       });
       
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
   ]);
   
   return {
     // Data
     moduleData,
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
 ```
 
 ### Step 4: Tạo ModuleConfigPage Component
 
 Tạo file `components/modules/ModuleConfigPage.tsx`:
 
 ```typescript
 'use client';
 
 import React, { useState } from 'react';
 import { usePaginatedQuery, useMutation } from 'convex/react';
 import { api } from '@/convex/_generated/api';
 import { toast } from 'sonner';
 import { Database, Settings, Palette, Trash2, RefreshCw, Loader2, FolderTree } from 'lucide-react';
 import { ModuleDefinition } from '@/lib/modules/define-module';
 import { useModuleConfig } from '@/lib/modules/hooks/useModuleConfig';
 import { 
   ModuleHeader, 
   ModuleStatus, 
   ConventionNote, 
   Code,
   SettingsCard, 
   SettingInput, 
   SettingSelect,
   FeaturesCard,
   FieldsCard,
 } from '@/components/modules/shared';
 import { Card, CardContent, CardHeader, CardTitle, Button, cn } from '@/app/admin/components/ui';
 
 type TabType = 'config' | 'data' | 'appearance';
 
 interface ModuleConfigPageProps {
   config: ModuleDefinition;
 }
 
 export function ModuleConfigPage({ config }: ModuleConfigPageProps) {
   const [activeTab, setActiveTab] = useState<TabType>('config');
   
   const {
     moduleData,
     localFeatures,
     localFields,
     localCategoryFields,
     localSettings,
     isLoading,
     isSaving,
     hasChanges,
     handleToggleFeature,
     handleToggleField,
     handleToggleCategoryField,
     handleSettingChange,
     handleSave,
   } = useModuleConfig(config);
   
   // Color classes from config.color
   const colorClasses = getColorClasses(config.color);
   
   // Tabs từ config
   const tabs = config.tabs ?? ['config', 'data'];
   
   if (isLoading) {
     return (
       <div className="flex items-center justify-center h-64">
         <Loader2 size={32} className="animate-spin text-slate-400" />
       </div>
     );
   }
   
   return (
     <div className="space-y-6 max-w-5xl mx-auto">
       <ModuleHeader
         icon={config.icon}
         title={`Module ${config.name}`}
         description={config.description}
         iconBgClass={colorClasses.iconBg}
         iconTextClass={colorClasses.iconText}
         buttonClass={colorClasses.button}
         onSave={activeTab === 'config' ? handleSave : undefined}
         hasChanges={activeTab === 'config' ? hasChanges : false}
         isSaving={isSaving}
       />
       
       {/* Tabs */}
       {tabs.length > 1 && (
         <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
           {tabs.includes('config') && (
             <TabButton
               active={activeTab === 'config'}
               onClick={() => setActiveTab('config')}
               icon={Settings}
               label="Cấu hình"
               colorClass={colorClasses.tab}
             />
           )}
           {tabs.includes('data') && (
             <TabButton
               active={activeTab === 'data'}
               onClick={() => setActiveTab('data')}
               icon={Database}
               label="Dữ liệu"
               colorClass={colorClasses.tab}
             />
           )}
           {tabs.includes('appearance') && (
             <TabButton
               active={activeTab === 'appearance'}
               onClick={() => setActiveTab('appearance')}
               icon={Palette}
               label="Giao diện"
               colorClass={colorClasses.tab}
             />
           )}
         </div>
       )}
       
       {/* Config Tab */}
       {activeTab === 'config' && (
         <ConfigTab
           config={config}
           moduleData={moduleData}
           localFeatures={localFeatures}
           localFields={localFields}
           localCategoryFields={localCategoryFields}
           localSettings={localSettings}
           colorClasses={colorClasses}
           onToggleFeature={handleToggleFeature}
           onToggleField={handleToggleField}
           onToggleCategoryField={handleToggleCategoryField}
           onSettingChange={handleSettingChange}
         />
       )}
       
       {/* Data Tab */}
       {activeTab === 'data' && (
         <DataTab config={config} colorClasses={colorClasses} />
       )}
       
       {/* Appearance Tab */}
       {activeTab === 'appearance' && (
         <AppearanceTab config={config} colorClasses={colorClasses} />
       )}
     </div>
   );
 }
 
 // ============ SUB-COMPONENTS ============
 
 function TabButton({ active, onClick, icon: Icon, label, colorClass }: {
   active: boolean;
   onClick: () => void;
   icon: React.ComponentType<{ size?: number }>;
   label: string;
   colorClass: string;
 }) {
   return (
     <button
       onClick={onClick}
       className={cn(
         "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors",
         active
           ? `${colorClass} text-slate-900 dark:text-slate-100`
           : "border-transparent text-slate-500 hover:text-slate-700"
       )}
     >
       <Icon size={16} />
       {label}
     </button>
   );
 }
 
 function ConfigTab({ config, moduleData, localFeatures, localFields, localCategoryFields, localSettings, colorClasses, onToggleFeature, onToggleField, onToggleCategoryField, onSettingChange }: {
   config: ModuleDefinition;
   moduleData: unknown;
   localFeatures: Record<string, boolean>;
   localFields: { key: string; name: string; enabled: boolean; isSystem: boolean; linkedFeature?: string }[];
   localCategoryFields: { key: string; name: string; enabled: boolean; isSystem: boolean }[];
   localSettings: Record<string, string | number | boolean>;
   colorClasses: ReturnType<typeof getColorClasses>;
   onToggleFeature: (key: string) => void;
   onToggleField: (key: string) => void;
   onToggleCategoryField: (key: string) => void;
   onSettingChange: (key: string, value: string | number | boolean) => void;
 }) {
   const mod = moduleData as { isCore?: boolean; enabled?: boolean } | undefined;
   
   return (
     <>
       <ModuleStatus 
         isCore={mod?.isCore ?? false} 
         enabled={mod?.enabled ?? true} 
         toggleColor={colorClasses.toggle}
       />
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         {/* Settings + Features */}
         <div className="space-y-4">
           {config.settings && config.settings.length > 0 && (
             <SettingsCard>
               {config.settings.map(setting => (
                 setting.type === 'select' ? (
                   <SettingSelect
                     key={setting.key}
                     label={setting.label}
                     value={String(localSettings[setting.key] ?? '')}
                     onChange={(v) => onSettingChange(setting.key, v)}
                     options={setting.options ?? []}
                   />
                 ) : (
                   <SettingInput
                     key={setting.key}
                     label={setting.label}
                     value={Number(localSettings[setting.key] ?? 0)}
                     onChange={(v) => onSettingChange(setting.key, v)}
                   />
                 )
               ))}
             </SettingsCard>
           )}
           
           {config.features && config.features.length > 0 && (
             <FeaturesCard
               features={config.features.map(f => ({
                 config: { 
                   key: f.key, 
                   label: f.label, 
                   icon: f.icon ?? Settings,
                   linkedField: f.linkedField,
                 },
                 enabled: localFeatures[f.key] ?? false,
               }))}
               onToggle={onToggleFeature}
               toggleColor={colorClasses.toggle}
             />
           )}
         </div>
         
         {/* Main Fields */}
         <FieldsCard
           title={`Trường ${config.name}`}
           icon={config.icon}
           fields={localFields}
           onToggle={onToggleField}
         />
         
         {/* Category Fields (if has categoryModuleKey) */}
         {config.categoryModuleKey && localCategoryFields.length > 0 && (
           <FieldsCard
             title="Trường danh mục"
             icon={FolderTree}
             fields={localCategoryFields}
             onToggle={onToggleCategoryField}
           />
         )}
       </div>
       
       {config.conventionNote && (
         <ConventionNote>
           <strong>Convention:</strong> {config.conventionNote}
         </ConventionNote>
       )}
     </>
   );
 }
 
 function DataTab({ config, colorClasses }: {
   config: ModuleDefinition;
   colorClasses: ReturnType<typeof getColorClasses>;
 }) {
   const moduleKey = config.key;
   
   // Dynamic import seed/clear mutations based on moduleKey
   // Note: Cần tạo mutation tương ứng trong convex/seed.ts
   const seedModule = useMutation(api.seed[`seed${capitalize(moduleKey)}Module` as keyof typeof api.seed] as unknown as typeof api.seed.seedPostsModule);
   const clearData = useMutation(api.seed[`clear${capitalize(moduleKey)}Data` as keyof typeof api.seed] as unknown as typeof api.seed.clearPostsData);
   
   const [isSeeding, setIsSeeding] = useState(false);
   const [isClearing, setIsClearing] = useState(false);
   
   const handleSeed = async () => {
     setIsSeeding(true);
     try {
       await seedModule({});
       toast.success('Đã tạo dữ liệu mẫu!');
     } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
     } finally {
       setIsSeeding(false);
     }
   };
   
   const handleClear = async () => {
     if (!confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu?')) return;
     setIsClearing(true);
     try {
       await clearData({});
       toast.success('Đã xóa dữ liệu!');
     } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
     } finally {
       setIsClearing(false);
     }
   };
   
   const handleReset = async () => {
     if (!confirm('Bạn có chắc muốn reset dữ liệu về mặc định?')) return;
     setIsClearing(true);
     try {
       await clearData({});
       await seedModule({});
       toast.success('Đã reset dữ liệu!');
     } catch (error) {
       toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
     } finally {
       setIsClearing(false);
     }
   };
   
   return (
     <div className="space-y-6">
       <Card className="p-4">
         <div className="flex items-center justify-between">
           <div>
             <h3 className="font-semibold text-slate-900 dark:text-slate-100">
               Quản lý dữ liệu mẫu
             </h3>
             <p className="text-sm text-slate-500 mt-1">
               Seed, clear hoặc reset dữ liệu module
             </p>
           </div>
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               onClick={handleSeed}
               disabled={isSeeding}
               className="gap-2"
             >
               {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
               Seed Data
             </Button>
             <Button 
               variant="outline" 
               onClick={handleClear}
               disabled={isClearing}
               className="gap-2 text-red-500 hover:text-red-600"
             >
               {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
               Clear All
             </Button>
             <Button 
               onClick={handleReset}
               disabled={isClearing || isSeeding}
               className={cn("gap-2", colorClasses.button)}
             >
               <RefreshCw size={16} />
               Reset
             </Button>
           </div>
         </div>
       </Card>
       
       {/* TODO: Add data statistics and preview tables */}
       <Card className="p-8 text-center text-slate-500">
         <Database size={48} className="mx-auto mb-4 opacity-50" />
         <p>Thống kê và preview dữ liệu sẽ hiển thị ở đây</p>
       </Card>
     </div>
   );
 }
 
 function AppearanceTab({ config, colorClasses }: {
   config: ModuleDefinition;
   colorClasses: ReturnType<typeof getColorClasses>;
 }) {
   return (
     <Card className="p-8 text-center text-slate-500">
       <Palette size={48} className="mx-auto mb-4 opacity-50" />
       <p>Cấu hình giao diện sẽ hiển thị ở đây</p>
     </Card>
   );
 }
 
 // ============ UTILITIES ============
 
 function capitalize(str: string): string {
   return str.charAt(0).toUpperCase() + str.slice(1);
 }
 
 function getColorClasses(color: string) {
   const colorMap: Record<string, {
     iconBg: string;
     iconText: string;
     button: string;
     toggle: string;
     tab: string;
   }> = {
     cyan: {
       iconBg: 'bg-cyan-500/10',
       iconText: 'text-cyan-600 dark:text-cyan-400',
       button: 'bg-cyan-600 hover:bg-cyan-500',
       toggle: 'bg-cyan-500',
       tab: 'border-cyan-500',
     },
     orange: {
       iconBg: 'bg-orange-500/10',
       iconText: 'text-orange-600 dark:text-orange-400',
       button: 'bg-orange-600 hover:bg-orange-500',
       toggle: 'bg-orange-500',
       tab: 'border-orange-500',
     },
     violet: {
       iconBg: 'bg-violet-500/10',
       iconText: 'text-violet-600 dark:text-violet-400',
       button: 'bg-violet-600 hover:bg-violet-500',
       toggle: 'bg-violet-500',
       tab: 'border-violet-500',
     },
     emerald: {
       iconBg: 'bg-emerald-500/10',
       iconText: 'text-emerald-600 dark:text-emerald-400',
       button: 'bg-emerald-600 hover:bg-emerald-500',
       toggle: 'bg-emerald-500',
       tab: 'border-emerald-500',
     },
     rose: {
       iconBg: 'bg-rose-500/10',
       iconText: 'text-rose-600 dark:text-rose-400',
       button: 'bg-rose-600 hover:bg-rose-500',
       toggle: 'bg-rose-500',
       tab: 'border-rose-500',
     },
     blue: {
       iconBg: 'bg-blue-500/10',
       iconText: 'text-blue-600 dark:text-blue-400',
       button: 'bg-blue-600 hover:bg-blue-500',
       toggle: 'bg-blue-500',
       tab: 'border-blue-500',
     },
   };
   
   return colorMap[color] ?? colorMap.blue;
 }
 ```
 
 ### Step 5: Sử dụng trong Page
 
 Tạo page mới tại `app/system/modules/[module-name]/page.tsx`:
 
 ```typescript
 import { ModuleConfigPage } from '@/components/modules/ModuleConfigPage';
 import { postsModule } from '@/lib/modules/configs/posts.config';
 
 export default function PostsModulePage() {
   return <ModuleConfigPage config={postsModule} />;
 }
 ```
 
 **CHỈ 3 DÒNG!**
 
 ## Migration Guide
 
 ### Từ Pattern Cũ → CoC
 
 1. **Extract config**: Lấy features, settings từ page hiện tại → tạo file config
 2. **Xóa boilerplate**: Xóa useState, useEffect, useMemo, handlers
 3. **Replace với hook**: Sử dụng `useModuleConfig(config)`
 4. **Replace với component**: Sử dụng `<ModuleConfigPage config={...} />`
 
 ### Checklist Migration
 
 - [ ] Tạo `lib/modules/configs/[module].config.ts`
 - [ ] Verify features mapping (key → linkedField)
 - [ ] Verify settings mapping (key → DB settingKey)
 - [ ] Test save functionality
 - [ ] Test change detection
 - [ ] Remove old page code
 
 ## Best Practices
 
 ### 1. Feature Key Convention
 
 ```typescript
 // ✅ GOOD - Auto-link hoạt động
 { key: 'enableTags', label: 'Tags' }      // → field 'tags'
 { key: 'enableFeatured', label: 'Nổi bật' } // → field 'featured'
 
 // ❌ BAD - Cần override linkedField
 { key: 'showTags', label: 'Tags' }  // Không match convention
 ```
 
 ### 2. Setting Key Convention
 
 ```typescript
 // ✅ GOOD - Match với DB
 { key: 'postsPerPage' }  // → settingKey 'postsPerPage' trong DB
 
 // ❌ BAD - Không match
 { key: 'posts_per_page' } // DB dùng camelCase
 ```
 
 ### 3. Color Convention
 
 | Module Category | Color |
 |-----------------|-------|
 | Content (posts, pages) | `cyan` |
 | Commerce (products, orders) | `orange` |
 | User (users, roles) | `violet` |
 | System (settings) | `emerald` |
 | Marketing (campaigns) | `rose` |
 
 ## Examples
 
 ### Posts Module (Content)
 
 ```typescript
 export const postsModule = defineModule({
   key: 'posts',
   name: 'Bài viết',
   description: 'Quản lý bài viết blog',
   icon: FileText,
   color: 'cyan',
   categoryModuleKey: 'postCategories',
   features: [
     { key: 'enableTags', label: 'Tags', icon: Tag },
     { key: 'enableFeatured', label: 'Nổi bật', icon: Star },
     { key: 'enableScheduling', label: 'Hẹn giờ', icon: Clock },
   ],
   settings: [
     { key: 'postsPerPage', label: 'Số bài/trang', type: 'number', default: 10 },
     { key: 'defaultStatus', label: 'Trạng thái mặc định', type: 'select', default: 'draft', options: [
       { value: 'draft', label: 'Bản nháp' },
       { value: 'published', label: 'Xuất bản' },
     ]},
   ],
   conventionNote: 'Slug tự động từ tiêu đề.',
 });
 ```
 
 ### Products Module (Commerce)
 
 ```typescript
 export const productsModule = defineModule({
   key: 'products',
   name: 'Sản phẩm',
   description: 'Quản lý sản phẩm',
   icon: Package,
   color: 'orange',
   categoryModuleKey: 'productCategories',
   features: [
     { key: 'enableStock', label: 'Quản lý kho', icon: Box },
     { key: 'enableVariants', label: 'Biến thể', icon: Layers },
     { key: 'enableGallery', label: 'Gallery ảnh', icon: Image },
   ],
   settings: [
     { key: 'productsPerPage', label: 'Số SP/trang', type: 'number', default: 12 },
     { key: 'defaultCurrency', label: 'Tiền tệ', type: 'select', default: 'VND', options: [
       { value: 'VND', label: 'VNĐ' },
       { value: 'USD', label: 'USD' },
     ]},
   ],
   tabs: ['config', 'data', 'appearance'],
 });
 ```
 
 ### Comments Module (Simple)
 
 ```typescript
 export const commentsModule = defineModule({
   key: 'comments',
   name: 'Bình luận',
   description: 'Quản lý bình luận',
   icon: MessageSquare,
   color: 'violet',
   features: [
     { key: 'enableReplies', label: 'Cho phép reply', icon: MessageCircle },
     { key: 'enableLikes', label: 'Cho phép like', icon: Heart },
     { key: 'enableModeration', label: 'Duyệt trước', icon: Shield },
   ],
   settings: [
     { key: 'commentsPerPage', label: 'Số comment/trang', type: 'number', default: 20 },
     { key: 'defaultStatus', label: 'Trạng thái mặc định', type: 'select', default: 'pending', options: [
       { value: 'pending', label: 'Chờ duyệt' },
       { value: 'approved', label: 'Đã duyệt' },
     ]},
   ],
 });
 ```
 
 ## Files to Create
 
 Khi triển khai skill này, cần tạo các files:
 
 1. `lib/modules/define-module.ts` - Factory function
 2. `lib/modules/hooks/useModuleConfig.ts` - State management hook
 3. `lib/modules/conventions.ts` - Auto-link rules (optional, có thể inline)
 4. `components/modules/ModuleConfigPage.tsx` - Generic component
 5. `lib/modules/configs/[module-name].config.ts` - Config cho từng module
 
 ## Validation Checklist
 
 - [ ] Config file có đầy đủ required fields (key, name, description, icon, color)
 - [ ] Feature keys theo convention `enableXxx`
 - [ ] Setting keys match với DB `settingKey`
 - [ ] Color là một trong: cyan, orange, violet, emerald, rose, blue
 - [ ] Seed/Clear mutations tồn tại trong `convex/seed.ts`
 - [ ] Page sử dụng đúng `<ModuleConfigPage config={...} />`

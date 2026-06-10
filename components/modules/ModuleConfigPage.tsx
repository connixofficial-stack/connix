 'use client';
 
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Settings, Palette, Loader2, FolderTree, BookOpen, Sparkles, CheckCircle2, ArrowRight, Layers, AlertTriangle } from 'lucide-react';
import type { ModuleDefinition } from '@/lib/modules/define-module';
import type { FieldConfig } from '@/types/module-config';
import { useModuleConfig } from '@/lib/modules/hooks/useModuleConfig';
import { hasModuleRuntimeDefinition } from '@/lib/modules/runtime-config';
import { 
  ModuleHeader, 
  ModuleStatus, 
  ConventionNote,
  SettingsCard, 
  SettingInput, 
  SettingSelect,
  SettingToggle,
  SettingTextarea,
  FeaturesCard,
  FieldsCard,
} from '@/components/modules/shared';
import { VariantSettingsSection } from '@/components/modules/products/VariantSettingsSection';
import { Card, cn, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@/app/admin/components/ui';
 
type TabType = 'config' | 'appearance';

const REMOVED_SETTINGS_FIELDS = new Set([
  'seo_robots',
  'seo_business_type',
  'seo_opening_hours',
  'seo_price_range',
  'seo_geo_lat',
  'seo_geo_lng',
  'seo_hreflang',
]);

const HIDDEN_COURSES_FIELDS = new Set(['durationSeconds']);

const COURSE_FIELD_NAME_OVERRIDES: Record<string, string> = {
  comparePriceAmount: 'Giá gốc',
  htmlRender: 'Nội dung HTML',
  level: 'Trình độ',
  markdownRender: 'Nội dung Markdown',
  metaDescription: 'Mô tả SEO',
  metaTitle: 'Tiêu đề SEO',
  renderType: 'Kiểu nội dung',
};
 
export interface ModuleConfigPageRenderProps {
  config: ModuleDefinition;
  colorClasses: ReturnType<typeof getColorClasses>;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

export interface ModuleConfigTabRenderProps {
  config: ModuleDefinition;
  moduleData: { isCore?: boolean; enabled?: boolean } | null | undefined;
  isReadOnly: boolean;
  localFeatures: Record<string, boolean>;
  localFields: FieldConfig[];
  localCategoryFields: FieldConfig[];
  localSettings: Record<string, string | number | boolean>;
  colorClasses: ReturnType<typeof getColorClasses>;
  onToggleFeature: (key: string) => void;
  onToggleField: (key: string) => void;
  onToggleCategoryField: (key: string) => void;
  onSettingChange: (key: string, value: string | number | boolean) => void;
}

 interface ModuleConfigPageProps {
   config: ModuleDefinition;
  renderAppearanceTab?: (props: ModuleConfigPageRenderProps) => React.ReactNode;
  renderConfigTab?: (props: ModuleConfigTabRenderProps) => React.ReactNode;
  onAppearanceSave?: () => Promise<void>;
  appearanceHasChanges?: boolean;
 }
 
export function ModuleConfigPage({ 
  config, 
  renderAppearanceTab,
  renderConfigTab,
  onAppearanceSave,
  appearanceHasChanges = false,
}: ModuleConfigPageProps) {
   const [activeTab, setActiveTab] = useState<TabType>('config');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncModuleConfig = useMutation(api.admin.modules.syncModuleConfigFromDefinition);
   
   const {
     moduleData,
     localFeatures,
     localFields,
     localCategoryFields,
     localSettings,
     isLoading,
    isSaving: isConfigSaving,
     hasChanges,
     handleToggleFeature,
     handleToggleField,
     handleToggleCategoryField,
     handleSettingChange,
     handleSave,
   } = useModuleConfig(config);
   
   const colorClasses = getColorClasses(config.color);
   const tabs = config.tabs ?? ['config'];
   const isReadOnly = moduleData?.enabled === false;
  
  const canSyncMainModule = hasModuleRuntimeDefinition(config.key);
  const canSyncCategoryModule = config.categoryModuleKey
    ? hasModuleRuntimeDefinition(config.categoryModuleKey)
    : false;
  const canSyncDefinition = canSyncMainModule;

  const renderProps: ModuleConfigPageRenderProps = {
    config,
    colorClasses,
    isSaving,
    setIsSaving,
  };

  const configTabProps: ModuleConfigTabRenderProps = {
    config,
    moduleData,
    isReadOnly,
    localFeatures,
    localFields,
    localCategoryFields,
    localSettings,
    colorClasses,
    onToggleFeature: handleToggleFeature,
    onToggleField: handleToggleField,
    onToggleCategoryField: handleToggleCategoryField,
    onSettingChange: handleSettingChange,
  };
  
  const handleAppearanceSave = async () => {
    if (!onAppearanceSave) return;
    setIsSaving(true);
    try {
      await onAppearanceSave();
    } finally {
      setIsSaving(false);
    }
  };
  const canSaveConfig = !isReadOnly;
  const hasConfigChanges = activeTab === 'config' ? hasChanges : (activeTab === 'appearance' ? appearanceHasChanges : false);

  const handleSyncDefinition = async () => {
    if (isReadOnly || !canSyncDefinition) {return;}
    setIsSyncing(true);
    try {
      const moduleKeys = [config.key, canSyncCategoryModule ? config.categoryModuleKey : undefined]
        .filter((key): key is string => Boolean(key));
      const results = await Promise.all(moduleKeys.map((moduleKey) => syncModuleConfig({ moduleKey })));
      const added = results.reduce((total, result) => total
        + result.addedFields.length
        + result.addedFeatures.length
        + result.addedSettings.length, 0);
      const updated = results.reduce((total, result) => total
        + result.updatedFields.length
        + result.updatedFeatures.length
        + result.updatedSettings.length, 0);
      if (added === 0 && updated === 0) {
        toast.message('Không có thay đổi để đồng bộ.');
        return;
      }
      toast.success(`Đã đồng bộ: thêm ${added}, cập nhật ${updated}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đồng bộ thất bại');
    } finally {
      setIsSyncing(false);
    }
  };
   
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
        onSave={canSaveConfig ? (activeTab === 'config' ? handleSave : (activeTab === 'appearance' && onAppearanceSave ? handleAppearanceSave : undefined)) : undefined}
        hasChanges={canSaveConfig ? hasConfigChanges : false}
        isSaving={isConfigSaving || isSaving}
        secondaryAction={activeTab === 'config' && canSyncDefinition ? {
          label: 'Đồng bộ từ định nghĩa',
          onClick: handleSyncDefinition,
          disabled: isReadOnly,
          isLoading: isSyncing,
        } : undefined}
       />

      {isReadOnly && (
        <div className="border border-amber-200 bg-amber-50 text-amber-700 text-sm rounded-lg p-3">
          Module đang tắt. Hãy bật module ở trang Quản lý Module để chỉnh cấu hình.
        </div>
      )}
       
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
       
       {activeTab === 'config' && (
         renderConfigTab ? renderConfigTab(configTabProps) : (
           <ConfigTab
             config={config}
             moduleData={moduleData}
             isReadOnly={isReadOnly}
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
         )
       )}
       
       {activeTab === 'appearance' && (
        renderAppearanceTab ? renderAppearanceTab(renderProps) : <AppearanceTab />
       )}
     </div>
   );
 }
 
 function TabButton({ active, onClick, icon: Icon, label, colorClass }: {
   active: boolean;
   onClick: () => void;
   icon: React.ComponentType<{ size?: number }>;
   label: string;
   colorClass: string;
 }) {
   return (
     <button
       type="button"
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
 
const PRODUCTS_MODULE_HELP_MAP: Record<string, string> = {
  general: 'Cài đặt cơ bản của sản phẩm như số lượng sản phẩm hiển thị trên trang danh sách, trạng thái mặc định của sản phẩm mới tạo (Đang bán hoặc Bản nháp), chế độ bán hàng (Giỏ hàng, Liên hệ, Affiliate) và bật/tắt chức năng Excel.',
  categoryContent: 'CẤU HÌNH NỘI DUNG RIÊNG CHO TỪNG DANH MỤC: Cho phép bạn nhập thông tin mô tả ngắn, viết bài viết dài chân trang danh mục, chèn thêm chính sách bảo hành/đổi trả riêng ở trang chi tiết sản phẩm, và thiết lập bộ câu hỏi FAQ riêng cho danh mục này. (Lưu ý: Nếu danh mục đã có FAQ riêng, hệ thống sẽ ưu tiên hiển thị FAQ này và tự động ẩn FAQ dùng chung đi để tránh lặp câu hỏi).',
  supplementalContent: 'NỘI DUNG MÔ TẢ DÙNG CHUNG: Cấu hình phần nội dung chân trang (footer) chung hiển thị toàn cục ở đầu hoặc cuối mô tả của tất cả sản phẩm đang kinh doanh trên website.',
  variants: 'Bật/tắt tính năng phân loại sản phẩm theo phiên bản (ví dụ: Size, Màu sắc...) và thiết lập cấu trúc quản lý giá bán, tồn kho, hình ảnh riêng biệt hoặc chung cho từng phiên bản.',
  digital: 'Cấu hình dành riêng cho các sản phẩm số (Digital), thiết lập loại giao hàng mặc định tự động như giao Tài khoản, License Key kích hoạt, hoặc liên kết File Download.',
  fields_products: 'BẬT/TẮT TRƯỜNG DỮ LIỆU SẢN PHẨM: Lựa chọn các trường thông tin nào sẽ hiển thị trong form Admin để bạn nhập và render ngoài trang Public (ví dụ: Giá khuyến mãi, Mã SKU, Tồn kho, Thư viện ảnh, SEO...).',
  fields_categories: 'BẬT/TẮT TRƯỜNG DỮ LIỆU DANH MỤC: Lựa chọn các trường thông tin đặc thù của danh mục nào được phép sử dụng (ví dụ: Mô tả ngắn, Bài viết tư vấn chân trang, Chính sách nối đuôi sản phẩm, FAQ danh mục...).'
};

export function ConfigTab({ config, moduleData, isReadOnly, localFeatures, localFields, localCategoryFields, localSettings, colorClasses, onToggleFeature, onToggleField, onToggleCategoryField, onSettingChange }: {
   config: ModuleDefinition;
   moduleData: { isCore?: boolean; enabled?: boolean } | null | undefined;
   isReadOnly: boolean;
   localFeatures: Record<string, boolean>;
  localFields: FieldConfig[];
  localCategoryFields: FieldConfig[];
   localSettings: Record<string, string | number | boolean>;
   colorClasses: ReturnType<typeof getColorClasses>;
   onToggleFeature: (key: string) => void;
   onToggleField: (key: string) => void;
   onToggleCategoryField: (key: string) => void;
   onSettingChange: (key: string, value: string | number | boolean) => void;
 }) {
  const [showTaxonomyHelp, setShowTaxonomyHelp] = useState(false);
  const settings = config.settings ?? [];
  const normalizedSettings = settings.map((setting) => ({
    ...setting,
    group: setting.group ?? 'general',
  }));
  const definedGroups = config.settingGroups ?? [];
  const groupKeys = new Set(definedGroups.map((group) => group.key));
  const extraGroups = Array.from(new Set(
    normalizedSettings
      .map((setting) => setting.group)
      .filter((group) => group && !groupKeys.has(group))
  ));
  const resolvedGroups = [
    ...definedGroups,
    ...extraGroups.map((key) => ({ key, label: key === 'general' ? 'Cài đặt chung' : key })),
  ];

  const settingsByGroup = resolvedGroups.map((group) => ({
    group,
    settings: normalizedSettings.filter((setting) => setting.group === group.key),
  })).filter((item) => item.settings.length > 0);

  const isProductModule = config.key === 'products';
  const isSettingsModule = config.key === 'settings';
  const advancedSettingsFeatureKeys = new Set([
    'enableProductImageAdvanced',
    'enableProductFrameAdvanced',
    'enableProductWatermarkAdvanced',
    'enableMail',
    'enableHeaderMenuAdvanced',
    'enableProductSupplementalAdvanced',
    'enableShopConfigAdvanced',
  ]);
  const featureItems = config.features?.map(f => ({
    config: {
      key: f.key,
      label: f.label,
      icon: f.icon ?? Settings,
      linkedField: f.linkedField,
      description: f.description,
    },
    enabled: localFeatures[f.key] ?? f.enabled ?? false,
  })) ?? [];
  const advancedSettingsFeatures = isSettingsModule
    ? featureItems.filter(item => advancedSettingsFeatureKeys.has(item.config.key))
    : [];
  const regularFeatures = isSettingsModule
    ? featureItems.filter(item => !advancedSettingsFeatureKeys.has(item.config.key))
    : featureItems;
  const isSingleBrandMode = isSettingsModule && localSettings.site_brand_mode === 'single';
  const visibleFields = localFields.filter((field) => {
    if (isSettingsModule && REMOVED_SETTINGS_FIELDS.has(field.key)) {
      return false;
    }
    if (config.key === 'courses' && HIDDEN_COURSES_FIELDS.has(field.key)) {
      return false;
    }
    if (config.key === 'subscriptions' && (field.key === 'timezone' || field.key === 'notes')) {
      return false;
    }
    return true;
  }).map((field) => {
    if (config.key !== 'courses') {
      return field;
    }
    const name = COURSE_FIELD_NAME_OVERRIDES[field.key];
    return name ? { ...field, name } : field;
  });
  const handleFieldToggle = (key: string) => {
    if (isSingleBrandMode && key === 'site_brand_secondary') {return;}
    onToggleField(key);
  };

  return (
     <>
       <ModuleStatus 
         isCore={moduleData?.isCore ?? false} 
         enabled={moduleData?.enabled ?? true}
         toggleColor={colorClasses.toggle}
         disabled={isReadOnly}
       />
       
       <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", isReadOnly && "pointer-events-none opacity-60")}>
         <div className="space-y-4">
          {settingsByGroup.map(({ group, settings: groupSettings }) => (
            <div key={group.key} className="space-y-3">
              <SettingsCard 
                title={group.label}
                tooltip={config.key === 'products' ? PRODUCTS_MODULE_HELP_MAP[group.key] : undefined}
              >
                {groupSettings.map(setting => {
                  if (setting.dependsOn && !localSettings[setting.dependsOn]) {
                    return null;
                  }

                  if (setting.type === 'select') {
                    return (
                      <SettingSelect
                        key={setting.key}
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                        options={setting.options ?? []}
                      />
                    );
                  }

                  if (setting.type === 'toggle') {
                    return (
                      <SettingToggle
                        key={setting.key}
                        label={setting.label}
                        value={Boolean(localSettings[setting.key])}
                        onChange={() => onSettingChange(setting.key, !localSettings[setting.key])}
                        onHelpClick={setting.key === 'enableProductTypes' ? () => setShowTaxonomyHelp(true) : undefined}
                      />
                    );
                  }

                  if (setting.type === 'text') {
                    return (
                      <SettingInput
                        key={setting.key}
                        type="text"
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                      />
                    );
                  }

                  if (setting.type === 'json') {
                    return (
                      <SettingTextarea
                        key={setting.key}
                        label={setting.label}
                        value={String(localSettings[setting.key] ?? '')}
                        onChange={(v) => onSettingChange(setting.key, v)}
                      />
                    );
                  }

                  return (
                    <SettingInput
                      key={setting.key}
                      label={setting.label}
                      value={Number(localSettings[setting.key] ?? 0)}
                      onChange={(v) => onSettingChange(setting.key, v)}
                    />
                  );
                })}
              </SettingsCard>
              {isProductModule && group.key === 'variants' && (
                <VariantSettingsSection
                  enabled={Boolean(localSettings.variantEnabled)}
                  outOfStockDisplay={String(localSettings.outOfStockDisplay ?? 'blur')}
                  imageChangeAnimation={String(localSettings.imageChangeAnimation ?? 'fade')}
                />
              )}
            </div>
          ))}
           
           {regularFeatures.length > 0 && (
             <FeaturesCard
               features={regularFeatures}
               onToggle={onToggleFeature}
               toggleColor={colorClasses.toggle}
             />
           )}
           {advancedSettingsFeatures.length > 0 && (
             <FeaturesCard
               title="Tab Cài đặt nâng cao"
               features={advancedSettingsFeatures}
               onToggle={onToggleFeature}
               toggleColor={colorClasses.toggle}
             />
           )}
         </div>
         
         <FieldsCard
           title={`Trường ${config.name}`}
           icon={config.icon}
           iconColorClass={colorClasses.iconText}
           fields={visibleFields}
           onToggle={handleFieldToggle}
           fieldColorClass={colorClasses.fieldColor}
           toggleColor={colorClasses.toggle}
           tooltip={config.key === 'products' ? PRODUCTS_MODULE_HELP_MAP['fields_products'] : undefined}
         />
         
         {config.categoryModuleKey && localCategoryFields.length > 0 && (
           <FieldsCard
             title="Trường danh mục"
             icon={FolderTree}
             iconColorClass="text-slate-500"
             fields={localCategoryFields}
             onToggle={onToggleCategoryField}
             fieldColorClass={colorClasses.fieldColor}
             toggleColor={colorClasses.toggle}
             tooltip={config.key === 'products' ? PRODUCTS_MODULE_HELP_MAP['fields_categories'] : undefined}
           />
         )}
       </div>
       
       {config.conventionNote && (
         <ConventionNote>
           <strong>Convention:</strong> {config.conventionNote}
         </ConventionNote>
       )}

       <Dialog open={showTaxonomyHelp} onOpenChange={setShowTaxonomyHelp}>
         <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-2xl">
           <div className="p-6 space-y-6">
             <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
               <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                 <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                 Quy tắc Hệ thống Phân loại & Thuộc tính (IA Option B)
               </DialogTitle>
               <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1">
                 Hướng dẫn chi tiết dành cho Nhà phát triển & AI Agent về cơ chế Routing, URL và lọc dữ liệu sản phẩm khi bật tính năng.
               </DialogDescription>
             </DialogHeader>

             <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
               {/* Block 1: TL;DR kiểu Feynman */}
               <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4.5 space-y-2">
                 <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 animate-pulse">
                   <BookOpen className="w-4 h-4" />
                   TL;DR kiểu Feynman (Tóm tắt nhanh)
                 </h4>
                 <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                   <li><strong>Loại sản phẩm (Product Type)</strong> là &ldquo;ngôi nhà chính&rdquo; (trục cha) của catalog.</li>
                   <li>URL đẹp luôn bắt đầu bằng <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 font-mono">/`{`productTypeSlug`}`</code> nếu đang ở ngữ cảnh phân loại mới.</li>
                   <li><strong>Quy tắc Primary Path:</strong> Người dùng click filter nào thì filter đó trở thành phần chính trên URL path; các filter còn lại nằm trong URL query.</li>
                   <li><strong>Lọc AND tuyệt đối:</strong> Product list và count phải được lọc kết hợp (AND) đầy đủ, không được bỏ qua <code className="font-mono text-xs">productTypeId</code> khi có filter khác.</li>
                   <li><strong>Bảo vệ an toàn:</strong> Tự động trả về 404 cho các slug rác, inactive, hoặc chưa được gán vào Product Type hiện tại.</li>
                 </ul>
               </div>

               {/* Block 2: Cấu trúc URL (Canonical Routes) */}
               <div className="space-y-3">
                 <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                   <Layers className="w-4 h-4 text-violet-500" />
                   Cấu trúc URL chính (Canonical Routes)
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-950">
                     <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Trang loại sản phẩm (Root Type)</p>
                     <code className="text-xs text-emerald-600 dark:text-emerald-400 block bg-slate-50 dark:bg-slate-900 p-1.5 rounded mb-1 border border-slate-100 dark:border-slate-850 font-mono">/`{`productTypeSlug`}`</code>
                     <span className="text-[11px] text-slate-500">Ví dụ: <code className="text-slate-600 dark:text-slate-400 font-mono">/ruou-vang-sam-panh</code></span>
                   </div>

                   <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-950">
                     <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Loại sản phẩm + Danh mục</p>
                     <code className="text-xs text-emerald-600 dark:text-emerald-400 block bg-slate-50 dark:bg-slate-900 p-1.5 rounded mb-1 border border-slate-100 dark:border-slate-850 font-mono">/`{`productTypeSlug`}`/`{`categorySlug`}`</code>
                     <span className="text-[11px] text-slate-500">Ví dụ: <code className="text-slate-600 dark:text-slate-400 font-mono">/ruou-vang-sam-panh/ruou-vang-do</code></span>
                   </div>

                   <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-950">
                     <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Loại sản phẩm + Nấc giá</p>
                     <code className="text-xs text-emerald-600 dark:text-emerald-400 block bg-slate-50 dark:bg-slate-900 p-1.5 rounded mb-1 border border-slate-100 dark:border-slate-850 font-mono">/`{`productTypeSlug`}`/`{`priceRangeSlug`}`</code>
                     <span className="text-[11px] text-slate-500">Ví dụ: <code className="text-slate-600 dark:text-slate-400 font-mono">/ruou-vang-sam-panh/duoi-500k</code></span>
                   </div>

                   <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-950">
                     <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">4. Loại sản phẩm + Thuộc tính (Single/Multi)</p>
                     <code className="text-xs text-emerald-600 dark:text-emerald-400 block bg-slate-50 dark:bg-slate-900 p-1.5 rounded mb-1 border border-slate-100 dark:border-slate-850 font-mono">/`{`productTypeSlug`}`/`{`groupSlug`}`/`{`termSlug-a,termSlug-b`}`</code>
                     <span className="text-[11px] text-slate-500">Ví dụ: <code className="text-slate-600 dark:text-slate-400 font-mono">/ruou-vang-sam-panh/giong-nho/pinot-noir,chardonnay</code></span>
                   </div>
                 </div>
               </div>

               {/* Block 3: Quy tắc điều hướng khi click (Routing) */}
               <div className="space-y-3">
                 <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                   <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                   Quy tắc điều hướng (Click Routing Rules)
                 </h4>
                 <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-950 text-xs">
                   <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                     <span className="font-bold text-slate-950 dark:text-slate-100 w-28 shrink-0">Bấm Product Type:</span>
                     <span>Về thẳng <code className="text-slate-600 dark:text-slate-400 font-mono">/`{`typeSlug`}`</code>. Tự động clear các filter khác (category, price, attributes, page).</span>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 border-b border-slate-100 dark:border-slate-850">
                     <span className="font-bold text-slate-950 dark:text-slate-100 w-28 shrink-0">Bấm Category:</span>
                     <span>Có Product Type: chuyển sang <code className="text-slate-600 dark:text-slate-400 font-mono">/`{`typeSlug`}`/`{`categorySlug`}`</code>. Không có Product Type: chuyển sang <code className="text-slate-600 dark:text-slate-400 font-mono">/products?category=`{`categorySlug`}`</code>. Các filter phụ giữ bằng query param.</span>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2.5 border-b border-slate-100 dark:border-slate-850">
                     <span className="font-bold text-slate-950 dark:text-slate-100 w-28 shrink-0">Bấm Attribute Term:</span>
                     <span>Có Product Type: chuyển sang <code className="text-slate-600 dark:text-slate-400 font-mono">/`{`typeSlug`}`/`{`groupSlug`}`/`{`termSlug`}`</code>. Nhấp thêm term cùng group sẽ ghép chuỗi comma (<code className="text-slate-600 dark:text-slate-400 font-mono">term-a,term-b</code>).</span>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 pt-2.5">
                     <span className="font-bold text-slate-950 dark:text-slate-100 w-28 shrink-0">Xóa Bộ Lọc:</span>
                     <span>Nếu xóa filter đang là <strong>Path chính</strong>, hệ thống đôn filter còn lại lên làm path chính theo thứ tự ưu tiên: <code className="text-slate-600 dark:text-slate-400 font-mono">Category &rarr; PriceRange &rarr; First Attribute Group &rarr; Type Root</code>. Xóa filter phụ chỉ xóa query param.</span>
                   </div>
                 </div>
               </div>

               {/* Block 4: Ma trận Case nguy hiểm & validate */}
               <div className="space-y-3">
                 <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                   Ma trận Validate & Xử lý lỗi (Crucial Safeguards)
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                   <div className="border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 bg-amber-500/5">
                     <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Group / Term chưa gán vào Type
                     </p>
                     <p className="text-slate-600 dark:text-slate-400 text-[11px]">Ẩn hoàn toàn khỏi bộ lọc trang Loại sản phẩm. Truy cập trực tiếp qua URL sẽ bị trả về <strong>404 Not Found</strong>.</p>
                   </div>

                   <div className="border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 bg-amber-500/5">
                     <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Trùng/Xung đột Slugs (Collision)
                     </p>
                     <p className="text-slate-600 dark:text-slate-400 text-[11px]">Chặn ở trang Admin. Không cho phép trùng danh mục slug, nấc giá slug, hoặc nhóm thuộc tính slug trong cùng một Loại sản phẩm.</p>
                   </div>

                   <div className="border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 bg-amber-500/5">
                     <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Comma list có term không hợp lệ
                     </p>
                     <p className="text-slate-600 dark:text-slate-400 text-[11px]">Khi truy cập <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-rose-500 font-mono font-semibold">/type/group/valid,invalid</code>, trả về <strong>404</strong> hoặc <strong>301 Redirect</strong> về URL sạch (không bỏ qua âm thầm).</p>
                   </div>

                   <div className="border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 bg-amber-500/5">
                     <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3.5 h-3.5" /> Lọc AND ở database
                     </p>
                     <p className="text-slate-600 dark:text-slate-400 text-[11px]">Mọi query listing và count sản phẩm phải thực hiện AND đầy đủ mọi điều kiện lọc, tránh lỗi chỉ lọc Category mà bỏ qua Type.</p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={() => setShowTaxonomyHelp(false)}
                 className="px-5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
               >
                 Đã rõ quy tắc
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
 }
 
 function AppearanceTab() {
   return (
     <Card className="p-8 text-center text-slate-500">
       <Palette size={48} className="mx-auto mb-4 opacity-50" />
       <p>Cấu hình giao diện sẽ hiển thị ở đây</p>
     </Card>
   );
 }
 
 function getColorClasses(color: string) {
   const colorMap: Record<string, {
     iconBg: string;
     iconText: string;
     button: string;
     toggle: string;
     tab: string;
     fieldColor: string;
   }> = {
     cyan: {
       iconBg: 'bg-cyan-500/10',
       iconText: 'text-cyan-600 dark:text-cyan-400',
       button: 'bg-cyan-600 hover:bg-cyan-500',
       toggle: 'bg-cyan-500',
       tab: 'border-cyan-500',
       fieldColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
     },
     orange: {
       iconBg: 'bg-orange-500/10',
       iconText: 'text-orange-600 dark:text-orange-400',
       button: 'bg-orange-600 hover:bg-orange-500',
       toggle: 'bg-orange-500',
       tab: 'border-orange-500',
       fieldColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
     },
     violet: {
       iconBg: 'bg-violet-500/10',
       iconText: 'text-violet-600 dark:text-violet-400',
       button: 'bg-violet-600 hover:bg-violet-500',
       toggle: 'bg-violet-500',
       tab: 'border-violet-500',
       fieldColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
     },
     emerald: {
       iconBg: 'bg-emerald-500/10',
       iconText: 'text-emerald-600 dark:text-emerald-400',
       button: 'bg-emerald-600 hover:bg-emerald-500',
       toggle: 'bg-emerald-500',
       tab: 'border-emerald-500',
       fieldColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
     },
     rose: {
       iconBg: 'bg-rose-500/10',
       iconText: 'text-rose-600 dark:text-rose-400',
       button: 'bg-rose-600 hover:bg-rose-500',
       toggle: 'bg-rose-500',
       tab: 'border-rose-500',
       fieldColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
     },
     blue: {
       iconBg: 'bg-blue-500/10',
       iconText: 'text-blue-600 dark:text-blue-400',
       button: 'bg-blue-600 hover:bg-blue-500',
       toggle: 'bg-blue-500',
       tab: 'border-blue-500',
       fieldColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
     },
     amber: {
       iconBg: 'bg-amber-500/10',
       iconText: 'text-amber-600 dark:text-amber-400',
       button: 'bg-amber-600 hover:bg-amber-500',
       toggle: 'bg-amber-500',
       tab: 'border-amber-500',
       fieldColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
     },
     indigo: {
       iconBg: 'bg-indigo-500/10',
       iconText: 'text-indigo-600 dark:text-indigo-400',
       button: 'bg-indigo-600 hover:bg-indigo-500',
       toggle: 'bg-indigo-500',
       tab: 'border-indigo-500',
       fieldColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
     },
   };
   
   return colorMap[color] ?? colorMap.blue;
 }

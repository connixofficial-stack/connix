'use client';

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useModuleConfig } from '@/lib/modules/hooks/useModuleConfig';
import { ordersModule } from '@/lib/modules/configs/orders.config';
import { ShopConfigAdminPanel } from './ShopConfigAdminPanel';

interface ShopConfigAdminContainerProps {
  onDirtyChange: (dirty: boolean) => void;
  onSavingChange: (saving: boolean) => void;
  registerSaveRef: (ref: { save: () => Promise<void> } | null) => void;
}

export function ShopConfigAdminContainer({
  onDirtyChange,
  onSavingChange,
  registerSaveRef,
}: ShopConfigAdminContainerProps) {
  const ordersModuleConfig = useModuleConfig(ordersModule);

  // Đồng bộ dirty state lên shell parent
  useEffect(() => {
    onDirtyChange(ordersModuleConfig.hasChanges);
  }, [ordersModuleConfig.hasChanges, onDirtyChange]);

  // Đồng bộ saving state lên shell parent
  useEffect(() => {
    onSavingChange(ordersModuleConfig.isSaving);
  }, [ordersModuleConfig.isSaving, onSavingChange]);

  // Đăng ký ref hàm save lên shell parent
  useEffect(() => {
    registerSaveRef({ save: ordersModuleConfig.handleSave });
    return () => {
      registerSaveRef(null);
    };
  }, [ordersModuleConfig.handleSave, registerSaveRef]);

  if (ordersModuleConfig.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-slate-500 animate-pulse">Đang tải cấu hình cửa hàng...</p>
      </div>
    );
  }

  const isReadOnly = ordersModuleConfig.moduleData?.enabled === false;

  return (
    <ShopConfigAdminPanel
      config={ordersModule}
      moduleData={ordersModuleConfig.moduleData}
      isReadOnly={isReadOnly}
      localFeatures={ordersModuleConfig.localFeatures}
      localFields={ordersModuleConfig.localFields}
      localSettings={ordersModuleConfig.localSettings}
      localCategoryFields={ordersModuleConfig.localCategoryFields}
      colorClasses={{
        iconBg: 'bg-emerald-500/10',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        button: 'bg-emerald-600 hover:bg-emerald-500',
        toggle: 'bg-emerald-500',
        tab: 'border-emerald-500',
        fieldColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      }}
      onToggleFeature={ordersModuleConfig.handleToggleFeature}
      onToggleField={ordersModuleConfig.handleToggleField}
      onToggleCategoryField={ordersModuleConfig.handleToggleCategoryField}
      onSettingChange={ordersModuleConfig.handleSettingChange}
    />
  );
}

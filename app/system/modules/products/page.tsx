'use client';

import { ModuleConfigPage, ConfigTab } from '@/components/modules/ModuleConfigPage';
import { productsModule } from '@/lib/modules/configs/products.config';
import { toast } from 'sonner';

export default function ProductsModuleConfigPage() {
  return (
    <ModuleConfigPage
      config={productsModule}
      renderConfigTab={(props) => {
        const handleSettingChangeCustom = (key: string, value: string | number | boolean) => {
          // 1. Khi bật enableCombos
          if (key === 'enableCombos' && value === true) {
            const saleMode = props.localSettings.saleMode;
            const variantEnabled = props.localSettings.variantEnabled;

            if (saleMode !== 'contact' || variantEnabled === true) {
              toast.error('Hệ thống Combo chỉ hoạt động ở Chế độ bán hàng liên hệ và khi tính năng phiên bản bị tắt.');
              return;
            }
          }

          // 2. Khi đổi saleMode sang chế độ khác ngoài 'contact' mà enableCombos đang bật
          if (key === 'saleMode' && value !== 'contact') {
            if (props.localSettings.enableCombos === true) {
              props.onSettingChange('enableCombos', false);
              toast.info('Đã tự động tắt hệ thống Combo do chế độ bán hàng không phù hợp.');
            }
          }

          // 3. Khi bật variantEnabled lên true mà enableCombos đang bật
          if (key === 'variantEnabled' && value === true) {
            if (props.localSettings.enableCombos === true) {
              props.onSettingChange('enableCombos', false);
              toast.info('Đã tự động tắt hệ thống Combo do tính năng phiên bản được kích hoạt.');
            }
          }

          props.onSettingChange(key, value);
        };

        return (
          <ConfigTab
            {...props}
            onSettingChange={handleSettingChangeCustom}
          />
        );
      }}
    />
  );
}

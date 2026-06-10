/**
 * Custom Seed Dialog Component
 * 
 * Allows users to customize seed configuration for multiple modules
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { 
  CheckCircle2,
  Database, 
  Info,
  Loader2,
} from 'lucide-react';
import {
  DEFAULT_VARIANT_PRESET_KEY,
  VARIANT_PRESET_LIST,
  getSuggestedVariantPresetKey,
} from '@/lib/modules/variant-presets';
import { SEED_CATEGORY_LABELS, type SeedCategory } from '@/lib/modules/seed-registry';
import { VariantPresetPicker } from './VariantPresetPicker';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
} from '@/app/admin/components/ui';

interface CustomSeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type SeedResultItem = { created: number; errors?: string[] };

type SeedModuleGroup = {
  category: SeedCategory;
  label: string;
  modules: Array<{ defaultQty: number; key: string; name: string }>;
};

export function CustomSeedDialog({
  open,
  onOpenChange,
  onComplete,
}: CustomSeedDialogProps) {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSeeding, setIsSeeding] = useState(false);
  const [force, setForce] = useState(false);
  const [variantPresetKey, setVariantPresetKey] = useState(DEFAULT_VARIANT_PRESET_KEY);

  const seedBulk = useMutation(api.seedManager.seedBulk);
  const seedableModules = useQuery(api.seedManager.listSeedableModules);
  const variantSetting = useQuery(api.admin.modules.getModuleSetting, {
    moduleKey: 'products',
    settingKey: 'variantEnabled',
  });
  const productOptions = useQuery(api.productOptions.listAll, { limit: 1 });
  const productCategories = useQuery(api.productCategories.listActive);

  const variantEnabled = variantSetting?.value === true;
  const hasProductOptions = (productOptions?.length ?? 0) > 0;
  const suggestedPresetKey = useMemo(
    () => getSuggestedVariantPresetKey((productCategories ?? []).map((category) => category.name)),
    [productCategories]
  );

  const moduleGroups = useMemo<SeedModuleGroup[]>(() => {
    if (!seedableModules) {
      return [];
    }

    const groups = new Map<SeedCategory, SeedModuleGroup>();
    seedableModules.forEach((module) => {
      const category = module.category as SeedCategory;
      const group = groups.get(category) ?? {
        category,
        label: SEED_CATEGORY_LABELS[category] ?? category,
        modules: [],
      };

      group.modules.push({
        defaultQty: module.defaultQuantity,
        key: module.key,
        name: module.name,
      });
      groups.set(category, group);
    });

    const order: SeedCategory[] = ['content', 'commerce', 'user', 'marketing', 'system'];
    return order
      .filter((category) => groups.has(category))
      .map((category) => groups.get(category))
      .filter((group): group is SeedModuleGroup => Boolean(group));
  }, [seedableModules]);

  // Initialize quantities when dialog opens
  React.useEffect(() => {
    if (open && Object.keys(quantities).length === 0 && moduleGroups.length > 0) {
      const initialQty: Record<string, number> = {};
      moduleGroups.forEach(group => {
        group.modules.forEach(module => {
          initialQty[module.key] = module.defaultQty;
        });
      });
      setQuantities(initialQty);
    }
  }, [open, quantities, moduleGroups]);

  React.useEffect(() => {
    if (open) {
      setVariantPresetKey(suggestedPresetKey || DEFAULT_VARIANT_PRESET_KEY);
    }
  }, [open, suggestedPresetKey]);

  const handleToggleModule = (moduleKey: string, checked: boolean) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(moduleKey);
      } else {
        newSet.delete(moduleKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = (group: SeedModuleGroup) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      group.modules.forEach(m => newSet.add(m.key));
      return newSet;
    });
  };

  const handleDeselectAll = (group: SeedModuleGroup) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      group.modules.forEach(m => newSet.delete(m.key));
      return newSet;
    });
  };

  const handleSeed = async () => {
    if (selectedModules.size === 0) {
      toast.error('Chọn ít nhất 1 module để seed');
      return;
    }

    setIsSeeding(true);
    
    try {
      const configs = Array.from(selectedModules).map(module => ({
        force,
        module,
        quantity: quantities[module] || 10,
        variantPresetKey: module === 'products' && variantEnabled ? variantPresetKey : undefined,
      }));

      const toastId = toast.loading(`Đang seed ${configs.length} modules...`);
      
      const results = await seedBulk({ configs }) as SeedResultItem[];
      
      const successCount = results.filter((result) => !result.errors || result.errors.length === 0).length;
      const totalCreated = results.reduce((sum, result) => sum + result.created, 0);
      
      toast.success(
        `✅ Seed hoàn tất!\n${successCount}/${configs.length} modules • ${totalCreated} records`,
        { id: toastId }
      );
      
      onComplete?.();
      onOpenChange(false);
      
      // Reset selections
      setSelectedModules(new Set());
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại');
    } finally {
      setIsSeeding(false);
    }
  };

  const totalModules = selectedModules.size;
  const totalRecords = Array.from(selectedModules).reduce(
    (sum, key) => sum + (quantities[key] || 0),
    0
  );
  const isProductsSelected = selectedModules.has('products');
  const showVariantPicker = variantEnabled && isProductsSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-500" />
            Custom Seed Configuration
          </DialogTitle>
          <DialogDescription>
            Chọn modules và cấu hình số lượng records cần seed
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {moduleGroups.map(group => (
              <div key={group.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    {group.label}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(group)}
                      className="h-7 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeselectAll(group)}
                      className="h-7 text-xs"
                    >
                      Deselect
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.modules.map(module => {
                    const isSelected = selectedModules.has(module.key);
                    return (
                      <div
                        key={module.key}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border transition-colors
                          ${isSelected 
                            ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleToggleModule(module.key, checked)
                          }
                          disabled={isSeeding}
                        />
                        
                        <Label 
                          htmlFor={module.key}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            {module.name}
                            {module.key === 'products' && variantEnabled && (
                              <Badge variant="secondary" className="text-[10px]">
                                +Variants
                              </Badge>
                            )}
                          </span>
                        </Label>
                        
                        <Input
                          type="number"
                          min={1}
                          max={10000}
                          value={quantities[module.key] || module.defaultQty}
                          onChange={(e) =>
                            setQuantities(prev => ({
                              ...prev,
                              [module.key]: parseInt(e.target.value) || 0,
                            }))
                          }
                          disabled={!isSelected || isSeeding}
                          className="w-24 text-center"
                        />
                      </div>
                    );
                  })}
                </div>

                {group.category === 'commerce' && showVariantPicker && (
                  <div className="mt-4 space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="space-y-1">
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Preset phiên bản sản phẩm
                      </h5>
                      <p className="text-xs text-slate-500">
                        Hệ thống sẽ tự seed options + variants theo preset đã chọn.
                      </p>
                    </div>
                    <VariantPresetPicker
                      presets={VARIANT_PRESET_LIST}
                      selectedKey={variantPresetKey}
                      suggestedKey={suggestedPresetKey}
                      onSelect={setVariantPresetKey}
                    />
                    {!hasProductOptions && (
                      <div className="flex gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
                        <Info className="w-4 h-4 mt-0.5" />
                        <span>Chưa có option phiên bản. Hệ thống sẽ tự tạo options và values theo preset.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Force option */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Checkbox
                checked={force}
                onCheckedChange={(checked) => setForce(checked)}
                disabled={isSeeding}
              />
              <div className="flex-1">
                <Label className="cursor-pointer font-medium text-amber-900 dark:text-amber-100">
                  Force Clear & Re-seed
                </Label>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Xóa data cũ trước khi seed mới
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong className="block mb-1">Auto-dependencies:</strong>
                <p>
                  Dependencies sẽ được seed tự động nếu chưa có data. 
                  Ví dụ: Khi seed Orders, hệ thống sẽ tự động seed Products và Customers nếu cần.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm">
              {totalModules > 0 && (
                <>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {totalModules} modules
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Database className="w-3 h-3" />
                    ~{totalRecords} records
                  </Badge>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSeeding}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSeed}
                disabled={isSeeding || totalModules === 0}
                className="gap-2"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang seed...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Seed {totalModules} modules
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

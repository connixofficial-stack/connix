'use client';

import React from 'react';
import { Badge, Checkbox } from '@/app/admin/components/ui';
import { EXTRA_FEATURE_OPTIONS } from '../wizard-presets';

type ExtraFeaturesStepProps = {
  enabledFeatures: Set<string>;
  baseHasPosts: boolean;
  baseHasProducts: boolean;
  baseHasServices: boolean;
  onToggle: (key: string, enabled: boolean) => void;
};

export function ExtraFeaturesStep({
  enabledFeatures,
  baseHasPosts,
  baseHasProducts,
  baseHasServices,
  onToggle,
}: ExtraFeaturesStepProps) {
  const hasPostsAvailable = baseHasPosts || enabledFeatures.has('posts');
  const hasServicesAvailable = baseHasServices || enabledFeatures.has('services');
  const options = EXTRA_FEATURE_OPTIONS.filter((option) => {
    if (option.key === 'posts') {
      return !baseHasPosts;
    }
    if (option.key === 'services') {
      return !baseHasServices;
    }
    if (option.requiredProducts && !baseHasProducts) {
      return false;
    }
    if (option.requiredServices && !hasServicesAvailable) {
      return false;
    }
    if (option.key === 'comments') {
      return baseHasProducts || hasPostsAvailable;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ngoài ra muốn bật thêm gì?</h3>
        <p className="text-xs text-slate-500">Tick các tính năng phụ trợ cần seed.</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const checked = enabledFeatures.has(option.key);
          return (
            <label
              key={option.key}
              className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3 cursor-pointer"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => onToggle(option.key, value === true)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{option.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {option.modules.join(', ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{option.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

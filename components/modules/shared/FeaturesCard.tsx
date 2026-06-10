'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ToggleSwitch } from './toggle-switch';
import type { FeatureConfig } from '@/types/module-config';

interface FeaturesCardProps {
  features: {
    config: FeatureConfig;
    enabled: boolean;
  }[];
  onToggle: (key: string) => void;
  title?: string;
  toggleColor?: string;
}

export const FeaturesCard: React.FC<FeaturesCardProps> = ({ 
  features, 
  onToggle,
  title = 'Tính năng',
  toggleColor = 'bg-cyan-500'
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
      <Layers size={14} className="text-slate-500" /> {title}
    </h3>
    
    <div className="space-y-2">
      {features.map(({ config, enabled }) => {
        const Icon = config.icon;
        return (
          <div key={config.key} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icon size={14} className="text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-700 dark:text-slate-200 block truncate-none break-words">{config.label}</span>
                {config.description && (
                  <span className="text-[10px] text-slate-400 block break-words mt-0.5">{config.description}</span>
                )}
              </div>
            </div>
            <ToggleSwitch 
              enabled={enabled} 
              onChange={() => { onToggle(config.key); }}
              color={toggleColor}
            />
          </div>

        );
      })}
    </div>
  </div>
);

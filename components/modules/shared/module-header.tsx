'use client';

import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface ModuleHeaderProps {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  iconBgClass: string;
  iconTextClass: string;
  buttonClass: string;
  onSave?: () => void;
  hasChanges?: boolean;
  isSaving?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  };
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  icon: Icon,
  title,
  description,
  iconBgClass,
  iconTextClass,
  buttonClass,
  onSave,
  hasChanges = false,
  isSaving = false,
  secondaryAction,
}) => {
  const router = useRouter();
  let buttonStateClass = 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed';
  let buttonIcon = <Save size={16} />;
  let buttonLabel = 'Lưu thay đổi';

  if (hasChanges) {
    buttonStateClass = `${buttonClass} text-white`;
  }

  if (isSaving) {
    buttonIcon = <Loader2 size={16} className="animate-spin" />;
    buttonLabel = 'Đang lưu...';
  }
  
  const secondaryLabel = secondaryAction?.isLoading ? 'Đang đồng bộ...' : secondaryAction?.label;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() =>{  router.push('/system/modules'); }}
          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${iconBgClass} ${iconTextClass} flex items-center justify-center`}>
            <Icon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled || secondaryAction.isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:border-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {secondaryAction.isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {secondaryLabel}
          </button>
        )}
        <button 
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${buttonStateClass}`}
        >
          {buttonIcon}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

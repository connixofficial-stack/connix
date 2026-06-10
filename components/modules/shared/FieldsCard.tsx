import React from 'react';
import type { FieldConfig } from '@/types/module-config';
import { FieldRow } from './FieldRow';
import { HelpCircle } from 'lucide-react';

interface FieldsCardProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColorClass: string;
  fields: FieldConfig[];
  onToggle: (fieldKey: string) => void;
  fieldColorClass?: string;
  toggleColor?: string;
  tooltip?: string;
}

export const FieldsCard: React.FC<FieldsCardProps> = ({
  title,
  icon: Icon,
  iconColorClass,
  fields,
  onToggle,
  fieldColorClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  toggleColor = 'bg-cyan-500',
  tooltip,
}) => {
  const requiredFields = fields.filter(f => f.required);
  const optionalFields = fields.filter(f => !f.required);
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColorClass} /> 
          <span>{title}</span>
        </div>
        {tooltip && (
          <div className="relative group/tooltip cursor-help flex items-center">
            <HelpCircle size={14} className="text-slate-400 hover:text-slate-600 transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-2.5 bg-slate-900 dark:bg-slate-850 text-white text-[11px] leading-relaxed font-normal rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
              {tooltip}
              <div className="absolute top-full right-1.5 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-850" />
            </div>
          </div>
        )}
      </h3>
      
      <div className="space-y-3">
        {requiredFields.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Bắt buộc</span>
            {requiredFields.map(field => (
              <FieldRow 
                key={field.id} 
                field={field} 
                onToggle={onToggle} 
                colorClass={fieldColorClass}
                toggleColor={toggleColor}
              />
            ))}
          </div>
        )}
        
        {optionalFields.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Tùy chọn</span>
            {optionalFields.map(field => (
              <FieldRow 
                key={field.id} 
                field={field} 
                onToggle={onToggle}
                colorClass={fieldColorClass}
                toggleColor={toggleColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

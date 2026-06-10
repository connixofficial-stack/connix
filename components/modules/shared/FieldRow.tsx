'use client';

import React from 'react';
import { 
  Calendar, Clock, Code, DollarSign, Edit3, FileText, FolderTree, 
  Hash, Image, Key, Layers, Mail, Palette, Phone, Tag, ToggleLeft
} from 'lucide-react';
import type { FieldConfig, FieldType } from '@/types/module-config';
import { ToggleSwitch } from './toggle-switch';

const fieldTypeIcons: Record<FieldType, React.ComponentType<{ size?: number }>> = {
  boolean: ToggleLeft,
  color: Palette,
  date: Clock,
  daterange: Calendar,
  email: Mail,
  gallery: Layers,
  image: Image,
  json: Code,
  number: Hash,
  password: Key,
  phone: Phone,
  price: DollarSign,
  richtext: Edit3,
  select: FolderTree,
  tags: Tag,
  text: Hash,
  textarea: FileText,
};

interface FieldRowProps {
  field: FieldConfig;
  onToggle: (fieldKey: string) => void;
  colorClass?: string;
  toggleColor?: string;
}

export const FieldRow: React.FC<FieldRowProps> = ({ 
  field, 
  onToggle, 
  colorClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  toggleColor = 'bg-cyan-500'
}) => {
  const TypeIcon = fieldTypeIcons[field.type] || FileText;
  
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
      field.enabled 
        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' 
        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50'
    }`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded flex items-center justify-center ${
          field.enabled ? colorClass : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }`}>
          <TypeIcon size={14} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{field.name}</span>
            {field.required && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-rose-500/10 text-rose-500">BẮT BUỘC</span>
            )}
            {field.linkedFeature && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/10 text-blue-500">LINKED</span>
            )}
          </div>
          <code className="text-[10px] text-slate-400 font-mono">{field.key}</code>
        </div>
      </div>
      
      <ToggleSwitch 
        enabled={field.enabled} 
        onChange={() =>{  onToggle(field.key); }}
        disabled={field.isSystem && field.required}
        color={toggleColor}
      />
    </div>
  );
};

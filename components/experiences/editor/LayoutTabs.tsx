 import React from 'react';
import { cn } from '@/app/admin/components/ui';
 import type { LucideIcon } from 'lucide-react';
 
 export type LayoutOption<T extends string = string> = {
   id: T;
   label: string;
   description?: string;
   icon?: LucideIcon;
 };
 
 type LayoutTabsProps<T extends string> = {
   layouts: LayoutOption<T>[];
   activeLayout: T;
   onChange: (layout: T) => void;
   accentColor?: string;
   className?: string;
 };
 
 export function LayoutTabs<T extends string>({ 
   layouts, 
   activeLayout, 
   onChange,
   accentColor = '#3b82f6',
   className
 }: LayoutTabsProps<T>) {
   return (
     <div className={cn("flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5", className)}>
       {layouts.map(layout => (
         <button
           key={layout.id}
           onClick={() => onChange(layout.id)}
           title={layout.description}
           className={cn(
             "px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5",
             activeLayout === layout.id 
               ? "text-white shadow-sm"
               : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
           )}
           style={activeLayout === layout.id ? { backgroundColor: accentColor } : undefined}
         >
           {layout.icon && <layout.icon size={14} />}
           {layout.label}
         </button>
       ))}
     </div>
   );
 }

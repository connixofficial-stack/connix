 import React from 'react';
 import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
 
 type ConfigPanelProps = {
   isExpanded: boolean;
   onToggle: () => void;
   children: React.ReactNode;
   leftContent?: React.ReactNode;
   expandedHeight?: string;
 };
 
 export function ConfigPanel({ 
   isExpanded, 
   onToggle, 
   children,
   leftContent,
   expandedHeight = '220px'
 }: ConfigPanelProps) {
   const tabsBarHeight = 40;
   const contentHeight = `calc(${expandedHeight} - ${tabsBarHeight}px)`;
   
   return (
     <div 
       className={cn(
         "flex-shrink-0 border-t bg-white dark:bg-slate-900 transition-all duration-200",
       )}
       style={{ height: isExpanded ? expandedHeight : `${tabsBarHeight}px` }}
     >
       <div className="flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-700" style={{ height: tabsBarHeight }}>
         <div className="flex-1">
           {leftContent}
         </div>
         <button 
           onClick={onToggle}
           className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
           title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
         >
           {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
         </button>
       </div>
       
       {isExpanded && (
         <div 
           className="p-3 overflow-auto"
           style={{ height: contentHeight }}
         >
           {children}
         </div>
       )}
     </div>
   );
 }

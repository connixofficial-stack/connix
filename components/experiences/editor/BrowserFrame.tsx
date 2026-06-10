 import React from 'react';
 
 type BrowserFrameProps = {
   children: React.ReactNode;
   url?: string;
   maxHeight?: string;
 };
 
 export function BrowserFrame({ 
   children, 
   url = 'yoursite.com/page',
   maxHeight = '520px'
 }: BrowserFrameProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
       {/* Compact browser chrome - 28px */}
      <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-2 border-b">
         <div className="flex gap-1">
           <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
           <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
           <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
         </div>
         <div className="flex-1 ml-2">
          <div className="bg-white rounded px-2 py-0.5 text-[10px] text-slate-400 max-w-xs truncate">
             {url}
           </div>
         </div>
       </div>
       <div className="overflow-y-auto" style={{ maxHeight }}>
         {children}
       </div>
     </div>
   );
 }

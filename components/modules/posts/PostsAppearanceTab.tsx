 'use client';
 
import React, { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
 import { api } from '@/convex/_generated/api';
 import { toast } from 'sonner';
 import { ArrowLeft, Eye, FileText, Monitor, Smartphone, Tablet } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle, cn } from '@/app/admin/components/ui';
import { useBrandColor } from '@/components/site/hooks';
 
 type PostsListStyle = 'fullwidth' | 'sidebar' | 'magazine';
 type PostsDetailStyle = 'classic' | 'modern' | 'minimal';
 type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
 
 const LIST_STYLES: { id: PostsListStyle; label: string; description: string }[] = [
   { description: 'Horizontal filter bar + grid/list toggle, tối ưu mobile', id: 'fullwidth', label: 'Full Width' },
   { description: 'Classic blog với sidebar filters, categories, recent posts', id: 'sidebar', label: 'Sidebar' },
   { description: 'Hero slider + category tabs, phong cách editorial', id: 'magazine', label: 'Magazine' },
 ];
 
 const DETAIL_STYLES: { id: PostsDetailStyle; label: string; description: string }[] = [
   { description: 'Truyền thống với sidebar bài liên quan', id: 'classic', label: 'Classic' },
   { description: 'Hero lớn, full-width, hiện đại', id: 'modern', label: 'Modern' },
   { description: 'Tối giản, tập trung vào nội dung', id: 'minimal', label: 'Minimal' },
 ];
 
 const deviceWidths = {
   desktop: 'w-full',
   mobile: 'w-[375px] max-w-full',
   tablet: 'w-[768px] max-w-full'
 };
 
 const devices = [
   { icon: Monitor, id: 'desktop' as const, label: 'Desktop' },
   { icon: Tablet, id: 'tablet' as const, label: 'Tablet' },
   { icon: Smartphone, id: 'mobile' as const, label: 'Mobile' }
 ];
 
 interface PostsAppearanceTabProps {
  colorClasses?: { button: string };
   onHasChanges?: (hasChanges: boolean) => void;
   onSaveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
 }
 
export function PostsAppearanceTab({ onHasChanges, onSaveRef }: PostsAppearanceTabProps) {
   const listConfigSetting = useQuery(api.settings.getByKey, { key: 'posts_list_ui' });
   const detailConfigSetting = useQuery(api.settings.getByKey, { key: 'posts_detail_ui' });
   const brandColor = useBrandColor();
   const setMultipleSettings = useMutation(api.settings.setMultiple);
   
   const [listStyle, setListStyle] = useState<PostsListStyle | null>(null);
   const [detailStyle, setDetailStyle] = useState<PostsDetailStyle | null>(null);
   const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
   const [activePreview, setActivePreview] = useState<'list' | 'detail'>('list');
   const [hasChanges, setHasChanges] = useState(false);
   
   const listConfig = (listConfigSetting?.value && typeof listConfigSetting.value === 'object') ? listConfigSetting.value as Record<string, unknown> : {};
   const detailConfig = (detailConfigSetting?.value && typeof detailConfigSetting.value === 'object') ? detailConfigSetting.value as Record<string, unknown> : {};
   const resolvedListStyle = listStyle ?? (listConfig.layoutStyle as PostsListStyle | undefined) ?? 'fullwidth';
   const resolvedDetailStyle = detailStyle ?? (detailConfig.layoutStyle as PostsDetailStyle | undefined) ?? 'classic';
   
   useEffect(() => {
     onHasChanges?.(hasChanges);
   }, [hasChanges, onHasChanges]);
   
   const handleSave = useCallback(async () => {
     await setMultipleSettings({
       settings: [
         { group: 'experience', key: 'posts_list_ui', value: { ...listConfig, layoutStyle: resolvedListStyle } },
         { group: 'experience', key: 'posts_detail_ui', value: { ...detailConfig, layoutStyle: resolvedDetailStyle } },
       ]
     });
     setHasChanges(false);
     toast.success('Đã lưu cài đặt giao diện!');
   }, [detailConfig, listConfig, resolvedDetailStyle, resolvedListStyle, setMultipleSettings]);
   
   useEffect(() => {
     if (onSaveRef) onSaveRef.current = handleSave;
   }, [handleSave, onSaveRef]);
   
   const handleListStyleChange = (style: PostsListStyle) => {
     setListStyle(style);
     setHasChanges(true);
   };
   
   const handleDetailStyleChange = (style: PostsDetailStyle) => {
     setDetailStyle(style);
     setHasChanges(true);
   };
   
   return (
     <div className="space-y-6">
       <div className="grid md:grid-cols-2 gap-4">
         <Card className="p-4">
           <div className="flex items-center justify-between gap-4">
             <div className="flex-shrink-0">
               <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Trang danh sách</h3>
               <p className="text-xs text-slate-500">/posts</p>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
               {LIST_STYLES.map((style) => (
                 <button
                   key={style.id}
                   onClick={() => { handleListStyleChange(style.id); setActivePreview('list'); }}
                   title={style.description}
                   className={cn(
                     "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                     resolvedListStyle === style.id 
                       ? "bg-cyan-500 text-white shadow-sm" 
                       : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                   )}
                 >
                   {style.label}
                 </button>
               ))}
             </div>
           </div>
         </Card>
 
         <Card className="p-4">
           <div className="flex items-center justify-between gap-4">
             <div className="flex-shrink-0">
               <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100">Trang chi tiết</h3>
               <p className="text-xs text-slate-500">/posts/[slug]</p>
             </div>
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
               {DETAIL_STYLES.map((style) => (
                 <button
                   key={style.id}
                   onClick={() => { handleDetailStyleChange(style.id); setActivePreview('detail'); }}
                   title={style.description}
                   className={cn(
                     "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                     resolvedDetailStyle === style.id 
                       ? "bg-cyan-500 text-white shadow-sm" 
                       : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                   )}
                 >
                   {style.label}
                 </button>
               ))}
             </div>
           </div>
         </Card>
       </div>
 
       <Card>
         <CardHeader className="pb-3">
           <div className="flex items-center justify-between flex-wrap gap-3">
             <CardTitle className="text-base flex items-center gap-2">
               <Eye size={18} /> Preview
             </CardTitle>
             <div className="flex items-center gap-4">
               <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                 <button
                   onClick={() => setActivePreview('list')}
                   className={cn(
                     "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                     activePreview === 'list' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"
                   )}
                 >
                   Danh sách
                 </button>
                 <button
                   onClick={() => setActivePreview('detail')}
                   className={cn(
                     "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                     activePreview === 'detail' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"
                   )}
                 >
                   Chi tiết
                 </button>
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                 {devices.map((d) => (
                   <button
                     key={d.id}
                     onClick={() => setPreviewDevice(d.id)}
                     title={d.label}
                     className={cn(
                       "p-1.5 rounded-md transition-all",
                       previewDevice === d.id ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                     )}
                   >
                     <d.icon size={16} />
                   </button>
                 ))}
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className={cn("mx-auto transition-all duration-300", deviceWidths[previewDevice])}>
             <BrowserFrame>
               {activePreview === 'list' 
                ? <ListPreview style={resolvedListStyle} brandColor={brandColor} device={previewDevice} />
                : <DetailPreview style={resolvedDetailStyle} brandColor={brandColor} device={previewDevice} />
               }
             </BrowserFrame>
           </div>
           <div className="mt-3 text-xs text-slate-500 text-center">
             {activePreview === 'list' ? 'Trang /posts' : 'Trang /posts/[slug]'}
            {' • '}Style: <strong>{activePreview === 'list' ? LIST_STYLES.find(s => s.id === resolvedListStyle)?.label : DETAIL_STYLES.find(s => s.id === resolvedDetailStyle)?.label}</strong>
             {' • '}{previewDevice === 'desktop' ? '1920px' : (previewDevice === 'tablet' ? '768px' : '375px')}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }
 
 function BrowserFrame({ children }: { children: React.ReactNode }) {
   return (
     <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg">
       <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex items-center gap-2 border-b">
         <div className="flex gap-1.5">
           <div className="w-3 h-3 rounded-full bg-red-400"></div>
           <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
           <div className="w-3 h-3 rounded-full bg-green-400"></div>
         </div>
         <div className="flex-1 ml-4">
           <div className="bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 max-w-xs">yoursite.com/posts</div>
         </div>
       </div>
       <div className="max-h-[500px] overflow-y-auto">
         {children}
       </div>
     </div>
   );
 }
 
 function ListPreview({ style, brandColor, device }: { style: PostsListStyle; brandColor: string; device: PreviewDevice }) {
   const mockPosts = [
     { category: 'Tin tức', date: '10/01/2026', id: 1, title: 'Bài viết nổi bật số 1', views: 1234 },
     { category: 'Hướng dẫn', date: '09/01/2026', id: 2, title: 'Hướng dẫn sử dụng sản phẩm', views: 567 },
     { category: 'Tin tức', date: '08/01/2026', id: 3, title: 'Cập nhật tính năng mới', views: 890 },
     { category: 'Tips', date: '07/01/2026', id: 4, title: 'Tips và tricks hữu ích', views: 432 },
   ];
   const categories = ['Tất cả', 'Tin tức', 'Hướng dẫn', 'Tips'];
 
   if (style === 'fullwidth') {
     return (
       <div className={cn("p-4", device === 'mobile' ? 'p-3' : '')}>
         <h2 className={cn("font-bold text-center mb-4", device === 'mobile' ? 'text-lg' : 'text-xl')}>Tin tức & Bài viết</h2>
         <div className="bg-white border rounded-lg p-3 mb-4">
           <div className={cn("flex gap-2 items-center", device === 'mobile' ? 'flex-col' : '')}>
             <div className="flex-1 relative">
               <input type="text" placeholder="Tìm kiếm..." className="w-full px-3 py-1.5 border rounded-lg text-xs bg-slate-50" />
             </div>
             <div className="flex gap-1 flex-wrap">
               {categories.slice(0, device === 'mobile' ? 3 : 4).map((cat, i) => (
                 <span 
                   key={cat} 
                   className={cn("px-2 py-1 rounded-full text-xs cursor-pointer", i === 0 ? "text-white" : "bg-slate-100")}
                   style={i === 0 ? { backgroundColor: brandColor } : undefined}
                 >
                   {cat}
                 </span>
               ))}
             </div>
           </div>
         </div>
         <div className="text-xs text-slate-500 mb-3">4 bài viết</div>
         <div className={cn("grid gap-3", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-2')}>
           {mockPosts.slice(0, device === 'mobile' ? 2 : 4).map((post) => (
             <div key={post.id} className="bg-white border rounded-lg overflow-hidden">
               <div className="aspect-video bg-slate-100 flex items-center justify-center">
                 <FileText size={24} className="text-slate-300" />
               </div>
               <div className="p-3">
                 <span className="text-xs font-medium" style={{ color: brandColor }}>{post.category}</span>
                 <h3 className="font-medium text-sm mt-1 line-clamp-2">{post.title}</h3>
                 <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                   <span>{post.date}</span>
                   <span>{post.views} views</span>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
     );
   }
 
   if (style === 'sidebar') {
     return (
       <div className={cn("p-4 flex gap-4", device === 'mobile' ? 'p-3 flex-col' : '')}>
         <div className={cn("space-y-3", device === 'mobile' ? 'order-2' : 'w-1/3')}>
           <div className="bg-slate-50 rounded-lg p-3">
             <h4 className="font-medium text-xs mb-2">Tìm kiếm</h4>
             <input type="text" placeholder="Nhập từ khóa..." className="w-full px-2 py-1.5 border rounded text-xs" />
           </div>
           <div className="bg-slate-50 rounded-lg p-3">
             <h4 className="font-medium text-xs mb-2">Danh mục</h4>
             <div className="space-y-1">
               {categories.map((cat, i) => (
                 <div 
                   key={cat} 
                   className={cn("px-2 py-1 rounded text-xs cursor-pointer", i === 0 ? "" : "text-slate-600")}
                   style={i === 0 ? { backgroundColor: `${brandColor}15`, color: brandColor } : undefined}
                 >
                   {cat}
                 </div>
               ))}
             </div>
           </div>
         </div>
         <div className={cn("flex-1 space-y-3", device === 'mobile' ? 'order-1' : '')}>
           {mockPosts.slice(0, 3).map((post) => (
             <div key={post.id} className="bg-white border rounded-lg overflow-hidden flex">
               <div className="w-24 h-16 bg-slate-100 flex items-center justify-center flex-shrink-0">
                 <FileText size={16} className="text-slate-300" />
               </div>
               <div className="p-2 flex-1">
                 <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>{post.category}</span>
                 <h3 className="font-medium text-xs mt-1 line-clamp-1">{post.title}</h3>
                 <span className="text-xs text-slate-400">{post.date}</span>
               </div>
             </div>
           ))}
         </div>
       </div>
     );
   }
 
   return (
     <div className={cn("p-4 space-y-4", device === 'mobile' ? 'p-3' : '')}>
       <div className={cn("grid gap-3", device === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')}>
         <div className={cn("relative rounded-xl overflow-hidden bg-slate-900", device === 'mobile' ? '' : 'col-span-2 row-span-2')}>
           <div className={cn("bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center", device === 'mobile' ? 'aspect-video' : 'h-full min-h-[180px]')}>
             <FileText size={32} className="text-slate-600" />
           </div>
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
           <div className="absolute bottom-0 left-0 right-0 p-3">
             <div className="flex items-center gap-2 mb-2">
               <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: brandColor }}>Nổi bật</span>
               <span className="text-xs text-white/60">5 phút đọc</span>
             </div>
             <h3 className="font-bold text-sm text-white">{mockPosts[0].title}</h3>
           </div>
         </div>
         {device !== 'mobile' && mockPosts.slice(1, 3).map((post) => (
           <div key={post.id} className="relative rounded-lg overflow-hidden bg-slate-800">
             <div className="aspect-[16/10] bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
               <FileText size={16} className="text-slate-500" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
             <div className="absolute bottom-0 left-0 right-0 p-2">
               <span className="text-xs text-white/80 font-medium">{post.category}</span>
               <h4 className="font-semibold text-xs text-white line-clamp-2">{post.title}</h4>
             </div>
           </div>
         ))}
       </div>
       <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
         {categories.map((cat, i) => (
           <span 
             key={cat} 
             className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap", i === 0 ? "text-white" : "text-slate-600 hover:bg-slate-100")}
             style={i === 0 ? { backgroundColor: brandColor } : undefined}
           >
             {cat}
           </span>
         ))}
       </div>
     </div>
   );
 }
 
 function DetailPreview({ style, brandColor, device }: { style: PostsDetailStyle; brandColor: string; device: PreviewDevice }) {
   if (style === 'classic') {
     return (
       <div className={cn("p-4", device === 'mobile' ? 'p-3' : '')}>
         <div className="text-xs text-slate-400 mb-3">Trang chủ › Bài viết › Chi tiết</div>
         <div className={cn("flex gap-4", device === 'mobile' ? 'flex-col' : '')}>
           <div className="flex-1">
             <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>Tin tức</span>
             <h1 className="font-bold text-lg mt-2 mb-3">Tiêu đề bài viết mẫu</h1>
             <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
               <FileText size={32} className="text-slate-300" />
             </div>
             <div className="space-y-2">
               <div className="h-3 bg-slate-100 rounded w-full"></div>
               <div className="h-3 bg-slate-100 rounded w-5/6"></div>
               <div className="h-3 bg-slate-100 rounded w-4/6"></div>
             </div>
           </div>
           {device !== 'mobile' && (
             <div className="w-1/3">
               <div className="bg-slate-50 rounded-lg p-3">
                 <h4 className="font-medium text-sm mb-2">Bài liên quan</h4>
                 <div className="space-y-2">
                   {[1, 2].map((i) => (
                     <div key={i} className="flex gap-2">
                       <div className="w-12 h-10 bg-slate-200 rounded"></div>
                       <div className="flex-1">
                         <div className="h-2 bg-slate-200 rounded w-full mb-1"></div>
                         <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}
         </div>
       </div>
     );
   }
 
   if (style === 'modern') {
     return (
       <div className="bg-white">
         <div className={cn("border-b border-slate-100", device === 'mobile' ? 'p-3' : 'p-4')}>
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-1 text-xs text-slate-400">
               <ArrowLeft size={10} />
               <span>Tất cả bài viết</span>
             </div>
             <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: brandColor }}>Tin tức</span>
           </div>
           <h1 className={cn("font-bold text-slate-900 leading-tight", device === 'mobile' ? 'text-base' : 'text-lg')}>
             Tiêu đề bài viết mẫu với typography tối ưu
           </h1>
           <p className="text-xs text-slate-500 mt-2 italic">Đoạn mô tả ngắn về nội dung bài viết...</p>
           <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
             <span>10/01/2026</span>
             <span className="w-1 h-1 rounded-full bg-slate-300" />
             <span>5 phút đọc</span>
           </div>
         </div>
         <div className="p-4">
           <div className="aspect-[16/9] bg-slate-100 rounded-lg flex items-center justify-center">
             <FileText size={24} className="text-slate-300" />
           </div>
         </div>
         <div className={cn("space-y-3", device === 'mobile' ? 'px-3 pb-3' : 'px-4 pb-4')}>
           <div className="h-3 bg-slate-100 rounded w-full"></div>
           <div className="h-3 bg-slate-100 rounded w-5/6"></div>
         </div>
       </div>
     );
   }
 
   return (
     <div className={cn("p-6", device === 'mobile' ? 'p-4' : '')}>
       <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
         <ArrowLeft size={12} /> Tất cả bài viết
       </div>
       <div className="text-center mb-4">
         <span className="text-xs font-medium uppercase tracking-wider" style={{ color: brandColor }}>Tin tức</span>
         <h1 className="font-bold text-lg mt-2">Tiêu đề bài viết mẫu</h1>
         <div className="text-xs text-slate-400 mt-1">10/01/2026 · 5 phút đọc</div>
       </div>
       <div className="aspect-[2/1] bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
         <FileText size={32} className="text-slate-300" />
       </div>
       <div className="space-y-2">
         <div className="h-3 bg-slate-100 rounded w-full"></div>
         <div className="h-3 bg-slate-100 rounded w-5/6"></div>
       </div>
     </div>
   );
 }

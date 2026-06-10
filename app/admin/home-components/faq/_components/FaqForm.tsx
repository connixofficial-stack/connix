'use client';
 
import React, { useState } from 'react';
import { GripVertical, HelpCircle, Plus, Trash2, Layout } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { AiDemoFaqImport } from '../../product-list/_components/AiDemoProductsImport';
import type { FaqConfig, FaqItem, FaqStyle } from '../_types';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
 
export const FaqForm = ({
  faqItems,
  setFaqItems,
  faqStyle,
  brandColor,
  faqConfig,
  setFaqConfig,
  expanded = true,
  onExpandedChange,
}: {
  faqItems: FaqItem[];
  setFaqItems: (items: FaqItem[]) => void;
  faqStyle: FaqStyle;
  brandColor: string;
  faqConfig: FaqConfig;
  setFaqConfig: (config: FaqConfig) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) => {
  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | null>(null);
 
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['faqItems', 'layoutConfig'],
    expanded
  );
 
  // Đồng bộ trạng thái mở rộng của phần câu hỏi thường gặp ngược lên component cha
  React.useEffect(() => {
    onExpandedChange?.(openSections.faqItems);
  }, [openSections.faqItems, onExpandedChange]);
 
  const handleAddFaq = () =>{
    setFaqItems([...faqItems, { answer: '', id: Date.now(), question: '' }]);
  };
  const handleRemoveFaq = (id: number | string) => faqItems.length > 1 && setFaqItems(faqItems.filter(f => f.id !== id));
 
  const dragProps = (id: number | string) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) {setDragOverId(id);} },
    onDragStart: () =>{  setDraggedId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) {return;}
      const newItems = [...faqItems];
      const draggedIdx = newItems.findIndex(i => i.id === draggedId);
      const targetIdx = newItems.findIndex(i => i.id === id);
      const [moved] = newItems.splice(draggedIdx, 1);
      newItems.splice(targetIdx, 0, moved);
      setFaqItems(newItems);
      setDraggedId(null);
      setDragOverId(null);
    }
  });
 
  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
 
      <div className="mb-6">
        <SubSection
          icon={HelpCircle}
          title="Câu hỏi thường gặp"
          open={openSections.faqItems}
          onOpenChange={(open) => toggleSection('faqItems', open)}
          actions={(
            <>
              <AiDemoFaqImport onApply={(items) => setFaqItems(items as FaqItem[])} />
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
                <Plus size={14} /> Thêm
              </Button>
            </>
          )}
        >
          <div className="space-y-3">
          {faqItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${brandColor}10` }}>
                <HelpCircle size={24} style={{ color: brandColor }} />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Chưa có câu hỏi nào</h3>
              <p className="text-sm text-slate-500 mb-4">Thêm câu hỏi đầu tiên để bắt đầu</p>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
                <Plus size={14} /> Thêm câu hỏi
              </Button>
            </div>
          ) : (
            faqItems.map((item, idx) => (
              <div 
                key={item.id} 
                {...dragProps(item.id)}
                className={cn(
                  "p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3 transition-all",
                  draggedId === item.id && "opacity-50",
                  dragOverId === item.id && "ring-2 ring-blue-500"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="cursor-grab text-slate-400 hover:text-slate-600 flex-shrink-0" />
                    <Label className="text-sm font-medium">Câu hỏi {idx + 1}</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" 
                    onClick={() => handleRemoveFaq(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input 
                  placeholder="Nhập câu hỏi..." 
                  value={item.question} 
                  onChange={(e) =>{  setFaqItems(faqItems.map(f => f.id === item.id ? {...f, question: e.target.value} : f)); }} 
                />
                <textarea 
                  placeholder="Nhập câu trả lời..." 
                  value={item.answer} 
                  onChange={(e) =>{  setFaqItems(faqItems.map(f => f.id === item.id ? {...f, answer: e.target.value} : f)); }}
                  className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            ))
          )}
          </div>
        </SubSection>
      </div>
 
      {faqStyle === 'two-column' && (
        <SubSection
          icon={Layout}
          title="Cấu hình layout Showcase"
          open={openSections.layoutConfig}
          onOpenChange={(open) => toggleSection('layoutConfig', open)}
          className="mb-6"
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Mô tả ngắn</Label>
              <Input 
                placeholder="Tìm câu trả lời cho các thắc mắc phổ biến của bạn" 
                value={faqConfig.description ?? ''} 
                onChange={(e) =>{  setFaqConfig({...faqConfig, description: e.target.value}); }} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Nút CTA - Text</Label>
                <Input 
                  placeholder="Liên hệ hỗ trợ" 
                  value={faqConfig.buttonText ?? ''} 
                  onChange={(e) =>{  setFaqConfig({...faqConfig, buttonText: e.target.value}); }} 
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Nút CTA - Link</Label>
                <Input 
                  placeholder="/lien-he" 
                  value={faqConfig.buttonLink ?? ''} 
                  onChange={(e) =>{  setFaqConfig({...faqConfig, buttonLink: e.target.value}); }} 
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Để trống nút CTA nếu không muốn hiển thị</p>
          </div>
        </SubSection>
      )}
    </>
  );
};

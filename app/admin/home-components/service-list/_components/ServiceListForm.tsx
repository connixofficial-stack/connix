'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Briefcase, Check, GripVertical, Plus, Search, X } from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import type { DemoServiceItem, ServiceSelectionMode } from '../_types';
import { AiDemoServicesImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { DemoItemRowShell } from '../../_shared/components/DemoItemRowShell';
import { DemoPrimaryFields } from '../../_shared/components/DemoPrimaryFields';


export const DEFAULT_DEMO_SERVICES: DemoServiceItem[] = [
  { id: 'ds-1', name: 'Thiết kế website chuyên nghiệp', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop', price: '5.000.000đ', description: 'Thiết kế web responsive, chuẩn SEO, giao diện hiện đại', tag: 'hot' },
  { id: 'ds-2', name: 'Chạy quảng cáo Google Ads', image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=500&fit=crop', price: '3.000.000đ', description: 'Quản lý chiến dịch quảng cáo, tối ưu CPC hiệu quả', tag: 'new' },
  { id: 'ds-3', name: 'SEO tổng thể', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop', price: '8.000.000đ', description: 'Tối ưu on-page, off-page và technical SEO toàn diện', tag: '' },
  { id: 'ds-4', name: 'Quản trị mạng xã hội', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=500&fit=crop', price: '4.000.000đ', description: 'Quản lý fanpage, sáng tạo nội dung và lên lịch đăng bài', tag: '' },
  { id: 'ds-5', name: 'Chụp ảnh sản phẩm', image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=500&fit=crop', price: '2.500.000đ', description: 'Chụp ảnh chuyên nghiệp, hậu kỳ tinh tế cho thương mại', tag: 'new' },
  { id: 'ds-6', name: 'Tư vấn chiến lược Marketing', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop', price: '12.000.000đ', description: 'Xây dựng kế hoạch marketing tổng thể cho doanh nghiệp', tag: 'hot' },
];

export interface ServiceListFormItem {
  _id: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  views?: number;
}

export const ServiceListForm = ({
  selectionMode,
  onSelectionModeChange,
  itemCount,
  sortBy,
  onItemCountChange,
  onSortByChange,
  filteredServices,
  selectedServices,
  selectedServiceIds,
  onToggleService,
  serviceSearchTerm,
  onServiceSearchTermChange,
  demoServices,
  setDemoServices,
  defaultExpanded,
}: {
  selectionMode: ServiceSelectionMode;
  onSelectionModeChange: (mode: ServiceSelectionMode) => void;
  itemCount: number;
  sortBy: string;
  onItemCountChange: (count: number) => void;
  onSortByChange: (value: string) => void;
  filteredServices: ServiceListFormItem[];
  selectedServices: ServiceListFormItem[];
  selectedServiceIds: string[];
  onToggleService: (id: string) => void;
  serviceSearchTerm: string;
  onServiceSearchTermChange: (value: string) => void;
  demoServices: DemoServiceItem[];
  setDemoServices: React.Dispatch<React.SetStateAction<DemoServiceItem[]>>;
  defaultExpanded?: boolean;
}) => {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['services'],
    defaultExpanded ?? true
  );

  const { add: addDemoService, update: updateDemoService, remove: removeDemoService, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoServices,
    setDemoServices,
    {
      createEmpty: () => ({ name: '', image: '', price: '', description: '', tag: '' as const, link: '' }),
      defaults: DEFAULT_DEMO_SERVICES,
      minItems: 1,
    },
  );

  return (
    <div className="mb-3">
      <AiDemoServicesImport onApply={setDemoServices} />
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <SubSection
        icon={Briefcase}
        title="Nguồn dữ liệu"
        open={openSections.services}
        onOpenChange={(open) => toggleSection('services', open)}
      >
      <div className="space-y-4">
      {/* Selection Mode Toggle */}
      <div className="space-y-2">
        <Label>Chế độ chọn dịch vụ</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>{  onSelectionModeChange('auto'); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              selectionMode === 'auto'
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            Tự động
          </button>
          <button
            type="button"
            onClick={() =>{  onSelectionModeChange('manual'); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              selectionMode === 'manual'
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            Chọn thủ công
          </button>
          <button
            type="button"
            onClick={() =>{  onSelectionModeChange('demo'); }}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
              selectionMode === 'demo'
                ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
          >
            Demo
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {selectionMode === 'auto' 
            ? 'Hiển thị dịch vụ tự động theo số lượng và sắp xếp' 
            : selectionMode === 'manual'
              ? 'Chọn từng dịch vụ cụ thể để hiển thị'
              : 'Nhập dữ liệu demo trực tiếp, không cần dịch vụ thật'}
        </p>
      </div>
      {/* Auto mode settings */}
      {selectionMode === 'auto' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Số lượng hiển thị</Label>
            <Input type="number" value={itemCount} onChange={(e) =>{  onItemCountChange(Number.parseInt(e.target.value) || 8); }} />
          </div>
          <div className="space-y-2">
            <Label>Sắp xếp theo</Label>
            <select className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={sortBy} onChange={(e) =>{  onSortByChange(e.target.value); }}>
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều nhất</option>
              <option value="random">Ngẫu nhiên</option>
            </select>
          </div>
        </div>
      )}

      {/* Manual mode - Service selector */}
      {selectionMode === 'manual' && (
        <div className="space-y-4">
          {/* Selected services list */}
          {selectedServices.length > 0 && (
            <div className="space-y-2">
              <Label>Dịch vụ đã chọn ({selectedServices.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedServices.map((service, index) => (
                  <div 
                    key={service._id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                  >
                    <div className="text-slate-400 cursor-move">
                      <GripVertical size={16} />
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">
                      {index + 1}
                    </span>
                    {service.thumbnail ? (
                      <Image src={service.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                        <Briefcase size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug break-words">{service.title}</p>
                      <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() =>{  onToggleService(service._id); }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and add services */}
          <div className="space-y-2">
            <Label>Thêm dịch vụ</Label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm dịch vụ..." 
                className="pl-9"
                value={serviceSearchTerm}
                onChange={(e) =>{  onServiceSearchTermChange(e.target.value); }}
              />
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
              {filteredServices.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  Không tìm thấy dịch vụ
                </div>
              ) : (
                filteredServices.map(service => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  return (
                    <div 
                      key={service._id}
                      onClick={() =>{  onToggleService(service._id); }}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors",
                        isSelected 
                          ? "bg-blue-50 dark:bg-blue-500/10" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected 
                          ? "border-blue-500 bg-blue-500" 
                          : "border-slate-300 dark:border-slate-600"
                      )}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      {service.thumbnail ? (
                        <Image src={service.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                          <Briefcase size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug break-words">{service.title}</p>
                        <p className="text-xs text-slate-500">{service.views} lượt xem</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Demo mode - Inline demo items */}
      {selectionMode === 'demo' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Dịch vụ demo ({demoServices.length})</Label>
            <div className="flex gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={loadDefaultDemo}>
                Mặc định
              </Button>
              <AiDemoServicesImport onApply={setDemoServices} />
              <Button type="button" variant="outline" size="sm" onClick={addDemoService}>
                <Plus size={14} className="mr-1" /> Thêm
              </Button>
            </div>
          </div>
          {demoServices.map((item, index) => (
            <DemoItemRowShell
              key={item.id}
              index={index}
              image={item.image}
              onRemove={() => removeDemoService(item.id)}
              placeholderIcon={<Briefcase size={12} />}
              footer={
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input placeholder="Mô tả ngắn" className="h-7 text-xs"
                    value={item.description ?? ''}
                    onChange={(e) => updateDemoService(item.id, { description: e.target.value })} />
                  <SettingsImageUploader
                    label="Ảnh thumbnail"
                    value={item.image ?? ''}
                    storageId={item.storageId as any}
                    onChange={(url, storageId) => updateDemoService(item.id, {
                      image: url ?? '',
                      storageId: storageId ? String(storageId) : null
                    })}
                    folder="home-components/service-list"
                    naming={{ entityName: item.name || 'demo-service', field: 'thumbnail', index: index + 1 }}
                    previewSize="sm"
                    cropAspectRatio="landscape43"
                  />
                </div>
              }
            >
              <DemoPrimaryFields
                name={item.name}
                namePlaceholder="Tên dịch vụ *"
                onNameChange={v => updateDemoService(item.id, { name: v })}
                link={item.link ?? ''}
                onLinkChange={v => updateDemoService(item.id, { link: v })}
              />
              <Input placeholder="Giá (VD: 5.000.000đ)" className="h-8 w-28 text-xs shrink-0" value={item.price ?? ''} onChange={(e) => updateDemoService(item.id, { price: e.target.value })} />
            </DemoItemRowShell>
          ))}
          {demoServices.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-500">
              Chưa có dịch vụ demo.{' '}
              <button type="button" className="text-blue-600 hover:underline" onClick={loadDefaultDemo}>
                Tạo mặc định
              </button>
            </div>
          )}
        </div>
      )}
      </div>
      </SubSection>
    </div>
  );
};


'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import * as LucideIcons from 'lucide-react';
import {
  Bot, GripVertical, Plus,
  Star, Trash2, User,
} from 'lucide-react';
import { Button, Input, Label, cn } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';
import type { IconOption } from '../../_shared/components/IconPopoverPicker';
import {
  TESTIMONIALS_ICON_CHOICES,
  createTestimonialsItem,
  type TestimonialsAvatarType,
  type TestimonialsDesktopColumns,
  type TestimonialsItem,
  type TestimonialsStyle,
} from '../_types';
import { AiDemoTestimonialsImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

// Demo data — tái dùng team-avatars
const DEMO_ITEMS: Array<Omit<TestimonialsItem, 'id'>> = [
  { name: 'Nguyễn Thị Lan', role: 'Giám đốc điều hành', company: 'ABC Corp', content: 'Dịch vụ tuyệt vời, vượt mong đợi. Đội ngũ chuyên nghiệp và tận tâm hỗ trợ 24/7.', rating: 5, avatarUrl: '/demo/team-avatars/demo-f1.png', avatar: '/demo/team-avatars/demo-f1.png', avatarType: 'image', avatarIcon: '' },
  { name: 'Trần Minh Hoa', role: 'Trưởng phòng Marketing', company: 'XYZ Ltd', content: 'Giải pháp phù hợp với nhu cầu thực tế. Sản phẩm chất lượng cao, giá cả hợp lý.', rating: 5, avatarUrl: '/demo/team-avatars/demo-f2.png', avatar: '/demo/team-avatars/demo-f2.png', avatarType: 'image', avatarIcon: '' },
  { name: 'Lê Thị Thu', role: 'CEO', company: 'StartUp VN', content: 'Trải nghiệm mua hàng tuyệt vời. Giao hàng nhanh, sản phẩm đúng như mô tả.', rating: 4, avatarUrl: '/demo/team-avatars/demo-f3.png', avatar: '/demo/team-avatars/demo-f3.png', avatarType: 'image', avatarIcon: '' },
  { name: 'Phạm Hương Giang', role: 'Chủ doanh nghiệp', company: 'Fashion House', content: 'Đội ngũ hỗ trợ nhiệt tình, giải quyết vấn đề nhanh chóng. Rất hài lòng!', rating: 5, avatarUrl: '/demo/team-avatars/demo-f4.png', avatar: '/demo/team-avatars/demo-f4.png', avatarType: 'image', avatarIcon: '' },
  { name: 'Vũ Thị Mai', role: 'Quản lý dự án', company: 'Tech Solutions', content: 'Chất lượng sản phẩm ổn định, dịch vụ hậu mãi tốt. Sẽ tiếp tục hợp tác lâu dài.', rating: 5, avatarUrl: '/demo/team-avatars/demo-f5.png', avatar: '/demo/team-avatars/demo-f5.png', avatarType: 'image', avatarIcon: '' },
  { name: 'Đỗ Thị Bích', role: 'Giám đốc tài chính', company: 'Finance Plus', content: 'Tôi đã sử dụng dịch vụ hơn 2 năm và luôn hài lòng. Khuyến khích mọi người dùng thử.', rating: 5, avatarUrl: '/demo/team-avatars/demo-f6.png', avatar: '/demo/team-avatars/demo-f6.png', avatarType: 'image', avatarIcon: '' },
];

const resolveIcon = (name: string) => {
  const map = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>;
  return map[name] ?? User;
};

const TESTIMONIALS_ICON_PICKER_OPTIONS: IconOption[] = TESTIMONIALS_ICON_CHOICES.map((name) => ({
  value: name,
  label: name,
  Icon: resolveIcon(name),
}));

const getInitials = (name: string) => {
  if (!name) { return 'NA'; }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) { return parts[0].slice(0, 2).toUpperCase(); }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
};

const getAvatarCropAspectRatio = (_style?: TestimonialsStyle) => 'square' as const;

// ── Drag reorder ─────────────────────────────────────────────────
function useDragReorder(items: TestimonialsItem[], setItems: React.Dispatch<React.SetStateAction<TestimonialsItem[]>>) {
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

  const dragProps = (id: string) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (draggedId !== id) { setDragOverId(id); } },
    onDragStart: () => { setDraggedId(id); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedId || draggedId === id) { return; }
      setItems((prev) => {
        const next = [...prev];
        const from = next.findIndex((x) => x.id === draggedId);
        const to = next.findIndex((x) => x.id === id);
        if (from < 0 || to < 0) { return prev; }
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setDraggedId(null); setDragOverId(null);
    },
  });

  return { draggedId, dragOverId, dragProps };
}

// ── Main form ────────────────────────────────────────────────────
interface TestimonialsFormProps {
  items: TestimonialsItem[];
  setItems: React.Dispatch<React.SetStateAction<TestimonialsItem[]>>;
  defaultExpanded?: boolean;
  desktopColumns?: TestimonialsDesktopColumns;
  onDesktopColumnsChange?: (value: TestimonialsDesktopColumns) => void;
  selectedStyle?: TestimonialsStyle;
  splitBackgroundImage?: string;
  onSplitBackgroundImageChange?: (value: string) => void;
  splitBackgroundOverlayOpacity?: number;
  onSplitBackgroundOverlayOpacityChange?: (value: number) => void;
}

export function TestimonialsForm({
  items,
  setItems,
  defaultExpanded = true,
  desktopColumns = 3,
  onDesktopColumnsChange,
  selectedStyle,
  splitBackgroundImage = '',
  onSplitBackgroundImageChange,
  splitBackgroundOverlayOpacity = 62,
  onSplitBackgroundOverlayOpacityChange,
}: TestimonialsFormProps) {
  const [expandedContentId, setExpandedContentId] = React.useState<string | null>(null);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['items'], defaultExpanded);
  const { draggedId, dragOverId, dragProps } = useDragReorder(items, setItems);

  const addItem = () => { setItems((prev) => [...prev, createTestimonialsItem(Date.now())]); };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
    if (expandedContentId === id) { setExpandedContentId(null); }
  };

  const updateItem = (id: string, patch: Partial<TestimonialsItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const loadDemo = () => {
    setItems(DEMO_ITEMS.map((d, i) => ({ ...createTestimonialsItem(Date.now() + i), ...d })));
  };
  const importAiItems = (nextItems: TestimonialsItem[]) => {
    setItems(nextItems.map((item) => ({
      ...item,
      avatar: item.avatarUrl ?? item.avatar ?? '',
      avatarType: item.avatarType === 'image' || item.avatarType === 'icon' ? item.avatarType : 'initials',
      rating: Math.max(1, Math.min(5, Math.round(item.rating || 5))),
    })));
  };

  const avatarOpts: Array<{ value: string; label: string }> = [
    { value: 'initials', label: 'Chữ' },
    { value: 'image', label: 'Ảnh' },
    { value: 'icon', label: 'Icon' },
  ];

  return (
    <div className="mb-6">
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
      <SubSection
        icon={Star}
        title={`Đánh giá (${items.length})`}
        open={openSections.items}
        onOpenChange={(open) => toggleSection('items', open)}
        actions={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={loadDemo}>
              <Bot size={11} /> Demo
            </Button>
            <AiDemoTestimonialsImport onApply={importAiItems} />
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
              <Plus size={12} /> Thêm
            </Button>
          </>
        )}
      >
        <div className="space-y-2">
          {onDesktopColumnsChange && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Số cột desktop</div>
              <div className="grid grid-cols-2 gap-2">
                {([3, 4] as const).map((option) => {
                  const selected = desktopColumns === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onDesktopColumnsChange(option)}
                      className={cn(
                        'h-9 rounded-md border text-xs transition-colors',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      {option} cột
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                3 cột: tablet 3, mobile 1. 4 cột: tablet/mobile 2.
              </p>
            </div>
          )}

          {selectedStyle === 'split-carousel' && onSplitBackgroundImageChange && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-200">Nền layout Split</div>
                <p className="text-[11px] text-slate-500">Dùng ảnh fullwidth và backdrop như Hero Fullscreen.</p>
              </div>
              <SettingsImageUploader
                label="Ảnh nền"
                value={splitBackgroundImage}
                onChange={(url) => onSplitBackgroundImageChange(url ?? '')}
                folder="testimonials-backgrounds"
                naming={{ entityName: 'testimonials', field: 'split-background' }}
                previewSize="sm"
                cropAspectRatio="wide169"
              />
              {onSplitBackgroundOverlayOpacityChange && (
                <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <Label className="shrink-0 text-sm">Backdrop</Label>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={splitBackgroundOverlayOpacity}
                    onChange={(event) => onSplitBackgroundOverlayOpacityChange(Number(event.target.value))}
                    className="h-1.5 flex-1 cursor-pointer accent-blue-500"
                  />
                  <span className="w-8 text-right text-xs tabular-nums text-slate-500">{splitBackgroundOverlayOpacity}%</span>
                </div>
              )}
            </div>
          )}

          {/* Demo avatars strip */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="text-[11px] text-slate-500 shrink-0">Mẫu:</span>
            <div className="flex gap-1.5">
              {DEMO_ITEMS.map((d, i) => (
                <button key={i} type="button" title={d.name}
                  className="h-6 w-6 overflow-hidden rounded-full border-2 border-transparent hover:border-blue-400 transition-all shrink-0"
                  onClick={() => {
                    if (items[i]) {
                      updateItem(items[i].id, { avatarUrl: d.avatarUrl, avatar: d.avatar, avatarType: 'image' });
                    } else {
                      setItems((prev) => [...prev, { ...createTestimonialsItem(Date.now() + i), ...d }]);
                    }
                  }}>
                  <Image src={d.avatarUrl ?? ''} alt="" width={24} height={24} className="h-full w-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
              <Star size={24} className="mb-2 text-slate-300" />
              <p className="text-sm text-slate-500 mb-3">Chưa có đánh giá nào</p>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                <Plus size={12} /> Thêm đánh giá
              </Button>
            </div>
          )}

          {items.map((item, idx) => {
            const avatarType = item.avatarType ?? 'initials';
            const IconCmp = resolveIcon(item.avatarIcon || 'User');
            const isContentOpen = expandedContentId === item.id;

            return (
              <div key={item.id} {...dragProps(item.id)}
                className={cn('cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing',
                  draggedId === item.id && 'opacity-50 scale-[0.98]',
                  dragOverId === item.id && 'ring-2 ring-blue-500 ring-offset-1',
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900')}>

                {/* Row chính */}
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <GripVertical size={14} className="shrink-0 text-slate-300 cursor-grab" />

                  {/* Avatar preview */}
                  <div 
                    className="shrink-0 h-8 w-8 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 relative cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => updateItem(item.id, { avatarType: 'image' })}
                    title="Click để đổi sang chế độ Ảnh"
                  >
                    {avatarType === 'icon' ? (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100">
                        <IconCmp size={14} className="text-slate-500" />
                      </div>
                    ) : avatarType === 'image' && (item.avatarUrl || item.avatar) ? (
                      <Image src={item.avatarUrl || item.avatar || ''} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-[9px] font-bold text-slate-500">
                        {avatarType === 'initials' ? getInitials(item.name) : <User size={12} className="text-slate-400" />}
                      </div>
                    )}
                  </div>

                  {/* Tên */}
                  <Input placeholder="Họ và tên" className="h-8 flex-1 text-xs min-w-0" value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })} />

                  {/* Role + Company */}
                  <Input placeholder="Chức vụ" className="h-8 w-24 text-xs shrink-0 hidden sm:block" value={item.role}
                    onChange={(e) => updateItem(item.id, { role: e.target.value })} />

                  {/* Avatar type dropdown */}
                  <select
                    className="h-8 rounded border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600 focus:outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 cursor-pointer shrink-0"
                    value={avatarType}
                    onChange={(e) => {
                      const newType = e.target.value as TestimonialsAvatarType;
                      updateItem(item.id, { avatarType: newType });
                    }}
                  >
                    {avatarOpts.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Stars */}
                  <div className="flex shrink-0 gap-px">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13}
                        className={cn('cursor-pointer transition-colors', s <= item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200')}
                        onClick={() => updateItem(item.id, { rating: s })} />
                    ))}
                  </div>

                  {/* Content toggle */}
                  <button type="button"
                    className="shrink-0 text-[10px] text-slate-400 hover:text-slate-600 px-1"
                    onClick={() => setExpandedContentId((p) => (p === item.id ? null : item.id))}>
                    {isContentOpen ? '▲' : '▼'}
                  </button>

                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-red-500"
                    onClick={() => removeItem(item.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>

                {/* Upload/URL khi type = image */}
                {avatarType === 'image' && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 py-3">
                    <SettingsImageUploader
                      label="Ảnh khách hàng"
                      value={item.avatarUrl ?? ''}
                      onChange={(url) => updateItem(item.id, { avatarUrl: url ?? '', avatar: url ?? '' })}
                      folder="testimonials-avatars"
                      naming={{ entityName: item.name || 'testimonial', field: 'avatar', index: idx + 1 }}
                      previewSize="sm"
                      cropAspectRatio={getAvatarCropAspectRatio(selectedStyle)}
                    />
                  </div>
                )}

                {/* Icon picker khi type = icon */}
                {avatarType === 'icon' && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
                    <IconPopoverPicker
                      value={item.avatarIcon || 'User'}
                      onChange={(nextIcon) => updateItem(item.id, { avatarIcon: nextIcon })}
                      options={TESTIMONIALS_ICON_PICKER_OPTIONS}
                    />
                  </div>
                )}

                {/* Role + Company hàng dưới nếu màn nhỏ, và Content */}
                {isContentOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 py-2 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input placeholder="Chức vụ" className="h-7 text-xs" value={item.role}
                        onChange={(e) => updateItem(item.id, { role: e.target.value })} />
                      <Input placeholder="Công ty" className="h-7 text-xs" value={item.company}
                        onChange={(e) => updateItem(item.id, { company: e.target.value })} />
                    </div>
                    <textarea
                      placeholder="Nội dung đánh giá..."
                      value={item.content}
                      onChange={(e) => updateItem(item.id, { content: e.target.value })}
                      className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 resize-y"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SubSection>
    </div>
  );
}

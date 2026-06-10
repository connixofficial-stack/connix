'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Bot, Check, FileText, GripVertical, Package, Plus, Search, X } from 'lucide-react';
import { Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { SettingsImageUploader } from '../../../components/SettingsImageUploader';
import { InputWithClear } from '../../stats/_components/InputWithClear';
import { type BlogCardRadius, type BlogSelectionMode, type BlogSortBy, type DemoBlogItem } from '../_types';
import { DEFAULT_DEMO_BLOG_POSTS } from '../_lib/constants';
import { AiDemoBlogPostsImport } from '../../product-list/_components/AiDemoProductsImport';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import type { SectionSpacing } from '../../_shared/types/sectionSpacing';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';
import { useDemoItemList } from '../../_shared/hooks/useDemoItemList';
import { DemoItemRowShell } from '../../_shared/components/DemoItemRowShell';
import { DemoPrimaryFields } from '../../_shared/components/DemoPrimaryFields';

export interface BlogPostItem {
  _id: string;
  _creationTime: number;
  title: string;
  slug?: string;
  excerpt?: string;
  thumbnail?: string;
  categoryId?: string;
  categoryName?: string;
  publishedAt?: number;
  status?: string;
  views?: number;
}

export const BlogForm = ({
  showAuthor,
  canShowAuthor,
  showExcerpt,
  showDate,
  onDisplayConfigChange,
  selectionMode,
  onSelectionModeChange,
  itemCount,
  sortBy,
  onConfigChange,
  selectedPosts,
  selectedPostIds,
  onTogglePost,
  searchTerm,
  onSearchTermChange,
  filteredPosts,
  demoPosts,
  setDemoPosts,
  isLoading,
  defaultExpanded = true,
  desktopColumns = 4,
  onDesktopColumnsChange,
  spacing,
  onSpacingChange,
  cornerRadius,
  onCornerRadiusChange,
}: {
  showAuthor: boolean;
  canShowAuthor?: boolean;
  showExcerpt: boolean;
  showDate: boolean;
  onDisplayConfigChange: (config: {
    showAuthor?: boolean;
    showExcerpt?: boolean;
    showDate?: boolean;
  }) => void;
  selectionMode: BlogSelectionMode;
  onSelectionModeChange: (mode: BlogSelectionMode) => void;
  itemCount: number;
  sortBy: BlogSortBy;
  onConfigChange: (config: { itemCount?: number; sortBy?: BlogSortBy }) => void;
  selectedPosts: BlogPostItem[];
  selectedPostIds: string[];
  onTogglePost: (postId: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filteredPosts: BlogPostItem[];
  demoPosts: DemoBlogItem[];
  setDemoPosts: React.Dispatch<React.SetStateAction<DemoBlogItem[]>>;
  isLoading: boolean;
  /** create = true (mở hết), edit = false (đóng hết) */
  defaultExpanded?: boolean;
  desktopColumns?: 3 | 4;
  onDesktopColumnsChange?: (cols: 3 | 4) => void;
  spacing: SectionSpacing;
  onSpacingChange: (spacing: SectionSpacing) => void;
  cornerRadius: BlogCardRadius;
  onCornerRadiusChange: (radius: BlogCardRadius) => void;
}) => {
  const activeSections = React.useMemo(() => ['settings', 'source'], []);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);

  const { add: addDemoItem, update: updateDemoItem, remove: removeDemoItem, loadDefault: loadDefaultDemo } = useDemoItemList(
    demoPosts,
    setDemoPosts,
    {
      createEmpty: () => ({ title: '', excerpt: '', thumbnail: '', category: '', date: '', author: '', link: '' }),
      defaults: DEFAULT_DEMO_BLOG_POSTS,
    },
  );

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-3">
        <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

        <AiDemoBlogPostsImport onApply={(items) => {
          setDemoPosts(items);
          onSelectionModeChange('demo');
        }} />

        <HomeComponentDisplaySettingsSection
          open={openSections.settings}
          onOpenChange={(open) => toggleSection('settings', open)}
          cornerRadius={cornerRadius}
          onCornerRadiusChange={onCornerRadiusChange}
          spacing={spacing}
          onSpacingChange={onSpacingChange}
        >
          {onDesktopColumnsChange && (
            <div className="space-y-2">
                <Label>Số cột desktop</Label>
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
              </div>
          )}

          <div className="space-y-2 md:col-span-2">
              <Label>Thành phần hiển thị</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  canShowAuthor ? { key: 'showAuthor', label: 'Hiện tác giả', value: showAuthor } : null,
                  { key: 'showDate', label: 'Hiện ngày đăng', value: showDate },
                  { key: 'showExcerpt', label: 'Hiện đoạn trích', value: showExcerpt },
                ].filter(Boolean).map((item) => (
                  <button
                    key={item!.key}
                    type="button"
                    onClick={() => { onDisplayConfigChange({ [item!.key]: !item!.value } as { showAuthor?: boolean; showExcerpt?: boolean; showDate?: boolean }); }}
                    className={cn(
                      'flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all',
                      item!.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300',
                    )}
                  >
                    <span>{item!.label}</span>
                    <span className={cn('h-2.5 w-2.5 rounded-full', item!.value ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600')} />
                  </button>
                ))}
              </div>
            </div>
        </HomeComponentDisplaySettingsSection>

        {/* ── Nguồn dữ liệu ── */}
        <SubSection
          icon={Package}
          title="Nguồn dữ liệu"
          open={openSections.source}
          onOpenChange={(open) => toggleSection('source', open)}
        >
          <div className="space-y-2">
            <Label>Chế độ chọn bài viết</Label>
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
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                Dữ liệu demo
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {selectionMode === 'auto'
                ? 'Hiển thị bài viết tự động theo số lượng và sắp xếp'
                : selectionMode === 'manual'
                  ? 'Chọn từng bài viết cụ thể để hiển thị'
                  : 'Dữ liệu mẫu gắn theo component — không cần tạo bài viết thật'}
            </p>
          </div>

          {selectionMode === 'auto' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số lượng hiển thị</Label>
                <Input
                  type="number"
                  value={itemCount}
                  onChange={(e) =>{  onConfigChange({ itemCount: Number.parseInt(e.target.value) || 8 }); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) =>{  onConfigChange({ sortBy: e.target.value as BlogSortBy }); }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Xem nhiều nhất</option>
                  <option value="random">Ngẫu nhiên</option>
                </select>
              </div>
            </div>
          )}

          {selectionMode === 'manual' && (
            <div className="space-y-4">
              {selectedPosts.length > 0 && (
                <div className="space-y-2">
                  <Label>Bài viết đã chọn ({selectedPosts.length})</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedPosts.map((post, index) => (
                      <div 
                        key={post._id} 
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg group"
                      >
                        <div className="text-slate-400 cursor-move">
                          <GripVertical size={16} />
                        </div>
                        <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs rounded-full font-medium">
                          {index + 1}
                        </span>
                        {post.thumbnail ? (
                          <Image src={post.thumbnail} alt="" width={48} height={48} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                            <FileText size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-slate-500">{new Date(post._creationTime).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() =>{  onTogglePost(post._id); }}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Thêm bài viết</Label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <InputWithClear
                    placeholder="Tìm kiếm bài viết..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={onSearchTermChange}
                  />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-[250px] overflow-y-auto">
                  {filteredPosts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      {isLoading ? 'Đang tải...' : 'Không tìm thấy bài viết'}
                    </div>
                  ) : (
                    filteredPosts.map(post => {
                      const isSelected = selectedPostIds.includes(post._id);
                      return (
                        <div 
                          key={post._id}
                          onClick={() =>{  onTogglePost(post._id); }}
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
                          {post.thumbnail ? (
                            <Image src={post.thumbnail} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                              <FileText size={14} className="text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.title}</p>
                            <p className="text-xs text-slate-500">{post.views} lượt xem</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {selectionMode === 'demo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Bài viết demo ({demoPosts.length})</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={loadDefaultDemo}>
                    <Bot size={11} /> Mẫu mặc định
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs"
                    onClick={addDemoItem}>
                    <Plus size={12} /> Thêm
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {demoPosts.map((item, index) => (
                  <DemoItemRowShell
                    key={item.id}
                    index={index}
                    image={item.thumbnail}
                    onRemove={() => removeDemoItem(item.id)}
                    placeholderIcon={<FileText size={12} />}
                  >
                    <DemoPrimaryFields
                      name={item.title}
                      namePlaceholder="Tiêu đề bài viết *"
                      onNameChange={v => updateDemoItem(item.id, { title: v })}
                      link={item.link ?? ''}
                      onLinkChange={v => updateDemoItem(item.id, { link: v })}
                    />
                    <InputWithClear
                      placeholder="Danh mục"
                      className="h-8 w-28 text-xs shrink-0"
                      value={item.category ?? ''}
                      onChange={value => updateDemoItem(item.id, { category: value })}
                    />
                    <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <InputWithClear
                          placeholder="Đoạn trích (tuỳ chọn)"
                          className="h-7 text-xs"
                          value={item.excerpt ?? ''}
                          onChange={(value) => updateDemoItem(item.id, { excerpt: value })}
                        />
                        <SettingsImageUploader
                          label="Ảnh thumbnail"
                          value={item.thumbnail ?? ''}
                          onChange={(url) => updateDemoItem(item.id, { thumbnail: url ?? '' })}
                          folder="home-components/blog"
                          naming={{ entityName: item.title || 'demo-blog', field: 'thumbnail', index: index + 1 }}
                          previewSize="sm"
                        />
                      </div>
                    </div>
                  </DemoItemRowShell>
                ))}
              </div>

              {demoPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
                  <FileText size={24} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-3">Chưa có bài viết demo</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={loadDefaultDemo}>
                      <Bot size={12} /> Tải mẫu
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDemoItem}>
                      <Plus size={12} /> Thêm mới
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </SubSection>
      </CardContent>
    </Card>
  );
};

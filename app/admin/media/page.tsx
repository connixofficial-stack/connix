'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { 
  Check, ChevronDown, ClipboardPaste, Copy, Edit, Eye, FileText, FileVideo, 
  FolderOpen, Grid, Image as ImageIcon, List, 
  Loader2, Plus, RefreshCw, Search, Trash2, Upload, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, cn } from '../components/ui';
import { BulkActionBar, SelectCheckbox, generatePaginationItems } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500, 5000];

const MODULE_KEY = 'media';
type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'image' | 'video' | 'document';
type UsageFilter = 'all' | 'used' | 'orphan';
type SortMode = 'newest' | 'oldest' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc' | 'type-asc' | 'usage-desc' | 'usage-asc';

type MediaUsage = {
  field: string;
  label?: string;
  recordId: string;
  table: string;
};

type MediaItem = {
  _id: Id<"images">;
  _creationTime: number;
  storageId: Id<"_storage">;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  folder?: string;
  url: string | null;
  isOrphan?: boolean;
  usageCheckedAt?: number;
  usageCount?: number;
  usages?: MediaUsage[];
};

type UsageCheckResult = Pick<MediaItem, 'isOrphan' | 'usageCount' | 'usages'>;

function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {return ImageIcon;}
  if (mimeType.startsWith('video/')) {return FileVideo;}
  return FileText;
}

function getMimeTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) {return 'Hình ảnh';}
  if (mimeType.startsWith('video/')) {return 'Video';}
  if (mimeType === 'application/pdf') {return 'PDF';}
  return 'Tài liệu';
}

function formatUsage(usage: MediaUsage): string {
  return `${usage.table}.${usage.field}${usage.label ? ` · ${usage.label}` : ''}`;
}

export default function MediaPage() {
  return (
    <ModuleGuard moduleKey="media">
      <MediaContent />
    </ModuleGuard>
  );
}

function MediaContent() {
  const mediaData = useQuery(api.media.listWithUrlsAndUsage, { limit: 5000 }) as MediaItem[] | undefined;
  const foldersData = useQuery(api.media.getFolders);
  const statsData = useQuery(api.media.getStats);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMedia = useMutation(api.media.create);
  const bulkRemoveOrphanMedia = useMutation(api.media.bulkRemoveOnlyOrphans);
  const resyncMediaCounters = useMutation(api.seed.syncMediaCounters);
  const recheckMediaUsage = useMutation(api.media.recheckUsageForMedia);

  // Check enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);
  
  const showFolders = enabledFeatures.enableFolders ?? true;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterFolder, setFilterFolder] = useState('');
  const [usageFilter, setUsageFilter] = useState<UsageFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"images">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [isDeleting, setIsDeleting] = useState(false);

  const applyManualSelection = (nextIds: Id<"images">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };
  const [isUploading, setIsUploading] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [usageOverrides, setUsageOverrides] = useState<Record<string, UsageCheckResult>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = mediaData === undefined;
  const [resolvedItemsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_media_page_size', 100);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterFolder, usageFilter]);

  const mediaItems = useMemo(() => {
    if (!mediaData) {return [];}
    return mediaData.map(media => ({
      ...media,
      ...usageOverrides[media._id],
    }));
  }, [mediaData, usageOverrides]);

  // Filter media
  const filteredMedia = useMemo(() => {
    if (!mediaItems) {return [];}
    
    let data = [...mediaItems];
    
    // Search filter
    if (searchTerm) {
      data = data.filter(m => m.filename.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Type filter
    if (filterType !== 'all') {
      data = data.filter(m => {
        if (filterType === 'image') {return m.mimeType.startsWith('image/');}
        if (filterType === 'video') {return m.mimeType.startsWith('video/');}
        if (filterType === 'document') {return m.mimeType === 'application/pdf' || m.mimeType.includes('document');}
        return true;
      });
    }
    
    // Folder filter
    if (filterFolder) {
      data = data.filter(m => m.folder === filterFolder);
    }

    if (usageFilter === 'used') {
      data = data.filter(m => (m.usageCount ?? 0) > 0);
    } else if (usageFilter === 'orphan') {
      data = data.filter(m => m.isOrphan);
    }

    data.sort((a, b) => {
      if (sortMode === 'newest') {return b._creationTime - a._creationTime;}
      if (sortMode === 'oldest') {return a._creationTime - b._creationTime;}
      if (sortMode === 'size-desc') {return b.size - a.size;}
      if (sortMode === 'size-asc') {return a.size - b.size;}
      if (sortMode === 'name-asc') {return a.filename.localeCompare(b.filename);}
      if (sortMode === 'name-desc') {return b.filename.localeCompare(a.filename);}
      if (sortMode === 'type-asc') {return a.mimeType.localeCompare(b.mimeType);}
      if (sortMode === 'usage-desc') {return (b.usageCount ?? 0) - (a.usageCount ?? 0);}
      if (sortMode === 'usage-asc') {return (a.usageCount ?? 0) - (b.usageCount ?? 0);}
      return 0;
    });
    
    return data;
  }, [mediaItems, searchTerm, filterType, filterFolder, usageFilter, sortMode]);

  const totalPages = Math.ceil(filteredMedia.length / resolvedItemsPerPage) || 1;
  const paginatedMedia = useMemo(() => {
    return filteredMedia.slice((currentPage - 1) * resolvedItemsPerPage, currentPage * resolvedItemsPerPage);
  }, [filteredMedia, currentPage, resolvedItemsPerPage]);

  const isSelectAllActive = selectionMode === 'all';
  const selectedIds = isSelectAllActive ? filteredMedia.map(m => m._id) : manualSelectedIds;

  const selectedOnPage = paginatedMedia.filter(media => selectedIds.includes(media._id));
  const isPageSelected = paginatedMedia.length > 0 && selectedOnPage.length === paginatedMedia.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedMedia.length;

  // Selection handlers
  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedMedia.some(media => media._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedMedia.forEach(media => next.add(media._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<"images">) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {return;}

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;

    try {
      for (const [fileIndex, file] of Array.from(files).entries()) {
        const validationError = validateImageFile(file, 10);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          continue;
        }

        const resolvedNaming = resolveNamingContext(undefined, {
          entityName: 'media',
          field: 'upload',
          index: fileIndex + 1,
        });
        const prepared = await prepareImageForUpload(file, { naming: resolvedNaming });
        const uploadUrl = await generateUploadUrl();

        const response = await fetch(uploadUrl, {
          body: prepared.file,
          headers: { 'Content-Type': prepared.mimeType },
          method: 'POST',
        });

        if (!response.ok) {
          toast.error(`${file.name}: Upload thất bại`);
          continue;
        }

        const { storageId } = await response.json();

        await createMedia({
          filename: prepared.filename,
          folder: 'uploads',
          height: prepared.height,
          mimeType: prepared.mimeType,
          size: prepared.size,
          storageId: storageId as Id<"_storage">,
          width: prepared.width,
        });

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      toast.success(`Đã tải lên ${uploadedCount}/${totalFiles} file`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi tải lên');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (inputRef.current) {inputRef.current.value = '';}
    }
  }, [generateUploadUrl, createMedia]);

  // Upload handler with compression
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {return;}
    await uploadFiles(Array.from(files));
  }, [uploadFiles]);

  const handleClipboardPaste = useCallback(async () => {
    if (isUploading) {return;}
    setIsAddMenuOpen(false);

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (!imageType) {continue;}

        const blob = await item.getType(imageType);
        const ext = imageType.split('/')[1] || 'png';
        const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imageType });
        await uploadFiles([file]);
        return;
      }

      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('Trình duyệt chặn quyền đọc clipboard.');
      } else {
        toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
      }
    }
  }, [isUploading, uploadFiles]);

  // Delete handlers
  const handleDelete = async (id: Id<"images">) => {
    if (!confirm('Chỉ xóa nếu file này đang cô đơn, không còn được tham chiếu ở đâu. Tiếp tục?')) {return;}
    
    try {
      const result = await bulkRemoveOrphanMedia({ ids: [id] });
      applyManualSelection(selectedIds.filter(i => i !== id));
      if (result.deleted.length > 0) {
        toast.success('Đã xóa file cô đơn');
      } else {
        toast.warning('Không xóa vì file vẫn đang được sử dụng');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa file');
    }
  };

  const handleBulkDelete = async () => {
    const selectedOrphanCount = filteredMedia.filter(media => selectedIds.includes(media._id) && media.isOrphan).length;
    if (selectedOrphanCount === 0) {
      toast.warning('Chưa chọn ảnh cô đơn nào để xóa');
      return;
    }
    if (!confirm(`Xóa ${selectedOrphanCount} ảnh cô đơn đã chọn? Server sẽ kiểm tra lại usage ngay trước khi xóa.`)) {return;}
    
    setIsDeleting(true);
    try {
      const result = await bulkRemoveOrphanMedia({ ids: selectedIds });
      applyManualSelection([]);
      const skippedText = result.skipped.length > 0 ? `, bỏ qua ${result.skipped.length} file chưa đủ an toàn để xóa` : '';
      toast.success(`Đã xóa ${result.deleted.length} ảnh cô đơn${skippedText}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa files');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResyncCounters = async () => {
    if (!confirm('Hệ thống sẽ quét lại toàn bộ media để tính đúng số file và dung lượng đã dùng. Tiếp tục?')) {return;}

    setIsResyncing(true);
    try {
      const result = await resyncMediaCounters();
      const total = result.stats.total;
      toast.success(`Đã tính lại: ${total.count} file · ${formatBytes(total.totalSize)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi tính lại dung lượng media');
    } finally {
      setIsResyncing(false);
    }
  };

  const handleRecheckUsage = async () => {
    if (mediaItems.length === 0) {
      toast.info('Chưa có file nào để kiểm tra');
      return;
    }
    if (!confirm('Hệ thống sẽ quét toàn bộ dữ liệu, bao gồm cả bản lưu trang chủ, để kiểm tra file nào chưa được sử dụng. Tiếp tục?')) {return;}

    setIsCheckingUsage(true);
    try {
      const result = await recheckMediaUsage({ ids: mediaItems.map(media => media._id) });
      const nextOverrides: Record<string, UsageCheckResult> = {};
      result.forEach(item => {
        nextOverrides[item.id] = {
          isOrphan: item.isOrphan,
          usageCount: item.usageCount,
          usages: item.usages,
        };
      });
      setUsageOverrides(prev => ({ ...prev, ...nextOverrides }));
      const orphanCount = result.filter(item => item.isOrphan).length;
      toast.success(`Đã kiểm tra: ${orphanCount}/${result.length} file chưa được sử dụng`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi kiểm tra file chưa dùng');
    } finally {
      setIsCheckingUsage(false);
    }
  };

  // Copy URL
  const handleCopyUrl = async (url: string | null, id: string) => {
    if (!url) {return;}
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() =>{  setCopiedId(null); }, 2000);
      toast.success('Đã copy URL');
    } catch {
      toast.error('Không thể copy URL');
    }
  };

  // Drop zone
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    void handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thư viện Media</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {statsData?.totalCount ?? 0} files - {formatBytes(statsData?.totalSize ?? 0)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void handleResyncCounters()}
            disabled={isResyncing || isUploading}
          >
            <RefreshCw size={16} className={isResyncing ? 'animate-spin' : ''} />
            {isResyncing ? 'Đang tính lại' : 'Tính lại dung lượng'}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void handleRecheckUsage()}
            disabled={isCheckingUsage || isUploading || isResyncing}
          >
            <RefreshCw size={16} className={isCheckingUsage ? 'animate-spin' : ''} />
            {isCheckingUsage ? 'Đang kiểm tra' : 'Kiểm tra file chưa dùng'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            onChange={(e) => void handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="relative">
            <Button
              className="gap-2 bg-cyan-600 hover:bg-cyan-500"
              onClick={() => setIsAddMenuOpen(prev => !prev)}
              disabled={isUploading}
              aria-haspopup="menu"
              aria-expanded={isAddMenuOpen}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {uploadProgress}%
                </>
              ) : (
                <>
                  <Plus size={16} /> Thêm ảnh <ChevronDown size={16} className={cn('transition-transform', isAddMenuOpen && 'rotate-180')} />
                </>
              )}
            </Button>
            {isAddMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsAddMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      inputRef.current?.click();
                    }}
                    className="flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Upload size={16} className="mt-0.5 text-cyan-600" />
                    <span>
                      <span className="block font-medium text-slate-800 dark:text-slate-100">Upload ảnh</span>
                      <span className="block text-xs text-slate-500">Chọn file từ máy tính.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleClipboardPaste()}
                    className="flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Copy ảnh rồi click vào đây"
                  >
                    <ClipboardPaste size={16} className="mt-0.5 text-emerald-600" />
                    <span>
                      <span className="block font-medium text-slate-800 dark:text-slate-100">Dán từ clipboard</span>
                      <span className="block text-xs text-slate-500">Dùng ảnh vừa copy.</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionBar 
        selectedCount={selectedIds.length} 
        entityLabel="tệp"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedMedia.length}
        totalMatchingCount={filteredMedia.length}
        onSelectPage={() =>{  applyManualSelection(paginatedMedia.map(media => media._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectAllActive}
        onDelete={handleBulkDelete} 
        onClearSelection={() =>{  applyManualSelection([]); }} 
        isLoading={isDeleting}
      />

      {/* Filters */}
      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm..." 
                className="pl-9 w-[200px]" 
                value={searchTerm} 
                onChange={(e) =>{  setSearchTerm(e.target.value); }} 
              />
            </div>

            {/* Type filter */}
            <select 
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterType}
              onChange={(e) =>{  setFilterType(e.target.value as FilterType); }}
            >
              <option value="all">Tất cả loại</option>
              <option value="image">Hình ảnh ({statsData?.imageCount ?? 0})</option>
              <option value="video">Video ({statsData?.videoCount ?? 0})</option>
              <option value="document">Tài liệu ({statsData?.documentCount ?? 0})</option>
            </select>

            {/* Folder filter - only show if feature enabled */}
            {showFolders && foldersData && foldersData.length > 0 && (
              <select 
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={filterFolder}
                onChange={(e) =>{  setFilterFolder(e.target.value); }}
              >
                <option value="">Tất cả thư mục</option>
                {foldersData.map(folder => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </select>
            )}

            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={usageFilter}
              onChange={(e) =>{  setUsageFilter(e.target.value as UsageFilter); }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="used">Đang được dùng</option>
              <option value="orphan">Ảnh cô đơn</option>
            </select>

            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={sortMode}
              onChange={(e) =>{  setSortMode(e.target.value as SortMode); }}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="size-desc">Dung lượng lớn nhất</option>
              <option value="size-asc">Dung lượng nhỏ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="type-asc">Loại file</option>
              <option value="usage-desc">Được dùng nhiều nhất</option>
              <option value="usage-asc">Ít usage nhất</option>
            </select>
          </div>

          {/* View mode */}
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-md p-1">
            <button
              onClick={() =>{  setViewMode('grid'); }}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() =>{  setViewMode('list'); }}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Drop zone & Content */}
        <div 
          className="p-4"
          onDrop={handleDrop}
          onDragOver={(e) =>{  e.preventDefault(); }}
        >
          {filteredMedia.length === 0 ? (
            <div 
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">
                {searchTerm || filterType !== 'all' || filterFolder ? 'Không tìm thấy file phù hợp' : 'Chưa có file nào'}
              </p>
              <p className="text-sm text-slate-400">Kéo thả hoặc click để tải lên</p>
            </div>
          ) : (viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginatedMedia.map(media => {
                const FileIcon = getFileIcon(media.mimeType);
                const isImage = media.mimeType.startsWith('image/');
                const isSelected = selectedIds.includes(media._id);

                return (
                  <div 
                    key={media._id}
                    className={cn(
                      'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all bg-white dark:bg-slate-800',
                      isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    )}
                  >
                    {/* Thumbnail */}
                    <div 
                      className="relative aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
                      onClick={() =>{  toggleSelectItem(media._id); }}
                    >
                      {isImage && media.url ? (
                        <Image src={media.url} alt={media.filename} fill sizes="100%" className="object-cover" />
                      ) : (
                        <FileIcon size={40} className="text-slate-400" />
                      )}
                    </div>

                    {/* Selection checkbox */}
                    <div className={cn(
                      'absolute top-2 left-2 transition-opacity',
                      isSelected || 'opacity-0 group-hover:opacity-100'
                    )}>
                      <SelectCheckbox 
                        checked={isSelected} 
                        onChange={() =>{  toggleSelectItem(media._id); }} 
                      />
                    </div>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {isImage && media.url && (
                        <button
                          className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50"
                          onClick={() =>{  setPreviewMedia(media); }}
                          title="Xem"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50"
                        onClick={ async () => handleCopyUrl(media.url, media._id)}
                        title="Copy URL"
                      >
                        {copiedId === media._id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      <Link href={`/admin/media/${media._id}/edit`}>
                        <button className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-slate-50" title="Sửa">
                          <Edit size={14} />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 bg-white dark:bg-slate-800 rounded shadow hover:bg-red-50 text-red-500"
                        onClick={ async () => handleDelete(media._id)}
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{media.filename}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-xs text-slate-400">{formatBytes(media.size)}</span>
                        <Badge
                          variant={media.isOrphan ? 'warning' : 'success'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {media.isOrphan ? 'Cô đơn' : `${media.usageCount ?? 0} dùng`}
                        </Badge>
                      </div>
                      {!media.isOrphan && media.usages?.[0] && (
                        <p className="mt-1 text-[11px] text-slate-500 truncate" title={formatUsage(media.usages[0])}>
                          {formatUsage(media.usages[0])}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {/* Select all */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <SelectCheckbox 
                  checked={isPageSelected} 
                  onChange={toggleSelectAll}
                  indeterminate={isPageIndeterminate}
                  disabled={paginatedMedia.length === 0}
                />
                <span className="text-sm text-slate-500">Chọn tất cả trang này</span>
              </div>

              {paginatedMedia.map(media => {
                const FileIcon = getFileIcon(media.mimeType);
                const isImage = media.mimeType.startsWith('image/');
                const isSelected = selectedIds.includes(media._id);

                return (
                  <div 
                    key={media._id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border transition-all',
                      isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <SelectCheckbox checked={isSelected} onChange={() =>{  toggleSelectItem(media._id); }} />
                    
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {isImage && media.url ? (
                        <Image src={media.url} alt={media.filename} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon size={24} className="text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{media.filename}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{getMimeTypeLabel(media.mimeType)}</span>
                        <span>{formatBytes(media.size)}</span>
                        {media.width && media.height && (
                          <span>{media.width}x{media.height}</span>
                        )}
                        {showFolders && media.folder && (
                          <Badge variant="secondary" className="text-xs">
                            <FolderOpen size={12} className="mr-1" />
                            {media.folder}
                          </Badge>
                        )}
                        <Badge variant={media.isOrphan ? 'warning' : 'success'} className="text-xs">
                          {media.isOrphan ? 'Ảnh cô đơn' : `Đang dùng: ${media.usageCount ?? 0}`}
                        </Badge>
                      </div>
                      {!media.isOrphan && media.usages && media.usages.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {media.usages.slice(0, 3).map((usage, index) => (
                            <Badge key={`${usage.table}-${usage.recordId}-${usage.field}-${index}`} variant="outline" className="max-w-[240px] truncate text-xs">
                              {formatUsage(usage)}
                            </Badge>
                          ))}
                          {media.usages.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{media.usages.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {media.url && (
                        <a
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          href={media.url}
                          rel="noreferrer"
                          target="_blank"
                          title="Mở tab mới"
                        >
                          <Eye size={16} className="text-slate-400" />
                        </a>
                      )}
                      <button
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={ async () => handleCopyUrl(media.url, media._id)}
                        title="Copy URL"
                      >
                        {copiedId === media._id ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-slate-400" />}
                      </button>
                      <Link href={`/admin/media/${media._id}/edit`}>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Sửa">
                          <Edit size={16} className="text-slate-400" />
                        </button>
                      </Link>
                      <button
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        onClick={ async () => handleDelete(media._id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {filteredMedia.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Hiển thị {paginatedMedia.length} trên trang này (Đã lọc {filteredMedia.length} / Tổng DB: {statsData?.totalCount ?? 0} files)
            </div>
            
            <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="hidden sm:inline">Hiển thị</span>
                <select
                  value={resolvedItemsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-600"
                  aria-label="Số file mỗi trang"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size === 5000 ? 'Tất cả' : size}</option>
                  ))}
                </select>
              </div>

              <nav className="flex items-center space-x-1 sm:space-x-2" aria-label="Phân trang">
                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang trước"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>

                {generatePaginationItems(currentPage, totalPages).map((item, index) => {
                  if (item === 'ellipsis') {
                    return (
                      <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-slate-400">
                        …
                      </div>
                    );
                  }

                  const pageNum = item as number;
                  const isActive = pageNum === currentPage;
                  const isMobileHidden = !isActive && pageNum !== 1 && pageNum !== totalPages;

                  return (
                    <button
                      key={pageNum}
                      onClick={() =>{  setCurrentPage(pageNum); }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-sm border font-medium dark:bg-cyan-500'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                      } ${isMobileHidden ? 'hidden sm:inline-flex' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>{  setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Trang sau"
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      {previewMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() =>{  setPreviewMedia(null); }}
        >
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() =>{  setPreviewMedia(null); }}
          >
            <X size={24} className="text-white" />
          </button>
          <Image 
            src={previewMedia.url ?? ''} 
            alt={previewMedia.filename} 
            width={previewMedia.width ?? 1200}
            height={previewMedia.height ?? 900}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) =>{  e.stopPropagation(); }}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-4 py-2 rounded-lg text-white text-sm">
            <div>
              {previewMedia.filename} - {formatBytes(previewMedia.size)}
              {previewMedia.width && previewMedia.height && ` - ${previewMedia.width}x${previewMedia.height}`}
            </div>
            <div className="mt-1 text-xs text-white/80">
              {previewMedia.isOrphan
                ? 'Ảnh cô đơn: chưa thấy nơi nào đang dùng'
                : `Đang dùng: ${previewMedia.usages?.slice(0, 2).map(formatUsage).join('; ')}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


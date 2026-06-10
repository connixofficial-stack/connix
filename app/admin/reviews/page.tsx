'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Ban, Check, ChevronDown, Package, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, generatePaginationItems, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { usePersistedPageSize } from '../components/usePersistedPageSize';

const MODULE_KEY = 'comments';

export default function ReviewsListPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <ReviewsContent />
    </ModuleGuard>
  );
}

function ReviewsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'Pending' | 'Approved' | 'Spam'>('');
  const [filterProduct, setFilterProduct] = useState<Id<'products'> | ''>('');
  const [manualSelectedIds, setManualSelectedIds] = useState<Id<"comments">[]>([]);
  const [selectionMode, setSelectionMode] = useState<'manual' | 'all'>('manual');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"comments"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'desc', key: 'created' });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return ['rating', 'product', 'status', 'created'];
    }
    try {
      const stored = window.localStorage.getItem('admin_reviews_visible_columns');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        return parsed.length > 0 ? parsed : ['rating', 'product', 'status', 'created'];
      }
    } catch {
      return ['rating', 'product', 'status', 'created'];
    }
    return ['rating', 'product', 'status', 'created'];
  });
  const isSelectAllActive = selectionMode === 'all';

  const productsData = useQuery(api.products.listAll, {});
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const deleteComment = useMutation(api.comments.remove);
  const approveComment = useMutation(api.comments.approve);
  const markAsSpam = useMutation(api.comments.markAsSpam);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () =>{  clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    window.localStorage.setItem('admin_reviews_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const reviewsPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'commentsPerPage');
    return (setting?.value as number) || 20;
  }, [settingsData]);

  const [resolvedReviewsPerPage, setPageSizeOverride] = usePersistedPageSize('admin_reviews_page_size', reviewsPerPage);
  const offset = (currentPage - 1) * resolvedReviewsPerPage;

  const reviewsData = useQuery(api.comments.listAdminWithOffset, {
    limit: resolvedReviewsPerPage,
    offset,
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
    targetType: 'product',
    targetId: filterProduct || undefined,
  });

  const totalCountData = useQuery(api.comments.countAdmin, {
    search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
    status: filterStatus || undefined,
    targetType: 'product',
    targetId: filterProduct || undefined,
  });

  const deleteInfo = useQuery(
    api.comments.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  const selectAllData = useQuery(
    api.comments.listAdminIds,
    isSelectAllActive
      ? {
          search: debouncedSearchTerm.trim() ? debouncedSearchTerm.trim() : undefined,
          status: filterStatus || undefined,
          targetType: 'product',
          targetId: filterProduct || undefined,
        }
      : 'skip'
  );

  const isTableLoading = reviewsData === undefined
    || totalCountData === undefined
    || productsData === undefined
    || settingsData === undefined;

  const columns = [
    { key: 'rating', label: 'Đánh giá' },
    { key: 'product', label: 'Sản phẩm' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'created', label: 'Thời gian' },
  ];

  const resolvedVisibleColumns = visibleColumns.filter(key => columns.some(col => col.key === key));

  useEffect(() => {
    if (selectAllData?.hasMore) {
      toast.info('Đã chọn tối đa 5.000 đánh giá phù hợp.');
    }
  }, [selectAllData?.hasMore]);

  const productMap = useMemo(() => {
    const map: Record<string, string> = {};
    productsData?.forEach(product => { map[product._id] = product.name; });
    return map;
  }, [productsData]);

  const reviews = useMemo(() => reviewsData?.map(review => ({
    ...review,
    id: review._id,
    author: review.authorName,
    productName: productMap[review.targetId] || 'Sản phẩm không tồn tại',
    created: review._creationTime,
  })) ?? [], [reviewsData, productMap]);

  const sortedReviews = useSortableData(reviews, sortConfig);

  const totalCount = totalCountData?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / resolvedReviewsPerPage) : 1;
  const paginatedReviews = sortedReviews;
  const tableColumnCount = 4 + resolvedVisibleColumns.length;
  const selectedIds = isSelectAllActive && selectAllData ? selectAllData.ids : manualSelectedIds;
  const isSelectingAll = isSelectAllActive && selectAllData === undefined;

  const applyManualSelection = (nextIds: Id<"comments">[]) => {
    setSelectionMode('manual');
    setManualSelectedIds(nextIds);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('');
    setFilterProduct('');
    setCurrentPage(1);
    setPageSizeOverride(null);
    applyManualSelection([]);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value as '' | 'Pending' | 'Approved' | 'Spam');
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const handleProductChange = (value: string) => {
    setFilterProduct(value as Id<'products'> | '');
    setCurrentPage(1);
    applyManualSelection([]);
  };

  const selectedOnPage = paginatedReviews.filter(review => selectedIds.includes(review._id));
  const isPageSelected = paginatedReviews.length > 0 && selectedOnPage.length === paginatedReviews.length;
  const isPageIndeterminate = selectedOnPage.length > 0 && selectedOnPage.length < paginatedReviews.length;

  const toggleSelectAll = () => {
    if (isPageSelected) {
      const remaining = selectedIds.filter(id => !paginatedReviews.some(review => review._id === id));
      applyManualSelection(remaining);
      return;
    }
    const next = new Set(selectedIds);
    paginatedReviews.forEach(review => next.add(review._id));
    applyManualSelection(Array.from(next));
  };

  const toggleSelectItem = (id: Id<"comments">) =>{
    const next = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    applyManualSelection(next);
  };

  const handleDelete = async (id: Id<"comments">) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    setIsDeleteLoading(true);
    try {
      await deleteComment({ cascade: true, id: deleteTargetId });
      toast.success('Đã xóa đánh giá');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Không thể xóa đánh giá');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Xóa ${selectedIds.length} đánh giá đã chọn? Tất cả dữ liệu liên quan sẽ bị xóa.`)) {
      try {
        await Promise.all(selectedIds.map( async id => deleteComment({ cascade: true, id })));
        applyManualSelection([]);
        toast.success(`Đã xóa ${selectedIds.length} đánh giá`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể xóa đánh giá');
      }
    }
  };

  const handleApprove = async (id: Id<"comments">) => {
    try {
      await approveComment({ id });
      toast.success('Đã duyệt đánh giá');
    } catch {
      toast.error('Không thể duyệt đánh giá');
    }
  };

  const handleSpam = async (id: Id<"comments">) => {
    try {
      await markAsSpam({ id });
      toast.success('Đã đánh dấu spam');
    } catch {
      toast.error('Không thể đánh dấu spam');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Đánh giá sản phẩm</h1>
          <p className="text-sm text-slate-500">Quản lý đánh giá và nhận xét từ khách hàng</p>
        </div>
        <div />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        entityLabel="đánh giá"
        selectionScope={isSelectAllActive ? 'all_results' : isPageSelected ? 'page' : 'partial'}
        pageItemCount={paginatedReviews.length}
        totalMatchingCount={totalCount}
        onSelectPage={() =>{  applyManualSelection(paginatedReviews.map(review => review._id)); }}
        onSelectAllResults={() =>{  setSelectionMode('all'); }}
        isSelectingAllResults={isSelectingAll}
        onDelete={handleBulkDelete}
        onClearSelection={() =>{  applyManualSelection([]); }}
      />

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm khách hàng hoặc nội dung..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) =>{  setSearchTerm(e.target.value); setCurrentPage(1); applyManualSelection([]); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterProduct}
              onChange={(e) =>{  handleProductChange(e.target.value); }}
            >
              <option value="">Tất cả sản phẩm</option>
              {productsData?.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) =>{  handleStatusChange(e.target.value); }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Spam">Spam</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Xóa lọc</Button>
            <ColumnToggle
              columns={columns}
              visibleColumns={resolvedVisibleColumns}
              onToggle={(key) => {
                setVisibleColumns(prev => prev.includes(key) ? prev.filter(col => col !== key) : [...prev, key]);
              }}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-white dark:[&_th]:bg-slate-900">
            <TableRow>
              <TableHead className="w-[40px]"><SelectCheckbox checked={isPageSelected} onChange={toggleSelectAll} indeterminate={isPageIndeterminate} /></TableHead>
              <SortableHeader label="Khách hàng" sortKey="author" sortConfig={sortConfig} onSort={handleSort} className="w-[180px]" />
              <TableHead>Nội dung</TableHead>
              {resolvedVisibleColumns.includes('rating') && (
                <SortableHeader label="Đánh giá" sortKey="rating" sortConfig={sortConfig} onSort={handleSort} className="w-[90px]" />
              )}
              {resolvedVisibleColumns.includes('product') && (
                <SortableHeader label="Sản phẩm" sortKey="productName" sortConfig={sortConfig} onSort={handleSort} className="w-[180px]" />
              )}
              {resolvedVisibleColumns.includes('status') && (
                <SortableHeader label="Trạng thái" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="w-[120px]" />
              )}
              {resolvedVisibleColumns.includes('created') && (
                <SortableHeader label="Thời gian" sortKey="created" sortConfig={sortConfig} onSort={handleSort} className="w-[140px]" />
              )}
              <TableHead className="text-right w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: resolvedReviewsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell>
                    <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                  {resolvedVisibleColumns.includes('rating') && (
                    <TableCell>
                      <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('product') && (
                    <TableCell>
                      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('status') && (
                    <TableCell>
                      <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  {resolvedVisibleColumns.includes('created') && (
                    <TableCell>
                      <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="ml-auto h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {paginatedReviews.map(review => (
                  <TableRow key={review._id} className={selectedIds.includes(review._id) ? 'bg-blue-500/5' : ''}>
                    <TableCell><SelectCheckbox checked={selectedIds.includes(review._id)} onChange={() =>{  toggleSelectItem(review._id); }} /></TableCell>
                    <TableCell>
                      <div className="font-medium">{review.author}</div>
                      <div className="text-xs text-slate-400">{review.authorEmail ?? 'N/A'}</div>
                    </TableCell>
                    <TableCell><p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{review.content}</p></TableCell>
                    {resolvedVisibleColumns.includes('rating') && (
                      <TableCell className="text-sm text-slate-500">{review.rating ? `${review.rating}/5` : '—'}</TableCell>
                    )}
                    {resolvedVisibleColumns.includes('product') && (
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[180px]">
                          <Package size={12} className="text-orange-500" />
                          {review.productName}
                        </div>
                      </TableCell>
                    )}
                    {resolvedVisibleColumns.includes('status') && (
                      <TableCell>
                        <Badge variant={review.status === 'Approved' ? 'default' : (review.status === 'Pending' ? 'secondary' : 'destructive')} className="whitespace-nowrap">
                          {review.status === 'Approved' ? 'Đã duyệt' : (review.status === 'Pending' ? 'Chờ duyệt' : 'Spam')}
                        </Badge>
                      </TableCell>
                    )}
                    {resolvedVisibleColumns.includes('created') && (
                      <TableCell className="text-xs text-slate-500">{new Date(review.created).toLocaleString('vi-VN')}</TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {review.status !== 'Approved' && (
                          <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" title="Duyệt" onClick={ async () => handleApprove(review._id)}><Check size={16}/></Button>
                        )}
                        {review.status !== 'Spam' && (
                          <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-600" title="Đánh dấu spam" onClick={ async () => handleSpam(review._id)}><Ban size={16}/></Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" title="Xóa" onClick={ async () => handleDelete(review._id)}><Trash2 size={16}/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
            {!isTableLoading && paginatedReviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={tableColumnCount} className="text-center py-8 text-slate-500">
                  {searchTerm || filterStatus || filterProduct ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có đánh giá nào.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalCount > 0 && !isTableLoading && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 flex w-full items-center justify-between text-sm text-slate-500 sm:order-1 sm:w-auto sm:justify-start sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Hiển thị</span>
                <select
                  value={resolvedReviewsPerPage}
                  onChange={(event) =>{  setPageSizeOverride(Number(event.target.value)); setCurrentPage(1); applyManualSelection([]); }}
                  className="h-8 w-[70px] appearance-none rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none"
                  aria-label="Số đánh giá mỗi trang"
                >
                  {[10, 20, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>đánh giá/trang</span>
              </div>

              <div className="text-right sm:text-left">
                <span className="font-medium text-slate-900">
                  {totalCount ? ((currentPage - 1) * resolvedReviewsPerPage) + 1 : 0}–{Math.min(currentPage * resolvedReviewsPerPage, totalCount)}
                </span>
                <span className="mx-1 text-slate-300">/</span>
                <span className="font-medium text-slate-900">
                  {totalCount}{totalCountData?.hasMore ? '+' : ''}
                </span>
                <span className="ml-1 text-slate-500">đánh giá</span>
              </div>
            </div>

            <div className="order-1 flex w-full justify-center sm:order-2 sm:w-auto sm:justify-end">
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
                          ? 'bg-blue-600 text-white shadow-sm border font-medium'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa đánh giá"
        itemName={reviews.find((review) => review._id === deleteTargetId)?.content ?? 'đánh giá'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
    </div>
  );
}

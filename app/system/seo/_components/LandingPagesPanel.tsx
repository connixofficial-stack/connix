'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Trash2, Edit, Eye } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Card, Input } from '@/app/admin/components/ui';
import { BulkDeleteConfirmDialog } from '@/app/admin/components/BulkDeleteConfirmDialog';

const LANDING_TYPE_LABELS: Record<string, string> = {
  'feature': 'Tính năng',
  'use-case': 'Trường hợp sử dụng',
  'solution': 'Giải pháp',
  'compare': 'So sánh',
  'integration': 'Tích hợp',
  'template': 'Template',
  'guide': 'Hướng dẫn',
};

const LANDING_TYPE_ROUTES: Record<string, string> = {
  'feature': '/features',
  'use-case': '/use-cases',
  'solution': '/solutions',
  'compare': '/compare',
  'integration': '/integrations',
  'template': '/templates',
  'guide': '/guides',
};

export const LandingPagesPanel = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<Id<'landingPages'>>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const result = useQuery(api.landingPages.listAll, { paginationOpts: { cursor: null, numItems: 100 } });
  const deleteMutation = useMutation(api.landingPages.remove);
  const previewMutation = useMutation(api.landingPages.previewProgrammaticPlan);
  const generateMutation = useMutation(api.landingPages.upsertProgrammaticFromModules);
  const bulkStatusMutation = useMutation(api.landingPages.bulkUpdateStatus);

  const pages = result?.page ?? [];
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: Id<'landingPages'>) => {
    try {
      await deleteMutation({ id });
      toast.success('Đã xóa landing page');
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteMutation({ id })));
      toast.success(`Đã xóa ${selectedIds.size} landing pages`);
      setSelectedIds(new Set());
      setShowBulkDelete(false);
    } catch {
      toast.error('Lỗi khi xóa hàng loạt');
    }
  };

  const toggleSelect = (id: Id<'landingPages'>) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPages.map(p => p._id)));
    }
  };

  const handleBulkStatus = async (status: 'draft' | 'published') => {
    if (selectedIds.size === 0) {
      return;
    }
    setIsBulkUpdating(true);
    try {
      const resultData = await bulkStatusMutation({
        ids: Array.from(selectedIds),
        status,
      });
      toast.success(`Đã cập nhật ${resultData.updated} landing pages`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Không thể cập nhật trạng thái hàng loạt');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleOpenSelected = () => {
    const selectedPublished = filteredPages.filter(page =>
      selectedIds.has(page._id) && page.status === 'published'
    );
    if (selectedPublished.length === 0) {
      toast.error('Chỉ mở được các trang đã Publish');
      return;
    }
    selectedPublished.forEach((page) => {
      window.open(`${LANDING_TYPE_ROUTES[page.landingType]}/${page.slug}`, '_blank');
    });
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const plan = await previewMutation({});
      const byType = Object.entries(plan.byType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      toast.success(`Dự kiến tạo ${plan.createCount}, cập nhật ${plan.updateCount} (tổng ${plan.total})`, {
        description: byType || undefined,
      });
    } catch {
      toast.error('Không thể xem trước kế hoạch auto-generate');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const resultData = await generateMutation({});
      toast.success(`Đã tạo ${resultData.created}, cập nhật ${resultData.updated} (tổng ${resultData.total})`);
    } catch {
      toast.error('Không thể tạo landing pages tự động');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!result) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-sm text-slate-500">Quản lý landing pages cho SEO growth</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
            {isPreviewing ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            Xem trước auto
          </Button>
          <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
            Tạo tự động
          </Button>
          <Button onClick={() => router.push('/system/seo/create')}>
            <Plus size={16} className="mr-2" /> Tạo mới
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Tìm theo title hoặc slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenSelected}>
                Mở {selectedIds.size}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBulkStatus('published')}
                disabled={isBulkUpdating}
              >
                Publish {selectedIds.size}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleBulkStatus('draft')}
                disabled={isBulkUpdating}
              >
                Draft {selectedIds.size}
              </Button>
              <Button variant="destructive" onClick={() => setShowBulkDelete(true)}>
                <Trash2 size={16} className="mr-2" /> Xóa {selectedIds.size}
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left text-sm text-slate-600">
                <th className="pb-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredPages.length && filteredPages.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="pb-3">Title</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Updated</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page._id} className="border-b hover:bg-slate-50">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(page._id)}
                      onChange={() => toggleSelect(page._id)}
                    />
                  </td>
                  <td className="py-3 font-medium">{page.title}</td>
                  <td className="py-3 text-sm text-slate-600">{page.slug}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {LANDING_TYPE_LABELS[page.landingType]}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded ${page.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {page.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-600">
                    {new Date(page.updatedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 text-right space-x-2">
                    {page.status === 'published' && (
                      <button
                        onClick={() => window.open(`${LANDING_TYPE_ROUTES[page.landingType]}/${page.slug}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Xem trang"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/system/seo/${page._id}/edit`)}
                      className="text-slate-600 hover:text-slate-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(page._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có landing page nào'}
            </div>
          )}
        </div>
      </Card>

      <BulkDeleteConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        onConfirm={handleBulkDelete}
        title="Xóa landing pages"
        description={`Bạn có chắc muốn xóa ${selectedIds.size} landing pages?`}
      />
    </div>
  );
};

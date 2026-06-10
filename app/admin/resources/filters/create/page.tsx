'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { ModuleGuard } from '../../../components/ModuleGuard';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

function convertToSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s-]|_)+/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function ResourceFilterCreatePage() {
  return (
    <ModuleGuard moduleKey="resources">
      <ResourceFilterCreateContent />
    </ModuleGuard>
  );
}

function ResourceFilterCreateContent() {
  const router = useRouter();
  const createFilter = useMutation(api.resourceFilters.create);
  const partnerFilters = useQuery(api.resourceFilters.listUnmappedPartnerFilters, {});

  const [creationMode, setCreationMode] = useState<'new' | 'copy'>('new');
  const [selectedPartnerSlug, setSelectedPartnerSlug] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(convertToSlug(value));
  };

  const handlePartnerFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPartnerSlug(val);
    const filter = partnerFilters?.find((f) => f.slug === val);
    if (filter) {
      setName(filter.name);
      setSlug(filter.slug);
      setActive(filter.active);
    } else {
      setName('');
      setSlug('');
    }
  };

  // Dirty state detection
  const hasChanges = useMemo(() => {
    if (creationMode === 'copy') {
      return selectedPartnerSlug !== '';
    }
    return name.trim() !== '' || slug.trim() !== '' || active !== true;
  }, [name, slug, active, creationMode, selectedPartnerSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Vui lòng điền đầy đủ tên và slug');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFilter({
        active,
        name: name.trim(),
        slug: slug.trim(),
        copyValuesFromPartnerSlug: creationMode === 'copy' && selectedPartnerSlug ? selectedPartnerSlug : undefined,
      });
      toast.success('Đã thêm bộ lọc mới thành công');
      router.push('/admin/resources/filters');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo bộ lọc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/10 p-2">
            <Filter className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm bộ lọc mới</h1>
            <Link href="/admin/resources/filters" className="text-sm text-indigo-600 hover:underline">Quay lại danh sách</Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-xl">
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <button
                type="button"
                className={cn(
                  "pb-2 text-sm font-semibold border-b-2 transition-colors",
                  creationMode === 'new'
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
                onClick={() => {
                  setCreationMode('new');
                  setName('');
                  setSlug('');
                  setSelectedPartnerSlug('');
                }}
              >
                Tạo mới hoàn toàn
              </button>
              <button
                type="button"
                className={cn(
                  "pb-2 text-sm font-semibold border-b-2 transition-colors",
                  creationMode === 'copy'
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
                onClick={() => {
                  setCreationMode('copy');
                  setName('');
                  setSlug('');
                  setSelectedPartnerSlug('');
                }}
              >
                Sao chép & Liên kết từ Khóa học
              </button>
            </div>

            {creationMode === 'copy' && (
              <div className="space-y-2">
                <Label htmlFor="partner-filter">Chọn bộ lọc từ Khóa học <span className="text-red-500">*</span></Label>
                <select
                  id="partner-filter"
                  value={selectedPartnerSlug}
                  onChange={handlePartnerFilterChange}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- Chọn bộ lọc đối tác để copy --</option>
                  {partnerFilters?.map((f) => (
                    <option key={f._id} value={f.slug}>
                      {f.name} ({f.slug})
                    </option>
                  ))}
                </select>
                {partnerFilters && partnerFilters.length === 0 && (
                  <p className="text-xs text-amber-500 font-medium">Tất cả bộ lọc của Khóa học đã được liên kết sang.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="filter-name">Tên bộ lọc <span className="text-red-500">*</span></Label>
              <CopyableInput
                id="filter-name"
                value={name}
                onChange={handleNameChange}
                copyLabel="tên bộ lọc"
                placeholder="Ví dụ: Phần mềm, Cấp độ..."
                required
                disabled={creationMode === 'copy'}
                autoFocus={creationMode === 'new'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-slug">Slug <span className="text-red-500">*</span></Label>
              <Input
                id="filter-slug"
                value={slug}
                onChange={(e) => setSlug(convertToSlug(e.target.value))}
                placeholder="ví dụ: phan-mem"
                className="font-mono text-sm"
                required
                disabled={creationMode === 'copy'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-active">Trạng thái</Label>
              <select
                id="filter-active"
                value={active ? 'active' : 'inactive'}
                onChange={(e) => setActive(e.target.value === 'active')}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                disabled={creationMode === 'copy'}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ẩn</option>
              </select>
            </div>

            {creationMode === 'copy' && selectedPartnerSlug && (
              <div className="rounded-md bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3 text-xs text-indigo-600 dark:text-indigo-400">
                Hệ thống sẽ tự động sao chép toàn bộ các giá trị con (bao gồm ảnh/icon và thứ tự) từ bộ lọc Khóa học sang bộ lọc mới tạo.
              </div>
            )}
          </CardContent>
        </Card>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          submitLabel="Tạo bộ lọc"
        >
          <>
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/resources/filters')} disabled={isSubmitting}>Hủy bỏ</Button>
            <Button
              type="submit"
              variant="accent"
              disabled={isSubmitting || !hasChanges}
              className={cn(
                !hasChanges && !isSubmitting
                  ? 'bg-slate-300 hover:bg-slate-300 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                  : undefined
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Đang tạo...
                </>
              ) : 'Tạo bộ lọc'}
            </Button>
          </>
        </HomeComponentStickyFooter>
      </form>
    </div>
  );
}

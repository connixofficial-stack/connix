'use client';
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/app/admin/components/ui';
import { IA_SETTINGS_KEYS } from '@/lib/ia/settings';
import { TRUST_PAGE_SLOTS } from '@/lib/ia/trust-pages';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { cn } from '@/app/admin/components/ui';

type TrustPageMappingState = Record<string, string | null>;

type PreviewSlot = {
  key: string;
  label: string;
  slug: string;
  action: 'disabled' | 'mapped' | 'suggested' | 'draft';
  enabled: boolean;
  postId: string | null;
  postTitle: string | null;
  postStatus: string | null;
};

const mapStatusBadge = (status?: string | null) => {
  if (status === 'Published') {
    return { label: 'Hiện', variant: 'success' as const };
  }
  if (status === 'Draft') {
    return { label: 'Ẩn', variant: 'warning' as const };
  }
  return { label: status ?? 'Không áp dụng', variant: 'outline' as const };
};

const actionBadge = (action: PreviewSlot['action']) => {
  switch (action) {
    case 'mapped':
      return { label: 'Giữ nguyên', variant: 'success' as const };
    case 'suggested':
      return { label: 'Sẽ tạo mới', variant: 'info' as const };
    case 'draft':
      return { label: 'Tạo nháp', variant: 'warning' as const };
    default:
      return { label: 'Bỏ qua', variant: 'outline' as const };
  }
};

function SingleSelectCombobox<T extends { _id: string; name: string; subtitle?: string }>({
  items,
  label,
  placeholder,
  selectedId,
  onChange,
}: {
  items: T[];
  label: string;
  placeholder: string;
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, query]);

  const selectedItem = useMemo(
    () => items.find((item) => item._id === selectedId) ?? null,
    [items, selectedId]
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
          <span className="text-xs text-slate-400">▼</span>
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm nhanh..." className="mb-2" />
            <div className="max-h-56 overflow-y-auto space-y-1">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span>Bỏ chọn</span>
              </button>
              {filteredItems.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-500">Không tìm thấy dữ liệu phù hợp.</div>
              )}
              {filteredItems.map((item) => {
                const active = selectedId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      onChange(item._id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    {item.subtitle ? <span className="text-xs text-slate-400">{item.subtitle}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {selectedItem ? (
        <div className="text-xs text-slate-500">
          Đã chọn: <span className="font-medium text-slate-700">{selectedItem.name}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function TrustPagesAdminPage() {
  const router = useRouter();
  const [pageToggles, setPageToggles] = useState<Record<string, boolean>>({});
  const [pageMappings, setPageMappings] = useState<TrustPageMappingState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [pendingAutoGenerateMode, setPendingAutoGenerateMode] = useState<'apply' | 'overwrite'>('apply');
  const [publishStatus, setPublishStatus] = useState<'Draft' | 'Published'>('Published');

  const settings = useQuery(api.settings.getMultiple, { keys: [...IA_SETTINGS_KEYS] });
  const posts = useQuery(api.posts.listAll, { limit: 200 });
  const categories = useQuery(api.postCategories.listAll, { limit: 200 });
  const trustPagesFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableTrustPages' });
  const autoGenerateFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableTrustPagesAutoGenerate' });
  const canUseTrustPages = trustPagesFeature?.enabled ?? true;
  const canAutoGenerate = canUseTrustPages && (autoGenerateFeature?.enabled ?? false);
  const autoGeneratePreview = useQuery(api.trustPages.previewAutoGenerate, showPreview && canAutoGenerate ? {} : 'skip');
  const saveSettings = useMutation(api.settings.setMultiple);
  const applyAutoGenerate = useMutation(api.trustPages.applyAutoGenerate);

  useEffect(() => {
    if (!settings) {return;}
    const nextToggles: Record<string, boolean> = {};
    const nextMappings: TrustPageMappingState = {};
    TRUST_PAGE_SLOTS.forEach((slot) => {
      const toggleValue = settings[slot.iaKey];
      nextToggles[slot.iaKey] = typeof toggleValue === 'boolean' ? toggleValue : true;
      const mappingValue = settings[slot.mappingKey];
      nextMappings[slot.mappingKey] = typeof mappingValue === 'string' ? mappingValue : null;
    });
    setPageToggles(nextToggles);
    setPageMappings(nextMappings);
  }, [settings]);

  const policyCategory = useMemo(() => {
    if (!categories) {return null;}
    return categories.find((category) => {
      const target = `${category.name} ${category.slug}`.toLowerCase();
      return target.includes('chính sách') || target.includes('chinh sach') || target.includes('policy');
    }) ?? null;
  }, [categories]);

  const policyPosts = useMemo(() => {
    if (!posts) {return [];}
    if (!policyCategory) {return posts;}
    return posts.filter((post) => post.categoryId === policyCategory._id);
  }, [posts, policyCategory]);

  const policyPostsMap = useMemo(() => {
    const map = new Map<string, (typeof policyPosts)[number]>();
    policyPosts.forEach((post) => map.set(post._id, post));
    return map;
  }, [policyPosts]);

  const hasChanges = useMemo(() => {
    if (!settings) {return false;}
    return TRUST_PAGE_SLOTS.some((slot) => {
      const currentToggle = typeof settings[slot.iaKey] === 'boolean' ? settings[slot.iaKey] : true;
      const currentMapping = typeof settings[slot.mappingKey] === 'string' ? settings[slot.mappingKey] : null;
      return currentToggle !== pageToggles[slot.iaKey] || currentMapping !== pageMappings[slot.mappingKey];
    });
  }, [pageMappings, pageToggles, settings]);

  const handleSave = async () => {
    if (!hasChanges) {return;}
    setIsSaving(true);
    try {
      await saveSettings({
        settings: TRUST_PAGE_SLOTS.flatMap((slot) => ([
          { group: 'ia', key: slot.iaKey, value: pageToggles[slot.iaKey] ?? true },
          { group: 'ia', key: slot.mappingKey, value: pageMappings[slot.mappingKey] ?? null },
        ])),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableAllDisabled = () => {
    setPageToggles((prev) => {
      const next = { ...prev };
      TRUST_PAGE_SLOTS.forEach((slot) => {
        next[slot.iaKey] = true;
      });
      return next;
    });
  };

  const openPublishConfirm = (mode: 'apply' | 'overwrite') => {
    setPendingAutoGenerateMode(mode);
    setShowPublishConfirm(true);
  };

  const handleApplyAutoGenerate = async () => {
    setIsApplying(true);
    try {
      const overwrite = pendingAutoGenerateMode === 'overwrite';
      const result = await applyAutoGenerate({ overwrite, status: publishStatus });
      const nextMappings: TrustPageMappingState = { ...pageMappings };
      TRUST_PAGE_SLOTS.forEach((slot) => {
        if (Object.prototype.hasOwnProperty.call(result.updatedSettings, slot.mappingKey)) {
          const value = result.updatedSettings[slot.mappingKey];
          nextMappings[slot.mappingKey] = typeof value === 'string' ? value : null;
        }
      });
      setPageMappings(nextMappings);
      setShowPublishConfirm(false);
      setShowPreview(false);
      const { createdCount, deletedCount, disabledCount, keptCount } = result.summary;
      if (result.mode === 'overwrite') {
        toast.success(`Đã xóa ${deletedCount} bài và tạo ${createdCount} bài ${publishStatus === 'Published' ? 'đã xuất bản' : 'bản nháp'}${disabledCount > 0 ? `, bỏ qua ${disabledCount} mục đang tắt` : ''}.`);
      } else {
        toast.success(`Đã tạo ${createdCount} bài ${publishStatus === 'Published' ? 'đã xuất bản' : 'bản nháp'} mới${keptCount > 0 ? `, giữ ${keptCount} mapping hợp lệ` : ''}${disabledCount > 0 ? `, bỏ qua ${disabledCount} mục đang tắt` : ''}.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsApplying(false);
    }
  };

  const previewSlots = (autoGeneratePreview?.slots ?? []) as PreviewSlot[];

  if (!canUseTrustPages) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base text-amber-800">Trang tin cậy đang tắt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-700">
            <p>
              Tính năng Trang tin cậy đang bị tắt trong cấu hình. Vui lòng liên hệ quản trị viên hệ thống để kích hoạt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trang tin cậy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gắn bài viết chính sách vào các đường dẫn tin cậy cố định để đảm bảo URL ổn định và dễ quản trị.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleEnableAllDisabled}>
            Bật tất cả mục đang tắt
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/posts/create')}>
            Tạo bài chính sách
          </Button>
          {canAutoGenerate && (
            <Button variant="accent" onClick={() => setShowPreview(true)}>
              Sinh tự động từ dữ liệu thực
            </Button>
          )}
        </div>
      </div>

      {!policyCategory && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-700">
            Chưa có danh mục “Chính sách”. Hệ thống sẽ tạm hiển thị toàn bộ bài viết để chọn.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {TRUST_PAGE_SLOTS.map((slot) => {
          const mappingKey = slot.mappingKey;
          const mappedPostId = pageMappings[mappingKey] ?? null;
          const mappedPost = mappedPostId ? policyPostsMap.get(mappedPostId) : null;
          const mappedStatus = mapStatusBadge(mappedPost?.status ?? null);

          return (
            <Card key={slot.key}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-col">
                    <span>{slot.label}</span>
                    <span className="text-xs font-normal text-slate-500">{slot.slug}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={slot.slug} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" className="h-7 px-2 text-xs">
                        Mở trang
                      </Button>
                    </Link>
                    {mappedPost && <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>}
                    <Checkbox
                      checked={pageToggles[slot.iaKey] ?? true}
                      onCheckedChange={(value) => setPageToggles((prev) => ({ ...prev, [slot.iaKey]: Boolean(value) }))}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SingleSelectCombobox
                  items={policyPosts.map((post) => ({
                    _id: post._id,
                    name: post.title,
                    subtitle: post.status,
                  }))}
                  label="Bài viết chính sách"
                  placeholder="Chọn bài viết"
                  selectedId={mappedPostId}
                  onChange={(value) => setPageMappings((prev) => ({ ...prev, [mappingKey]: value }))}
                />
                {mappedPost ? (
                  <div className="text-xs text-slate-500">
                    Slug bài viết: <span className="font-medium text-slate-700">{mappedPost.slug}</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Chưa gắn bài viết. Đường dẫn sẽ ẩn nếu tắt hiển thị.</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Xem trước sinh tự động Trang tin cậy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              Hệ thống sẽ dùng dữ liệu thật (thiết lập + bài viết chính sách) để giữ mapping hợp lệ và tạo bài mới cho các trang còn thiếu.
            </p>
            <div className="space-y-2">
              {autoGeneratePreview === undefined && (
                <div className="text-xs text-slate-500">Đang tải xem trước...</div>
              )}
              {autoGeneratePreview && previewSlots.length === 0 && (
                <div className="text-xs text-slate-500">Chưa có dữ liệu xem trước.</div>
              )}
              {previewSlots.map((slot) => {
                const badge = actionBadge(slot.action);
                return (
                  <div key={slot.key} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2">
                    <div>
                      <div className="font-medium text-slate-800">{slot.label}</div>
                      <div className="text-xs text-slate-500">{slot.slug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.postTitle ? <span className="text-xs text-slate-500">{slot.postTitle}</span> : null}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Đóng
            </Button>
            <Button variant="outline" onClick={() => openPublishConfirm('overwrite')} disabled={isApplying}>
              Ghi đè
            </Button>
            <Button onClick={() => openPublishConfirm('apply')} disabled={isApplying}>
              Áp dụng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingAutoGenerateMode === 'overwrite' ? 'Xác nhận ghi đè Trust Pages' : 'Xác nhận áp dụng Trust Pages'}</DialogTitle>
            <DialogDescription>
              Chọn trạng thái cho tất cả bài chính sách được tạo trong lần {pendingAutoGenerateMode === 'overwrite' ? 'ghi đè' : 'áp dụng'} này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
              <input
                type="radio"
                name="trust-page-publish-status"
                value="Published"
                checked={publishStatus === 'Published'}
                onChange={() => setPublishStatus('Published')}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Hiện</div>
                <div className="text-xs text-slate-500">Hiển thị toàn bộ bài mới tạo ngay sau khi chạy.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700">
              <input
                type="radio"
                name="trust-page-publish-status"
                value="Draft"
                checked={publishStatus === 'Draft'}
                onChange={() => setPublishStatus('Draft')}
                className="mt-0.5"
              />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">Ẩn</div>
                <div className="text-xs text-slate-500">Tạo bài trước rồi kiểm tra nội dung sau.</div>
              </div>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishConfirm(false)} disabled={isApplying}>
              Hủy
            </Button>
            <Button onClick={() => { void handleApplyAutoGenerate(); }} disabled={isApplying}>
              {isApplying
                ? pendingAutoGenerateMode === 'overwrite' ? 'Đang ghi đè...' : 'Đang áp dụng...'
                : pendingAutoGenerateMode === 'overwrite' ? 'Xác nhận ghi đè' : 'Xác nhận áp dụng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HomeComponentStickyFooter
        isSubmitting={isSaving}
        hasChanges={hasChanges}
        onClickSave={handleSave}
        submitType="button"
        submitLabel="Lưu thay đổi"
      />
    </div>
  );
}

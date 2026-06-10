'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox } from '@/app/admin/components/ui';
import { IA_SETTINGS_KEYS } from '@/lib/ia/settings';
import type { RouteMode } from '@/lib/ia/route-mode';
import { TRUST_PAGE_SLOTS } from '@/lib/ia/trust-pages';

type TrustPageSetting = {
  key: string;
  label: string;
  slug: string;
};

const TRUST_PAGES: TrustPageSetting[] = TRUST_PAGE_SLOTS.map((slot) => ({
  key: slot.iaKey,
  label: slot.label,
  slug: slot.slug,
}));

type SlugConflict = FunctionReturnType<typeof api.ia.listConflicts>[number];
type SlugConflictItem = SlugConflict['items'][number];

export default function InformationArchitecturePage() {
  const settings = useQuery(api.settings.getMultiple, { keys: [...IA_SETTINGS_KEYS] });
  const conflicts = useQuery(api.ia.listConflicts, { scope: 'all' });
  const saveSettings = useMutation(api.settings.setMultiple);
  const resolveConflicts = useMutation(api.ia.resolveConflicts);

  const [routeMode, setRouteMode] = useState<RouteMode>('unified');
  const [pageToggles, setPageToggles] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!settings) {return;}
    setRouteMode('unified');
    const nextToggles: Record<string, boolean> = {};
    TRUST_PAGES.forEach((page) => {
      const value = settings[page.key];
      nextToggles[page.key] = typeof value === 'boolean' ? value : true;
    });
    setPageToggles(nextToggles);
  }, [settings]);

  const hasChanges = useMemo(() => {
    if (!settings) {return false;}
    if (settings.ia_route_mode !== 'unified') {return true;}
    if (settings.ia_auto_resolve_slug !== true) {return true;}
    return TRUST_PAGES.some((page) => {
      const current = typeof settings[page.key] === 'boolean' ? settings[page.key] : true;
      return current !== pageToggles[page.key];
    });
  }, [pageToggles, routeMode, settings]);

  const routeModeLabel = 'hợp nhất';

  const iaTreePreview = useMemo(() => {
    const baseRoutes = ['/', '/contact', '/promotions', '/stores'];
    const trustRoutes = TRUST_PAGES
      .filter((page) => pageToggles[page.key] ?? true)
      .map((page) => page.slug);
    const moduleRoutes = ['/{category}', '/{category}/{record}'];

    return {
      baseRoutes,
      moduleRoutes,
      trustRoutes,
    };
  }, [pageToggles, routeMode]);

  const handleSave = async () => {
    if (!hasChanges) {return;}
    setIsSaving(true);
    try {
      await saveSettings({
        settings: [
          { group: 'ia', key: 'ia_route_mode', value: routeMode },
          { group: 'ia', key: 'ia_auto_resolve_slug', value: true },
          ...TRUST_PAGES.map((page) => ({
            group: 'ia',
            key: page.key,
            value: pageToggles[page.key] ?? true,
          })),
        ],
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveConflicts = async () => {
    setIsResolving(true);
    try {
      await resolveConflicts({ scope: 'all' });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Kiến trúc thông tin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý chế độ URL, trang tin cậy và xung đột slug theo chuẩn SEO.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chế độ URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
            <p className="font-medium">Canonical URL: /{'{'}categorySlug{'}'}/{'{'}recordSlug{'}'}</p>
            <p className="mt-1 text-xs">Các route /products, /posts, /services chỉ giữ vai trò legacy redirect để không mất traffic cũ.</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Slug trùng sẽ luôn được cảnh báo trong mục xung đột bên dưới. Khi bấm xử lý, hệ thống tự thêm hậu tố an toàn như <span className="font-mono">-1</span>, <span className="font-mono">-2</span> để giữ URL duy nhất.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trang tin cậy (Công khai)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Bật/tắt hiển thị đường dẫn trang tin cậy.</span>
            <Link href="/admin/trust-pages" className="font-medium text-blue-600 hover:underline">
              Quản trị nội dung tại /admin/trust-pages
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRUST_PAGES.map((page) => (
              <div key={page.key} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div>
                  <p className="font-medium">{page.label}</p>
                  <p className="text-xs text-slate-500">{page.slug}</p>
                </div>
                <Checkbox
                  checked={pageToggles[page.key] ?? true}
                  onCheckedChange={(value) => setPageToggles((prev) => ({ ...prev, [page.key]: Boolean(value) }))}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Xem trước cây IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">Đường dẫn cốt lõi</p>
            <div className="flex flex-wrap gap-2">
              {iaTreePreview.baseRoutes.map((route) => (
                <Badge key={route} variant="secondary">{route}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">Đường dẫn theo module ({routeModeLabel})</p>
            <div className="flex flex-wrap gap-2">
              {iaTreePreview.moduleRoutes.map((route) => (
                <Badge key={route} variant="outline">{route}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">Đường dẫn tin cậy</p>
            <div className="flex flex-wrap gap-2">
              {iaTreePreview.trustRoutes.length > 0 ? (
                iaTreePreview.trustRoutes.map((route) => (
                  <Badge key={route} variant="secondary">{route}</Badge>
                ))
              ) : (
                <p className="text-slate-500">Chưa bật đường dẫn tin cậy nào.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Xung đột slug
            {conflicts && conflicts.length > 0 && <Badge variant="warning">{conflicts.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conflicts === undefined && <p className="text-sm text-slate-500">Đang tải...</p>}
          {conflicts && conflicts.length === 0 && (
            <p className="text-sm text-slate-500">Không có xung đột slug.</p>
          )}
          {conflicts && conflicts.length > 0 && (
            <div className="space-y-3">
              {conflicts.map((conflict: SlugConflict) => (
                <div key={`${conflict.scope}-${conflict.slug}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conflict.slug}</p>
                      <p className="text-xs text-slate-500">Phạm vi: {conflict.scope}</p>
                    </div>
                    {conflict.reserved && <Badge variant="destructive">Bảo lưu</Badge>}
                  </div>
                  <ul className="mt-2 text-xs text-slate-500 space-y-1">
                    {conflict.items.map((item: SlugConflictItem) => (
                      <li key={item.id}>{item.label} · {item.table}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <Button variant="outline" onClick={handleResolveConflicts} disabled={isResolving}>
                {isResolving ? 'Đang xử lý...' : 'Tự động xử lý tất cả xung đột'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Đang lưu...' : hasChanges ? 'Lưu thay đổi' : 'Đã lưu'}
        </Button>
      </div>
    </div>
  );
}

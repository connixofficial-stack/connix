'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { Download, FileUp, Loader2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Checkbox } from '@/app/admin/components/ui';
import { BundleReportViewer } from './BundleReportViewer';
import { createZipFromPayload, parseBundleFile, type ParsedMediaFile } from '@/lib/migration-bundle/client';
import type { BundleImportReport, MigrationBundlePayload, MigrationModule } from '@/lib/migration-bundle/types';

const MODULE_OPTIONS: Array<{ key: MigrationModule; label: string }> = [
  { key: 'settings', label: 'Settings' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'posts', label: 'Posts' },
  { key: 'menus', label: 'Menus' },
  { key: 'home-components', label: 'Home Components' },
];

const defaultModules = MODULE_OPTIONS.map((item) => item.key);

type ParsedBundle = {
  payload: MigrationBundlePayload;
  fileName: string;
  mediaFiles: ParsedMediaFile[];
};

export function MigrationBundleCard() {
  const [selectedModules, setSelectedModules] = useState<MigrationModule[]>(defaultModules);
  const exportBundle = useQuery(api.migrationBundles.exportBundle, { modules: selectedModules.length > 0 ? selectedModules : defaultModules });
  const preflightBundle = useMutation(api.migrationBundles.preflightBundle);
  const importBundle = useMutation(api.migrationBundles.importBundle);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const cleanupImportedBinOrphans = useMutation(api.storage.cleanupImportedBinOrphans);
  const [importMode, setImportMode] = useState<'full' | 'partial'>('full');
  const [isExporting, setIsExporting] = useState(false);
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedBundle, setParsedBundle] = useState<ParsedBundle | null>(null);
  const [report, setReport] = useState<BundleImportReport | null>(null);
  const [targetModules, setTargetModules] = useState<string[]>([]);

  const exportCounts = useMemo(() => {
    if (!exportBundle?.manifest?.counts) {
      return [] as Array<{ key: string; value: number }>;
    }
    return Object.entries(exportBundle.manifest.counts).map(([key, value]) => ({ key, value }));
  }, [exportBundle]);

  const toggleModule = (module: MigrationModule, checked: boolean) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(module);
      } else {
        next.delete(module);
      }
      return Array.from(next);
    });
  };

  const buildBlobDownload = (content: BlobPart, fileName: string, mimeType = 'application/json') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!exportBundle) {
      toast.error('Dữ liệu export chưa sẵn sàng');
      return;
    }
    setIsExporting(true);
    try {
      const payload = { ...exportBundle, manifest: { ...exportBundle.manifest, selectedModules } };
      const zipBlob = await createZipFromPayload(payload as MigrationBundlePayload);
      buildBlobDownload(zipBlob, `migration-bundle-${new Date().toISOString().slice(0, 10)}.zip`, 'application/zip');
      toast.success('Đã export bundle ZIP');
    } catch (error) {
      console.error(error);
      toast.error('Export bundle thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const parsed = await parseBundleFile(file);
      setParsedBundle({ payload: parsed.payload, fileName: parsed.fileName, mediaFiles: parsed.mediaFiles });
      setReport(null);
      setTargetModules([]);
      toast.success(`Đã tải bundle: ${file.name}`);
    } catch (error) {
      console.error(error);
      toast.error('File bundle không hợp lệ');
      setParsedBundle(null);
    }
  };

  const handlePreflight = async () => {
    if (!parsedBundle) {
      toast.error('Vui lòng chọn bundle trước');
      return;
    }

    setIsPreflighting(true);
    try {
      const result = await preflightBundle({
        mode: importMode,
        payload: parsedBundle.payload,
        selectedModules,
      });
      setReport(result.report as BundleImportReport);
      setTargetModules(result.targetModules);
      if ((result.report as BundleImportReport).summary.blocking > 0) {
        toast.error('Preflight phát hiện lỗi blocking');
      } else {
        toast.success('Preflight thành công');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Preflight thất bại');
    } finally {
      setIsPreflighting(false);
    }
  };

  const handleImport = async () => {
    if (!parsedBundle) {
      toast.error('Vui lòng chọn bundle trước');
      return;
    }

    if (!report) {
      toast.error('Vui lòng chạy preflight trước import');
      return;
    }

    setIsImporting(true);
    try {
      const uploadedMediaMap: Record<string, { url: string; storageId?: string | null }> = {};
      for (const media of parsedBundle.mediaFiles) {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': media.file.type || 'application/octet-stream' },
          body: media.file,
        });
        if (!response.ok) {
          throw new Error(`Upload media thất bại: ${media.logicalPath}`);
        }
        const body = await response.json() as { storageId: string };
        const saved = await saveImage({
          storageId: body.storageId as Id<'_storage'>,
          filename: media.file.name,
          folder: media.logicalPath.split('/').slice(0, -1).join('/'),
          mimeType: media.file.type || 'application/octet-stream',
          size: media.file.size,
        });
        uploadedMediaMap[media.logicalPath] = {
          url: saved.url ?? media.logicalPath,
          storageId: body.storageId,
        };
      }
      const result = await importBundle({
        mode: importMode,
        payload: parsedBundle.payload,
        selectedModules,
        uploadedMediaMap,
      });
      setReport((result.report as BundleImportReport) ?? report);
      if (!result.applied) {
        toast.error('Import bị chặn do lỗi blocking');
      } else {
        const cleanup = await cleanupImportedBinOrphans({});
        toast.success(`Import thành công: +${result.result.created} created, +${result.result.updated} updated`);
        if (cleanup.deleted > 0) {
          toast.success(`Đã dọn ${cleanup.deleted} file .bin dư`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Import thất bại');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg">Migration Bundle</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="info">6 modules</Badge>
            <Badge variant="outline">/system/data</Badge>
          </div>
        </div>
        <p className="text-sm text-slate-500">Export/Import dữ liệu lõi giữa các project core. Bundle chuẩn là thư mục + index + reports và có thể đóng gói ZIP để chuyển dự án.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Chọn module</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MODULE_OPTIONS.map((module) => (
              <label key={module.key} className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Checkbox
                  checked={selectedModules.includes(module.key)}
                  onCheckedChange={(checked) => toggleModule(module.key, checked)}
                />
                <span>{module.label}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {exportCounts.map((item) => (
              <Badge key={item.key} variant="secondary">{item.key}: {item.value}</Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="accent" onClick={() => { void handleExport(); }} disabled={isExporting || selectedModules.length === 0}>
            {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
            Export Bundle
          </Button>

          <label className="inline-flex">
            <input type="file" accept="application/json,application/zip,.zip,.json" className="hidden" onChange={(event) => { void handleFileChange(event); }} />
            <Button type="button" variant="outline" onClick={(event) => {
              const input = (event.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement | null);
              input?.click();
            }}>
              <FileUp size={16} className="mr-2" />
              Import Bundle (ZIP/JSON)
            </Button>
          </label>
        </div>

        {parsedBundle ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <PackageCheck size={16} />
              <span className="font-medium">Bundle đã chọn:</span>
              <span>{parsedBundle.fileName}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'full'}
                  onChange={() => setImportMode('full')}
                />
                Import all
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'partial'}
                  onChange={() => setImportMode('partial')}
                />
                Import selected modules
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => { void handlePreflight(); }} disabled={isPreflighting || isImporting}>
                {isPreflighting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Run Preflight
              </Button>
              <Button type="button" variant="accent" onClick={() => { void handleImport(); }} disabled={isImporting || isPreflighting || !report || report.summary.blocking > 0}>
                {isImporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Start Import
              </Button>
            </div>

            {targetModules.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500">Modules sẽ import:</span>
                {targetModules.map((module) => (
                  <Badge key={module} variant="outline">{module}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <BundleReportViewer report={report} title="Import preflight report" />
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { AlertTriangle, CheckCircle2, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { CustomSeedDialog } from '@/components/modules/CustomSeedDialog';
import { getSeedModuleInfo } from '@/lib/modules/seed-registry';
import { Card, Badge, Button } from '@/app/admin/components/ui';
import { DependencyTree } from './DependencyTree';
import { FactoryResetDialog } from './FactoryResetDialog';
import { QuickActionsCard } from './QuickActionsCard';
import { SeedWizardDialog } from './SeedWizardDialog';
import { TableDetailsCard } from './TableDetailsCard';
import { MigrationBundleCard } from './import-export/MigrationBundleCard';

type PresetType = 'minimal' | 'standard' | 'large' | 'demo';
type ContractFieldIssue = {
  count: number;
  field: string;
  sampleIds: string[];
};
type ContractTableResult = {
  deprecatedFields: ContractFieldIssue[];
  extraFields: ContractFieldIssue[];
  label: string;
  missingRecommended: ContractFieldIssue[];
  missingRequired: ContractFieldIssue[];
  scanned: number;
  status: 'critical' | 'empty' | 'ok' | 'warning';
  table: string;
  totalIssues: number;
};
type ContractScanResult = {
  runId: number;
  sampleSize: number;
  summary: {
    critical: number;
    empty: number;
    ok: number;
    scannedRecords: number;
    tables: number;
    totalIssues: number;
    warnings: number;
  };
  tables: ContractTableResult[];
};

function formatIssueList(issues: ContractFieldIssue[]) {
  return issues.map((issue) => `${issue.field} (${issue.count})`).join(', ');
}

function DataContractAuditCard({
  isLoading,
  onRun,
  scan,
}: {
  isLoading: boolean;
  onRun: () => void;
  scan?: ContractScanResult;
}) {
  const issueTables = scan?.tables.filter((table) => table.totalIssues > 0).slice(0, 6) ?? [];
  const hasCritical = (scan?.summary.critical ?? 0) > 0;
  const hasWarnings = (scan?.summary.warnings ?? 0) > 0;
  const hasEmptyTables = (scan?.summary.empty ?? 0) > 0;
  const statusBadge = !scan
    ? <Badge variant="secondary">Chưa quét</Badge>
    : hasCritical
      ? <Badge variant="destructive">Có lỗi critical</Badge>
      : hasWarnings
        ? <Badge variant="warning">Có cảnh báo</Badge>
        : hasEmptyTables
          ? <Badge variant="secondary">Có bảng rỗng</Badge>
          : <Badge variant="success">Sạch</Badge>;

  return (
    <Card className="p-4 border border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck size={18} className="text-amber-600" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Data Contract Check</h3>
            {statusBadge}
          </div>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Quét dữ liệu thật theo contract hiện tại để phát hiện thiếu field, field dư, field deprecated và nợ migration trước khi code phải fallback legacy.
          </p>
          {scan && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{scan.summary.tables} tables</Badge>
              <Badge variant="secondary">{scan.summary.scannedRecords.toLocaleString()} records scanned</Badge>
              <Badge variant={scan.summary.critical > 0 ? 'destructive' : 'secondary'}>{scan.summary.critical} critical</Badge>
              <Badge variant={scan.summary.warnings > 0 ? 'warning' : 'secondary'}>{scan.summary.warnings} warnings</Badge>
              <Badge variant={scan.summary.empty > 0 ? 'warning' : 'secondary'}>{scan.summary.empty} empty</Badge>
              <Badge variant="secondary">sample {scan.sampleSize}/table</Badge>
            </div>
          )}
        </div>

        <Button type="button" variant="outline" onClick={onRun} disabled={isLoading}>
          {isLoading ? <RefreshCw size={14} className="mr-2 animate-spin" /> : <CheckCircle2 size={14} className="mr-2" />}
          {isLoading ? 'Đang quét...' : 'Check data contract'}
        </Button>
      </div>

      {scan && issueTables.length > 0 && (
        <div className="mt-4 space-y-2">
          {issueTables.map((table) => (
            <div key={table.table} className="rounded-lg border border-amber-200 bg-white p-3 text-sm dark:border-amber-900 dark:bg-slate-950">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">{table.label}</span>
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">{table.table}</code>
                <Badge variant={table.status === 'critical' ? 'destructive' : 'warning'}>{table.totalIssues} issues</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {table.missingRequired.length > 0 && <p>Thiếu bắt buộc: {formatIssueList(table.missingRequired)}</p>}
                {table.missingRecommended.length > 0 && <p>Thiếu migration/recommended: {formatIssueList(table.missingRecommended)}</p>}
                {table.extraFields.length > 0 && <p>Field dư: {formatIssueList(table.extraFields)}</p>}
                {table.deprecatedFields.length > 0 && <p>Field deprecated còn tồn tại: {formatIssueList(table.deprecatedFields)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {scan && issueTables.length === 0 && (
        <p className="mt-4 text-sm text-green-700 dark:text-green-300">
          Không phát hiện lệch contract trong phạm vi quét{scan.summary.empty > 0 ? `; ${scan.summary.empty} bảng rỗng chưa đủ dữ liệu để kết luận.` : '.'}
        </p>
      )}
    </Card>
  );
}

export function DataCommandCenter() {
  const dependencyTree = useQuery(api.seedManager.getDependencyTree);
  const tableStats = useQuery(api.dataManager.getTableStats);
  const [contractScanRunId, setContractScanRunId] = useState<number | null>(null);
  const contractScan = useQuery(
    api.dataManager.scanDataContracts,
    contractScanRunId ? { runId: contractScanRunId, sampleSize: 100 } : 'skip'
  );

  const seedPreset = useMutation(api.seedManager.seedPreset);
  const seedModule = useMutation(api.seedManager.seedModule);
  const clearModule = useMutation(api.seedManager.clearModule);
  const clearAll = useMutation(api.seedManager.clearAll);
  const factoryResetStep = useMutation(api.seedManager.factoryResetStep);
  const seedAllModulesConfig = useAction(api.seed.seedAllModulesConfig);

  const [seedingModule, setSeedingModule] = useState<string | null>(null);
  const [clearingModule, setClearingModule] = useState<string | null>(null);
  const [isGlobalSeeding, setIsGlobalSeeding] = useState(false);
  const [isGlobalClearing, setIsGlobalClearing] = useState(false);
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showSeedWizard, setShowSeedWizard] = useState(false);
  const [showFactoryResetDialog, setShowFactoryResetDialog] = useState(false);
  const [resetProgress, setResetProgress] = useState<null | { current: number; label: string; total: number }>(null);

  const stats = useMemo(() => {
    const totalTables = tableStats?.length ?? 0;
    const totalRecords = tableStats?.reduce((sum, item) => sum + item.count, 0) ?? 0;
    const emptyTables = tableStats?.filter((item) => item.count === 0).length ?? 0;
    return { emptyTables, totalRecords, totalTables };
  }, [tableStats]);

  const handleSeedPreset = async (preset: PresetType) => {
    if (!confirm(`Seed preset "${preset}"?`)) {
      return;
    }
    setIsGlobalSeeding(true);
    setCurrentPreset(preset);
    try {
      await seedPreset({ preset });
      toast.success(`Đã seed preset ${preset}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại');
    } finally {
      setIsGlobalSeeding(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Xóa toàn bộ dữ liệu + toàn bộ storage? Không thể hoàn tác.')) {
      return;
    }
    const confirmText = prompt('Nhập CHAC CHAN để xóa cả storage');
    if ((confirmText ?? '').trim().toLowerCase() !== 'chac chan') {
      return;
    }
    setIsGlobalClearing(true);
    try {
      await clearAll({ excludeSystem: false, forceStorageCleanup: true });
      toast.success('Đã xóa toàn bộ dữ liệu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Clear thất bại');
    } finally {
      setIsGlobalClearing(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('Reset = Clear + Seed lại + xóa cả storage. Tiếp tục?')) {
      return;
    }
    const confirmText = prompt('Nhập CHAC CHAN để xóa cả storage');
    if ((confirmText ?? '').trim().toLowerCase() !== 'chac chan') {
      return;
    }
    const presetToUse = (currentPreset ?? 'standard') as PresetType;
    setIsGlobalClearing(true);
    setIsGlobalSeeding(true);
    try {
      await clearAll({ excludeSystem: false, forceStorageCleanup: true });
      await seedPreset({ preset: presetToUse, force: true });
      toast.success(`Đã reset với preset ${presetToUse}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reset thất bại');
    } finally {
      setIsGlobalClearing(false);
      setIsGlobalSeeding(false);
    }
  };

  const handleFactoryReset = async () => {
    setIsFactoryResetting(true);
    try {
      let nextIndex: number | null = 0;
      let guard = 0;
      while (nextIndex !== null) {
        const result: {
          completed: boolean;
          currentIndex: number;
          deleted: number;
          nextIndex: number | null;
          table: string | null;
          totalTables: number;
          storageDeleted?: number;
        } = await factoryResetStep({ tableIndex: nextIndex });
        const storageInfo = result.storageDeleted ? ` (storage +${result.storageDeleted})` : '';
        const progressLabel = result.table
          ? `Đang xóa: ${result.table}${storageInfo}`
          : 'Đang hoàn tất';
        setResetProgress({
          current: Math.min(result.currentIndex, result.totalTables),
          label: progressLabel,
          total: result.totalTables,
        });
        if (result.completed) {
          break;
        }
        nextIndex = result.nextIndex;
        guard += 1;
        if (guard > 10000) {
          throw new Error('Factory reset vượt quá giới hạn an toàn');
        }
      }

      setResetProgress({
        current: 1,
        label: 'Khởi tạo cấu hình hệ thống',
        total: 1,
      });
      await seedAllModulesConfig({});

      toast.success('Đã xóa sạch toàn bộ dữ liệu');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Factory reset thất bại');
      return false;
    } finally {
      setIsFactoryResetting(false);
      setResetProgress(null);
    }
  };

  const handleRunDataContractScan = () => {
    setContractScanRunId(Date.now());
    toast.info('Đang quét data contract');
  };

  const handleSeedModule = async (moduleKey: string) => {
    const defaultQuantity = getSeedModuleInfo(moduleKey)?.defaultQuantity ?? 10;
    setSeedingModule(moduleKey);
    try {
      await seedModule({ module: moduleKey, quantity: defaultQuantity });
      toast.success(`Đã seed ${moduleKey}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại');
    } finally {
      setSeedingModule(null);
    }
  };

  const handleClearModule = async (moduleKey: string) => {
    if (!confirm(`Clear dữ liệu module ${moduleKey}?`)) {
      return;
    }
    setClearingModule(moduleKey);
    try {
      await clearModule({ module: moduleKey });
      toast.success(`Đã clear ${moduleKey}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Clear thất bại');
    } finally {
      setClearingModule(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database size={22} className="text-cyan-500" /> Data Command Center
          </h2>
          <p className="text-sm text-slate-500">Quản lý toàn bộ dữ liệu hệ thống từ một nơi</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{stats.totalTables} tables</Badge>
          <Badge variant="secondary">{stats.totalRecords.toLocaleString()} records</Badge>
          <Badge variant="secondary">{stats.emptyTables} empty</Badge>
        </div>
      </div>

      <QuickActionsCard
        onSeedPreset={handleSeedPreset}
        onClearAll={handleClearAll}
        onResetAll={handleResetAll}
        onFactoryReset={() => setShowFactoryResetDialog(true)}
        onOpenCustomDialog={() => setShowCustomDialog(true)}
        onOpenSeedWizard={() => setShowSeedWizard(true)}
        isSeeding={isGlobalSeeding}
        isClearing={isGlobalClearing}
        isFactoryResetting={isFactoryResetting}
        currentPreset={currentPreset}
      />

      <MigrationBundleCard />

      <DataContractAuditCard
        scan={contractScan as ContractScanResult | undefined}
        isLoading={contractScanRunId !== null && contractScan === undefined}
        onRun={handleRunDataContractScan}
      />

      {dependencyTree && (
        <DependencyTree
          data={dependencyTree}
          seedingModule={seedingModule}
          clearingModule={clearingModule}
          onSeedModule={handleSeedModule}
          onClearModule={handleClearModule}
        />
      )}

      {tableStats && (
        <TableDetailsCard
          tableStats={tableStats}
          seedingTable={seedingModule}
          clearingTable={clearingModule}
          onSeedTable={handleSeedModule}
          onClearTable={handleClearModule}
        />
      )}

      <Card className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
          <AlertTriangle size={16} className="mt-0.5" />
          <div className="space-y-1">
            <p>Seed tự động theo thứ tự dependency (Level 0 → 4).</p>
            <p>Clear tự động theo thứ tự ngược (Level 4 → 0) để tránh broken relation.</p>
            <p>Factory reset yêu cầu xác nhận 2 bước, dùng cẩn thận ở production.</p>
          </div>
        </div>
      </Card>

      <CustomSeedDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onComplete={() => setShowCustomDialog(false)}
      />

      <SeedWizardDialog
        open={showSeedWizard}
        onOpenChange={setShowSeedWizard}
        onComplete={() => setShowSeedWizard(false)}
      />

      <FactoryResetDialog
        open={showFactoryResetDialog}
        onOpenChange={setShowFactoryResetDialog}
        onConfirm={handleFactoryReset}
        isLoading={isFactoryResetting}
        progress={resetProgress}
      />
    </div>
  );
}

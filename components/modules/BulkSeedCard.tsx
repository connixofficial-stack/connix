/**
 * Bulk Seed Card Component
 * 
 * Allows users to seed all modules at once with preset configurations
 */

'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { 
  Database, 
  Loader2, 
  Settings, 
  Zap,
  Package,
  Rocket,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button, Card, Progress } from '@/app/admin/components/ui';

interface BulkSeedCardProps {
  onSeedComplete?: () => void;
  onOpenCustomDialog?: () => void;
}

type PresetType = 'minimal' | 'standard' | 'large' | 'demo';
type SeedResultItem = { created: number; errors?: string[] };

const PRESETS: Array<{
  key: PresetType;
  name: string;
  description: string;
  icon: React.ElementType;
  qty: string;
  color: string;
}> = [
  {
    color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
    description: 'Test nhanh với ít data',
    icon: Zap,
    key: 'minimal',
    name: 'Minimal',
    qty: '5-10',
  },
  {
    color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
    description: 'Chuẩn cho development',
    icon: Package,
    key: 'standard',
    name: 'Standard',
    qty: '20-30',
  },
  {
    color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
    description: 'Test performance với data lớn',
    icon: Rocket,
    key: 'large',
    name: 'Large',
    qty: '100+',
  },
  {
    color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    description: 'Realistic data cho demo',
    icon: Sparkles,
    key: 'demo',
    name: 'Demo',
    qty: '50',
  },
];

export function BulkSeedCard({ onSeedComplete, onOpenCustomDialog }: BulkSeedCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState('');

  const seedPreset = useMutation(api.seedManager.seedPreset);
  const presetMetadata = useQuery(api.seedManager.listSeedPresets);

  const presets = useMemo(() => {
    return PRESETS.map((preset) => {
      const metadata = presetMetadata?.find((item) => item.key === preset.key);
      return {
        ...preset,
        description: metadata?.description ?? preset.description,
        name: metadata?.name ?? preset.name,
      };
    });
  }, [presetMetadata]);

  const handleSeedPreset = async (preset: PresetType) => {
    if (!confirm(`Seed preset "${preset}"?\nSẽ tạo dữ liệu mẫu cho tất cả modules.`)) {
      return;
    }

    setIsSeeding(true);
    setIsOpen(true);
    setProgress(0);
    
    try {
      const toastId = toast.loading(`Đang seed preset ${preset}...`);
      
      const results = await seedPreset({ force: false, preset }) as SeedResultItem[];
      
      // Calculate progress
      const totalModules = results.length;
      const successModules = results.filter((result) => !result.errors || result.errors.length === 0).length;
      const totalCreated = results.reduce((sum, result) => sum + result.created, 0);
      
      setProgress(100);
      
      toast.success(
        `✅ Seed hoàn tất!\n${successModules}/${totalModules} modules • ${totalCreated} records`,
        { id: toastId }
      );
      
      onSeedComplete?.();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Seed thất bại');
    } finally {
      setIsSeeding(false);
      setProgress(0);
      setCurrentModule('');
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Database className="w-5 h-5 text-cyan-500" />
            Bulk Seed Data
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Seed tất cả modules cùng lúc với preset hoặc tùy chỉnh
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Preset là bộ cấu hình mẫu để seed nhanh; số lượng là ước tính.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(prev => !prev)}
          className="gap-2"
          aria-expanded={isOpen}
          aria-controls="bulk-seed-content"
        >
          {isOpen ? 'Thu gọn' : 'Mở'}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      <div id="bulk-seed-content" className={`${isOpen || isSeeding ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {presets.map(preset => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.key}
                onClick={() => handleSeedPreset(preset.key)}
                disabled={isSeeding}
                className={`
                  relative p-4 rounded-lg border border-slate-200 dark:border-slate-700
                  ${preset.color}
                  transition-all duration-200
                  hover:scale-105 hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  text-left
                `}
              >
                <Icon className="w-6 h-6 mb-2" />
                <div className="font-semibold mb-1">{preset.name}</div>
                <div className="text-xs opacity-75 mb-2">{preset.description}</div>
                <div className="text-xs font-mono opacity-60">{preset.qty} records</div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={() => onOpenCustomDialog?.()}
          variant="outline"
          className="w-full border-dashed"
          disabled={isSeeding}
        >
          <Settings className="w-4 h-4 mr-2" />
          Tùy chỉnh chi tiết...
        </Button>

        {isSeeding && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentModule || 'Đang xử lý...'}
              </span>
              <span className="font-mono text-slate-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
          <p className="text-xs text-cyan-800 dark:text-cyan-400">
            💡 <strong>Tip:</strong> Dependencies sẽ được seed tự động. Ví dụ: Orders sẽ tự động seed Products và Customers nếu chưa có.
          </p>
        </div>
      </div>
    </Card>
  );
}

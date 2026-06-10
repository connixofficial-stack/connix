'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Database, FileText, Globe, Settings, ShoppingCart, Users } from 'lucide-react';
import { Card, Button } from '@/app/admin/components/ui';
import { SEED_MODULE_METADATA } from '@/lib/modules/seed-registry';
import { TableRow } from './TableRow';

interface TableDetailsCardProps {
  tableStats: Array<{ table: string; count: number; category: string; isApproximate: boolean }>;
  seedingTable: string | null;
  clearingTable: string | null;
  onSeedTable: (table: string) => void;
  onClearTable: (table: string) => void;
}

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  commerce: ShoppingCart,
  config: Settings,
  content: FileText,
  system: Settings,
  user: Users,
  website: Globe,
};

const categoryLabels: Record<string, string> = {
  commerce: 'Commerce',
  config: 'Config',
  content: 'Content',
  logs: 'Logs',
  marketing: 'Marketing',
  media: 'Media',
  system: 'System',
  user: 'User',
  website: 'Website',
};

export function TableDetailsCard({
  tableStats,
  seedingTable,
  clearingTable,
  onSeedTable,
  onClearTable,
}: TableDetailsCardProps) {
  const grouped = useMemo(() => {
    return tableStats.reduce<Record<string, typeof tableStats>>((acc, stat) => {
      if (!acc[stat.category]) {
        acc[stat.category] = [];
      }
      acc[stat.category].push(stat);
      return acc;
    }, {});
  }, [tableStats]);

  const [expanded, setExpanded] = useState<string[]>(['system', 'content', 'commerce']);

  const handleToggle = (category: string) => {
    setExpanded((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const expandAll = () => setExpanded(Object.keys(grouped));
  const collapseAll = () => setExpanded([]);

  return (
    <Card className="p-5 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database size={16} className="text-cyan-500" /> Table Details
          </h3>
          <p className="text-xs text-slate-500">Chi tiết từng bảng, seed/clear nhanh</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={expandAll}>
            Expand All
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll}>
            Collapse
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([category, tables]) => {
          const Icon = categoryIcons[category] ?? Database;
          const isOpen = expanded.includes(category);
          const totalRecords = tables.reduce((sum, item) => sum + item.count, 0);
          return (
            <div key={category} className="border border-slate-200 dark:border-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleToggle(category)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Icon size={14} className="text-slate-500" />
                  {categoryLabels[category] ?? category}
                  <span className="text-xs font-normal text-slate-500">
                    ({tables.length} tables · {totalRecords.toLocaleString()} records)
                  </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-3">
                  {tables.map((table) => {
                    const seedable = Boolean(SEED_MODULE_METADATA[table.table]);
                    return (
                      <TableRow
                        key={table.table}
                        tableName={table.table}
                        count={table.count}
                        isApproximate={table.isApproximate}
                        isSeeding={seedingTable === table.table}
                        isClearing={clearingTable === table.table}
                        onSeed={() => onSeedTable(table.table)}
                        onClear={() => onClearTable(table.table)}
                        seedDisabled={!seedable}
                        clearDisabled={!seedable}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

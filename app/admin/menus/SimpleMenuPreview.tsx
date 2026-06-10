'use client';

import React, { useMemo } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, cn } from '../components/ui';
import { buildMenuTree, type MenuTreeNode } from '@/lib/utils/menu-tree';

type MenuItem = {
  _id: Id<'menuItems'>;
  label: string;
  url: string;
  order: number;
  depth: number;
  active: boolean;
};

export function SimpleMenuPreview({ items }: { items: MenuItem[] }) {
  const tree = useMemo(() => buildMenuTree(items), [items]);

  const renderNodes = (nodes: Array<MenuTreeNode<MenuItem>>) => nodes.map((node) => (
    <div key={node._id} className="space-y-2">
      <div
        className={cn('flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm', !node.active && 'opacity-50')}
        style={{ marginLeft: (node.level - 1) * 16 }}
      >
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Tầng {node.level}</span>
        <span className="font-medium text-slate-800">{node.label}</span>
        <span className="text-xs text-slate-400 truncate">{node.url}</span>
      </div>
      {node.children.length > 0 && renderNodes(node.children)}
    </div>
  ));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye size={16} /> Preview Menu
          </CardTitle>
          <span className="text-sm text-slate-500">
            Xem trước menu website
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tree.length === 0 ? (
          <div className="text-sm text-slate-500">Chưa có menu items.</div>
        ) : (
          renderNodes(tree)
        )}
      </CardContent>
    </Card>
  );
}

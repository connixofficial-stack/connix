'use client';

import React, { useMemo } from 'react';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/admin/components/ui';
import type { SeoChecklistResult } from '@/lib/seo/checklist';

type SeoPromptStudioProps = {
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  llmsUrl: string;
  postsCount: number;
  productsCount: number;
  servicesCount: number;
  landingPagesCount: number;
  checklist: SeoChecklistResult | null;
};

const formatChecklist = (items: SeoChecklistResult['items']): string => {
  if (items.length === 0) {
    return '- Không có mục cần xử lý.';
  }

  return items
    .map((item) => {
      const lines = [
        `- ${item.title} [${item.severity}/${item.status}]`,
        `  Lý do: ${item.whyItMatters}`,
        `  Cách xử lý: ${item.howToFix}`,
      ];
      if (item.steps?.length) {
        lines.push(`  Steps: ${item.steps.join(' → ')}`);
      }
      return lines.join('\n');
    })
    .join('\n');
};

export const SeoPromptStudio = ({
  baseUrl,
  sitemapUrl,
  robotsUrl,
  llmsUrl,
  postsCount,
  productsCount,
  servicesCount,
  landingPagesCount,
  checklist,
}: SeoPromptStudioProps) => {
  const prompt = useMemo(() => {
    const criticalItems = checklist?.criticalItems ?? [];
    const quickWins = checklist?.quickWins ?? [];
    const externalItems = checklist?.externalItems ?? [];

    return `Bạn là SEO strategist.

## Context
- Mục tiêu: tạo checklist + action plan SEO dựa trên dữ liệu thật của hệ thống.
- Website: ${baseUrl || 'Chưa cấu hình'}
- Sitemap: ${sitemapUrl || 'Chưa có'}
- Robots: ${robotsUrl || 'Chưa có'}
- llms.txt: ${llmsUrl || 'Chưa có'}

## Current Data
- Posts published: ${postsCount}
- Products published: ${productsCount}
- Services published: ${servicesCount}
- Landing pages published: ${landingPagesCount}

## Issues - Critical
${formatChecklist(criticalItems)}

## Issues - Quick Wins
${formatChecklist(quickWins)}

## Issues - External Actions
${formatChecklist(externalItems)}

## Tasks
1. Tạo bảng ưu tiên hành động 7 ngày và 30 ngày.
2. Checklist thao tác theo module trong hệ thống (Settings, Posts, Products, Services, Landing Pages).
3. Đề xuất nội dung cần tạo dựa trên thiếu hụt hiện tại (post/service/product/landing).
4. KPI đo lường (index coverage, impressions, CTR, top queries).

## Output Format
- Bảng ưu tiên (7 ngày / 30 ngày).
- Checklist theo module (bullet).
- Danh sách nội dung nên tạo (bullet).
- KPI theo dõi (bullet).

## Constraints
- Không bịa dữ liệu ngoài phần Current Data.
- Giải pháp phải khả thi trong admin hiện có.
`;
  }, [
    baseUrl,
    checklist,
    landingPagesCount,
    llmsUrl,
    postsCount,
    productsCount,
    robotsUrl,
    servicesCount,
    sitemapUrl,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Đã copy prompt');
    } catch {
      toast.error('Không thể copy, hãy thử lại');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Sparkles size={18} className="text-cyan-600" />
          <h4 className="font-semibold">Prompt Studio</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy size={14} className="mr-2" /> Copy prompt
          </Button>
          <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink size={14} className="mr-2" /> ChatGPT
            </Button>
          </a>
          <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink size={14} className="mr-2" /> Claude
            </Button>
          </a>
        </div>
      </div>

      <textarea
        className="w-full min-h-[220px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200"
        readOnly
        value={prompt}
      />

      <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Dữ liệu đang dùng</p>
        <div className="grid gap-1">
          <div>Domain: {baseUrl || 'Chưa cấu hình'}</div>
          <div>Sitemap: {sitemapUrl || 'Chưa có'}</div>
          <div>Robots: {robotsUrl || 'Chưa có'}</div>
          <div>llms.txt: {llmsUrl || 'Chưa có'}</div>
          <div>Posts: {postsCount} · Products: {productsCount} · Services: {servicesCount} · Landing pages: {landingPagesCount}</div>
        </div>
      </div>
    </div>
  );
};

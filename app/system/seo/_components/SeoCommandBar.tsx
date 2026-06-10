'use client';

import Link from 'next/link';
import { ExternalLink, Link as LinkIcon, Copy, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/admin/components/ui';

type SeoCommandBarProps = {
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  llmsUrl: string;
};

export const SeoCommandBar = ({ baseUrl, sitemapUrl, robotsUrl, llmsUrl }: SeoCommandBarProps) => {
  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã copy ${label}`);
    } catch {
      toast.error('Không thể copy, hãy thử lại');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <a href={baseUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">
            <ExternalLink size={14} className="mr-2" />
            Mở Homepage
          </Button>
        </a>
        <Link href="/admin/settings" target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="sm">Mở Settings</Button>
        </Link>
        <Link href="/system/seo?tab=landing-pages" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Landing Pages</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a href={sitemapUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <LinkIcon size={14} className="mr-2" />
            Mở Sitemap
          </Button>
        </a>
        <a href={robotsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <LinkIcon size={14} className="mr-2" />
            Mở Robots
          </Button>
        </a>
        <a href={llmsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <LinkIcon size={14} className="mr-2" />
            Mở llms.txt
          </Button>
        </a>
        <Button variant="ghost" size="sm" onClick={() => copyText(baseUrl, 'domain')}>
          <Copy size={14} className="mr-2" /> Copy domain
        </Button>
        <Button variant="ghost" size="sm" onClick={() => copyText(sitemapUrl, 'sitemap URL')}>
          <Copy size={14} className="mr-2" /> Copy sitemap
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <MoreHorizontal size={14} />
          <span>Mở nhanh module</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/posts" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Posts</Button>
        </Link>
        <Link href="/admin/products" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Products</Button>
        </Link>
        <Link href="/admin/services" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">Services</Button>
        </Link>
      </div>
    </div>
  );
};

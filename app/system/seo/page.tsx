'use client';

import { Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SeoHealthPanel } from '@/components/seo/SeoHealthPanel';
import { useSeoChecklist } from '@/components/seo/useSeoChecklist';
import { LandingPagesPanel } from './_components/LandingPagesPanel';
import { SeoCommandBar } from './_components/SeoCommandBar';
import { SeoCriticalActions } from './_components/SeoCriticalActions';
import { SeoQuickWins } from './_components/SeoQuickWins';
import { SeoGuidedActions } from './_components/SeoGuidedActions';
import { SeoOverviewSummary } from './_components/SeoOverviewSummary';
import { SeoSiteVerificationPanel } from './_components/SeoSiteVerificationPanel';

export default function SEOConfigPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  type SeoTab = 'overview' | 'actions' | 'landing-pages';
  const initialTab: SeoTab = tabParam === 'actions' || tabParam === 'landing-pages' ? tabParam : 'overview';
  const [activeTab, setActiveTab] = useState<SeoTab>(initialTab);
  const {
    isLoading,
    baseUrl,
    sitemapUrl,
    robotsUrl,
    llmsUrl,
    checklist,
  } = useSeoChecklist();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Globe size={20} className="text-cyan-600 dark:text-cyan-400" /> SEO Configuration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sitemap và robots.txt được sinh tự động.</p>
      </div>

      <div className="relative z-20 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Tổng quan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'actions'
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Việc cần làm
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('landing-pages')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'landing-pages'
            ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          Landing Pages
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SeoOverviewSummary checklist={checklist} isLoading={isLoading} />
          <SeoCommandBar
            baseUrl={baseUrl}
            sitemapUrl={sitemapUrl}
            robotsUrl={robotsUrl}
            llmsUrl={llmsUrl}
          />
          <SeoSiteVerificationPanel />
          <SeoHealthPanel checklist={checklist} isLoading={isLoading} />
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-6">
          <SeoCriticalActions items={checklist?.criticalItems ?? []} />
          <SeoQuickWins items={checklist?.quickWins ?? []} />
          <SeoGuidedActions items={checklist?.externalItems ?? []} />
        </div>
      )}

      {activeTab === 'landing-pages' && (
        <LandingPagesPanel />
      )}
    </div>
  );
}

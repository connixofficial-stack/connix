'use client';

import React, { useMemo, useState } from 'react';
import { Download, ExternalLink, FileCode, Loader2, RotateCcw, X } from 'lucide-react';
import type { AdminModule, ModuleLabels, SystemPreset } from '../_types';
import { generateConfigMarkdown } from '../_lib/generate-config-markdown';

interface ConfigActionsProps {
  modules: AdminModule[];
  preset?: SystemPreset;
  onReseed: () => void;
  isReseeding?: boolean;
  labels: ModuleLabels;
}

export const ConfigActions: React.FC<ConfigActionsProps> = ({
  modules,
  preset,
  onReseed,
  isReseeding,
  labels,
}) => {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const markdown = useMemo(
    () => generateConfigMarkdown(modules, preset, labels),
    [modules, preset, labels]
  );

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `admin-config-${preset?.key ?? 'custom'}-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={onReseed}
          disabled={isReseeding}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors disabled:opacity-50"
          title={labels.actions.reseedTitle}
        >
          {isReseeding ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          <span className="hidden sm:inline">{labels.actions.reseed}</span>
        </button>
        <button
          onClick={() =>{  setShowMarkdown(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          title={labels.actions.viewConfigTitle}
        >
          <FileCode size={16} />
          <span className="hidden sm:inline">{labels.actions.viewConfig}</span>
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          title={labels.actions.downloadTitle}
        >
          <Download size={16} />
        </button>
        <button
          onClick={handleOpenNewTab}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          title={labels.actions.openNewTabTitle}
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {showMarkdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileCode size={20} /> {labels.actions.moduleConfigTitle}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download size={14} /> {labels.actions.download}
                </button>
                <button
                  onClick={() =>{  setShowMarkdown(false); }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                {markdown}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

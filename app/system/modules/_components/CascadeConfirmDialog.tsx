'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ModuleLabels } from '../_types';

interface CascadeConfirmDialogProps {
  isOpen: boolean;
  moduleKey: string;
  moduleName: string;
  dependentModules: { key: string; name: string }[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  labels: ModuleLabels;
}

export const CascadeConfirmDialog: React.FC<CascadeConfirmDialogProps> = ({
  isOpen,
  moduleName,
  dependentModules,
  onConfirm,
  onCancel,
  isLoading,
  labels,
}) => {
  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {labels.cascadeDialog.title}
            </h3>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {labels.cascadeDialog.description}{' '}
            <strong className="text-slate-800 dark:text-slate-200">{moduleName}</strong>{' '}
            <span className="text-amber-600 dark:text-amber-400 font-medium"> {labels.cascadeDialog.autoDisable} </span>{' '}
            {labels.cascadeDialog.dependentList}
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 mb-4">
            <ul className="space-y-1">
              {dependentModules.map((dep) => (
                <li key={dep.key} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-700 dark:text-slate-300">{dep.name}</span>
                  <span className="text-xs text-slate-400">({dep.key})</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-500 mb-6">
            {labels.cascadeDialog.hint} {moduleName}.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {labels.cascadeDialog.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {labels.cascadeDialog.processing}
                </>
              ) : (
                labels.cascadeDialog.confirm
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

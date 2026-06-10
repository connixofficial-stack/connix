'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/app/admin/components/ui';
import type { BundleImportReport } from '@/lib/migration-bundle/types';

const formatIssueValue = (value: unknown): string => {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

interface BundleReportViewerProps {
  report: BundleImportReport | null;
  title?: string;
}

export function BundleReportViewer({ report, title = 'Báo cáo import' }: BundleReportViewerProps) {
  if (!report) {
    return null;
  }

  const hasIssues = report.errors.length > 0 || report.warnings.length > 0;

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={report.summary.blocking > 0 ? 'destructive' : 'success'}>
              {report.summary.blocking} blocking
            </Badge>
            <Badge variant={report.summary.warnings > 0 ? 'warning' : 'secondary'}>
              {report.summary.warnings} warnings
            </Badge>
          </div>
        </div>
        {report.summary.modulesAffected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {report.summary.modulesAffected.map((module) => (
              <Badge key={module} variant="outline">{module}</Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasIssues ? (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle2 size={18} className="mt-0.5" />
            <div className="text-sm">Không có lỗi blocking hoặc warning.</div>
          </div>
        ) : null}

        {report.errors.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <AlertTriangle size={16} /> Lỗi blocking
            </div>
            <div className="space-y-3">
              {report.errors.map((issue, index) => (
                <IssueCard key={`${issue.code}-${issue.recordKey ?? index}`} issue={issue} />
              ))}
            </div>
          </div>
        ) : null}

        {report.warnings.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <TriangleAlert size={16} /> Warnings
            </div>
            <div className="space-y-3">
              {report.warnings.map((issue, index) => (
                <IssueCard key={`${issue.code}-${issue.recordKey ?? index}`} issue={issue} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function IssueCard({ issue }: { issue: BundleImportReport['errors'][number] }) {
  const isBlocking = issue.severity === 'blocking';
  return (
    <div className={`rounded-lg border p-3 text-sm ${isBlocking ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'}`}>
      <div className="flex items-start gap-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isBlocking ? 'destructive' : 'warning'}>{issue.code}</Badge>
            <Badge variant="outline">{issue.module}</Badge>
            {issue.recordKey ? <Badge variant="outline">{issue.recordKey}</Badge> : null}
          </div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{issue.message}</p>
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 break-all">
            {issue.file ? <div><span className="font-medium">file:</span> {issue.file}</div> : null}
            {issue.indexFile ? <div><span className="font-medium">index:</span> {issue.indexFile}</div> : null}
            {issue.jsonPath ? <div><span className="font-medium">path:</span> {issue.jsonPath}</div> : null}
            {typeof issue.position === 'number' ? <div><span className="font-medium">position:</span> {issue.position}</div> : null}
            {issue.value !== undefined ? <div><span className="font-medium">value:</span> {formatIssueValue(issue.value)}</div> : null}
            {issue.suggestion ? <div><span className="font-medium">suggestion:</span> {issue.suggestion}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

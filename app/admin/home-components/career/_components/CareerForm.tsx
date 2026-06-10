'use client';

import React from 'react';
import { Briefcase, Plus, Settings2, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@/app/admin/components/ui';
import { AiDemoCareerImport } from '../../product-list/_components/AiDemoProductsImport';
import type { JobPosition, CareerTexts } from '../_types';
import { createCareerJob, DEFAULT_CAREER_TEXTS } from '../_lib/constants';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

interface CareerFormProps {
  jobs: JobPosition[];
  onJobsChange: (jobs: JobPosition[]) => void;
  texts: CareerTexts;
  onTextsChange: (texts: CareerTexts) => void;
  defaultExpanded?: boolean;
}

export function CareerForm({
  jobs,
  onJobsChange,
  texts,
  onTextsChange,
  defaultExpanded = true,
}: CareerFormProps) {
  const activeSections = React.useMemo(() => ['settings', 'source'], []);
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(activeSections, defaultExpanded);
  
  const updateJob = (index: number, field: keyof JobPosition, value: string) => {
    onJobsChange(jobs.map((job, idx) => (
      idx === index ? { ...job, [field]: value } : job
    )));
  };

  const handleAddJob = () => {
    onJobsChange([
      ...jobs,
      createCareerJob({
        id: `career-job-${Date.now()}-${jobs.length}`,
        type: 'Full-time',
      }),
    ]);
  };

  const handleRemoveJob = (index: number) => {
    if (jobs.length <= 1) return;
    onJobsChange(jobs.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3">
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />

      <SubSection
        icon={Briefcase}
        title="Vị trí tuyển dụng"
        open={openSections.source}
        onOpenChange={(open) => toggleSection('source', open)}
        badge={`${jobs.length}`}
        actions={(
          <>
            <AiDemoCareerImport onApply={(items: any) => onJobsChange(items as JobPosition[])} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddJob}
              className="gap-2"
            >
              <Plus size={14} /> Thêm vị trí
            </Button>
          </>
        )}
      >
        {jobs.map((job, idx) => (
          <div
            key={job.id ?? `job-${idx}`}
            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label>Vị trí {idx + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500 h-8 w-8"
                onClick={() => handleRemoveJob(idx)}
                disabled={jobs.length <= 1}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Vị trí tuyển dụng"
                value={job.title}
                onChange={(event: any) => updateJob(idx, 'title', event.target.value)}
              />
              <Input
                placeholder="Phòng ban"
                value={job.department}
                onChange={(event: any) => updateJob(idx, 'department', event.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="Địa điểm"
                value={job.location}
                onChange={(event: any) => updateJob(idx, 'location', event.target.value)}
              />
              <select
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                value={job.type}
                onChange={(event: any) => updateJob(idx, 'type', event.target.value)}
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
              <Input
                placeholder="Mức lương"
                value={job.salary}
                onChange={(event: any) => updateJob(idx, 'salary', event.target.value)}
              />
            </div>

            <Input
              placeholder="Mô tả ngắn (tuỳ chọn)"
              value={job.description}
              onChange={(event: any) => updateJob(idx, 'description', event.target.value)}
            />
          </div>
        ))}
      </SubSection>

      <SubSection
        icon={Settings2}
        title="Tùy chỉnh văn bản"
        open={openSections.settings}
        onOpenChange={(open) => toggleSection('settings', open)}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="ctaButton">Nút hành động (CTA)</Label>
            <Input
              id="ctaButton"
              placeholder={DEFAULT_CAREER_TEXTS.ctaButton}
              value={texts.ctaButton || ''}
              onChange={(e: any) => onTextsChange({ ...texts, ctaButton: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="emptyTitle">Tiêu đề trống</Label>
            <Input
              id="emptyTitle"
              placeholder={DEFAULT_CAREER_TEXTS.emptyTitle}
              value={texts.emptyTitle || ''}
              onChange={(e: any) => onTextsChange({ ...texts, emptyTitle: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="emptyDescription">Mô tả trống</Label>
            <Input
              id="emptyDescription"
              placeholder={DEFAULT_CAREER_TEXTS.emptyDescription}
              value={texts.emptyDescription || ''}
              onChange={(e: any) => onTextsChange({ ...texts, emptyDescription: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="remainingLabel">Nhãn còn lại</Label>
            <Input
              id="remainingLabel"
              placeholder={DEFAULT_CAREER_TEXTS.remainingLabel}
              value={texts.remainingLabel || ''}
              onChange={(e: any) => onTextsChange({ ...texts, remainingLabel: e.target.value })}
            />
          </div>
        </div>
      </SubSection>
    </div>
  );
}

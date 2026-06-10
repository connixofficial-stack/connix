'use client';
 
import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { Input, Label } from '../../../components/ui';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { AiCtaImport } from './AiCtaImport';
import type { CTAConfig } from '../_types';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

 
export const CTAForm = ({
  config,
  onChange,
  defaultExpanded = true,
}: {
  config: CTAConfig;
  onChange: (config: CTAConfig) => void;
  defaultExpanded?: boolean;
}) => {
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(
    ['cta'],
    defaultExpanded
  );
 
  return (
    <>
      <FormSectionsToggleAllButton
        hasClosedSection={hasClosedSection}
        onToggleAll={handleToggleAll}
      />
      <div className="mb-6">
        <SubSection
          icon={MousePointerClick}
          title="Nội dung CTA"
          open={openSections.cta}
          onOpenChange={(open) => toggleSection('cta', open)}
          actions={<AiCtaImport onApply={(patch) => onChange({ ...config, ...patch })} />}
          contentClassName="space-y-4"
        >
          <div className="space-y-2">
            <Label>Badge (tùy chọn)</Label>
            <Input
              value={config.badge ?? ''}
              onChange={(e) =>{  onChange({ ...config, badge: e.target.value }); }}
              placeholder="VD: Ưu đãi có hạn, Hot deal, Mới..."
            />
            <p className="text-xs text-slate-500">Hiển thị nhãn nổi bật phía trên tiêu đề (urgency indicator)</p>
          </div>
          <div className="space-y-2">
            <Label>Tiêu đề CTA</Label>
            <Input value={config.title} onChange={(e) =>{  onChange({ ...config, title: e.target.value }); }} />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <textarea
              value={config.description}
              onChange={(e) =>{  onChange({ ...config, description: e.target.value }); }}
              className="w-full min-h-[80px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Text nút chính</Label><Input value={config.buttonText} onChange={(e) =>{  onChange({ ...config, buttonText: e.target.value }); }} /></div>
            <div className="space-y-2"><Label>Liên kết</Label><Input value={config.buttonLink} onChange={(e) =>{  onChange({ ...config, buttonLink: e.target.value }); }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Text nút phụ</Label><Input value={config.secondaryButtonText} onChange={(e) =>{  onChange({ ...config, secondaryButtonText: e.target.value }); }} /></div>
            <div className="space-y-2"><Label>Liên kết nút phụ</Label><Input value={config.secondaryButtonLink} onChange={(e) =>{  onChange({ ...config, secondaryButtonLink: e.target.value }); }} /></div>
          </div>
        </SubSection>
      </div>
    </>
  );
};

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/admin/components/ui';
import { useHomepageWizardReality } from './wizard/reality-scan';
import { HOMEPAGE_TEMPLATES } from './wizard/templates';
import { buildDefaultConfig } from './wizard/default-configs';
import type { WizardState, WizardStepKey } from './wizard/types';
import { HOME_COMPONENT_BASE_TYPES } from '@/lib/home-components/componentTypes';
import { HOMEPAGE_INDUSTRIES, type HomepageIndustry } from './wizard/industries';

type HomepageSmartWizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STEPS: WizardStepKey[] = ['industry', 'template'];

const componentLabelMap = new Map(HOME_COMPONENT_BASE_TYPES.map((item) => [item.value, item.label]));
const resolveIndustryByKey = (key: string) => (
  HOMEPAGE_INDUSTRIES.find((item) => item.key === key) ?? HOMEPAGE_INDUSTRIES[0]
);

const applyIndustryConfig = (
  type: string,
  config: Record<string, unknown>,
  industry?: HomepageIndustry,
) => {
  if (!industry) {
    return config;
  }
  const next = { ...config } as Record<string, unknown>;

  if (type === 'Hero') {
    const content = (next.content as Record<string, unknown>) ?? {};
    next.content = {
      ...content,
      badge: industry.name,
      heading: industry.heroHeading,
      description: industry.heroDescription,
      primaryButtonText: industry.ctaButton,
      secondaryButtonText: 'Tư vấn nhanh',
    };
    if (Array.isArray(next.slides)) {
      next.slides = [{ image: industry.heroImage, link: '/products' }];
    }
  }

  if (type === 'CTA') {
    next.title = industry.ctaTitle;
    next.description = industry.ctaDescription;
    next.buttonText = industry.ctaButton;
    next.buttonLink = '/lien-he';
  }

  if (type === 'About') {
    next.heading = industry.aboutHeading;
    next.content = industry.aboutContent;
    if (!next.image) {
      next.image = industry.heroImage;
    }
  }

  if (type === 'Benefits') {
    next.heading = `Vì sao chọn ${industry.name}`;
    next.subHeading = 'Giá trị nổi bật';
    next.items = industry.benefits.map((item) => ({
      title: item.title,
      description: item.description,
      icon: item.icon ?? 'Star',
    }));
  }

  if (type === 'Services') {
    next.items = industry.services.map((item) => ({
      title: item.title,
      description: item.description,
      icon: item.icon ?? 'Star',
    }));
  }

  if (type === 'Testimonials') {
    next.items = industry.testimonials.map((item) => ({
      name: item.name,
      role: item.role,
      content: item.content,
      avatar: '',
      rating: 5,
    }));
  }

  if (type === 'FAQ') {
    next.items = industry.faqs.map((item, index) => ({
      question: item.question,
      answer: item.answer,
      id: `faq-${industry.key}-${index}`,
    }));
    next.style = next.style ?? 'accordion';
  }

  if (type === 'Stats') {
    next.items = industry.stats.map((item) => ({ label: item.label, value: item.value }));
  }

  if (type === 'Contact') {
    next.heading = industry.contactHeading;
    next.subheading = industry.contactSubheading;
  }

  if (type === 'ProductList' || type === 'ProductGrid') {
    next.subtitle = industry.productTitle;
    next.badgeText = industry.productSubtitle;
  }

  return next;
};

export function HomepageSmartWizardDialog({ open, onOpenChange }: HomepageSmartWizardDialogProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState>({
    selectedIndustry: HOMEPAGE_INDUSTRIES[0]?.key ?? 'spa',
    selectedTemplate: HOMEPAGE_TEMPLATES[0]?.key ?? 'conversion_lean',
    applyMode: 'replace_all',
  });
  const reality = useHomepageWizardReality();
  const applyPlan = useMutation(api.homepageWizard.applyHomepageWizardPlan);
  const selectedIndustry = useMemo(
    () => resolveIndustryByKey(state.selectedIndustry),
    [state.selectedIndustry],
  );

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
    }
  }, [open]);


  const currentStep = STEPS[stepIndex];

  const buildPlanComponents = () => {
    if (!reality) {
      return [];
    }
    const template = HOMEPAGE_TEMPLATES.find((item) => item.key === state.selectedTemplate) ?? HOMEPAGE_TEMPLATES[0];
    const sequence = template.sequence;

    return sequence.map((type, index) => {
      const baseConfig = buildDefaultConfig(type, reality.sampleIds) as Record<string, unknown>;
      const config = applyIndustryConfig(type, baseConfig, selectedIndustry);
      return {
        active: true,
        config,
        order: index,
        title: componentLabelMap.get(type) ?? type,
        type,
      };
    });
  };

  const handleApply = async () => {
    const components = buildPlanComponents();
    await applyPlan({ components, mode: state.applyMode });
    onOpenChange(false);
  };

  const canProceed = () => {
    if (currentStep === 'industry') {
      return !!state.selectedIndustry;
    }
    if (currentStep === 'template') {
      return !!state.selectedTemplate && !!reality;
    }
    return true;
  };

  const planPreview = buildPlanComponents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-cyan-500" /> Tạo nhanh trang chủ
          </DialogTitle>
          <DialogDescription>
            Chọn ngành và mẫu để dựng trang chủ nhanh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {currentStep === 'industry' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chọn ngành</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {HOMEPAGE_INDUSTRIES.map((industry) => (
                  <button
                    key={industry.key}
                    onClick={() => setState((prev) => ({ ...prev, selectedIndustry: industry.key }))}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      state.selectedIndustry === industry.key
                        ? 'border-cyan-500 ring-2 ring-cyan-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-sm font-semibold">{industry.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{industry.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'template' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Chọn template</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {HOMEPAGE_TEMPLATES.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => setState((prev) => ({ ...prev, selectedTemplate: template.key }))}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      state.selectedTemplate === template.key
                        ? 'border-cyan-500 ring-2 ring-cyan-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-sm font-semibold">{template.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{template.description}</div>
                    <div className="mt-2 text-[11px] text-slate-400">Thứ tự: {template.sequence.join(' → ')}</div>
                  </button>
                ))}
              </div>

              <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs text-slate-500">Thứ tự sau khi apply</div>
                <ol className="list-decimal pl-5 text-sm text-slate-800 dark:text-slate-100 space-y-1">
                  {planPreview.map((item) => (
                    <li key={`${item.type}-${item.order}`}>{item.title}</li>
                  ))}
                </ol>
              </Card>

              <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs text-slate-500">Chế độ apply</div>
                <select
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
                  value={state.applyMode}
                  onChange={(event) => setState((prev) => ({ ...prev, applyMode: event.target.value as WizardState['applyMode'] }))}
                >
                  <option value="replace_all">Replace toàn bộ homepage</option>
                  <option value="append_missing">Append các block thiếu</option>
                </select>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex w-full items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
            >
              Quay lại
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              {currentStep === 'template' ? (
                <Button onClick={handleApply} disabled={!canProceed()}>
                  Apply Homepage
                </Button>
              ) : (
                <Button onClick={() => setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1))} disabled={!canProceed()}>
                  Tiếp tục
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

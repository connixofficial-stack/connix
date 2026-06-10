'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '../../components/ui';
import type { AiSeoImportPayload } from './AiSeoImportDialog';

type Formula = {
  id: string;
  name: string;
  description: string;
  generate: (form: Record<string, string | boolean>) => AiSeoImportPayload;
};

const FORMULAS: Formula[] = [
  {
    id: 'brand-intent',
    name: 'Brand + Intent (Ngắn gọn, Tập trung)',
    description: 'Tập trung vào tên thương hiệu và ngành nghề chính. Phù hợp cho trang chủ chung chung.',
    generate: (form) => {
      const siteName = (form.site_name as string) || 'Tên thương hiệu';
      const siteDesc = (form.site_tagline as string) || 'Ngành nghề';
      const contact = (form.contact_phone as string) || (form.contact_hotline as string) || '';
      
      const title = `${siteDesc} Chất Lượng | ${siteName}`;
      const desc = `Khám phá các sản phẩm/dịch vụ ${siteDesc} tốt nhất tại ${siteName}. Cam kết chất lượng và uy tín.${contact ? ` Liên hệ ngay ${contact} để nhận tư vấn miễn phí.` : ''}`;
      
      return {
        seo_title: title,
        seo_description: desc,
        seo_keywords: `${siteName}, ${siteDesc}, ${siteDesc} chất lượng`,
      };
    },
  },
  {
    id: 'action-benefit',
    name: 'Action + Benefit (Chuyển đổi cao)',
    description: 'Sử dụng động từ mạnh và nêu rõ lợi ích cốt lõi. Phong cách Web 2.0 Micro-ad.',
    generate: (form) => {
      const siteName = (form.site_name as string) || 'Tên thương hiệu';
      const siteDesc = (form.site_tagline as string) || 'Ngành nghề';
      const contact = (form.contact_phone as string) || (form.contact_hotline as string) || '';
      
      const title = `Khám phá ${siteDesc} Tốt Nhất Tại ${siteName}`;
      const desc = `Bạn đang tìm kiếm ${siteDesc}? ${siteName} mang đến giải pháp hoàn hảo với mức giá tốt nhất.${contact ? ` Gọi ngay ${contact} để nhận ưu đãi hôm nay!` : ''}`;
      
      return {
        seo_title: title,
        seo_description: desc,
        seo_keywords: `giải pháp ${siteDesc}, ${siteDesc} giá tốt, ${siteName}`,
      };
    },
  },
  {
    id: 'aeo-direct-answer',
    name: 'AEO Direct Answer (Tối ưu AI Overviews)',
    description: 'Định dạng câu trả lời trực tiếp, phù hợp với hành vi tìm kiếm bằng AI (Answer Engine Optimization).',
    generate: (form) => {
      const siteName = (form.site_name as string) || 'Tên thương hiệu';
      const siteDesc = (form.site_tagline as string) || 'Ngành nghề';
      const contact = (form.contact_phone as string) || (form.contact_hotline as string) || '';
      
      const title = `${siteName} - Chuyên gia ${siteDesc} Uy Tín`;
      const desc = `${siteName} là đơn vị chuyên cung cấp ${siteDesc} chất lượng cao. Giải pháp toàn diện, chuyên nghiệp và uy tín.${contact ? ` Liên hệ ngay: ${contact}.` : ''}`;
      
      return {
        seo_title: title,
        seo_description: desc,
        seo_keywords: `chuyên gia ${siteDesc}, cung cấp ${siteDesc}, ${siteName}`,
      };
    },
  },
  {
    id: 'semantic-entity',
    name: 'Semantic & Entity (Bao quát chủ đề)',
    description: 'Không nhồi nhét từ khóa, tập trung vào thực thể và ngữ cảnh tổng thể. Tốt cho E-E-A-T.',
    generate: (form) => {
      const siteName = (form.site_name as string) || 'Tên thương hiệu';
      const siteDesc = (form.site_tagline as string) || 'Ngành nghề';
      const contact = (form.contact_phone as string) || (form.contact_hotline as string) || '';
      
      const title = `Dịch Vụ ${siteDesc} Toàn Diện | ${siteName}`;
      const desc = `Khám phá hệ sinh thái sản phẩm và dịch vụ ${siteDesc} tại ${siteName}. Đội ngũ chuyên gia giàu kinh nghiệm sẵn sàng hỗ trợ bạn.${contact ? ` Gọi ${contact} để biết thêm chi tiết.` : ''}`;
      
      return {
        seo_title: title,
        seo_description: desc,
        seo_keywords: `hệ sinh thái ${siteDesc}, chuyên gia ${siteDesc}, dịch vụ ${siteDesc}`,
      };
    },
  },
];

export function SeoBuilderDialog({
  form,
  onApply,
}: {
  form: Record<string, string | boolean>;
  onApply: (item: AiSeoImportPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(FORMULAS[0].id);

  const selectedFormula = useMemo(
    () => FORMULAS.find(f => f.id === selectedFormulaId) || FORMULAS[0],
    [selectedFormulaId]
  );

  const previewData = useMemo(
    () => selectedFormula.generate(form),
    [selectedFormula, form]
  );

  const handleApply = () => {
    onApply(previewData);
    toast.success('Đã áp dụng công thức SEO vào form');
    setOpen(false);
  };

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles size={16} /> Builder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>SEO Builder</DialogTitle>
            <DialogDescription>
              Tự động tạo các thẻ Meta SEO dựa trên dữ liệu General của website theo các công thức tối ưu chuyển đổi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-3">
              <Label>Chọn công thức</Label>
              <div className="grid grid-cols-1 gap-2">
                {FORMULAS.map((formula) => (
                  <button
                    key={formula.id}
                    type="button"
                    onClick={() => setSelectedFormulaId(formula.id)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                      selectedFormulaId === formula.id
                        ? 'border-orange-500 bg-orange-50 dark:border-orange-500/50 dark:bg-orange-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{formula.name}</span>
                    <span className="mt-1 text-xs text-slate-500">{formula.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Kết quả Preview</Label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Meta Title</div>
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {previewData.seo_title}
                      <span className={`ml-2 text-xs font-normal ${(previewData.seo_title?.length || 0) > 60 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        ({previewData.seo_title?.length || 0}/60)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Meta Description</div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {previewData.seo_description}
                      <span className={`ml-2 text-xs font-normal ${(previewData.seo_description?.length || 0) > 160 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        ({previewData.seo_description?.length || 0}/160)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Keywords</div>
                    <div className="text-slate-600 dark:text-slate-400">{previewData.seo_keywords}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="button" variant="accent" onClick={handleApply}>
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

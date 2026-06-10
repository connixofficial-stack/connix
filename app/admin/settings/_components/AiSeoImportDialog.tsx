'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
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
  cn,
} from '../../components/ui';

export type AiSeoImportPayload = {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
};

type ParseResult = {
  item: AiSeoImportPayload | null;
  errors: string[];
};

const SAMPLE_JSON = `{
  "seo_title": "Nội thất cao cấp | Thiết kế & Thi công nội thất trọn gói",
  "seo_description": "Cung cấp giải pháp nội thất toàn diện, hiện đại và sang trọng. Tư vấn thiết kế miễn phí, thi công chuyên nghiệp đúng tiến độ. Liên hệ ngay để nhận báo giá chi tiết.",
  "seo_keywords": "nội thất cao cấp, thiết kế nội thất, thi công nội thất, nội thất hiện đại"
}`;

const buildPrompt = (form: Record<string, string | boolean>) => {
  const siteName = form.site_name || '[Tên thương hiệu]';
  const siteDesc = form.site_tagline || '[Mô tả website]';
  const hotline = form.contact_hotline || '[Hotline]';

  return `Bạn là Senior SEO Strategist & Conversion Copywriter am hiểu thuật toán SEO 2026, Generative Engine Optimization (GEO), và nguyên tắc E-E-A-T.

Nhiệm vụ: Tạo nội dung thẻ Meta SEO toàn trang (Trang chủ) bằng tiếng Việt dựa trên thông tin thực tế của doanh nghiệp.

Thông tin doanh nghiệp (Context):
- Tên thương hiệu: ${siteName}
- Mô tả/Ngành nghề: ${siteDesc}
- Liên hệ: ${hotline}

Guidelines bắt buộc (SEO 2026 - Web 2.0, GEO, AEO, Semantic):
1. **AEO (Answer Engine Optimization) & People-First**: Đoạn mô tả (Meta Description) phải giống một câu trả lời trực tiếp (Answer-First Formatting) gọn gàng trong 40-70 chữ (khoảng 150 ký tự), giải quyết đúng search intent của người dùng. Không dùng từ sáo rỗng.
2. **Semantic & Entity-Based**: Không nhồi nhét từ khóa (keyword stuffing). Hãy sử dụng các thực thể (entities) liên quan trực tiếp đến ngành nghề (ví dụ: dịch vụ, sản phẩm cụ thể) để tạo ngữ cảnh chuyên sâu.
3. **Meta Title (seo_title)**: 
   - Tối đa 60 ký tự.
   - Front-load keyword (đưa từ khóa quan trọng/thực thể chính lên đầu).
   - Tích hợp Power words và kết thúc bằng Tên thương hiệu.
4. **Meta Description (seo_description)**: 
   - Tối đa 160 ký tự. Coi đây là một "micro-ad" hiển thị trực tiếp đáp án.
   - Bắt đầu bằng câu trả lời trực tiếp (ví dụ: "Chúng tôi cung cấp...").
   - Đưa giá trị/lợi ích cốt lõi vào 120 ký tự đầu tiên để không bị cắt chữ trên mobile/AI Overview.
   - Thêm Call-to-Action mềm ở cuối.
5. **Keywords (seo_keywords)**: 3-5 thực thể/từ khóa chính, cách nhau dấu phẩy.
6. **E-E-A-T**: Giọng văn chuyên gia (Expertise), đáng tin cậy (Trustworthiness). Tuyệt đối không clickbait.

Output rule:
- Chỉ trả về JSON hợp lệ với cấu trúc như sau.
- Không dùng markdown fence.
- Không giải thích ngoài JSON.

Schema bắt buộc:
{
  "seo_title": "string, max 60 chars",
  "seo_description": "string, max 160 chars",
  "seo_keywords": "string, comma separated"
}`;
};

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const trimText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') { return ''; }
  return value.trim().slice(0, maxLength); // Only used for extreme safety, not for SEO limits
};

const parseAiEntity = (raw: string): ParseResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object đúng schema.'], item: null };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { errors: ['Root JSON phải là object.'], item: null };
  }

  const record = parsed as Record<string, unknown>;
  const errors: string[] = [];
  
  if (!record.seo_title) {
    errors.push('Thiếu seo_title.');
  }

  const item: AiSeoImportPayload = {
    seo_title: trimText(record.seo_title, 255),
    seo_description: trimText(record.seo_description, 1000),
    seo_keywords: trimText(record.seo_keywords, 500),
  };

  return { errors, item: errors.length > 0 ? null : item };
};

export function AiSeoImportDialog({
  form,
  onApply,
}: {
  form: Record<string, string | boolean>;
  onApply: (item: AiSeoImportPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  
  const prompt = useMemo(() => buildPrompt(form), [form]);
  const result = useMemo(() => parseAiEntity(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && Boolean(result.item) && result.errors.length === 0;

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const applyItem = () => {
    if (!canApply || !result.item) { return; }
    onApply(result.item);
    toast.success('Đã áp dụng nội dung AI vào form');
    setOpen(false);
    setRawInput('');
  };

  return (
    <>
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Bot size={16} /> Import AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo SEO Meta bằng AI</DialogTitle>
            <DialogDescription>
              Copy prompt, nhờ AI tạo JSON theo chuẩn Web 2.0 & GEO 2026, dán kết quả để preview rồi áp dụng vào form.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <FileText size={14} /> Prompt chuẩn (Đã chèn thông tin web)
                  </Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(prompt, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {prompt}
                </pre>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_JSON, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {SAMPLE_JSON}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea
                  className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={SAMPLE_JSON}
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                />
              </div>

              {rawInput.trim().length > 0 && (
                <div className={cn(
                  'rounded-lg border p-3 text-sm',
                  result.errors.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                )}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {result.errors.map((error) => (
                        <li key={error} className="flex gap-1.5">
                          <X size={14} className="mt-0.5 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} />
                      JSON hợp lệ, sẵn sàng áp dụng.
                    </div>
                  )}
                </div>
              )}

              {result.item && (
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{result.item.seo_title}</div>
                    {result.item.seo_description && (
                      <div className="line-clamp-3 text-slate-500">{result.item.seo_description}</div>
                    )}
                    {result.item.seo_keywords && (
                      <div className="truncate text-xs text-slate-400">Keywords: {result.item.seo_keywords}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="button" variant="accent" disabled={!canApply} onClick={applyItem}>
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

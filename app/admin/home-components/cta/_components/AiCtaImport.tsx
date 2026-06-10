'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { CTAConfig } from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const AI_CTA_PROMPT = `Hãy tạo nội dung CTA cho website doanh nghiệp tiếng Việt.
Chỉ trả về JSON hợp lệ, không giải thích.
Schema: { "cta": { "title": "string", "description": "string max 200", "buttonText": "string", "buttonLink": "string", "secondaryButtonText": "string optional", "secondaryButtonLink": "string optional", "badge": "string optional" } }`;

const SAMPLE = `{"cta":{"title":"Bắt đầu ngay hôm nay","description":"Hơn 1000+ doanh nghiệp đã tin tưởng. Đăng ký miễn phí.","buttonText":"Dùng thử","buttonLink":"/signup","secondaryButtonText":"Tìm hiểu","secondaryButtonLink":"/about","badge":"Ưu đãi"}}`;

const trim = (v: unknown, n: number) => { if (typeof v !== 'string' && typeof v !== 'number') return ''; return String(v).trim().slice(0, n); };
const clean = (r: string) => { const t = r.trim(); const f = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i); return f?.[1]?.trim() ?? t; };

const parse = (raw: string): { item: Partial<CTAConfig> | null; errors: string[] } => {
  let parsed: unknown;
  try { parsed = JSON.parse(clean(raw)); } catch { return { errors: ['JSON chưa hợp lệ.'], item: null }; }
  const src = typeof parsed === 'object' && parsed !== null && typeof (parsed as Record<string, unknown>).cta === 'object'
    ? (parsed as { cta: Record<string, unknown> }).cta
    : typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  if (!src) return { errors: ['Cần { "cta": {...} }'], item: null };
  const title = trim(src.title, 120);
  if (!title) return { errors: ['Thiếu title.'], item: null };
  return { errors: [], item: { title, description: trim(src.description, 300), buttonText: trim(src.buttonText, 60) || 'Liên hệ', buttonLink: trim(src.buttonLink, 300) || '/contact', secondaryButtonText: trim(src.secondaryButtonText, 60), secondaryButtonLink: trim(src.secondaryButtonLink, 300), badge: trim(src.badge, 60) } };
};

export function AiCtaImport({ onApply }: { buttonClassName?: string; onApply: (item: Partial<CTAConfig>) => void }) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parse(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.item !== null;

  if (!isAiImportEnabled) {
    return null;
  }

  const cp = async (v: string, t: 'prompt' | 'sample') => { await navigator.clipboard.writeText(v); setLastCopied(t); toast.success(t === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu'); setTimeout(() => setLastCopied(null), 1500); };

  return (
    <>
      <HomeComponentFooterActionPortal>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}><Bot size={16} /> Import AI</Button>
      </HomeComponentFooterActionPortal>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Import CTA bằng AI</DialogTitle><DialogDescription>Copy prompt, nhờ AI tạo JSON, dán vào đây.</DialogDescription></DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void cp(AI_CTA_PROMPT, 'prompt')}>{lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy</Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_CTA_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void cp(SAMPLE, 'sample')}>{lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy</Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={SAMPLE} value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700')}>
                  {result.errors.length > 0 ? <ul className="space-y-1">{result.errors.map((e) => <li key={e} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{e}</span></li>)}</ul> : <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập CTA.</span></div>}
                </div>
              )}
              {result.item && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700 space-y-1">
                    {result.item.badge && <span className="text-[10px] font-medium uppercase text-blue-600">{result.item.badge}</span>}
                    <p className="text-sm font-semibold">{result.item.title}</p>
                    <p className="text-xs text-slate-500">{result.item.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="button" disabled={!canApply} onClick={() => { if (result.item) { onApply(result.item); toast.success('Đã nhập CTA'); setOpen(false); setRawInput(''); } }}>Áp dụng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

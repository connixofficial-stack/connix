'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { CountdownConfigState } from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const AI_COUNTDOWN_PROMPT = `Hãy tạo nội dung countdown/khuyến mãi cho website doanh nghiệp tiếng Việt.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "countdown": {
    "heading": "string, tiêu đề chính (VD: Flash Sale - Giảm giá sốc!)",
    "subHeading": "string, tiêu đề phụ",
    "description": "string, mô tả ngắn, tối đa 200 ký tự",
    "endDate": "string, ISO datetime (VD: 2026-12-31T23:59)",
    "buttonText": "string, text nút (VD: Mua ngay)",
    "buttonLink": "string, link nút (VD: /products)",
    "discountText": "string, text giảm giá (VD: -50%)",
    "backgroundImage": "string, URL ảnh nền optional"
  }
}

Yêu cầu:
- Nội dung tự nhiên, phù hợp thị trường Việt Nam.
- endDate phải là ngày tương lai.
- Trả về 1 object JSON có key "countdown".`;

const SAMPLE_COUNTDOWN_JSON = `{
  "countdown": {
    "heading": "Flash Sale - Giảm giá sốc!",
    "subHeading": "Ưu đãi có hạn",
    "description": "Nhanh tay đặt hàng trước khi hết thời gian khuyến mãi. Giảm đến 50% toàn bộ sản phẩm.",
    "endDate": "2026-12-31T23:59",
    "buttonText": "Mua ngay",
    "buttonLink": "/products",
    "discountText": "-50%",
    "backgroundImage": ""
  }
}`;

type ParseResult = {
  item: Partial<CountdownConfigState> | null;
  errors: string[];
};

const trimText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string' && typeof value !== 'number') { return ''; }
  return String(value).trim().slice(0, maxLength);
};

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const parseAiCountdown = (raw: string): ParseResult => {
  let parsed: unknown;
  const errors: string[] = [];

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "countdown".'], item: null };
  }

  const source = typeof parsed === 'object' && parsed !== null && typeof (parsed as { countdown?: unknown }).countdown === 'object' && (parsed as { countdown?: unknown }).countdown !== null
    ? (parsed as { countdown: Record<string, unknown> }).countdown
    : typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, unknown>
      : null;

  if (!source) {
    return { errors: ['Root JSON phải là { "countdown": {...} } hoặc object countdown.'], item: null };
  }

  const heading = trimText(source.heading, 120);
  const subHeading = trimText(source.subHeading, 120);
  const description = trimText(source.description, 300);
  const endDate = trimText(source.endDate, 30);
  const buttonText = trimText(source.buttonText, 60);
  const buttonLink = trimText(source.buttonLink, 300);
  const discountText = trimText(source.discountText, 30);
  const backgroundImage = trimText(source.backgroundImage, 500);

  if (!heading) { errors.push('Thiếu heading.'); }
  if (!endDate) { errors.push('Thiếu endDate.'); }

  if (errors.length > 0) {
    return { errors, item: null };
  }

  return {
    errors: [],
    item: {
      heading,
      subHeading,
      description,
      endDate,
      buttonText: buttonText || 'Mua ngay',
      buttonLink: buttonLink || '/products',
      discountText,
      backgroundImage,
    },
  };
};

export function AiCountdownImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (item: Partial<CountdownConfigState>) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseAiCountdown(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.item !== null && result.errors.length === 0;

  if (!isAiImportEnabled) {
    return null;
  }

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const applyItem = () => {
    if (!canApply || !result.item) { return; }
    onApply(result.item);
    toast.success('Đã nhập nội dung Countdown');
    setOpen(false);
    setRawInput('');
  };

  return (
    <>
      <HomeComponentFooterActionPortal>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <Bot size={16} /> Import AI
        </Button>
      </HomeComponentFooterActionPortal>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Countdown bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_COUNTDOWN_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_COUNTDOWN_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_COUNTDOWN_JSON, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE_COUNTDOWN_JSON}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={SAMPLE_COUNTDOWN_JSON} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập nội dung Countdown.</span></div>
                  )}
                </div>
              )}
              {result.item ? (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700 space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{result.item.heading}</p>
                    <p className="text-xs text-slate-500">{result.item.subHeading}</p>
                    <p className="text-xs text-slate-400">{result.item.description}</p>
                    <div className="flex gap-3 text-[10px] text-slate-400 pt-1">
                      <span>⏰ {result.item.endDate}</span>
                      {result.item.discountText && <span className="font-bold text-red-500">{result.item.discountText}</span>}
                      <span>🔗 {result.item.buttonText}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="button" disabled={!canApply} onClick={applyItem}>Áp dụng vào form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

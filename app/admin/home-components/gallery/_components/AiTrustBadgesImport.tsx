'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { GalleryItem } from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const MAX_ITEMS = 20;

const AI_TRUST_BADGES_PROMPT = `Hãy tạo danh sách chứng nhận/uy tín cho website doanh nghiệp tiếng Việt theo phong cách SaaS sạch, giống các website thương mại điện tử chuyên nghiệp.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "badges": [
    {
      "name": "string, bắt buộc, tên chứng nhận hoặc cam kết uy tín",
      "link": "string, tùy chọn, URL kiểm chứng nếu có",
      "url": "string, tùy chọn, URL ảnh/logo chứng nhận nếu có"
    }
  ]
}

Yêu cầu:
- Tạo 4-8 chứng nhận/cam kết ngắn, dễ scan.
- Phù hợp thị trường Việt Nam.
- Ưu tiên nội dung thật sự tăng niềm tin: Chính hãng, Bảo hành, Đổi trả, Thanh toán an toàn, Giao hàng, Bảo mật, Đối tác, Chứng nhận.
- Nếu không có URL ảnh thật thì để "url": "".
- Không tạo field ngoài schema.
- Trả về 1 object JSON có key "badges".`;

const SAMPLE_TRUST_BADGES_JSON = `{
  "badges": [
    { "name": "Hàng chính hãng 100%", "link": "", "url": "" },
    { "name": "Bảo hành minh bạch", "link": "", "url": "" },
    { "name": "Thanh toán an toàn", "link": "", "url": "" },
    { "name": "Đổi trả trong 7 ngày", "link": "", "url": "" },
    { "name": "Giao hàng toàn quốc", "link": "", "url": "" },
    { "name": "Bảo mật thông tin", "link": "", "url": "" }
  ]
}`;

type ParseResult = {
  items: GalleryItem[] | null;
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

const parseAiTrustBadges = (raw: string): ParseResult => {
  let parsed: unknown;
  const errors: string[] = [];

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "badges".'], items: null };
  }

  let sourceArray: unknown[];
  if (typeof parsed === 'object' && parsed !== null && 'badges' in parsed && Array.isArray((parsed as { badges: unknown }).badges)) {
    sourceArray = (parsed as { badges: unknown[] }).badges;
  } else if (Array.isArray(parsed)) {
    sourceArray = parsed;
  } else {
    return { errors: ['Root JSON phải là { "badges": [...] } hoặc mảng chứng nhận.'], items: null };
  }

  if (sourceArray.length === 0) {
    return { errors: ['Danh sách chứng nhận trống.'], items: null };
  }

  if (sourceArray.length > MAX_ITEMS) {
    errors.push(`Tối đa ${MAX_ITEMS} chứng nhận, nhận được ${sourceArray.length}. Chỉ lấy ${MAX_ITEMS} đầu tiên.`);
  }

  const items = sourceArray.slice(0, MAX_ITEMS).reduce<GalleryItem[]>((acc, raw, index) => {
    if (typeof raw !== 'object' || raw === null) {
      errors.push(`Chứng nhận ${index + 1}: phải là object.`);
      return acc;
    }

    const record = raw as Record<string, unknown>;
    const name = trimText(record.name ?? record.title, 120);
    const link = trimText(record.link, 500);
    const url = trimText(record.url ?? record.image, 500);

    if (!name) {
      errors.push(`Chứng nhận ${index + 1}: thiếu name.`);
      return acc;
    }

    acc.push({
      id: `ai-trust-${Date.now()}-${index}`,
      link,
      name,
      url,
    });

    return acc;
  }, []);

  if (items.length === 0) {
    return { errors: [...errors, 'Không có chứng nhận hợp lệ nào.'], items: null };
  }

  return { errors, items: errors.length === 0 ? items : null };
};

export function AiTrustBadgesImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (items: GalleryItem[]) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseAiTrustBadges(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.items !== null && result.items.length > 0;

  if (!isAiImportEnabled) {
    return null;
  }

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const applyItems = () => {
    if (!canApply || !result.items) { return; }
    onApply(result.items);
    toast.success(`Đã nhập ${result.items.length} chứng nhận`);
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
            <DialogTitle>Import Chứng nhận bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_TRUST_BADGES_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_TRUST_BADGES_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_TRUST_BADGES_JSON, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE_TRUST_BADGES_JSON}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={SAMPLE_TRUST_BADGES_JSON} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập {result.items?.length ?? 0} chứng nhận.</span></div>
                  )}
                </div>
              )}
              {result.items && result.items.length > 0 ? (
                <div className="space-y-2">
                  <Label>Preview ({result.items.length} chứng nhận)</Label>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    {result.items.map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                          {item.link && <p className="truncate text-slate-500">{item.link}</p>}
                          {item.url && <p className="truncate text-[10px] text-slate-400">ảnh: {item.url}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button type="button" disabled={!canApply} onClick={applyItems}>Áp dụng vào form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

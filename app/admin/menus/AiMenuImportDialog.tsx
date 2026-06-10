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
} from '../components/ui';
import { parseAiMenuInput, type AiMenuLine } from './_ai-menu-parser';

/* ────────────────────────────────────────────────────────────
   MEGA PROMPT — Menu structure
   ──────────────────────────────────────────────────────────── */

const MENU_MEGA_PROMPT = `Bạn là chuyên gia thiết kế navigation menu cho website.

Tạo cấu trúc menu điều hướng header hoàn chỉnh theo JSON cho website.

## NGUYÊN TẮC (BẮT BUỘC)

1. **Chỉ trả label**: mỗi item chỉ cần "label". URL do hệ thống tự gán.
2. **Hỗ trợ menu con**: dùng "children" để tạo cấp con (tối đa 3 tầng).
3. **Nội dung thực tế**: tiếng Việt, tự nhiên, không placeholder.
4. **Không link ngoài**: không URL bên ngoài, không http.
5. **Menu ngắn gọn**: 5–12 mục cấp 1, mỗi mục tối đa 8 con.

## CẤU TRÚC JSON OUTPUT

\`\`\`json
{
  "items": [
    { "label": "Trang chủ" },
    { "label": "Sản phẩm", "children": [
      { "label": "Tinh Dầu" },
      { "label": "Nến Thơm" }
    ]},
    { "label": "Liên hệ" }
  ]
}
\`\`\`

## VALIDATE
- JSON thuần, KHÔNG markdown fence, KHÔNG giải thích
- Mỗi item PHẢI có "label" (string)
- "children" là optional array cùng cấu trúc
- Tối đa 50 items tổng cộng

## YÊU CẦU
Tạo menu header cho website [MÔ TẢ WEBSITE].`;

const SAMPLE_JSON = `{
  "items": [
    { "label": "Trang chủ" },
    { "label": "Giới thiệu" },
    { "label": "Sản phẩm", "children": [
      { "label": "Tinh Dầu" },
      { "label": "Nến Thơm" },
      { "label": "Sáp Thơm" }
    ]},
    { "label": "Dịch vụ", "children": [
      { "label": "Chăm sóc da" },
      { "label": "Massage Body" }
    ]},
    { "label": "Tin tức" },
    { "label": "Liên hệ" }
  ]
}`;

/* ────────────────────────────────────────────────────────────
   Dialog Component (same layout as AiHomepagePromptDialog)
   ──────────────────────────────────────────────────────────── */

export function AiMenuImportDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (items: AiMenuLine[]) => void;
}) {
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);

  const result = useMemo(() => {
    if (!rawInput.trim()) return { lines: [] as AiMenuLine[], error: '' };
    return parseAiMenuInput(rawInput);
  }, [rawInput]);

  const canApply = rawInput.trim().length > 0 && result.lines.length > 0 && !result.error;

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const handleApply = () => {
    if (!canApply) return;
    onApply(result.lines);
    setRawInput('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            Import AI — Tạo menu header
          </DialogTitle>
          <DialogDescription>
            Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {/* ── Cột trái: Prompt + JSON mẫu ── */}
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(MENU_MEGA_PROMPT, 'prompt')}>
                  {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                </Button>
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{MENU_MEGA_PROMPT}</pre>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label>JSON mẫu</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_JSON, 'sample')}>
                  {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                </Button>
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE_JSON}</pre>
            </div>
          </div>

          {/* ── Cột phải: Textarea + Preview ── */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Dán kết quả AI</Label>
              <textarea
                className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={SAMPLE_JSON}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
            </div>

            {/* Validation */}
            {rawInput.trim().length > 0 && (
              <div className={cn(
                'rounded-lg border p-3 text-sm',
                result.error
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                  : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300',
              )}>
                {result.error ? (
                  <div className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{result.error}</span></div>
                ) : (
                  <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng thêm {result.lines.length} menu item.</span></div>
                )}
              </div>
            )}

            {/* Preview list */}
            {result.lines.length > 0 && !result.error && (
              <div className="space-y-2">
                <Label>Preview ({result.lines.length} items)</Label>
                <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  {result.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800" style={{ paddingLeft: 12 + line.depth * 20 }}>
                      <span className="w-5 text-xs text-slate-400">{idx + 1}</span>
                      {line.depth > 0 && (
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Tầng {line.depth + 1}</span>
                      )}
                      <p className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{line.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="button" disabled={!canApply} onClick={handleApply}>
            Thêm {result.lines.length || ''} menu item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

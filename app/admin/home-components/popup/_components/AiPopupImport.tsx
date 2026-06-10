'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { PopupConfig } from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const AI_POPUP_PROMPT = `Bạn là chuyên gia UX copywriting cho popup website tiếng Việt.

Mục tiêu: tạo nội dung popup ngắn, rõ, dễ hiểu trong 5 giây, phù hợp hiển thị với font Be Vietnam Pro.

Bối cảnh cần tự suy luận từ yêu cầu người dùng:
- Loại popup: thông báo, khuyến mãi, thu lead, nhắc lịch, tư vấn, xác nhận hoặc cảnh báo nhẹ.
- Đối tượng đọc: khách truy cập website Việt Nam, cần câu chữ tự nhiên, lịch sự, không phóng đại.
- Ưu tiên chuyển đổi: tiêu đề rõ lợi ích, mô tả nói cụ thể người dùng nhận được gì, CTA hành động ngắn.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích, không thêm text ngoài JSON.

Schema bắt buộc:
{
  "eyebrow": "Badge ngắn, tối đa 24 ký tự",
  "heading": "Tiêu đề chính, tối đa 80 ký tự",
  "description": "Phụ đề/mô tả, tối đa 180 ký tự",
  "note": "Ghi chú ngắn, có thể để trống",
  "primaryButtonText": "Nút chính, có thể để trống",
  "primaryButtonLink": "URL hoặc path, có thể để trống",
  "secondaryButtonText": "Nút phụ, có thể để trống",
  "secondaryButtonLink": "URL hoặc path, có thể để trống",
  "icon": "Tên icon Lucide phù hợp, ví dụ ShieldCheck, Gift, Bell, Sparkles"
}

Quy tắc viết:
- eyebrow: 1-4 từ, ví dụ "Ưu đãi mới", "Thông báo", "Dành cho bạn"; có thể để trống nếu không cần.
- heading: một câu ngắn, nêu lợi ích hoặc thông tin chính, không dùng toàn chữ hoa.
- description: 1 câu rõ ý, nói cụ thể người dùng nên biết/làm gì tiếp theo.
- note: dùng cho điều kiện, cam kết, thời hạn hoặc trấn an; để trống nếu không có thông tin thật.
- primaryButtonText: 2-4 từ, ưu tiên động từ hành động như "Nhận ưu đãi", "Đăng ký ngay", "Xem chi tiết".
- primaryButtonLink: dùng path nội bộ như "/lien-he", "/san-pham" hoặc URL đầy đủ; để trống nếu nút chỉ đóng popup.
- secondaryButtonText: chỉ dùng khi có lựa chọn phụ rõ ràng như "Để sau", "Tìm hiểu thêm"; để trống nếu không cần.
- secondaryButtonLink: để trống nếu nút phụ chỉ đóng popup.
- icon: chọn một icon Lucide phù hợp, ví dụ Bell, Gift, Sparkles, ShieldCheck, Calendar, Mail, Megaphone, BadgeCheck.

Ràng buộc chất lượng:
- Không cường điệu kiểu "tốt nhất", "số 1", "duy nhất" nếu không có bằng chứng.
- Không bịa giá, phần trăm giảm, deadline, số lượng còn lại nếu người dùng không cung cấp.
- Không dùng emoji, hashtag, base64, HTML hoặc markdown.
- Không tạo field ngoài schema.
- Giữ câu chữ tự nhiên, dấu tiếng Việt đầy đủ, đọc tốt trên mobile.`;

const SAMPLE_JSON = `{
  "eyebrow": "Ưu đãi mới",
  "heading": "Nhận ưu đãi dành riêng cho bạn",
  "description": "Đăng ký hôm nay để nhận thông tin khuyến mãi và tư vấn phù hợp.",
  "note": "Bạn có thể bỏ qua nếu chưa sẵn sàng.",
  "primaryButtonText": "Nhận ưu đãi",
  "primaryButtonLink": "/lien-he",
  "secondaryButtonText": "Để sau",
  "secondaryButtonLink": "",
  "icon": "Gift"
}`;

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const trimText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string' && typeof value !== 'number') {return '';}
  return String(value).trim().slice(0, maxLength);
};

const parsePopupJson = (raw: string): { data: Partial<PopupConfig>; errors: string[] } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { data: {}, errors: ['JSON chưa hợp lệ.'] };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { data: {}, errors: ['Root JSON phải là object.'] };
  }

  const record = parsed as Record<string, unknown>;
  const heading = trimText(record.heading, 80);
  if (!heading) {
    return { data: {}, errors: ['Thiếu heading.'] };
  }

  return {
    data: {
      description: trimText(record.description, 180),
      eyebrow: trimText(record.eyebrow, 24),
      heading,
      icon: trimText(record.icon, 40) || 'Bell',
      note: trimText(record.note, 180),
      primaryButtonLink: trimText(record.primaryButtonLink, 300),
      primaryButtonText: trimText(record.primaryButtonText, 40),
      secondaryButtonLink: trimText(record.secondaryButtonLink, 300),
      secondaryButtonText: trimText(record.secondaryButtonText, 40),
    },
    errors: [],
  };
};

export function AiPopupImport({ onApply }: { onApply: (config: Partial<PopupConfig>) => void }) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parsePopupJson(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.errors.length === 0;

  if (!isAiImportEnabled) {
    return null;
  }

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const apply = () => {
    if (!canApply) {return;}
    onApply(result.data);
    toast.success('Đã nhập nội dung popup');
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
            <DialogTitle>Import nội dung popup bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON rồi dán kết quả vào đây.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_POPUP_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_POPUP_PROMPT}</pre>
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
                <div className={cn('rounded-md border p-2 text-xs', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700')}>
                  {result.errors.length > 0 ? result.errors.join(' ') : 'JSON hợp lệ, có thể áp dụng.'}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
            <Button type="button" disabled={!canApply} onClick={apply}>Áp dụng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy } from 'lucide-react';
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

export type PendingAttributeTerm = {
  name: string;
  slug: string;
  description?: string;
};

const slugify = (value: string) => value.toLowerCase()
  .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
  .replaceAll(/[đĐ]/g, "d")
  .replaceAll(/[^a-z0-9\s-]/g, '')
  .trim()
  .replaceAll(/\s+/g, '-')
  .replaceAll(/-+/g, '-');

const cleanJsonInput = (raw: string) => raw
  .trim()
  .replace(/^```(?:json)?/i, '')
  .replace(/```$/i, '')
  .trim();

const parseTermsPayload = (raw: string): { terms: PendingAttributeTerm[]; errors: string[] } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { terms: [], errors: ['JSON chưa hợp lệ. Hãy dán đúng object có key "terms".'] };
  }

  const record = parsed as { terms?: unknown };
  if (!Array.isArray(record.terms)) {
    return { terms: [], errors: ['Thiếu mảng "terms".'] };
  }

  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  const terms: PendingAttributeTerm[] = [];

  record.terms.slice(0, 80).forEach((item, index) => {
    const term = item as { name?: unknown; slug?: unknown; description?: unknown };
    const name = typeof term.name === 'string' ? term.name.trim() : '';
    const slug = typeof term.slug === 'string' && term.slug.trim() ? slugify(term.slug) : slugify(name);
    const description = typeof term.description === 'string' ? term.description.trim() : '';

    if (!name) {
      errors.push(`Item #${index + 1} thiếu name.`);
      return;
    }
    if (!slug) {
      errors.push(`Item #${index + 1} không tạo được slug.`);
      return;
    }
    if (seenSlugs.has(slug)) {
      errors.push(`Slug bị trùng trong payload: ${slug}`);
      return;
    }
    seenSlugs.add(slug);
    terms.push({ name, slug, description: description || undefined });
  });

  if (terms.length === 0 && errors.length === 0) {
    errors.push('Mảng terms đang rỗng.');
  }

  return { terms, errors };
};

export function AiAttributeTermsImportDialog({
  groupName,
  filterType,
  inputType,
  onApply,
}: {
  groupName: string;
  filterType: string;
  inputType: string;
  onApply: (terms: PendingAttributeTerm[]) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseTermsPayload(rawJson), [rawJson]);
  const hasInput = rawJson.trim().length > 0;
  const canApply = hasInput && result.terms.length > 0 && result.errors.length === 0;

  const sample = useMemo(() => JSON.stringify({
    terms: [
      { name: 'Pinot Noir', slug: 'pinot-noir', description: 'Giống nho đỏ thanh lịch, thường có hương trái đỏ và cấu trúc nhẹ đến vừa.' },
      { name: 'Chardonnay', slug: 'chardonnay', description: 'Giống nho trắng phổ biến, linh hoạt từ phong cách tươi sáng đến béo ngậy.' },
      { name: 'Tempranillo', slug: 'tempranillo', description: 'Giống nho đỏ đặc trưng Tây Ban Nha, hợp vang có hương trái chín và gia vị.' },
    ],
  }, null, 2), []);

  const prompt = useMemo(() => {
    const resolvedName = groupName.trim() || 'Nhóm thuộc tính sản phẩm';
    return `Bạn là chuyên gia taxonomy ecommerce. Hãy tạo danh sách giá trị thuộc tính cho website bán hàng.

Nhóm thuộc tính hiện tại:
- Tên nhóm: ${resolvedName}
- Kiểu lọc: ${filterType}
- Kiểu hiển thị: ${filterType === 'range' ? 'range slider' : inputType}

Yêu cầu rất quan trọng:
- Chỉ tạo các item thực sự thuộc nhóm "${resolvedName}", không trộn sang nhóm khác.
- Nếu nhóm là "Giống nho" thì chỉ trả về giống nho như Pinot Noir, Chardonnay, Tempranillo; không trả về quốc gia, loại rượu, dung tích hay khoảng giá.
- Nếu nhóm là "Quốc gia" thì chỉ trả về quốc gia/vùng xuất xứ; không trả về giống nho.
- Nếu nhóm là "Thương hiệu" thì chỉ trả về tên thương hiệu/nhà sản xuất; không trả về giống nho, quốc gia hay dung tích.
- Nếu nhóm là "Hương vị" thì chỉ trả về profile hương vị; không trả về tên sản phẩm cụ thể.
- Không dùng emoji, không thêm text giải thích ngoài JSON.
- Slug phải lowercase-kebab-case, không dấu, không ký tự đặc biệt.
- Description ngắn 1 câu, dùng được trong UI/SEO nhẹ, không bịa chứng nhận hay số liệu.
- Số lượng hợp lý: 8-20 item, ưu tiên phổ biến và dễ hiểu.

Chỉ trả về JSON đúng schema:
{
  "terms": [
    {
      "name": "Tên giá trị",
      "slug": "ten-gia-tri",
      "description": "Mô tả ngắn optional"
    }
  ]
}`;
  }, [filterType, groupName, inputType]);

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt AI' : 'Đã copy JSON mẫu');
  };

  const handleApply = async () => {
    if (!canApply) {return;}
    await onApply(result.terms);
    toast.success(`Đã nạp ${result.terms.length} giá trị thuộc tính`);
    setOpen(false);
    setRawJson('');
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Bot size={16} />
        Import AI
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import AI giá trị thuộc tính</DialogTitle>
            <DialogDescription>
              Copy prompt để AI tạo JSON, dán kết quả vào ô dưới rồi áp dụng vào danh sách giá trị.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Prompt cẩn thận</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => copyText(prompt, 'prompt')} className="gap-1">
                  {lastCopied === 'prompt' ? <Check size={14} /> : <Copy size={14} />}
                  Copy
                </Button>
              </div>
              <textarea
                readOnly
                value={prompt}
                className="h-64 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>JSON AI trả về</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => copyText(sample, 'sample')} className="gap-1">
                  {lastCopied === 'sample' ? <Check size={14} /> : <Copy size={14} />}
                  JSON mẫu
                </Button>
              </div>
              <textarea
                value={rawJson}
                onChange={(event) => setRawJson(event.target.value)}
                placeholder={sample}
                className="h-64 w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
              {hasInput && (
                <div className={cn(
                  'rounded-lg border p-3 text-sm',
                  result.errors.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                )}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {result.errors.map(error => <li key={error}>- {error}</li>)}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} />
                      JSON hợp lệ, preview {result.terms.length} giá trị bên dưới.
                    </div>
                  )}
                </div>
              )}
              {canApply && (
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</div>
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {result.terms.map((term, index) => (
                      <div key={term.slug} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{index + 1}. {term.name}</div>
                        <div className="font-mono text-xs text-slate-500">{term.slug}</div>
                        {term.description && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{term.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Đóng</Button>
            <Button type="button" variant="accent" disabled={!canApply} onClick={handleApply}>Áp dụng vào form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

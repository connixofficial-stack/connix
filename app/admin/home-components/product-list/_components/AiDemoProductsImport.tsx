'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { DemoProductItem } from '../_types';
import type { DemoServiceItem } from '../../service-list/_types';
import type { DemoProductCategoryItem } from '../../product-categories/_types';
import type { DemoBlogItem } from '../../blog/_types';
import type { DemoVoucherPromotionItem } from '../../voucher-promotions/_types';
import type { DemoCategoryProductsSection } from '../../category-products/_types';
import type { TestimonialsItem } from '../../testimonials/_types';
import type { MarqueeItem } from '../../marquee/_types';
import type { PartnerItem } from '../../partners/_types';
import type { GalleryItem } from '../../gallery/_types';
import type { ClientEditorItem } from '../../clients/_types';
import type { FaqItem } from '../../faq/_types';
import type { FeatureItem } from '../../features/_types';
import type { BenefitItem } from '../../benefits/_types';
import type { TeamEditorMember } from '../../team/_types';
import type { ProcessFormStep } from '../../process/_lib/normalize';
import type { StatsItem } from '../../stats/_types';
import type { JobPosition } from '../../career/_types';
import type { CaseStudyProject } from '../../case-study/_types';
import type { PricingEditorPlan } from '../../pricing/_types';
import type { FooterColumn } from '../../footer/_types';
import type { ContactInfoItem } from '../../contact/_types';
import type { HeroSlide, HeroStyle } from '../../hero/_types';
import type { SpeedDialAction } from '../../speed-dial/_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const MAX_IMPORT_ITEMS = 24;

const AI_PRODUCTS_PROMPT = `Hãy tạo danh sách sản phẩm demo cho website ecommerce tiếng Việt theo số lượng tôi yêu cầu.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "products": [
    {
      "name": "string, bắt buộc",
      "image": "URL ảnh http/https hoặc path bắt đầu bằng /, optional",
      "price": "string, ví dụ 199.000đ",
      "originalPrice": "string optional",
      "category": "string optional",
      "tag": "new | hot | sale | ''",
      "description": "string optional, tối đa 160 ký tự"
    }
  ]
}

Yêu cầu:
- Số lượng products trong JSON phải đúng với số lượng tôi yêu cầu; nếu tôi yêu cầu 1 thì trả 1, yêu cầu 8 thì trả 8.
- Tối đa 24 sản phẩm/lần.
- Tên sản phẩm tự nhiên, phù hợp thị trường Việt Nam.
- Giá hợp lý; nếu có originalPrice thì nên lớn hơn price.
- Link ảnh phải dùng URL ảnh hợp lệ, không dùng base64.
- Không tạo field ngoài schema.
- Trả về 1 object JSON có key "products".`;

const SAMPLE_JSON = `{
  "products": [
    {
      "name": "Áo thun cotton basic",
      "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      "price": "199.000đ",
      "originalPrice": "249.000đ",
      "category": "Thời trang",
      "tag": "sale",
      "description": "Áo thun cotton mềm, dễ phối đồ."
    }
  ]
}`;

type ParseResult = {
  items: DemoProductItem[];
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

const isValidImageUrl = (value: string) => {
  if (!value) { return true; }
  if (value.startsWith('/')) { return true; }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseAiDemoProducts = (raw: string): ParseResult => {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "products" hoặc array sản phẩm.'], items: [] };
  }

  const source = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { products?: unknown }).products)
      ? (parsed as { products: unknown[] }).products
      : null;

  if (!source) {
    return { errors: ['Root JSON phải là { "products": [...] } hoặc array sản phẩm.'], items: [] };
  }

  if (source.length === 0) {
    return { errors: ['Danh sách products đang trống.'], items: [] };
  }

  if (source.length > MAX_IMPORT_ITEMS) {
    errors.push(`Chỉ nhập tối đa ${MAX_IMPORT_ITEMS} sản phẩm/lần. Đang có ${source.length} sản phẩm.`);
  }

  const items = source.slice(0, MAX_IMPORT_ITEMS).reduce<DemoProductItem[]>((acc, item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Dòng ${index + 1}: item phải là object.`);
      return acc;
    }

    const record = item as Record<string, unknown>;
    const name = trimText(record.name, 120);
    const image = trimText(record.image, 500);
    const tag = trimText(record.tag, 20).toLowerCase();

    if (!name) {
      errors.push(`Dòng ${index + 1}: thiếu name.`);
      return acc;
    }

    if (!isValidImageUrl(image)) {
      errors.push(`Dòng ${index + 1}: image phải là URL http/https hoặc path bắt đầu bằng /.`);
      return acc;
    }

    acc.push({
      category: trimText(record.category, 80),
      description: trimText(record.description, 160),
      id: `demo-ai-${Date.now()}-${index}`,
      image,
      name,
      originalPrice: trimText(record.originalPrice, 40),
      price: trimText(record.price, 40),
      tag: tag === 'new' || tag === 'hot' || tag === 'sale' ? tag : '',
    });
    return acc;
  }, []);

  if (items.length === 0 && errors.length === 0) {
    errors.push('Không có sản phẩm hợp lệ để nhập.');
  }

  return { errors, items };
};

export function AiDemoProductsImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (items: DemoProductItem[]) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);

  const result = useMemo(() => parseAiDemoProducts(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.items.length > 0 && result.errors.length === 0;

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
    if (!canApply) { return; }
    onApply(result.items);
    toast.success(`Đã nhập ${result.items.length} sản phẩm demo`);
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
            <DialogTitle>Import sản phẩm demo bằng AI</DialogTitle>
            <DialogDescription>
              Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <FileText size={14} /> Prompt chuẩn
                  </Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_PRODUCTS_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {AI_PRODUCTS_PROMPT}
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
                    <div className="flex gap-1.5">
                      <Check size={14} className="mt-0.5 shrink-0" />
                      <span>Sẵn sàng nhập {result.items.length} sản phẩm.</span>
                    </div>
                  )}
                </div>
              )}

              {result.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({result.items.length})</Label>
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    {result.items.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800">
                        <span className="w-5 text-xs text-slate-400">{index + 1}</span>
                        {item.image ? (
                          <Image src={item.image} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{[item.price, item.category, item.tag].filter(Boolean).join(' • ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="button" disabled={!canApply} onClick={applyItems}>
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FieldKind = 'text' | 'image' | 'number' | 'enum';

type GenericImportField<T> = {
  key: keyof T & string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  maxLength?: number;
  enumValues?: string[];
};

type GenericImportConfig<T extends { id: string | number }> = {
  buttonLabel: string;
  dialogTitle: string;
  rootKey: string;
  itemLabel: string;
  promptIntro: string;
  promptNotes?: string;
  fields: GenericImportField<T>[];
  imageKey?: keyof T & string;
  nameKey: keyof T & string;
  metaKeys: (keyof T & string)[];
};

const formatGenericPrompt = <T extends { id: string | number }>(config: GenericImportConfig<T>) => {
  const schemaFields = config.fields
    .map((field) => `      "${field.key}": "${field.label}${field.required ? ', bắt buộc' : ', optional'}"`)
    .join(',\n');

  return `${config.promptIntro}

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "${config.rootKey}": [
    {
${schemaFields}
    }
  ]
}
${config.promptNotes ? `\n${config.promptNotes}\n` : ''}

Yêu cầu:
- Số lượng item trong JSON phải đúng với số lượng tôi yêu cầu; nếu tôi yêu cầu 1 thì trả 1, yêu cầu 8 thì trả 8.
- Tối đa ${MAX_IMPORT_ITEMS} item/lần.
- Link ảnh phải dùng URL ảnh hợp lệ, không dùng base64.
- Không tạo field ngoài schema.
- Trả về 1 object JSON có key "${config.rootKey}".`;
};

type GenericParseResult<T> = {
  items: T[];
  errors: string[];
};

const parseGenericItems = <T extends { id: string | number }>(raw: string, config: GenericImportConfig<T>): GenericParseResult<T> => {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: [`JSON chưa hợp lệ. Hãy dán object có key "${config.rootKey}" hoặc array ${config.itemLabel}.`], items: [] };
  }

  const source = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>)[config.rootKey])
      ? (parsed as Record<string, unknown>)[config.rootKey] as unknown[]
      : null;

  if (!source) {
    return { errors: [`Root JSON phải là { "${config.rootKey}": [...] } hoặc array ${config.itemLabel}.`], items: [] };
  }

  if (source.length === 0) {
    return { errors: [`Danh sách ${config.itemLabel} đang trống.`], items: [] };
  }

  if (source.length > MAX_IMPORT_ITEMS) {
    errors.push(`Chỉ nhập tối đa ${MAX_IMPORT_ITEMS} item/lần. Đang có ${source.length} item.`);
  }

  const items = source.slice(0, MAX_IMPORT_ITEMS).reduce<T[]>((acc, item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Dòng ${index + 1}: item phải là object.`);
      return acc;
    }

    const record = item as Record<string, unknown>;
    const next: Record<string, unknown> = { id: `demo-ai-${Date.now()}-${index}` };

    for (const field of config.fields) {
      const kind = field.kind ?? 'text';
      const rawValue = record[field.key];
      const textValue = trimText(rawValue, field.maxLength ?? 160);

      if (field.required && !textValue) {
        errors.push(`Dòng ${index + 1}: thiếu ${field.key}.`);
        return acc;
      }

      if (kind === 'image') {
        if (!isValidImageUrl(textValue)) {
          errors.push(`Dòng ${index + 1}: ${field.key} phải là URL http/https hoặc path bắt đầu bằng /.`);
          return acc;
        }
        next[field.key] = textValue;
      } else if (kind === 'number') {
        const numberValue = typeof rawValue === 'number' ? rawValue : Number(textValue.replace(/[^\d.-]/g, ''));
        next[field.key] = Number.isFinite(numberValue) ? numberValue : undefined;
      } else if (kind === 'enum') {
        const normalized = textValue.toLowerCase();
        next[field.key] = field.enumValues?.includes(normalized) ? normalized : '';
      } else {
        next[field.key] = textValue;
      }
    }

    acc.push(next as T);
    return acc;
  }, []);

  if (items.length === 0 && errors.length === 0) {
    errors.push(`Không có ${config.itemLabel} hợp lệ để nhập.`);
  }

  return { errors, items };
};

function GenericAiDemoImport<T extends { id: string | number }>({
  config,
  sample,
  onApply,
}: {
  buttonClassName?: string;
  config: GenericImportConfig<T>;
  sample: string;
  onApply: (items: T[]) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const prompt = useMemo(() => formatGenericPrompt(config), [config]);
  const result = useMemo(() => parseGenericItems(rawInput, config), [rawInput, config]);
  const canApply = rawInput.trim().length > 0 && result.items.length > 0 && result.errors.length === 0;

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
    if (!canApply) { return; }
    onApply(result.items);
    toast.success(`Đã nhập ${result.items.length} ${config.itemLabel}`);
    setOpen(false);
    setRawInput('');
  };

  return (
    <>
      <HomeComponentFooterActionPortal>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <Bot size={16} /> {config.buttonLabel}
        </Button>
      </HomeComponentFooterActionPortal>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{config.dialogTitle}</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(prompt, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{prompt}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(sample, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{sample}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={sample} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập {result.items.length} {config.itemLabel}.</span></div>
                  )}
                </div>
              )}
              {result.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({result.items.length})</Label>
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    {result.items.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800">
                        <span className="w-5 text-xs text-slate-400">{index + 1}</span>
                        {config.imageKey && typeof item[config.imageKey] === 'string' && item[config.imageKey] ? (
                          <Image src={item[config.imageKey] as string} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{String(item[config.nameKey] ?? '')}</p>
                          <p className="truncate text-xs text-slate-500">{config.metaKeys.map((key) => item[key]).filter(Boolean).join(' • ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

const SERVICE_IMPORT_CONFIG: GenericImportConfig<DemoServiceItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import dịch vụ demo bằng AI',
  fields: [
    { key: 'name', label: 'string', required: true, maxLength: 120 },
    { key: 'image', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'price', label: 'string, ví dụ 5.000.000đ', maxLength: 40 },
    { key: 'description', label: 'string, tối đa 160 ký tự', maxLength: 160 },
    { key: 'tag', label: "new | hot | ''", kind: 'enum', enumValues: ['new', 'hot', ''] },
  ],
  imageKey: 'image',
  itemLabel: 'dịch vụ',
  metaKeys: ['price', 'tag'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách dịch vụ demo cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'services',
};

const CATEGORY_IMPORT_CONFIG: GenericImportConfig<DemoProductCategoryItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import danh mục demo bằng AI',
  fields: [
    { key: 'name', label: 'string', required: true, maxLength: 100 },
    { key: 'image', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'productCount', label: 'number, số sản phẩm', kind: 'number' },
    { key: 'description', label: 'string, tối đa 160 ký tự', maxLength: 160 },
    { key: 'link', label: 'string, đường dẫn liên kết (VD: /dien-thoai-phu-kien, /khuyen-mai)', maxLength: 300 },
  ],
  imageKey: 'image',
  itemLabel: 'danh mục',
  metaKeys: ['productCount'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách danh mục sản phẩm demo cho website ecommerce tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'categories',
};

const BLOG_IMPORT_CONFIG: GenericImportConfig<DemoBlogItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import bài viết demo bằng AI',
  fields: [
    { key: 'title', label: 'string', required: true, maxLength: 140 },
    { key: 'excerpt', label: 'string, tối đa 180 ký tự', maxLength: 180 },
    { key: 'thumbnail', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'category', label: 'string', maxLength: 80 },
    { key: 'date', label: 'string, ví dụ 08/05/2026', maxLength: 40 },
    { key: 'author', label: 'string', maxLength: 80 },
  ],
  imageKey: 'thumbnail',
  itemLabel: 'bài viết',
  metaKeys: ['category', 'date'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách bài viết demo cho blog tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'posts',
};

const VOUCHER_IMPORT_CONFIG: GenericImportConfig<DemoVoucherPromotionItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import voucher demo bằng AI',
  fields: [
    { key: 'code', label: 'string, mã voucher', required: true, maxLength: 30 },
    { key: 'name', label: 'string', required: true, maxLength: 120 },
    { key: 'description', label: 'string, tối đa 160 ký tự', maxLength: 160 },
    { key: 'discountType', label: 'percent | fixed', kind: 'enum', enumValues: ['percent', 'fixed'] },
    { key: 'discountValue', label: 'number', kind: 'number' },
    { key: 'maxDiscountAmount', label: 'number', kind: 'number' },
    { key: 'minOrderAmount', label: 'number', kind: 'number' },
    { key: 'thumbnail', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
  ],
  imageKey: 'thumbnail',
  itemLabel: 'voucher',
  metaKeys: ['code', 'discountValue'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách voucher khuyến mãi demo cho website ecommerce tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'vouchers',
};

const TESTIMONIAL_IMPORT_CONFIG: GenericImportConfig<TestimonialsItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import đánh giá bằng AI',
  fields: [
    { key: 'name', label: 'string', required: true, maxLength: 100 },
    { key: 'role', label: 'string', maxLength: 100 },
    { key: 'company', label: 'string', maxLength: 100 },
    { key: 'content', label: 'string, tối đa 240 ký tự', required: true, maxLength: 240 },
    { key: 'rating', label: 'number 1-5', kind: 'number' },
    { key: 'avatarUrl', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'avatarType', label: 'initials | image | icon', kind: 'enum', enumValues: ['initials', 'image', 'icon'] },
    { key: 'avatarIcon', label: 'string, tên icon Lucide optional', maxLength: 80 },
  ],
  imageKey: 'avatarUrl',
  itemLabel: 'đánh giá',
  metaKeys: ['role', 'company', 'rating'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách đánh giá khách hàng demo bằng tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'testimonials',
};

const MARQUEE_IMPORT_CONFIG: GenericImportConfig<MarqueeItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import nội dung chạy chữ bằng AI',
  fields: [
    { key: 'text', label: 'string', required: true, maxLength: 120 },
    { key: 'separator', label: 'string, ví dụ ✦ / • / ★', maxLength: 8 },
    { key: 'textStyle', label: 'normal | outlined | bold | shadow', kind: 'enum', enumValues: ['normal', 'outlined', 'bold', 'shadow'] },
  ],
  itemLabel: 'nội dung',
  metaKeys: ['separator', 'textStyle'],
  nameKey: 'text',
  promptIntro: 'Hãy tạo danh sách nội dung chạy chữ ngắn cho website tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'items',
};

const PARTNER_IMPORT_CONFIG: GenericImportConfig<PartnerItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import đối tác bằng AI',
  fields: [
    { key: 'name', label: 'string', required: true, maxLength: 100 },
    { key: 'url', label: 'URL logo http/https hoặc path bắt đầu bằng /', kind: 'image', required: true, maxLength: 500 },
    { key: 'link', label: 'URL website optional', maxLength: 500 },
  ],
  imageKey: 'url',
  itemLabel: 'đối tác',
  metaKeys: ['link'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách đối tác/logo demo cho website doanh nghiệp theo số lượng tôi yêu cầu.',
  rootKey: 'partners',
};

const GALLERY_IMPORT_CONFIG: GenericImportConfig<GalleryItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import ảnh gallery bằng AI',
  fields: [
    { key: 'name', label: 'string mô tả ảnh optional', maxLength: 100 },
    { key: 'url', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', required: true, maxLength: 500 },
    { key: 'link', label: 'URL liên kết optional', maxLength: 500 },
  ],
  imageKey: 'url',
  itemLabel: 'ảnh',
  metaKeys: ['link'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách ảnh gallery demo cho website theo số lượng tôi yêu cầu.',
  rootKey: 'images',
};

const CLIENT_IMPORT_CONFIG: GenericImportConfig<ClientEditorItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import logo khách hàng bằng AI',
  fields: [
    { key: 'url', label: 'URL logo http/https hoặc path bắt đầu bằng /', kind: 'image', required: true, maxLength: 500 },
    { key: 'link', label: 'URL website optional', maxLength: 500 },
  ],
  imageKey: 'url',
  itemLabel: 'logo',
  metaKeys: ['link'],
  nameKey: 'url',
  promptIntro: 'Hãy tạo danh sách logo khách hàng demo cho website doanh nghiệp theo số lượng tôi yêu cầu.',
  rootKey: 'clients',
};

export const AiDemoServicesImport = (props: { buttonClassName?: string; onApply: (items: DemoServiceItem[]) => void }) => (
  <GenericAiDemoImport config={SERVICE_IMPORT_CONFIG} sample={'{\n  "services": [\n    {\n      "name": "Thiết kế website chuyên nghiệp",\n      "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",\n      "price": "5.000.000đ",\n      "description": "Thiết kế web responsive, chuẩn SEO.",\n      "tag": "hot"\n    }\n  ]\n}'} {...props} />
);

export const AiDemoProductCategoriesImport = ({ buttonLabel, ...props }: { buttonClassName?: string; buttonLabel?: string; onApply: (items: DemoProductCategoryItem[]) => void }) => {
  const config = useMemo<GenericImportConfig<DemoProductCategoryItem>>(
    () => ({ ...CATEGORY_IMPORT_CONFIG, buttonLabel: buttonLabel ?? CATEGORY_IMPORT_CONFIG.buttonLabel }),
    [buttonLabel],
  );

  return (
    <GenericAiDemoImport config={config} sample={'{\n  "categories": [\n    {\n      "name": "Thời trang nam",\n      "image": "https://images.unsplash.com/photo-1516257984-b1b4d707412e",\n      "productCount": 24,\n      "description": "Áo quần và phụ kiện nam hiện đại.",\n      "link": "/thoi-trang-nam"\n    }\n  ]\n}'} {...props} />
  );
};

export const AiDemoBlogPostsImport = (props: { buttonClassName?: string; onApply: (items: DemoBlogItem[]) => void }) => (
  <GenericAiDemoImport config={BLOG_IMPORT_CONFIG} sample={'{\n  "posts": [\n    {\n      "title": "5 xu hướng mua sắm online năm 2026",\n      "excerpt": "Những thay đổi nổi bật giúp thương hiệu bán hàng hiệu quả hơn.",\n      "thumbnail": "https://images.unsplash.com/photo-1499750310107-5fef28a66643",\n      "category": "Ecommerce",\n      "date": "08/05/2026",\n      "author": "VietAdmin"\n    }\n  ]\n}'} {...props} />
);

export const AiDemoVouchersImport = (props: { buttonClassName?: string; onApply: (items: DemoVoucherPromotionItem[]) => void }) => (
  <GenericAiDemoImport config={VOUCHER_IMPORT_CONFIG} sample={'{\n  "vouchers": [\n    {\n      "code": "SALE50",\n      "name": "Giảm 50K đơn từ 500K",\n      "description": "Áp dụng cho toàn bộ sản phẩm.",\n      "discountType": "fixed",\n      "discountValue": 50000,\n      "maxDiscountAmount": 50000,\n      "minOrderAmount": 500000,\n      "thumbnail": "https://images.unsplash.com/photo-1607083206968-13611e3d76db"\n    }\n  ]\n}'} {...props} />
);

export const AiDemoTestimonialsImport = (props: { buttonClassName?: string; onApply: (items: TestimonialsItem[]) => void }) => (
  <GenericAiDemoImport config={TESTIMONIAL_IMPORT_CONFIG} sample={'{\n  "testimonials": [\n    {\n      "name": "Nguyễn Thị Lan",\n      "role": "Giám đốc điều hành",\n      "company": "ABC Corp",\n      "content": "Dịch vụ rất tốt, đội ngũ hỗ trợ nhanh và chuyên nghiệp.",\n      "rating": 5,\n      "avatarUrl": "/demo/team-avatars/demo-f1.png",\n      "avatarType": "image",\n      "avatarIcon": ""\n    }\n  ]\n}'} {...props} />
);

export const AiDemoMarqueeImport = (props: { buttonClassName?: string; onApply: (items: MarqueeItem[]) => void }) => (
  <GenericAiDemoImport config={MARQUEE_IMPORT_CONFIG} sample={'{\n  "items": [\n    {\n      "text": "Miễn phí vận chuyển cho đơn từ 500K",\n      "separator": "✦",\n      "textStyle": "bold"\n    }\n  ]\n}'} {...props} />
);

export const AiDemoPartnersImport = (props: { buttonClassName?: string; onApply: (items: PartnerItem[]) => void }) => (
  <GenericAiDemoImport config={PARTNER_IMPORT_CONFIG} sample={'{\n  "partners": [\n    {\n      "name": "Apex Digital",\n      "url": "/demo/partners/partner-1.png",\n      "link": "https://example.com"\n    }\n  ]\n}'} {...props} />
);

export const AiDemoGalleryImport = (props: { buttonClassName?: string; onApply: (items: GalleryItem[]) => void }) => (
  <GenericAiDemoImport config={GALLERY_IMPORT_CONFIG} sample={'{\n  "images": [\n    {\n      "name": "Không gian showroom",\n      "url": "/demo/gallery/gallery-1.png",\n      "link": ""\n    }\n  ]\n}'} {...props} />
);

export const AiDemoClientsImport = (props: { buttonClassName?: string; onApply: (items: ClientEditorItem[]) => void }) => (
  <GenericAiDemoImport config={CLIENT_IMPORT_CONFIG} sample={'{\n  "clients": [\n    {\n      "url": "/demo/partners/partner-1.png",\n      "link": "https://example.com"\n    }\n  ]\n}'} {...props} />
);

// ── FAQ ────────────────────────────────────────────────────
const FAQ_IMPORT_CONFIG: GenericImportConfig<FaqItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import FAQ bằng AI',
  fields: [
    { key: 'question', label: 'string, câu hỏi', required: true, maxLength: 200 },
    { key: 'answer', label: 'string, câu trả lời', required: true, maxLength: 500 },
  ],
  itemLabel: 'câu hỏi',
  metaKeys: [],
  nameKey: 'question',
  promptIntro: 'Hãy tạo danh sách câu hỏi thường gặp (FAQ) cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'faqs',
};

export const AiDemoFaqImport = (props: { buttonClassName?: string; onApply: (items: FaqItem[]) => void }) => (
  <GenericAiDemoImport config={FAQ_IMPORT_CONFIG} sample={'{\n  "faqs": [\n    {\n      "question": "Thời gian giao hàng bao lâu?",\n      "answer": "Đơn hàng nội thành được giao trong 1-2 ngày, ngoại thành 3-5 ngày làm việc."\n    }\n  ]\n}'} {...props} />
);

// ── Features ───────────────────────────────────────────────
const FEATURE_IMPORT_CONFIG: GenericImportConfig<FeatureItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import tính năng bằng AI',
  fields: [
    { key: 'icon', label: 'string, tên icon Lucide (VD: Zap, Shield, Star)', maxLength: 60 },
    { key: 'title', label: 'string', required: true, maxLength: 120 },
    { key: 'description', label: 'string, tối đa 200 ký tự', maxLength: 200 },
  ],
  itemLabel: 'tính năng',
  metaKeys: ['icon'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách tính năng/điểm mạnh cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'features',
};

export const AiDemoFeaturesImport = (props: { buttonClassName?: string; onApply: (items: FeatureItem[]) => void }) => (
  <GenericAiDemoImport config={FEATURE_IMPORT_CONFIG} sample={'{\n  "features": [\n    {\n      "icon": "Zap",\n      "title": "Tốc độ vượt trội",\n      "description": "Hệ thống xử lý nhanh, phản hồi tức thì giúp tiết kiệm thời gian."\n    }\n  ]\n}'} {...props} />
);

// ── Benefits ───────────────────────────────────────────────
const BENEFIT_IMPORT_CONFIG: GenericImportConfig<BenefitItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import lợi ích bằng AI',
  fields: [
    { key: 'icon', label: 'string, slug icon Lucide (VD: check, shield, star)', maxLength: 60 },
    { key: 'title', label: 'string', required: true, maxLength: 120 },
    { key: 'description', label: 'string, tối đa 150 ký tự', maxLength: 150 },
  ],
  itemLabel: 'lợi ích',
  metaKeys: ['icon'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách lợi ích (benefits) cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu. Icon dùng slug dạng lowercase kebab-case (ví dụ: check, shield, star, zap, heart, target).',
  rootKey: 'benefits',
};

export const AiDemoBenefitsImport = (props: { buttonClassName?: string; onApply: (items: BenefitItem[]) => void }) => (
  <GenericAiDemoImport config={BENEFIT_IMPORT_CONFIG} sample={'{\n  "benefits": [\n    {\n      "icon": "shield",\n      "title": "Bảo mật tuyệt đối",\n      "description": "Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế."\n    }\n  ]\n}'} {...props} />
);

// ── Team ───────────────────────────────────────────────────
const TEAM_IMPORT_CONFIG: GenericImportConfig<TeamEditorMember> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import thành viên bằng AI',
  fields: [
    { key: 'name', label: 'string, họ tên', required: true, maxLength: 100 },
    { key: 'role', label: 'string, chức vụ', maxLength: 100 },
    { key: 'avatar', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'bio', label: 'string, giới thiệu ngắn', maxLength: 300 },
    { key: 'email', label: 'string, email', maxLength: 100 },
  ],
  imageKey: 'avatar',
  itemLabel: 'thành viên',
  metaKeys: ['role'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách thành viên đội ngũ cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'members',
};

export const AiDemoTeamImport = (props: { buttonClassName?: string; onApply: (items: TeamEditorMember[]) => void }) => (
  <GenericAiDemoImport config={TEAM_IMPORT_CONFIG} sample={'{\n  "members": [\n    {\n      "name": "Nguyễn Văn An",\n      "role": "CEO & Founder",\n      "avatar": "/demo/team-avatars/demo-f1.png",\n      "bio": "Hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ.",\n      "email": "an@company.vn"\n    }\n  ]\n}'} {...props} />
);

// ── Process ────────────────────────────────────────────────
const PROCESS_IMPORT_CONFIG: GenericImportConfig<ProcessFormStep> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import quy trình bằng AI',
  fields: [
    { key: 'icon', label: 'string, số thứ tự hoặc emoji (VD: 1, 01, ✓)', maxLength: 10 },
    { key: 'title', label: 'string', required: true, maxLength: 120 },
    { key: 'description', label: 'string, mô tả bước', maxLength: 200 },
  ],
  itemLabel: 'bước',
  metaKeys: ['icon'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách các bước quy trình cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu. Tối đa 8 bước.',
  rootKey: 'steps',
};

export const AiDemoProcessImport = (props: { buttonClassName?: string; onApply: (items: ProcessFormStep[]) => void }) => (
  <GenericAiDemoImport config={PROCESS_IMPORT_CONFIG} sample={'{\n  "steps": [\n    {\n      "icon": "1",\n      "title": "Tư vấn & Khảo sát",\n      "description": "Tiếp nhận yêu cầu, phân tích nhu cầu khách hàng."\n    }\n  ]\n}'} {...props} />
);

// ── Stats ──────────────────────────────────────────────────
type StatsItemWithId = StatsItem & { id: string | number };
const STATS_IMPORT_CONFIG: GenericImportConfig<StatsItemWithId> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import số liệu thống kê bằng AI',
  fields: [
    { key: 'value', label: 'string, giá trị hiển thị (VD: 1000+, 99%)', required: true, maxLength: 30 },
    { key: 'label', label: 'string, nhãn mô tả', required: true, maxLength: 60 },
  ],
  itemLabel: 'số liệu',
  metaKeys: [],
  nameKey: 'value',
  promptIntro: 'Hãy tạo danh sách số liệu thống kê nổi bật cho website doanh nghiệp tiếng Việt. Tối đa 4 item.',
  rootKey: 'stats',
};

export const AiDemoStatsImport = (props: { buttonClassName?: string; onApply: (items: StatsItemWithId[]) => void }) => (
  <GenericAiDemoImport config={STATS_IMPORT_CONFIG} sample={'{\n  "stats": [\n    {\n      "value": "1000+",\n      "label": "Khách hàng"\n    },\n    {\n      "value": "99%",\n      "label": "Hài lòng"\n    }\n  ]\n}'} {...props} />
);

// ── Career ─────────────────────────────────────────────────
type JobPositionWithId = JobPosition & { id: string | number };
const CAREER_IMPORT_CONFIG: GenericImportConfig<JobPositionWithId> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import vị trí tuyển dụng bằng AI',
  fields: [
    { key: 'title', label: 'string, tên vị trí', required: true, maxLength: 120 },
    { key: 'department', label: 'string, phòng ban', maxLength: 80 },
    { key: 'location', label: 'string, địa điểm', maxLength: 80 },
    { key: 'type', label: 'string, loại hình (Full-time / Part-time / Remote)', maxLength: 40 },
    { key: 'salary', label: 'string, mức lương (VD: 15-25 triệu)', maxLength: 60 },
    { key: 'description', label: 'string, mô tả ngắn', maxLength: 200 },
  ],
  itemLabel: 'vị trí',
  metaKeys: ['department', 'type', 'salary'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách vị trí tuyển dụng cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'jobs',
};

export const AiDemoCareerImport = (props: { buttonClassName?: string; onApply: (items: JobPositionWithId[]) => void }) => (
  <GenericAiDemoImport config={CAREER_IMPORT_CONFIG} sample={'{\n  "jobs": [\n    {\n      "title": "Frontend Developer",\n      "department": "Engineering",\n      "location": "TP.HCM",\n      "type": "Full-time",\n      "salary": "20-35 triệu",\n      "description": "Phát triển giao diện web với React/Next.js."\n    }\n  ]\n}'} {...props} />
);

// ── Case Study ─────────────────────────────────────────────
const CASESTUDY_IMPORT_CONFIG: GenericImportConfig<CaseStudyProject> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import dự án tiêu biểu bằng AI',
  fields: [
    { key: 'title', label: 'string, tên dự án', required: true, maxLength: 120 },
    { key: 'category', label: 'string, danh mục (Website, Mobile...)', maxLength: 80 },
    { key: 'image', label: 'URL ảnh http/https hoặc path bắt đầu bằng /', kind: 'image', maxLength: 500 },
    { key: 'description', label: 'string, mô tả ngắn', maxLength: 200 },
    { key: 'link', label: 'URL chi tiết optional', maxLength: 500 },
  ],
  imageKey: 'image',
  itemLabel: 'dự án',
  metaKeys: ['category'],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách dự án tiêu biểu (case study) cho website doanh nghiệp tiếng Việt theo số lượng tôi yêu cầu.',
  rootKey: 'projects',
};

export const AiDemoCaseStudyImport = (props: { buttonClassName?: string; onApply: (items: CaseStudyProject[]) => void }) => (
  <GenericAiDemoImport config={CASESTUDY_IMPORT_CONFIG} sample={'{\n  "projects": [\n    {\n      "title": "Website ABC Corp",\n      "category": "Website",\n      "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f",\n      "description": "Thiết kế website doanh nghiệp responsive, chuẩn SEO.",\n      "link": "https://example.com"\n    }\n  ]\n}'} {...props} />
);

// ── Speed Dial ─────────────────────────────────────────────
const SPEEDDIAL_IMPORT_CONFIG: GenericImportConfig<SpeedDialAction> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import nút tắt bằng AI',
  fields: [
    { key: 'icon', label: 'string, tên icon Lucide (Phone, Mail, MessageCircle...)', maxLength: 60 },
    { key: 'label', label: 'string, nhãn hiển thị', required: true, maxLength: 80 },
    { key: 'url', label: 'URL hoặc tel:/mailto:', required: true, maxLength: 300 },
    { key: 'bgColor', label: 'string, mã màu hex (VD: #25D366)', maxLength: 10 },
  ],
  itemLabel: 'nút tắt',
  metaKeys: ['icon', 'bgColor'],
  nameKey: 'label',
  promptIntro: 'Hãy tạo danh sách nút liên hệ nhanh (speed dial) cho website doanh nghiệp tiếng Việt. Thường bao gồm: Gọi điện, Zalo, Messenger, Email.',
  rootKey: 'actions',
};

export const AiDemoSpeedDialImport = (props: { buttonClassName?: string; onApply: (items: SpeedDialAction[]) => void }) => (
  <GenericAiDemoImport config={SPEEDDIAL_IMPORT_CONFIG} sample={'{\n  "actions": [\n    {\n      "icon": "Phone",\n      "label": "Gọi ngay",\n      "url": "tel:0901234567",\n      "bgColor": "#22c55e"\n    },\n    {\n      "icon": "MessageCircle",\n      "label": "Zalo",\n      "url": "https://zalo.me/0901234567",\n      "bgColor": "#0068ff"\n    }\n  ]\n}'} {...props} />
);

// ── Pricing ────────────────────────────────────────────────
const PRICING_IMPORT_CONFIG: GenericImportConfig<PricingEditorPlan> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import bảng giá bằng AI',
  fields: [
    { key: 'name', label: 'string, tên gói', required: true, maxLength: 80 },
    { key: 'price', label: 'string, giá (VD: 299.000đ)', required: true, maxLength: 40 },
    { key: 'period', label: 'string, chu kỳ (VD: /tháng, /năm)', maxLength: 20 },
    { key: 'buttonText', label: 'string, text nút (VD: Đăng ký)', maxLength: 40 },
    { key: 'buttonLink', label: 'string, link nút', maxLength: 300 },
  ],
  itemLabel: 'gói giá',
  metaKeys: ['price', 'period'],
  nameKey: 'name',
  promptIntro: 'Hãy tạo danh sách gói dịch vụ/bảng giá cho website doanh nghiệp tiếng Việt. Tạo 3-4 gói. Lưu ý: field features là mảng string[], isPopular là boolean.',
  rootKey: 'plans',
};

export const AiDemoPricingImport = (props: { buttonClassName?: string; onApply: (items: PricingEditorPlan[]) => void }) => (
  <GenericAiDemoImport config={PRICING_IMPORT_CONFIG} sample={'{\n  "plans": [\n    {\n      "name": "Cơ bản",\n      "price": "Miễn phí",\n      "period": "",\n      "buttonText": "Bắt đầu",\n      "buttonLink": "/signup"\n    },\n    {\n      "name": "Pro",\n      "price": "299.000đ",\n      "period": "/tháng",\n      "buttonText": "Đăng ký",\n      "buttonLink": "/signup?plan=pro"\n    }\n  ]\n}'} {...props} />
);

// ── Contact ────────────────────────────────────────────────
const CONTACT_IMPORT_CONFIG: GenericImportConfig<ContactInfoItem> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import thông tin liên hệ bằng AI',
  fields: [
    { key: 'icon', label: 'string, tên icon Lucide (Phone, Mail, MapPin, Clock...)', maxLength: 60 },
    { key: 'label', label: 'string, nhãn (VD: Điện thoại, Email...)', required: true, maxLength: 80 },
    { key: 'value', label: 'string, giá trị hiển thị', required: true, maxLength: 200 },
    { key: 'href', label: 'string, link (tel:, mailto:, https://...)', maxLength: 300 },
  ],
  itemLabel: 'thông tin',
  metaKeys: ['icon'],
  nameKey: 'label',
  promptIntro: 'Hãy tạo danh sách thông tin liên hệ cho website doanh nghiệp tiếng Việt: địa chỉ, số điện thoại, email, giờ làm việc.',
  rootKey: 'contacts',
};

export const AiDemoContactImport = (props: { buttonClassName?: string; onApply: (items: ContactInfoItem[]) => void }) => (
  <GenericAiDemoImport config={CONTACT_IMPORT_CONFIG} sample={'{\n  "contacts": [\n    {\n      "icon": "MapPin",\n      "label": "Địa chỉ",\n      "value": "123 Nguyễn Huệ, Quận 1, TP.HCM",\n      "href": "https://maps.google.com"\n    },\n    {\n      "icon": "Phone",\n      "label": "Hotline",\n      "value": "1800 6750",\n      "href": "tel:18006750"\n    }\n  ]\n}'} {...props} />
);

// ── Hero Slides ────────────────────────────────────────────
const HERO_IMPORT_CONFIG: GenericImportConfig<HeroSlide> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import banner slides bằng AI',
  fields: [
    { key: 'url', label: 'URL ảnh banner (http/https hoặc /path)', kind: 'image', required: true, maxLength: 500 },
    { key: 'link', label: 'URL liên kết khi click vào banner', maxLength: 500 },
  ],
  imageKey: 'url',
  itemLabel: 'banner',
  metaKeys: [],
  nameKey: 'url',
  promptIntro: 'Hãy tạo danh sách banner/slide cho hero section của website. Mỗi slide cần có url ảnh và link liên kết.',
  rootKey: 'slides',
};

const HERO_IMAGE_GUIDE_BY_STYLE: Record<HeroStyle, string> = {
  bento: '- Bento: nên tạo đúng 4 ảnh. Ảnh 1/3/4 dùng 5:4, gợi ý 1200×960px. Ảnh 2 là ảnh ngang 5:2, gợi ý 1600×640px. Giữ chủ thể ở trung tâm, tránh chữ sát mép.',
  builderCoffee: '- Builder Coffee: ảnh chính 16:9, gợi ý 1920×1080px. Layout dùng ảnh contain + nền blur, nên chọn ảnh có background sạch và chủ thể rõ ở trung tâm.',
  fade: '- Fade: ảnh panorama 21:9, gợi ý 1920×820px. Nội dung quan trọng đặt vùng trung tâm để không xấu trên mobile 16:9.',
  fullscreen: '- Fullscreen: ảnh 16:9, gợi ý 1920×1080px. Layout không crop ảnh, có nền blur; tránh chữ quá nhỏ vì mobile vẫn cần đọc được.',
  conquest: '- Conquest: ảnh 16:9, gợi ý 1920×1080px. Layout có khối nội dung và hình ảnh lớn, nên chọn ảnh rõ chủ thể, nền sạch, ít chữ.',
  parallax: '- Parallax: ảnh 16:9, gợi ý 1920×1080px. Desktop có card nổi phía dưới, mobile giống Split: ảnh trên + nội dung dưới; để chủ thể không bị che bởi card/controls.',
  slider: '- Slider: ảnh panorama 21:9, gợi ý 1920×820px. Nội dung quan trọng đặt vùng trung tâm, tránh logo/chữ sát 2 mép.',
  split: '- Split: ảnh 4:3, gợi ý 1200×900px. Mobile hiển thị ảnh carousel phía trên và nội dung phía dưới; chọn ảnh rõ chủ thể, ít chữ trên ảnh.',
  triple: '- Triple: nên tạo đúng 3 ảnh 16:9, gợi ý 1200×675px mỗi ảnh. Desktop xếp 3 cột ngang, mobile vuốt từng ảnh.',
  triple2: '- Triple 2: nên tạo đúng 3 ảnh 16:9, gợi ý 1200×675px mỗi ảnh. Desktop có ảnh đầu lớn hơn, mobile vuốt từng ảnh.',
};

const buildHeroPromptNotes = (heroStyle?: HeroStyle) => {
  const selectedStyle = heroStyle ?? 'slider';
  return `Hướng dẫn ảnh theo layout Hero đang chọn: ${selectedStyle}
${HERO_IMAGE_GUIDE_BY_STYLE[selectedStyle]}

Bảng tham chiếu nhanh nếu người dùng đổi layout:
- Slider/Fade: 21:9, gợi ý 1920×820px.
- Builder Coffee/Fullscreen/Conquest/Parallax/Triple/Triple 2: 16:9, gợi ý 1920×1080px hoặc 1200×675px.
- Split: 4:3, gợi ý 1200×900px.
- Bento: slot 1/3/4 là 5:4, slot 2 là 5:2.

Quy tắc chọn/tạo ảnh:
- URL ảnh phải trỏ tới ảnh có tỷ lệ gần đúng layout để khi crop không mất chủ thể.
- Không dùng ảnh có text/logo nằm sát mép; giữ safe area trung tâm khoảng 70%.
- Nếu không chắc tỷ lệ ảnh từ URL, ưu tiên ảnh rộng, rõ chủ thể, nền sạch và dễ crop theo tỷ lệ trên.`;
};

export const AiDemoHeroImport = ({ buttonLabel, heroStyle, ...props }: { buttonClassName?: string; buttonLabel?: string; heroStyle?: HeroStyle; onApply: (items: HeroSlide[]) => void }) => {
  const config = useMemo<GenericImportConfig<HeroSlide>>(
    () => ({ ...HERO_IMPORT_CONFIG, buttonLabel: buttonLabel ?? HERO_IMPORT_CONFIG.buttonLabel, promptNotes: buildHeroPromptNotes(heroStyle) }),
    [buttonLabel, heroStyle],
  );

  return (
    <GenericAiDemoImport config={config} sample={'{\n  "slides": [\n    {\n      "url": "https://images.unsplash.com/photo-1556761175-4b46a572b786",\n      "link": "/dien-thoai-phu-kien"\n    }\n  ]\n}'} {...props} />
  );
};

// ── Footer Columns ─────────────────────────────────────────
type FooterColumnWithId = FooterColumn & { id: string | number };
const FOOTER_IMPORT_CONFIG: GenericImportConfig<FooterColumnWithId> = {
  buttonLabel: 'Import AI',
  dialogTitle: 'Import cột footer bằng AI',
  fields: [
    { key: 'title', label: 'string, tiêu đề cột', required: true, maxLength: 80 },
  ],
  itemLabel: 'cột',
  metaKeys: [],
  nameKey: 'title',
  promptIntro: 'Hãy tạo danh sách cột cho footer website doanh nghiệp tiếng Việt. Mỗi cột có title và mảng links [{label, url}]. Tạo 3-4 cột.',
  rootKey: 'columns',
};

export const AiDemoFooterImport = (props: { buttonClassName?: string; onApply: (items: FooterColumnWithId[]) => void }) => (
  <GenericAiDemoImport config={FOOTER_IMPORT_CONFIG} sample={'{\n  "columns": [\n    {\n      "title": "Về chúng tôi",\n      "links": [{"label": "Giới thiệu", "url": "/about"}, {"label": "Đội ngũ", "url": "/team"}]\n    },\n    {\n      "title": "Dịch vụ",\n      "links": [{"label": "Tư vấn", "url": "/services"}, {"label": "Hỗ trợ", "url": "/support"}]\n    }\n  ]\n}'} {...props} />
);

const CATEGORY_PRODUCTS_PROMPT = `Hãy tạo các section danh mục kèm sản phẩm demo cho website ecommerce tiếng Việt theo số lượng tôi yêu cầu.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "sections": [
    {
      "categoryName": "string, bắt buộc",
      "categoryImage": "URL ảnh http/https hoặc path bắt đầu bằng /, optional",
      "products": [
        {
          "name": "string, bắt buộc",
          "image": "URL ảnh http/https hoặc path bắt đầu bằng /, optional",
          "price": "number",
          "salePrice": "number optional"
        }
      ]
    }
  ]
}

Yêu cầu:
- Số lượng sections/products phải đúng với số lượng tôi yêu cầu.
- Tối đa 6 sections, mỗi section tối đa 12 products.
- Link ảnh phải dùng URL ảnh hợp lệ, không dùng base64.
- Không tạo field ngoài schema.`;

const CATEGORY_PRODUCTS_SAMPLE = `{
  "sections": [
    {
      "categoryName": "Thời trang nam",
      "categoryImage": "https://images.unsplash.com/photo-1516257984-b1b4d707412e",
      "products": [
        {
          "name": "Áo sơ mi linen",
          "image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
          "price": 399000,
          "salePrice": 349000
        }
      ]
    }
  ]
}`;

const toOptionalNumber = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(trimText(value, 40).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const parseCategoryProductSections = (raw: string): GenericParseResult<DemoCategoryProductsSection> => {
  let parsed: unknown;
  const errors: string[] = [];

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "sections" hoặc array section.'], items: [] };
  }

  const source = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { sections?: unknown }).sections)
      ? (parsed as { sections: unknown[] }).sections
      : null;

  if (!source) {
    return { errors: ['Root JSON phải là { "sections": [...] } hoặc array section.'], items: [] };
  }

  if (source.length === 0) {
    return { errors: ['Danh sách sections đang trống.'], items: [] };
  }

  if (source.length > 6) {
    errors.push(`Chỉ nhập tối đa 6 sections/lần. Đang có ${source.length} sections.`);
  }

  const items = source.slice(0, 6).reduce<DemoCategoryProductsSection[]>((acc, section, sectionIndex) => {
    if (typeof section !== 'object' || section === null) {
      errors.push(`Section ${sectionIndex + 1}: phải là object.`);
      return acc;
    }

    const record = section as Record<string, unknown>;
    const categoryName = trimText(record.categoryName, 120);
    const categoryImage = trimText(record.categoryImage, 500);
    const products = Array.isArray(record.products) ? record.products : [];

    if (!categoryName) {
      errors.push(`Section ${sectionIndex + 1}: thiếu categoryName.`);
      return acc;
    }
    if (!isValidImageUrl(categoryImage)) {
      errors.push(`Section ${sectionIndex + 1}: categoryImage phải là URL http/https hoặc path bắt đầu bằng /.`);
      return acc;
    }
    if (products.length === 0) {
      errors.push(`Section ${sectionIndex + 1}: thiếu products.`);
      return acc;
    }

    const normalizedProducts = products.slice(0, 12).reduce<DemoCategoryProductsSection['products']>((productAcc, product, productIndex) => {
      if (typeof product !== 'object' || product === null) {
        errors.push(`Section ${sectionIndex + 1}, sản phẩm ${productIndex + 1}: phải là object.`);
        return productAcc;
      }
      const productRecord = product as Record<string, unknown>;
      const name = trimText(productRecord.name, 120);
      const image = trimText(productRecord.image, 500);
      if (!name) {
        errors.push(`Section ${sectionIndex + 1}, sản phẩm ${productIndex + 1}: thiếu name.`);
        return productAcc;
      }
      if (!isValidImageUrl(image)) {
        errors.push(`Section ${sectionIndex + 1}, sản phẩm ${productIndex + 1}: image phải là URL http/https hoặc path bắt đầu bằng /.`);
        return productAcc;
      }
      productAcc.push({
        id: `demo-product-${Date.now()}-${sectionIndex}-${productIndex}`,
        image,
        name,
        price: toOptionalNumber(productRecord.price) ?? 0,
        salePrice: toOptionalNumber(productRecord.salePrice),
      });
      return productAcc;
    }, []);

    acc.push({
      categoryImage,
      categoryName,
      id: `demo-section-${Date.now()}-${sectionIndex}`,
      products: normalizedProducts,
    });
    return acc;
  }, []);

  if (items.length === 0 && errors.length === 0) {
    errors.push('Không có section hợp lệ để nhập.');
  }

  return { errors, items };
};

export function AiDemoCategoryProductsImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (items: DemoCategoryProductsSection[]) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseCategoryProductSections(rawInput), [rawInput]);
  const canApply = rawInput.trim().length > 0 && result.items.length > 0 && result.errors.length === 0;

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
    if (!canApply) { return; }
    onApply(result.items);
    toast.success(`Đã nhập ${result.items.length} section demo`);
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
            <DialogTitle>Import section danh mục bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(CATEGORY_PRODUCTS_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{CATEGORY_PRODUCTS_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(CATEGORY_PRODUCTS_SAMPLE, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{CATEGORY_PRODUCTS_SAMPLE}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={CATEGORY_PRODUCTS_SAMPLE} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập {result.items.length} section.</span></div>
                  )}
                </div>
              )}
              {result.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({result.items.length})</Label>
                  <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    {result.items.map((section, index) => (
                      <div key={section.id} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-slate-800">
                        <span className="w-5 text-xs text-slate-400">{index + 1}</span>
                        {section.categoryImage ? <Image src={section.categoryImage} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 shrink-0 rounded bg-slate-100 dark:bg-slate-800" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{section.categoryName}</p>
                          <p className="truncate text-xs text-slate-500">{section.products.length} sản phẩm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

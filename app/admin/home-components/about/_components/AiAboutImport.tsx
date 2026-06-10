'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import { createAboutEditorFeature, createAboutEditorStat, normalizeAboutImages, normalizeAboutStyle } from '../_lib/constants';
import type { AboutEditorState } from '../_types';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const MAX_FEATURES = 6;

const AI_ABOUT_PROMPT = `Hãy tạo nội dung "Về chúng tôi" cho website doanh nghiệp tiếng Việt.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "about": {
    "subHeading": "string, bắt buộc",
    "heading": "string, bắt buộc",
    "highlightText": "string optional",
    "description": "string, bắt buộc, tối đa 500 ký tự",
    "phone": "string optional",
    "image": "URL ảnh http/https hoặc path bắt đầu bằng /, optional",
    "images": ["URL ảnh 1", "URL ảnh 2", "URL ảnh 3"],
    "imageCaption": "string optional",
    "stats": [{ "value": "18+", "label": "năm kinh nghiệm" }],
    "buttonText": "string optional",
    "buttonLink": "string optional",
    "style": "classic | bento | minimal | split | timeline | showcase | spaCollage | solarFeature",
    "features": [
      {
        "title": "string, bắt buộc",
        "iconName": "string tên icon Lucide optional",
        "image": "URL ảnh optional",
        "mediaType": "icon | image"
      }
    ]
  }
}

Yêu cầu:
- Nội dung tự nhiên, phù hợp thị trường Việt Nam.
- Tạo 3-6 features.
- Link ảnh phải dùng URL ảnh hợp lệ, không dùng base64.
- Không tạo field ngoài schema.
- Trả về 1 object JSON có key "about".`;

const SAMPLE_ABOUT_JSON = `{
  "about": {
    "subHeading": "VỀ CHÚNG TÔI",
    "heading": "Kiến tạo giải pháp số cho",
    "highlightText": "doanh nghiệp Việt",
    "description": "Chúng tôi đồng hành cùng doanh nghiệp xây dựng hệ thống vận hành hiện đại, tối ưu trải nghiệm khách hàng và tăng trưởng bền vững.",
    "phone": "1800 6750",
    "image": "https://images.unsplash.com/photo-1552664730-d307ca884978",
    "images": [
      "https://images.unsplash.com/photo-1552664730-d307ca884978",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72",
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902"
    ],
    "imageCaption": "Đội ngũ tận tâm, quy trình rõ ràng, kết quả đo lường được.",
    "stats": [{ "value": "18+", "label": "năm kinh nghiệm" }],
    "buttonText": "Tìm hiểu thêm",
    "buttonLink": "/about",
    "style": "bento",
    "features": [
      { "title": "Tư vấn tận tâm", "iconName": "Heart", "mediaType": "icon" },
      { "title": "Triển khai nhanh", "iconName": "Zap", "mediaType": "icon" },
      { "title": "Hiệu quả bền vững", "iconName": "TrendingUp", "mediaType": "icon" }
    ]
  }
}`;

type ParseResult = {
  item: Partial<AboutEditorState> | null;
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

const parseAiAbout = (raw: string): ParseResult => {
  let parsed: unknown;
  const errors: string[] = [];

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "about".'], item: null };
  }

  const source = typeof parsed === 'object' && parsed !== null && typeof (parsed as { about?: unknown }).about === 'object' && (parsed as { about?: unknown }).about !== null
    ? (parsed as { about: Record<string, unknown> }).about
    : typeof parsed === 'object' && parsed !== null
      ? parsed as Record<string, unknown>
      : null;

  if (!source) {
    return { errors: ['Root JSON phải là { "about": {...} } hoặc object about.'], item: null };
  }

  const subHeading = trimText(source.subHeading, 120);
  const heading = trimText(source.heading, 180);
  const description = trimText(source.description, 500);
  const image = trimText(source.image, 500);
  const imagesSource = Array.isArray(source.images) ? source.images : [];

  if (!subHeading) { errors.push('Thiếu subHeading.'); }
  if (!heading) { errors.push('Thiếu heading.'); }
  if (!description) { errors.push('Thiếu description.'); }
  if (!isValidImageUrl(image)) { errors.push('image phải là URL http/https hoặc path bắt đầu bằng /.'); }

  const images = imagesSource.slice(0, 3).map((item, index) => {
    const value = trimText(item, 500);
    if (!isValidImageUrl(value)) {
      errors.push(`images[${index}] phải là URL http/https hoặc path bắt đầu bằng /.`);
    }
    return value;
  });

  const rawFeatures = Array.isArray(source.features) ? source.features : [];
  const rawStats = Array.isArray(source.stats) ? source.stats : [];
  if (rawFeatures.length === 0) {
    errors.push('Thiếu features.');
  }

  const features = rawFeatures.slice(0, MAX_FEATURES).reduce<AboutEditorState['features']>((acc, item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Feature ${index + 1}: phải là object.`);
      return acc;
    }

    const record = item as Record<string, unknown>;
    const title = trimText(record.title, 120);
    const featureImage = trimText(record.image, 500);
    if (!title) {
      errors.push(`Feature ${index + 1}: thiếu title.`);
      return acc;
    }
    if (!isValidImageUrl(featureImage)) {
      errors.push(`Feature ${index + 1}: image phải là URL http/https hoặc path bắt đầu bằng /.`);
      return acc;
    }

    acc.push(createAboutEditorFeature({
      iconName: trimText(record.iconName, 80) || 'CheckCircle2',
      id: `about-ai-${Date.now()}-${index}`,
      image: featureImage,
      mediaType: record.mediaType === 'image' ? 'image' : 'icon',
      title,
    }));
    return acc;
  }, []);

  if (errors.length > 0) {
    return { errors, item: null };
  }

  return {
    errors: [],
    item: {
      buttonLink: trimText(source.buttonLink, 200) || '/about',
      buttonText: trimText(source.buttonText, 80) || 'Xem chi tiết',
      description,
      features,
      heading,
      highlightText: trimText(source.highlightText, 120),
      image,
      imageCaption: trimText(source.imageCaption, 180),
      images: normalizeAboutImages(images, image),
      stats: rawStats.slice(0, 1).map((item, index) => {
        if (typeof item !== 'object' || item === null) {
          return createAboutEditorStat({ id: `about-ai-stat-${Date.now()}-${index}`, value: '18+', label: 'năm kinh nghiệm' });
        }
        const record = item as Record<string, unknown>;
        return createAboutEditorStat({
          id: `about-ai-stat-${Date.now()}-${index}`,
          value: trimText(record.value, 40) || '18+',
          label: trimText(record.label, 80) || 'năm kinh nghiệm',
        });
      }),
      phone: trimText(source.phone, 50),
      style: normalizeAboutStyle(source.style),
      subHeading,
    },
  };
};

export function AiAboutImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (item: Partial<AboutEditorState>) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseAiAbout(rawInput), [rawInput]);
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
    toast.success('Đã nhập nội dung Về chúng tôi');
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
            <DialogTitle>Import Về chúng tôi bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_ABOUT_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_ABOUT_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_ABOUT_JSON, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE_ABOUT_JSON}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={SAMPLE_ABOUT_JSON} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập nội dung Về chúng tôi.</span></div>
                  )}
                </div>
              )}
              {result.item ? (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{result.item.subHeading}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{[result.item.heading, result.item.highlightText].filter(Boolean).join(' ')}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-slate-500">{result.item.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{result.item.features?.length ?? 0} điểm nổi bật • {result.item.style}</p>
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

'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, cn } from '../../../components/ui';
import type { ServiceEditorItem, ServiceItemMediaType } from '../_types';
import { AVAILABLE_SERVICE_ICONS } from '../_lib/constants';
import { useTypeAiImportEnabled } from '../../_shared/hooks/useTypeAiImportEnabled';
import { HomeComponentFooterActionPortal } from '../../_shared/components/HomeComponentFooterActions';

const MAX_ITEMS = 12;

const ICON_LIST_FOR_PROMPT = AVAILABLE_SERVICE_ICONS.slice(0, 60).join(', ');

const AI_SERVICES_PROMPT = `Hãy tạo danh sách dịch vụ cho website doanh nghiệp tiếng Việt.

Chỉ trả về JSON hợp lệ, không dùng markdown fence, không giải thích.

Schema bắt buộc:
{
  "services": [
    {
      "title": "string, bắt buộc, tên dịch vụ",
      "description": "string, bắt buộc, mô tả ngắn dịch vụ (tối đa 200 ký tự)",
      "icon": "string, BẮT BUỘC chọn từ danh sách icon bên dưới",
      "mediaType": "icon"
    }
  ]
}

Danh sách icon hợp lệ (CHỈ dùng các tên này, viết đúng hoa thường):
${ICON_LIST_FOR_PROMPT}

Yêu cầu:
- Nội dung tự nhiên, phù hợp thị trường Việt Nam.
- Tạo 3-8 dịch vụ.
- Icon BẮT BUỘC phải là 1 trong các tên ở danh sách trên.
- mediaType luôn là "icon".
- Không tạo field ngoài schema.
- Trả về 1 object JSON có key "services".

Ví dụ icon phù hợp theo ngành:
- E-commerce: ShoppingCart, Truck, Package, CreditCard, Gift, ShieldCheck
- Y tế: Stethoscope, Hospital, Pill, HeartPulse, Ambulance
- F&B: Utensils, Coffee, ChefHat, Wine, Pizza
- Công nghệ: Laptop, Code, Server, Cloud, Smartphone, Wifi
- Giáo dục: GraduationCap, Book, School, Brain
- Vận chuyển: Truck, Ship, Plane, Car, Train`;

const SAMPLE_SERVICES_JSON = `{
  "services": [
    { "title": "Tư vấn miễn phí", "description": "Đội ngũ chuyên gia tư vấn 24/7, giải đáp mọi thắc mắc.", "icon": "HeartHandshake", "mediaType": "icon" },
    { "title": "Giao hàng tận nơi", "description": "Giao hàng nhanh chóng toàn quốc, miễn phí đơn từ 500K.", "icon": "Truck", "mediaType": "icon" },
    { "title": "Bảo hành chính hãng", "description": "Cam kết bảo hành 12 tháng cho tất cả sản phẩm.", "icon": "ShieldCheck", "mediaType": "icon" },
    { "title": "Thanh toán linh hoạt", "description": "Hỗ trợ nhiều hình thức: COD, chuyển khoản, thẻ quốc tế.", "icon": "CreditCard", "mediaType": "icon" },
    { "title": "Hỗ trợ kỹ thuật", "description": "Đội ngũ kỹ thuật viên hỗ trợ lắp đặt và bảo trì tại nhà.", "icon": "Wrench", "mediaType": "icon" },
    { "title": "Ưu đãi thành viên", "description": "Tích điểm đổi quà, giảm giá độc quyền cho khách hàng thân thiết.", "icon": "Gift", "mediaType": "icon" }
  ]
}`;

type ParseResult = {
  items: ServiceEditorItem[] | null;
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

const VALID_ICONS_SET = new Set(AVAILABLE_SERVICE_ICONS);

const parseAiServices = (raw: string): ParseResult => {
  let parsed: unknown;
  const errors: string[] = [];

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object có key "services".'], items: null };
  }

  // Accept { services: [...] } or [...] directly
  let sourceArray: unknown[];
  if (typeof parsed === 'object' && parsed !== null && 'services' in parsed && Array.isArray((parsed as { services: unknown }).services)) {
    sourceArray = (parsed as { services: unknown[] }).services;
  } else if (Array.isArray(parsed)) {
    sourceArray = parsed;
  } else {
    return { errors: ['Root JSON phải là { "services": [...] } hoặc mảng dịch vụ.'], items: null };
  }

  if (sourceArray.length === 0) {
    return { errors: ['Danh sách dịch vụ trống.'], items: null };
  }

  if (sourceArray.length > MAX_ITEMS) {
    errors.push(`Tối đa ${MAX_ITEMS} dịch vụ, nhận được ${sourceArray.length}. Chỉ lấy ${MAX_ITEMS} đầu tiên.`);
  }

  const items = sourceArray.slice(0, MAX_ITEMS).reduce<ServiceEditorItem[]>((acc, raw, index) => {
    if (typeof raw !== 'object' || raw === null) {
      errors.push(`Dịch vụ ${index + 1}: phải là object.`);
      return acc;
    }

    const record = raw as Record<string, unknown>;
    const title = trimText(record.title, 120);
    const description = trimText(record.description, 200);
    const icon = trimText(record.icon, 80) || 'Star';
    const mediaType: ServiceItemMediaType = record.mediaType === 'image' ? 'image' : 'icon';
    const image = trimText(record.image, 500);

    if (!title) {
      errors.push(`Dịch vụ ${index + 1}: thiếu title.`);
      return acc;
    }

    // Warn nhưng không block nếu icon không tìm thấy
    if (mediaType === 'icon' && !VALID_ICONS_SET.has(icon as typeof AVAILABLE_SERVICE_ICONS[number])) {
      errors.push(`Dịch vụ ${index + 1}: icon "${icon}" có thể không tồn tại trong Lucide. Sẽ fallback về Star.`);
    }

    acc.push({
      id: 1_000_000 + Date.now() + index,
      mediaType,
      icon: VALID_ICONS_SET.has(icon as typeof AVAILABLE_SERVICE_ICONS[number]) ? icon : 'Star',
      image,
      title,
      description,
    });

    return acc;
  }, []);

  if (items.length === 0) {
    return { errors: [...errors, 'Không có dịch vụ hợp lệ nào.'], items: null };
  }

  // Chỉ có warning (icon fallback), vẫn cho apply
  const hasOnlyWarnings = errors.every(e => e.includes('có thể không tồn tại'));

  return {
    errors,
    items: (errors.length === 0 || hasOnlyWarnings) ? items : null,
  };
};

export function AiServicesImport({
  onApply,
}: {
  buttonClassName?: string;
  onApply: (items: ServiceEditorItem[]) => void;
}) {
  const isAiImportEnabled = useTypeAiImportEnabled();
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);
  const result = useMemo(() => parseAiServices(rawInput), [rawInput]);
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
    toast.success(`Đã nhập ${result.items.length} dịch vụ`);
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
            <DialogTitle>Import Dịch vụ bằng AI</DialogTitle>
            <DialogDescription>Copy prompt, nhờ AI tạo JSON, dán kết quả vào đây để preview rồi áp dụng vào form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5"><FileText size={14} /> Prompt chuẩn</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(AI_SERVICES_PROMPT, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">{AI_SERVICES_PROMPT}</pre>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(SAMPLE_SERVICES_JSON, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />} Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{SAMPLE_SERVICES_JSON}</pre>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={SAMPLE_SERVICES_JSON} value={rawInput} onChange={(event) => setRawInput(event.target.value)} />
              </div>
              {rawInput.trim().length > 0 && (
                <div className={cn('rounded-lg border p-3 text-sm', result.errors.length > 0 && !result.items ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300' : result.errors.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300')}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">{result.errors.map((error) => (<li key={error} className="flex gap-1.5"><X size={14} className="mt-0.5 shrink-0" /><span>{error}</span></li>))}</ul>
                  ) : (
                    <div className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0" /><span>Sẵn sàng nhập {result.items?.length ?? 0} dịch vụ.</span></div>
                  )}
                </div>
              )}
              {result.items && result.items.length > 0 ? (
                <div className="space-y-2">
                  <Label>Preview ({result.items.length} dịch vụ)</Label>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700 space-y-1.5 max-h-48 overflow-y-auto">
                    {result.items.map((item, idx) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 dark:bg-slate-800">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                          {item.description && <p className="text-slate-500 truncate">{item.description}</p>}
                          <p className="text-slate-400 text-[10px]">icon: {item.icon}</p>
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

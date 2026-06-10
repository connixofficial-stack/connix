'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Bot, Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  cn,
} from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { IconPopoverPicker } from '../../home-components/_shared/components/IconPopoverPicker';
import { HomeComponentStickyFooter } from '../../home-components/_shared/components/HomeComponentStickyFooter';
import { useUnsavedGuard } from '../../home-components/_shared/hooks/useUnsavedGuard';
import { ATTRIBUTE_ICON_OPTIONS } from '../_lib/iconRegistry';
import { AttributeGroupPreview } from '../_components/AttributeGroupPreview';

type PendingTerm = {
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

const parseTermsPayload = (raw: string): { terms: PendingTerm[]; errors: string[] } => {
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
  const terms: PendingTerm[] = [];

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

function AiAttributeTermsImportDialog({
  groupName,
  filterType,
  inputType,
  onApply,
}: {
  groupName: string;
  filterType: string;
  inputType: string;
  onApply: (terms: PendingTerm[]) => void;
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
- Nếu nhóm là "Dung tích" hoặc kiểu lọc range, name nên có số và đơn vị rõ như "750ml", "1500ml"; không bịa range marketing.
- Nếu nhóm là "Khoảng giá" thì chỉ trả về các nấc giá có ý nghĩa mua hàng, ví dụ "Dưới 500k", "Từ 500k đến 1 triệu".
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

  const handleApply = () => {
    if (!canApply) {return;}
    onApply(result.terms);
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
              Copy prompt để AI tạo JSON, dán kết quả vào ô dưới rồi áp dụng vào danh sách giá trị chờ tạo.
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

export default function AttributeGroupCreatePage() {
  const router = useRouter();
  const createGroup = useMutation(api.attributeGroups.create);
  const createTerm = useMutation(api.attributeTerms.create);

  // Query site brand colors
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  
  const enableProductTypesSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'enableProductTypes' });
  const enableProductTypes = enableProductTypesSetting?.value === true;
  
  const brandPrimary = (primarySetting?.value as string) || '#ea580c';
  const brandSecondary = (secondarySetting?.value as string) || '#475569';

  const colorPresets = [
    { label: 'Đen', value: '#000000', class: 'bg-black border-black text-white' },
    { label: 'Trắng', value: '#ffffff', class: 'bg-white border-slate-200 text-slate-800' },
    { label: 'Màu chính', value: brandPrimary, class: 'text-white', style: { backgroundColor: brandPrimary, borderColor: brandPrimary } },
    { label: 'Màu phụ', value: brandSecondary, class: 'text-white', style: { backgroundColor: brandSecondary, borderColor: brandSecondary } }
  ];

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slug, setSlug] = useState('');
  const [filterType, setFilterType] = useState('single');
  const [inputType, setInputType] = useState('select');
  const [isFilterable, setIsFilterable] = useState(true);
  const [isSpecialFilter, setIsSpecialFilter] = useState(false);
  const [iconName, setIconName] = useState('Wine');
  const [iconColor, setIconColor] = useState('#ea580c');
  const [pendingTerms, setPendingTerms] = useState<PendingTerm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanges = Boolean(
    name.trim() ||
    code.trim() ||
    slug.trim() ||
    filterType !== 'single' ||
    inputType !== 'select' ||
    isFilterable !== true ||
    isSpecialFilter !== false ||
    iconName !== 'Wine' ||
    iconColor !== '#ea580c' ||
    pendingTerms.length > 0
  );

  useUnsavedGuard(hasChanges);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(slugify(val));
  };

  const handleApplyAiTerms = (terms: PendingTerm[]) => {
    setPendingTerms(prev => {
      const map = new Map(prev.map(term => [term.slug, term]));
      terms.forEach(term => map.set(term.slug, term));
      return Array.from(map.values());
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {return;}

    if (isSpecialFilter && (filterType === 'range' || inputType === 'range')) {
      toast.error('Bộ lọc đặc biệt không được phép sử dụng kiểu khoảng giá (range). Vui lòng chọn kiểu Một lựa chọn hoặc Nhiều lựa chọn.');
      return;
    }

    setIsSubmitting(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        code: code.trim(),
        slug: slug.trim(),
        filterType,
        inputType,
        isFilterable,
        isSpecialFilter,
        iconPath: iconName,
        displayConfig: {
          iconColor,
          color: iconColor,
        },
      });
      for (let i = 0; i < pendingTerms.length; i++) {
        const term = pendingTerms[i];
        await createTerm({
          groupId,
          name: term.name,
          slug: term.slug,
          description: term.description,
          active: true,
          order: i,
        });
      }
      toast.success('Tạo nhóm thuộc tính thành công');
      router.push('/admin/attribute-groups');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo nhóm thuộc tính'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm nhóm thuộc tính</h1>
          <Link href="/admin/attribute-groups" className="text-sm text-orange-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <AiAttributeTermsImportDialog
          groupName={name}
          filterType={filterType}
          inputType={inputType}
          onApply={handleApplyAiTerms}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <Card className="w-full">
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Tên nhóm thuộc tính <span className="text-red-500">*</span></Label>
                  <CopyableInput
                    value={name} 
                    onChange={handleNameChange} 
                    copyLabel="tên nhóm thuộc tính"
                    required 
                    placeholder="Nhập tên nhóm thuộc tính..." 
                    autoFocus 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input 
                    value={slug} 
                    onChange={(e) =>{  setSlug(e.target.value); }} 
                    placeholder="tu-dong-tao-tu-ten" 
                    className="font-mono text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mã (Code) <span className="text-red-500">*</span></Label>
                  <Input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    required 
                    placeholder="VD: color, size..." 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kiểu lọc</Label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="single">Một lựa chọn (Single)</option>
                    <option value="multiple">Nhiều lựa chọn (Multiple)</option>
                    <option value="range">Khoảng giá trị (Range)</option>
                  </select>
                </div>

                {filterType !== 'range' && (
                  <div className="space-y-2">
                    <Label>Kiểu hiển thị</Label>
                    <select 
                      value={inputType}
                      onChange={(e) => setInputType(e.target.value)}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      <option value="select">Dropdown (Select)</option>
                      <option value="buttons">Các nút bấm (Buttons)</option>
                      <option value="radio">Nút tròn (Radio)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Icon đại diện</Label>
                  <IconPopoverPicker 
                    value={iconName}
                    onChange={setIconName}
                    options={ATTRIBUTE_ICON_OPTIONS}
                    brandColor={iconColor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Màu sắc icon</Label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {colorPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setIconColor(p.value)}
                        style={p.style}
                        className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${p.class} ${iconColor === p.value ? 'ring-2 ring-orange-500 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="color" 
                      value={iconColor} 
                      onChange={(e) => setIconColor(e.target.value)} 
                      className="w-12 h-10 p-1 cursor-pointer border border-slate-200 rounded-md"
                    />
                    <Input 
                      type="text" 
                      value={iconColor} 
                      onChange={(e) => setIconColor(e.target.value)}
                      placeholder="#ea580c"
                      className="font-mono text-sm uppercase flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 h-10 border border-slate-100 dark:border-slate-800/50 rounded-md px-3 bg-white dark:bg-slate-900/50">
                    <input
                      type="checkbox"
                      id="isFilterable"
                      checked={isFilterable}
                      onChange={(e) => setIsFilterable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <Label htmlFor="isFilterable" className="text-sm font-medium cursor-pointer select-none">
                      Hiển thị trong bộ lọc (Filter)
                    </Label>
                  </div>
                  {enableProductTypes && (
                    <div className="flex items-center gap-2 h-10 border border-slate-100 dark:border-slate-800/50 rounded-md px-3 bg-white dark:bg-slate-900/50 mt-2">
                      <input
                        type="checkbox"
                        id="isSpecialFilter"
                        checked={isSpecialFilter}
                        onChange={(e) => setIsSpecialFilter(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <Label htmlFor="isSpecialFilter" className="text-sm font-medium cursor-pointer select-none">
                        Bộ lọc đặc biệt
                      </Label>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label>Giá trị thuộc tính chờ tạo</Label>
                      <p className="text-xs text-slate-500">Dùng Import AI để thêm nhanh các option như giống nho, quốc gia, dung tích...</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {pendingTerms.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (confirm(`Xóa ${pendingTerms.length} giá trị đang chờ tạo?`)) {
                              setPendingTerms([]);
                            }
                          }}
                        >
                          Xóa tất cả
                        </Button>
                      )}
                      <AiAttributeTermsImportDialog
                        groupName={name}
                        filterType={filterType}
                        inputType={inputType}
                        onApply={handleApplyAiTerms}
                      />
                    </div>
                  </div>
                  {pendingTerms.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
                      Chưa có giá trị nào. Bạn có thể tạo nhóm trước rồi thêm sau, hoặc import AI để tạo cùng lúc.
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-2 dark:border-slate-800">
                      {pendingTerms.map((term, index) => (
                        <div key={term.slug} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{index + 1}. {term.name}</div>
                            <div className="font-mono text-xs text-slate-500">{term.slug}</div>
                            {term.description && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{term.description}</div>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setPendingTerms(prev => prev.filter(item => item.slug !== term.slug))}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <HomeComponentStickyFooter
                isSubmitting={isSubmitting}
                hasChanges={hasChanges}
                submitLabel="Tạo nhóm thuộc tính"
              >
                <div className="flex items-center justify-between w-full">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() =>{  router.push('/admin/attribute-groups'); }}
                    disabled={isSubmitting}
                  >
                    Hủy bỏ
                  </Button>
                  <div className="flex flex-wrap justify-end gap-2">
                    <AiAttributeTermsImportDialog
                      groupName={name}
                      filterType={filterType}
                      inputType={inputType}
                      onApply={handleApplyAiTerms}
                    />
                    <Button type="submit" variant="accent" disabled={isSubmitting || !name.trim() || !slug.trim() || !code.trim()}>
                      {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                      Tạo nhóm thuộc tính
                    </Button>
                  </div>
                </div>
              </HomeComponentStickyFooter>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7 lg:sticky lg:top-6">
          <AttributeGroupPreview
            name={name}
            filterType={filterType}
            inputType={inputType}
            iconName={iconName}
            iconColor={iconColor}
            terms={pendingTerms.map((term, index) => ({ _id: term.slug, name: term.name, slug: term.slug, order: index }))}
          />
        </div>
      </div>
    </div>
  );
}

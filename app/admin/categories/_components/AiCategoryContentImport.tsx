'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Check, Copy, FileText, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Input, cn } from '../../components/ui';
import type { FaqItem } from '../../home-components/faq/_types';
import { useTypeAiImportEnabled } from '../../home-components/_shared/hooks/useTypeAiImportEnabled';

interface AiCategoryContentImportProps {
  categoryName: string;
  categoryDescription: string;
  onApply: (data: {
    filterFooterContent: string;
    productDetailSuffixContent: string;
    faqItems: FaqItem[];
  }) => void;
}

const SAMPLE_CATEGORY_JSON = `{
  "filterFooterContent": "<h2>Bí quyết chọn mua Giày chạy bộ phù hợp</h2><p>Để chọn được đôi giày chạy bộ lý tưởng, bạn cần xác định rõ kiểu bàn chân và địa hình chạy. Hãy ưu tiên các dòng sản phẩm có lớp đệm êm ái và độ bám tốt để bảo vệ khớp gối tối đa...</p>",
  "productDetailSuffixContent": "<h3>Cam kết từ Cửa hàng</h3><p>Tất cả sản phẩm tại hệ thống đều cam kết <strong>chính hãng 100%</strong>. Chúng tôi hỗ trợ bảo hành keo chỉ lên tới 12 tháng và chính sách đổi trả miễn phí trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.</p>",
  "faqItems": [
    {
      "question": "Giày chạy bộ có được giặt máy không?",
      "answer": "Không nên giặt máy để tránh làm hỏng cấu trúc đệm và keo giày. Hãy làm sạch bằng bàn chải mềm và dung dịch chuyên dụng."
    },
    {
      "question": "Làm sao để chọn đúng size giày?",
      "answer": "Bạn nên đo chiều dài bàn chân và cộng thêm 0.5 - 1cm để có độ thoải mái tốt nhất khi di chuyển đường dài."
    }
  ]
}`;

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

export function AiCategoryContentImport({
  categoryName,
  categoryDescription,
  onApply,
}: AiCategoryContentImportProps) {
  const isAiImportEnabled = useTypeAiImportEnabled('productCategories');
  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState(categoryName);
  const [infoInput, setInfoInput] = useState(categoryDescription);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);

  // Đồng bộ với thay đổi từ form bên ngoài khi mở dialog
  React.useEffect(() => {
    if (open) {
      setNameInput(categoryName);
      setInfoInput(categoryDescription);
    }
  }, [open, categoryName, categoryDescription]);

  const prompt = useMemo(() => {
    return `Hãy đóng vai trò là một chuyên gia SEO và Content Marketer hàng đầu. Tôi muốn bạn tạo nội dung chất lượng cao chuẩn EEAT (Experience - Expertise - Authoritativeness - Trustworthiness) của Google cho danh mục sản phẩm sau:

- **Tên danh mục**: "${nameInput.trim() || '(Chưa nhập tên danh mục)'}"
- **Thông tin bổ sung / Đặc tính sản phẩm**: "${infoInput.trim() || '(Chưa có thông tin bổ sung)'}"

LƯU Ý ĐẶC BIỆT BẢO VỆ SEO & E-E-A-T (CHỐNG PHẠT GOOGLE SPAM):
* TUYỆT ĐỐI KHÔNG sử dụng các hashtag dạng dấu thăng (#tu-khoa) trong bất kỳ phần văn bản nào. Google và các công cụ tìm kiếm hiện đại coi đây là hành vi nhồi nhét từ khóa (keyword stuffing) spam và có thể phạt giảm thứ hạng trang web, đồng thời làm giảm nghiêm trọng độ chuyên nghiệp, premium của giao diện người dùng.

Yêu cầu cụ thể theo Best Practice của các hệ thống SaaS Thương mại điện tử lớn:

1. **Nội dung cuối trang danh mục (filterFooterContent) - "Cẩm nang chọn mua và Kiến thức chuyên gia"**:
   - Viết một bài hướng dẫn/chia sẻ từ 250-400 từ bằng ngôn ngữ tự nhiên, chuyên sâu, đáng tin cậy.
   - Định dạng bằng các thẻ HTML cơ bản (h2, h3, p, strong, ul, li).
   - Nội dung phải:
     * Tránh sáo rỗng, tránh nhồi nhét từ khóa.
     * Cung cấp tiêu chí so sánh, cách chọn size/kiểu dáng/chất liệu phù hợp với nhu cầu sử dụng thực tế (ví dụ: chạy bộ, đi làm, leo núi...).
     * Hướng dẫn chi tiết cách bảo quản, vệ sinh để tăng tuổi thọ sản phẩm.
     * Thể hiện góc nhìn chuyên gia ("Tại sao nên chọn mua tại hệ thống của chúng tôi?").

2. **Nội dung nối đuôi chi tiết sản phẩm (productDetailSuffixContent) - "Cam kết Vàng & Bảo chứng lòng tin"**:
   - Đoạn ngắn từ 80-150 từ bằng HTML (thẻ p, strong, ul, li).
   - Tập trung củng cố lòng tin tại "Điểm đưa ra quyết định mua hàng" (Point of Decision):
     * Liệt kê 3-4 cam kết cực kỳ rõ ràng, đanh thép (ví dụ: Bảo hành chính hãng 12 tháng, Đổi trả 7 ngày linh hoạt nếu không vừa size, Giao hàng siêu tốc 2h).
     * Sử dụng thẻ <ul> và <li> với các cụm từ quan trọng được bôi đậm (<strong>) làm nổi bật các lợi ích thiết thực.
     * Tích hợp khéo léo các liên kết giả lập để tạo độ uy tín cao cho Google bot quét (ví dụ: thêm các thẻ <a href="/chinh-sach-bao-hanh" class="text-orange-500 hover:underline">Chính sách bảo hành</a> và <a href="/chinh-sach-doi-tra" class="text-orange-500 hover:underline">Chính sách đổi trả</a>).

3. **Danh sách câu hỏi thường gặp FAQ (faqItems) - "FAQPage Schema & Trực quan hóa câu trả lời"**:
   - Tạo từ 3 đến 5 câu hỏi thực tế và cụ thể nhất mà khách hàng thường thắc mắc khi mua danh mục này (về size giày, độ bền, xuất xứ, đổi hàng).
   - Câu trả lời phải đi thẳng vào vấn đề, rõ ràng, chi tiết, cung cấp thông tin hữu ích và giải quyết triệt để nỗi lo ngại của người mua.

Chỉ trả về DUY NHẤT một đối tượng JSON hợp lệ, không bọc trong khối code markdown (\`\`\`json ... \`\`\`), không có bất kỳ lời mở đầu, giải thích hay hậu từ nào khác.

Schema JSON bắt buộc:
{
  "filterFooterContent": "chuỗi HTML bài viết chuyên sâu cuối trang danh mục",
  "productDetailSuffixContent": "chuỗi HTML cam kết và bảo hành chi tiết sản phẩm",
  "faqItems": [
    {
      "question": "Câu hỏi thường gặp 1 là gì?",
      "answer": "Câu trả lời chi tiết và hữu ích cho câu hỏi 1."
    }
  ]
}`;
  }, [nameInput, infoInput]);

  const result = useMemo(() => {
    if (!rawInput.trim()) { return { errors: [], data: null }; }
    
    const errors: string[] = [];
    let parsed: any = null;

    try {
      parsed = JSON.parse(cleanJsonInput(rawInput));
    } catch {
      return { errors: ['JSON chưa hợp lệ. Hãy kiểm tra dấu ngoặc hoặc các ký tự đặc biệt.'], data: null };
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { errors: ['Dữ liệu gốc phải là một đối tượng JSON.'], data: null };
    }

    if (parsed.filterFooterContent && typeof parsed.filterFooterContent !== 'string') {
      errors.push('Trường "filterFooterContent" phải là một chuỗi văn bản HTML.');
    }

    if (parsed.productDetailSuffixContent && typeof parsed.productDetailSuffixContent !== 'string') {
      errors.push('Trường "productDetailSuffixContent" phải là một chuỗi văn bản HTML.');
    }

    if (parsed.faqItems) {
      if (!Array.isArray(parsed.faqItems)) {
        errors.push('Trường "faqItems" phải là một mảng danh sách câu hỏi.');
      } else {
        parsed.faqItems.forEach((item: any, index: number) => {
          if (typeof item !== 'object' || item === null) {
            errors.push(`Câu hỏi thứ ${index + 1} phải là một đối tượng.`);
          } else {
            if (!item.question?.trim()) {
              errors.push(`Câu hỏi thứ ${index + 1} thiếu trường "question".`);
            }
            if (!item.answer?.trim()) {
              errors.push(`Câu hỏi thứ ${index + 1} thiếu trường "answer".`);
            }
          }
        });
      }
    }

    return { errors, data: parsed };
  }, [rawInput]);

  const canApply = rawInput.trim().length > 0 && result.data !== null && result.errors.length === 0;

  if (!isAiImportEnabled) {
    return null;
  }

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt AI' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const applyItem = () => {
    if (!canApply || !result.data) { return; }
    
    // Map FAQ items to valid format with client-side IDs
    const resolvedFaqItems: FaqItem[] = (result.data.faqItems || []).map((f: any, idx: number) => ({
      id: Date.now() + idx,
      question: (f.question || '').trim(),
      answer: (f.answer || '').trim(),
    }));

    onApply({
      filterFooterContent: (result.data.filterFooterContent || '').trim(),
      productDetailSuffixContent: (result.data.productDetailSuffixContent || '').trim(),
      faqItems: resolvedFaqItems,
    });

    toast.success('Đã tự động điền nội dung danh mục và FAQ thành công!');
    setOpen(false);
    setRawInput('');
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        className="gap-2 border-orange-200 dark:border-orange-900/60 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/20"
        onClick={() => setOpen(true)}
      >
        <Bot size={16} /> 
        Import AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-5xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Bot size={22} className="text-orange-500" />
              Tạo nội dung SEO & FAQ chuẩn EEAT bằng AI
            </DialogTitle>
            <DialogDescription>
              Cung cấp định hướng để tự động tạo bài viết chân trang, chính sách bảo hành và FAQ hữu ích cho khách hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
            {/* Cột trái: Tham số & Prompt */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">1. Định hướng cho AI</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Tên danh mục</Label>
                    <Input 
                      placeholder="Ví dụ: Giày Nike chính hãng..." 
                      value={nameInput} 
                      onChange={(e) => setNameInput(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Thông tin bổ sung / Đặc tính nổi bật</Label>
                    <textarea 
                      placeholder="Ví dụ: Bảo hành 12 tháng, giao nhanh 2h, chuyên chạy bộ, đệm air cực êm..." 
                      value={infoInput} 
                      onChange={(e) => setInfoInput(e.target.value)}
                      className="w-full min-h-[70px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 relative">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <FileText size={15} /> Prompt chuẩn SEO
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700" 
                    onClick={() => void copyText(prompt, 'prompt')}
                  >
                    {lastCopied === 'prompt' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    Copy Prompt
                  </Button>
                </div>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300 font-mono">
                  {prompt}
                </pre>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200">JSON mẫu</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1.5 text-xs border-slate-200 dark:border-slate-700" 
                    onClick={() => void copyText(SAMPLE_CATEGORY_JSON, 'sample')}
                  >
                    {lastCopied === 'sample' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    Copy JSON mẫu
                  </Button>
                </div>
                <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-mono">
                  {SAMPLE_CATEGORY_JSON}
                </pre>
              </div>
            </div>

            {/* Cột phải: Dán & Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  2. Dán kết quả từ AI
                </Label>
                <textarea
                  className="min-h-[260px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Dán mã JSON nhận được từ chatbot AI vào đây..."
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                />
              </div>

              {rawInput.trim().length > 0 && (
                <div className={cn(
                  'rounded-lg border p-3.5 text-sm',
                  result.errors.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                )}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {result.errors.map((error) => (
                        <li key={error} className="flex gap-1.5 items-start">
                          <X size={14} className="mt-0.5 shrink-0 text-red-500" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                      <span className="font-medium">Cấu trúc dữ liệu hợp lệ! Sẵn sàng điền vào form.</span>
                    </div>
                  )}
                </div>
              )}

              {result.data && result.errors.length === 0 && (
                <div className="space-y-3 rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">3. Xem trước nội dung tạo ra</h3>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                    {result.data.filterFooterContent && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b pb-1">Nội dung cuối trang (Footer Content)</p>
                        <div className="line-clamp-3 text-slate-500 dark:text-slate-400 prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: result.data.filterFooterContent }} />
                      </div>
                    )}
                    
                    {result.data.productDetailSuffixContent && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b pb-1">Nối đuôi chi tiết sản phẩm (Suffix Content)</p>
                        <div className="line-clamp-3 text-slate-500 dark:text-slate-400 prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: result.data.productDetailSuffixContent }} />
                      </div>
                    )}

                    {result.data.faqItems && result.data.faqItems.length > 0 && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 border-b pb-1">Danh sách câu hỏi thường gặp FAQ ({result.data.faqItems.length})</p>
                        <div className="space-y-1.5">
                          {result.data.faqItems.map((item: any, idx: number) => (
                            <div key={idx} className="border-b last:border-0 border-slate-100 pb-1 last:pb-0 dark:border-slate-700">
                              <p className="font-medium text-slate-800 dark:text-slate-200">Q: {item.question}</p>
                              <p className="text-slate-500 dark:text-slate-400 line-clamp-1">A: {item.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" className="h-9" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button 
              type="button" 
              variant="accent" 
              disabled={!canApply} 
              onClick={applyItem}
              className="h-9"
            >
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

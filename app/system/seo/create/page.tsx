'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { ImageUploader } from '@/app/admin/components/ImageUploader';

const LANDING_TYPES = [
  { value: 'feature', label: 'Tính năng' },
  { value: 'use-case', label: 'Trường hợp sử dụng' },
  { value: 'solution', label: 'Giải pháp' },
  { value: 'compare', label: 'So sánh' },
  { value: 'integration', label: 'Tích hợp' },
  { value: 'template', label: 'Template' },
  { value: 'guide', label: 'Hướng dẫn' },
] as const;

export default function LandingPageCreatePage() {
  const router = useRouter();
  const createMutation = useMutation(api.landingPages.create);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [heroImage, setHeroImage] = useState<string | undefined>();
  const [landingType, setLandingType] = useState<string>('feature');
  const [primaryIntent, setPrimaryIntent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const generatedSlug = val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036F]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const addFaqItem = () => {
    setFaqItems([...faqItems, { question: '', answer: '' }]);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqItems];
    updated[index][field] = value;
    setFaqItems(updated);
  };

  const removeFaqItem = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !summary.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);
    try {
      const validFaqItems = faqItems.filter(item => item.question.trim() && item.answer.trim());

      await createMutation({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        content: content.trim() || undefined,
        heroImage: heroImage || undefined,
        landingType: landingType as any,
        primaryIntent: primaryIntent.trim() || undefined,
        status,
        faqItems: validFaqItems.length > 0 ? validFaqItems : undefined,
      });

      toast.success('Đã tạo landing page');
      router.push('/system/seo');
    } catch (error) {
      toast.error('Lỗi khi tạo landing page');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold">Tạo Landing Page</h1>
        <p className="text-sm text-slate-500">Tạo landing page mới cho SEO growth</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Nhập tiêu đề..."
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
                required
              />
            </div>

            <div>
              <Label htmlFor="landingType">Landing Type *</Label>
              <select
                id="landingType"
                value={landingType}
                onChange={(e) => setLandingType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {LANDING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="summary">Summary *</Label>
              <textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Mô tả ngắn gọn..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <Label htmlFor="primaryIntent">Primary Intent (SEO)</Label>
              <Input
                id="primaryIntent"
                value={primaryIntent}
                onChange={(e) => setPrimaryIntent(e.target.value)}
                placeholder="Mô tả search intent chính..."
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hero Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              value={heroImage}
              onChange={(url) => setHeroImage(url)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nội dung chi tiết</CardTitle>
          </CardHeader>
          <CardContent>
            <LexicalEditor
              initialContent={content}
              onChange={setContent}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQ Items (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border rounded p-4 space-y-2">
                <Input
                  placeholder="Câu hỏi"
                  value={item.question}
                  onChange={(e) => updateFaqItem(index, 'question', e.target.value)}
                />
                <textarea
                  placeholder="Câu trả lời"
                  value={item.answer}
                  onChange={(e) => updateFaqItem(index, 'answer', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFaqItem(index)}
                >
                  Xóa
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFaqItem}>
              + Thêm FAQ
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" size={16} />}
            Tạo Landing Page
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/system/seo')}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}

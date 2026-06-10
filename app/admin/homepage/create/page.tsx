'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  ArrowLeft, FileText, Home, ImageIcon,
  LayoutGrid, Loader2, Phone, Save, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { ModuleGuard } from '../../components/ModuleGuard';

const MODULE_KEY = 'homepage';

const SECTION_TYPES = [
  { description: 'Banner chính đầu trang', icon: ImageIcon, label: 'Hero Banner', value: 'hero' },
  { description: 'Section giới thiệu công ty', icon: FileText, label: 'Giới thiệu', value: 'about' },
  { description: 'Hiển thị sản phẩm featured', icon: LayoutGrid, label: 'Sản phẩm nổi bật', value: 'products' },
  { description: 'Hiển thị bài viết gần đây', icon: FileText, label: 'Bài viết mới', value: 'posts' },
  { description: 'Logo đối tác/khách hàng', icon: Users, label: 'Đối tác', value: 'partners' },
  { description: 'Form liên hệ nhanh', icon: Phone, label: 'Liên hệ', value: 'contact' },
];

const DEFAULT_CONFIGS: Record<string, object> = {
  about: {
    content: 'Nội dung giới thiệu...',
    heading: 'Về chúng tôi',
    image: '',
  },
  contact: {
    heading: 'Liên hệ với chúng tôi',
    showForm: true,
    showMap: false,
    subheading: 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
  },
  hero: {
    backgroundImage: '',
    buttonLink: '/',
    buttonText: 'Xem thêm',
    heading: 'Tiêu đề chính',
    subheading: 'Mô tả ngắn',
  },
  partners: {
    heading: 'Đối tác của chúng tôi',
    logos: [],
  },
  posts: {
    heading: 'Tin tức & Bài viết',
    limit: 6,
    showDate: true,
    showExcerpt: true,
    subheading: 'Cập nhật những thông tin mới nhất',
  },
  products: {
    heading: 'Sản phẩm nổi bật',
    limit: 8,
    showButton: true,
    showPrice: true,
    subheading: 'Những sản phẩm được yêu thích nhất',
  },
};

export default function CreateHomepageSectionPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <CreateContent />
    </ModuleGuard>
  );
}

function CreateContent() {
  const router = useRouter();
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const componentsData = useQuery(api.homeComponents.listAll);
  const createComponent = useMutation(api.homeComponents.create);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    active: true,
    config: JSON.stringify(DEFAULT_CONFIGS.hero, null, 2),
    title: '',
    type: 'hero',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxSections = useMemo(() => settingsData?.find(s => s.settingKey === 'maxSections')?.value as number ?? 10, [settingsData]);

  const currentCount = componentsData?.length ?? 0;
  const canAddMore = currentCount < maxSections;

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      config: JSON.stringify(DEFAULT_CONFIGS[type] || {}, null, 2),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tên section';
    }
    if (!formData.type) {
      newErrors.type = 'Vui lòng chọn loại section';
    }
    try {
      JSON.parse(formData.config);
    } catch {
      newErrors.config = 'JSON không hợp lệ';
    }
    if (!canAddMore) {
      newErrors.general = `Đã đạt giới hạn ${maxSections} sections`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {return;}

    setIsSubmitting(true);
    try {
      let config;
      try {
        config = JSON.parse(formData.config);
      } catch {
        config = {};
      }

      await createComponent({
        active: formData.active,
        config,
        title: formData.title.trim(),
        type: formData.type,
      });
      toast.success('Đã tạo section mới!');
      router.push('/admin/homepage');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo section');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/homepage">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Home className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm section mới</h1>
            <p className="text-sm text-slate-500">Tạo section mới cho trang chủ ({currentCount}/{maxSections})</p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Thông tin cơ bản</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Tên section *</Label>
                  <CopyableInput
                    id="title"
                    value={formData.title}
                    onChange={(e) =>{  setFormData(prev => ({ ...prev, title: e.target.value })); }}
                    copyLabel="tên section"
                    placeholder="VD: Hero Banner, Giới thiệu..."
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="type">Loại section *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {SECTION_TYPES.map(({ value, label, icon: Icon, description }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>{  handleTypeChange(value); }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.type === value 
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={formData.type === value ? 'text-orange-600' : 'text-slate-500'} />
                          <span className={`font-medium text-sm ${formData.type === value ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{description}</p>
                      </button>
                    ))}
                  </div>
                  {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Cấu hình JSON</h2>
              <p className="text-sm text-slate-500 mb-3">
                Cấu hình chi tiết cho section dạng JSON. Mỗi loại section có các trường khác nhau.
              </p>
              <textarea
                value={formData.config}
                onChange={(e) =>{  setFormData(prev => ({ ...prev, config: e.target.value })); }}
                rows={12}
                className={`w-full font-mono text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg p-4 outline-none focus:border-orange-500 ${
                  errors.config ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="{}"
              />
              {errors.config && <p className="text-red-500 text-sm mt-1">{errors.config}</p>}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Trạng thái</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>{  setFormData(prev => ({ ...prev, active: e.target.checked })); }}
                  className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Hiển thị section</span>
              </label>
              <p className="text-sm text-slate-500 mt-2">
                Bật để section hiển thị trên trang chủ
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Hành động</h2>
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full gap-2 bg-orange-600 hover:bg-orange-500"
                  disabled={isSubmitting || !canAddMore}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Tạo section
                    </>
                  )}
                </Button>
                <Link href="/admin/homepage" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Hủy
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

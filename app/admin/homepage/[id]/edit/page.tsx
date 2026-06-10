'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { 
  ArrowLeft, FileText, Home, ImageIcon,
  LayoutGrid, Loader2, Phone, Save, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { ModuleGuard } from '../../../components/ModuleGuard';

const MODULE_KEY = 'homepage';

const SECTION_TYPES = [
  { description: 'Banner chính đầu trang', icon: ImageIcon, label: 'Hero Banner', value: 'hero' },
  { description: 'Section giới thiệu công ty', icon: FileText, label: 'Giới thiệu', value: 'about' },
  { description: 'Hiển thị sản phẩm featured', icon: LayoutGrid, label: 'Sản phẩm nổi bật', value: 'products' },
  { description: 'Hiển thị bài viết gần đây', icon: FileText, label: 'Bài viết mới', value: 'posts' },
  { description: 'Logo đối tác/khách hàng', icon: Users, label: 'Đối tác', value: 'partners' },
  { description: 'Form liên hệ nhanh', icon: Phone, label: 'Liên hệ', value: 'contact' },
];

export default function EditHomepageSectionPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <EditContent />
    </ModuleGuard>
  );
}

function EditContent() {
  const params = useParams();
  const id = params.id as Id<"homeComponents">;

  const componentData = useQuery(api.homeComponents.getById, { id });
  const updateComponent = useMutation(api.homeComponents.update);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [formData, setFormData] = useState({
    active: true,
    config: '{}',
    title: '',
    type: 'hero',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing data
  useEffect(() => {
    if (componentData && !isDataLoaded) {
      setFormData({
        active: componentData.active,
        config: JSON.stringify(componentData.config, null, 2),
        title: componentData.title,
        type: componentData.type,
      });
      setIsDataLoaded(true);
    }
  }, [componentData, isDataLoaded]);

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

      await updateComponent({
        active: formData.active,
        config,
        id,
        title: formData.title.trim(),
        type: formData.type,
      });
      toast.success('Đã cập nhật section!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật section');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (componentData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (componentData === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-slate-500">Không tìm thấy section này</p>
        <Link href="/admin/homepage">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sửa section</h1>
            <p className="text-sm text-slate-500">Chỉnh sửa &quot;{componentData.title}&quot;</p>
          </div>
        </div>
      </div>

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
                        onClick={() =>{  setFormData(prev => ({ ...prev, type: value })); }}
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
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Thông tin</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Thứ tự:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{componentData.order + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái hiện tại:</span>
                  <span className={`font-medium ${componentData.active ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {componentData.active ? 'Đang hiển thị' : 'Đang ẩn'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Hành động</h2>
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full gap-2 bg-orange-600 hover:bg-orange-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu thay đổi
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

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';

const MODULE_KEY = 'customers';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// CUST-005 FIX: Add phone validation for Vietnamese phone numbers
const isValidPhone = (phone: string) => /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone.replaceAll(/\s|-/g, ''));

interface FormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  status: 'Active' | 'Inactive';
}

export default function CustomerCreatePage() {
  const router = useRouter();
  
  // Convex
  const createCustomer = useMutation(api.customers.create);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    address: '',
    city: '',
    email: '',
    name: '',
    notes: '',
    phone: '',
    status: 'Active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showNotes = enabledFeatures.enableNotes ?? true;
  const showAddresses = enabledFeatures.enableAddresses ?? true;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }
    if (!isValidEmail(formData.email.trim())) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    // CUST-005 FIX: Validate phone format
    if (!isValidPhone(formData.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createCustomer({
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        email: formData.email.toLowerCase().trim(),
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
        phone: formData.phone.trim(),
        status: formData.status,
      });
      toast.success('Đã tạo khách hàng mới');
      router.push('/admin/customers');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm khách hàng mới</h1>
        <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Họ tên <span className="text-red-500">*</span></Label>
                <CopyableInput
                  required
                  placeholder="Nhập họ tên..."
                  value={formData.name}
                  copyLabel="họ tên"
                  onChange={(e) =>{  handleChange('name', e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  required
                  placeholder="Nhập email..."
                  value={formData.email}
                  onChange={(e) =>{  handleChange('email', e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                <Input
                  required
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={(e) =>{  handleChange('phone', e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={(e) =>{  handleChange('status', e.target.value); }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Đã khóa</option>
                </select>
              </div>
            </div>

            {showAddresses && (
              <>
                <div className="space-y-2">
                  <Label>Thành phố</Label>
                  <Input
                    placeholder="Nhập thành phố..."
                    value={formData.city}
                    onChange={(e) =>{  handleChange('city', e.target.value); }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Địa chỉ</Label>
                  <Input
                    placeholder="Nhập địa chỉ đầy đủ..."
                    value={formData.address}
                    onChange={(e) =>{  handleChange('address', e.target.value); }}
                  />
                </div>
              </>
            )}

            {showNotes && (
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ghi chú về khách hàng..."
                  value={formData.notes}
                  onChange={(e) =>{  handleChange('notes', e.target.value); }}
                />
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/customers'); }}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Tạo khách hàng
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

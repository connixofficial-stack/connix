'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { ImageUploader } from '../../components/ImageUploader';
import { useAdminAuth } from '../../auth/context';

const MODULE_KEY = 'users';

export default function UserCreatePage() {
  const { hasPermission, isLoading: isAuthLoading, token } = useAdminAuth();
  const canCreate = hasPermission(MODULE_KEY, 'create');

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <ShieldOff size={40} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Không có quyền truy cập</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền tạo người dùng mới.</p>
        <div className="mt-6">
          <Link href="/admin/users"><Button>Quay lại danh sách</Button></Link>
        </div>
      </Card>
    );
  }

  return <UserCreateForm token={token} />;
}

function UserCreateForm({ token }: { token: string | null }) {
  const router = useRouter();
  const rolesData = useQuery(api.roles.listAll);
  const rolesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'roles' });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const createUser = useMutation(api.users.create);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [roleId, setRoleId] = useState<Id<"roles"> | ''>('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Banned'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRolesEnabled = rolesModule?.enabled ?? false;
  const isLoading = fieldsData === undefined || rolesModule === undefined || (isRolesEnabled && rolesData === undefined);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  // USR-007 FIX: Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (isRolesEnabled && !roleId) {
      toast.error('Vui lòng chọn vai trò');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }
    setIsSubmitting(true);
    try {
      await createUser({
        avatar: enabledFields.has('avatar') && avatar ? avatar : undefined,
        email,
        name,
        password,
        phone: enabledFields.has('phone') && phone ? phone : undefined,
        roleId: isRolesEnabled ? (roleId || undefined) : undefined,
        status,
        token,
      });
      toast.success('Đã tạo người dùng mới');
      router.push('/admin/users');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm User mới</h1>
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
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
                  value={name}
                  copyLabel="họ tên"
                  onChange={(e) =>{  setName(e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input 
                  type="email" 
                  required 
                  placeholder="Nhập email..." 
                  value={email}
                  onChange={(e) =>{  setEmail(e.target.value); }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mật khẩu <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) =>{  setPassword(e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Xác nhận mật khẩu <span className="text-red-500">*</span></Label>
                <Input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChange={(e) =>{  setConfirmPassword(e.target.value); }}
                />
              </div>
            </div>

            {enabledFields.has('phone') && (
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input 
                  placeholder="Nhập số điện thoại..." 
                  value={phone}
                  onChange={(e) =>{  setPhone(e.target.value); }}
                />
              </div>
            )}

            {enabledFields.has('avatar') && (
              <div className="space-y-2">
                <Label>Ảnh đại diện</Label>
                <ImageUploader
                  value={avatar}
                  onChange={(url) =>{  setAvatar(url); }}
                  folder="users"
                  aspectRatio="square"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {isRolesEnabled ? (
                <div className="space-y-2">
                  <Label>Vai trò <span className="text-red-500">*</span></Label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={roleId}
                    onChange={(e) =>{  setRoleId(e.target.value as Id<"roles">); }}
                    required
                  >
                    <option value="">Chọn vai trò...</option>
                    {rolesData?.map(role => (
                      <option key={role._id} value={role._id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Vai trò</Label>
                  <div className="h-10 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 flex items-center text-sm text-slate-500">
                    Đang dùng quyền full admin, user mới sẽ gán role Admin mặc định.
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) =>{  setStatus(e.target.value as 'Active' | 'Inactive' | 'Banned'); }}
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Không hoạt động</option>
                  <option value="Banned">Bị cấm</option>
                </select>
              </div>
            </div>
          </CardContent>
          <HomeComponentStickyFooter
            isSubmitting={isSubmitting}
            onCancel={() =>{  router.push('/admin/users'); }}
            submitLabel="Tạo User"
            submittingLabel="Đang tạo..."
            disableSave={isSubmitting}
          />
        </form>
      </Card>
    </div>
  );
}

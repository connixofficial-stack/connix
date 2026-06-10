'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Loader2, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, CardContent, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { ImageUploader } from '../../../components/ImageUploader';
import { useAdminAuth } from '../../../auth/context';

const MODULE_KEY = 'users';

export default function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { hasPermission, isLoading: isAuthLoading, token } = useAdminAuth();
  const canEdit = hasPermission(MODULE_KEY, 'edit');

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <ShieldOff size={40} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Không có quyền truy cập</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền chỉnh sửa người dùng.</p>
        <div className="mt-6">
          <Link href="/admin/users"><Button>Quay lại danh sách</Button></Link>
        </div>
      </Card>
    );
  }

  return <UserEditForm params={params} token={token} />;
}

function UserEditForm({ params, token }: { params: Promise<{ id: string }>; token: string | null }) {
  const { id } = use(params);
  const router = useRouter();
  const userData = useQuery(api.users.getById, { id: id as Id<"users"> });
  const rolesData = useQuery(api.roles.listAll);
  const rolesModule = useQuery(api.admin.modules.getModuleByKey, { key: 'roles' });
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const activityLogs = useQuery(api.activityLogs.getRecentByUser, { limit: 10, userId: id as Id<"users"> });
  const updateUser = useMutation(api.users.update);
  const changePassword = useMutation(api.users.changePassword);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [roleId, setRoleId] = useState<Id<"roles"> | ''>('');
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Banned'>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isRolesEnabled = rolesModule?.enabled ?? false;
  const isLoading = userData === undefined || fieldsData === undefined || rolesModule === undefined || (isRolesEnabled && rolesData === undefined);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const hasChanges = useMemo(() => {
    if (!userData) {return false;}

    const current = {
      avatar: enabledFields.has('avatar') ? avatar : undefined,
      email: email.trim(),
      name: name.trim(),
      phone: enabledFields.has('phone') ? phone.trim() : undefined,
      roleId: isRolesEnabled ? (roleId || undefined) : undefined,
      status,
    };
    const original = {
      avatar: enabledFields.has('avatar') ? userData.avatar : undefined,
      email: userData.email.trim(),
      name: userData.name.trim(),
      phone: enabledFields.has('phone') ? (userData.phone ?? '').trim() : undefined,
      roleId: isRolesEnabled ? userData.roleId : undefined,
      status: userData.status,
    };

    return JSON.stringify(current) !== JSON.stringify(original);
  }, [avatar, email, enabledFields, isRolesEnabled, name, phone, roleId, status, userData]);

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setEmail(userData.email);
      setPhone(userData.phone ?? '');
      setAvatar(userData.avatar);
      setRoleId(userData.roleId);
      setStatus(userData.status);
    }
  }, [userData]);

  // USR-007 FIX: Email validation regex
  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) {return;}
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
    setIsSubmitting(true);
    try {
      await updateUser({
        avatar: enabledFields.has('avatar') ? avatar : undefined,
        email,
        id: id as Id<"users">,
        name,
        phone: enabledFields.has('phone') && phone ? phone : undefined,
        roleId: isRolesEnabled ? (roleId || undefined) : undefined,
        status,
        token,
      });
      toast.success('Đã cập nhật người dùng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({ id: id as Id<"users">, password: newPassword, token });
      toast.success('Đã cập nhật mật khẩu');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center py-8 text-slate-500">Không tìm thấy người dùng</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa User</h1>
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
                    Module vai trò đang tắt. Không thể đổi vai trò trong lúc này.
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

            {enabledFields.has('lastLogin') && userData.lastLogin && (
              <div className="text-sm text-slate-500">
                Đăng nhập lần cuối: {new Date(userData.lastLogin).toLocaleString('vi-VN')}
              </div>
            )}
          </CardContent>
          <HomeComponentStickyFooter
            isSubmitting={isSubmitting}
            hasChanges={hasChanges}
            submitLabel="Lưu thay đổi"
            savedLabel="Đã lưu"
            disableSave={!hasChanges || isSubmitting}
            align="end"
          >
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/users'); }} disabled={isSubmitting}>Hủy bỏ</Button>
              <Button
                type="submit"
                variant="accent"
                disabled={!hasChanges || isSubmitting}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                {hasChanges ? 'Lưu thay đổi' : 'Đã lưu'}
              </Button>
            </div>
          </HomeComponentStickyFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleChangePassword}>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Đổi mật khẩu</h3>
              <p className="text-sm text-slate-500">Nhập mật khẩu mới để cập nhật cho người dùng.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mật khẩu mới</Label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu mới..."
                  value={newPassword}
                  onChange={(e) =>{  setNewPassword(e.target.value); }}
                />
              </div>
              <div className="space-y-2">
                <Label>Xác nhận mật khẩu</Label>
                <Input
                  type="password"
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChange={(e) =>{  setConfirmPassword(e.target.value); }}
                />
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex justify-end">
            <Button type="submit" variant="accent" disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 size={16} className="animate-spin mr-2" />}
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Hoạt động gần đây</h3>
              <p className="text-sm text-slate-500">10 hoạt động mới nhất của người dùng.</p>
            </div>
          </div>
          {activityLogs === undefined ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : activityLogs.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có hoạt động nào.</p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => {
                const detailsText = typeof log.details === 'string'
                  ? log.details
                  : log.details
                    ? JSON.stringify(log.details)
                    : '';
                return (
                  <div key={log._id} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{log.action}</div>
                        <div className="text-xs text-slate-500">{log.targetType} · {log.targetId}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log._creationTime).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    {detailsText && (
                      <div className="text-xs text-slate-500 mt-2 break-words">
                        {detailsText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

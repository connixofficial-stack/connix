'use client';

import React, { useEffect, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../components/ui';
import { useAdminAuth } from '../auth/context';
import { isValidImageSrc } from '@/lib/utils/image';

export default function AdminProfilePage() {
  const router = useRouter();
  const { isLoading, logout, token, user } = useAdminAuth();
  const role = useQuery(api.roles.getById, user ? { id: user.roleId as Id<'roles'> } : 'skip');
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'users' });
  const changeMyPassword = useMutation(api.auth.changeMyPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const enabledFeatures = React.useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(feature => { features[feature.featureKey] = feature.enabled; });
    return features;
  }, [featuresData]);

  const showAvatar = enabledFeatures.enableAvatar ?? true;

  const displayName = user?.name ?? 'Admin';
  const displayEmail = user?.email ?? '';
  const avatarUrl = showAvatar ? user?.avatar : undefined;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.isSuperAdmin ? 'Super Admin' : role?.name ?? 'Không xác định';

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/auth/login');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Phiên đăng nhập không hợp lệ');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changeMyPassword({ currentPassword, newPassword, token });
      if (result.success) {
        toast.success(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              {avatarUrl && isValidImageSrc(avatarUrl) && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={80}
                  height={80}
                  onError={() => setAvatarError(true)}
                  className="w-20 h-20 rounded-full ring-2 ring-white dark:ring-slate-700"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
                  {initials || 'AD'}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 flex-1">
              <div>
                <p className="text-sm text-slate-500">Họ tên</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{displayName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{displayEmail}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Vai trò</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{roleLabel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" variant="accent" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="destructive" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}


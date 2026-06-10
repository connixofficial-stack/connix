'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, Loader2, Lock, Mail, Save, Shield, User } from 'lucide-react';

type ManageMode = 'existing' | 'new';
type UserId = Id<'users'>;
type TrialDurationValue = 'permanent' | '1' | '7' | '30' | '90';

const TRIAL_DURATION_OPTIONS: Array<{ label: string; value: Exclude<TrialDurationValue, 'permanent'> }> = [
  { label: '1 ngày', value: '1' },
  { label: '1 tuần', value: '7' },
  { label: '1 tháng', value: '30' },
  { label: '3 tháng', value: '90' },
];

function formatTrialLabel(expiresAt?: number) {
  if (!expiresAt) {
    return 'Vĩnh viễn';
  }

  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    return 'Đã hết hạn';
  }

  const totalHours = Math.floor(remainingMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `Còn ${days} ngày ${hours} giờ`;
  }

  const minutes = Math.max(Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)), 0);
  return `Còn ${hours} giờ ${minutes} phút`;
}

export default function AdminConfigPage() {
  const superAdmins = useQuery(api.auth.listSuperAdmins);
  const adminUsers = useQuery(api.auth.listAdminUsersForSystem, { limit: 20 });
  const addSuperAdmin = useMutation(api.auth.addSuperAdmin);
  const demoteSuperAdmin = useMutation(api.auth.demoteSuperAdmin);
  const cleanupExpiredTrials = useMutation(api.auth.cleanupExpiredSuperAdminTrials);

  const [mode, setMode] = useState<ManageMode>('existing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<UserId | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [trialDuration, setTrialDuration] = useState<TrialDurationValue>('permanent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSuperAdmin = (superAdmins?.length ?? 0) > 0;
  const canDemote = useMemo(() => (superAdmins?.length ?? 0) > 1, [superAdmins]);
  const resolvedSearch = searchTerm.trim() ? searchTerm.trim() : undefined;
  const adminUsersSearch = useQuery(api.auth.listAdminUsersForSystem, {
    limit: 20,
    search: resolvedSearch,
  });
  const resolvedUsers = resolvedSearch ? adminUsersSearch : adminUsers;

  useEffect(() => {
    void cleanupExpiredTrials({});
  }, [cleanupExpiredTrials]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Vui lòng chọn user để nâng quyền');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSuperAdmin({
        existingUserId: selectedUserId,
        trialDurationDays: trialDuration === 'permanent' ? undefined : Number(trialDuration) as 1 | 7 | 30 | 90,
      });
      if (result.success) {
        toast.success(result.message);
        setSelectedUserId('');
        setSearchTerm('');
        setTrialDuration('permanent');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addSuperAdmin({
        email,
        name: name || undefined,
        password,
        trialDurationDays: trialDuration === 'permanent' ? undefined : Number(trialDuration) as 1 | 7 | 30 | 90,
      });
      if (result.success) {
        toast.success(result.message);
        setEmail('');
        setName('');
        setPassword('');
        setConfirmPassword('');
        setTrialDuration('permanent');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemote = async (userId: UserId) => {
    if (!canDemote) {
      toast.error('Phải giữ tối thiểu 1 Super Admin');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await demoteSuperAdmin({ userId });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (superAdmins === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-500/10 rounded-xl">
          <Shield className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Cấu hình Super Admin
          </h1>
          <p className="text-sm text-slate-500">
            Quản trị viên cao nhất cho /admin
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${hasSuperAdmin ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
        <div className="flex items-center gap-3">
          {hasSuperAdmin ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">Đã có {superAdmins.length} Super Admin</p>
                <p className="text-sm text-slate-500">Có thể thêm hoặc gỡ quyền, tối thiểu 1 tài khoản.</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-600 dark:text-amber-400">Chưa có Super Admin</p>
                <p className="text-sm text-slate-500">Vui lòng tạo hoặc nâng quyền để sử dụng /admin.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Danh sách Super Admin</h2>
            <span className="text-xs text-slate-500">Tối thiểu 1 tài khoản</span>
          </div>

          <div className="space-y-3">
            {superAdmins.length === 0 ? (
              <div className="text-sm text-slate-500">Chưa có Super Admin nào.</div>
            ) : (
              superAdmins.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.email} • {item.status}</p>
                    <p className={`text-xs mt-1 ${item.trialExpiresAt ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatTrialLabel(item.trialExpiresAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canDemote || isSubmitting}
                    onClick={() => handleDemote(item.id)}
                    className="text-xs text-red-600 hover:text-red-500 disabled:text-slate-400 disabled:cursor-not-allowed"
                    title={!canDemote ? 'Phải giữ tối thiểu 1 Super Admin' : undefined}
                  >
                    Gỡ quyền
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'existing' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              Nâng quyền user
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`px-3 py-1.5 rounded-lg text-sm ${mode === 'new' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
            >
              Tạo mới
            </button>
          </div>

          {mode === 'existing' ? (
            <form onSubmit={handlePromote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tìm user từ /admin/users
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Nhập tên, email hoặc phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chọn user
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedUserId(value ? (value as UserId) : '');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="">-- Chọn user --</option>
                  {resolvedUsers?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} • {user.email} {user.roleName ? `(${user.roleName})` : ''}
                    </option>
                  ))}
                </select>
                {resolvedUsers && resolvedUsers.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">Không có user phù hợp.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Thời hạn cấp quyền
                </label>
                <select
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(e.target.value as TrialDurationValue)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="permanent">Vĩnh viễn</option>
                  {TRIAL_DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">Chọn thời gian dùng thử, hết hạn hệ thống sẽ xóa tài khoản trial.</p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Nâng quyền Super Admin
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Super Admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Thời hạn cấp quyền
                </label>
                <select
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(e.target.value as TrialDurationValue)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="permanent">Vĩnh viễn</option>
                  {TRIAL_DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">Chọn thời gian dùng thử nếu muốn tự xóa tài khoản sau hạn.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Tạo Super Admin
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium mb-2">Lưu ý:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Super Admin có toàn quyền trong /admin và không thể bị xóa từ /admin/users.</li>
          <li>Có thể có nhiều Super Admin nhưng phải giữ tối thiểu 1 tài khoản.</li>
          <li>Tài khoản trial sẽ tự bị xóa khi hết hạn, kể cả session /admin đang dùng.</li>
          <li>Nên dùng “Nâng quyền user” để tránh tạo trùng email.</li>
        </ul>
      </div>
    </div>
  );
}

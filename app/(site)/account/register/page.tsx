'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { useCustomerAuth } from '@/app/(site)/auth/context';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, register } = useCustomerAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClaimLink, setShowClaimLink] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/account/profile');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowClaimLink(false);
    setIsSubmitting(true);

    try {
      const result = await register({ email, name, password, phone });
      if (result.success) {
        router.push('/account/profile');
      } else {
        setError(result.message);
        if (result.code === 'GUEST_ACCOUNT_EXISTS') {
          setShowClaimLink(true);
        }
      }
    } catch {
      setError('Có lỗi xảy ra khi đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {showClaimLink && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Tài khoản này đã tồn tại dưới dạng khách mua hàng vãng lai. Bạn có thể kích hoạt mật khẩu ngay để giữ lịch sử mua hàng và tiếp tục đăng nhập.
              </p>
              <Link
                href={`/account/login?mode=claim&identifier=${encodeURIComponent(email)}`}
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Kích hoạt tài khoản ngay
              </Link>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) =>{  setName(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                placeholder="Nguyễn Văn A"
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) =>{  setEmail(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) =>{  setPhone(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                placeholder="0912 345 678"
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) =>{  setPassword(e.target.value); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                placeholder="Tối thiểu 6 ký tự"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Đã có tài khoản?{' '}
          <Link href="/account/login" className="text-slate-900 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

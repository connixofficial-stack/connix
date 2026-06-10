'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, identify, requestPasswordSetup, completePasswordSetup } = useCustomerAuth();

  const [step, setStep] = useState<'identifier' | 'password' | 'password_setup'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [otpRequired, setOtpRequired] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const prefill = params.get('identifier') || params.get('email') || '';
      if (prefill) {
        setIdentifier(prefill);
      }
      const mode = params.get('mode');
      if (mode === 'claim' && prefill) {
        // Auto trigger identify
        void (async () => {
          setIsSubmitting(true);
          const res = await identify(prefill);
          if (res.success) {
            if (res.state === 'requiresPasswordSetup') {
              setMaskedEmail(res.maskedEmail || '');
              const otpRes = await requestPasswordSetup(prefill);
              if (otpRes.success) {
                setStep('password_setup');
                setOtpRequired(otpRes.otpRequired !== false);
              } else {
                setError(otpRes.message);
                toast.error(otpRes.message);
              }
            } else if (res.state === 'requiresPassword') {
              setStep('password');
              toast.info('Tài khoản này đã được kích hoạt trước đó. Vui lòng đăng nhập bằng mật khẩu.');
            }
          }
          setIsSubmitting(false);
        })();
      }
    }
  }, [identify, requestPasswordSetup]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirectTo');
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/account/profile');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await identify(identifier);
      if (res.success) {
        if (res.state === 'requiresPassword') {
          setStep('password');
        } else if (res.state === 'requiresPasswordSetup') {
          setMaskedEmail(res.maskedEmail || '');
          const otpRes = await requestPasswordSetup(identifier);
          if (otpRes.success) {
            setStep('password_setup');
            setOtpRequired(otpRes.otpRequired !== false);
            setOtpSentMessage(otpRes.message);
            toast.success(otpRes.message);
          } else {
            setError(otpRes.message);
          }
        } else {
          setError('Tài khoản chưa tồn tại trên hệ thống. Vui lòng đăng ký mới.');
        }
      } else {
        setError(res.message);
      }
    } catch {
      setError('Có lỗi xảy ra khi kiểm tra thông tin tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(identifier, password);
      if (result.success) {
        toast.success('Đăng nhập thành công!');
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo');
        router.push(redirectTo || '/account/profile');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpRequired && (!otpCode || otpCode.length < 6)) {
      setError('Vui lòng nhập mã xác minh gồm 6 số.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const result = await completePasswordSetup(identifier, otpRequired ? otpCode : 'BYPASS', newPassword);
      if (result.success) {
        toast.success('Đã kích hoạt tài khoản và đăng nhập thành công!');
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo');
        router.push(redirectTo || '/account/profile');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Có lỗi xảy ra khi thiết lập mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const otpRes = await requestPasswordSetup(identifier);
      if (otpRes.success) {
        setOtpRequired(otpRes.otpRequired !== false);
        setOtpSentMessage(otpRes.message);
        toast.success(otpRes.message);
      } else {
        setError(otpRes.message);
      }
    } catch {
      setError('Lỗi kết nối khi gửi lại mã.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Đăng nhập</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {step === 'identifier' && 'Nhập email hoặc số điện thoại để bắt đầu'}
            {step === 'password' && 'Nhập mật khẩu để truy cập tài khoản'}
            {step === 'password_setup' && 'Kích hoạt mật khẩu cho tài khoản mua hàng vãng lai'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-sm text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {step === 'identifier' && (
            <form onSubmit={handleIdentify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email hoặc Số điện thoại
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:outline-none transition-all text-sm"
                    placeholder="name@example.com hoặc SĐT"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Nếu bạn từng mua hàng tại shop, hãy nhập đúng email/SĐT đã điền khi đặt hàng.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang kiểm tra...
                  </>
                ) : (
                  'Tiếp tục'
                )}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep('identifier')}
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white gap-1 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tài khoản
                </label>
                <div className="px-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {identifier}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:outline-none transition-all text-sm"
                    placeholder="Nhập mật khẩu"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          )}

          {step === 'password_setup' && (
            <form onSubmit={handleCompleteSetup} className="space-y-5">
              <button
                type="button"
                onClick={() => setStep('identifier')}
                className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white gap-1 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Kích hoạt tài khoản cũ</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Tài khoản của bạn đã được tìm thấy qua thông tin: <strong>{maskedEmail || identifier}</strong>. {otpRequired ? 'Nhập mã OTP đã được gửi và tạo mật khẩu mới.' : 'Hãy thiết lập mật khẩu mới bên dưới để kích hoạt tài khoản.'}
                </p>
              </div>

              {otpRequired && otpSentMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {otpSentMessage}
                </p>
              )}

              {otpRequired && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Mã xác minh (OTP)
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:outline-none transition-all text-sm tracking-widest font-bold"
                      placeholder="Mã gồm 6 chữ số"
                      required={otpRequired}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Thiết lập Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:outline-none transition-all text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Kích hoạt & Đăng nhập'
                  )}
                </button>

                {otpRequired && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white py-2 text-center underline cursor-pointer"
                  >
                    Không nhận được mã? Gửi lại mã
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {step === 'identifier' && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <Link href="/account/register" className="text-slate-900 dark:text-white font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

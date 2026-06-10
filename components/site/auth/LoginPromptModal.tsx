'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

type LoginPromptModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginPromptModal({ isOpen, onClose }: LoginPromptModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Đăng nhập để lưu yêu thích</h2>
        <p className="mt-2 text-sm text-slate-500">Bạn cần đăng nhập để lưu sản phẩm vào danh sách yêu thích.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/account/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            onClick={onClose}
          >
            Đăng nhập
          </Link>
          <Link
            href="/account/register"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Tạo tài khoản
          </Link>
        </div>
      </div>
    </div>
  );
}

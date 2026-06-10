'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MessageCircle, Phone, X } from 'lucide-react';

interface QuickContactModalProps {
  brandColor: string;
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  zalo: string;
  messenger: string;
  serviceName?: string;
}

function QuickContactModal({ brandColor, isOpen, onClose, phone, zalo, messenger, serviceName }: QuickContactModalProps) {
  const encodedMessage = useMemo(() => {
    const message = serviceName
      ? `Xin chào, tôi muốn tư vấn về dịch vụ: ${serviceName}`
      : 'Xin chào, tôi cần tư vấn';
    return encodeURIComponent(message);
  }, [serviceName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose();}
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {return null;}

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) =>{  e.stopPropagation(); }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Liên hệ tư vấn</p>
            <h3 className="text-lg font-semibold text-slate-900">Chọn kênh liên hệ</h3>
            {serviceName && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">Dịch vụ: {serviceName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Phone size={18} style={{ color: brandColor }} />
                Gọi điện
              </span>
              <span className="text-slate-500">{phone}</span>
            </a>
          )}
          {zalo && (
            <a
              href={`https://zalo.me/${zalo}?text=${encodedMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: brandColor }} />
                Chat Zalo
              </span>
              <span className="text-slate-500">{zalo}</span>
            </a>
          )}
          {messenger && (
            <a
              href={messenger}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: brandColor }} />
                Messenger
              </span>
              <span className="text-slate-500">Chat ngay</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuickContactButtonsProps {
  serviceName?: string;
  brandColor: string;
  className?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export function QuickContactButtons({ 
  serviceName, 
  brandColor,
  className = '',
  buttonLabel = 'Liên hệ tư vấn',
  buttonHref
}: QuickContactButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contactSettings = useQuery(api.settings.getMultiple, {
    keys: ['contact_phone', 'contact_zalo', 'contact_messenger']
  });

  if (buttonHref) {
    return (
      <div className={`w-full ${className}`}>
        <a
          href={buttonHref}
          target="_blank"
          rel="noreferrer"
          className="w-full min-h-11 px-6 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2"
          style={{ backgroundColor: brandColor }}
        >
          <Phone size={18} />
          {buttonLabel}
        </a>
      </div>
    );
  }

  if (!contactSettings) {
    return null;
  }

  const phone = contactSettings.contact_phone as string || '';
  const zalo = contactSettings.contact_zalo as string || '';
  const messenger = contactSettings.contact_messenger as string || '';

  const hasContact = Boolean(phone || zalo || messenger);

  if (!hasContact) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <button
        onClick={() =>{  setIsOpen(true); }}
        className="w-full min-h-11 px-6 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2"
        style={{ backgroundColor: brandColor }}
      >
        <Phone size={18} />
        {buttonLabel}
      </button>
      <QuickContactModal
        brandColor={brandColor}
        isOpen={isOpen}
        onClose={() =>{  setIsOpen(false); }}
        phone={phone}
        zalo={zalo}
        messenger={messenger}
        serviceName={serviceName}
      />
    </div>
  );
}

// Compact version for cards/small spaces
interface QuickContactCompactProps {
  serviceName?: string;
  brandColor: string;
  className?: string;
}

export function QuickContactCompact({ 
  serviceName, 
  brandColor,
  className = ''
}: QuickContactCompactProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contactSettings = useQuery(api.settings.getMultiple, {
    keys: ['contact_phone', 'contact_zalo', 'contact_messenger']
  });

  if (!contactSettings) {
    return null;
  }

  const phone = contactSettings.contact_phone as string || '';
  const zalo = contactSettings.contact_zalo as string || '';
  const messenger = contactSettings.contact_messenger as string || '';

  const hasContact = Boolean(phone || zalo || messenger);

  if (!hasContact) {
    return null;
  }

  return (
    <>
      <button
        onClick={() =>{  setIsOpen(true); }}
        className={`w-full py-2 text-white text-xs font-medium rounded-lg transition-all hover:opacity-90 ${className}`}
        style={{ backgroundColor: brandColor }}
      >
        Liên hệ tư vấn
      </button>
      <QuickContactModal
        brandColor={brandColor}
        isOpen={isOpen}
        onClose={() =>{  setIsOpen(false); }}
        phone={phone}
        zalo={zalo}
        messenger={messenger}
        serviceName={serviceName}
      />
    </>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useBrandColor, useContactSettings, useSiteSettings } from './hooks';
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { useSnapshotDemoContext } from '@/components/modules/homepage/SnapshotDemoProvider';

export function Footer() {
  const snapshotDemo = useSnapshotDemoContext();
  const brandColor = useBrandColor();
  const { siteName, siteDescription, logo } = useSiteSettings();
  const contact = useContactSettings();
  const menuData = useQuery(api.menus.getFullMenu, { location: 'footer' });
  const resolvedMenuData = snapshotDemo?.getMenu('footer') ?? menuData;

  // Group menu items by depth 0 (columns)
  const footerColumns = resolvedMenuData?.items ? (() => {
    const items = [...resolvedMenuData.items].sort((a, b) => a.order - b.order);
    const columns: { title: string; links: { label: string; url: string }[] }[] = [];

    let currentColumn: { title: string; links: { label: string; url: string }[] } | null = null;

    items.forEach(item => {
      if (item.depth === 0) {
        if (currentColumn) {columns.push(currentColumn);}
        currentColumn = { links: [], title: item.label };
      } else if (currentColumn && item.depth === 1) {
        currentColumn.links.push({ label: item.label, url: item.url });
      }
    });

    if (currentColumn) {columns.push(currentColumn);}

    return columns;
  })() : [];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              {logo ? (
                <Image src={logo} alt={siteName} width={140} height={32} className="h-8 w-auto" mode="logo" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {(siteName ?? 'V').charAt(0)}
                </div>
              )}
              <span className="font-bold text-lg">{siteName}</span>
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              {siteDescription ?? 'Chúng tôi cung cấp các giải pháp tốt nhất cho bạn.'}
            </p>
            
            {/* Contact Info */}
            {!contact.isLoading && (
              <div className="space-y-2 text-sm text-slate-400">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone size={14} />
                    <span>{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Mail size={14} />
                    <span>{contact.email}</span>
                  </a>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{contact.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu Columns */}
          {footerColumns.slice(0, 3).map((column, idx) => (
            <div key={idx}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link 
                      href={link.url}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* If no footer menu, show default columns */}
          {footerColumns.length === 0 && (
            <>
              <div>
                <h4 className="font-semibold mb-4">Liên kết</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-sm text-slate-400 hover:text-white">Trang chủ</Link></li>
                  <li><Link href="/about" className="text-sm text-slate-400 hover:text-white">Giới thiệu</Link></li>
                  <li><Link href="/products" className="text-sm text-slate-400 hover:text-white">Sản phẩm</Link></li>
                  <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white">Liên hệ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hỗ trợ</h4>
                <ul className="space-y-2">
                  <li><Link href="/faq" className="text-sm text-slate-400 hover:text-white">FAQ</Link></li>
                  <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-white">Chính sách</Link></li>
                  <li><Link href="/terms" className="text-sm text-slate-400 hover:text-white">Điều khoản</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Kết nối</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <Facebook size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <Instagram size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                    <Youtube size={18} />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-slate-500">
            © {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

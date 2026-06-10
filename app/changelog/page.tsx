import type { Metadata } from 'next';
import ChangelogClient from './ChangelogClient';

export const metadata: Metadata = {
  title: 'Nhật Ký Cập Nhật (Changelog) - Viet Admin Core',
  description: 'Lịch sử nâng cấp cấu trúc cốt lõi, tối ưu hóa băng thông dữ liệu và các cập nhật tính năng mới đột phá của hệ thống Viet Admin.',
  openGraph: {
    title: 'Nhật Ký Cập Nhật (Changelog) - Viet Admin Core',
    description: 'Lịch sử nâng cấp cấu trúc cốt lõi, tối ưu hóa băng thông dữ liệu và các cập nhật tính năng mới đột phá của hệ thống Viet Admin.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nhật Ký Cập Nhật (Changelog) - Viet Admin Core',
    description: 'Lịch sử nâng cấp cấu trúc cốt lõi, tối ưu hóa băng thông dữ liệu và các cập nhật tính năng mới đột phá của hệ thống Viet Admin.',
  },
};

export default function ChangelogPage() {
  return <ChangelogClient />;
}

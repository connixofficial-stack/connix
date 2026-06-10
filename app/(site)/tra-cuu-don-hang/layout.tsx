import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Tra cứu đơn hàng',
  description: 'Tra cứu đơn hàng theo mã đơn hoặc số điện thoại. Xem trạng thái, mã vận đơn và yêu cầu hủy đơn.',
};

export default function TraCuuDonHangLayout({ children }: { children: ReactNode }) {
  return children;
}

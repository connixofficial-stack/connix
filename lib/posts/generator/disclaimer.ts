import type { SaleMode } from './types';

export const buildDisclaimer = (saleMode: SaleMode): string => {
  if (saleMode === 'affiliate') {
    return 'Lưu ý: Bài viết có thể chứa liên kết tiếp thị liên kết. Hãy kiểm tra kỹ thông tin trước khi mua.';
  }
  if (saleMode === 'contact') {
    return 'Lưu ý: Giá và điều kiện có thể thay đổi theo thời điểm. Liên hệ để nhận tư vấn chính xác.';
  }
  return 'Lưu ý: Thông tin có thể thay đổi theo thời điểm và nhu cầu thực tế.';
};

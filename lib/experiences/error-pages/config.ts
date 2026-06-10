export type ErrorPagesLayoutStyle = 'centered' | 'split' | 'illustrated';

export type ErrorPagesExperienceConfig = {
  layoutStyle: ErrorPagesLayoutStyle;
  statusCode: number;
  showGoHome: boolean;
  showGoBack: boolean;
  showShortApology: boolean;
  customHeadline?: string;
  customMessage?: string;
};

export const ERROR_PAGES_EXPERIENCE_KEY = 'error_pages_ui' as const;

export const ERROR_STATUS_CODES = [400, 401, 403, 404, 408, 429, 500, 502, 503, 504] as const;

export const ERROR_CODE_COPY: Record<number, { headline: string; message: string }> = {
  400: {
    headline: 'Yêu cầu chưa hợp lệ',
    message: 'Vui lòng kiểm tra lại dữ liệu gửi lên và thử lại sau.',
  },
  401: {
    headline: 'Bạn chưa đăng nhập',
    message: 'Vui lòng đăng nhập để tiếp tục truy cập nội dung này.',
  },
  403: {
    headline: 'Không có quyền truy cập',
    message: 'Bạn không được phép xem nội dung này.',
  },
  404: {
    headline: 'Không tìm thấy trang',
    message: 'Trang bạn cần không tồn tại hoặc đã bị chuyển đi.',
  },
  408: {
    headline: 'Kết nối bị gián đoạn',
    message: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
  },
  429: {
    headline: 'Bạn thao tác quá nhanh',
    message: 'Vui lòng chờ một chút rồi thử lại sau.',
  },
  500: {
    headline: 'Máy chủ gặp sự cố',
    message: 'Chúng tôi đang xử lý. Vui lòng thử lại sau ít phút.',
  },
  502: {
    headline: 'Kết nối máy chủ bị lỗi',
    message: 'Hệ thống đang bận, hãy thử lại sau.',
  },
  503: {
    headline: 'Dịch vụ đang bảo trì',
    message: 'Chúng tôi sẽ quay lại sớm. Cảm ơn bạn đã kiên nhẫn.',
  },
  504: {
    headline: 'Máy chủ phản hồi chậm',
    message: 'Vui lòng thử tải lại trang sau ít phút.',
  },
};

export const DEFAULT_ERROR_PAGES_CONFIG: ErrorPagesExperienceConfig = {
  layoutStyle: 'centered',
  statusCode: 404,
  showGoHome: true,
  showGoBack: true,
  showShortApology: true,
  customHeadline: '',
  customMessage: '',
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isLayoutStyle = (value: unknown): value is ErrorPagesLayoutStyle => {
  return value === 'centered' || value === 'split' || value === 'illustrated';
};

const normalizeStatusCode = (value: unknown): number => {
  if (typeof value !== 'number') {
    return DEFAULT_ERROR_PAGES_CONFIG.statusCode;
  }
  if (!ERROR_STATUS_CODES.includes(value as (typeof ERROR_STATUS_CODES)[number])) {
    return DEFAULT_ERROR_PAGES_CONFIG.statusCode;
  }
  return value;
};

const normalizeText = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

export const parseErrorPagesConfig = (raw: unknown): ErrorPagesExperienceConfig => {
  const source = isRecord(raw) ? raw : {};

  return {
    layoutStyle: isLayoutStyle(source.layoutStyle) ? source.layoutStyle : DEFAULT_ERROR_PAGES_CONFIG.layoutStyle,
    statusCode: normalizeStatusCode(source.statusCode),
    showGoHome: typeof source.showGoHome === 'boolean' ? source.showGoHome : DEFAULT_ERROR_PAGES_CONFIG.showGoHome,
    showGoBack: typeof source.showGoBack === 'boolean' ? source.showGoBack : DEFAULT_ERROR_PAGES_CONFIG.showGoBack,
    showShortApology: typeof source.showShortApology === 'boolean' ? source.showShortApology : DEFAULT_ERROR_PAGES_CONFIG.showShortApology,
    customHeadline: normalizeText(source.customHeadline),
    customMessage: normalizeText(source.customMessage),
  };
};

'use client';

import { oklch, formatHex, parse, formatRgb } from 'culori';

/**
 * Điều chỉnh các màu sắc bên trong chuỗi gradient (linear-gradient/radial-gradient)
 * sang tông màu Dark Mode tương ứng.
 */
export function adaptGradientForDarkMode(gradientStr: string, isDark: boolean): string {
  if (!isDark) return gradientStr;

  // Thay thế các mã màu Hex
  let result = gradientStr.replace(/#([0-9a-fA-F]{3,8})\b/g, (match) => {
    return adaptColorForDarkMode(match, isDark, 'background');
  });

  // Thay thế các định dạng rgb/rgba
  result = result.replace(/rgba?\(.*?\)/g, (match) => {
    return adaptColorForDarkMode(match, isDark, 'background');
  });

  // Thay thế các định dạng hsl/hsla
  result = result.replace(/hsla?\(.*?\)/g, (match) => {
    return adaptColorForDarkMode(match, isDark, 'background');
  });

  // Thay thế từ khóa white/black nếu đứng cô lập
  result = result.replace(/\bwhite\b/g, () => adaptColorForDarkMode('#ffffff', isDark, 'background'));
  result = result.replace(/\bblack\b/g, () => adaptColorForDarkMode('#000000', isDark, 'background'));

  return result;
}

/**
 * Chuyển đổi một chuỗi màu đơn lẻ sang tông màu tương thích Dark Mode nếu cần thiết.
 * Giữ nguyên các màu sắc thương hiệu chính (Brand Colors) và chỉ điều chỉnh các màu trung hòa.
 */
export function adaptColorForDarkMode(colorStr: string, isDark: boolean, key = ''): string {
  if (!isDark) return colorStr;
  if (typeof colorStr !== 'string') return colorStr;
  
  const trimmed = colorStr.trim();
  
  // Bỏ qua các CSS variables hoặc màu rỗng/đặc biệt
  if (
    trimmed.startsWith('var(') || 
    trimmed === 'transparent' || 
    trimmed === 'none' || 
    trimmed === 'inherit' ||
    trimmed === ''
  ) {
    return colorStr;
  }

  // Xử lý gradient trước tiên
  if (trimmed.toLowerCase().includes('gradient')) {
    return adaptGradientForDarkMode(trimmed, isDark);
  }
  
  // Xử lý một số từ khóa màu cơ bản trước khi parse
  let normalizedColor = trimmed;
  if (trimmed === 'white') normalizedColor = '#ffffff';
  if (trimmed === 'black') normalizedColor = '#000000';

  try {
    const parsed = parse(normalizedColor);
    if (!parsed) return colorStr;
    
    const color = oklch(parsed);
    if (!color) return colorStr;
    
    const alpha = color.alpha !== undefined ? color.alpha : 1;
    
    const l = color.l ?? 0;
    const c = color.c ?? 0;
    const h = color.h ?? 0;

    const isBackgroundKey = key.toLowerCase().includes('bg') || 
                            key.toLowerCase().includes('surface') || 
                            key.toLowerCase().includes('background');

    if (isBackgroundKey) {
      // Nếu là màu nền sáng (L >= 0.45), chuyển thành nền tối bảo toàn sắc độ
      if (l >= 0.45) {
        const darkL = 0.12 + (1 - l) * 0.05; // l = 1.0 -> 0.12, l = 0.45 -> 0.147
        const darkC = Math.min(c * 0.35, 0.015); // Giảm sắc độ để nền tối dịu mắt
        const darkColor = oklch({
          ...color,
          l: darkL,
          c: darkC,
          h,
        });
        return alpha < 1 ? formatRgb(darkColor) : formatHex(darkColor);
      }
      // Nền tối sẵn thì giữ nguyên
      return colorStr;
    } else {
      // Nếu là màu chữ, viền, icon...
      // Chữ tối (L < 0.45) -> chuyển thành chữ sáng bảo toàn sắc độ
      if (l < 0.45) {
        const lightL = 0.88 + (0.45 - l) * 0.12; // l = 0 -> 0.934, l = 0.45 -> 0.88
        const lightC = Math.min(c * 0.5, 0.01); // Giảm sắc độ để chữ sáng không chói
        const lightColor = oklch({
          ...color,
          l: lightL,
          c: lightC,
          h,
        });
        return alpha < 1 ? formatRgb(lightColor) : formatHex(lightColor);
      }

      // Nếu là màu nhấn/thương hiệu sáng (C >= 0.06)
      if (c >= 0.06) {
        // Tăng nhẹ độ sáng nếu nó quá tối để tăng tương phản trên nền tối
        if (l < 0.6) {
          const brightenedColor = oklch({
            ...color,
            l: 0.65,
            c: Math.min(c, 0.15),
            h,
          });
          return alpha < 1 ? formatRgb(brightenedColor) : formatHex(brightenedColor);
        }
      }

      // Các trường hợp chữ sáng sẵn hoặc trung tính sáng giữ nguyên
      return colorStr;
    }
  } catch {
    return colorStr;
  }
}

/**
 * Hàm đệ quy duyệt qua tất cả các thuộc tính của một object tokens màu sắc
 * và tự động chuyển đổi các giá trị màu trung tính sang dark mode.
 */
export function adaptTokensForDarkMode<T>(tokens: T, isDark: boolean): T {
  if (!isDark) return tokens;
  if (!tokens || typeof tokens !== 'object') return tokens;
  
  const result: any = Array.isArray(tokens) ? [] : {};
  
  for (const key in tokens) {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      const val = tokens[key];
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Nhận diện các định dạng chuỗi màu sắc phổ biến
        const isColor = trimmed.startsWith('#') || 
                        trimmed.startsWith('rgb') || 
                        trimmed.startsWith('hsl') || 
                        trimmed.toLowerCase().includes('gradient') || 
                        trimmed === 'transparent' || 
                        trimmed === 'white' || 
                        trimmed === 'black';
        if (isColor) {
          result[key] = adaptColorForDarkMode(val, isDark, key);
        } else {
          result[key] = val;
        }
      } else if (typeof val === 'object' && val !== null) {
        result[key] = adaptTokensForDarkMode(val, isDark);
      } else {
        result[key] = val;
      }
    }
  }
  
  return result;
}

import { describe, expect, it } from 'vitest';
import { parseExcelImageUrls } from '../excel-contract';

describe('parseExcelImageUrls', () => {
  it('trả về 1 ảnh khi chỉ có 1 url', () => {
    expect(parseExcelImageUrls('https://example.com/a.jpg')).toEqual(['https://example.com/a.jpg']);
  });

  it('tách nhiều url theo dấu ;', () => {
    expect(parseExcelImageUrls('a.jpg;b.jpg;c.jpg')).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('loại bỏ phần rỗng và trim', () => {
    expect(parseExcelImageUrls('a.jpg; ;  b.jpg')).toEqual(['a.jpg', 'b.jpg']);
  });
});

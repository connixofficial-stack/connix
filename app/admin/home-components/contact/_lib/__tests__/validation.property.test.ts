import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { isValidHref, isValidUrl, isValidZaloLink, normalizeZaloPhone } from '../validation';

describe('Validation Properties', () => {
  // Property 10: URL Validation Round Trip
  // **Validates: Requirements 7.1, 7.2, 7.3, 4.5**
  test.prop([fc.webUrl()], { numRuns: 100 })('valid URLs return true', (url: string) => {
    expect(isValidUrl(url)).toBe(true);
  });

  test.prop([
    fc.string().filter((s) => {
      if (!s.trim()) return false; // Empty strings are valid
      try {
        new URL(s);
        return false; // Valid URL, skip
      } catch {
        return true; // Invalid URL, include
      }
    }),
  ], { numRuns: 100 })('invalid URLs return false', (invalidUrl: string) => {
    expect(isValidUrl(invalidUrl)).toBe(false);
  });

  test.prop([fc.constant('')], { numRuns: 100 })('empty URL is valid', (emptyUrl: string) => {
    expect(isValidUrl(emptyUrl)).toBe(true);
  });

  // Property 11: Href Validation Pattern Matching
  test.prop([
    fc.constantFrom('mailto:contact@example.com', 'tel:+84901234567', '/lien-he', '#section'),
  ], { numRuns: 20 })('valid hrefs return true', (href: string) => {
    expect(isValidHref(href)).toBe(true);
  });

  test.prop([
    fc.string().filter((s) => {
      if (!s.trim()) return false;
      if (s.startsWith('/') || s.startsWith('#')) return false;
      try {
        const parsed = new URL(s);
        return !['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
      } catch {
        return true;
      }
    }),
  ], { numRuns: 100 })('invalid hrefs return false', (invalidHref: string) => {
    expect(isValidHref(invalidHref)).toBe(false);
  });

  test.prop([fc.constant('')], { numRuns: 100 })('empty href is valid', (emptyHref: string) => {
    expect(isValidHref(emptyHref)).toBe(true);
  });

  test.prop([
    fc.constantFrom('https://zalo.me/0948066514', '0948066514', '+84 948 066 514', '0948.066.514'),
  ], { numRuns: 20 })('valid zalo links return true', (value: string) => {
    expect(isValidZaloLink(value)).toBe(true);
  });

  test.prop([
    fc.constantFrom('zalo-user', 'abc123', 'ftp://zalo.me/0948066514'),
  ], { numRuns: 20 })('invalid zalo links return false', (value: string) => {
    expect(isValidZaloLink(value)).toBe(false);
  });

  test.prop([fc.constant('+84 948 066 514')], { numRuns: 20 })('normalize zalo phone keeps digits and plus only', (value: string) => {
    expect(normalizeZaloPhone(value)).toBe('+84948066514');
  });
});

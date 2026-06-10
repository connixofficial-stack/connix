export function isValidImageSrc(src?: string | null): boolean {
  if (!src) {
    return false;
  }
  const value = src.trim();
  if (!value) {
    return false;
  }
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
}

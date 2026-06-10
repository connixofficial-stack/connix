export const parseHreflang = (input?: string): Record<string, string> => {
  if (!input) {
    return {};
  }

  return input
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const [locale, url] = entry.split(':').map((part) => part.trim());
      if (!locale || !url) {
        return acc;
      }
      acc[locale] = url;
      return acc;
    }, {});
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').trim();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
};

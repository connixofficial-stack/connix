const EMPTY_BLOCK_REGEX = /<p>\s*(?:<br\s*\/?\s*>|&nbsp;)?\s*<\/p>/gi;

const isEffectivelyEmpty = (html: string) => {
  const stripped = html
    .replace(EMPTY_BLOCK_REGEX, '')
    .replace(/\s+/g, '')
    .replace(/&nbsp;/g, '');
  return stripped.length === 0;
};

export const normalizeRichText = (html?: string) => {
  let raw = (html ?? '').trim();
  if (!raw) {return '';}

  // If it's plain text (no HTML tags), wrap it in <p> to align with Lexical's auto-generated format
  if (raw && !/<[a-z][\s\S]*>/i.test(raw)) {
    raw = `<p>${raw}</p>`;
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return isEffectivelyEmpty(raw) ? '' : raw;
  }
  const doc = new DOMParser().parseFromString(raw, 'text/html');

  // Strip unnecessary attributes from all elements
  const elements = doc.body.querySelectorAll('*');
  elements.forEach((el) => {
    const attributes = Array.from(el.attributes);
    attributes.forEach((attr) => {
      // Keep only crucial structural attributes
      if (attr.name !== 'href' && attr.name !== 'src' && attr.name !== 'alt' && attr.name !== 'target') {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Unwrap empty spans (spans with no remaining attributes)
  const spans = doc.body.querySelectorAll('span');
  spans.forEach((span) => {
    if (span.attributes.length === 0) {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    }
  });

  // Unwrap nested identical formatting tags (e.g., strong inside strong, em inside em)
  const formatTags = ['strong', 'b', 'em', 'i', 'span'];
  formatTags.forEach((tagName) => {
    const nestedNodes = doc.body.querySelectorAll(`${tagName} ${tagName}`);
    nestedNodes.forEach((node) => {
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
      }
    });
  });

  // Remove whitespace and newlines between HTML tags for exact comparison
  const normalized = doc.body.innerHTML.replace(/>\s+</g, '><').trim();
  if (!normalized || isEffectivelyEmpty(normalized)) {
    return '';
  }
  return normalized;
};

export const normalizeSearchText = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const isSubsequence = (needle: string, haystack: string) => {
  if (!needle || !haystack) {
    return false;
  }
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (needle[i] === haystack[j]) {
      i += 1;
    }
  }
  return i === needle.length;
};

const levenshteinDistance = (a: string, b: string, maxDistance = 2) => {
  const aLen = a.length;
  const bLen = b.length;

  if (Math.abs(aLen - bLen) > maxDistance) {
    return maxDistance + 1;
  }

  const prev = Array.from({ length: bLen + 1 }, (_, i) => i);
  const curr = Array.from({ length: bLen + 1 }, () => 0);

  for (let i = 1; i <= aLen; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, curr[j]);
    }

    if (rowMin > maxDistance) {
      return maxDistance + 1;
    }

    for (let j = 0; j <= bLen; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[bLen];
};

const scoreNormalizedOverlap = (candidate: string, query: string) => {
  const queryTokens = query.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter(Boolean);
  if (queryTokens.length === 0 || candidateTokens.length === 0) {
    return 0;
  }

  // Danh sách từ dừng (stop words) tiếng Việt phổ biến để lọc bỏ trong câu hỏi chatbot
  const stopWords = new Set([
    "toi", "muon", "mua", "can", "cho", "tim", "ban", "co", "khong", 
    "la", "gi", "o", "tai", "cua", "ben", "va", "ve", "nhe", "nha", 
    "chao", "alo", "ad", "admin", "de", "xin", "cam", "on", "lien", "he", "tu", "van"
  ]);

  const importantQueryTokens = queryTokens.filter(t => !stopWords.has(t) && t.length > 1);
  
  // Nếu sau khi lọc không còn từ quan trọng nào, ta dùng lại danh sách từ gốc có độ dài > 1
  if (importantQueryTokens.length === 0) {
    importantQueryTokens.push(...queryTokens.filter(t => t.length > 1));
  }

  // Nếu vẫn rỗng (toàn các từ 1 chữ cái hoặc quá ngắn), dùng toàn bộ queryTokens ban đầu
  if (importantQueryTokens.length === 0) {
    importantQueryTokens.push(...queryTokens);
  }

  let matches = 0;
  for (const qToken of importantQueryTokens) {
    let tokenMatched = false;
    for (const cToken of candidateTokens) {
      if (qToken === cToken) {
        tokenMatched = true;
        break;
      }
      // Cho phép sai lệch fuzzy 1 ký tự đối với các từ có độ dài từ 3 trở lên
      if (qToken.length >= 3 && cToken.length >= 3) {
        const dist = levenshteinDistance(qToken, cToken, 1);
        if (dist <= 1) {
          tokenMatched = true;
          break;
        }
      }
    }
    if (tokenMatched) {
      matches += 1;
    }
  }

  if (matches === 0) {
    return 0;
  }

  // Trả về tỷ lệ % số từ khớp trên tổng số từ quan trọng
  return Math.round((matches / importantQueryTokens.length) * 100);
};

const scoreNormalizedText = (candidate: string, query: string) => {
  if (!candidate || !query) {
    return 0;
  }

  // Nếu query có nhiều từ (chứa khoảng trắng), dùng thuật toán Token Overlap
  const queryTokens = query.split(" ").filter(Boolean);
  if (queryTokens.length > 1) {
    return scoreNormalizedOverlap(candidate, query);
  }

  if (candidate === query) {
    return 100;
  }
  if (candidate.startsWith(query)) {
    return 92;
  }
  if (candidate.includes(query)) {
    return 82;
  }

  const tokens = candidate.split(" ").filter(Boolean);
  for (const token of tokens) {
    if (token === query) {
      return 96;
    }
    if (token.startsWith(query)) {
      return 76;
    }
    if (token.includes(query)) {
      return 68;
    }
    const distance = levenshteinDistance(token, query, 2);
    if (distance === 1) {
      return 58;
    }
    if (distance === 2) {
      return 48;
    }
  }

  if (isSubsequence(query, candidate)) {
    return 42;
  }

  return 0;
};

export function rankByFuzzyMatches<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  minScore = 42,
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return items.map((item) => ({ item, score: 0 }));
  }

  const scored = items
    .map((item) => {
      const raw = getText(item);
      const texts = Array.isArray(raw) ? raw : [raw];
      let best = 0;

      for (const text of texts) {
        const normalized = normalizeSearchText(text || "");
        const score = scoreNormalizedText(normalized, normalizedQuery);
        if (score > best) {
          best = score;
        }
      }

      return { item, score: best };
    })
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored;
}

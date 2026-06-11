import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';

export const dynamic = 'force-dynamic';

const AI_SETTING_KEYS = [
  'ai_chatbot_enabled',
  'ai_provider',
  'ai_model',
  'ai_system_prompt',
] as const;

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_CHATJPT_MODEL = '@cf/openai/gpt-oss-120b';
const DEFAULT_SYSTEM_PROMPT =
  'Bạn là trợ lý AI của website. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự, ưu tiên dựa trên dữ liệu site được cung cấp và gợi ý link phù hợp khi có.';
const CHATJPT_API_ENDPOINT = (process.env.CHATJPT_ENDPOINT || 'https://chatjpt.rina.work/api/chat').trim();

const GREETING_ONLY_QUERIES = new Set([
  'alo',
  'cam on',
  'chao',
  'chao ban',
  'hello',
  'hey',
  'hi',
  'ok',
  'test',
  'thank you',
  'thanks',
  'xin chao',
  'xin chao ban',
]);

type AiProvider = 'gemini' | 'chatjpt';
type SearchItemType = 'post' | 'product' | 'service' | 'course' | 'project' | 'resource';

type SearchItem = {
  title: string;
  type: SearchItemType;
  url: string;
};

type SearchGroup = {
  items: SearchItem[];
};

type SearchResult = {
  posts: SearchGroup;
  products: SearchGroup;
  services: SearchGroup;
  courses: SearchGroup;
  projects: SearchGroup;
  resources: SearchGroup;
};

type ChatMessage = {
  content: string;
  role: 'assistant' | 'system' | 'user';
};

type RuntimeConfig = {
  enabled: boolean;
  model: string;
  provider: AiProvider;
  systemPrompt: string;
};

const toStringValue = (value: unknown, fallback: string) => (
  typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const toBooleanValue = (value: unknown, fallback: boolean) => (
  typeof value === 'boolean' ? value : fallback
);

const normalizeProvider = (value: unknown): AiProvider => (
  value === 'chatjpt' ? 'chatjpt' : 'gemini'
);

const normalizeModel = (provider: AiProvider, value: unknown) => {
  const model = toStringValue(value, '');
  if (provider === 'chatjpt') {
    return model.startsWith('@cf/') ? model : DEFAULT_CHATJPT_MODEL;
  }
  return model.startsWith('gemini-') ? model : DEFAULT_GEMINI_MODEL;
};

const normalizeSearchText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const isGreetingOnly = (message: string) => GREETING_ONLY_QUERIES.has(normalizeSearchText(message));

const formatSuggestionsForPrompt = (suggestions: SearchItem[]) => {
  if (suggestions.length === 0) {
    return 'Không tìm thấy dữ liệu site khớp trực tiếp.';
  }
  return suggestions
    .map((item, index) => `${index + 1}. [${item.type}] ${item.title} - ${item.url}`)
    .join('\n');
};

const flattenSuggestions = (result: SearchResult): SearchItem[] => {
  const orderedGroups = [
    result.products,
    result.services,
    result.courses,
    result.posts,
    result.projects,
    result.resources,
  ];
  const seen = new Set<string>();
  const items: SearchItem[] = [];

  for (const group of orderedGroups) {
    for (const item of group.items) {
      const key = `${item.type}:${item.url}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      items.push({ title: item.title, type: item.type, url: item.url });
      if (items.length >= 8) {
        return items;
      }
    }
  }

  return items;
};

function findFirstTextField(input: unknown): string {
  if (typeof input === 'string') return input;
  if (Array.isArray(input)) {
    for (const item of input) {
      const found = findFirstTextField(item);
      if (found.trim().length > 0) return found;
    }
    return '';
  }
  if (typeof input !== 'object' || input === null) return '';

  const record = input as Record<string, unknown>;
  const directKeys = ['content', 'text', 'output_text', 'answer', 'message', 'response'];
  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }

  const priorityKeys = ['result', 'output', 'data', 'choices', 'messages', 'message', 'delta'];
  for (const key of priorityKeys) {
    if (!(key in record)) continue;
    const found = findFirstTextField(record[key]);
    if (found.trim().length > 0) return found;
  }

  for (const value of Object.values(record)) {
    const found = findFirstTextField(value);
    if (found.trim().length > 0) return found;
  }
  return '';
}

function extractResponseFromRawStream(raw: string): string {
  const normalized = raw.replace(/\r/g, '');
  const matches = [...normalized.matchAll(/"response"\s*:\s*"((?:\\.|[^"\\])*)"/g)];
  if (matches.length === 0) return '';

  let out = '';
  for (const match of matches) {
    const piece = match[1];
    if (!piece) continue;
    try {
      out += JSON.parse(`"${piece}"`) as string;
    } catch {
      out += piece;
    }
  }

  return out.trim();
}

function extractChatjptText(raw: string): string {
  const text = raw.trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    const found = findFirstTextField(parsed);
    return found.trim() || JSON.stringify(parsed);
  } catch {
    return extractResponseFromRawStream(text) || text;
  }
}

function buildChatjptHttpError(status: number, raw: string): string {
  const prefix = `ChatJPT API error: HTTP ${status}`;
  const trimmed = raw.trim();
  if (!trimmed) return prefix;

  try {
    const parsed = JSON.parse(trimmed);
    const apiError = findFirstTextField(parsed).trim();
    return apiError ? `${prefix}: ${apiError.slice(0, 240)}` : prefix;
  } catch {
    return `${prefix}: ${trimmed.slice(0, 240)}`;
  }
}

async function readRuntimeConfig(client: ReturnType<typeof getConvexClient>): Promise<RuntimeConfig> {
  const settings = await client.query(api.settings.getMultiple, { keys: [...AI_SETTING_KEYS] });
  const provider = normalizeProvider(settings.ai_provider);

  return {
    enabled: toBooleanValue(settings.ai_chatbot_enabled, false),
    model: normalizeModel(provider, settings.ai_model),
    provider,
    systemPrompt: toStringValue(settings.ai_system_prompt, DEFAULT_SYSTEM_PROMPT),
  };
}

async function readSuggestions(client: ReturnType<typeof getConvexClient>, message: string) {
  if (isGreetingOnly(message)) {
    return [];
  }

  const result = await client.query(api.search.autocomplete, {
    limit: 3,
    query: message.slice(0, 180),
    searchCourses: true,
    searchPosts: true,
    searchProducts: true,
    searchProjects: true,
    searchResources: true,
    searchServices: true,
  });

  return flattenSuggestions(result as SearchResult);
}

async function generateChatjptAnswer(args: {
  message: string;
  model: string;
  sourcePath?: string;
  suggestions: SearchItem[];
  systemPrompt: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const userContent = [
    `Câu hỏi khách: ${args.message}`,
    args.sourcePath ? `Trang hiện tại: ${args.sourcePath}` : '',
    '',
    'Dữ liệu site liên quan:',
    formatSuggestionsForPrompt(args.suggestions),
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(CHATJPT_API_ENDPOINT, {
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: 'system', content: args.systemPrompt },
          { role: 'user', content: userContent },
        ] satisfies ChatMessage[],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(buildChatjptHttpError(response.status, raw));
    }

    const text = extractChatjptText(raw);
    if (!text.trim()) {
      throw new Error('ChatJPT không trả về nội dung.');
    }

    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? '').trim();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    const sourcePath = typeof body?.sourcePath === 'string' ? body.sourcePath : undefined;

    if (!message) {
      return NextResponse.json({ message: 'Vui lòng nhập nội dung cần hỏi.' }, { status: 400 });
    }

    const client = getConvexClient();
    const config = await readRuntimeConfig(client);
    if (config.provider === 'chatjpt') {
      if (!config.enabled) {
        throw new Error('Chatbot AI đang tắt.');
      }

      const identifier = `ai-chat:${(sessionId ?? sourcePath ?? 'anonymous').slice(0, 140)}`;
      const rateLimit = await client.mutation(api.aiChat.consumePublicAiChatRateLimit, { identifier });
      if (!rateLimit.allowed) {
        throw new Error('Bạn đang hỏi hơi nhanh. Vui lòng thử lại sau ít phút.');
      }

      const suggestions = await readSuggestions(client, message);
      const answer = await generateChatjptAnswer({
        message,
        model: config.model,
        sourcePath,
        suggestions,
        systemPrompt: config.systemPrompt,
      });

      return NextResponse.json({
        message: answer,
        model: config.model,
        provider: config.provider,
        suggestions,
      });
    }

    const result = await client.action(api.aiChat.sendMessage, {
      message,
      sessionId,
      sourcePath,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chatbot AI chưa thể phản hồi.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

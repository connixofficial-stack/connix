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

type SearchScope = {
  searchCourses: boolean;
  searchPosts: boolean;
  searchProducts: boolean;
  searchProjects: boolean;
  searchResources: boolean;
  searchServices: boolean;
};

type ChatMessage = {
  content: string;
  role: 'assistant' | 'system' | 'user';
};

type ChatjptAnswerArgs = {
  assistantContext: string;
  message: string;
  model: string;
  sourcePath?: string;
  suggestions: SearchItem[];
  systemPrompt: string;
};

type ChatjptRequestBody = {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
};

type RuntimeConfig = {
  enabled: boolean;
  model: string;
  provider: AiProvider;
  systemPrompt: string;
};

type AssistantContext = {
  prompt: string;
  searchScope: SearchScope;
};

type SseSend = (event: string, data: unknown) => void;

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

const DEFAULT_SEARCH_SCOPE: SearchScope = {
  searchCourses: true,
  searchPosts: true,
  searchProducts: true,
  searchProjects: true,
  searchResources: true,
  searchServices: true,
};

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

class ChatjptHttpError extends Error {
  status: number;

  constructor(status: number, raw: string) {
    super(buildChatjptHttpError(status, raw));
    this.name = 'ChatjptHttpError';
    this.status = status;
  }
}

const wantsSse = (request: Request, body: unknown) => {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/event-stream')
    || (typeof body === 'object' && body !== null && (body as { stream?: unknown }).stream === true);
};

function sseResponse(run: (send: SseSend) => Promise<void>) {
  const encoder = new TextEncoder();

  return new Response(new ReadableStream({
    async start(controller) {
      const send: SseSend = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await run(send);
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : 'Chatbot AI chưa thể phản hồi.',
        });
      } finally {
        send('done', {});
        controller.close();
      }
    },
  }), {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream; charset=utf-8',
      'X-Accel-Buffering': 'no',
    },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function emitTextInChunks(text: string, send: SseSend) {
  const normalized = text.trim();
  if (!normalized) return;

  for (let index = 0; index < normalized.length; index += 18) {
    send('delta', { text: normalized.slice(index, index + 18) });
    await sleep(12);
  }
}

function parseSseBlock(block: string) {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of block.replace(/\r/g, '').split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  const rawData = dataLines.join('\n').trim();
  if (!rawData || rawData === '[DONE]') {
    return { data: null, event };
  }

  try {
    return { data: JSON.parse(rawData), event };
  } catch {
    return { data: rawData, event };
  }
}

async function consumeAiRateLimit(
  client: ReturnType<typeof getConvexClient>,
  sessionId?: string,
  sourcePath?: string,
) {
  const identifier = `ai-chat:${(sessionId ?? sourcePath ?? 'anonymous').slice(0, 140)}`;
  const rateLimit = await client.mutation(api.aiChat.consumePublicAiChatRateLimit, { identifier });
  if (!rateLimit.allowed) {
    throw new Error('Bạn đang hỏi hơi nhanh. Vui lòng thử lại sau ít phút.');
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

async function readAssistantContext(client: ReturnType<typeof getConvexClient>): Promise<AssistantContext> {
  try {
    return await client.query(api.systemIntegrations.getPublicAiAssistantContext, {});
  } catch {
    return { prompt: '', searchScope: DEFAULT_SEARCH_SCOPE };
  }
}

async function readSuggestions(
  client: ReturnType<typeof getConvexClient>,
  message: string,
  searchScope: SearchScope,
) {
  if (isGreetingOnly(message)) {
    return [];
  }

  const result = await client.query(api.search.autocomplete, {
    limit: 3,
    query: message.slice(0, 180),
    searchCourses: searchScope.searchCourses,
    searchPosts: searchScope.searchPosts,
    searchProducts: searchScope.searchProducts,
    searchProjects: searchScope.searchProjects,
    searchResources: searchScope.searchResources,
    searchServices: searchScope.searchServices,
  });

  return flattenSuggestions(result as SearchResult);
}

function buildChatjptUserContent(args: ChatjptAnswerArgs) {
  return [
    args.assistantContext,
    `Câu hỏi khách: ${args.message}`,
    args.sourcePath ? `Trang hiện tại: ${args.sourcePath}` : '',
    '',
    'Dữ liệu site liên quan:',
    formatSuggestionsForPrompt(args.suggestions),
  ].filter(Boolean).join('\n');
}

function buildChatjptRequestBody(args: ChatjptAnswerArgs, stream = false): ChatjptRequestBody {
  const body: ChatjptRequestBody = {
    messages: [
      { role: 'system', content: args.systemPrompt },
      { role: 'user', content: buildChatjptUserContent(args) },
    ],
    model: args.model,
  };

  return stream ? { ...body, stream: true } : body;
}

async function generateChatjptAnswer(args: ChatjptAnswerArgs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(CHATJPT_API_ENDPOINT, {
      body: JSON.stringify(buildChatjptRequestBody(args)),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new ChatjptHttpError(response.status, raw);
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

async function streamChatjptAnswer(args: ChatjptAnswerArgs, send: SseSend) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(CHATJPT_API_ENDPOINT, {
      body: JSON.stringify(buildChatjptRequestBody(args, true)),
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ChatjptHttpError(response.status, await response.text());
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!response.body || !contentType.includes('text/event-stream')) {
      const text = extractChatjptText(await response.text());
      if (!text.trim()) {
        throw new Error('ChatJPT không trả về nội dung.');
      }
      await emitTextInChunks(text, send);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let emitted = '';

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split(/\n\n/);
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const parsed = parseSseBlock(block);
        if (parsed.data === null || parsed.event === 'done') {
          continue;
        }

        const text = findFirstTextField(parsed.data);
        if (!text.trim()) {
          continue;
        }

        const delta = text.startsWith(emitted) ? text.slice(emitted.length) : text;
        if (delta) {
          send('delta', { text: delta });
        }
        emitted = text.startsWith(emitted) ? text : `${emitted}${delta}`;
      }

      if (done) {
        break;
      }
    }

    const finalText = emitted.trim();
    if (!finalText) {
      throw new Error('ChatJPT không trả về nội dung.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stream = wantsSse(request, body);
    const message = String(body?.message ?? '').trim();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    const sourcePath = typeof body?.sourcePath === 'string' ? body.sourcePath : undefined;

    if (!message) {
      return NextResponse.json({ message: 'Vui lòng nhập nội dung cần hỏi.' }, { status: 400 });
    }

    const client = getConvexClient();
    const [config, assistantContext] = await Promise.all([
      readRuntimeConfig(client),
      readAssistantContext(client),
    ]);
    if (stream) {
      return sseResponse(async (send) => {
        if (config.provider === 'chatjpt') {
          if (!config.enabled) {
            throw new Error('Chatbot AI đang tắt.');
          }

          await consumeAiRateLimit(client, sessionId, sourcePath);
          const suggestions = await readSuggestions(client, message, assistantContext.searchScope);
          send('meta', {
            model: config.model,
            provider: config.provider,
            suggestions,
          });
          const chatjptArgs = {
            assistantContext: assistantContext.prompt,
            message,
            model: config.model,
            sourcePath,
            suggestions,
            systemPrompt: config.systemPrompt,
          };

          try {
            await streamChatjptAnswer(chatjptArgs, send);
          } catch (error) {
            if (error instanceof ChatjptHttpError && error.status === 403) {
              send('client-fallback', {
                body: buildChatjptRequestBody(chatjptArgs, true),
                endpoint: CHATJPT_API_ENDPOINT,
                reason: 'server-egress-403',
              });
              return;
            }
            throw error;
          }
          return;
        }

        const result = await client.action(api.aiChat.sendMessage, {
          message,
          sessionId,
          sourcePath,
        });
        send('meta', {
          model: result.model,
          provider: result.provider,
          suggestions: result.suggestions,
        });
        await emitTextInChunks(result.message, send);
      });
    }

    if (config.provider === 'chatjpt') {
      if (!config.enabled) {
        throw new Error('Chatbot AI đang tắt.');
      }

      await consumeAiRateLimit(client, sessionId, sourcePath);
      const suggestions = await readSuggestions(client, message, assistantContext.searchScope);
      const answer = await generateChatjptAnswer({
        assistantContext: assistantContext.prompt,
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

'use client';

import React from 'react';
import { Bot, ExternalLink, Loader2, Send, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeMarkdown } from '@/components/common/SafeMarkdown';

export const AI_CHATBOT_OPEN_EVENT = 'vietadmin:open-ai-chatbot';

interface Suggestion {
  title: string;
  type: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestions?: Suggestion[];
}

interface ChatjptClientFallback {
  body: {
    messages: Array<{ content: string; role: 'assistant' | 'system' | 'user' }>;
    model: string;
    stream?: boolean;
  };
  endpoint: string;
}

const SESSION_KEY = 'vietadmin_ai_chat_session';

const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getSessionId = () => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }
  const next = `site_${createId()}`;
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
};

const quickQuestions = [
  'Tư vấn sản phẩm',
  'Dịch vụ nổi bật',
  'Liên hệ tư vấn',
];

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
    return { data: JSON.parse(rawData) as unknown, event };
  } catch {
    return { data: rawData, event };
  }
}

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
    return apiError ? `${prefix}: ${apiError.slice(0, 180)}` : prefix;
  } catch {
    return `${prefix}: ${trimmed.slice(0, 180)}`;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function emitTextInChunks(text: string, onDelta: (text: string) => void) {
  const normalized = text.trim();
  if (!normalized) return;

  for (let index = 0; index < normalized.length; index += 18) {
    onDelta(normalized.slice(index, index + 18));
    await sleep(12);
  }
}

function toClientFallback(input: unknown): ChatjptClientFallback | null {
  if (typeof input !== 'object' || input === null) return null;
  const record = input as Record<string, unknown>;
  const endpoint = typeof record.endpoint === 'string' ? record.endpoint.trim() : '';
  const body = record.body;
  if (!endpoint || typeof body !== 'object' || body === null) return null;

  const payload = body as Record<string, unknown>;
  const model = typeof payload.model === 'string' ? payload.model : '';
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const normalizedMessages = messages
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const message = item as Record<string, unknown>;
      const role = message.role;
      const content = message.content;
      if (
        (role !== 'assistant' && role !== 'system' && role !== 'user')
        || typeof content !== 'string'
      ) {
        return null;
      }
      return { content, role };
    })
    .filter((item): item is { content: string; role: 'assistant' | 'system' | 'user' } => item !== null);

  if (!model || normalizedMessages.length === 0) return null;

  return {
    body: {
      messages: normalizedMessages,
      model,
      stream: payload.stream === true,
    },
    endpoint,
  };
}

async function streamChatjptFromBrowser(
  fallback: ChatjptClientFallback,
  onDelta: (text: string) => void,
) {
  const response = await fetch(fallback.endpoint, {
    body: JSON.stringify(fallback.body),
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (!response.ok) {
    throw new Error(buildChatjptHttpError(response.status, await response.text()));
  }

  if (!response.body || !contentType.includes('text/event-stream')) {
    const text = extractChatjptText(await response.text());
    if (!text.trim()) {
      throw new Error('ChatJPT không trả về nội dung.');
    }
    await emitTextInChunks(text, onDelta);
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
        onDelta(delta);
      }
      emitted = text.startsWith(emitted) ? text : `${emitted}${delta}`;
    }

    if (done) {
      break;
    }
  }

  if (!emitted.trim()) {
    throw new Error('ChatJPT không trả về nội dung.');
  }
}

async function readAiChatStream(
  response: Response,
  callbacks: {
    onDelta: (text: string) => void;
    onError: (message: string) => void;
    onMeta: (suggestions: Suggestion[]) => void;
  },
): Promise<ChatjptClientFallback | null> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Trình duyệt không hỗ trợ streaming.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fallback: ChatjptClientFallback | null = null;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (parsed.event === 'delta' && typeof parsed.data === 'object' && parsed.data !== null) {
        const text = (parsed.data as { text?: unknown }).text;
        if (typeof text === 'string' && text) {
          callbacks.onDelta(text);
        }
      } else if (parsed.event === 'meta' && typeof parsed.data === 'object' && parsed.data !== null) {
        const suggestions = (parsed.data as { suggestions?: unknown }).suggestions;
        callbacks.onMeta(Array.isArray(suggestions) ? suggestions as Suggestion[] : []);
      } else if (parsed.event === 'error' && typeof parsed.data === 'object' && parsed.data !== null) {
        const message = (parsed.data as { message?: unknown }).message;
        callbacks.onError(typeof message === 'string' ? message : 'Chatbot AI chưa thể phản hồi.');
      } else if (parsed.event === 'client-fallback') {
        fallback = toClientFallback(parsed.data);
      }
    }

    if (done) {
      break;
    }
  }

  return fallback;
}

export function AiChatbotWidget() {
  const config = useQuery(api.systemIntegrations.getPublicAiConfig);
  const providerLabel = config?.provider === 'chatjpt' ? 'ChatJPT' : 'Gemini AI';
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const sessionIdRef = React.useRef<string>('');
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  React.useEffect(() => {
    if (!config?.enabled || messages.length > 0) {
      return;
    }
    setMessages([{
      content: config.widgetGreeting,
      id: createId(),
      role: 'assistant',
    }]);
  }, [config?.enabled, config?.widgetGreeting, messages.length]);

  React.useEffect(() => {
    const openChatbot = () => setIsOpen(true);
    window.addEventListener(AI_CHATBOT_OPEN_EVENT, openChatbot);
    return () => window.removeEventListener(AI_CHATBOT_OPEN_EVENT, openChatbot);
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const sendMessage = async (raw: string) => {
    const message = raw.trim();
    if (!message || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      content: message,
      id: createId(),
      role: 'user',
    };
    const assistantId = createId();
    const assistantMessage: ChatMessage = {
      content: '',
      id: assistantId,
      role: 'assistant',
      suggestions: [],
    };

    const patchAssistant = (patch: Partial<ChatMessage>) => {
      setMessages((prev) => prev.map((item) =>
        item.id === assistantId ? { ...item, ...patch } : item
      ));
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai-chat', {
        body: JSON.stringify({
          message,
          sessionId: sessionIdRef.current || getSessionId(),
          sourcePath: window.location.pathname,
          stream: true,
        }),
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data?.message === 'string' ? data.message : 'Chatbot AI chưa thể phản hồi.');
      }

      if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
        const fallback = await readAiChatStream(response, {
          onDelta: (text) => {
            setMessages((prev) => prev.map((item) =>
              item.id === assistantId ? { ...item, content: `${item.content}${text}` } : item
            ));
          },
          onError: (errorMessage) => patchAssistant({ content: errorMessage }),
          onMeta: (suggestions) => patchAssistant({ suggestions }),
        });
        if (fallback) {
          await streamChatjptFromBrowser(fallback, (text) => {
            setMessages((prev) => prev.map((item) =>
              item.id === assistantId ? { ...item, content: `${item.content}${text}` } : item
            ));
          });
        }
      } else {
        const data = await response.json().catch(() => ({}));
        patchAssistant({
          content: String(data.message ?? 'Tôi chưa có câu trả lời phù hợp.'),
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        });
      }
    } catch (error) {
      patchAssistant({
        content: error instanceof Error ? error.message : 'Chatbot AI chưa thể phản hồi.',
        suggestions: [],
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!config?.enabled || !isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="ai-chatbot-title"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-2 z-[70] flex h-[min(70dvh,500px)] max-h-[calc(100dvh-7.25rem)] w-[calc(100vw-16px)] max-w-[420px] flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:right-4"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-cyan-700 dark:border-slate-800 dark:bg-slate-900 dark:text-cyan-300">
            <Bot size={17} />
          </span>
          <div>
            <p id="ai-chatbot-title" className="text-sm font-bold">{config.widgetTitle}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{providerLabel} • dữ liệu site</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          aria-label="Đóng chatbot"
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-white px-3 py-3 dark:bg-slate-950" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`min-w-0 max-w-[90%] overflow-hidden rounded-md px-2.5 py-2 text-[13px] leading-5 break-words [overflow-wrap:anywhere] ${
              message.role === 'user'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}>
              {message.role === 'assistant' ? (
                <SafeMarkdown className="text-[13px]" content={message.content} emptyText="Đang trả lời..." />
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {message.suggestions.slice(0, 4).map((suggestion) => (
                    <a
                      key={`${suggestion.type}:${suggestion.url}`}
                      href={suggestion.url}
                      className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-900 dark:hover:text-cyan-300"
                    >
                      <span className="min-w-0 flex-1 break-words leading-4">{suggestion.title}</span>
                      <ExternalLink size={12} className="mt-0.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 size={14} className="animate-spin" />
              Đang suy nghĩ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              disabled={isSending}
              className="inline-flex shrink-0 items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-900 dark:hover:text-cyan-300"
            >
              {question}
            </button>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Nhập câu hỏi..."
            aria-label="Nhập câu hỏi cho chatbot"
            className="min-h-11 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-800 dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-cyan-300"
            aria-label="Gửi"
          >
            {isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </form>
      </div>
    </div>
  );
}

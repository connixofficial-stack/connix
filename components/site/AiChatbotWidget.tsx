'use client';

import React from 'react';
import { Bot, ExternalLink, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
  'Tư vấn giúp tôi sản phẩm phù hợp',
  'Website có dịch vụ gì nổi bật?',
  'Tôi muốn liên hệ tư vấn',
];

export function AiChatbotWidget() {
  const config = useQuery(api.systemIntegrations.getPublicAiConfig);
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const sessionIdRef = React.useRef<string>('');

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
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai-chat', {
        body: JSON.stringify({
          message,
          sessionId: sessionIdRef.current || getSessionId(),
          sourcePath: window.location.pathname,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Chatbot AI chưa thể phản hồi.');
      }
      setMessages((prev) => [...prev, {
        content: String(data.message ?? 'Tôi chưa có câu trả lời phù hợp.'),
        id: createId(),
        role: 'assistant',
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        content: error instanceof Error ? error.message : 'Chatbot AI chưa thể phản hồi.',
        id: createId(),
        role: 'assistant',
      }]);
    } finally {
      setIsSending(false);
    }
  };

  if (!config?.enabled || !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-3 z-[70] w-[calc(100vw-24px)] max-w-[390px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-white dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <Bot size={19} />
          </span>
          <div>
            <p className="text-sm font-bold">{config.widgetTitle}</p>
            <p className="text-[11px] text-white/75">Gemini AI • phản hồi theo dữ liệu site</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="Đóng chatbot"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[420px] min-h-[330px] space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 dark:bg-slate-950">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {message.suggestions.slice(0, 4).map((suggestion) => (
                    <a
                      key={`${suggestion.type}:${suggestion.url}`}
                      href={suggestion.url}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-cyan-700 transition hover:bg-cyan-50 dark:border-slate-700 dark:text-cyan-300 dark:hover:bg-cyan-950/30"
                    >
                      <span className="truncate">{suggestion.title}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 size={14} className="animate-spin" />
              Đang suy nghĩ...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              disabled={isSending}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:opacity-60 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300"
            >
              <Sparkles size={11} />
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
            className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-800 dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-md transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi"
          >
            {isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </form>
      </div>
    </div>
  );
}

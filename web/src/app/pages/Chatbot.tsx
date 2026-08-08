// pages/Chatbot.tsx
// Group 5: Chatbot.
//
// A Claude-powered chat surface. Layout:
//   - Header with title/subtitle + a "clear chat" action.
//   - A scrollable message area with user bubbles (green, right-aligned)
//     and assistant bubbles (white, left-aligned).
//   - An input bar pinned to the bottom of the panel.
//
// History is loaded from GET /api/chat, messages are posted to
// POST /api/chat, and DELETE /api/chat wipes the conversation.

import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Loader2, Bot, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageProvider';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string | null;
}

// The assistant reply can come back in a few shapes depending on the
// backend — accept the common ones so the page stays resilient.
interface ChatPostResponse {
  reply?: string;
  message?: { role?: string; content?: string };
  messages?: ChatMessage[];
}

export function Chatbot() {
  const { t } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ----- load history -----
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ messages: ChatMessage[] }>('/api/chat')
      .then((res) => {
        if (!cancelled) setMessages(res.messages ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('chatGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ----- auto-scroll on new messages / typing -----
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...(prev ?? []), userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await apiFetch<ChatPostResponse>('/api/chat', {
        method: 'POST',
        body: { message: text },
      });

      const reply =
        res.reply ??
        res.message?.content ??
        (res.messages && res.messages.length
          ? res.messages[res.messages.length - 1].content
          : undefined);

      if (reply) {
        setMessages((prev) => [...(prev ?? []), { role: 'assistant', content: reply }]);
      } else {
        // No reply came back — don't leave the user hanging with a spinner.
        toast.error(t('chatGenericError'));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('chatGenericError'));
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    try {
      await apiFetch('/api/chat', { method: 'DELETE' });
      setMessages([]);
      toast.success(t('chatCleared'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('chatGenericError'));
    }
  }

  const isEmpty = messages !== null && messages.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('chatTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('chatSubtitle')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={sending || isEmpty}
          title={t('chatClear')}
        >
          <Trash2 className="w-4 h-4" />
          {t('chatClear')}
        </Button>
      </header>

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* ----- Chat panel ----- */}
      <div className="bg-white border border-border rounded-xl flex flex-col h-[70vh] min-h-[420px] overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages === null && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('chatLoading')}
            </div>
          )}

          {isEmpty && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground px-6">
              <div className="w-12 h-12 rounded-full bg-primary-green/10 text-primary-green flex items-center justify-center mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <p className="text-sm max-w-xs">{t('chatEmpty')}</p>
            </div>
          )}

          {messages?.map((m, i) => (
            <MessageBubble key={m.id ?? i} message={m} t={t} />
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('chatLoading')}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <form onSubmit={handleSend} className="border-t border-border p-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="h-11"
            disabled={sending}
            autoComplete="off"
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={sending || input.trim().length === 0}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------------------- MessageBubble ----------------------

function MessageBubble({ message, t }: { message: ChatMessage; t: (k: string) => string }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'max-w-[80%] flex items-start gap-2.5',
          isUser ? 'flex-row-reverse' : '',
        ].join(' ')}
      >
        <div
          className={[
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            isUser ? 'bg-primary-green text-white' : 'bg-secondary text-muted-foreground',
          ].join(' ')}
          title={isUser ? t('chatYou') : t('chatAssistant')}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div
          className={[
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line',
            isUser
              ? 'bg-primary-green text-white rounded-tr-sm'
              : 'bg-white border border-border text-foreground rounded-tl-sm',
          ].join(' ')}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

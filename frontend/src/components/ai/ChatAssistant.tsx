import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Send, BrainCircuit, User, Copy, CheckCircle, Sparkles, Info } from 'lucide-react';
import { sendMessage } from '../../services/aiAssistant';
import type { ChatMessage } from '../../services/aiAssistant';

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'What is my current cash runway?',
  'Which obligations are overdue?',
  'Which vendor should I defer?',
  'Draft an email to TechSupplies',
  'What are my GST obligations?',
  'Explain my financial health score',
];

// ── Simple markdown renderer ──────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.flatMap((line, li) => {
    // Horizontal rule
    if (line.trim() === '---') {
      return [<hr key={`hr-${li}`} className="border-gray-700 my-2" />];
    }
    // Parse **bold** within a line
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={pi}>{part}</React.Fragment>;
    });
    // Add line break between lines (not after last)
    if (li < lines.length - 1) {
      return [...rendered, <br key={`br-${li}`} />];
    }
    return rendered;
  });
}

// Strip markdown for clipboard copy
function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^---$/gm, '').trim();
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blue-400"
          style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(stripMarkdown(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all',
        copied
          ? 'bg-green-900/20 border-green-800 text-green-300'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-blue-700 hover:text-blue-300'
      )}
    >
      {copied
        ? <><CheckCircle className="w-3 h-3" /> Copied!</>
        : <><Copy className="w-3 h-3" /> Copy Email Draft</>
      }
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
interface BubbleProps {
  msg:      ChatMessage & { timestamp: string; typing?: boolean };
}

function MessageBubble({ msg }: BubbleProps) {
  const isUser = msg.role === 'user';

  return (
    <div className={clsx('flex gap-3 items-end', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mb-0.5',
        isUser ? 'bg-gray-700' : 'bg-blue-600'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-gray-300" />
          : <BrainCircuit className="w-3.5 h-3.5 text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[78%]')}>
        <div className={clsx(
          'px-4 py-3 rounded-2xl text-xs leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-[#111827] border border-gray-800 text-gray-200 rounded-bl-sm'
        )}>
          {msg.typing ? (
            <TypingDots />
          ) : (
            renderMarkdown(msg.content)
          )}
        </div>

        {/* Email draft copy button */}
        {msg.isEmailDraft && !msg.typing && (
          <CopyButton text={msg.content} />
        )}

        {/* Timestamp */}
        {!msg.typing && (
          <span className="text-[9px] text-gray-600 mt-1 px-1">{msg.timestamp}</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
type UiMessage = ChatMessage & { timestamp: string; typing?: boolean };

const WELCOME: UiMessage = {
  id:        'welcome',
  role:      'assistant',
  content:   "Hello! I'm CaliComp's AI financial assistant, powered by GPT-4o.\n\nI can see your real-time cash position, upcoming obligations, and transaction history. Ask me anything about your finances — or use a prompt below to get started.",
  timestamp: format(new Date(), 'HH:mm'),
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const now = format(new Date(), 'HH:mm');

    // Add user message
    const userMsg: UiMessage = {
      id:        `u-${Date.now()}`,
      role:      'user',
      content:   trimmed,
      timestamp: now,
    };

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    const typingMsg: UiMessage = {
      id:        typingId,
      role:      'assistant',
      content:   '',
      timestamp: now,
      typing:    true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history (exclude welcome + typing msgs)
      const history: ChatMessage[] = messages
        .filter(m => !m.typing && m.id !== 'welcome')
        .map(({ id, role, content, isEmailDraft }) => ({ id, role, content, isEmailDraft }));

      const response = await sendMessage(trimmed, history);

      setMessages(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, content: response.content, isEmailDraft: response.isEmailDraft, typing: false, timestamp: format(new Date(), 'HH:mm') }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, content: 'Sorry, I ran into an error. Please try again.', typing: false, timestamp: format(new Date(), 'HH:mm') }
          : m
      ));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">AI Assistant</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">
            GPT-4o · financial intelligence
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/20 border border-blue-900/30">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pro</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {/* One-time session disclaimer — cannot be dismissed */}
        <div className="flex gap-3 items-start">
          <div className="w-7 h-7 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex-1 px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-900/60 border border-gray-800 text-[10px] text-gray-400 leading-relaxed">
            CaliComp Assistant can help you understand your financial data, but does not provide financial advice. For decisions involving significant sums or legal obligations (GST, TDS, loan EMIs), please consult a qualified Chartered Accountant or financial advisor.
          </div>
        </div>

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts — visible only before first user message */}
      {showSuggestions && (
        <div className="shrink-0 pt-3 pb-2">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">Try asking…</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-[10px] font-bold text-gray-400 hover:border-blue-700 hover:text-blue-300 transition-all disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 pt-3 border-t border-gray-800">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask about your finances… (Enter to send, Shift+Enter for newline)"
            disabled={loading}
            className="flex-1 bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed disabled:opacity-60"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[9px] text-gray-700 mt-2 text-center">
          Shift+Enter for new line · Responses generated by GPT-4o
        </p>
      </div>
    </div>
  );
}

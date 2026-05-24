"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, RotateCcw, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "ai-chat-messages";

const QUICK_ACTIONS = [
  { icon: "💬", label: "聊聊天", prompt: "你好呀，今天过得怎么样？", type: "prompt" as const },
  { icon: "🌙", label: "晚安总结", href: "/ai/goodnight", type: "nav" as const },
  { icon: "📊", label: "成长报告", href: "/ai/weekly", type: "nav" as const },
  { icon: "💝", label: "情绪分析", prompt: "帮我分析一下今天的情绪", type: "prompt" as const },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function AiPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setMounted(true);
          return;
        }
      }
    } catch {}
    setMessages([
      {
        role: "assistant",
        content: "你好呀～我是你的AI小助手 💕 今天有什么想聊的吗？",
        timestamp: Date.now(),
      },
    ]);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, mounted]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  async function handleSend(overrideInput?: string) {
    const text = overrideInput ?? input;
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(({ role, content }) => ({ role, content })) }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "抱歉，我暂时无法回复，请稍后再试～",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络好像有点问题，稍后再试试吧～ 💫", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleNewChat() {
    const welcome: Message = {
      role: "assistant",
      content: "你好呀～我是你的AI小助手 💕 今天有什么想聊的吗？",
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function handleCopy(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {}
  }

  function handleQuickAction(action: (typeof QUICK_ACTIONS)[number]) {
    if (action.type === "nav" && action.href) {
      router.push(action.href);
    } else if (action.type === "prompt" && action.prompt) {
      handleSend(action.prompt);
    }
  }

  const messageCount = messages.filter((m) => m.role === "user").length;

  return (
    <main className="min-h-screen flex flex-col p-5 lg:p-8 pb-28 lg:pb-8">
      <header className="flex items-center gap-3 mb-2 fade-in max-w-3xl mx-auto w-full">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl float-animation">
          🤖
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold">AI 小助手</h1>
            {messageCount > 0 && (
              <span className="glass-badge bg-primary/10 text-primary scale-in">
                {messageCount}条对话
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">随时陪伴你的智能伙伴</p>
        </div>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          title="新对话"
        >
          <RotateCcw size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 max-w-3xl mx-auto w-full"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-in`}
          >
            <div className="max-w-[85%] lg:max-w-[70%]">
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md shadow-md shadow-primary/20"
                    : "glass-card rounded-bl-md shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground/60">
                  {formatTime(msg.timestamp)}
                </span>
                {msg.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 hover:text-primary transition-colors"
                  >
                    {copiedIdx === i ? (
                      <>
                        <Check size={10} /> 已复制
                      </>
                    ) : (
                      <>
                        <Copy size={10} /> 复制
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start fade-in">
            <div className="glass-card p-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span
                  className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-4 gap-2 mb-3 lg:flex lg:flex-row lg:justify-center lg:gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action)}
              className="glass-card p-2.5 flex flex-col items-center gap-1 text-xs scale-in hover:bg-primary/5 transition-colors lg:flex-row lg:gap-2 lg:px-4 lg:py-2"
            >
              <span className="text-lg">{action.icon}</span>
              <span className="font-medium text-muted-foreground text-[11px]">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 glass-nav max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="说点什么吧..."
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="glass-button p-2.5 rounded-xl disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}

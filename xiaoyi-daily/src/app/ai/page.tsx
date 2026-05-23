"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, Moon, BarChart3, Heart } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { icon: "💬", label: "聊聊天", prompt: "你好呀，今天过得怎么样？" },
  { icon: "🌙", label: "晚安总结", prompt: "帮我生成今天的晚安总结" },
  { icon: "📊", label: "成长报告", prompt: "给我看看这周的成长报告" },
  { icon: "💝", label: "情绪分析", prompt: "帮我分析一下今天的情绪" },
];

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好呀～我是你的AI小助手 💕 今天有什么想聊的吗？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "抱歉，我暂时无法回复，请稍后再试～" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络好像有点问题，稍后再试试吧～ 💫" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAction(prompt: string) {
    setInput(prompt);
  }

  return (
    <main className="min-h-screen flex flex-col pb-28">
      <header className="p-5 pt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl float-animation">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold">AI 小助手</h1>
          <p className="text-xs text-muted-foreground">随时陪伴你的智能伙伴</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "glass-card rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass-card p-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-5 py-3">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                className="glass-card p-3 flex items-center gap-2 text-sm text-left"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 glass-nav">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="说点什么吧..."
            className="flex-1 glass-input px-4 py-2.5 text-sm"
          />
          <button
            onClick={handleSend}
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

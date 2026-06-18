import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";

type Message = { role: "user" | "assistant"; content: string };

const WELCOME: Record<string, string> = {
  ar: "أهلاً بكِ في رحلة سلام 🌿\n\nأنا مساعدتكِ الذكية! أخبريني بما تواجهينه مع طفلكِ وسأوجّهكِ إلى الحل المناسب — سواء كان جلسة، دورة، أو منتج.",
  en: "Welcome to Salam Journey 🌿\n\nI'm your AI assistant! Tell me what you're facing with your child and I'll guide you to the right solution — a session, course, or product.",
};

const SUGGESTIONS: Record<string, string[]> = {
  ar: [
    "طفلي يصرخ كثيراً",
    "أريد دورة للتربية",
    "كيف أحجز جلسة؟",
    "منتجات مجانية",
  ],
  en: [
    "My child has tantrums",
    "I want a parenting course",
    "How to book a session?",
    "Free products",
  ],
};

export function AiChat() {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // typing animation
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // تنظيف الـ Interval عند إغلاق المكون منعا لأي Memory Leak
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, []);

  // 🌟 دالة مطورة لتحويل النصوص والروابط (Markdown) إلى عناصر تفاعلية
  function formatAiMessage(text: string) {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      let isBullet = false;
      let cleanLine = line;

      if (line.trim().startsWith("- ")) {
        cleanLine = line.trim().substring(2);
        isBullet = true;
      } else if (line.trim().startsWith("* ")) {
        cleanLine = line.trim().substring(2);
        isBullet = true;
      }

      // 🌟 تفتيت السطر بناءً على علامات الـ Bold والروابط معا
      const parts = cleanLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      const renderedLine = parts.map((part, i) => {
        // معالجة النصوص العريضة Bold
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-extrabold text-sage-dark">{part.slice(2, -2)}</strong>;
        }
        
        // 🌟 معالجة الـ Hyperlinks [نص الرابط](اللينك) تحويلها لروابط تفاعلية
        if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
          const closeBracketIdx = part.indexOf("](");
          const linkText = part.slice(1, closeBracketIdx);
          const linkUrl = part.slice(closeBracketIdx + 2, -1);
          
          return (
            <a
              key={i}
              href={linkUrl}
              target={linkUrl.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="font-bold underline text-sage-dark hover:text-sage transition-colors duration-200 inline-block mx-0.5"
            >
              {linkText}
            </a>
          );
        }
        
        return part;
      });

      return (
        <p key={index} className={isBullet ? "list-item ms-5 list-disc mb-1" : "mb-1"}>
          {renderedLine}
        </p>
      );
    });
  }

  // Typing animation: reveals the reply word-by-word after receiving it
  const startTypingAnimation = (fullText: string) => {
  const chars = Array.from(fullText);
  let idx = 0;

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",
    },
  ]);

  animationIntervalRef.current = setInterval(() => {
    if (idx < chars.length) {
      const char = chars[idx++];

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last && last.role === "assistant") {
          return [
            ...updated.slice(0, -1),
            {
              ...last,
              content: last.content + char,
            },
          ];
        }

        return updated;
      });
    } else {
      clearInterval(animationIntervalRef.current!);
      animationIntervalRef.current = null;
      setLoading(false);
    }
  }, 8);
};

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // cancel any running animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json() as { reply?: string; error?: string };

      if (data.error || !data.reply) {
        throw new Error(data.error ?? "Empty reply");
      }
      console.log("AI Reply Length:", data.reply.length);
      console.log(data.reply);
      startTypingAnimation(data.reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى."
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
      setLoading(false);
    }
  }

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isFirstMessage = messages.length === 0;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 start-6 z-[80] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--sage), var(--sage-dark))",
          boxShadow: "0 8px 32px rgba(90,138,128,0.4)",
        }}
        aria-label={lang === "ar" ? "المساعد الذكي" : "AI Assistant"}
      >
        {open ? (
          <X size={22} color="white" />
        ) : (
          <>
            <MessageCircle size={22} color="white" />
            {hasUnread && (
              <span
                className="absolute -top-1 -end-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: "var(--blush)" }}
              >
                !
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        dir={dir}
        className={`fixed bottom-24 start-6 z-[80] w-[340px] sm:w-[380px] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          open
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none translate-y-4"
        }`}
        style={{
          maxHeight: "520px",
          background: "var(--white)",
          border: "1px solid rgba(127,169,155,0.2)",
          boxShadow: "0 24px 60px rgba(45,74,69,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--sage-dark), var(--sage))",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Sparkles size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white">
              {t(tx("مساعدة رحلة سلام", "Salam Journey Assistant"))}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
              {t(tx("متاحة دائماً للمساعدة", "Always here to help"))}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-300 shrink-0" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
          {/* Welcome Message */}
          <div className="flex gap-2 items-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "var(--sage-muted)" }}
            >
              <Bot size={14} style={{ color: "var(--sage-dark)" }} />
            </div>
            <div
              className="rounded-2xl rounded-ss-none px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] whitespace-pre-line"
              style={{
                background: "var(--cream)",
                color: "var(--text-dark)",
              }}
            >
              {WELCOME[lang] ?? WELCOME.ar}
            </div>
          </div>

          {/* Suggestion Chips */}
          {isFirstMessage && (
            <div className="flex flex-wrap gap-2 ps-9">
              {(SUGGESTIONS[lang] ?? SUGGESTIONS.ar).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "var(--sage-muted)",
                    color: "var(--sage-dark)",
                    border: "1px solid rgba(127,169,155,0.3)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages Mapping */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, var(--sage), var(--sage-dark))"
                      : "var(--sage-muted)",
                }}
              >
                {msg.role === "user" ? (
                  <User size={13} color="white" />
                ) : (
                  <Bot size={13} style={{ color: "var(--sage-dark)" }} />
                )}
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] ${
                  msg.role === "user" ? "rounded-se-none" : "rounded-ss-none"
                }`}
                style={{
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, var(--sage), var(--sage-dark))"
                      : "var(--cream)",
                  color: msg.role === "user" ? "white" : "var(--text-dark)",
                }}
              >
                {msg.content || msg.role === "user" ? (
                  msg.role === "user" ? msg.content : formatAiMessage(msg.content)
                ) : (
                  <Loader2 size={14} className="animate-spin opacity-60" />
                )}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="shrink-0 px-4 py-3 flex gap-2 items-end"
          style={{
            borderTop: "1px solid rgba(127,169,155,0.15)",
            background: "var(--white)",
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t(tx("اكتبي سؤالكِ هنا...", "Type your question..."))}
            className="flex-1 resize-none rounded-2xl px-3.5 py-2.5 text-sm outline-none leading-relaxed"
            style={{
              background: "var(--cream)",
              color: "var(--text-dark)",
              border: "1px solid rgba(127,169,155,0.2)",
              minHeight: "42px",
              maxHeight: "96px",
            }}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--sage), var(--sage-dark))",
            }}
          >
            {loading ? (
              <Loader2 size={16} color="white" className="animate-spin" />
            ) : (
              <Send size={15} color="white" style={{ transform: lang === "ar" ? "scaleX(-1)" : "none" }} />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
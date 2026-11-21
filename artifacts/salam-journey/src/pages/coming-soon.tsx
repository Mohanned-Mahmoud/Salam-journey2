import { useState, useEffect, type FormEvent } from "react";
import { Link } from "wouter";
import { Sparkles, Heart, Bell, Send, CheckCircle2, MessageCircle, ArrowLeft, Lock, BookOpen, Compass, ShieldCheck } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaYoutube, FaFacebook, FaTiktok } from "react-icons/fa";
import { Confetti } from "@/components/confetti";
import { useCreateLead } from "@workspace/api-client-react";
import { apiJson } from "@/lib/api";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [social, setSocial] = useState({
    whatsapp: "https://wa.me/201015473623",
    instagram: "",
    youtube: "",
    facebook: "",
    tiktok: "",
  });

  const createLead = useCreateLead();

  useEffect(() => {
    document.title = "قريباً | رحلة سلام — مساحة للأم الواعية";

    // Track Meta Pixel PageView
    try {
      if (typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "PageView");
      }
    } catch {
      // ignore
    }

    // Fetch site social links
    Promise.all([
      apiJson<{ value: string }>("/site-settings/whatsapp_number").catch(() => ({ value: "" })),
      apiJson<{ value: string }>("/site-settings/instagram_url").catch(() => ({ value: "" })),
      apiJson<{ value: string }>("/site-settings/youtube_url").catch(() => ({ value: "" })),
      apiJson<{ value: string }>("/site-settings/facebook_url").catch(() => ({ value: "" })),
      apiJson<{ value: string }>("/site-settings/tiktok_url").catch(() => ({ value: "" })),
    ]).then(([wa, ig, yt, fb, tk]) => {
      let cleanWa = wa.value.replace(/\D/g, "") || "201015473623";
      if (cleanWa.startsWith("01") && cleanWa.length === 11) {
        cleanWa = "20" + cleanWa.slice(1);
      }
      setSocial({
        whatsapp: `https://wa.me/${cleanWa}`,
        instagram: ig.value,
        youtube: yt.value,
        facebook: fb.value,
        tiktok: tk.value,
      });
    });
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;

    createLead.mutate(
      {
        data: {
          name: "مشتركة في قائمة انتظار قريباً",
          email: email.trim() || `subscriber-${Date.now()}@salamjourney.com`,
          phone: phone.trim() || "غير محدد",
        },
      },
      {
        onSettled: () => {
          setSubmitted(true);
        },
      }
    );
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col justify-between selection:bg-[#7FA99B]/30 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top right, #F6F1E8 0%, #FAF7F2 45%, #F4EFEB 100%)",
        fontFamily: "var(--font-body)",
        color: "var(--text-dark)",
      }}
    >
      {submitted && <Confetti count={40} />}

      {/* Ambient background blur elements */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-40 blur-3xl"
        style={{ background: "#7FA99B" }}
      />
      <div
        className="absolute top-1/2 -left-40 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
        style={{ background: "#C97A63" }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: "#2D4A45" }}
      />

      {/* ── Top Navigation / Brand Bar ── */}
      <header className="relative z-10 px-6 py-6 md:px-12 max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/images/logo.png"
            alt="Salam Journey"
            className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
          />
        </Link>

        <a
          href={social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            color: "var(--sage-dark)",
            border: "1px solid rgba(127, 169, 155, 0.3)",
          }}
        >
          <FaWhatsapp className="text-emerald-600 text-base" />
          <span>تحدثي معنا واتساب</span>
        </a>
      </header>

      {/* ── Main Hero & Content ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center text-center">
        {/* Grand Typography for "قريباً" */}
        <div className="relative mb-4 md:mb-6 select-none animate-fade-in">
          <h2
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none"
            style={{
              fontFamily: "var(--font-heading)",
              background: "linear-gradient(135deg, var(--text-dark) 0%, #355A53 45%, var(--sage-dark) 75%, #C97A63 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 6px 20px rgba(45, 74, 69, 0.12))",
            }}
          >
            قـريـبـاً
          </h2>
        </div>

        {/* Master Headline */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.25] mb-6 max-w-3xl"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-dark)",
          }}
        >
          نُجهّز لكِ تجربة تربوية تلهم قلبكِ وتطمئن أمومتكِ.
        </h1>

        {/* Empathic Subtitle */}
        <p
          className="text-base sm:text-lg md:text-xl leading-relaxed mb-10 max-w-2xl text-[var(--text-body)]"
          style={{ fontWeight: 400 }}
        >
          نعمل بهدوء وشغف على إعداد مساحة متكاملة تجمع بين وعي التربية وهدوء الأم، لتقديم أدوات عملية تلمس يومكِ وتصنع فرقاً حقيقياً في علاقتكِ بطفلك.
        </p>

        {/* ── Waitlist Subscription Form ── */}
        <div
          className="w-full max-w-xl rounded-3xl p-6 sm:p-8 mb-12 shadow-xl border relative transition-all"
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(127, 169, 155, 0.25)",
            boxShadow: "0 20px 45px -10px rgba(45, 74, 69, 0.12)",
          }}
        >
          {!submitted ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2 text-xs font-bold text-[var(--sage-dark)]">
                <Bell className="w-4 h-4 text-[var(--sage)]" />
                <span>كوني أول من ينضم وتلقي هدية الإطلاق الخاصة</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                سجّلي بريدك أو رقمك وسنوافيكِ بموعد الافتتاح الرسمي والخصومات المبكرة.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني (you@email.com)"
                    className="flex-1 px-4 py-3.5 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--sage)] text-right"
                    style={{
                      background: "var(--cream)",
                      border: "1px solid rgba(127, 169, 155, 0.25)",
                      color: "var(--text-dark)",
                    }}
                  />
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الواتساب (اختياري)"
                    className="sm:w-48 px-4 py-3.5 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--sage)] text-right"
                    style={{
                      background: "var(--cream)",
                      border: "1px solid rgba(127, 169, 155, 0.25)",
                      color: "var(--text-dark)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={createLead.isPending}
                  className="w-full py-4 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(135deg, var(--sage-dark) 0%, #3B615A 100%)",
                  }}
                >
                  <span>{createLead.isPending ? "جاري التسجيل..." : "أخبروني فور الإطلاق"}</span>
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-[var(--text-muted)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>خصوصيتكِ مقدسة، ولن نرسل سوى ما يفيدكِ ويسعدكِ.</span>
              </div>
            </>
          ) : (
            <div className="py-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-dark)] mb-2">
                أهلاً بكِ في قائمة سلام المبكرة! 🌿
              </h3>
              <p className="text-sm text-[var(--text-body)] mb-6 max-w-md mx-auto leading-relaxed">
                تم تسجيل بياناتكِ بنجاح. سنرسل لكِ إشعاراً خاصاً فور فتح الأبواب مع مفاجأة ترحيبية معدّة بكل حب.
              </p>
              <a
                href={social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                <FaWhatsapp className="text-base text-emerald-600" />
                <span>تواصلي معنا عبر واتساب للمتابعة الفورية</span>
              </a>
            </div>
          )}
        </div>

        {/* ── Pillars Sneak-Peek ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-8 text-right">
          <div
            className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[rgba(127,169,155,0.2)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center mb-3">
                <Compass className="w-5 h-5 text-[var(--sage-dark)]" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-dark)] mb-1.5">دورات واستشارات</h4>
              <p className="text-xs text-[var(--text-body)] leading-relaxed">
                برامج عملية موجهة للأم الواعية، تُقدم بهدوء وبأدوات واقعية تناسب بيتك.
              </p>
            </div>
          </div>

          <div
            className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[rgba(127,169,155,0.2)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-[var(--sage-dark)]" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-dark)] mb-1.5">إصدارات وأدلة</h4>
              <p className="text-xs text-[var(--text-body)] leading-relaxed">
                كتب وجداول ومفكرات يومية قابلة للتطبيق الفوري لتنظيم روتين أسرتك.
              </p>
            </div>
          </div>

          <div
            className="p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[rgba(127,169,155,0.2)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-[var(--blush)]" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-dark)] mb-1.5">مجتمع داعم</h4>
              <p className="text-xs text-[var(--text-body)] leading-relaxed">
                بيئة آمنة تفهم مشاعركِ وتشارككِ تحديات التربية دون لوم أو أحكام.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 py-6 border-t border-[rgba(127,169,155,0.18)] max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <div>
          <span>© {new Date().getFullYear()} أكاديمية رحلة سلام — جميع الحقوق محفوظة</span>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          <a
            href={social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-8 h-8 rounded-full bg-white/80 border border-[rgba(127,169,155,0.25)] flex items-center justify-center text-emerald-600 hover:scale-110 transition-transform"
          >
            <FaWhatsapp size={14} />
          </a>
          {social.instagram && (
            <a
              href={social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-white/80 border border-[rgba(127,169,155,0.25)] flex items-center justify-center text-pink-600 hover:scale-110 transition-transform"
            >
              <FaInstagram size={14} />
            </a>
          )}
          {social.youtube && (
            <a
              href={social.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-full bg-white/80 border border-[rgba(127,169,155,0.25)] flex items-center justify-center text-red-600 hover:scale-110 transition-transform"
            >
              <FaYoutube size={14} />
            </a>
          )}
          {social.facebook && (
            <a
              href={social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-8 h-8 rounded-full bg-white/80 border border-[rgba(127,169,155,0.25)] flex items-center justify-center text-blue-600 hover:scale-110 transition-transform"
            >
              <FaFacebook size={14} />
            </a>
          )}
          {social.tiktok && (
            <a
              href={social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="w-8 h-8 rounded-full bg-white/80 border border-[rgba(127,169,155,0.25)] flex items-center justify-center text-gray-900 hover:scale-110 transition-transform"
            >
              <FaTiktok size={14} />
            </a>
          )}
        </div>

        {/* Subtle Admin Link */}
        <div>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-dark)] transition-colors hover:underline"
          >
            <Lock className="w-3 h-3" />
            <span>دخول الإدارة</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

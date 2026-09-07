import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

export default function EbookLanding() {
  const ref = useReveal<HTMLDivElement>();
  const { t, lang } = useLanguage();

  useEffect(() => {
    document.title = "دليل صغير، أثر كبير | Salam Journey";
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', 'احصلي على دليل Salam Journey المجاني لتنشئة طفل واثق وسعيد، مكتوب بالعربية وبحب.');
  }, []);

  return (
    <div ref={ref} key={lang} className="lang-fade pb-16">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <SoftBlob
          color="var(--sage-light)"
          className="absolute -top-32 -end-32 w-[520px] h-[520px] opacity-50 animate-drift pointer-events-none"
        />
        <SoftBlob
          color="var(--blush)"
          className="absolute top-40 -start-24 w-[300px] h-[300px] opacity-40 animate-float-slow pointer-events-none"
        />
        <div className="absolute inset-0 leaf-pattern opacity-60 pointer-events-none" aria-hidden />

        <div className="relative container mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-24 min-h-[75vh] flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="text-start">
              <span
                className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  color: "var(--sage-dark)",
                  border: "1px solid rgba(127,169,155,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Sparkles size={13} />
                هدية مجانية من Salam Journey
              </span>

              <h1 className="reveal text-4xl md:text-5xl lg:text-6xl leading-[1.2] mb-6" data-reveal-delay="80">
                خطوات بسيطة<br />
                لتنشئة <em style={{ fontStyle: "normal", color: "var(--sage-dark)" }}>طفل واثق وسعيد</em>
              </h1>

              <p
                className="reveal text-lg md:text-xl leading-relaxed max-w-lg mb-10"
                data-reveal-delay="160"
                style={{ color: "var(--text-body)" }}
              >
                دليل عملي من 18 صفحة، صُمّم للأمهات والآباء الذين يريدون تربية أطفالهم بالحب والوعي… خطوة صغيرة كل يوم.
              </p>

              <div className="reveal flex flex-col sm:flex-row gap-4 items-start sm:items-center" data-reveal-delay="240">
                <Link href="/salam-journey/register" className="pill-btn pill-btn-primary pulse-cta">
                  احصلي على نسختك المجانية
                  <ArrowLeft size={16} />
                </Link>
              </div>
              <div className="reveal mt-4 flex items-center gap-2 text-sm opacity-80" data-reveal-delay="300" style={{ color: "var(--text-muted)" }}>
                <LockKeyhole size={14} /> لن نرسل لك إلا ما يفيدك، ويمكنك إلغاء الاشتراك في أي وقت
              </div>
            </div>

            <div className="relative reveal" data-reveal-delay="200">
              <div
                className="absolute -inset-4 rounded-[3rem] opacity-50 -z-10"
                style={{ background: "var(--sage-light)" }}
              />
              <div
                className="rounded-[2.5rem] p-3 shadow-xl"
                style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
              >
                <div className="rounded-[2rem] overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  <img src="/images/ebook-blank.jpeg" alt="غلاف كتاب خطوات لتنشئة طفل واثق وسعيد" className="w-full h-auto object-cover" />
                  <div className="absolute top-4 start-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-sm text-center">
                    <strong className="block text-xl" style={{ color: "var(--sage-dark)" }}>18</strong>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة من القلب</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Points ─── */}
      <section style={{ background: "var(--sage-dark)", color: "var(--cream)" }}>
        <div className="container mx-auto px-5 md:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2 reveal">
              <b className="text-2xl font-bold font-display opacity-80">01</b>
              <span>أداة عملية وليست محاضرة</span>
            </div>
            <div className="flex flex-col items-center gap-2 reveal" data-reveal-delay="100">
              <b className="text-2xl font-bold font-display opacity-80">02</b>
              <span>مكتوب بالعربية وبحب</span>
            </div>
            <div className="flex flex-col items-center gap-2 reveal" data-reveal-delay="200">
              <b className="text-2xl font-bold font-display opacity-80">03</b>
              <span>يصل إلى بريدك فوراً</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section style={{ background: "var(--cream)" }} className="relative pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              ماذا ستجدين داخله؟
            </p>
            <h2 className="text-3xl md:text-4xl mb-4 leading-tight">
              لأن التربية لا تحتاج إلى أم مثالية، بل إلى أم حاضرة.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="glass-card p-8 reveal block" data-reveal-delay="0">
              <span className="text-3xl font-bold font-display block mb-4" style={{ color: "var(--sage-dark)" }}>01</span>
              <h3 className="text-2xl mb-3">لغة تقرّبكم من بعض</h3>
              <p className="leading-relaxed" style={{ color: "var(--text-body)" }}>
                عبارات يومية تساعدك على فهم مشاعر طفلك والرد عليها بهدوء وثقة.
              </p>
            </div>
            <div className="glass-card p-8 reveal block" data-reveal-delay="90">
              <span className="text-3xl font-bold font-display block mb-4" style={{ color: "var(--sage-dark)" }}>02</span>
              <h3 className="text-2xl mb-3">خطوات قابلة للتطبيق</h3>
              <p className="leading-relaxed" style={{ color: "var(--text-body)" }}>
                أفكار بسيطة يمكنك تجربتها الليلة، بدون ضغط أو تعقيد.
              </p>
            </div>
            <div className="glass-card p-8 reveal block" data-reveal-delay="180">
              <span className="text-3xl font-bold font-display block mb-4" style={{ color: "var(--sage-dark)" }}>03</span>
              <h3 className="text-2xl mb-3">مساحة لكِ أيضاً</h3>
              <p className="leading-relaxed" style={{ color: "var(--text-body)" }}>
                تذكير لطيف بأن راحتك جزء من طفولة سعيدة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quote ─── */}
      <section className="container mx-auto px-5 md:px-8 py-16 reveal">
        <div className="glass-card p-10 md:p-16 text-center max-w-4xl mx-auto" style={{ background: "var(--blush-light)" }}>
          <div className="text-6xl mb-4 opacity-20 mx-auto w-12" style={{ color: "var(--sage-dark)", fontFamily: "Georgia, serif" }}>"</div>
          <blockquote className="text-2xl md:text-3xl leading-relaxed mb-6">
            الطفل الواثق لا يولد من أم لا تخطئ، بل من أم تشعر به وتحاول أن تفهمه كل يوم.
          </blockquote>
          <cite className="block text-lg" style={{ color: "var(--text-muted)", fontStyle: "normal" }}>— من صفحات الدليل</cite>
        </div>
      </section>
    </div>
  );
}

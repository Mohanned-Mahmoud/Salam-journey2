import { Link } from "wouter";
import { Heart, Users, Sparkles, Award } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type Value = {
  Icon: React.ComponentType<{ size?: number }>;
  title: Bilingual;
  desc: Bilingual;
};

const VALUES: Value[] = [
  {
    Icon: Heart,
    title: tx("التعاطف أولاً", "Empathy first"),
    desc: tx(
      "كل أم تشاركنا قصتها تستحق أن تُسمع بقلب مفتوح وبلا أحكام.",
      "Every mother who shares her story deserves to be heard with an open heart and no judgment.",
    ),
  },
  {
    Icon: Sparkles,
    title: tx("محتوى عميق وعملي", "Deep, practical content"),
    desc: tx(
      "نحرص أن يكون كل ما نقدمه قابلاً للتطبيق في حياتك اليومية.",
      "Everything we share is meant to be applied in your everyday life.",
    ),
  },
  {
    Icon: Users,
    title: tx("مجتمع آمن", "A safe community"),
    desc: tx(
      "نبني مساحة محميّة تجمع الأمهات بكل اختلافاتهن.",
      "We hold a protected space where mothers from all walks of life gather.",
    ),
  },
  {
    Icon: Award,
    title: tx("التزام بالجودة", "Committed to quality"),
    desc: tx(
      "كل دورة وكل جلسة تمرّ بمراجعة دقيقة قبل أن تصلكِ.",
      "Every course and session is carefully reviewed before reaching you.",
    ),
  },
];

export default function About() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();

  return (
    <div ref={ref} key={lang} className="lang-fade">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--sage-light)"
          className="absolute -top-24 -start-20 w-[420px] h-[420px] opacity-50 animate-drift pointer-events-none"
        />
        <SoftBlob
          color="var(--blush)"
          className="absolute bottom-0 -end-16 w-[320px] h-[320px] opacity-40 animate-float-slow pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-16">
          <div className="text-center max-w-2xl mx-auto reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("من نحن", "About us"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("أكاديمية بدأت من قلب أم", "An academy born from a mother's heart"))}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "رحلة سلام منصة تربوية تأسست عام 2016 لتمكين الأمهات من تحقيق السلام مع أنفسهن وأطفالهن.",
                  "Salam Journey is a parenting platform founded in 2016 to empower mothers to find peace within themselves and with their children.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--blush-light)" />
      </section>

      {/* Coach story */}
      <section style={{ background: "var(--blush-light)" }}>
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-5 reveal">
              <div
                className="rounded-[2.5rem] p-2"
                style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
              >
                <div
                  className="rounded-[2rem] aspect-[4/5] overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, var(--sage), var(--sage-light))" }}
                >
                  <img
                    src="/images/Coach.jpg"
                    alt="Coach Iman"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-2xl mb-1" style={{ color: "var(--white)" }}>
                      {t(tx("المدربة إيمان", "Coach Iman"))}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.85)" }}>
                      {t(tx("مؤسسة رحلة سلام", "Founder of Salam Journey"))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 reveal" data-reveal-delay="120">
              <h2 className="text-3xl md:text-5xl mb-6 leading-tight">
                {t(tx("قصّتنا", "Our story"))}
              </h2>
              <div className="space-y-4 text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
                <p>
                  {t(
                    tx(
                      "بدأت إيمان مسيرتها عام 2016 بمدوّنة بسيطة، تشارك فيها تجربتها كأم تبحث عن السلام والوعي.",
                      "Iman began in 2016 with a simple blog, sharing her own journey as a mother in search of peace and awareness.",
                    ),
                  )}
                </p>
                <p>
                  {t(
                    tx(
                      "ومع كل أم انضمّت، تشكّلت رؤية أكبر: أكاديمية تربوية متكاملة تقدّم دورات وجلسات ومنتجات تربوية بمعايير عالية.",
                      "With every mother who joined, a larger vision took shape: a complete parenting academy offering high-quality courses, sessions, and digital tools.",
                    ),
                  )}
                </p>
                <p>
                  {t(
                    tx(
                      "اليوم، نفخر بمجتمع يضم أكثر من ألفي أم من حول العالم العربي، ونواصل العمل لخدمة كل أم تبحث عن دعم حقيقي.",
                      "Today we're proud of a community of over two thousand mothers across the Arab world, and we continue working for every mother seeking real support.",
                    ),
                  )}
                </p>
              </div>
              <Link href="/sessions" className="pill-btn pill-btn-primary mt-8">
                {t(tx("احجزي جلستك الأولى", "Book your first session"))}
              </Link>
            </div>
          </div>
        </div>
        <SectionDivider color="var(--cream)" />
      </section>

      {/* Values */}
      <section style={{ background: "var(--cream)" }}>
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-xl mx-auto mb-12 reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("قيمنا", "Our values"))}
            </p>
            <h2 className="text-3xl md:text-5xl mb-3 leading-tight">
              {t(tx("ما الذي يقودنا", "What guides us"))}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {VALUES.map((v, i) => (
              <div
                key={v.title.ar}
                className="glass-card p-7 flex gap-5 reveal"
                data-reveal-delay={i * 90}
                style={{ background: "var(--white)" }}
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
                >
                  <v.Icon size={22} />
                </span>
                <div>
                  <h3 className="text-xl mb-2">{t(v.title)}</h3>
                  <p className="leading-relaxed" style={{ color: "var(--text-body)" }}>
                    {t(v.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

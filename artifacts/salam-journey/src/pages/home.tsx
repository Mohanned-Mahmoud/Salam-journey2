﻿import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ShoppingBag, Star, Sparkles, Users, Award, Globe, Quote } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";
import { apiJson } from "@/lib/api";
import { AiChat } from "@/components/ai-chat";

const SERVICES = [
  {
    icon: BookOpen,
    title: tx("دورات تدريبية", "Courses"),
    desc: tx(
      "محتوى تربوي عميق ومنهجي لتمكين الأم في كل مرحلة من رحلتها.",
      "In-depth, structured content to empower mothers in every stage of motherhood.",
    ),
    href: "/courses",
    cta: tx("استعرضي الدورات", "Browse courses"),
  },
  {
    icon: Calendar,
    title: tx("جلسات خاصة", "Coaching Sessions"),
    desc: tx(
      "جلسات استشارية مع المدرّبة إيمان لمناقشة تحدياتك ووضع خطة عملية.",
      "One-on-one coaching with Coach Iman to work through your challenges with a clear plan.",
    ),
    href: "/sessions",
    cta: tx("احجزي جلستك", "Book a session"),
  },
  {
    icon: ShoppingBag,
    title: tx("منتجات رقمية", "Digital Products"),
    desc: tx(
      "أدلة وملفات قابلة للتحميل تُرافقك في يومك التربوي.",
      "Downloadable guides and printables to support you day to day.",
    ),
    href: "/products",
    cta: tx("اكتشفي المنتجات", "See the shop"),
  },
];

const TRUST = [
  { icon: Users, value: "+700", label: tx("أم انضمّت", "Mothers joined") },
  { icon: Sparkles, value: "2024", label: tx("بدأنا منذ", "Since") },
  { icon: Globe, value: "UK", label: tx("مسجّلة في بريطانيا", "Registered in the UK") },
  { icon: Award, value: "3+", label: tx("دورات متخصصة", "Specialized courses") },
];

const TESTIMONIALS = [
  {
    quote: tx(
      "غيّرت طريقة تعاملي مع طفلي تماماً. المحتوى عملي ومن قلب أم تفهمنا.",
      "It completely changed the way I parent. Practical content from a mother who truly understands us.",
    ),
    name: tx("سارة العتيبي", "Sarah Al-Otaibi"),
    role: tx("أم لطفلين", "Mother of two"),
  },
  {
    quote: tx(
      "الجلسات الفردية كانت نقطة تحوّل. شعرت لأول مرة أن صوتي مسموع.",
      "The one-on-one sessions were a turning point — finally I felt heard.",
    ),
    name: tx("نورة الشهري", "Noura Al-Shahri"),
    role: tx("أم جديدة", "New mother"),
  },
  {
    quote: tx(
      "محتوى راقٍ يجمع بين الجانب التربوي والروحي. أنصح به كل أم.",
      "Beautiful content that blends parenting wisdom with inner work. I recommend it to every mother.",
    ),
    name: tx("مها القحطاني", "Maha Al-Qahtani"),
    role: tx("أم لثلاثة", "Mother of three"),
  },
  {
    quote: tx(
      "أحب أسلوب الكوتش إيمان، حنون ومرشد في نفس الوقت.",
      "Coach Iman is gentle yet guiding — exactly what I needed.",
    ),
    name: tx("ريم الدوسري", "Reem Al-Dossari"),
    role: tx("أم عاملة", "Working mother"),
  },
];

export default function Home() {
  const ref = useReveal<HTMLDivElement>();
  const { t, lang, dir } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const [activeTestimonials, setActiveTestimonials] = useState(TESTIMONIALS);

  // 🌟 خطاف تخزين البيانات المحدث ومزود بخصائص وحدة الوقت ونوع العرض والوصف المترجم الافتراضي
  const [featuredCourse, setFeaturedCourse] = useState({
    titleAr: "وأصبحتُ أُمّاً هادئة",
    titleEn: "Becoming a Calm Mother",
    descAr: "برنامج ٤ أسابيع لتتعلمي كيف تتعاملين مع نوبات الغضب، وتبني علاقة هادئة وآمنة مع أطفالك.",
    descEn: "A 4-week program to learn how to navigate tantrums and build a calm, secure connection with your children.",
    duration: 4,
    durationUnit: "weeks", 
    mode: "most_loved" 
  });

  // 🌟 خطاف تخزين المميزات الأربعة كمصفوفة كائنات تحتوي على (ar و en) لترجمتها فوراً
  const [features, setFeatures] = useState<{ ar: string; en: string }[]>([
    { ar: "١٢ درس فيديو عالي الجودة", en: "12 high-quality video lessons" },
    { ar: "ملفات عمل قابلة للتحميل", en: "Downloadable workbooks" },
    { ar: "جلسات أسئلة وأجوبة شهرية", en: "Monthly Q&A sessions" },
    { ar: "مجتمع خاص للأمهات", en: "A private mothers' community" }
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadTestimonials() {
      try {
        const data = await apiJson<Array<{
          id: string;
          nameAr: string | null;
          nameEn: string | null;
          roleAr: string | null;
          roleEn: string | null;
          quoteAr: string;
          quoteEn: string | null;
          rating: number | null;
          status: string | null;
        }>>("/testimonials");

        if (cancelled) return;

        const next = data
          .filter((ts) => ts.status !== "hidden")
          .map((ts) => ({
            quote: tx(ts.quoteAr, ts.quoteEn ?? ts.quoteAr),
            name: tx(ts.nameAr ?? "", ts.nameEn ?? ts.nameAr ?? ""),
            role: tx(ts.roleAr ?? "", ts.roleEn ?? ts.roleAr ?? ""),
          }));

        setActiveTestimonials(next.length > 0 ? next : TESTIMONIALS);
      } catch {
        if (!cancelled) setActiveTestimonials(TESTIMONIALS);
      }
    }

    // 🌟 جلب وضع العرض والمميزات الثمانية (العربي والإنجليزي) بالتوازي من السيرفر
    async function loadFeaturedCourseData() {
      try {
        const [modeRes, f1Ar, f1En, f2Ar, f2En, f3Ar, f3En, f4Ar, f4En] = await Promise.all([
          apiJson<{ value: string }>("/site-settings/featured_course_mode").catch(() => ({ value: "most_loved" })),
          apiJson<{ value: string }>("/site-settings/featured_feature_1_ar").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_1_en").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_2_ar").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_2_en").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_3_ar").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_3_en").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_4_ar").catch(() => null),
          apiJson<{ value: string }>("/site-settings/featured_feature_4_en").catch(() => null),
        ]);

        const currentMode = modeRes?.value || "most_loved";
        
        if (!cancelled) {
          setFeatures([
            { ar: f1Ar?.value || "١٢ درس فيديو عالي الجودة", en: f1En?.value || "12 high-quality video lessons" },
            { ar: f2Ar?.value || "ملفات عمل قابلة للتحميل", en: f2En?.value || "Downloadable workbooks" },
            { ar: f3Ar?.value || "جلسات أسئلة وأجوبة شهرية", en: f3En?.value || "Monthly Q&A sessions" },
            { ar: f4Ar?.value || "مجتمع خاص للأمهات", en: f4En?.value || "A private mothers' community" }
          ]);
        }

        const keyToFetch = currentMode === "upcoming" ? "upcoming_course_id" : "featured_course_id";
        const res = await apiJson<{ value: string }>(`/site-settings/${keyToFetch}`).catch(() => null);
        
        if (res && res.value) {
          const allCourses = await apiJson<any[]>("/courses");
          const matched = allCourses.find(c => c.id === res.value);
          if (matched && !cancelled) {
            // 🌟 المنطق الذكي لفك الوصف:
            let parsed = { ar: matched.descAr || matched.desc_ar || "", en: matched.descEn || matched.desc_en || "" };
            
            // لو النص بيبدأ بـ { يعني داتا قديمة JSON، فكها
            if (parsed.ar.startsWith('{')) {
              try {
                const jsonParsed = JSON.parse(parsed.ar);
                parsed.ar = jsonParsed.ar || "";
                parsed.en = jsonParsed.en || "";
              } catch (e) {}
            }
            // لو النص جواه فاصل الـ ||| اللي عملناه، فكه
            else if (parsed.ar.includes('|||')) {
              const [ar, en] = parsed.ar.split('|||');
              parsed.ar = ar;
              parsed.en = en || "";
            }

            setFeaturedCourse({
              titleAr: matched.titleAr || matched.title_ar,
              titleEn: matched.titleEn || matched.title_en,
              descAr: parsed.ar,
              descEn: parsed.en,
              duration: matched.duration || 4,
              durationUnit: matched.durationUnit || matched.duration_unit || "weeks",
              mode: currentMode
            });
          }
        }
      } catch (err) {
        console.error("Failed to load featured course settings:", err);
      }
    }

    void loadTestimonials();
    void loadFeaturedCourseData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div ref={ref} key={lang} className="lang-fade">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <SoftBlob
          color="var(--sage-light)"
          className="absolute -top-32 -end-32 w-[520px] h-[520px] opacity-50 animate-drift pointer-events-none"
        />
        <SoftBlob
          color="var(--blush)"
          className="absolute top-40 -start-24 w-[300px] h-[300px] opacity-40 animate-float-slow pointer-events-none"
        />
        <div className="absolute inset-0 leaf-pattern opacity-60 pointer-events-none" aria-hidden />

        <div className="relative container mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-24 md:pb-32 min-h-[88vh] flex items-center">
          <div className="max-w-3xl mx-auto text-center">
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
              {t(tx("+٧٠٠ أم انضمّت إلينا · منذ 2024", "+700 mothers joined · Since 2024"))}
            </span>

            <h1 className="reveal text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-6" data-reveal-delay="80">
              {t(
                tx(
                  "رحلة سلام، معكِ في رحلتك التربوية والوعي بذاتكِ",
                  "Salam Journey — with you through parenthood & self-awareness",
                ),
              )}
            </h1>

            <p
              className="reveal text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
              data-reveal-delay="160"
              style={{ color: "var(--text-body)" }}
            >
              {t(
                tx(
                  "نساعد الأمهات من خلال المحتوى التربوي والدورات والجلسات الخاصة لتصبحي أمّاً متمكنة وقادرة على فهم أطفالك والتواصل الفعال معهم وتحقيق السلام مع ذاتك",
                  "We support mothers through educational content, courses, and private sessions so you can become an empowered mother, able to understand your children, communicate effectively with them, and find peace with yourself.",
                ),
              )}
            </p>

            <div className="reveal flex flex-wrap gap-4 justify-center" data-reveal-delay="240">
              <Link href="/courses" className="pill-btn pill-btn-primary pulse-cta">
                {t(tx("انضمي إلى برامجنا", "Join our programs"))}
                <Arrow size={16} />
              </Link>
              <Link href="/sessions" className="pill-btn pill-btn-outline">
                {t(tx("احجزي جلسة", "Book a session"))}
              </Link>
            </div>

            {/* Floating tag */}
            <div
              className="reveal hidden md:flex absolute top-1/3 end-8 lg:end-20 items-center gap-3 px-5 py-3 rounded-2xl animate-float"
              data-reveal-delay="380"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(127,169,155,0.3)",
                boxShadow: "0 16px 40px rgba(90,138,128,0.18)",
              }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--blush)", color: "var(--text-dark)" }}
              >
                <Star size={18} />
              </span>
              <div className="text-start">
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t(tx("تقييم الأمهات", "Mothers' rating"))}
                </div>
                <div className="font-bold" style={{ color: "var(--text-dark)" }}>
                  4.9 / 5
                </div>
              </div>
            </div>

            <div
              className="reveal hidden md:flex absolute bottom-32 start-8 lg:start-20 items-center gap-3 px-5 py-3 rounded-2xl animate-float-slow"
              data-reveal-delay="460"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(127,169,155,0.3)",
                boxShadow: "0 16px 40px rgba(90,138,128,0.18)",
              }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--sage-light)", color: "var(--text-dark)" }}
              >
                <Users size={18} />
              </span>
              <div className="text-start">
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t(tx("مجتمع الأمهات", "Mothers community"))}
                </div>
                <div className="font-bold" style={{ color: "var(--text-dark)" }}>
                  +700
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionDivider color="var(--sage-dark)" />
      </section>

      {/* ─── Trust bar ─── */}
      <section style={{ background: "var(--sage-dark)", color: "var(--cream)" }}>
        <div className="container mx-auto px-5 md:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUST.map((item) => (
              <div key={item.value} className="flex items-center gap-3 reveal">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <item.icon size={20} />
                </span>
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {item.value}
                  </div>
                  <div className="text-sm opacity-80">{t(item.label)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <SectionDivider color="var(--blush-light)" />
      </section>

      {/* ─── About ─── */}
      <section style={{ background: "var(--blush-light)" }} className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" aria-hidden />
        <div className="relative container mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="reveal">
              <p
                className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
                style={{ color: "var(--sage-dark)" }}
              >
                {t(tx("من نحن", "Our story"))}
              </p>
              <h2 className="text-3xl md:text-5xl mb-6 leading-tight">
                {t(
                  tx(
                    "أكاديمية تربوية بدأت من قلب أم، عام 2016",
                    "A parenting academy born from a mother's heart, since 2016",
                  ),
                )}
              </h2>
              <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--text-body)" }}>
                {t(
                  tx(
                    "بدأت المدربة إيمان رحلتها عام 2016 لمساعدة الأمهات على إيجاد السلام الداخلي مع أنفسهن، وبناء علاقة واعية وممتنة مع أطفالهن.",
                    "Coach Iman began this journey in 2016 to help mothers find peace within themselves and build conscious, grateful relationships with their children.",
                  ),
                )}
              </p>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "var(--text-body)" }}>
                {t(
                  tx(
                    "اليوم، يضم مجتمع رحلة سلام أكثر من ألفي أم من حول العالم العربي، يسرن معاً نحو تربية واعية ومتوازنة.",
                    "Today, the Salam Journey community spans over two thousand mothers from across the Arab world, walking together toward a more grounded, conscious motherhood.",
                  ),
                )}
              </p>
              <Link href="/about" className="pill-btn pill-btn-primary">
                {t(tx("اقرئي قصتنا كاملة", "Read our full story"))}
                <Arrow size={16} />
              </Link>
            </div>

            <div className="relative reveal" data-reveal-delay="120">
              <div
                className="absolute -inset-4 rounded-[3rem] opacity-50 -z-10"
                style={{ background: "var(--sage-light)" }}
              />
              <div
                className="rounded-[2.5rem] p-2"
                style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.3)" }}
              >
                <div
                  className="rounded-[2rem] aspect-[4/5] overflow-hidden flex items-center justify-center relative"
                  style={{
                    background: "linear-gradient(135deg, var(--sage-muted), var(--sage-light))",
                  }}
                >
                  <img
                    src="/images/Coach.jpg"
                    alt="Coach Iman"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-2xl mb-2" style={{ color: "var(--white)" }}>{t(tx("المدربة إيمان", "Coach Iman"))}</h3>
                    <p style={{ color: "rgba(255,255,255,0.85)" }}>
                      {t(tx("مؤسسة رحلة سلام", "Founder of Salam Journey"))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SectionDivider color="var(--cream)" />
      </section>

      {/* ─── Services ─── */}
      <section style={{ background: "var(--cream)" }} className="relative">
        <div className="container mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("ماذا نقدّم", "What we offer"))}
            </p>
            <h2 className="text-3xl md:text-5xl mb-4 leading-tight">
              {t(tx("ثلاث طرق لتبدئي رحلتك", "Three ways to start your journey"))}
            </h2>
            <p className="text-lg" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "اختاري ما يناسبك من برامجنا التربوية المتكاملة.",
                  "Choose what fits you best from our integrated parenting offerings.",
                ),
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {SERVICES.map((s, i) => (
              <Link
                key={s.href}
                href={s.href}
                className="glass-card p-7 reveal block"
                data-reveal-delay={i * 90}
              >
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
                >
                  <s.icon size={26} />
                </span>
                <h3 className="text-2xl mb-3">{t(s.title)}</h3>
                <p className="leading-relaxed mb-6" style={{ color: "var(--text-body)" }}>
                  {t(s.desc)}
                </p>
                <span
                  className="inline-flex items-center gap-2 font-semibold text-sm"
                  style={{ color: "var(--sage-dark)" }}
                >
                  {t(s.cta)} <Arrow size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured course ─── */}
      <section style={{ background: "var(--cream)" }} className="pb-24 md:pb-32">
        <div className="container mx-auto px-5 md:px-8">
          <div
            className="reveal relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden p-7 md:p-16"
            style={{
              background:
                "linear-gradient(135deg, var(--sage-dark) 0%, var(--sage) 60%, var(--sage-light) 100%)",
              color: "var(--white)",
            }}
          >
            <SoftBlob
              color="rgba(255,255,255,0.12)"
              className="absolute -top-20 -end-20 w-[400px] h-[400px] animate-drift pointer-events-none"
            />
            <SoftBlob
              color="rgba(242,196,176,0.25)"
              className="absolute -bottom-16 -start-12 w-[280px] h-[280px] animate-float pointer-events-none"
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{ background: "rgba(255,255,255,0.18)", color: "var(--cream)" }}
                >
                  <Sparkles size={13} />
                  {featuredCourse.mode === "upcoming"
                    ? t(tx("دورة قادمة قريباً", "Upcoming course"))
                    : t(tx("الدورة الأكثر طلباً", "Most loved course"))
                  }
                </span>
                
                {/* اسم الدورة ديناميكي تماماً */}
                <h2 className="text-3xl md:text-5xl leading-tight mb-4" style={{ color: "white" }}>
                  {t(tx(featuredCourse.titleAr, featuredCourse.titleEn))}
                </h2>
                
                {/* 🌟 التعديل المترجم: تبديل وصف الدورة ديناميكياً للغتين بدون تغيير في مظهر السكشن */}
                <p className="text-lg leading-relaxed mb-6 opacity-90 max-w-xl">
                  {t(tx(featuredCourse.descAr, featuredCourse.descEn))}
                </p>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <Link href="/courses" className="pill-btn pill-btn-blush">
                    {t(tx("اشتركي الآن", "Enroll now"))}
                    <Arrow size={16} />
                  </Link>
                  
                  <span className="text-sm opacity-90">
                    {featuredCourse.duration}{" "}
                    {featuredCourse.durationUnit === "minutes"
                      ? t(tx("دقائق · مجتمع خاص", "minutes · Private community"))
                      : t(tx("أسابيع · مجتمع خاص", "weeks · Private community"))
                    }
                  </span>
                </div>
              </div>

              <ul className="space-y-3">
                {features.map((item: any, index) => (
                  <li key={index} className="flex items-start gap-3 text-base">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      <Sparkles size={14} />
                    </span>
                    <span className="opacity-95">{t(tx(item.ar, item.en))}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="relative overflow-hidden" style={{ background: "var(--cream-dark)" }}>
        <div className="container mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="text-center max-w-xl mx-auto mb-12 reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("شهادات", "Testimonials"))}
            </p>
            <h2 className="text-3xl md:text-5xl mb-3 leading-tight">
              {t(tx("ما قالته الأمهات", "What mothers say"))}
            </h2>
            <Quote
              size={48}
              className="mx-auto mt-4 opacity-30"
              style={{ color: "var(--sage)" }}
            />
          </div>

          <div
            className="overflow-hidden reveal"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
            }}
          >
            <div className={dir === 'rtl' ? 'carousel-track-rtl' : 'carousel-track-ltr'}>
              {[...activeTestimonials, ...activeTestimonials].map((tst, i) => (
                <article
                  key={`${tst.name.ar}-${i}`}
                  className="glass-card p-6 md:p-7 w-[280px] sm:w-[320px] md:w-[380px] shrink-0 mx-3 md:mx-4"
                  style={{ background: "var(--white)" }}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={16} fill="var(--blush)" stroke="var(--blush)" />
                    ))}
                  </div>
                  <p className="leading-relaxed mb-5" style={{ color: "var(--text-body)" }}>
                    "{t(tst.quote)}"
                  </p>
                  <div>
                    <div className="font-bold" style={{ color: "var(--text-dark)" }}>
                      {t(tst.name)}
                    </div>
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                      {t(tst.role)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section style={{ background: "var(--cream)" }} className="py-24">
        <div className="container mx-auto px-5 md:px-8">
          <div
            className="reveal relative rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 text-center overflow-hidden"
            style={{ background: "var(--blush-light)" }}
          >
            <SoftBlob
              color="rgba(127,169,155,0.25)"
              className="absolute -top-16 -end-16 w-[300px] h-[300px] animate-float pointer-events-none"
            />
            <h2 className="text-3xl md:text-5xl mb-4 leading-tight relative">
              {t(tx("جاهزة لرحلة جديدة؟", "Ready to begin your journey?"))}
            </h2>
            <p
              className="text-lg max-w-xl mx-auto mb-8 relative"
              style={{ color: "var(--text-body)" }}
            >
              {t(
                tx(
                  "ابدئي اليوم بحجز جلستك الأولى أو الانضمام إلى أحد برامجنا.",
                  "Start today by booking your first session or joining one of our programs.",
                ),
              )}
            </p>
            <div className="flex flex-wrap gap-4 justify-center relative">
              <Link href="/sessions" className="pill-btn pill-btn-primary">
                {t(tx("احجزي جلستك", "Book your session"))}
              </Link>
              <Link href="/courses" className="pill-btn pill-btn-outline">
                {t(tx("استعرضي الدورات", "Explore courses"))}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    <AiChat />
  </>
  );
}
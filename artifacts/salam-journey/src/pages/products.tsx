import { Download, FileText, Sparkles, Heart, Coffee } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type Product = {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  price: Bilingual;
  free: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
};

const PRODUCTS: Product[] = [
  {
    id: "morning-routine",
    title: tx("مفكّرة الروتين الصباحي", "Morning Routine Planner"),
    desc: tx("قابل للطباعة لمساعدتك على بناء صباح هادئ مع طفلك.", "A printable to build a calm morning together with your child."),
    price: tx("٣٩ ريال", "$10"),
    free: false,
    Icon: Sparkles,
    gradient: "linear-gradient(135deg, var(--sage-dark), var(--sage))",
  },
  {
    id: "feelings-cards",
    title: tx("بطاقات المشاعر للأطفال", "Children's Feelings Cards"),
    desc: tx("٣٠ بطاقة ملوّنة لتعليم الطفل التعبير عن مشاعره.", "30 colorful cards to help your child name and express feelings."),
    price: tx("٤٩ ريال", "$13"),
    free: false,
    Icon: Heart,
    gradient: "linear-gradient(135deg, var(--blush), var(--blush-light))",
  },
  {
    id: "calm-guide",
    title: tx("دليل الأم الهادئة", "Calm Mother Guide"),
    desc: tx("دليل PDF مكوّن من ٢٤ صفحة بأدوات عملية يومية.", "A 24-page PDF with practical day-to-day tools."),
    price: tx("٢٩ ريال", "$8"),
    free: false,
    Icon: FileText,
    gradient: "linear-gradient(135deg, var(--sage), var(--sage-light))",
  },
  {
    id: "self-care",
    title: tx("قائمة العناية بالأم", "Mother Self-Care Checklist"),
    desc: tx("قائمة أسبوعية لذكّرك أن تعتني بنفسك أيضاً.", "A weekly checklist to remind you to care for yourself, too."),
    price: tx("مجاناً", "Free"),
    free: true,
    Icon: Coffee,
    gradient: "linear-gradient(135deg, var(--cream-dark), var(--blush-light))",
  },
  {
    id: "kids-worksheet",
    title: tx("ورق عمل للأطفال", "Kids Activity Worksheets"),
    desc: tx("١٠ أوراق عمل ممتعة وتعليمية للأعمار ٤–٩.", "10 fun, educational worksheets for ages 4–9."),
    price: tx("٣٥ ريال", "$9"),
    free: false,
    Icon: FileText,
    gradient: "linear-gradient(135deg, var(--blush-light), var(--sage-muted))",
  },
  {
    id: "affirmations",
    title: tx("بطاقات تأكيدات للأم", "Mother Affirmation Cards"),
    desc: tx("٢١ بطاقة تأكيد إيجابي تبدئين بها يومك.", "21 positive affirmation cards to start your day."),
    price: tx("مجاناً", "Free"),
    free: true,
    Icon: Sparkles,
    gradient: "linear-gradient(135deg, var(--sage-light), var(--sage-muted))",
  },
];

export default function Products() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();

  return (
    <div ref={ref} key={lang} className="lang-fade">
      <section className="relative overflow-hidden" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--blush)"
          className="absolute -top-20 -end-16 w-[360px] h-[360px] opacity-40 animate-float pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-12">
          <div className="text-center max-w-2xl mx-auto reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("منتجات رقمية", "Digital products"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("أدوات تربوية ترافقك يومياً", "Parenting tools for everyday"))}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "مطبوعات وأدلة وملفات قابلة للتحميل صُممت بحب لتدعم رحلتك.",
                  "Printables, guides, and downloadables — designed with love to support your journey.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--blush-light)" />
      </section>

      <section style={{ background: "var(--blush-light)" }} className="relative">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden />
        <div className="relative container mx-auto px-5 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {PRODUCTS.map((p, i) => (
              <article
                key={p.id}
                className="glass-card flex flex-col overflow-hidden reveal"
                data-reveal-delay={i * 80}
                style={{ background: "var(--white)" }}
              >
                <div className="h-40 relative overflow-hidden" style={{ background: p.gradient }}>
                  <SoftBlob
                    color="rgba(255,255,255,0.2)"
                    className="absolute -top-10 -start-10 w-[200px] h-[200px] animate-drift pointer-events-none"
                  />
                  <div className="relative h-full flex items-center justify-center">
                    <span
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.85)", color: "var(--sage-dark)" }}
                    >
                      <p.Icon size={26} />
                    </span>
                  </div>
                  <span
                    className="absolute top-4 end-4 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: p.free ? "var(--sage-dark)" : "var(--white)",
                      color: p.free ? "var(--white)" : "var(--sage-dark)",
                    }}
                  >
                    {p.free ? t(tx("مجاني", "Free")) : t(tx("مدفوع", "Paid"))}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl mb-2">{t(p.title)}</h3>
                  <p
                    className="text-sm leading-relaxed mb-5 flex-1"
                    style={{ color: "var(--text-body)" }}
                  >
                    {t(p.desc)}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-lg" style={{ color: "var(--sage-dark)" }}>
                      {t(p.price)}
                    </span>
                    <button
                      type="button"
                      className="pill-btn pill-btn-primary text-sm py-2 px-5"
                    >
                      {p.free ? t(tx("تحميل", "Download")) : t(tx("شراء", "Buy"))}
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

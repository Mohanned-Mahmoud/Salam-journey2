import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Sparkles, Heart, Coffee } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { apiJson } from "@/lib/api";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type ProductCard = {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  price: Bilingual;
  free: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
};

type ProductType = "pdf" | "printable" | "guide" | "other";

export default function Products() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        const data = await apiJson<Array<{
          id: string;
          titleAr: string;
          titleEn: string;
          descAr: string | null;
          descEn: string | null;
          price: string | number | null;
          isFree: boolean | null;
          type: ProductType;
          status: string | null;
        }>>("/products");

        if (cancelled) return;

        setProducts(
          data
            .filter((product) => product.status !== "hidden")
            .map((product) => ({
              id: product.id,
              title: tx(product.titleAr, product.titleEn),
              desc: tx(product.descAr ?? "", product.descEn ?? product.descAr ?? ""),
              price: tx(formatProductPrice(product.price, product.isFree, "ar"), formatProductPrice(product.price, product.isFree, "en")),
              free: Boolean(product.isFree),
              Icon: getProductIcon(product.type),
              gradient: getProductGradient(product.type),
            })),
        );
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(() => products, [products]);

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
          {loading && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
              {t(tx("جارٍ تحميل المنتجات...", "Loading products..."))}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visibleProducts.map((p, i) => (
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

          {!loading && visibleProducts.length === 0 && (
            <p className="text-center mt-12" style={{ color: "var(--text-muted)" }}>
              {t(tx("لا توجد منتجات حالياً.", "No products available right now."))}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatProductPrice(price: string | number | null, free: boolean | null, lang: "ar" | "en") {
  if (free) return lang === "en" ? "Free" : "مجاناً";
  const value = price ?? 0;
  return lang === "en" ? `${value} SAR` : `${value} ريال`;
}

function getProductGradient(type: ProductType) {
  switch (type) {
    case "printable":
      return "linear-gradient(135deg, var(--sage-dark), var(--sage))";
    case "guide":
      return "linear-gradient(135deg, var(--blush), var(--blush-light))";
    case "other":
      return "linear-gradient(135deg, var(--cream-dark), var(--blush-light))";
    case "pdf":
    default:
      return "linear-gradient(135deg, var(--sage-light), var(--sage-muted))";
  }
}

function getProductIcon(type: ProductType) {
  switch (type) {
    case "guide":
      return Heart;
    case "other":
      return Coffee;
    case "printable":
      return Sparkles;
    case "pdf":
    default:
      return FileText;
  }
}

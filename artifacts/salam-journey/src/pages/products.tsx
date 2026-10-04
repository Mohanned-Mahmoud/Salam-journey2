import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Sparkles, Heart, Coffee, X } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModals } from "@/components/auth/auth-modals";
import { useReveal } from "@/lib/use-reveal";
import { apiJson } from "@/lib/api";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type ProductCard = {
  id: string;
  title: Bilingual;
  desc: Bilingual;
  price: Bilingual;
  rawPrice: number;
  free: boolean;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
};

type ProductType = "pdf" | "printable" | "guide" | "other";

export default function Products() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { openAuthGate } = useAuthModals();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null);
  const [buyConfirmProduct, setBuyConfirmProduct] = useState<ProductCard | null>(null);

  const purchasedProductIds = useMemo(() => {
    return new Set(user?.purchasedProducts?.map(p => p.id) || []);
  }, [user]);

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
              rawPrice: Number(product.price ?? 0),
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

  const handleProductAction = (p: ProductCard) => {
    if (p.free || purchasedProductIds.has(p.id)) {
      // Direct download logic
      // In a real app we'd fetch a presigned URL or something. For now:
      const dl = user?.purchasedProducts?.find(pp => pp.id === p.id)?.downloadUrl;
      window.open(dl || p.id === 'calm-guide' ? '/calm-guide.pdf' : '#', '_blank');
      return;
    }

    if (!user) {
      openAuthGate({
        message: tx("يرجى تسجيل الدخول لمتابعة عملية الشراء.", "Please sign in to continue with the purchase."),
      });
      return;
    }

    setBuyConfirmProduct(p);
  };

  const confirmPurchase = async () => {
    if (!buyConfirmProduct || !user) return;
    const p = buyConfirmProduct;
    
    try {
      setProcessingId(p.id);
      const data = await apiJson<{ url: string }>("/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              name: p.title.en || p.title.ar,
              description: "Digital Product",
              amount: p.rawPrice,
              quantity: 1,
            }
          ],
          metadata: {
            type: "product",
            productId: p.id,
            userId: user.id
          },
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        })
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert(t(tx("حدث خطأ أثناء معالجة الدفع", "Error processing payment")));
    } finally {
      setProcessingId(null);
      setBuyConfirmProduct(null);
    }
  };

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
                <div className="h-40 relative overflow-hidden cursor-pointer" style={{ background: p.gradient }} onClick={() => setSelectedProduct(p)}>
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
                  <h3 className="text-xl mb-2 cursor-pointer hover:underline" onClick={() => setSelectedProduct(p)}>{t(p.title)}</h3>
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
                      onClick={() => handleProductAction(p)}
                      disabled={processingId === p.id}
                      className="pill-btn pill-btn-primary text-sm py-2 px-5"
                    >
                      {processingId === p.id 
                        ? t(tx("جاري التحويل...", "Processing...")) 
                        : (p.free || purchasedProductIds.has(p.id))
                          ? t(tx("فتح / تنزيل", "Open / Download")) 
                          : t(tx("شراء", "Buy"))}
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

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(45,74,69,0.5)" }}>
          <div className="rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col" style={{ background: "var(--white)" }}>
            <div className="h-48 relative shrink-0" style={{ background: selectedProduct.gradient }}>
              <button 
                type="button" 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 end-4 p-2 rounded-full hover:bg-black/10 transition-colors"
                style={{ color: "var(--sage-dark)" }}
              >
                <X size={20} />
              </button>
              <div className="relative h-full flex items-center justify-center">
                <span
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.85)", color: "var(--sage-dark)" }}
                >
                  <selectedProduct.Icon size={32} />
                </span>
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-3">{t(selectedProduct.title)}</h2>
              <p className="text-base leading-relaxed mb-6 flex-1 whitespace-pre-wrap" style={{ color: "var(--text-body)" }}>
                {t(selectedProduct.desc)}
              </p>
              
              <div className="flex items-center justify-between gap-4 pt-4 mt-auto border-t" style={{ borderColor: "var(--cream-dark)" }}>
                <span className="font-bold text-2xl" style={{ color: "var(--sage-dark)" }}>
                  {t(selectedProduct.price)}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    handleProductAction(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="pill-btn pill-btn-primary py-3 px-8 text-base"
                >
                  {(selectedProduct.free || purchasedProductIds.has(selectedProduct.id))
                    ? t(tx("فتح / تنزيل", "Open / Download")) 
                    : t(tx("شراء المنتج", "Buy Product"))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {buyConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(45,74,69,0.5)" }}>
          <div className="rounded-3xl p-6 md:p-8 w-full max-w-sm text-center" style={{ background: "var(--white)" }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}>
              <buyConfirmProduct.Icon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t(tx("تأكيد الشراء", "Confirm Purchase"))}</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-body)" }}>
              {t(tx(`أنت على وشك شراء "${buyConfirmProduct.title.ar}". سيتم تحويلك إلى صفحة الدفع الآمنة.`, `You are about to purchase "${buyConfirmProduct.title.en}". You will be redirected to the secure payment page.`))}
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={confirmPurchase}
                disabled={processingId === buyConfirmProduct.id}
                className="flex-1 pill-btn pill-btn-primary py-2.5"
              >
                {processingId === buyConfirmProduct.id ? t(tx("جاري...", "Loading...")) : t(tx("متابعة للدفع", "Proceed to Pay"))}
              </button>
              <button 
                type="button" 
                onClick={() => setBuyConfirmProduct(null)}
                className="flex-1 pill-btn py-2.5"
                style={{ background: "var(--cream)", color: "var(--text-dark)" }}
              >
                {t(tx("إلغاء", "Cancel"))}
              </button>
            </div>
          </div>
        </div>
      )}
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

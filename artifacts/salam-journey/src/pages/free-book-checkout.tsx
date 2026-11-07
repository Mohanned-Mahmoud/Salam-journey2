import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { apiJson } from "@/lib/api";
import { ProductPreviewModal, type StripeProductData } from "@/components/product-preview-modal";

const PIXEL_ID = "2147923472435483";

function ensureMetaPixel() {
  const scriptId = "meta-pixel-landing";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${PIXEL_ID}');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.id = scriptId + "-ns";
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" />`;
    document.head.appendChild(noscript);
  }
}

interface FreeBookCheckoutRedirectProps {
  slug?: string;
}

export default function FreeBookCheckoutRedirect({ slug }: FreeBookCheckoutRedirectProps) {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<StripeProductData | null>(null);
  const [modalOpen, setModalOpen] = useState(true);

  // Derive slug from prop or url pathname
  const effectiveSlug = (slug || location.split("/").pop() || "").toLowerCase().trim();

  useEffect(() => {
    ensureMetaPixel();
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
      }
    } catch (e) {
      console.warn("Meta Pixel PageView error:", e);
    }

    async function fetchStripeProduct() {
      try {
        setLoading(true);
        setError(null);

        // Retrieve product dynamically directly from Stripe backend endpoint
        const res = await apiJson<{ product: StripeProductData }>(
          `/stripe/products-preview/${encodeURIComponent(effectiveSlug)}`
        );

        if (res && res.product) {
          setProduct(res.product);
          document.title = `${res.product.name} | رحلة سلام`;
        } else {
          setError("المنتج غير موجود");
        }
      } catch (err: any) {
        console.error("Failed to fetch product preview from Stripe:", err);
        setError(err.message || "تعذر جلب بيانات المنتج من Stripe");
      } finally {
        setLoading(false);
      }
    }

    if (effectiveSlug) {
      fetchStripeProduct();
    } else {
      setLoading(false);
      setError("الرابط غير صحيح");
    }
  }, [effectiveSlug]);

  const handleCloseModal = () => {
    setModalOpen(false);
    setLocation("/free-book");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-[var(--border)] text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--sage-light)] text-[var(--sage-dark)] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-dark)] mb-2">
            جاري جلب تفاصيل المنتج من Stripe...
          </h2>
          <p className="text-sm text-[var(--text-body)]">
            يرجى الانتظار لحظات ريثما يتم تجهيز بيانات المنتج والدفع الآمن.
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm text-center border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-3">المنتج غير موجود</h2>
          <p className="text-[var(--text-body)] mb-6 text-sm">
            {error || "الرابط الذي قمت بفتحه غير صحيح أو انتهت صلاحيته."}
          </p>
          <Link
            href="/free-book"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--sage-dark)] text-white font-medium hover:opacity-90 transition-opacity text-sm"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4 select-none" dir="rtl">
      {/* Background card when modal is dismissed */}
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-[var(--border)] text-center">
        <div className="mb-4 flex justify-center">
          <img src="/images/logo.png" alt="Salam Journey" className="h-10 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-dark)] mb-2">{product.name}</h1>
        <p className="text-lg font-bold text-[var(--sage-dark)] mb-6">
          ${product.price.toFixed(2)} {product.currency}
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white font-bold text-sm transition-colors mb-3 shadow-sm"
        >
          عرض تفاصيل المنتج وإتمام الطلب
        </button>
        <Link href="/free-book" className="text-xs text-[var(--text-body)] hover:underline inline-block mt-2">
          العودة للصفحة الرئيسية
        </Link>
      </div>

      {/* Dynamic Stripe Product Preview Modal */}
      <ProductPreviewModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        product={product}
        loading={false}
      />
    </div>
  );
}

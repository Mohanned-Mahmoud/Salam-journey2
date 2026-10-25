import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export interface CheckoutProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  stripeUrl: string;
}

export const PRODUCTS_MAP: Record<string, CheckoutProduct> = {
  // Product 1: بيوت دافئة
  "warm-homes": {
    id: "prod_VV8WXCAq8tgrN7",
    name: "Warm Homes",
    nameAr: "بيوت دافئة",
    price: 200,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFa3cx3WB2KabBo1otgw001",
  },
  "boyoot": {
    id: "prod_VV8WXCAq8tgrN7",
    name: "Warm Homes",
    nameAr: "بيوت دافئة",
    price: 200,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFa3cx3WB2KabBo1otgw001",
  },
  "pay-1": {
    id: "prod_VV8WXCAq8tgrN7",
    name: "Warm Homes",
    nameAr: "بيوت دافئة",
    price: 200,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFa3cx3WB2KabBo1otgw001",
  },
  "product-1": {
    id: "prod_VV8WXCAq8tgrN7",
    name: "Warm Homes",
    nameAr: "بيوت دافئة",
    price: 200,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFa3cx3WB2KabBo1otgw001",
  },
  "prod_vv8wxcaq8tgrn7": {
    id: "prod_VV8WXCAq8tgrN7",
    name: "Warm Homes",
    nameAr: "بيوت دافئة",
    price: 200,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFa3cx3WB2KabBo1otgw001",
  },

  // Product 2: Reading Challenge PDF
  "reading-challenge": {
    id: "prod_V2a6xNRBTbVzJu",
    name: "Reading Challenge PDF",
    nameAr: "تحدي القراءة (PDF)",
    price: 3,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFadRb0Kp2KacFsd7bgw000",
  },
  "challenge": {
    id: "prod_V2a6xNRBTbVzJu",
    name: "Reading Challenge PDF",
    nameAr: "تحدي القراءة (PDF)",
    price: 3,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFadRb0Kp2KacFsd7bgw000",
  },
  "pay-2": {
    id: "prod_V2a6xNRBTbVzJu",
    name: "Reading Challenge PDF",
    nameAr: "تحدي القراءة (PDF)",
    price: 3,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFadRb0Kp2KacFsd7bgw000",
  },
  "product-2": {
    id: "prod_V2a6xNRBTbVzJu",
    name: "Reading Challenge PDF",
    nameAr: "تحدي القراءة (PDF)",
    price: 3,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFadRb0Kp2KacFsd7bgw000",
  },
  "prod_v2a6xnrbbtbvzju": {
    id: "prod_V2a6xNRBTbVzJu",
    name: "Reading Challenge PDF",
    nameAr: "تحدي القراءة (PDF)",
    price: 3,
    currency: "USD",
    stripeUrl: "https://buy.stripe.com/aFadRb0Kp2KacFsd7bgw000",
  },
};

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
  const [location] = useLocation();
  const [redirected, setRedirected] = useState(false);

  // Normalize slug from prop or url pathname
  const effectiveSlug = (slug || location.split("/").pop() || "").toLowerCase().trim();
  const product = PRODUCTS_MAP[effectiveSlug];

  useEffect(() => {
    if (!product) return;

    document.title = `${product.nameAr} | إتمام الطلب الآمن`;

    // 1. Initialize Meta Pixel if not present
    ensureMetaPixel();

    // 2. Track PageView and InitiateCheckout
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        window.fbq("track", "InitiateCheckout", {
          content_name: product.nameAr,
          content_ids: [product.id],
          content_type: "product",
          value: product.price,
          currency: product.currency,
        });
      }
    } catch (e) {
      console.warn("Meta Pixel tracking failed:", e);
    }

    // 3. Smooth transition to Stripe Checkout after brief delay to ensure pixel event is sent
    const timer = setTimeout(() => {
      setRedirected(true);
      window.location.href = product.stripeUrl;
    }, 450);

    return () => clearTimeout(timer);
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center border border-[var(--border)]">
          <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-3">المنتج غير موجود</h2>
          <p className="text-[var(--text-body)] mb-6 text-sm">
            الرابط الذي قمت بفتحه غير صحيح أو انتهت صلاحيته.
          </p>
          <Link
            href="/free-book"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--sage-dark)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4 select-none"
      dir="rtl"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-[var(--border)] text-center relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--sage)]" />

        <div className="mb-6 flex justify-center">
          <img src="/images/logo.png" alt="Salam Journey" className="h-12 w-auto object-contain" />
        </div>

        <div className="w-16 h-16 rounded-full bg-[var(--sage-light)] text-[var(--sage-dark)] flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-[var(--text-dark)] mb-2">
          جاري نقلك إلى الدفع الآمن...
        </h1>

        <p className="text-sm text-[var(--text-body)] mb-6">
          سيتم فتح صفحة الدفع الرسمية والمشفرة عبر Stripe لإتمام طلب:
          <br />
          <span className="font-semibold text-[var(--text-dark)] mt-1 inline-block">
            {product.nameAr} ({product.price} {product.currency})
          </span>
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-[#718079] mb-6 bg-[var(--cream)] py-2.5 px-4 rounded-xl border border-[var(--border)]">
          <ShieldCheck className="w-4 h-4 text-[var(--sage-dark)] flex-shrink-0" />
          <span>معاملة مشفرة وآمنة بنسبة 100% بواسطة Stripe</span>
        </div>

        <a
          href={product.stripeUrl}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[var(--sage-dark)] text-white font-medium hover:bg-[var(--text-dark)] transition-colors shadow-sm text-sm"
        >
          <span>اضغط هنا للمتابعة فوراً</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="mt-4 text-xs text-[#9aa49e]">
          {redirected ? "جاري فتح صفحة الدفع..." : "جاري تجهيز بيانات الطلب والبيكسل..."}
        </div>
      </div>
    </div>
  );
}

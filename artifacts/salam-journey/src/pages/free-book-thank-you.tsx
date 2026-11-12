import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  ShieldCheck,
  Download,
  MessageCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  PackageCheck,
  Receipt,
  Mail,
} from "lucide-react";
import { Confetti } from "@/components/confetti";
import { apiJson } from "@/lib/api";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

const PIXEL_ID = "2147923472435483";

interface StripeLineItem {
  description: string;
  amount: number;
  currency: string;
  quantity: number;
}

interface StripeVerificationData {
  paid: boolean;
  status: string;
  paymentStatus: string;
  sessionId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  items: StripeLineItem[];
  alreadyTracked?: boolean;
}

/**
 * Ensures Meta Pixel base script is injected and initialized before firing events.
 * Resolves once the base code is fully loaded and initialized.
 */
function ensureMetaPixelLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    // Check if fbq is already initialized
    if (window.fbq) {
      resolve();
      return;
    }

    const scriptId = "meta-pixel-landing";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
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

      // Brief buffer to ensure execution of base code
      setTimeout(resolve, 150);
    } else {
      resolve();
    }
  });
}

export default function FreeBookThankYou() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<StripeVerificationData | null>(null);
  const [pixelTracked, setPixelTracked] = useState(false);
  const purchaseAttemptedRef = useRef(false);

  useEffect(() => {
    document.title = "شكراً لك | تم تأكيد طلبك بنجاح";

    // Extract session_id and optional test parameters from URL query string
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = (
      searchParams.get("session_id") ||
      searchParams.get("sessionId") ||
      ""
    ).trim();

    // Guard against multiple executions in React StrictMode
    if (purchaseAttemptedRef.current) return;
    purchaseAttemptedRef.current = true;

    // Direct access without Stripe session (Test/Configuration Mode as requested)
    if (!sessionId) {
      const testAmount = parseFloat(
        searchParams.get("amount") || searchParams.get("value") || "200"
      );
      const testCurrency = (searchParams.get("currency") || "USD").toUpperCase();
      const testProduct = searchParams.get("product") || "بيوت دافئة";

      const previewData: StripeVerificationData = {
        paid: true,
        status: "complete",
        paymentStatus: "paid",
        sessionId: "test_preview_mode",
        amount: testAmount,
        currency: testCurrency,
        customerEmail: "client-test@salamjourney.com",
        customerName: "معاينة واختبار",
        items: [
          {
            description: testProduct,
            amount: testAmount,
            currency: testCurrency,
            quantity: 1,
          },
        ],
      };

      setOrderData(previewData);
      setLoading(false);

      // Ensure Meta Pixel base code is active and fire PageView & Purchase immediately
      ensureMetaPixelLoaded().then(() => {
        try {
          if (typeof window.fbq === "function") {
            window.fbq("track", "PageView");
            window.fbq("track", "Purchase", {
              value: previewData.amount,
              currency: previewData.currency,
              content_name: testProduct,
              content_type: "product",
            });
            setPixelTracked(true);
            console.info(
              `[Meta Pixel Test Mode] Purchase event tracked: value=${previewData.amount} ${previewData.currency}`
            );
          }
        } catch (e) {
          console.warn("Meta Pixel Test Mode error:", e);
        }
      });
      return;
    }

    async function verifyAndTrack() {
      try {
        setLoading(true);
        setError(null);

        // 1. Verify payment status & retrieve authoritative amount directly from Stripe backend
        const data = await apiJson<StripeVerificationData>(
          `/stripe/verify-session/${encodeURIComponent(sessionId)}`
        );

        setOrderData(data);

        // 2. Only fire Meta Pixel Purchase event if Stripe confirms payment is successfully paid
        if (data.paid) {
          // 3. Ensure Meta Pixel base code is loaded before firing
          await ensureMetaPixelLoaded();

          // Fire standard PageView
          try {
            if (typeof window.fbq === "function") {
              window.fbq("track", "PageView");
            }
          } catch (e) {
            console.warn("Meta Pixel PageView failed:", e);
          }

          // 4. Deduplication: Prevent duplicate Purchase events on refresh or revisit
          const deduplicationKey = `sj_pixel_purchase_tracked_${data.sessionId}`;
          const isLocallyTracked = Boolean(localStorage.getItem(deduplicationKey));
          const isServerTracked = Boolean(data.alreadyTracked);

          if (!isLocallyTracked && !isServerTracked) {
            try {
              if (typeof window.fbq === "function") {
                // Dynamically pass the verified actual purchase amount and currency from Stripe
                window.fbq(
                  "track",
                  "Purchase",
                  {
                    value: data.amount,
                    currency: data.currency || "USD",
                    content_name:
                      data.items.map((i) => i.description).join(", ") || "Salam Journey Product",
                    content_type: "product",
                  },
                  { eventID: data.sessionId }
                );

                console.info(
                  `[Meta Pixel] Purchase event tracked successfully: value=${data.amount} ${data.currency}, session=${data.sessionId}`
                );

                // Save deduplication flag to localStorage
                localStorage.setItem(
                  deduplicationKey,
                  JSON.stringify({
                    sessionId: data.sessionId,
                    amount: data.amount,
                    currency: data.currency,
                    trackedAt: new Date().toISOString(),
                  })
                );

                // Notify backend for server-side deduplication
                apiJson(
                  `/stripe/record-pixel-purchase/${encodeURIComponent(data.sessionId)}`,
                  {},
                  { method: "POST" }
                ).catch(() => {});

                setPixelTracked(true);
              }
            } catch (err) {
              console.warn("Meta Pixel Purchase event trigger error:", err);
            }
          } else {
            console.info(
              `[Meta Pixel] Purchase event already tracked for session ${data.sessionId}. Deduplication prevented duplicate firing.`
            );
            setPixelTracked(true);
          }
        }
      } catch (err: any) {
        console.error("Failed to verify checkout session:", err);
        setError(err.message || "حدث خطأ أثناء التحقق من تفاصيل الطلب.");
      } finally {
        setLoading(false);
      }
    }

    verifyAndTrack();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4 select-none"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-[var(--border)] text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--sage-light)] text-[var(--sage-dark)] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-dark)] mb-2">
            جاري تأكيد الدفع عبر Stripe...
          </h2>
          <p className="text-sm text-[var(--text-body)]">
            يرجى الانتظار بضع لحظات ريثما يتم التحقق من المعاملة وتجهيز تفاصيل طلبك.
          </p>
        </div>
      </div>
    );
  }

  // Case 1: Visited without a session_id - Fallback to test & setup mode
  if (!orderData && !error) {
    return null;
  }

  // Case 2: Error verifying session
  if (error || (orderData && !orderData.paid)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-dark)] mb-2">
            لم يتم تأكيد الدفع
          </h2>
          <p className="text-sm text-[var(--text-body)] mb-6 leading-relaxed">
            {error ||
              "يبدو أن جلسة الدفع لم تكتمل أو تم إلغاؤها قبل الدفع. لم يتم خصم أي مبلغ أو لم يتم تسجيل المعاملة بنجاح."}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/free-book"
              className="w-full py-3 px-6 rounded-xl bg-[var(--sage-dark)] text-white font-medium hover:bg-[var(--text-dark)] transition-colors text-sm"
            >
              المحاولة مرة أخرى
            </Link>
            <a
              href="https://wa.me/201015473623"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--border)] text-[var(--text-body)] text-xs hover:bg-[var(--cream)] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>المساعدة عبر واتساب</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Successful payment!
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--cream)] px-4 py-12 relative overflow-hidden"
      dir="rtl"
    >
      <Confetti count={36} />

      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-[var(--border)] overflow-hidden relative z-10">
        {/* Top Accent Gradient */}
        <div className="h-2 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--blush)]" />

        <div className="p-6 md:p-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <img src="/images/logo.png" alt="Salam Journey" className="h-12 w-auto object-contain" />
          </div>

          {/* Success Check Badge */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-dark)] text-center mb-2">
            تم الدفع بنجاح! شكراً لكِ 🤍
          </h1>
          <p className="text-sm text-[var(--text-body)] text-center mb-6">
            تم استلام طلبك وتأكيد المعاملة بأمان عبر Stripe. نتمنى لكِ رحلة ملهمة ومباركة مع أسرتك!
          </p>

          {/* Order Details Card */}
          <div className="bg-[var(--cream)]/60 rounded-2xl p-5 border border-[var(--border)] mb-6 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] text-[var(--text-dark)] font-semibold">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[var(--sage-dark)]" />
                <span>تفاصيل المعاملة:</span>
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-medium">
                مكتملة ومؤكدة
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Product items */}
              {orderData?.items && orderData.items.length > 0 ? (
                orderData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-dark)] font-medium">
                      {item.description} {item.quantity > 1 ? `(×${item.quantity})` : ""}
                    </span>
                    <span className="font-bold text-[var(--text-dark)]">
                      ${item.amount.toFixed(2)} {item.currency}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-dark)]">المنتج</span>
                  <span className="font-bold text-[var(--text-dark)]">
                    ${orderData?.amount.toFixed(2)} {orderData?.currency}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                <span className="font-bold text-[var(--text-dark)]">المبلغ الإجمالي المدفوع:</span>
                <span className="text-base font-extrabold text-[var(--sage-dark)]">
                  ${orderData?.amount.toFixed(2)} {orderData?.currency}
                </span>
              </div>

              {/* Transaction ID */}
              <div className="pt-1 flex justify-between items-center text-[11px] text-[#718079]">
                <span>رقم المعاملة (Stripe):</span>
                <span className="font-mono" title={orderData?.sessionId}>
                  {orderData?.sessionId.slice(0, 18)}...
                </span>
              </div>

              {/* Customer Email */}
              {orderData?.customerEmail && (
                <div className="flex justify-between items-center text-[11px] text-[#718079]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[var(--sage-dark)]" />
                    <span>البريد الإلكتروني:</span>
                  </span>
                  <span className="font-medium text-[var(--text-dark)]">
                    {orderData.customerEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-3">
            <a
              href="/salam-journey-ebook.pdf"
              download
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[var(--sage-dark)] text-white font-medium hover:bg-[var(--text-dark)] transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الكتاب الإلكتروني مباشرة (PDF)</span>
            </a>

            <a
              href="https://wa.me/201015473623"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium hover:bg-emerald-100 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>التواصل معنا عبر واتساب للمتابعة</span>
            </a>

            <Link
              href="/free-book"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--border)] text-[var(--text-body)] text-xs hover:bg-[var(--cream)] transition-colors"
            >
              <span>العودة لصفحة رحلة سلام الرئيسية</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Safe & secure note */}
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[#718079]">
            <ShieldCheck className="w-4 h-4 text-[var(--sage-dark)]" />
            <span>معاملة مدفوعة ومؤكدة عبر Stripe بنظام تشفير كامل</span>
          </div>
        </div>
      </div>
    </div>
  );
}


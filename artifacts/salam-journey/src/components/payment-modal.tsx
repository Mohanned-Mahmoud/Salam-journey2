import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Zap,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Send,
} from "lucide-react";
import { apiJson, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { notify } from "@/lib/notify";

export interface PayableItem {
  id: string;
  type: "product" | "course" | "booking";
  title: string;
  priceUsd: number;
  imageUrl?: string | null;
  description?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayableItem | null;
}

interface InstaPayConfig {
  instapayUsername: string;
  instapayPhone: string;
  instapayLink: string;
  whatsappNumber: string;
  usdToEgpRate: number;
}

export function PaymentModal({ isOpen, onClose, item }: PaymentModalProps) {
  const { user } = useAuth();
  const [method, setMethod] = useState<"card" | "instapay">("instapay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Form for InstaPay order
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [config, setConfig] = useState<InstaPayConfig>({
    instapayUsername: "salamjourney@instapay",
    instapayPhone: "01015473623",
    instapayLink: "https://ipn.eg",
    whatsappNumber: "+201015473623",
    usdToEgpRate: 50.0,
  });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Load config and live exchange rate
  useEffect(() => {
    if (!isOpen) {
      setOrderSuccess(false);
      return;
    }

    let isMounted = true;
    apiJson<InstaPayConfig>("/orders/config")
      .then((data) => {
        if (isMounted && data) {
          setConfig(data);
        }
      })
      .catch((err) => console.error("Failed to load payment config", err));

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const egpAmount = Math.round(item.priceUsd * (config.usdToEgpRate || 50));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    notify.success(`تم نسخ ${fieldName} بنجاح 📋`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Stripe Card Payment
  const handleStripePayment = async () => {
    try {
      setIsProcessing(true);
      const res = await apiJson<{ url: string }>("/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              name: item.title,
              description: item.type === "course" ? "Course Enrollment" : "Digital Product",
              amount: item.priceUsd,
              quantity: 1,
            },
          ],
          metadata: {
            type: item.type,
            ...(item.type === "course" ? { courseId: item.id } : { productId: item.id }),
            userId: user?.id || "guest",
            name: customerName || user?.name || "",
            email: customerEmail || user?.email || "",
          },
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-cancel`,
        }),
      });

      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      console.error(err);
      notify.error(`حدث خطأ أثناء معالجة الدفع: ${err.message || ""}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // InstaPay Manual Transfer
  const handleInstaPaySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalName = (customerName || user?.name || "عميل سلام").trim();
    const finalEmail = (customerEmail || user?.email || "customer@salamjourney.com").trim();

    try {
      setIsProcessing(true);
      const res = await apiJson<{ success: boolean; whatsappUrl: string; order: any }>("/orders/instapay", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id || null,
          customerName: finalName,
          customerEmail: finalEmail,
          customerPhone: customerPhone.trim() || null,
          itemType: item.type,
          itemId: item.id,
          itemTitle: item.title,
          amountUsd: item.priceUsd,
        }),
      });

      if (res && res.success) {
        setOrderSuccess(true);
        notify.success("تم تسجيل طلب الشراء بنجاح! جاري تحويلك للواتساب لإرسال الإشعار...");

        // Open WhatsApp directly after short delay
        setTimeout(() => {
          if (res.whatsappUrl) {
            window.open(res.whatsappUrl, "_blank");
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      notify.error(`حدث خطأ أثناء تسجيل الطلب: ${err.message || ""}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1A2E2A]/65 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] border border-[rgba(127,169,155,0.25)] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--sage)] via-[var(--sage-dark)] to-[var(--blush)] shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--sage-dark)] block">
              إتمام الطلب والدفع
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-dark)] leading-tight">
              {item.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price & Currency Conversion Banner */}
        <div className="bg-[#FAF8F5] p-3.5 px-5 border-b border-[rgba(127,169,155,0.15)] flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-[var(--text-muted)] block font-medium">المبلغ المطلوب</span>
            <div className="flex items-baseline gap-2">
              {method === "card" ? (
                <span className="text-2xl font-black text-[var(--sage-dark)]">
                  ${item.priceUsd.toFixed(2)}
                </span>
              ) : (
                <>
                  <span className="text-2xl font-black text-purple-900">
                    {egpAmount} ج.م
                  </span>
                  <span className="text-xs font-bold text-stone-400">
                    (${item.priceUsd.toFixed(2)})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-left">
            {method === "card" ? (
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 inline-flex items-center gap-1.5 shadow-2xs">
                <span>دفع دولي بالدولار (Stripe)</span>
              </span>
            ) : (
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">سعر الصرف الحي</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>1$ = {config.usdToEgpRate} ج.م (تلقائي)</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!orderSuccess ? (
            <>
              {/* Payment Method Selector Tabs */}
              <div>
                <label className="text-xs font-extrabold text-[var(--text-dark)] block mb-2.5">
                  اختر طريقة الدفع المناسبة:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: InstaPay */}
                  <button
                    type="button"
                    onClick={() => setMethod("instapay")}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${method === "instapay"
                      ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-400/20 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        ⚡
                      </span>
                      {method === "instapay" && (
                        <CheckCircle2 className="w-4 h-4 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[var(--text-dark)]">انستا باي (مصر)</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">تحويل فوري بالجنيه المصري</p>
                    </div>
                  </button>

                  {/* Option 2: Stripe Card */}
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between ${method === "card"
                      ? "border-[var(--sage-dark)] bg-[var(--cream)]/50 ring-2 ring-[var(--sage)]/30 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </span>
                      {method === "card" && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--sage-dark)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[var(--text-dark)]">بطاقة بنكية (Stripe)</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">فيزا / ماستركارد (دولي)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 1: INSTAPAY METHOD DETAILS                            */}
              {/* ══════════════════════════════════════════════════════════ */}
              {method === "instapay" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Clean InstaPay Info Card (Matching Stripe aesthetic) */}
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 text-xs text-stone-700 leading-relaxed space-y-2">
                    <p className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-700 fill-purple-700" />
                      <span>تحويل فوري ومباشر عبر تطبيق InstaPay</span>
                    </p>
                    <p>
                      سيتم تحويلك مباشرة إلى تطبيق InstaPay لإتمام التحويل بالجنيه المصري بمبلغ <b className="text-purple-950 font-black">{egpAmount} ج.م</b>. بعد إتمام التحويل، اضغطي على زر «تم التحويل» لتأكيد وتفعيل طلبك فوراً.
                    </p>
                  </div>

                  {/* Primary CTA: Open InstaPay Directly with EGP price */}
                  <a
                    href={config.instapayLink || "https://ipn.eg"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
                  >
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>الانتقال لتطبيق انستا باي للدفع ({egpAmount} ج.م)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Secondary Confirmation CTA: Send Proof via WhatsApp */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleInstaPaySubmit()}
                    className="w-full py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>جاري تسجيل الطلب...</span>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>تم التحويل — إرسال إثبات الدفع عبر واتساب</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-stone-500">
                    بعد إتمام التحويل في تطبيق انستا باي، اضغطي زر «تم التحويل» لإرسال صورة التحويل عبر الواتساب وتأكيد طلبك فوراً 🌿
                  </p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 2: STRIPE CARD METHOD DETAILS                         */}
              {/* ══════════════════════════════════════════════════════════ */}
              {method === "card" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-stone-700 leading-relaxed space-y-2">
                    <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>دفع آمن ومشفّر 100% عبر Stripe</span>
                    </p>
                    <p>
                      سيتم تحويلك إلى صفحة الدفع الآمنة الخاصة بشركة Stripe لإدخال بيانات بطاقتك الائتمانية أو بطاقة الخصم المباشر (Visa / MasterCard / Apple Pay). يتم تفعيل الطلب فوراً وتلقائياً بعد الدفع مباشرة.
                    </p>
                  </div>

                  {/* Stripe Button: Dollar Price Only! */}
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleStripePayment}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>جاري التوجيه للدفع...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>متابعة الدفع بالبطاقة (${item.priceUsd.toFixed(2)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ══════════════════════════════════════════════════════════════ */
            /* ORDER SUCCESS SCREEN                                           */
            /* ══════════════════════════════════════════════════════════════ */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-[var(--text-dark)] mb-1">
                  تم تسجيل طلبك بنجاح! 🌿
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                  تم حفظ تفاصيل الطلب برقم مرجعي، وجاري فتح محادثة الواتساب لتقديم صورة إشعار التحويل لتأكيد وتفعيل طلبك فوراً من لوحة التحكم.
                </p>
              </div>

              <div className="p-3 bg-[var(--cream)]/60 rounded-2xl border border-[rgba(127,169,155,0.2)] max-w-sm mx-auto text-xs text-stone-700">
                <span className="block font-bold mb-0.5">العنصر المطلوب:</span>
                <span>{item.title} ({egpAmount} ج.م)</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <a
                  href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>فتح الواتساب يدوياً إذا لم يفتح</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

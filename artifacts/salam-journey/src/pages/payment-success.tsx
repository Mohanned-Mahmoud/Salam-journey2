import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { Confetti } from "@/components/confetti";

export default function PaymentSuccess() {
  const { lang, t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Optionally redirect after a few seconds
    const timer = setTimeout(() => {
      navigate("/account");
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div key={lang} className="lang-fade flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
      <Confetti />
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--sage-light)", color: "var(--sage-dark)" }}
      >
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        {t(tx("تم الدفع بنجاح! 🎉", "Payment Successful! 🎉"))}
      </h1>
      <p className="text-lg mb-8 max-w-md" style={{ color: "var(--text-body)" }}>
        {t(tx(
          "شكراً لك. لقد استلمنا طلبك وهو قيد المعالجة الآن. سيتم توجيهك إلى حسابك خلال ثوانٍ.",
          "Thank you. We have received your order and it is now being processed. You will be redirected to your account in a few seconds."
        ))}
      </p>
      <button 
        type="button"
        onClick={() => navigate("/account")}
        className="pill-btn pill-btn-primary"
      >
        {t(tx("الذهاب إلى حسابي", "Go to my account"))}
      </button>
    </div>
  );
}

import { useLocation } from "wouter";
import { XCircle } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";

export default function PaymentCancel() {
  const { lang, t } = useLanguage();
  const [, navigate] = useLocation();

  return (
    <div key={lang} className="lang-fade flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--blush)", color: "#a33636" }}
      >
        <XCircle size={40} />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        {t(tx("تم إلغاء عملية الدفع", "Payment Cancelled"))}
      </h1>
      <p className="text-lg mb-8 max-w-md" style={{ color: "var(--text-body)" }}>
        {t(tx(
          "لم يتم سحب أي مبلغ. يمكنك المحاولة مرة أخرى عندما تكونين مستعدة.",
          "No charges were made. You can try again whenever you are ready."
        ))}
      </p>
      <div className="flex gap-4">
        <button 
          type="button"
          onClick={() => navigate("/")}
          className="pill-btn pill-btn-outline"
        >
          {t(tx("العودة للرئيسية", "Back to home"))}
        </button>
      </div>
    </div>
  );
}

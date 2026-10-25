import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { Confetti } from "@/components/confetti";

export default function PaymentSuccess() {
  const { lang, t } = useLanguage();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Meta Pixel Purchase tracking
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
        fbq('init', '2147923472435483');
      `;
      document.head.appendChild(script);
    }

    try {
      if (typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "PageView");
        (window as any).fbq("track", "Purchase", {
          currency: "USD",
        });
      }
    } catch (e) {
      console.warn("Meta Pixel Purchase tracking failed:", e);
    }

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

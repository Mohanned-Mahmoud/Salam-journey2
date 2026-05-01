import { FaWhatsapp } from "react-icons/fa";
import { useLanguage, tx } from "@/lib/i18n";

export function WhatsAppButton() {
  const { t, lang } = useLanguage();
  const positionClass = lang === "ar" ? "left-6" : "right-6";

  return (
    <a
      href="https://wa.me/"
      target="_blank"
      rel="noreferrer"
      className={`fixed bottom-6 ${positionClass} z-50 group flex items-center gap-3`}
      aria-label="Chat on WhatsApp"
    >
      <span
        className="hidden md:inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
        style={{
          background: "var(--white)",
          color: "var(--text-dark)",
          boxShadow: "0 8px 20px rgba(45,74,69,0.18)",
        }}
      >
        {t(tx("تواصلي معنا", "Chat with us"))}
      </span>
      <span
        className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          background: "#25D366",
          color: "white",
          boxShadow: "0 8px 24px rgba(37, 211, 102, 0.45)",
        }}
      >
        <FaWhatsapp size={28} />
        <span
          className="absolute inset-0 rounded-full border-2 animate-ping"
          style={{ borderColor: "#25D366", opacity: 0.5 }}
        />
      </span>
    </a>
  );
}

import { Link } from "wouter";
import { FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";
import { useLanguage, tx } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      className="mt-auto pt-20 pb-10"
      style={{ background: "var(--text-dark)", color: "var(--cream)" }}
    >
      <div className="container mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <img
                src="/images/logo.png"
                alt="Salam Journey"
                className="h-11 w-auto object-contain"
              />
              <span
                className="font-bold text-2xl"
                style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
              >
                {t(tx("رحلة سلام", "Salam Journey"))}
              </span>
            </Link>
            <p className="max-w-md leading-relaxed opacity-85">
              {t(
                tx(
                  "منصة تربوية للأمهات لإيجاد السلام الداخلي والوعي بالذات، عبر دورات وجلسات ومنتجات هادفة.",
                  "A parenting platform that empowers mothers through courses, coaching, and digital tools to find peace within and with their children.",
                ),
              )}
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { href: "https://wa.me/", Icon: FaWhatsapp, label: "WhatsApp" },
                { href: "#", Icon: FaInstagram, label: "Instagram" },
                { href: "#", Icon: FaYoutube, label: "YouTube" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--cream)",
                  }}
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <h3
              className="text-base mb-5 font-bold"
              style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
            >
              {t(tx("روابط سريعة", "Explore"))}
            </h3>
            <ul className="flex flex-col gap-3 text-[15px]">
              {[
                { href: "/", label: tx("الرئيسية", "Home") },
                { href: "/courses", label: tx("الدورات", "Courses") },
                { href: "/sessions", label: tx("الجلسات", "Sessions") },
                { href: "/products", label: tx("المنتجات", "Products") },
                { href: "/about", label: tx("من نحن", "About") },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3
              className="text-base mb-5 font-bold"
              style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
            >
              {t(tx("تواصل معنا", "Get in touch"))}
            </h3>
            <ul className="flex flex-col gap-3 text-[15px] opacity-85">
              <li>hello@salamjourney.com</li>
              <li>{t(tx("لندن، المملكة المتحدة", "London, United Kingdom"))}</li>
              <li>{t(tx("مسجلة في بريطانيا", "Registered in the UK"))}</li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm opacity-70"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p>
            © {new Date().getFullYear()}{" "}
            {t(
              tx(
                "أكاديمية سلام | جميع الحقوق محفوظة",
                "Salam Academy. All rights reserved.",
              ),
            )}
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:opacity-100">
              {t(tx("الشروط والأحكام", "Terms"))}
            </Link>
            <Link href="#" className="hover:opacity-100">
              {t(tx("سياسة الخصوصية", "Privacy"))}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

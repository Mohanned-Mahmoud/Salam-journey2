import { useEffect, useState } from "react"; // 1. استيراد الخطافات الأساسية
import { Link } from "wouter";
// 2. أضفنا أيقونات الفيسبوك والتيك توك اللي طلبتهم
import { FaWhatsapp, FaInstagram, FaYoutube, FaFacebook, FaTiktok } from "react-icons/fa";
import { useLanguage, tx } from "@/lib/i18n";
import { apiJson } from "@/lib/api"; // 3. استيراد دالة الـ API

export function Footer() {
  const { t } = useLanguage();

  // 4. الـ State اللي هيشيل البيانات الديناميكية الجاية من قاعدة البيانات
  const [brandSettings, setBrandSettings] = useState({
    siteName: "",
    email: "hello@salamjourney.com",
    whatsappUrl: "https://wa.me/",
    instagramUrl: "#",
    youtubeUrl: "#",
    facebookUrl: "",
    tiktokUrl: ""
  });

  // 5. جلب الإعدادات من قاعدة البيانات عند تحميل الـ Footer
  useEffect(() => {
    const keysToFetch = [
      'site_name',
      'contact_email',
      'whatsapp_number',
      'instagram_url',
      'youtube_url',
      'facebook_url',
      'tiktok_url'
    ];

    // جلب كل الإعدادات بالتوازي لسرعة الأداء
    Promise.all(
      keysToFetch.map(key => 
        apiJson<{ key: string; value: string }>(`/site-settings/${key}`)
          .catch(() => ({ key, value: "" })) // fallback في حالة عدم وجود المفتاح بعد
      )
    ).then(([siteName, contactEmail, whatsapp, instagram, youtube, facebook, tiktok]) => {
      // تنظيف رقم الواتساب لضمان عمل الرابط بشكل رسمي وصحيح
      const cleanNumber = whatsapp.value.replace(/\D/g, "");

      setBrandSettings({
        siteName: siteName.value || "",
        email: contactEmail.value || "hello@salamjourney.com",
        whatsappUrl: cleanNumber ? `https://wa.me/${cleanNumber}` : "https://wa.me/",
        instagramUrl: instagram.value || "#",
        youtubeUrl: youtube.value || "#",
        facebookUrl: facebook.value || "",
        tiktokUrl: tiktok.value || ""
      });
    }).catch(err => console.error("Error loading footer settings from DB:", err));
  }, []);

  // 6. بناء مصفوفة أيقونات السوشيال ميديا ديناميكياً بناءً على ما هو مدخل
  const socialMediaLinks = [
    { href: brandSettings.whatsappUrl, Icon: FaWhatsapp, label: "WhatsApp", show: true },
    { href: brandSettings.instagramUrl, Icon: FaInstagram, label: "Instagram", show: true },
    { href: brandSettings.youtubeUrl, Icon: FaYoutube, label: "YouTube", show: true },
    // الفيسبوك والتيك توك هيظهروا فقط لو الأدمن حط الروابط بتاعتهم
    { href: brandSettings.facebookUrl, Icon: FaFacebook, label: "Facebook", show: !!brandSettings.facebookUrl },
    { href: brandSettings.tiktokUrl, Icon: FaTiktok, label: "TikTok", show: !!brandSettings.tiktokUrl },
  ];

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
                {/* إذا كان الاسم موجود في قاعدة البيانات يعرضه، وإلا يرجع للاسم الافتراضي */}
                {brandSettings.siteName ? brandSettings.siteName : t(tx("رحلة سلام", "Salam Journey"))}
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
            
            {/* عرض أزرار السوشيال ميديا المتصلة بقاعدة البيانات */}
            <div className="flex items-center gap-3 mt-6">
              {socialMediaLinks
                .filter(link => link.show)
                .map(({ href, Icon, label }) => (
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
              {/* عرض الإيميل الديناميكي المستدعى من الـ DB */}
              <li>{brandSettings.email}</li>
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

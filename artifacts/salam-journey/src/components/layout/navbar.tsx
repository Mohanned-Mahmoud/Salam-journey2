import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Globe, ChevronDown, User as UserIcon, BookOpen, CalendarDays, LogOut, LayoutDashboard } from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { useAuth, firstNameOf, initialsOf } from "@/hooks/use-auth";
import { useAuthModals } from "@/components/auth/auth-modals";

const NAV_LINKS = [
  { href: "/",     label: tx("الرئيسية", "Home") },
  { href: "/courses",  label: tx("الدورات", "Courses") },
  { href: "/sessions", label: tx("الجلسات", "Sessions") },
  { href: "/products", label: tx("المنتجات", "Products") },
  { href: "/about",    label: tx("من نحن", "About") },
];

function Logo() {
  return (
    <img
      src="/images/logo.png"
      alt="Salam Journey"
      className="h-10 w-auto object-contain"
    />
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--sage), var(--sage-dark))",
        color: "white",
        fontFamily: "var(--font-display)",
        fontSize: size <= 36 ? "0.85rem" : "1.1rem",
        boxShadow: "0 4px 12px rgba(90,138,128,0.25)",
      }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}

export function Navbar() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, t, toggle } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { openLogin, openRegister, openLogout } = useAuthModals();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Close the user dropdown when clicking outside. */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const langLabel = lang === "ar" ? "EN" : "AR";

  // 💡 يمكنك تغيير هذا الإيميل هنا إلى إيميل الكوتش الفعلي لتجربته لوكال
// 🛡️ التشييك بقا ديناميكي بالكامل من الـ role الموحد في قاعدة البيانات
const isAdmin = isAuthenticated && user?.role === "admin";

  const accountItems = [
    { href: "/account?tab=profile",  label: tx("حسابي", "My Account"),    Icon: UserIcon },
    { href: "/account?tab=courses",  label: tx("دوراتي", "My Courses"),    Icon: BookOpen },
    { href: "/account?tab=bookings", label: tx("حجوزاتي", "My Bookings"), Icon: CalendarDays },
    ...(isAdmin ? [{ href: "/admin", label: tx("لوحة التحكم", "Admin"), Icon: LayoutDashboard }] : []),
  ];

  return (
    <>
    <header className="sticky top-0 z-50 w-full glass-navbar">
      <div className="container mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Logo />
          <span
            className="font-bold text-lg sm:text-xl tracking-tight"
            style={{ color: "var(--text-dark)", fontFamily: "var(--font-display)" }}
          >
            {t(tx("رحلة سلام", "Salam Journey"))}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="underline-slide text-[15px] font-medium transition-colors"
                style={{ color: active ? "var(--text-dark)" : "var(--text-body)" }}
                data-active={active}
              >
                {t(link.label)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {/* 🌟 زرار لوحة التحكم للآدمن في الشاشات الكبيرة يظهر فقط عند تحقق الشرط */}
          {isAdmin && (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: "rgba(181, 82, 74, 0.1)", // لون أحمر هادئ متناسق مع زر تسجيل الخروج
                color: "#B5524A",
                border: "1px solid rgba(181, 82, 74, 0.25)"
              }}
            >
              <LayoutDashboard size={15} />
              <span>{t(tx("لوحة التحكم", "Dashboard"))}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: "var(--cream-dark)",
              color: "var(--text-dark)",
              border: "1px solid rgba(127,169,155,0.25)",
            }}
            aria-label="Toggle language"
          >
            <Globe size={15} />
            <span>{langLabel}</span>
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 ps-1 pe-3 py-1 rounded-full transition-colors"
                style={{
                  background: "var(--cream-dark)",
                  border: "1px solid rgba(127,169,155,0.25)",
                  color: "var(--text-dark)",
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={user.name} />
                <span className="text-sm font-semibold max-w-[7rem] truncate">
                  {firstNameOf(user.name)}
                </span>
                <ChevronDown size={14} style={{ transform: menuOpen ? "rotate(180deg)" : "" }} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute end-0 mt-2 w-64 rounded-2xl p-2 animate-dropdown-in"
                  style={{
                    background: "var(--white)",
                    border: "1px solid rgba(127,169,155,0.25)",
                    boxShadow: "0 20px 40px rgba(45,74,69,0.15)",
                  }}
                >
                  <div className="px-3 py-3 flex items-center gap-3 border-b" style={{ borderColor: "var(--cream-dark)" }}>
                    <Avatar name={user.name} size={42} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: "var(--text-dark)" }}>{user.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                    </div>
                  </div>
                  <ul className="py-1">
                    {accountItems.map(({ href, label, Icon }) => (
                      <li key={href}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate(href);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--cream)]"
                          style={{ color: "var(--text-dark)" }}
                        >
                          <Icon size={16} style={{ color: "var(--sage-dark)" }} />
                          {t(label)}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-1" style={{ borderColor: "var(--cream-dark)" }}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        openLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--cream)]"
                      style={{ color: "#B5524A" }}
                    >
                      <LogOut size={16} />
                      {t(tx("تسجيل الخروج", "Sign out"))}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="pill-btn pill-btn-outline"
            >
              {t(tx("تسجيل الدخول", "Sign in"))}
            </button>
          )}
        </div>

        <button
          className="lg:hidden p-2 rounded-full"
          style={{ color: "var(--text-dark)" }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(45,74,69,0.45)" }}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`lg:hidden fixed top-0 z-[70] h-full w-[85%] max-w-sm flex flex-col p-6 transition-transform duration-300 ease-out ${
          lang === "ar" ? "right-0" : "left-0"
        } ${
          open
            ? "translate-x-0"
            : lang === "ar"
              ? "translate-x-full"
              : "-translate-x-full"
        }`}
        style={{
          background: "#FAF5E8",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: "-8px 0 40px rgba(45,74,69,0.18)",
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span
              className="font-bold text-lg"
              style={{ color: "var(--text-dark)", fontFamily: "var(--font-display)" }}
            >
              {t(tx("رحلة سلام", "Salam Journey"))}
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-full"
            style={{ color: "var(--text-dark)" }}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {isAuthenticated && user && (
          <div
            className="flex items-center gap-3 p-3 rounded-2xl mb-5"
            style={{ background: "var(--white)", border: "1px solid rgba(127,169,155,0.2)" }}
          >
            <Avatar name={user.name} size={44} />
            <div className="min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text-dark)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 px-4 rounded-2xl text-base font-medium transition-colors"
                style={{
                  background: active ? "var(--sage-muted)" : "transparent",
                  color: active ? "var(--text-dark)" : "var(--text-body)",
                }}
              >
                {t(link.label)}
              </Link>
            );
          })}

          {isAuthenticated && (
            <>
              <div className="h-px my-2" style={{ background: "var(--cream-dark)" }} />
              {accountItems.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="py-3 px-4 rounded-2xl text-base font-medium flex items-center gap-3"
                  style={{ 
                    color: href === "/admin" ? "#B5524A" : "var(--text-body)",
                    background: href === "/admin" ? "rgba(181, 82, 74, 0.05)" : "transparent",
                    fontWeight: href === "/admin" ? "600" : "500"
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={16} style={{ color: href === "/admin" ? "#B5524A" : "var(--sage-dark)" }} />
                  {t(label)}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-semibold"
            style={{
              background: "var(--cream-dark)",
              color: "var(--text-dark)",
              border: "1px solid rgba(127,169,155,0.25)",
            }}
          >
            <Globe size={16} />
            {lang === "ar" ? "English" : "العربية"}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openLogout();
              }}
              className="pill-btn pill-btn-outline w-full justify-center"
            >
              <LogOut size={16} />
              {t(tx("تسجيل الخروج", "Sign out"))}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openLogin();
                }}
                className="pill-btn pill-btn-outline w-full justify-center"
              >
                {t(tx("تسجيل الدخول", "Sign in"))}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openRegister();
                }}
                className="pill-btn pill-btn-primary w-full justify-center"
              >
                {t(tx("إنشاء حساب", "Sign up"))}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

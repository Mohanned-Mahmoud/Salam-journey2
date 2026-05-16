import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  User as UserIcon,
  BookOpen,
  CalendarDays,
  KeyRound,
  Pencil,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useLanguage, tx } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { useAuth, initialsOf } from "@/hooks/use-auth";
import { useAuthModals } from "@/components/auth/auth-modals";
import { notify } from "@/lib/notify";
import { SoftBlob, SectionDivider } from "@/components/section-divider";

type TabId = "profile" | "courses" | "bookings" | "password";

const TABS: { id: TabId; label: { ar: string; en: string }; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "profile",  label: tx("الملف الشخصي", "Profile"),         Icon: UserIcon },
  { id: "courses",  label: tx("دوراتي", "My Courses"),             Icon: BookOpen },
  { id: "bookings", label: tx("حجوزاتي", "My Bookings"),           Icon: CalendarDays },
  { id: "password", label: tx("تغيير كلمة المرور", "Change Password"), Icon: KeyRound },
];

export default function Account() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();
  const { user, isLoading } = useAuth();
  const { openAuthGate } = useAuthModals();
  const [, navigate] = useLocation();
  const search = useSearch();

  const initialTab: TabId = useMemo(() => {
    const params = new URLSearchParams(search);
    const t = params.get("tab");
    return (TABS.some((x) => x.id === t) ? (t as TabId) : "profile");
  }, [search]);

  const [tab, setTab] = useState<TabId>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  /* If not authenticated once loading completes, gate them and redirect home. */
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      openAuthGate({
        message: tx(
          "يجب تسجيل الدخول للوصول إلى صفحة حسابك.",
          "Please sign in to view your account.",
        ),
        onSuccess: () => navigate("/account"),
      });
      navigate("/");
    }
  }, [isLoading, user, openAuthGate, navigate]);

  if (!user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <p style={{ color: "var(--text-muted)" }}>{t(tx("جاري التحميل...", "Loading..."))}</p>
      </div>
    );
  }

  return (
    <div ref={ref} key={lang} className="lang-fade">
      {/* Header */}
      <section className="relative overflow-hidden" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--blush)"
          className="absolute -top-16 -end-16 w-[360px] h-[360px] opacity-40 animate-float pointer-events-none"
        />
        <SoftBlob
          color="var(--sage-light)"
          className="absolute bottom-0 -start-20 w-[260px] h-[260px] opacity-50 animate-float-slow pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-16 md:pt-20 pb-10">
          <div className="flex items-center gap-5 reveal">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, var(--sage), var(--sage-dark))",
                color: "white",
                fontFamily: "var(--font-display)",
                boxShadow: "0 12px 30px rgba(90,138,128,0.25)",
              }}
              aria-hidden
            >
              {initialsOf(user.name)}
            </div>
            <div className="min-w-0">
              <p className="uppercase tracking-[0.18em] text-xs font-semibold mb-1" style={{ color: "var(--sage-dark)" }}>
                {t(tx("حسابي", "My Account"))}
              </p>
              <h1 className="text-3xl md:text-4xl mb-1 truncate">{user.name}</h1>
              <p className="text-sm truncate" style={{ color: "var(--text-body)" }}>{user.email}</p>
            </div>
          </div>
        </div>
        <SectionDivider color="var(--cream-dark)" />
      </section>

      {/* Body */}
      <section style={{ background: "var(--cream-dark)" }}>
        <div className="container mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <nav
                className="rounded-3xl p-2 sticky top-24"
                style={{
                  background: "var(--white)",
                  border: "1px solid rgba(127,169,155,0.2)",
                  boxShadow: "0 12px 30px rgba(90,138,128,0.08)",
                }}
              >
                {TABS.map(({ id, label, Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTab(id);
                        navigate(`/account?tab=${id}`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
                      style={{
                        background: active ? "var(--sage-dark)" : "transparent",
                        color: active ? "white" : "var(--text-body)",
                      }}
                    >
                      <Icon size={16} />
                      {t(label)}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main */}
            <div className="lg:col-span-8 xl:col-span-9">
              {tab === "profile"  && <ProfileTab />}
              {tab === "courses"  && <CoursesTab />}
              {tab === "bookings" && <BookingsTab />}
              {tab === "password" && <PasswordTab />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Tabs                                                         */
/* ──────────────────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8"
      style={{
        background: "var(--white)",
        border: "1px solid rgba(127,169,155,0.2)",
        boxShadow: "0 12px 30px rgba(90,138,128,0.08)",
      }}
    >
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--cream)",
  border: "1.5px solid var(--sage-muted)",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  color: "var(--text-dark)",
  outline: "none",
};

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });

  useEffect(() => {
    setForm({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  }, [user]);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await updateProfile(form);
    if (!r.ok && r.error === "email_taken") {
      notify.error(t(tx("البريد الإلكتروني مستخدم بالفعل", "Email is already in use")));
      return;
    }
    setEditing(false);
    notify.success(t(tx("تم حفظ التغييرات", "Changes saved")));
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">{t(tx("الملف الشخصي", "Profile"))}</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t(tx("معلوماتك الشخصية لإدارة حسابك", "Your personal info for managing your account"))}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="pill-btn pill-btn-outline text-sm py-2 px-4"
          >
            <Pencil size={14} /> {t(tx("تعديل", "Edit"))}
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Field label={t(tx("الاسم الكامل", "Full Name"))}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!editing}
            style={fieldStyle}
          />
        </Field>
        <Field label={t(tx("البريد الإلكتروني", "Email"))}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!editing}
            style={fieldStyle}
          />
        </Field>
        <Field label={t(tx("رقم الواتساب", "WhatsApp Number"))}>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={!editing}
            style={fieldStyle}
          />
        </Field>

        {editing && (
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm({ name: user.name, email: user.email, phone: user.phone });
              }}
              className="pill-btn pill-btn-outline"
            >
              {t(tx("إلغاء", "Cancel"))}
            </button>
            <button type="submit" className="pill-btn pill-btn-primary">
              {t(tx("حفظ التغييرات", "Save changes"))}
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}

function CoursesTab() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;
  const courses = user.enrolledCourses;

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-2xl mb-1">{t(tx("دوراتي", "My Courses"))}</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t(tx("الدورات التي اشتركتِ فيها", "The courses you've enrolled in"))}
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          Icon={BookOpen}
          title={tx("لم تنضمي لأي دورة بعد", "No courses yet")}
          subtitle={tx(
            "استكشفي دوراتنا التربوية وابدئي رحلتك مع أم متمكّنة.",
            "Browse our parenting programs and start your journey toward becoming an empowered mother.",
          )}
          ctaLabel={tx("تصفّحي الدورات", "Browse courses")}
          ctaHref="/courses"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl p-5 flex flex-col"
              style={{ background: "var(--cream)", border: "1px solid rgba(127,169,155,0.2)" }}
            >
              <div
                className="h-24 rounded-xl mb-4 flex items-center justify-end p-3"
                style={{ background: "linear-gradient(135deg, var(--sage-dark), var(--sage))" }}
              >
                <Sparkles size={20} color="white" />
              </div>
              <h3 className="text-lg mb-1">{c.title}</h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {t(tx("بدأت في", "Started"))} {new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(c.enrolledAt))}
              </p>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>{t(tx("التقدم", "Progress"))}</span>
                  <span className="font-bold">{c.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--white)" }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.max(4, c.progress)}%`,
                      background: "linear-gradient(90deg, var(--sage), var(--sage-dark))",
                    }}
                  />
                </div>
              </div>
              <button type="button" className="pill-btn pill-btn-primary text-sm py-2 mt-auto">
                {t(tx("استمري", "Continue"))} <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}

function BookingsTab() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  if (!user) return null;
  const bookings = [...user.bookings].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-2xl mb-1">{t(tx("حجوزاتي", "My Bookings"))}</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t(tx("جميع الجلسات التي قمتِ بحجزها", "All the sessions you've booked"))}
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          Icon={CalendarDays}
          title={tx("لا توجد حجوزات بعد", "No bookings yet")}
          subtitle={tx(
            "احجزي جلستك الأولى مع المدرّبة إيمان وابدئي رحلتك.",
            "Book your first session with Coach Iman and start your journey.",
          )}
          ctaLabel={tx("احجزي جلسة", "Book a session")}
          ctaHref="/sessions"
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => {
            const dateObj = new Date(`${b.date}T00:00:00`);
            const formatted = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            }).format(dateObj);
            return (
              <li
                key={b.id}
                className="rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
                style={{ background: "var(--cream)", border: "1px solid rgba(127,169,155,0.2)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--sage-dark)", color: "white" }}
                >
                  <Calendar size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-0.5" style={{ color: "var(--text-dark)" }}>{b.sessionType}</h4>
                  <p className="text-sm" style={{ color: "var(--text-body)" }}>{formatted}</p>
                  <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: "var(--text-muted)" }}>
                    <Clock size={12} /> {b.slot}
                    {b.topic && <span className="ms-2">· {b.topic}</span>}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center self-start md:self-auto"
                  style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
                >
                  {t(tx("مؤكد", "Confirmed"))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function PasswordTab() {
  const { changePassword } = useAuth();
  const { t } = useLanguage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next_errors: Record<string, string> = {};
    if (!current) next_errors.current = t(tx("أدخلي كلمة المرور الحالية", "Enter your current password"));
    if (next.length < 8) next_errors.next = t(tx("٨ أحرف على الأقل", "At least 8 characters"));
    if (next !== confirm) next_errors.confirm = t(tx("كلمتا المرور غير متطابقتين", "Passwords do not match"));
    if (Object.keys(next_errors).length) { setErrors(next_errors); return; }

    const r = await changePassword(current, next);
    if (!r.ok) {
      const msg = t(tx("كلمة المرور الحالية غير صحيحة", "Current password is incorrect"));
      setErrors({ current: msg });
      notify.error(msg);
      return;
    }
    setErrors({});
    setCurrent(""); setNext(""); setConfirm("");
    notify.success(t(tx("تم تحديث كلمة المرور", "Password updated")));
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-2xl mb-1">{t(tx("تغيير كلمة المرور", "Change Password"))}</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t(tx("اختاري كلمة مرور قوية لحماية حسابك", "Pick a strong password to protect your account"))}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Field label={t(tx("كلمة المرور الحالية", "Current Password"))} error={errors.current}>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={fieldStyle} />
        </Field>
        <Field label={t(tx("كلمة المرور الجديدة", "New Password"))} error={errors.next}>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} style={fieldStyle} />
        </Field>
        <Field label={t(tx("تأكيد كلمة المرور", "Confirm Password"))} error={errors.confirm}>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={fieldStyle} />
        </Field>
        <button type="submit" className="pill-btn pill-btn-primary mt-2">
          {t(tx("تحديث كلمة المرور", "Update password"))}
        </button>
      </form>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Helpers                                                      */
/* ──────────────────────────────────────────────────────────── */

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
        {label}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-xs font-medium" style={{ color: "#B5524A" }}>
          {error}
        </span>
      )}
    </label>
  );
}

function EmptyState({
  Icon,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  Icon: React.ComponentType<{ size?: number }>;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  ctaLabel: { ar: string; en: string };
  ctaHref: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="text-center py-10">
      <div
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
      >
        <Icon size={26} />
      </div>
      <h3 className="text-xl mb-2">{t(title)}</h3>
      <p className="max-w-sm mx-auto mb-5" style={{ color: "var(--text-body)" }}>
        {t(subtitle)}
      </p>
      <Link href={ctaHref} className="pill-btn pill-btn-primary inline-flex">
        {t(ctaLabel)} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, CalendarDays, Clock, CheckCircle } from "lucide-react";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

/* ──────────────────────────────────────────────────────────── */
/* Types & data                                                 */
/* ──────────────────────────────────────────────────────────── */

type SessionType = {
  id: string;
  kind: "single" | "package";
  title: Bilingual;
  duration: Bilingual;
  description: Bilingual;
};

const SESSION_TYPES: SessionType[] = [
  {
    id: "individual",
    kind: "single",
    title: tx("جلسة استشارية متخصصة", "Specialized Consultation Session"),
    duration: tx("٦٠ دقيقة", "60 minutes"),
    description: tx(
      "جلسة استشارية مخصصة لمناقشة تحدياتك التربوية ووضع خطة عملية.",
      "A specialized consultation session to work through your parenting challenges with a clear plan.",
    ),
  },
  {
    id: "coaching",
    kind: "package",
    title: tx("جلسة كوتشنج", "Coaching Session"),
    duration: tx("٦٠ دقيقة", "60 minutes"),
    description: tx(
      "جلسة كوتشنج مخصصة لمساعدتك على اكتشاف وعيك الذاتي وتحقيق السلام الداخلي.",
      "A coaching session designed to help you discover self-awareness and achieve inner peace.",
    ),
  },
];

const TIME_SLOTS_AR = ["10:00 ص", "12:00 م", "2:00 م", "4:00 م", "6:00 م"];
const TIME_SLOTS_EN = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
/** Canonical slot key used for storage/uniqueness. */
const TIME_SLOT_KEYS = ["10:00", "12:00", "14:00", "16:00", "18:00"];

/* ──────────────────────────────────────────────────────────── */
/* Utilities                                                    */
/* ──────────────────────────────────────────────────────────── */

const STORAGE_KEY = "salam-journey:booked-slots";
const BOOKINGS_RECORDS_KEY = "salam_bookings";

type BookedMap = Record<string, string[]>;

function saveBookingRecord(record: {
  date: string; slot: string; slotLabel: string; sessionType: string;
  bookingKind: "single" | "package"; packageSessionsTotal: number | null; packageSessionsRemaining: number | null;
  topic: string; notes: string; name: string; email: string; whatsapp: string;
}) {
  try {
    const existing = JSON.parse(localStorage.getItem(BOOKINGS_RECORDS_KEY) ?? '[]');
    const next = [...existing, {
      ...record,
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }];
    localStorage.setItem(BOOKINGS_RECORDS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function loadBooked(): BookedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as BookedMap) : {};
  } catch {
    return {};
  }
}

function saveBooked(map: BookedMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function fmtKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function buildSeedBooked(today: Date): BookedMap {
  const seed: BookedMap = {};
  const dayOffsets = [2, 5, 9, 14, 20];
  const slotPicks = [
    ["10:00", "14:00"],
    ["12:00"],
    ["10:00", "12:00", "16:00"],
    ["18:00"],
    ["14:00", "16:00"],
  ];
  dayOffsets.forEach((offset, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    seed[fmtKey(d.getFullYear(), d.getMonth(), d.getDate())] = slotPicks[idx];
  });
  return seed;
}

/* ──────────────────────────────────────────────────────────── */
/* Calendar component                                           */
/* ──────────────────────────────────────────────────────────── */

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_SHORT_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAY_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ConfirmedBookingPayload = {
  date: string;          // YYYY-MM-DD
  slot: string;          // canonical key e.g. "10:00"
  slotLabel: string;     // localized display
  sessionType: Bilingual;
  bookingKind: "single" | "package";
  packageSessionsTotal: number | null;
  topic: string;
  notes?: string;
  name: string;
  email: string;
  whatsapp: string;
};

type Props = {
  /** Called once a booking has been persisted locally. */
  onConfirmed?: (booking: ConfirmedBookingPayload) => boolean | Promise<boolean>;
};

export function BookingCalendar({ onConfirmed }: Props) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedMap, setBookedMap] = useState<BookedMap>({});

  // جلب تكلفة الجلسات ديناميكياً من لوحة تحكم الآدمن
  const sessionPrices = (user as any)?.adminConfig?.prices || {
    single: "50$", 
    fourSessions: "180$", 
    sixSessions: "250$"
  };

  // تهيئة الـ State المحدث للمرحلة الرابعة
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    sessionType: { ar: "جلسة استشارية متخصصة", en: "Specialized Consultation Session" },
    bookingKind: "single" as "single" | "package",
    packageSessionsTotal: 1,
    topic: "",
    notes: "",
  });

  /* Pre-fill form whenever the signed-in user changes. */
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
        whatsapp: prev.whatsapp || user.phone,
      }));
    }
  }, [user]);

  /* Hydrate booked map from localStorage + seed on mount. */
  useEffect(() => {
    const stored = loadBooked();
    const seed = buildSeedBooked(today);
    const merged: BookedMap = { ...seed };
    for (const [k, v] of Object.entries(stored)) {
      const set = new Set([...(merged[k] ?? []), ...v]);
      merged[k] = Array.from(set);
    }
    setBookedMap(merged);
  }, [today]);

  const monthNames = lang === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
  const dayShort   = lang === "ar" ? DAY_SHORT_AR  : DAY_SHORT_EN;
  const slotLabels = lang === "ar" ? TIME_SLOTS_AR : TIME_SLOTS_EN;

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const prevMonth = () => {
    const m = viewMonth - 1;
    if (m < 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth(m);
  };
  const nextMonth = () => {
    const m = viewMonth + 1;
    if (m > 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewYear((y) => y + 1);
  };

  const canGoBack = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  const selectedKey = selectedDate
    ? fmtKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : null;
  const bookedSlotsForSelected = (selectedKey && bookedMap[selectedKey]) || [];

  const handleSelectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (date < today) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;
    const key = fmtKey(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    );
    const slotIdx = TIME_SLOT_KEYS.indexOf(selectedSlot);
    const slotLabel = slotLabels[slotIdx] ?? selectedSlot;
    
    const sessionTypeBilingual = tx(form.sessionType.ar, form.sessionType.en);
    const packageTotal = form.bookingKind === "single" ? null : form.packageSessionsTotal;

    const confirmed = await onConfirmed?.({
      date: key,
      slot: selectedSlot,
      slotLabel,
      sessionType: sessionTypeBilingual,
      bookingKind: form.bookingKind,
      packageSessionsTotal: packageTotal,
      topic: form.topic,
      notes: form.notes,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
    });

    if (confirmed === false) {
      return;
    }

    setBookedMap((prev) => {
      const next = { ...prev, [key]: Array.from(new Set([...(prev[key] ?? []), selectedSlot])) };
      saveBooked(next);
      return next;
    });

    saveBookingRecord({
      date: key,
      slot: selectedSlot,
      slotLabel,
      sessionType: t(sessionTypeBilingual),
      bookingKind: form.bookingKind,
      packageSessionsTotal: packageTotal,
      packageSessionsRemaining: packageTotal,
      topic: form.topic,
      notes: form.notes,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
    });

    /* Reset slot + text inputs after confirmation */
    setSelectedSlot(null);
    setForm((prev) => ({ ...prev, topic: "", notes: "" }));
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      }).format(selectedDate)
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
      {/* Sidebar الإرشادي الجانبي */}
      <aside className="lg:col-span-5 space-y-6 w-full">
        <div>
          <p
            className="uppercase tracking-[0.18em] text-xs font-semibold mb-2"
            style={{ color: "var(--sage-dark)" }}
          >
            {t(tx("خطوات الحجز", "Booking Steps"))}
          </p>
          <h3 className="text-2xl md:text-3xl mb-2 whitespace-normal break-words">
            {t(tx("رحلتك نحو السلام الداخلي", "Your Journey to Inner Peace"))}
          </h3>
          <p className="text-sm whitespace-normal text-pretty" style={{ color: "var(--text-body)" }}>
            {t(
              tx(
                "جدولي جلستك الخاصة الآن باتباع خطوات التقويم التفاعلي البسيطة.",
                "Schedule your private session now by following the simple interactive calendar steps.",
              ),
            )}
          </p>
        </div>

        <div className="space-y-3 w-full">
          {SESSION_TYPES.map((s) => (
            <div
              key={s.id}
              className="w-full p-5 rounded-2xl border bg-white/60 min-w-0 h-auto"
              style={{ borderColor: "rgba(127,169,155,0.25)" }}
            >
              <h4 className="text-base font-bold mb-1 break-words" style={{ color: "var(--text-dark)" }}>
                {t(s.title)}
              </h4>
              <p className="text-xs md:text-sm leading-relaxed text-pretty whitespace-normal" style={{ color: "var(--text-body)" }}>
                {t(s.description)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold" style={{ color: "var(--sage-dark)" }}>
                <Clock size={12} /> {t(s.duration)}
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-5 text-sm leading-relaxed whitespace-normal text-pretty"
          style={{ background: "var(--blush-light)", color: "var(--text-dark)" }}
        >
          <strong className="block mb-1">{t(tx("ملاحظة", "Heads up"))}</strong>
          {t(
            tx(
              "بعد تأكيد الحجز، ستصلك رسالة عبر الواتساب خلال ٢٤ ساعة لتأكيد التفاصيل.",
              "After confirming, you'll receive a WhatsApp message within 24 hours to confirm details.",
            ),
          )}
        </div>
      </aside>

      {/* تقويم الحجز والمرحلة الرابعة */}
      <div className="lg:col-span-7 space-y-6 w-full">
        {/* Step 2: Pick a day */}
        <div
          className="rounded-3xl p-5 md:p-7 w-full"
          style={{
            background: "var(--white)",
            border: "1px solid rgba(127,169,155,0.2)",
            boxShadow: "0 20px 50px rgba(90,138,128,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("الخطوة ١ — اختاري اليوم", "Step 1 — Pick a day"))}
            </p>
            <CalendarDays size={20} style={{ color: "var(--sage-dark)" }} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoBack}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
              aria-label="Previous month"
            >
              {lang === "ar" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <h4 className="text-xl md:text-2xl">
              {monthNames[viewMonth]} {viewYear}
            </h4>
            <button
              type="button"
              onClick={nextMonth}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--cream-dark)", color: "var(--text-dark)" }}
              aria-label="Next month"
            >
              {lang === "ar" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {dayShort.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`b-${idx}`} aria-hidden />;
              const dayDate = new Date(viewYear, viewMonth, day);
              const key = fmtKey(viewYear, viewMonth, day);
              const isPast = dayDate < today;
              const dayBookedSlots = bookedMap[key] ?? [];
              const fullyBooked = dayBookedSlots.length >= TIME_SLOT_KEYS.length;
              const disabled = isPast || fullyBooked;
              const isSelected = selectedDate ? isSameDay(selectedDate, dayDate) : false;
              const isToday = isSameDay(dayDate, today);
              const weekday = dayDate.getDay();
              const isWeekend = weekday === 5 || weekday === 6;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !disabled && handleSelectDay(day)}
                  disabled={disabled}
                  aria-label={key}
                  aria-pressed={isSelected}
                  className="aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all relative"
                  style={{
                    background: isSelected
                      ? "var(--sage-dark)"
                      : isWeekend
                        ? "var(--sage-muted)"
                        : "var(--white)",
                    color: isSelected
                      ? "white"
                      : disabled
                        ? "var(--text-muted)"
                        : "var(--text-dark)",
                    border: isToday && !isSelected
                      ? "2px solid var(--sage)"
                      : "1px solid rgba(127,169,155,0.18)",
                    opacity: disabled ? 0.35 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                    textDecoration: disabled && !isPast ? "line-through" : "none",
                    transform: isSelected ? "scale(1.04)" : undefined,
                    boxShadow: isSelected ? "0 8px 18px rgba(90,138,128,0.35)" : undefined,
                  }}
                >
                  {lang === "ar" ? day.toLocaleString("ar-EG") : day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Pick a time */}
        {selectedDate && (
          <div
            className="rounded-3xl p-5 md:p-7 animate-slide-up w-full"
            style={{
              background: "var(--white)",
              border: "1px solid rgba(127,169,155,0.2)",
              boxShadow: "0 20px 50px rgba(90,138,128,0.08)",
            }}
          >
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-2"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("الخطوة ٢ — اختاري الوقت", "Step 2 — Pick a time"))}
            </p>
            <h4 className="text-lg mb-4" style={{ color: "var(--text-dark)" }}>
              {formattedSelectedDate}
            </h4>
            <div className="flex flex-wrap gap-3">
              {TIME_SLOT_KEYS.map((key, idx) => {
                const isBooked = bookedSlotsForSelected.includes(key);
                const isSelected = selectedSlot === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isBooked && setSelectedSlot(key)}
                    disabled={isBooked}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: isSelected
                        ? "var(--sage-dark)"
                        : isBooked
                          ? "var(--cream-dark)"
                          : "var(--white)",
                      color: isSelected ? "white" : isBooked ? "var(--text-muted)" : "var(--text-dark)",
                      border: `1px solid ${isSelected ? "var(--sage-dark)" : "rgba(127,169,155,0.3)"}`,
                      opacity: isBooked ? 0.5 : 1,
                      cursor: isBooked ? "not-allowed" : "pointer",
                      textDecoration: isBooked ? "line-through" : "none",
                    }}
                  >
                    {slotLabels[idx]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* الخطوة الرابعة المحدثة بالكامل مع أنواع الجلسات، الحزم، وموضوع الجلسة المفتوح */}
        {selectedDate && selectedSlot && (
          <form
            onSubmit={handleConfirm}
            className="rounded-3xl p-5 md:p-7 animate-slide-up w-full space-y-6"
            style={{
              background: "var(--cream)",
              border: "1px solid rgba(127,169,155,0.25)",
              boxShadow: "0 20px 50px rgba(90,138,128,0.08)",
            }}
          >
            <div>
              <p
                className="uppercase tracking-[0.18em] text-xs font-semibold mb-1"
                style={{ color: "var(--sage-dark)" }}
              >
                {t(tx("الخطوة ٣ — تفاصيل حجزك", "Step 3 — Your Booking Details"))}
              </p>
              <h4 className="text-xl mb-1 font-bold" style={{ color: "var(--text-dark)" }}>
                {t(tx("أكملي بيانات الجلسة", "Complete your booking"))}
              </h4>
            </div>

            {/* أولاً: نوع الجلسة المحدث */}
            <div className="space-y-2 w-full">
              <label className="block text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                {t(tx("نوع الجلسة", "Session Type"))}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  { ar: "جلسة استشارية متخصصة", en: "Specialized Consultation Session" },
                  { ar: "جلسة كوتشنج", en: "Coaching Session" }
                ].map((type) => {
                  const isSelected = form.sessionType.ar === type.ar;
                  return (
                    <button
                      key={type.ar}
                      type="button"
                      onClick={() => setForm({ ...form, sessionType: type })}
                      className={`p-4 rounded-xl border text-start transition-all flex justify-between items-center min-w-0 h-auto ${
                        isSelected ? "bg-white border-2 shadow-sm" : "bg-white/50 hover:bg-white/80 border-gray-200"
                      }`}
                      style={{ borderColor: isSelected ? "var(--sage-dark)" : undefined }}
                    >
                      <span className="text-sm font-medium whitespace-normal text-pretty break-words min-w-0 flex-1" style={{ color: "var(--text-dark)" }}>
                        {t(tx(type.ar, type.en))}
                      </span>
                      {isSelected && <CheckCircle size={18} className="shrink-0 ms-2" style={{ color: "var(--sage-dark)" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ثانياً: الحزم والأسعار الديناميكية من حساب الآدمن */}
            <div className="space-y-2 w-full">
              <label className="block text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                {t(tx("الحزم المتاحة والأسعار", "Available Packages & Pricing"))}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {[
                  { id: "single", total: 1, titleAr: "جلسة فردية", titleEn: "Single Session", price: sessionPrices.single },
                  { id: "four", total: 4, titleAr: "4 جلسات", titleEn: "4 Sessions", price: sessionPrices.fourSessions },
                  { id: "six", total: 6, titleAr: "6 جلسات", titleEn: "6 Sessions", price: sessionPrices.sixSessions },
                ].map((pkg) => {
                  const isSelected = form.bookingKind === (pkg.id === "single" ? "single" : "package") && form.packageSessionsTotal === pkg.total;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        bookingKind: pkg.id === "single" ? "single" : "package",
                        packageSessionsTotal: pkg.total
                      })}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col justify-between items-center min-w-0 h-auto ${
                        isSelected ? "bg-white border-2 shadow-sm" : "bg-white/50 hover:bg-white/80 border-gray-200"
                      }`}
                      style={{ borderColor: isSelected ? "var(--sage-dark)" : undefined }}
                    >
                      <span className="font-bold text-sm whitespace-normal text-pretty break-words" style={{ color: "var(--text-dark)" }}>
                        {t(tx(pkg.titleAr, pkg.titleEn))}
                      </span>
                      <span className="text-base font-extrabold mt-1" style={{ color: "var(--sage-dark)" }}>
                        {pkg.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* البيانات الشخصية للمستخدم */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
              <Field label={t(tx("الاسم الكامل", "Full Name"))}>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full whitespace-normal"
                  style={inputStyle}
                  placeholder={t(tx("اكتبي اسمك", "Your full name"))}
                />
              </Field>
              <Field label={t(tx("البريد الإلكتروني", "Email"))}>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full whitespace-normal"
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label={t(tx("رقم الواتساب", "WhatsApp Number"))}>
                  <input
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full whitespace-normal"
                    style={inputStyle}
                    placeholder="+966 ..."
                  />
                </Field>
              </div>
            </div>

            {/* ثالثاً: حقل موضوع الجلسة المفتوح المحدث بدلاً من المنسدل */}
            <div className="space-y-1.5 w-full">
              <label className="block text-sm font-semibold" style={{ color: "var(--text-dark)" }}>
                {t(tx("موضوع الجلسة (اكتبي نبذه بسيطة عما تردين الحديث عنه)", "Session Topic (Write a brief note about what you would like to discuss)"))}
              </label>
              <textarea
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                rows={3}
                className="w-full text-sm whitespace-normal text-pretty break-words"
                style={inputStyle}
                placeholder={t(tx("اكتبي المحاور أو النقاط التي تودين مشاركتها هنا...", "Write down the main points you'd like to share here..."))}
              />
            </div>

            {/* الملاحظات الإضافية الاختيارية */}
            <Field label={t(tx("ملاحظات إضافية (اختياري)", "Additional Notes (optional)"))}>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full text-sm whitespace-normal text-pretty break-words"
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder={t(tx("شاركينا أي تفاصيل تساعد المدربة", "Share any details that may help your coach"))}
              />
            </Field>

            <button type="submit" className="pill-btn pill-btn-primary mt-4 w-full md:w-auto font-bold text-base shadow-sm">
              {t(tx("تأكيد الحجز", "Confirm Booking"))}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="block mb-1.5 text-sm font-semibold whitespace-normal text-pretty"
        style={{ color: "var(--text-dark)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid rgba(127,169,155,0.3)",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  color: "var(--text-dark)",
  outline: "none",
};
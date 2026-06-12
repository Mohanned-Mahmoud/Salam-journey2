import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, CalendarDays, Clock } from "lucide-react";
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
  price: Bilingual;
  description: Bilingual;
  packageSessionsTotal?: number;
};

const SESSION_TYPES: SessionType[] = [
  {
    id: "individual",
    kind: "single",
    title: tx("جلسة فردية", "Individual Session"),
    duration: tx("٦٠ دقيقة", "60 minutes"),
    price: tx("٤٥٠ ريال", "$120"),
    description: tx(
      "جلسة استشارية مخصصة لمناقشة تحدياتك التربوية ووضع خطة عملية.",
      "A one-on-one coaching session to work through your parenting challenges with a clear plan.",
    ),
  },
  {
    id: "package",
    kind: "package",
    title: tx("حزمة ٣ جلسات", "3-Session Package"),
    duration: tx("٣ × ٦٠ دقيقة", "3 × 60 minutes"),
    price: tx("١٢٠٠ ريال", "$320"),
    description: tx(
      "ثلاث جلسات متابعة على مدار شهر، لتحقيق تحوّل حقيقي في علاقتك مع طفلك.",
      "Three sessions across a month for a real transformation in your bond with your child.",
    ),
    packageSessionsTotal: 3,
  },
];

const TIME_SLOTS_AR = ["10:00 ص", "12:00 م", "2:00 م", "4:00 م", "6:00 م"];
const TIME_SLOTS_EN = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];
/** Canonical slot key used for storage/uniqueness. */
const TIME_SLOT_KEYS = ["10:00", "12:00", "14:00", "16:00", "18:00"];

const TOPICS = [
  tx("تحدّيات في التربية", "Parenting challenges"),
  tx("التعامل مع نوبات الغضب", "Handling tantrums"),
  tx("بناء الثقة بالنفس عند الأطفال", "Building child confidence"),
  tx("توازن الأم العاملة", "Working mother balance"),
  tx("السلام الداخلي للأم", "Inner peace for mothers"),
];

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

  const [sessionTypeId, setSessionTypeId] = useState(SESSION_TYPES[0].id);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedMap, setBookedMap] = useState<BookedMap>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    topic: TOPICS[0].ar,
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
    else setViewMonth(m);
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
    const sessionType = SESSION_TYPES.find((s) => s.id === sessionTypeId)!.title;
    const sessionTypeConfig = SESSION_TYPES.find((s) => s.id === sessionTypeId)!;

    const confirmed = await onConfirmed?.({
      date: key,
      slot: selectedSlot,
      slotLabel,
      sessionType,
      bookingKind: sessionTypeConfig.kind,
      packageSessionsTotal: sessionTypeConfig.packageSessionsTotal ?? null,
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
      sessionType: t(sessionType),
      bookingKind: sessionTypeConfig.kind,
      packageSessionsTotal: sessionTypeConfig.packageSessionsTotal ?? null,
      packageSessionsRemaining: sessionTypeConfig.packageSessionsTotal ?? null,
      topic: form.topic,
      notes: form.notes,
      name: form.name,
      email: form.email,
      whatsapp: form.whatsapp,
    });

    /* Reset slot + notes after confirmation; keep contact info for the next booking. */
    setSelectedSlot(null);
    setForm((prev) => ({ ...prev, notes: "" }));
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Session info panel */}
      <aside className="lg:col-span-5 space-y-6">
        <div>
          <p
            className="uppercase tracking-[0.18em] text-xs font-semibold mb-2"
            style={{ color: "var(--sage-dark)" }}
          >
            {t(tx("الخطوة ١", "Step 1"))}
          </p>
          <h3 className="text-2xl md:text-3xl mb-2">
            {t(tx("اختاري نوع الجلسة", "Choose your session"))}
          </h3>
          <p className="text-sm" style={{ color: "var(--text-body)" }}>
            {t(
              tx(
                "نقدّم خيارين مرنين يناسبان احتياجك وجدولك.",
                "Two flexible formats that fit your needs and schedule.",
              ),
            )}
          </p>
        </div>

        <div className="space-y-3">
          {SESSION_TYPES.map((s) => {
            const active = s.id === sessionTypeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSessionTypeId(s.id)}
                className="w-full text-start p-5 rounded-2xl transition-all relative"
                style={{
                  background: active ? "var(--white)" : "rgba(255,255,255,0.6)",
                  border: `2px solid ${active ? "var(--sage-dark)" : "rgba(127,169,155,0.25)"}`,
                  boxShadow: active ? "0 12px 30px rgba(90,138,128,0.15)" : "none",
                }}
                aria-pressed={active}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg" style={{ color: "var(--text-dark)" }}>
                        {t(s.title)}
                      </h4>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
                      {t(s.description)}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: "var(--sage-dark)" }}>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {t(s.duration)}</span>
                      <span className="font-semibold">{t(s.price)}</span>
                    </div>
                  </div>
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: active ? "var(--sage-dark)" : "var(--sage-muted)",
                      color: active ? "white" : "var(--sage-dark)",
                    }}
                    aria-hidden
                  >
                    {active ? <Check size={16} /> : <span className="block w-2 h-2 rounded-full bg-white/60" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-2xl p-5 text-sm leading-relaxed"
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

      {/* Calendar + slots + form */}
      <div className="lg:col-span-7 space-y-6">
        {/* Calendar card */}
        <div
          className="rounded-3xl p-5 md:p-7"
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
              {t(tx("الخطوة ٢ — اختاري اليوم", "Step 2 — Pick a day"))}
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
                  onMouseEnter={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.background = "var(--sage-light)";
                      e.currentTarget.style.color = "var(--text-dark)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.background = isWeekend ? "var(--sage-muted)" : "var(--white)";
                      e.currentTarget.style.color = "var(--text-dark)";
                    }
                  }}
                >
                  {lang === "ar" ? day.toLocaleString("ar-EG") : day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "var(--sage-dark)" }} />
              {t(tx("اليوم المختار", "Selected"))}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "var(--sage-muted)" }} />
              {t(tx("عطلة نهاية الأسبوع", "Weekend"))}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "var(--white)", border: "1px solid var(--sage)" }} />
              {t(tx("متاح", "Available"))}
            </span>
            <span className="flex items-center gap-2 opacity-50">
              <span className="w-3 h-3 rounded line-through" style={{ background: "var(--cream-dark)" }} />
              {t(tx("غير متاح", "Unavailable"))}
            </span>
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div
            className="rounded-3xl p-5 md:p-7 animate-slide-up"
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
              {t(tx("الخطوة ٣ — اختاري الوقت", "Step 3 — Pick a time"))}
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
                    aria-pressed={isSelected}
                  >
                    {slotLabels[idx]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Booking form */}
        {selectedDate && selectedSlot && (
          <form
            onSubmit={handleConfirm}
            className="rounded-3xl p-5 md:p-7 animate-slide-up"
            style={{
              background: "var(--cream)",
              border: "1px solid rgba(127,169,155,0.25)",
              boxShadow: "0 20px 50px rgba(90,138,128,0.08)",
            }}
          >
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-2"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("الخطوة ٤ — بياناتك", "Step 4 — Your details"))}
            </p>
            <h4 className="text-xl mb-1" style={{ color: "var(--text-dark)" }}>
              {t(tx("أكملي بيانات الحجز", "Complete your booking"))}
            </h4>
            {user && (
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                {t(tx("تمت تعبئة بياناتك تلقائياً — يمكنكِ تعديلها.", "We've prefilled your details — feel free to edit."))}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <Field label={t(tx("الاسم الكامل", "Full Name"))}>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full"
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
                  className="w-full"
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label={t(tx("رقم الواتساب", "WhatsApp Number"))}>
                <input
                  type="tel"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full"
                  style={inputStyle}
                  placeholder="+966 ..."
                />
              </Field>
              <Field label={t(tx("موضوع الجلسة", "Session Topic"))}>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full"
                  style={inputStyle}
                >
                  {TOPICS.map((topic) => (
                    <option key={topic.ar} value={topic.ar}>
                      {t(topic)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label={t(tx("ملاحظات إضافية (اختياري)", "Additional Notes (optional)"))}>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full"
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder={t(tx("شاركينا أي تفاصيل تساعد المدربة", "Share any details that may help your coach"))}
                  />
                </Field>
              </div>
            </div>

            <button type="submit" className="pill-btn pill-btn-primary mt-6 w-full md:w-auto">
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
        className="block mb-1.5 text-sm font-semibold"
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

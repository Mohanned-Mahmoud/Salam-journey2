import { useState } from "react";
import { useLanguage, tx } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { BookingCalendar, type ConfirmedBookingPayload } from "@/components/booking-calendar";
import { BookingConfirmModal, type BookingDetails } from "@/components/booking-confirm-modal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";
import { Heart, ShieldCheck, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { notify } from "@/lib/notify";

const FEATURES = [
  {
    icon: Heart,
    title: tx("بيئة آمنة وحاضنة", "Safe & nurturing space"),
    desc: tx("ساحة خاصة بكِ بلا أحكام، مع كوتش تفهم رحلتك.", "A private, judgment-free space with a coach who understands."),
  },
  {
    icon: ShieldCheck,
    title: tx("سرية تامّة", "Full confidentiality"),
    desc: tx("ما يُقال في الجلسة يبقى بينكِ وبين كوتشك.", "What's shared in your session stays between you and your coach."),
  },
  {
    icon: MessageCircle,
    title: tx("متابعة بعد الجلسة", "Post-session follow-up"),
    desc: tx("ملاحظات وخطوات عملية يصلكِ ملخصها بعد كل جلسة.", "You'll receive notes and actionable steps after every session."),
  },
];

export default function Sessions() {
  const ref = useReveal<HTMLDivElement>();
  const { lang, t } = useLanguage();
  const { addBooking } = useAuth();

  const [confirmedBooking, setConfirmedBooking] = useState<BookingDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirmed = async (payload: ConfirmedBookingPayload) => {
    /* Persist into the user's profile when signed in. */
    const result = await addBooking({
      date: payload.date,
      slot: payload.slot,
      sessionType: payload.sessionType.ar,
      topic: payload.topic,
      notes: payload.notes,
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
    });

    if (!result.ok) {
      notify.error(t(tx("تعذر حفظ الحجز، حاولّي مرة أخرى", "Could not save the booking, please try again")));
      return false;
    }

    setConfirmedBooking({
      date: payload.date,
      slot: payload.slot,
      slotLabel: payload.slotLabel,
      sessionType: payload.sessionType,
    });
    setModalOpen(true);
    notify.success(t(tx("تم الحجز بنجاح ✓", "Booking confirmed ✓")));
    return true;
  };

  return (
    <div ref={ref} key={lang} className="lang-fade">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--blush)"
          className="absolute -top-20 -end-20 w-[420px] h-[420px] opacity-40 animate-float pointer-events-none"
        />
        <SoftBlob
          color="var(--sage-light)"
          className="absolute bottom-0 -start-24 w-[320px] h-[320px] opacity-50 animate-float-slow pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-16 md:pb-20">
          <div className="text-center max-w-2xl mx-auto reveal">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("الجلسات الخاصة", "Private sessions"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("احجزي جلستك مع المدرّبة إيمان", "Book a session with Coach Iman"))}
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "اختاري نوع الجلسة المناسب لكِ، ثم اختاري اليوم والوقت من التقويم التفاعلي.",
                  "Choose the session that fits you, then pick a day and time from the interactive calendar.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--sage-muted)" />
      </section>

      {/* Booking */}
      <section style={{ background: "var(--sage-muted)" }}>
        <div className="container mx-auto px-5 md:px-8 py-16 md:py-24 reveal">
          <BookingCalendar onConfirmed={handleConfirmed} />
        </div>
        <SectionDivider color="var(--cream)" />
      </section>

      {/* Why book */}
      <section style={{ background: "var(--cream)" }}>
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-xl mx-auto mb-12 reveal">
            <h2 className="text-3xl md:text-4xl mb-3 leading-tight">
              {t(tx("لماذا تحجز معنا الأمهات؟", "Why mothers book with us"))}
            </h2>
            <p style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "ثلاث ركائز نلتزم بها مع كل أم تشاركنا رحلتها.",
                  "Three commitments we hold for every mother who joins us.",
                ),
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title.ar} className="glass-card p-7 reveal" data-reveal-delay={i * 90}>
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--blush-light)", color: "var(--text-dark)" }}
                >
                  <f.icon size={22} />
                </span>
                <h3 className="text-xl mb-2">{t(f.title)}</h3>
                <p className="leading-relaxed" style={{ color: "var(--text-body)" }}>
                  {t(f.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BookingConfirmModal
        booking={confirmedBooking}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

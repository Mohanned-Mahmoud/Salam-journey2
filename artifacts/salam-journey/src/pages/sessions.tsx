import { useState } from "react";
import { useLanguage, tx } from "@/lib/i18n";
import { useReveal } from "@/lib/use-reveal";
import { BookingCalendar, type ConfirmedBookingPayload } from "@/components/booking-calendar";
import { BookingConfirmModal, type BookingDetails } from "@/components/booking-confirm-modal";
import { SoftBlob, SectionDivider } from "@/components/section-divider";
// 🌟 استيراد الأيقونات الجديدة المتوافقة مع الركائز الأربعة
import { Heart, ShieldCheck, ClipboardCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { notify } from "@/lib/notify";

// 🚀 مصفوفة الركائز الأربعة المحدثة بالكامل مع الترجمة الموازية
const FEATURES = [
  {
    icon: GraduationCap,
    title: tx("إرشاد خبير", "Expert Guidance"),
    desc: tx(
      "إرشاد مخصص من إيمان ناصر، خريجة علوم الحاسب ومدربة تربوية معتمدة وكوتش للوالدين ومختصة بالعلاج المعرفي السلوكي (CBT)، ذات خبرة واسعة في مساعدة الأسر على التعامل مع التحديات وتحقيق التناغم بين أفرادها.",
      "Tailored guidance from Eman Nasser, a Computer Science graduate, certified educational trainer, parent coach, and CBT specialist, with extensive experience helping families navigate challenges and achieve harmony."
    ),
  },
  {
    icon: Heart,
    title: tx("دعم مخصص", "Tailored Support"),
    desc: tx(
      "كل عائلة تختلف عن غيرها؛ لذلك صُممت الجلسات الفردية خصيصاً لكِ لتتوافق مع أهدافكِ، أفراد أسرتكِ، ولتلبية احتياجاتكِ.",
      "Every family is unique; therefore, individual sessions are specifically designed for you to align with your goals, family members, and meet your specific needs."
    ),
  },
  {
    icon: ClipboardCheck,
    title: tx("متابعة بعد الجلسة", "Post-Session Follow-up"),
    desc: tx(
      "تزويد بالأدوات المساعدة، التمارين التطبيقية، وأوراق العمل المخصصة لضمان استمرار الأثر والمستندة إلى حالتكِ.",
      "Providing supportive tools, practical exercises, and tailored worksheets to ensure lasting impact based on your situation."
    ),
  },
  {
    icon: ShieldCheck,
    title: tx("بيئة آمنة وحاضنة", "Safe & Nurturing Environment"),
    desc: tx(
      "مساحة خاصة بكِ بلا أحكام وبسرية تامة، ننير لكِ من خلالها الطريق للازدهار في حياتكِ ومع أبنائكِ.",
      "A private space free of judgment and in absolute confidentiality, illuminating your path to thrive in your life and with your children."
    ),
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
      bookingKind: payload.bookingKind,
      packageSessionsTotal: payload.packageSessionsTotal,
      packageSessionsRemaining: payload.packageSessionsTotal,
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
      bookingKind: payload.bookingKind,
      packageSessionsTotal: payload.packageSessionsTotal,
    });
    setModalOpen(true);
    notify.success(t(tx("تم الحجز بنجاح ✓", "Booking confirmed ✓")));
    return true;
  };

  return (
    <div ref={ref} key={lang} className="lang-fade w-full overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden w-full" style={{ background: "var(--cream)" }}>
        <SoftBlob
          color="var(--blush)"
          className="absolute -top-20 -end-20 w-[420px] h-[420px] opacity-40 animate-float pointer-events-none"
        />
        <SoftBlob
          color="var(--sage-light)"
          className="absolute bottom-0 -start-24 w-[320px] h-[320px] opacity-50 animate-float-slow pointer-events-none"
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-16 md:pb-20 max-w-full">
          <div className="text-center max-w-2xl mx-auto reveal break-words">
            <p
              className="uppercase tracking-[0.18em] text-xs font-semibold mb-3"
              style={{ color: "var(--sage-dark)" }}
            >
              {t(tx("الجلسات الخاصة", "Private sessions"))}
            </p>
            <h1 className="text-4xl md:text-6xl leading-[1.1] mb-5">
              {t(tx("احجزي جلستك مع المدرّبة إيمان", "Book a session with Coach Iman"))}
            </h1>
            <p className="text-lg leading-relaxed text-pretty" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "اختاري نوع الجلسة المناسب لكِ، ثم اختاري اليوم والوقت من التقويم التفاعلي.",
                  "Choose the session type that fits you, then pick a day and time from the interactive calendar.",
                ),
              )}
            </p>
          </div>
        </div>
        <SectionDivider color="var(--sage-muted)" />
      </section>

      {/* Booking Calendar Section */}
      <section style={{ background: "var(--sage-muted)" }} className="w-full">
        <div className="container mx-auto px-5 md:px-8 py-16 md:py-24 reveal max-w-full">
          <BookingCalendar onConfirmed={handleConfirmed} />
        </div>
        <SectionDivider color="var(--cream)" />
      </section>

      {/* Why book */}
      <section style={{ background: "var(--cream)" }} className="w-full">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28 max-w-full">
          <div className="text-center max-w-xl mx-auto mb-12 reveal break-words">
            <h2 className="text-3xl md:text-4xl mb-3 leading-tight">
              {t(tx("لماذا تحجز معنا الأمهات؟", "Why Do Mothers Book With Us?"))}
            </h2>
            <p className="text-pretty" style={{ color: "var(--text-body)" }}>
              {t(
                tx(
                  "الركائز الأساسية التي نلتزم بها مع كل أم تشاركنا رحلتها.",
                  "The core pillars we commit to with every mother sharing her journey.",
                ),
              )}
            </p>
          </div>
          
          {/* ✨ تم التعديل لـ md:grid-cols-2 ليعطي مساحة مثالية ومريحة لقراءة الفقرات الطويلة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {FEATURES.map((f, i) => (
              <div key={f.title.ar} className="glass-card p-7 reveal break-words min-w-0 h-auto" data-reveal-delay={i * 90}>
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shrink-0"
                  style={{ background: "var(--blush-light)", color: "var(--text-dark)" }}
                >
                  <f.icon size={22} />
                </span>
                <h3 className="text-xl mb-2 break-words">{t(f.title)}</h3>
                <p className="leading-relaxed text-pretty whitespace-normal break-words" style={{ color: "var(--text-body)" }}>
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
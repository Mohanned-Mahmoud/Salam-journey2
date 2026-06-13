import { useLocation } from "wouter";
import { Calendar, Clock, User as UserIcon, Check, CalendarPlus } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { Confetti } from "@/components/confetti";
import { useAuth } from "@/hooks/use-auth";

export type BookingDetails = {
  date: string;          // YYYY-MM-DD
  slot: string;          // canonical slot key e.g. "10:00"
  slotLabel: string;     // display label e.g. "10:00 ص" / "10:00 AM"
  sessionType: Bilingual;
  bookingKind: "single" | "package";
  packageSessionsTotal: number | null;
};

type Props = {
  booking: BookingDetails | null;
  isOpen: boolean;
  onClose: () => void;
};

export function BookingConfirmModal({ booking, isOpen, onClose }: Props) {
  const { t, lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!booking) return null;

  const dateObj = new Date(`${booking.date}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj);

  // ✨ دالة توليد الرابط السحري لتقويم جوجل للعميل
  const generateGoogleCalendarLink = () => {
    const title = `${t(tx("رحلة سلام - ", "Salam Journey - "))}${t(booking.sessionType)}`;
    
    // تنظيف التاريخ والوقت (تحويل 2026-06-12 لـ 20260612)
    const cleanDate = booking.date.replace(/-/g, "");
    const cleanTime = booking.slot.replace(/:/g, "") + "00";
    
    // حساب وقت النهاية (إضافة ساعة واحدة تلقائياً للجلسة)
    const [hours, minutes] = booking.slot.split(":");
    const endHours = String(Number(hours) + 1).padStart(2, "0");
    const cleanEndTime = `${endHours}${minutes}00`;

    const datesParam = `${cleanDate}T${cleanTime}/${cleanDate}T${cleanEndTime}`;
    
    const details = `${t(tx("مرحباً بكِ في رحلة سلام.", "Welcome to Salam Journey."))} \n${t(tx("تفاصيل الموعد:", "Appointment Details:"))} ${formattedDate} - ${booking.slotLabel}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${datesParam}&details=${encodeURIComponent(details)}&sf=true&output=xml`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={460}>
      <ModalBody className="text-center relative overflow-hidden">
        <Confetti />

        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 relative"
          style={{ background: "var(--sage-dark)", color: "white" }}
        >
          <Check size={28} />
        </div>

        <h2 className="text-2xl mb-1">{t(tx("تم الحجز بنجاح!", "Booking confirmed!"))}</h2>
        <p className="mb-6" style={{ color: "var(--text-body)" }}>
          {t(
            tx(
              "سيتم التواصل معكِ على واتساب خلال ٢٤ ساعة.",
              "We'll reach out via WhatsApp within 24 hours.",
            ),
          )}
        </p>

        <div
          className="rounded-2xl p-4 mb-4 space-y-2 text-start"
          style={{ background: "var(--cream)" }}
        >
          <Row Icon={Calendar} label={formattedDate} />
          <Row Icon={Clock} label={booking.slotLabel} />
          <Row Icon={UserIcon} label={t(booking.sessionType)} />
          {booking.bookingKind === "package" && (
            <Row Icon={Check} label={t(tx("باقة ٣ جلسات", "3-session package"))} />
          )}
        </div>

{/* 📅 زرار الإضافة لتقويم جوجل */}
<div className="space-y-2 mb-6">
  <a
    href={generateGoogleCalendarLink()}
    target="_blank"
    rel="noopener noreferrer"
    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all text-sm hover:opacity-90"
    style={{ 
      background: "rgba(66, 133, 244, 0.1)", 
      color: "#1a73e8",
      border: "1px dashed rgba(66, 133, 244, 0.4)" 
    }}
  >
    <CalendarPlus size={18} />
    {t(tx("إضافة الموعد إلى تقويم جوجل الخاص بكِ", "Add to my Google Calendar"))}
  </a>
  
  {/* ⚠️ التنبيه الذكي للأمهات */}
  <p className="text-xs font-medium text-center animate-pulse" style={{ color: "#d93025" }}>
    {t(
      tx(
        "* تنبيه: يرجى الضغط على زر 'حفظ' (Save) داخل صفحة جوجل لتثبيت الموعد على موبايلك.",
        "* Note: Please click the 'Save' button inside the Google page to fix the appointment on your phone."
      )
    )}
  </p>
</div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/");
            }}
            className="pill-btn pill-btn-outline"
          >
            {t(tx("العودة للرئيسية", "Go home"))}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/account");
              }}
              className="pill-btn pill-btn-primary"
            >
              {t(tx("عرض حجوزاتي", "View bookings"))}
            </button>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

function Row({ Icon, label }: { Icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <div className="flex items-center gap-3" style={{ color: "var(--text-dark)" }}>
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "var(--white)", color: "var(--sage-dark)" }}
      >
        <Icon size={16} />
      </span>
      <span className="font-semibold">{label}</span>
    </div>
  );
}
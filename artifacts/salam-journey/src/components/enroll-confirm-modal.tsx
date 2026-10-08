import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Sparkles, Award, Infinity as InfinityIcon, PartyPopper } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx, type Bilingual } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModals } from "@/components/auth/auth-modals";
import { Confetti } from "@/components/confetti";
import { notify } from "@/lib/notify";
import { apiJson } from "@/lib/api";

export type CourseSummary = {
  id: string;
  title: Bilingual;
  price: Bilingual;
  rawPrice: number;
  free: boolean;
};

type Props = {
  course: CourseSummary | null;
  isOpen: boolean;
  onClose: () => void;
};

const PERKS = [
  { Icon: BookOpen,    label: tx("٨ وحدات تعليمية", "8 learning modules") },
  { Icon: Award,       label: tx("شهادة إتمام", "Certificate of completion") },
  { Icon: InfinityIcon, label: tx("وصول مدى الحياة", "Lifetime access") },
];

export function EnrollConfirmModal({ course, isOpen, onClose }: Props) {
  const { t } = useLanguage();
  const { user, enrollCourse } = useAuth();
  const { openAuthGate } = useAuthModals();
  const [, navigate] = useLocation();
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) setConfirmed(false);
  }, [isOpen]);

  if (!course) return null;

  const handleConfirm = async () => {
    if (!user) {
      onClose();
      openAuthGate({
        message: tx(
          "للتسجيل في هذه الدورة، يرجى تسجيل الدخول أو إنشاء حساب جديد.",
          "Please sign in or create an account to enroll in this course.",
        ),
        onSuccess: () => {
          if (course.free) {
            enrollCourse({ id: course.id, title: course.title.ar });
            notify.success(t(tx("تم التسجيل في الدورة 🌿", "Enrolled successfully 🌿")));
            navigate("/account");
          } else {
             notify.info(t(tx("تم تسجيل الدخول، يمكنك الآن المتابعة للدفع", "Signed in, you can now proceed to payment")));
          }
        },
      });
      return;
    }

    const enrolledIds = new Set(user.enrolledCourses?.map((c: any) => c.id) || []);
    if (enrolledIds.has(course.id)) {
      notify.info(t(tx("أنتِ مسجّلة بالفعل في هذه الدورة", "You're already enrolled in this course")));
      onClose();
      return;
    }

    if (course.free) {
      enrollCourse({ id: course.id, title: course.title.ar });
      setConfirmed(true);
      return;
    }

    try {
      setIsProcessing(true);

      const amount = Number(course.rawPrice);
      if (!amount || amount <= 0) {
        notify.error(t(tx("سعر الدورة غير صحيح", "Invalid course price")));
        return;
      }

      const payload = {
        items: [
          {
            name: course.title.en || course.title.ar,
            description: "Course Enrollment",
            amount,
            quantity: 1,
          }
        ],
        metadata: {
          type: "course",
          courseId: String(course.id ?? ""),
          userId: String(user.id ?? ""),
        },
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-cancel`,
      };

      console.log("[Stripe] Creating checkout session with payload:", payload);

      const data = await apiJson("/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      notify.error(`${t(tx("حدث خطأ أثناء معالجة الدفع", "Error processing payment"))}: ${err.message || ""}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={460}>
      <ModalBody className="relative overflow-hidden">
        {confirmed && <Confetti />}

        {!confirmed ? (
          <>
            <div className="text-center mb-5">
              <div
                className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
              >
                <Sparkles size={24} />
              </div>
              <p className="uppercase tracking-[0.18em] text-[11px] font-semibold mb-1" style={{ color: "var(--sage-dark)" }}>
                {t(tx("تأكيد التسجيل", "Confirm enrollment"))}
              </p>
              <h2 className="text-2xl">{t(course.title)}</h2>
            </div>

            <ul className="space-y-3 mb-6">
              {PERKS.map(({ Icon, label }) => (
                <li
                  key={label.ar}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: "var(--cream)" }}
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--white)", color: "var(--sage-dark)" }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="font-medium" style={{ color: "var(--text-dark)" }}>
                    {t(label)}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="flex items-center justify-between mb-6 px-5 py-3 rounded-2xl"
              style={{ background: "var(--blush-light)" }}
            >
              <span className="font-semibold" style={{ color: "var(--text-dark)" }}>
                {t(tx("السعر", "Price"))}
              </span>
              <span className="text-xl font-bold" style={{ color: "var(--sage-dark)" }}>
                {t(course.price)}
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button type="button" onClick={onClose} className="pill-btn pill-btn-outline flex-1">
                {t(tx("إلغاء", "Cancel"))}
              </button>
              <button type="button" onClick={handleConfirm} disabled={isProcessing} className="pill-btn pill-btn-primary flex-1">
                {isProcessing ? t(tx("جاري التحويل...", "Processing...")) : t(tx("تأكيد التسجيل", "Confirm"))}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center relative">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--sage-dark)", color: "white" }}
            >
              <PartyPopper size={28} />
            </div>
            <h2 className="text-2xl mb-2">
              🎉 {t(tx("تم التسجيل!", "You're enrolled!"))}
            </h2>
            <p className="mb-6" style={{ color: "var(--text-body)" }}>
              {t(tx("ابدئي رحلتك الآن مع الدورة.", "Start your journey with the course now."))}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
              <button type="button" onClick={onClose} className="pill-btn pill-btn-outline">
                {t(tx("إغلاق", "Close"))}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/account");
                }}
                className="pill-btn pill-btn-primary"
              >
                {t(tx("اذهبي إلى دوراتي", "Go to my courses"))}
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}

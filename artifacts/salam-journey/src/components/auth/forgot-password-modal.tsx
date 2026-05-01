import { useEffect, useState } from "react";
import { Check, MailOpen } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx } from "@/lib/i18n";
import { AuthField, TextInput } from "./auth-shared";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  switchToLogin: () => void;
};

export function ForgotPasswordModal({ isOpen, onClose, switchToLogin }: Props) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setSent(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={420}>
      <ModalBody>
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--blush-light)", color: "var(--text-dark)" }}
          >
            {sent ? <Check size={26} /> : <MailOpen size={24} />}
          </div>
          <h2 className="text-2xl">
            {sent
              ? t(tx("تم الإرسال", "Email sent"))
              : t(tx("نسيت كلمة المرور؟", "Forgot password?"))}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-body)" }}>
            {sent
              ? t(
                  tx(
                    "تحققي من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور.",
                    "Check your inbox for a link to reset your password.",
                  ),
                )
              : t(
                  tx(
                    "أدخلي بريدك الإلكتروني وسنرسل لكِ رابطاً لإعادة تعيين كلمة المرور.",
                    "Enter your email and we'll send you a reset link.",
                  ),
                )}
          </p>
        </div>

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setSent(true);
            }}
            className="space-y-4"
          >
            <AuthField label={t(tx("البريد الإلكتروني", "Email"))}>
              <TextInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </AuthField>
            <button type="submit" className="pill-btn pill-btn-primary w-full">
              {t(tx("إرسال الرابط", "Send link"))}
            </button>
          </form>
        ) : (
          <button type="button" onClick={switchToLogin} className="pill-btn pill-btn-primary w-full">
            {t(tx("العودة لتسجيل الدخول", "Back to sign in"))}
          </button>
        )}

        <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {lang === "ar" ? "" : ""}
        </p>
      </ModalBody>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { notify } from "@/lib/notify";
import { AuthBrand, AuthField, TextInput, PasswordInput } from "./auth-shared";
import { GoogleSignInButton } from "./google-sign-in-button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  switchToLogin: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterModal({ isOpen, onClose, onSuccess, switchToLogin }: Props) {
  const { t, lang } = useLanguage();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName(""); setEmail(""); setPhone(""); setPassword(""); setConfirm("");
      setErrors({});
      setShake(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = t(tx("الاسم مطلوب", "Name is required"));
    if (!EMAIL_RE.test(email.trim()))
      next.email = t(tx("بريد إلكتروني غير صحيح", "Invalid email address"));
    if (!phone.trim()) next.phone = t(tx("رقم الواتساب مطلوب", "WhatsApp number is required"));
    if (password.length < 8)
      next.password = t(tx("كلمة المرور: ٨ أحرف على الأقل", "Password must be at least 8 characters"));
    if (password !== confirm)
      next.confirm = t(tx("كلمتا المرور غير متطابقتين", "Passwords do not match"));

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    setErrors({});

    const result = await register({ name, email, phone, password });
    if (result.ok) {
      notify.success(t(tx("تم التسجيل بنجاح! 🌿", "Registered successfully! 🌿")));
      onSuccess();
      return;
    }
    const msg = t(tx("البريد الإلكتروني مستخدم بالفعل", "Email is already in use"));
    setErrors({ email: msg });
    notify.error(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={460}>
      <ModalBody>
        <AuthBrand titleAr="انضمي إلى رحلة سلام" titleEn="Join Salam Journey" lang={lang} />

        <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
          <AuthField label={t(tx("الاسم الكامل", "Full Name"))} error={errors.name}>
            <TextInput
              value={name}
              onChange={setName}
              placeholder={t(tx("اكتبي اسمك", "Your full name"))}
              autoComplete="name"
              hasError={!!errors.name}
            />
          </AuthField>

          <AuthField label={t(tx("البريد الإلكتروني", "Email"))} error={errors.email}>
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              hasError={!!errors.email}
            />
          </AuthField>

          <AuthField label={t(tx("رقم الواتساب", "WhatsApp Number"))} error={errors.phone}>
            <TextInput
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+966 ..."
              autoComplete="tel"
              hasError={!!errors.phone}
            />
          </AuthField>

          <AuthField label={t(tx("كلمة المرور", "Password"))} error={errors.password}>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder={t(tx("٨ أحرف على الأقل", "8 characters minimum"))}
              autoComplete="new-password"
              hasError={!!errors.password}
            />
          </AuthField>

          <AuthField label={t(tx("تأكيد كلمة المرور", "Confirm Password"))} error={errors.confirm}>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              autoComplete="new-password"
              hasError={!!errors.confirm}
            />
          </AuthField>

          <button type="submit" className="pill-btn pill-btn-primary w-full">
            {t(tx("إنشاء حساب", "Create account"))}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-body)" }}>
          <span className="h-px flex-1" style={{ background: "rgba(127,169,155,0.3)" }} />
          <span>{t(tx("أو", "Or"))}</span>
          <span className="h-px flex-1" style={{ background: "rgba(127,169,155,0.3)" }} />
        </div>

        <GoogleSignInButton
          label={t(tx("المتابعة باستخدام Google", "Continue with Google"))}
          onSuccess={onSuccess}
          onError={(message) => {
            setErrors({ email: message });
            notify.error(message);
          }}
        />

        <div className="mt-6 text-center text-sm" style={{ color: "var(--text-body)" }}>
          {t(tx("لديك حساب؟", "Already have an account?"))}{" "}
          <button
            type="button"
            onClick={switchToLogin}
            className="font-bold underline-slide"
            style={{ color: "var(--sage-dark)" }}
          >
            {t(tx("تسجيل الدخول", "Sign in"))}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}

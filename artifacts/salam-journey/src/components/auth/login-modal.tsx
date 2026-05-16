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
  switchToRegister: () => void;
  switchToForgot: () => void;
};

export function LoginModal({ isOpen, onClose, onSuccess, switchToRegister, switchToForgot }: Props) {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  /* Reset form whenever the modal closes. */
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setShake(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t(tx("الرجاء تعبئة جميع الحقول", "Please fill in all fields")));
      return;
    }
    const result = await login(email, password);
    if (result.ok) {
      notify.success(t(tx("مرحباً بعودتك ✨", "Welcome back ✨")));
      onSuccess();
      return;
    }
    const msg = result.error === "not_found"
      ? t(tx("لا يوجد حساب بهذا البريد", "No account with this email"))
      : t(tx("بيانات غير صحيحة", "Invalid credentials"));
    setError(msg);
    notify.error(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={440}>
      <ModalBody>
        <AuthBrand titleAr="مرحباً بعودتك" titleEn="Welcome back" lang={lang} />

        <form onSubmit={handleSubmit} className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
          <AuthField label={t(tx("البريد الإلكتروني", "Email"))}>
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              hasError={!!error}
            />
          </AuthField>

          <AuthField label={t(tx("كلمة المرور", "Password"))}>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              hasError={!!error}
            />
          </AuthField>

          {error && (
            <p className="text-sm font-semibold text-center" style={{ color: "#B5524A" }}>
              {error}
            </p>
          )}

          <button type="button" onClick={switchToForgot} className="text-sm font-semibold block mx-auto" style={{ color: "var(--sage-dark)" }}>
            {t(tx("نسيت كلمة المرور؟", "Forgot password?"))}
          </button>

          <button type="submit" className="pill-btn pill-btn-primary w-full">
            {t(tx("تسجيل الدخول", "Sign in"))}
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
            setError(message);
            notify.error(message);
          }}
        />

        <div className="mt-6 text-center text-sm" style={{ color: "var(--text-body)" }}>
          {t(tx("ليس لديك حساب؟", "Don't have an account?"))}{" "}
          <button
            type="button"
            onClick={switchToRegister}
            className="font-bold underline-slide"
            style={{ color: "var(--sage-dark)" }}
          >
            {t(tx("إنشاء حساب", "Sign up"))}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}

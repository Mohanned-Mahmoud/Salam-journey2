import { Lock } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx } from "@/lib/i18n";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  switchToLogin: () => void;
  switchToRegister: () => void;
  message?: { ar: string; en: string };
};

export function AuthGateModal({ isOpen, onClose, switchToLogin, switchToRegister, message }: Props) {
  const { t } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={420}>
      <ModalBody className="text-center">
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--sage-muted)", color: "var(--sage-dark)" }}
        >
          <Lock size={24} />
        </div>
        <h2 className="text-2xl mb-2">
          {t(tx("يجب تسجيل الدخول أولاً", "Please sign in first"))}
        </h2>
        <p className="mb-6" style={{ color: "var(--text-body)" }}>
          {t(
            message ??
              tx(
                "للوصول لهذه الميزة، يرجى تسجيل الدخول أو إنشاء حساب جديد.",
                "To access this feature, please sign in or create a new account.",
              ),
          )}
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={switchToLogin} className="pill-btn pill-btn-primary w-full">
            {t(tx("تسجيل الدخول", "Sign in"))}
          </button>
          <button type="button" onClick={switchToRegister} className="pill-btn pill-btn-outline w-full">
            {t(tx("إنشاء حساب", "Sign up"))}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {t(tx("ليس الآن", "Maybe later"))}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}

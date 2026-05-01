import { useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/modal";
import { useLanguage, tx } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { notify } from "@/lib/notify";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function LogoutConfirmModal({ isOpen, onClose }: Props) {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  const handleConfirm = () => {
    logout();
    onClose();
    notify.info(t(tx("تم تسجيل الخروج", "You've been signed out")));
    navigate("/");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth={400}>
      <ModalBody className="text-center">
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--blush-light)", color: "var(--text-dark)" }}
        >
          <LogOut size={24} />
        </div>
        <h2 className="text-2xl mb-2">{t(tx("تسجيل الخروج؟", "Sign out?"))}</h2>
        <p className="mb-6" style={{ color: "var(--text-body)" }}>
          {t(tx("هل أنتِ متأكدة من تسجيل الخروج؟", "Are you sure you want to sign out?"))}
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center">
          <button type="button" onClick={onClose} className="pill-btn pill-btn-outline">
            {t(tx("إلغاء", "Cancel"))}
          </button>
          <button type="button" onClick={handleConfirm} className="pill-btn pill-btn-primary">
            {t(tx("نعم، خروج", "Yes, sign out"))}
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}

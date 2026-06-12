import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { LoginModal } from "./login-modal";
import { RegisterModal } from "./register-modal";
import { ForgotPasswordModal } from "./forgot-password-modal";
import { LogoutConfirmModal } from "./logout-confirm-modal";
import { AuthGateModal } from "./auth-gate-modal";

type ModalKind = "none" | "login" | "register" | "forgot" | "logout" | "gate";

type State = {
  kind: ModalKind;
  /** Optional callback fired when the user successfully authenticates. */
  onSuccess?: () => void;
  /** Optional message override for the auth-gate modal. */
  gateMessage?: { ar: string; en: string };
};

type AuthModalsContextValue = {
  openLogin: (opts?: { onSuccess?: () => void }) => void;
  openRegister: (opts?: { onSuccess?: () => void }) => void;
  openForgotPassword: () => void;
  openLogout: () => void;
  openAuthGate: (opts?: { onSuccess?: () => void; message?: { ar: string; en: string } }) => void;
  close: () => void;
};

const Ctx = createContext<AuthModalsContextValue | null>(null);

const fallbackModals: AuthModalsContextValue = {
  openLogin: () => {},
  openRegister: () => {},
  openForgotPassword: () => {},
  openLogout: () => {},
  openAuthGate: () => {},
  close: () => {},
};

export function AuthModalsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "none" });

  const close = useCallback(() => setState({ kind: "none" }), []);

  const openLogin = useCallback((opts?: { onSuccess?: () => void }) => {
    setState({ kind: "login", onSuccess: opts?.onSuccess });
  }, []);
  const openRegister = useCallback((opts?: { onSuccess?: () => void }) => {
    setState({ kind: "register", onSuccess: opts?.onSuccess });
  }, []);
  const openForgotPassword = useCallback(() => setState({ kind: "forgot" }), []);
  const openLogout = useCallback(() => setState({ kind: "logout" }), []);
  const openAuthGate = useCallback(
    (opts?: { onSuccess?: () => void; message?: { ar: string; en: string } }) => {
      setState({ kind: "gate", onSuccess: opts?.onSuccess, gateMessage: opts?.message });
    },
    [],
  );

  const value = useMemo<AuthModalsContextValue>(
    () => ({ openLogin, openRegister, openForgotPassword, openLogout, openAuthGate, close }),
    [openLogin, openRegister, openForgotPassword, openLogout, openAuthGate, close],
  );

  /* When auth succeeds, fire the stored callback once and close. */
  const handleAuthSuccess = useCallback(() => {
    const cb = state.onSuccess;
    setState({ kind: "none" });
    cb?.();
  }, [state.onSuccess]);

  return (
    <Ctx.Provider value={value}>
      {children}

      <LoginModal
        isOpen={state.kind === "login"}
        onClose={close}
        onSuccess={handleAuthSuccess}
        switchToRegister={() => setState({ kind: "register", onSuccess: state.onSuccess })}
        switchToForgot={openForgotPassword}
      />
      <RegisterModal
        isOpen={state.kind === "register"}
        onClose={close}
        onSuccess={handleAuthSuccess}
        switchToLogin={() => setState({ kind: "login", onSuccess: state.onSuccess })}
      />
      <ForgotPasswordModal
        isOpen={state.kind === "forgot"}
        onClose={close}
        switchToLogin={() => setState({ kind: "login" })}
      />
      <LogoutConfirmModal isOpen={state.kind === "logout"} onClose={close} />
      <AuthGateModal
        isOpen={state.kind === "gate"}
        onClose={close}
        message={state.gateMessage}
        switchToLogin={() =>
          setState({ kind: "login", onSuccess: state.onSuccess })
        }
        switchToRegister={() =>
          setState({ kind: "register", onSuccess: state.onSuccess })
        }
      />
    </Ctx.Provider>
  );
}

export function useAuthModals() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackModals;
}

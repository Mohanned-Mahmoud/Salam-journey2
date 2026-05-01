import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max width in pixels. Default 440. */
  maxWidth?: number;
  /** When true, hide the top-right close button (e.g. critical confirmations). */
  hideClose?: boolean;
  /** When false, clicking the overlay does not close the modal. Default true. */
  closeOnOverlay?: boolean;
  /** Optional aria-label for the dialog. */
  label?: string;
};

let openModals = 0;

/**
 * Reusable portal-based modal with overlay, focus management, ESC support,
 * and body-scroll locking. Keep modal content lightweight and bilingual.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 440,
  hideClose = false,
  closeOnOverlay = true,
  label,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  /* Mount flag — needed for SSR-safe portal usage. */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Body scroll lock + ESC handler. */
  useEffect(() => {
    if (!isOpen) return;

    openModals += 1;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    previousActive.current = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);

    /* Focus the first focusable element inside the modal. */
    const t = window.setTimeout(() => {
      const firstField = containerRef.current?.querySelector<HTMLElement>(
        "input, select, textarea, button:not([data-modal-close])",
      );
      firstField?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.clearTimeout(t);
      openModals = Math.max(0, openModals - 1);
      if (openModals === 0) {
        document.body.style.overflow = prevOverflow;
      }
      previousActive.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(45, 74, 69, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={() => closeOnOverlay && onClose()}
      role="presentation"
      data-modal-overlay
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full animate-modal-in"
        style={{
          maxWidth: `${maxWidth}px`,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(127, 169, 155, 0.3)",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px rgba(90, 138, 128, 0.25)",
          maxHeight: "calc(100vh - 3rem)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            data-modal-close
            aria-label="Close"
            className="absolute top-3 end-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors z-10"
            style={{ color: "var(--text-dark)", background: "rgba(127,169,155,0.1)" }}
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Standard padded body wrapper for modal content. */
export function ModalBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-7 md:p-8 ${className}`}>{children}</div>;
}

import { toast as sonnerToast } from "sonner";

/**
 * Brand-styled toast helpers. Use these instead of importing `sonner` directly
 * so that color and tone stay consistent across the app.
 */
export const notify = {
  success(message: string) {
    sonnerToast(message, {
      style: {
        background: "var(--sage-dark)",
        color: "var(--cream)",
        border: "1px solid var(--sage)",
        borderRadius: "0.875rem",
        padding: "0.875rem 1.125rem",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      },
      duration: 4000,
    });
  },

  error(message: string) {
    sonnerToast(message, {
      style: {
        background: "#B5524A",
        color: "var(--cream)",
        border: "1px solid #9B4339",
        borderRadius: "0.875rem",
        padding: "0.875rem 1.125rem",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      },
      duration: 4000,
    });
  },

  info(message: string) {
    sonnerToast(message, {
      style: {
        background: "var(--white)",
        color: "var(--text-dark)",
        border: "1px solid var(--sage-muted)",
        borderRadius: "0.875rem",
        padding: "0.875rem 1.125rem",
        fontFamily: "var(--font-body)",
        fontWeight: 600,
      },
      duration: 4000,
    });
  },
};

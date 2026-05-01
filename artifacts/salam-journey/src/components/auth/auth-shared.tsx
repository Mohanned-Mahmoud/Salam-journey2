import { ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Logo + small wordmark used at the top of every auth modal. */
export function AuthBrand({ titleAr, titleEn, lang }: { titleAr: string; titleEn: string; lang: "ar" | "en" }) {
  return (
    <div className="text-center mb-6">
      <div
        className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
        style={{
          background: "linear-gradient(135deg, var(--sage-light), var(--sage))",
          boxShadow: "0 8px 20px rgba(90,138,128,0.25)",
        }}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
          <path d="M20 7c-7 5-10 12-7 20 8-1 13-7 13-16-2-1-4-3-6-4z" fill="white" />
          <circle cx="14" cy="22" r="2.4" fill="var(--blush)" />
        </svg>
      </div>
      <p
        className="uppercase tracking-[0.2em] text-[11px] font-semibold mb-1"
        style={{ color: "var(--sage-dark)" }}
      >
        Salam Journey
      </p>
      <h2 className="text-2xl md:text-3xl">{lang === "ar" ? titleAr : titleEn}</h2>
    </div>
  );
}

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block mb-1.5 text-sm font-semibold"
        style={{ color: "var(--text-dark)" }}
      >
        {label}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-xs font-medium" style={{ color: "#B5524A" }}>
          {error}
        </span>
      )}
    </label>
  );
}

export const authInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--white)",
  border: "1.5px solid var(--sage-muted)",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontFamily: "var(--font-body)",
  fontSize: "0.95rem",
  color: "var(--text-dark)",
  outline: "none",
  transition: "border-color 160ms, box-shadow 160ms",
};

/** Input wrapper that renders a focus ring + optional eye toggle for passwords. */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="auth-input"
        style={{
          ...authInputStyle,
          paddingInlineEnd: "2.75rem",
          borderColor: hasError ? "#B5524A" : "var(--sage-muted)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#B5524A" : "var(--sage)";
          e.currentTarget.style.boxShadow = hasError
            ? "0 0 0 3px rgba(181,82,74,0.15)"
            : "0 0 0 3px rgba(127,169,155,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? "#B5524A" : "var(--sage-muted)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute top-1/2 end-3 -translate-y-1/2 p-1 rounded-md"
        style={{ color: "var(--text-muted)" }}
        aria-label={shown ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/** Plain text input with focus ring. */
export function TextInput({
  type = "text",
  value,
  onChange,
  placeholder,
  hasError,
  autoComplete,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        ...authInputStyle,
        borderColor: hasError ? "#B5524A" : "var(--sage-muted)",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = hasError ? "#B5524A" : "var(--sage)";
        e.currentTarget.style.boxShadow = hasError
          ? "0 0 0 3px rgba(181,82,74,0.15)"
          : "0 0 0 3px rgba(127,169,155,0.15)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = hasError ? "#B5524A" : "var(--sage-muted)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

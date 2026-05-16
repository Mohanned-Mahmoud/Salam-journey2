import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type Props = {
  label: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({ label, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const { googleLogin } = useAuth();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken ?? null;
      if (!idToken) {
        onError("Google sign-in did not return an ID token");
        setLoading(false);
        return;
      }

      const res = await googleLogin(idToken);
      if (res.ok) onSuccess();
      else onError("Google sign-in failed");
    } catch (err) {
      console.error(err);
      onError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    return (
      <div className="text-xs text-center" style={{ color: "var(--text-body)" }}>
        Google sign-in is not configured.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button type="button" className="pill-btn pill-btn-outline w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Signing in..." : label}
      </button>
    </div>
  );
}
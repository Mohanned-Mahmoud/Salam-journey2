import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type Props = {
  label: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({ label, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const { firebaseLogin } = useAuth();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the Firebase ID token from the user
      const idToken = await result.user.getIdToken();
      if (!idToken) {
        onError("Google sign-in did not return an ID token");
        setLoading(false);
        return;
      }

      // Send the ID token to the backend
      const res = await firebaseLogin(idToken);
      if (res.ok) onSuccess();
      else onError(res.error);
    } catch (err) {
      console.error(err);
      if (typeof err === "object" && err && "code" in err) {
        onError(`Google sign-in failed: ${String((err as { code?: unknown }).code ?? "unknown_error")}`);
      } else {
        onError("Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button type="button" className="pill-btn pill-btn-outline w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Signing in..." : label}
      </button>
    </div>
  );
}
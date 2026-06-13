/* Prototype-only auth: the UI keeps a session id in localStorage,
 * but all account writes now go through the backend. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { ApiError, apiJson } from "@/lib/api";

const CURRENT_KEY = "salam_user";

export type Booking = {
  id: string;
  date: string;
  slot: string;
  sessionType: string;
  bookingKind: "single" | "package";
  packageSessionsTotal: number | null;
  packageSessionsRemaining: number | null;
  topic?: string;
  notes?: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  createdAt: string;
};

export type EnrolledCourse = {
  id: string;
  title: string;
  enrolledAt: string;
  progress: number;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string; // 🌟 ضفنا الـ role هنا جوه التايب الرئيسي للفرونت إند
  bookings: Booking[];
  enrolledCourses: EnrolledCourse[];
  createdAt: string;
};

export type StoredUser = PublicUser & { password: string };

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: "not_found" | "wrong_password" }>;
  googleLogin: (credential: string) => Promise<{ ok: true } | { ok: false; error: "google_unavailable" }>;
  firebaseLogin: (idToken: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<{ ok: true } | { ok: false; error: "email_taken" }>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<StoredUser, "name" | "email" | "phone" | "avatar">>) => Promise<{ ok: true } | { ok: false; error: "email_taken" }>;
  changePassword: (current: string, next: string) => Promise<{ ok: true } | { ok: false; error: "wrong_password" }>;
  enrollCourse: (course: { id: string; title: string }) => { ok: true; alreadyEnrolled: boolean };
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Promise<{ ok: true } | { ok: false; error: "save_failed" }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authFallback: AuthContextValue = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => ({ ok: false, error: "not_found" }),
  googleLogin: async () => ({ ok: false, error: "google_unavailable" }),
  firebaseLogin: async () => ({ ok: false, error: "Auth context unavailable" }),
  register: async () => ({ ok: false, error: "email_taken" }),
  logout: () => {},
  updateProfile: async () => ({ ok: true }),
  changePassword: async () => ({ ok: false, error: "wrong_password" }),
  enrollCourse: () => ({ ok: true, alreadyEnrolled: false }),
  addBooking: async () => ({ ok: false, error: "save_failed" }),
};

function readCurrentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}

function writeCurrentId(id: string | null) {
  try {
    if (id) window.localStorage.setItem(CURRENT_KEY, id);
    else window.localStorage.removeItem(CURRENT_KEY);
  } catch {
    // ignore
  }
}

type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role?: string | null; // 🌟 ضفنا الـ role هنا عشان يستقبلها من الـ API
  createdAt: string;
};

type BookingRecord = {
  id: string;
  date: string;
  slot: string | null;
  sessionType: string | null;
  bookingKind: "single" | "package";
  packageSessionsTotal: number | null;
  packageSessionsRemaining: number | null;
  topic: string | null;
  notes: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestWhatsapp: string | null;
  createdAt: string;
};

function toPublicFromApi(user: UserRecord, bookings: BookingRecord[]): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatar: null,
    role: user.role ?? "user", // 🌟 السطر السحري: هنا بنمرر الـ role للـ State ومنضيعهاش!
    bookings: bookings.map((booking) => ({
      id: booking.id,
      date: booking.date,
      slot: booking.slot ?? "",
      sessionType: booking.sessionType ?? "",
      bookingKind: booking.bookingKind,
      packageSessionsTotal: booking.packageSessionsTotal,
      packageSessionsRemaining: booking.packageSessionsRemaining,
      topic: booking.topic ?? undefined,
      notes: booking.notes ?? undefined,
      name: booking.guestName ?? undefined,
      email: booking.guestEmail ?? undefined,
      whatsapp: booking.guestWhatsapp ?? undefined,
      createdAt: booking.createdAt,
    })),
    enrolledCourses: [],
    createdAt: user.createdAt,
  };
}

async function hydrateUser(userId: string): Promise<PublicUser | null> {
  try {
    const [user, bookings] = await Promise.all([
      apiJson<UserRecord>(`/users/${userId}`),
      apiJson<BookingRecord[]>(`/bookings/user/${userId}`),
    ]);
    return toPublicFromApi(user, bookings);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const id = readCurrentId();
    if (!id) {
      setLoading(false);
      return;
    }

    void (async () => {
      const hydrated = await hydrateUser(id);
      if (hydrated) {
        setUser(hydrated);
      } else {
        writeCurrentId(null);
      }
      setLoading(false);
    })();
  }, []);

  const refreshFromApi = useCallback(async (id: string) => {
    const hydrated = await hydrateUser(id);
    setUser(hydrated);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (email, password) => {
    try {
      const response = await apiJson<{ user: UserRecord }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      writeCurrentId(response.user.id);
      const hydrated = await hydrateUser(response.user.id);
      setUser(hydrated);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) return { ok: false, error: "not_found" };
        if (error.status === 401) return { ok: false, error: "wrong_password" };
      }
      throw error;
    }
  }, []);

  const googleLogin = useCallback<AuthContextValue["googleLogin"]>(async (credential) => {
    try {
      const response = await apiJson<{ user: UserRecord }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      writeCurrentId(response.user.id);
      const hydrated = await hydrateUser(response.user.id);
      setUser(hydrated);
      return { ok: true };
    } catch {
      return { ok: false, error: "google_unavailable" };
    }
  }, []);

  const firebaseLogin = useCallback<AuthContextValue["firebaseLogin"]>(async (idToken) => {
    try {
      const response = await apiJson<{
        access_token: string;
        token_type: string;
        expires_in: number;
        user: UserRecord;
      }>("/auth/firebase", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      // Store the JWT token in localStorage for subsequent requests
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", response.access_token);
        window.localStorage.setItem("auth_token_expires", String(Date.now() + response.expires_in * 1000));
      }

      writeCurrentId(response.user.id);
      const hydrated = await hydrateUser(response.user.id);
      setUser(hydrated);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError) {
        console.error("Firebase login API error:", error.message, error.payload);
        return { ok: false, error: error.message || "Firebase sign-in failed" };
      } else {
        console.error("Firebase login error:", error);
        return { ok: false, error: "Firebase sign-in failed" };
      }
    }
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async ({ name, email, phone, password }) => {
    try {
      const created = await apiJson<UserRecord>("/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          passwordHash: password,
        }),
      });

      writeCurrentId(created.id);
      const hydrated = await hydrateUser(created.id);
      setUser(hydrated);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return { ok: false, error: "email_taken" };
      }
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    writeCurrentId(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (patch) => {
    if (!user) return { ok: true };

    try {
      await apiJson<UserRecord>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: patch.name,
          email: patch.email,
          phone: patch.phone,
        }),
      });
      await refreshFromApi(user.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        return { ok: false, error: "email_taken" };
      }
      throw error;
    }
  }, [user, refreshFromApi]);

  const changePassword = useCallback<AuthContextValue["changePassword"]>(async (current, nextPwd) => {
    if (!user) return { ok: true };

    try {
      await apiJson<{ user: UserRecord }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          currentPassword: current,
          nextPassword: nextPwd,
        }),
      });
      await refreshFromApi(user.id);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return { ok: false, error: "wrong_password" };
      }
      throw error;
    }
  }, [user, refreshFromApi]);

  const enrollCourse = useCallback<AuthContextValue["enrollCourse"]>(() => {
    return { ok: true, alreadyEnrolled: false };
  }, []);

  const addBooking = useCallback<AuthContextValue["addBooking"]>(async (booking) => {
    try {
      await apiJson<{ id: string; createdAt: string }>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id ?? null,
          bookingKind: booking.bookingKind,
          date: booking.date,
          slot: booking.slot,
          sessionType: booking.sessionType,
          packageSessionsTotal: booking.packageSessionsTotal,
          packageSessionsRemaining: booking.packageSessionsRemaining,
          topic: booking.topic ?? null,
          notes: booking.notes ?? null,
          guestName: booking.name ?? user?.name ?? null,
          guestEmail: booking.email ?? user?.email ?? null,
          guestWhatsapp: booking.whatsapp ?? user?.phone ?? null,
        }),
      });

      if (user) {
        await refreshFromApi(user.id);
      }

      return { ok: true };
    } catch {
      return { ok: false, error: "save_failed" };
    }
  }, [user, refreshFromApi]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      googleLogin,
      firebaseLogin,
      register,
      logout,
      updateProfile,
      changePassword,
      enrollCourse,
      addBooking,
    }),
    [user, isLoading, login, googleLogin, firebaseLogin, register, logout, updateProfile, changePassword, enrollCourse, addBooking],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? authFallback;
}

export function initialsOf(name: string): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "S";
}

export function firstNameOf(name: string): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}
/* Prototype-only auth: passwords are stored as plain strings in localStorage.
 * In production, never do this — hash on a real backend. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

const USERS_KEY   = "salam_users";
const CURRENT_KEY = "salam_user";

export type Booking = {
  id: string;
  date: string;     // YYYY-MM-DD
  slot: string;     // HH:mm
  sessionType: string;
  topic?: string;
  notes?: string;
  createdAt: string;
};

export type EnrolledCourse = {
  id: string;
  title: string;          // canonical (Arabic) title for storage
  enrolledAt: string;
  progress: number;       // 0..100
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;       // prototype only
  avatar: string | null;
  bookings: Booking[];
  enrolledCourses: EnrolledCourse[];
  createdAt: string;
};

export type PublicUser = Omit<StoredUser, "password">;

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: "not_found" | "wrong_password" };
  register: (input: { name: string; email: string; phone: string; password: string }) =>
    | { ok: true }
    | { ok: false; error: "email_taken" };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<StoredUser, "name" | "email" | "phone" | "avatar">>) =>
    | { ok: true }
    | { ok: false; error: "email_taken" };
  changePassword: (current: string, next: string) =>
    | { ok: true }
    | { ok: false; error: "wrong_password" };
  enrollCourse: (course: { id: string; title: string }) => { ok: true; alreadyEnrolled: boolean };
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => { ok: true };
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ──────────────────────────────────────────────────────────── */
/* Storage helpers                                              */
/* ──────────────────────────────────────────────────────────── */

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

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

function toPublic(u: StoredUser): PublicUser {
  const { password: _password, ...rest } = u;
  return rest;
}

function makeId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ──────────────────────────────────────────────────────────── */
/* Provider                                                     */
/* ──────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  /* Hydrate on mount. */
  useEffect(() => {
    const id = readCurrentId();
    if (id) {
      const found = readUsers().find((u) => u.id === id);
      if (found) setUser(toPublic(found));
    }
    setLoading(false);
  }, []);

  const refreshFromStorage = useCallback((id: string) => {
    const found = readUsers().find((u) => u.id === id);
    setUser(found ? toPublic(found) : null);
  }, []);

  const login = useCallback<AuthContextValue["login"]>((email, password) => {
    const users = readUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: "not_found" };
    if (found.password !== password) return { ok: false, error: "wrong_password" };
    writeCurrentId(found.id);
    setUser(toPublic(found));
    return { ok: true };
  }, []);

  const register = useCallback<AuthContextValue["register"]>(({ name, email, phone, password }) => {
    const users = readUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalized)) {
      return { ok: false, error: "email_taken" };
    }
    const newUser: StoredUser = {
      id: makeId(),
      name: name.trim(),
      email: normalized,
      phone: phone.trim(),
      password,
      avatar: null,
      bookings: [],
      enrolledCourses: [],
      createdAt: new Date().toISOString(),
    };
    writeUsers([...users, newUser]);
    writeCurrentId(newUser.id);
    setUser(toPublic(newUser));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    writeCurrentId(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>((patch) => {
    if (!user) return { ok: true };
    const users = readUsers();
    if (patch.email) {
      const next = patch.email.trim().toLowerCase();
      if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === next)) {
        return { ok: false, error: "email_taken" };
      }
    }
    const next = users.map((u) =>
      u.id === user.id
        ? { ...u, ...patch, email: patch.email ? patch.email.trim().toLowerCase() : u.email }
        : u,
    );
    writeUsers(next);
    refreshFromStorage(user.id);
    return { ok: true };
  }, [user, refreshFromStorage]);

  const changePassword = useCallback<AuthContextValue["changePassword"]>((current, nextPwd) => {
    if (!user) return { ok: true };
    const users = readUsers();
    const me = users.find((u) => u.id === user.id);
    if (!me || me.password !== current) return { ok: false, error: "wrong_password" };
    const updated = users.map((u) => (u.id === user.id ? { ...u, password: nextPwd } : u));
    writeUsers(updated);
    return { ok: true };
  }, [user]);

  const enrollCourse = useCallback<AuthContextValue["enrollCourse"]>((course) => {
    if (!user) return { ok: true, alreadyEnrolled: false };
    const users = readUsers();
    const me = users.find((u) => u.id === user.id);
    if (!me) return { ok: true, alreadyEnrolled: false };
    if (me.enrolledCourses.some((c) => c.id === course.id)) {
      return { ok: true, alreadyEnrolled: true };
    }
    const enrollment: EnrolledCourse = {
      id: course.id,
      title: course.title,
      enrolledAt: new Date().toISOString(),
      progress: 0,
    };
    const next = users.map((u) =>
      u.id === user.id ? { ...u, enrolledCourses: [...u.enrolledCourses, enrollment] } : u,
    );
    writeUsers(next);
    refreshFromStorage(user.id);
    return { ok: true, alreadyEnrolled: false };
  }, [user, refreshFromStorage]);

  const addBooking = useCallback<AuthContextValue["addBooking"]>((booking) => {
    if (!user) return { ok: true };
    const users = readUsers();
    const enriched: Booking = {
      ...booking,
      id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const next = users.map((u) =>
      u.id === user.id ? { ...u, bookings: [...u.bookings, enriched] } : u,
    );
    writeUsers(next);
    refreshFromStorage(user.id);
    return { ok: true };
  }, [user, refreshFromStorage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      enrollCourse,
      addBooking,
    }),
    [user, isLoading, login, register, logout, updateProfile, changePassword, enrollCourse, addBooking],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Initials for avatar placeholders. */
export function initialsOf(name: string): string {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "S";
}

/** First name, useful for greetings. */
export function firstNameOf(name: string): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
}

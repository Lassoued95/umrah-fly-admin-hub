import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getToken, clearToken } from "./api";

type AuthUser = {
  id?: number | string;
  email?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  avatar?: string;
};

type AuthCtx = {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function decodeJwt(token: string): any {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { return JSON.parse(raw); } catch { /* */ }
    }
    const t = getToken();
    return t ? decodeJwt(t) : null;
  });

  useEffect(() => {
    const onStorage = () => setTokenState(getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = (t: string, u: AuthUser) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setTokenState(t);
    setUser(u);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("user");
    setTokenState(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ token, user, setSession, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

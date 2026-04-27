import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { Role } from "@hottime/types";

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  organizationId: number;
}

export interface AuthState {
  status: "loading" | "anonymous" | "authenticated";
  token: string | null;
  user: SessionUser | null;
}

export interface AuthActions {
  login(email: string, password: string): Promise<void>;
  logout(): void;
  refreshMe(): Promise<void>;
}

export const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (auth.status === "loading") return <div style={{ padding: 24 }}>Cargando…</div>;
  if (auth.status === "anonymous") return null;
  return <>{children}</>;
}


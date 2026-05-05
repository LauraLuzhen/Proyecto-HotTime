import { createContext, useContext } from "react";

import type { MeResponse, UpdateMeDto } from "@hottime/types";

export type SessionUser = MeResponse;

export interface AuthState {
  status: "loading" | "anonymous" | "authenticated";
  token: string | null;
  user: SessionUser | null;
}

export interface AuthActions {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refreshMe(): Promise<void>;
  updateMe(data: UpdateMeDto): Promise<void>;
}

export const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


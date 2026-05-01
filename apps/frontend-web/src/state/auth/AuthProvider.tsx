import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createApi, type ApiClientError } from "../../lib/api";
import { tokenStorage } from "./storage";
import { AuthContext, type AuthState, type SessionUser } from "./AuthContext";

function toSessionUser(me: any): SessionUser {
  return {
    id: me.id,
    email: me.email,
    fullName: me.fullName,
    role: me.role,
    organizationId: me.organizationId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const api = useMemo(() => createApi(() => token), [token]);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      setStatus("anonymous");
      return;
    }

    try {
      const me = await api.user.getMe();
      setUser(toSessionUser(me));
      setStatus("authenticated");
    } catch (err) {
      const e = err as ApiClientError;
      if (e?.status === 401) {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setStatus("anonymous");
        return;
      }
      throw err;
    }
  }, [api.user, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.auth.login({ email, password });
      tokenStorage.set(result.token);
      setToken(result.token);
      await refreshMe();
    },
    [api.auth, refreshMe]
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    refreshMe().catch(() => {
      setStatus("anonymous");
    });
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      status,
      token,
      user,
      login,
      logout,
      refreshMe,
    }),
    [status, token, user, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


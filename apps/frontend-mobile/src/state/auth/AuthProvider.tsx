import { useCallback, useEffect, useMemo, useState } from "react";

import { createApi, type ApiClientError } from "../../lib/api";
import { AuthContext, type SessionUser } from "./AuthContext";
import { tokenStorage } from "./storage";

function toSessionUser(me: any): SessionUser {
  return {
    id: me.id,
    email: me.email,
    fullName: me.fullName,
    role: me.role,
    categoryId: me.categoryId,
    organizationId: me.organizationId,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<"loading" | "anonymous" | "authenticated">("loading");

  const api = useMemo(() => createApi(() => tokenStorage.get()), [token]);

  const refreshMe = useCallback(async () => {
    const currentToken = await tokenStorage.get();
    setToken(currentToken);

    if (!currentToken) {
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
        await tokenStorage.clear();
        setToken(null);
        setUser(null);
        setStatus("anonymous");
        return;
      }
      throw err;
    }
  }, [api.user]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.auth.login({ email, password });
      await tokenStorage.set(result.token);
      setToken(result.token);
      await refreshMe();
    },
    [api.auth, refreshMe]
  );

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    refreshMe().catch(() => setStatus("anonymous"));
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


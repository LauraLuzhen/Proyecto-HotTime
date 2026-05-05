import { useCallback, useEffect, useMemo, useState } from "react";

import { createApi, type ApiClientError } from "../../lib/api";
import { AuthContext, type SessionUser } from "./AuthContext";
import { tokenStorage } from "./storage";

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
      setUser(me);
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

  const updateMe = useCallback(
    async (data: Parameters<typeof api.user.updateMe>[0]) => {
      await api.user.updateMe(data);
      await refreshMe();
    },
    [api.user, refreshMe]
  );

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
      updateMe,
    }),
    [status, token, user, login, logout, refreshMe, updateMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


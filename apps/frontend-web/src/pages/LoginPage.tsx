import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiClientError } from "@hottime/api";
import { useAuth } from "../state/auth/AuthContext";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("laurarm1002@gmail.com");
  const [password, setPassword] = useState("Password1.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = useMemo(() => (location.state as any)?.from?.pathname ?? "/dashboard", [location.state]);

  if (auth.status === "authenticated") return <Navigate to={from} replace />;

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>HotTime</div>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Accede con tu cuenta para ver tu dashboard.</p>
        </div>

        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              await auth.login(email, password);
              navigate(from, { replace: true });
            } catch (err) {
              const e = err as ApiClientError;
              setError(e.message ?? "Error inesperado");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className={styles.label}>
            Email
            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className={styles.label}>
            Password
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}


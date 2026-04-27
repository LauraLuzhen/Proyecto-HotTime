import { Navigate } from "react-router-dom";

import { useAuth } from "../state/auth/AuthContext";

export function AdminOnlyPage() {
  const auth = useAuth();
  if (auth.user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Admin</h2>
      <p>Page vacía (solo ADMIN).</p>
    </div>
  );
}


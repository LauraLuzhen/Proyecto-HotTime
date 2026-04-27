import { Navigate } from "react-router-dom";

import { useAuth } from "../state/auth/AuthContext";

export function ManagerOnlyPage() {
  const auth = useAuth();
  if (auth.user?.role !== "MANAGER") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Manager</h2>
      <p>Page vacía (solo MANAGER).</p>
    </div>
  );
}


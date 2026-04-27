import { Navigate } from "react-router-dom";

import { useAuth } from "../state/auth/AuthContext";

export function EmployeeOnlyPage() {
  const auth = useAuth();
  if (auth.user?.role !== "EMPLOYEE") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Employee</h2>
      <p>Page vacía (solo EMPLOYEE).</p>
    </div>
  );
}


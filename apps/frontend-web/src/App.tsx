import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./state/auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminOnlyPage } from "./pages/AdminOnlyPage";
import { ManagerOnlyPage } from "./pages/ManagerOnlyPage";
import { EmployeeOnlyPage } from "./pages/EmployeeOnlyPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") return <div style={{ padding: 24 }}>Cargando…</div>;
  if (auth.status === "anonymous") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="admin" element={<AdminOnlyPage />} />
        <Route path="manager" element={<ManagerOnlyPage />} />
        <Route path="employee" element={<EmployeeOnlyPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


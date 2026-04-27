import { useAuth } from "../state/auth/AuthContext";

export function DashboardPage() {
  const auth = useAuth();
  const u = auth.user;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Visible para todos. Aquí se ve quién se ha logueado.
      </p>

      <div
        style={{
          border: "1px solid rgba(231,238,252,0.12)",
          borderRadius: 16,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
          maxWidth: 560,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Usuario</div>
        <div style={{ opacity: 0.9 }}>Nombre: {u?.fullName}</div>
        <div style={{ opacity: 0.9 }}>Email: {u?.email}</div>
        <div style={{ opacity: 0.9 }}>Rol: {u?.role}</div>
        <div style={{ opacity: 0.9 }}>OrganizationId: {u?.organizationId}</div>
      </div>
    </div>
  );
}


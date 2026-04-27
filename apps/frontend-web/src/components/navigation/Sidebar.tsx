import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../state/auth/AuthContext";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <div className={styles.brand}>
        <div className={styles.logo}>HT</div>
        <div>
          <div className={styles.title}>HotTime</div>
          <div className={styles.subtitle}>{auth.user?.fullName}</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink className={styles.link} to="/dashboard">
          Dashboard
        </NavLink>

        {auth.user?.role === "ADMIN" && (
          <NavLink className={styles.link} to="/admin">
            Admin (vacía)
          </NavLink>
        )}

        {auth.user?.role === "MANAGER" && (
          <NavLink className={styles.link} to="/manager">
            Manager (vacía)
          </NavLink>
        )}

        {auth.user?.role === "EMPLOYEE" && (
          <NavLink className={styles.link} to="/employee">
            Employee (vacía)
          </NavLink>
        )}
      </nav>

      <button
        className={styles.logout}
        onClick={() => {
          auth.logout();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
}


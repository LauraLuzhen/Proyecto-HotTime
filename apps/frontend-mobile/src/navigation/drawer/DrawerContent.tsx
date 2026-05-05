import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useAuth } from "../../state/auth/AuthContext";

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate("Dashboard")} />

      {auth.user?.role === "ADMIN" && (
        <DrawerItem label="Admin (vacía)" onPress={() => props.navigation.navigate("Admin")} />
      )}
      {auth.user?.role === "MANAGER" && (
        <DrawerItem label="Manager (vacía)" onPress={() => props.navigation.navigate("Manager")} />
      )}
      {auth.user?.role === "EMPLOYEE" && (
        <DrawerItem label="Employee (vacía)" onPress={() => props.navigation.navigate("Employee")} />
      )}

      <DrawerItem
        label="Logout"
        onPress={async () => {
          await auth.logout();
        }}
      />
    </DrawerContentScrollView>
  );
}


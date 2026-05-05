import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Alert } from "react-native";

import { useAuth } from "../../state/auth/AuthContext";

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate("Dashboard")} />
      <DrawerItem label="Profile" onPress={() => props.navigation.navigate("Profile")} />
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
        onPress={() => {
          Alert.alert("Cerrar sesion", "Seguro que quieres cerrar sesion?", [
            { text: "No", style: "cancel" },
            {
              text: "Si",
              style: "destructive",
              onPress: () => {
                void auth.logout();
              },
            },
          ]);
        }}
      />
    </DrawerContentScrollView>
  );
}


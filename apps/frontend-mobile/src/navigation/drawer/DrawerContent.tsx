import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

import { useAuth } from "../../state/auth/AuthContext";

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isAdminOrManager = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";
  const isAdmin = auth.user?.role === "ADMIN";

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate("Dashboard")} />
      <DrawerItem label="Mi horario" onPress={() => props.navigation.navigate("MySchedule")} />
      <DrawerItem label="Mis fichajes" onPress={() => props.navigation.navigate("MyAttendance")} />
      <DrawerItem label="Bandeja" onPress={() => props.navigation.navigate("Bandeja")} />
      <DrawerItem label="Profile" onPress={() => props.navigation.navigate("Profile")} />
      <DrawerItem label="Contacts" onPress={() => props.navigation.navigate("Contacts")} />

      {isAdminOrManager ? (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => setAdvancedOpen((prev) => !prev)}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ fontWeight: "700" }}>Gestión {advancedOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {advancedOpen ? (
            <View style={{ paddingLeft: 20 }}>
              <DrawerItem label="Plan schedule" onPress={() => props.navigation.navigate("PlanSchedules")} />
              <DrawerItem label="Plan attendance" onPress={() => props.navigation.navigate("PlanAttendance")} />
              <DrawerItem label="Send communication" onPress={() => props.navigation.navigate("Communication")} />
              {isAdmin ? (
                <DrawerItem label="Administration" onPress={() => props.navigation.navigate("Administration")} />
              ) : null}
              {isAdmin ? (
                <DrawerItem label="Organization" onPress={() => props.navigation.navigate("Organization")} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <DrawerItem
        label="Logout"
        onPress={() => {
          Alert.alert("Cerrar sesión", "Seguro que quieres cerrar sesión?", [
            { text: "No", style: "cancel" },
            {
              text: "Sí",
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

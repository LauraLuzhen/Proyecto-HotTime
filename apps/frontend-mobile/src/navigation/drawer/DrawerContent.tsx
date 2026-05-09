import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Alert, View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";

import { useAuth } from "../../state/auth/AuthContext";

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isAdminOrManager = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate("Dashboard")} />
      <DrawerItem label="Profile" onPress={() => props.navigation.navigate("Profile")} />
      <DrawerItem label="Contacts" onPress={() => props.navigation.navigate("Contacts")} />
      <DrawerItem label="Bandeja" onPress={() => props.navigation.navigate("Bandeja")} />
      <DrawerItem label="My schedule" onPress={() => props.navigation.navigate("MySchedule")} />

      {isAdminOrManager && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => setAdvancedOpen((prev) => !prev)}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <Text style={{ fontWeight: "700" }}>
              Advanced Options {advancedOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {advancedOpen && (
            <View style={{ paddingLeft: 20 }}>
              {/* visible para ADMIN */}
              {auth.user?.role === "ADMIN" && (
                <DrawerItem
                  label="Administration"
                  onPress={() => props.navigation.navigate("Administration")}
                />
              )}

              {/* visible para MANAGER */}
              {auth.user?.role === "MANAGER" && (
                <DrawerItem
                  label="Manager Panel"
                  onPress={() => props.navigation.navigate("Manager")}
                />
              )}

              {/* visible para ambos */}
              {isAdminOrManager && (
                <DrawerItem
                  label="Send communication"
                  onPress={() => props.navigation.navigate("Communication")}
                />
              )}
              {isAdminOrManager && (
                <DrawerItem
                  label="Plan Schedules"
                  onPress={() => props.navigation.navigate("PlanSchedules")}
                />
              )}
            </View>
          )}
        </View>
      )}

      {auth.user?.role === "ADMIN" && (
        <DrawerItem label="Organization" onPress={() => props.navigation.navigate("Organization")} />
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


import { useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

import { palette } from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";

type Item = {
  label: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

function DrawerButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && styles.itemPressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={active ? "#fff" : palette.accent}
      />
      <Text style={[styles.itemText, active && styles.itemTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isAdminOrManager = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";
  const isAdmin = auth.user?.role === "ADMIN";
  const activeRoute = props.state.routeNames[props.state.index];

  const mainItems: Item[] = useMemo(() => [
    { label: "Dashboard", route: "Dashboard", icon: "space-dashboard" },
    { label: "Mi horario", route: "MySchedule", icon: "calendar-month" },
    { label: "Mis fichajes", route: "MyAttendance", icon: "fact-check" },
    { label: "Bandeja", route: "Bandeja", icon: "inbox" },
    { label: "Perfil", route: "Profile", icon: "person" },
    { label: "Contactos", route: "Contacts", icon: "contacts" },
  ], []);

  const adminItems: Item[] = useMemo(() => [
    { label: "Plan schedule", route: "PlanSchedules", icon: "event-available" },
    { label: "Plan attendance", route: "PlanAttendance", icon: "how-to-reg" },
    { label: "Enviar comunicación", route: "Communication", icon: "send" },
    ...(isAdmin ? [{ label: "Administración", route: "Administration", icon: "admin-panel-settings" as const }] : []),
    ...(isAdmin ? [{ label: "Organización", route: "Organization", icon: "business" as const }] : []),
  ], [isAdmin]);

  function go(route: string) {
    props.navigation.navigate(route as never);
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.topBlock}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>H</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>HotTime</Text>
            <Text style={styles.brandSubtitle}>{auth.user?.fullName}</Text>
          </View>
        </View>

        <View style={styles.menuBlock}>
          {mainItems.map((item) => (
            <DrawerButton
              key={item.route}
              label={item.label}
              icon={item.icon}
              active={activeRoute === item.route}
              onPress={() => go(item.route)}
            />
          ))}
        </View>

        {isAdminOrManager ? (
          <View style={styles.advancedBlock}>
            <Pressable
              onPress={() => setAdvancedOpen((prev) => !prev)}
              style={({ pressed }) => [styles.advancedToggle, pressed && styles.itemPressed]}
            >
              <Text style={styles.advancedLabel}>Gestión</Text>
              <MaterialIcons
                name={advancedOpen ? "expand-less" : "expand-more"}
                size={22}
                color={palette.accent}
              />
            </Pressable>

            {advancedOpen ? (
              <View style={styles.advancedList}>
                {adminItems.map((item) => (
                  <DrawerButton
                    key={item.route}
                    label={item.label}
                    icon={item.icon}
                    active={activeRoute === item.route}
                    onPress={() => go(item.route)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
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
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 18,
  },
  topBlock: {
    gap: 14,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: palette.accentSoft,
    borderRadius: 16,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brandMarkText: {
    color: palette.accent,
    fontSize: 20,
    fontWeight: "900",
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 2,
  },
  menuBlock: {
    gap: 8,
  },
  item: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemActive: {
    backgroundColor: palette.accent,
  },
  itemPressed: {
    backgroundColor: palette.accentSoft,
  },
  itemText: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  itemTextActive: {
    color: "#fff",
  },
  advancedBlock: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 10,
  },
  advancedToggle: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  advancedLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
  advancedList: {
    gap: 8,
    paddingLeft: 0,
    paddingTop: 8,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: palette.danger,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginTop: "auto",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  logoutButtonPressed: {
    backgroundColor: "#8f1c13",
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
